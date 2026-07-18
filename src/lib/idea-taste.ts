import type {
  IdeaLabOption,
  IdeaLabScenario,
  IdeaLabTwistOption,
} from "@/components/organisms/idea-lab/types";

export const IDEA_TASTE_TRAITS = [
  "audience:personal",
  "audience:work",
  "input:lightweight",
  "input:media",
  "outcome:create",
  "outcome:decide",
  "surface:browser",
  "surface:mobile",
] as const;

export type IdeaTasteTrait = (typeof IDEA_TASTE_TRAITS)[number];

export interface IdeaTasteChoice {
  id: string;
  label: string;
  trait: IdeaTasteTrait | null;
}

export interface IdeaTasteQuestion {
  id: string;
  prompt: string;
  choices: readonly [IdeaTasteChoice, IdeaTasteChoice, IdeaTasteChoice];
}

export interface IdeaTasteAnswer {
  id: string;
  questionId: string;
  answerId: string;
  traitId: IdeaTasteTrait | null;
  createdAt: string;
}

export interface IdeaTasteProfile {
  traitScores: Partial<Record<IdeaTasteTrait, number>>;
  questionCounts: Record<string, number>;
  answerCount: number;
}

export interface TasteRecommendation {
  scenarioIndex: number;
  choiceIndexes: {
    source: number;
    payer: number;
    moment: number;
    twist: number;
  };
}

export const IDEA_TASTE_QUESTIONS = [
  {
    id: "audience",
    prompt: "누구의 하루를 더 바꾸고 싶나요?",
    choices: [
      { id: "personal", label: "나나 가까운 사람의 일상", trait: "audience:personal" },
      { id: "work", label: "일하는 사람의 반복 업무", trait: "audience:work" },
      { id: "either", label: "아직 잘 모르겠어요", trait: null },
    ],
  },
  {
    id: "input",
    prompt: "어떤 재료로 시작하는 앱이 더 끌리나요?",
    choices: [
      { id: "lightweight", label: "텍스트·링크·숫자", trait: "input:lightweight" },
      { id: "media", label: "사진·영상·음성", trait: "input:media" },
      { id: "either", label: "재료는 상관없어요", trait: null },
    ],
  },
  {
    id: "outcome",
    prompt: "어떤 결과가 남으면 더 뿌듯할까요?",
    choices: [
      { id: "create", label: "바로 쓰거나 공유할 결과물", trait: "outcome:create" },
      { id: "decide", label: "다음 행동을 정해주는 판단", trait: "outcome:decide" },
      { id: "either", label: "둘 다 좋아요", trait: null },
    ],
  },
  {
    id: "surface",
    prompt: "어디에서 쓰는 제품이 더 끌리나요?",
    choices: [
      { id: "browser", label: "브라우저에서 가볍게", trait: "surface:browser" },
      { id: "mobile", label: "모바일·확장 기능으로", trait: "surface:mobile" },
      { id: "either", label: "형식은 상관없어요", trait: null },
    ],
  },
] as const satisfies readonly IdeaTasteQuestion[];

export const EMPTY_IDEA_TASTE_PROFILE: IdeaTasteProfile = {
  traitScores: {},
  questionCounts: {},
  answerCount: 0,
};

const questionFor = (questionId: string) =>
  IDEA_TASTE_QUESTIONS.find((question) => question.id === questionId);

const choiceFor = (question: IdeaTasteQuestion, answerId: string) =>
  question.choices.find((choice) => choice.id === answerId);

export function makeIdeaTasteAnswer(
  questionId: string,
  answerId: string,
  {
    id = crypto.randomUUID(),
    createdAt = new Date().toISOString(),
  }: { id?: string; createdAt?: string } = {},
): IdeaTasteAnswer | null {
  const question = questionFor(questionId);
  if (!question) return null;
  const choice = choiceFor(question, answerId);
  if (!choice) return null;
  return {
    id,
    questionId,
    answerId,
    traitId: choice.trait,
    createdAt,
  };
}

