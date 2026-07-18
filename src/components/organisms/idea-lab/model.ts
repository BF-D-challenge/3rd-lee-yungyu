import { josa } from "@/lib/josa";
import {
  normalizeIdeaBuild,
  normalizeIdeaDifference,
  normalizeIdeaFlow,
  normalizeIdeaMoment,
  normalizeIdeaSource,
  normalizeIdeaTarget,
} from "@/lib/idea-copy";
import { CHANGE_KIND_LABELS, IDEA_LAB_SCENARIOS, PLATFORM_LABELS } from "./sample-data";
import {
  type IdeaLabAxisId,
  type IdeaLabOption,
  type IdeaLabSelection,
  type IdeaLabSourceOption,
  type IdeaLabTwistOption,
} from "./types";

export type ChoiceIndexes = Record<IdeaLabAxisId, number>;

export const IDEA_LAB_SEEN_SCENARIOS_KEY = "oneul:idea-lab-seen-scenarios:v1";

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
  const mvpGuardrails = buildMvpGuardrails(selection);
  return [
    `[${selection.twist.resultTitle}] ${platform} 아이디어 브리프`,
    `${selection.moment.value}. ${selection.payer.detail} 그 순간의 당신에게 필요한 건 단 하나 — ${smallestBuild}.`,
    ``,
    `1) UVP — 전과 후가 한 줄로 갈린다`,
    `지금까지: ${moment}. 그런데 방법이 없었다.`,
    `이제부터: ${smallestBuild}. 그게 전부다.`,
    `이미 돈으로 증명된 해외 원본 ${selection.source.sourceName}의 제품 메커니즘을 80~99% 그대로 쓴다. 기능이 원본과 완전히 같아도 허용하며, 한국의 타겟·필요 순간·MVP 범위로 UVP를 선명하게 만든다.`,
    `브랜드명·로고·고유 카피·디자인 에셋은 복제하지 않고, 이번 조합의 변화는 딱 하나(${kind}): ${selection.twist.value}.`,
    ``,
    `2) 타겟 — 이미 행동하는 사람만 노린다`,
    `${selection.payer.value}. ${selection.payer.detail} 반복 행동이 이미 있으므로 시장 교육이 필요 없다.`,
    ``,
    `3) 해외에서 잘되는 원본 vs 이번 적용`,
    `- 원본: ${selection.source.sourceName} — ${sourceValue} (증명된 근거: ${selection.source.evidence})`,
    `- 이번 사용 순간: ${selection.moment.value} (${selection.moment.detail})`,
    `- 핵심 주장: “${selection.moment.value}”의 ${josa(selection.payer.value, "을/를")} 위한 ${platform} — ${difference}`,
    `- 독창성은 합격 조건이 아니다. 원본과 같은 해결책이어도 이 타겟이 즉시 이해하고 쓸 이유가 명확하면 통과한다.`,
    ``,
    `4) 전체 플로우 — 검증된 3단계 + 한 끗`,
    `${preservedFlow} → 한 끗: ${selection.twist.value}`,
    `오늘 만들 최소 화면: ${smallestBuild}`,
    ``,
    `5) AI 코딩 도구 제작 지시`,
    `${platform} 아이디어 “${selection.twist.resultTitle}”를 1인 바이브 코딩 MVP로 만들어줘. 원본 흐름(${preservedFlow})은 80~99% 유지하되, 아래 하드 게이트를 넘지 못하는 기능은 구현하지 마.`,
    `첫 화면에서 사용자가 무엇을 넣고, 시스템이 무엇을 처리하며, 어떤 결과를 받는지 고등학생도 이해할 문장으로 보여줘.`,
    `오늘 만들 범위는 ${smallestBuild} 하나로 제한해. 성공·빈 상태·처리 실패 상태를 각각 만들고, 확인되지 않은 데이터나 가짜 사용자 반응은 표시하지 마.`,
    `MVP 하드 게이트:`,
    ...mvpGuardrails.map((rule) => `- ${rule}`),
    `범위가 크면 다음 순서로 핵심 아이디어를 쪼개:`,
    `1. 원본에서 사용자가 처음 가치를 느끼는 결과 1개만 남긴다.`,
    `2. 자동 수집·연동은 URL·텍스트·파일 직접 입력으로 바꾼다.`,
    `3. 상시 실행은 사용자가 누르는 1회 실행으로 바꾼다.`,
    `4. 입력 1개 → 처리 1회 → 결과 1개가 실제로 동작하는 세로 조각만 만든다.`,
    `5. 이 조각도 반나절~2일 안에 실제 데이터로 구현할 수 없으면 “MVP 범위 초과”라고 표시하고 더 작은 핵심 결과를 제안한다.`,
    ``,
    `6) 플로우 이미지 프롬프트 (이미지 생성 AI에 붙여넣기)`,
    `A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal flat icons, clean flat UI; one single accent color used only on buttons and chips. ATMOSPHERE RULE: screens 2-4 stay strictly clean flat UI; screens 1 and 5 are hero moments and may be slightly conceptual with a soft glow bleeding beyond the card edge, but UI text stays crisp. The app is "${selection.twist.resultTitle}" (${platform}). Screen 1 '${flowSteps[0] ?? "입력"}'. Screen 2 '${flowSteps[1] ?? "처리"}'. Screen 3 '${flowSteps[2] ?? "결과"}'. Screen 4 '한 끗 변화 — ${selection.twist.value}'. Screen 5 '오늘 만들 화면 — ${smallestBuild}'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.`,
    ``,
    `핵심 반복 — ${selection.moment.value}, 당신에게는 “${selection.twist.resultTitle}”. 오늘 ${smallestBuild}부터 만든다.`,
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
  const parts = [
    { axis: "source" as const, value: selection.source.sourceName },
    { axis: "payer" as const, value: selection.payer.value },
    { axis: "moment" as const, value: selection.moment.value },
    { axis: "twist" as const, value: selection.twist.resultTitle },
  ];

  return {
    title: selection.twist.resultTitle,
    parts,
    text: parts.map((part) => part.value).join(" × "),
    summary: `${josa(selection.payer.value, "이/가")} ${selection.moment.value}에 쓰는 ${PLATFORM_LABELS[selection.twist.platform]} 아이디어`,
    hook: `“${moment}”`,
    uvp: smallestBuild,
    solution: smallestBuild,
    sourceProof: `${selection.source.sourceName} · ${selection.source.evidence}`,
    sourceComparison: `${selection.source.sourceName} — ${sourceValue}`,
    sourceValue,
    difference,
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
