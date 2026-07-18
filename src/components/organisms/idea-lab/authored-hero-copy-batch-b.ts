import type { AuthoredHeroCopyBatch } from "./authored-hero-copy-types";

export const AUTHORED_HERO_COPY_BATCH_B = {
  "source-cozi-family-organizer": {
    hooks: {
      "moment-sunday-notices":
        "“일요일 밤 공지 사진이 쌓여, 월요일에 뭘 챙길지 막막한가요?”",
      "moment-morning-missing":
        "“등교 직전 준비물이 안 보일 때, 긴 공지를 처음부터 다시 읽나요?”",
      "moment-signature-deadline":
        "“동의서 마감 전날, 누가 서명해 어느 가방에 넣을지 헷갈리나요?”",
    },
    before: {
      "payer-multi-child-parent":
        "가정통신문과 학원 메시지가 섞여 아이별 준비물과 서명 마감을 다시 적습니다.",
      "payer-double-income-parent":
        "부부가 같은 공지 사진을 주고받으며 누가 무엇을 챙길지 다시 묻습니다.",
      "payer-shared-caregiver":
        "부모와 조부모가 학교 공지의 날짜와 준비물을 서로 다르게 이해합니다.",
    },
    after: {
      "twist-screenshot-input":
        "공지 사진 한 장을 올리면 아이별 준비물·서명·마감과 근거 문장이 나옵니다.",
      "twist-seven-days-only":
        "공지 내용을 붙여넣으면 앞으로 7일 동안 챙길 일과 근거 문장만 보입니다.",
      "twist-child-owner-chip":
        "공지 한 장을 올리고 담당자를 고르면 할 일마다 아이와 챙길 사람이 표시됩니다.",
    },
  },
  "source-game-assessment-prep": {
    hooks: {
      "moment-assessment-invite":
        "“게임형 채용 평가 초대를 받고, 규칙도 모른 채 시작할까 불안한가요?”",
      "moment-night-before-assessment":
        "“실전 평가 전날, 가장 낯선 게임 규칙이 아직도 헷갈리나요?”",
      "moment-after-slow-practice":
        "“연습할 때마다 시간이 모자라는데, 어디서 막혔는지 모르겠나요?”",
    },
    before: {
      "payer-first-game-assessment":
        "처음 보는 평가 규칙이 불안해 후기와 설명 영상을 여러 개 찾아봅니다.",
      "payer-career-game-assessment":
        "빠른 판단 게임마다 조작법과 시간 배분을 설명 영상에서 다시 찾아봅니다.",
      "payer-retry-game-assessment":
        "탈락 점수만 남아 느린 판단을 찾지 못한 채 같은 연습 문제를 반복합니다.",
    },
    after: {
      "twist-one-five-minute-game":
        "낯선 유형 하나를 고르면 규칙 설명·짧은 연습 문제·풀이 결과가 한 화면에 나옵니다.",
      "twist-slow-decision-replay":
        "연습 게임을 끝내면 가장 오래 걸린 문제와 내 답·정답이 나란히 보입니다.",
      "twist-one-retry-cue":
        "첫 연습을 마치면 바꿀 판단 기준 한 줄과 다시 풀 문제가 나옵니다.",
    },
  },
  "source-interactive-video-saas": {
    hooks: {
      "moment-before-video-send":
        "“설명 영상을 보내면서도, 꼭 알아야 할 내용을 이해했을지 걱정되나요?”",
      "moment-repeat-question":
        "“영상에서 설명한 질문이 또 왔는데, 어느 부분에서 막혔는지 모르겠나요?”",
      "moment-before-live-session":
        "“수업 시작 직전, 참가자가 기본 내용을 이해했는지 확인하기 어렵나요?”",
    },
    before: {
      "payer-video-course-instructor":
        "재생 기록만 남아 수강생마다 이해하지 못한 부분을 따로 물어봅니다.",
      "payer-franchise-trainer":
        "교육 영상을 보낸 뒤 안전과 응대 절차를 직원마다 다시 구두로 묻습니다.",
      "payer-saas-onboarding":
        "고객이 영상을 봤어도 멈춘 구간을 몰라 전체 영상을 다시 확인합니다.",
    },
    after: {
      "twist-one-checkpoint":
        "영상 주소와 질문 하나를 넣으면 답을 확인해야 이어 볼 수 있는 링크가 나옵니다.",
      "twist-confusing-moment":
        "시청자가 이해 안 됐어요를 누르면 막힌 영상 시점과 누른 횟수가 보입니다.",
      "twist-one-concept-result":
        "영상과 확인 문제를 보내면 사람별 정답 여부와 미응답 상태가 보입니다.",
    },
  },
  "source-screensage-pro": {
    hooks: {
      "moment-third-explanation":
        "“같은 설정 방법, 벌써 세 번째로 설명하고 있나요?”",
      "moment-before-handoff":
        "“내일 업무를 넘겨야 하는데, 따라 할 설명이 아직 없나요?”",
      "moment-after-ui-change":
        "“화면이 바뀌었는데, 예전 설명서를 아직 보내고 있나요?”",
    },
    before: {
      "payer-solo-cs":
        "고객마다 화면 공유를 다시 켜고 같은 메뉴를 처음부터 설명합니다.",
      "payer-ops-consultant":
        "프로젝트가 끝날 때마다 클릭 순서를 문서와 화면 사진으로 다시 만듭니다.",
      "payer-academy-admin":
        "새 직원이 올 때마다 여러 관리 화면의 순서를 옆에서 반복해 보여줍니다.",
    },
    after: {
      "twist-sixty-second-recording":
        "화면을 60초 녹화하면 클릭 순서가 세 단계 설명서로 정리됩니다.",
      "twist-private-blur":
        "녹화를 올리고 이름·이메일·금액이 보이는 곳을 고르면 가려진 단계 설명서가 나옵니다.",
      "twist-step-checklist":
        "60초 녹화를 올리면 영상 장면이 연결된 세 단계 확인 목록이 나옵니다.",
    },
  },
  "source-vlogmap": {
    hooks: {
      "moment-saved-food-reels-night":
        "“저장한 맛집 릴스 200개, 지금 몇 개나 찾아갈 수 있나요?”",
      "moment-before-sharing-food-route":
        "“친구가 보낸 맛집 영상, 가게 이름과 위치를 다시 검색하고 있나요?”",
      "moment-before-travel-route":
        "“여행 전날, 영상 속 장소의 이름과 위치를 못 찾아 동선을 못 짜고 있나요?”",
    },
    before: {
      "payer-food-video-saver": "저장은 3초인데 다시 찾는 건 20분",
      "payer-small-tour-designer":
        "맛집 영상마다 상호·위치·나온 시점을 따로 찾아 장소 목록에 옮깁니다.",
      "payer-location-coordinator":
        "여러 영상에서 후보 장소의 상호와 위치를 다시 찾아 지도에 옮깁니다.",
    },
    after: {
      "twist-food-short-link":
        "영상 링크 하나 붙여넣으면 상호·메뉴·위치를 뽑아 당신의 지도에 핀으로 꽂아줍니다. 정리 0분.",
      "twist-timestamp-evidence":
        "영상 주소를 넣으면 나온 시점·근거 문장·지도 주소가 붙은 장소 목록이 나옵니다.",
      "twist-one-day-route":
        "영상 주소와 출발지를 넣으면 장소별 방문 순서와 구간별 지도 링크가 나옵니다.",
    },
  },
  "source-seo-analyzer": {
    hooks: {
      "moment-before-page-release":
        "“새 페이지 공개 직전, 검색 결과가 엉뚱하게 보일까 불안한가요?”",
      "moment-after-no-search-entry":
        "“검색 결과의 제목과 설명이 이상한데, 무엇이 비었는지 모르겠나요?”",
      "moment-before-client-handoff":
        "“페이지를 넘기려는데, 검색 결과에서 어떻게 보일지 설명하기 어렵나요?”",
    },
    before: {
      "payer-freelance-web-builder":
        "페이지를 완성한 뒤 제목·설명·큰 제목의 누락을 화면마다 다시 확인합니다.",
      "payer-small-brand-marketer":
        "새 기획전 페이지가 검색 결과에 나올 조건을 갖췄는지 문서를 찾아 판단합니다.",
      "payer-small-seo-agency":
        "고객 페이지마다 기본 정보 누락을 찾아 개발자용 수정 요청으로 다시 씁니다.",
    },
    after: {
      "twist-four-seo-basics":
        "현재 페이지를 검사하면 제목·설명·큰 제목·대표 주소의 누락과 위치가 보입니다.",
      "twist-fix-order-not-score":
        "현재 페이지를 검사하면 먼저 고칠 검색 노출 오류와 현재 값이 순서대로 나옵니다.",
      "twist-search-preview":
        "현재 페이지를 검사하면 검색 결과에 보일 제목·설명과 잘리는 위치가 나옵니다.",
    },
  },
  "source-schema-validator-generator": {
    hooks: {
      "moment-after-schema-warning":
        "“검색 정보 경고를 받았는데, 실제로 어느 값을 고쳐야 할지 모르겠나요?”",
      "moment-before-campaign-indexing":
        "“상품 페이지를 검색에 보내기 전, 빠진 가격이나 날짜 정보가 걱정되나요?”",
      "moment-before-structured-data-handoff":
        "“검색 정보 점검 결과를 팀에 넘기려는데, 근거를 쉽게 설명하기 어렵나요?”",
    },
    before: {
      "payer-technical-seo-practitioner":
        "검색 경고 화면과 페이지 코드를 오가며 잘못된 속성의 위치를 찾습니다.",
      "payer-multi-client-web-agency":
        "상품과 행사 페이지마다 빠진 검색 정보를 찾아 개발자에게 다시 설명합니다.",
      "payer-ecommerce-growth-developer":
        "상품 틀을 바꿀 때마다 여러 페이지의 검색 정보 코드를 따로 확인합니다.",
    },
    after: {
      "twist-first-schema-block":
        "현재 페이지를 검사하면 첫 검색 정보 묶음의 종류·오류 위치·빠진 값이 나옵니다.",
      "twist-copy-ready-json-diff":
        "오류 묶음 하나를 고르면 원문과 수정안, 바뀐 줄과 재검사 결과가 나옵니다.",
      "twist-rich-result-readiness":
        "현재 페이지를 검사하면 검색 결과에 필요한 값 중 채운 것·빠진 것·형식 오류가 표로 나옵니다.",
    },
  },
  "source-data-scraper-ai-miner": {
    hooks: {
      "moment-after-copying-twenty-rows":
        "“같은 목록을 스무 줄째 옮겼는데, 아직 다음 페이지가 남았나요?”",
      "moment-before-weekly-list-update":
        "“지난주 표를 만든 지 얼마 안 됐는데, 이번 주 목록을 또 옮기고 있나요?”",
      "moment-before-sharing-source-table":
        "“수집한 표를 보내기 직전, 빠진 값이 있을까 원본과 다시 대조하나요?”",
    },
    before: {
      "payer-product-research-operator":
        "상품명·가격·평점을 페이지에서 복사해 표의 열마다 다시 붙여넣습니다.",
      "payer-public-list-researcher":
        "공개 목록의 제목·날짜·링크를 매주 표로 옮기며 빠진 줄을 다시 찾습니다.",
      "payer-ops-catalog-manager":
        "파트너 사이트의 공개 항목을 내려받을 표 형식에 맞춰 손으로 정리합니다.",
    },
    after: {
      "twist-current-page-only":
        "현재 페이지에서 반복 항목을 누르면 보이는 내용이 표로 정리돼 내려받아집니다.",
      "twist-three-example-cells":
        "이름·가격·링크의 예시 칸을 누르면 같은 구조의 행과 열이 표로 펼쳐집니다.",
      "twist-source-columns":
        "현재 페이지에서 항목을 고르면 원본 주소·수집 시각·빈칸 표시가 붙은 표가 나옵니다.",
    },
  },
  "source-ibm-equal-access-checker": {
    hooks: {
      "moment-before-accessible-release":
        "“새 페이지 공개 전, 키보드만 쓰는 사람을 막는 부분이 없다고 확신하나요?”",
      "moment-after-accessibility-report":
        "“화면을 쓰기 어렵다는 제보를 받았는데, 문제 위치를 찾지 못했나요?”",
      "moment-before-fix-ticket":
        "“찾은 이용 불편을 개발자에게 넘기려는데, 재현 방법을 설명하기 어렵나요?”",
    },
    before: {
      "payer-solo-saas-builder":
        "버튼 이름과 글자 대비, 입력칸 설명을 브라우저와 문서를 오가며 확인합니다.",
      "payer-small-web-qa-agency":
        "자동 검사 결과를 개발자가 찾을 위치와 쉬운 문장으로 다시 바꿉니다.",
      "payer-public-site-manager":
        "이용 불편 제보가 오면 여러 오류 중 무엇부터 고칠지 감으로 정합니다.",
    },
    after: {
      "twist-top-five-blockers":
        "현재 페이지를 검사하면 사용을 크게 막는 오류의 위치와 막히는 행동이 먼저 나옵니다.",
      "twist-korean-fix-location":
        "현재 페이지를 검사하면 오류마다 화면 위치·사용자 영향·고칠 항목이 한국어로 나옵니다.",
      "twist-ready-fix-ticket":
        "오류 하나를 고르면 주소·화면 요소·영향·수정 확인법이 담긴 작업 문서가 나옵니다.",
    },
  },
  "source-airix-aeo-ai-visibility-platform": {
    hooks: {
      "moment-before-ai-visibility-report":
        "“브랜드 보고서 마감인데, 인공지능 답변 속 경쟁사 차이를 설명하기 막막한가요?”",
      "moment-competitor-in-ai-answer":
        "“인공지능 답변에는 경쟁사만 나오는데, 우리 브랜드가 빠진 이유를 모르겠나요?”",
      "moment-before-product-launch-aeo":
        "“신제품 공개 날, 대표 질문의 인공지능 답변에 우리 제품이 빠져 있나요?”",
    },
    before: {
      "payer-small-brand-aeo":
        "같은 질문을 여러 인공지능에 반복 입력하며 자사 제품이 나오는지 확인합니다.",
      "payer-pr-agency-ai-mention":
        "브랜드별 질문·경쟁사·인용 주소를 표로 다시 정리해 고객에게 설명합니다.",
      "payer-ai-search-consultant":
        "개선 전후 같은 질문을 되묻고 브랜드가 나온 문장과 출처를 따로 저장합니다.",
    },
    after: {
      "twist-three-pasted-ai-answers":
        "브랜드명·질문·답변을 붙여넣으면 자사·경쟁사·출처가 나온 문장이 한 표에 보입니다.",
      "twist-missed-questions-first":
        "대표 질문과 답변을 넣으면 우리 브랜드만 빠진 질문과 경쟁사 문장이 먼저 나옵니다.",
      "twist-citation-opportunity":
        "답변의 출처 주소를 넣으면 경쟁사만 언급하고 우리 브랜드는 빠진 문장이 나옵니다.",
    },
  },
  "source-qr-reader-for-iphone": {
    hooks: {
      "moment-after-networking-event":
        "“행사 뒤 명함이 쌓였는데, 누구를 어디서 만났는지 흐려지고 있나요?”",
      "moment-before-followup-message":
        "“첫 후속 메시지를 보내려는데, 명함의 정확한 이름과 직함이 바로 떠오르나요?”",
      "moment-before-crm-import":
        "“새 연락처를 올리기 직전, 명함의 이름과 회사를 다시 입력하고 있나요?”",
    },
    before: {
      "payer-field-sales-card":
        "행사 뒤 명함의 이름·회사·전화번호를 한 장씩 다시 입력해 연락이 늦어집니다.",
      "payer-recruiter-card":
        "명함의 이름·회사·직함을 후보 목록에 한 칸씩 다시 입력합니다.",
      "payer-networking-freelancer":
        "명함 사진만 남겨둔 채 이름과 연락처를 찾느라 사진첩을 반복해 뒤집니다.",
    },
    after: {
      "twist-one-card-vcard":
        "명함 사진 한 장을 올리고 내용을 확인하면 휴대폰에 넣을 연락처 파일이 나옵니다.",
      "twist-ten-cards-csv":
        "명함 사진을 여러 장 올리면 누락 표시와 원본 사진이 붙은 연락처 표가 나옵니다.",
      "twist-followup-note":
        "명함 사진과 메모를 넣으면 만난 장소·대화 주제·후속 날짜가 연락처에 붙습니다.",
    },
  },
  "source-mapaan": {
    hooks: {
      "moment-before-outsourcing-content":
        "“외주 제작자에게 사이트 링크만 보내자니, 전혀 다른 분위기가 나올까 불안한가요?”",
      "moment-after-inconsistent-ai-output":
        "“만든 문구와 이미지가 우리 사이트와 달라, 요청문을 계속 고치고 있나요?”",
      "moment-before-rebrand-handoff":
        "“사이트를 바꿨는데, 팀 문서에는 예전 색과 문구가 아직 남아 있나요?”",
    },
    before: {
      "payer-small-brand-operator":
        "작업자마다 결과가 달라 브랜드 색과 말투, 금지 표현을 매번 설명합니다.",
      "payer-freelance-brand-designer":
        "고객 사이트를 돌아다니며 로고·색상·글꼴·대표 문구를 손으로 찾습니다.",
      "payer-content-agency-onboarding":
        "새 고객의 여러 페이지를 읽고 말투와 제품 표현을 별도 문서로 정리합니다.",
    },
    after: {
      "twist-homepage-brand-facts":
        "홈페이지 주소를 넣으면 로고·주요 색·글꼴·대표 문구와 찾은 위치가 나옵니다.",
      "twist-evidence-before-guideline":
        "홈페이지 주소를 넣고 항목을 고르면 화면 근거가 붙은 한 장 문서가 나옵니다.",
      "twist-prompt-ready-guardrails":
        "사이트 주소와 콘텐츠 종류를 넣으면 유지할 말투·피할 표현·복사할 요청문이 나옵니다.",
    },
  },
  "source-rightinbox-email-reminders": {
    hooks: {
      "moment-quote-no-reply":
        "“견적을 보낸 뒤 답장이 없는데, 원래 요청과 보낸 날짜를 다시 찾고 있나요?”",
      "moment-promised-date-passed":
        "“답을 주기로 한 날짜가 지났는데, 약속한 메일을 다시 찾고 있나요?”",
      "moment-before-weekly-inbox-close":
        "“금요일 퇴근 전, 답장 없는 보낸 메일을 하나씩 다시 찾고 있나요?”",
    },
    before: {
      "payer-quote-followup-sales":
        "보낸편지함을 검색하며 고객별 재연락 날짜를 개인 메모에 따로 적습니다.",
      "payer-recruiter-followup":
        "후보자와 면접관 중 누가 답하지 않았는지 찾다가 일정 확정이 늦어집니다.",
      "payer-freelance-proposal":
        "독촉처럼 보일까 미루다가 제안서와 청구서의 후속 연락을 놓칩니다.",
    },
    after: {
      "twist-paste-one-sent-email":
        "보낸 메일과 기다릴 날짜를 넣으면 요청 내용·재연락 날짜·짧은 후속 초안이 나옵니다.",
      "twist-promised-sentence-evidence":
        "메일 대화를 붙여넣으면 원래 요청·약속 문장·지난 날짜와 후속 초안이 나옵니다.",
      "twist-three-followup-due":
        "보낸편지함 검사를 누르면 답장이 없고 기한이 지난 연락 목록이 나옵니다.",
    },
  },
  "source-hotel-ninja": {
    hooks: {
      "moment-before-hotel-payment":
        "“호텔 결제 직전, 다른 사이트의 같은 방이 정말 더 싼지 확신하나요?”",
      "moment-cancellation-condition-needed":
        "“무료 취소 방만 골랐는데, 세금까지 넣으니 어느 곳이 싼지 헷갈리나요?”",
      "moment-before-sharing-hotel-options":
        "“숙소 후보를 보내려는데, 세금까지 넣으니 어느 곳이 싼지 헷갈리나요?”",
    },
    before: {
      "payer-frequent-hotel-traveler":
        "결제 단계에서 세금과 수수료가 붙어 예약 사이트 탭을 다시 오갑니다.",
      "payer-executive-travel-coordinator":
        "여러 예약 페이지의 표시 가격·세금·결제 통화를 표에 다시 적습니다.",
      "payer-small-tour-planner":
        "사이트마다 다른 객실 이름과 최종 결제액을 맞춰 비교표를 손으로 만듭니다.",
    },
    after: {
      "twist-two-open-tabs-only":
        "열어둔 예약 탭 두 개를 비교하면 객실 조건의 차이와 원화 최종가가 보입니다.",
      "twist-total-not-nightly":
        "예약 페이지 두 개를 비교하면 세금·수수료를 포함한 최종가와 더 싼 링크가 나옵니다.",
      "twist-condition-mismatch":
        "객실 페이지 두 개를 비교하면 날짜·조식·취소 조건의 다른 부분과 최종가가 나옵니다.",
    },
  },
  "source-fitnessai": {
    hooks: {
      "moment-between-weight-sets":
        "“한 세트를 끝낼 때마다, 다음 무게를 올릴지 그대로 둘지 고민하나요?”",
      "moment-after-missed-reps":
        "“목표 횟수를 연달아 못 채웠는데, 남은 운동을 어떻게 줄일지 모르겠나요?”",
      "moment-before-next-week-session":
        "“지난 운동 기록은 있지만, 오늘 얼마나 늘릴지 다시 계산하고 있나요?”",
    },
    before: {
      "payer-progressive-overload-worker":
        "지난 운동 기록과 오늘 계획표를 번갈아 보며 원판을 끼웠다 뺍니다.",
      "payer-small-pt-coach":
        "회원에게 힘든 정도를 묻고 지난 기록을 찾아 다음 원판을 고릅니다.",
      "payer-strength-hobbyist":
        "계획과 실제 수행이 어긋나면 증량·유지·감량 기준을 노트에서 다시 찾습니다.",
    },
    after: {
      "twist-one-exercise-next-set":
        "직전 무게·횟수·힘든 정도를 넣으면 다음 무게·횟수와 이유가 나옵니다.",
      "twist-failure-safety-rule":
        "최근 두 세트 기록을 넣으면 무게 유지·감량·운동 종료 중 하나가 나옵니다.",
      "twist-three-set-card":
        "최근 세트 기록과 오늘 목표를 넣으면 남은 세 세트의 무게와 횟수가 나옵니다.",
    },
  },
  "source-captime": {
    hooks: {
      "moment-before-interval-start":
        "“운동 시작 직전, 촬영 준비 때문에 첫 구간을 늦게 시작하나요?”",
      "moment-after-pr-attempt":
        "“운동이 끝난 뒤, 어느 구간부터 기록이 느려졌는지 찾기 어렵나요?”",
      "moment-before-sending-coach-video":
        "“코치에게 영상을 보내려는데, 세트마다 시작 지점을 다시 찾고 있나요?”",
    },
    before: {
      "payer-crossfit-self-review":
        "타이머와 카메라를 따로 켠 뒤 영상에서 각 운동 구간을 다시 찾습니다.",
      "payer-remote-fitness-coach":
        "회원의 긴 영상에서 세트별 시작 시각과 걸린 시간을 찾아 메모합니다.",
      "payer-small-box-operator":
        "참가자별 타이머 화면과 촬영 영상을 맞춰 기록 증거를 다시 정리합니다.",
    },
    after: {
      "twist-one-timer-video":
        "운동·휴식 시간과 반복 수를 정해 촬영하면 느려진 구간을 찾을 시간 표시가 영상에 남습니다.",
      "twist-auto-split-rounds":
        "타이머와 함께 찍은 영상을 올리면 세트별 시간과 재생 링크가 나옵니다.",
      "twist-round-time-drift":
        "나뉜 운동 영상을 올리면 세트별 차이와 가장 느린 구간의 재생 위치가 나옵니다.",
    },
  },
  "source-okegas": {
    hooks: {
      "moment-before-team-sheet-use":
        "“내일부터 팀이 함께 쓸 시트, 잘못된 입력 하나로 원본이 깨질까 불안한가요?”",
      "moment-forms-not-enough":
        "“일반 설문으로는 팀원에게 필요한 입력칸만 보여주기 어렵나요?”",
      "moment-after-sheet-input-error":
        "“팀원이 열을 지워 운영 기록이 깨졌는데, 다시 맡기기 불안한가요?”",
    },
    before: {
      "payer-sheet-ops-manager":
        "팀원이 운영 시트를 직접 고치다 열과 입력 형식이 자주 달라집니다.",
      "payer-class-admin-sheet":
        "수업 기록을 받는 칸과 형식을 바꾸려고 예제 코드를 찾아 복사해 붙입니다.",
      "payer-smartstore-backoffice":
        "직원에게 입력을 맡기려고 필요한 칸만 있는 내부 화면을 매번 새로 만듭니다.",
    },
    after: {
      "twist-header-to-insert-form":
        "시트의 열 제목을 붙여넣으면 입력 화면과 시트에 값을 넣는 코드가 나옵니다.",
      "twist-required-dropdown-inference":
        "열과 예시 행을 넣고 항목을 확인하면 필수값과 선택값이 반영된 입력 화면이 나옵니다.",
      "twist-preview-deploy-check":
        "시트 항목을 넣으면 입력 화면 미리보기와 공개 전 확인 목록이 나옵니다.",
    },
  },
  "source-noviolation": {
    hooks: {
      "moment-before-short-upload":
        "“완성한 짧은 영상을 올리기 직전, 어느 자막 문장이 규칙에 걸릴까 불안한가요?”",
      "moment-after-platform-strike":
        "“이전 영상의 문구가 경고를 받았는데, 같은 표현을 또 썼는지 모르겠나요?”",
      "moment-before-sponsored-deadline":
        "“납품 마감이 다가오는데, 어느 문구를 고쳐야 할지 근거를 못 찾았나요?”",
    },
    before: {
      "payer-daily-short-creator":
        "경고 이유를 몰라 게시 전에 영상과 자막을 처음부터 다시 확인합니다.",
      "payer-shortform-agency-editor":
        "게시할 곳마다 다른 금지 표현을 목록과 대조하며 마감 직전 자막을 다시 고칩니다.",
      "payer-commerce-video-marketer":
        "제품 효능과 가격 문구가 심사에 걸릴까 여러 담당자에게 반복해 묻습니다.",
    },
    after: {
      "twist-caption-one-rule-pack":
        "자막 파일과 게시할 곳을 고르면 위험 문장·나온 시점·규칙 원문이 나옵니다.",
      "twist-audio-frame-evidence":
        "짧은 영상을 올리면 위험 후보마다 나온 시점·문장·대표 장면·규칙이 붙습니다.",
      "twist-three-edit-checks":
        "짧은 영상을 올리고 게시할 곳을 고르면 먼저 고칠 구간과 적용된 규칙이 나옵니다.",
    },
  },
  "source-youtube-transcript-dev-extract-download-video-tr": {
    hooks: {
      "moment-youtube-transcript-dev-extract-download-video-tr-0":
        "“자막 없는 강의에서, 방금 들은 중요한 말을 놓쳤나요?”",
      "moment-youtube-transcript-dev-extract-download-video-tr-1":
        "“긴 강의에서 들은 그 발언이 어디였는지 기억나지 않나요?”",
      "moment-youtube-transcript-dev-extract-download-video-tr-2":
        "“동료에게 보낼 영상에서, 꼭 봐야 할 대목을 설명하기 어렵나요?”",
    },
    before: {
      "payer-youtube-transcript-dev-extract-download-video-tr-0":
        "자막 없는 강의를 멈추고 되감으며 중요한 문장을 직접 받아 적습니다.",
      "payer-youtube-transcript-dev-extract-download-video-tr-1":
        "긴 영상을 다시 훑어 핵심 발언의 시점과 문장을 메모장에 옮깁니다.",
      "payer-youtube-transcript-dev-extract-download-video-tr-2":
        "해외 강의를 멈춰가며 원문과 동료에게 보낼 요약을 따로 작성합니다.",
    },
    after: {
      "twist-youtube-transcript-dev-extract-download-video-tr-0":
        "유튜브 주소와 언어를 고르면 전체 글과 내용 흐름을 정리한 파일이 나옵니다.",
      "twist-youtube-transcript-dev-extract-download-video-tr-1":
        "유튜브 주소를 넣으면 영상에서 말한 내용이 글 파일로 내려받아집니다.",
      "twist-youtube-transcript-dev-extract-download-video-tr-2":
        "유튜브 주소를 넣으면 문단마다 나온 시점이 붙은 글과 내용 흐름표가 나옵니다.",
    },
  },
  "source-photogenius": {
    hooks: {
      "moment-photogenius-0":
        "“앨범 속 옛 사진이 빛바래, 추억의 장면을 알아보기 어렵나요?”",
      "moment-photogenius-1":
        "“기념일에 옛 사진을 선물하고 싶은데, 낡고 흐린 모습이 마음에 걸리나요?”",
      "moment-photogenius-2":
        "“옛 사진을 인화하기 전, 얼마나 손봐야 자연스러울지 불안한가요?”",
    },
    before: {
      "payer-photogenius-0":
        "빛바랜 가족사진을 골라 사진관과 여러 보정 도구의 결과를 번갈아 확인합니다.",
      "payer-photogenius-1":
        "오래된 사진을 여러 강도로 손보다 원본까지 손상될까 작업을 미룹니다.",
      "payer-photogenius-2":
        "낡은 사진을 손으로 보정하며 고객에게 자연스러운 강도를 반복해 묻습니다.",
    },
    after: {
      "twist-photogenius-0":
        "오래된 사진 한 장을 올리면 따뜻한 색과 또렷한 밝기를 입힌 복원 사진이 나옵니다.",
      "twist-photogenius-1":
        "오래된 사진을 올리고 보정 강도를 고르면 그 강도로 복원된 얼굴이 나옵니다.",
      "twist-photogenius-2":
        "오래된 사진 한 장을 올리면 원본과 복원본이 나란히 보입니다.",
    },
  },
  "source-mockly": {
    hooks: {
      "moment-mockly-0":
        "“채팅 기능 발표를 앞두고, 보여줄 대화 화면이 아직 비어 있나요?”",
      "moment-mockly-1":
        "“앱 소개 이미지 마감인데, 쓸 만한 대화 장면이 아직 없나요?”",
      "moment-mockly-2":
        "“기획서의 대화 흐름이 글로만 있어, 행동 순서를 설명하기 어렵나요?”",
    },
    before: {
      "payer-mockly-0":
        "구현 전 채팅 화면을 만들려고 말풍선을 디자인 도구에 하나씩 배치합니다.",
      "payer-mockly-1":
        "실제 기기에서 대화를 주고받아 캡처한 뒤 개인정보를 다시 가립니다.",
      "payer-mockly-2":
        "사람 이름·시간·읽음 표시가 있는 대화 화면을 기획서마다 새로 그립니다.",
    },
    after: {
      "twist-mockly-0":
        "대화 내용을 넣으면 익숙한 말풍선 모양의 채팅 화면 사진이 나옵니다.",
      "twist-mockly-1":
        "대화 내용을 붙여넣으면 휴대폰 틀에 담긴 채팅 화면 한 장이 나옵니다.",
      "twist-mockly-2":
        "대화 내용과 시간·읽음 표시를 넣으면 설정대로 만든 채팅 화면이 나옵니다.",
    },
  },
  "source-backdropboost": {
    hooks: {
      "moment-backdropboost-0":
        "“상품 사진이 비슷한 각도뿐이라, 쓰는 모습을 보여주기 어렵나요?”",
      "moment-backdropboost-1":
        "“오늘 광고를 올려야 하는데, 쓸 만한 생활 사진이 한 장도 없나요?”",
      "moment-backdropboost-2":
        "“흰 배경 상품을 광고에 올렸더니, 화면이 밋밋해 보이나요?”",
    },
    before: {
      "payer-backdropboost-0":
        "촬영 공간과 소품이 없어 같은 흰 배경 사진으로 상세페이지를 채웁니다.",
      "payer-backdropboost-1":
        "광고마다 다시 촬영하기 어려워 상품 사진과 배경을 손으로 합칩니다.",
      "payer-backdropboost-2":
        "상품 사진은 있어도 분위기를 보여줄 연출 사진이 없어 게시를 미룹니다.",
    },
    after: {
      "twist-backdropboost-0":
        "상품 사진 한 장을 올리면 주방·거실·카페에 놓인 연출 사진이 나옵니다.",
      "twist-backdropboost-1":
        "상품 사진과 배경 장면을 고르면 그 공간에 놓인 상품 사진이 나옵니다.",
      "twist-backdropboost-2":
        "상품 사진을 올리면 제품 모양은 그대로 두고 주변만 생활 공간으로 바뀝니다.",
    },
  },
  "source-tariffsapi": {
    hooks: {
      "moment-tariffsapi-0":
        "“해외 상품을 발주하기 전, 관세가 빠져 남는 돈이 달라질까 걱정되나요?”",
      "moment-tariffsapi-1":
        "“수입 견적을 보내기 직전, 관세가 빠져 금액을 다시 보낼까 불안한가요?”",
      "moment-tariffsapi-2":
        "“상담을 앞두고, 고객마다 다른 관세 자료가 뒤섞였나요?”",
    },
    before: {
      "payer-tariffsapi-0":
        "상품마다 국가와 품목 번호를 바꿔 조회하고 관세율을 견적표에 옮깁니다.",
      "payer-tariffsapi-1":
        "수입 견적에 필요한 국가·품목·관세율을 여러 문서와 계산표에서 대조합니다.",
      "payer-tariffsapi-2":
        "고객별 조회 결과에서 필요한 관세 항목만 골라 같은 형식으로 다시 정리합니다.",
    },
    after: {
      "twist-tariffsapi-0":
        "수입할 나라와 품목을 넣으면 비슷한 품목 번호 예시와 관세 자료가 표로 나옵니다.",
      "twist-tariffsapi-1":
        "국가와 품목을 넣으면 적용 관세율과 수출입 자료만 간단한 표로 나옵니다.",
      "twist-tariffsapi-2":
        "국가와 품목을 넣으면 관세율과 수출입 자료가 한국어 표와 원본 자료로 나옵니다.",
    },
  },
  "source-casora": {
    hooks: {
      "moment-casora-0":
        "“가구를 사기 전, 방에 안 어울려 후회할까 결제를 망설이고 있나요?”",
      "moment-casora-1":
        "“벽지와 바닥 색을 고르는데, 방 전체 모습이 상상되지 않나요?”",
      "moment-casora-2":
        "“가족에게 참고 사진만 보내니, 각자 다른 방을 상상하고 있나요?”",
    },
    before: {
      "payer-casora-0":
        "쇼핑몰 사진과 내 방 사진을 번갈아 보며 가구 배치를 머릿속으로 맞춥니다.",
      "payer-casora-1":
        "벽지와 바닥 후보를 상담 자료에 따로 붙여 완성된 방을 말로 설명합니다.",
      "payer-casora-2":
        "각자 찾은 인테리어 사진만 공유해 같은 방의 완성 모습 없이 의견이 갈립니다.",
    },
    after: {
      "twist-casora-0":
        "방 사진을 올리고 분위기를 고르면 그 모습으로 꾸민 방 시안이 나옵니다.",
      "twist-casora-1":
        "방 사진과 바꿀 색을 넣으면 서로 다른 인테리어 시안 세 가지가 나옵니다.",
      "twist-casora-2":
        "방 사진 한 장을 올리면 꾸미기 전과 바뀐 모습이 나란히 보입니다.",
    },
  },
  "source-finch": {
    hooks: {
      "moment-third-worry-night":
        "“같은 걱정을 오늘 밤 세 번째 떠올리며, 잠들지 못하고 있나요?”",
      "moment-friend-again":
        "“친구에게 같은 고민을 또 보내기 미안해, 혼자 되씹고 있나요?”",
      "moment-before-sleep-loop":
        "“불을 끄자 내일 걱정이 시작됐는데, 같은 생각의 반복인지도 모르겠나요?”",
    },
    before: {
      "payer-night-worrier":
        "걱정을 잊으려 메모와 운세 콘텐츠를 번갈아 열어도 잠을 미룹니다.",
      "payer-guiltfree-selfcare":
        "위로받으려 앱을 켰다가 못 지킨 목표와 끊긴 기록을 보고 죄책감을 느낍니다.",
      "payer-fortune-journal":
        "운세를 읽은 뒤 걱정의 변화를 여러 메모에 따로 남기고 다시 찾아봅니다.",
    },
    after: {
      "twist-guardian-ritual":
        "걱정 한 줄과 강도를 넣으면 짧은 호흡 뒤 오늘을 닫는 완료 카드가 나옵니다.",
      "twist-birth-guardian":
        "생년월일과 걱정 한 줄을 넣으면 수호동물과 오늘을 닫는 완료 카드가 나옵니다.",
      "twist-seven-day-heart-map":
        "일주일의 걱정·강도·시간을 넣으면 반복된 말과 자주 불안한 때가 한 장에 나옵니다.",
    },
  },
  "source-tickoff": {
    hooks: {
      "moment-tickoff-0":
        "“새 습관을 적어두고도, 오늘 했는지 표시할 곳이 없나요?”",
      "moment-tickoff-1":
        "“오늘 한 일을 바로 표시하지 않아, 기록에서 자꾸 빠뜨리나요?”",
      "moment-tickoff-2":
        "“습관을 며칠 이어왔는지 보려고, 달력의 표시를 다시 세고 있나요?”",
    },
    before: {
      "payer-tickoff-0":
        "하고 싶은 습관과 완료 표시가 여러 메모에 흩어져 시작을 자주 잊습니다.",
      "payer-tickoff-1":
        "운동 기록을 달력과 메모에 나눠 적어 어느 쪽이 최신인지 자주 헷갈립니다.",
      "payer-tickoff-2":
        "공부한 날짜를 적은 뒤 빠진 날이 없는지 지난 기록을 다시 훑습니다.",
    },
    after: {
      "twist-tickoff-0":
        "습관 하나를 추가하면 바로 시작할 예시와 이어온 날짜 표가 나옵니다.",
      "twist-tickoff-1":
        "습관 하나를 추가하면 오늘 할 목록과 이어온 기록만 한눈에 보입니다.",
      "twist-tickoff-2":
        "습관을 추가하고 오늘 완료를 누르면 현재 이어온 일수가 바로 보입니다.",
    },
  },
  "source-programmer-calculator": {
    hooks: {
      "moment-programmer-calculator-0":
        "“전송 전 오류 검사값이 다른데, 데이터와 입력 형식 중 무엇이 틀렸는지 모르겠나요?”",
      "moment-programmer-calculator-1":
        "“숫자 표기를 바꾼 뒤, 전송 전 오류 검사값도 맞는지 불안한가요?”",
      "moment-programmer-calculator-2":
        "“답을 제출하기 직전, 옮겨 적은 숫자 하나가 틀렸을까 불안한가요?”",
    },
    before: {
      "payer-programmer-calculator-0":
        "장비 기록의 16진수 값을 별도 계산기에 옮겨 오류 검사값을 다시 확인합니다.",
      "payer-programmer-calculator-1":
        "통신 묶음의 값을 여러 숫자 표기로 바꾸고 오류 검사값까지 손으로 대조합니다.",
      "payer-programmer-calculator-2":
        "문자열과 16진수 값을 옮겨 적고 오류 검사값을 별도 계산기에서 확인합니다.",
    },
    after: {
      "twist-programmer-calculator-0":
        "문자열이나 16진수 값을 넣으면 입력 예시와 오류 검사 결과가 한 화면에 나옵니다.",
      "twist-programmer-calculator-1":
        "문자열이나 16진수 입력 방식을 고르면 변환값과 오류 검사 결과가 나옵니다.",
      "twist-programmer-calculator-2":
        "문자열이나 16진수 값을 넣으면 10진수·16진수 변환값과 오류 검사 결과가 함께 나옵니다.",
    },
  },
  "source-mergeitai": {
    hooks: {
      "moment-mergeitai-0":
        "“거래처 명단과 입금 내역이 맞지 않아, 정산을 멈췄나요?”",
      "moment-mergeitai-1":
        "“고객 목록을 합치려는데, 같은 사람을 두 번 남길까 불안한가요?”",
      "moment-mergeitai-2":
        "“중복 고객을 지우려는데, 다른 거래 내역까지 합쳐질까 불안한가요?”",
    },
    before: {
      "payer-mergeitai-0":
        "거래처명과 입금자명이 다른 두 열을 오가며 같은 대상을 한 줄씩 찾습니다.",
      "payer-mergeitai-1":
        "띄어쓰기·영문명·약칭이 다른 고객 파일을 정렬해 후보를 손으로 대조합니다.",
      "payer-mergeitai-2":
        "중복 이름을 지우기 전 원본 행과 결제 내역을 다시 찾아 같은 고객인지 확인합니다.",
    },
    after: {
      "twist-mergeitai-0":
        "엑셀의 두 열을 넣으면 한글과 영문 표기가 다른 이름의 대응표가 나옵니다.",
      "twist-mergeitai-1":
        "엑셀의 두 열을 넣으면 사업자명과 입금자명 후보가 비슷한 순서로 나란히 보입니다.",
      "twist-mergeitai-2":
        "엑셀의 두 열을 넣으면 원본 행 번호가 붙은 대응표가 바로 보입니다.",
    },
  },
  "source-base44-downloader": {
    hooks: {
      "moment-base44-downloader-0":
        "“앱 제작 플랫폼을 옮기려는데, 이전 뒤 원본을 못 찾을까 불안한가요?”",
      "moment-base44-downloader-1":
        "“고객에게 작업물을 넘기려는데, 파일 누락으로 인수인계가 멈출까 걱정되나요?”",
      "moment-base44-downloader-2":
        "“작업 공간을 백업했는데, 전체 파일이 다 담겼는지 확신이 없나요?”",
    },
    before: {
      "payer-base44-downloader-0":
        "플랫폼을 옮기기 전 화면별 파일을 열어 복사하고 누락을 직접 확인합니다.",
      "payer-base44-downloader-1":
        "납품 코드와 설명 자료를 따로 모아 압축하고 열리는지 다시 점검합니다.",
      "payer-base44-downloader-2":
        "파일을 개별로 내려받아 폴더를 다시 만들고 빠진 백업이 없는지 확인합니다.",
    },
    after: {
      "twist-base44-downloader-0":
        "앱 코드 작업 공간을 넣으면 파일 안내가 붙은 압축 백업본이 나옵니다.",
      "twist-base44-downloader-1":
        "앱 코드 작업 공간을 넣으면 파일 구조가 읽기 쉬운 목록으로 정리됩니다.",
      "twist-base44-downloader-2":
        "앱 코드 작업 공간을 넣으면 이전용 압축본과 검수용 파일 목록이 함께 나옵니다.",
    },
  },
  "source-not-for-me-drink-less": {
    hooks: {
      "moment-not-for-me-drink-less-0":
        "“어젯밤 마신 양이 흐릿해져, 지난 기록과 비교하기 어렵나요?”",
      "moment-not-for-me-drink-less-1":
        "“이번 주 회식 전, 오늘도 마실지 쉬어갈지 기준이 흐릿한가요?”",
      "moment-not-for-me-drink-less-2":
        "“오늘 술을 쉬면 며칠째가 되는지 바로 떠오르지 않나요?”",
    },
    before: {
      "payer-not-for-me-drink-less-0":
        "전날 마신 잔 수를 기억에 의존해 적고 빠진 음주일을 다시 떠올립니다.",
      "payer-not-for-me-drink-less-1":
        "회식 일정과 별개로 최근 마신 날과 쉬었던 날을 달력에서 따로 셉니다.",
      "payer-not-for-me-drink-less-2":
        "술을 마신 날만 메모해 쉬었던 흐름과 현재 기록을 한눈에 보기 어렵습니다.",
    },
    after: {
      "twist-not-for-me-drink-less-0":
        "마신 날짜와 잔 수를 넣으면 이번 주 마신 날과 쉬었던 날이 달력에 나옵니다.",
      "twist-not-for-me-drink-less-1":
        "음주 기록을 넣으면 회식 다음 날의 기록과 쉬었던 날짜가 함께 보입니다.",
      "twist-not-for-me-drink-less-2":
        "음주 기록을 넣으면 부담 없는 응원 문구와 현재 이어온 기록만 보입니다.",
    },
  },
  "source-cantsayno": {
    hooks: {
      "moment-cantsayno-0":
        "“고백 카드 링크를 보내기 직전, 휴대폰에서 문구가 어색해 보이나요?”",
      "moment-cantsayno-1":
        "“고백 선물을 건네기 직전, 링크가 안 열리거나 문구가 어색할까 걱정되나요?”",
      "moment-cantsayno-2":
        "“장난스러운 고백을 하고 싶은데, 메신저 문장만으로는 심심한가요?”",
    },
    before: {
      "payer-cantsayno-0":
        "고백 문구와 사진을 따로 보내기 아쉬워 카드 화면과 링크를 직접 꾸밉니다.",
      "payer-cantsayno-1":
        "행사마다 사진·문구·버튼이 다른 고백 페이지를 새로 만들거나 외주를 기다립니다.",
      "payer-cantsayno-2":
        "선택의 재미를 살리려고 메신저 문구와 반응 버튼을 따로 준비합니다.",
    },
    after: {
      "twist-cantsayno-0":
        "카드 문구와 꾸밈을 고르면 싫어요 버튼이 도망가는 공유 카드가 나옵니다.",
      "twist-cantsayno-1":
        "커플 사진과 꾸밈 그림을 넣으면 한 번만 공유할 수 있는 고백 카드가 나옵니다.",
      "twist-cantsayno-2":
        "카드 문구와 꾸밈을 고르면 버튼을 누를 때마다 고백 문구가 바뀌는 페이지가 나옵니다.",
    },
  },
  "source-simplesvgs": {
    hooks: {
      "moment-simplesvgs-0":
        "“사이트 공개 직전, 큰 아이콘 때문에 페이지가 느려질까 걱정되나요?”",
      "moment-simplesvgs-1":
        "“아이콘을 전달하기 직전, 줄인 파일의 모양이 깨졌을까 불안한가요?”",
      "moment-simplesvgs-2":
        "“페이지가 느려졌는데, 어떤 아이콘 파일부터 줄일지 모르겠나요?”",
    },
    before: {
      "payer-simplesvgs-0":
        "그림 파일을 압축 사이트에 하나씩 올리고 원본과 모양을 다시 비교합니다.",
      "payer-simplesvgs-1":
        "아이콘의 불필요한 정보를 직접 지우고 브라우저에서 열리는지 확인합니다.",
      "payer-simplesvgs-2":
        "상품 아이콘이 늘 때마다 파일 용량을 확인하고 큰 파일만 따로 줄입니다.",
    },
    after: {
      "twist-simplesvgs-0":
        "선으로 된 그림 파일 하나를 올리면 모양을 유지해 용량을 줄인 파일이 내려받아집니다.",
      "twist-simplesvgs-1":
        "그림 파일을 올리면 불필요한 정보가 지워지고 줄어든 용량과 파일이 나옵니다.",
      "twist-simplesvgs-2":
        "대표 그림 파일 하나를 올리면 모양을 유지한 가벼운 파일이 나옵니다.",
    },
  },
  "source-michikanji": {
    hooks: {
      "moment-michikanji-0":
        "“모르는 한자를 쓸 때, 획순을 다른 영상에서 다시 찾고 있나요?”",
      "moment-michikanji-1":
        "“일본어 시험 복습 중, 책의 작은 획순 그림이 잘 안 보이나요?”",
      "moment-michikanji-2":
        "“한자 단어를 쓰기 전, 비슷한 모양의 획순이 섞여 헷갈리나요?”",
    },
    before: {
      "payer-michikanji-0":
        "문제집의 한자를 사전에서 찾고 쓰는 순서를 다른 영상에서 다시 확인합니다.",
      "payer-michikanji-1":
        "수업용 한자의 뜻과 쓰는 순서 자료를 각각 찾아 복습 목록을 만듭니다.",
      "payer-michikanji-2":
        "모르는 한자의 뜻과 쓰는 순서를 여러 사전에서 찾아 메모장에 옮깁니다.",
    },
    after: {
      "twist-michikanji-0":
        "한자·뜻·읽는 법 중 하나를 검색하면 시험 급수와 쓰는 순서가 나옵니다.",
      "twist-michikanji-1":
        "한국어 뜻을 검색하면 찾은 한자의 쓰는 순서가 움직이는 그림으로 나옵니다.",
      "twist-michikanji-2":
        "한자와 시험 급수를 고르면 해당 수준의 뜻·읽는 법·쓰는 순서가 나옵니다.",
    },
  },
} satisfies AuthoredHeroCopyBatch;