export function recordIdeaTasteAnswer(
  profile: IdeaTasteProfile,
  questionId: string,
  answerId: string,
): IdeaTasteProfile {
  const question = questionFor(questionId);
  const choice = question ? choiceFor(question, answerId) : null;
  if (!question || !choice) return profile;
  const traitScores = { ...profile.traitScores };
  if (choice.trait) traitScores[choice.trait] = (traitScores[choice.trait] ?? 0) + 1;
  return {
    traitScores,
    questionCounts: {
      ...profile.questionCounts,
      [question.id]: (profile.questionCounts[question.id] ?? 0) + 1,
    },
    answerCount: profile.answerCount + 1,
  };
}

export function ideaTasteProfileFromAnswers(
  answers: readonly Pick<IdeaTasteAnswer, "questionId" | "answerId">[],
): IdeaTasteProfile {
  return answers.reduce(
    (profile, answer) => recordIdeaTasteAnswer(profile, answer.questionId, answer.answerId),
    EMPTY_IDEA_TASTE_PROFILE,
  );
}

/**
 * 매번 정확히 한 문항만 보여주되, 가장 적게 물은 축을 우선해 네 문항을 순환한다.
 * 동률일 때는 누적 답변 수에서 이어지는 축부터 골라 첫 문항 고착을 피한다.
 */
export function nextIdeaTasteQuestion(profile: IdeaTasteProfile): IdeaTasteQuestion {
  const leastAsked = Math.min(
    ...IDEA_TASTE_QUESTIONS.map((question) => profile.questionCounts[question.id] ?? 0),
  );
  const start = profile.answerCount % IDEA_TASTE_QUESTIONS.length;
  for (let offset = 0; offset < IDEA_TASTE_QUESTIONS.length; offset += 1) {
    const question = IDEA_TASTE_QUESTIONS[(start + offset) % IDEA_TASTE_QUESTIONS.length];
    if ((profile.questionCounts[question.id] ?? 0) === leastAsked) return question;
  }
  return IDEA_TASTE_QUESTIONS[0];
}

const PERSONAL_RE =
  /개인|일상|가족|부모|친구|커플|학생|학습자|여행|취미|운동|반려|팬|독자|시청자|참가자|모임|직장인|소비자|환자|보호자/u;
const WORK_RE =
  /업무|담당자|운영자|개발자|기획자|마케터|영업|관리자|사업자|브랜드|팀|직원|교사|강사|상담|셀러|에이전시|고객|제작자/u;
const MEDIA_RE = /사진|이미지|영상|음성|오디오|녹음|카메라|숏폼|MP4/u;
const LIGHTWEIGHT_RE = /텍스트|글|문장|링크|URL|숫자|데이터|CSV|문서|PDF|이메일|메시지|코드|폼/u;
const CREATE_RE = /만들|생성|작성|변환|초안|콘텐츠|카드|문서|영상|이미지|페이지|리포트|내보내/u;
const DECIDE_RE = /판단|확인|분석|검증|비교|감지|찾|정리|추천|알림|점검|분류|순위/u;

function traitsFromText(text: string, platform?: IdeaLabTwistOption["platform"]) {
  const traits = new Set<IdeaTasteTrait>();
  if (PERSONAL_RE.test(text)) traits.add("audience:personal");
  if (WORK_RE.test(text)) traits.add("audience:work");
  if (LIGHTWEIGHT_RE.test(text)) traits.add("input:lightweight");
  if (MEDIA_RE.test(text)) traits.add("input:media");
  if (CREATE_RE.test(text)) traits.add("outcome:create");
  if (DECIDE_RE.test(text)) traits.add("outcome:decide");
  if (platform === "web") traits.add("surface:browser");
  if (platform === "app" || platform === "plugin") traits.add("surface:mobile");
  return traits;
}

