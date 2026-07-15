import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const pilotPath = path.join(root, 'scripts/research/audit-moment-access-pilot-50.mjs');
const pilot = JSON.parse(execFileSync(process.execPath, [pilotPath], { encoding: 'utf8' }));

const remaining = [
  { id: 'D09-16', lane: 'B2B', title: '지역 판매 예약금 확인', moment: 2, status: 'Pass', reach: '공방·농가·지역 판매자 커뮤니티와 반복 주문일', reason: '판매자가 이미 예약 고객과 입금 확인 순간을 직접 소유한다.' },
  { id: 'D09-18', lane: 'B2B', title: '맞춤제작 변경승인', moment: 2, status: 'Pass', reach: '공방·제작자 커뮤니티와 주문별 변경 요청', reason: '제작자가 기존 고객에게 승인 링크를 직접 보낼 수 있다.' },
  { id: 'C10', lane: 'B2C', title: '언박싱 청구팩', moment: 0, status: 'Fail', reach: '독립 채널 없음', reason: '파손을 알기 전 개봉 영상을 찍어야 하지만 분쟁 뒤 제품을 발견하면 이미 늦다.' },
  { id: 'C03-09', lane: 'B2B', title: '노쇼입금판', moment: 2, status: 'Pass', reach: '예약제 1인 사업자 커뮤니티와 매일의 예약 확인', reason: '사업자가 예약 고객과 예약금 확인 순간을 직접 소유한다.' },
  { id: 'C11', lane: 'B2C', title: '부모님공문', moment: 2, status: 'Pass', reach: '학부모 커뮤니티와 매주 반복되는 학교·학원 공지', reason: '희귀 사건이 아니라 새 공지가 올 때마다 다시 생기는 문제다.' },
  { id: 'LB04-02', lane: 'B2C', title: '듣기구간복습', moment: 2, status: 'Pass', reach: '어학시험·쉐도잉 커뮤니티와 반복 학습일', reason: '사용자가 학습 중 막힌 구간을 바로 표시할 수 있고 반복 사용한다.' },
  { id: 'LB04-08', lane: 'B2C', title: '바뀐 장표만', moment: 2, status: 'Pass', reach: '강사·사내교육자 커뮤니티와 매 회차 자료 갱신', reason: '발표 준비 전에 두 PDF를 이미 가지고 있으며 반복 업무다.' },
  { id: 'LB04-17', lane: 'B2C', title: '스크린샷약속', moment: 2, status: 'Pass', reach: '앱스토어 생산성 탐색과 계속 쌓이는 캡처함', reason: '특정 사건 전에 설치할 필요 없이 현재 캡처부터 처리할 수 있다.' },
  { id: 'LC11', lane: 'B2B', title: '펫시터 인계팩', moment: 2, status: 'Pass', reach: '독립 펫시터 커뮤니티와 기존 보호자 고객', reason: '펫시터가 예약 고객과 돌봄 전후 메시지 순간을 직접 소유한다.' },
  { id: 'LC17', lane: 'B2B', title: '공동구매 클레임판', moment: 2, status: 'Pass', reach: '공동구매 운영자·소규모 판매자 커뮤니티', reason: '운영자가 주문·수령·재발송 참가자를 이미 가지고 있다.' },
  { id: 'A08', lane: 'B2B', title: '종소세 보완 큐', moment: 2, status: 'Pass', reach: '프리랜서·1인 사업자 세금 커뮤니티와 보완 통지 검색', reason: '보완 통지를 받은 뒤 시작해도 필요한 원본과 마감이 남아 있다.' },
  { id: 'A10', lane: 'B2B', title: '원천징수 서류함', moment: 2, status: 'Pass', reach: '프리랜서 커뮤니티와 연말·신고 전 반복 마감', reason: '사용자가 의뢰처 목록을 알고 있고 정해진 시기에 직접 검색한다.' },
  { id: 'A15', lane: 'B2B', title: '수정횟수 계산표', moment: 2, status: 'Pass', reach: '디자이너·영상·개발 프리랜서 커뮤니티', reason: '프로젝트마다 수정 요청이 반복되고 제작자가 고객 링크를 직접 보낸다.' },
  { id: 'A22', lane: 'B2C', title: '월세 인상 확인', moment: 2, status: 'Pass', reach: '세입자 커뮤니티와 인상 통지 직후 검색', reason: '통지를 받은 뒤 기존 계약과 메시지로 즉시 시작할 수 있다.' },
  { id: 'B05-01', lane: 'B2C', title: '경력성과증거팩', moment: 2, status: 'Pass', reach: '이직·포트폴리오 커뮤니티와 지원 준비 기간', reason: '기존 프로젝트 파일과 숫자로 지원 시점에도 결과를 만들 수 있다.' },
  { id: 'B05-06', lane: 'B2C', title: '실기준비물장부', moment: 2, status: 'Pass', reach: '종목별 자격증 커뮤니티와 시험 전 준비 검색', reason: '시험일이 예고되고 준비 기간이 있어 필요한 순간에 도달할 수 있다.' },
  { id: 'B05-11', lane: 'B2C', title: '학습과제증명', moment: 2, status: 'Pass', reach: '직무교육·이직 준비 커뮤니티와 과제 제출일', reason: '현재 또는 과거 과제와 피드백으로 시작할 수 있어 사전 설치가 필요 없다.' },
  { id: 'D10', lane: 'B2C', title: '수하물 신고팩', moment: 1, status: 'Hold', reach: '공항 현장 검색은 가능하지만 설치·학습 마찰이 큼', reason: '문제 뒤 시작할 수는 있지만 수하물 벨트에서 즉시 항공사 절차를 밟아야 해 독립 제품 발견 가능성이 낮다.' },
  { id: 'D12', lane: 'B2C', title: '방문수리 확정서', moment: 2, status: 'Pass', reach: '출장수리 예약 뒤 방문 전 바가지·추가금 검색', reason: '예약과 방문 사이 준비 시간이 있고 고장 사진·견적을 이미 가지고 있다.' },
  { id: 'D03', lane: 'B2C', title: '병행수입 보증봉투', moment: 1, status: 'Hold', reach: '구매 시점 도달은 가능하지만 독립 제품 발견 경로가 약함', reason: '판매자 약속을 구매 때 캡처해야 하며 보증 분쟁 뒤 발견하면 상품 페이지가 사라졌을 수 있다.' },
];

