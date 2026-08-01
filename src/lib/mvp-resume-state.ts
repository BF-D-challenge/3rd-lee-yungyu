import type {
  StoryChatMessage,
  StoryChatSession,
  StoryCardId,
} from "./story-card-contract";

export type MvpAppId = "matpick" | "onebite" | "today" | "story-cards";

export type MvpResumeState = {
  appId: MvpAppId;
  kind: "resume" | "empty";
  summary: string;
  resumeHref: string;
  newHref: string;
};

export type SavedStoryConversation = {
  session: StoryChatSession;
  messages: StoryChatMessage[];
  savedAt: string;
};

export const MVP_LAST_APP_KEY = "mvp-hub:last-app:v2";
export const STORY_CONVERSATION_KEY = "story-cards:conversation:v1";

const pathToApp: Record<string, MvpAppId> = {
  "/matpick": "matpick",
  "/matpick/map": "matpick",
  "/matpick/start": "matpick",
  "/tastepin": "matpick",
  "/tastepin/map": "matpick",
  "/onebite": "onebite",
  "/today": "today",
  "/today-a": "today",
  "/today-b": "today",
  "/story-cards": "story-cards",
};

const safeArrayLength = (key: string): number => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const hasJsonValue = (key: string): boolean => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as unknown;
    return parsed !== null && typeof parsed === "object";
  } catch {
    return false;
  }
};

const isStoryCardId = (value: unknown): value is StoryCardId => (
  value === "rain-station"
  || value === "glass-greenhouse"
  || value === "moon-shop"
  || value === "wave-archive"
);

const isStoryMessage = (value: unknown): value is StoryChatMessage => {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<StoryChatMessage>;
  return (
    typeof message.id === "string"
    && (message.role === "guide" || message.role === "user")
    && typeof message.text === "string"
  );
};

export function canonicalMvpAppId(path: string | null): MvpAppId | null {
  return path ? pathToApp[path] ?? null : null;
}

export function loadLastMvpApp(): MvpAppId | null {
  if (typeof window === "undefined") return null;
  return canonicalMvpAppId(
    localStorage.getItem(MVP_LAST_APP_KEY)
    ?? localStorage.getItem("mvp-hub:last-app:v1"),
  ) ?? (
    localStorage.getItem(MVP_LAST_APP_KEY) as MvpAppId | null
  );
}

export function saveLastMvpApp(appId: MvpAppId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MVP_LAST_APP_KEY, appId);
}

export function loadStoryConversation(): SavedStoryConversation | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORY_CONVERSATION_KEY) ?? "null",
    ) as Partial<SavedStoryConversation> | null;
    if (
      !parsed
      || typeof parsed.savedAt !== "string"
      || !parsed.session
      || parsed.session.mode !== "mock"
      || typeof parsed.session.sessionId !== "string"
      || !isStoryCardId(parsed.session.situation?.id)
      || !Array.isArray(parsed.messages)
      || !parsed.messages.every(isStoryMessage)
    ) return null;
    return parsed as SavedStoryConversation;
  } catch {
    return null;
  }
}

export function saveStoryConversation(
  session: StoryChatSession,
  messages: StoryChatMessage[],
): void {
  if (typeof window === "undefined") return;
  const saved: SavedStoryConversation = {
    session,
    messages,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORY_CONVERSATION_KEY, JSON.stringify(saved));
}

export function clearStoryConversation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORY_CONVERSATION_KEY);
}

export function getMvpResumeState(appId: MvpAppId): MvpResumeState {
  if (typeof window === "undefined") {
    return {
      appId,
      kind: "empty",
      summary: "저장된 결과가 없어요.",
      resumeHref: `/${appId}`,
      newHref: `/${appId}`,
    };
  }

  if (appId === "matpick") {
    const savedCount = new Set([
      ...readStringArray("matpick:saved-place-ids:v1"),
      ...readObjectIds("matpick:dm-saves:v1"),
      ...readObjectIds("oneul:tastepin-saves:v1"),
    ]).size;
    return savedCount > 0 ? {
      appId,
      kind: "resume",
      summary: `저장한 맛집 ${savedCount}곳이 있어요.`,
      resumeHref: "/matpick?saved=1",
      newHref: "/matpick",
    } : {
      appId,
      kind: "empty",
      summary: "저장한 맛집이 아직 없어요.",
      resumeHref: "/matpick",
      newHref: "/matpick",
    };
  }

  if (appId === "onebite") {
    const hasCommit = hasJsonValue("onebite:next-meal-commit:v1");
    const historyCount = safeArrayLength("onebite:action-history:v1");
    return hasCommit ? {
      appId,
      kind: "resume",
      summary: historyCount > 0
        ? `지난 행동과 실행 기록 ${historyCount}개가 있어요.`
        : "지난번에 정한 다음 끼니 행동이 있어요.",
      resumeHref: "/onebite",
      newHref: "/onebite?new=1",
    } : {
      appId,
      kind: "empty",
      summary: "저장한 다음 끼니 행동이 없어요.",
      resumeHref: "/onebite",
      newHref: "/onebite",
    };
  }

  if (appId === "today") {
    const hasJob = hasJsonValue("today:application-locator:v2");
    const hasDraft = hasJsonValue("today:idea-draft:v1");
    return hasJob || hasDraft ? {
      appId,
      kind: "resume",
      summary: hasJob ? "진행 중인 24시간 제작 신청이 있어요." : "저장한 아이디어 개선안이 있어요.",
      resumeHref: "/today",
      newHref: "/today?new=1",
    } : {
      appId,
      kind: "empty",
      summary: "저장한 아이디어나 신청 결과가 없어요.",
      resumeHref: "/today",
      newHref: "/today",
    };
  }

  const conversation = loadStoryConversation();
  const userMessages = conversation?.messages.filter((message) => message.role === "user").length ?? 0;
  return conversation ? {
    appId,
    kind: "resume",
    summary: userMessages > 0
      ? `${conversation.session.situation.title} 대화 ${userMessages}개가 남아 있어요.`
      : `${conversation.session.situation.title}에서 대화를 시작했어요.`,
    resumeHref: "/story-cards?resume=1",
    newHref: "/story-cards?new=1",
  } : {
    appId,
    kind: "empty",
    summary: "저장한 상황 카드 대화가 없어요.",
    resumeHref: "/story-cards",
    newHref: "/story-cards",
  };
}

function readStringArray(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function readObjectIds(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.flatMap((value) => (
        value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string"
          ? [(value as { id: string }).id]
          : []
      ))
      : [];
  } catch {
    return [];
  }
}
