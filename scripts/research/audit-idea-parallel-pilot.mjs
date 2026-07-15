import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "docs/research/idea-source-parallel-pilot.jsonl");
const outputPath = path.join(root, "docs/research/idea-source-parallel-pilot-audit.jsonl");
const reportPath = path.join(root, "docs/dev/experiments/idea-lab/idea-source-parallel-pilot-2026-07-13.md");

const rows = fs
  .readFileSync(inputPath, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const audits = {
  "A_revenue_proof:1": ["reject", "insufficient_mechanism", "none", 1, "다운로드·활성 사용자·매출 신호는 강하지만 수집 원문에 개인화 입력과 결과 흐름이 충분히 적혀 있지 않다."],
  "A_revenue_proof:2": ["reject", "physical_business", "none", 0, "문·자재를 판매·배송하는 물리 이커머스로 재사용할 소프트웨어 메커니즘이 없다."],
  "A_revenue_proof:3": ["custom_reserve", "integration_scope", "reserve", 2, "메시지→리드 자격 판정→예약은 구체적이지만 Instagram·WhatsApp 연결과 영업 채널이 필요하다."],
  "A_revenue_proof:4": ["reject", "integration_scope", "none", 1, "WhatsApp 주문·마케팅·지원 전체 자동화라 반나절~2일 세로 조각보다 범위가 크다."],
  "A_revenue_proof:5": ["reject", "commodity_ai", "none", 0, "범용 AI 앱 빌더이며 검증된 고유 작업이나 입력→결과가 보이지 않는다."],
  "A_revenue_proof:6": ["reject", "marketplace_or_policy", "none", 1, "팔로워·보도·소셜 계정 거래 마켓은 외부 공급자와 플랫폼 정책 의존도가 높다."],

  "B_korean_behavior:1": ["reject", "platform_or_default", "none", 0, "Instagram 전체 서비스는 작은 원본 메커니즘이 아니라 플랫폼 자체다."],
  "B_korean_behavior:2": ["reject", "commodity_ai", "none", 0, "ChatGPT 전체 서비스는 범용 AI 한 번보다 좁고 유일한 작업을 제시하지 못한다."],
  "B_korean_behavior:3": ["reject", "commodity_ai", "none", 0, "Gemini 전체 서비스는 범용 AI 플랫폼이라 카드 원본으로 너무 넓다."],
  "B_korean_behavior:4": ["reject", "platform_or_default", "none", 0, "Spotify 전체 서비스는 콘텐츠·권리·네트워크를 포함한 대형 플랫폼이다."],
  "B_korean_behavior:5": ["merge_material", "platform_or_default", "merge", 1, "저장한 시각 자료를 나중 행동으로 되찾게 하는 순간·한 끗 재료는 있지만 원본은 대형 플랫폼이다."],
  "B_korean_behavior:6": ["reject", "counterparty_required", "none", 0, "가치는 다른 참가자와 서버가 함께 움직여야 생기며 플랫폼 전체 범위다."],

  "C_tiny_extension:1": ["reject", "commodity_ai", "none", 1, "회의 녹취·요약·액션아이템은 범용 회의 AI와 구별되는 세로 조각이 없다."],
  "C_tiny_extension:2": ["reject", "commodity_ai", "none", 1, "Zoom·Meet·Teams 회의 요약은 경쟁이 과밀하고 범용 AI 요약보다 유일한 결과가 없다."],
  "C_tiny_extension:3": ["promote_27_audit", null, "new", 2, "현재 상품 페이지→가격 이력·판매자 위험·대안 상품은 설치 직후 효용이 생기는 작은 브라우저 메커니즘이다."],
  "C_tiny_extension:4": ["reject", "commodity_ai", "none", 1, "회의 녹취와 요약이라는 범용 AI 작업이며 플랫폼 연결 부담이 크다."],
  "C_tiny_extension:5": ["promote_27_audit", null, "new", 2, "현재 영상의 자막→이중 자막·표현 연습이라는 입력과 결과가 명확하고 브라우저 한 화면으로 줄일 수 있다."],
  "C_tiny_extension:6": ["custom_reserve", "inventory_dependency", "reserve", 2, "숙소 페이지→직접 예약가 비교는 매력적이지만 숙소 식별·요금 재고 수집 채널이 있어야 한다."],

  "D_problem_lenses:1": ["custom_reserve", "domain_and_integration", "reserve", 2, "과제→근거 피드백은 구체적이나 채점 책임과 LMS 연결을 감당할 교육 도메인이 필요하다."],
  "D_problem_lenses:2": ["merge_material", null, "merge", 2, "Stripe 실적→검증 가능한 포트폴리오는 경력 증명 카드의 결제자·결과 재료로 강하다."],
  "D_problem_lenses:3": ["reject", "platform_or_default", "none", 2, "사진→PDF·OCR은 모바일 OS와 무료 스캐너가 이미 더 간단하게 제공한다."],
  "D_problem_lenses:4": ["reject", "accuracy_risk", "none", 1, "범용 팩트체크는 정답 근거와 책임 범위가 불명확해 한 번의 AI 질의보다 신뢰 우위가 없다."],
  "D_problem_lenses:5": ["custom_reserve", "regulated_domain", "reserve", 2, "보충제 페이지→연구 근거 표시는 선명하지만 건강 주장 검수 역량이 필수다."],
  "D_problem_lenses:6": ["custom_reserve", "platform_policy", "reserve", 2, "주문→가격 인하→환급 청구는 돈이 보이지만 Amazon 정책·주문 접근·청구 권한에 의존한다."],

  "E_concrete_input:1": ["reject", "platform_or_default", "none", 2, "사진→문서 스캔·OCR은 입력은 구체적이지만 OS 기본 기능과 무료 앱이 더 편하다."],
  "E_concrete_input:2": ["reject", "platform_or_default", "none", 2, "종이→PDF·OCR은 검증됐지만 이미 기본 기능에 가까운 범용 스캐너다."],
  "E_concrete_input:3": ["reject", "duplicate_mechanism", "none", 2, "같은 JotNot 제품의 국가별 중복이며 문서 스캔 자체도 새 원본 가치가 없다."],
  "E_concrete_input:4": ["reject", "scope_and_weak_signal", "none", 1, "500개 도구 모음은 핵심 작업이 없고 사용자·매출 검증 신호도 없다."],
  "E_concrete_input:5": ["reject", "platform_or_default", "none", 2, "사진→다중 PDF는 명확하지만 모바일 기본 스캔보다 유일한 결과가 없다."],
  "E_concrete_input:6": ["reject", "platform_or_default", "none", 1, "QR·바코드·OCR 올인원은 기본 카메라 기능보다 범위만 넓고 검증 신호가 없다."],

  "F_pain_language:1": ["reject", "scope_and_default", "none", 1, "캘린더·할 일·리마인더 전체 묶음이며 OS 기본 앱보다 좁은 통증과 결과가 없다."],
  "F_pain_language:2": ["promote_27_audit", null, "new", 2, "거래 내역→반복 결제·인상된 청구 탐지는 돈을 잃은 순간과 결과가 선명하고 파일 입력으로 축소 가능하다."],
  "F_pain_language:3": ["reject", "counterparty_required", "none", 1, "공유 일정의 핵심 가치는 친구·가족이 함께 새 행동을 해야 생긴다."],
  "F_pain_language:4": ["reject", "platform_or_default", "none", 2, "앱 차단은 단일 권한으로 가능하지만 OS Screen Time이 같은 작업을 직접 제공한다."],
  "F_pain_language:5": ["promote_27_audit", null, "new", 2, "메일함→구독 발신자 묶음→일괄 정리는 설치 당일 효용이 있고 기본 단건 수신거부보다 결과가 선명하다."],
  "F_pain_language:6": ["reject", "weak_payer", "none", 2, "임시 메일은 즉시 작동하지만 무료 대체재가 많아 자연스러운 결제자 3개를 만들기 어렵다."],

  "G_novel_outlier:1": ["reject", "platform_or_default", "none", 2, "사진→PDF 스캔은 현재 원본과 멀지만 기본 기능보다 나은 새 메커니즘은 아니다."],
  "G_novel_outlier:2": ["promote_27_audit", null, "new", 2, "열린 탭→비활성 탭 자동 보관→복원은 설치 직후 기존 혼란을 줄이는 작고 측정 가능한 확장 기능이다."],
  "G_novel_outlier:3": ["custom_reserve", "licensed_domain", "reserve", 1, "금융 자격시험 성과는 강하지만 문제 저작권과 전문 콘텐츠가 필요한 교육 사업이다."],
  "G_novel_outlier:4": ["reject", "commodity_ai", "none", 1, "회의 요약은 멀리 떨어진 후보일 뿐 범용 AI 대비 유일성이 없다."],
  "G_novel_outlier:5": ["custom_reserve", "niche_platform_dependency", "reserve", 2, "게임 거래 화면 보조는 구체적이지만 해당 게임 경제·UI·사용자 채널 지식이 필수다."],
  "G_novel_outlier:6": ["reject", "counterparty_required", "none", 1, "트레이너와 회원이 함께 쓰는 코칭 플랫폼 전체라 상대방의 지속 행동과 큰 범위가 필요하다."],

  "H_merge_neighbor:1": ["reject", "integration_and_counterparty", "none", 1, "인바운드·아웃바운드 AI 전화 플랫폼은 통화 인프라와 상대방 응답이 필수다."],
  "H_merge_neighbor:2": ["reject", "commodity_ai", "none", 1, "60초 AI 웹사이트 생성은 기존 앱 원본과 겹치고 매출 검증도 0이다."],
  "H_merge_neighbor:3": ["reject", "commodity_ai", "none", 0, "이미지 생성·보정이라는 설명만 있어 고유 입력·결과·사용 순간이 없다."],
  "H_merge_neighbor:4": ["merge_material", null, "merge", 2, "긴 영상→게시 가능한 숏폼은 기존 story-short-video의 결과·한 끗 카드 재료로 직접 쓸 수 있다."],
  "H_merge_neighbor:5": ["merge_material", null, "merge", 2, "영상 번역·음성 복제는 기존 video-dubbing-localizer의 결제자·순간·결과 재료다."],
  "H_merge_neighbor:6": ["reject", "commodity_ai", "none", 0, "AI 앱 생성·호스팅 플랫폼 전체이며 한 작업의 검증 신호가 없다."],

  "I_random_control:1": ["custom_reserve", "regulated_domain", "reserve", 1, "매일 개인화 육아 안내는 순간은 있으나 임신·영유아 조언 검수와 신뢰 채널이 필요하다."],
  "I_random_control:2": ["custom_reserve", "channel_and_platform_scope", "reserve", 1, "스트리머 참여형 게임은 강한 채널이 있으면 가능하지만 시청자 행동과 여러 플랫폼 연결이 필수다."],
  "I_random_control:3": ["reject", "regulated_and_scope", "none", 0, "후불결제·카드·예금·통신을 묶은 금융 인프라로 1인 MVP 범위를 벗어난다."],
  "I_random_control:4": ["promote_27_audit", null, "new", 2, "손글씨·도형→편집 가능한 텍스트·도형 변환은 단일 기기 입력과 결과가 명확하고 한 기능으로 줄일 수 있다."],
  "I_random_control:5": ["custom_reserve", "local_policy_domain", "reserve", 2, "출석 기록→결석 가능 횟수는 작지만 학교별 규칙과 학생 결제 의사를 먼저 확인해야 한다."],
  "I_random_control:6": ["reject", "platform_or_default", "none", 1, "다국어 입력은 OS와 브라우저 기본 입력기가 더 직접적으로 해결한다."],
};

const decisionLabels = {
  promote_27_audit: "27조합 감사 후보",
  merge_material: "Merge 재료",
  custom_reserve: "Custom Reserve",
  reject: "탈락",
};

const audited = rows.map((row) => {
  const auditKey = `${row.experiment_id}:${row.experiment_rank}`;
  const audit = audits[auditKey];
  if (!audit) throw new Error(`Missing manual audit: ${auditKey}`);
  const [audit_decision, hard_failure, novelty, specificity, audit_reason] = audit;
  return { ...row, audit_decision, hard_failure, novelty, specificity, audit_reason };
});

if (Object.keys(audits).length !== audited.length) {
  throw new Error(`Audit count mismatch: ${Object.keys(audits).length} decisions for ${audited.length} rows`);
}

fs.writeFileSync(outputPath, `${audited.map((row) => JSON.stringify(row)).join("\n")}\n`);

const experimentOrder = [...new Set(audited.map((row) => row.experiment_id))];
const summaries = experimentOrder.map((experimentId) => {
  const items = audited.filter((row) => row.experiment_id === experimentId);
  const counts = Object.fromEntries(Object.keys(decisionLabels).map((key) => [key, items.filter((row) => row.audit_decision === key).length]));
  return {
    experimentId,
    hypothesis: items[0].hypothesis,
    n: items.length,
    counts,
    promoteRate: counts.promote_27_audit / items.length,
    mergeRate: counts.merge_material / items.length,
    reserveRate: counts.custom_reserve / items.length,
    rejectRate: counts.reject / items.length,
    specificityAverage: items.reduce((sum, row) => sum + row.specificity, 0) / items.length,
  };
});

const random = summaries.find((summary) => summary.experimentId === "I_random_control");
const pct = (value) => `${(value * 100).toFixed(1)}%`;
const signedPp = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%p`;

const report = [];
report.push("# 8,406개 원본 병렬 소실험 1차 결과");
report.push("");
report.push("> 날짜: 2026-07-13  ");
report.push("> 목적: 서로 독립적인 선별 가설을 같은 짧은 예산으로 실제 적용해, 현재 카드 수준을 유지하면서 검토 순서를 개선할 수 있는지 확인한다.");
report.push("");
report.push("## 실험 방식");
report.push("");
report.push("- 모집단: 통합 리서치 원본 8,406개 전체");
report.push("- 실험군: 서로 후보를 넘기지 않는 독립 선별 9개");
report.push("- 예산: 실험군마다 상위 6개, 총 54 슬롯(교차 실험 중복을 제거하지 않아 51개 고유 원본)");
report.push("- 공통 감사: `27조합 감사 후보 / Merge 재료 / Custom Reserve / 탈락`, 구체성 0~2, 하드 실패 이유");
report.push("- 중요한 제한: `27조합 감사 후보`는 앱 승격이 아니다. 결제자 3 × 순간 3 × 한 끗 3을 실제 작성·감사하기 전의 다음 단계 후보일 뿐이다.");
report.push("");
report.push("## 효과 비교");
report.push("");
report.push("| 실험 | 27조합 후보 | Merge | Reserve | 탈락 | 평균 구체성 | 무작위 대비 후보율 |");
report.push("|---|---:|---:|---:|---:|---:|---:|");
for (const summary of summaries) {
  report.push(`| ${summary.experimentId} | ${summary.counts.promote_27_audit}/6 (${pct(summary.promoteRate)}) | ${summary.counts.merge_material}/6 | ${summary.counts.custom_reserve}/6 | ${summary.counts.reject}/6 (${pct(summary.rejectRate)}) | ${summary.specificityAverage.toFixed(2)} | ${summary.experimentId === "I_random_control" ? "기준선" : signedPp(summary.promoteRate - random.promoteRate)} |`);
}
report.push("");
report.push("### 이번 짧은 실험에서 확인된 것");
report.push("");
report.push("1. `C_tiny_extension`과 `F_pain_language`가 각각 2/6(33.3%)로 무작위 1/6(16.7%)보다 +16.7%p 높았다. 다음 27조합 감사 후보를 찾는 데 가장 유망했다.");
report.push("2. `H_merge_neighbor`는 새 원본 0개지만 Merge 재료 2/6(33.3%)를 찾았다. 새 원본 발굴기가 아니라 기존 32개 카드 보강기로 쓰면 효과가 있다.");
report.push("3. `E_concrete_input`은 평균 구체성 1.67인데도 후보 0/6이었다. 입력 명사만 강조하면 스캐너·QR 같은 기본 기능 군집에 갇힌다.");
report.push("4. `B_korean_behavior`는 국내 차트 신호가 Instagram·ChatGPT·Spotify 같은 플랫폼 소유자를 올려 후보 0/6이었다. 한국 사용 증거는 선별 시작점보다 후보 검증 피처로 쓰는 편이 낫다.");
report.push("5. `D_problem_lenses`는 새 후보 0개지만 Merge 1개와 Reserve 3개를 찾았다. 문제 렌즈는 일반 앱 승격보다 교육·건강·플랫폼 정책이 걸린 전문 후보 분리에 유용했다.");
report.push("6. `G_novel_outlier`는 새 후보 1개와 Reserve 2개를 찾았다. 새 영역을 넓히지만 도메인·플랫폼 의존 후보가 늘어나는 대가가 있다.");
report.push("");
report.push("## 27조합 감사를 진행할 후보 6개");
report.push("");
for (const row of audited.filter((row) => row.audit_decision === "promote_27_audit")) {
  report.push(`- **${row.name}** (${row.experiment_id}) — ${row.audit_reason}`);
}
report.push("");
report.push("교차 실험 중복을 포함한 54 슬롯에서 6개가 다음 감사로 올라갔다. 이 6개를 모두 앱에 넣는다는 뜻은 아니며, 먼저 27조합을 써 보고 27개 전부 자연스러운 원본만 승격한다.");
report.push("");
report.push("## 실험군별 6개 감사");
report.push("");
for (const experimentId of experimentOrder) {
  const items = audited.filter((row) => row.experiment_id === experimentId);
  report.push(`### ${experimentId}`);
  report.push("");
  report.push(`가설: ${items[0].hypothesis}`);
  report.push("");
  report.push("| 순위 | 원본 | 판정 | 구체성 | 이유 |");
  report.push("|---:|---|---|---:|---|");
  for (const row of items) {
    report.push(`| ${row.experiment_rank} | ${row.name.replaceAll("|", "\\|")} | ${decisionLabels[row.audit_decision]} | ${row.specificity}/2 | ${row.audit_reason.replaceAll("|", "\\|")} |`);
  }
  report.push("");
}
report.push("## 다음 짧은 병렬 회차");
report.push("");
report.push("- 승자 두 실험을 그대로 반복하지 않고 각각 약점을 한 가지씩 고친 변형을 독립 비교한다.");
report.push("  - `C2`: 확장프로그램 중 회의요약·범용 AI를 제외하고, 현재 페이지에서 결과가 보이는 후보만 선별");
report.push("  - `F2`: 통증 언어 + 결제 손실·마감·누락 같은 측정 가능한 결과를 동시에 요구");
report.push("- 대조군은 같은 방식의 무작위 6개를 유지한다.");
report.push("- 각 실험은 다시 6개만 감사하고, 후보율이 대조군보다 높고 탈락률이 낮을 때만 30개 규모로 확장한다.");
report.push("- 장기 전수검토 원장과 배치 매니페스트는 누락 방지 인프라로만 사용하며 병렬 실험의 후보 전달 구조로 사용하지 않는다.");
report.push("");
report.push("## 파일");
report.push("");
report.push("- 추출 슬롯: `docs/research/idea-source-parallel-pilot.jsonl`");
report.push("- 동일 기준 감사: `docs/research/idea-source-parallel-pilot-audit.jsonl`");
report.push("- 재현 스크립트: `scripts/research/build-idea-parallel-pilot.mjs`, `scripts/research/audit-idea-parallel-pilot.mjs`");

fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(JSON.stringify({
  audited: audited.length,
  promoted: audited.filter((row) => row.audit_decision === "promote_27_audit").length,
  merge: audited.filter((row) => row.audit_decision === "merge_material").length,
  reserve: audited.filter((row) => row.audit_decision === "custom_reserve").length,
  rejected: audited.filter((row) => row.audit_decision === "reject").length,
  summaries,
  outputPath,
  reportPath,
}, null, 2));
