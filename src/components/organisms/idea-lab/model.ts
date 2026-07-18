import { josa } from "@/lib/josa";
import {
  normalizeIdeaBuild,
  normalizeIdeaDifference,
  normalizeIdeaFlow,
  normalizeIdeaMoment,
  normalizeIdeaSource,
  normalizeIdeaTarget,
} from "@/lib/idea-copy";
import {
  CHANGE_KIND_LABELS,
  KOREA_POPULAR_IDEA_LAB_SCENARIOS as IDEA_LAB_SCENARIOS,
  PLATFORM_LABELS,
} from "./sample-data";
import {
  type IdeaLabAxisId,
  type IdeaLabOption,
  type IdeaLabSelection,
  type IdeaLabSourceOption,
  type IdeaLabTwistOption,
} from "./types";
import { authoredHeroCopyForSource } from "./authored-hero-copy";
import { productIdentityForSource } from "./product-identities";

export type ChoiceIndexes = Record<IdeaLabAxisId, number>;

export const IDEA_LAB_SEEN_SCENARIOS_KEY = "oneul:idea-lab-seen-scenarios:v1";

/**
 * Claude 세션의 고품질 결과에서 반복된 생성 원리다. 카드 하나를 더 만드는
 * 별도 덱이 아니라, 모든 조합을 이 순서로 조립하도록 결과 문구에 주입한다.
 */
export const IDEA_LAB_ROOT_PRINCIPLE = [
  "실제 사용·결제 근거가 있는 원본에서 시작한다.",
  "이미 반복 행동 중인 돈 낼 사람과 문제가 터지는 구체적 순간을 붙인다.",
  "원본의 입력 → 처리 → 결과 엔진은 80~99% 보존하고 한 끗 하나만 바꾼다.",
  "장면 훅, 지금까지·이제부터 대조, 유일 주장 하나, 실체적 결과를 쓴다.",
  "결과가 저장·재사용·공유될지와 결제 이유는 검증 전 가설로 정직하게 표시한다.",
  "오늘 만들 범위는 입력 1개 → 처리 1회 → 결과 1개로 줄인다.",
] as const;

/** 아직 보지 않은 검수 원본을 우선하고, 모두 봤으면 방금 본 원본만 제외해 새 순환을 시작한다. */
export function nextScenarioIndex(
  seenScenarioIds: Iterable<string>,
  currentIndex: number,
  randomValue = Math.random(),
) {
  const seen = new Set(seenScenarioIds);
  let candidates = IDEA_LAB_SCENARIOS
    .map((scenario, index) => ({ id: scenario.id, index }))
    .filter((candidate) => !seen.has(candidate.id));

  if (candidates.length === 0) {
    candidates = IDEA_LAB_SCENARIOS
      .map((scenario, index) => ({ id: scenario.id, index }))
      .filter((candidate) => candidate.index !== currentIndex);
  }
  if (candidates.length === 0) return 0;

  const normalizedRandom = Number.isFinite(randomValue)
    ? Math.min(0.999999, Math.max(0, randomValue))
    : 0;
  return candidates[Math.floor(normalizedRandom * candidates.length)].index;
}

export const optionFor = (
  axis: IdeaLabAxisId,
  scenarioIndex: number,
  choiceIndexes: ChoiceIndexes,
): IdeaLabSourceOption | IdeaLabOption | IdeaLabTwistOption => {
  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];
  if (axis === "source") return scenario.source;
  if (axis === "payer") return scenario.payers[choiceIndexes.payer % scenario.payers.length];
  if (axis === "moment") return scenario.moments[choiceIndexes.moment % scenario.moments.length];
  return scenario.twists[choiceIndexes.twist % scenario.twists.length];
};

