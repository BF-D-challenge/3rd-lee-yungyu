import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LEDGER_PATH = path.join(ROOT, "docs/research/idea-source-final-ledger.jsonl");
const OUTPUT_DIR = path.join(ROOT, "docs/research/idea-source-batch-decisions");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "EXH-001.jsonl");

const rows = fs.readFileSync(LEDGER_PATH, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((row) => row.batch_id === "EXH-001");

const profiles = {
  fitness_fail: {
    decision: "Fail",
    code: "content_scope",
    five: [
      "운동 목표·신체 정보·기구·운동 기록을 입력으로 받는다.",
      "장기간의 운동 콘텐츠와 기록을 바탕으로 계획·코칭·진도를 계속 갱신한다.",
      "개인화 운동 프로그램·운동 영상·누적 통계를 결과로 준다.",
      "운동을 시작하거나 다음 루틴을 정할 때 찾는다.",
      "한 번의 좁은 결과가 아니라 대규모 운동 콘텐츠와 장기 추적 전체가 필요해 1인 2일 MVP로 원본 가치를 만들 수 없다.",
    ],
    reason: "개인화 운동 계획·콘텐츠·장기 추적 전체가 핵심이라 입력 1개→결과 1개의 세로 조각으로 줄이면 원본 가치가 사라진다.",
  },
  meeting_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "회의 음성이나 현재 진행 중인 통화를 입력으로 받는다.",
      "음성을 전사하고 요약·할 일·핵심 발언을 추출한다.",
      "회의록·요약·액션 아이템을 바로 보여준다.",
      "회의 중 메모를 놓쳤거나 회의 직후 후속 작업을 정리할 때 찾는다.",
      "전용 회의 흐름은 범용 AI보다 편하지만 현재 voice-notes·connected-knowledge의 전사·근거·할 일 카드와 결과가 겹친다.",
    ],
    reason: "회의 음성→전사·요약·할 일 결과가 현재 voice-notes와 connected-knowledge의 카드 재료로 흡수되므로 새 원본 수로 세지 않는다.",
  },
  ai_video_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "텍스트·사진·제품 URL 중 하나를 입력으로 받는다.",
      "AI가 대본·장면·음성·자막을 조합해 짧은 영상을 만든다.",
      "게시 가능한 숏폼 영상이나 광고 초안을 결과로 준다.",
      "신제품이나 콘텐츠를 짧은 영상으로 내보내기 직전에 찾는다.",
      "영상 생성 자체는 범용 AI와 경쟁하고 현재 story-short-video·video-dubbing-localizer의 장면·더빙 카드와 겹친다.",
    ],
    reason: "텍스트·사진·URL→숏폼 영상은 기존 story-short-video 또는 video-dubbing-localizer의 카드 재료로 흡수한다.",
  },
  calendar_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "일정·할 일·메모·반복 날짜를 입력으로 받는다.",
      "날짜별로 저장하고 동기화·알림·위젯에 배치한다.",
      "일·주·월 일정표와 알림을 결과로 준다.",
      "주간 계획을 세우거나 약속을 기록할 때 찾는다.",
      "OS 캘린더·미리 알림·기본 위젯이 같은 입력과 결과를 더 직접적으로 소유한다.",
    ],
    reason: "달력·할 일·메모·위젯 전체는 OS 캘린더와 미리 알림보다 좁은 고유 결과가 없다.",
  },
  education_fail: {
    decision: "Fail",
    code: "content_scope",
    five: [
      "시험 과목·문제·강의·학습 자료를 입력으로 받는다.",
      "교육 콘텐츠와 풀이 데이터를 이용해 설명·연습·진도를 제공한다.",
      "문제은행·강의·개인 진도·학습 설명을 결과로 준다.",
      "시험을 준비하거나 모르는 문제를 공부할 때 찾는다.",
      "대형 문제은행·검수된 강의 재고 또는 범용 AI 튜터 전체가 필요해 작은 독립 결과로 줄이기 어렵다.",
    ],
    reason: "검수된 문제·강의 콘텐츠와 장기 학습 진도가 핵심이라 1인 2일 MVP 범위를 넘는다.",
  },
  gauth_study_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "사용자의 노트·강의 음성·강의 링크 중 하나를 입력으로 받는다.",
      "자료에서 핵심 개념을 뽑아 짧은 퀴즈와 플래시카드로 바꾼다.",
      "자료 근거가 붙은 복습 문제와 정답 카드를 결과로 준다.",
      "수업 직후나 시험 전, 방금 본 자료를 바로 복습하고 싶을 때 찾는다.",
      "범용 AI보다 자료 기반 복습 결과는 구체적이지만 현재 class-material-coach의 자료 분석·재시험 카드와 겹친다.",
    ],
    reason: "노트·강의 링크→자료 근거 퀴즈·플래시카드 흐름은 기존 class-material-coach의 카드 재료로 흡수한다.",
  },
  social_scheduler_fail: {
    decision: "Fail",
    code: "platform_dependency",
    five: [
      "게시물과 여러 소셜 계정을 입력으로 받는다.",
      "채널별 형식으로 변환하고 예약·발행 상태를 관리한다.",
      "여러 채널의 게시 일정과 발행 결과를 준다.",
      "캠페인 콘텐츠를 여러 플랫폼에 배포할 때 찾는다.",
      "각 플랫폼 OAuth·자동 발행 권한과 지속 운영이 핵심이라 파일 한 장 결과로 줄이면 원본 가치가 사라진다.",
    ],
    reason: "여러 소셜 계정 권한·예약 발행·상시 운영이 핵심이라 현재 MVP 하드게이트를 넘는다.",
  },
  broad_ai_fail: {
    decision: "Fail",
    code: "commodity_ai",
    five: [
      "텍스트·파일·사진·질문 등 다양한 입력을 받는다.",
      "범용 생성 모델로 답변·글·이미지·분석을 만든다.",
      "사용자가 요구한 범용 AI 결과를 돌려준다.",
      "무언가를 쓰거나 조사하거나 생성하고 싶을 때 넓게 사용한다.",
      "고유한 검사 기준이나 제품이 소유하는 상태가 없어 ChatGPT 같은 범용 AI 한 번보다 낫지 않다.",
    ],
    reason: "범용 AI 생성·분석 전체라 고유 입력·판정 기준·제품 소유 결과가 없다.",
  },
  shopping_price_fail: {
    decision: "Fail",
    code: "precollected_external_data",
    five: [
      "상품 URL·이미지·현재 쇼핑 페이지를 입력으로 받는다.",
      "외부 쇼핑몰의 과거 가격·쿠폰·판매자·유사 상품 데이터를 비교한다.",
      "가격 이력·할인·최저가·판매자 평가를 결과로 준다.",
      "상품을 결제하기 직전에 더 싼 조건을 확인할 때 찾는다.",
      "필요한 순간 이전부터 가격 이력과 외부 재고를 수집해야 하므로 설치 직후 작은 MVP가 같은 결과를 만들 수 없다.",
    ],
    reason: "가격 이력·쿠폰·외부 재고가 사전에 누적돼야 해 필요한 순간 유입된 1인 MVP가 같은 결과를 소유할 수 없다.",
  },
  qr_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "QR·바코드·문서 이미지를 카메라로 입력받는다.",
      "코드나 문서 내용을 인식한다.",
      "링크·텍스트·연락처·스캔 파일을 결과로 준다.",
      "눈앞의 QR이나 문서를 읽어야 할 때 찾는다.",
      "휴대폰 기본 카메라와 문서 스캔이 같은 결과를 더 빠르게 제공한다.",
    ],
    reason: "QR·바코드 인식은 휴대폰 기본 카메라가 이미 같은 결과와 실행 권한을 소유한다.",
  },
  scanner_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "종이 문서나 영수증 사진을 입력으로 받는다.",
      "가장자리 보정·OCR·페이지 결합을 처리한다.",
      "검색 가능한 PDF·JPG·텍스트 파일을 결과로 준다.",
      "종이 한 장을 보관하거나 보내기 위해 디지털화할 때 찾는다.",
      "iOS 메모·파일 앱의 기본 문서 스캔과 OCR이 같은 결과를 더 직접적으로 준다.",
    ],
    reason: "문서 촬영→보정·OCR→PDF는 OS 기본 문서 스캔 기능과 직접 중복된다.",
  },
  email_fail: {
    decision: "Fail",
    code: "broad_existing_tool",
    five: [
      "이메일 계정과 메시지를 입력으로 받는다.",
      "동기화·예약 발송·추적·알림·분류를 처리한다.",
      "통합 받은편지함과 후속 이메일 상태를 결과로 준다.",
      "여러 이메일을 관리하거나 답장을 놓치기 싫을 때 찾는다.",
      "Gmail·Outlook의 기본 기능과 계정 권한 전체가 필요하며 한 번의 독립 결과로 좁혀지지 않는다.",
    ],
    reason: "메일 계정 동기화·추적·예약·CRM 전체 제품이라 현재 플랫폼 기본 기능보다 좁은 독립 결과가 없다.",
  },
  task_manager_fail: {
    decision: "Fail",
    code: "broad_existing_tool",
    five: [
      "할 일·프로젝트·담당자·기한을 입력으로 받는다.",
      "목록·보드·우선순위·알림으로 계속 관리한다.",
      "프로젝트 보드와 다음 할 일 상태를 결과로 준다.",
      "업무와 개인 할 일을 정리하고 추적할 때 찾는다.",
      "기본 미리 알림과 Trello·Asana 같은 완성된 협업 도구가 상태와 권한을 이미 소유한다.",
    ],
    reason: "할 일·보드·협업·알림 전체 제품이라 좁은 세로 조각으로 줄이면 기존 도구보다 나아지지 않는다.",
  },
  finance_fail: {
    decision: "Fail",
    code: "regulated_platform",
    five: [
      "금융 계정·거래·대출·결제 정보를 입력으로 받는다.",
      "금융기관이 자격·잔액·송금·상환을 처리한다.",
      "실제 돈의 이동·잔액·대출·결제 상태를 결과로 준다.",
      "돈을 보내거나 빌리거나 계정 상태를 확인할 때 찾는다.",
      "은행·카드·대출 기관이 원본 데이터와 실행 권한을 소유해 제3자 1인 MVP가 결과를 만들 수 없다.",
    ],
    reason: "규제 금융기관이 계정·자격·송금·상환 결과를 소유하므로 독립 MVP 범위를 벗어난다.",
  },
  habit_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "습관·목표·매일의 완료 여부를 입력으로 받는다.",
      "연속 기록·알림·통계를 장기간 누적한다.",
      "스트릭·진도 차트·다음 알림을 결과로 준다.",
      "새 습관을 만들거나 매일 실행을 기록할 때 찾는다.",
      "미리 알림·건강 앱·수많은 무료 습관 앱이 같은 장기 기록을 제공하고 즉시 결과가 약하다.",
    ],
    reason: "장기 수동 기록과 알림이 핵심이고 OS·무료 습관 도구보다 좁은 즉시 결과가 없다.",
  },
  static_guide_fail: {
    decision: "Fail",
    code: "content_not_tool",
    five: [
      "사용자가 사이트 상태나 체크할 항목을 입력으로 삼는다.",
      "고정된 가이드·영상·팁을 순서대로 보여준다.",
      "승인 준비 체크리스트와 교육 자료를 결과로 준다.",
      "외부 플랫폼 심사를 준비할 때 찾는다.",
      "실제 페이지를 검사해 고유 결과를 만드는 제품이 아니라 검색 가능한 정적 콘텐츠에 가깝다.",
    ],
    reason: "입력에 따라 계산되는 결과가 없는 정적 가이드라 별도 제품 메커니즘으로 세기 어렵다.",
  },
  agency_app_fail: {
    decision: "Fail",
    code: "service_wrapper",
    five: [
      "고객의 파일·요청·프로젝트 정보를 입력으로 받는다.",
      "외부 대행사 사람이 프로젝트를 수행하고 진행 상황을 갱신한다.",
      "대행 프로젝트의 메시지·마일스톤·승인 상태를 결과로 준다.",
      "이미 계약한 대행사와 프로젝트를 진행할 때 사용한다.",
      "제품이 독립 결과를 만드는 것이 아니라 특정 서비스 업체의 고객 포털이라 새 원본 메커니즘이 아니다.",
    ],
    reason: "특정 대행 서비스의 고객 포털이며 핵심 결과를 소프트웨어가 아니라 대행사 사람이 만든다.",
  },
  shared_calendar_fail: {
    decision: "Fail",
    code: "counterparty_required",
    five: [
      "나와 친구·가족의 일정과 초대를 입력으로 받는다.",
      "여러 사람의 캘린더를 연결해 공통 빈 시간을 계산한다.",
      "모두 가능한 시간과 공유 일정을 결과로 준다.",
      "친구·가족과 약속 시간을 잡을 때 찾는다.",
      "상대방들이 앱을 설치하거나 캘린더 권한을 새로 연결해야 핵심 결과가 생긴다.",
    ],
    reason: "핵심 결과에 친구·가족의 신규 설치와 캘린더 공유 행동이 필수다.",
  },
  incoherent_fail: {
    decision: "Fail",
    code: "insufficient_mechanism",
    five: [
      "원본 설명에서 사용자가 넣는 구체적 입력을 확인할 수 없다.",
      "반복 가능한 소프트웨어 처리 과정을 확인할 수 없다.",
      "즉시 받는 제품 결과가 구체적으로 드러나지 않는다.",
      "언제 어떤 사용자가 찾는지도 설명에서 확인되지 않는다.",
      "시장 문구만 있고 입력→처리→결과 메커니즘이 없어 기본 도구와 비교할 수 없다.",
    ],
    reason: "원본 설명을 읽어도 입력·처리·즉시 결과가 성립하지 않아 제품 메커니즘을 확인할 수 없다.",
  },
  code_editor_fail: {
    decision: "Fail",
    code: "broad_existing_tool",
    five: [
      "소스 코드 파일과 프로젝트를 입력으로 받는다.",
      "편집·구문 강조·파일 관리·실행 환경 연동을 처리한다.",
      "수정된 코드와 프로젝트 파일을 결과로 준다.",
      "모바일에서 코드를 확인하거나 수정할 때 찾는다.",
      "완성된 코드 편집기 전체가 필요하고 기존 편집기보다 좁은 고유 결과가 없다.",
    ],
    reason: "모바일 코드 편집기 전체 제품이라 1회 처리·1개 결과의 아이디어 카드로 줄일 수 없다.",
  },
  marketplace_fail: {
    decision: "Fail",
    code: "marketplace_dependency",
    five: [
      "사용자 프로필·요청·상품 또는 서비스 조건을 입력으로 받는다.",
      "외부 공급자·브랜드·프리랜서와 사용자를 매칭한다.",
      "상품 제공·리뷰 과제·서비스 주문 상태를 결과로 준다.",
      "무료 체험 상품이나 외부 전문가가 필요할 때 찾는다.",
      "양면 시장의 공급자·브랜드·프리랜서 참여가 없으면 결과가 생기지 않아 1인 MVP로 검증할 수 없다.",
    ],
    reason: "상대편 공급자와 거래 재고가 필수인 양면 마켓플레이스라 독립 소프트웨어 결과가 아니다.",
  },
  travel_inventory_fail: {
    decision: "Fail",
    code: "external_inventory",
    five: [
      "호텔·숙소 페이지나 여행 조건을 입력으로 받는다.",
      "여러 예약 사이트와 직접 예약 재고·가격을 비교한다.",
      "더 싼 예약 가격이나 직접 예약 링크를 결과로 준다.",
      "숙소를 결제하기 직전에 가격을 비교할 때 찾는다.",
      "실시간 외부 재고·제휴 데이터가 핵심이라 현재 페이지 한 장만으로 같은 결과를 만들 수 없다.",
    ],
    reason: "실시간 숙소 재고·외부 가격·제휴 링크를 소유하지 못해 1인 MVP가 결과를 보장할 수 없다.",
  },
  weather_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "현재 위치나 도시를 입력으로 받는다.",
      "외부 기상 API에서 예보와 대기질을 조회한다.",
      "시간별·주간 날씨와 미세먼지 결과를 준다.",
      "외출·여행 전에 날씨를 확인할 때 찾는다.",
      "OS 날씨와 검색이 같은 데이터를 더 직접적으로 보여준다.",
    ],
    reason: "날씨·대기질·주간 예보는 OS 날씨와 검색이 이미 같은 결과를 제공한다.",
  },
  workout_timer_fail: {
    decision: "Fail",
    code: "platform_default",
    five: [
      "운동 구간·휴식 시간·촬영 설정을 입력으로 받는다.",
      "인터벌 타이머를 실행하고 운동 영상을 기록한다.",
      "운동 시간 기록과 촬영 영상을 결과로 준다.",
      "CrossFit·HIIT 운동을 시작할 때 찾는다.",
      "기본 타이머·카메라 조합보다 별도 결제할 좁은 결과가 약하다.",
    ],
    reason: "인터벌 타이머와 촬영 조합은 유용하지만 기본 타이머·카메라보다 강한 독립 결과와 결제자 3개가 부족하다.",
  },
  captime_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "운동 구간·휴식 시간과 촬영 방향을 입력으로 받는다.",
      "인터벌 타이머와 카메라를 동시에 실행해 각 세트의 시간과 영상을 맞춘다.",
      "세트 번호·운동 시간·휴식 시간이 붙은 운동 영상과 구간표를 결과로 준다.",
      "CrossFit·HIIT 세션을 시작하거나 코치에게 오늘 세트 영상을 보내기 직전에 찾는다.",
      "기본 타이머와 카메라를 따로 쓰면 시간과 영상 구간을 다시 맞춰야 하지만 이 흐름은 한 번에 기록한다.",
    ],
    reason: "타이머와 영상의 동시 기록이라는 좁은 결과가 있고 선수·코치·박스 운영자의 결제 순간으로 확장 가능해 27조합 후보로 남긴다.",
  },
  health_dashboard_fail: {
    decision: "Fail",
    code: "platform_owner",
    five: [
      "Apple Health·Watch의 활동 데이터를 입력으로 받는다.",
      "건강 지표를 기간별로 집계하고 대시보드에 배치한다.",
      "활동 링·운동·건강 통계를 결과로 준다.",
      "운동 기록과 건강 추세를 확인할 때 찾는다.",
      "Apple Health가 원본 데이터·권한·기본 통계를 이미 소유한다.",
    ],
    reason: "Apple Health가 데이터와 권한을 소유하고 기본 활동 대시보드도 직접 제공한다.",
  },
  platform_metric_fail: {
    decision: "Fail",
    code: "precollected_external_data",
    five: [
      "YouTube 영상 페이지를 입력으로 받는다.",
      "플랫폼이 숨긴 싫어요 수를 외부 사용자 데이터로 추정한다.",
      "추정 싫어요 숫자를 페이지에 다시 표시한다.",
      "영상을 보기 전에 반응을 확인할 때 찾는다.",
      "설치 전부터 대규모 사용자 데이터가 쌓여야 하고 YouTube DOM에 종속된다.",
    ],
    reason: "핵심 숫자가 설치 전부터 모인 외부 데이터와 YouTube 페이지 구조에 의존한다.",
  },
  generic_api_fail: {
    decision: "Fail",
    code: "commodity_ai",
    five: [
      "여러 형식의 콘텐츠 생성 요청을 API 입력으로 받는다.",
      "범용 생성 모델을 호출해 콘텐츠를 만든다.",
      "텍스트·이미지·영상 등 범용 생성 결과를 돌려준다.",
      "개발자가 자동 콘텐츠 생성을 붙이고 싶을 때 찾는다.",
      "고유한 도메인 판정이나 상태 없이 범용 모델 API를 다시 포장한다.",
    ],
    reason: "여러 형식의 범용 AI 생성 API라 독립 제품 메커니즘과 고유 결과가 없다.",
  },
  app_builder_fail: {
    decision: "Fail",
    code: "scope_too_broad",
    five: [
      "앱 요구사항과 프롬프트를 입력으로 받는다.",
      "여러 AI 모델·템플릿·미리보기·배포를 한꺼번에 처리한다.",
      "실행 가능한 앱 전체를 결과로 준다.",
      "코딩 없이 앱을 만들고 배포하려 할 때 찾는다.",
      "앱 빌더 전체가 필요해 반나절~2일의 한 세로 조각으로 줄일 수 없다.",
    ],
    reason: "다중 모델·템플릿·미리보기·배포를 묶은 앱 빌더 전체라 MVP 범위를 넘는다.",
  },
  myfrank_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "직원별 QR 리뷰 링크와 들어온 Google 리뷰를 입력으로 받는다.",
      "리뷰를 유도한 직원에게 리뷰를 귀속하고 팀별 성과를 집계한다.",
      "직원별 리뷰 수·도전 과제·팀 진행표를 결과로 준다.",
      "매장 리뷰 캠페인을 운영하고 직원 참여를 높일 때 찾는다.",
      "일반 AI보다 운영 상태는 선명하지만 Google 리뷰 정책·직원·고객 행동과 매장 영업 채널이 필요하다.",
    ],
    reason: "직원·고객의 참여와 Google 리뷰 정책, 오프라인 매장 채널이 있어야 작동하므로 관련 고객이 있는 경우에만 검토한다.",
  },
  airix_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "브랜드 URL·브랜드명과 고객이 AI에 물을 대표 질문을 입력으로 받는다.",
      "같은 질문의 AI 답변에서 브랜드·경쟁사·출처 언급을 한 번 비교한다.",
      "브랜드가 빠진 질문·경쟁사·인용 출처 표를 바로 보여준다.",
      "월간 SEO 보고 전이나 ChatGPT 추천에서 자사 브랜드가 안 보인 직후 찾는다.",
      "범용 AI 한 번은 비교 기준과 반복 가능한 증거가 없지만 이 도구는 같은 질문의 브랜드 노출 차이를 고정된 표로 남긴다.",
    ],
    reason: "브랜드·질문→AI 답변의 브랜드·경쟁사·출처 비교표가 선명하고, 붙여넣은 답변 3개로 1인 MVP를 만들 수 있어 27조합 정밀감사 후보로 남긴다.",
  },
  voice_call_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "전화 대상·통화 스크립트·예약 조건을 입력으로 받는다.",
      "AI 음성으로 발신·응답 분류·예약 연결을 처리한다.",
      "통화 결과·리드 자격·예약 상태·녹취를 준다.",
      "영업·예약 전화를 대량으로 운영할 때 찾는다.",
      "통신 인프라·개인정보·상대방 응답·예약 시스템 지식이 필요해 일반 카드로 바로 승격할 수 없다.",
    ],
    reason: "AI 전화는 통신·개인정보·예약 연동과 통화 상대 반응이 필수라 관련 도메인과 고객 채널이 있을 때만 검토한다.",
  },
  social_api_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "YouTube·TikTok·Instagram 등의 공개 콘텐츠 URL을 입력으로 받는다.",
      "플랫폼별 영상·자막·댓글·참여 지표를 API로 추출한다.",
      "전사·요약·댓글·지표의 구조화 데이터를 결과로 준다.",
      "개발자가 소셜 리서치나 콘텐츠 분석 기능을 만들 때 찾는다.",
      "범용 AI보다 구조화 API는 낫지만 플랫폼별 접근 정책·요금·유지보수와 개발자 고객 채널이 필요하다.",
    ],
    reason: "명확한 개발자 결과는 있지만 여러 소셜 플랫폼 접근 정책과 API 운영 지식이 필요해 전문 채널용 Reserve로 둔다.",
  },
  reviews_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "Amazon 상품 페이지의 리뷰를 입력으로 받는다.",
      "현재 페이지 리뷰를 추출하고 장단점으로 요약한다.",
      "리뷰 표·장단점 요약·CSV를 결과로 준다.",
      "상품 조사나 고객 리뷰 분석을 시작할 때 찾는다.",
      "전용 요약은 유용하지만 현재 current-page-to-clean-csv의 반복 필드·출처 CSV 카드와 핵심 결과가 겹친다.",
    ],
    reason: "현재 상품 페이지→리뷰 표·CSV는 current-page-to-clean-csv에 리뷰 장단점 카드 재료로 흡수한다.",
  },
  jira_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "Jira 티켓·작업 기록·스프린트 데이터를 입력으로 받는다.",
      "작업시간과 티켓 상태를 집계해 보고서로 바꾼다.",
      "Worklog·Sprint·팀별 맞춤 보고서를 결과로 준다.",
      "스프린트 보고나 작업시간 제출 직전에 찾는다.",
      "범용 AI보다 Jira 상태를 직접 다루지만 팀별 워크플로·권한·고객 채널이 필요하다.",
    ],
    reason: "Jira 권한과 조직별 워크플로 지식이 있어야 가치가 생기므로 관련 고객 채널용 Reserve로 둔다.",
  },
  education_video_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "수업 주제와 Google Slides 수업 자료를 입력으로 받는다.",
      "검수된 짧은 교육 영상 중 맞는 구간을 찾아 슬라이드에 연결한다.",
      "수업 슬라이드 안의 짧은 영상 자료를 결과로 준다.",
      "교사가 다음 수업 자료를 만들 때 찾는다.",
      "교사 작업은 구체적이지만 검수된 영상 재고·저작권·Slides 연동과 교육 고객 채널이 필요하다.",
    ],
    reason: "검수 영상 재고와 교육 도메인·Google Slides 채널이 있는 경우에만 성립해 Reserve로 둔다.",
  },
  sales_automation_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "리드 목록·영업 스크립트·자격 조건을 입력으로 받는다.",
      "Instagram DM·WhatsApp에서 자동 대화하고 리드를 분류한다.",
      "자격 있는 리드와 예약된 미팅을 결과로 준다.",
      "영업 리드가 많아 첫 응대와 예약을 자동화할 때 찾는다.",
      "결과는 분명하지만 플랫폼 권한·통신 정책·상대방 응답·Calendly 연동과 영업 고객 채널이 필요하다.",
    ],
    reason: "메신저 권한·상대방 응답·예약 연동이 필수라 실제 영업 자동화 고객 채널이 있을 때만 검토한다.",
  },
  gaming_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "Path of Exile 거래 검색 결과와 관심 항목을 입력으로 받는다.",
      "거래 기록·북마크·검색 결과를 게임 규칙에 맞게 정리한다.",
      "거래 후보·이력·다음 비교 결과를 준다.",
      "게임 아이템을 반복 거래할 때 찾는다.",
      "고유 작업은 있으나 게임 경제·사이트 구조·커뮤니티 채널 지식 없이는 만들고 팔기 어렵다.",
    ],
    reason: "Path of Exile 거래 도메인과 커뮤니티 채널이 있는 빌더에게만 유효해 Reserve로 둔다.",
  },
  customer_platform_fail: {
    decision: "Fail",
    code: "scope_too_broad",
    five: [
      "고객 대화·리뷰·전화·결제 정보를 입력으로 받는다.",
      "여러 채널을 통합하고 메시지·마케팅·결제를 운영한다.",
      "통합 고객 기록과 캠페인·결제 상태를 결과로 준다.",
      "지역 사업자가 고객 응대를 한곳에서 운영하려 할 때 찾는다.",
      "전화·문자·결제·리뷰 권한과 팀 운영 전체가 필요해 1인 2일 세로 조각이 아니다.",
    ],
    reason: "다채널 고객 응대·리뷰·결제·마케팅을 묶은 전체 플랫폼이라 MVP 범위를 넘는다.",
  },
  social_content_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "주제·텍스트·브랜드 자료를 입력으로 받는다.",
      "AI가 소셜 캐러셀·게시물 변형을 생성하고 예약 형식으로 정리한다.",
      "채널별 캐러셀·게시 초안을 결과로 준다.",
      "소셜 콘텐츠를 여러 개 준비하기 직전에 찾는다.",
      "현재 cross-post-relay와 story-short-video의 채널별 변환·장면 카드와 결과가 겹친다.",
    ],
    reason: "소셜 캐러셀·게시물 생성과 배포는 기존 cross-post-relay·story-short-video의 카드 재료로 흡수한다.",
  },
  platform_scraper_fail: {
    decision: "Fail",
    code: "platform_policy",
    five: [
      "현재 LinkedIn 검색 결과나 프로필 목록을 입력으로 받는다.",
      "페이지에서 이름·직무·회사 같은 프로필 필드를 대량으로 수집한다.",
      "영업·채용에 쓸 CSV 리드 목록을 결과로 준다.",
      "잠재 고객이나 채용 후보 목록을 한꺼번에 만들 때 찾는다.",
      "LinkedIn 계정 권한·정책·자주 바뀌는 화면 구조에 핵심 기능이 묶여 있어 안정적인 1인 제품으로 소유하기 어렵다.",
    ],
    reason: "대량 프로필 수집은 LinkedIn 정책·계정 권한·화면 구조 변화에 종속되어 핵심 결과를 안정적으로 제공하기 어렵다.",
  },
  trainer_platform_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "트레이너가 회원의 목표·가능한 장비·운동 기록을 입력으로 받는다.",
      "회원별 운동·식단 계획과 체크인을 묶어 다음 주 코칭 계획을 갱신한다.",
      "회원에게 보낼 주간 계획과 진행 요약을 결과로 준다.",
      "PT 회원 여러 명의 다음 주 계획을 한꺼번에 준비할 때 찾는다.",
      "범용 도구보다 코칭 흐름은 선명하지만 트레이너와 실제 회원 채널이 있어야 검증할 수 있다.",
    ],
    reason: "트레이너·회원 양쪽의 지속 사용이 필요하므로 실제 PT 고객 채널과 코칭 지식이 있을 때만 검토한다.",
  },
  fitness_progress_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "목표·장비와 지난 운동의 무게·횟수·완료 기록을 입력으로 받는다.",
      "운동 이력에서 다음 세트의 운동·무게·횟수 또는 교체 동작을 계산한다.",
      "오늘 바로 따라 할 운동 순서와 다음 중량 한 줄을 결과로 준다.",
      "헬스장에 도착했지만 지난 기록보다 무엇을 늘릴지 정하지 못한 순간에 찾는다.",
      "범용 AI보다 실제 운동 이력에 맞춘 다음 행동은 구체적이지만 이번 배치의 FitnessAI 원본과 겹친다.",
    ],
    reason: "운동 기록→다음 운동·중량 흐름은 이번 배치의 FitnessAI 후보에 결제자·순간·한 끗 재료로 합친다.",
  },
  study_material_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "자격시험 과목·학습 기한·틀린 문제 기록을 입력으로 받는다.",
      "문제와 해설을 분석해 약한 개념과 다음 복습 범위를 고른다.",
      "오늘 풀 문제와 오답 근거가 붙은 복습 계획을 결과로 준다.",
      "CFA·CMT 같은 시험 직전 약한 단원을 좁혀 공부할 때 찾는다.",
      "검수된 문제은행은 강점이지만 자료 기반 오답 복습 흐름은 현재 class-material-coach와 겹친다.",
    ],
    reason: "문제·해설→약한 개념·복습 계획 흐름을 기존 class-material-coach의 전문 자격시험 카드 재료로 합친다.",
  },
  social_schedule_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "원문 게시물과 보낼 소셜 채널·날짜를 입력으로 받는다.",
      "채널별 문구와 형식을 맞추고 한 주 발행 순서로 정리한다.",
      "채널별 게시 초안과 예약표를 결과로 준다.",
      "한 캠페인을 여러 채널에 나눠 올리기 직전에 찾는다.",
      "자동 발행 권한은 무겁지만 채널별 변환·미리보기는 현재 cross-post-relay와 정확히 겹친다.",
    ],
    reason: "다채널 게시물 변환·예약 흐름을 기존 cross-post-relay의 주간 발행 카드 재료로 합친다.",
  },
  calendar_material_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "이번 주 일정·할 일·메모를 짧은 문장이나 날짜 목록으로 입력받는다.",
      "날짜와 우선순위를 읽어 주간 한 장 또는 캘린더 항목으로 정리한다.",
      "이번 주 빈칸·밀린 일·중요 날짜가 보이는 일정표를 결과로 준다.",
      "새 주를 시작하거나 흩어진 일정을 한 번에 옮길 때 찾는다.",
      "완성형 캘린더 자체는 기본 기능과 겹치지만 빠른 일정 변환·주간 표시 재료는 schedule-to-calendar-file에 쓸 수 있다.",
    ],
    reason: "범용 캘린더 전체를 새 원본으로 세지 않고 빠른 입력·주간 표시를 기존 schedule-to-calendar-file 카드 재료로 합친다.",
  },
  brand_url_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "자기 쇼핑몰이나 회사 웹사이트 URL 하나를 입력으로 받는다.",
      "페이지의 로고·색·글꼴·제품 표현·말투를 읽어 반복 가능한 브랜드 규칙으로 정리한다.",
      "다음 콘텐츠에 바로 붙일 색상·말투·금지 표현이 담긴 1쪽 브랜드 카드가 나온다.",
      "외주 디자이너나 AI에게 새 광고·게시물 제작을 맡기기 직전에 찾는다.",
      "범용 AI에 설명을 다시 쓰는 대신 실제 공개 사이트에서 일관된 브랜드 근거를 자동으로 뽑는다.",
    ],
    reason: "URL 한 개→사이트 근거 추출→재사용 가능한 브랜드 카드라는 결과가 선명하고 1인 MVP 범위여서 후보로 남긴다.",
  },
  email_followup_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "보낸 이메일 한 통과 답장을 기다릴 날짜를 입력으로 받는다.",
      "답장 여부와 약속한 기한을 확인해 다시 연락할 정확한 이메일을 고른다.",
      "후속 연락이 필요한 이유·보낼 시각·짧은 답장 초안을 결과로 준다.",
      "견적·지원서·협업 제안 뒤 답장이 없어 놓칠까 걱정되는 순간에 찾는다.",
      "메일함 전체를 관리하지 않고 보낸 한 통의 무응답과 약속 날짜만 추적해 다음 행동을 닫는다.",
    ],
    reason: "보낸 메일 한 통→무응답·기한 확인→후속 초안이라는 좁고 반복적인 결과가 있어 후보로 남긴다.",
  },
  task_capture_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "메시지·이메일·사진·메모에서 해야 할 일 하나를 입력으로 받는다.",
      "담당자·기한·다음 행동을 뽑아 한 장의 작업 카드로 정리한다.",
      "출처 근거가 붙은 다음 할 일 카드가 결과로 나온다.",
      "대화에서 나온 일을 잊기 전에 업무 목록으로 옮길 때 찾는다.",
      "프로젝트 관리 전체는 기존 도구가 낫지만 자료에서 행동을 뽑는 흐름은 connected-knowledge와 겹친다.",
    ],
    reason: "프로젝트 관리 제품 전체가 아니라 메시지·자료→다음 할 일 카드 재료만 기존 connected-knowledge에 합친다.",
  },
  habit_material_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "지키려는 습관과 하루의 완료 여부·짧은 메모를 입력으로 받는다.",
      "연속 기록보다 실패가 반복된 요일·상황과 다음 작은 행동을 찾는다.",
      "이번 주에 바꿀 행동 한 가지와 확인할 날짜를 결과로 준다.",
      "며칠 연속 습관을 놓쳐 다시 시작할 기준이 필요할 때 찾는다.",
      "단순 스트릭은 기본 앱과 겹치지만 기록→작은 행동 제안은 현재 meal-habit-loop와 겹친다.",
    ],
    reason: "습관 기록을 작은 다음 행동으로 바꾸는 흐름을 기존 meal-habit-loop의 비식사 카드 재료로 합친다.",
  },
  family_calendar_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "가족·친구의 일정과 함께 준비할 일을 입력으로 받는다.",
      "여러 사람의 빈 시간과 이벤트 세부 정보를 한 화면으로 맞춘다.",
      "누가 언제 무엇을 준비하는지 보이는 공유 일정 한 장을 결과로 준다.",
      "약속 날짜를 정했지만 단체방에서 준비물이 계속 바뀌는 순간에 찾는다.",
      "상대방의 참여는 필요하지만 이 흐름은 이미 family-notice-one-sheet가 다루는 가족 일정·준비물 공유와 겹친다.",
    ],
    reason: "친구·가족 일정 공유와 준비물 정리를 기존 family-notice-one-sheet의 카드 재료로 합친다.",
  },
  weight_photo_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "오늘 몸무게와 같은 각도의 사진 한 장을 입력으로 받는다.",
      "날짜별 기록을 맞춰 숫자와 사진의 변화를 함께 정리한다.",
      "이번 주 변화와 다음에 유지할 작은 행동 한 가지를 결과로 준다.",
      "체중 숫자는 그대로인데 생활 변화가 보이지 않아 동기를 잃는 순간에 찾는다.",
      "사진·습관 기록에서 작은 행동을 제안하는 흐름이 현재 meal-habit-loop와 겹친다.",
    ],
    reason: "몸무게·사진→변화·다음 행동 흐름을 기존 meal-habit-loop의 진행 확인 카드로 합친다.",
  },
  podium_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "부재중 전화·문자·리뷰 요청과 고객 연락처를 입력으로 받는다.",
      "여러 연락을 고객별 한 대화로 묶고 다음 응대·결제·리뷰 요청을 고른다.",
      "놓친 고객과 지금 보낼 후속 메시지를 결과로 준다.",
      "예약 전화가 몰린 뒤 놓친 매출을 당일 안에 회수할 때 찾는다.",
      "가치는 크지만 업무용 전화·문자·결제 권한과 실제 지역 사업자 고객 채널이 필요하다.",
    ],
    reason: "지역 사업자의 전화·문자·결제 채널이 있어야 검증 가능한 운영 제품이라 Reserve로 둔다.",
  },
  hotel_compare_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "현재 보고 있는 호텔 객실 페이지와 같은 조건의 비교 페이지를 입력으로 받는다.",
      "객실명·날짜·취소·조식 조건을 맞춘 뒤 세금과 수수료를 포함한 최종가를 비교한다.",
      "같은 객실의 실제 결제액·조건 차이·더 싼 예약 링크를 결과로 준다.",
      "예약 버튼을 누르기 직전 여러 사이트의 숨은 비용이 같은지 확인할 때 찾는다.",
      "검색 탭을 여러 개 여는 대신 같은 객실 조건과 최종 결제액을 한 표에서 맞춰준다.",
    ],
    reason: "두 숙박 URL→동일 조건 정규화→세금 포함 최종가 비교는 필요한 순간과 결과가 선명해 후보로 남긴다.",
  },
  fitness_next_set_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "운동 종목과 지난 세트의 무게·횟수·체감 난이도를 입력으로 받는다.",
      "이전 수행과 점진적 과부하 규칙 하나를 적용해 오늘의 무게·횟수를 계산한다.",
      "다음 세트에서 할 무게·횟수와 낮춰야 할 조건 한 줄을 결과로 준다.",
      "헬스장에서 다음 세트를 시작하기 전 중량을 올릴지 망설이는 순간에 찾는다.",
      "범용 AI보다 사용자의 실제 직전 세트와 고정된 증량 규칙으로 바로 실행할 숫자를 준다.",
    ],
    reason: "지난 세트→고정 증량 규칙→다음 무게·횟수라는 좁고 반복되는 결과가 있어 후보로 남긴다.",
  },
  linkedin_scraper_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "현재 LinkedIn 검색 결과 페이지와 필요한 프로필 필드를 입력으로 받는다.",
      "화면에 보이는 이름·직무·회사·프로필 URL을 행 단위로 정리한다.",
      "채용·영업 대상 CSV와 누락 필드 목록을 결과로 준다.",
      "검색 결과 수십 명을 CRM이나 후보 명단으로 옮기기 직전에 찾는다.",
      "작은 결과는 만들 수 있지만 LinkedIn 정책·계정·화면 변경을 감당할 채용·영업 채널이 필요하다.",
    ],
    reason: "작동 흐름은 분명하지만 LinkedIn 정책과 실제 채용·영업 고객 채널이 있을 때만 검토한다.",
  },
  health_summary_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "한 기기의 건강 앱에 기록된 걸음·운동·섭취 데이터를 입력으로 받는다.",
      "이번 주 목표와 실제 기록의 차이가 큰 날을 한 번 비교한다.",
      "놓친 날·바뀐 행동·다음 주 확인 한 가지를 결과로 준다.",
      "건강 기록은 쌓였지만 무엇을 바꿔야 할지 보이지 않을 때 찾는다.",
      "건강 대시보드 전체는 OS와 겹치지만 기록→다음 작은 행동은 meal-habit-loop와 겹친다.",
    ],
    reason: "건강 데이터 요약을 새 대시보드로 세지 않고 기존 meal-habit-loop의 주간 행동 카드 재료로 합친다.",
  },
  apps_script_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "구글 시트 URL과 입력 폼으로 쓸 열 머리글을 입력으로 받는다.",
      "시트 구조를 읽어 Google Apps Script 폼·저장 코드·배포 설정을 한 번 생성한다.",
      "복사해 배포할 코드와 실제 입력 화면 미리보기를 결과로 준다.",
      "운영팀이 설문 도구로는 부족한 사내 입력 화면을 오늘 안에 만들어야 할 때 찾는다.",
      "범용 AI 코드보다 실제 시트 열과 Apps Script 제약을 검사하고 배포 가능한 한 세로 조각으로 닫는다.",
    ],
    reason: "구글 시트→Apps Script 입력 폼이라는 한국 운영 실무의 좁은 결과가 있고 1인 MVP로 검증 가능해 후보로 남긴다.",
  },
  stayfinder_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "현재 보고 있는 숙소 공유 플랫폼의 매물 페이지를 입력으로 받는다.",
      "숙소명·사진·위치를 역검색해 운영사의 직접 예약 페이지와 같은 날짜 가격을 찾는다.",
      "플랫폼 가격·직접 예약 가격·수수료 차이와 원본 링크를 결과로 준다.",
      "숙소 공유 플랫폼에서 결제하기 직전 직접 예약이 더 싼지 확인할 때 찾는다.",
      "유용하지만 같은 숙소의 조건과 최종가를 비교하는 이번 배치 Hotel Ninja 후보와 핵심 결과가 겹친다.",
    ],
    reason: "숙소 플랫폼 페이지→직접 예약 링크·가격 차이는 Hotel Ninja 후보의 직접 예약 한 끗 재료로 합친다.",
  },
  shopping_data_reserve: {
    decision: "Reserve",
    code: "domain_channel_required",
    five: [
      "현재 상품 페이지와 비교할 쇼핑몰·쿠폰 조건을 입력으로 받는다.",
      "가격 이력·판매자·쿠폰·유사 상품 데이터를 맞춰 실제 결제 조건을 계산한다.",
      "가격 변동과 적용 가능한 쿠폰·더 나은 구매 링크를 결과로 준다.",
      "네이버 스마트스토어·해외몰에서 결제하기 직전 조건을 확인할 때 찾는다.",
      "구매 순간의 가치는 분명하지만 가격 이력·제휴 피드·쇼핑몰 구조를 운영할 커머스 채널이 필요하다.",
    ],
    reason: "한국 쇼핑몰 로컬화 가능성은 있으나 가격 이력·제휴 데이터·쇼핑몰 변화에 대응할 커머스 채널이 있을 때만 검토한다.",
  },
  business_card_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "명함 사진 한 장을 입력으로 받는다.",
      "이름·회사·직함·전화·이메일을 연락처 필드로 나누고 빠진 값을 표시한다.",
      "확인 후 바로 저장할 연락처 파일과 CRM 한 줄을 결과로 준다.",
      "행사·미팅에서 받은 명함을 잃기 전에 연락처와 후속 메모로 옮길 때 찾는다.",
      "기본 카메라 OCR과 달리 명함 필드를 구분하고 저장 가능한 연락처·표 한 줄로 끝낸다.",
    ],
    reason: "명함 사진→필드 분리→연락처·CRM 행이라는 결과가 선명하고 세 결제자·순간으로 확장 가능해 후보로 남긴다.",
  },
  document_scan_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "영수증·청구서·계약서 사진이나 여러 장의 문서를 입력으로 받는다.",
      "가장자리·기울기·명암을 보정하고 OCR 가능한 한 파일로 묶는다.",
      "읽기 쉬운 PDF와 다음 추출에 쓸 정리된 문서 이미지를 결과로 준다.",
      "종이 문서를 표·기한 카드로 바꾸기 전에 촬영 품질을 맞출 때 찾는다.",
      "스캔 자체는 OS와 겹치지만 사진 입력 보정은 statement-to-table·document-deadline-card의 전처리 재료로 쓸 수 있다.",
    ],
    reason: "범용 스캐너를 새 원본으로 세지 않고 기존 거래내역·문서 기한 카드의 사진 입력·보정 재료로 합친다.",
  },
  adsense_guide_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "광고 승인을 받을 사이트 URL과 현재 준비한 정책 페이지를 입력으로 받는다.",
      "승인 체크 항목을 현재 페이지의 실제 제목·콘텐츠·필수 링크와 대조한다.",
      "빠진 승인 준비 항목과 고칠 페이지 위치를 결과로 준다.",
      "AdSense 신청서를 제출하기 직전 빠진 조건을 확인할 때 찾는다.",
      "원본은 정적 가이드지만 URL 검사로 바꾸면 현재 one-page-seo-fix-list의 심사 전 체크 카드와 겹친다.",
    ],
    reason: "정적 가이드 자체는 새 원본이 아니며 AdSense 제출 전 URL 체크 항목만 one-page-seo-fix-list 재료로 합친다.",
  },
  email_client_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "답장을 미룬 이메일 한 통과 다시 볼 날짜·장소를 입력으로 받는다.",
      "메일의 약속·상대·기한을 읽어 후속 알림과 짧은 회신 초안을 만든다.",
      "조건이 되었을 때 보낼 후속 이메일 카드를 결과로 준다.",
      "사무실에 도착했거나 약속 날짜가 됐을 때 놓친 답장을 처리하려고 찾는다.",
      "메일 클라이언트 전체는 필요 없고 이 흐름은 RightInbox 후보의 장소·기한 한 끗과 겹친다.",
    ],
    reason: "통합 메일 앱을 새 원본으로 세지 않고 장소·기한 후속 알림을 RightInbox 후보 카드 재료로 합친다.",
  },
  weather_context_merge: {
    decision: "Merge",
    code: "portfolio_merge",
    five: [
      "행사 날짜·장소와 시간대별 날씨를 입력으로 받는다.",
      "강수·기온·공기질이 준비물과 일정에 미치는 변화를 한 번 대조한다.",
      "우산·옷·시간 변경처럼 일정에 붙일 준비 한 줄을 결과로 준다.",
      "가족 행사나 야외 약속 전날 준비물을 확정할 때 찾는다.",
      "날씨 앱 자체는 기본 기능과 겹치지만 일정에 준비 행동을 붙이는 흐름은 family-notice-one-sheet와 겹친다.",
    ],
    reason: "일반 예보는 새 원본이 아니며 행사 날씨→준비 행동을 family-notice-one-sheet의 한 끗 재료로 합친다.",
  },
  no_violation_candidate: {
    decision: "Candidate",
    code: "all_gates_preflight",
    five: [
      "게시 전 짧은 영상 파일 한 개와 대상 플랫폼을 입력으로 받는다.",
      "자막·음성·주요 프레임을 플랫폼 위반 규칙 하나와 대조한다.",
      "문제가 될 수 있는 정확한 초·이유·수정 전 확인표를 준다.",
      "숏폼을 게시하기 직전이거나 이전 경고 뒤 같은 실수를 피하려 할 때 찾는다.",
      "범용 AI 질문보다 플랫폼별 규칙과 타임스탬프 근거가 고정돼 있고 파일 한 개로 즉시 결과가 난다.",
    ],
    reason: "영상 파일→플랫폼 규칙 대조→위험 초·이유라는 결과가 선명하고, 한 플랫폼·규칙 범위로 1인 MVP가 가능해 27조합 후보로 남긴다.",
  },
};

