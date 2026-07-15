import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "src/components/organisms/idea-lab/sample-data.ts");
const TARGETS = ["lookup-brief", "party-imposter", "personal-color-kit"];

const REVIEW = {
  "lookup-brief": {
    "twist-voice": { differentiation: 4.6, buildability: 4.8, appeal: 4.6 },
    "twist-tab": { differentiation: 4.7, buildability: 4.9, appeal: 4.7 },
    "twist-three-lines": { differentiation: 4.6, buildability: 4.9, appeal: 4.7 },
  },
  "party-imposter": {
    "twist-secret-mission": { differentiation: 4.7, buildability: 4.8, appeal: 4.8 },
    "twist-one-phone": { differentiation: 4.7, buildability: 5, appeal: 4.8 },
    "twist-photo-category": { differentiation: 4.8, buildability: 4.8, appeal: 4.8 },
  },
  "personal-color-kit": {
    "twist-shopping-badge": { differentiation: 4.6, buildability: 4.8, appeal: 4.6 },
    "twist-best-worst-three": { differentiation: 4.5, buildability: 4.9, appeal: 4.6 },
    "twist-live-color-score": { differentiation: 4.8, buildability: 4.7, appeal: 4.8 },
  },
};

function loadData() {
  const source = fs.readFileSync(DATA_PATH, "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const evaluatedModule = { exports: {} };
  new Function("exports", "module", "require", javascript)(
    evaluatedModule.exports,
    evaluatedModule,
    () => ({}),
  );
  return evaluatedModule.exports;
}

function enumerate(scenario) {
  return scenario.payers.flatMap((payer) =>
    scenario.moments.flatMap((moment) =>
      scenario.twists.map((twist) => ({ scenario, payer, moment, twist })),
    ),
  );
}

function initialFailureReasons(combo) {
  const { scenario, payer, moment, twist } = combo;
  const reasons = [];

  if (scenario.id === "lookup-brief") {
    if (payer.id === "payer-recruiter" && moment.id === "moment-before-email") {
      reasons.push("채용 담당자에게 영업 메일 장면이 연결됨");
    }
    if (payer.id === "payer-recruiter" && twist.id === "twist-tab") {
      reasons.push("후보자 확인 행동에 회사 웹사이트 전용 결과가 연결됨");
    }
    if (moment.id === "moment-lead-list" && twist.id === "twist-voice") {
      reasons.push("우선 연락 대상을 고르는 장면에 미팅 전 브리핑 결과가 연결됨");
    }
  }

  if (scenario.id === "party-imposter") {
    if (moment.id === "moment-remote-awkward" && twist.id === "twist-one-phone") {
      reasons.push("온라인 모임에 휴대폰 한 대 돌려보기 방식이 연결됨");
    }
    if (payer.id === "payer-boardgame-manager" && moment.id === "moment-remote-awkward") {
      reasons.push("보드게임 카페 매니저에게 온라인 카메라 모임 장면이 연결됨");
    }
    if (payer.id === "payer-youth-program-host" && moment.id === "moment-dinner-silence") {
      reasons.push("문화센터 강사에게 저녁 식사 장면이 연결됨");
    }
  }

  if (scenario.id === "personal-color-kit") {
    if (payer.id === "payer-brand-marketer") {
      reasons.push("고객에게 색을 추천하는 판매자와 본인 의상을 고르는 장면의 주체가 다름");
    }
    if (
      payer.id === "payer-camera-instructor" &&
      ["moment-jacket-checkout", "moment-live-stream"].includes(moment.id)
    ) {
      reasons.push("고객 스타일리스트와 본인 결제·라이브 장면의 주체가 다름");
    }
    if (payer.id === "payer-shortform-creator" && moment.id === "moment-styling-eve") {
      reasons.push("콘텐츠 제작자에게 고객 스타일링 상담 장면이 연결됨");
    }
  }

  return reasons;
}

function structuralIssues(combo) {
  const { scenario, payer, moment, twist } = combo;
  const issues = [];
  if (!scenario.source.evidence.startsWith("TrustMRR에서 실제 매출이 확인된 ")) {
    issues.push("매출 근거 형식 오류");
  }
  if (scenario.source.preservedFlow.split("→").filter(Boolean).length !== 3) {
    issues.push("보존 흐름이 3단계가 아님");
  }
  if (!payer.value || !payer.detail) issues.push("payer 필수 문구 누락");
  if (!/(고 싶은|야 하는) 순간$/.test(moment.detail)) issues.push("moment 통증 종결 규칙 위반");
  if (!twist.resultTitle || !twist.smallestBuild || !twist.platform) {
    issues.push("twist 필수 필드 누락");
  }
  return issues;
}

function score(combo) {
  const twistScore = REVIEW[combo.scenario.id][combo.twist.id];
  const dimensions = {
    specificity: 5,
    coherence: 5,
    differentiation: twistScore.differentiation,
    buildability: twistScore.buildability,
    appeal: twistScore.appeal,
  };
  const total = Object.values(dimensions).reduce((sum, value) => sum + value, 0) / 5;
  return { dimensions, total: Number(total.toFixed(2)) };
}

function josa(word, pair) {
  const last = word.charCodeAt(word.length - 1);
  const batchim = last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 : -1;
  const [withBatchim, withoutBatchim] = pair.split("/");
  if (batchim === -1) return `${word}${withBatchim}(${withoutBatchim})`;
  return word + (batchim > 0 ? withBatchim : withoutBatchim);
}

function buildPrompt(combo, platformLabels, changeKindLabels) {
  const { scenario, payer, moment, twist } = combo;
  const platform = platformLabels[twist.platform];
  const kind = changeKindLabels[twist.kind];
  const flowSteps = scenario.source.preservedFlow.split("→").map((step) => step.trim());
  return [
    `[${twist.resultTitle}] ${platform} 아이디어 브리프`,
    `${moment.value}. ${payer.detail} 그 순간의 당신에게 필요한 건 단 하나 — ${twist.smallestBuild}.`,
    ``,
    `1) UVP — 전과 후가 한 줄로 갈린다`,
    `지금까지: ${moment.detail}. 그런데 방법이 없었다.`,
    `이제부터: ${twist.smallestBuild}. 그게 전부다.`,
    `이미 돈으로 증명된 해외 원본 ${scenario.source.sourceName}의 제품 메커니즘을 80~99% 그대로 쓴다. 기능이 원본과 완전히 같아도 허용하며, 이번 변화는 딱 하나(${kind}): ${twist.value}.`,
    ``,
    `2) 타겟 — 이미 행동하는 사람만 노린다`,
    `${payer.value}. ${payer.detail} 반복 행동이 이미 있으므로 시장 교육이 필요 없다.`,
    ``,
    `3) 해외에서 잘되는 원본 vs 이번 적용`,
    `- 원본: ${scenario.source.sourceName} — ${scenario.source.value} (증명된 근거: ${scenario.source.evidence})`,
    `- 원본이 놓친 순간: ${moment.value} (${moment.detail})`,
    `- 핵심 주장: “${moment.value}”의 ${josa(payer.value, "을/를")} 위한 ${platform} — ${twist.detail}`,
    ``,
    `4) 전체 플로우 — 검증된 3단계 + 한 끗`,
    `${scenario.source.preservedFlow} → 한 끗: ${twist.value}`,
    `오늘 만들 최소 화면: ${twist.smallestBuild}`,
    ``,
    `5) AI 코딩 도구 제작 지시`,
    `${platform} 아이디어 “${twist.resultTitle}”를 1인 바이브 코딩 MVP로 만들어줘. 원본 흐름(${scenario.source.preservedFlow})은 80~99% 유지하되, 범위가 크면 입력 1개 → 처리 1회 → 결과 1개의 핵심 세로 조각으로 줄여.`,
    `첫 화면에서 사용자가 무엇을 넣고, 시스템이 무엇을 처리하며, 어떤 결과를 받는지 고등학생도 이해할 문장으로 보여줘.`,
    `오늘 만들 범위는 ${twist.smallestBuild} 하나로 제한해. 성공·빈 상태·처리 실패 상태를 각각 만들고, 확인되지 않은 데이터나 가짜 사용자 반응은 표시하지 마.`,
    `자동 수집·OAuth·상시 작업이 필요하면 URL·텍스트·파일 직접 입력과 사용자가 누르는 1회 실행으로 바꿔. 그래도 반나절~2일 안에 실제로 동작하지 않으면 MVP 범위 초과로 표시하고 더 작은 핵심 결과를 제안해.`,
    ``,
    `6) 플로우 이미지 프롬프트 (이미지 생성 AI에 붙여넣기)`,
    `A single wide image showing 5 identical modern smartphone mockups side by side, each a real mobile app UI screen, connected by thin arrows with Korean step labels. DESIGN SYSTEM (same across all panels): dark charcoal background #121212, near-black cards with 20px rounded corners and subtle borders, large friendly Korean sans-serif headlines (Pretendard style), full-width pill-shaped CTA button at bottom of each screen, minimal flat icons, clean flat UI; one single accent color used only on buttons and chips. ATMOSPHERE RULE: screens 2-4 stay strictly clean flat UI; screens 1 and 5 are hero moments and may be slightly conceptual with a soft glow bleeding beyond the card edge, but UI text stays crisp. The app is "${twist.resultTitle}" (${platform}). Screen 1 '${flowSteps[0] ?? "입력"}'. Screen 2 '${flowSteps[1] ?? "처리"}'. Screen 3 '${flowSteps[2] ?? "결과"}'. Screen 4 '한 끗 변화 — ${twist.value}'. Screen 5 '오늘 만들 화면 — ${twist.smallestBuild}'. Landscape 16:9, numbered badges 1-5, no real people, no watermark.`,
    ``,
    `핵심 반복 — ${moment.value}, 당신에게는 “${twist.resultTitle}”. 오늘 ${twist.smallestBuild}부터 만든다.`,
  ].join("\n");
}

function promptPreview(combo) {
  return {
    title: combo.twist.resultTitle,
    hook: `${combo.moment.value}. ${combo.payer.detail}`,
    before: combo.moment.detail,
    after: combo.twist.smallestBuild,
  };
}

const data = loadData();
const scenarios = data.IDEA_LAB_SCENARIOS.filter((scenario) => TARGETS.includes(scenario.id));
if (scenarios.length !== TARGETS.length) throw new Error("파일럿 시나리오 3개를 찾지 못했습니다.");

const combinations = scenarios.flatMap(enumerate);
const results = combinations.map((combo) => {
  const beforeReasons = initialFailureReasons(combo);
  const afterIssues = structuralIssues(combo);
  const review = score(combo);
  return {
    id: [combo.scenario.id, combo.payer.id, combo.moment.id, combo.twist.id].join("__"),
    scenarioId: combo.scenario.id,
    payerId: combo.payer.id,
    momentId: combo.moment.id,
    twistId: combo.twist.id,
    before: { pass: beforeReasons.length === 0, reasons: beforeReasons },
    after: { pass: afterIssues.length === 0 && review.total >= 4.5, issues: afterIssues, ...review },
    preview: promptPreview(combo),
    prompt: buildPrompt(combo, data.PLATFORM_LABELS, data.CHANGE_KIND_LABELS),
  };
});

const afterScores = results.map((result) => result.after.total);
const output = {
  generatedAt: new Date().toISOString(),
  scope: { scenarioIds: TARGETS, combinations: results.length },
  rubric: {
    scale: "1-5 desk review",
    dimensions: ["specificity", "coherence", "differentiation", "buildability", "appeal"],
    pass: "hard gate 0 issues and average >= 4.5",
    caveat: "사람의 실제 제작 의향 검증이 아니라 내부 전수 데스크 감사 결과",
  },
  summary: {
    before: {
      passed: results.filter((result) => result.before.pass).length,
      failed: results.filter((result) => !result.before.pass).length,
    },
    after: {
      passed: results.filter((result) => result.after.pass).length,
      failed: results.filter((result) => !result.after.pass).length,
      average: Number((afterScores.reduce((a, b) => a + b, 0) / afterScores.length).toFixed(2)),
      minimum: Math.min(...afterScores),
    },
  },
  results,
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
