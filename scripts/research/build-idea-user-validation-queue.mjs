import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reauditPath = path.join(root, 'docs/dev/experiments/idea-lab/idea-portfolio-reaudit-v2.md');
const auditPath = path.join(root, 'scripts/research/audit-moment-access-70.mjs');
const baseQueuePath = path.join(root, 'docs/dev/experiments/idea-lab/archive/queues/idea-user-validation-queue-62.jsonl');
const currentBatchAuditPath = path.join(root, 'docs/dev/experiments/idea-lab/idea-current-batch-01-ux-product-audit.md');
const remainingAuditPath = path.join(root, 'docs/dev/experiments/idea-lab/idea-remaining-39-final-audit.md');
const outputPath = path.join(root, 'docs/dev/experiments/idea-lab/idea-user-validation-queue-current.jsonl');
const summaryPath = path.join(root, 'docs/dev/experiments/idea-lab/idea-user-validation-queue-current.md');
const ledgerPath = path.join(root, 'docs/research/idea-final-decisions-62.jsonl');

const preReviewExclusions = new Map([
  ['A08-05', { status: 'Merge', gate: 'market-breadth', reason: '계약 종료 + 미반환 + 분할 반환 합의가 겹치는 희소 조건이라 이사반납/금전 약속 대조의 변형으로 흡수', mergedInto: '이사반납' }],
  ['D08-01', { status: 'Fail', gate: 'platform-owner', reason: 'iOS·Android 공식 기기 이전이 실행권과 원본 상태를 보유하고 제3자 MVP는 수동 표본 확인만 추가' }],
  ['D08-02', { status: 'Fail', gate: 'platform-owner', reason: 'OS·클라우드 백업 서비스가 백업 범위와 복원 실행권을 보유하고 제3자 앱은 시스템 복원을 검증할 권한이 없음' }],
  ['D08-03', { status: 'Fail', gate: 'platform-owner', reason: '사진 클라우드가 항목별·전체 백업 상태를 직접 제공하고 제3자 앱은 같은 사진 권한과 계정 연결을 다시 요구' }],
  ['D08-07', { status: 'Fail', gate: 'platform-owner', reason: '기기 제조사의 수리·Maintenance Mode가 개인정보 격리를 직접 실행하며 제3자 앱은 체크리스트만 제공' }],
  ['D08-22', { status: 'Fail', gate: 'platform-owner', reason: 'OS가 공장 초기화와 계정 제거를 직접 실행하고 제3자 앱은 초기화 뒤 기기 내부 상태를 검증할 수 없음' }],
  ['B06-24', { status: 'Fail', gate: 'commodity-ai', reason: '메모와 PDF의 일회성 차이표라 범용 AI로 즉시 대체되고 기존 계약 비교 그룹과 중복' }],
  ['D06-07', { status: 'Fail', gate: 'platform-owner', reason: '항공사가 예약 원문과 수정 가능 여부를 소유하며 제3자는 민감한 여권 문자열 비교만 제공' }],
  ['D08-10', { status: 'Fail', gate: 'platform-owner', reason: '각 계정 제공자가 인증 상태를 소유하고 제3자 MVP는 저빈도 수동 체크리스트에 머묾' }],
  ['D12', { status: 'Fail', gate: 'counterparty-dependency', reason: '기사가 새 링크를 확인해야만 가치가 완성되지만 소비자가 그 행동을 강제할 수 없음' }],
  ['A06-04', { status: 'Fail', gate: 'platform-owner', reason: '보험사 안내와 은행 입금의 단순 차감이며 기존 원본 UX 0/3, 같은 대조 후보와 중복' }],
  ['A06-17', { status: 'Custom Reserve', gate: 'domain-knowledge', reason: '보험사별 제출·승인 지식이 필요하고 보상 결정권이 보험사에 있어 도메인형 재료로만 보관' }],
  ['A15', { status: 'Merge', gate: 'portfolio-duplicate', reason: '이미 사용자 통과한 범위밖과 계약 범위·초과 요청·추가금이라는 즉시 결과가 같음', mergedInto: '범위밖' }],
  ['B09-03', { status: 'Merge', gate: 'portfolio-duplicate', reason: 'B09-01의 D+7 첫 결과를 주간 반복으로 확장한 같은 타겟·입력·결과', mergedInto: 'B09-01' }],
  ['A07-02', { status: 'Fail', gate: 'ux', reason: '고정 페르소나 UX 1/3이며 미수금톡·범위밖 조합의 중복 변형' }],
  ['A08-02', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 기존 관리비 급증표와 완전 중복하고 관리 앱이 기본 대안' }],
  ['A08-14', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3이며 정비업체가 보증 처리 상태를 소유' }],
  ['A09-01', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3이며 카드사가 승인·환율·청구 결과를 소유' }],
  ['A07-04', { status: 'Fail', gate: 'ux-commodity-ai', reason: 'UX 1/3, 범용 AI 문서 비교 및 기존 범위밖·검수 기준표와 중복' }],
  ['A09-03', { status: 'Merge', gate: 'portfolio-duplicate', reason: '기존 플랫폼 정산 차이와 주문·정산·입금→차액 결과가 동일', mergedInto: '플랫폼 정산 차이' }],
  ['A09-18', { status: 'Fail', gate: 'platform-owner', reason: 'Stripe·Chargeflow가 증거 패킷 생성과 제출을 직접 자동화해 제3자 수동 MVP가 열세' }],
  ['D09-18', { status: 'Merge', gate: 'portfolio-duplicate', reason: '공방 주문 인계·범위밖의 사양·추가금·승인 결과와 동일', mergedInto: '공방 주문 인계 / 범위밖' }],
  ['A09-23', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 예약 플랫폼·카드사가 환불 상태를 소유하고 기존 환불 추적과 중복' }],
  ['A22', { status: 'Fail', gate: 'market-counterparty', reason: '저빈도 문서 비교이며 집주인 협조·법률 경계·직접 결제 이유가 약함' }],
  ['B05-06', { status: 'Fail', gate: 'market-breadth', reason: '공식 준비물 목록과 개인 체크리스트 대비 결제 이유가 약하고 시장 조건이 좁음' }],
  ['B05-11', { status: 'Merge', gate: 'portfolio-duplicate', reason: 'B05-01 경력성과증거팩의 학습 과제·피드백 전후 카드로 흡수', mergedInto: 'B05-01' }],
  ['B06-17', { status: 'Merge', gate: 'portfolio-duplicate', reason: 'B05-01의 개발자용 입력 변형이며 GitHub가 원본 상태를 소유', mergedInto: 'B05-01' }],
  ['A07-18', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 플랫폼이 보류·검토·지급 상태를 소유하고 기존 정산 차이와 중복' }],
  ['A08', { status: 'Custom Reserve', gate: 'domain-knowledge', reason: '세무 도메인과 실제 보완 통지 고객 채널을 가진 빌더에게만 적합' }],
  ['A09-04', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 플랫폼이 취소·수수료 환급 상태를 직접 처리하고 환불 추적과 중복' }],
  ['A09-12', { status: 'Fail', gate: 'ux-duplicate', reason: 'UX 0/3, 급여차이와 동일하고 홈택스·세무 기준자료 의존' }],
  ['C09-19', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 공공·관리 앱이 원문을 소유하고 기존 관리비 후보와 중복' }],
  ['D06-03', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 관세청·배송사가 통관·납부 상태를 소유하고 저빈도' }],
  ['D06-18', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 여행 앱·예약사가 일정·취소 상태를 소유하고 여행변경팩과 중복' }],
  ['D06-21', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 카드사·결제망이 최종 환율·청구 금액을 소유' }],
  ['B08-01', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 파일시스템·클라우드가 원본 상태를 소유하고 입력 접근도 불완전' }],
  ['B08-10', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, Frame.io가 댓글·버전·승인 상태를 직접 소유' }],
  ['B08-24', { status: 'Fail', gate: 'ux-platform', reason: 'UX 1/3, 발송 도구 Link Checker와 기존 뉴스레터 검수 결과가 동일' }],
  ['B09-09', { status: 'Fail', gate: 'ux-input', reason: 'UX 1/3, 상시 활동 API 없이는 입력이 없고 커뮤니티 플랫폼이 활동 신호를 소유' }],
  ['D08-23', { status: 'Fail', gate: 'ux-security', reason: 'UX 1/3, 기존 계정 복구 봉투와 중복하고 민감정보 위험' }],
  ['D09-07', { status: 'Merge', gate: 'portfolio-duplicate', reason: '기존 정비견적차이의 휴대폰 수리 변형', mergedInto: '정비견적차이' }],
  ['LB04-17', { status: 'Fail', gate: 'ux', reason: '설치형 승인과 무관하게 최종 UX 1/3이라 사용자 규칙상 실패' }],
  ['B06-08', { status: 'Merge', gate: 'portfolio-duplicate', reason: 'B05-01의 지원처별 제출 증거 카드로 흡수', mergedInto: 'B05-01' }],
  ['B07-02', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 골프 레슨·스윙 앱·기본 카메라 대비 우위 없음' }],
  ['B09-15', { status: 'Merge', gate: 'portfolio-duplicate', reason: 'B05-01 성과증거 또는 B09-01 코호트 결과 카드와 중복, 개인정보 동의 필요', mergedInto: 'B05-01 / B09-01' }],
  ['C03-09', { status: 'Fail', gate: 'platform-market', reason: 'UX 2/3이나 캘린더·예약 플랫폼이 같은 미입금·예약 상태를 소유하고 기존 예약금마감 흐름과 중복' }],
  ['D07-02', { status: 'Custom Reserve', gate: 'domain-channel', reason: '반복 행사 고객을 가진 운영자에게는 유효하지만 일반 빌더의 유입·빈도가 약함' }],
  ['D09-16', { status: 'Merge', gate: 'portfolio-duplicate', reason: '기존 예약금마감·공구입금의 판매자 변형', mergedInto: 'C03-09 / 공구입금' }],
  ['B07-05', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, Strava·Garmin이 활동·구간 상태를 소유' }],
  ['C08-20', { status: 'Fail', gate: 'ux-counterparty', reason: 'UX 1/3, 기사·마켓플레이스 양쪽 참여가 필요하고 방문수리 후보와 중복' }],
  ['C09-17', { status: 'Fail', gate: 'ux-duplicate', reason: 'UX 0/3, 사진·메모로 충분하고 기존 물품 인계와 중복' }],
  ['LB04-02', { status: 'Fail', gate: 'input-market', reason: 'UX 2/3이나 다른 앱 오디오 접근이 제한되고 한국 반복 결제 근거가 없음' }],
  ['LB04-08', { status: 'Fail', gate: 'ux-commodity-ai', reason: 'UX 1/3, PDF 비교·범용 AI로 대체되고 반복 결제 근거 없음' }],
  ['LC17', { status: 'Custom Reserve', gate: 'domain-channel', reason: '운영자 효용은 있으나 국내 반복 결제·고객 채널 근거가 없어 공동구매 경험자용 보관' }],
  ['A10', { status: 'Custom Reserve', gate: 'domain-knowledge', reason: '세무·프리랜서 고객 채널이 있는 빌더에게 적합하고 일반 사용자는 연 1회' }],
  ['B08-02', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, 파일시스템·편집기가 이동·검수·삭제 상태를 소유' }],
  ['B08-12', { status: 'Fail', gate: 'ux-platform', reason: 'UX 0/3, Canva·YouTube 미리보기·기본 편집기 대비 우위 없음' }],
  ['D07-25', { status: 'Fail', gate: 'platform-market', reason: 'UX 2/3이나 Eventbrite·네이버예약이 체크인 상태를 소유하고 행사별 저빈도' }],
]);

const reviewedPasses = new Map([
  ['B09-01', { status: 'Experiment Pass', gate: 'all-gates-pass', reason: 'UX 3/3, 외부 첫 결과물 상태를 소유하며 3화면 MVP와 코호트당 결제가 가능' }],
  ['B05-01', { status: 'Experiment Pass', gate: 'all-gates-pass', reason: 'UX 3/3, 이력서 문장과 원본 파일·수치를 누적 연결해 범용 AI의 일회성 생성과 구분' }],
  ['C11', { status: 'Experiment Pass', gate: 'all-gates-pass', reason: 'UX 3/3, 여러 아이·학교·학원 공지를 주간 준비물·서명 한 장으로 합치는 횡단 결과' }],
  ['LC11', { status: 'Experiment Pass', gate: 'all-gates-pass', reason: 'UX 3/3, 국내 유료 펫시팅의 돌봄일지 결과를 독립 펫시터용 최소판으로 제공 가능' }],
]);

const earlyUxConsensus = new Map([
  ['A08-05', '1/3'],
  ['D08-01', '1/3'],
  ['D08-02', '3/3'],
  ['D08-03', '1/3'],
  ['D08-07', '1/3'],
  ['D08-22', '3/3'],
  ['B06-24', '2/3'],
  ['D06-07', '1/3'],
  ['D08-10', '1/3'],
  ['D12', '3/3'],
  ['A06-04', '0/3'],
  ['A06-17', '0/3'],
  ['A15', '2/3'],
]);

const finalTitleOverrides = new Map([
  ['B09-01', '첫결과 구조대 — 결제한 수강생 중 7일째 결과물 0개인 사람만'],
]);

function collectUxConsensus(markdown, result) {
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const columns = line.split('|').map((value) => value.trim());
    const id = columns[1];
    const consensus = columns.find((value) => /^[0-3]\/3$/.test(value));
    if (id && consensus && !result.has(id)) result.set(id, consensus);
  }
}

const audit = JSON.parse(execFileSync(process.execPath, [auditPath], { encoding: 'utf8' }));
const reaudit = fs.readFileSync(reauditPath, 'utf8');
const baseQueue = fs.readFileSync(baseQueuePath, 'utf8').trim().split(/\r?\n/).map(JSON.parse);
const baseRank = new Map(baseQueue.map((item) => [item.id, item.rank]));
const scored = new Map();

for (const line of reaudit.split(/\r?\n/)) {
  const columns = line.split('|').map((value) => value.trim());
  if (columns.length < 6) continue;
  const id = columns[1];
  const lane = columns[2];
  const score = Number(columns[4]);
  if (!id || !['B2C', '1인 B2B'].includes(lane) || !Number.isFinite(score)) continue;
  if (!scored.has(id)) {
    scored.set(id, {
      id,
      lane: lane === '1인 B2B' ? 'B2B' : 'B2C',
      title: columns[3].replaceAll('*', ''),
      score,
    });
  }
}

const readyBeforePreReview = audit.items
  .filter((item) => item.status === 'Pass')
  .map((item) => {
    const score = scored.get(item.id);
    if (!score) throw new Error(`${item.id}: product score not found`);
    return { ...score, moment: item.moment ?? 2 };
  });

const missingExclusions = [...preReviewExclusions.keys(), ...reviewedPasses.keys()]
  .filter((id) => !readyBeforePreReview.some((item) => item.id === id));
if (missingExclusions.length > 0) {
  throw new Error(`Pre-review exclusions missing from ready input: ${missingExclusions.join(', ')}`);
}

const uxConsensus = new Map(earlyUxConsensus);
collectUxConsensus(fs.readFileSync(currentBatchAuditPath, 'utf8'), uxConsensus);
collectUxConsensus(fs.readFileSync(remainingAuditPath, 'utf8'), uxConsensus);

const finalDecisions = new Map([...preReviewExclusions, ...reviewedPasses]);
const ledger = baseQueue.map((item) => {
  const decision = finalDecisions.get(item.id);
  const consensus = uxConsensus.get(item.id);
  if (!decision) throw new Error(`${item.id}: final decision not found`);
  if (!consensus) throw new Error(`${item.id}: UX consensus not found`);
  return {
    id: item.id,
    title: finalTitleOverrides.get(item.id) ?? item.title,
    lane: item.lane,
    ux_consensus: consensus,
    final_status: decision.status,
    gate: decision.gate,
    reason: decision.reason,
    merged_into: decision.mergedInto ?? null,
  };
});

if (ledger.length !== 62 || new Set(ledger.map((item) => item.id)).size !== 62) {
  throw new Error(`Unexpected final ledger identity totals: ${JSON.stringify({
    rows: ledger.length,
    uniqueIds: new Set(ledger.map((item) => item.id)).size,
  })}`);
}
fs.writeFileSync(ledgerPath, `${ledger.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8');

const ready = readyBeforePreReview.filter((item) =>
  !preReviewExclusions.has(item.id) && !reviewedPasses.has(item.id),
);
const decisionCounts = [...preReviewExclusions.values()].reduce((counts, decision) => {
  counts[decision.status] = (counts[decision.status] || 0) + 1;
  return counts;
}, {});

if (
  decisionCounts.Fail !== 42 ||
  decisionCounts.Merge !== 11 ||
  decisionCounts['Custom Reserve'] !== 5 ||
  reviewedPasses.size !== 4 ||
  preReviewExclusions.size + reviewedPasses.size !== readyBeforePreReview.length
) {
  throw new Error(`Unexpected final decision totals: ${JSON.stringify({
    decisionCounts,
    reviewedPasses: reviewedPasses.size,
    inputReady: readyBeforePreReview.length,
  })}`);
}

const queue = [...ready]
  .sort((left, right) => (baseRank.get(left.id) ?? Infinity) - (baseRank.get(right.id) ?? Infinity))
  .map((item, index) => ({
    rank: index + 1,
    batch: Math.floor(index / 10) + 1,
    slot: (index % 10) + 1,
    ...item,
    validation_status: 'ready',
    user_decision: null,
    user_note: null,
  }));

const batchCounts = queue.reduce((result, item) => {
  result[item.batch] = (result[item.batch] || 0) + 1;
  return result;
}, {});

if (
  queue.length !== 0 ||
  queue.filter((item) => item.lane === 'B2C').length !== 0 ||
  queue.filter((item) => item.lane === 'B2B').length !== 0 ||
  Object.keys(batchCounts).length !== 0
) {
  throw new Error(`Unexpected validation queue totals: ${JSON.stringify({
    queue: queue.length,
    b2c: queue.filter((item) => item.lane === 'B2C').length,
    b2b: queue.filter((item) => item.lane === 'B2B').length,
    batchCounts,
  })}`);
}

fs.writeFileSync(
  outputPath,
  queue.length > 0 ? `${queue.map((item) => JSON.stringify(item)).join('\n')}\n` : '',
  'utf8',
);

const rows = queue.map((item) =>
  `| ${item.rank} | ${item.batch} | ${item.id} | ${item.lane === 'B2B' ? '1인 B2B' : 'B2C'} | ${item.title} | ${item.score} | ${item.validation_status} |`,
).join('\n') || '| - | - | - | - | 남은 후보 없음 | - | completed |';
const summary = `# 아이디어 사용자 검증 큐 — 검토 완료

생성일: 2026-07-13  
근거: [사용 순간 접근성 전체 감사 — 70개](./idea-moment-access-audit-70.md)  
추가 게이트: [플랫폼 주인 우위 재검사](./idea-platform-owner-gate-audit-62.md)  
추가 탈락 기록: [사용자 검토 전 내부 탈락 기록](./idea-pre-review-decisions-2026-07-12.md)  
고정 사용자 문항: [공통 평가표 12문항](./idea-user-evaluation-12.md)  
최종 결정 장부: [idea-final-decisions-62.jsonl](../../../research/idea-final-decisions-62.jsonl)  
기계 판독 큐: \`idea-user-validation-queue-current.jsonl\`

## 운영 방식

- Moment 2 이후 플랫폼 주인 우위·시장 폭·범용 AI·비결제 상대방 협조 게이트까지 통과한 후보만 포함한다.
- 62개 후보의 UX·제품·플랫폼·중복 검사를 모두 완료했다.
- 62개·56개·49개 중간 큐는 \`archive/queues/\` 또는 검증 로그의 폐기 스냅샷이며 현재 대기열로 사용하지 않는다.
- 새 후보는 최종 결정 장부와 ID·핵심 결과를 먼저 대조해 Fail·Merge 변형의 재진입을 막는다.
- 사용자 최종 Yes 전에는 앱 그룹과 현재 런타임 기준 27조합을 추가하지 않는다.

## 집계

- 남은 전체: **0개**
- 누적 Fail: **${decisionCounts.Fail}개**
- 누적 Merge: **${decisionCounts.Merge}개**
- Custom Reserve: **${decisionCounts['Custom Reserve']}개**
- 앱 그룹 승격 후보: **${reviewedPasses.size}개** — B09-01, B05-01, C11, LC11

## 전체 큐

| 순위 | 회차 | ID | 구분 | 제목 | 제품성 | 상태 |
|---:|---:|---|---|---|---:|---|
${rows}
`;
fs.writeFileSync(summaryPath, summary, 'utf8');

process.stdout.write(`${JSON.stringify({
  inputReady: readyBeforePreReview.length,
  excluded: [...preReviewExclusions.entries()].map(([id, decision]) => ({ id, ...decision })),
  decisionCounts,
  reviewedPasses: [...reviewedPasses.entries()].map(([id, decision]) => ({ id, ...decision })),
  queue: queue.length,
  laneCounts: {
    B2C: queue.filter((item) => item.lane === 'B2C').length,
    B2B: queue.filter((item) => item.lane === 'B2B').length,
  },
  batchCounts,
  firstBatch: queue.filter((item) => item.batch === 1),
  ledgerPath,
  outputPath,
  summaryPath,
}, null, 2)}\n`);