/** 선택된 문구에 따라 외부 연동을 붙여넣기·짧은 샘플·수동 새로고침으로 축소한다. */
function buildMvpGuardrails(selection: IdeaLabSelection) {
  const context = [
    selection.source.value,
    selection.source.preservedFlow,
    selection.twist.value,
    selection.twist.smallestBuild,
  ].join(" ");
  const rules = [
    "1명이 바이브 코딩으로 반나절~2일 안에 배포 가능한 웹 MVP여야 한다.",
    "핵심 경로는 입력 1개 → 처리 1회 → 결과 1개, 화면은 1~3개로 제한한다.",
    "로그인·결제·관리자·팀 권한·앱스토어 배포·자체 AI 모델 학습은 만들지 않는다.",
  ];

  if (/(인스타그램|링크드인|Reddit|Amazon|Shopify|소셜|커뮤니티|채널별)/i.test(context)) {
    rules.push(
      "외부 플랫폼 OAuth·자동 게시·대규모 크롤링 대신 사용자가 URL·텍스트·CSV를 직접 붙여넣게 한다.",
    );
  }
  if (/(알림|매일|매주|지켜보다|새로고침|모니터링|자동으로 보내|자동 발행)/.test(context)) {
    rules.push(
      "백그라운드 감시·푸시 인프라 대신 사용자가 누르는 ‘지금 확인’ 1회 실행과 화면 결과로 검증한다.",
    );
  }
  if (/(영상|음성|카메라|사진|3D|더빙|실시간)/.test(context)) {
    rules.push(
      "미디어 처리는 30초 또는 파일 1개로 제한하고 브라우저 기본 기능이나 관리형 API 1개만 사용한다.",
    );
  }
  if (selection.twist.platform === "app") {
    rules.push("네이티브 앱 대신 모바일 브라우저에서 동작하는 반응형 웹/PWA로 만든다.");
  }
  if (selection.twist.platform === "plugin") {
    rules.push("확장 프로그램은 현재 탭 읽기와 사이드패널 1개만 만들고 계정 자동조작은 하지 않는다.");
  }
  return rules;
}

/** 한 끗의 작동 방식이 빠지지 않는 조합별 유일 주장. */
export function buildUniqueClaim(selection: IdeaLabSelection) {
  const platform = PLATFORM_LABELS[selection.twist.platform];
  return `“${selection.moment.value}”에 ${selection.payer.value}에게 ${selection.twist.value}만 적용해 ‘${selection.twist.resultTitle}’ 결과를 주는 ${platform}`;
}

export function buildReuseHypothesis(selection: IdeaLabSelection) {
  return `‘${selection.twist.resultTitle}’ 결과를 저장해 다음 “${selection.moment.value}”에 다시 열거나 다른 사람에게 보여줄 이유가 있는지는 검증이 필요해요.`;
}

export function buildPaymentHypothesis(selection: IdeaLabSelection) {
  return `${josa(selection.payer.value, "이/가")} “${selection.moment.value}”마다 ${selection.twist.resultTitle} 결과를 얻기 위해 지불할지는 검증이 필요해요. 가격과 전환율은 근거가 생기기 전까지 제시하지 않아요.`;
}

export interface IdeaLabQualityAudit {
  ok: boolean;
  issues: string[];
}

/**
 * 내부 생성 원리를 사용자 문구로 노출하지 않고 런타임 하드 게이트로 적용한다.
 * 네 카드가 구체적인 원본·사람·순간·한 끗·최소 결과를 모두 가져야만 산출한다.
 */
export function auditIdeaSelection(selection: IdeaLabSelection): IdeaLabQualityAudit {
  const issues: string[] = [];
  const flowSteps = normalizeIdeaFlow(selection.source.preservedFlow);
  const uniqueClaim = buildUniqueClaim(selection);

  if (!selection.source.sourceName.trim() || !selection.source.evidence.trim()) {
    issues.push("원본과 검증 근거가 필요합니다.");
  }
  if (flowSteps.length < 3 || flowSteps.some((step) => !step.trim())) {
    issues.push("원본의 입력 → 처리 → 결과 흐름이 필요합니다.");
  }
  if (!selection.payer.value.trim() || !selection.payer.detail.trim()) {
    issues.push("이미 행동 중인 돈 낼 사람이 필요합니다.");
  }
  if (!selection.moment.value.trim() || !selection.moment.detail.trim()) {
    issues.push("문제가 터지는 구체적인 순간이 필요합니다.");
  }
  if (
    !selection.twist.value.trim()
    || !selection.twist.detail.trim()
    || !selection.twist.resultTitle.trim()
    || !selection.twist.smallestBuild.trim()
  ) {
    issues.push("한 끗 변화와 오늘 만들 최소 결과가 필요합니다.");
  }
  if (
    !uniqueClaim.includes(selection.twist.value)
    || !uniqueClaim.includes(selection.twist.resultTitle)
  ) {
    issues.push("유일 주장에 한 끗 메커니즘과 결과가 함께 보여야 합니다.");
  }

  return { ok: issues.length === 0, issues };
}

