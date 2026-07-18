import type { AuthoredHeroCopyBatch } from "./authored-hero-copy-types";

export const AUTHORED_HERO_COPY_BATCH_C = {
  "source-focusmate": {
    hooks: {
      "moment-alone-no-talk":
        "“밤에 각자 할 일을 하려는데 혼자서는 집중이 자꾸 끊기나요?”",
      "moment-call-too-heavy":
        "“친한 사람과 함께 집중하고 싶어도 긴 통화는 부담스러운가요?”",
      "moment-start-together":
        "“할 일을 시작하려는데 혼자서는 자꾸 시작을 미루게 되나요?”",
    },
    before: {
      "payer-low-energy-couple":
        "장거리 연인은 각자 할 일을 하려고 통화를 켜지만 대화가 길어져 함께 지칩니다.",
      "payer-bestfriend-presence":
        "따로 사는 친구들은 각자 할 일을 시작하려고 통화 시간을 잡고 할 말을 짜냅니다.",
      "payer-adhd-close-pair":
        "혼자 시작하기 어려운 직장인은 친한 사람에게 화상 통화나 작업 동행을 매번 부탁합니다.",
    },
    after: {
      "twist-private-campfire":
        "친한 사람에게 초대 주소를 보내 함께 들어오면 두 사람의 집중 자리가 켜진 비공개 모닥불 화면이 나타납니다.",
      "twist-presence-only":
        "두 사람이 같은 주소로 접속하면 카메라나 채팅 없이 각자 집중 중인지 보여주는 두 자리만 보입니다.",
      "twist-one-log-ritual":
        "각자 할 일을 마친 뒤 두 사람이 장작 버튼을 누르면 오늘 함께 집중한 공동 불씨 하나가 남습니다.",
    },
  },
  "source-prayer-timer": {
    hooks: {
      "moment-prayer-timer-0":
        "“업무 약속과 기도 시간이 겹칠까 하루 종일 마음이 쓰이나요?”",
      "moment-prayer-timer-1":
        "“낯선 도시에서 현지 기도 시간이 언제인지 막막한가요?”",
      "moment-prayer-timer-2":
        "“일에 몰두하다 다음 기도 시간을 놓칠까 걱정되나요?”",
    },
    before: {
      "payer-prayer-timer-0":
        "직장인은 지역 기도 시간표를 찾은 뒤 휴대폰 알람과 업무 일정을 따로 맞춥니다.",
      "payer-prayer-timer-1":
        "유학생은 도시가 바뀔 때마다 현지 시간표를 검색해 개인 일정표에 다시 적습니다.",
      "payer-prayer-timer-2":
        "식당 운영자는 기도 시간표와 직원 근무표를 번갈아 보며 교대 시간을 정합니다.",
    },
    after: {
      "twist-prayer-timer-0":
        "도시를 직접 고르면 그 지역의 오늘 기도 시간과 알림 시각이 한 화면에 나옵니다.",
      "twist-prayer-timer-1":
        "확인할 여러 도시를 고르면 도시별 오늘 기도 시간과 알림 시각을 나란히 비교한 표가 나옵니다.",
      "twist-prayer-timer-2":
        "위치 정보 대신 도시 이름을 입력하면 오늘의 기도 일정과 알림 시각이 표시됩니다.",
    },
  },
  "source-json-formatter": {
    hooks: {
      "moment-json-formatter-0":
        "“한 줄로 뭉친 응답을 읽다가 값과 인터넷 주소를 자꾸 놓치나요?”",
      "moment-json-formatter-1":
        "“받은 설정 파일의 안쪽 구조와 인터넷 주소가 한눈에 안 보이나요?”",
      "moment-json-formatter-2":
        "“연동 오류가 난 응답에서 관련 항목과 인터넷 주소를 찾기 어렵나요?”",
    },
    before: {
      "payer-json-formatter-0":
        "개발자는 한 줄로 뭉친 데이터를 편집기에 붙여 줄을 나누고 필요한 항목을 찾습니다.",
      "payer-json-formatter-1":
        "소규모 개발사는 설정 파일의 겹친 구조와 주소 값을 한 줄씩 눈으로 확인합니다.",
      "payer-json-formatter-2":
        "코딩 강사는 학생의 연동 응답을 복사해 괄호와 쉼표를 하나씩 대조합니다.",
    },
    after: {
      "twist-json-formatter-0":
        "중괄호로 된 데이터 글을 넣으면 밝거나 어두운 화면에서 읽기 좋게 줄 맞춘 결과가 나옵니다.",
      "twist-json-formatter-1":
        "긴 데이터 글을 넣으면 안쪽 항목을 접고 펼치며 구조를 확인하는 화면이 나옵니다.",
      "twist-json-formatter-2":
        "데이터 글을 넣으면 그 안의 인터넷 주소가 바로 눌러 열 수 있는 링크로 표시됩니다.",
    },
  },
  "source-billbatch": {
    hooks: {
      "moment-billbatch-0":
        "“해외 입금은 들어왔는데 어느 고객의 청구 건인지 바로 알기 어렵나요?”",
      "moment-billbatch-1":
        "“해외 고객에게 이름이나 통화가 틀린 청구서를 보낼까 걱정되나요?”",
      "moment-billbatch-2":
        "“월말 거래가 뒤섞여 어느 고객의 청구서가 빠졌는지 모르겠나요?”",
    },
    before: {
      "payer-billbatch-0":
        "프리랜서는 해외 결제 내역의 고객과 금액을 정산표와 청구서에 다시 옮깁니다.",
      "payer-billbatch-1":
        "수출업체 대표는 고객별 거래를 골라 통화와 품목을 청구서 양식에 다시 입력합니다.",
      "payer-billbatch-2":
        "혼자 일하는 개발자는 월말마다 거래를 고객별로 나누고 문서 이름과 폴더를 손으로 정리합니다.",
    },
    after: {
      "twist-billbatch-0":
        "해외 결제 거래 내역 파일을 넣으면 거래별 한국어 청구서가 인쇄용 문서로 나옵니다.",
      "twist-billbatch-1":
        "해외 결제 내역 파일을 넣으면 원화로 바꾼 금액 칸이 있는 청구서가 나옵니다.",
      "twist-billbatch-2":
        "여러 거래가 든 내역 파일을 넣으면 고객별 거래를 묶은 청구서 파일이 나옵니다.",
    },
  },
  "source-zeta-character-chat": {
    hooks: {
      "moment-choice-fatigue":
        "“잠깐 놀려다 캐릭터 대화에 끝이 없어 잘 시간이 지났나요?”",
      "moment-yesterday-forgotten":
        "“어제 대화가 끝없이 이어져 어디서 멈췄는지 떠올리기 어렵나요?”",
      "moment-ten-minutes-bed":
        "“잠들기 전 짧게 놀고 싶은데 끝없는 대화가 부담스러운가요?”",
    },
    before: {
      "payer-zeta-bedtime":
        "자기 전 가볍게 노는 사용자는 대화가 끝나지 않아 잠들 시점을 놓치고 앱을 억지로 닫습니다.",
      "payer-webnovel-status":
        "웹소설 독자는 전날 얻은 선택과 능력을 기억하려고 대화 내용을 따로 적어 둡니다.",
      "payer-character-memory":
        "유료 사용자는 쌓은 관계가 사라질 때마다 기록을 옮기거나 다른 대화 앱을 찾아갑니다.",
    },
    after: {
      "twist-one-world-24h":
        "오늘의 세계에 바로 들어가 선택을 이어가면 시작과 결말이 있는 짧은 모험 한 편이 완성됩니다.",
      "twist-permanent-skill":
        "짧은 모험을 끝내면 얻은 능력과 물건이 다음 모험에도 쓰이는 상태 카드로 저장됩니다.",
      "twist-fair-dice-ending":
        "행동을 고르면 주사위 값과 보유 능력과 최종 칭호가 한 장에 적힌 판정 카드가 남습니다.",
    },
  },
  "source-equatio-math-made-digital": {
    hooks: {
      "moment-equatio-math-made-digital-0":
        "“손글씨 수식을 옮기다 분수나 제곱근 기호를 잘못 적을까 불안한가요?”",
      "moment-equatio-math-made-digital-1":
        "“수학 문제는 준비됐는데 수식 입력 때문에 출제가 늦어지고 있나요?”",
      "moment-equatio-math-made-digital-2":
        "“수업 화면에서 수식이 깨져 학생이 문제를 읽기 어려운가요?”",
    },
    before: {
      "payer-equatio-math-made-digital-0":
        "수학 교사는 손글씨 분수와 제곱근 기호를 문서에 다시 입력하고 모양을 줄마다 확인합니다.",
      "payer-equatio-math-made-digital-1":
        "과외 강사는 문제와 선택지를 수식 편집기에서 만든 뒤 퀴즈 문서에 다시 배치합니다.",
      "payer-equatio-math-made-digital-2":
        "학원 원장은 칠판이나 종이에 쓴 수식을 학생용 자료에 하나씩 다시 입력합니다.",
    },
    after: {
      "twist-equatio-math-made-digital-0":
        "분수나 제곱근 기호 버튼을 눌러 식을 만들면 교과서처럼 정돈된 수학 문제가 화면에 나옵니다.",
      "twist-equatio-math-made-digital-1":
        "손으로 쓴 수식 사진을 넣으면 컴퓨터에서 글자와 기호를 고칠 수 있는 수식이 나옵니다.",
      "twist-equatio-math-made-digital-2":
        "수식 하나를 넣고 선택지를 적으면 학생이 바로 풀 수 있는 객관식 문제가 나옵니다.",
    },
  },
  "source-fan-sign-lettering": {
    hooks: {
      "moment-sign-print-today":
        "“인쇄 마감은 다가오는데 응원 부채 문구가 아직 완성되지 않았나요?”",
      "moment-sign-hard-to-see":
        "“완성한 응원 문구가 멀리서 보면 배경에 묻혀 버리나요?”",
      "moment-sign-hard-to-read":
        "“출력 미리보기에서 글자가 답답하게 붙어 한눈에 안 읽히나요?”",
    },
    before: {
      "payer-fanclub-sign-manager":
        "팬클럽 총무는 멤버별 문구마다 글자 크기와 배치를 편집 파일에서 다시 맞춥니다.",
      "payer-small-fan-goods-maker":
        "굿즈 제작자는 문구마다 글꼴과 테두리와 인쇄 크기를 손으로 조정합니다.",
      "payer-concert-sign-maker":
        "응원물 제작자는 주문 문구를 멀리서 보이게 하려고 글자 크기와 테두리를 반복해서 손봅니다.",
    },
    after: {
      "twist-sign-bold-outline":
        "응원 문구를 입력하면 멀리서도 글자가 드러나는 굵은 테두리 이미지가 나옵니다.",
      "twist-sign-two-line-layout":
        "긴 응원 문구를 입력하면 부채 안에서 읽기 좋게 두 줄로 나뉜 이미지가 나옵니다.",
      "twist-sign-print-size":
        "응원 문구와 부채 크기를 입력하면 인쇄 영역에 맞춰진 글자 이미지가 나옵니다.",
    },
  },
  "source-car-audio-mastering": {
    hooks: {
      "moment-car-master-before-release":
        "“발매할 랩 음악이 차에서 답답하게 들려 공개를 망설이고 있나요?”",
      "moment-car-master-before-delivery":
        "“납품 직전 차에서 들은 랩 음악이 아직 덜 다듬어진 느낌인가요?”",
      "moment-car-master-promo-video":
        "“차량 홍보 영상의 랩 음악이 차 안에서 어색하게 들리나요?”",
    },
    before: {
      "payer-car-master-independent-producer":
        "독립 제작자는 음악 파일을 차로 옮겨 듣고 저음과 목소리 균형을 다시 수정합니다.",
      "payer-car-master-release-engineer":
        "음향 엔지니어는 일반 재생본과 차량 재생본을 번갈아 들으며 발매 음악을 손봅니다.",
      "payer-car-master-small-studio":
        "소규모 작업실은 납품곡마다 차에서 듣고 저음과 목소리와 전체 음량을 다시 맞춥니다.",
    },
    after: {
      "twist-car-master-low-end":
        "랩 음악 파일을 넣으면 차에서 뭉치기 쉬운 저음을 정리한 새 음악 파일이 나옵니다.",
      "twist-car-master-vocal-clarity":
        "랩 음악 파일을 넣으면 차 안에서도 목소리가 또렷하게 들리도록 고친 파일이 나옵니다.",
      "twist-car-master-loudness":
        "랩 음악 파일을 넣으면 차에서 들리는 크기가 구간마다 고르게 맞춰진 파일이 나옵니다.",
    },
  },
  "source-github-milestone-video": {
    hooks: {
      "moment-github-milestone-changed":
        "“공개 프로젝트 수치가 바뀌었는데 예전 성과 영상만 남아 있나요?”",
      "moment-github-milestone-stars":
        "“프로젝트가 목표를 넘었는데 알릴 영상이 없어 소식이 늦어지나요?”",
      "moment-github-milestone-forks":
        "“이번 주 프로젝트 소식은 준비됐는데 영상 편집에서 막혔나요?”",
    },
    before: {
      "payer-github-milestone-maintainer":
        "공개 프로젝트 관리자는 받은 별과 복사 횟수가 늘 때마다 화면을 캡처해 영상에 다시 배치합니다.",
      "payer-github-milestone-founder":
        "개발자 창업자는 공개 프로젝트의 최신 수치를 확인해 영상 틀에 손으로 옮깁니다.",
      "payer-github-milestone-marketer":
        "개발자 마케터는 프로젝트 성과 수치를 복사해 게시 화면 비율마다 영상을 따로 만듭니다.",
    },
    after: {
      "twist-github-milestone-vertical":
        "공개 프로젝트 주소를 넣으면 이름과 받은 별과 복사 횟수가 담긴 세로형 영상이 나옵니다.",
      "twist-github-milestone-square":
        "공개 프로젝트 주소를 넣으면 이름과 받은 별과 복사 횟수가 담긴 정사각형 영상이 나옵니다.",
      "twist-github-milestone-horizontal":
        "공개 프로젝트 주소를 넣으면 이름과 받은 별과 복사 횟수가 담긴 가로형 영상이 나옵니다.",
    },
  },
  "source-video-frame-extractor": {
    hooks: {
      "moment-video-frame-thumbnail":
        "“영상 게시를 앞두고 선명한 대표 장면 한 장을 못 찾고 있나요?”",
      "moment-video-frame-client-review":
        "“수정한 장면을 설명하려는데 정확한 순간을 캡처하기 어렵나요?”",
      "moment-video-frame-quotation":
        "“자료에 넣을 영상 장면은 정했는데 화면 캡처가 흐릿하게 나오나요?”",
    },
    before: {
      "payer-video-frame-youtube-editor":
        "영상 편집자는 재생을 멈춰 화면을 캡처하거나 편집 프로그램에서 장면을 따로 저장합니다.",
      "payer-video-frame-shortform-creator":
        "짧은 영상 제작자는 재생 막대를 조금씩 움직여 여러 장을 캡처한 뒤 선명도를 비교합니다.",
      "payer-video-frame-delivery-manager":
        "납품 담당자는 영상마다 정확한 시점을 찾고 대표 장면을 손으로 저장합니다.",
    },
    after: {
      "twist-video-frame-png":
        "영상 파일과 원하는 시점을 넣으면 원본 크기를 유지한 선명한 사진 파일이 나옵니다.",
      "twist-video-frame-jpg":
        "영상 파일과 원하는 시점을 넣으면 용량은 작고 화면은 선명한 사진 파일이 나옵니다.",
      "twist-video-frame-timecode":
        "영상 파일과 원하는 시점을 넣으면 영상 속 시각이 파일 이름에 적힌 사진 파일이 나옵니다.",
    },
  },
  "source-large-file-share-link": {
    hooks: {
      "moment-large-file-attachment-limit":
        "“메일 용량 제한 때문에 큰 파일이 발송되지 않고 있나요?”",
      "moment-large-file-client-delivery":
        "“고객은 큰 시안을 기다리는데 첨부가 되지 않아 전달이 늦어지나요?”",
      "moment-large-file-before-meeting":
        "“회의가 곧 시작되는데 큰 자료를 참석자에게 아직 못 보냈나요?”",
    },
    before: {
      "payer-large-file-video-creator":
        "영상 제작자는 큰 파일의 용량을 줄이거나 여러 조각으로 나눠 상대에게 보냅니다.",
      "payer-large-file-freelance-designer":
        "디자이너는 큰 시안을 별도 저장소에 올리고 접근 권한과 주소를 다시 확인합니다.",
      "payer-large-file-field-worker":
        "현장 실무자는 회의 때마다 임시 저장소를 찾아 파일을 올리고 공유 주소를 복사합니다.",
    },
    after: {
      "twist-large-file-direct-download":
        "민감하지 않은 파일 하나를 올리면 상대가 눌러 바로 내려받는 공유 주소가 나옵니다.",
      "twist-large-file-browser-preview":
        "민감하지 않은 파일 하나를 올리면 상대가 인터넷 화면에서 바로 보는 공유 주소가 나옵니다.",
      "twist-large-file-view-count":
        "민감하지 않은 파일 하나를 올리면 몇 번 열렸는지 표시되는 공유 주소가 나옵니다.",
    },
  },
  "source-sheet-cut-layout": {
    hooks: {
      "moment-sheet-cut-before-order":
        "“큰 판을 주문하려는데 몇 장이 필요한지 계산이 확실하지 않나요?”",
      "moment-sheet-cut-before-sawing":
        "“톱질 직전인데 잘못 잘라 큰 판을 버릴까 불안한가요?”",
      "moment-sheet-cut-after-change":
        "“고객이 치수를 바꿔 큰 판의 절단 계획이 모두 틀어졌나요?”",
    },
    before: {
      "payer-sheet-cut-woodworker":
        "목공 작업자는 부품 치수와 톱날 두께를 종이에 대조하며 자를 위치를 손으로 그립니다.",
      "payer-sheet-cut-kitchen-maker":
        "가구 제작자는 부품을 큰 판 위에 직접 그려 보며 필요한 장수와 자를 위치를 계산합니다.",
      "payer-sheet-cut-interior-worker":
        "인테리어 실무자는 현장별 부품 치수와 수량을 손으로 배열하고 자르는 순서를 적습니다.",
    },
    after: {
      "twist-sheet-cut-minimize-waste":
        "큰 판의 크기와 톱날 두께와 부품 목록을 넣으면 자투리가 가장 적은 절단 배치도가 나옵니다.",
      "twist-sheet-cut-order":
        "큰 판의 크기와 톱날 두께와 부품 목록을 넣으면 자르는 순서가 번호로 적힌 배치도가 나옵니다.",
      "twist-sheet-cut-part-numbers":
        "큰 판의 크기와 톱날 두께와 부품 목록을 넣으면 각 부품 번호가 표시된 절단 배치도가 나옵니다.",
    },
  },
  "source-mermaid-diagram-export": {
    hooks: {
      "moment-mermaid-export-1":
        "“개발 검토 글에 넣을 구조 그림이 제대로 보일지 불안한가요?”",
      "moment-mermaid-export-2":
        "“기술 문서 마감이 다가오는데 흐름도 그림을 아직 못 만들었나요?”",
      "moment-mermaid-export-3":
        "“발표 자료에 넣을 순서 그림이 흐리거나 잘려 보이나요?”",
    },
    before: {
      "payer-mermaid-export-1":
        "개발자는 흐름도를 적은 코드를 별도 도구에서 열어 확인하고 그림 파일로 다시 저장합니다.",
      "payer-mermaid-export-2":
        "기술 책임자는 구조 변경 때마다 여러 도구를 오가며 흐름도 모양을 확인합니다.",
      "payer-mermaid-export-3":
        "발표 준비자는 기술 문서의 흐름도를 화면 캡처로 옮기거나 형식별로 다시 저장합니다.",
    },
    after: {
      "twist-mermaid-export-1":
        "흐름도를 적은 코드를 넣으면 다른 배경 위에도 올릴 수 있는 투명한 그림 파일이 나옵니다.",
      "twist-mermaid-export-2":
        "흐름도를 적은 코드를 넣으면 크게 키워도 선명한 그림 파일이 나옵니다.",
      "twist-mermaid-export-3":
        "흐름도를 적은 코드를 넣으면 선과 글자를 나중에 고칠 수 있는 그림 파일이 나옵니다.",
    },
  },
  "source-sketch-line-art": {
    hooks: {
      "moment-sketch-line-art-1":
        "“손그림을 채색하려는데 종이 흔적이 선과 함께 남아 있나요?”",
      "moment-sketch-line-art-2":
        "“인쇄할 손그림 도안에 종이 흔적이 남아 지저분해 보이나요?”",
      "moment-sketch-line-art-3":
        "“손그림을 화면 작업으로 옮기자 선과 종이 배경이 붙어 있나요?”",
    },
    before: {
      "payer-sketch-line-art-1":
        "일러스트레이터는 채색 전에 종이색과 그림자와 연필 얼룩을 손으로 지웁니다.",
      "payer-sketch-line-art-2":
        "웹툰 작가는 사진을 자르고 밝기를 조정한 뒤 손그림 선을 다시 따라 그립니다.",
      "payer-sketch-line-art-3":
        "굿즈 제작자는 인쇄 전에 종이 질감과 연필 번짐을 그림마다 반복해서 제거합니다.",
    },
    after: {
      "twist-sketch-line-art-1":
        "손그림 사진을 넣으면 종이 그림자를 지우고 배경을 투명하게 만든 선 그림이 나옵니다.",
      "twist-sketch-line-art-2":
        "연필 스케치 사진을 넣으면 번짐과 얼룩을 지운 투명 배경 선 그림이 나옵니다.",
      "twist-sketch-line-art-3":
        "흰 종이에 그린 사진을 넣으면 흰 부분을 투명하게 분리한 선 그림이 나옵니다.",
    },
  },
  "source-doc-to-cms-draft": {
    hooks: {
      "moment-doc-to-cms-1":
        "“게시 직전인데 온라인 원고의 모양이 달라져 발행을 미루고 있나요?”",
      "moment-doc-to-cms-2":
        "“고객 원고를 게시하려는데 붙여 넣을 때마다 모양이 달라지나요?”",
      "moment-doc-to-cms-3":
        "“긴 원고를 처음 붙여 넣자 원본 모양이 곳곳에서 달라졌나요?”",
    },
    before: {
      "payer-doc-to-cms-1":
        "콘텐츠 담당자는 온라인 문서를 게시판에 붙인 뒤 깨진 제목과 표와 이미지를 다시 고칩니다.",
      "payer-doc-to-cms-2":
        "콘텐츠 대행자는 고객 원고를 사이트마다 복사하고 흐트러진 문단과 표를 손봅니다.",
      "payer-doc-to-cms-3":
        "게시 담당자는 온라인 문서의 서식이 빠졌는지 원본과 게시 초안을 줄마다 대조합니다.",
    },
    after: {
      "twist-doc-to-cms-1":
        "공개 온라인 문서 주소를 넣으면 제목의 큰 단계와 작은 단계가 유지된 게시용 파일이 나옵니다.",
      "twist-doc-to-cms-2":
        "공개 온라인 문서 주소를 넣으면 이미지 설명이 빠지지 않은 게시용 파일이 나옵니다.",
      "twist-doc-to-cms-3":
        "공개 온라인 문서 주소를 넣으면 표의 행과 열 모양이 유지된 게시용 파일이 나옵니다.",
    },
  },
  "source-scene-white-balance": {
    hooks: {
      "moment-scene-white-balance-1":
        "“첫 제품 사진부터 흰색이 노랗거나 파랗게 찍힐까 걱정되나요?”",
      "moment-scene-white-balance-2":
        "“촬영 조명을 바꾸자 앞 장면과 색이 다르게 보이나요?”",
      "moment-scene-white-balance-3":
        "“색이 어긋나 재촬영하는데 같은 실수를 반복할까 불안한가요?”",
    },
    before: {
      "payer-scene-white-balance-1":
        "사진가는 장소와 조명이 바뀔 때마다 화면을 보며 흰색 기준을 눈대중으로 맞춥니다.",
      "payer-scene-white-balance-2":
        "촬영감독은 전문 측정기 없이 조명 빛의 색을 보고 카메라 설정값을 추정합니다.",
      "payer-scene-white-balance-3":
        "작업실 운영자는 조명 색이 맞지 않으면 여러 번 다시 찍고 촬영 후 색을 보정합니다.",
    },
    after: {
      "twist-scene-white-balance-1":
        "카메라로 조명 장면을 비추면 빛의 색을 나타내는 켈빈 수치가 바로 표시됩니다.",
      "twist-scene-white-balance-2":
        "카메라로 조명 장면을 비추면 흰색이 자연스럽게 보이는 권장 설정값이 나옵니다.",
      "twist-scene-white-balance-3":
        "카메라로 조명 장면을 비추고 저장하면 장면과 빛의 색을 나타내는 켈빈 수치가 함께 적힌 사진이 나옵니다.",
    },
  },
  "source-raster-to-svg": {
    hooks: {
      "moment-raster-to-svg-1":
        "“작은 로고를 크게 인쇄하려니 네모난 픽셀이 드러나나요?”",
      "moment-raster-to-svg-2":
        "“그림을 확대하자 가장자리가 계단처럼 깨져 보이나요?”",
      "moment-raster-to-svg-3":
        "“고객이 확대 가능한 로고 원본을 달라는데 가진 파일이 작은가요?”",
    },
    before: {
      "payer-raster-to-svg-1":
        "인쇄소 디자이너는 작은 로고를 크게 쓰려고 외곽선을 다시 그리거나 변환을 맡깁니다.",
      "payer-raster-to-svg-2":
        "레이저 공방 운영자는 고객 그림마다 기계가 따라갈 윤곽선을 손으로 다시 땁니다.",
      "payer-raster-to-svg-3":
        "프리랜서 디자이너는 고객의 작은 로고 가장자리를 펜 도구로 다시 그립니다.",
    },
    after: {
      "twist-raster-to-svg-1":
        "사진이나 그림 파일을 넣으면 윤곽을 단순하게 줄여 크게 키워도 선명한 그림 파일이 나옵니다.",
      "twist-raster-to-svg-2":
        "사진이나 그림 파일을 넣으면 거친 모서리를 다듬어 크게 키워도 선명한 그림 파일이 나옵니다.",
      "twist-raster-to-svg-3":
        "사진이나 그림 파일을 넣으면 작은 세부를 덜어 내고 크게 키워도 선명한 그림 파일이 나옵니다.",
    },
  },
  "source-notion-page-to-pdf": {
    hooks: {
      "moment-notion-pdf-1":
        "“노션 문서를 파일로 보내자 원본과 다른 모양으로 보이나요?”",
      "moment-notion-pdf-2":
        "“노션 문서를 인쇄하자 원래 페이지 배치가 달라지나요?”",
      "moment-notion-pdf-3":
        "“노션을 쓰지 않는 상대에게 같은 모양의 문서를 보내기 어렵나요?”",
    },
    before: {
      "payer-notion-pdf-1":
        "프리랜서는 노션 내용을 문서 편집기로 복사해 표와 배치를 다시 손봅니다.",
      "payer-notion-pdf-2":
        "교사는 노션의 표와 이미지가 잘리지 않도록 페이지마다 미리 보고 수정합니다.",
      "payer-notion-pdf-3":
        "팀 리더는 외부 전달 전에 어두운 배경과 표의 페이지 나눔을 손으로 조정합니다.",
    },
    after: {
      "twist-notion-pdf-1":
        "공개 노션 페이지 주소를 넣으면 원래 배치를 고정하고 표가 중간에 잘리지 않은 인쇄용 문서가 나옵니다.",
      "twist-notion-pdf-2":
        "공개 노션 페이지 주소를 넣으면 원래 배치를 고정하고 사진 비율을 유지한 인쇄용 문서가 나옵니다.",
      "twist-notion-pdf-3":
        "어두운 배경의 공개 노션 주소를 넣으면 원래 배치를 고정하고 글자가 종이에서도 선명한 문서가 나옵니다.",
    },
  },
  "source-chrome-extension-static-audit": {
    hooks: {
      "moment-extension-audit-1":
        "“새 브라우저 확장 기능이 어떤 권한을 가져가는지 확신이 없나요?”",
      "moment-extension-audit-2":
        "“확장 기능의 위험을 설명해야 하는데 문제 위치를 찾지 못했나요?”",
      "moment-extension-audit-3":
        "“다른 사람에게 설치를 권해도 안전한지 근거가 부족한가요?”",
    },
    before: {
      "payer-extension-audit-1":
        "회사 컴퓨터 관리자는 확장 기능마다 요청 권한과 외부 통신 여부를 손으로 검토합니다.",
      "payer-extension-audit-2":
        "보안 담당자는 확장 프로그램 파일을 풀어 외부 주소와 의심스러운 권한을 하나씩 찾습니다.",
      "payer-extension-audit-3":
        "브라우저 관리자는 개발자 도구와 파일 검색을 오가며 확장 기능의 위험 신호를 확인합니다.",
    },
    after: {
      "twist-extension-audit-1":
        "크롬 확장 프로그램 파일을 올리면 지나치게 넓은 권한과 그 위치가 적힌 보고서가 나옵니다.",
      "twist-extension-audit-2":
        "크롬 확장 프로그램 파일을 올리면 사용자 정보를 보낼 수 있는 외부 주소 목록이 나옵니다.",
      "twist-extension-audit-3":
        "크롬 확장 프로그램 파일을 올리면 알아보기 어렵게 숨겨 쓴 코드 파일의 위치가 나옵니다.",
    },
  },
  "source-maps-route-to-gpx": {
    hooks: {
      "moment-route-gpx-1":
        "“지도에서 확정한 경로를 길 안내 기기로 옮기기 어려운가요?”",
      "moment-route-gpx-2":
        "“긴 이동 경로를 보내도 참가자가 어느 길로 갈지 자꾸 묻나요?”",
      "moment-route-gpx-3":
        "“출발이 코앞인데 참가자마다 다른 길로 안내될까 불안한가요?”",
    },
    before: {
      "payer-route-gpx-1":
        "자전거 모임 운영자는 긴 경로를 지도에서 고친 뒤 구간별 파일로 다시 정리합니다.",
      "payer-route-gpx-2":
        "오토바이 안내자는 중간에 들를 곳과 되돌아갈 지점을 손으로 다듬어 참가자용 파일을 만듭니다.",
      "payer-route-gpx-3":
        "영상 제작자는 촬영 코스를 지도에서 편집한 뒤 공유용 경로 파일로 다시 만듭니다.",
    },
    after: {
      "twist-route-gpx-1":
        "공개 지도 경로 주소를 넣으면 중간에 들를 곳이 그대로 담긴 길 안내용 경로 파일이 나옵니다.",
      "twist-route-gpx-2":
        "공개 지도 경로 주소를 넣으면 긴 길이 구간별로 나뉜 길 안내용 경로 파일이 나옵니다.",
      "twist-route-gpx-3":
        "공개 지도 경로 주소를 넣으면 되돌아갈 지점 이름이 적힌 길 안내용 경로 파일이 나옵니다.",
    },
  },
  "source-pdf-layout-translation": {
    hooks: {
      "moment-pdf-layout-translation-1":
        "“영어 문서를 막 받았는데 읽고 답할 시간이 촉박한가요?”",
      "moment-pdf-layout-translation-2":
        "“번역한 문서에서 표와 그림이 어긋나 공유하기 어려운가요?”",
      "moment-pdf-layout-translation-3":
        "“회의가 곧 시작되는데 영어 자료를 아직 한국어로 못 옮겼나요?”",
    },
    before: {
      "payer-pdf-layout-translation-1":
        "기술 문서 담당자는 영어 문장을 옮긴 뒤 원본을 보며 표와 그림 위치를 다시 맞춥니다.",
      "payer-pdf-layout-translation-2":
        "기업 조사자는 영어 보고서를 번역하고 회의용 페이지 배치와 서식을 손으로 정리합니다.",
      "payer-pdf-layout-translation-3":
        "무역 실무자는 거래처 문서를 번역한 뒤 표와 각주와 페이지 구성을 직접 고칩니다.",
    },
    after: {
      "twist-pdf-layout-translation-1":
        "영어 인쇄용 문서를 넣으면 표의 행과 열 위치가 유지된 한국어 인쇄용 문서가 나옵니다.",
      "twist-pdf-layout-translation-2":
        "영어 인쇄용 문서를 넣으면 사진과 그 아래 설명 위치가 유지된 한국어 인쇄용 문서가 나옵니다.",
      "twist-pdf-layout-translation-3":
        "영어 인쇄용 문서를 넣으면 페이지 아래 참고 문구와 연결 주소가 유지된 한국어 문서가 나옵니다.",
    },
  },
  "source-freight-invoice-internal-audit": {
    hooks: {
      "moment-freight-invoice-audit-1":
        "“운송 청구서를 받았는데 비용 오류가 있을까 지급을 망설이나요?”",
      "moment-freight-invoice-audit-2":
        "“지급 승인 직전인데 청구서 어디가 잘못됐는지 확신이 없나요?”",
      "moment-freight-invoice-audit-3":
        "“월말 마감이 다가오는데 운송 청구서 검수가 아직 끝나지 않았나요?”",
    },
    before: {
      "payer-freight-invoice-audit-1":
        "물류 정산 담당자는 운송비 항목을 줄마다 확인하고 청구 총액을 다시 계산합니다.",
      "payer-freight-invoice-audit-2":
        "운송비를 내는 회사의 재무 담당자는 비용 항목과 합계를 지급 전에 손으로 대조합니다.",
      "payer-freight-invoice-audit-3":
        "물류 비용 검수자는 운송장과 청구서를 오가며 중복 비용과 빠진 항목을 표시합니다.",
    },
    after: {
      "twist-freight-invoice-audit-1":
        "화물 청구서 문서를 넣으면 비용을 더한 값과 청구 총액의 차이를 표시한 표 파일이 나옵니다.",
      "twist-freight-invoice-audit-2":
        "화물 청구서 문서를 넣으면 화물 운송장 번호와 날짜와 금액이 모두 같은 중복 후보가 나옵니다.",
      "twist-freight-invoice-audit-3":
        "화물 청구서 문서를 넣으면 화물 운송장 번호와 청구일과 결제 통화가 빠진 위치를 적은 표가 나옵니다.",
    },
  },
  "source-fits-sky-locator": {
    hooks: {
      "moment-fits-sky-locator-1":
        "“천체 사진을 찍고도 목표한 하늘 영역이 맞는지 모르겠나요?”",
      "moment-fits-sky-locator-2":
        "“다음 촬영 구도를 바꾸려는데 지난 사진의 위치를 못 찾겠나요?”",
      "moment-fits-sky-locator-3":
        "“관측 기록을 내야 하는데 사진이 담은 하늘 좌표가 비어 있나요?”",
    },
    before: {
      "payer-fits-sky-locator-1":
        "천체 사진가는 사진 속 별 무늬를 별 지도와 대조해 촬영 좌표를 손으로 맞춥니다.",
      "payer-fits-sky-locator-2":
        "천문 동아리 교사는 학생 사진과 별자리 자료를 나란히 보며 촬영 대상을 설명합니다.",
      "payer-fits-sky-locator-3":
        "천문대 운영자는 사진의 별 배치를 지도와 대조해 위치를 관측 기록에 옮깁니다.",
    },
    after: {
      "twist-fits-sky-locator-1":
        "천체 관측 사진 파일을 넣으면 사진 중심의 하늘 좌표가 찍힌 별 지도가 나옵니다.",
      "twist-fits-sky-locator-2":
        "천체 관측 사진 파일을 넣으면 실제로 찍힌 영역의 테두리가 별 지도 위에 표시됩니다.",
      "twist-fits-sky-locator-3":
        "천체 관측 사진 파일을 넣으면 사진 속 주요 별과 천체 이름이 붙은 지도가 나옵니다.",
    },
  },
  "source-youtube-hidden-tag-export": {
    hooks: {
      "moment-youtube-tag-export-1":
        "“영상 업로드를 앞두고 내 제목이 검색에서 묻힐까 불안한가요?”",
      "moment-youtube-tag-export-2":
        "“조사 마감이 다가오는데 경쟁 영상 검색어 표가 아직 비어 있나요?”",
      "moment-youtube-tag-export-3":
        "“고객 영상 검수 마감인데 빠진 검색어가 있는지 확신이 없나요?”",
    },
    before: {
      "payer-youtube-tag-export-1":
        "영상 제작자는 경쟁 영상의 페이지 내용과 확장 도구를 오가며 숨은 검색어를 복사합니다.",
      "payer-youtube-tag-export-2":
        "콘텐츠 마케터는 영상별 숨은 검색어를 표에 붙이고 근거 화면을 따로 저장합니다.",
      "payer-youtube-tag-export-3":
        "영상 편집자는 고객 영상과 경쟁 영상의 숨은 검색어를 찾아 검수 목록을 손으로 만듭니다.",
    },
    after: {
      "twist-youtube-tag-export-1":
        "유튜브 영상 주소를 넣으면 숨은 검색어가 원래 순서대로 적힌 글 파일이 나옵니다.",
      "twist-youtube-tag-export-2":
        "유튜브 영상 주소를 넣으면 겹치는 검색어를 하나로 줄인 표 파일이 나옵니다.",
      "twist-youtube-tag-export-3":
        "유튜브 영상 주소를 넣으면 여러 단어로 된 긴 검색어부터 정렬한 표 파일이 나옵니다.",
    },
  },
  "source-masked-cookie-profile": {
    hooks: {
      "moment-masked-cookie-profile-1":
        "“로그인 오류가 재현된 지금 브라우저 상태를 남기기 어렵나요?”",
      "moment-masked-cookie-profile-2":
        "“로그인 정보를 지우기 전 어떤 설정이 문제였는지 기록이 없나요?”",
      "moment-masked-cookie-profile-3":
        "“개발팀에 로그인 문제를 보내려니 민감한 값이 함께 보이나요?”",
    },
    before: {
      "payer-masked-cookie-profile-1":
        "품질 담당자는 브라우저의 로그인 정보를 열어 민감한 값을 가리고 증거 파일을 만듭니다.",
      "payer-masked-cookie-profile-2":
        "개발자는 로그인 설정의 항목과 속성을 복사해 오류 재현 기록을 손으로 작성합니다.",
      "payer-masked-cookie-profile-3":
        "기술 지원 담당자는 고객의 브라우저 정보를 조회하고 값을 가린 뒤 개발팀에 전달합니다.",
    },
    after: {
      "twist-masked-cookie-profile-1":
        "현재 사이트 정보 읽기를 허용하면 로그인 유지 항목의 값을 가린 구조 파일이 나옵니다.",
      "twist-masked-cookie-profile-2":
        "현재 사이트 정보 읽기를 허용하면 정보 전송 범위와 보안 설정만 담은 파일이 나옵니다.",
      "twist-masked-cookie-profile-3":
        "현재 사이트 정보 읽기를 허용하면 사이트 주소와 경로별로 묶고 값을 가린 파일이 나옵니다.",
    },
  },
  "source-website-design-token-export": {
    hooks: {
      "moment-design-token-export-1":
        "“참고 사이트는 정했는데 새 화면의 색과 글자가 자꾸 다르게 보이나요?”",
      "moment-design-token-export-2":
        "“화면마다 같은 색과 간격이 조금씩 달라져 다시 고치고 있나요?”",
      "moment-design-token-export-3":
        "“브랜드 화면을 검수하려는데 실제 색과 간격 기준이 한곳에 없나요?”",
    },
    before: {
      "payer-design-token-export-1":
        "제품 디자이너는 참고 사이트의 색과 글꼴과 간격을 화면마다 눈으로 보고 적습니다.",
      "payer-design-token-export-2":
        "웹 화면 개발자는 개발자 도구에서 색과 간격 값을 하나씩 찾아 공통 규칙으로 옮깁니다.",
      "payer-design-token-export-3":
        "디자인 품질 담당자는 공개 사이트의 실제 색과 효과를 수집해 브랜드 기준과 대조합니다.",
    },
    after: {
      "twist-design-token-export-1":
        "공개 웹사이트 주소를 넣으면 개발 코드에 바로 붙일 색과 간격 규칙 파일이 나옵니다.",
      "twist-design-token-export-2":
        "공개 웹사이트 주소를 넣으면 색과 글꼴과 간격에 이름을 붙여 정리한 규칙 파일이 나옵니다.",
      "twist-design-token-export-3":
        "공개 웹사이트 주소를 넣으면 디자인 작업 화면에서 읽을 수 있게 정리한 규칙 파일이 나옵니다.",
    },
  },
  "source-website-to-android-apk": {
    hooks: {
      "moment-website-android-apk-1":
        "“모바일 웹은 완성됐는데 안드로이드 설치본이 없어 출시가 멈췄나요?”",
      "moment-website-android-apk-2":
        "“사용자가 홈 화면에서 바로 여는 앱을 원해 대응이 늦어지고 있나요?”",
      "moment-website-android-apk-3":
        "“시험용 휴대폰에 웹서비스 설치본을 보여줄 파일이 아직 없나요?”",
    },
    before: {
      "payer-website-android-apk-1":
        "소상공인은 완성한 모바일 웹을 앱처럼 만들려고 개발자에게 별도 포장 작업을 맡깁니다.",
      "payer-website-android-apk-2":
        "웹 대행자는 같은 고객 사이트를 안드로이드 앱 틀로 매번 다시 감싸 납품합니다.",
      "payer-website-android-apk-3":
        "커뮤니티 운영자는 설치 요청을 받을 때마다 새 앱 개발에 필요한 인력과 일정을 알아봅니다.",
    },
    after: {
      "twist-website-android-apk-1":
        "모바일 웹사이트 주소를 넣으면 사이트 아이콘이 붙은 안드로이드 시험 설치 파일이 나옵니다.",
      "twist-website-android-apk-2":
        "모바일 웹사이트 주소를 넣으면 휴대폰 뒤로가기 버튼이 작동하는 시험 설치 파일이 나옵니다.",
      "twist-website-android-apk-3":
        "모바일 웹사이트 주소를 넣으면 내 사이트 주소 안에서만 열리는 시험 설치 파일이 나옵니다.",
    },
  },
  "source-web-component-code-extractor": {
    hooks: {
      "moment-web-component-code-1":
        "“참고할 화면 요소는 정했는데 구조를 다시 분석하느라 시작이 늦어지나요?”",
      "moment-web-component-code-2":
        "“참고 화면과 나란히 놓자 간격과 눌렀을 때 모습이 다르게 보이나요?”",
      "moment-web-component-code-3":
        "“팀에 넘길 화면 요소 코드를 정리하지 못해 구현이 엇갈리나요?”",
    },
    before: {
      "payer-web-component-code-1":
        "웹 화면 개발자는 참고 사이트의 구조와 꾸밈 값을 개발자 도구에서 손으로 옮깁니다.",
      "payer-web-component-code-2":
        "웹 화면 제작자는 고객이 고른 화면 요소의 뼈대와 꾸밈 코드를 처음부터 다시 씁니다.",
      "payer-web-component-code-3":
        "화면 디자인 규칙 담당자는 기존 버튼과 카드 구조를 분석해 팀 코드 형식으로 다시 만듭니다.",
    },
    after: {
      "twist-web-component-code-1":
        "웹 주소와 화면 요소 위치를 넣으면 내용 뼈대와 꾸밈 규칙이 분리된 코드 파일이 나옵니다.",
      "twist-web-component-code-2":
        "웹 주소와 화면 요소 위치를 넣으면 개발 중인 사이트에 바로 붙일 웹 화면 코드가 나옵니다.",
      "twist-web-component-code-3":
        "웹 주소와 화면 요소 위치를 넣으면 공통 꾸밈 규칙으로 바뀐 웹 화면 코드가 나옵니다.",
    },
  },
  "source-single-page-performance-cause-report": {
    hooks: {
      "moment-page-performance-cause-1":
        "“새 페이지를 공개하기 전 무엇이 느린지 근거를 못 찾았나요?”",
      "moment-page-performance-cause-2":
        "“사용자는 사이트가 느리다는데 어느 부분이 원인인지 모르겠나요?”",
      "moment-page-performance-cause-3":
        "“고객에게 속도 개선 근거를 보내려는데 측정 결과가 흩어져 있나요?”",
    },
    before: {
      "payer-page-performance-cause-1":
        "자사몰 개발자는 브라우저 측정을 여러 번 돌리고 느린 수치를 손으로 정리합니다.",
      "payer-page-performance-cause-2":
        "웹 대행자는 여러 측정 결과를 복사해 보고서를 만들고 느린 파일을 직접 찾습니다.",
      "payer-page-performance-cause-3":
        "사이트 관리자는 느린 로딩과 화면 흔들림 수치를 도구마다 열어 손으로 비교합니다.",
    },
    after: {
      "twist-page-performance-cause-1":
        "공개 페이지 주소를 넣으면 첫 화면을 늦게 띄우는 가장 큰 요소와 시간이 적힌 보고서가 나옵니다.",
      "twist-page-performance-cause-2":
        "공개 페이지 주소를 넣으면 화면을 흔들리게 만든 요소와 이동 정도가 적힌 보고서가 나옵니다.",
      "twist-page-performance-cause-3":
        "공개 페이지 주소를 넣으면 화면 반응을 오래 막은 코드 파일과 시간이 적힌 보고서가 나옵니다.",
    },
  },
  "source-code-static-security-locations": {
    hooks: {
      "moment-code-static-security-1":
        "“웹 프로젝트 배포를 앞두고 비밀정보가 코드에 남았을까 불안한가요?”",
      "moment-code-static-security-2":
        "“인공지능이 만든 코드를 합친 뒤 위험한 부분이 섞였는지 모르겠나요?”",
      "moment-code-static-security-3":
        "“다른 팀에 코드를 넘기려는데 안전하다는 근거가 부족한가요?”",
    },
    before: {
      "payer-code-static-security-1":
        "개발자는 배포 전 코드 전체를 훑거나 임시 검사 명령을 만들어 비밀정보를 찾습니다.",
      "payer-code-static-security-2":
        "개발 대행사 책임자는 팀원이 만든 파일을 하나씩 열어 의심스러운 코드와 설정을 확인합니다.",
      "payer-code-static-security-3":
        "사내 도구 개발자는 별도 보안 담당자 없이 바뀐 파일을 손으로 검사합니다.",
    },
    after: {
      "twist-code-static-security-1":
        "웹 프로젝트 압축 파일을 넣으면 코드에 직접 적힌 서비스 비밀번호나 비밀키의 파일 이름과 줄 번호가 나옵니다.",
      "twist-code-static-security-2":
        "웹 프로젝트 압축 파일을 넣으면 글자를 코드처럼 실행하는 위험한 부분의 파일 이름과 줄 번호가 나옵니다.",
      "twist-code-static-security-3":
        "웹 프로젝트 압축 파일을 넣으면 모든 사이트의 접근을 허용한 설정의 파일 이름과 줄 번호가 나옵니다.",
    },
  },
  "source-sitemap-to-llms-text": {
    hooks: {
      "moment-sitemap-llms-text-1":
        "“새로 공개한 문서가 인공지능의 사이트 안내에서 빠져 있나요?”",
      "moment-sitemap-llms-text-2":
        "“문서 구조를 바꾼 뒤 오래된 주소가 안내 파일에 남아 있나요?”",
      "moment-sitemap-llms-text-3":
        "“인공지능 안내 파일 공개를 앞두고 틀리거나 겹친 주소가 걱정되나요?”",
    },
    before: {
      "payer-sitemap-llms-text-1":
        "혼자 일하는 서비스 개발자는 페이지가 늘 때마다 인공지능이 읽을 주소 목록을 손으로 고칩니다.",
      "payer-sitemap-llms-text-2":
        "콘텐츠 대행자는 사이트 주소 목록을 보며 페이지 제목과 주소를 안내 파일에 다시 복사합니다.",
      "payer-sitemap-llms-text-3":
        "기술 문서 작성자는 문서 구조가 바뀔 때 사이트 목록과 인공지능 안내 파일을 따로 맞춥니다.",
    },
    after: {
      "twist-sitemap-llms-text-1":
        "공개 페이지 주소 목록을 넣으면 페이지 제목과 주소가 한 줄씩 적힌 안내 파일이 나옵니다.",
      "twist-sitemap-llms-text-2":
        "공개 페이지 주소 목록을 넣으면 같은 첫 경로의 문서끼리 묶인 안내 파일이 나옵니다.",
      "twist-sitemap-llms-text-3":
        "공개 페이지 주소 목록을 넣으면 임시 꼬리표와 겹친 주소를 뺀 안내 파일이 나옵니다.",
    },
  },
  "source-football-matchday-social-card": {
    hooks: {
      "moment-football-matchday-card-1":
        "“경기 정보는 확정됐는데 바로 게시할 공지 이미지가 없나요?”",
      "moment-football-matchday-card-2":
        "“디자인 담당자 없이 경기 공지를 만들다 훈련 시간이 줄고 있나요?”",
      "moment-football-matchday-card-3":
        "“경기 정보가 바뀌었는데 예전 공지가 아직 퍼지고 있나요?”",
    },
    before: {
      "payer-football-matchday-card-1":
        "선수 겸 운영자는 경기마다 휴대폰 편집 앱을 열어 공지 이미지를 새로 만듭니다.",
      "payer-football-matchday-card-2":
        "유소년 코치는 훈련과 이동 사이에 경기 공지 틀의 글자와 로고를 직접 바꿉니다.",
      "payer-football-matchday-card-3":
        "풋살리그 운영자는 팀과 시간이 바뀔 때마다 로고 크기와 글자 위치를 다시 맞춥니다.",
    },
    after: {
      "twist-football-matchday-card-1":
        "팀명과 경기 시간과 점수와 로고를 넣으면 정사각형 경기 공지 이미지가 나옵니다.",
      "twist-football-matchday-card-2":
        "팀명과 경기 시간과 점수와 로고를 넣으면 휴대폰 세로 화면용 경기 공지가 나옵니다.",
      "twist-football-matchday-card-3":
        "경기 정보와 팀 로고와 후원사 로고를 넣으면 아래쪽에 후원사가 표시된 공지 이미지가 나옵니다.",
    },
  },
  "source-tailwind-selector-class-diff": {
    hooks: {
      "moment-tailwind-class-diff-1":
        "“화면 모양 오류는 찾았는데 어느 코드 한 줄을 고칠지 모르겠나요?”",
      "moment-tailwind-class-diff-2":
        "“화면 수정이 다른 모양까지 건드렸을까 코드 검토 전에 불안한가요?”",
      "moment-tailwind-class-diff-3":
        "“같은 화면 요소의 꾸밈 코드를 또 처음부터 조합하고 있나요?”",
    },
    before: {
      "payer-tailwind-class-diff-1":
        "웹 화면 개발자는 브라우저에서 모양을 바꿔 본 뒤 코드에서 같은 부분을 다시 찾습니다.",
      "payer-tailwind-class-diff-2":
        "웹 화면 제작자는 화면 크기마다 필요한 꾸밈 규칙을 다시 계산합니다.",
      "payer-tailwind-class-diff-3":
        "화면 디자인 규칙 담당자는 현재 꾸밈 코드와 바꿀 코드를 줄마다 손으로 비교합니다.",
    },
    after: {
      "twist-tailwind-class-diff-1":
        "웹 주소와 화면 요소 위치와 간격 값을 넣으면 간격 코드 한 줄만 바뀐 수정 파일이 나옵니다.",
      "twist-tailwind-class-diff-2":
        "웹 주소와 화면 요소 위치와 색상 값을 넣으면 글자나 배경색 코드 한 줄만 바뀐 파일이 나옵니다.",
      "twist-tailwind-class-diff-3":
        "웹 주소와 화면 요소 위치와 화면 크기를 넣으면 그 크기에서만 적용되는 코드 한 줄이 추가됩니다.",
    },
  },
} satisfies AuthoredHeroCopyBatch;
