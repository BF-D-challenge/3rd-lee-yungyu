import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "docs/research/idea-task2-filter-top6.jsonl");
const OUTPUT_PATH = path.join(ROOT, "docs/research/idea-task2-filter-top6-audit.jsonl");
const REPORT_PATH = path.join(
  ROOT,
  "docs/dev/experiments/idea-lab/task2-filter-experiment-top6-2026-07-13.md",
);

const rows = fs.readFileSync(INPUT_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// 모든 필터에 같은 하드게이트를 적용한다. 경쟁 앱 존재 자체는 실패 이유가 아니다.
const decisions = new Map(Object.entries({
  "chrome_web_store:bagapgnffhmfccajdbbjcgalkphdjccn": ["reject", "commodity_ai", "LinkedIn 글쓰기 개선이라는 설명만 있고 고유 입력·검사 기준·소유 결과가 없다."],
  "chrome_web_store:gjojcncjnnbbpiegeaifacnbmknddohf": ["deep_review", null, "공개 여행 영상 URL→장소·시점 추출→지도·경로는 문제 뒤 바로 시작하고 결과가 선명하다."],
  "chrome_web_store:liecbddmkiiihnedobmlmillhodjkdmb": ["reject", "broad_existing_tool", "화면·카메라 녹화와 공유 전체 제품이며 한 작업으로 좁힌 새 원본이 아니다."],
  "chrome_web_store:kipefhbblcjblnkcnclpmlpfcflghooh": ["reject", "platform_policy", "LinkedIn 검색 결과 대량 수집은 플랫폼 정책과 DOM 변화에 핵심 가치가 종속된다."],
  "chrome_web_store:ffcagicmpkdoofbhjamgefjnggkbbgfg": ["reject", "platform_policy", "WhatsApp 초대·연락처 링크 대량 수집은 플랫폼 정책과 스팸성 리드 수집 위험이 크다."],
  "chrome_web_store:pfdemlpmcgaabgdldjfklmaeieaamaap": ["deep_review", null, "현재 공개 URL→제목·태그·링크·헤딩 누락표는 즉시 작동하고 1~2일 세로 조각으로 줄일 수 있다."],

  "app_store:368494609": ["reject", "platform_default", "QR·바코드·문서 스캔은 휴대폰 기본 카메라와 기본 스캔이 더 직접적이다."],
  "app_store:338010821": ["reject", "regulated_platform", "은행·카드 계좌 운영 전체이며 결과와 권한을 금융기관이 소유한다."],
  "app_store:708423616": ["reject", "platform_default", "할 일·프로젝트·동기화 전체 앱으로 OS 기본 할 일보다 좁은 고유 결과가 없다."],
  "app_store:1049234587": ["reject", "content_scope", "운동 프로그램·커뮤니티·트레이너 콘텐츠 전체가 필요해 1인 1~3화면 MVP가 아니다."],
  "app_store:1596403446": ["reject", "platform_default", "습관·기분·루틴 추적 전체이며 기본 앱과 기존 습관 도구보다 유일한 결과가 없다."],
  "app_store:1458862350": ["reject", "content_and_social_scope", "운동 기록·영상·친구 비교·루틴 전체로 콘텐츠와 네트워크 효과가 필요하다."],

  "app_store:1193801909": ["reject", "regulated_platform", "현금 선지급·은행계좌·상환 자격 판정은 규제 금융 인프라다."],
  "app_store:1574460221": ["reject", "content_scope", "개인화 운동 과정과 대규모 운동 콘텐츠 전체가 핵심이라 작은 변환 도구로 줄이기 어렵다."],
  "app_store:407558537": ["reject", "regulated_platform", "은행 계정·결제·대출·송금·신용 관리 전체 서비스다."],
  "app_store:1191985736": ["reject", "regulated_platform", "은행·투자·가상자산을 묶은 금융 플랫폼 전체다."],
  "trustmrr:commenthunter-click-extract-social-media-comments": ["merge_material", null, "소셜 URL→댓글 CSV는 기존 social-comment-guard가 받을 입력 파일을 만드는 수집 카드 재료다."],
  "app_store:650276551": ["reject", "content_scope", "7분 운동 콘텐츠·개인 계획·친구 경쟁을 묶은 운동 서비스로 결과가 콘텐츠에 의존한다."],

  "app_store:1472638797": ["reject", "content_scope", "개인 목표별 운동 프로그램·수백 개 운동 콘텐츠·장기 추적 전체가 필요하다."],
  "app_store:6478868302": ["merge_material", null, "텍스트·사진→숏폼 영상은 기존 story-short-video의 입력·장면·결과 카드 재료다."],
  "chrome_web_store:pclnmcdoklijjnfmblmknfolodjhllle": ["custom_reserve", "inventory_and_integration", "교사용 짧은 영상 큐레이션은 좋지만 검수된 영상 재고와 Google Slides 연동 채널이 필요하다."],
  "chrome_web_store:pbnncbpphfheokgambglknpokckilmph": ["deep_review", null, "현재 URL→Schema.org 구조화 데이터 오류·미리보기·수정 JSON-LD는 즉시 결과가 생기는 좁은 작업이다."],
  "app_store:539355986": ["reject", "platform_default", "달력·일정·위젯·공유 전체는 OS 달력과 위젯이 더 직접적이다."],
  "chrome_web_store:nkkdeadncmkfpmoafagdoanfkipoogkl": ["deep_review", null, "현재 웹페이지→사용자가 고른 필드→구조화 CSV는 단일 페이지 권한과 즉시 내보내기로 줄일 수 있다."],

  "app_store:1398002552": ["reject", "physical_platform", "특정 음식점의 주문·결제·매장 찾기 앱으로 재사용할 독립 소프트웨어 메커니즘이 없다."],
  "chrome_web_store:ojplmecpdpgccookcobabopnaifgidhf": ["reject", "precollected_data", "가격 이력은 사용자가 필요한 순간 설치하기 전부터 상품별 데이터가 쌓여 있어야 한다."],
  "app_store:971412288": ["reject", "integration_scope", "전화·문자·리뷰·결제·마케팅 전체를 묶어 여러 채널 연결과 고객 행동이 필수다."],
  "trustmrr:iptv-player-vpn-app-bundle": ["reject", "rights_and_scope", "IPTV 플레이어와 VPN 묶음은 콘텐츠 권리·네트워크·다중 플랫폼 전체 사업이다."],

  "app_store:1531983371": ["reject", "platform_default", "Apple Health·Watch 데이터를 다시 보여주는 대시보드로 기본 건강 앱보다 좁은 고유 결과가 없다."],
  "app_store:1462419097": ["reject", "platform_default", "Gmail 계정을 지속 연동하는 대체 메일 클라이언트이며 Gmail 기본 앱보다 직접적이지 않다."],

  "trustmrr:ticketdesk-ai": ["custom_reserve", "integration_and_counterparty", "지식베이스 답변 자동화는 고객지원 채널·정확도 운영·고객 응답이 필요한 커스텀 구축이다."],
  "trustmrr:ai-headshot-generator": ["reject", "commodity_ai", "기업용 AI 헤드샷 생성은 무료·범용 이미지 AI와 구분할 고유 작업이 없고 매출도 0이다."],
  "app_store:975017240": ["reject", "platform_default", "포모도로 타이머와 할 일은 OS 타이머·수많은 무료 도구가 더 간단하다."],
  "app_store:1230088754": ["reject", "regulated_platform", "CFD 거래·입출금·리스크 관리 전체는 규제 금융 플랫폼이다."],
  "chrome_web_store:ohhjfajndpfpbimipmehmdkblnbelaec": ["reject", "weak_payer", "커서 애니메이션은 즉시 작동하지만 반복 통증과 자연스러운 결제자 3개가 없다."],
  "chrome_web_store:pfjnkpmfmmnmhppfoemcgpedgcnajbed": ["reject", "insufficient_description", "이름 외에 입력·처리·결과·사용 순간을 판단할 설명이 없다."],
}));

const audited = rows.map((row) => {
  const decision = decisions.get(row.key);
  if (!decision) throw new Error(`Missing audit for ${row.key}`);
  const [audit_decision, hard_failure, audit_reason] = decision;
  return { ...row, audit_decision, hard_failure, audit_reason };
});

fs.writeFileSync(OUTPUT_PATH, `${audited.map((row) => JSON.stringify(row)).join("\n")}\n`);

const experimentIds = [...new Set(audited.map((row) => row.experiment_id))];
const summaries = experimentIds.map((experimentId) => {
  const subset = audited.filter((row) => row.experiment_id === experimentId);
  const count = (decision) => subset.filter((row) => row.audit_decision === decision).length;
  return {
    experiment_id: experimentId,
    label: subset[0].experiment_label,
    deep_review: count("deep_review"),
    merge_material: count("merge_material"),
    custom_reserve: count("custom_reserve"),
    reject: count("reject"),
    candidate_rate: count("deep_review") / subset.length,
  };
});
const random = summaries.find((row) => row.experiment_id === "G_random_control");
for (const summary of summaries) {
  summary.lift_vs_random = summary.candidate_rate - random.candidate_rate;
}

const decisionLabel = {
  deep_review: "정밀검사 후보",
  merge_material: "Merge 재료",
  custom_reserve: "Custom Reserve",
  reject: "탈락",
};
const report = [];
report.push("# TASK 2 필터 실험 — 상위 6개 직접 감사");
report.push("");
report.push("작성일: 2026-07-13");
report.push("");
report.push("## 결과");
report.push("");
report.push("| 필터 | 정밀검사 후보 | Merge | Reserve | 탈락 | 무작위 대비 |");
report.push("|---|---:|---:|---:|---:|---:|");
for (const summary of summaries) {
  report.push(`| ${summary.experiment_id} — ${summary.label} | ${summary.deep_review}/6 | ${summary.merge_material}/6 | ${summary.custom_reserve}/6 | ${summary.reject}/6 | ${(summary.lift_vs_random * 100).toFixed(1)}%p |`);
}
report.push("");
report.push("무작위는 0/6이었다. 1차 승자는 2/6을 찾은 `A_immediate_result`, `D_pass_near_fail_far`다. 두 방법만 30개 규모로 확장한다.");
report.push("");
for (const experimentId of experimentIds) {
  const subset = audited.filter((row) => row.experiment_id === experimentId);
  report.push(`## ${experimentId} — ${subset[0].experiment_label}`);
  report.push("");
  report.push("| 순위 | 실제 원본 | 판정 | 이유 |");
  report.push("|---:|---|---|---|");
  for (const row of subset) {
    report.push(`| ${row.experiment_rank} | ${row.name} | ${decisionLabel[row.audit_decision]} | ${row.audit_reason} |`);
  }
  report.push("");
}
report.push("## 판정 원칙");
report.push("");
report.push("- 경쟁 앱이 있다는 이유만으로 탈락시키지 않았다.");
report.push("- 이미 받은 URL·파일·내역·단일 권한으로 문제 뒤 시작할 수 있는지 확인했다.");
report.push("- 제품이 직접 만들 수 있는 결과가 없거나 플랫폼·상대방이 결과를 소유하면 탈락 또는 Reserve로 분리했다.");
report.push("- 기존 앱과 같은 메커니즘이면 새 원본 수가 아니라 Merge로 기록했다.");

fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`);

process.stdout.write(`${JSON.stringify({
  slots: audited.length,
  uniqueCandidates: decisions.size,
  summaries,
  winners: summaries
    .filter((row) => row.experiment_id !== "G_random_control")
    .sort((left, right) => right.candidate_rate - left.candidate_rate)
    .slice(0, 2)
    .map((row) => row.experiment_id),
  output: path.relative(ROOT, OUTPUT_PATH),
  report: path.relative(ROOT, REPORT_PATH),
}, null, 2)}\n`);