const pilotB2BIds = new Set([
  'A07-02', 'A07-04', 'A07-18', 'D07-02', 'D07-25',
  'B08-01', 'B08-02', 'B08-10', 'B08-12', 'B08-24',
  'A09-03', 'A09-04', 'A09-12', 'A09-18',
  'B09-01', 'B09-03', 'B09-09', 'B09-15',
]);

const pilotItems = pilot.items.map((item) => ({
  ...item,
  lane: pilotB2BIds.has(item.id) ? 'B2B' : 'B2C',
}));
const items = [...pilotItems, ...remaining];

const statusCounts = items.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1;
  return result;
}, {});
const generalLaneCounts = items
  .filter((item) => item.status === 'Pass')
  .reduce((result, item) => {
    result[item.lane] = (result[item.lane] || 0) + 1;
    return result;
  }, {});
const reserve = items.filter((item) => item.status !== 'Pass');

if (
  items.length !== 70 ||
  new Set(items.map((item) => item.id)).size !== 70 ||
  remaining.length !== 20 ||
  statusCounts.Pass !== 62 ||
  statusCounts.Hold !== 6 ||
  statusCounts.Fail !== 2 ||
  generalLaneCounts.B2C !== 36 ||
  generalLaneCounts.B2B !== 26 ||
  reserve.length !== 8
) {
  throw new Error(`Unexpected full moment audit totals: ${JSON.stringify({
    items: items.length,
    remaining: remaining.length,
    statusCounts,
    generalLaneCounts,
    reserve: reserve.length,
  })}`);
}

process.stdout.write(`${JSON.stringify({
  sample: items.length,
  statusCounts,
  generalLaneCounts,
  customReserve: reserve.length,
  remainingAudit: {
    sample: remaining.length,
    pass: remaining.filter((item) => item.status === 'Pass').length,
    hold: remaining.filter((item) => item.status === 'Hold').length,
    fail: remaining.filter((item) => item.status === 'Fail').length,
  },
  items,
}, null, 2)}\n`);