const groups = {
  trainer_platform_reserve: [1],
  fitness_progress_merge: [9, 18, 26, 31, 55, 58, 59, 68, 80, 89, 91],
  weight_photo_merge: [47],
  meeting_merge: [2, 4, 6, 15, 63, 64, 81],
  ai_video_merge: [5, 38, 57, 62, 66, 75, 79],
  calendar_material_merge: [7, 16, 33, 35, 39, 50, 67, 83, 96],
  calendar_fail: [56],
  myfrank_reserve: [8],
  study_material_merge: [11],
  gauth_study_merge: [13],
  social_schedule_merge: [12],
  airix_candidate: [17],
  shopping_data_reserve: [19, 52, 94],
  business_card_candidate: [20],
  brand_url_candidate: [21],
  broad_ai_fail: [54, 95],
  document_scan_merge: [22, 24, 41, 78],
  email_followup_candidate: [23],
  email_client_merge: [42],
  voice_call_reserve: [25],
  adsense_guide_merge: [27],
  task_capture_merge: [28, 65, 87, 93],
  finance_fail: [29, 48, 51, 72],
  social_api_reserve: [30],
  reviews_merge: [34],
  jira_reserve: [36],
  habit_material_merge: [37, 99],
  incoherent_fail: [43],
  family_calendar_merge: [45, 76],
  agency_app_fail: [46],
  education_video_reserve: [49],
  sales_automation_reserve: [53],
  gaming_reserve: [60],
  podium_reserve: [61],
  hotel_compare_candidate: [69],
  stayfinder_merge: [98],
  social_content_merge: [71],
  fitness_next_set_candidate: [70],
  linkedin_scraper_reserve: [73],
  code_editor_fail: [74],
  weather_context_merge: [77],
  marketplace_fail: [82, 100],
  captime_candidate: [84],
  health_summary_merge: [85],
  platform_metric_fail: [86],
  generic_api_fail: [88],
  apps_script_candidate: [90],
  no_violation_candidate: [92],
};

