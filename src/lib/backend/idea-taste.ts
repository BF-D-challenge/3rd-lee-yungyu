import {
  IDEA_TASTE_QUESTIONS,
  type IdeaTasteAnswer,
  type IdeaTasteTrait,
} from "@/lib/idea-taste";
import { getUser } from "./auth";
import { getSupabase } from "./client";

const LOCAL_TASTE_ANSWERS_KEY = "oneul:idea-taste-answers:v2";
const MAX_LOCAL_ANSWERS = 200;

interface LocalIdeaTasteAnswer extends IdeaTasteAnswer {
  ownerId: string | null;
  synced: boolean;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const knownQuestion = (questionId: string) =>
  IDEA_TASTE_QUESTIONS.find((question) => question.id === questionId);

function normalizeAnswer(value: unknown): LocalIdeaTasteAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Partial<LocalIdeaTasteAnswer>;
  if (
    typeof row.id !== "string"
    || !UUID_RE.test(row.id)
    || typeof row.questionId !== "string"
    || typeof row.answerId !== "string"
    || typeof row.createdAt !== "string"
  ) return null;
  const question = knownQuestion(row.questionId);
  if (!question || Number.isNaN(Date.parse(row.createdAt))) return null;
  const choice = question.choices.find((candidate) => candidate.id === row.answerId);
  if (!choice) return null;
  return {
    id: row.id,
    questionId: question.id,
    answerId: choice.id,
    traitId: choice.trait,
    createdAt: row.createdAt,
    ownerId: typeof row.ownerId === "string" ? row.ownerId : null,
    synced: row.synced === true,
  };
}

function readLocalAnswers(): LocalIdeaTasteAnswer[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_TASTE_ANSWERS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeAnswer)
      .filter((answer): answer is LocalIdeaTasteAnswer => Boolean(answer))
      .slice(-MAX_LOCAL_ANSWERS);
  } catch {
    return [];
  }
}

function writeLocalAnswers(answers: readonly LocalIdeaTasteAnswer[]) {
  try {
    localStorage.setItem(
      LOCAL_TASTE_ANSWERS_KEY,
      JSON.stringify(answers.slice(-MAX_LOCAL_ANSWERS)),
    );
  } catch {
    // 저장소가 막혀도 현재 화면의 추천은 계속 동작한다.
  }
}

function publicAnswer(answer: LocalIdeaTasteAnswer): IdeaTasteAnswer {
  return {
    id: answer.id,
    questionId: answer.questionId,
    answerId: answer.answerId,
    traitId: answer.traitId,
    createdAt: answer.createdAt,
  };
}

async function syncAnswers(
  answers: readonly LocalIdeaTasteAnswer[],
  userId: string,
): Promise<boolean> {
  if (answers.length === 0) return true;
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("idea_taste_answers").upsert(
      answers.map((answer) => ({
        id: answer.id,
        user_id: userId,
        question_id: answer.questionId,
        answer_id: answer.answerId,
        trait_id: answer.traitId,
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * 비로그인은 이 기기의 익명 답변만, 로그인 사용자는 본인 DB 답변과 아직
 * 소유자가 없는 기기 답변을 합쳐 읽는다. 다른 계정의 로컬 답변은 섞지 않는다.
 */
export async function loadRememberedIdeaTasteAnswers(): Promise<IdeaTasteAnswer[]> {
  const local = readLocalAnswers();
  const user = await getUser();
  if (!user) return local.filter((answer) => answer.ownerId === null).map(publicAnswer);

  const claimed = local.map((answer) =>
    answer.ownerId === null ? { ...answer, ownerId: user.id, synced: false } : answer);
  const mine = claimed.filter((answer) => answer.ownerId === user.id);
  const pending = mine.filter((answer) => !answer.synced);
  const synced = await syncAnswers(pending, user.id);
  const afterSync = claimed.map((answer) =>
    answer.ownerId === user.id && synced ? { ...answer, synced: true } : answer);

  const supabase = getSupabase();
  if (!supabase) {
    writeLocalAnswers(afterSync);
    return mine.map(publicAnswer);
  }

  try {
    const { data, error } = await supabase
      .from("idea_taste_answers")
      .select("id,question_id,answer_id,trait_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_LOCAL_ANSWERS);
    if (error || !data) {
      writeLocalAnswers(afterSync);
      return mine.map(publicAnswer);
    }

    const remote = data
      .map((row) => normalizeAnswer({
        id: row.id,
        questionId: row.question_id,
        answerId: row.answer_id,
        traitId: row.trait_id as IdeaTasteTrait | null,
        createdAt: row.created_at,
        ownerId: user.id,
        synced: true,
      }))
      .filter((answer): answer is LocalIdeaTasteAnswer => Boolean(answer));
    const mergedMine = new Map<string, LocalIdeaTasteAnswer>();
    for (const answer of [...mine, ...remote]) mergedMine.set(answer.id, answer);
    const otherOwners = afterSync.filter((answer) => answer.ownerId !== user.id);
    const merged = [...otherOwners, ...mergedMine.values()]
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .slice(-MAX_LOCAL_ANSWERS);
    writeLocalAnswers(merged);
    return [...mergedMine.values()]
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(publicAnswer);
  } catch {
    writeLocalAnswers(afterSync);
    return mine.map(publicAnswer);
  }
}

/** 답변을 먼저 로컬에 남기고, 실제 로그인 세션이 있으면 같은 이벤트 ID로 DB에 기록한다. */
export async function rememberIdeaTasteAnswer(answer: IdeaTasteAnswer): Promise<"database" | "local"> {
  const normalized = normalizeAnswer({ ...answer, ownerId: null, synced: false });
  if (!normalized) return "local";
  const user = await getUser();
  const next = { ...normalized, ownerId: user?.id ?? null };
  const local = readLocalAnswers().filter((candidate) => candidate.id !== next.id);
  writeLocalAnswers([...local, next]);
  if (!user) return "local";

  const synced = await syncAnswers([next], user.id);
  if (!synced) return "local";
  writeLocalAnswers([
    ...local,
    { ...next, synced: true },
  ]);
  return "database";
}
