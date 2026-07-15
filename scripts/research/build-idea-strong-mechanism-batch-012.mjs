#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const researchDir = path.join(root, "docs/research");
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const candidates = new Map(
  readJsonl("docs/research/idea-candidate-mechanism-clusters-2026-07-14.jsonl")
    .map((row) => [row.key, row]),
);
const appKeys = new Set(
  JSON.parse(fs.readFileSync(path.join(researchDir, "idea-app-portfolio.json"), "utf8"))
    .map((row) => row.source_key),
);
const priorBatchKeys = new Set();
for (const filename of fs.readdirSync(researchDir)) {
  if (!/^idea-strong-mechanism-batch-(00[1-9]|01[01])-(input|.*card-drafts).*\.jsonl$/.test(filename)) continue;
  for (const line of fs.readFileSync(path.join(researchDir, filename), "utf8").split(/\r?\n/).filter(Boolean)) {
    const row = JSON.parse(line);
    if (row.source_key) priorBatchKeys.add(row.source_key);
  }
}

const contracts = [
  {
    source_key: "app_store:1575583991",
    selection_reason: "iOS가 내보낸 난해한 NDJSON 파일 하나를 앱별 권한·네트워크 활동표로 바꾸는 개인정보 전문 분석이다.",
    prior_review_feedback: "입력은 iOS 설정에서 내보낸 App Privacy Report NDJSON 파일 하나다. payer는 모바일 보안 담당자·앱 QA 엔지니어·개인정보 감사 컨설턴트처럼 앱의 권한·통신 내역을 직접 점검하는 사람으로 쓴다. 세 moment는 배포 전 개인정보 검수, 고객 문의 원인 확인, 감사 보고서 작성 직전처럼 모든 payer가 로그 근거를 읽어야 하는 상황이어야 한다. 세 twist는 권한 접근 시간표, 앱별 외부 도메인 목록, 새로 발생한 활동 요약처럼 같은 NDJSON 파싱 결과의 표시 초점만 바꾼다. 실시간 감시·네트워크 차단·법적 위반 판정은 넣지 않는다.",
  },
  {
    source_key: "app_store:1468880337",
    selection_reason: "바이너리 파일 하나에서 시그니처·바이트 빈도·검색 위치를 꺼내 파일 정체와 손상 구간 확인을 돕는다.",
    prior_review_feedback: "입력은 Files 앱에서 고른 바이너리 파일 하나다. payer는 펌웨어 개발자·디지털 포렌식 실무자·파일 복구 기사처럼 원시 바이트를 직접 확인하는 사람으로 쓴다. 세 moment는 파일 형식 판별, 손상 구간 확인, 특정 바이트 패턴 검수 직전처럼 모든 payer가 헥스 근거를 읽어야 하는 상황이어야 한다. 세 twist는 감지된 파일 시그니처, 가장 많은 바이트 빈도, 검색 패턴의 오프셋 목록처럼 동일 파일 분석 결과만 바꾼다. 파일 편집·복구 실행·여러 파일 비교는 넣지 않는다.",
  },
  {
    source_key: "app_store:6749187530",
    selection_reason: "재료·용량·당도·도수 한 묶음에서 얼기 좋은 슬러시 배합 조정량을 계산해 재료 낭비를 막는다.",
    prior_review_feedback: "입력은 현재 재료량·배치 용량·당도·알코올 도수를 적은 텍스트 한 덩어리다. payer는 카페 메뉴 개발자·행사 음료 케이터링 운영자·소형 바 매니저처럼 냉동 음료 배합 결과에 책임지는 사람으로 쓴다. 세 moment는 첫 배치 투입, 얼지 않는 배합 수정, 행사 인원에 맞춘 증량 직전처럼 모든 payer가 재료를 붓기 전에 계산해야 하는 상황이어야 한다. 세 twist는 추가할 설탕량, 추가할 물의 양, 목표 용량에 맞춘 재료표처럼 같은 Brix·ABV·용량 계산 결과만 바꾼다. 레시피 추천 채팅·재료 구매·기계 제어는 넣지 않는다.",
  },
  {
    source_key: "app_store:6761405215",
    selection_reason: "App Store 앱 이름 하나로 발표·기사·비교표에 바로 쓸 고해상도 PNG 아이콘을 꺼낸다.",
    prior_review_feedback: "입력은 App Store에 등록된 앱 이름 하나이고 결과는 고해상도 PNG 파일 하나다. payer는 앱 비교 자료를 만드는 디자이너·앱 리뷰 기자·모바일 제품 마케터처럼 앱 아이콘을 반복해서 확보하는 사람으로 쓴다. 세 moment는 발표 자료 마감, 리뷰 기사 발행, 경쟁 앱 비교표 제작 직전처럼 모든 payer가 깨끗한 아이콘 파일을 필요로 하는 상황이어야 한다. 세 twist는 1024px 원본, iOS 둥근 마스크 적용본, 투명 여백을 정리한 PNG처럼 같은 아이콘 조회·가공 결과만 바꾼다. 로고 재디자인·상표 사용 허가·여러 앱 일괄 수집은 넣지 않는다.",
  },
  {
    source_key: "app_store:6752672420",
    selection_reason: "FITS 천체 이미지 하나를 플레이트 솔빙해 실제 하늘 좌표가 표시된 차트로 놓는 전문 관측 결과다.",
    prior_review_feedback: "입력은 천체 관측용 FITS 이미지 파일 하나다. payer는 아마추어 천체사진가·학교 천문 동아리 지도교사·소형 천문대 운영자처럼 촬영한 천체의 위치를 직접 확인하는 사람으로 쓴다. 세 moment는 관측 직후 촬영 대상 확인, 다음 촬영 구도 수정, 관측 기록 제출 직전처럼 모든 payer가 이미지의 하늘 위치를 확인해야 하는 상황이어야 한다. 세 twist는 중심 좌표가 찍힌 하늘 차트, 촬영 영역 경계 오버레이, 식별된 주요 천체 라벨처럼 같은 플레이트 솔빙 결과의 표시만 바꾼다. 망원경 제어·실시간 카메라 연결·관측 계획 전체는 넣지 않는다.",
  },
  {
    source_key: "app_store:842218231",
    selection_reason: "마이크에 부른 짧은 한 소절을 시간별 음정 그래프로 바꿔 어느 음에서 벗어났는지 바로 보여준다.",
    prior_review_feedback: "입력은 한 사람이 부른 짧은 한 소절의 단일 기기 마이크 입력이다. payer는 보컬 레슨 강사·합창단 파트 지도자·녹음 전 음정을 점검하는 가수처럼 단선율 음정을 직접 교정하는 사람으로 쓴다. 세 moment는 레슨 피드백, 합창 파트 연습, 녹음 테이크 시작 직전처럼 모든 payer가 음정 이탈 구간을 확인해야 하는 상황이어야 한다. 세 twist는 시간별 음정 그래프, 목표 음과의 센트 차이, 가장 크게 벗어난 구간 표시처럼 같은 피치 분석 결과만 바꾼다. 여러 사람·화음·노래 평가 점수·반주 생성은 넣지 않는다.",
  },
  {
    source_key: "app_store:6444574623",
    selection_reason: "열리지 않는 ODT 파일 하나를 상대방이 바로 편집할 수 있는 DOCX 파일 하나로 변환한다.",
    prior_review_feedback: "입력은 ODT 문서 파일 하나이고 결과는 DOCX 문서 파일 하나로 고정한다. payer는 행정 문서를 주고받는 사무 담당자·수업 자료를 배포하는 교사·문서 납품 프리랜서처럼 호환 파일을 전달해야 하는 사람으로 쓴다. 세 moment는 외부 제출, 수업 자료 공유, 고객 수정 요청 전달 직전처럼 모든 payer가 Word에서 열리는 파일을 필요로 하는 상황이어야 한다. 세 twist는 원본 서식 보존 DOCX, 표 구조 우선 DOCX, 이미지 배치 우선 DOCX처럼 같은 ODT 변환 결과의 보존 초점만 바꾼다. ODS·XLSX·문서 편집·여러 파일 일괄 변환은 넣지 않는다.",
  },
  {
    source_key: "app_store:404167677",
    selection_reason: "로컬 네트워크 권한 한 번으로 지금 연결된 기기의 IP·MAC·상태 목록을 만들어 낯선 장치를 찾는다.",
    prior_review_feedback: "입력은 단일 기기의 로컬 네트워크 권한이다. payer는 소규모 사무실 IT 담당자·공유 작업실 운영자·매장 네트워크 설치 기사처럼 현장 네트워크 장치를 직접 점검하는 사람으로 쓴다. 세 moment는 새 장비 설치, 인터넷 장애 점검, 낯선 기기 문의 확인 직전처럼 모든 payer가 현재 장치 목록을 확인해야 하는 상황이어야 한다. 세 twist는 IP·MAC 장치표, 이전 스캔 대비 새 장치 표시, 응답 없는 장치 목록처럼 같은 LAN 스캔 결과의 표시만 바꾼다. 포트 공격·기기 차단·원격 접속·지속 감시는 넣지 않는다.",
  },
  {
    source_key: "app_store:428087720",
    selection_reason: "두께·외경·심지 지름 한 묶음에서 남은 롤 재료 길이를 계산해 발주와 절단 판단을 돕는다.",
    prior_review_feedback: "입력은 재료 두께·롤 외경·심지 지름을 적은 텍스트 한 덩어리다. payer는 인쇄소 자재 담당자·필름 가공 공장 반장·원단 롤 재고 관리자처럼 롤 잔량을 기준으로 작업을 결정하는 사람으로 쓴다. 세 moment는 다음 작업 배정, 추가 자재 발주, 고객 주문 길이 수락 직전처럼 모든 payer가 롤의 예상 길이를 알아야 하는 상황이어야 한다. 세 twist는 미터 기준 예상 길이, 피트 기준 예상 길이, 오차 가능 범위가 붙은 길이처럼 같은 롤 길이 공식의 표시만 바꾼다. 카메라 측정·자동 발주·재고 시스템 연동은 넣지 않는다.",
  },
  {
    source_key: "app_store:1020967894",
    selection_reason: "GPS 권한 한 번에서 위성·좌표 상태를 읽어 위치가 늦거나 튀는 원인을 현장에서 진단한다.",
    prior_review_feedback: "입력은 단일 기기의 GPS 위치 권한이다. payer는 현장 측량 보조자·야외 배송 기사 관리자·위치 기반 앱 QA 엔지니어처럼 기기 위치 상태를 직접 점검하는 사람으로 쓴다. 세 moment는 현장 좌표 기록, 배송 경로 출발, 위치 오류 재현 직전처럼 모든 payer가 신뢰 가능한 위치 수신 상태를 확인해야 하는 상황이어야 한다. 세 twist는 현재 좌표·정확도 카드, 위치 고정 지연 원인 요약, 고도·방향을 포함한 진단표처럼 같은 GPS 상태 분석 결과만 바꾼다. 위치 정확도 보장·GPS 수리·지속 경로 추적은 넣지 않는다.",
  },
];