const profileByPosition = new Map();
for (const [profileId, positions] of Object.entries(groups)) {
  if (!profiles[profileId]) throw new Error(`Unknown profile: ${profileId}`);
  for (const position of positions) {
    if (profileByPosition.has(position)) throw new Error(`Duplicate position: ${position}`);
    profileByPosition.set(position, profileId);
  }
}

const existingPositions = new Set(rows
  .filter((row) => row.decision === "Existing" || row.matched_scenario_ids.length > 0)
  .map((row) => row.batch_position));
const expectedPositions = rows
  .filter((row) => !existingPositions.has(row.batch_position))
  .map((row) => row.batch_position);
const missing = expectedPositions.filter((position) => !profileByPosition.has(position));
const unexpected = [...profileByPosition.keys()].filter((position) => existingPositions.has(position));
if (missing.length || unexpected.length || profileByPosition.size !== expectedPositions.length) {
  throw new Error(`Batch map mismatch: ${JSON.stringify({ missing, unexpected, mapped: profileByPosition.size, expected: expectedPositions.length })}`);
}

const decisions = expectedPositions.map((position) => {
  const row = rows.find((item) => item.batch_position === position);
  const profileId = profileByPosition.get(position);
  const profile = profiles[profileId];
  return {
    batch_id: "EXH-001",
    batch_position: position,
    key: row.key,
    name: row.name,
    five_sentences: {
      input: profile.five[0],
      process: profile.five[1],
      immediate_result: profile.five[2],
      need_moment: profile.five[3],
      advantage: profile.five[4],
    },
    decision: profile.decision,
    decision_reason: `${row.name}: ${profile.reason}`,
    rejection_code: profile.code,
    reviewed_at: "2026-07-14",
    review_source: `manual_batch_001:${profileId}`,
    provisional_overridden: Boolean(row.provisional_decision && row.provisional_decision !== profile.decision),
  };
});

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${decisions.map((row) => JSON.stringify(row)).join("\n")}\n`);

const counts = decisions.reduce((result, row) => {
  result[row.decision] = (result[row.decision] || 0) + 1;
  return result;
}, {});
process.stdout.write(`${JSON.stringify({
  batch: "EXH-001",
  existing: existingPositions.size,
  reviewed: decisions.length,
  total: existingPositions.size + decisions.length,
  counts,
  candidateKeys: decisions.filter((row) => row.decision === "Candidate").map((row) => row.key),
  output: path.relative(ROOT, OUTPUT_PATH),
}, null, 2)}\n`);