function assertAuditedSelection(selection: IdeaLabSelection) {
  const audit = auditIdeaSelection(selection);
  if (!audit.ok) throw new Error(`Idea Lab 품질 게이트 실패: ${audit.issues.join(" ")}`);
}

/** 이미지 생성 AI에 바로 붙여 넣는 독립 산출물. */
export function buildImagePrompt(selection: IdeaLabSelection) {
  const platform = PLATFORM_LABELS[selection.twist.platform];
  const flowSteps = normalizeIdeaFlow(selection.source.preservedFlow);
  const smallestBuild = normalizeIdeaBuild(selection.twist.smallestBuild, platform);
  assertAuditedSelection(selection);

  return `A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal flat icons, clean flat UI; one single accent color used only on buttons and chips. ATMOSPHERE RULE: screens 2-4 stay strictly clean flat UI; screens 1 and 5 are hero moments and may be slightly conceptual with a soft glow bleeding beyond the card edge, but UI text stays crisp. PRODUCT: "${selection.twist.resultTitle}" (${platform}) for "${selection.payer.value}" at the moment "${selection.moment.value}". Screen 1 '${flowSteps[0] ?? "입력"}'. Screen 2 '${flowSteps[1] ?? "처리"}'. Screen 3 '${flowSteps[2] ?? "결과"}'. Screen 4 '한 끗 변화: ${selection.twist.value}'. Screen 5 '오늘 만들 화면: ${smallestBuild}'. Landscape 16:9, numbered badges 1-5, Korean UI copy, no real people, no watermark.`;
}

/** AI 코딩 도구의 새 프로젝트 첫 메시지로 쓰는 독립 산출물. */
export function buildDevelopmentInitPrompt(selection: IdeaLabSelection) {
  const platform = PLATFORM_LABELS[selection.twist.platform];
  const flowSteps = normalizeIdeaFlow(selection.source.preservedFlow);
  const preservedFlow = flowSteps.join(" → ");
  const sourceValue = normalizeIdeaSource(selection.source.value);
  const smallestBuild = normalizeIdeaBuild(selection.twist.smallestBuild, platform);
  const mvpGuardrails = buildMvpGuardrails(selection);
  const uniqueClaim = buildUniqueClaim(selection);
  assertAuditedSelection(selection);

  return [
    `# ${selection.twist.resultTitle}: AI 코딩 도구에 붙여넣는 제작 프롬프트`,
    ``,
    `당신은 1인 제품 빌더를 돕는 시니어 풀스택 개발자다. 아래 제품의 실제로 작동하는 모바일 퍼스트 ${platform} MVP를 구현해줘.`,
    ``,
    `## 제품 정의`,
    `- 타겟: ${selection.payer.value}. ${selection.payer.detail}`,
    `- 필요한 순간: ${selection.moment.value}. ${selection.moment.detail}`,
    `- 원본 엔진: ${selection.source.sourceName}. ${sourceValue}`,
    `- 보존할 흐름: ${preservedFlow}`,
    `- 딱 하나의 변화: ${selection.twist.value}`,
    `- 유일 주장: ${uniqueClaim}`,
    `- 오늘 만들 결과: ${smallestBuild}`,
    ``,
    `## 구현 범위`,
    `핵심 경로를 입력 1개 → 처리 1회 → 결과 1개로 완성해. 첫 화면에서 사용자가 무엇을 넣고, 시스템이 무엇을 처리하며, 어떤 결과를 받는지 고등학생도 이해할 문장으로 보여줘.`,
    `성공·빈 상태·처리 실패 상태를 각각 구현하고, 결과 화면에는 “왜 지금 필요한가”와 “다음에 무엇이 남는가”를 한 문장씩 보여줘.`,
    ``,
    `## 하드 게이트`,
    ...mvpGuardrails.map((rule) => `- ${rule}`),
    `- 반복·공유·결제는 이번 구현에 기능으로 추가하지 말고 검증할 가설로만 문서에 남긴다.`,
    `- 확인되지 않은 시장 수치, 가짜 사용자 반응, 가짜 성공 데이터는 표시하지 않는다.`,
    `- 실제 연동이 없으면 데모인 척하지 말고 사용자가 직접 넣은 실제 입력만 처리한다.`,
    ``,
    `## 범위 축소 순서`,
    `1. 원본에서 사용자가 처음 가치를 느끼는 결과 1개만 남긴다.`,
    `2. 자동 수집·연동은 URL·텍스트·파일 직접 입력으로 바꾼다.`,
    `3. 상시 실행은 사용자가 누르는 1회 실행으로 바꾼다.`,
    `4. 반나절~2일 안에 만들 수 없으면 “MVP 범위 초과”라고 알리고 더 작은 세로 조각을 먼저 제안한다.`,
    ``,
    `## 완료 조건`,
    `- 실제 입력으로 처음부터 결과까지 한 번 통과한다.`,
    `- 모바일 360px 폭에서 핵심 행동과 결과가 잘리지 않는다.`,
    `- 빈 상태와 실패 상태에서 사용자가 다음 행동을 알 수 있다.`,
    `- README에 실행 방법, 실제 동작 범위, 아직 검증하지 않은 가설을 구분해 적는다.`,
  ].join("\n");
}

