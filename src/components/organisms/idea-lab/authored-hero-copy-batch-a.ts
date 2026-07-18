import type { AuthoredHeroCopyBatch } from "./authored-hero-copy-types";

export const AUTHORED_HERO_COPY_BATCH_A = {
  "source-lookup": {
    hooks: {
      "moment-signup-submit":
        "“회원가입을 받자마자 가짜 연락처가 또 저장될까 걱정되나요?”",
      "moment-lead-import":
        "“새 고객 명단에 연락조차 닿지 않을 주소가 섞여 있나요?”",
      "moment-risk-check":
        "“새 요청을 받기 전 연락처나 접속 주소가 수상해 그대로 받아도 될지 불안한가요?”",
    },
    before: {
      "payer-saas-builder":
        "서비스에 들어온 연락처와 접속 주소를 저장한 뒤에야 오류와 가짜 값을 찾아 지웁니다.",
      "payer-recruiter":
        "새로 받은 연락처를 고객 명단에 넣은 뒤 이메일과 전화번호가 닿는지 따로 확인합니다.",
      "payer-service-operator":
        "서비스에 들어온 연락처와 접속 주소를 여러 화면에서 대조한 뒤 요청을 받거나 막습니다.",
    },
    after: {
      "twist-one-value-status":
        "전화번호나 이메일 주소나 접속 주소 하나를 넣으면 사용 가능 여부와 판단 이유가 표시됩니다.",
      "twist-validation-reason":
        "전화번호나 이메일 주소나 접속 주소 하나를 넣으면 실패 이유와 다시 살필 항목이 한 줄로 나옵니다.",
      "twist-auto-detect-type":
        "전화번호나 이메일 주소나 접속 주소를 붙여넣으면 종류를 알아서 구분해 확인 결과를 보여줍니다.",
    },
  },
  "source-voice": {
    hooks: {
      "moment-hard-to-type":
        "“손을 쓰기 어려운데 긴 입력칸까지 비어 있어 막막한가요?”",
      "moment-walking":
        "“걷다가 떠오른 긴 문장을 적기 전에 자꾸 잊어버리나요?”",
      "moment-send-draft":
        "“답장은 급한데 손으로 치느라 생각보다 늦어지고 있나요?”",
    },
    before: {
      "payer-ops-writer":
        "회의나 통화에서 말한 내용을 여러 입력칸에 다시 타이핑하느라 전송이 늦고 빠진 문장도 생깁니다.",
      "payer-field":
        "현장에서 떠오른 관찰과 답장을 손이 자유로울 때까지 외우거나 짧게 끊어 입력합니다.",
      "payer-solo-maker":
        "아이디어와 답장을 머릿속에 붙잡은 채 휴대폰을 열어 한 글자씩 입력합니다.",
    },
    after: {
      "twist-one-minute-three-fields":
        "말한 내용을 녹음하면 받아쓴 원문과 짧게 줄인 글과 바로 붙여넣을 글이 세 칸에 나옵니다.",
      "twist-owner-deadline":
        "말한 내용을 녹음하면 글로 바뀌고 사람이나 날짜를 말한 문장에 확인 표시가 붙습니다.",
      "twist-source-audio-jump":
        "말을 녹음해 글로 바꾸면 각 문장 옆에 해당 목소리 구간을 재생하는 버튼이 붙습니다.",
    },
  },
  "source-shirt": {
    hooks: {
      "moment-client-send":
        "“최종 시안을 보내려는데 받는 사람이 완성 모습을 다르게 이해할까 망설여지나요?”",
      "moment-order":
        "“주문은 내일인데 티셔츠 색과 그림 위치 의견이 아직 엇갈리나요?”",
      "moment-sample":
        "“실물 샘플은 비싼데 그림 위치와 색이 맞을지 확신이 없나요?”",
    },
    before: {
      "payer-fashion-freelancer":
        "고객이 완성 모습을 알아보도록 같은 그림으로 여러 티셔츠 시안을 다시 만듭니다.",
      "payer-school-club":
        "부원들의 색상과 그림 위치 의견을 모을 때마다 시안을 고쳐 단체방에 올립니다.",
      "payer-small-brand":
        "실물 샘플을 주문하기 전에 여러 그림과 옷 색 조합을 손으로 만들어 비교합니다.",
    },
    after: {
      "twist-flat-front-back":
        "배경이 투명한 그림과 옷 색을 고르면 티셔츠 앞뒤 모습 두 장이 나옵니다.",
      "twist-print-boundary":
        "그림과 옷 색을 넣으면 인쇄할 수 있는 영역과 크기와 중앙선이 시안에 표시됩니다.",
      "twist-two-colors":
        "그림 하나와 옷 색 두 개를 고르면 같은 크기의 앞면 시안 두 장이 나란히 나옵니다.",
    },
  },
  "source-sales-commissions-ex-commet": {
    hooks: {
      "moment-before-commission-payroll":
        "“성과급을 보내기 직전인데 계산 근거가 맞는지 불안한가요?”",
      "moment-commission-dispute":
        "“직원이 성과급이 다르다고 묻자 어느 거래부터 봐야 할지 막막한가요?”",
      "moment-commission-rule-change":
        "“월말에 수수료 규칙이 바뀌어 지난 계산식을 잘못 쓸까 불안한가요?”",
    },
    before: {
      "payer-agency-commission":
        "계약 매출과 취소 내역을 표에 모은 뒤 사람마다 다른 비율을 다시 계산합니다.",
      "payer-course-sales-commission":
        "결제와 환불과 나눠 낸 금액을 대조하며 성과급 계산에 넣을 매출을 월말마다 다시 정합니다.",
      "payer-b2b-finance-commission":
        "영업 거래와 계약 규칙을 맞춰 보며 지급액과 빠진 건을 별도 표로 보고합니다.",
    },
    after: {
      "twist-one-rep-one-month":
        "거래 표와 수수료 규칙을 넣으면 한 사람의 성과급에 넣은 매출과 뺀 매출과 지급액이 나옵니다.",
      "twist-explain-calculation":
        "거래 표와 수수료 규칙을 넣으면 각 거래의 적용 비율과 제외 이유와 총액이 표시됩니다.",
      "twist-missing-fields":
        "거래 표를 넣으면 담당자나 날짜나 환불 여부가 빠진 줄이 표시되고 고친 뒤 거래별 지급액이 나옵니다.",
    },
  },
  "source-cross-post": {
    hooks: {
      "moment-local-post-ready":
        "“완성한 원고를 채널마다 붙여넣었는데 어디를 고칠지 막막한가요?”",
      "moment-local-event-today":
        "“행사는 곧 시작하는데 같은 공지가 채널마다 잘리거나 어색해 보이나요?”",
      "moment-local-weekly-calendar":
        "“게시물 검수 직전인데 어느 채널에서 문장이 잘릴지 불안한가요?”",
    },
    before: {
      "payer-local-brand-social":
        "같은 신상품 소식을 블로그와 인스타그램과 카카오채널에 맞춰 매번 다시 씁니다.",
      "payer-local-agency-social":
        "고객 원고의 길이와 말투를 채널마다 바꿔 별도의 검수 문서로 다시 만듭니다.",
      "payer-local-creator-social":
        "한 콘텐츠를 채널마다 붙여넣고 제목과 첫 문장과 검색에 붙일 단어를 따로 고칩니다.",
    },
    after: {
      "twist-local-three-channel-pack":
        "원고와 사진 한 장을 넣으면 블로그와 인스타그램과 카카오채널용 문구가 각각 나옵니다.",
      "twist-local-side-by-side":
        "원고 하나를 넣으면 세 채널의 제목과 첫 문장과 잘리는 위치를 나란히 보여줍니다.",
      "twist-local-publish-checklist":
        "원고를 넣으면 채널별 문구와 복사 버튼이 나오고 복사한 채널과 남은 채널이 표시됩니다.",
    },
  },
  "source-writing9": {
    hooks: {
      "moment-two-weeks-before-ielts":
        "“시험이 코앞인데 영어 글에서 점수를 막는 가장 큰 약점이 아직 안 보이나요?”",
      "moment-ielts-score-stuck":
        "“영어 작문 점수가 세 번 그대로라 무엇을 바꿔야 할지 막막한가요?”",
      "moment-before-essay-rewrite":
        "“에세이를 다시 고치려는데 어느 문단부터 손댈지 모르겠나요?”",
    },
    before: {
      "payer-first-ielts":
        "모범 답안을 여러 번 읽어도 내 글의 약한 기준을 몰라 같은 방식으로 다시 씁니다.",
      "payer-ielts-retaker":
        "영어 작문을 다시 쓸 때마다 논리와 어휘와 문법을 한꺼번에 고치다가 같은 실수를 남깁니다.",
      "payer-small-ielts-tutor":
        "학생마다 반복되는 약점과 근거 문장을 손으로 표시하느라 글을 고쳐 주는 시간이 길어집니다.",
    },
    after: {
      "twist-three-rubric-gaps":
        "시험 유형과 목표 점수와 에세이를 넣으면 약한 기준 세 개와 근거 문장이 나옵니다.",
      "twist-one-paragraph-practice":
        "에세이를 넣고 가장 약한 문단을 다시 쓰면 수정 전후 문장을 나란히 비교합니다.",
      "twist-before-after-rubric":
        "수정 전후 문단을 넣으면 좋아진 기준과 아직 남은 약점 하나가 표시됩니다.",
    },
  },
  "source-bankconv": {
    hooks: {
      "moment-before-tax-files":
        "“세무 자료를 곧 보내야 하는데 거래내역 표가 비어 있어 마음이 급한가요?”",
      "moment-bank-pdf-only":
        "“은행 문서의 표를 복사할 때마다 줄과 칸이 뒤섞이나요?”",
      "moment-before-monthly-settlement":
        "“월 결산 중인데 원문과 표의 거래 금액이 맞는지 불안한가요?”",
    },
    before: {
      "payer-freelancer-bookkeeping":
        "은행 문서만 받은 달에는 날짜와 거래처와 금액을 회계 표에 다시 입력합니다.",
      "payer-small-shop-bookkeeping":
        "복사할 수 없는 입출금 내역을 회계사에게 보내려고 여러 줄을 손으로 옮깁니다.",
      "payer-association-treasurer":
        "회원에게 결산을 보여주려고 은행 거래를 항목별 표로 매번 다시 정리합니다.",
    },
    after: {
      "twist-one-statement-csv":
        "은행 거래내역 문서 하나를 올리면 날짜와 내용과 입출금과 잔액이 표 파일로 나옵니다.",
      "twist-mask-account-number":
        "문서에서 계좌번호를 가리고 변환을 누르면 거래내역만 담긴 표 파일이 만들어집니다.",
      "twist-review-uncertain-rows":
        "은행 문서를 올리면 읽기 어려운 거래 줄을 원문 옆에서 고친 뒤 표 파일로 받습니다.",
    },
  },
  "source-story-short": {
    hooks: {
      "moment-daily-upload":
        "“오늘 올릴 영상이 없는데 촬영도 편집도 시작하지 못했나요?”",
      "moment-new-episode":
        "“새 글을 올렸는데 사람들이 보기 전에 알릴 영상까지 만들 여유가 없나요?”",
      "moment-event-notice":
        "“알릴 소식은 내일 시작하는데 오늘 보여줄 영상이 아직 없나요?”",
    },
    before: {
      "payer-shorts-creator":
        "얼굴을 찍지 않고 매일 영상을 채우려고 글과 사진을 편집 화면에 하나씩 배치합니다.",
      "payer-smallbiz-owner":
        "가게 소개 영상을 만들 때마다 낯선 편집 기능을 익히며 장면과 자막을 직접 맞춥니다.",
      "payer-web-novelist":
        "연재글을 알리려고 장면을 고르고 문장을 줄여 영상 자막으로 다시 만듭니다.",
    },
    after: {
      "twist-four-scene-muted":
        "짧은 글을 넣으면 세로 장면 네 개와 자막으로 된 무음 영상 초안이 나옵니다.",
      "twist-link-to-muted-draft":
        "공개된 글 주소를 넣고 내용을 확인하면 장면 네 개짜리 무음 영상 초안이 나옵니다.",
      "twist-storyboard-first":
        "글이나 공개 주소를 넣고 장면 네 개를 고치면 자막이 붙은 무음 영상이 만들어집니다.",
    },
  },
  "source-text-2-ics": {
    hooks: {
      "moment-schedule-image-arrives":
        "“새 시간표가 왔는데 일정이 겹칠까 달력에 옮기느라 마음이 급한가요?”",
      "moment-before-calendar-entry":
        "“일정 열 개를 휴대폰 달력에 하나씩 넣을 생각에 막막한가요?”",
      "moment-schedule-revised":
        "“수정된 일정표가 왔는데 바뀐 날짜를 달력에 다시 옮기다 틀릴까 불안한가요?”",
    },
    before: {
      "payer-multi-academy-parent":
        "학교와 학원 공지를 보며 아이별 날짜와 시간을 달력에 한 줄씩 다시 입력합니다.",
      "payer-shift-schedule-worker":
        "매달 받은 근무표를 휴대폰 달력에 옮기다가 날짜나 근무 시간을 잘못 입력합니다.",
      "payer-class-program-operator":
        "최종 일정표를 만든 뒤 참가자가 달력에 넣을 일정 파일을 따로 다시 작성합니다.",
    },
    after: {
      "twist-next-seven-days-ics":
        "시간표 문서를 넣으면 앞으로 일주일 일정 미리보기와 달력용 파일이 나옵니다.",
      "twist-conflict-preview":
        "새 일정표와 기존 달력 파일을 넣으면 겹치는 일정과 추가할 달력 파일이 나옵니다.",
      "twist-review-four-fields":
        "일정 이미지나 문서를 넣고 제목과 날짜와 시간과 장소를 확인하면 달력 파일이 만들어집니다.",
    },
  },
  "source-citron-app": {
    hooks: {
      "moment-before-grocery-from-video":
        "“장보러 나가야 하는데 영상 속 재료와 양을 다시 찾고 있나요?”",
      "moment-test-cook-video":
        "“새 메뉴를 처음 만들기 전인데 빠진 양과 순서가 불안한가요?”",
      "moment-share-video-recipe":
        "“글로 된 조리법을 달라는데 영상을 다시 보며 적을 생각에 막막한가요?”",
    },
    before: {
      "payer-reel-recipe-parent":
        "저장한 요리 영상을 멈추고 돌려보며 재료와 순서를 손으로 메모합니다.",
      "payer-small-cafe-menu":
        "새 메뉴를 시험할 때마다 영상 속 재료와 양과 과정을 한 장으로 다시 적습니다.",
      "payer-cooking-class-host":
        "수강생에게 보낼 준비물과 조리 단계를 긴 영상에서 찾아 직접 정리합니다.",
    },
    after: {
      "twist-sixty-second-clip-recipe":
        "사용 권한이 있는 짧은 요리 영상을 올리면 재료와 양과 단계와 영상 시점이 카드로 나옵니다.",
      "twist-unknown-amount-flags":
        "짧은 요리 영상을 올리면 재료와 단계가 나오고 말하지 않은 양과 시간에는 영상에 없음이 표시됩니다.",
      "twist-serving-scale":
        "영상에서 확인한 재료와 원래 인분과 만들 인원을 넣으면 바뀐 재료표와 단계가 나옵니다.",
    },
  },
  "source-fastpassphoto": {
    hooks: {
      "moment-before-passport-upload":
        "“공식 사진을 제출하거나 인쇄하기 직전인데 얼굴 크기나 배경이 맞는지 불안한가요?”",
      "moment-photo-booth-closed":
        "“사진관은 닫았고 서류 마감은 내일이라 마음이 급한가요?”",
      "moment-photo-size-rejected":
        "“사진 크기 오류로 거절됐는데 다시 찍어야 할지 막막한가요?”",
    },
    before: {
      "payer-passport-renewal":
        "사진관에 갈 시간을 내기 어려워 휴대폰 사진을 자르며 규격을 눈으로 맞춥니다.",
      "payer-child-passport":
        "아이 사진 여러 장을 번갈아 보며 얼굴과 배경이 쓸 만한 한 장을 직접 고릅니다.",
      "payer-visa-document-photo":
        "기관마다 다른 크기와 용량에 맞추려고 같은 사진을 여러 번 잘라 저장합니다.",
    },
    after: {
      "twist-one-country-one-file":
        "정면 사진과 국가와 서류 종류를 고르면 공식 크기에 맞춘 사진 파일이 나옵니다.",
      "twist-three-rejection-checks":
        "정면 사진을 올리면 얼굴 비율과 배경과 그림자 점검 결과와 규격에 맞춘 사진이 나옵니다.",
      "twist-six-up-print":
        "정면 사진을 규격에 맞게 자르고 확인한 뒤 고르면 자르는 선이 붙은 인쇄용 사진이 만들어집니다.",
    },
  },
  "source-reddit-growth": {
    hooks: {
      "moment-question-found":
        "“고객 질문을 찾았는데 내 답글이 광고처럼 보일까 망설여지나요?”",
      "moment-draft-sounds-promotional":
        "“직접 쓴 답글을 읽어보니 상품 자랑만 남은 것 같나요?”",
      "moment-launch-community-reply":
        "“출시 첫 답글부터 홍보로 몰려 대화가 끊길까 걱정되나요?”",
    },
    before: {
      "payer-saas-founder-reddit":
        "관련 커뮤니티를 매주 뒤지며 고객이 실제로 묻는 글과 답할 소재를 따로 모읍니다.",
      "payer-app-growth-reddit":
        "앱과 관련된 해외 커뮤니티 대화를 찾고 게시판마다 소개 문장을 따로 고칩니다.",
      "payer-niche-brand-reddit":
        "고객 질문과 반응을 여러 커뮤니티와 문서에서 찾아 별도로 정리합니다.",
    },
    after: {
      "twist-question-text-three-lines":
        "질문과 내 경험 한 줄을 넣으면 직접 겪은 일과 도움 되는 방법과 상품을 언급할 조건이 답변 세 문장으로 나옵니다.",
      "twist-no-product-name":
        "질문과 직접 해본 해결법을 넣으면 상품명 없이 경험과 방법과 주의점이 정리됩니다.",
      "twist-claim-check":
        "질문과 답변 초안을 넣으면 근거가 필요한 문장과 고친 문장이 함께 표시됩니다.",
    },
  },
  "source-party-imposter": {
    hooks: {
      "moment-dinner-silence":
        "“처음 만난 사람들이 말없이 앉아 있어 진행자인 내가 더 민망한가요?”",
      "moment-remote-awkward":
        "“대화 소재가 떨어지자 모두 휴대폰만 보고 있나요?”",
      "moment-same-game":
        "“지난 행사와 똑같은 종이 게임을 또 준비하고 있나요?”",
    },
    before: {
      "payer-people-ops-host":
        "신입들이 함께 말할 게임을 행사 때마다 새로 찾고 규칙을 다시 설명합니다.",
      "payer-youth-program-host":
        "참가 인원에 맞춰 종이 역할 카드를 만들고 매 판마다 손으로 다시 섞습니다.",
      "payer-boardgame-manager":
        "단체 손님이 올 때마다 익숙한 주제와 단어를 골라 종이 카드에 다시 적습니다.",
    },
    after: {
      "twist-secret-mission":
        "참가자 수를 고르면 각 사람에게 비밀 역할과 들키지 않고 할 행동이 한 줄로 나옵니다.",
      "twist-one-phone":
        "참가자 수를 누르면 휴대폰 한 대에 비밀 역할이 한 장씩 차례로 표시됩니다.",
      "twist-photo-category":
        "주변 사진 한 장을 찍으면 사진에 맞는 진짜 단어와 가짜 역할 카드가 만들어집니다.",
    },
  },
  "source-connected-knowledge": {
    hooks: {
      "moment-decision-proof":
        "“회의에서 지난 결정의 근거를 묻자 기억만 더듬고 있나요?”",
      "moment-interview-conflict":
        "“자료마다 서로 다른 말이 나와 어느 쪽이 맞는지 막막한가요?”",
      "moment-client-meeting":
        "“오래된 일을 곧 다시 꺼내야 하는데 지난 대화와 결정을 찾지 못했나요?”",
    },
    before: {
      "payer-product-researcher":
        "인터뷰 기록을 문서마다 나눠 저장한 뒤 비슷한 고객 발언을 검색해 다시 모읍니다.",
      "payer-strategy-consultant":
        "지난 고객 프로젝트의 근거와 아이디어를 폴더와 메신저에서 반복해서 찾아냅니다.",
      "payer-lab-researcher":
        "논문의 주장과 실험 결과와 연구 대화를 따로 기록한 뒤 관련 메모를 손으로 연결합니다.",
    },
    after: {
      "twist-three-doc-claim-map":
        "문서 세 개와 질문 하나를 넣으면 서로 맞는 내용과 엇갈린 내용과 원문 위치가 표로 나옵니다.",
      "twist-source-jump-only":
        "문서 세 개와 질문을 넣으면 찬성과 반대 근거가 파일명과 쪽수와 함께 나옵니다.",
      "twist-speaker-conflict":
        "화자와 날짜가 적힌 대화 기록을 넣으면 같은 의견과 반대 의견이 원문 위치와 함께 나옵니다.",
    },
  },
  "source-gallerywall": {
    hooks: {
      "moment-before-drilling-wall":
        "“첫 못을 박기 직전인데 액자 간격과 전체 폭이 맞는지 불안한가요?”",
      "moment-frames-arrived":
        "“액자를 바닥에 펼쳐도 벽에서 어떤 순서가 좋을지 모르겠나요?”",
      "moment-display-change":
        "“전시 벽을 바꾸고 싶은데 기존 못 자국이 더 늘까 망설여지나요?”",
    },
    before: {
      "payer-new-home-gallery":
        "액자를 바닥에 늘어놓고도 벽에 걸었을 때의 간격과 전체 크기를 짐작합니다.",
      "payer-small-cafe-wall":
        "계절 전시를 바꿀 때마다 액자를 걸었다 떼며 못 자국을 늘립니다.",
      "payer-photo-exhibition-host":
        "서로 다른 액자 크기를 벽 폭에 맞추려고 종이 도면을 반복해서 그립니다.",
    },
    after: {
      "twist-three-frames-only":
        "벽 크기와 액자 세 개의 크기를 넣으면 실제 간격이 표시된 배치안 하나가 나옵니다.",
      "twist-wall-photo-overlay":
        "벽 정면 사진과 실제 폭과 액자 크기를 넣으면 비율에 맞춘 배치가 사진 위에 보입니다.",
      "twist-hanging-measurements":
        "벽과 액자와 걸이의 치수를 넣으면 못을 박을 위치와 간격이 한 장 문서로 나옵니다.",
    },
  },
  "source-atlas-learning": {
    hooks: {
      "moment-homework-after-class":
        "“숙제 마감은 다가오는데 어느 개념을 놓쳤는지 모르겠나요?”",
      "moment-exam-week":
        "“시험이 일주일 남았는데 반복해서 틀린 개념부터 무엇을 볼지 막막한가요?”",
      "moment-mock-result":
        "“같은 개념을 또 틀렸는데 어느 부분부터 다시 배워야 할지 모르겠나요?”",
    },
    before: {
      "payer-nursing-student":
        "과목마다 흩어진 강의 자료를 다시 열어 숙제와 시험에 나올 개념을 손으로 정리합니다.",
      "payer-working-license-student":
        "교재와 필기를 오가며 방금 틀린 문제와 이어진 개념을 다시 찾습니다.",
      "payer-academy-instructor":
        "학생들의 틀린 문제를 교재 단원과 직접 연결해 사람마다 새 과제를 만듭니다.",
    },
    after: {
      "twist-wrong-answer-three-concepts":
        "수업 문서와 풀이가 보이는 오답 사진을 넣으면 빠진 개념과 근거가 나온 쪽이 나옵니다.",
      "twist-page-evidence-reteach":
        "수업 문서와 오답 사진을 넣으면 틀린 단계와 근거가 나온 쪽과 쉬운 설명 한 문장이 나옵니다.",
      "twist-two-minute-retest":
        "수업 문서와 오답 사진을 넣고 확인 질문에 답하면 빠진 핵심어와 다시 볼 자료 쪽이 표시됩니다.",
    },
  },
  "source-instanttradequote": {
    hooks: {
      "moment-after-site-quote":
        "“현장을 떠나려는데 고객이 기다리는 견적은 아직 메모 속에 있나요?”",
      "moment-client-asks-option":
        "“고객이 작업별 가격과 범위를 물어 바로 답이 막혔나요?”",
      "moment-before-quote-followup":
        "“어제 말한 가격과 오늘 보낼 견적이 다를까 불안한가요?”",
    },
    before: {
      "payer-home-repair-quote":
        "현장 방문 뒤 작업과 부품과 출장비를 메모에서 견적 양식으로 다시 옮깁니다.",
      "payer-event-install-quote":
        "현장마다 선택 작업과 제외 범위를 다시 설명하느라 견적 발송이 늦어집니다.",
      "payer-cleaning-quote":
        "평수와 추가 구역과 폐기물 비용을 메시지로 계산해 고객마다 다른 형식으로 보냅니다.",
    },
    after: {
      "twist-three-line-items":
        "고객명과 작업과 수량과 단가를 넣으면 합계와 유효기간이 붙은 한 장 견적서가 나옵니다.",
      "twist-option-line":
        "필수 작업과 선택 작업을 넣으면 기본 합계와 추가 작업을 고른 합계가 나뉜 견적서가 나옵니다.",
      "twist-included-excluded":
        "작업과 가격과 포함·제외 내용을 넣으면 고객에게 바로 보낼 한 장 견적서가 나옵니다.",
    },
  },
  "source-3ak-track": {
    hooks: {
      "moment-after-running-clip":
        "“방금 찍은 달리기 영상에서 어떤 장면을 먼저 봐야 할지 모르겠나요?”",
      "moment-before-coach-feedback":
        "“회원에게 보낼 자세 피드백에서 눈에 띄는 장면 하나를 못 고르겠나요?”",
      "moment-form-changed":
        "“오늘 달리기 자세가 달라 보이는데 어디가 변했는지 찾기 어렵나요?”",
    },
    before: {
      "payer-running-club-coach":
        "수업 뒤 회원 영상을 멈춰 보며 다음 연습에서 고칠 동작을 손으로 표시합니다.",
      "payer-school-track-coach":
        "선수마다 출발과 착지 영상을 돌려 보며 같은 순간의 자세를 직접 비교합니다.",
      "payer-amateur-runner":
        "느낌과 실제 자세가 다른지 확인하려고 촬영한 영상을 여러 번 멈춰 봅니다.",
    },
    after: {
      "twist-ten-second-pose-overlay":
        "옆에서 찍은 짧은 달리기 영상을 올리면 몸의 관절을 이은 선과 가장 크게 변한 장면이 나옵니다.",
      "twist-one-observable-cue":
        "짧은 달리기 영상을 올리면 다음 촬영에서 확인할 동작 한 가지와 비교 장면이 나옵니다.",
      "twist-before-after-frame":
        "같은 방향의 이전 영상과 오늘 영상을 넣으면 착지 순간 두 장에 몸의 관절을 이은 선이 표시됩니다.",
    },
  },
  "source-language-learning-video": {
    hooks: {
      "moment-caption-too-fast":
        "“같은 장면을 세 번 돌려봐도 영어 문장을 듣고 이해하기 어렵나요?”",
      "moment-expression-found":
        "“방금 들은 영어 표현을 써보고 싶은데 뜻과 나온 장면을 놓쳤나요?”",
      "moment-ten-minute-study":
        "“잠들기 전 잠깐 공부하려는데 영상 한 편도 너무 길게 느껴지나요?”",
    },
    before: {
      "payer-youtube-beginner":
        "한 문장을 놓칠 때마다 자막과 번역과 사전을 오가며 영상 흐름을 놓칩니다.",
      "payer-speaking-test":
        "영상에서 좋은 표현을 들어도 발음과 쓰임을 따로 찾은 뒤 말하기를 연습합니다.",
      "payer-parent-video-study":
        "아이와 볼 영상마다 따라 말할 문장을 고르고 뜻을 직접 풀어 설명합니다.",
    },
    after: {
      "twist-youtube-public-only":
        "공개 자막이 있는 유튜브 주소를 넣으면 원문과 한국어 뜻과 재생 시점이 문장별로 나옵니다.",
      "twist-three-expressions":
        "유튜브 주소를 넣으면 익힐 표현 세 개와 뜻과 재생 시점과 연습 문장이 나옵니다.",
      "twist-thirty-second-shadowing":
        "표현 구간을 듣고 따라 말해 녹음하면 놓친 단어와 원문 재생 시점이 표시됩니다.",
    },
  },
  "source-small-business-site": {
    hooks: {
      "moment-flyer-ready":
        "“전단은 완성했는데 휴대폰으로 보여줄 안내 페이지가 없나요?”",
      "moment-customer-asks-link":
        "“고객이 위치와 예약을 한 번에 볼 주소를 물어 난감한가요?”",
      "moment-opening-tomorrow":
        "“내일 문을 여는데 오늘 공유할 가게 홈페이지가 아직 없나요?”",
    },
    before: {
      "payer-local-pop-up":
        "행사 위치와 시간과 가격과 문의 방법을 휴대폰에 맞춰 다시 정리합니다.",
      "payer-local-service-shop":
        "고객에게 가게 이미지와 지도와 예약 방법을 여러 메시지로 나눠 보냅니다.",
      "payer-local-class-host":
        "수업 안내 이미지를 만든 뒤 신청과 주소와 문의 버튼이 있는 페이지를 다시 만듭니다.",
    },
    after: {
      "twist-flyer-photo-page":
        "전단 사진을 올리고 가게 정보를 확인하면 휴대폰용 안내 페이지 주소가 생깁니다.",
      "twist-one-screen-only":
        "가게 정보나 전단 사진을 넣으면 소개와 시간과 가격과 지도와 전화가 한 화면에 나옵니다.",
      "twist-local-action-buttons":
        "전단 사진과 신청 주소를 넣으면 지도와 전화와 신청 버튼이 붙은 안내 페이지가 나옵니다.",
    },
  },
  "source-audio-noise-cleaner": {
    hooks: {
      "moment-interview-hum":
        "“다시 녹음할 수 없는 음성에 에어컨 소리가 계속 들리나요?”",
      "moment-course-deadline":
        "“음성 파일을 보내거나 올릴 시간이 얼마 안 남았는데 녹음 전체에 잡음이 깔렸나요?”",
      "moment-wind-quote":
        "“꼭 써야 할 한마디가 바람이나 주변 소리에 묻혔나요?”",
    },
    before: {
      "payer-podcast-editor":
        "인터뷰마다 에어컨과 키보드 소리가 난 구간을 찾아 편집 화면에서 직접 줄입니다.",
      "payer-online-instructor":
        "집에서 녹음한 강의마다 잡음 설정을 다시 맞추고 전체 소리를 반복 확인합니다.",
      "payer-field-reporter":
        "바람과 차량 소리 사이에서 인터뷰 문장이 들리는 구간을 손으로 잘라냅니다.",
    },
    after: {
      "twist-before-after":
        "음성 파일을 올리면 원본과 잡음을 줄인 소리의 재생 버튼과 정리된 파일 저장 버튼이 나옵니다.",
      "twist-one-clean-button":
        "음성 파일을 올리고 소음 지우기를 누르면 잡음을 줄인 새 음성 파일이 나옵니다.",
      "twist-direct-recording":
        "음성 파일을 올리거나 휴대폰에서 목소리를 녹음하면 잡음을 줄인 소리가 바로 재생됩니다.",
    },
  },
  "source-safe-message-reply": {
    hooks: {
      "moment-ambiguous-customer":
        "“고객의 짧은 질문을 받고 어디까지 된다고 말할지 애매한가요?”",
      "moment-long-feedback":
        "“긴 수정 요청을 받고 놓친 내용이 있을까 회의 전부터 불안한가요?”",
      "moment-delay-message":
        "“수정과 마감 변경이 한꺼번에 와서 무엇부터 답할지 막막한가요?”",
    },
    before: {
      "payer-craft-shop-owner":
        "조건이 다른 고객 문의가 올 때마다 지난 답장을 찾아 문장을 고쳐 보냅니다.",
      "payer-junior-ui-designer":
        "짧은 영어 답장이 무례하게 들릴까 번역기와 메신저를 여러 번 오갑니다.",
      "payer-video-freelancer":
        "수정 요청과 마감 변경이 섞인 메시지에서 답할 항목을 메모장에 다시 적습니다.",
    },
    after: {
      "twist-work-message-three-facts":
        "업무 메시지 사진을 올리면 확정 사실과 확인 질문과 다음 행동이 원문 근거와 함께 나옵니다.",
      "twist-mask-before-upload":
        "메시지 사진에서 이름과 연락처와 얼굴을 가리면 확정 사실과 확인 질문과 다음 행동 세 칸이 만들어집니다.",
      "twist-request-checklist":
        "메시지 사진을 올리면 요청 항목과 기한과 답변이 필요한 내용이 원문 위치와 함께 나옵니다.",
    },
  },
  "source-video-dubbing": {
    hooks: {
      "moment-voicecheap-release":
        "“해외 공개를 앞두고 번역된 말투와 목소리가 자연스러운지 아직 확인하지 못했나요?”",
      "moment-voicecheap-course-update":
        "“강의를 고친 뒤 수정한 구간의 번역 자막과 목소리가 어긋났나요?”",
      "moment-voicecheap-term-check":
        "“번역 영상 공개 전, 자막과 새 목소리가 자연스럽게 맞는지 불안한가요?”",
    },
    before: {
      "payer-voicecheap-youtube":
        "새 영상마다 번역가와 성우에게 파일을 따로 보내고 완성된 음성의 시간을 다시 맞춥니다.",
      "payer-voicecheap-saas":
        "기능 소개 영상을 바꿀 때마다 자막을 복사해 언어별 편집 파일을 다시 만듭니다.",
      "payer-voicecheap-course":
        "강의를 수정할 때마다 각 언어의 음성과 자막을 손으로 다시 맞춥니다.",
    },
    after: {
      "twist-thirty-second-only":
        "영상에서 짧은 구간과 언어 하나를 고르면 번역 자막과 중립적인 목소리 미리보기가 나옵니다.",
      "twist-neutral-voice-only":
        "짧은 영상과 언어 하나를 넣으면 원문 자막과 번역 자막과 새 목소리 재생 버튼이 나옵니다.",
      "twist-three-term-check":
        "영상과 언어를 넣고 회사명이나 제품명을 고치면 올바른 이름으로 읽는 새 목소리가 나옵니다.",
    },
  },
  "source-bulk-shop-listing": {
    hooks: {
      "moment-smartstore-sheet-arrived":
        "“공급사 상품표를 받았는데 등록에 빠진 칸부터 찾기 어렵나요?”",
      "moment-smartstore-upload-error":
        "“대량 등록이 거절됐는데 어느 상품의 어느 칸이 틀렸는지 모르겠나요?”",
      "moment-smartstore-sale-tomorrow":
        "“기획전은 내일인데 올려야 할 상품 정보가 아직 제각각인가요?”",
    },
    before: {
      "payer-smartstore-brand":
        "공급사 표의 상품명과 가격과 선택 항목과 이미지를 등록 양식에 반복해서 옮깁니다.",
      "payer-smartstore-wholesale":
        "공급사마다 다른 항목 이름과 색상·크기 적는 방식을 한 대량 등록 양식에 다시 맞춥니다.",
      "payer-smartstore-agency":
        "고객 자료의 빈칸을 찾아 다시 요청하고 상품 등록 파일을 여러 번 새로 만듭니다.",
    },
    after: {
      "twist-smartstore-column-map":
        "공급사 상품 파일을 올리면 필수 항목이 맞춰진 스마트스토어 등록용 표 파일이 나옵니다.",
      "twist-smartstore-missing-only":
        "상품 파일을 올리면 빠졌거나 형식이 틀린 칸을 고친 뒤 등록용 표 파일을 받습니다.",
      "twist-smartstore-twenty-review":
        "상품 파일을 올리고 상품 정보를 묶음으로 확인하면 승인한 상품만 등록용 파일로 나옵니다.",
    },
  },
  "source-social-comment-guard": {
    hooks: {
      "moment-feedguardians-viral":
        "“댓글이 한꺼번에 쏟아져 무엇부터 확인할지 못 고르고 있나요?”",
      "moment-feedguardians-criticism":
        "“거친 댓글을 지우다 정상적인 불만까지 놓칠까 걱정되나요?”",
      "moment-feedguardians-weekend":
        "“주말 동안 여러 채널에 쌓인 나쁜 댓글을 어디부터 볼지 막막한가요?”",
    },
    before: {
      "payer-feedguardians-brand":
        "게시물이 올라올 때마다 여러 채널을 열어 광고 댓글과 욕설을 직접 지웁니다.",
      "payer-feedguardians-game":
        "새 소식 뒤 여러 채널을 돌며 버그 제보와 공격적인 댓글을 손으로 구분합니다.",
      "payer-feedguardians-creator":
        "수많은 댓글을 내려보며 실제 질문과 반복 광고를 따로 적습니다.",
    },
    after: {
      "twist-comment-export-reasons":
        "댓글 파일을 올리면 반복 광고와 유해 표현과 실제 질문과 정당한 비판이 이유와 함께 표로 나옵니다.",
      "twist-questions-first":
        "댓글 파일을 올리면 먼저 답할 질문과 광고 후보와 정당한 비판이 원문 줄과 함께 나옵니다.",
      "twist-comment-twenty-cards":
        "댓글 파일을 올리면 위험한 댓글이 판단 버튼과 함께 한 장씩 표시됩니다.",
    },
  },
  "source-meal-habit-loop": {
    hooks: {
      "moment-nutria-new-shift":
        "“야식 한 끼 때문에 오늘 식단을 통째로 포기하려 하나요?”",
      "moment-nutria-restart":
        "“식사 기록을 며칠 놓치자 다시 시작할 마음까지 사라졌나요?”",
      "moment-nutria-weekly-review":
        "“다음 끼니를 골라야 하는데 무엇 하나 바꿀지 아직 못 정했나요?”",
    },
    before: {
      "payer-nutria-shift-worker":
        "식단이 한 번 무너지면 하루를 포기하고 며칠 뒤 기록까지 그만둡니다.",
      "payer-nutria-solo-worker":
        "음식 사진을 며칠 남겨도 숫자만 확인하다가 다음 끼니 행동을 정하지 못합니다.",
      "payer-nutria-sales":
        "식사 사진을 남기고도 다음에 무엇을 바꿀지 약속하거나 지켰는지 확인하지 못합니다.",
    },
    after: {
      "twist-chosen-action-only":
        "음식 사진 한 장을 올리면 관찰과 따끔한 한마디와 다음 끼니 행동 하나가 나옵니다.",
      "twist-today-without-streak":
        "음식 사진을 올리면 다음 끼니 행동과 지켰는지 답할 두 버튼이 나옵니다.",
      "twist-seven-day-same-action":
        "음식 사진을 올리면 오늘의 복귀 행동이 나오고 같은 행동을 지킨 기록이 일주일 표로 표시됩니다.",
    },
  },
  "source-rocket-money": {
    hooks: {
      "moment-card-bill-spike":
        "“카드값이 갑자기 커졌는데 계속 빠지는 결제부터 찾지 못했나요?”",
      "moment-before-subscription-cleanup":
        "“안 쓰는 구독을 끊으려 해도 무엇을 결제 중인지 기억나지 않나요?”",
      "moment-project-ended":
        "“쓰던 서비스나 일이 끝났는데 다음 달에도 결제될 항목이 남았나요?”",
    },
    before: {
      "payer-many-subscriptions":
        "카드 명세서에 다르게 찍힌 결제처 이름을 기억에 의존해 구독 목록과 하나씩 맞춥니다.",
      "payer-family-card-manager":
        "자동이체와 가족 구독을 모아 반복 결제와 오른 금액을 표로 다시 만듭니다.",
      "payer-freelancer-expenses":
        "프로젝트가 끝난 뒤에도 남은 업무 도구 결제를 카드 명세서에서 뒤늦게 찾습니다.",
    },
    after: {
      "twist-statement-file-only":
        "최근 카드 거래 파일을 올리면 같은 결제처의 반복 결제와 마지막 금액이 나옵니다.",
      "twist-price-increase":
        "카드 거래 파일을 올리면 같은 결제처의 이전 금액과 최근 금액과 오른 폭이 표시됩니다.",
      "twist-next-month-list":
        "최근 거래 파일을 올리면 다음 달 예상 결제일과 최근 금액과 예상 합계가 나옵니다.",
    },
  },
  "source-due-date-radar": {
    hooks: {
      "moment-new-deadline-document":
        "“새 계약 문서를 닫고 나면 가장 가까운 기한을 잊을 것 같나요?”",
      "moment-renewal-notice-arrives":
        "“갱신 안내를 받았는데 만료일과 미리 알려야 할 날 중 무엇이 먼저인지 헷갈리나요?”",
      "moment-monthly-deadline-review":
        "“다음 달 기한을 보려다 문서 폴더 전체를 다시 뒤지고 있나요?”",
    },
    before: {
      "payer-small-academy-docs":
        "갱신 알림을 받을 때마다 달력 메모와 계약과 보험 문서를 다시 맞춰 봅니다.",
      "payer-restaurant-permits":
        "위생교육과 보험과 임대 계약의 날짜를 휴대폰에 직접 적고 근거 문서를 잊습니다.",
      "payer-freelancer-contracts":
        "계약서에서 상대에게 미리 알려야 할 날짜와 종료일을 따로 확인하다가 재협상할 시점을 놓칩니다.",
    },
    after: {
      "twist-one-doc-nearest-date":
        "문서를 올리면 가장 가까운 날짜와 그날이 만료·알림·납부 중 무엇인지와 다음 행동이 나옵니다.",
      "twist-three-date-types":
        "기한 문서를 올리면 날짜가 만료일과 미리 알릴 날과 납부일로 나뉘어 표시됩니다.",
      "twist-countdown-dates":
        "문서를 올리면 확인한 기한과 근거 문장과 미리 챙길 날짜가 한 장에 나옵니다.",
    },
  },
  "source-amazon-listing-images": {
    hooks: {
      "moment-stock-arrived":
        "“내 상품 사진이 작은 검색 화면에서 경쟁 상품보다 흐려 보이나요?”",
      "moment-competitor-changed":
        "“경쟁 상품 사진이 바뀐 뒤 내 사진에서 무엇이 빠졌는지 모르겠나요?”",
      "moment-export-deadline":
        "“해외 판매는 내일인데 현지 판매용 대표 사진이 아직 없나요?”",
    },
    before: {
      "payer-amazon-private-label":
        "상위 상품 사진을 캡처하고 따라야 할 구성을 표에 직접 정리합니다.",
      "payer-marketplace-agency":
        "검색어마다 경쟁 상품을 다시 조사해 대표 사진과 특징 사진과 사용 장면 사진을 따로 만듭니다.",
      "payer-export-manager":
        "국내 상품 사진을 해외 판매 규격에 맞추려고 외주 업체와 수정을 반복합니다.",
    },
    after: {
      "twist-one-reference-one-photo":
        "경쟁 상품 주소와 내 상품 사진을 넣으면 구성 차이와 흰 배경 대표 사진 초안이 나옵니다.",
      "twist-mobile-side-by-side":
        "경쟁 상품 주소와 내 사진을 넣으면 작은 검색 화면 크기의 두 대표 사진이 나란히 표시됩니다.",
      "twist-three-layouts-one-output":
        "경쟁 상품 주소와 내 사진을 넣으면 배경과 크기와 여백 기준과 새 대표 사진이 나옵니다.",
    },
  },
  "source-mobile-teleprompter": {
    hooks: {
      "moment-third-retake":
        "“같은 문장을 또 잊어 세 번째로 촬영을 멈췄나요?”",
      "moment-live-opening":
        "“촬영 시작이 코앞인데 첫 설명 순서가 떠오르지 않나요?”",
      "moment-client-update":
        "“오늘 영상을 보내야 하는데 숫자를 틀릴까 카메라를 못 보고 있나요?”",
    },
    before: {
      "payer-course-instructor":
        "긴 설명을 외우지 못해 문장마다 촬영을 멈추고 대본을 다시 확인합니다.",
      "payer-realestate-agent":
        "면적과 가격을 틀리지 않으려고 카메라 밖의 종이 메모를 반복해서 봅니다.",
      "payer-internal-comms":
        "임원 대본을 여러 장으로 출력하고 촬영 중 넘길 때마다 손짓으로 알려줍니다.",
    },
    after: {
      "twist-next-line-emphasis":
        "대본을 넣고 촬영하면 다음에 읽을 핵심 단어 하나가 화면에 크게 표시됩니다.",
      "twist-no-remote":
        "대본을 넣고 화면을 누르면 흐르던 글이 멈추고 다시 누르면 이어집니다.",
      "twist-reading-calibration":
        "예문을 소리 내어 읽으면 내 말속도에 맞춰 대본이 흐르는 미리보기가 나옵니다.",
    },
  },
  "source-site-audit-pro": {
    hooks: {
      "moment-after-completion-walkthrough":
        "“현장 사진은 쌓였는데 무엇을 고쳤는지 한눈에 보여주기 어렵나요?”",
      "moment-client-asks-proof":
        "“고객이 완료 사진을 다시 달라는데 사진첩을 또 뒤지고 있나요?”",
      "moment-before-final-payment":
        "“잔금 청구가 코앞인데 끝난 작업과 남은 문제를 나누지 못했나요?”",
    },
    before: {
      "payer-small-interior-contractor":
        "준공 사진을 보낼 때마다 작업과 위치와 수정 내용을 메시지로 다시 설명합니다.",
      "payer-store-maintenance-manager":
        "메신저방마다 흩어진 수리 전후 사진과 업체 메모를 월말마다 다시 모읍니다.",
      "payer-equipment-installer":
        "설치 사진을 보내고도 고객이 볼 부분을 찾지 못해 전화로 다시 설명합니다.",
    },
    after: {
      "twist-three-issues-only":
        "현장명과 사진 세 장과 설명을 넣으면 작업과 위치와 완료 상태가 붙은 보고서가 나옵니다.",
      "twist-before-after-pair":
        "같은 위치의 수리 전후 사진과 작업 설명을 넣으면 나란히 비교한 보고서가 나옵니다.",
      "twist-one-markup":
        "현장 사진에 원이나 화살표와 완료·남음 설명을 넣으면 표시한 위치가 담긴 한 장 보고서가 나옵니다.",
    },
  },
  "source-doughdojo": {
    hooks: {
      "moment-before-dough-mix":
        "“내일 쓸 반죽을 만들기 직전인데 반죽 계획을 어디서부터 맞출지 막막한가요?”",
      "moment-room-temperature-changed":
        "“오후 계획이 바뀌어 오늘 반죽 계획을 어디서부터 다시 맞출지 막막한가요?”",
      "moment-headcount-changed":
        "“인원이 늘어난 밤, 기존 반죽 계획에서 무엇부터 다시 계산할지 막막한가요?”",
    },
    before: {
      "payer-small-pizza-shop":
        "실내 온도와 판매량이 달라질 때마다 효모 양과 발효 시간을 경험으로 다시 맞춥니다.",
      "payer-pizza-popup":
        "도우 개수와 온도가 바뀔 때마다 제공 시각에 맞춰 반죽 시작 시간을 다시 셉니다.",
      "payer-pizza-class":
        "참가 인원에 맞춰 재료와 도우 한 덩이의 무게를 계산하고 수업 전 발효 시간을 다시 맞춥니다.",
    },
    after: {
      "twist-one-batch-plan":
        "도우 개수와 실내 온도와 제공 시각을 넣으면 한 배치의 재료와 반죽·발효 시각이 나옵니다.",
      "twist-next-action-only":
        "도우 개수와 현재 온도와 상태와 제공 시각을 넣으면 바뀐 계획의 다음 행동과 시작할 시각이 나옵니다.",
      "twist-rescale-balls":
        "기존 재료와 도우 개수와 새 개수를 넣으면 바뀐 재료 양과 한 덩이의 무게가 나옵니다.",
    },
  },
  "source-yeira-lms": {
    hooks: {
      "moment-day-three-empty":
        "“결제한 뒤 누가 첫 결과물을 냈고 누가 막혔는지 보이지 않나요?”",
      "moment-day-seven-risk":
        "“일주일째인데 첫 결과물을 받은 사람과 못 받은 사람이 뒤섞여 있나요?”",
      "moment-before-feedback":
        "“피드백 시간을 나누려는데 첫 결과물 제출 상태가 한눈에 안 보이나요?”",
    },
    before: {
      "payer-cohort-instructor":
        "결제 명단과 메신저와 제출 양식을 대조해 첫 결과물이 없는 사람을 찾습니다.",
      "payer-paid-challenge":
        "인증 글을 모아도 결제한 사람이 첫 결과물을 냈는지 표에서 다시 셉니다.",
      "payer-portfolio-coach":
        "이력서나 디자인이나 코드 같은 첫 결과물이 없는 수강생을 명단에서 따로 찾습니다.",
    },
    after: {
      "twist-first-output-not-progress":
        "결제한 사람의 이메일 명단과 제출 주소를 연결하면 아직 첫 결과물이 없는 이름이 나옵니다.",
      "twist-zero-list-only":
        "이름과 결제일과 제출 여부가 담긴 표를 넣으면 오늘 연락할 사람과 이유가 나옵니다.",
      "twist-one-submit-link":
        "수강생이 이메일과 결과물 하나를 내면 같은 이메일의 명단이 제출 완료로 바뀝니다.",
    },
  },
  "source-seating-hero": {
    hooks: {
      "moment-guest-list-final":
        "“행사는 이틀 남았는데 누가 어느 자리에 앉을지 아직 못 정했나요?”",
      "moment-last-minute-cancel":
        "“행사 당일 취소로 빈자리가 생기자 전체 배치가 무너졌나요?”",
      "moment-seating-conflict":
        "“뒤늦게 자리 하나를 바꿔야 한다는 말을 듣고 전체 배치가 꼬였나요?”",
    },
    before: {
      "payer-small-wedding-planner":
        "최종 참석자와 가족 관계를 메신저로 받아 표에서 테이블을 여러 번 다시 나눕니다.",
      "payer-paid-workshop-host":
        "팀과 직무와 처음 온 사람을 섞으려고 이름표를 보며 자리를 손으로 바꿉니다.",
      "payer-private-event-manager":
        "어린이 의자와 휠체어와 가족 단위를 반영해 예약 명단을 테이블별로 다시 적습니다.",
    },
    after: {
      "twist-three-tables-only":
        "참석자 열두 명과 테이블 세 개를 넣으면 테이블별 이름 목록이 나옵니다.",
      "twist-one-relationship-rule":
        "이름 목록과 함께 앉기나 따로 앉기 조건을 넣으면 충돌 없는 자리표가 나옵니다.",
      "twist-three-layouts":
        "참석자와 테이블 수와 관계 조건을 넣으면 조건을 지킨 자리 배치 세 가지가 나옵니다.",
    },
  },
} satisfies AuthoredHeroCopyBatch;