if (contracts.length !== 10) throw new Error(`Expected 10 contracts, got ${contracts.length}`);
const duplicateKeys = contracts.filter((contract, index) => contracts.findIndex((row) => row.source_key === contract.source_key) !== index);
if (duplicateKeys.length > 0) throw new Error(`Duplicate contracts: ${duplicateKeys.map((row) => row.source_key).join(", ")}`);

const rows = contracts.map((contract, index) => {
  const source = candidates.get(contract.source_key);
  if (!source) throw new Error(`Missing source: ${contract.source_key}`);
  if (!contract.source_key.startsWith("app_store:")) throw new Error(`Not app_store: ${contract.source_key}`);
  if (source.decision !== "Candidate") throw new Error(`Not a Candidate: ${contract.source_key}`);
  if (appKeys.has(contract.source_key)) throw new Error(`Source is already in app: ${contract.source_key}`);
  if (priorBatchKeys.has(contract.source_key)) throw new Error(`Source already appeared in batch 001-011 input/card drafts: ${contract.source_key}`);
  return {
    source_key: source.key,
    name: source.name,
    url: source.url,
    category: source.category ?? source.dataset,
    source_text: source.source_text,
    five_sentences: source.five_sentences,
    market_signal: source.market_signal,
    ...contract,
    source_url: source.url,
    batch_rank: index + 1,
  };
});

const output = "docs/research/idea-strong-mechanism-batch-012-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");

const summaryPath = "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-012-selection-2026-07-15.md";
const lines = [
  "# 강한 메커니즘 배치 012 — 미검수 App Store 전문 도구 10개",
  "",
  `- 카드 작성 대상: ${rows.length}개`,
  "- 공통 조건: `app_store:` Candidate, 배치 001~011 입력·카드 초안 미등장, 현재 89개 앱 포트폴리오 미포함",
  "- 우선순위: 전문 작업의 입력 1개 → 처리 1회 → 결과 1개",
  "- 앱 반영: 아직 하지 않음",
  "",
  "| 순서 | 원본 | 선택 이유 |",
  "|---:|---|---|",
  ...rows.map((row) => `| ${row.batch_rank} | ${row.name.replace(/\|/g, "\\|")} | ${row.selection_reason} |`),
  "",
];
fs.writeFileSync(path.join(root, summaryPath), lines.join("\n"));
console.log(JSON.stringify({ selected: rows.length, appCount: appKeys.size, excludedPriorBatchSources: priorBatchKeys.size, output, summaryPath }, null, 2));