/** 네 카드 데이터를 PRD 포지셔닝 수준의 6블록 제작 문구로 조립한다. */
export function buildPrompt(selection: IdeaLabSelection) {
  const platform = PLATFORM_LABELS[selection.twist.platform];
  const kind = CHANGE_KIND_LABELS[selection.twist.kind];
  const flowSteps = normalizeIdeaFlow(selection.source.preservedFlow);
  const sourceValue = normalizeIdeaSource(selection.source.value);
  const difference = normalizeIdeaDifference(selection.twist.detail);
  const moment = normalizeIdeaMoment(selection.moment.value, selection.moment.detail);
  const smallestBuild = normalizeIdeaBuild(selection.twist.smallestBuild, platform);
  const preservedFlow = flowSteps.join(" → ");
  const uniqueClaim = buildUniqueClaim(selection);
  const developmentPrompt = buildDevelopmentInitPrompt(selection);
  const imagePrompt = buildImagePrompt(selection);
  assertAuditedSelection(selection);

  return [
    `[${selection.twist.resultTitle}] ${platform} 아이디어 브리프`,
    `${selection.moment.value}. ${selection.payer.detail} 그 순간의 당신에게 필요한 건 단 하나다. ${smallestBuild}.`,
    ``,
    `1) UVP: 전과 후가 한 줄로 갈린다`,
    `지금까지: ${moment}. 그런데 방법이 없었다.`,
    `이제부터: ${smallestBuild}. 그게 전부다.`,
    `이미 돈으로 증명된 해외 원본 ${selection.source.sourceName}의 제품 메커니즘을 80~99% 그대로 쓴다. 기능이 원본과 완전히 같아도 허용하며, 한국의 타겟·필요 순간·MVP 범위로 UVP를 선명하게 만든다.`,
    `브랜드명·로고·고유 카피·디자인 에셋은 복제하지 않고, 이번 조합의 변화는 딱 하나(${kind}): ${selection.twist.value}.`,
    ``,
    `2) 타겟: 이미 행동하는 사람만 노린다`,
    `${selection.payer.value}. ${selection.payer.detail} 반복 행동이 이미 있으므로 시장 교육이 필요 없다.`,
    ``,
    `3) 해외에서 잘되는 원본 vs 이번 적용`,
    `- 원본이 이미 증명한 것: ${selection.source.sourceName}. ${sourceValue} (근거: ${selection.source.evidence})`,
    `- 원본이 놓친 이번 장면: ${selection.moment.value} (${selection.moment.detail})`,
    `- 이번 한 끗의 빈틈: ${difference}`,
    `- 유일 주장: ${uniqueClaim}`,
    `- 독창성은 합격 조건이 아니다. 원본과 같은 해결책이어도 이 타겟이 즉시 이해하고 쓸 이유가 명확하면 통과한다.`,
    ``,
    `4) 전체 플로우: 검증된 3단계 + 한 끗`,
    `${preservedFlow} → 한 끗: ${selection.twist.value}`,
    `오늘 만들 최소 화면: ${smallestBuild}`,
    `재사용·공유 가설: ${buildReuseHypothesis(selection)}`,
    `결제 가설: ${buildPaymentHypothesis(selection)}`,
    ``,
    `5) AI 코딩 도구에 붙여넣는 제작 프롬프트`,
    developmentPrompt,
    ``,
    `6) 이미지 생성 프롬프트 (이미지 생성 AI에 독립적으로 붙여넣기)`,
    imagePrompt,
    ``,
    `핵심 반복: ${selection.moment.value}, 당신에게는 “${selection.twist.resultTitle}”. 오늘 ${smallestBuild}부터 만든다.`,
  ].join("\n");
}

