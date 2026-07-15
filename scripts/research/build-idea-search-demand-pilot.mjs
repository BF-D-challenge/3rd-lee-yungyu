import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-30-input.jsonl");
const SUMMARY_PATH = path.join(ROOT, "docs/research/idea-search-demand-pilot-30-input-summary.md");

const readJsonl = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const sourceByKey = new Map(
  readJsonl("docs/research/idea-source-screening-ledger.jsonl").map((row) => [row.key, row]),
);
const auditedByKey = new Map();
for (const relativePath of [
  "docs/research/idea-task2-filter-expanded-30-audit.jsonl",
  "docs/research/idea-task2-filter-top6-audit.jsonl",
]) {
  for (const row of readJsonl(relativePath)) auditedByKey.set(row.key, row);
}

const group = (intent, label, representative, ...alternatives) => ({
  intent,
  label,
  representative,
  keywords: [representative, ...alternatives],
});

// 제품명을 번역한 검색어가 아니라 한국 사용자가 문제를 겪을 때 입력할 표현을 쓴다.
const pilotDefinitions = [
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:1lookup",
    groups: [
      group("problem", "연락처 확인", "이메일 주소 확인", "전화번호 확인", "연락처 확인"),
      group("result", "상대 정보 조회", "회사 정보 조회", "업체 정보 조회", "사업자 정보 확인"),
      group("category", "정보 검증", "이메일 유효성 검사", "전화번호 조회", "연락처 검증"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:bankconv",
    groups: [
      group("problem", "거래내역 정리", "통장 거래내역 엑셀", "은행 거래내역 정리", "계좌내역 엑셀"),
      group("result", "PDF를 표로", "은행 PDF 엑셀 변환", "거래내역 PDF 엑셀", "통장내역 표 변환"),
      group("category", "금융 문서 변환", "거래내역 엑셀 변환", "은행 명세서 변환", "계좌내역 CSV"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:fastpassphoto",
    groups: [
      group("problem", "사진 규격", "여권사진 규격", "증명사진 규격", "비자사진 규격"),
      group("result", "사진 인화", "여권사진 인화", "증명사진 인화", "여권사진 출력"),
      group("category", "증명사진 제작", "여권사진 만들기", "증명사진 만들기", "여권사진 편집"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "app_store:430234732",
    groups: [
      group("problem", "현장 사진 정리", "공사 현장 사진 정리", "현장 점검 사진", "시공 사진 정리"),
      group("result", "사진대지", "공사 사진대지", "현장 사진 보고서", "사진대지 만들기"),
      group("category", "현장 보고", "현장 점검 보고서", "공사 완료 보고서", "시공 보고서"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:due-date-radar",
    groups: [
      group("problem", "문서 기한", "서류 유효기간 관리", "문서 만료일 관리", "계약서 기한 관리"),
      group("result", "만료 알림", "계약 만료일 알림", "문서 기한 알림", "서류 만료 알림"),
      group("category", "기한 관리", "계약 기한 관리", "갱신일 관리", "유효기간 관리"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:text-2-ics",
    groups: [
      group("problem", "일정 옮기기", "문자 일정 등록", "메시지 일정 등록", "텍스트 일정 등록"),
      group("result", "캘린더 파일", "ICS 파일 만들기", "캘린더 파일 만들기", "일정 파일 변환"),
      group("category", "일정 변환", "텍스트 캘린더 변환", "일정 캘린더 등록", "캘린더 자동 등록"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:voice-cleaner",
    groups: [
      group("problem", "녹음 잡음", "녹음 노이즈 제거", "음성 잡음 제거", "녹음 소음 제거"),
      group("result", "깨끗한 음성", "오디오 잡음 제거", "목소리 선명하게", "음질 개선"),
      group("category", "오디오 정리", "AI 노이즈 제거", "음성 파일 정리", "오디오 소음 제거"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "app_store:1130616675",
    groups: [
      group("problem", "모르는 결제", "자동결제 내역 확인", "정기결제 확인", "모르는 구독 결제"),
      group("result", "구독 해지", "구독 결제 해지", "자동결제 해지", "정기결제 취소"),
      group("category", "구독 관리", "구독 내역 관리", "자동결제 관리", "정기결제 관리"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "chrome_web_store:bekopgepchoeepdmokgkpkfhegkeohbl",
    groups: [
      group("problem", "영상 영어 공부", "유튜브 영어 공부", "넷플릭스 영어 공부", "영상으로 영어 공부"),
      group("result", "이중 자막", "넷플릭스 영어 자막", "유튜브 이중 자막", "영어 한글 동시 자막"),
      group("category", "영상 쉐도잉", "유튜브 쉐도잉", "넷플릭스 쉐도잉", "영어 자막 공부"),
    ],
  },
  {
    cohort: "current_app_checkpoint",
    key: "trustmrr:catalister",
    groups: [
      group("problem", "상품 등록", "스마트스토어 상품 등록", "쇼핑몰 상품 등록", "온라인몰 상품 등록"),
      group("result", "대량 업로드", "상품 대량 등록", "스마트스토어 대량 등록", "엑셀 상품 업로드"),
      group("category", "상품표 변환", "상품 엑셀 변환", "스마트스토어 엑셀", "상품 등록 엑셀"),
    ],
  },

  {
    cohort: "stage2_deep_review",
    key: "chrome_web_store:gjojcncjnnbbpiegeaifacnbmknddohf",
    groups: [
      group("problem", "영상 속 장소", "여행 영상 장소 찾기", "릴스 장소 찾기", "유튜브 장소 찾기"),
      group("result", "여행지 지도", "여행 장소 지도", "영상 여행지 지도", "여행 경로 지도"),
      group("category", "여행 경로 추출", "여행 영상 경로", "브이로그 여행지", "릴스 여행 장소"),
    ],
  },
  {
    cohort: "stage2_deep_review",
    key: "chrome_web_store:pfdemlpmcgaabgdldjfklmaeieaamaap",
    groups: [
      group("problem", "검색 노출 문제", "사이트 검색 노출 안됨", "홈페이지 검색 노출", "검색엔진 노출 문제"),
      group("result", "SEO 검사", "SEO 검사", "사이트 SEO 분석", "홈페이지 SEO 분석"),
      group("category", "메타태그 검사", "메타 태그 검사", "SEO 진단", "웹사이트 SEO 체크"),
    ],
  },
  {
    cohort: "stage2_deep_review",
    key: "chrome_web_store:pbnncbpphfheokgambglknpokckilmph",
    groups: [
      group("problem", "구조화 데이터 오류", "구조화 데이터 오류", "스키마 마크업 오류", "JSON-LD 오류"),
      group("result", "리치 결과 검사", "리치 결과 테스트", "구조화 데이터 테스트", "스키마 검사"),
      group("category", "JSON-LD 만들기", "JSON-LD 생성", "스키마 마크업 생성", "구조화 데이터 생성"),
    ],
  },
  {
    cohort: "stage2_deep_review",
    key: "chrome_web_store:nkkdeadncmkfpmoafagdoanfkipoogkl",
    groups: [
      group("problem", "웹 자료 정리", "웹페이지 데이터 추출", "웹사이트 자료 엑셀", "웹페이지 표 추출"),
      group("result", "웹을 엑셀로", "웹 크롤링 엑셀", "웹사이트 엑셀 추출", "웹페이지 CSV"),
      group("category", "노코드 수집", "데이터 스크래핑", "웹 데이터 수집", "노코드 크롤링"),
    ],
  },
  {
    cohort: "stage2_deep_review",
    key: "chrome_web_store:lkcagbfjnkomcinoddgooolagloogehp",
    groups: [
      group("problem", "접근성 오류", "웹 접근성 오류", "홈페이지 접근성 문제", "웹사이트 접근성 문제"),
      group("result", "접근성 검사", "웹 접근성 검사", "홈페이지 접근성 검사", "웹사이트 접근성 진단"),
      group("category", "WCAG 검사", "WCAG 검사", "대체텍스트 검사", "웹 접근성 진단 도구"),
    ],
  },

  {
    cohort: "stage2_reject",
    key: "chrome_web_store:bagapgnffhmfccajdbbjcgalkphdjccn",
    groups: [
      group("problem", "링크드인 글", "링크드인 글쓰기", "링크드인 게시물 작성", "링크드인 콘텐츠"),
      group("result", "게시물 생성", "링크드인 게시물", "링크드인 포스트", "링크드인 글 생성"),
      group("category", "AI 글쓰기", "AI 글쓰기", "SNS 글쓰기 AI", "게시물 생성 AI"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:liecbddmkiiihnedobmlmillhodjkdmb",
    groups: [
      group("problem", "화면 설명", "화면 녹화", "컴퓨터 화면 녹화", "브라우저 화면 녹화"),
      group("result", "녹화 공유", "화면 녹화 공유", "영상 링크 공유", "화면 설명 영상"),
      group("category", "스크린 레코더", "스크린 레코더", "화면 녹화 프로그램", "화면 캡처 영상"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:blckodkdfiedapfpjiobdkedmocgihco",
    groups: [
      group("problem", "문서 듣기", "PDF 읽어주기", "웹페이지 읽어주기", "문서 음성 읽기"),
      group("result", "텍스트 음성", "텍스트 읽어주기", "글자 음성 변환", "문서 음성 변환"),
      group("category", "TTS", "TTS", "텍스트 음성 변환", "AI 음성 읽기"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:dgiglgeckbcbhkdiilhleinfobldljjj",
    groups: [
      group("problem", "오늘 날씨", "오늘 날씨", "주간 날씨", "시간별 날씨"),
      group("result", "날씨 예보", "날씨 예보", "주간 일기예보", "시간별 예보"),
      group("category", "미세먼지", "미세먼지", "대기질", "공기질 지수"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "app_store:368494609",
    groups: [
      group("problem", "코드 스캔", "QR 코드 스캔", "바코드 스캔", "큐알 코드 스캔"),
      group("result", "문서 스캔", "문서 스캔", "사진 문서 스캔", "PDF 스캔"),
      group("category", "스캐너 앱", "QR 스캐너", "바코드 리더", "문서 스캐너"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "app_store:708423616",
    groups: [
      group("problem", "할 일 정리", "할 일 관리", "오늘 할 일", "업무 할 일 정리"),
      group("result", "투두리스트", "투두리스트", "할 일 목록", "체크리스트 앱"),
      group("category", "일정 관리", "일정 관리", "업무 관리 앱", "생산성 앱"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "app_store:1472638797",
    groups: [
      group("problem", "운동 계획", "운동 루틴", "헬스 루틴", "홈트 계획"),
      group("result", "맞춤 운동", "맞춤 운동 계획", "개인 운동 루틴", "운동 프로그램"),
      group("category", "운동 앱", "운동 앱", "홈트 앱", "헬스 앱"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:ojplmecpdpgccookcobabopnaifgidhf",
    groups: [
      group("problem", "가격 변동", "가격 변동 확인", "상품 가격 추적", "가격 이력"),
      group("result", "최저가 알림", "최저가 알림", "가격 하락 알림", "할인 알림"),
      group("category", "가격 추적", "가격 추적", "가격 비교", "최저가 추적"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:abdfkmgniiijbffflcfmkfejigmcepec",
    groups: [
      group("problem", "회의 기록", "회의 녹취", "회의 내용 기록", "온라인 회의 기록"),
      group("result", "회의 전사", "회의 전사", "회의 텍스트 변환", "줌 회의 자막"),
      group("category", "회의 자막", "실시간 회의 자막", "화상회의 자막", "회의 녹음 텍스트"),
    ],
  },
  {
    cohort: "stage2_reject",
    key: "chrome_web_store:kohfgcgbkjodfcfkcackpagifgbcmimk",
    groups: [
      group("problem", "전자책 듣기", "전자책 읽어주기", "문서 읽어주기", "영어 문서 듣기"),
      group("result", "영어 음성 읽기", "영어 TTS", "영어 읽어주기", "원어민 음성 변환"),
      group("category", "텍스트 리더", "텍스트 리더", "음성 읽기 프로그램", "TTS 리더"),
    ],
  },

  {
    cohort: "random_control",
    key: "trustmrr:ticketdesk-ai",
    groups: [
      group("problem", "고객 문의", "고객 문의 자동 답변", "반복 문의 답변", "고객지원 문의"),
      group("result", "문의 자동화", "고객지원 자동화", "헬프데스크 자동화", "고객 문의 분류"),
      group("category", "고객지원 AI", "고객지원 챗봇", "헬프데스크 AI", "상담 챗봇"),
    ],
  },
  {
    cohort: "random_control",
    key: "trustmrr:ai-headshot-generator",
    groups: [
      group("problem", "프로필 사진", "비즈니스 프로필 사진", "회사 프로필 사진", "링크드인 프로필 사진"),
      group("result", "AI 프로필", "AI 프로필 사진", "AI 증명사진", "AI 헤드샷"),
      group("category", "프로필 제작", "프로필 사진 만들기", "증명사진 AI", "헤드샷 생성"),
    ],
  },
  {
    cohort: "random_control",
    key: "app_store:975017240",
    groups: [
      group("problem", "집중 시간", "집중 타이머", "공부 타이머", "업무 집중 시간"),
      group("result", "포모도로", "포모도로 타이머", "뽀모도로 타이머", "25분 타이머"),
      group("category", "생산성 타이머", "집중 앱", "공부 집중 앱", "생산성 타이머"),
    ],
  },
  {
    cohort: "random_control",
    key: "app_store:1230088754",
    groups: [
      group("problem", "온라인 투자", "온라인 트레이딩", "해외 투자 앱", "모바일 주식 거래"),
      group("result", "CFD 거래", "CFD 거래", "차액결제거래", "CFD 투자"),
      group("category", "해외 거래", "해외 주식 거래", "글로벌 트레이딩", "해외 투자 플랫폼"),
    ],
  },
  {
    cohort: "random_control",
    key: "chrome_web_store:ohhjfajndpfpbimipmehmdkblnbelaec",
    groups: [
      group("problem", "커서 꾸미기", "마우스 커서 효과", "마우스 포인터 꾸미기", "크롬 커서 꾸미기"),
      group("result", "커서 애니메이션", "커서 애니메이션", "마우스 움직임 효과", "부드러운 커서"),
      group("category", "커서 확장", "크롬 커서", "커서 확장 프로그램", "마우스 커서 앱"),
    ],
  },
];

const expectedCohorts = {
  current_app_checkpoint: 10,
  stage2_deep_review: 5,
  stage2_reject: 10,
  random_control: 5,
};

if (pilotDefinitions.length !== 30) throw new Error(`Expected 30 pilot rows, got ${pilotDefinitions.length}`);
const seenKeys = new Set();
const rows = pilotDefinitions.map((definition, index) => {
  if (seenKeys.has(definition.key)) throw new Error(`Duplicate pilot key: ${definition.key}`);
  seenKeys.add(definition.key);
  const source = sourceByKey.get(definition.key);
  if (!source) throw new Error(`Unknown source key: ${definition.key}`);
  if (definition.groups.length !== 3) throw new Error(`Expected 3 keyword groups for ${definition.key}`);
  for (const keywordGroup of definition.groups) {
    if (!keywordGroup.keywords.includes(keywordGroup.representative)) {
      throw new Error(`Representative missing from keyword group for ${definition.key}`);
    }
    if (keywordGroup.keywords.length > 20) throw new Error(`Naver group too large for ${definition.key}`);
  }
  const audit = auditedByKey.get(definition.key);
  const manualDecision = definition.cohort === "current_app_checkpoint"
    ? "current_app_checkpoint"
    : audit?.audit_decision || "unjudged";
  return {
    pilot_rank: index + 1,
    cohort: definition.cohort,
    key: definition.key,
    dataset: source.dataset,
    source_id: source.source_id,
    name: source.name,
    url: source.url,
    matched_scenario_ids: source.matched_scenario_ids,
    manual_decision: manualDecision,
    manual_reason: audit?.audit_reason || null,
    keyword_groups: definition.groups,
    query_rule: "제품명 번역이 아니라 문제·원하는 결과·도구 범주의 한국어 검색 의도",
  };
});

for (const [cohort, expected] of Object.entries(expectedCohorts)) {
  const actual = rows.filter((row) => row.cohort === cohort).length;
  if (actual !== expected) throw new Error(`Expected ${expected} rows for ${cohort}, got ${actual}`);
}

fs.writeFileSync(OUTPUT_PATH, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);

const sampleLines = rows.slice(0, 5).map((row) => (
  `| ${row.name} | ${row.keyword_groups.map((item) => item.representative).join(" / ")} | ${row.manual_decision} |`
)).join("\n");
const summary = `# 검색 수요 근거 파일럿 30개 — 입력

생성일: 2026-07-13

- 목적: 2단계 필터를 다시 열지 않고 3단계 전수 판정에 한국 검색 수요를 보조 근거로 붙인다.
- 표본: 현재 앱 체크포인트 10 / 2단계 정밀검사 후보 5 / 2단계 탈락 10 / 무작위 대조 5
- 원본마다 검색어 묶음 3개: 문제 / 원하는 결과 / 도구 범주
- 검색량이 낮다는 이유만으로 자동 탈락시키지 않는다.
- 수집 실패나 인증 부재는 0점이 아니라 \`미수집\`으로 기록한다.

| 예시 원본 | 대표 검색어 3개 | 기존 판정 |
|---|---|---|
${sampleLines}
`;
fs.writeFileSync(SUMMARY_PATH, summary);

process.stdout.write(`${JSON.stringify({
  rows: rows.length,
  cohorts: Object.fromEntries(Object.keys(expectedCohorts).map((cohort) => [
    cohort,
    rows.filter((row) => row.cohort === cohort).length,
  ])),
  keywordGroups: rows.reduce((total, row) => total + row.keyword_groups.length, 0),
  output: path.relative(ROOT, OUTPUT_PATH),
  summary: path.relative(ROOT, SUMMARY_PATH),
}, null, 2)}\n`);