export function scenarioIdeaTasteTraits(scenario: IdeaLabScenario): Set<IdeaTasteTrait> {
  const text = [
    scenario.source.value,
    scenario.source.detail,
    scenario.source.preservedFlow,
    ...scenario.payers.flatMap((option) => [option.value, option.detail]),
    ...scenario.moments.flatMap((option) => [option.value, option.detail]),
    ...scenario.twists.flatMap((option) => [
      option.value,
      option.detail,
      option.resultTitle,
      option.smallestBuild,
    ]),
  ].join(" ");
  const traits = traitsFromText(text, scenario.source.platform);
  for (const twist of scenario.twists) {
    for (const trait of traitsFromText(`${twist.value} ${twist.smallestBuild}`, twist.platform)) {
      traits.add(trait);
    }
  }
  return traits;
}

export function scoreScenarioForTaste(
  scenario: IdeaLabScenario,
  profile: IdeaTasteProfile,
): number {
  const traits = scenarioIdeaTasteTraits(scenario);
  return IDEA_TASTE_TRAITS.reduce(
    (score, trait) => score + (traits.has(trait) ? profile.traitScores[trait] ?? 0 : 0),
    0,
  );
}

function scoreOptionForTaste(
  option: IdeaLabOption | IdeaLabTwistOption,
  profile: IdeaTasteProfile,
): number {
  const twist = "platform" in option ? option : null;
  const text = [
    option.value,
    option.detail,
    twist?.resultTitle ?? "",
    twist?.smallestBuild ?? "",
  ].join(" ");
  const traits = traitsFromText(text, twist?.platform);
  return IDEA_TASTE_TRAITS.reduce(
    (score, trait) => score + (traits.has(trait) ? profile.traitScores[trait] ?? 0 : 0),
    0,
  );
}

function normalizedRandom(value: number) {
  return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : 0;
}

function pickHighestIndex<T>(
  options: readonly T[],
  score: (option: T) => number,
  randomValue: number,
) {
  const scored = options.map((option, index) => ({ index, score: score(option) }));
  const highest = Math.max(...scored.map((entry) => entry.score));
  const tied = scored.filter((entry) => entry.score === highest);
  return tied[Math.floor(normalizedRandom(randomValue) * tied.length)]?.index ?? 0;
}

/**
 * 한 문항의 답을 누적 프로필에 반영한 뒤, 아직 보지 않은 원본 중 취향 점수가
 * 가장 높은 묶음에서 하나를 고른다. 동점은 randomValue로 풀어 카탈로그 0번 편향을 없앤다.
 */
export function recommendIdeaForTaste(
  scenarios: readonly IdeaLabScenario[],
  profile: IdeaTasteProfile,
  seenScenarioIds: Iterable<string>,
  currentIndex: number,
  randomValue = Math.random(),
): TasteRecommendation {
  const seen = new Set(seenScenarioIds);
  let candidates = scenarios
    .map((scenario, index) => ({ scenario, index }))
    .filter(({ scenario }) => !seen.has(scenario.id));
  if (candidates.length === 0) {
    candidates = scenarios
      .map((scenario, index) => ({ scenario, index }))
      .filter(({ index }) => index !== currentIndex);
  }
  if (candidates.length === 0) candidates = [{ scenario: scenarios[0], index: 0 }];

  const scored = candidates.map((candidate) => ({
    ...candidate,
    score: scoreScenarioForTaste(candidate.scenario, profile),
  }));
  const highest = Math.max(...scored.map((entry) => entry.score));
  const top = scored.filter((entry) => entry.score === highest);
  const random = normalizedRandom(randomValue);
  const selected = top[Math.floor(random * top.length)] ?? top[0];
  const scenario = selected.scenario;

  return {
    scenarioIndex: selected.index,
    choiceIndexes: {
      source: 0,
      payer: pickHighestIndex(scenario.payers, (option) => scoreOptionForTaste(option, profile), (random + 0.31) % 1),
      moment: pickHighestIndex(scenario.moments, (option) => scoreOptionForTaste(option, profile), (random + 0.57) % 1),
      twist: pickHighestIndex(scenario.twists, (option) => scoreOptionForTaste(option, profile), (random + 0.83) % 1),
    },
  };
}