export function buildPlainExplain(selection: IdeaLabSelection) {
  const kind = CHANGE_KIND_LABELS[selection.twist.kind];
  const smallestBuild = normalizeIdeaBuild(
    selection.twist.smallestBuild,
    PLATFORM_LABELS[selection.twist.platform],
  );
  return `${selection.source.sourceName}이 하던 일을 그대로 두고 딱 하나(${kind})만 다르게 했어요. ${selection.payer.value}이 ${selection.moment.value}에 열어, ${smallestBuild}만 보면 됩니다.`;
}

export interface IdeaResultHeroCopy {
  name: string;
  tagline?: string;
  painQuestion: string;
  before: string;
  after: string;
}

const TASTEPIN_REVIEWED_BEFORE = "저장은 3초인데 다시 찾는 건 20분";
const TASTEPIN_REVIEWED_AFTER =
  "영상 링크 하나 붙여넣으면 상호·메뉴·위치를 뽑아 당신의 지도에 핀으로 꽂아줍니다. 정리 0분.";

const HERO_COPY_FORBIDDEN =
  /당신은 지금 바로|바로 해결할 수 있나요|어떻게 하시나요|구체적인 입력:|즉시 결과:|입력 하나로 결과 하나|이 결과를 바로 사용합니다|—|–|…|\.\.\./u;
const HERO_COPY_WEAK_QUESTION =
  /야 하나요|필요한가요|싶(?:은가요|나요)|원하나요|바라나요/u;
const HERO_COPY_HARD_WORDS =
  /CRM|DB|API|JSON|CSV|XLSX|HTML|CSS|JSX|URL|PDF|ZIP|APK|ICS|SVG|JPG|JPEG|PNG|GPX|FITS|CRC|SRT|VTT|SQL|SDK|XML|YAML|CORS|OAuth|React|리액트|Kelvin|eval|selector|breakpoint|Tailwind|WordPress|Gutenberg|Mermaid|D\+\d+|메타데이터|유효성|허용 여부|정적 검사|인터랙티브|컴포넌트|스키마|디자인 토큰|타임스탬프|플레이트 솔빙|난독화|인라인 스타일|렌더링|전사 파일/iu;
const HERO_COPY_SOLUTION_IN_HOOK =
  /(?:넣으면|올리면|붙여넣으면|녹화하면|입력하면|누르면|고르면|선택하면|말하면|찍으면|읽으면).*(?:나오|보여|받|만들|바뀌|정리)/u;
const HERO_COPY_GRAMMAR_SMELL =
  /문서을|파일를|파일와|파일가|목록를|목록가|칸가|가격를|정보을|화면를|사진를|영상를|이름를|코드을|주소을|확인할 확인|파일\s+파일|결과\s+결과|문서\s+문서|화면\s+화면|목록\s+목록|코드\s+코드/u;

/**
 * 잠금 전 첫 화면만 읽어도 문제 → 대조 → 작동 방식 → 결과가 보이게 한다.
 * 런타임에서 문장을 만들지 않고, 각 축 ID에 맞춰 미리 검수한 완성 문장만 꺼낸다.
 */
export function buildResultHeroCopy(selection: IdeaLabSelection): IdeaResultHeroCopy {
  const identity = productIdentityForSource(selection.source.id);
  const authored = authoredHeroCopyForSource(selection.source.id);
  const painQuestion = authored.hooks[selection.moment.id];
  const before = authored.before[selection.payer.id];
  const after = authored.after[selection.twist.id];
  if (!painQuestion || !before || !after) {
    throw new Error(
      `Idea Lab 완성 카피 축 누락: ${selection.source.id}:${selection.payer.id}:${selection.moment.id}:${selection.twist.id}`,
    );
  }

  return {
    name: identity.name,
    tagline: identity.tagline,
    painQuestion,
    before,
    after,
  };
}

/**
 * “2700개가 서로 다르다”가 아니라 각 문장이 같은 품질 계약을 통과했는지 확인한다.
 * Hook=문제 장면, Before=현재 마찰, After=입력에서 결과로 바뀌는 메커니즘으로 분리한다.
 */
export function auditResultHeroCopy(
  selection: IdeaLabSelection,
  hero = buildResultHeroCopy(selection),
): IdeaLabQualityAudit {
  const issues: string[] = [];
  const combined = `${hero.painQuestion}\n${hero.before}\n${hero.after}`;
  if (!/^“.+\?”$/u.test(hero.painQuestion)) {
    issues.push("훅은 한 개의 자기진단 질문이어야 합니다.");
  }
  if ((hero.painQuestion.match(/\?/gu) ?? []).length !== 1) {
    issues.push("훅에는 질문을 하나만 남겨야 합니다.");
  }
  if (HERO_COPY_FORBIDDEN.test(combined)) {
    issues.push("감사 문구, 기계적 질문 또는 강제 생략 기호를 제거해야 합니다.");
  }
  if (HERO_COPY_WEAK_QUESTION.test(hero.painQuestion)) {
    issues.push("훅은 해야 할 일을 묻지 말고 사용자가 얻고 싶은 결과를 물어야 합니다.");
  }
  if (HERO_COPY_SOLUTION_IN_HOOK.test(hero.painQuestion)) {
    issues.push("훅에는 제품의 입력·처리·결과를 넣지 말고 사용자의 고통만 남겨야 합니다.");
  }
  if (HERO_COPY_HARD_WORDS.test(combined)) {
    issues.push("첫 화면의 전문용어를 맥락 없는 중학생도 이해하는 말로 바꿔야 합니다.");
  }
  if (HERO_COPY_GRAMMAR_SMELL.test(combined)) {
    issues.push("조사 오류나 같은 명사의 기계적 반복을 고쳐야 합니다.");
  }
  if (Array.from(hero.painQuestion).length > 72) {
    issues.push("훅은 72자 이하여야 합니다.");
  }
  if (Array.from(hero.before).length > 96) {
    issues.push("현재 마찰은 96자 이하여야 합니다.");
  }
  if (hero.before !== TASTEPIN_REVIEWED_BEFORE && !/니다\.$/u.test(hero.before)) {
    issues.push("현재 마찰은 중학생에게 말하듯 일관된 존댓말 문장으로 써야 합니다.");
  }
  if (Array.from(hero.after).length > 104) {
    issues.push("작동 방식은 104자 이하여야 합니다.");
  }
  if (hero.after !== TASTEPIN_REVIEWED_AFTER && !/니다\.$/u.test(hero.after)) {
    issues.push("작동 방식은 중학생에게 말하듯 일관된 존댓말 문장으로 써야 합니다.");
  }
  if (Array.from(`${hero.painQuestion}${hero.before}${hero.after}`).length > 220) {
    issues.push("세 줄은 한 장에서 읽히도록 총 220자 이하여야 합니다.");
  }
  if (/(?:웹|모바일|브라우저 확장|확장) 화면[.!]?$/u.test(hero.after)) {
    issues.push("작동 방식은 구현 화면이 아니라 사용자 결과로 끝나야 합니다.");
  }
  if (hero.before !== TASTEPIN_REVIEWED_BEFORE && hero.after !== TASTEPIN_REVIEWED_AFTER) {
    const sourceText = [
      selection.source.value,
      selection.source.preservedFlow,
      selection.source.evidence,
      selection.payer.value,
      selection.payer.detail,
      selection.moment.value,
      selection.moment.detail,
      selection.twist.value,
      selection.twist.detail,
      selection.twist.resultTitle,
      selection.twist.smallestBuild,
    ].join(" ");
    const allowedNumbers = new Set(sourceText.match(/\d+(?:[.,]\d+)?/gu) ?? []);
    if (/이진/u.test(sourceText)) allowedNumbers.add("2");
    if (/십진/u.test(sourceText)) allowedNumbers.add("10");
    if (/육각/u.test(sourceText)) allowedNumbers.add("16");
    const generatedNumbers = combined.match(/\d+(?:[.,]\d+)?/gu) ?? [];
    if (generatedNumbers.some((number) => !allowedNumbers.has(number))) {
      issues.push("선택 카드에 없는 숫자를 새로 만들면 안 됩니다.");
    }
  }

  return { ok: issues.length === 0, issues };
}

/** 카드 조합을 화면에서 숨김없이 읽는 결과 요약으로 바꾼다. */
export function buildIdeaResult(selection: IdeaLabSelection) {
  const flowSteps = normalizeIdeaFlow(selection.source.preservedFlow);
  const smallestBuild = normalizeIdeaBuild(
    selection.twist.smallestBuild,
    PLATFORM_LABELS[selection.twist.platform],
  );
  const sourceValue = normalizeIdeaSource(selection.source.value);
  const difference = normalizeIdeaDifference(selection.twist.detail);
  const moment = normalizeIdeaMoment(selection.moment.value, selection.moment.detail);
  const hero = buildResultHeroCopy(selection);
  const parts = [
    { axis: "source" as const, value: selection.source.sourceName },
    { axis: "payer" as const, value: selection.payer.value },
    { axis: "moment" as const, value: selection.moment.value },
    { axis: "twist" as const, value: selection.twist.resultTitle },
  ];

  return {
    title: selection.twist.resultTitle,
    hero,
    parts,
    text: parts.map((part) => part.value).join(" × "),
    summary: `${josa(selection.payer.value, "이/가")} ${selection.moment.value}에 쓰는 ${PLATFORM_LABELS[selection.twist.platform]} 아이디어`,
    hook: hero.painQuestion,
    uvp: smallestBuild,
    solution: smallestBuild,
    sourceProof: `${selection.source.sourceName} · ${selection.source.evidence}`,
    sourceComparison: `${selection.source.sourceName}. ${sourceValue}`,
    sourceValue,
    difference,
    uniqueClaim: buildUniqueClaim(selection),
    reuseHypothesis: buildReuseHypothesis(selection),
    paymentHypothesis: buildPaymentHypothesis(selection),
    flowSteps: [...flowSteps, selection.twist.resultTitle],
    problem: `${selection.moment.value}. ${moment}`,
    target: normalizeIdeaTarget(selection.payer.value, selection.payer.detail),
    firstAction: smallestBuild,
    combinationId: [
      selection.source.id,
      selection.payer.id,
      selection.moment.id,
      selection.twist.id,
    ].join(":"),
  };
}

export function initialScenarioIndex(initialScenarioId?: string) {
  if (!initialScenarioId) return 0;
  const index = IDEA_LAB_SCENARIOS.findIndex((scenario) => scenario.id === initialScenarioId);
  return index >= 0 ? index : 0;
}
