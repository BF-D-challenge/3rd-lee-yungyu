import type { IdeaLabAxisMeta, IdeaLabScenario } from "./types";

export const IDEA_LAB_AXIS_META: Record<
  "source" | "payer" | "moment" | "twist",
  IdeaLabAxisMeta
> = {
  source: {
    id: "source",
    label: "검증된 원본",
    question: "이미 어떤 제품 흐름이 작동하나요?",
    color: "#6db4f5",
    softColor: "rgba(109, 180, 245, .13)",
  },
  payer: {
    id: "payer",
    label: "돈 낼 사람",
    question: "누가 이 문제를 반복해서 겪나요?",
    color: "#7de4be",
    softColor: "rgba(125, 228, 190, .13)",
  },
  moment: {
    id: "moment",
    label: "필요한 순간",
    question: "언제 해결 욕구가 가장 커지나요?",
    color: "#e8c56a",
    softColor: "rgba(232, 197, 106, .13)",
  },
  twist: {
    id: "twist",
    label: "한 끗 변화",
    question: "딱 하나만 무엇을 바꿀까요?",
    color: "#ff8091",
    softColor: "rgba(255, 128, 145, .13)",
  },
};

/**
 * 화면 동작 검증용 샘플이다. 실제 런타임에서는 TrustMRR·App Store·Chrome Store의
 * 감사 통과 원본을 같은 타입으로 변환해 주입한다. 기존 카드덱 데이터는 가져오지 않는다.
 */
export const IDEA_LAB_SCENARIOS: IdeaLabScenario[] = [
  {
    id: "lookup-brief",
    source: {
      id: "source-lookup",
      sourceName: "1Lookup",
      research: {
        key: "trustmrr:1lookup",
        url: "https://trustmrr.com/startup/1lookup",
      },
      platform: "web",
      value: "정보 하나를 넣으면 상대 정보를 찾아 정리해주는 웹 서비스",
      detail:
        "전화번호·이메일·IP 중 하나를 넣으면 쓸 수 있는 정보인지 확인하고 근거를 한곳에 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 데이터 검증 제품",
      preservedFlow: "정보 입력 → 여러 출처 확인 → 결과와 근거 정리",
    },
    payers: [
      {
        id: "payer-solo-sales",
        value: "매주 잠재 고객을 찾는 1인 영업자",
        detail:
          "연락할 사람을 고르거나 만나기 전마다 상대 회사와 담당자를 직접 검색합니다.",
      },
      {
        id: "payer-recruiter",
        value: "하루에 후보자 여러 명을 확인하는 채용 담당자",
        detail:
          "후보자에게 연락하거나 만나기 전 공개 정보를 여러 화면에서 교차 확인합니다.",
      },
      {
        id: "payer-agency",
        value: "새 광고주를 자주 만나는 소형 대행사 대표",
        detail:
          "연락할 광고주를 고르거나 제안하기 전 회사 규모와 최근 활동을 직접 찾습니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-call",
        value: "처음 연락하거나 만날 사람을 확인하는 10분 전",
        detail:
          "검색할 시간은 부족해 상대의 핵심 정보만 빠르게 확인하고 싶은 순간",
      },
      {
        id: "moment-before-email",
        value: "처음 메시지를 보내기 직전",
        detail:
          "상대와 맞지 않는 뻔한 문장 대신 근거 있는 첫 문장을 보내고 싶은 순간",
      },
      {
        id: "moment-lead-list",
        value: "이번 주 연락할 사람을 고르는 월요일 아침",
        detail: "긴 후보 목록에서 먼저 연락할 사람을 정해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-company-url-only",
        kind: "replace",
        value: "전화번호·이름 조회를 회사 공식 URL 하나로 바꾸기",
        detail:
          "공개 정보를 찾아 근거와 함께 정리하는 흐름은 유지하고 개인정보 입력을 없앱니다.",
        resultTitle: "회사 URL로 찾는 첫 연락 근거",
        platform: "web",
        smallestBuild:
          "회사 공식 URL 하나를 넣으면 소개·최근 변화·내 제안과 이어지는 공개 사실과 각 출처 링크 한 개가 나오는 웹 화면",
      },
      {
        id: "twist-three-evidence-lines",
        kind: "remove",
        value:
          "긴 인물·회사 리포트를 빼고 첫 연락에 쓸 공개 근거 세 줄만 남기기",
        detail:
          "여러 공개 출처를 확인하는 흐름은 유지하고 사용자가 읽는 결과를 세 줄로 제한합니다.",
        resultTitle: "첫 연락 근거 3줄",
        platform: "web",
        smallestBuild:
          "회사 공식 URL 하나를 넣으면 근거 URL이 붙은 사실 세 줄과 확인 불가 항목만 보여주는 웹 화면",
      },
      {
        id: "twist-checked-date",
        kind: "add",
        value: "각 공개 근거에 확인 날짜와 오래된 정보 경고 하나 더하기",
        detail:
          "공개 정보를 모아 연락 단서로 쓰는 흐름은 유지하고 정보의 시점을 바로 판단하게 합니다.",
        resultTitle: "날짜가 보이는 회사 근거 카드",
        platform: "web",
        smallestBuild:
          "회사 공식 URL 하나를 넣으면 공개 근거 세 줄·출처·게시일과 1년 이상 지난 정보 표시가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "voice-notes",
    source: {
      id: "source-voice",
      sourceName: "VoiceType",
      research: {
        key: "trustmrr:voicetype-com",
        url: "https://trustmrr.com/startup/voicetype-com",
      },
      platform: "plugin",
      value: "말하면 바로 글자로 바꾸어 입력칸에 넣어주는 브라우저 확장",
      detail:
        "키보드 대신 말한 내용을 받아 적고, 현재 보고 있는 입력칸에 글을 넣어줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 음성 받아쓰기 제품",
      preservedFlow: "말하기 → 음성을 글자로 변환 → 현재 입력칸에 결과 넣기",
    },
    payers: [
      {
        id: "payer-pm",
        value: "회의가 많은 작은 팀의 기획자",
        detail: "회의가 끝날 때마다 결정 사항과 할 일을 다시 정리합니다.",
      },
      {
        id: "payer-field",
        value: "현장에서 긴 메모를 남기는 점검 담당자",
        detail: "손이 자유롭지 않은 상태에서 기록을 많이 남겨야 합니다.",
      },
      {
        id: "payer-solo-maker",
        value: "아이디어를 말로 먼저 풀어내는 1인 제작자",
        detail: "생각이 떠오를 때 문서 형식까지 잡느라 흐름을 자주 놓칩니다.",
      },
    ],
    moments: [
      {
        id: "moment-meeting-end",
        value: "회의가 끝난 직후 5분",
        detail: "기억이 생생할 때 결정과 다음 행동을 남겨야 하는 순간",
      },
      {
        id: "moment-walking",
        value: "이동 중에 아이디어가 떠오른 순간",
        detail: "휴대폰으로 긴 문장을 쓰기 어렵지만 잊고 싶지 않은 순간",
      },
      {
        id: "moment-report",
        value: "현장 점검을 마치고 보고해야 할 때",
        detail: "사진과 관찰 내용을 사무실로 돌아가기 전에 정리해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-minute-three-boxes",
        kind: "replace",
        value:
          "어디서나 받아쓰기를 브라우저 1분 녹음과 고정된 세 칸으로 바꾸기",
        detail:
          "말을 글로 바꾸는 흐름은 유지하고 설치 없이 기록·다음 행동·확인할 것으로 정리합니다.",
        resultTitle: "1분 음성 3칸 기록",
        platform: "web",
        smallestBuild:
          "브라우저에서 1분을 녹음하면 기록·다음 행동·확인할 것 세 칸이 채워지는 모바일 웹 화면",
      },
      {
        id: "twist-owner-deadline",
        kind: "add",
        value: "말한 내용에서 담당자와 기한이 들린 할 일만 표시하기",
        detail:
          "음성 변환과 고정 결과는 유지하고 실행에 필요한 사람·날짜가 빠졌는지 한 번 확인하게 합니다.",
        resultTitle: "누가 언제까지가 보이는 음성 메모",
        platform: "web",
        smallestBuild:
          "브라우저 1분 녹음 뒤 할 일 세 줄에 담당자·기한 또는 미확인 표시가 붙는 모바일 웹 화면",
      },
      {
        id: "twist-source-audio-jump",
        kind: "remove",
        value: "전체 받아쓰기 화면을 빼고 세 칸과 해당 음성 위치만 남기기",
        detail:
          "말을 구조화하는 흐름은 유지하고 긴 원문 대신 결과의 근거가 된 10초 구간만 다시 듣게 합니다.",
        resultTitle: "근거 음성으로 확인하는 3칸 메모",
        platform: "web",
        smallestBuild:
          "1분 녹음에서 만든 세 칸마다 해당 발화의 10초 재생 버튼 하나가 붙는 모바일 웹 화면",
      },
    ],
  },
  {
    id: "shirt-preview",
    source: {
      id: "source-shirt",
      sourceName: "ThreadCam",
      research: {
        key: "trustmrr:threadcam",
        url: "https://trustmrr.com/startup/threadcam",
      },
      platform: "app",
      value: "그림을 올리면 티셔츠에 입힌 모습을 3D로 보여주는 앱",
      detail:
        "평면 그림과 옷 색상을 고르면 실제 티셔츠처럼 돌려볼 수 있는 미리보기를 만듭니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 의류 목업 제품",
      preservedFlow: "그림과 옷 선택 → 3D 목업 생성 → 여러 각도에서 확인",
    },
    payers: [
      {
        id: "payer-fashion-freelancer",
        value: "고객 시안을 자주 보내는 1인 의류 디자이너",
        detail: "제작 전에 고객이 실제 모습을 이해하도록 여러 목업을 만듭니다.",
      },
      {
        id: "payer-school-club",
        value: "단체 티셔츠를 준비하는 학교 동아리 운영자",
        detail: "여러 사람이 색상과 위치에 동의해야 주문할 수 있습니다.",
      },
      {
        id: "payer-small-brand",
        value: "신상품을 자주 시험하는 작은 의류 브랜드",
        detail: "실물 샘플을 만들기 전에 반응이 좋은 디자인을 좁혀야 합니다.",
      },
    ],
    moments: [
      {
        id: "moment-client-send",
        value: "고객에게 최종 시안을 보내기 직전",
        detail:
          "작업자가 이해한 것과 고객이 기대한 것이 같은지 확인해야 하는 순간",
      },
      {
        id: "moment-order",
        value: "단체 주문 수량을 확정하기 전날",
        detail: "여러 사람의 수정 의견을 한 번에 끝내야 하는 순간",
      },
      {
        id: "moment-sample",
        value: "비싼 실물 샘플을 주문하기 전",
        detail: "프린트 위치와 색상 조합이 괜찮은지 먼저 확인하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-flat-front-back",
        kind: "remove",
        value: "3D 회전과 편집기를 빼고 앞·뒤 2D 목업 두 장만 남기기",
        detail:
          "그림을 옷에 입혀 주문 전 확인하는 흐름은 유지하고 렌더링 범위를 두 각도로 줄입니다.",
        resultTitle: "앞뒤 두 장 티셔츠 목업",
        platform: "web",
        smallestBuild:
          "투명 PNG 하나, 인쇄 면(앞/뒤), 티셔츠 색을 고르면 앞·뒤 2D 목업 두 장이 나오는 웹 화면",
      },
      {
        id: "twist-print-boundary",
        kind: "add",
        value: "목업에 실제 인쇄 가능 영역과 그림 크기 표시 하나 더하기",
        detail:
          "2D 목업 확인은 유지하고 주문 뒤 위치가 달라지는 실수를 막을 기준선만 더합니다.",
        resultTitle: "인쇄선이 보이는 단체티 목업",
        platform: "web",
        smallestBuild:
          "투명 PNG와 옷 색을 넣으면 앞면 목업에 인쇄 영역·가로 길이·중앙선이 표시되는 웹 화면",
      },
      {
        id: "twist-two-colors",
        kind: "replace",
        value: "고객 승인 기능을 같은 그림의 옷 색상 두 개 비교로 바꾸기",
        detail:
          "제작 전 모습을 확인하는 흐름은 유지하고 상대방 행동 없이 내부에서 색 조합을 고르게 합니다.",
        resultTitle: "색상 2안 단체티 비교",
        platform: "web",
        smallestBuild:
          "투명 PNG 하나와 티셔츠 색 두 개를 고르면 같은 크기의 앞면 목업 두 장이 나란히 뜨는 웹 화면",
      },
    ],
  },
  {
    id: "commission-check-one-month",
    source: {
      id: "source-sales-commissions-ex-commet",
      sourceName: "Sales Commissions (Ex Commet)",
      research: {
        key: "trustmrr:sales-commissions-ex-commet",
        url: "https://trustmrr.com/startup/sales-commissions-ex-commet",
      },
      platform: "web",
      value:
        "영업 실적과 수수료 규칙을 연결해 사람별 지급액을 계산·관리하는 수수료 운영 소프트웨어",
      detail:
        "매출 실적과 적용 규칙을 모아 수수료를 계산하고 담당자가 지급 근거를 확인하게 합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $11k·성장 50%, 영업 성과·수수료 관리 메커니즘 확인",
      preservedFlow:
        "영업 실적과 수수료 규칙 입력 → 지급액 계산 → 사람별 금액과 근거 확인",
    },
    payers: [
      {
        id: "payer-agency-commission",
        value:
          "영업 담당자 3~10명의 월 수수료를 직접 계산하는 소형 대행사 운영자",
        detail:
          "계약별 매출과 취소를 엑셀로 모아 사람마다 다른 비율을 다시 계산합니다.",
      },
      {
        id: "payer-course-sales-commission",
        value: "상담 판매자의 성과급을 지급하는 교육 사업 운영자",
        detail:
          "결제·환불·분할 납부가 섞여 월말마다 어떤 매출을 인정할지 설명해야 합니다.",
      },
      {
        id: "payer-b2b-finance-commission",
        value: "초기 B2B 팀의 급여·인센티브를 함께 맡은 운영 담당자",
        detail:
          "CRM 내보내기와 계약 규칙을 맞춰 지급액과 누락 건을 대표에게 보고합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-commission-payroll",
        value: "이번 달 성과급 이체를 시작하기 한 시간 전",
        detail: "숫자가 맞는지와 계산 근거를 한 번에 확인해야 하는 순간",
      },
      {
        id: "moment-commission-dispute",
        value: "영업 담당자가 예상 금액과 다르다고 물어본 순간",
        detail: "누구 말이 맞는지 거래별 계산 과정을 바로 보여줘야 하는 순간",
      },
      {
        id: "moment-commission-rule-change",
        value: "환불·신규 상품 때문에 수수료 규칙 한 줄이 바뀐 월말",
        detail:
          "이전 공식을 복사하다 틀리지 않고 이번 달 데이터에 새 규칙을 적용해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-rep-one-month",
        kind: "remove",
        value: "팀 대시보드를 빼고 담당자 한 명의 한 달 수수료 명세만 남기기",
        detail:
          "실적과 규칙으로 지급액을 계산하는 흐름은 유지하고 첫 결과를 사람 한 명으로 줄입니다.",
        resultTitle: "한 사람 한 달 수수료 명세",
        platform: "web",
        smallestBuild:
          "거래 CSV와 `인정 매출×비율, 환불 제외` 형식의 규칙 한 줄을 넣으면 인정·제외 매출과 지급액 표가 나오는 웹 화면",
      },
      {
        id: "twist-explain-calculation",
        kind: "replace",
        value: "총액 그래프를 거래별 계산식과 적용 규칙으로 바꾸기",
        detail:
          "수수료 계산은 유지하고 담당자가 이의를 설명할 수 있는 근거를 결과로 만듭니다.",
        resultTitle: "거래별 계산이 보이는 수수료표",
        platform: "web",
        smallestBuild:
          "거래 CSV와 규칙을 넣으면 각 거래에 적용 비율·제외 이유·계산식이 붙은 표와 총액이 나오는 웹 화면",
      },
      {
        id: "twist-missing-fields",
        kind: "add",
        value: "계산 전에 담당자·종료일·환불 여부가 빈 거래 표시 하나 더하기",
        detail:
          "실적 계산은 유지하고 잘못된 총액을 만드는 입력 누락만 먼저 확인합니다.",
        resultTitle: "누락 거래부터 잡는 수수료 계산",
        platform: "web",
        smallestBuild:
          "거래 CSV를 넣으면 계산 불가 행과 빠진 필드를 먼저 고치고 규칙 적용 총액을 보는 웹 화면",
      },
    ],
  },
  {
    id: "cross-post-relay",
    source: {
      id: "source-cross-post",
      sourceName: "POST BRIDGE",
      research: {
        key: "trustmrr:post-bridge",
        url: "https://trustmrr.com/startup/post-bridge",
      },
      platform: "plugin",
      value:
        "원문 하나를 여러 소셜미디어 채널에 맞게 미리보기로 만들어 한 번에 올려주는 브라우저 확장",
      detail:
        "글과 발행할 채널을 고르면 채널마다 다르게 보일 모습을 미리 보여주고, 승인한 채널에 동시에 올려줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 콘텐츠 동시 발행 제품",
      preservedFlow:
        "원문과 채널 선택 → 채널별 미리보기 생성 → 승인 후 동시 발행",
    },
    payers: [
      {
        id: "payer-local-brand-social",
        value: "스마트스토어와 SNS를 함께 운영하는 소형 브랜드 담당자",
        detail:
          "같은 신상품 소식을 네이버 블로그·인스타그램·카카오채널 형식에 맞춰 매번 다시 씁니다.",
      },
      {
        id: "payer-local-agency-social",
        value: "국내 자영업자 계정 여러 개를 맡은 소형 대행사 실무자",
        detail:
          "고객이 준 원고를 채널마다 길이와 말투를 바꿔 검수용 문서로 다시 만듭니다.",
      },
      {
        id: "payer-local-creator-social",
        value: "블로그와 인스타그램에 함께 올리는 1인 크리에이터",
        detail:
          "한 번 만든 콘텐츠를 각 채널에 붙여넣고 제목·해시태그·첫 문장을 따로 고칩니다.",
      },
    ],
    moments: [
      {
        id: "moment-local-post-ready",
        value: "신상품·새 콘텐츠 원고가 완성된 직후",
        detail:
          "세 채널에 같은 내용을 반복 입력하기 전에 채널별 복사본을 한 번에 만들고 싶은 순간",
      },
      {
        id: "moment-local-event-today",
        value: "오늘 시작하는 행사 공지를 한 시간 안에 올려야 할 때",
        detail:
          "자동 발행 연결 없이도 각 채널에 바로 복사할 제목과 본문이 필요한 순간",
      },
      {
        id: "moment-local-weekly-calendar",
        value: "다음 주 게시물 세 개를 검수받기 직전",
        detail:
          "발행 전에 채널별 잘림·말투·누락을 한 화면에서 비교해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-local-three-channel-pack",
        kind: "replace",
        value:
          "해외 채널 자동 발행을 네이버 블로그·인스타그램·카카오채널용 복사 묶음으로 바꾸기",
        detail:
          "원문을 채널별 형식으로 바꾸는 흐름은 유지하고 계정 연동과 발행 권한을 제거합니다.",
        resultTitle: "원고 하나로 만든 국내 채널 3종 복사본",
        platform: "web",
        smallestBuild:
          "600자 이하 원고와 사진 한 장을 넣으면 네이버 블로그 도입부·인스타그램 캡션·카카오채널 공지가 각각 복사 버튼과 함께 나오는 웹 화면",
      },
      {
        id: "twist-local-side-by-side",
        kind: "remove",
        value: "예약·발행을 빼고 세 채널에서 잘릴 제목과 첫 문장 비교만 남기기",
        detail:
          "채널별 미리보기는 유지하고 제품이 소유하지 못하는 최종 발행을 결과에서 제외합니다.",
        resultTitle: "잘림까지 보이는 국내 채널 3종 미리보기",
        platform: "web",
        smallestBuild:
          "원고 하나를 넣으면 세 채널의 제목·첫 문장·글자 수 제한과 잘리는 위치가 나란히 보이는 웹 화면",
      },
      {
        id: "twist-local-publish-checklist",
        kind: "replace",
        value: "동시 발행 버튼을 채널별 복사 완료 체크로 바꾸기",
        detail:
          "여러 채널 작업을 한 번에 끝내는 흐름은 유지하고 사용자가 직접 붙여넣은 채널만 표시합니다.",
        resultTitle: "복사 누락 없는 국내 채널 발행 묶음",
        platform: "web",
        smallestBuild:
          "채널별 문구 옆 복사 버튼을 누르면 완료 시각이 표시되고 세 채널 중 남은 한 곳을 알려주는 웹 화면",
      },
    ],
  },
  {
    id: "ielts-essay-revision",
    source: {
      id: "source-writing9",
      sourceName: "WRITING9",
      research: {
        key: "trustmrr:writing9",
        url: "https://trustmrr.com/startup/writing9",
      },
      platform: "web",
      value:
        "IELTS 에세이를 넣으면 채점 기준별 약점과 고칠 지점을 자세한 보고서로 주는 첨삭 서비스",
      detail:
        "에세이를 과제 응답·논리·어휘·문법 기준으로 확인해 약한 부분과 수정 방향을 보여줍니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $4.7k·성장 13%, IELTS 에세이 약점 보고서 메커니즘 확인",
      preservedFlow:
        "IELTS 에세이 입력 → 채점 기준별 분석 → 약점과 다음 수정 확인",
    },
    payers: [
      {
        id: "payer-first-ielts",
        value: "첫 IELTS 시험을 2~8주 앞둔 유학 준비생",
        detail:
          "모범 답안을 읽어도 내 글에서 어떤 기준이 약한지 몰라 같은 방식으로 다시 씁니다.",
      },
      {
        id: "payer-ielts-retaker",
        value: "Writing 점수 때문에 IELTS를 다시 보는 직장인",
        detail:
          "전체 점수만 보고 논리·어휘·문법 중 무엇부터 고칠지 정하지 못합니다.",
      },
      {
        id: "payer-small-ielts-tutor",
        value: "학생 에세이를 매주 여러 편 보는 1인 IELTS 튜터",
        detail:
          "반복되는 약점을 찾고도 학생마다 근거 문장을 표시하느라 피드백 시간이 길어집니다.",
      },
    ],
    moments: [
      {
        id: "moment-two-weeks-before-ielts",
        value: "시험 2주 전 마지막 연습 에세이를 쓴 직후",
        detail: "새 글을 더 쓰기 전에 점수를 막는 기준 하나를 찾아야 하는 순간",
      },
      {
        id: "moment-ielts-score-stuck",
        value: "모의 첨삭에서 같은 Writing 점수를 세 번째 받은 날",
        detail:
          "막연히 많이 쓰는 대신 반복되는 약점과 근거 문장을 확인해야 하는 순간",
      },
      {
        id: "moment-before-essay-rewrite",
        value: "오늘 쓴 에세이를 다시 고치기 시작하기 직전",
        detail:
          "전체를 대신 써주는 답안이 아니라 내가 먼저 손댈 문단 하나가 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-rubric-gaps",
        kind: "remove",
        value:
          "예상 점수와 긴 보고서를 빼고 목표 밴드를 막는 기준 세 개만 남기기",
        detail:
          "IELTS 기준으로 글을 분석하는 흐름은 유지하고 다음 수정에 필요한 약점만 줄입니다.",
        resultTitle: "목표 IELTS 점수를 막는 약점 3개",
        platform: "web",
        smallestBuild:
          "Task 유형·목표 밴드·에세이를 넣으면 약한 기준 세 개·근거 문장·고칠 질문 한 줄이 나오는 웹 화면",
      },
      {
        id: "twist-one-paragraph-practice",
        kind: "replace",
        value:
          "전체 에세이 재작성을 가장 약한 문단 하나의 수정 연습으로 바꾸기",
        detail:
          "약점을 찾고 고치는 흐름은 유지하면서 사용자의 글쓰기 과정을 대신하지 않습니다.",
        resultTitle: "가장 약한 문단 한 번 다시 쓰기",
        platform: "web",
        smallestBuild:
          "에세이를 넣으면 가장 약한 문단과 기준별 수정 체크 세 개를 보고 사용자가 다시 쓴 문단을 비교하는 웹 화면",
      },
      {
        id: "twist-before-after-rubric",
        kind: "add",
        value: "수정 전후 문단에서 좋아진 기준과 남은 약점 표시 하나 더하기",
        detail:
          "에세이 피드백은 유지하고 사용자가 실제로 고친 결과를 같은 기준으로 확인합니다.",
        resultTitle: "고쳐진 기준이 보이는 IELTS 문단",
        platform: "web",
        smallestBuild:
          "수정 전·후 문단을 넣으면 과제 응답·논리·어휘·문법 중 좋아진 기준과 남은 한 가지가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "statement-to-table",
    source: {
      id: "source-bankconv",
      sourceName: "BankConv",
      research: {
        key: "trustmrr:bankconv",
        url: "https://trustmrr.com/startup/bankconv",
      },
      platform: "web",
      value:
        "은행 거래내역 PDF를 CSV·Excel·회계 파일로 변환하는 문서 변환 서비스",
      detail:
        "여러 은행의 PDF 거래내역에서 날짜·설명·입출금·잔액을 추출해 표 파일로 돌려줍니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $871·성장 26%, 문서당 결제와 은행 PDF→표 변환 메커니즘 확인",
      preservedFlow:
        "거래내역 PDF 입력 → 행·열 구조 추출 → 다시 쓸 수 있는 표 파일 내보내기",
    },
    payers: [
      {
        id: "payer-freelancer-bookkeeping",
        value: "세무 자료를 직접 정리하는 프리랜서",
        detail:
          "은행 PDF만 받은 달에는 날짜·거래처·금액을 스프레드시트에 다시 입력합니다.",
      },
      {
        id: "payer-small-shop-bookkeeping",
        value: "매장 통장 내역을 월마다 회계사에게 보내는 소상공인",
        detail:
          "입출금 내역을 분류하기 전에 PDF 표가 복사되지 않아 수십 줄을 손으로 옮깁니다.",
      },
      {
        id: "payer-association-treasurer",
        value: "동호회·소규모 단체 회계를 맡은 총무",
        detail:
          "회원에게 결산을 보여주려고 은행 내역을 항목별 표로 다시 만듭니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-tax-files",
        value: "세무사에게 이번 달 자료를 보내기 30분 전",
        detail: "PDF 거래내역을 정렬·필터 가능한 표로 바꿔야 하는 순간",
      },
      {
        id: "moment-bank-pdf-only",
        value: "은행에서 CSV 없이 PDF 거래내역만 내려받은 직후",
        detail:
          "복사하면 열이 무너지는 문서를 다시 입력하지 않고 써야 하는 순간",
      },
      {
        id: "moment-before-monthly-settlement",
        value: "월 결산표의 누락 거래를 확인하는 밤",
        detail: "원문 PDF와 변환한 표의 행 수·금액을 맞춰야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-statement-csv",
        kind: "remove",
        value:
          "여러 은행·회계 형식을 빼고 PDF 한 장을 날짜·내용·금액 CSV로만 바꾸기",
        detail:
          "문서 표를 재사용 가능한 데이터로 바꾸는 흐름은 유지하고 출력 형식을 하나로 줄입니다.",
        resultTitle: "은행 PDF 한 장이 거래 CSV로",
        platform: "web",
        smallestBuild:
          "거래내역 PDF 하나를 올리면 날짜·적요·입금·출금·잔액 열의 CSV와 행 수가 나오는 웹 화면",
      },
      {
        id: "twist-mask-account-number",
        kind: "add",
        value: "브라우저 안에서 계좌번호·주민번호로 보이는 영역을 먼저 가리기",
        detail:
          "PDF 변환은 유지하고 파일 전송 전에 사용자가 민감 문자열을 확인해 지웁니다.",
        resultTitle: "올리기 전에 가리는 은행 거래내역",
        platform: "web",
        smallestBuild:
          "브라우저가 로컬에서 감지한 계좌번호 영역을 사용자가 가린 뒤 변환을 시작하면 거래 CSV가 생성되는 웹 화면",
      },
      {
        id: "twist-review-uncertain-rows",
        kind: "replace",
        value:
          "완성 파일 바로 다운로드를 확신 낮은 거래 행 세 개 확인으로 바꾸기",
        detail:
          "표 추출은 유지하고 OCR 오류 가능성이 큰 날짜·금액만 먼저 바로잡습니다.",
        resultTitle: "애매한 3줄만 확인하는 거래 변환",
        platform: "web",
        smallestBuild:
          "PDF를 올리면 확신 낮은 최대 세 행을 원문 이미지 옆에서 고친 뒤 CSV를 받는 웹 화면",
      },
    ],
  },
  {
    id: "story-short-video",
    source: {
      id: "source-story-short",
      sourceName: "StoryShort",
      research: {
        key: "trustmrr:storyshort",
        url: "https://trustmrr.com/startup/storyshort",
      },
      platform: "web",
      value:
        "글 한 편을 넣으면 장면과 목소리를 붙여 짧은 영상으로 만들어주는 웹 서비스",
      detail:
        "이야기 글을 넣으면 장면 이미지·자막·읽어주는 목소리를 자동으로 만들어 숏폼 영상 한 편으로 완성해줍니다.",
      evidence:
        "TrustMRR에서 실제 매출이 확인된 텍스트 기반 숏폼 영상 생성 제품",
      preservedFlow: "글 입력 → 장면·자막·음성 자동 생성 → 숏폼 영상 저장",
    },
    payers: [
      {
        id: "payer-shorts-creator",
        value: "매일 올릴 거리가 필요한 숏폼 채널 운영자",
        detail: "얼굴을 내보내지 않고도 매일 영상 하나를 채워야 합니다.",
      },
      {
        id: "payer-smallbiz-owner",
        value: "가게 홍보 영상을 직접 만드는 자영업자",
        detail: "편집 프로그램을 배울 시간 없이 소개 영상이 필요합니다.",
      },
      {
        id: "payer-web-novelist",
        value: "작품 홍보가 필요한 웹소설 작가",
        detail: "연재글을 알리고 싶지만 영상 제작은 해본 적이 없습니다.",
      },
    ],
    moments: [
      {
        id: "moment-daily-upload",
        value: "오늘 올릴 영상이 아직 없는 저녁",
        detail: "업로드 주기를 지키고 싶은데 촬영도 편집도 시작 못 한 순간",
      },
      {
        id: "moment-new-episode",
        value: "새 연재분을 막 올린 직후",
        detail: "글이 묻히기 전에 홍보 영상을 바로 붙이고 싶은 순간",
      },
      {
        id: "moment-event-notice",
        value: "가게 이벤트를 내일부터 시작해야 할 때",
        detail: "전단지 대신 돌릴 영상이 오늘 밤 안에 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-four-scene-muted",
        kind: "remove",
        value: "음성·음악·긴 편집을 빼고 세로 장면 네 개와 자막만 남기기",
        detail:
          "글을 장면으로 바꿔 숏폼을 만드는 흐름은 유지하고 30초 무음 초안 한 편으로 줄입니다.",
        resultTitle: "글 한 편이 30초 무음 숏폼으로",
        platform: "web",
        smallestBuild:
          "600자 이하 글을 넣으면 세로 장면 네 개와 자막으로 된 30초 무음 MP4 초안이 나오는 웹 화면",
      },
      {
        id: "twist-link-to-muted-draft",
        kind: "replace",
        value: "새 원고 작성을 공개 글·상품·공지 URL 하나로 바꾸기",
        detail:
          "글에서 장면과 자막을 만드는 흐름은 유지하고 이미 공개한 페이지를 입력으로 재사용합니다.",
        resultTitle: "페이지 URL로 만드는 무음 숏폼 초안",
        platform: "web",
        smallestBuild:
          "공개 URL 하나를 넣고 가져온 제목·본문을 확인하면 장면 네 개짜리 30초 무음 초안이 나오는 웹 화면",
      },
      {
        id: "twist-storyboard-first",
        kind: "add",
        value: "영상 생성 전에 장면 네 개의 자막·이미지 콘티 확인 한 번 더하기",
        detail:
          "글을 숏폼으로 바꾸는 흐름은 유지하고 잘못 만든 영상을 기다리지 않도록 짧은 승인 단계를 더합니다.",
        resultTitle: "4장 콘티부터 보는 무음 숏폼",
        platform: "web",
        smallestBuild:
          "글이나 공개 URL 하나를 넣으면 장면 네 개의 이미지·자막을 먼저 고치고 30초 무음 MP4로 만드는 웹 화면",
      },
    ],
  },
  {
    id: "schedule-to-calendar-file",
    source: {
      id: "source-text-2-ics",
      sourceName: "TEXT-2-ICS",
      research: {
        key: "trustmrr:text-2-ics",
        url: "https://trustmrr.com/startup/text-2-ics",
      },
      platform: "web",
      value:
        "텍스트·PDF·CSV·이미지의 일정을 읽어 표준 캘린더 ICS 파일로 바꾸는 서비스",
      detail:
        "흩어진 일정 문서에서 날짜·시간·제목·장소를 뽑아 캘린더에 가져올 수 있는 파일을 만듭니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $132·성장 100%, 일정 문서→ICS 자동 변환 메커니즘 확인",
      preservedFlow:
        "일정 텍스트·문서 입력 → 이벤트 항목 추출·확인 → ICS 캘린더 파일 내보내기",
    },
    payers: [
      {
        id: "payer-multi-academy-parent",
        value: "학교·학원 시간표를 함께 챙기는 부모",
        detail:
          "공지 이미지와 PDF를 보고 아이별 일정을 캘린더에 한 줄씩 다시 입력합니다.",
      },
      {
        id: "payer-shift-schedule-worker",
        value: "매달 이미지 근무표를 받는 교대 근무자",
        detail:
          "근무 코드와 시간을 휴대폰 캘린더에 옮기다 날짜를 한 칸씩 틀립니다.",
      },
      {
        id: "payer-class-program-operator",
        value: "여러 회차 프로그램 일정을 참가자에게 보내는 1인 운영자",
        detail:
          "최종 일정표를 만든 뒤 참가자가 각자 캘린더에 넣을 파일을 다시 작성합니다.",
      },
    ],
    moments: [
      {
        id: "moment-schedule-image-arrives",
        value: "다음 달 시간표 이미지가 단체방에 올라온 직후",
        detail: "약속이 잡히기 전에 반복 일정을 캘린더에 옮겨야 하는 순간",
      },
      {
        id: "moment-before-calendar-entry",
        value: "PDF 일정 열 개를 휴대폰에 입력하려는 순간",
        detail:
          "날짜·시간·장소를 하나씩 복사하지 않고 파일 하나로 끝내고 싶은 순간",
      },
      {
        id: "moment-schedule-revised",
        value: "수정된 일정표를 받아 기존 일정과 충돌이 생긴 밤",
        detail:
          "새 파일을 넣기 전에 바뀐 날짜와 겹치는 이벤트만 확인해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-next-seven-days-ics",
        kind: "remove",
        value:
          "모든 반복 규칙을 빼고 오늘부터 7일 일정만 캘린더 가져오기 파일로 만들기",
        detail:
          "문서에서 일정을 추출해 표준 `.ics` 파일로 만드는 흐름은 유지하고 한국 시간 기준 7일로 줄입니다.",
        resultTitle: "시간표 한 장이 7일 캘린더 파일로",
        platform: "web",
        smallestBuild:
          "시간표 문서를 넣으면 오늘부터 7일의 한국 시간 이벤트 미리보기와 Apple·Google 캘린더에 가져오는 `.ics` 파일이 나오는 웹 화면",
      },
      {
        id: "twist-conflict-preview",
        kind: "add",
        value: "다운로드 전에 겹치는 시간과 날짜 불명 일정 표시 하나 더하기",
        detail:
          "ICS 생성은 유지하고 잘못 가져온 뒤 지우게 만드는 충돌만 미리 확인합니다.",
        resultTitle: "겹침을 확인한 일정 ICS",
        platform: "web",
        smallestBuild:
          "일정 문서와 기존 캘린더 내보내기 ICS를 넣으면 겹치는 이벤트만 표시한 뒤 새 ICS를 받는 웹 화면",
      },
      {
        id: "twist-review-four-fields",
        kind: "replace",
        value: "자동 저장을 제목·날짜·시간·장소 네 칸 확인표로 바꾸기",
        detail:
          "일정 추출은 유지하고 캘린더 파일 전에 사용자가 핵심 필드만 빠르게 고칩니다.",
        resultTitle: "네 칸 확인 뒤 받는 캘린더 파일",
        platform: "web",
        smallestBuild:
          "일정 이미지·PDF를 넣으면 이벤트별 제목·날짜·시간·장소를 확인하고 ICS로 내려받는 웹 화면",
      },
    ],
  },
  {
    id: "video-recipe-card",
    source: {
      id: "source-citron-app",
      sourceName: "Citron App",
      research: {
        key: "trustmrr:citron-app",
        url: "https://trustmrr.com/startup/citron-app",
      },
      platform: "app",
      value:
        "Instagram·TikTok·YouTube 영상과 이미지·음성을 실제로 요리할 수 있는 구조화 레시피로 바꾸는 앱",
      detail:
        "소셜 영상 속 재료와 단계를 추출하고 단위·순서를 정리해 다시 찾고 요리할 레시피로 저장합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $414·성장 46%, 영상·이미지·음성→요리 가능한 레시피 메커니즘 확인",
      preservedFlow:
        "요리 영상·이미지 입력 → 재료·양·순서 구조화 → 다시 쓸 레시피 카드 저장",
    },
    payers: [
      {
        id: "payer-reel-recipe-parent",
        value: "숏폼 요리 영상을 저장해두고 주말에 따라 하는 부모",
        detail:
          "영상 재생을 반복하며 재료와 순서를 메모하다 양과 시간을 놓칩니다.",
      },
      {
        id: "payer-small-cafe-menu",
        value: "새 메뉴 아이디어를 영상으로 모으는 소형 카페 운영자",
        detail:
          "테스트 조리 전에 영상 속 재료·양·공정을 한 장으로 다시 정리합니다.",
      },
      {
        id: "payer-cooking-class-host",
        value: "SNS 레시피를 수업용으로 검토하는 1인 요리 클래스 운영자",
        detail:
          "참가자에게 보내기 위해 긴 영상을 준비물과 단계로 바꿔 적습니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-grocery-from-video",
        value: "저장한 요리 영상을 보고 장보러 나가기 10분 전",
        detail: "영상을 끝까지 다시 보지 않고 재료와 양만 확인해야 하는 순간",
      },
      {
        id: "moment-test-cook-video",
        value: "새 메뉴를 처음 테스트 조리하기 직전",
        detail:
          "영상 속 빠진 단위와 순서를 표시해 실패 비용을 줄여야 하는 순간",
      },
      {
        id: "moment-share-video-recipe",
        value: "가족·수강생이 그 영상 레시피를 글로 달라고 한 순간",
        detail: "링크만 보내지 않고 바로 따라 할 한 장을 만들어야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-sixty-second-clip-recipe",
        kind: "remove",
        value:
          "레시피 보관함과 여러 플랫폼 연동을 빼고 60초 요리 영상 하나만 카드로 바꾸기",
        detail:
          "영상에서 재료와 순서를 구조화하는 흐름은 유지하고 입력을 업로드 파일 하나로 제한합니다.",
        resultTitle: "60초 요리 영상이 레시피 한 장으로",
        platform: "web",
        smallestBuild:
          "권한 있는 60초 요리 영상 파일을 올리면 재료·양·단계·시간과 영상 시점이 붙은 카드가 나오는 웹 화면",
      },
      {
        id: "twist-unknown-amount-flags",
        kind: "add",
        value:
          "영상에서 말하지 않은 양·불세기·시간에 `영상에 없음` 표시 하나 더하기",
        detail:
          "레시피 구조화는 유지하고 AI가 모르는 값을 지어내지 않도록 출처 없는 값을 빈칸으로 남깁니다.",
        resultTitle: "영상에 없는 양이 표시된 레시피",
        platform: "web",
        smallestBuild:
          "60초 영상을 올리면 재료·단계와 양·불세기·시간 중 원본에서 말하지 않은 칸에 `영상에 없음`이 표시되는 웹 화면",
      },
      {
        id: "twist-serving-scale",
        kind: "replace",
        value: "원본 인분을 오늘 만들 인원에 맞춘 재료표로 바꾸기",
        detail:
          "영상 속 레시피를 구조화하는 흐름은 유지하고 확인된 재료 양만 인원수에 맞춰 계산합니다.",
        resultTitle: "인원수에 맞춘 영상 레시피 재료표",
        platform: "web",
        smallestBuild:
          "60초 영상에서 확인한 재료·원본 인분과 만들 인원을 넣으면 환산 재료표와 단계가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "passport-photo-print-sheet",
    source: {
      id: "source-fastpassphoto",
      sourceName: "FastPassPhoto",
      research: {
        key: "trustmrr:fastpassphoto",
        url: "https://trustmrr.com/startup/fastpassphoto",
      },
      platform: "web",
      value:
        "사진을 올리면 여권 규격에 맞는 디지털 사진과 인쇄용 사진을 만드는 서비스",
      detail:
        "얼굴 위치와 배경·크기를 정리해 신청 파일과 인쇄 시트로 내보냅니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $2.4k·성장 20%, 사진 업로드→여권 규격 디지털·인쇄 사진 메커니즘 확인",
      preservedFlow:
        "인물 사진 입력 → 규격·배경·얼굴 위치 확인 → 디지털 파일과 인쇄 시트 내보내기",
    },
    payers: [
      {
        id: "payer-passport-renewal",
        value: "여권 갱신을 온라인으로 직접 신청하는 직장인",
        detail:
          "사진관에 갈 시간이 없어 휴대폰 사진이 규격에서 반려될까 걱정합니다.",
      },
      {
        id: "payer-child-passport",
        value: "아이 여권 사진을 집에서 준비하는 부모",
        detail:
          "낯선 사진관에서 아이가 가만히 있지 않아 여러 장 중 쓸 수 있는 사진을 골라야 합니다.",
      },
      {
        id: "payer-visa-document-photo",
        value: "비자·체류 서류용 사진 파일을 급히 제출하는 유학생·외국인",
        detail:
          "기관마다 다른 픽셀·용량 때문에 같은 사진을 여러 번 자르고 저장합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-passport-upload",
        value: "온라인 여권 신청에서 사진 파일을 올리기 직전",
        detail:
          "반려 사유가 될 얼굴 크기·그림자·배경을 먼저 확인해야 하는 순간",
      },
      {
        id: "moment-photo-booth-closed",
        value: "사진관이 문을 닫은 밤 서류 마감이 내일인 순간",
        detail:
          "이미 찍은 정면 사진으로 제출 파일과 출력본을 만들어야 하는 순간",
      },
      {
        id: "moment-photo-size-rejected",
        value: "사진 크기·용량 오류 안내를 받은 직후",
        detail:
          "새로 촬영하기 전에 현재 사진을 정확한 픽셀과 파일 크기로 다시 내보내야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-country-one-file",
        kind: "remove",
        value:
          "여러 규격 동시 출력을 빼고 국가와 여권·비자 중 선택한 규격 한 개만 만들기",
        detail:
          "인물 사진을 서류 규격에 맞추는 흐름은 유지하고 한 번의 신청 결과로 줄입니다.",
        resultTitle: "국가·문서 하나를 고른 여권사진",
        platform: "web",
        smallestBuild:
          "정면 사진, 국가, 여권·비자 중 문서 종류 하나를 고르면 공식 크기 출처와 크롭 미리보기·규격 JPEG가 나오는 웹 화면",
      },
      {
        id: "twist-three-rejection-checks",
        kind: "add",
        value: "내보내기 전에 얼굴 크기·그림자·배경 세 항목 확인 더하기",
        detail:
          "규격 사진 생성은 유지하고 자동 보정으로 숨기기 어려운 반려 위험을 먼저 알려줍니다.",
        resultTitle: "반려 위험 3개 확인한 여권사진",
        platform: "web",
        smallestBuild:
          "정면 사진을 올리면 얼굴 비율·배경 균일도·그림자 통과/재촬영 표시와 규격 크롭이 나오는 웹 화면",
      },
      {
        id: "twist-six-up-print",
        kind: "replace",
        value: "사진관 출력을 4×6 인화지용 여섯 장 배치로 바꾸기",
        detail:
          "규격에 맞는 사진을 만드는 흐름은 유지하고 집·편의점 사진 인화에서 자를 수 있는 결과로 바꿉니다.",
        resultTitle: "편의점 인화용 여권사진 6장",
        platform: "web",
        smallestBuild:
          "규격을 통과한 사진 한 장을 선택하면 자르기 선이 붙은 4×6 인화용 JPG 한 장이 나오는 웹 화면",
      },
    ],
  },
  {
    id: "reddit-growth-guide",
    source: {
      id: "source-reddit-growth",
      sourceName: "Launch Club",
      research: {
        key: "trustmrr:launch-club",
        url: "https://trustmrr.com/startup/launch-club",
      },
      platform: "web",
      value:
        "자기 상품을 알리려는 사업자에게 Reddit 홍보 방법과 게시물 제작 도구를 제공하는 웹 서비스",
      detail:
        "홍보할 상품을 정하면 Reddit에서 어떻게 알릴지 배우고 관련 콘텐츠를 만듭니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 Reddit 마케팅 제품",
      preservedFlow:
        "홍보할 상품 선택 → Reddit용 콘텐츠 제작 → 관련 커뮤니티에서 활용",
    },
    payers: [
      {
        id: "payer-saas-founder-reddit",
        value: "혼자 만든 서비스를 직접 홍보하는 1인 SaaS 창업자",
        detail:
          "관련 커뮤니티를 하나씩 뒤지며 광고처럼 보이지 않을 게시물 소재를 매주 고민합니다.",
      },
      {
        id: "payer-app-growth-reddit",
        value: "해외 이용자를 모아야 하는 소비자 앱 성장 담당자",
        detail:
          "앱과 관련된 Reddit 대화를 직접 검색하고 커뮤니티마다 소개 문장을 다시 씁니다.",
      },
      {
        id: "payer-niche-brand-reddit",
        value: "틈새 상품을 알리는 소형 브랜드 콘텐츠 마케터",
        detail:
          "고객 질문과 게시물 반응을 여러 커뮤니티와 문서에서 따로 확인합니다.",
      },
    ],
    moments: [
      {
        id: "moment-question-found",
        value: "내 고객이 묻는 Reddit 게시물을 방금 발견한 순간",
        detail:
          "대화가 끝나기 전에 광고처럼 보이지 않는 실제 경험 답변을 남겨야 하는 순간",
      },
      {
        id: "moment-draft-sounds-promotional",
        value: "직접 쓴 답변을 읽어보니 상품 홍보처럼 보이는 순간",
        detail:
          "게시 전에 과장된 주장과 불필요한 상품 언급을 걷어내야 하는 순간",
      },
      {
        id: "moment-launch-community-reply",
        value: "출시 첫 주 관련 커뮤니티 질문에 처음 답하려는 밤",
        detail:
          "링크를 던지기보다 내가 실제로 겪은 문제와 해결을 짧게 연결해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-question-text-three-lines",
        kind: "remove",
        value:
          "질문 자동 탐색과 강의를 빼고 사용자가 붙인 질문에 답변 세 문장만 만들기",
        detail:
          "상품과 Reddit 대화를 연결하는 흐름은 유지하고 플랫폼 수집 없이 현재 질문 하나만 처리합니다.",
        resultTitle: "Reddit 질문에 경험 답변 3문장",
        platform: "web",
        smallestBuild:
          "Reddit 질문 텍스트와 내 경험 한 줄을 넣으면 경험·도움·선택적 상품 연결 세 문장과 직접 경험·출처 필요 표시가 나오는 웹 화면",
      },
      {
        id: "twist-no-product-name",
        kind: "replace",
        value: "홍보 게시물을 상품명과 링크가 없는 도움 답변으로 바꾸기",
        detail:
          "질문에 맞는 콘텐츠를 만드는 흐름은 유지하고 첫 답변에서는 직접 홍보를 제거합니다.",
        resultTitle: "상품명 없는 Reddit 도움 답변",
        platform: "web",
        smallestBuild:
          "질문 텍스트와 내가 해본 해결 한 줄을 넣으면 상품명·링크 없이 경험·방법·주의점 세 문장이 나오는 웹 화면",
      },
      {
        id: "twist-claim-check",
        kind: "add",
        value:
          "게시 전 각 주장에 내가 직접 겪음 또는 출처 필요 표시 하나 더하기",
        detail:
          "경험 답변 작성은 유지하고 꾸며낸 사례와 근거 없는 숫자를 사용자가 한 번 걸러냅니다.",
        resultTitle: "근거를 확인한 Reddit 답변 3문장",
        platform: "web",
        smallestBuild:
          "질문과 답변 초안을 넣으면 세 문장마다 직접 경험·출처 필요 표시와 고친 문장이 나오는 웹 화면",
      },
    ],
  },
  {
    id: "party-imposter",
    source: {
      id: "source-party-imposter",
      sourceName: "imposter․ai",
      research: {
        key: "trustmrr:imposter-ai",
        url: "https://trustmrr.com/startup/imposter-ai",
      },
      platform: "app",
      value:
        "모임 참가자에게 비밀 역할과 AI 카테고리를 나눠주고 서로 속이고 맞히게 하는 파티 게임",
      detail:
        "함께할 사람과 카테고리를 고르면 각자 비밀 역할을 받고 대화와 추리로 가짜 역할을 찾아냅니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 소셜 추리 파티게임 제품",
      preservedFlow:
        "참가자와 카테고리 선택 → 비밀 역할·단어 배정 → 대화 뒤 가짜 참가자 지목",
    },
    payers: [
      {
        id: "payer-people-ops-host",
        value: "매달 신입 환영회를 여는 스타트업 피플팀 담당자",
        detail:
          "어색한 참가자들이 함께 말하게 만들 게임을 행사 때마다 새로 검색하고 설명합니다.",
      },
      {
        id: "payer-youth-program-host",
        value: "매주 청소년 모임을 진행하는 문화센터 강사",
        detail:
          "참가 인원에 맞춰 종이 역할 카드를 만들고 게임이 끝날 때마다 다시 섞습니다.",
      },
      {
        id: "payer-boardgame-manager",
        value: "단체 손님을 자주 받는 보드게임 카페 매니저",
        detail:
          "단체 손님이 올 때마다 익숙한 카테고리와 단어를 다시 골라 종이에 적습니다.",
      },
    ],
    moments: [
      {
        id: "moment-dinner-silence",
        value: "처음 만난 참가자들이 말없이 앉아 있는 행사 첫 5분",
        detail: "누구도 민망하지 않게 바로 웃으며 분위기를 바꾸고 싶은 순간",
      },
      {
        id: "moment-remote-awkward",
        value: "준비한 대화 소재가 떨어져 모두 휴대폰을 보는 순간",
        detail: "말이 없는 참가자도 자연스럽게 한마디씩 하게 하고 싶은 순간",
      },
      {
        id: "moment-same-game",
        value: "지난번처럼 종이 카드와 소재를 다시 준비해야 하는 순간",
        detail:
          "소재는 새롭게 바꾸고 준비와 규칙 설명 없이 바로 놀고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-secret-mission",
        kind: "add",
        value: "각 비밀 역할에 한 줄 행동 미션 더하기",
        detail:
          "역할 배정과 가짜 찾기는 그대로 두고 참가자가 수행할 행동 하나만 더합니다.",
        resultTitle: "딴짓 미션 추리게임",
        platform: "app",
        smallestBuild:
          "비밀 역할과 들키지 않고 수행할 행동 한 줄, 확인 버튼만 있는 모바일 카드 화면",
      },
      {
        id: "twist-one-phone",
        kind: "remove",
        value: "회원가입과 방 설정을 빼고 휴대폰 한 대 돌려보기만 남기기",
        detail:
          "비밀 역할 배정과 추리는 유지하고 각자 접속하는 준비만 덜어냅니다.",
        resultTitle: "한 대로 시작하는 범인찾기",
        platform: "app",
        smallestBuild:
          "참가자 수를 누르면 첫 비밀 역할 카드와 다음 사람에게 넘기기 버튼만 뜨는 모바일 화면",
      },
      {
        id: "twist-photo-category",
        kind: "replace",
        value: "AI 글 카테고리를 참가자가 찍은 사진 한 장으로 바꾸기",
        detail:
          "비밀 역할과 추리 규칙은 유지하고 게임 소재 입력만 사진으로 바꿉니다.",
        resultTitle: "한 장 사진 범인찾기",
        platform: "app",
        smallestBuild:
          "사진 한 장을 찍으면 진짜 단어와 가짜 역할 카드가 만들어지는 모바일 화면",
      },
    ],
  },
  {
    id: "connected-knowledge",
    source: {
      id: "source-connected-knowledge",
      sourceName: "Kortex-Notebooklm",
      research: {
        key: "trustmrr:kortex-notebooklm",
        url: "https://trustmrr.com/startup/kortex-notebooklm",
      },
      platform: "web",
      value:
        "자료를 한곳에 모으면 내용을 서로 연결하고 나중에 필요한 통찰을 다시 찾아주는 지식관리 서비스",
      detail:
        "문서와 메모를 저장하면 관련 내용을 이어 붙여 필요한 정보와 잊었던 생각을 다시 찾게 해줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 연결형 지식관리 제품",
      preservedFlow:
        "문서·메모 저장 → 관련 내용과 관계 연결 → 필요한 지식·통찰 검색",
    },
    payers: [
      {
        id: "payer-product-researcher",
        value: "매주 고객 인터뷰를 정리하는 제품 리서처",
        detail:
          "인터뷰 녹취와 관찰 메모를 문서마다 나눠 저장한 뒤 비슷한 발언을 직접 다시 찾습니다.",
      },
      {
        id: "payer-strategy-consultant",
        value: "여러 고객 프로젝트를 오가는 프리랜서 전략 컨설턴트",
        detail:
          "과거 프로젝트의 근거와 아이디어를 폴더와 메신저 검색으로 반복해서 찾아냅니다.",
      },
      {
        id: "payer-lab-researcher",
        value: "논문과 실험노트를 매일 쌓는 대학원 연구원",
        detail:
          "읽은 논문의 주장과 실험 결과를 각각 기록하고 관련 메모를 손으로 연결합니다.",
      },
    ],
    moments: [
      {
        id: "moment-decision-proof",
        value: "팀원이 지난 결정의 근거를 다시 묻는 회의 중",
        detail: "기억에 의존하지 않고 근거 메모와 원문을 함께 찾아야 하는 순간",
      },
      {
        id: "moment-interview-conflict",
        value: "서로 반대되는 고객 인터뷰 발언을 발견한 오후",
        detail:
          "흩어진 발언을 연결해 반복되는 패턴이 있는지 확인하고 싶은 순간",
      },
      {
        id: "moment-client-meeting",
        value: "오래전 고객과 다시 만나는 미팅 10분 전",
        detail:
          "지난 대화와 결정에서 지금 꺼낼 내용을 빠르게 찾아 설명해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-doc-claim-map",
        kind: "remove",
        value:
          "무한 저장·지식 그래프를 빼고 문서 세 개의 같은 주장과 반대 주장만 연결하기",
        detail:
          "여러 자료의 관계를 찾는 흐름은 유지하고 지금 판단할 문서 세 개만 비교합니다.",
        resultTitle: "문서 3개의 합의·충돌 근거표",
        platform: "web",
        smallestBuild:
          "PDF·TXT 문서 최대 세 개와 질문 하나를 넣으면 합의·충돌·확인 불가 주장과 각 원문 위치가 표로 나오는 웹 화면",
      },
      {
        id: "twist-source-jump-only",
        kind: "replace",
        value: "그럴듯한 통찰 문장을 원문으로 바로 가는 근거 세 칸으로 바꾸기",
        detail:
          "관련 내용을 연결하는 흐름은 유지하고 답변보다 검증 가능한 출처 위치를 결과로 만듭니다.",
        resultTitle: "원문 위치가 붙은 결정 근거 3개",
        platform: "web",
        smallestBuild:
          "문서 세 개와 질문을 넣으면 결정에 찬성·반대·미확인 근거 한 개씩과 파일명·페이지·원문이 나오는 웹 화면",
      },
      {
        id: "twist-speaker-conflict",
        kind: "add",
        value: "인터뷰·회의 자료라면 서로 다른 화자와 날짜 표시 하나 더하기",
        detail:
          "관련 발언을 묶는 흐름은 유지하고 오래된 의견과 한 사람의 반복 발언을 구분합니다.",
        resultTitle: "화자·날짜로 확인하는 의견 충돌표",
        platform: "web",
        smallestBuild:
          "화자·날짜가 있는 녹취 세 파일과 질문을 넣으면 같은 의견·반대 의견을 화자 수·날짜·원문 위치와 함께 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "wall-frame-layout",
    source: {
      id: "source-gallerywall",
      sourceName: "GalleryWall",
      research: {
        key: "trustmrr:gallerywall",
        url: "https://trustmrr.com/startup/gallerywall",
      },
      platform: "app",
      value:
        "벽과 액자 크기를 넣어 실제로 걸기 전 갤러리 월 배치를 만들어보는 인테리어 앱",
      detail:
        "벽 사진과 프레임 치수를 이용해 여러 액자의 위치·간격·전체 크기를 미리 확인합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $1.8k·성장 73%, DIY 인테리어용 갤러리 월 배치 메커니즘 확인",
      preservedFlow:
        "벽·액자 치수 입력 → 배치 계산·미리보기 → 실제 설치 위치 확인",
    },
    payers: [
      {
        id: "payer-new-home-gallery",
        value: "새집 벽에 가족사진·포스터를 함께 걸려는 입주자",
        detail:
          "바닥에 액자를 늘어놓고도 벽에서 간격과 전체 크기가 맞을지 판단하지 못합니다.",
      },
      {
        id: "payer-small-cafe-wall",
        value: "카페·공방 벽 전시를 직접 바꾸는 소형 매장 운영자",
        detail:
          "액자를 걸었다 떼며 못 자국을 늘리지 않고 계절 전시 배치를 먼저 정해야 합니다.",
      },
      {
        id: "payer-photo-exhibition-host",
        value: "작은 공간에 사진전을 설치하는 1인 작가",
        detail:
          "서로 다른 프레임 크기를 벽 폭 안에 맞추려고 종이 도면을 반복해서 그립니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-drilling-wall",
        value: "벽에 첫 못을 박기 10분 전",
        detail:
          "액자 세 개의 중심·간격·전체 폭이 맞는지 마지막으로 확인해야 하는 순간",
      },
      {
        id: "moment-frames-arrived",
        value: "주문한 액자들이 도착해 바닥에 펼쳐둔 순간",
        detail: "실제 치수를 넣어 가장 안정적인 순서를 골라야 하는 순간",
      },
      {
        id: "moment-display-change",
        value: "매장·전시 벽 구성을 이번 주말에 바꾸려는 밤",
        detail:
          "기존 구멍과 벽 폭을 고려해 새 배치의 기준점을 정해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-frames-only",
        kind: "remove",
        value: "가구·방 전체 설계를 빼고 액자 세 개 배치만 남기기",
        detail:
          "벽과 프레임 치수로 배치를 정하는 흐름은 유지하고 첫 결과를 세 개로 줄입니다.",
        resultTitle: "액자 3개 벽 배치",
        platform: "web",
        smallestBuild:
          "벽 가로·세로와 액자 세 개 크기를 넣으면 간격이 표시된 배치안 한 개가 나오는 웹 화면",
      },
      {
        id: "twist-wall-photo-overlay",
        kind: "add",
        value: "계산한 배치를 사용자가 찍은 벽 사진 위에 겹쳐 보기",
        detail:
          "치수 기반 배치는 유지하고 색·가구와 어울리는지 실제 공간에서 확인합니다.",
        resultTitle: "내 벽 사진 위 액자 배치",
        platform: "web",
        smallestBuild:
          "정면 벽 사진·벽 폭·액자 크기를 넣으면 비율에 맞춘 액자 세 개가 겹쳐진 미리보기가 나오는 웹 화면",
      },
      {
        id: "twist-hanging-measurements",
        kind: "replace",
        value: "예쁜 미리보기를 못 위치와 바닥·액자 사이 거리표로 바꾸기",
        detail:
          "배치 계산은 유지하고 액자 뒷면 걸이 위치까지 받아 실제 설치 측정값을 만듭니다.",
        resultTitle: "걸이 위치까지 넣은 액자 배치표",
        platform: "web",
        smallestBuild:
          "벽 크기, 액자 외곽 크기, 위쪽에서 걸이까지 거리를 넣으면 왼쪽 벽·바닥 기준 못 위치와 간격이 적힌 1쪽 PDF가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "class-material-coach",
    source: {
      id: "source-atlas-learning",
      sourceName: "Atlas",
      research: {
        key: "trustmrr:atlas",
        url: "https://trustmrr.com/startup/atlas",
      },
      platform: "web",
      value: "수업 자료를 읽고 학생별 숙제와 시험 공부를 도와주는 학습 서비스",
      detail:
        "강의 자료와 필기를 읽어 학생이 묻는 문제를 설명하고 시험에 필요한 내용을 정리해줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 개인화 학습 제품",
      preservedFlow:
        "수업 자료 넣기 → AI가 내용과 질문 분석 → 맞춤 학습 도움 받기",
    },
    payers: [
      {
        id: "payer-nursing-student",
        value: "매주 강의 슬라이드 수백 장을 복습하는 간호학과 학생",
        detail:
          "과목마다 흩어진 슬라이드를 다시 열어 숙제와 시험에 나올 개념을 손으로 정리합니다.",
      },
      {
        id: "payer-working-license-student",
        value: "퇴근 후 자격시험을 준비하는 직장인",
        detail:
          "짧은 공부 시간에 교재와 강의 필기를 번갈아 보며 오늘 외울 범위를 다시 고릅니다.",
      },
      {
        id: "payer-academy-instructor",
        value: "학생별 오답을 관리하는 소형 학원 강사",
        detail:
          "수업이 끝날 때마다 여러 학생의 틀린 문제를 교재 단원과 직접 연결해 과제를 만듭니다.",
      },
    ],
    moments: [
      {
        id: "moment-homework-after-class",
        value: "수업이 끝나고 숙제 마감까지 세 시간 남은 때",
        detail:
          "강의 자료에서 숙제에 필요한 개념만 찾아 제대로 이해하고 싶은 순간",
      },
      {
        id: "moment-exam-week",
        value: "시험을 일주일 앞둔 일요일 저녁",
        detail:
          "폴더에 쌓인 자료 중 오늘 먼저 공부할 순서를 결정해야 하는 순간",
      },
      {
        id: "moment-mock-result",
        value: "모의고사 채점을 마치고 같은 개념을 틀린 학생을 발견한 직후",
        detail:
          "새 오답지를 만들지 않고 수업 자료에서 나온 질문으로 이해도를 다시 확인하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-wrong-answer-three-concepts",
        kind: "replace",
        value:
          "자료 전체 요약을 오답 한 문제에서 놓친 개념 세 개 찾기로 바꾸기",
        detail:
          "수업 자료와 학생 답을 함께 분석하는 흐름은 유지하고 다음 복습 범위를 한 문제로 줄입니다.",
        resultTitle: "오답 한 장에서 찾는 약한 개념 3개",
        platform: "web",
        smallestBuild:
          "수업 PDF 하나와 풀이가 보이는 오답 사진 한 장을 넣으면 빠진 개념 최대 세 개·학생 풀이 근거·자료 페이지가 나오는 웹 화면",
      },
      {
        id: "twist-page-evidence-reteach",
        kind: "add",
        value: "각 오답 개념에 수업 자료 페이지와 다시 설명할 한 문장 더하기",
        detail:
          "맞춤 학습 도움은 유지하고 범용 설명 대신 실제 수업 자료에 근거한 재설명을 만듭니다.",
        resultTitle: "수업 페이지로 다시 배우는 오답 1문제",
        platform: "web",
        smallestBuild:
          "수업 PDF와 오답 사진을 넣으면 틀린 단계·근거 페이지·그 페이지 표현으로 만든 재설명 한 문장이 나오는 웹 화면",
      },
      {
        id: "twist-two-minute-retest",
        kind: "replace",
        value: "긴 첨삭을 같은 개념을 말로 다시 답하는 2분 재시험으로 바꾸기",
        detail:
          "자료 기반 개인화는 유지하고 설명을 읽는 데서 끝나지 않고 방금 놓친 개념을 바로 확인합니다.",
        resultTitle: "오답 개념 2분 구술 재시험",
        platform: "web",
        smallestBuild:
          "오답 분석 뒤 자료에서 만든 질문 한 개에 브라우저로 2분 답하면 포함·누락된 핵심어와 자료 페이지가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "sixty-second-trade-quote",
    source: {
      id: "source-instanttradequote",
      sourceName: "instanttradequote",
      research: {
        key: "trustmrr:instanttradequote",
        url: "https://trustmrr.com/startup/instanttradequote",
      },
      platform: "web",
      value:
        "현장 기술자가 60초 안에 전문 PDF 견적서를 만들고 보낼 수 있게 하는 견적 도구",
      detail:
        "작업·수량·단가와 고객 정보를 넣어 합계와 조건이 있는 견적서를 빠르게 생성합니다.",
      evidence:
        "TrustMRR 원본에서 기술자용 60초 PDF 견적·월 10건 무료→유료 모델 확인",
      preservedFlow:
        "작업 항목·가격 입력 → 합계·조건 계산 → 고객에게 보낼 PDF 견적 생성",
    },
    payers: [
      {
        id: "payer-home-repair-quote",
        value: "방문 수리 뒤 현장에서 견적을 보내는 1인 기사",
        detail:
          "차로 돌아가 작업·부품·출장비를 메모에서 견적 양식으로 다시 옮깁니다.",
      },
      {
        id: "payer-event-install-quote",
        value: "간판·행사 장비 설치 견적을 자주 만드는 소형 업체 대표",
        detail:
          "현장마다 선택 항목과 제외 범위를 설명하다 견적 발송이 늦어집니다.",
      },
      {
        id: "payer-cleaning-quote",
        value: "입주청소·정리 서비스 견적을 직접 보내는 운영자",
        detail:
          "평수·추가 구역·폐기물 비용을 카톡으로 계산해 고객마다 다른 형식으로 보냅니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-site-quote",
        value: "현장 방문을 끝내고 고객이 견적을 기다리는 10분",
        detail:
          "기억이 생생할 때 항목·수량·제외 범위를 문서로 닫아야 하는 순간",
      },
      {
        id: "moment-client-asks-option",
        value: "고객이 기본안과 추가 작업 가격을 함께 물은 순간",
        detail: "한 총액이 아니라 선택 가능한 항목과 차이를 보여줘야 하는 순간",
      },
      {
        id: "moment-before-quote-followup",
        value: "어제 보낸 구두 가격을 서면으로 다시 보내기 직전",
        detail:
          "말한 금액과 다른 견적을 보내 신뢰를 잃지 않도록 근거를 확인해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-line-items",
        kind: "remove",
        value:
          "고객·프로젝트 관리를 빼고 1분 안에 작업 항목 세 개짜리 PDF 견적 만들기",
        detail:
          "작업과 가격을 전문 견적으로 만드는 흐름은 유지하고 한 현장 결과로 줄입니다.",
        resultTitle: "1분 완성 작업 3줄 견적서",
        platform: "web",
        smallestBuild:
          "고객명, 작업·수량·단가 최대 세 줄, 부가세 포함 여부를 넣으면 합계·유효기간이 붙은 1쪽 PDF가 나오는 모바일 웹 화면",
      },
      {
        id: "twist-option-line",
        kind: "add",
        value: "필수 합계와 분리된 선택 작업 한 줄 더하기",
        detail:
          "견적 생성은 유지하고 고객이 추가 여부를 고를 항목을 총액과 섞지 않습니다.",
        resultTitle: "선택 작업이 분리된 현장 견적",
        platform: "web",
        smallestBuild:
          "필수 작업 세 줄과 선택 작업 한 줄을 넣으면 기본 합계·선택 시 합계가 나뉜 PDF가 나오는 웹 화면",
      },
      {
        id: "twist-included-excluded",
        kind: "replace",
        value: "긴 약관을 포함 작업 세 줄과 제외 작업 한 줄로 바꾸기",
        detail:
          "견적 가격과 범위를 전달하는 흐름은 유지하고 분쟁을 만드는 경계만 짧게 남깁니다.",
        resultTitle: "포함·제외가 보이는 1쪽 견적",
        platform: "web",
        smallestBuild:
          "작업·가격과 포함 세 줄·제외 한 줄을 넣으면 고객에게 바로 보낼 1쪽 견적 PDF가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "track-form-coach",
    source: {
      id: "source-3ak-track",
      sourceName: "3AK Track & Field",
      research: {
        key: "trustmrr:3ak-track-field",
        url: "https://trustmrr.com/startup/3ak-track-field",
      },
      platform: "app",
      value: "달리는 자세와 기록을 분석해 선수별 훈련 방법을 추천하는 앱",
      detail:
        "달리기 영상과 기록을 바탕으로 자세에서 고칠 점을 찾고 기록 향상을 위한 훈련을 제안합니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 육상 훈련 제품",
      preservedFlow:
        "달리기 영상과 기록 넣기 → 자세와 훈련 상태 분석 → 맞춤 훈련 받기",
    },
    payers: [
      {
        id: "payer-running-club-coach",
        value: "회원의 달리기 자세를 영상으로 설명하는 소형 러닝클럽 코치",
        detail:
          "수업 뒤 회원별 영상을 멈춰 보며 다음 연습에서 고칠 한 동작을 손으로 표시합니다.",
      },
      {
        id: "payer-school-track-coach",
        value: "선수 여러 명의 출발·착지 영상을 보는 학교 육상 코치",
        detail:
          "짧은 훈련 시간에 모든 선수 영상의 같은 프레임을 비교하고 설명하기 어렵습니다.",
      },
      {
        id: "payer-amateur-runner",
        value: "촬영한 영상을 보고 자세 하나씩 고치는 아마추어 러너",
        detail:
          "느낌과 실제 자세가 달라도 영상에서 어느 장면을 봐야 할지 판단하기 어렵습니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-running-clip",
        value: "옆에서 찍은 10초 달리기 영상을 받은 직후",
        detail: "다음 세트 전에 한 프레임과 한 동작만 골라 설명해야 하는 순간",
      },
      {
        id: "moment-before-coach-feedback",
        value: "회원에게 오늘 자세 피드백을 보내기 10분 전",
        detail:
          "의료 판단 없이 눈에 보이는 관절 위치와 다음 연습 한 가지만 전달해야 하는 순간",
      },
      {
        id: "moment-form-changed",
        value: "평소보다 착지·상체 모양이 달라 보이는 훈련 직후",
        detail: "전체 훈련 계획보다 달라진 장면을 나란히 확인하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-ten-second-pose-overlay",
        kind: "remove",
        value:
          "장기 훈련 계획과 부상 예측을 빼고 10초 영상의 관절선 겹치기만 남기기",
        detail:
          "영상에서 자세를 분석하는 흐름은 유지하고 의료·성과 판단 없이 보이는 위치만 표시합니다.",
        resultTitle: "10초 달리기 관절선 영상",
        platform: "web",
        smallestBuild:
          "옆에서 찍은 10초 영상 하나를 올리면 어깨·골반·무릎·발목 선과 가장 크게 변한 프레임 한 장이 나오는 웹 화면",
      },
      {
        id: "twist-one-observable-cue",
        kind: "replace",
        value:
          "맞춤 훈련 처방을 영상에서 확인 가능한 다음 연습 한 문장으로 바꾸기",
        detail:
          "자세 분석 뒤 행동을 제안하는 흐름은 유지하고 통증·부상·완치 주장을 하지 않습니다.",
        resultTitle: "다음 세트에서 확인할 자세 한 가지",
        platform: "web",
        smallestBuild:
          "10초 영상의 관절선과 함께 다음 촬영에서 확인할 관찰 문장 한 개와 비교할 프레임 위치가 나오는 웹 화면",
      },
      {
        id: "twist-before-after-frame",
        kind: "add",
        value: "같은 구간의 이전 영상이 있으면 대표 프레임 두 장 비교 더하기",
        detail:
          "달리기 영상 분석은 유지하고 점수 대신 눈으로 확인할 위치 변화를 보여줍니다.",
        resultTitle: "이전·오늘 달리기 대표 프레임 비교",
        platform: "web",
        smallestBuild:
          "같은 방향의 이전·오늘 10초 영상을 넣으면 접지 시점 대표 프레임과 관절선 두 장이 나란히 나오는 웹 화면",
      },
    ],
  },
  {
    id: "youtube-language-loop",
    source: {
      id: "source-language-learning-video",
      sourceName: "Language Learning with Netflix & YouTube-AFL",
      research: {
        key: "chrome_web_store:bekopgepchoeepdmokgkpkfhegkeohbl",
        url: "https://chromewebstore.google.com/detail/language-learning-with-ne/bekopgepchoeepdmokgkpkfhegkeohbl",
      },
      platform: "plugin",
      value:
        "Netflix·YouTube 영상에 이중 자막과 표현 학습·말하기 연습을 붙이는 언어 학습 확장",
      detail:
        "현재 재생 중인 영상 자막을 두 언어로 함께 보여주고 모르는 표현을 저장하거나 따라 말하게 합니다.",
      evidence:
        "Chrome Web Store 수집본 평점 3.9, 실험 표본 내 시장 신호 상위 17.2%",
      preservedFlow:
        "현재 영상 자막 읽기 → 모국어·학습 언어 연결 → 표현 확인과 말하기 연습",
    },
    payers: [
      {
        id: "payer-youtube-beginner",
        value: "교재 대신 유튜브로 영어를 공부하는 직장인 초급 학습자",
        detail:
          "한 문장을 놓칠 때마다 자막·번역·사전을 오가다 영상 흐름과 공부를 함께 놓칩니다.",
      },
      {
        id: "payer-speaking-test",
        value: "영어 말하기 시험을 준비하며 실제 표현을 모으는 취업 준비생",
        detail:
          "영상에서 좋은 표현을 발견해도 발음과 쓰임을 다시 찾아 짧게 말해보는 데 시간이 듭니다.",
      },
      {
        id: "payer-parent-video-study",
        value: "자녀와 짧은 영어 영상을 함께 보는 초등 학부모",
        detail:
          "한 편 전체를 가르치기보다 오늘 따라 말할 문장 세 개를 고르고 뜻을 설명해야 합니다.",
      },
    ],
    moments: [
      {
        id: "moment-caption-too-fast",
        value: "공개 유튜브 영상의 자막이 빨라 같은 장면을 세 번 돌려본 순간",
        detail:
          "현재 문장의 뜻과 핵심 표현을 화면을 떠나지 않고 확인하고 싶은 순간",
      },
      {
        id: "moment-expression-found",
        value: "오늘 써보고 싶은 표현을 영상에서 방금 들은 순간",
        detail:
          "그 문장의 시점·뜻·발음과 짧은 따라 말하기 구간을 바로 남겨야 하는 순간",
      },
      {
        id: "moment-ten-minute-study",
        value: "잠들기 전 10분 동안 영상 한 편만 공부하려는 밤",
        detail:
          "전체 강의 대신 영상에서 중요한 세 문장만 이해하고 말해보고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-youtube-public-only",
        kind: "remove",
        value:
          "Netflix 연동과 AI 마인드맵을 빼고 공개 유튜브 자막 한 편만 다루기",
        detail:
          "영상 자막으로 학습하는 흐름은 유지하고 DRM·계정 연동 없이 시작합니다.",
        resultTitle: "유튜브 한 편의 이중 자막 학습표",
        platform: "web",
        smallestBuild:
          "자막이 공개된 유튜브 URL 하나를 넣으면 원문·한국어 뜻·재생 시점이 문장별로 나오는 웹 화면",
      },
      {
        id: "twist-three-expressions",
        kind: "replace",
        value: "영상 전체 단어장을 오늘 쓸 표현 세 개로 바꾸기",
        detail:
          "자막에서 학습 재료를 고르는 흐름은 유지하고 복습할 결과를 세 문장으로 제한합니다.",
        resultTitle: "영상에서 고른 오늘의 표현 3개",
        platform: "web",
        smallestBuild:
          "유튜브 URL을 넣으면 반복·난이도 기준 표현 세 개와 원문 시점·뜻·내 문장 빈칸이 나오는 웹 화면",
      },
      {
        id: "twist-thirty-second-shadowing",
        kind: "add",
        value: "표현 하나에 30초 구간 반복과 내 음성 길이 비교 더하기",
        detail:
          "영상 표현을 따라 말하는 흐름은 유지하고 발음 점수 대신 듣고 말한 길이와 누락 단어만 확인합니다.",
        resultTitle: "영상 표현 30초 따라 말하기",
        platform: "web",
        smallestBuild:
          "선택한 표현의 30초 이하 구간을 반복 재생하고 브라우저 녹음에서 말한 문장·누락 단어·원문 시점을 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "small-business-site",
    source: {
      id: "source-small-business-site",
      sourceName: "Chariot AI",
      research: {
        key: "trustmrr:chariot-ai",
        url: "https://trustmrr.com/startup/chariot-ai",
      },
      platform: "web",
      value:
        "가게나 사업 정보를 입력하면 비개발자도 몇 분 안에 웹사이트를 만들 수 있게 해주는 서비스",
      detail:
        "하는 일과 연락처 같은 기본 정보를 적으면 AI가 웹페이지 구성과 문구를 만들어 완성 사이트를 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 AI 웹사이트 제작 제품",
      preservedFlow:
        "사업 정보 입력 → AI가 웹페이지 구성·문구 생성 → 완성된 사이트 확인",
    },
    payers: [
      {
        id: "payer-local-pop-up",
        value: "이번 주말 팝업을 여는 1인 판매자",
        detail:
          "포스터는 만들었지만 위치·시간·가격·문의 링크를 휴대폰에서 보기 좋게 다시 정리해야 합니다.",
      },
      {
        id: "payer-local-service-shop",
        value: "메뉴와 예약 방법만 온라인에 올리고 싶은 동네 서비스업 사장",
        detail:
          "큰 홈페이지는 필요 없지만 고객에게 보낼 한 주소가 없어 이미지와 지도 링크를 따로 보냅니다.",
      },
      {
        id: "payer-local-class-host",
        value: "원데이클래스 모집을 직접 하는 공방 운영자",
        detail:
          "수업 안내 이미지를 만든 뒤 신청·주소·문의 버튼이 있는 모바일 페이지를 다시 제작합니다.",
      },
    ],
    moments: [
      {
        id: "moment-flyer-ready",
        value: "행사·메뉴 전단 이미지가 완성된 직후",
        detail:
          "이미 적힌 내용을 다시 입력하지 않고 공유할 모바일 안내 페이지가 필요한 순간",
      },
      {
        id: "moment-customer-asks-link",
        value: "고객이 위치와 예약 방법을 한 번에 볼 링크를 물은 순간",
        detail: "지도·전화·신청 정보를 여러 메시지로 나눠 보내기 싫은 순간",
      },
      {
        id: "moment-opening-tomorrow",
        value: "내일 영업·모집을 시작하는데 홈페이지가 없는 밤",
        detail: "도메인·메뉴 설정 없이 오늘 공유할 주소 하나가 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-flyer-photo-page",
        kind: "replace",
        value: "사업 설명 입력을 전단·메뉴 사진 한 장으로 바꾸기",
        detail:
          "사업 정보를 읽어 사이트를 만드는 흐름은 유지하고 이미 만든 홍보물을 입력으로 재사용합니다.",
        resultTitle: "전단 한 장으로 만든 모바일 안내 페이지",
        platform: "web",
        smallestBuild:
          "전단·메뉴 사진 한 장을 올리면 상호·시간·가격·주소를 확인한 뒤 한 화면 모바일 안내 링크가 생기는 웹 화면",
      },
      {
        id: "twist-one-screen-only",
        kind: "remove",
        value: "다중 페이지·블로그·SEO를 빼고 모바일 한 화면만 남기기",
        detail:
          "완성된 사이트를 즉시 받는 흐름은 유지하고 오늘 필요한 핵심 안내와 버튼만 제공합니다.",
        resultTitle: "오늘 바로 공유하는 가게 한 화면",
        platform: "web",
        smallestBuild:
          "가게 정보나 전단 사진을 넣으면 소개·시간·가격·지도·전화 버튼이 한 화면에 나오는 공개 링크",
      },
      {
        id: "twist-local-action-buttons",
        kind: "add",
        value: "추출한 주소·전화·신청 URL에 지도·전화·신청 버튼 세 개 더하기",
        detail:
          "사업 소개 페이지는 유지하고 한국 고객이 바로 행동할 연결만 명확하게 만듭니다.",
        resultTitle: "지도·전화·신청이 바로 되는 전단 페이지",
        platform: "web",
        smallestBuild:
          "전단 사진에서 확인한 주소·전화·신청 URL로 지도 열기·전화하기·신청하기 버튼이 붙은 한 화면 링크",
      },
    ],
  },
  {
    id: "audio-noise-cleaner",
    source: {
      id: "source-audio-noise-cleaner",
      sourceName: "Voice Cleaner",
      research: {
        key: "trustmrr:voice-cleaner",
        url: "https://trustmrr.com/startup/voice-cleaner",
      },
      platform: "web",
      value:
        "음성 파일을 넣으면 AI가 배경 소음을 지우고 깨끗한 오디오로 돌려주는 도구",
      detail:
        "녹음한 음성 파일을 올리면 AI가 주변 소음을 제거하고 듣기 편한 음성 파일을 만들어줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 AI 오디오 소음 제거 제품",
      preservedFlow:
        "음성 파일 업로드 → AI가 배경 소음 제거 → 깨끗한 오디오 저장",
    },
    payers: [
      {
        id: "payer-podcast-editor",
        value: "매주 인터뷰를 편집하는 프리랜서 팟캐스트 편집자",
        detail:
          "에어컨 소리와 키보드 소음을 구간마다 찾아 편집 프로그램에서 직접 줄입니다.",
      },
      {
        id: "payer-online-instructor",
        value: "온라인 강의를 직접 녹화해 올리는 1인 강사",
        detail:
          "집에서 녹음한 강의마다 잡음 제거 설정을 다시 맞추고 전체 파일을 반복 확인합니다.",
      },
      {
        id: "payer-field-reporter",
        value: "야외 취재 음성을 녹음하는 지역 뉴스 기자",
        detail:
          "바람과 차량 소리 사이에서 인터뷰 문장이 들리는 구간을 손으로 잘라 따로 보관합니다.",
      },
    ],
    moments: [
      {
        id: "moment-interview-hum",
        value: "긴 인터뷰를 마친 뒤 에어컨 소리를 발견한 밤",
        detail:
          "다시 녹음할 수 없는 대화를 사람 목소리 중심으로 깨끗하게 살리고 싶은 순간",
      },
      {
        id: "moment-course-deadline",
        value: "강의 파일 업로드 마감이 30분 남은 오후",
        detail:
          "편집 프로그램을 다시 열지 않고 전체 음성을 빠르게 깨끗하게 만들어야 하는 순간",
      },
      {
        id: "moment-wind-quote",
        value: "야외 인터뷰의 핵심 답변이 바람 소리에 묻힌 순간",
        detail:
          "보도에 쓸 한 문장을 다시 들을 수 있도록 소음을 줄여 살려야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-before-after",
        kind: "add",
        value: "저장 전에 원본과 정리본 10초 비교 더하기",
        detail:
          "파일 업로드와 소음 제거는 유지하고 결과 저장 전 차이를 듣는 행동만 더합니다.",
        resultTitle: "10초로 확인하는 음성 정리",
        platform: "web",
        smallestBuild:
          "같은 구간의 원본·정리본 재생 버튼과 저장 버튼만 나란히 보여주는 웹 화면",
      },
      {
        id: "twist-one-clean-button",
        kind: "remove",
        value: "세부 음향 설정을 빼고 소음 지우기 버튼 하나만 남기기",
        detail:
          "AI가 배경 소음을 제거하는 구조는 유지하면서 사용자가 조절할 설정만 덜어냅니다.",
        resultTitle: "버튼 하나 음성 청소",
        platform: "web",
        smallestBuild:
          "음성 파일 이름과 소음 지우기 버튼, 처리 상태만 보여주는 웹 화면",
      },
      {
        id: "twist-direct-recording",
        kind: "replace",
        value: "저장된 파일 업로드를 앱에서 바로 30초 녹음으로 바꾸기",
        detail:
          "AI 소음 제거와 결과 제공은 유지하고 음성을 받는 방식만 즉시 녹음으로 바꿉니다.",
        resultTitle: "바로 녹음 소음 정리",
        platform: "app",
        smallestBuild:
          "30초 녹음 버튼을 누르면 정리된 음성을 바로 재생하는 모바일 화면",
      },
    ],
  },
  {
    id: "safe-message-reply",
    source: {
      id: "source-safe-message-reply",
      sourceName: "Yazcam",
      research: {
        key: "trustmrr:yazcam",
        url: "https://trustmrr.com/startup/yazcam",
      },
      platform: "app",
      value:
        "대화 화면 캡처를 올리면 AI가 내용을 분석해 답장·첫 문장·대화 전략을 제안하는 모바일 앱",
      detail:
        "사용자가 직접 고른 대화 캡처를 올리면 AI가 맥락을 살펴보고 이어서 보낼 문장과 대화 방법을 제안합니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 대화 답장 제안 제품",
      preservedFlow:
        "대화 캡처 업로드 → AI가 대화 맥락 분석 → 답장·첫 문장·전략 제안",
    },
    payers: [
      {
        id: "payer-craft-shop-owner",
        value: "고객 문의를 메신저로 받는 1인 공방 운영자",
        detail:
          "주문 조건이 다른 문의가 올 때마다 이전 답장을 찾아 문장을 고쳐서 보냅니다.",
      },
      {
        id: "payer-junior-ui-designer",
        value: "해외 동료와 매일 채팅하는 주니어 UI 디자이너",
        detail:
          "짧은 영어 메시지가 무례하게 들릴까 걱정해 번역기와 메신저를 여러 번 오갑니다.",
      },
      {
        id: "payer-video-freelancer",
        value: "여러 고객과 일정을 조율하는 프리랜서 영상 편집자",
        detail:
          "수정 요청과 마감 변경이 섞인 긴 메시지를 읽고 답할 항목을 메모장에 다시 정리합니다.",
      },
    ],
    moments: [
      {
        id: "moment-ambiguous-customer",
        value: "고객이 짧게 안 되냐고 물어본 저녁",
        detail:
          "상대 감정을 넘겨짚지 않고 가능한 조건과 확인할 질문만 답하고 싶은 순간",
      },
      {
        id: "moment-long-feedback",
        value: "해외 동료가 긴 수정 요청을 보낸 회의 직전",
        detail:
          "놓친 항목 없이 이해한 내용과 다음 행동을 짧게 정리해야 하는 순간",
      },
      {
        id: "moment-delay-message",
        value: "수정 요청과 마감 변경이 한 메시지에 함께 온 순간",
        detail:
          "확정된 사실과 다시 물을 조건, 다음 행동을 빠짐없이 정리해 답하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-work-message-three-facts",
        kind: "replace",
        value:
          "완성 답장 생성을 확정된 사실·확인할 조건·내 다음 행동 세 칸으로 바꾸기",
        detail:
          "대화 맥락을 분석하는 흐름은 유지하고 상대의 감정이나 의도를 지어내지 않습니다.",
        resultTitle: "업무 메시지의 사실·질문·다음 행동 3칸",
        platform: "web",
        smallestBuild:
          "업무 메시지 캡처 한 장을 올리면 원문 근거가 붙은 확정 사실·확인 질문·내 다음 행동 세 칸이 나오는 웹 화면",
      },
      {
        id: "twist-mask-before-upload",
        kind: "add",
        value: "분석 전에 이름·연락처·프로필 사진 가리기 확인 한 번 더하기",
        detail:
          "캡처 분석은 유지하고 사용자가 전송 전에 민감한 영역을 직접 확인합니다.",
        resultTitle: "개인정보를 가린 업무 메시지 정리",
        platform: "web",
        smallestBuild:
          "캡처에서 이름·연락처·얼굴 후보를 기기 안에서 가린 뒤 확인된 이미지로 세 칸 결과를 만드는 웹 화면",
      },
      {
        id: "twist-request-checklist",
        kind: "remove",
        value:
          "말투 추천과 관계 전략을 빼고 상대가 요구한 항목의 완료·확인 필요 목록만 남기기",
        detail:
          "긴 대화에서 답할 내용을 찾는 흐름은 유지하고 범용 문장 작성보다 누락 방지에 집중합니다.",
        resultTitle: "답할 항목이 빠지지 않는 요청 체크표",
        platform: "web",
        smallestBuild:
          "메시지 캡처 한 장을 올리면 요청 항목 최대 다섯 개·기한·내 답변 필요 여부·원문 위치가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "video-dubbing-localizer",
    source: {
      id: "source-video-dubbing",
      sourceName: "VoiceCheap",
      research: {
        key: "trustmrr:voicecheap",
        url: "https://trustmrr.com/startup/voicecheap",
      },
      platform: "web",
      value:
        "영상 하나를 올리면 말을 다른 언어로 번역·더빙해 새 영상으로 내보내는 웹 서비스",
      detail:
        "사용 권한이 있는 영상의 말을 번역하고 새 음성을 입혀 자막과 함께 내보냅니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 영상 번역·더빙 제품",
      preservedFlow: "영상과 언어 선택 → 말 번역·더빙 → 새 언어 영상 내보내기",
    },
    payers: [
      {
        id: "payer-voicecheap-youtube",
        value: "해외 시청자를 위해 매주 영상을 현지화하는 교육 채널 운영자",
        detail:
          "새 영상을 올릴 때마다 번역가와 성우에게 파일을 따로 보내고 완성본의 시간축을 다시 맞춥니다.",
      },
      {
        id: "payer-voicecheap-saas",
        value: "제품 소개 영상을 자주 만드는 SaaS 마케터",
        detail:
          "기능 업데이트 영상마다 자막을 복사해 언어별 편집 프로젝트를 다시 만듭니다.",
      },
      {
        id: "payer-voicecheap-course",
        value: "다국어 강의를 운영하는 온라인 교육 콘텐츠 제작자",
        detail:
          "강의 모듈을 바꿀 때마다 각 언어의 음성과 자막을 손으로 다시 맞춥니다.",
      },
    ],
    moments: [
      {
        id: "moment-voicecheap-release",
        value: "해외 동시 공개를 앞둔 오후",
        detail: "새 영상을 세 언어로 같은 날 공개하고 싶은 순간",
      },
      {
        id: "moment-voicecheap-course-update",
        value: "강의 한 편을 수정한 직후",
        detail: "수정한 강의의 세 언어 음성과 자막을 다시 맞춰야 하는 순간",
      },
      {
        id: "moment-voicecheap-term-check",
        value: "번역본을 발행하기 직전",
        detail: "브랜드명과 제품명의 번역을 발행 전에 확인하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-thirty-second-only",
        kind: "remove",
        value:
          "전체 영상과 다국어 내보내기를 빼고 선택한 30초 한 언어 미리보기만 남기기",
        detail:
          "영상의 말을 번역·더빙하는 흐름은 유지하고 첫 확인 범위를 30초 한 언어로 줄입니다.",
        resultTitle: "30초 한 언어 더빙 미리보기",
        platform: "web",
        smallestBuild:
          "영상 파일 하나를 올린 뒤 30초 구간과 언어 하나를 선택하면 자막과 중립 음성 미리보기가 나오는 웹 화면",
      },
      {
        id: "twist-neutral-voice-only",
        kind: "remove",
        value: "화자 음성 복제와 감정 연기를 빼고 중립 음성 하나만 사용하기",
        detail:
          "번역·자막·더빙은 유지하고 동의와 품질 위험이 큰 음성 모사를 제거합니다.",
        resultTitle: "중립 음성 30초 영상 번역",
        platform: "web",
        smallestBuild:
          "영상 30초와 언어 하나를 넣으면 원문 자막·번역 자막·중립 음성을 번갈아 확인하는 웹 화면",
      },
      {
        id: "twist-three-term-check",
        kind: "add",
        value:
          "30초 더빙 전에 브랜드명·인명·제품명 세 개의 표기와 발음 확인 더하기",
        detail:
          "짧은 번역 더빙은 유지하고 다시 렌더링하게 만드는 고유명사 오류만 먼저 막습니다.",
        resultTitle: "고유명사 3개 확인한 30초 더빙",
        platform: "web",
        smallestBuild:
          "영상 30초와 언어를 고른 뒤 추출된 고유명사 최대 세 개를 고치면 중립 음성 미리보기가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "bulk-shop-listing",
    source: {
      id: "source-bulk-shop-listing",
      sourceName: "Catalister",
      research: {
        key: "trustmrr:catalister",
        url: "https://trustmrr.com/startup/catalister",
      },
      platform: "web",
      value:
        "상품 표 한 장을 올리면 쇼핑몰 상품 페이지를 여러 개 만들어 등록하는 웹 서비스",
      detail:
        "상품명·가격·옵션·사진이 담긴 자료를 읽어 Shopify 상품 페이지를 한꺼번에 만듭니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 쇼핑몰 대량 상품 등록 제품",
      preservedFlow:
        "상품 자료 올리기 → 상품 페이지 여러 개 생성 → 쇼핑몰에 일괄 등록",
    },
    payers: [
      {
        id: "payer-smartstore-brand",
        value: "네이버 스마트스토어에 신상품을 매주 올리는 소형 브랜드 운영자",
        detail:
          "공급사 엑셀의 상품명·가격·옵션·이미지를 스마트스토어 양식에 반복해서 옮깁니다.",
      },
      {
        id: "payer-smartstore-wholesale",
        value: "여러 공급사 상품을 대신 등록하는 온라인 도매몰 담당자",
        detail:
          "서로 다른 열 이름과 옵션 표기를 하나의 대량등록 양식으로 매번 다시 맞춥니다.",
      },
      {
        id: "payer-smartstore-agency",
        value: "스마트스토어 이전·대량등록을 맡는 소형 이커머스 대행사",
        detail:
          "고객 자료에서 누락된 필드를 찾아 요청하고 등록 파일을 다시 만드는 일을 반복합니다.",
      },
    ],
    moments: [
      {
        id: "moment-smartstore-sheet-arrived",
        value: "공급사 신상품 엑셀이 도착한 금요일 오후",
        detail:
          "등록을 시작하기 전에 어떤 열이 스마트스토어 필수 항목과 맞지 않는지 알아야 하는 순간",
      },
      {
        id: "moment-smartstore-upload-error",
        value: "대량등록 파일이 오류로 반려된 직후",
        detail:
          "수백 행을 다시 열지 않고 누락·형식 오류가 난 상품만 고쳐야 하는 순간",
      },
      {
        id: "moment-smartstore-sale-tomorrow",
        value: "내일 기획전을 앞두고 상품 20개를 추가해야 하는 밤",
        detail:
          "자동 발행보다 필수 정보가 채워진 업로드 초안을 오늘 받아야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-smartstore-column-map",
        kind: "replace",
        value:
          "Shopify 직접 등록을 네이버 스마트스토어 필수 열 매핑으로 바꾸기",
        detail:
          "상품 표에서 여러 상품 페이지를 만드는 흐름은 유지하고 국내 업로드 양식 초안을 결과로 만듭니다.",
        resultTitle: "공급사 엑셀을 스마트스토어 등록표로",
        platform: "web",
        smallestBuild:
          "공급사 XLSX·CSV 한 파일을 올리면 상품명·판매가·재고·옵션·대표이미지 열 매핑과 스마트스토어 업로드 초안 XLSX가 나오는 웹 화면",
      },
      {
        id: "twist-smartstore-missing-only",
        kind: "add",
        value:
          "파일을 만들기 전에 등록을 막는 누락·형식 오류 행만 모아 보여주기",
        detail:
          "대량 상품 생성은 유지하고 사용자가 고칠 상품과 이유를 먼저 확인합니다.",
        resultTitle: "등록을 막는 상품만 찾은 스마트스토어 표",
        platform: "web",
        smallestBuild:
          "상품 파일을 올리면 필수값 누락·숫자 형식·옵션 불일치 행과 원본 셀 위치를 보여주고 수정 후 XLSX를 받는 웹 화면",
      },
      {
        id: "twist-smartstore-twenty-review",
        kind: "replace",
        value:
          "즉시 일괄 발행을 상품 20개 미리보기와 승인된 업로드 파일로 바꾸기",
        detail:
          "여러 상품을 한꺼번에 준비하는 흐름은 유지하고 계정 권한과 자동 발행을 제거합니다.",
        resultTitle: "20개씩 검수하는 스마트스토어 등록 초안",
        platform: "web",
        smallestBuild:
          "매핑된 상품을 20개씩 제목·가격·옵션·이미지로 검수해 승인된 행만 스마트스토어 양식 XLSX로 받는 웹 화면",
      },
    ],
  },
  {
    id: "social-comment-guard",
    source: {
      id: "source-social-comment-guard",
      sourceName: "FeedGuardians",
      research: {
        key: "trustmrr:feedguardians",
        url: "https://trustmrr.com/startup/feedguardians",
      },
      platform: "web",
      value:
        "여러 소셜 계정의 댓글을 한곳에 모아 스팸·유해 표현을 걸러내는 웹 서비스",
      detail:
        "여러 소셜 채널의 댓글을 모아 검토가 필요한 항목을 나눠 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 소셜 댓글 검수 제품",
      preservedFlow:
        "여러 채널 댓글 수집 → 스팸·유해 댓글 분류 → 검토할 댓글 목록 표시",
    },
    payers: [
      {
        id: "payer-feedguardians-brand",
        value: "여러 소셜 채널을 관리하는 D2C 브랜드 커뮤니티 매니저",
        detail:
          "게시물이 올라올 때마다 채널 여섯 곳을 열어 광고 댓글과 욕설을 직접 지웁니다.",
      },
      {
        id: "payer-feedguardians-game",
        value: "업데이트마다 댓글이 몰리는 인디 게임 커뮤니티 운영자",
        detail:
          "패치 공지 뒤 여러 채널을 돌며 버그 제보와 공격적인 댓글을 손으로 구분합니다.",
      },
      {
        id: "payer-feedguardians-creator",
        value: "숏폼과 유튜브를 함께 운영하는 크리에이터 팀 보조자",
        detail:
          "영상이 뜰 때마다 수백 개 댓글을 내려보며 실제 질문과 반복 스팸을 따로 적습니다.",
      },
    ],
    moments: [
      {
        id: "moment-feedguardians-viral",
        value: "숏폼 영상 하나에 댓글 500개가 붙은 밤",
        detail: "반복 스팸을 넘기고 실제 질문부터 골라 답하고 싶은 순간",
      },
      {
        id: "moment-feedguardians-criticism",
        value: "제품 문제를 지적하는 댓글이 몰린 직후",
        detail: "욕설은 숨기되 정상적인 비판과 버그 제보는 남겨야 하는 순간",
      },
      {
        id: "moment-feedguardians-weekend",
        value: "담당자가 없는 주말에 댓글이 쌓인 월요일",
        detail: "여러 채널의 스팸·유해 댓글을 한꺼번에 정리해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-comment-export-reasons",
        kind: "replace",
        value:
          "여러 계정 자동 수집을 사용자가 내보낸 댓글 CSV·복사 텍스트 한 파일로 바꾸기",
        detail:
          "댓글을 분류해 검토 목록을 만드는 흐름은 유지하고 플랫폼 계정 권한을 제거합니다.",
        resultTitle: "댓글 파일에서 찾은 스팸·질문·비판 검수표",
        platform: "web",
        smallestBuild:
          "댓글 CSV 또는 한 줄 한 댓글 TXT를 올리면 반복 스팸·유해 표현·실제 질문·정상 비판과 분류 이유가 표로 나오는 웹 화면",
      },
      {
        id: "twist-questions-first",
        kind: "add",
        value:
          "숨김 후보 외에 답변을 기다리는 실제 질문 최대 열 개를 위에 모으기",
        detail:
          "댓글 분류는 유지하고 삭제보다 고객 응답이 먼저 필요한 항목을 결과에 더합니다.",
        resultTitle: "답할 질문부터 찾는 댓글 검수함",
        platform: "web",
        smallestBuild:
          "댓글 파일을 올리면 답변이 필요한 질문 최대 열 개·스팸 후보·정상 비판이 이유와 원문 행 번호로 나오는 웹 화면",
      },
      {
        id: "twist-comment-twenty-cards",
        kind: "remove",
        value:
          "자동 숨김과 전체 대시보드를 빼고 위험도가 높은 댓글 20장 검토만 남기기",
        detail:
          "유해·스팸 댓글을 골라내는 흐름은 유지하고 최종 조치는 사용자가 원래 플랫폼에서 합니다.",
        resultTitle: "이유를 보고 고르는 댓글 20장",
        platform: "web",
        smallestBuild:
          "댓글 파일에서 위험도가 높은 20개를 한 장씩 보여주고 유지·플랫폼에서 확인·오분류를 기록하는 웹 화면",
      },
    ],
  },
  {
    id: "meal-habit-loop",
    source: {
      id: "source-meal-habit-loop",
      sourceName: "nutrIA",
      research: {
        key: "trustmrr:nutria",
        url: "https://trustmrr.com/startup/nutria",
      },
      platform: "app",
      value:
        "식사 사진과 하루 습관을 기록하면 작은 행동 하나를 제안하고 매일 실천을 확인하는 앱",
      detail:
        "음식 사진과 기록한 습관을 바탕으로 오늘 해볼 식사 행동과 짧은 챌린지를 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 식사 습관 기록 제품",
      preservedFlow:
        "식사 사진·습관 기록 → 오늘의 작은 행동 제안 → 챌린지 완료 확인",
    },
    payers: [
      {
        id: "payer-nutria-shift-worker",
        value: "근무 시간이 매주 달라지는 교대 근무 간호사",
        detail:
          "근무표가 바뀔 때마다 식사 시간을 메모하지만 며칠 뒤 기록을 다시 놓칩니다.",
      },
      {
        id: "payer-nutria-solo-worker",
        value: "배달과 외식이 잦은 1인 가구 직장인",
        detail:
          "식사 앱을 새로 받을 때마다 사진을 며칠 올린 뒤 복잡한 기록을 포기합니다.",
      },
      {
        id: "payer-nutria-sales",
        value: "출장 일정이 자주 바뀌는 현장 영업사원",
        detail:
          "이동 중 먹은 식사를 메모장과 사진첩에 따로 남겨 일주일 뒤에는 패턴을 찾지 못합니다.",
      },
    ],
    moments: [
      {
        id: "moment-nutria-new-shift",
        value: "새 근무표로 첫 주를 시작하는 날",
        detail: "바뀐 일정에서도 정해둔 식사 행동 하나를 지키고 싶은 순간",
      },
      {
        id: "moment-nutria-restart",
        value: "식사 기록을 사흘 놓친 저녁",
        detail: "완벽한 기록 대신 오늘 한 번만 다시 체크하고 싶은 순간",
      },
      {
        id: "moment-nutria-weekly-review",
        value: "다음 주 장보기를 하기 전",
        detail: "이번 주에 반복된 식사 습관 하나만 확인하고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-chosen-action-only",
        kind: "replace",
        value: "식사 사진 인식과 AI 추천을 사용자가 고른 행동 한 개로 바꾸기",
        detail:
          "작은 식사 행동을 매일 확인하는 흐름은 유지하고 음식 판단과 의료 조언을 제거합니다.",
        resultTitle: "내가 고른 식사 행동 한 번 체크",
        platform: "web",
        smallestBuild:
          "물 한 컵·채소 먼저·야식 안 먹기 중 행동 하나를 고르고 오늘 완료만 누르는 모바일 웹 화면",
      },
      {
        id: "twist-today-without-streak",
        kind: "remove",
        value: "칼로리·연속일·점수를 빼고 오늘 행동과 완료 버튼만 남기기",
        detail:
          "선택한 행동을 실천하는 흐름은 유지하고 기록을 놓쳤을 때 포기하게 만드는 평가를 덜어냅니다.",
        resultTitle: "오늘만 다시 하는 식사 습관",
        platform: "web",
        smallestBuild:
          "선택한 식사 행동 한 줄과 오늘 완료·못함 두 버튼만 보여주는 모바일 웹 화면",
      },
      {
        id: "twist-seven-day-same-action",
        kind: "replace",
        value: "매일 다른 챌린지를 같은 식사 행동의 7일 체크표로 바꾸기",
        detail:
          "작은 행동 제안과 완료 확인은 유지하고 무엇을 할지 매일 다시 고르는 부담을 없앱니다.",
        resultTitle: "같은 식사 행동 7일 체크",
        platform: "web",
        smallestBuild:
          "식사 행동 하나를 고르면 오늘을 포함한 7칸에 완료 여부만 남기는 모바일 웹 화면",
      },
    ],
  },
  {
    id: "recurring-charge-finder",
    source: {
      id: "source-rocket-money",
      sourceName: "Rocket Money - Bills & Budgets",
      research: {
        key: "app_store:1130616675",
        url: "https://apps.apple.com/us/app/rocket-money-bills-budgets/id1130616675",
      },
      platform: "app",
      value:
        "여러 금융 계좌를 연결해 반복 구독·지출·예산을 추적하고 잊은 구독을 찾는 개인 금융 앱",
      detail:
        "거래 내역에서 반복 청구와 지출 변화를 찾아 사용자가 구독을 정리하거나 다음 달 지출을 계획하게 합니다.",
      evidence:
        "App Store 수집본 평점 4.48, 리뷰 366,768개, 실험 표본 내 시장 신호 상위 1.3%",
      preservedFlow:
        "거래 내역 읽기 → 반복 청구·변화 탐지 → 줄일 지출과 다음 청구 확인",
    },
    payers: [
      {
        id: "payer-many-subscriptions",
        value: "영상·업무·AI 구독을 여러 개 결제하는 1인 직장인",
        detail:
          "카드 앱에서 상호가 다르게 찍힌 월 결제를 하나씩 기억해 구독 목록과 맞춥니다.",
      },
      {
        id: "payer-family-card-manager",
        value: "가족 카드와 생활비를 한 달에 한 번 정리하는 맞벌이 가구 관리자",
        detail:
          "자동이체와 가족 구독이 섞여 어느 결제가 반복되고 금액이 올랐는지 표로 다시 만듭니다.",
      },
      {
        id: "payer-freelancer-expenses",
        value: "업무용 SaaS 비용을 직접 정산하는 프리랜서",
        detail:
          "프로젝트가 끝난 뒤에도 남은 도구 결제를 카드 명세서에서 뒤늦게 발견합니다.",
      },
    ],
    moments: [
      {
        id: "moment-card-bill-spike",
        value: "이번 달 카드값이 예상보다 커진 명세서를 받은 직후",
        detail:
          "일회성 지출보다 계속 빠져나가는 결제와 인상된 항목을 먼저 찾아야 하는 순간",
      },
      {
        id: "moment-before-subscription-cleanup",
        value: "사용하지 않는 구독을 정리하려는 월말 저녁",
        detail:
          "기억에 의존하지 않고 최근 거래에서 실제로 반복된 상호와 금액을 보고 싶은 순간",
      },
      {
        id: "moment-project-ended",
        value: "고객 프로젝트가 끝나 업무 도구를 정리하는 날",
        detail:
          "다음 달에도 청구될 도구와 최근 오른 요금을 한 번에 확인해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-statement-file-only",
        kind: "remove",
        value:
          "은행 계좌 연결·예산·신용점수를 빼고 사용자가 받은 카드 거래 파일 한 개만 분석하기",
        detail:
          "거래에서 반복 청구를 찾는 흐름은 유지하고 금융 계정 권한과 자동 해지를 제거합니다.",
        resultTitle: "카드 거래 파일에서 찾은 반복 결제",
        platform: "web",
        smallestBuild:
          "최근 3개월 카드 CSV·XLSX 한 파일을 올리면 같은 상호·비슷한 주기의 반복 결제와 마지막 금액이 나오는 로컬 처리 웹 화면",
      },
      {
        id: "twist-price-increase",
        kind: "add",
        value: "반복 결제 중 지난번보다 금액이 오른 항목과 차액 표시 더하기",
        detail:
          "구독 추적은 유지하고 사용자가 놓치기 쉬운 가격 인상을 실제 거래 근거로 보여줍니다.",
        resultTitle: "금액이 오른 반복 결제 찾기",
        platform: "web",
        smallestBuild:
          "카드 거래 파일에서 같은 상호의 이전·최근 금액을 비교해 인상액·인상률·거래일을 보여주는 웹 화면",
      },
      {
        id: "twist-next-month-list",
        kind: "replace",
        value:
          "자동 해지와 예산 조언을 다음 달 다시 나갈 가능성이 높은 결제 목록으로 바꾸기",
        detail:
          "반복 지출을 줄일 행동으로 연결하는 흐름은 유지하고 금융기관·가맹점의 새 행동을 요구하지 않습니다.",
        resultTitle: "다음 달 다시 나갈 결제와 합계",
        platform: "web",
        smallestBuild:
          "최근 거래 파일을 올리면 두 번 이상 반복된 상호·예상 다음 날짜·최근 금액·예상 합계와 사용자가 직접 확인할 체크박스가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "document-deadline-card",
    source: {
      id: "source-due-date-radar",
      sourceName: "Due Date Radar",
      research: {
        key: "trustmrr:due-date-radar",
        url: "https://trustmrr.com/startup/due-date-radar",
      },
      platform: "web",
      value:
        "면허·계약·보험 등 문서의 갱신·만료 날짜를 자동으로 찾아 추적하는 기한 관리 서비스",
      detail:
        "문서에서 중요한 날짜와 종류를 읽어 다음 기한과 갱신 준비 시점을 보여줍니다.",
      evidence:
        "TrustMRR 원본에서 면허·계약·보험 문서의 기한 자동 추적 메커니즘 확인",
      preservedFlow:
        "기한이 있는 문서 입력 → 날짜·의미 추출 → 다음 행동과 알림용 일정 확인",
    },
    payers: [
      {
        id: "payer-small-academy-docs",
        value: "강사 계약·보험·사업 서류를 혼자 챙기는 소형 학원 운영자",
        detail:
          "파일명과 달력 메모가 달라 갱신 통지를 받은 뒤 문서 원문을 다시 찾습니다.",
      },
      {
        id: "payer-restaurant-permits",
        value: "위생교육·보험·임대 계약 기한을 관리하는 1인 식당 사장",
        detail:
          "기관마다 다른 날짜를 휴대폰 알림에 직접 적고 어떤 문서 근거인지 잊습니다.",
      },
      {
        id: "payer-freelancer-contracts",
        value: "여러 고객의 계약 종료·자동갱신일을 직접 관리하는 프리랜서",
        detail: "계약 PDF 속 통지 기한과 종료일이 달라 재협상 시점을 놓칩니다.",
      },
    ],
    moments: [
      {
        id: "moment-new-deadline-document",
        value: "새 계약·보험·면허 PDF를 받은 직후",
        detail:
          "파일을 닫기 전에 가장 가까운 날짜와 해야 할 일을 남겨야 하는 순간",
      },
      {
        id: "moment-renewal-notice-arrives",
        value: "갱신 안내 메일을 받았지만 원문 날짜가 헷갈리는 순간",
        detail:
          "만료일·통지일·납부일 중 실제 다음 행동 기준을 확인해야 하는 순간",
      },
      {
        id: "moment-monthly-deadline-review",
        value: "다음 달 만료 문서를 확인하는 월말",
        detail:
          "폴더 전체가 아니라 30일 안에 행동할 문서와 근거 문장만 봐야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-doc-nearest-date",
        kind: "remove",
        value:
          "문서 보관함과 대시보드를 빼고 PDF의 오늘 이후 만료·통지·납부 날짜 중 가장 가까운 하나만 남기기",
        detail:
          "문서에서 날짜를 찾아 행동으로 연결하는 흐름은 유지하고 과거·서명일·불명 날짜는 제외합니다.",
        resultTitle: "문서 한 장의 다음 행동 기한",
        platform: "web",
        smallestBuild:
          "PDF를 올리면 오늘 이후 만료·통지·납부 중 가장 가까운 날짜·근거 원문·해야 할 행동이 나오는 웹 화면",
      },
      {
        id: "twist-three-date-types",
        kind: "replace",
        value: "모든 날짜 목록을 만료·통지·납부 세 종류 구분으로 바꾸기",
        detail:
          "기한 추출은 유지하고 서로 다른 날짜를 같은 만료일로 오해하지 않게 합니다.",
        resultTitle: "만료·통지·납부를 나눈 문서 날짜",
        platform: "web",
        smallestBuild:
          "기한 문서 하나를 올리면 날짜를 만료·통지·납부로 분류하고 불명확한 항목에 확인 필요를 붙이는 웹 화면",
      },
      {
        id: "twist-countdown-dates",
        kind: "add",
        value: "확인한 기한의 30일·7일·1일 전 날짜를 한 카드에 더하기",
        detail:
          "문서 기한 확인은 유지하고 캘린더 계정 연결 없이 사용자가 행동 시점을 바로 옮겨 적게 합니다.",
        resultTitle: "30·7·1일 전이 보이는 갱신 카드",
        platform: "web",
        smallestBuild:
          "PDF에서 확인한 기한·날짜 의미·근거 원문과 30일·7일·1일 전 날짜가 한 장에 나오는 웹 화면",
      },
    ],
  },
  {
    id: "amazon-listing-images",
    source: {
      id: "source-amazon-listing-images",
      sourceName: "AlgoFuse.ai",
      research: {
        key: "trustmrr:algofuse-ai",
        url: "https://trustmrr.com/startup/algofuse-ai",
      },
      platform: "web",
      value:
        "상품 검색어를 넣으면 잘 팔리는 Amazon 경쟁 상품 이미지를 분석해 판매용 이미지 한 세트를 자동으로 만드는 도구",
      detail:
        "상품 검색어를 입력하면 상위 경쟁 상품의 이미지 구성을 살펴보고 전문적인 상품 이미지 묶음을 만들어줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 Amazon 상품 이미지 생성 제품",
      preservedFlow:
        "상품 검색어 입력 → 인기 경쟁 상품 이미지 분석 → 전문 상품 이미지 세트 생성",
    },
    payers: [
      {
        id: "payer-amazon-private-label",
        value: "매달 새 상품을 등록하는 1인 Amazon 셀러",
        detail:
          "상위 상품 페이지를 캡처한 뒤 어떤 이미지 구성을 따라야 할지 스프레드시트에 직접 정리합니다.",
      },
      {
        id: "payer-marketplace-agency",
        value:
          "여러 브랜드의 Amazon 페이지를 맡는 마켓플레이스 대행사 디자이너",
        detail:
          "키워드마다 경쟁 상품을 다시 조사하고 메인·특징·사용 장면 이미지 시안을 따로 만듭니다.",
      },
      {
        id: "payer-export-manager",
        value: "해외 판매용 상품을 등록하는 소형 제조사 수출 담당자",
        detail:
          "국내 상품 사진과 설명을 해외 마켓 규격에 맞추려고 외주 업체와 수정 요청을 반복합니다.",
      },
    ],
    moments: [
      {
        id: "moment-stock-arrived",
        value: "새 상품을 등록했는데 모바일 검색 썸네일이 흐려 보이는 날",
        detail:
          "경쟁 상품 사이에서 제품이 작게 보여도 바로 구분되는지 확인하고 싶은 순간",
      },
      {
        id: "moment-competitor-changed",
        value: "상위 경쟁 상품이 새 이미지로 순위를 올린 것을 본 아침",
        detail:
          "무작정 따라 하지 않고 내 키워드에서 빠진 이미지 역할을 찾아 고쳐야 하는 순간",
      },
      {
        id: "moment-export-deadline",
        value: "해외 판매 시작일이 내일인데 현지용 이미지가 없는 오후",
        detail:
          "기존 상품 정보를 바탕으로 마켓 규격에 맞는 이미지 세트를 만들어야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-reference-one-photo",
        kind: "remove",
        value:
          "검색어·상위 상품 전체 분석과 이미지 세트를 빼고 경쟁 URL 하나와 내 사진 하나만 쓰기",
        detail:
          "경쟁 상품 이미지를 참고해 판매 이미지를 만드는 흐름은 유지하고 입력과 결과를 각각 하나로 줄입니다.",
        resultTitle: "경쟁 URL로 만드는 메인 이미지 1장",
        platform: "web",
        smallestBuild:
          "Amazon 경쟁 상품 상세 URL 하나와 내 상품 사진 하나를 넣으면 구성 차이 세 줄과 흰 배경 메인 이미지 초안 한 장이 나오는 웹 화면",
      },
      {
        id: "twist-mobile-side-by-side",
        kind: "add",
        value:
          "완성 전에 내 초안과 경쟁 이미지를 모바일 검색 크기로 나란히 보기",
        detail:
          "경쟁 구성을 참고한 메인 이미지 생성은 유지하고 작은 썸네일에서 구분되는지 한 번 확인합니다.",
        resultTitle: "검색 썸네일로 비교한 메인 이미지",
        platform: "web",
        smallestBuild:
          "경쟁 URL과 내 사진으로 만든 메인 초안을 모바일 검색 크기의 참고 이미지 옆에서 비교하는 웹 화면",
      },
      {
        id: "twist-three-layouts-one-output",
        kind: "replace",
        value:
          "자동 이미지 세트를 참고 상품의 구도 세 줄과 메인 초안 한 장으로 바꾸기",
        detail:
          "경쟁 이미지를 분석하는 흐름은 유지하고 복제 대신 배경·크기·여백 기준만 추출해 내 사진에 적용합니다.",
        resultTitle: "구도 3줄이 붙은 상품 메인 초안",
        platform: "web",
        smallestBuild:
          "경쟁 URL 하나와 내 사진 하나를 넣으면 배경·제품 비율·여백 기준과 새 메인 초안 한 장이 나오는 웹 화면",
      },
    ],
  },
  {
    id: "mobile-teleprompter",
    source: {
      id: "source-mobile-teleprompter",
      sourceName: "Sufler - teleprompter",
      research: {
        key: "trustmrr:sufler-teleprompter",
        url: "https://trustmrr.com/startup/sufler-teleprompter",
      },
      platform: "app",
      value:
        "대본을 화면에 부드럽게 흘려 보여주고 휴대폰·워치 리모컨으로 조작하며 촬영하게 해주는 텔레프롬프터 앱",
      detail:
        "직접 쓰거나 AI로 만든 대본을 화면에 일정한 속도로 흘려 카메라를 보면서 자연스럽게 읽게 해줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 모바일 텔레프롬프터 제품",
      preservedFlow:
        "대본 입력·생성 → 읽기 속도로 부드럽게 스크롤 → 카메라를 보며 촬영",
    },
    payers: [
      {
        id: "payer-course-instructor",
        value: "매주 온라인 강의를 촬영하는 1인 강사",
        detail:
          "긴 설명을 외우지 못해 문장마다 촬영을 멈추고 대본을 다시 확인합니다.",
      },
      {
        id: "payer-realestate-agent",
        value: "매물 소개 영상을 자주 찍는 공인중개사",
        detail:
          "면적과 가격 같은 숫자를 틀리지 않으려고 카메라 밖의 종이 메모를 반복해서 봅니다.",
      },
      {
        id: "payer-internal-comms",
        value: "사내 공지 영상을 제작하는 기업 커뮤니케이션 담당자",
        detail:
          "임원의 대본을 여러 장으로 나눠 출력하고 촬영 중 넘길 타이밍을 손짓으로 알려줍니다.",
      },
    ],
    moments: [
      {
        id: "moment-third-retake",
        value: "같은 문장을 잊어 세 번째 촬영을 멈춘 순간",
        detail:
          "대본을 외우는 데 시간을 쓰지 않고 카메라를 보며 한 번에 촬영하고 싶은 순간",
      },
      {
        id: "moment-live-opening",
        value: "촬영 시작 5분 전 첫 설명 순서가 떠오르지 않는 순간",
        detail:
          "숫자와 핵심 내용을 놓치지 않고 정해진 시간에 자연스럽게 시작해야 하는 순간",
      },
      {
        id: "moment-client-update",
        value: "고객이 오늘 안에 카메라를 보며 설명한 영상을 요청한 오후",
        detail:
          "숫자와 핵심 조건을 틀리지 않으면서 준비된 사람처럼 말해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-next-line-emphasis",
        kind: "add",
        value: "다음에 읽을 핵심 단어 하나를 크게 보여주기 더하기",
        detail:
          "대본 스크롤과 촬영은 유지하고 시선을 놓쳤을 때 돌아올 기준 단어만 더합니다.",
        resultTitle: "핵심 단어 텔레프롬프터",
        platform: "app",
        smallestBuild:
          "스크롤되는 대본 위에 다음 핵심 단어 하나와 촬영 버튼만 크게 보이는 모바일 화면",
      },
      {
        id: "twist-no-remote",
        kind: "remove",
        value: "리모컨 조작을 빼고 화면 탭 일시정지만 남기기",
        detail:
          "대본을 부드럽게 보여주는 구조는 유지하면서 별도 기기를 연결해야 하는 조작만 덜어냅니다.",
        resultTitle: "탭으로 멈추는 대본",
        platform: "app",
        smallestBuild:
          "대본이 흐르다가 화면을 누르면 멈추고 다시 누르면 이어지는 모바일 촬영 화면",
      },
      {
        id: "twist-reading-calibration",
        kind: "replace",
        value: "속도 조절 막대를 20초 읽기 연습으로 바꾸기",
        detail:
          "대본을 스크롤해 촬영하는 흐름은 유지하고 읽기 속도를 정하는 방식만 직접 연습으로 바꿉니다.",
        resultTitle: "내 말속도 대본",
        platform: "app",
        smallestBuild:
          "예문을 20초 읽으면 내 속도로 대본 미리보기가 흐르는 모바일 화면",
      },
    ],
  },
  {
    id: "site-photo-closeout",
    source: {
      id: "source-site-audit-pro",
      sourceName: "Site Audit Pro",
      research: {
        key: "app_store:430234732",
        url: "https://apps.apple.com/au/app/site-audit-pro/id430234732",
      },
      platform: "app",
      value:
        "현장에서 발견한 문제를 사진·담당자·설명으로 기록하고 전문 보고서로 공유하는 점검 앱",
      detail:
        "프로젝트별 이슈와 사진을 모으고 사진에 표시를 더해 PDF·CSV 점검 보고서로 내보냅니다.",
      evidence:
        "미국 App Store 4.8점·평가 1.1만개·유료 $12.90; 통합 장부의 영국 유료 생산성 1위 기록; 공식 설명에서 이슈·사진 주석·PDF 보고서 흐름 확인",
      preservedFlow:
        "현장과 작업 설정 → 이슈별 사진·설명 기록 → 상대가 확인할 수 있는 보고서 공유",
    },
    payers: [
      {
        id: "payer-small-interior-contractor",
        value: "한 달에 2~5곳을 마감하는 소형 인테리어 시공자",
        detail:
          "준공 사진은 휴대폰에 있지만 고객에게 보낼 때 공정·위치·수정 내용을 다시 설명합니다.",
      },
      {
        id: "payer-store-maintenance-manager",
        value: "여러 매장의 소규모 수리를 맡는 시설관리 담당자",
        detail:
          "수리 전후 사진과 업체 메모가 카톡방마다 흩어져 월말 완료 증거를 다시 모읍니다.",
      },
      {
        id: "payer-equipment-installer",
        value: "간판·에어컨·가구 설치를 직접 인계하는 1인 기사",
        detail:
          "작업이 끝나면 설치 위치와 마감 상태를 사진으로 보내지만 어떤 부분을 보라는지 전화로 다시 설명합니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-completion-walkthrough",
        value: "수리·설치 완료 점검을 끝내고 현장 사진이 쌓인 직후",
        detail:
          "현장을 떠나기 전에 무엇을 고쳤는지 고객이 알아볼 한 장으로 묶어야 하는 순간",
      },
      {
        id: "moment-client-asks-proof",
        value: "고객이 완료된 부분의 사진 증거를 다시 요청한 순간",
        detail:
          "카메라 롤을 뒤지거나 긴 설명을 쓰지 않고 해당 위치의 전후 차이를 보내야 하는 순간",
      },
      {
        id: "moment-before-final-payment",
        value: "잔금·월 정산을 청구하기 한 시간 전",
        detail:
          "끝난 작업과 남은 문제를 사진 근거로 분리해 청구 지연을 막아야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-issues-only",
        kind: "remove",
        value:
          "프로젝트 관리와 긴 점검표를 빼고 중요한 완료 항목 세 개만 남기기",
        detail:
          "사진과 설명을 보고서로 공유하는 흐름은 유지하고 오늘 인계할 핵심 작업만 세 개로 제한합니다.",
        resultTitle: "사진 3장 공사 완료서",
        platform: "web",
        smallestBuild:
          "현장명과 사진 세 장, 각 사진 설명 한 줄을 넣으면 작업·위치·완료 상태가 붙은 1쪽 PDF가 나오는 모바일 웹 화면",
      },
      {
        id: "twist-before-after-pair",
        kind: "replace",
        value: "이슈 목록을 같은 위치의 수리 전·후 사진 한 쌍으로 바꾸기",
        detail:
          "현장 사진으로 결과를 증명하는 흐름은 유지하고 받는 사람이 비교할 결과를 전후 한 쌍으로 바꿉니다.",
        resultTitle: "수리 전후 한 장 보고서",
        platform: "web",
        smallestBuild:
          "전 사진과 후 사진을 한 장씩 올리고 위치·작업 한 줄을 쓰면 나란히 비교되는 공유 링크와 PDF가 나오는 모바일 웹 화면",
      },
      {
        id: "twist-one-markup",
        kind: "add",
        value: "사진마다 봐야 할 곳을 가리키는 원·화살표 하나 더하기",
        detail:
          "사진 보고서 흐름은 유지하고 고객이 문제나 완료 부분을 바로 찾도록 표시 하나만 더합니다.",
        resultTitle: "표시가 붙은 현장 사진 PDF",
        platform: "web",
        smallestBuild:
          "사진 한 장에서 원 또는 화살표 한 개를 놓고 설명을 쓰면 표시·위치·작성시각이 붙은 PDF 한 쪽이 나오는 모바일 웹 화면",
      },
    ],
  },
  {
    id: "pizza-dough-timing",
    source: {
      id: "source-doughdojo",
      sourceName: "DoughDojo",
      research: {
        key: "trustmrr:doughdojo",
        url: "https://trustmrr.com/startup/doughdojo",
      },
      platform: "web",
      value:
        "나폴리 피자 도우의 배합·발효·굽기를 계산하고 기록하도록 돕는 전문 도구",
      detail:
        "밀가루·수분·온도·시간·도우 개수를 바탕으로 배합과 다음 발효 행동을 정합니다.",
      evidence: "TrustMRR 원본에서 나폴리 피자 도우 계산·팁·기록 메커니즘 확인",
      preservedFlow:
        "도우 양·온도·제공 시각 입력 → 배합·발효 시간 계산 → 다음 작업과 배치 결과 확인",
    },
    payers: [
      {
        id: "payer-small-pizza-shop",
        value: "하루 도우를 직접 반죽하는 소형 피자 가게 운영자",
        detail:
          "실내 온도와 판매량이 달라질 때 효모와 발효 시간을 경험으로 다시 맞춥니다.",
      },
      {
        id: "payer-pizza-popup",
        value: "주말 팝업에서 한정 수량 피자를 파는 1인 요리사",
        detail:
          "제공 시간에 맞춰 전날 반죽을 시작해야 하지만 도우 개수와 온도가 매번 달라집니다.",
      },
      {
        id: "payer-pizza-class",
        value: "홈베이킹 수업용 도우를 여러 명 분량 준비하는 강사",
        detail:
          "참가 인원에 따라 재료와 분할 무게를 계산하고 수업 시작 전에 발효를 맞춥니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-dough-mix",
        value: "내일 제공할 피자 도우를 반죽하기 직전",
        detail:
          "현재 실내 온도와 목표 시각에 맞는 효모 양과 발효 순서를 정해야 하는 순간",
      },
      {
        id: "moment-room-temperature-changed",
        value: "예상보다 주방 온도가 5도 높아진 오후",
        detail:
          "이미 정한 제공 시각은 유지하면서 다음 발효 시간을 다시 계산해야 하는 순간",
      },
      {
        id: "moment-headcount-changed",
        value: "팝업·수업 인원이 늘어 도우 개수를 바꿔야 하는 밤",
        detail:
          "수분율과 도우 한 개 무게는 유지하고 총 재료와 분할 수를 다시 맞춰야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-batch-plan",
        kind: "remove",
        value:
          "레시피 보관함과 긴 기록을 빼고 다음 한 배치의 배합·발효 계획만 남기기",
        detail:
          "도우 조건으로 발효를 계산하는 흐름은 유지하고 오늘 만들 배치 하나로 줄입니다.",
        resultTitle: "다음 피자 도우 한 배치 계획",
        platform: "web",
        smallestBuild:
          "도우 개수·실내 온도·제공 시각을 먼저 넣고 기본값(250g, 수분 65%, 인스턴트 드라이이스트, 냉장 발효)을 확인하면 재료와 공정 시각이 나오는 웹 화면",
      },
      {
        id: "twist-next-action-only",
        kind: "replace",
        value:
          "전체 발효 그래프를 지금부터 다음에 할 행동과 시각 한 줄로 바꾸기",
        detail:
          "배합·발효 계산은 유지하고 바쁜 주방에서 바로 실행할 결과를 먼저 보여줍니다.",
        resultTitle: "지금 다음 도우 행동 한 줄",
        platform: "web",
        smallestBuild:
          "현재 온도·도우 상태·제공 시각을 넣으면 다음 행동·시각과 늦음/빠름 이유 한 줄이 나오는 모바일 웹 화면",
      },
      {
        id: "twist-rescale-balls",
        kind: "add",
        value: "수분율과 한 개 무게를 유지한 채 도우 개수만 다시 계산하기",
        detail:
          "검증한 배합은 유지하고 예약·참가 인원 변경에 필요한 총 재료만 안전하게 늘립니다.",
        resultTitle: "도우 개수만 바꾸는 재료표",
        platform: "web",
        smallestBuild:
          "기존 배합의 밀가루·물·소금·효모와 도우 개수를 넣고 새 개수를 고르면 환산 재료와 분할 무게가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "cohort-first-result",
    source: {
      id: "source-yeira-lms",
      sourceName: "Yeira LMS",
      research: {
        key: "trustmrr:yeira-lms",
        url: "https://trustmrr.com/startup/yeira-lms",
      },
      platform: "web",
      value:
        "교육 운영자가 강의 진행과 성적을 한곳에서 추적하는 교육용 LMS 대시보드",
      detail:
        "교육 과정과 참여자를 등록하고 사람별 진행·성적 상태를 모아 운영자가 다음 조치를 고르게 합니다.",
      evidence:
        "TrustMRR 최근 30일 $1.8k·성장 62%; 교육 사업자·HR팀용 코스 생성·전달·진도/성적 추적 흐름 확인; B09-01 재감사 UX 3/3",
      preservedFlow:
        "교육 참여자와 기준 설정 → 사람별 진행 상태 수집 → 운영자가 다음 조치 대상을 확인",
    },
    payers: [
      {
        id: "payer-cohort-instructor",
        value: "매달 20~100명 유료 코호트를 혼자 운영하는 강사",
        detail:
          "카톡·노션·Zoom을 섞어 운영하며 누가 첫 결과물을 못 냈는지 명단과 제출 폼을 매번 대조합니다.",
      },
      {
        id: "payer-paid-challenge",
        value: "4주 유료 챌린지를 반복해서 여는 1인 운영자",
        detail:
          "참가자의 인증 글은 많지만 돈을 낸 사람이 첫 결과까지 갔는지는 스프레드시트로 다시 셉니다.",
      },
      {
        id: "payer-portfolio-coach",
        value: "결과물 중심 부트캠프를 운영하는 소형 코치",
        detail:
          "영상 진도율보다 이력서·디자인·코드 같은 첫 산출물이 없는 수강생을 먼저 찾아야 합니다.",
      },
    ],
    moments: [
      {
        id: "moment-day-three-empty",
        value: "결제 후 3일째인데 첫 제출이 한 건도 없는 저녁",
        detail: "관심이 식기 전에 막힌 사람에게 먼저 연락해야 하는 순간",
      },
      {
        id: "moment-day-seven-risk",
        value: "결제 후 7일째 환불·이탈 위험자를 확인하는 아침",
        detail:
          "전체 진도표가 아니라 실제 결과물 0개인 사람만 바로 골라야 하는 순간",
      },
      {
        id: "moment-before-feedback",
        value: "이번 주 피드백 시간을 배정하기 직전",
        detail:
          "이미 잘하는 사람보다 아직 첫 결과도 못 낸 사람에게 시간을 먼저 써야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-first-output-not-progress",
        kind: "replace",
        value: "영상 진도율을 첫 결과물 제출 여부로 바꾸기",
        detail:
          "사람별 상태를 모으는 흐름은 유지하고 성공 기준만 시청률에서 실제 산출물로 바꿉니다.",
        resultTitle: "첫 제출 없는 수강생 찾기",
        platform: "web",
        smallestBuild:
          "결제자 이메일 명단과 이 도구가 만든 제출 링크를 연결해 D+7 제출 기록 없는 이름만 보여주는 웹 화면",
      },
      {
        id: "twist-zero-list-only",
        kind: "remove",
        value: "전체 분석을 빼고 오늘 연락할 결과물 0명만 남기기",
        detail:
          "상태 수집은 유지하고 운영자가 보는 결과를 먼저 연락할 사람 목록 하나로 줄입니다.",
        resultTitle: "오늘 먼저 연락할 수강생",
        platform: "web",
        smallestBuild:
          "이름·결제일·제출 여부 CSV를 넣으면 오늘 연락할 사람과 이유 한 줄만 뜨는 웹 화면",
      },
      {
        id: "twist-one-submit-link",
        kind: "add",
        value: "사진·파일·URL 중 하나를 받는 제출 링크 한 개 더하기",
        detail:
          "진행 상태를 보는 흐름에 강의 종류와 상관없이 첫 결과를 받는 공통 입력만 더합니다.",
        resultTitle: "첫 결과 제출 링크",
        platform: "web",
        smallestBuild:
          "수강생이 이메일과 사진·파일·URL 중 하나를 내면 같은 이메일의 명단 상태가 제출 완료로 바뀌는 공유 링크",
      },
    ],
  },
  {
    id: "three-table-seating",
    source: {
      id: "source-seating-hero",
      sourceName: "Seating Hero",
      research: {
        key: "trustmrr:seating-hero",
        url: "https://trustmrr.com/startup/seating-hero",
      },
      platform: "web",
      value:
        "행사 참석자와 테이블 수를 넣으면 조건에 맞는 자리 배치를 만드는 좌석 계획 서비스",
      detail:
        "결혼식·리셉션·조직 행사에서 함께 앉을 사람과 피할 사람을 반영해 좌석표를 만듭니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $1.3k·성장 4%, 행사 좌석 계획 메커니즘 확인",
      preservedFlow:
        "참석자와 좌석 조건 입력 → 충돌 없는 배치 계산 → 테이블별 좌석표 확인",
    },
    payers: [
      {
        id: "payer-small-wedding-planner",
        value: "한 달에 소규모 결혼식을 여러 건 맡는 1인 웨딩 플래너",
        detail:
          "최종 참석자와 가족 관계를 메신저로 받은 뒤 엑셀에서 테이블을 여러 번 다시 나눕니다.",
      },
      {
        id: "payer-paid-workshop-host",
        value: "20~40명 유료 워크숍을 반복해서 여는 운영자",
        detail:
          "팀·직무·처음 온 사람을 섞어야 하지만 참가자 이름표를 보며 자리를 손으로 바꿉니다.",
      },
      {
        id: "payer-private-event-manager",
        value: "단체 예약 좌석을 자주 배치하는 소형 식당 매니저",
        detail:
          "어린이 의자·휠체어·가족 단위를 반영해 예약 명단을 테이블별로 다시 적습니다.",
      },
    ],
    moments: [
      {
        id: "moment-guest-list-final",
        value: "행사 이틀 전 최종 참석자 명단이 확정된 밤",
        detail:
          "연락을 돌리기 전에 누가 어느 테이블인지 한 번에 끝내야 하는 순간",
      },
      {
        id: "moment-last-minute-cancel",
        value: "행사 당일 한 팀이 취소해 빈자리가 생긴 순간",
        detail:
          "전체 좌석을 무너뜨리지 않고 빈자리와 인접 사람만 다시 배치해야 하는 순간",
      },
      {
        id: "moment-seating-conflict",
        value: "같이 앉히면 안 되는 두 사람을 뒤늦게 들은 순간",
        detail: "다른 조건은 유지하면서 충돌 한 곳만 빠르게 풀어야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-tables-only",
        kind: "remove",
        value: "복잡한 도면 편집을 빼고 12명·3테이블 배치만 남기기",
        detail:
          "참석자를 좌석에 배치하는 흐름은 유지하고 첫 결과를 작은 행사 한 구역으로 줄입니다.",
        resultTitle: "12명 3테이블 자리표",
        platform: "web",
        smallestBuild:
          "참석자 12명과 테이블 3개를 넣으면 테이블별 이름 목록이 나오는 웹 화면",
      },
      {
        id: "twist-one-relationship-rule",
        kind: "add",
        value: "참석자마다 함께·따로 중 관계 조건 하나 더하기",
        detail: "좌석 배치는 유지하고 꼭 지켜야 할 관계 조건 한 개만 더합니다.",
        resultTitle: "관계 충돌 없는 자리표",
        platform: "web",
        smallestBuild:
          "이름 목록에 함께·따로 조건을 한 개씩 고르면 충돌 여부와 좌석표가 나오는 웹 화면",
      },
      {
        id: "twist-three-layouts",
        kind: "replace",
        value: "직접 끌어놓기를 조건을 만족하는 배치안 세 개로 바꾸기",
        detail:
          "조건을 반영해 좌석을 정하는 흐름은 유지하고 작업 방식을 수동 편집에서 선택으로 바꿉니다.",
        resultTitle: "고르는 자리 배치 3안",
        platform: "web",
        smallestBuild:
          "참석자 이름과 테이블 수, 관계 조건을 넣으면 조건 충족 이유가 붙은 배치안 세 개가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "family-notice-one-sheet",
    source: {
      id: "source-cozi-family-organizer",
      sourceName: "Cozi Family Organizer",
      research: {
        key: "app_store:407108860",
        url: "https://apps.apple.com/us/app/cozi-family-organizer/id407108860?uo=4",
      },
      platform: "app",
      value:
        "가족의 일정·할 일·준비물을 한곳에 모아 모두가 같은 목록을 보게 하는 가족 정리 앱",
      detail:
        "가족별 색으로 일정과 할 일을 구분하고 다음 주에 놓치면 안 될 일을 함께 확인하게 합니다.",
      evidence:
        "미국 App Store 4.807점·평가 392,060개, 가족 공유 일정·할 일 메커니즘 확인",
      preservedFlow:
        "가족 일정·할 일 입력 → 사람과 날짜별로 정리 → 가족이 한 목록에서 확인",
    },
    payers: [
      {
        id: "payer-multi-child-parent",
        value: "학교·학원이 다른 두 아이의 공지를 챙기는 부모",
        detail:
          "가정통신문, 학원 카톡, 알림장 사진이 섞여 준비물과 서명 마감을 다시 적습니다.",
      },
      {
        id: "payer-double-income-parent",
        value: "등하원과 준비물을 교대로 맡는 맞벌이 부모",
        detail:
          "누가 무엇을 챙길지 부부 카톡에서 다시 묻고 같은 공지 사진을 여러 번 전달합니다.",
      },
      {
        id: "payer-shared-caregiver",
        value: "부모와 조부모가 함께 아이 일정을 돌보는 가정",
        detail:
          "학교 용어와 여러 날짜가 섞인 공지를 돌봄 담당자마다 다르게 이해합니다.",
      },
    ],
    moments: [
      {
        id: "moment-sunday-notices",
        value: "일요일 밤 공지 사진 다섯 장을 한꺼번에 받은 순간",
        detail: "월요일 준비물과 이번 주 마감을 아이별로 다시 나눠야 하는 순간",
      },
      {
        id: "moment-morning-missing",
        value: "등교 20분 전 준비물 하나가 안 보이는 아침",
        detail:
          "긴 공지를 다시 읽지 않고 오늘 아이가 들고 갈 것만 확인해야 하는 순간",
      },
      {
        id: "moment-signature-deadline",
        value: "체험학습·동의서 제출 마감 전날",
        detail:
          "누가 서명하고 어느 아이 가방에 넣을지 한 번에 닫아야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-screenshot-input",
        kind: "replace",
        value: "일정 직접 입력을 공지 스크린샷 한 장씩 추가하기로 바꾸기",
        detail:
          "가족 일정을 정리하는 흐름은 유지하고 입력만 이미 받은 공지 사진으로 바꿉니다.",
        resultTitle: "공지 한 장이 이번 주 할 일로",
        platform: "web",
        smallestBuild:
          "공지 스크린샷 한 장을 올리면 아이별 준비물·서명·마감과 근거 원문 한 줄이 나오는 모바일 웹 화면",
      },
      {
        id: "twist-seven-days-only",
        kind: "remove",
        value: "월간 달력을 빼고 앞으로 7일 준비물·서명·마감만 남기기",
        detail:
          "가족 할 일을 한곳에 모으는 흐름은 유지하고 지금 행동할 필요 없는 일정을 덜어냅니다.",
        resultTitle: "이번 주 준비물 한 장",
        platform: "web",
        smallestBuild:
          "공지 텍스트를 붙이면 앞으로 7일의 준비물·서명·마감과 각각의 원문 한 줄만 보여주는 웹 화면",
      },
      {
        id: "twist-child-owner-chip",
        kind: "add",
        value: "할 일마다 아이와 챙길 사람 색표 하나 더하기",
        detail:
          "일정과 할 일은 그대로 두고 누구 것인지와 누가 챙길지만 색표로 더합니다.",
        resultTitle: "누가 챙길지 보이는 가족 공지",
        platform: "web",
        smallestBuild:
          "공지 한 장에서 뽑은 할 일 옆에 아이 이름과 담당자 색표를 고르는 모바일 웹 화면",
      },
    ],
  },
  {
    id: "game-assessment-rehearsal",
    source: {
      id: "source-game-assessment-prep",
      sourceName: "Game Assessment Prep",
      research: {
        key: "trustmrr:game-assessment-prep",
        url: "https://trustmrr.com/startup/game-assessment-prep",
      },
      platform: "web",
      value:
        "채용 게임형 평가와 비슷한 연습 문제를 직접 풀고 전략과 결과를 확인하는 준비 서비스",
      detail:
        "인지·공간·성향 게임의 규칙을 익히고 실제 평가 전에 반복 연습하게 합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $7k·성장 9%, HireVue 게임형 평가 11종 연습 메커니즘 확인",
      preservedFlow:
        "평가 유형 선택 → 비슷한 게임을 직접 연습 → 결과와 다음 전략 확인",
    },
    payers: [
      {
        id: "payer-first-game-assessment",
        value: "처음 게임형 인적성 초대를 받은 신입 지원자",
        detail:
          "규칙을 모른 채 제한 시간이 시작될까 불안해 후기와 영상을 여러 개 찾아봅니다.",
      },
      {
        id: "payer-career-game-assessment",
        value: "오랜만에 인적성을 보는 경력 이직자",
        detail:
          "직무 면접은 익숙하지만 빠른 판단 게임의 조작과 시간 배분은 낯섭니다.",
      },
      {
        id: "payer-retry-game-assessment",
        value: "지난 게임형 평가에서 탈락해 다시 지원하는 구직자",
        detail:
          "점수만 보고는 어디서 느렸는지 몰라 같은 실수를 반복할까 걱정합니다.",
      },
    ],
    moments: [
      {
        id: "moment-assessment-invite",
        value: "게임형 평가 링크와 72시간 마감을 받은 직후",
        detail:
          "무작정 시작하기 전에 조작과 판단 규칙을 한 번 경험하고 싶은 순간",
      },
      {
        id: "moment-night-before-assessment",
        value: "실전 평가 전날 밤 10분만 남은 때",
        detail:
          "여러 유형을 공부하기보다 가장 낯선 규칙 하나를 짧게 연습해야 하는 순간",
      },
      {
        id: "moment-after-slow-practice",
        value: "무료 연습에서 시간 초과가 반복된 직후",
        detail:
          "총점보다 어느 판단에서 멈췄는지 보고 다음 한 번을 고쳐야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-five-minute-game",
        kind: "remove",
        value: "11개 게임을 빼고 가장 낯선 유형 한 개의 5분 연습만 남기기",
        detail:
          "실전과 비슷한 게임 연습은 유지하고 한 번에 배울 범위만 한 유형으로 줄입니다.",
        resultTitle: "게임형 인적성 5분 리허설",
        platform: "web",
        smallestBuild:
          "규칙 설명 한 장 뒤 5분짜리 판단 게임 하나를 풀고 결과를 보는 웹 화면",
      },
      {
        id: "twist-slow-decision-replay",
        kind: "replace",
        value: "총점을 가장 오래 걸린 문제 세 개의 복기로 바꾸기",
        detail:
          "연습 결과를 주는 흐름은 유지하고 비교 점수 대신 실제 지연 문제와 정답을 보여줍니다.",
        resultTitle: "느린 문제 3개 복기",
        platform: "web",
        smallestBuild:
          "짧은 게임 뒤 가장 오래 걸린 문제 세 개의 걸린 초·내 답·정답과 다음 기준 한 줄을 보여주는 웹 화면",
      },
      {
        id: "twist-one-retry-cue",
        kind: "add",
        value: "같은 규칙을 한 번 더 풀기 전 개선 기준 한 줄 더하기",
        detail:
          "연습과 결과 확인은 유지하고 다음 시도에서 바꿀 판단 기준 하나만 더합니다.",
        resultTitle: "한 줄 고치고 한 번 더",
        platform: "web",
        smallestBuild:
          "첫 게임 결과 뒤 개선 기준 한 줄을 보고 같은 규칙의 두 번째 3분 게임을 푸는 웹 화면",
      },
    ],
  },
  {
    id: "interactive-video-checkpoint",
    source: {
      id: "source-interactive-video-saas",
      sourceName: "Interactive Video SaaS",
      research: {
        key: "trustmrr:interactive-video-saas",
        url: "https://trustmrr.com/startup/interactive-video-saas",
      },
      platform: "web",
      value:
        "교육·훈련 영상을 드래그해 질문과 선택을 넣고 시청자의 반응을 확인하는 인터랙티브 영상 서비스",
      detail:
        "기존 영상에 질문·분기를 넣어 끝까지 봤는지가 아니라 중요한 내용을 이해했는지 확인합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $29k·성장 11%, 교육·훈련·마케팅 인터랙티브 영상 메커니즘 확인",
      preservedFlow:
        "영상 입력 → 특정 시점에 질문·행동 추가 → 시청자의 답과 이해 상태 확인",
    },
    payers: [
      {
        id: "payer-video-course-instructor",
        value: "녹화 강의를 반복 판매하는 1인 온라인 강사",
        detail:
          "수강생이 영상을 봤다는 기록은 있지만 핵심 개념을 이해했는지 같은 질문을 다시 받습니다.",
      },
      {
        id: "payer-franchise-trainer",
        value: "신입 교육 영상을 보내는 소형 매장 운영자",
        detail:
          "근무 전 영상을 보냈어도 안전·응대 절차를 실제로 이해했는지 다시 구두로 확인합니다.",
      },
      {
        id: "payer-saas-onboarding",
        value: "고객 온보딩 영상을 혼자 만드는 작은 SaaS 고객성공 담당자",
        detail:
          "같은 설정 질문이 반복돼 영상의 어느 구간이 이해되지 않는지 찾지 못합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-video-send",
        value: "10분 설명 영상을 새 수강생·직원에게 보내기 직전",
        detail:
          "그냥 재생 링크를 보내지 않고 꼭 알아야 할 한 가지를 확인하고 싶은 순간",
      },
      {
        id: "moment-repeat-question",
        value: "영상에 설명한 질문이 세 번째로 다시 온 순간",
        detail:
          "전체 영상을 다시 찍기 전에 막힌 시점과 개념 하나를 찾아야 하는 순간",
      },
      {
        id: "moment-before-live-session",
        value: "라이브 피드백·업무 시작 30분 전",
        detail:
          "참가자가 기본 내용을 이해했는지 빠르게 확인해 시간을 실습에 쓰고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-checkpoint",
        kind: "remove",
        value: "복잡한 분기 편집기를 빼고 영상 중간 질문 한 개만 남기기",
        detail:
          "영상에 상호작용을 넣는 흐름은 유지하고 첫 검증에 필요한 질문 수를 하나로 줄입니다.",
        resultTitle: "영상 중간 확인 한 문제",
        platform: "web",
        smallestBuild:
          "영상 URL과 시점, 객관식 한 문제를 넣으면 답해야 이어 보는 공유 링크가 나오는 웹 화면",
      },
      {
        id: "twist-confusing-moment",
        kind: "add",
        value: "시청자가 이해 안 됐어요를 누르는 시점 기록 하나 더하기",
        detail:
          "영상 시청과 반응 수집은 유지하고 설명이 막힌 정확한 시각만 더합니다.",
        resultTitle: "막힌 초가 보이는 설명 영상",
        platform: "web",
        smallestBuild:
          "영상 재생 중 이해 안 됐어요 버튼을 누르면 운영자에게 해당 초와 횟수가 보이는 공유 화면",
      },
      {
        id: "twist-one-concept-result",
        kind: "replace",
        value: "완료율을 핵심 개념 한 문제의 정답 여부로 바꾸기",
        detail:
          "시청자 상태를 확인하는 흐름은 유지하고 성공 기준만 끝까지 보기에서 이해 증거로 바꿉니다.",
        resultTitle: "봤음 대신 이해함 확인",
        platform: "web",
        smallestBuild:
          "영상 하나와 확인 문제 하나를 공유하고 시청자별 정답·미응답만 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "screen-recording-tutorial",
    source: {
      id: "source-screensage-pro",
      sourceName: "ScreenSage Pro",
      research: {
        key: "trustmrr:screensage-pro",
        url: "https://trustmrr.com/startup/screensage-pro",
      },
      platform: "app",
      value:
        "화면을 녹화하면 다른 사람이 따라 할 수 있는 튜토리얼로 정리해주는 macOS 도구",
      detail:
        "사용자가 실제로 작업하는 화면을 기록하고 설명 자료로 바꿔 반복 안내를 줄입니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $3.2k·성장 30%, 화면 녹화·튜토리얼 제작 메커니즘 확인",
      preservedFlow:
        "화면 작업 녹화 → 중요한 단계 추출·정리 → 따라 할 수 있는 튜토리얼 공유",
    },
    payers: [
      {
        id: "payer-solo-cs",
        value: "같은 사용법 질문에 매일 답하는 1인 SaaS 운영자",
        detail:
          "고객마다 화면 공유를 다시 켜고 같은 설정 위치를 처음부터 설명합니다.",
      },
      {
        id: "payer-ops-consultant",
        value: "고객 업무 도구를 세팅해주는 1인 운영 컨설턴트",
        detail:
          "프로젝트가 끝날 때마다 클릭 순서를 문서와 스크린샷으로 다시 만듭니다.",
      },
      {
        id: "payer-academy-admin",
        value: "수강 신청·출결 도구를 인계하는 소형 학원 관리자",
        detail:
          "새 직원이 올 때마다 여러 관리 화면의 순서를 옆에서 반복해서 보여줍니다.",
      },
    ],
    moments: [
      {
        id: "moment-third-explanation",
        value: "같은 클릭 순서를 세 번째로 설명한 직후",
        detail:
          "다음 질문에는 링크 하나만 보내고도 상대가 끝까지 따라오게 만들고 싶은 순간",
      },
      {
        id: "moment-before-handoff",
        value: "새 직원·고객에게 업무를 넘기기 전날",
        detail:
          "긴 매뉴얼 대신 실제 화면에서 해야 할 순서를 짧게 남겨야 하는 순간",
      },
      {
        id: "moment-after-ui-change",
        value: "서비스 화면이 바뀌어 기존 매뉴얼이 틀린 순간",
        detail:
          "문서 전체를 고치지 않고 달라진 작업 한 개만 다시 기록해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-sixty-second-recording",
        kind: "remove",
        value: "긴 녹화와 편집을 빼고 60초 작업 한 개만 기록하기",
        detail:
          "실제 화면을 따라 하게 하는 흐름은 유지하고 튜토리얼 범위를 한 작업으로 줄입니다.",
        resultTitle: "60초 한 작업 매뉴얼",
        platform: "web",
        smallestBuild:
          "60초 화면 녹화 한 개를 올리면 제목과 핵심 단계 세 개가 나오는 웹 화면",
      },
      {
        id: "twist-private-blur",
        kind: "add",
        value: "공유 전에 이메일·이름·금액을 가리는 확인 단계 하나 더하기",
        detail:
          "녹화와 튜토리얼 생성은 유지하고 잘못 노출될 개인정보를 사용자가 한 번 확인해 가립니다.",
        resultTitle: "가리고 보내는 화면 매뉴얼",
        platform: "web",
        smallestBuild:
          "녹화 한 개에서 감지한 민감 영역 세 곳을 가린 뒤 공유 미리보기를 보는 웹 화면",
      },
      {
        id: "twist-step-checklist",
        kind: "replace",
        value: "긴 영상 공유를 시간표시가 붙은 단계 체크리스트로 바꾸기",
        detail:
          "화면 작업을 기록하는 흐름은 유지하고 받는 사람이 보는 결과만 따라 하기 목록으로 바꿉니다.",
        resultTitle: "클릭 순서 체크리스트",
        platform: "web",
        smallestBuild:
          "60초 녹화를 올리면 단계 세 줄과 원본 영상의 해당 초 링크가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "video-place-route",
    source: {
      id: "source-vlogmap",
      sourceName: "VlogMap – Extract and map locations from videos & reels",
      research: {
        key: "chrome_web_store:gjojcncjnnbbpiegeaifacnbmknddohf",
        url: "https://chromewebstore.google.com/detail/vlogmap-%E2%80%93-extract-and-map/gjojcncjnnbbpiegeaifacnbmknddohf",
      },
      platform: "plugin",
      value:
        "여행 영상에서 언급되거나 화면에 나온 장소를 뽑아 지도·목록·경로로 저장하는 브라우저 확장",
      detail:
        "공개 YouTube 여행 영상이나 릴스를 읽어 장소명과 나온 시점을 찾고, 저장할 장소 목록과 지도 경로를 만듭니다.",
      evidence:
        "Chrome Web Store 원본 평점 5.0, 필터 실험 2회 노출; 공개 여행 영상 URL → 장소·시점 → 지도·경로 메커니즘 확인",
      preservedFlow:
        "공개 여행 영상 입력 → 장소와 나온 시점 추출 → 지도·목록·경로 확인",
    },
    payers: [
      {
        id: "payer-video-trip-planner",
        value: "브이로그 여러 편을 보며 자유여행 동선을 짜는 직장인 여행자",
        detail:
          "영상마다 흩어진 장소를 메모하고 지도에서 다시 찾아 이동 순서를 직접 비교합니다.",
      },
      {
        id: "payer-small-tour-designer",
        value: "영상 속 명소를 소규모 투어 코스로 바꾸는 1인 여행 기획자",
        detail:
          "고객 취향에 맞는 새 코스를 만들 때 영상의 장소·근거 시점·이동 거리를 따로 정리합니다.",
      },
      {
        id: "payer-location-coordinator",
        value: "출장·촬영 답사 동선을 반복해서 만드는 소형 프로젝트 코디네이터",
        detail:
          "참고 영상에서 후보 장소를 뽑고 하루 안에 갈 수 있는지 지도와 표를 오가며 확인합니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-three-vlogs",
        value: "여행 영상 세 편을 봤는데 장소 이름이 메모마다 흩어진 밤",
        detail:
          "영상으로 돌아가 장소를 다시 찾지 않고 후보지만 한 번에 모아야 하는 순간",
      },
      {
        id: "moment-before-booking-route",
        value: "숙소·교통을 결제하기 전 방문 장소가 하루 동선인지 확인할 때",
        detail:
          "마음에 든 곳이 서로 너무 멀지 않은지 영상 근거와 지도에서 함께 확인해야 하는 순간",
      },
      {
        id: "moment-before-sharing-itinerary",
        value: "동행자나 고객에게 첫 여행 코스안을 보내기 직전",
        detail:
          "장소를 고른 이유와 영상의 해당 장면까지 설명 가능한 목록이 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-captioned-youtube-only",
        kind: "remove",
        value:
          "여러 영상 플랫폼을 빼고 자막 있는 공개 YouTube 여행 영상 한 편만 받기",
        detail:
          "영상에서 장소를 찾아 지도에 옮기는 흐름은 유지하고 첫 입력을 처리 가능한 공개 영상 하나로 줄입니다.",
        resultTitle: "여행 영상 한 편을 장소 목록으로",
        platform: "web",
        smallestBuild:
          "자막 있는 공개 YouTube URL 하나를 넣으면 언급된 장소명·도시·지도 링크가 최대 열 곳 나오는 웹 화면",
      },
      {
        id: "twist-timestamp-evidence",
        kind: "add",
        value: "각 장소에 영상의 나온 초와 근거 자막 한 줄 더하기",
        detail:
          "추출한 장소를 저장하는 흐름에 사용자가 직접 맞는 곳인지 되돌아가 확인할 근거만 더합니다.",
        resultTitle: "나온 초와 지도 링크가 붙은 여행 장소 목록",
        platform: "web",
        smallestBuild:
          "자막 있는 공개 YouTube URL 하나를 넣으면 장소마다 타임스탬프·근거 자막·지도 링크가 붙고 틀린 장소를 제외할 수 있는 웹 화면",
      },
      {
        id: "twist-one-day-route",
        kind: "replace",
        value:
          "장소 저장 목록을 이동 거리가 짧은 하루 방문 순서 한 개로 바꾸기",
        detail:
          "영상에서 장소를 찾아 지도화하는 흐름은 유지하고 결과를 실제로 움직일 순서와 지도 링크로 바꿉니다.",
        resultTitle: "영상 속 장소로 만든 하루 동선",
        platform: "web",
        smallestBuild:
          "공개 YouTube URL 하나와 시작 위치를 넣으면 추출 장소 중 최대 다섯 곳의 방문 순서와 구간별 지도 링크가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "one-page-seo-fix-list",
    source: {
      id: "source-seo-analyzer",
      sourceName: "SEO Analyzer: One-Click Website Audit",
      research: {
        key: "chrome_web_store:pfdemlpmcgaabgdldjfklmaeieaamaap",
        url: "https://chromewebstore.google.com/detail/seo-analyzer-one-click-we/pfdemlpmcgaabgdldjfklmaeieaamaap",
      },
      platform: "plugin",
      value:
        "현재 웹페이지의 제목·메타태그·링크·헤딩을 읽어 검색 노출에 필요한 항목을 한 번에 점검하는 확장",
      detail:
        "페이지 하나를 열고 실행하면 검색엔진이 읽는 제목·설명·헤딩·링크 상태를 분석해 전체 개요를 보여줍니다.",
      evidence:
        "Chrome Web Store 원본 평점 5.0, 필터 실험 2회 정밀검사 후보; 현재 URL → SEO 항목 분석 → 누락 개요 메커니즘 확인",
      preservedFlow:
        "현재 웹페이지 입력 → 제목·태그·링크·헤딩 검사 → 검색 노출 점검 결과 확인",
    },
    payers: [
      {
        id: "payer-freelance-web-builder",
        value: "한 달에 여러 랜딩페이지를 납품하는 1인 웹 제작자",
        detail:
          "디자인과 기능을 마친 뒤 제목·설명·헤딩 누락을 페이지마다 다시 확인합니다.",
      },
      {
        id: "payer-small-brand-marketer",
        value: "자사몰 기획전·콘텐츠 페이지를 직접 올리는 소형 브랜드 마케터",
        detail:
          "개발자가 없는 상태에서 새 페이지가 검색에 읽힐 기본 조건을 갖췄는지 판단해야 합니다.",
      },
      {
        id: "payer-small-seo-agency",
        value: "여러 고객 사이트를 관리하는 소형 SEO 대행사 실무자",
        detail:
          "고객 페이지를 넘겨받을 때 기본 태그 누락을 반복해서 찾아 수정 요청으로 바꿉니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-page-release",
        value: "새 랜딩페이지를 공개하기 10분 전",
        detail:
          "검색 노출의 기본 항목이 빠져 다시 배포하는 일을 막아야 하는 순간",
      },
      {
        id: "moment-after-no-search-entry",
        value: "페이지를 열었는데 제목·설명이 검색 결과에서 이상하게 보인 직후",
        detail:
          "검색엔진이 어떤 내용을 읽고 무엇이 비어 있는지 한 페이지에서 확인해야 하는 순간",
      },
      {
        id: "moment-before-client-handoff",
        value: "팀·고객에게 페이지 점검 완료라고 공유하기 직전",
        detail:
          "막연한 SEO 점수가 아니라 고칠 항목과 확인 결과를 근거로 남겨야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-four-seo-basics",
        kind: "remove",
        value:
          "수십 개 SEO 지표를 빼고 검색 제목·검색 설명·대표 제목(H1)·대표 주소(canonical) 네 항목만 검사하기",
        detail:
          "현재 페이지의 검색 요소를 분석하는 흐름은 유지하고 첫 배포를 막는 기본 항목으로 범위를 줄입니다.",
        resultTitle: "공개 전 SEO 기본 4개 검사",
        platform: "plugin",
        smallestBuild:
          "현재 탭을 바꾸지 않는 읽기 전용 검사로 제목·메타설명·H1·canonical의 있음·없음·길이 경고와 해당 HTML 위치를 보여주는 브라우저 확장 화면",
      },
      {
        id: "twist-fix-order-not-score",
        kind: "replace",
        value: "종합 SEO 점수를 오늘 고칠 순서와 정확한 누락 항목으로 바꾸기",
        detail:
          "같은 페이지 검사는 유지하고 비교하기 어려운 점수 대신 배포 전에 닫을 작업 목록을 줍니다.",
        resultTitle: "점수 대신 오늘 고칠 SEO 목록",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 기본 SEO 오류를 영향도 순으로 최대 다섯 개 보여주고 각 항목에 현재 값·권장 범위·HTML 위치를 붙이는 확장 화면",
      },
      {
        id: "twist-search-preview",
        kind: "add",
        value:
          "현재 제목·설명이 검색 결과에서 어떻게 잘릴지 미리보기 한 장 더하기",
        detail:
          "제목과 메타태그를 읽는 흐름에 사용자가 결과 모양을 보고 수정 여부를 판단할 시각 근거만 더합니다.",
        resultTitle: "잘리는 문구가 보이는 검색 미리보기",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 제목·메타설명·URL을 읽어 데스크톱 검색 결과 카드와 잘리는 글자 위치를 보여주는 확장 화면",
      },
    ],
  },
  {
    id: "schema-error-fix-block",
    source: {
      id: "source-schema-validator-generator",
      sourceName: "Schema Markup Validator & Generator",
      research: {
        key: "chrome_web_store:pbnncbpphfheokgambglknpokckilmph",
        url: "https://chromewebstore.google.com/detail/schema-markup-validator-g/pbnncbpphfheokgambglknpokckilmph",
      },
      platform: "plugin",
      value:
        "웹페이지의 Schema.org 구조화 데이터를 검증·시각화하고 수정하거나 새 JSON-LD를 만드는 확장",
      detail:
        "현재 페이지의 구조화 데이터 블록을 읽어 오류와 중첩 구조를 보여주고 검색 리치 결과에 맞는 마크업 생성을 돕습니다.",
      evidence:
        "Chrome Web Store 시장 신호 상위 0.5%, 필터 실험 2회 정밀검사 후보; 현재 URL → 구조화 데이터 검증 → 수정 JSON-LD 메커니즘 확인",
      preservedFlow:
        "현재 웹페이지 입력 → Schema.org 구조화 데이터 검증·시각화 → 수정 JSON-LD 확인",
    },
    payers: [
      {
        id: "payer-technical-seo-practitioner",
        value: "고객 사이트의 리치 결과 오류를 고치는 테크니컬 SEO 실무자",
        detail:
          "Search Console 경고와 실제 페이지 JSON-LD를 오가며 어느 속성이 잘못됐는지 찾습니다.",
      },
      {
        id: "payer-multi-client-web-agency",
        value: "쇼핑몰·지역업체 사이트를 반복 납품하는 소형 웹 에이전시",
        detail:
          "상품·업체·이벤트 페이지마다 다른 구조화 데이터 누락을 개발자에게 설명해야 합니다.",
      },
      {
        id: "payer-ecommerce-growth-developer",
        value: "자사몰 검색 노출을 직접 관리하는 소형 팀의 그로스 개발자",
        detail:
          "상품 템플릿 변경 뒤 여러 페이지의 JSON-LD가 유효한지 빠르게 확인합니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-schema-warning",
        value: "Search Console에서 구조화 데이터 경고를 받은 직후",
        detail:
          "경고 이름만으로는 못 찾는 실제 JSON 경로와 고칠 값을 확인해야 하는 순간",
      },
      {
        id: "moment-before-campaign-indexing",
        value: "상품·행사 페이지를 검색엔진에 제출하기 직전",
        detail:
          "리치 결과 기회를 놓치기 전에 필수 속성과 형식 오류를 닫아야 하는 순간",
      },
      {
        id: "moment-before-structured-data-handoff",
        value: "구조화 데이터 수정안을 팀·개발자·고객에게 보내기 직전",
        detail:
          "오류 코드가 아니라 붙여넣어 비교할 수정 블록과 근거가 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-first-schema-block",
        kind: "remove",
        value:
          "사이트 전체 검사를 빼고 현재 페이지를 검사한 뒤 발견된 JSON-LD 오류 블록 하나만 고르기",
        detail:
          "Schema.org 검증 흐름은 유지하고 한 번에 처리할 범위를 실제 오류 블록 하나로 제한합니다.",
        resultTitle: "페이지에서 고칠 검색 정보 오류 한 개 찾기",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 첫 JSON-LD 블록을 읽어 스키마 유형·오류 JSON 경로·필수 속성 누락을 보여주는 브라우저 확장 화면",
      },
      {
        id: "twist-copy-ready-json-diff",
        kind: "replace",
        value:
          "기술 오류 코드 목록을 자동 반영되지 않는 전후 비교와 수정 JSON-LD 한 블록으로 바꾸기",
        detail:
          "검증 결과는 유지하고 사용자가 바로 적용·검토할 수 있는 정확한 구조와 변경 위치로 결과를 바꿉니다.",
        resultTitle: "구글 검색 확장 정보 오류, 고친 코드와 비교",
        platform: "plugin",
        smallestBuild:
          "현재 탭 검사 뒤 JSON-LD(상품 가격·행사 날짜 같은 검색 확장 정보를 만드는 코드) 오류 블록 하나를 고르면 원본·수정 제안·바뀐 줄·적용 전 주의사항·재검사 결과를 보여주는 읽기 전용 확장 화면",
      },
      {
        id: "twist-rich-result-readiness",
        kind: "add",
        value: "수정 뒤 리치 결과 필수 조건 충족 여부 체크 한 장 더하기",
        detail:
          "구조화 데이터 검증에 검색 노출을 보장하지 않는다는 안내와 현재 유형의 필수 조건 확인만 더합니다.",
        resultTitle: "구글 검색 확장 정보 준비 체크",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 스키마 유형을 인식해 필수·권장 속성 충족표와 검색 노출 비보장 안내를 보여주는 확장 화면",
      },
    ],
  },
  {
    id: "current-page-to-clean-csv",
    source: {
      id: "source-data-scraper-ai-miner",
      sourceName: "Data Scraper - AI Data Miner",
      research: {
        key: "chrome_web_store:nkkdeadncmkfpmoafagdoanfkipoogkl",
        url: "https://chromewebstore.google.com/detail/data-scraper-ai-data-mine/nkkdeadncmkfpmoafagdoanfkipoogkl",
      },
      platform: "plugin",
      value:
        "현재 웹페이지에서 사용자가 원하는 내용을 골라 코딩 없이 구조화 데이터로 추출하는 브라우저 도구",
      detail:
        "페이지에 보이는 반복 항목과 필드를 선택하면 같은 구조를 찾아 표로 정리하고 CSV로 내보냅니다.",
      evidence:
        "Chrome Web Store 원본 평점 5.0, 필터 D 정밀검사 후보; 현재 웹페이지 → 선택 필드 추출 → 구조화 CSV 메커니즘 확인",
      preservedFlow:
        "현재 웹페이지와 원하는 필드 선택 → 반복 항목 구조화 → CSV 미리보기·내보내기",
    },
    payers: [
      {
        id: "payer-product-research-operator",
        value: "공개 상품 목록을 엑셀로 비교하는 1인 셀러·상품 조사 담당자",
        detail:
          "상품명·가격·평점 수십 줄을 페이지에서 복사해 열마다 다시 붙여넣습니다.",
      },
      {
        id: "payer-public-list-researcher",
        value: "기관·행사·지원사업 공개 목록을 반복 수집하는 소형 팀 리서처",
        detail:
          "같은 형태의 제목·날짜·링크를 주마다 표로 옮기고 출처를 다시 확인합니다.",
      },
      {
        id: "payer-ops-catalog-manager",
        value: "파트너 사이트의 공개 항목을 내부 목록으로 정리하는 운영 담당자",
        detail:
          "납품처·파트너·매장 같은 공개 목록을 CSV 형식에 맞게 손으로 정리합니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-copying-twenty-rows",
        value:
          "같은 모양의 항목을 스무 줄째 복사하다가 아직 페이지가 남은 순간",
        detail:
          "현재 페이지에서 반복 구조를 잡아 남은 행을 한 번에 표로 옮기고 싶은 순간",
      },
      {
        id: "moment-before-weekly-list-update",
        value: "지난주와 같은 공개 목록을 다시 업데이트하기 시작할 때",
        detail:
          "새 행만 확인할 수 있도록 같은 열 구조의 CSV가 다시 필요한 순간",
      },
      {
        id: "moment-before-sharing-source-table",
        value: "수집한 표를 동료·고객에게 보내기 직전",
        detail:
          "값뿐 아니라 어느 페이지에서 언제 가져왔는지 검수 가능한 결과가 필요한 순간",
      },
    ],
    twists: [
      {
        id: "twist-current-page-only",
        kind: "remove",
        value:
          "사이트 순회와 페이지네이션을 빼고 현재 열어둔 공개 페이지 한 장만 추출하기",
        detail:
          "웹 내용을 구조화하는 흐름은 유지하고 로그인·크롤러·백그라운드 작업 없이 현재 탭으로 범위를 닫습니다.",
        resultTitle: "현재 페이지 한 장을 바로 CSV로",
        platform: "plugin",
        smallestBuild:
          "현재 공개 탭에서 사용자가 반복 항목 하나를 누르면 보이는 행만 표 미리보기와 CSV로 내보내는 브라우저 확장",
      },
      {
        id: "twist-three-example-cells",
        kind: "replace",
        value:
          "CSS 선택자 설정을 이름·가격·링크처럼 서로 다른 열의 예시 셀 한 개에서 세 개 누르기로 바꾸기",
        detail:
          "추출할 필드를 정하는 흐름은 유지하고 코드를 모르는 사용자가 화면에서 구조를 가르치게 합니다.",
        resultTitle: "세 칸만 눌러 만드는 웹 표",
        platform: "plugin",
        smallestBuild:
          "현재 공개 탭에서 이름·가격·링크 같은 서로 다른 열의 예시 셀을 한 개에서 세 개 누르면 같은 반복 구조의 열과 행을 미리 보여주고 선택을 취소할 수 있는 확장",
      },
      {
        id: "twist-source-columns",
        kind: "add",
        value: "CSV마다 원본 URL·수집 시각·빈 값 경고 열을 자동으로 더하기",
        detail:
          "구조화 데이터 내보내기에 나중에 검수하고 다시 찾을 수 있는 최소 출처 정보만 더합니다.",
        resultTitle: "출처가 남는 웹페이지 CSV",
        platform: "plugin",
        smallestBuild:
          "현재 공개 탭에서 고른 필드를 CSV로 만들고 각 행에 원본 URL·수집 시각·빈 값 표시를 붙이는 확장",
      },
    ],
  },
  {
    id: "accessibility-fix-five",
    source: {
      id: "source-ibm-equal-access-checker",
      sourceName: "IBM Equal Access Accessibility Checker",
      research: {
        key: "chrome_web_store:lkcagbfjnkomcinoddgooolagloogehp",
        url: "https://chromewebstore.google.com/detail/ibm-equal-access-accessib/lkcagbfjnkomcinoddgooolagloogehp",
      },
      platform: "plugin",
      value:
        "현재 웹페이지를 검사해 접근성 문제와 관련 기준을 찾아주는 브라우저 확장",
      detail:
        "페이지의 DOM과 화면 요소를 자동 규칙으로 검사해 장애가 있는 사용자를 막을 수 있는 접근성 오류를 표시합니다.",
      evidence:
        "Chrome Web Store 원본 평점 4.9, IBM 접근성 검사 확장; 현재 URL → 접근성 규칙 검사 → 오류 위치·기준 확인 메커니즘 확인",
      preservedFlow:
        "현재 웹페이지 입력 → 접근성 규칙 검사 → 오류 위치·기준·수정 방향 확인",
    },
    payers: [
      {
        id: "payer-solo-saas-builder",
        value: "웹 접근성 전담자가 없는 1인 SaaS·웹서비스 제작자",
        detail:
          "배포 전 버튼 이름·대비·폼 라벨 같은 기본 오류를 브라우저와 문서를 오가며 확인합니다.",
      },
      {
        id: "payer-small-web-qa-agency",
        value: "고객 사이트를 납품 전에 검사하는 소형 웹 에이전시 QA 담당자",
        detail:
          "자동 검사 결과를 개발자가 바로 고칠 수 있는 위치와 문장으로 다시 번역합니다.",
      },
      {
        id: "payer-public-site-manager",
        value: "학교·협회·공공성 있는 웹페이지를 직접 관리하는 실무자",
        detail:
          "접근성 민원이나 내부 점검 요청이 오면 어떤 오류부터 고쳐야 하는지 판단하기 어렵습니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-accessible-release",
        value: "새 페이지를 공개하기 전 마지막 브라우저 점검을 할 때",
        detail:
          "키보드·스크린리더 사용자를 막는 기본 오류를 배포 전에 닫아야 하는 순간",
      },
      {
        id: "moment-after-accessibility-report",
        value: "사용자나 고객에게 접근성 문제 제보를 받은 직후",
        detail:
          "제보한 화면에서 자동으로 찾을 수 있는 오류와 실제 수정 위치를 먼저 좁혀야 하는 순간",
      },
      {
        id: "moment-before-fix-ticket",
        value: "찾은 접근성 오류를 실제 수정 작업으로 옮기기 직전",
        detail:
          "혼자 고치거나 팀에 넘길 때 규칙 코드가 아니라 재현 위치·영향·수정 확인법을 한 장으로 남겨야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-top-five-blockers",
        kind: "remove",
        value:
          "전체 WCAG 보고서를 빼고 현재 페이지의 사용자 진행을 막는 오류 다섯 개만 남기기",
        detail:
          "접근성 규칙 검사는 유지하고 처음 고칠 범위를 버튼·링크·폼·대비의 결정적 오류로 줄입니다.",
        resultTitle: "먼저 고칠 접근성 오류 5개",
        platform: "plugin",
        smallestBuild:
          "현재 탭을 axe-core 규칙으로 검사해 심각도가 높은 오류 최대 다섯 개의 요소·영향·선정 이유·기준을 보여주고 자동 검사 밖의 수동 확인이 필요하다고 알리는 브라우저 확장",
      },
      {
        id: "twist-korean-fix-location",
        kind: "replace",
        value:
          "영문 규칙 코드 목록을 화면 요소 위치·한국어 영향·고칠 속성으로 바꾸기",
        detail:
          "같은 자동 검사 결과를 비전문가도 개발자에게 전달할 수 있는 구체적인 수정 단위로 바꿉니다.",
        resultTitle: "위치와 고칠 속성이 보이는 접근성 검사",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 자동 검사 오류마다 DOM 선택자·화면 텍스트·한국어 영향 설명·확인할 HTML 속성·수정 뒤 재검사 항목을 보여주는 확장",
      },
      {
        id: "twist-ready-fix-ticket",
        kind: "add",
        value:
          "오류마다 재현 위치·영향·수정 확인법이 있는 개발 티켓 한 장 더하기",
        detail:
          "접근성 오류와 기준을 찾는 흐름에 팀이 바로 수정·재검사할 수 있는 전달 형식만 더합니다.",
        resultTitle: "개발자에게 바로 보내는 접근성 티켓",
        platform: "plugin",
        smallestBuild:
          "현재 탭의 자동 검사 오류 하나를 고르면 URL·요소·영향·관련 기준·수정 후 재검사 항목이 있는 Markdown 티켓을 만드는 확장",
      },
    ],
  },
  {
    id: "ai-answer-brand-gap",
    source: {
      id: "source-airix-aeo-ai-visibility-platform",
      sourceName: "AIRIX - AEO / AI Visibility Platform",
      research: {
        key: "trustmrr:airix-aeo-ai-visibility-platform",
        url: "https://trustmrr.com/startup/airix-aeo-ai-visibility-platform",
      },
      platform: "web",
      value:
        "고객이 AI에 묻는 질문에서 자사·경쟁사·인용 출처가 어떻게 등장하는지 반복 비교하는 AI 검색 노출 도구",
      detail:
        "브랜드와 대표 질문을 넣으면 여러 AI 답변에서 브랜드 언급·경쟁사·인용 출처를 찾아 빠진 질문과 출처를 보여줍니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $2.1k·성장 4%; 브랜드 질문 → 여러 AI 답변 비교 → 언급·경쟁사·출처 표 메커니즘 확인",
      preservedFlow:
        "브랜드·대표 질문 입력 → AI 답변의 브랜드·경쟁사·출처 비교 → 빠진 질문과 인용 근거 확인",
    },
    payers: [
      {
        id: "payer-small-brand-aeo",
        value: "검색 유입과 AI 추천을 함께 보고해야 하는 소형 브랜드 마케터",
        detail:
          "ChatGPT에서 자사 제품이 왜 빠지는지 확인하려고 같은 질문을 여러 AI에 반복 입력합니다.",
      },
      {
        id: "payer-pr-agency-ai-mention",
        value: "고객사의 AI 언급을 월간 보고서에 넣는 소형 PR·SEO 대행사",
        detail:
          "브랜드별 질문·경쟁사·인용 링크를 스프레드시트로 다시 정리해 고객에게 설명합니다.",
      },
      {
        id: "payer-ai-search-consultant",
        value: "AI 검색 노출 개선을 컨설팅하는 1인 전문가",
        detail:
          "개선 전후에 같은 질문을 다시 물어 브랜드가 등장한 답과 출처를 증거로 남깁니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-ai-visibility-report",
        value: "월간 검색·브랜드 보고서를 보내기 30분 전",
        detail:
          "감상이 아니라 같은 질문의 자사·경쟁사·출처 차이를 한 표로 보여줘야 하는 순간",
      },
      {
        id: "moment-competitor-in-ai-answer",
        value: "고객이 ChatGPT 답변에는 경쟁사만 나온다고 제보한 직후",
        detail:
          "어떤 질문에서 빠졌고 답변은 누구를 근거로 삼았는지 다시 확인해야 하는 순간",
      },
      {
        id: "moment-before-product-launch-aeo",
        value: "신제품 페이지를 공개하고 AI 추천 문구를 점검하는 날",
        detail:
          "대표 질문에서 제품·카테고리·경쟁사가 어떻게 설명되는지 출시 전에 기록해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-three-pasted-ai-answers",
        kind: "remove",
        value:
          "16개 플랫폼 주간 스캔을 빼고 같은 질문에 대한 AI 답변 세 개를 붙여넣어 비교하기",
        detail:
          "AI 답변의 브랜드 노출을 비교하는 흐름은 유지하고 API 연동 없이 답변 세 개로 시작합니다.",
        resultTitle: "AI 답변 3개의 브랜드 언급 비교표",
        platform: "web",
        smallestBuild:
          "브랜드명·질문 한 개·AI 답변 최대 세 개를 붙여 넣으면 브랜드·경쟁사·출처 URL 언급 여부와 원문 근거가 한 표로 나오는 웹 화면",
      },
      {
        id: "twist-missed-questions-first",
        kind: "replace",
        value:
          "종합 노출 점수를 브랜드가 빠진 대표 질문 세 개와 경쟁사 이름으로 바꾸기",
        detail:
          "같은 질문 비교는 유지하고 해석하기 어려운 점수 대신 바로 설명할 누락 사례를 줍니다.",
        resultTitle: "우리 브랜드가 빠진 AI 질문 3개",
        platform: "web",
        smallestBuild:
          "대표 질문 최대 세 개와 각 답변을 넣으면 브랜드가 빠지고 경쟁사만 나온 질문·경쟁사 문장·답변 출처가 우선순위로 나오는 웹 화면",
      },
      {
        id: "twist-citation-opportunity",
        kind: "add",
        value:
          "경쟁사가 인용된 출처 중 우리 브랜드가 빠진 페이지와 근거 문장 더하기",
        detail:
          "언급 비교에 다음 콘텐츠·PR 작업으로 이어질 인용 출처 근거만 더합니다.",
        resultTitle: "경쟁사만 인용된 AI 답변 출처",
        platform: "web",
        smallestBuild:
          "붙여 넣은 AI 답변의 출처 URL을 모아 브랜드·경쟁사 언급을 대조하고 우리 브랜드가 빠진 출처 최대 세 개와 근거 문장을 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "business-card-to-contact-row",
    source: {
      id: "source-qr-reader-for-iphone",
      sourceName: "QR Reader for iPhone",
      research: {
        key: "app_store:368494609",
        url: "https://apps.apple.com/us/app/qr-reader-for-iphone/id368494609?uo=4",
      },
      platform: "app",
      value:
        "QR·문서·명함을 카메라로 읽어 연락처와 구조화된 스캔 기록으로 바꾸는 모바일 스캐너",
      detail:
        "명함을 촬영하면 이름·회사·직함·전화·이메일을 인식해 연락처나 CSV로 저장합니다.",
      evidence:
        "App Store 평점 4.72·리뷰 141만+; 명함 사진 → 연락처 필드 인식 → 연락처·CSV 저장 기능 확인",
      preservedFlow:
        "명함 사진 입력 → 연락처 필드 인식·확인 → 연락처 파일·CSV 저장",
    },
    payers: [
      {
        id: "payer-field-sales-card",
        value: "박람회마다 명함을 수십 장 받는 B2B 영업 담당자",
        detail:
          "행사 뒤 명함을 보며 이름·회사·전화번호를 CRM에 다시 입력하고 만난 맥락을 잊습니다.",
      },
      {
        id: "payer-recruiter-card",
        value: "채용 행사에서 후보자 명함과 관심 직무를 함께 기록하는 리크루터",
        detail:
          "연락처는 저장해도 어느 포지션과 무슨 이야기를 했는지 후보 목록에 다시 붙여야 합니다.",
      },
      {
        id: "payer-networking-freelancer",
        value: "모임에서 만난 의뢰인 연락처를 직접 관리하는 프리랜서",
        detail: "명함을 사진첩에만 남겨 후속 연락 날짜와 대화 메모를 놓칩니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-networking-event",
        value: "행사가 끝나고 받은 명함이 책상에 쌓인 저녁",
        detail:
          "누구를 어디서 만났는지 기억날 때 연락처와 메모로 옮겨야 하는 순간",
      },
      {
        id: "moment-before-followup-message",
        value: "어제 만난 사람에게 첫 후속 메시지를 보내기 직전",
        detail:
          "명함의 정확한 이름·회사·직함과 대화 메모를 한 번에 확인해야 하는 순간",
      },
      {
        id: "moment-before-crm-import",
        value: "이번 주 신규 연락처를 CRM에 올리기 10분 전",
        detail:
          "필드가 뒤섞인 연락처를 다시 손보지 않도록 열과 누락 값을 확인해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-card-vcard",
        kind: "remove",
        value:
          "QR·문서 스캔을 빼고 명함 사진 한 장을 연락처 파일 하나로 바꾸기",
        detail:
          "카메라로 구조화 정보를 읽는 흐름은 유지하고 첫 결과를 명함 한 장으로 줄입니다.",
        resultTitle: "명함 한 장을 바로 저장하는 연락처",
        platform: "web",
        smallestBuild:
          "명함 사진 한 장을 올리면 이름·회사·직함·전화·이메일을 수정할 수 있고 확인 후 vCard 파일을 받는 모바일 웹 화면",
      },
      {
        id: "twist-ten-cards-csv",
        kind: "replace",
        value: "스캔 기록 목록을 명함 최대 열 장의 CRM 업로드 CSV로 바꾸기",
        detail:
          "명함 인식은 유지하고 여러 장을 다시 입력하는 반복 작업을 한 표로 닫습니다.",
        resultTitle: "명함 10장을 CRM 한 표로",
        platform: "web",
        smallestBuild:
          "명함 사진 최대 열 장을 올리면 연락처 필드·원본 사진·누락 경고가 행별로 나오고 확인한 행만 CSV로 받는 웹 화면",
      },
      {
        id: "twist-followup-note",
        kind: "add",
        value: "연락처에 만난 장소·대화 주제·후속 날짜 한 줄 더하기",
        detail: "명함 저장에 실제 다음 연락을 기억할 맥락만 더합니다.",
        resultTitle: "후속 약속까지 남는 명함 연락처",
        platform: "web",
        smallestBuild:
          "명함 사진과 짧은 음성·텍스트 메모를 넣으면 연락처 필드와 만난 장소·대화 주제·후속 날짜가 함께 들어간 vCard·CSV 한 행이 나오는 웹 화면",
      },
    ],
  },
  {
    id: "site-to-brand-card",
    source: {
      id: "source-mapaan",
      sourceName: "Mapaan",
      research: {
        key: "trustmrr:mapaan",
        url: "https://trustmrr.com/startup/mapaan",
      },
      platform: "web",
      value:
        "웹사이트에서 브랜드 정체성을 뽑아 소셜 게시물·광고·블로그·제품 이미지 생성에 재사용하는 AI 마케팅 스튜디오",
      detail:
        "사이트 URL을 읽어 로고·색·글꼴·제품 표현·말투를 추출하고 다음 제작자나 AI에 전달할 규칙으로 정리합니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $232·성장 6%; 웹사이트 URL → 브랜드 정체성 추출 → 콘텐츠 제작 재사용 메커니즘 확인",
      preservedFlow:
        "브랜드 웹사이트 입력 → 시각·문구 규칙 추출 → 다음 콘텐츠에 쓸 브랜드 기준 확인",
    },
    payers: [
      {
        id: "payer-small-brand-operator",
        value: "자사몰 콘텐츠를 외주와 AI로 번갈아 만드는 소형 브랜드 운영자",
        detail:
          "작업자마다 색과 말투가 달라져 매번 브랜드 소개와 금지 표현을 다시 설명합니다.",
      },
      {
        id: "payer-freelance-brand-designer",
        value: "기존 사이트를 참고해 빠르게 시안을 잡는 프리랜서 디자이너",
        detail:
          "로고 파일과 색상 코드가 정리되지 않은 고객 사이트에서 브랜드 요소를 손으로 찾습니다.",
      },
      {
        id: "payer-content-agency-onboarding",
        value: "새 고객의 게시물·광고 제작을 시작하는 소형 콘텐츠 대행사",
        detail:
          "첫 제작 전에 사이트 여러 페이지를 읽고 말투·제품 표현·피해야 할 카피를 문서로 만듭니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-outsourcing-content",
        value: "외주 제작자에게 첫 광고·게시물 브리프를 보내기 직전",
        detail:
          "링크만 보내고 다른 느낌의 결과를 받지 않도록 눈에 보이는 브랜드 기준을 전달해야 하는 순간",
      },
      {
        id: "moment-after-inconsistent-ai-output",
        value: "AI가 만든 문구와 이미지가 자사 사이트와 전혀 다르게 나온 직후",
        detail:
          "프롬프트에 반복해 붙일 색·말투·금지 표현을 사이트 근거로 다시 정해야 하는 순간",
      },
      {
        id: "moment-before-rebrand-handoff",
        value: "사이트를 바꾼 뒤 팀에 새 브랜드 기준을 공유하는 날",
        detail:
          "이전 색과 문구가 어디에 남았는지 확인하고 현재 기준만 한 장에 모아야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-homepage-brand-facts",
        kind: "remove",
        value:
          "콘텐츠 생성을 빼고 공개 홈페이지 한 장에서 확인되는 브랜드 사실만 뽑기",
        detail:
          "사이트에서 브랜드 정체성을 읽는 흐름은 유지하고 생성 결과를 만들기 전 근거 카드로 줄입니다.",
        resultTitle: "홈페이지에서 뽑은 1쪽 브랜드 카드",
        platform: "web",
        smallestBuild:
          "공개 홈페이지 URL 하나를 넣으면 로고 이미지·색상 최대 다섯 개·글꼴·대표 문구 세 개·제품 호칭이 출처 위치와 함께 나오는 웹 화면",
      },
      {
        id: "twist-evidence-before-guideline",
        kind: "add",
        value: "각 색·말투 규칙에 실제 페이지 캡처와 원문 위치 근거 붙이기",
        detail:
          "자동 추출 결과를 사람이 확인하고 틀린 규칙을 지울 수 있도록 출처 근거만 더합니다.",
        resultTitle: "사이트 근거가 붙은 브랜드 규칙",
        platform: "web",
        smallestBuild:
          "URL을 넣으면 브랜드 요소마다 페이지 캡처·CSS 색상·원문 문장·선택 해제 버튼이 붙고 확인한 항목만 1쪽 PDF로 받는 웹 화면",
      },
      {
        id: "twist-prompt-ready-guardrails",
        kind: "replace",
        value:
          "긴 브랜드 가이드를 AI·외주에 붙일 말투 3개와 금지 표현 3개로 바꾸기",
        detail:
          "브랜드 일관성을 전달하는 흐름은 유지하고 다음 제작 요청에 바로 쓸 짧은 규칙으로 결과를 바꿉니다.",
        resultTitle: "다음 제작에 붙이는 브랜드 말투·금지어",
        platform: "web",
        smallestBuild:
          "사이트 URL과 만들 콘텐츠 종류를 넣으면 근거 문장과 함께 유지할 말투 세 개·피할 표현 세 개·복사 가능한 요청문이 나오는 웹 화면",
      },
    ],
  },
  {
    id: "unanswered-email-followup",
    source: {
      id: "source-rightinbox-email-reminders",
      sourceName: "RightInbox: Email Reminders, Tracking, Notes",
      research: {
        key: "chrome_web_store:mflnemhkomgploogccdmcloekbloobgb",
        url: "https://chromewebstore.google.com/detail/rightinbox-email-reminder/mflnemhkomgploogccdmcloekbloobgb",
      },
      platform: "plugin",
      value:
        "보낸 이메일의 답장·약속 날짜를 추적해 놓친 후속 연락을 다시 꺼내는 Gmail 생산성 확장",
      detail:
        "보낸 메일과 회신을 기다릴 마지막 날짜를 지정하면 답장 여부를 확인하고 다시 연락할 이유·시각·초안을 보여줍니다.",
      evidence:
        "Chrome Web Store 평점 4.6·이메일 검색 순위 2위; 보낸 메일 → 답장·기한 추적 → 후속 알림·메일 메커니즘 확인",
      preservedFlow:
        "보낸 이메일·기한 입력 → 답장 여부·약속 확인 → 후속 알림과 회신 초안 확인",
    },
    payers: [
      {
        id: "payer-quote-followup-sales",
        value: "견적 메일 뒤 답장을 기다리는 소형 B2B 영업 담당자",
        detail:
          "보낸편지함을 다시 검색하며 어느 고객에게 언제 한 번 더 연락할지 개인 메모로 관리합니다.",
      },
      {
        id: "payer-recruiter-followup",
        value: "후보자·현업 인터뷰 일정을 동시에 조율하는 리크루터",
        detail: "답장이 없는 쪽과 약속한 회신 날짜가 섞여 일정이 늦어집니다.",
      },
      {
        id: "payer-freelance-proposal",
        value: "제안서·청구서를 이메일로 보내는 프리랜서·소형 대행사 대표",
        detail: "독촉처럼 보일까 미루다가 계약·입금 확인 메일을 놓칩니다.",
      },
    ],
    moments: [
      {
        id: "moment-quote-no-reply",
        value: "견적을 보낸 지 이틀이 지났는데 답장이 없는 오전",
        detail:
          "누구에게 어떤 맥락으로 한 번 더 물을지 원문과 함께 확인해야 하는 순간",
      },
      {
        id: "moment-promised-date-passed",
        value: "상대가 답을 주기로 한 날짜가 오늘 지나간 순간",
        detail:
          "약속 문장을 근거로 부담스럽지 않은 후속 메일을 바로 보내야 하는 순간",
      },
      {
        id: "moment-before-weekly-inbox-close",
        value: "금요일 퇴근 전 이번 주 보낸 메일을 닫는 10분",
        detail:
          "다음 주까지 기다릴 메일과 오늘 다시 보낼 메일을 빠르게 나눠야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-paste-one-sent-email",
        kind: "remove",
        value:
          "Gmail 계정 연동을 빼고 보낸 이메일 원문 한 통과 회신을 기다릴 마지막 날짜만 받기",
        detail:
          "답장·기한을 기준으로 후속 연락을 만드는 흐름은 유지하고 권한 없는 MVP로 줄입니다.",
        resultTitle: "보낸 메일 한 통의 후속 연락 카드",
        platform: "web",
        smallestBuild:
          "보낸 이메일 원문과 보낸 날짜·회신을 기다릴 마지막 날짜를 넣으면 상대·요청·약속·다시 연락할 날짜·짧은 후속 초안이 나오는 웹 화면",
      },
      {
        id: "twist-promised-sentence-evidence",
        kind: "add",
        value: "후속 이유에 상대가 약속한 날짜·행동의 원문 문장 붙이기",
        detail: "알림에 왜 지금 연락해도 되는지 확인할 근거만 더합니다.",
        resultTitle: "약속 문장이 붙은 후속 메일",
        platform: "web",
        smallestBuild:
          "이메일 스레드를 붙여 넣으면 약속한 날짜·행동의 원문과 지난 일수·그 문장을 자연스럽게 이어 쓴 후속 초안이 나오는 웹 화면",
      },
      {
        id: "twist-three-followup-due",
        kind: "replace",
        value:
          "메일함 대시보드를 오늘 확인할 무응답 메일 세 건과 기다린 이유로 바꾸기",
        detail:
          "후속 연락 추적은 유지하고 답장 작성 도구와 겹치지 않는 오늘의 확인 큐로 결과를 줄입니다.",
        resultTitle: "오늘 확인할 무응답 이메일 3건",
        platform: "plugin",
        smallestBuild:
          "읽기 전용 Gmail 확장이 보낸 메일 중 답장 없음·사용자 지정 기한 경과 조건을 만족한 최대 세 통의 상대·원래 요청·기다린 일수·약속 원문을 보여주는 화면",
      },
    ],
  },
  {
    id: "hotel-final-price-compare",
    source: {
      id: "source-hotel-ninja",
      sourceName: "Hotel Ninja: Compare Booking, Expedia & Hotels.com Prices",
      research: {
        key: "chrome_web_store:jdmfbjbmabnleofpjeckeeihjifegini",
        url: "https://chromewebstore.google.com/detail/hotel-ninja-compare-booki/jdmfbjbmabnleofpjeckeeihjifegini",
      },
      platform: "plugin",
      value:
        "현재 보고 있는 호텔의 같은 객실을 여러 예약 사이트에서 찾아 세금·수수료 포함 최종가와 조건을 비교하는 확장",
      detail:
        "호텔 페이지에서 날짜·객실·취소·조식 조건을 맞춰 실제 결제액과 더 싼 예약 링크를 바로 보여줍니다.",
      evidence:
        "Chrome Web Store 평점 5.0·여행 카테고리 1위·사용자 1천+; 현재 호텔 페이지 → 동일 객실 실시간 비교 → 최종가·조건·예약 링크 확인",
      preservedFlow:
        "호텔 객실 페이지 입력 → 같은 날짜·객실·조건 정규화 → 세금 포함 최종가와 더 싼 링크 확인",
    },
    payers: [
      {
        id: "payer-frequent-hotel-traveler",
        value: "출장·여행 숙소를 자주 직접 결제하는 직장인",
        detail:
          "최저가처럼 보이는 방도 결제 단계에서 세금·서비스 수수료가 붙어 탭을 다시 오갑니다.",
      },
      {
        id: "payer-executive-travel-coordinator",
        value: "임원·팀 출장 숙소의 조건과 증빙을 맞추는 소형 조직 코디네이터",
        detail:
          "가격뿐 아니라 무료 취소·조식·결제 통화가 같은 방인지 표로 다시 확인합니다.",
      },
      {
        id: "payer-small-tour-planner",
        value: "고객에게 숙소 후보와 실제 결제액을 제안하는 1인 여행 기획자",
        detail:
          "예약 사이트마다 다른 객실 이름과 포함 조건을 맞춰 설명 가능한 비교표를 만듭니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-hotel-payment",
        value: "호텔 예약의 결제 버튼을 누르기 직전",
        detail:
          "다른 사이트의 같은 방이 세금까지 포함해 정말 더 싼지 마지막으로 확인해야 하는 순간",
      },
      {
        id: "moment-cancellation-condition-needed",
        value: "일정 변경 가능성이 생겨 무료 취소 객실만 다시 비교할 때",
        detail:
          "가격이 싸도 취소·선결제 조건이 다른 방을 같은 상품처럼 고르면 안 되는 순간",
      },
      {
        id: "moment-before-sharing-hotel-options",
        value: "동행자·상사·고객에게 숙소 두 안을 보내기 10분 전",
        detail:
          "사이트별 표시 가격이 아니라 실제 결제액과 조건 차이를 한 장으로 설명해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-two-open-tabs-only",
        kind: "remove",
        value:
          "여러 예약 사이트 자동 탐색을 빼고 사용자가 연 호텔 객실 탭 두 개만 비교하기",
        detail:
          "같은 객실 가격을 맞추는 흐름은 유지하고 첫 MVP의 외부 수집 범위를 두 페이지로 줄입니다.",
        resultTitle: "호텔 탭 2개의 실제 결제액 비교",
        platform: "plugin",
        smallestBuild:
          "열린 호텔 예약 탭 두 개에서 숙소·날짜·객실명·세금·수수료·통화를 읽어 같음·다름과 원화 환산 최종가를 보여주는 읽기 전용 확장 화면",
      },
      {
        id: "twist-total-not-nightly",
        kind: "replace",
        value: "1박 표시 가격을 전체 숙박의 세금·수수료 포함 결제액으로 바꾸기",
        detail:
          "가격 비교는 유지하고 사용자가 실제로 내는 총액을 같은 통화로 맞춥니다.",
        resultTitle: "세금까지 합친 숙박 최종가",
        platform: "plugin",
        smallestBuild:
          "두 예약 페이지의 숙박 일수·표시가·세금·수수료를 읽어 통화 기준 시각과 함께 최종 결제액·차액·더 싼 링크를 보여주는 확장 화면",
      },
      {
        id: "twist-condition-mismatch",
        kind: "add",
        value: "가격 옆에 무료 취소·조식·선결제 조건이 다른 항목 경고 더하기",
        detail:
          "같은 방처럼 보이는 상품을 잘못 비교하지 않도록 조건 근거만 더합니다.",
        resultTitle: "조건이 같은 호텔 가격만 비교한 표",
        platform: "plugin",
        smallestBuild:
          "두 객실 페이지의 날짜·인원·객실명·침대·조식·취소·선결제를 대조해 불일치 항목과 최종가를 원문 위치와 함께 보여주는 확장 화면",
      },
    ],
  },
  {
    id: "next-set-weight-reps",
    source: {
      id: "source-fitnessai",
      sourceName: "Fitness AI Gym Workout Planner",
      research: {
        key: "app_store:1446224156",
        url: "https://apps.apple.com/us/app/fitness-ai-gym-workout-planner/id1446224156?uo=4",
      },
      platform: "app",
      value:
        "지난 운동 이력과 가능한 장비를 바탕으로 다음 운동의 세트·횟수·중량을 계산하는 개인화 훈련 앱",
      detail:
        "직전 세트의 무게·횟수·체감 난이도에 점진적 과부하 규칙을 적용해 지금 할 다음 세트 숫자를 줍니다.",
      evidence:
        "App Store 평점 4.70·리뷰 5.5만+; 590만 운동 기록 기반의 이력 → 세트·횟수·중량 추천 메커니즘 확인",
      preservedFlow:
        "지난 운동 기록 입력 → 고정 증량·회복 규칙 적용 → 다음 세트의 무게·횟수 확인",
    },
    payers: [
      {
        id: "payer-progressive-overload-worker",
        value: "퇴근 후 혼자 웨이트하며 중량을 조금씩 올리는 직장인",
        detail:
          "지난 기록은 남기지만 오늘 같은 운동에서 몇 kg을 올릴지 세트 사이마다 다시 판단합니다.",
      },
      {
        id: "payer-small-pt-coach",
        value: "회원별 다음 중량을 현장에서 빠르게 정하는 1인 PT 코치",
        detail:
          "회원의 지난 수행과 오늘 실패 횟수를 기억해 다음 세트 무게를 구두로 조정합니다.",
      },
      {
        id: "payer-strength-hobbyist",
        value: "스쿼트·벤치·데드리프트 기록을 관리하는 취미 리프터",
        detail:
          "프로그램 표와 실제 수행이 어긋나면 증량·유지·감량 기준을 노트에서 다시 찾습니다.",
      },
    ],
    moments: [
      {
        id: "moment-between-weight-sets",
        value: "한 세트를 끝내고 다음 원판을 끼우기 전 90초",
        detail:
          "직전 횟수와 난이도로 올릴지 유지할지 바로 숫자를 정해야 하는 순간",
      },
      {
        id: "moment-after-missed-reps",
        value: "목표 횟수를 두 번 연속 못 채운 직후",
        detail:
          "무리하게 반복하지 않고 오늘 남은 세트의 중량·횟수를 낮출 기준이 필요한 순간",
      },
      {
        id: "moment-before-next-week-session",
        value: "지난주 운동 기록을 보고 같은 종목을 시작하기 직전",
        detail:
          "지난 수행을 복사하는 대신 이번 주의 작은 증량 목표를 정해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-exercise-next-set",
        kind: "remove",
        value:
          "전체 운동 계획을 빼고 한 종목의 직전 세트에서 다음 세트 하나만 계산하기",
        detail:
          "운동 이력으로 다음 행동을 정하는 흐름은 유지하고 결과를 지금 할 숫자 한 줄로 줄입니다.",
        resultTitle: "직전 세트로 정하는 다음 무게·횟수",
        platform: "web",
        smallestBuild:
          "운동명·직전 무게·횟수·목표 횟수·체감 난이도(1~10)·사용 가능한 원판 단위를 넣으면 고정 규칙에 따른 다음 무게·횟수와 유지 이유 한 줄이 나오는 모바일 웹 화면",
      },
      {
        id: "twist-failure-safety-rule",
        kind: "add",
        value:
          "목표 횟수를 놓친 횟수와 통증 없는 체감 난이도에 감량·종료 조건 한 줄 더하기",
        detail:
          "의료 판단 없이 운동 수행 숫자로 다음 세트를 보수적으로 조정할 기준만 더합니다.",
        resultTitle: "실패 횟수까지 반영한 다음 세트",
        platform: "web",
        smallestBuild:
          "최근 두 세트의 무게·실제 횟수·체감 난이도를 넣으면 유지·2.5kg 감량·오늘 종료 중 하나와 적용된 규칙을 보여주는 웹 화면",
      },
      {
        id: "twist-three-set-card",
        kind: "replace",
        value: "긴 주간 프로그램을 오늘 한 종목의 세 세트 카드로 바꾸기",
        detail:
          "다음 중량 계산은 유지하고 헬스장에서 한 화면으로 끝낼 작은 계획을 줍니다.",
        resultTitle: "오늘 한 종목 3세트 카드",
        platform: "web",
        smallestBuild:
          "지난 운동의 최고 완료 세트와 오늘 목표를 넣으면 워밍업 제외 세 세트의 무게·목표 횟수·세트 사이 조정 조건이 한 카드로 나오는 모바일 웹 화면",
      },
    ],
  },
  {
    id: "interval-video-log",
    source: {
      id: "source-captime",
      sourceName: "Captime",
      research: {
        key: "trustmrr:captime",
        url: "https://trustmrr.com/startup/captime",
      },
      platform: "app",
      value:
        "CrossFit·HIIT 인터벌 타이머와 영상 촬영을 동시에 실행해 세트 시간과 영상을 맞춰 남기는 앱",
      detail:
        "운동·휴식 구간을 설정하고 촬영하면 영상에 세트 번호와 경과 시간이 붙고 구간별 기록으로 나뉩니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $673·성장 81%; 인터벌 설정 → 타이머·영상 동시 기록 → 세트별 영상·시간표 메커니즘 확인",
      preservedFlow:
        "운동·휴식 구간 입력 → 타이머와 카메라 동시 실행 → 세트 번호·시간이 맞은 영상 확인",
    },
    payers: [
      {
        id: "payer-crossfit-self-review",
        value: "혼자 WOD 기록과 동작 영상을 함께 남기는 CrossFit·HIIT 운동자",
        detail:
          "타이머와 카메라를 따로 켜서 영상에서 각 라운드가 시작된 시점을 다시 찾습니다.",
      },
      {
        id: "payer-remote-fitness-coach",
        value: "회원이 보낸 인터벌 영상을 비대면으로 피드백하는 코치",
        detail:
          "긴 영상에서 어떤 세트가 몇 초였는지 찾아 메모한 뒤 회원에게 다시 설명합니다.",
      },
      {
        id: "payer-small-box-operator",
        value: "소형 체육관의 기록 측정·챌린지를 운영하는 코치",
        detail:
          "여러 참가자의 타이머 화면과 촬영 영상을 맞춰 기록 증거를 정리합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-interval-start",
        value:
          "인터벌 운동을 시작하기 30초 전 타이머와 카메라를 함께 켜야 할 때",
        detail:
          "운동 흐름을 끊지 않고 한 버튼으로 시간과 영상을 남겨야 하는 순간",
      },
      {
        id: "moment-after-pr-attempt",
        value: "기록 갱신을 시도한 세션이 끝난 직후",
        detail:
          "어느 라운드에서 시간이 늘었고 영상의 어디를 봐야 하는지 바로 확인해야 하는 순간",
      },
      {
        id: "moment-before-sending-coach-video",
        value: "원격 코치에게 오늘 운동 영상을 보내기 직전",
        detail:
          "긴 원본 대신 세트 번호·시간이 보이는 구간만 골라 전달해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-one-timer-video",
        kind: "remove",
        value:
          "운동 라이브러리와 장기 기록을 빼고 인터벌 타이머 한 개와 영상 한 편만 함께 기록하기",
        detail:
          "시간과 영상을 맞추는 흐름은 유지하고 이 기기의 카메라 권한 한 번으로 줄입니다.",
        resultTitle: "타이머가 찍힌 인터벌 운동 영상",
        platform: "web",
        smallestBuild:
          "운동·휴식 초와 라운드 수를 정하고 이 기기의 카메라를 허용하면 세트 번호·남은 시간이 표시된 영상이 기기에 저장되는 모바일 웹 화면",
      },
      {
        id: "twist-auto-split-rounds",
        kind: "replace",
        value:
          "긴 촬영 파일을 라운드별 시작·끝이 맞은 짧은 영상으로 자동 나누기",
        detail:
          "타이머 구간 정보는 유지하고 다시 볼 결과를 세트별 클립으로 바꿉니다.",
        resultTitle: "라운드별로 잘린 운동 영상",
        platform: "web",
        smallestBuild:
          "타이머와 함께 녹화한 영상을 운동 구간 기준으로 자동 분할해 라운드 번호·걸린 시간·재생 링크 목록으로 보여주는 웹 화면",
      },
      {
        id: "twist-round-time-drift",
        kind: "add",
        value:
          "라운드가 진행될수록 늘어난 운동·휴식 시간과 가장 느린 구간 표시 더하기",
        detail:
          "세트별 영상 기록에 자세 분석 없이 타이머가 이미 가진 구간별 시간 변화만 더합니다.",
        resultTitle: "라운드별 시간 변화표와 영상 구간",
        platform: "web",
        smallestBuild:
          "분할된 라운드마다 운동·휴식 실제 시간·첫 라운드 대비 차이·가장 느린 구간과 해당 영상 재생 위치를 표로 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "sheet-to-apps-script-form",
    source: {
      id: "source-okegas",
      sourceName: "OKEGAS",
      research: {
        key: "chrome_web_store:dcgkppjnoahdcpelmbgikielfklkiiam",
        url: "https://chromewebstore.google.com/detail/okegas/dcgkppjnoahdcpelmbgikielfklkiiam",
      },
      platform: "plugin",
      value:
        "Google Apps Script용 AI·템플릿·미리보기·배포를 묶어 구글 워크스페이스 앱을 만드는 도구",
      detail:
        "구글 시트 열을 읽어 데이터를 추가하는 입력 폼의 HTML·Apps Script 코드·배포 설정과 미리보기를 만듭니다.",
      evidence:
        "Chrome Web Store 평점 5.0·생산성 개발자 카테고리 1위; 요구·템플릿 → Apps Script 생성·미리보기 → 게시 메커니즘 확인",
      preservedFlow:
        "구글 시트 구조 입력 → Apps Script 폼·저장 코드 생성 → 미리보기·배포 결과 확인",
    },
    payers: [
      {
        id: "payer-sheet-ops-manager",
        value: "구글 시트로 재고·요청·검수 기록을 운영하는 소형 팀 운영자",
        detail:
          "팀원이 시트를 직접 편집하다 열을 지우거나 형식을 바꾸어 입력 화면을 따로 만들고 싶어 합니다.",
      },
      {
        id: "payer-class-admin-sheet",
        value: "수업 출결·과제·상담 기록을 시트로 관리하는 강사·교육 운영자",
        detail:
          "Google Forms로는 기존 행 수정과 조건별 입력이 어려워 Apps Script 예제를 찾아 붙입니다.",
      },
      {
        id: "payer-smartstore-backoffice",
        value: "스마트스토어 상품·문의·발송 예외를 시트로 정리하는 1인 셀러",
        detail:
          "반복 입력을 직원에게 맡기기 위해 필요한 칸만 보이는 내부 폼을 당일 만들어야 합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-team-sheet-use",
        value: "내일부터 팀원이 운영 시트를 함께 쓰기 시작하는 오후",
        detail:
          "원본 시트를 망치지 않고 필요한 값만 넣는 화면을 오늘 배포해야 하는 순간",
      },
      {
        id: "moment-forms-not-enough",
        value: "Google Forms로는 기존 행 수정·조회가 안 된다는 걸 확인한 직후",
        detail:
          "새 SaaS를 도입하지 않고 현재 시트에 붙는 작은 입력 앱이 필요한 순간",
      },
      {
        id: "moment-after-sheet-input-error",
        value: "팀원이 열을 잘못 지워 운영 데이터가 깨진 직후",
        detail:
          "시트 직접 편집을 막고 필수값·선택값을 검사하는 입력 화면으로 바꿔야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-header-to-insert-form",
        kind: "remove",
        value: "범용 AI 앱 빌더를 빼고 시트 한 장의 새 행 추가 폼만 만들기",
        detail:
          "Apps Script 생성·게시 흐름은 유지하고 CRUD 전체를 입력 1회로 줄입니다.",
        resultTitle: "시트 열로 만드는 새 행 입력 폼",
        platform: "web",
        smallestBuild:
          "구글 시트의 열 머리글 한 줄을 복사해 붙이면 텍스트·숫자·날짜 입력 HTML과 doGet·appendRow Apps Script 코드·붙여넣을 파일 위치가 나오는 웹 화면",
      },
      {
        id: "twist-required-dropdown-inference",
        kind: "add",
        value: "머리글 아래 예시값에서 필수칸·숫자·날짜·선택목록 제안 더하기",
        detail:
          "코드 생성에 잘못된 입력을 막을 필드 규칙과 사용자의 최종 확인만 더합니다.",
        resultTitle: "필수값·선택목록이 잡힌 시트 입력 폼",
        platform: "web",
        smallestBuild:
          "시트 열과 예시 행 최대 다섯 개를 읽어 필드 유형·필수 여부·선택값을 제안하고 수정 후 폼·Apps Script 코드를 만드는 웹 화면",
      },
      {
        id: "twist-preview-deploy-check",
        kind: "replace",
        value: "긴 코드 설명을 실제 입력 미리보기와 5단계 배포 체크로 바꾸기",
        detail:
          "생성한 Apps Script를 사용자가 배포까지 닫는 흐름은 유지하고 결과를 실행 순서로 바꿉니다.",
        resultTitle: "미리 보고 배포하는 시트 입력 앱",
        platform: "web",
        smallestBuild:
          "시트 필드로 생성한 입력 화면을 브라우저에서 미리 보고 테스트 행을 확인한 뒤 Apps Script 파일명·권한·웹 앱 배포·접근 범위·테스트 URL 체크를 받는 웹 화면",
      },
    ],
  },
  {
    id: "short-video-policy-preflight",
    source: {
      id: "source-noviolation",
      sourceName: "NoViolation",
      research: {
        key: "trustmrr:noviolation",
        url: "https://trustmrr.com/startup/noviolation",
      },
      platform: "web",
      value:
        "숏폼 영상을 게시하기 전에 음성·자막·화면을 플랫폼 규칙과 대조해 위반 가능성을 알려주는 사전 검사 도구",
      detail:
        "짧은 영상 한 편을 올리면 문제가 될 수 있는 정확한 초·규칙 이유·수정 전 확인표를 보여줍니다.",
      evidence:
        "TrustMRR 최근 30일 매출 $326·성장 27%; 영상 업로드 → 음성·화면 규칙 스캔 → 위험 구간·이유 확인 메커니즘 확인",
      preservedFlow:
        "게시 전 숏폼 영상 입력 → 플랫폼 규칙과 음성·화면 대조 → 위험 초·이유·수정 체크 확인",
    },
    payers: [
      {
        id: "payer-daily-short-creator",
        value: "TikTok·릴스·쇼츠를 거의 매일 올리는 1인 크리에이터",
        detail:
          "경고를 받은 뒤에도 어떤 단어·화면이 문제였는지 몰라 게시 전 영상을 처음부터 다시 봅니다.",
      },
      {
        id: "payer-shortform-agency-editor",
        value: "여러 브랜드의 숏폼 납품을 검수하는 소형 영상 대행사 편집자",
        detail:
          "플랫폼별 금지 표현과 화면 요소를 체크리스트로 대조하며 마감 직전 재편집합니다.",
      },
      {
        id: "payer-commerce-video-marketer",
        value:
          "제품 효능·가격 문구가 들어간 숏폼 광고를 직접 올리는 소형 쇼핑몰 마케터",
        detail:
          "과장 표현이나 민감한 화면이 광고 심사에서 막힐까 여러 담당자에게 다시 묻습니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-short-upload",
        value: "완성한 숏폼을 업로드하기 10분 전",
        detail:
          "영상 전체를 다시 보지 않고 고칠 가능성이 큰 초와 이유만 확인해야 하는 순간",
      },
      {
        id: "moment-after-platform-strike",
        value: "이전 영상이 경고·제한을 받은 다음 게시물 제작 직후",
        detail:
          "같은 유형의 표현·화면을 반복하지 않았는지 근거와 함께 점검해야 하는 순간",
      },
      {
        id: "moment-before-sponsored-deadline",
        value: "스폰서 영상 납품 마감이 한 시간 남은 때",
        detail:
          "막연히 안전하다고 말하지 않고 수정할 구간과 확인한 규칙을 고객에게 보여줘야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-caption-one-rule-pack",
        kind: "remove",
        value:
          "모든 플랫폼·영상 요소를 빼고 자막 파일을 한 플랫폼의 금지 표현 규칙 하나와 대조하기",
        detail:
          "게시 전 규칙 검사는 유지하고 영상 분석 없이 시간표시 자막으로 시작합니다.",
        resultTitle: "숏폼 자막의 위험 표현 타임라인",
        platform: "web",
        smallestBuild:
          "SRT·VTT 파일과 플랫폼·규칙 묶음 하나를 고르면 위험 문장·정확한 초·규칙 원문·검토 필요 표시가 나오는 웹 화면",
      },
      {
        id: "twist-audio-frame-evidence",
        kind: "add",
        value: "위험 판정마다 음성 원문·대표 프레임·규칙 원문 근거 붙이기",
        detail:
          "자동 판정을 믿게 하는 것이 아니라 사용자가 직접 확인할 세 가지 근거만 더합니다.",
        resultTitle: "근거를 눌러 확인하는 숏폼 위험 구간",
        platform: "web",
        smallestBuild:
          "60초 이하 영상 한 편을 넣으면 위험 후보 최대 다섯 개에 타임스탬프·자막/음성 원문·대표 프레임·규칙 원문과 오분류 표시가 붙는 웹 화면",
      },
      {
        id: "twist-three-edit-checks",
        kind: "replace",
        value: "안전 점수를 게시 전 고칠 세 구간과 수정 확인표로 바꾸기",
        detail:
          "규칙 대조는 유지하고 책임을 과장하는 점수 대신 편집자가 닫을 작업을 줍니다.",
        resultTitle: "게시 전 고칠 숏폼 구간 3개",
        platform: "web",
        smallestBuild:
          "60초 이하 영상과 내장된 플랫폼 규칙 묶음 하나를 고르면 위험도가 높은 구간 최대 세 개의 초·이유·규칙 원문·규칙 갱신일·사용자 제외·수정 후 재검사 결과가 나오는 웹 화면",
      },
    ],
  },
  {
    id: "candidate-youtube-transcript-dev-extract-download-video-tr",
    source: {
      id: "source-youtube-transcript-dev-extract-download-video-tr",
      sourceName:
        "Youtube Transcript Dev | Extract & Download Video Transcripts",
      research: {
        key: "trustmrr:youtube-transcript-dev-extract-download-video-transcripts",
        url: "https://trustmrr.com/startup/youtube-transcript-dev-extract-download-video-transcripts",
      },
      platform: "web",
      value:
        "구체적인 입력: 유튜브 영상 URL. 핵심 처리: 오디오 기반 전사 후 구조화.",
      detail:
        "즉시 결과: 다운로드 가능한 전사·마인드맵 파일. 필요한 순간: 자막 없는 영상 내용을 텍스트로 남기고 싶은 순간.",
      evidence:
        "검증된 해외 원본: Youtube Transcript Dev | Extract & Download Video Transcripts (claude_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 유튜브 영상 URL. → 핵심 처리: 오디오 기반 전사 후 구조화. → 즉시 결과: 다운로드 가능한 전사·마인드맵 파일.",
    },
    payers: [
      {
        id: "payer-youtube-transcript-dev-extract-download-video-tr-0",
        value: "유튜브 강의를 복습하는 대학생",
        detail:
          "유튜브 강의를 복습하는 대학생이 자막 없는 영상을 글로 남길 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-youtube-transcript-dev-extract-download-video-tr-1",
        value: "영상 내용을 정리하는 콘텐츠 기획자",
        detail:
          "영상 내용을 정리하는 콘텐츠 기획자가 긴 강의의 핵심을 다시 찾을 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-youtube-transcript-dev-extract-download-video-tr-2",
        value: "자막 없는 해외 강의를 보는 직장인",
        detail:
          "자막 없는 해외 강의를 보는 직장인이 영상 내용을 문서로 공유할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-youtube-transcript-dev-extract-download-video-tr-0",
        value: "자막 없는 영상을 글로 남길 때",
        detail:
          "자막 없는 영상을 글로 남길 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-youtube-transcript-dev-extract-download-video-tr-1",
        value: "긴 강의의 핵심을 다시 찾을 때",
        detail:
          "긴 강의의 핵심을 다시 찾을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-youtube-transcript-dev-extract-download-video-tr-2",
        value: "영상 내용을 문서로 공유할 때",
        detail:
          "영상 내용을 문서로 공유할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-youtube-transcript-dev-extract-download-video-tr-0",
        kind: "replace",
        value: "한국어 전사와 원문 전사를 선택해 다운로드",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국어 전사와 원문 전사를 선택해 다운로드만 적용합니다.",
        resultTitle: "한국어 전사와 원문 전사를 선택해 다운로드",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 유튜브 영상 URL.를 넣으면 한국어 전사와 원문 전사를 선택해 다운로드 후 즉시 결과: 다운로드 가능한 전사·마인드맵 파일.",
      },
      {
        id: "twist-youtube-transcript-dev-extract-download-video-tr-1",
        kind: "add",
        value: "영상 URL 하나로 TXT 전사 파일만 먼저 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 영상 URL 하나로 TXT 전사 파일만 먼저 제공만 적용합니다.",
        resultTitle: "영상 URL 하나로 TXT 전사 파일만 먼저 제공",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 유튜브 영상 URL.를 넣으면 영상 URL 하나로 TXT 전사 파일만 먼저 제공 후 즉시 결과: 다운로드 가능한 전사·마인드맵 파일.",
      },
      {
        id: "twist-youtube-transcript-dev-extract-download-video-tr-2",
        kind: "remove",
        value: "전사문을 문단별 타임스탬프와 함께 정리",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 전사문을 문단별 타임스탬프와 함께 정리만 적용합니다.",
        resultTitle: "전사문을 문단별 타임스탬프와 함께 정리",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 유튜브 영상 URL.를 넣으면 전사문을 문단별 타임스탬프와 함께 정리 후 즉시 결과: 다운로드 가능한 전사·마인드맵 파일.",
      },
    ],
  },
  {
    id: "candidate-photogenius",
    source: {
      id: "source-photogenius",
      sourceName: "PhotoGenius",
      research: {
        key: "trustmrr:photogenius",
        url: "https://trustmrr.com/startup/photogenius",
      },
      platform: "web",
      value: "구체적인 입력: 오래된 사진 파일. 핵심 처리: 사진 보정·복원.",
      detail:
        "즉시 결과: 보정·복원된 사진. 필요한 순간: 오래된 사진 확인 순간.",
      evidence:
        "검증된 해외 원본: PhotoGenius (codex_cli_structured_fail_rereview)",
      preservedFlow:
        "구체적인 입력: 오래된 사진 파일. → 핵심 처리: 사진 보정·복원. → 즉시 결과: 보정·복원된 사진.",
    },
    payers: [
      {
        id: "payer-photogenius-0",
        value: "부모님 옛 사진을 정리하는 자녀",
        detail:
          "부모님 옛 사진을 정리하는 자녀가 앨범 속 흐릿한 사진을 발견했을 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-photogenius-1",
        value: "가족사진을 보관하는 중년 부부",
        detail:
          "가족사진을 보관하는 중년 부부가 기념일 선물로 옛 사진을 준비할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-photogenius-2",
        value: "동네 사진관을 운영하는 사장",
        detail:
          "동네 사진관을 운영하는 사장이 인화 전에 오래된 사진을 선명하게 만들 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-photogenius-0",
        value: "앨범 속 흐릿한 사진을 발견했을 때",
        detail:
          "앨범 속 흐릿한 사진을 발견했을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-photogenius-1",
        value: "기념일 선물로 옛 사진을 준비할 때",
        detail:
          "기념일 선물로 옛 사진을 준비할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-photogenius-2",
        value: "인화 전에 오래된 사진을 선명하게 만들 때",
        detail:
          "인화 전에 오래된 사진을 선명하게 만들 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-photogenius-0",
        kind: "replace",
        value: "흑백 사진을 따뜻한 색감으로 복원하는 버튼 추가",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 흑백 사진을 따뜻한 색감으로 복원하는 버튼 추가만 적용합니다.",
        resultTitle: "흑백 사진을 따뜻한 색감으로 복원하는 버튼 추가",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 오래된 사진 파일.를 넣으면 흑백 사진을 따뜻한 색감으로 복원하는 버튼 추가 후 즉시 결과: 보정·복원된 사진.",
      },
      {
        id: "twist-photogenius-1",
        kind: "add",
        value: "얼굴 복원 강도를 약·중·강 세 단계로 제한",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 얼굴 복원 강도를 약·중·강 세 단계로 제한만 적용합니다.",
        resultTitle: "얼굴 복원 강도를 약·중·강 세 단계로 제한",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 오래된 사진 파일.를 넣으면 얼굴 복원 강도를 약·중·강 세 단계로 제한 후 즉시 결과: 보정·복원된 사진.",
      },
      {
        id: "twist-photogenius-2",
        kind: "remove",
        value: "복원 전후를 한 화면에서 비교하는 한국어 결과 카드",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 복원 전후를 한 화면에서 비교하는 한국어 결과 카드만 적용합니다.",
        resultTitle: "복원 전후를 한 화면에서 비교하는 한국어 결과 카드",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 오래된 사진 파일.를 넣으면 복원 전후를 한 화면에서 비교하는 한국어 결과 카드 후 즉시 결과: 보정·복원된 사진.",
      },
    ],
  },
  {
    id: "candidate-mockly",
    source: {
      id: "source-mockly",
      sourceName: "Mockly",
      research: {
        key: "trustmrr:mockly",
        url: "https://trustmrr.com/startup/mockly",
      },
      platform: "web",
      value: "구체적인 입력: 채팅 대화 내용. 핵심 처리: 대화 화면 목업 생성.",
      detail: "즉시 결과: 현실적인 대화 스크린샷. 필요한 순간: 시안 제작 중.",
      evidence:
        "검증된 해외 원본: Mockly (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 채팅 대화 내용. → 핵심 처리: 대화 화면 목업 생성. → 즉시 결과: 현실적인 대화 스크린샷.",
    },
    payers: [
      {
        id: "payer-mockly-0",
        value: "앱 화면을 만드는 UX 디자이너",
        detail:
          "앱 화면을 만드는 UX 디자이너가 채팅 기능 시안을 발표하기 직전에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-mockly-1",
        value: "신제품 소개 자료를 만드는 마케터",
        detail:
          "신제품 소개 자료를 만드는 마케터가 앱스토어 소개 이미지를 만들 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-mockly-2",
        value: "고객 시나리오를 시연하는 기획자",
        detail:
          "고객 시나리오를 시연하는 기획자가 기획서에 대화 사례를 넣을 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-mockly-0",
        value: "채팅 기능 시안을 발표하기 직전",
        detail:
          "채팅 기능 시안을 발표하기 직전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-mockly-1",
        value: "앱스토어 소개 이미지를 만들 때",
        detail:
          "앱스토어 소개 이미지를 만들 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-mockly-2",
        value: "기획서에 대화 사례를 넣을 때",
        detail:
          "기획서에 대화 사례를 넣을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-mockly-0",
        kind: "replace",
        value: "카카오톡처럼 익숙한 한국형 말풍선 테마 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 카카오톡처럼 익숙한 한국형 말풍선 테마 제공만 적용합니다.",
        resultTitle: "카카오톡처럼 익숙한 한국형 말풍선 테마 제공",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 채팅 대화 내용.를 넣으면 카카오톡처럼 익숙한 한국형 말풍선 테마 제공 후 즉시 결과: 현실적인 대화 스크린샷.",
      },
      {
        id: "twist-mockly-1",
        kind: "add",
        value: "대화 내용을 붙여넣으면 스마트폰 목업 한 장 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 대화 내용을 붙여넣으면 스마트폰 목업 한 장 생성만 적용합니다.",
        resultTitle: "대화 내용을 붙여넣으면 스마트폰 목업 한 장 생성",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 채팅 대화 내용.를 넣으면 대화 내용을 붙여넣으면 스마트폰 목업 한 장 생성 후 즉시 결과: 현실적인 대화 스크린샷.",
      },
      {
        id: "twist-mockly-2",
        kind: "remove",
        value: "시간·읽음 표시만 조절하는 초간단 채팅 화면 제작",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 시간·읽음 표시만 조절하는 초간단 채팅 화면 제작만 적용합니다.",
        resultTitle: "시간·읽음 표시만 조절하는 초간단 채팅 화면 제작",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 채팅 대화 내용.를 넣으면 시간·읽음 표시만 조절하는 초간단 채팅 화면 제작 후 즉시 결과: 현실적인 대화 스크린샷.",
      },
    ],
  },
  {
    id: "candidate-backdropboost",
    source: {
      id: "source-backdropboost",
      sourceName: "BackdropBoost",
      research: {
        key: "trustmrr:backdropboost",
        url: "https://trustmrr.com/startup/backdropboost",
      },
      platform: "web",
      value:
        "구체적인 입력: 상품 사진. 핵심 처리: 상품 배경을 생활 장면으로 변환.",
      detail:
        "즉시 결과: 전자상거래용 생활 배경 이미지. 필요한 순간: 상품 이미지를 만들 때.",
      evidence:
        "검증된 해외 원본: BackdropBoost (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 상품 사진. → 핵심 처리: 상품 배경을 생활 장면으로 변환. → 즉시 결과: 전자상거래용 생활 배경 이미지.",
    },
    payers: [
      {
        id: "payer-backdropboost-0",
        value: "온라인 쇼핑몰 상품 등록자",
        detail:
          "온라인 쇼핑몰 상품 등록자가 상품 상세페이지 사진이 부족할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-backdropboost-1",
        value: "인스타그램 광고를 만드는 소상공인",
        detail:
          "인스타그램 광고를 만드는 소상공인이 광고용 생활 연출 컷이 필요할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-backdropboost-2",
        value: "제품 사진이 부족한 1인 브랜드 대표",
        detail:
          "제품 사진이 부족한 1인 브랜드 대표가 흰 배경 상품을 분위기 있게 보이고 싶을 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-backdropboost-0",
        value: "상품 상세페이지 사진이 부족할 때",
        detail:
          "상품 상세페이지 사진이 부족할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-backdropboost-1",
        value: "광고용 생활 연출 컷이 필요할 때",
        detail:
          "광고용 생활 연출 컷이 필요할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-backdropboost-2",
        value: "흰 배경 상품을 분위기 있게 보이고 싶을 때",
        detail:
          "흰 배경 상품을 분위기 있게 보이고 싶을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-backdropboost-0",
        kind: "replace",
        value: "한국 쇼핑몰용 주방·거실·카페 배경 세 가지 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 쇼핑몰용 주방·거실·카페 배경 세 가지 제공만 적용합니다.",
        resultTitle: "한국 쇼핑몰용 주방·거실·카페 배경 세 가지 제공",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 상품 사진.를 넣으면 한국 쇼핑몰용 주방·거실·카페 배경 세 가지 제공 후 즉시 결과: 전자상거래용 생활 배경 이미지.",
      },
      {
        id: "twist-backdropboost-1",
        kind: "add",
        value: "상품 사진 한 장과 배경 장면 하나만 선택해 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 상품 사진 한 장과 배경 장면 하나만 선택해 생성만 적용합니다.",
        resultTitle: "상품 사진 한 장과 배경 장면 하나만 선택해 생성",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 상품 사진.를 넣으면 상품 사진 한 장과 배경 장면 하나만 선택해 생성 후 즉시 결과: 전자상거래용 생활 배경 이미지.",
      },
      {
        id: "twist-backdropboost-2",
        kind: "remove",
        value: "제품은 유지하고 주변 배경만 생활 장면으로 교체",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 제품은 유지하고 주변 배경만 생활 장면으로 교체만 적용합니다.",
        resultTitle: "제품은 유지하고 주변 배경만 생활 장면으로 교체",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 상품 사진.를 넣으면 제품은 유지하고 주변 배경만 생활 장면으로 교체 후 즉시 결과: 전자상거래용 생활 배경 이미지.",
      },
    ],
  },
  {
    id: "candidate-tariffsapi",
    source: {
      id: "source-tariffsapi",
      sourceName: "TariffsAPI",
      research: {
        key: "trustmrr:tariffsapi",
        url: "https://trustmrr.com/startup/tariffsapi",
      },
      platform: "web",
      value:
        "구체적인 입력: international imports and exports data query. 핵심 처리: retrieve tariff data through an API.",
      detail:
        "즉시 결과: real-time import and export data. 필요한 순간: real-time access to tariff data.",
      evidence:
        "검증된 해외 원본: TariffsAPI (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: international imports and exports data query. → 핵심 처리: retrieve tariff data through an API. → 즉시 결과: real-time import and export data.",
    },
    payers: [
      {
        id: "payer-tariffsapi-0",
        value: "수입 상품을 다루는 온라인 셀러",
        detail:
          "수입 상품을 다루는 온라인 셀러가 해외 상품의 관세율을 확인할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-tariffsapi-1",
        value: "무역 서류를 확인하는 중소기업 담당자",
        detail:
          "무역 서류를 확인하는 중소기업 담당자가 수입 견적을 계산하기 직전에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-tariffsapi-2",
        value: "관세 데이터를 조회하는 무역 컨설턴트",
        detail:
          "관세 데이터를 조회하는 무역 컨설턴트가 국가와 품목별 무역 데이터를 조회할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-tariffsapi-0",
        value: "해외 상품의 관세율을 확인할 때",
        detail:
          "해외 상품의 관세율을 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-tariffsapi-1",
        value: "수입 견적을 계산하기 직전",
        detail:
          "수입 견적을 계산하기 직전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-tariffsapi-2",
        value: "국가와 품목별 무역 데이터를 조회할 때",
        detail:
          "국가와 품목별 무역 데이터를 조회할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-tariffsapi-0",
        kind: "replace",
        value: "한국 수입자가 자주 찾는 국가·품목 코드 예시 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 수입자가 자주 찾는 국가·품목 코드 예시 제공만 적용합니다.",
        resultTitle: "한국 수입자가 자주 찾는 국가·품목 코드 예시 제공",
        platform: "web",
        smallestBuild:
          "구체적인 입력: international imports and exports data query.를 넣으면 한국 수입자가 자주 찾는 국가·품목 코드 예시 제공 후 즉시 결과: real-time import and export data.",
      },
      {
        id: "twist-tariffsapi-1",
        kind: "add",
        value: "질의 결과에 국가·품목·관세율만 간결하게 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 질의 결과에 국가·품목·관세율만 간결하게 표시만 적용합니다.",
        resultTitle: "질의 결과에 국가·품목·관세율만 간결하게 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: international imports and exports data query.를 넣으면 질의 결과에 국가·품목·관세율만 간결하게 표시 후 즉시 결과: real-time import and export data.",
      },
      {
        id: "twist-tariffsapi-2",
        kind: "remove",
        value: "API 응답을 한국어 표와 JSON 두 형식으로 반환",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 API 응답을 한국어 표와 JSON 두 형식으로 반환만 적용합니다.",
        resultTitle: "API 응답을 한국어 표와 JSON 두 형식으로 반환",
        platform: "web",
        smallestBuild:
          "구체적인 입력: international imports and exports data query.를 넣으면 API 응답을 한국어 표와 JSON 두 형식으로 반환 후 즉시 결과: real-time import and export data.",
      },
    ],
  },
  {
    id: "candidate-casora",
    source: {
      id: "source-casora",
      sourceName: "Casora",
      research: {
        key: "trustmrr:casora",
        url: "https://trustmrr.com/startup/casora",
      },
      platform: "web",
      value:
        "구체적인 입력: room photo. 핵심 처리: redesign rooms with different styles, layouts, colors, and ideas.",
      detail:
        "즉시 결과: redesigned room. 필요한 순간: before changing anything in real life.",
      evidence:
        "검증된 해외 원본: Casora (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: room photo. → 핵심 처리: redesign rooms with different styles, layouts, colors, and ideas. → 즉시 결과: redesigned room.",
    },
    payers: [
      {
        id: "payer-casora-0",
        value: "원룸 인테리어를 바꾸려는 자취생",
        detail:
          "원룸 인테리어를 바꾸려는 자취생이 가구를 사기 전에 방 분위기를 볼 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-casora-1",
        value: "집 꾸미기 상담을 하는 인테리어 디자이너",
        detail:
          "집 꾸미기 상담을 하는 인테리어 디자이너가 벽지와 바닥 색을 고를 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-casora-2",
        value: "신혼집 스타일을 고르는 예비부부",
        detail:
          "신혼집 스타일을 고르는 예비부부가 가족에게 인테리어 안을 보여줄 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-casora-0",
        value: "가구를 사기 전에 방 분위기를 볼 때",
        detail:
          "가구를 사기 전에 방 분위기를 볼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-casora-1",
        value: "벽지와 바닥 색을 고를 때",
        detail:
          "벽지와 바닥 색을 고를 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-casora-2",
        value: "가족에게 인테리어 안을 보여줄 때",
        detail:
          "가족에게 인테리어 안을 보여줄 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-casora-0",
        kind: "replace",
        value: "한국 원룸 사진에 맞춘 북유럽·호텔·내추럴 프리셋",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 원룸 사진에 맞춘 북유럽·호텔·내추럴 프리셋만 적용합니다.",
        resultTitle: "한국 원룸 사진에 맞춘 북유럽·호텔·내추럴 프리셋",
        platform: "web",
        smallestBuild:
          "구체적인 입력: room photo.를 넣으면 한국 원룸 사진에 맞춘 북유럽·호텔·내추럴 프리셋 후 즉시 결과: redesigned room.",
      },
      {
        id: "twist-casora-1",
        kind: "add",
        value: "방 사진에 색상 하나만 바꿔 세 가지 결과 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 방 사진에 색상 하나만 바꿔 세 가지 결과 생성만 적용합니다.",
        resultTitle: "방 사진에 색상 하나만 바꿔 세 가지 결과 생성",
        platform: "web",
        smallestBuild:
          "구체적인 입력: room photo.를 넣으면 방 사진에 색상 하나만 바꿔 세 가지 결과 생성 후 즉시 결과: redesigned room.",
      },
      {
        id: "twist-casora-2",
        kind: "remove",
        value: "가구를 실제로 바꾸기 전 전후 이미지를 나란히 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 가구를 실제로 바꾸기 전 전후 이미지를 나란히 표시만 적용합니다.",
        resultTitle: "가구를 실제로 바꾸기 전 전후 이미지를 나란히 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: room photo.를 넣으면 가구를 실제로 바꾸기 전 전후 이미지를 나란히 표시 후 즉시 결과: redesigned room.",
      },
    ],
  },
  {
    id: "candidate-todo",
    source: {
      id: "source-todo",
      sourceName: "微笑Todo-自律计划和时间打卡",
      research: {
        key: "app_store:1551532207",
        url: "https://apps.apple.com/kr/app/%E5%BE%AE%E7%AC%91todo-%E8%87%AA%E5%BE%8B%E8%AE%A1%E5%88%92%E5%92%8C%E6%97%B6%E9%97%B4%E6%89%93%E5%8D%A1/id1551532207?uo=4",
      },
      platform: "app",
      value: "구체적인 입력: 하루 활동과 습관. 핵심 처리: 일일 습관 완료 기록.",
      detail:
        "즉시 결과: 오늘의 완료 표시와 기록. 필요한 순간: 매일의 습관 펀치.",
      evidence:
        "검증된 해외 원본: 微笑Todo-自律计划和时间打卡 (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 하루 활동과 습관. → 핵심 처리: 일일 습관 완료 기록. → 즉시 결과: 오늘의 완료 표시와 기록.",
    },
    payers: [
      {
        id: "payer-todo-0",
        value: "매일 중국어를 공부하는 직장인",
        detail:
          "매일 중국어를 공부하는 직장인이 오늘 습관을 완료하고 체크할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-todo-1",
        value: "운동 루틴을 지키려는 대학생",
        detail:
          "운동 루틴을 지키려는 대학생이 일주일 실천률을 돌아볼 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-todo-2",
        value: "아침 습관을 만들려는 취업준비생",
        detail:
          "아침 습관을 만들려는 취업준비생이 잠들기 전 하루 기록을 남길 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-todo-0",
        value: "오늘 습관을 완료하고 체크할 때",
        detail:
          "오늘 습관을 완료하고 체크할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-todo-1",
        value: "일주일 실천률을 돌아볼 때",
        detail:
          "일주일 실천률을 돌아볼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-todo-2",
        value: "잠들기 전 하루 기록을 남길 때",
        detail:
          "잠들기 전 하루 기록을 남길 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-todo-0",
        kind: "replace",
        value: "한국 직장인용 출근·공부·운동 습관 템플릿 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 직장인용 출근·공부·운동 습관 템플릿 제공만 적용합니다.",
        resultTitle: "한국 직장인용 출근·공부·운동 습관 템플릿 제공",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 하루 활동과 습관.를 넣으면 한국 직장인용 출근·공부·운동 습관 템플릿 제공 후 즉시 결과: 오늘의 완료 표시와 기록.",
      },
      {
        id: "twist-todo-1",
        kind: "add",
        value: "완료율 60% 달성 시 오늘의 미소 카드 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 완료율 60% 달성 시 오늘의 미소 카드 생성만 적용합니다.",
        resultTitle: "완료율 60% 달성 시 오늘의 미소 카드 생성",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 하루 활동과 습관.를 넣으면 완료율 60% 달성 시 오늘의 미소 카드 생성 후 즉시 결과: 오늘의 완료 표시와 기록.",
      },
      {
        id: "twist-todo-2",
        kind: "remove",
        value: "습관을 오른쪽으로 밀면 완료되는 한 손 기록 화면",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 습관을 오른쪽으로 밀면 완료되는 한 손 기록 화면만 적용합니다.",
        resultTitle: "습관을 오른쪽으로 밀면 완료되는 한 손 기록 화면",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 하루 활동과 습관.를 넣으면 습관을 오른쪽으로 밀면 완료되는 한 손 기록 화면 후 즉시 결과: 오늘의 완료 표시와 기록.",
      },
    ],
  },
  {
    id: "candidate-tickoff",
    source: {
      id: "source-tickoff",
      sourceName: "습관 트래커 - TickOff",
      research: {
        key: "app_store:6739045501",
        url: "https://apps.apple.com/kr/app/%EC%8A%B5%EA%B4%80-%ED%8A%B8%EB%9E%98%EC%BB%A4-tickoff/id6739045501?uo=4",
      },
      platform: "app",
      value: "구체적인 입력: Add habits. 핵심 처리: track them daily.",
      detail:
        "즉시 결과: interactive streak tracker. 필요한 순간: each completed task.",
      evidence:
        "검증된 해외 원본: 습관 트래커 - TickOff (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: Add habits. → 핵심 처리: track them daily. → 즉시 결과: interactive streak tracker.",
    },
    payers: [
      {
        id: "payer-tickoff-0",
        value: "매일 독서 습관을 만드는 직장인",
        detail:
          "매일 독서 습관을 만드는 직장인이 새 습관을 등록하는 순간에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-tickoff-1",
        value: "운동 목표를 기록하는 대학생",
        detail:
          "운동 목표를 기록하는 대학생이 오늘 완료 표시를 남길 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-tickoff-2",
        value: "금융 공부를 이어가는 취준생",
        detail:
          "금융 공부를 이어가는 취준생이 연속 기록이 며칠인지 확인할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-tickoff-0",
        value: "새 습관을 등록하는 순간",
        detail:
          "새 습관을 등록하는 순간에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-tickoff-1",
        value: "오늘 완료 표시를 남길 때",
        detail:
          "오늘 완료 표시를 남길 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-tickoff-2",
        value: "연속 기록이 며칠인지 확인할 때",
        detail:
          "연속 기록이 며칠인지 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-tickoff-0",
        kind: "replace",
        value: "한국 생활에 맞춘 독서·운동·공부 예시 습관 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 생활에 맞춘 독서·운동·공부 예시 습관 제공만 적용합니다.",
        resultTitle: "한국 생활에 맞춘 독서·운동·공부 예시 습관 제공",
        platform: "app",
        smallestBuild:
          "구체적인 입력: Add habits.를 넣으면 한국 생활에 맞춘 독서·운동·공부 예시 습관 제공 후 즉시 결과: interactive streak tracker.",
      },
      {
        id: "twist-tickoff-1",
        kind: "add",
        value: "목록 보기와 스트릭 보기 두 화면만 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 목록 보기와 스트릭 보기 두 화면만 제공만 적용합니다.",
        resultTitle: "목록 보기와 스트릭 보기 두 화면만 제공",
        platform: "app",
        smallestBuild:
          "구체적인 입력: Add habits.를 넣으면 목록 보기와 스트릭 보기 두 화면만 제공 후 즉시 결과: interactive streak tracker.",
      },
      {
        id: "twist-tickoff-2",
        kind: "remove",
        value: "완료 체크 후 현재 연속 일수를 즉시 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 완료 체크 후 현재 연속 일수를 즉시 표시만 적용합니다.",
        resultTitle: "완료 체크 후 현재 연속 일수를 즉시 표시",
        platform: "app",
        smallestBuild:
          "구체적인 입력: Add habits.를 넣으면 완료 체크 후 현재 연속 일수를 즉시 표시 후 즉시 결과: interactive streak tracker.",
      },
    ],
  },
  {
    id: "candidate-programmer-calculator",
    source: {
      id: "source-programmer-calculator",
      sourceName: "프로그래머 계산기",
      research: {
        key: "app_store:1624892520",
        url: "https://apps.apple.com/kr/app/%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%A8%B8-%EA%B3%84%EC%82%B0%EA%B8%B0/id1624892520?uo=4",
      },
      platform: "app",
      value:
        "구체적인 입력: 문자열 또는 육각 바이트. 핵심 처리: 진수 변환과 CRC 계산.",
      detail: "즉시 결과: 변환값과 CRC 결과. 필요한 순간: 문자열 CRC 계산.",
      evidence:
        "검증된 해외 원본: 프로그래머 계산기 (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 문자열 또는 육각 바이트. → 핵심 처리: 진수 변환과 CRC 계산. → 즉시 결과: 변환값과 CRC 결과.",
    },
    payers: [
      {
        id: "payer-programmer-calculator-0",
        value: "임베디드 개발자",
        detail:
          "임베디드 개발자가 hex 문자열의 CRC를 확인할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-programmer-calculator-1",
        value: "네트워크 패킷을 점검하는 엔지니어",
        detail:
          "네트워크 패킷을 점검하는 엔지니어가 진수 변환 결과를 검산할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-programmer-calculator-2",
        value: "코딩 테스트를 준비하는 개발자",
        detail:
          "코딩 테스트를 준비하는 개발자가 프로토콜 값을 빠르게 계산할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-programmer-calculator-0",
        value: "hex 문자열의 CRC를 확인할 때",
        detail:
          "hex 문자열의 CRC를 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-programmer-calculator-1",
        value: "진수 변환 결과를 검산할 때",
        detail:
          "진수 변환 결과를 검산할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-programmer-calculator-2",
        value: "프로토콜 값을 빠르게 계산할 때",
        detail:
          "프로토콜 값을 빠르게 계산할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-programmer-calculator-0",
        kind: "replace",
        value: "한국어 입력 예시와 CRC-32 결과를 한 화면에 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국어 입력 예시와 CRC-32 결과를 한 화면에 표시만 적용합니다.",
        resultTitle: "한국어 입력 예시와 CRC-32 결과를 한 화면에 표시",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 문자열 또는 육각 바이트.를 넣으면 한국어 입력 예시와 CRC-32 결과를 한 화면에 표시 후 즉시 결과: 변환값과 CRC 결과.",
      },
      {
        id: "twist-programmer-calculator-1",
        kind: "add",
        value: "문자열과 hex 바이트 입력을 탭으로 분리",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 문자열과 hex 바이트 입력을 탭으로 분리만 적용합니다.",
        resultTitle: "문자열과 hex 바이트 입력을 탭으로 분리",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 문자열 또는 육각 바이트.를 넣으면 문자열과 hex 바이트 입력을 탭으로 분리 후 즉시 결과: 변환값과 CRC 결과.",
      },
      {
        id: "twist-programmer-calculator-2",
        kind: "remove",
        value: "10진수·16진수 변환 결과를 동시에 출력",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 10진수·16진수 변환 결과를 동시에 출력만 적용합니다.",
        resultTitle: "10진수·16진수 변환 결과를 동시에 출력",
        platform: "app",
        smallestBuild:
          "구체적인 입력: 문자열 또는 육각 바이트.를 넣으면 10진수·16진수 변환 결과를 동시에 출력 후 즉시 결과: 변환값과 CRC 결과.",
      },
    ],
  },
  {
    id: "candidate-mergeitai",
    source: {
      id: "source-mergeitai",
      sourceName: "MergeitAI",
      research: {
        key: "trustmrr:mergeitai",
        url: "https://trustmrr.com/startup/mergeitai",
      },
      platform: "web",
      value: "구체적인 입력: Excel의 두 열. 핵심 처리: 두 열의 퍼지 매칭.",
      detail:
        "즉시 결과: 서로 대응하는 항목. 필요한 순간: Excel 두 열의 항목을 맞출 때.",
      evidence:
        "검증된 해외 원본: MergeitAI (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: Excel의 두 열. → 핵심 처리: 두 열의 퍼지 매칭. → 즉시 결과: 서로 대응하는 항목.",
    },
    payers: [
      {
        id: "payer-mergeitai-0",
        value: "수입 소상공인",
        detail:
          "수입 소상공인이 거래처 명단과 결제 내역을 맞출 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-mergeitai-1",
        value: "핀테크 운영 담당자",
        detail:
          "핀테크 운영 담당자가 두 고객 파일의 표기가 다를 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-mergeitai-2",
        value: "엑셀로 거래처를 관리하는 세무사",
        detail:
          "엑셀로 거래처를 관리하는 세무사가 중복 고객을 정리하기 전에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-mergeitai-0",
        value: "거래처 명단과 결제 내역을 맞출 때",
        detail:
          "거래처 명단과 결제 내역을 맞출 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-mergeitai-1",
        value: "두 고객 파일의 표기가 다를 때",
        detail:
          "두 고객 파일의 표기가 다를 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-mergeitai-2",
        value: "중복 고객을 정리하기 전",
        detail:
          "중복 고객을 정리하기 전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-mergeitai-0",
        kind: "replace",
        value: "두 엑셀 열을 넣으면 한글·영문 표기까지 대응표로 반환",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 두 엑셀 열을 넣으면 한글·영문 표기까지 대응표로 반환만 적용합니다.",
        resultTitle: "두 엑셀 열을 넣으면 한글·영문 표기까지 대응표로 반환",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Excel의 두 열.를 넣으면 두 엑셀 열을 넣으면 한글·영문 표기까지 대응표로 반환 후 즉시 결과: 서로 대응하는 항목.",
      },
      {
        id: "twist-mergeitai-1",
        kind: "add",
        value: "사업자명과 입금자명을 유사도순으로 나란히 보여주기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 사업자명과 입금자명을 유사도순으로 나란히 보여주기만 적용합니다.",
        resultTitle: "사업자명과 입금자명을 유사도순으로 나란히 보여주기",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Excel의 두 열.를 넣으면 사업자명과 입금자명을 유사도순으로 나란히 보여주기 후 즉시 결과: 서로 대응하는 항목.",
      },
      {
        id: "twist-mergeitai-2",
        kind: "remove",
        value: "매칭 결과에 원본 행 번호를 붙여 바로 검수",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 매칭 결과에 원본 행 번호를 붙여 바로 검수만 적용합니다.",
        resultTitle: "매칭 결과에 원본 행 번호를 붙여 바로 검수",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Excel의 두 열.를 넣으면 매칭 결과에 원본 행 번호를 붙여 바로 검수 후 즉시 결과: 서로 대응하는 항목.",
      },
    ],
  },
  {
    id: "candidate-base44-downloader",
    source: {
      id: "source-base44-downloader",
      sourceName: "Base44 Downloader",
      research: {
        key: "chrome_web_store:ngbhbpaflbegfjgaibhldjlmmfonpief",
        url: "https://chromewebstore.google.com/detail/base44-downloader/ngbhbpaflbegfjgaibhldjlmmfonpief",
      },
      platform: "plugin",
      value:
        "구체적인 입력: Base44 코드 워크스페이스 파일. 핵심 처리: 파일 구조 파싱·정리 후 로컬 처리.",
      detail:
        "즉시 결과: 클린 JSON 또는 ZIP 내보내기. 필요한 순간: 플랫폼 종속 코드를 백업·이전하려는 순간.",
      evidence:
        "검증된 해외 원본: Base44 Downloader (claude_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: Base44 코드 워크스페이스 파일. → 핵심 처리: 파일 구조 파싱·정리 후 로컬 처리. → 즉시 결과: 클린 JSON 또는 ZIP 내보내기.",
    },
    payers: [
      {
        id: "payer-base44-downloader-0",
        value: "Base44로 만든 앱의 1인 창업자",
        detail:
          "Base44로 만든 앱의 1인 창업자가 플랫폼을 바꾸기 전 코드를 보관할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-base44-downloader-1",
        value: "외주 개발 프리랜서",
        detail:
          "외주 개발 프리랜서가 클라이언트에게 작업물을 넘기기 전에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-base44-downloader-2",
        value: "코드 백업이 필요한 소규모 팀",
        detail:
          "코드 백업이 필요한 소규모 팀이 워크스페이스 파일을 한 번에 내려받을 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-base44-downloader-0",
        value: "플랫폼을 바꾸기 전 코드를 보관할 때",
        detail:
          "플랫폼을 바꾸기 전 코드를 보관할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-base44-downloader-1",
        value: "클라이언트에게 작업물을 넘기기 전",
        detail:
          "클라이언트에게 작업물을 넘기기 전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-base44-downloader-2",
        value: "워크스페이스 파일을 한 번에 내려받을 때",
        detail:
          "워크스페이스 파일을 한 번에 내려받을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-base44-downloader-0",
        kind: "replace",
        value: "Base44 워크스페이스를 한국어 파일명 안내와 함께 ZIP으로 백업",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 Base44 워크스페이스를 한국어 파일명 안내와 함께 ZIP으로 백업만 적용합니다.",
        resultTitle:
          "Base44 워크스페이스를 한국어 파일명 안내와 함께 ZIP으로 백업",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: Base44 코드 워크스페이스 파일.를 넣으면 Base44 워크스페이스를 한국어 파일명 안내와 함께 ZIP으로 백업 후 즉시 결과: 클린 JSON 또는 ZIP 내보내기.",
      },
      {
        id: "twist-base44-downloader-1",
        kind: "add",
        value: "코드 구조를 읽기 쉬운 JSON으로 정리해 내보내기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 코드 구조를 읽기 쉬운 JSON으로 정리해 내보내기만 적용합니다.",
        resultTitle: "코드 구조를 읽기 쉬운 JSON으로 정리해 내보내기",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: Base44 코드 워크스페이스 파일.를 넣으면 코드 구조를 읽기 쉬운 JSON으로 정리해 내보내기 후 즉시 결과: 클린 JSON 또는 ZIP 내보내기.",
      },
      {
        id: "twist-base44-downloader-2",
        kind: "remove",
        value: "이전용 ZIP과 검수용 JSON을 동시에 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 이전용 ZIP과 검수용 JSON을 동시에 생성만 적용합니다.",
        resultTitle: "이전용 ZIP과 검수용 JSON을 동시에 생성",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: Base44 코드 워크스페이스 파일.를 넣으면 이전용 ZIP과 검수용 JSON을 동시에 생성 후 즉시 결과: 클린 JSON 또는 ZIP 내보내기.",
      },
    ],
  },
  {
    id: "candidate-not-for-me-drink-less",
    source: {
      id: "source-not-for-me-drink-less",
      sourceName: "Not For Me: Drink Less",
      research: {
        key: "trustmrr:not-for-me-drink-less",
        url: "https://trustmrr.com/startup/not-for-me-drink-less",
      },
      platform: "web",
      value: "구체적인 입력: 음주 기록. 핵심 처리: 절주 상태 추적.",
      detail:
        "즉시 결과: 현재 절주 진행 상태. 필요한 순간: 오늘 음주 기록 확인.",
      evidence:
        "검증된 해외 원본: Not For Me: Drink Less (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 음주 기록. → 핵심 처리: 절주 상태 추적. → 즉시 결과: 현재 절주 진행 상태.",
    },
    payers: [
      {
        id: "payer-not-for-me-drink-less-0",
        value: "절주를 시도하는 직장인",
        detail:
          "절주를 시도하는 직장인이 어젯밤 마신 양을 기록할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-not-for-me-drink-less-1",
        value: "회식이 잦은 영업사원",
        detail:
          "회식이 잦은 영업사원이 이번 주 회식 전 상태를 볼 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-not-for-me-drink-less-2",
        value: "음주 습관을 가볍게 기록하려는 대학생",
        detail:
          "음주 습관을 가볍게 기록하려는 대학생이 며칠째 술을 쉬었는지 확인할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-not-for-me-drink-less-0",
        value: "어젯밤 마신 양을 기록할 때",
        detail:
          "어젯밤 마신 양을 기록할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-not-for-me-drink-less-1",
        value: "이번 주 회식 전 상태를 볼 때",
        detail:
          "이번 주 회식 전 상태를 볼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-not-for-me-drink-less-2",
        value: "며칠째 술을 쉬었는지 확인할 때",
        detail:
          "며칠째 술을 쉬었는지 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-not-for-me-drink-less-0",
        kind: "replace",
        value: "잔 수만 입력하면 이번 주 절주 기록을 달력으로 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 잔 수만 입력하면 이번 주 절주 기록을 달력으로 표시만 적용합니다.",
        resultTitle: "잔 수만 입력하면 이번 주 절주 기록을 달력으로 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 음주 기록.를 넣으면 잔 수만 입력하면 이번 주 절주 기록을 달력으로 표시 후 즉시 결과: 현재 절주 진행 상태.",
      },
      {
        id: "twist-not-for-me-drink-less-1",
        kind: "add",
        value: "회식 다음 날 음주 기록과 쉬었던 날짜를 한눈에 보기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 회식 다음 날 음주 기록과 쉬었던 날짜를 한눈에 보기만 적용합니다.",
        resultTitle: "회식 다음 날 음주 기록과 쉬었던 날짜를 한눈에 보기",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 음주 기록.를 넣으면 회식 다음 날 음주 기록과 쉬었던 날짜를 한눈에 보기 후 즉시 결과: 현재 절주 진행 상태.",
      },
      {
        id: "twist-not-for-me-drink-less-2",
        kind: "remove",
        value: "비의료적 응원 문구와 현재 기록만 보여주는 간단한 추적기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 비의료적 응원 문구와 현재 기록만 보여주는 간단한 추적기만 적용합니다.",
        resultTitle: "비의료적 응원 문구와 현재 기록만 보여주는 간단한 추적기",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 음주 기록.를 넣으면 비의료적 응원 문구와 현재 기록만 보여주는 간단한 추적기 후 즉시 결과: 현재 절주 진행 상태.",
      },
    ],
  },
  {
    id: "candidate-cantsayno",
    source: {
      id: "source-cantsayno",
      sourceName: "CantSayNo",
      research: {
        key: "trustmrr:cantsayno",
        url: "https://trustmrr.com/startup/cantsayno",
      },
      platform: "web",
      value:
        "구체적인 입력: Valentine’s Day 카드·테마·애니메이션 스티커. 핵심 처리: 인터랙티브 카드와 장난스러운 No 버튼 제작.",
      detail:
        "즉시 결과: 공유 가능한 인터랙티브 발렌타인 카드. 필요한 순간: 결제 직후 카드 생성.",
      evidence:
        "검증된 해외 원본: CantSayNo (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: Valentine’s Day 카드·테마·애니메이션 스티커. → 핵심 처리: 인터랙티브 카드와 장난스러운 No 버튼 제작. → 즉시 결과: 공유 가능한 인터랙티브 발렌타인 카드.",
    },
    payers: [
      {
        id: "payer-cantsayno-0",
        value: "발렌타인데이를 준비하는 대학생",
        detail:
          "발렌타인데이를 준비하는 대학생이 발렌타인 카드 링크를 만들 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-cantsayno-1",
        value: "커플 이벤트 업체",
        detail:
          "커플 이벤트 업체가 고백 선물을 건네기 직전에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-cantsayno-2",
        value: "연인에게 고백하려는 직장인",
        detail:
          "연인에게 고백하려는 직장인이 연인에게 장난스러운 선택지를 보낼 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-cantsayno-0",
        value: "발렌타인 카드 링크를 만들 때",
        detail:
          "발렌타인 카드 링크를 만들 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-cantsayno-1",
        value: "고백 선물을 건네기 직전",
        detail:
          "고백 선물을 건네기 직전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-cantsayno-2",
        value: "연인에게 장난스러운 선택지를 보낼 때",
        detail:
          "연인에게 장난스러운 선택지를 보낼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-cantsayno-0",
        kind: "replace",
        value: "한국어 ‘싫어요’ 버튼이 도망가는 발렌타인 카드",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국어 ‘싫어요’ 버튼이 도망가는 발렌타인 카드만 적용합니다.",
        resultTitle: "한국어 ‘싫어요’ 버튼이 도망가는 발렌타인 카드",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Valentine’s Day 카드·테마·애니메이션 스티커.를 넣으면 한국어 ‘싫어요’ 버튼이 도망가는 발렌타인 카드 후 즉시 결과: 공유 가능한 인터랙티브 발렌타인 카드.",
      },
      {
        id: "twist-cantsayno-1",
        kind: "add",
        value: "커플 사진과 스티커를 넣어 한 번만 공유할 인터랙티브 카드 생성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 커플 사진과 스티커를 넣어 한 번만 공유할 인터랙티브 카드 생성만 적용합니다.",
        resultTitle:
          "커플 사진과 스티커를 넣어 한 번만 공유할 인터랙티브 카드 생성",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Valentine’s Day 카드·테마·애니메이션 스티커.를 넣으면 커플 사진과 스티커를 넣어 한 번만 공유할 인터랙티브 카드 생성 후 즉시 결과: 공유 가능한 인터랙티브 발렌타인 카드.",
      },
      {
        id: "twist-cantsayno-2",
        kind: "remove",
        value: "버튼을 누를수록 고백 문구가 바뀌는 단일 모바일 페이지",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 버튼을 누를수록 고백 문구가 바뀌는 단일 모바일 페이지만 적용합니다.",
        resultTitle: "버튼을 누를수록 고백 문구가 바뀌는 단일 모바일 페이지",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Valentine’s Day 카드·테마·애니메이션 스티커.를 넣으면 버튼을 누를수록 고백 문구가 바뀌는 단일 모바일 페이지 후 즉시 결과: 공유 가능한 인터랙티브 발렌타인 카드.",
      },
    ],
  },
  {
    id: "candidate-simplesvgs",
    source: {
      id: "source-simplesvgs",
      sourceName: "SimpleSVGs",
      research: {
        key: "trustmrr:simplesvgs",
        url: "https://trustmrr.com/startup/simplesvgs",
      },
      platform: "web",
      value: "구체적인 입력: SVG 파일. 핵심 처리: SVG 압축·최적화.",
      detail:
        "즉시 결과: 용량이 줄어든 SVG 파일. 필요한 순간: 파일 업로드 직후 압축 결과.",
      evidence:
        "검증된 해외 원본: SimpleSVGs (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: SVG 파일. → 핵심 처리: SVG 압축·최적화. → 즉시 결과: 용량이 줄어든 SVG 파일.",
    },
    payers: [
      {
        id: "payer-simplesvgs-0",
        value: "웹디자인 프리랜서",
        detail:
          "웹디자인 프리랜서가 사이트 배포 전 SVG 용량을 줄일 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-simplesvgs-1",
        value: "아이콘을 만드는 디자이너",
        detail:
          "아이콘을 만드는 디자이너가 아이콘 파일을 전달하기 직전에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-simplesvgs-2",
        value: "소규모 쇼핑몰 개발자",
        detail:
          "소규모 쇼핑몰 개발자가 페이지 로딩을 가볍게 만들 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-simplesvgs-0",
        value: "사이트 배포 전 SVG 용량을 줄일 때",
        detail:
          "사이트 배포 전 SVG 용량을 줄일 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-simplesvgs-1",
        value: "아이콘 파일을 전달하기 직전",
        detail:
          "아이콘 파일을 전달하기 직전에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-simplesvgs-2",
        value: "페이지 로딩을 가볍게 만들 때",
        detail:
          "페이지 로딩을 가볍게 만들 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-simplesvgs-0",
        kind: "replace",
        value: "SVG를 올리면 브라우저 안에서 압축된 파일만 즉시 다운로드",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 SVG를 올리면 브라우저 안에서 압축된 파일만 즉시 다운로드만 적용합니다.",
        resultTitle: "SVG를 올리면 브라우저 안에서 압축된 파일만 즉시 다운로드",
        platform: "web",
        smallestBuild:
          "구체적인 입력: SVG 파일.를 넣으면 SVG를 올리면 브라우저 안에서 압축된 파일만 즉시 다운로드 후 즉시 결과: 용량이 줄어든 SVG 파일.",
      },
      {
        id: "twist-simplesvgs-1",
        kind: "add",
        value: "불필요한 메타데이터를 제거하고 원본 대비 용량만 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 불필요한 메타데이터를 제거하고 원본 대비 용량만 표시만 적용합니다.",
        resultTitle: "불필요한 메타데이터를 제거하고 원본 대비 용량만 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: SVG 파일.를 넣으면 불필요한 메타데이터를 제거하고 원본 대비 용량만 표시 후 즉시 결과: 용량이 줄어든 SVG 파일.",
      },
      {
        id: "twist-simplesvgs-2",
        kind: "remove",
        value:
          "여러 파일 대신 대표 SVG 한 개를 안전하게 최적화하는 초소형 도구",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 여러 파일 대신 대표 SVG 한 개를 안전하게 최적화하는 초소형 도구만 적용합니다.",
        resultTitle:
          "여러 파일 대신 대표 SVG 한 개를 안전하게 최적화하는 초소형 도구",
        platform: "web",
        smallestBuild:
          "구체적인 입력: SVG 파일.를 넣으면 여러 파일 대신 대표 SVG 한 개를 안전하게 최적화하는 초소형 도구 후 즉시 결과: 용량이 줄어든 SVG 파일.",
      },
    ],
  },
  {
    id: "candidate-michikanji",
    source: {
      id: "source-michikanji",
      sourceName: "MichiKanji",
      research: {
        key: "trustmrr:michikanji",
        url: "https://trustmrr.com/startup/michikanji",
      },
      platform: "web",
      value:
        "구체적인 입력: 한자·뜻·읽기 검색어. 핵심 처리: JLPT 급수와 획순 도식 검색.",
      detail:
        "즉시 결과: 인터랙티브 획순 다이어그램. 필요한 순간: Search JLPT N5, N4, N3, N2, and N1 kanji.",
      evidence:
        "검증된 해외 원본: MichiKanji (codex_cli_structured_fail_rereview)",
      preservedFlow:
        "구체적인 입력: 한자·뜻·읽기 검색어. → 핵심 처리: JLPT 급수와 획순 도식 검색. → 즉시 결과: 인터랙티브 획순 다이어그램.",
    },
    payers: [
      {
        id: "payer-michikanji-0",
        value: "JLPT를 준비하는 대학생",
        detail:
          "JLPT를 준비하는 대학생이 모르는 한자의 획순을 찾을 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-michikanji-1",
        value: "일본어 과외 강사",
        detail:
          "일본어 과외 강사가 JLPT 급수별 복습을 할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-michikanji-2",
        value: "일본 유학을 준비하는 직장인",
        detail:
          "일본 유학을 준비하는 직장인이 단어를 쓰기 전에 읽기를 확인할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-michikanji-0",
        value: "모르는 한자의 획순을 찾을 때",
        detail:
          "모르는 한자의 획순을 찾을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-michikanji-1",
        value: "JLPT 급수별 복습을 할 때",
        detail:
          "JLPT 급수별 복습을 할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-michikanji-2",
        value: "단어를 쓰기 전에 읽기를 확인할 때",
        detail:
          "단어를 쓰기 전에 읽기를 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-michikanji-0",
        kind: "replace",
        value: "한자·뜻·읽기를 검색하면 JLPT 급수와 획순 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한자·뜻·읽기를 검색하면 JLPT 급수와 획순 표시만 적용합니다.",
        resultTitle: "한자·뜻·읽기를 검색하면 JLPT 급수와 획순 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 한자·뜻·읽기 검색어.를 넣으면 한자·뜻·읽기를 검색하면 JLPT 급수와 획순 표시 후 즉시 결과: 인터랙티브 획순 다이어그램.",
      },
      {
        id: "twist-michikanji-1",
        kind: "add",
        value: "한국어 뜻으로 찾은 한자의 붓글씨 순서를 애니메이션으로 재생",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국어 뜻으로 찾은 한자의 붓글씨 순서를 애니메이션으로 재생만 적용합니다.",
        resultTitle:
          "한국어 뜻으로 찾은 한자의 붓글씨 순서를 애니메이션으로 재생",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 한자·뜻·읽기 검색어.를 넣으면 한국어 뜻으로 찾은 한자의 붓글씨 순서를 애니메이션으로 재생 후 즉시 결과: 인터랙티브 획순 다이어그램.",
      },
      {
        id: "twist-michikanji-2",
        kind: "remove",
        value: "N5부터 N1까지 급수 필터를 눌러 해당 한자만 보기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 N5부터 N1까지 급수 필터를 눌러 해당 한자만 보기만 적용합니다.",
        resultTitle: "N5부터 N1까지 급수 필터를 눌러 해당 한자만 보기",
        platform: "web",
        smallestBuild:
          "구체적인 입력: 한자·뜻·읽기 검색어.를 넣으면 N5부터 N1까지 급수 필터를 눌러 해당 한자만 보기 후 즉시 결과: 인터랙티브 획순 다이어그램.",
      },
    ],
  },
  {
    id: "candidate-finishdraft",
    source: {
      id: "source-finishdraft",
      sourceName: "Finishdraft",
      research: {
        key: "trustmrr:finishdraft",
        url: "https://trustmrr.com/startup/finishdraft",
      },
      platform: "web",
      value:
        "구체적인 입력: Daily writing text. 핵심 처리: Distraction-free writing and habit visualization.",
      detail:
        "즉시 결과: Focused draft with writing habit view. 필요한 순간: During daily writing.",
      evidence:
        "검증된 해외 원본: Finishdraft (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: Daily writing text. → 핵심 처리: Distraction-free writing and habit visualization. → 즉시 결과: Focused draft with writing habit view.",
    },
    payers: [
      {
        id: "payer-finishdraft-0",
        value: "매일 글 쓰는 작가 지망생",
        detail:
          "매일 글 쓰는 작가 지망생이 아침 글쓰기를 시작할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-finishdraft-1",
        value: "뉴스레터를 만드는 1인 운영자",
        detail:
          "뉴스레터를 만드는 1인 운영자가 초고를 끝까지 써야 할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-finishdraft-2",
        value: "블로그를 꾸준히 쓰는 직장인",
        detail:
          "블로그를 꾸준히 쓰는 직장인이 이번 달 글쓰기 습관을 확인할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-finishdraft-0",
        value: "아침 글쓰기를 시작할 때",
        detail:
          "아침 글쓰기를 시작할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-finishdraft-1",
        value: "초고를 끝까지 써야 할 때",
        detail:
          "초고를 끝까지 써야 할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-finishdraft-2",
        value: "이번 달 글쓰기 습관을 확인할 때",
        detail:
          "이번 달 글쓰기 습관을 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-finishdraft-0",
        kind: "replace",
        value: "집중 모드에서 글을 쓰고 하루 분량만 히트맵에 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 집중 모드에서 글을 쓰고 하루 분량만 히트맵에 표시만 적용합니다.",
        resultTitle: "집중 모드에서 글을 쓰고 하루 분량만 히트맵에 표시",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Daily writing text.를 넣으면 집중 모드에서 글을 쓰고 하루 분량만 히트맵에 표시 후 즉시 결과: Focused draft with writing habit view.",
      },
      {
        id: "twist-finishdraft-1",
        kind: "add",
        value: "오늘 쓴 글자 수와 연속 작성일을 한 화면에 기록",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 오늘 쓴 글자 수와 연속 작성일을 한 화면에 기록만 적용합니다.",
        resultTitle: "오늘 쓴 글자 수와 연속 작성일을 한 화면에 기록",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Daily writing text.를 넣으면 오늘 쓴 글자 수와 연속 작성일을 한 화면에 기록 후 즉시 결과: Focused draft with writing habit view.",
      },
      {
        id: "twist-finishdraft-2",
        kind: "remove",
        value: "방해 요소 없는 한국어 초고 화면과 GitHub식 기록 결합",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 방해 요소 없는 한국어 초고 화면과 GitHub식 기록 결합만 적용합니다.",
        resultTitle: "방해 요소 없는 한국어 초고 화면과 GitHub식 기록 결합",
        platform: "web",
        smallestBuild:
          "구체적인 입력: Daily writing text.를 넣으면 방해 요소 없는 한국어 초고 화면과 GitHub식 기록 결합 후 즉시 결과: Focused draft with writing habit view.",
      },
    ],
  },
  {
    id: "candidate-prayer-timer",
    source: {
      id: "source-prayer-timer",
      sourceName: "Prayer Timer",
      research: {
        key: "chrome_web_store:dhmckhpkidimmjfhpplhpfapedefgmne",
        url: "https://chromewebstore.google.com/detail/prayer-timer/dhmckhpkidimmjfhpplhpfapedefgmne",
      },
      platform: "plugin",
      value: "구체적인 입력: 현재 위치 권한. 핵심 처리: 지역별 기도 시간 계산.",
      detail:
        "즉시 결과: 오늘의 기도 시간과 알림. 필요한 순간: 기도 시간 확인.",
      evidence:
        "검증된 해외 원본: Prayer Timer (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 현재 위치 권한. → 핵심 처리: 지역별 기도 시간 계산. → 즉시 결과: 오늘의 기도 시간과 알림.",
    },
    payers: [
      {
        id: "payer-prayer-timer-0",
        value: "이슬람 신자인 직장인",
        detail:
          "이슬람 신자인 직장인이 오늘 기도 시간을 확인할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-prayer-timer-1",
        value: "무슬림 유학생",
        detail:
          "무슬림 유학생이 출장지에서 지역 기도 일정을 볼 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-prayer-timer-2",
        value: "할랄 식당 운영자",
        detail:
          "할랄 식당 운영자가 기도 전 알림을 설정할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-prayer-timer-0",
        value: "오늘 기도 시간을 확인할 때",
        detail:
          "오늘 기도 시간을 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-prayer-timer-1",
        value: "출장지에서 지역 기도 일정을 볼 때",
        detail:
          "출장지에서 지역 기도 일정을 볼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-prayer-timer-2",
        value: "기도 전 알림을 설정할 때",
        detail:
          "기도 전 알림을 설정할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-prayer-timer-0",
        kind: "replace",
        value: "도시를 직접 선택하면 오늘의 이슬람 기도 시간 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 도시를 직접 선택하면 오늘의 이슬람 기도 시간 표시만 적용합니다.",
        resultTitle: "도시를 직접 선택하면 오늘의 이슬람 기도 시간 표시",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 현재 위치 권한.를 넣으면 도시를 직접 선택하면 오늘의 이슬람 기도 시간 표시 후 즉시 결과: 오늘의 기도 시간과 알림.",
      },
      {
        id: "twist-prayer-timer-1",
        kind: "add",
        value: "한국 주요 도시별 기도 시간을 한 화면에서 비교",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 주요 도시별 기도 시간을 한 화면에서 비교만 적용합니다.",
        resultTitle: "한국 주요 도시별 기도 시간을 한 화면에서 비교",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 현재 위치 권한.를 넣으면 한국 주요 도시별 기도 시간을 한 화면에서 비교 후 즉시 결과: 오늘의 기도 시간과 알림.",
      },
      {
        id: "twist-prayer-timer-2",
        kind: "remove",
        value: "위치 권한 없이 도시명 입력만으로 일정과 알림 확인",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 위치 권한 없이 도시명 입력만으로 일정과 알림 확인만 적용합니다.",
        resultTitle: "위치 권한 없이 도시명 입력만으로 일정과 알림 확인",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 현재 위치 권한.를 넣으면 위치 권한 없이 도시명 입력만으로 일정과 알림 확인 후 즉시 결과: 오늘의 기도 시간과 알림.",
      },
    ],
  },
  {
    id: "candidate-json-formatter",
    source: {
      id: "source-json-formatter",
      sourceName: "JSON Formatter",
      research: {
        key: "chrome_web_store:gpmodmeblccallcadopbcoeoejepgpnb",
        url: "https://chromewebstore.google.com/detail/json-formatter/gpmodmeblccallcadopbcoeoejepgpnb",
      },
      platform: "plugin",
      value:
        "구체적인 입력: JSON 텍스트. 핵심 처리: JSON 자동 포맷팅과 구문 강조.",
      detail:
        "즉시 결과: 읽기 쉬운 테마별 JSON. 필요한 순간: 링크가 자동으로 표시되는 JSON.",
      evidence:
        "검증된 해외 원본: JSON Formatter (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: JSON 텍스트. → 핵심 처리: JSON 자동 포맷팅과 구문 강조. → 즉시 결과: 읽기 쉬운 테마별 JSON.",
    },
    payers: [
      {
        id: "payer-json-formatter-0",
        value: "한국인 백엔드 프리랜서",
        detail:
          "한국인 백엔드 프리랜서가 API 응답 JSON을 읽어야 할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-json-formatter-1",
        value: "서울의 소규모 개발사",
        detail:
          "서울의 소규모 개발사가 개발자에게 받은 설정 파일을 확인할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-json-formatter-2",
        value: "코딩 학원 강사",
        detail:
          "코딩 학원 강사가 웹훅 오류 원인을 찾을 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-json-formatter-0",
        value: "API 응답 JSON을 읽어야 할 때",
        detail:
          "API 응답 JSON을 읽어야 할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-json-formatter-1",
        value: "개발자에게 받은 설정 파일을 확인할 때",
        detail:
          "개발자에게 받은 설정 파일을 확인할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-json-formatter-2",
        value: "웹훅 오류 원인을 찾을 때",
        detail:
          "웹훅 오류 원인을 찾을 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-json-formatter-0",
        kind: "replace",
        value: "한국 개발자용 다크·라이트 테마 JSON 보기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 개발자용 다크·라이트 테마 JSON 보기만 적용합니다.",
        resultTitle: "한국 개발자용 다크·라이트 테마 JSON 보기",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: JSON 텍스트.를 넣으면 한국 개발자용 다크·라이트 테마 JSON 보기 후 즉시 결과: 읽기 쉬운 테마별 JSON.",
      },
      {
        id: "twist-json-formatter-1",
        kind: "add",
        value: "긴 JSON을 접었다 펴는 미리보기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 긴 JSON을 접었다 펴는 미리보기만 적용합니다.",
        resultTitle: "긴 JSON을 접었다 펴는 미리보기",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: JSON 텍스트.를 넣으면 긴 JSON을 접었다 펴는 미리보기 후 즉시 결과: 읽기 쉬운 테마별 JSON.",
      },
      {
        id: "twist-json-formatter-2",
        kind: "remove",
        value: "URL을 클릭 가능한 링크로 표시",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 URL을 클릭 가능한 링크로 표시만 적용합니다.",
        resultTitle: "URL을 클릭 가능한 링크로 표시",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: JSON 텍스트.를 넣으면 URL을 클릭 가능한 링크로 표시 후 즉시 결과: 읽기 쉬운 테마별 JSON.",
      },
    ],
  },
  {
    id: "candidate-billbatch",
    source: {
      id: "source-billbatch",
      sourceName: "BillBatch",
      research: {
        key: "trustmrr:billbatch",
        url: "https://trustmrr.com/startup/billbatch",
      },
      platform: "web",
      value:
        "구체적인 입력: PayPal 거래내역 파일. 핵심 처리: 거래별 청구서 정보 변환.",
      detail:
        "즉시 결과: 전문 PDF 인보이스. 필요한 순간: 거래 후 청구서를 만들 때.",
      evidence:
        "검증된 해외 원본: BillBatch (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: PayPal 거래내역 파일. → 핵심 처리: 거래별 청구서 정보 변환. → 즉시 결과: 전문 PDF 인보이스.",
    },
    payers: [
      {
        id: "payer-billbatch-0",
        value: "해외 고객과 일하는 한국 프리랜서",
        detail:
          "해외 고객과 일하는 한국 프리랜서가 PayPal 입금 내역을 정산할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-billbatch-1",
        value: "소규모 온라인 수출업체 대표",
        detail:
          "소규모 온라인 수출업체 대표가 해외 고객에게 청구서를 보낼 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-billbatch-2",
        value: "PayPal을 쓰는 1인 개발자",
        detail:
          "PayPal을 쓰는 1인 개발자가 월말 거래를 한꺼번에 문서화할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-billbatch-0",
        value: "PayPal 입금 내역을 정산할 때",
        detail:
          "PayPal 입금 내역을 정산할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-billbatch-1",
        value: "해외 고객에게 청구서를 보낼 때",
        detail:
          "해외 고객에게 청구서를 보낼 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-billbatch-2",
        value: "월말 거래를 한꺼번에 문서화할 때",
        detail:
          "월말 거래를 한꺼번에 문서화할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-billbatch-0",
        kind: "replace",
        value: "PayPal CSV를 한국어 PDF 청구서로 변환",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 PayPal CSV를 한국어 PDF 청구서로 변환만 적용합니다.",
        resultTitle: "PayPal CSV를 한국어 PDF 청구서로 변환",
        platform: "web",
        smallestBuild:
          "구체적인 입력: PayPal 거래내역 파일.를 넣으면 PayPal CSV를 한국어 PDF 청구서로 변환 후 즉시 결과: 전문 PDF 인보이스.",
      },
      {
        id: "twist-billbatch-1",
        kind: "add",
        value: "원화 환산 칸을 추가한 한국 프리랜서용 양식",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 원화 환산 칸을 추가한 한국 프리랜서용 양식만 적용합니다.",
        resultTitle: "원화 환산 칸을 추가한 한국 프리랜서용 양식",
        platform: "web",
        smallestBuild:
          "구체적인 입력: PayPal 거래내역 파일.를 넣으면 원화 환산 칸을 추가한 한국 프리랜서용 양식 후 즉시 결과: 전문 PDF 인보이스.",
      },
      {
        id: "twist-billbatch-2",
        kind: "remove",
        value: "거래 여러 건을 고객별 PDF로 묶기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 거래 여러 건을 고객별 PDF로 묶기만 적용합니다.",
        resultTitle: "거래 여러 건을 고객별 PDF로 묶기",
        platform: "web",
        smallestBuild:
          "구체적인 입력: PayPal 거래내역 파일.를 넣으면 거래 여러 건을 고객별 PDF로 묶기 후 즉시 결과: 전문 PDF 인보이스.",
      },
    ],
  },
  {
    id: "candidate-finance-quest",
    source: {
      id: "source-finance-quest",
      sourceName: "Finance Quest",
      research: {
        key: "chrome_web_store:nahkhbckoojacpfmjonkbmmjhkknjmid",
        url: "https://chromewebstore.google.com/detail/finance-quest/nahkhbckoojacpfmjonkbmmjhkknjmid",
      },
      platform: "plugin",
      value: "구체적인 입력: 금융 퀴즈 답변. 핵심 처리: 정답 채점.",
      detail:
        "즉시 결과: 금융 리터러시 학습 결과. 필요한 순간: 하루 금융 퀴즈.",
      evidence:
        "검증된 해외 원본: Finance Quest (codex_cli_structured_fail_rereview)",
      preservedFlow:
        "구체적인 입력: 금융 퀴즈 답변. → 핵심 처리: 정답 채점. → 즉시 결과: 금융 리터러시 학습 결과.",
    },
    payers: [
      {
        id: "payer-finance-quest-0",
        value: "취업 준비생",
        detail:
          "취업 준비생이 하루 5분 금융 상식을 공부할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-finance-quest-1",
        value: "사회초년생",
        detail:
          "사회초년생이 투자 전 기본 개념을 점검할 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-finance-quest-2",
        value: "소규모 금융교육 강사",
        detail:
          "소규모 금융교육 강사가 금융 수업 시작 전 복습할 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-finance-quest-0",
        value: "하루 5분 금융 상식을 공부할 때",
        detail:
          "하루 5분 금융 상식을 공부할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-finance-quest-1",
        value: "투자 전 기본 개념을 점검할 때",
        detail:
          "투자 전 기본 개념을 점검할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-finance-quest-2",
        value: "금융 수업 시작 전 복습할 때",
        detail:
          "금융 수업 시작 전 복습할 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-finance-quest-0",
        kind: "replace",
        value: "한국 예금·주식 용어 중심의 하루 한 문제",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 예금·주식 용어 중심의 하루 한 문제만 적용합니다.",
        resultTitle: "한국 예금·주식 용어 중심의 하루 한 문제",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 금융 퀴즈 답변.를 넣으면 한국 예금·주식 용어 중심의 하루 한 문제 후 즉시 결과: 금융 리터러시 학습 결과.",
      },
      {
        id: "twist-finance-quest-1",
        kind: "add",
        value: "정답 뒤 금융감독원 용어 풀이 한 줄 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 정답 뒤 금융감독원 용어 풀이 한 줄 제공만 적용합니다.",
        resultTitle: "정답 뒤 금융감독원 용어 풀이 한 줄 제공",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 금융 퀴즈 답변.를 넣으면 정답 뒤 금융감독원 용어 풀이 한 줄 제공 후 즉시 결과: 금융 리터러시 학습 결과.",
      },
      {
        id: "twist-finance-quest-2",
        kind: "remove",
        value: "직장인 월급·카드 상황형 보기로 구성",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 직장인 월급·카드 상황형 보기로 구성만 적용합니다.",
        resultTitle: "직장인 월급·카드 상황형 보기로 구성",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 금융 퀴즈 답변.를 넣으면 직장인 월급·카드 상황형 보기로 구성 후 즉시 결과: 금융 리터러시 학습 결과.",
      },
    ],
  },
  {
    id: "candidate-equatio-math-made-digital",
    source: {
      id: "source-equatio-math-made-digital",
      sourceName: "Equatio - Math made digital",
      research: {
        key: "chrome_web_store:hjngolefdpdnooamgdldlkjgmdcmcjnc",
        url: "https://chromewebstore.google.com/detail/equatio-math-made-digital/hjngolefdpdnooamgdldlkjgmdcmcjnc",
      },
      platform: "plugin",
      value:
        "구체적인 입력: 수식·퀴즈를 입력하거나 손으로 작성. 핵심 처리: 수학 식과 퀴즈 형식으로 변환.",
      detail:
        "즉시 결과: 디지털 수식·퀴즈. 필요한 순간: 수학 자료를 만드는 시점.",
      evidence:
        "검증된 해외 원본: Equatio - Math made digital (codex_cli_structured_exhaustive_review)",
      preservedFlow:
        "구체적인 입력: 수식·퀴즈를 입력하거나 손으로 작성. → 핵심 처리: 수학 식과 퀴즈 형식으로 변환. → 즉시 결과: 디지털 수식·퀴즈.",
    },
    payers: [
      {
        id: "payer-equatio-math-made-digital-0",
        value: "중학교 수학 교사",
        detail:
          "중학교 수학 교사가 손글씨 수식을 학습지에 옮길 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-equatio-math-made-digital-1",
        value: "수학 과외 강사",
        detail:
          "수학 과외 강사가 수학 퀴즈를 급히 만들 때에 이 결과를 바로 사용합니다.",
      },
      {
        id: "payer-equatio-math-made-digital-2",
        value: "학원용 문제를 만드는 원장",
        detail:
          "학원용 문제를 만드는 원장이 학생에게 디지털 식을 보여줄 때에 이 결과를 바로 사용합니다.",
      },
    ],
    moments: [
      {
        id: "moment-equatio-math-made-digital-0",
        value: "손글씨 수식을 학습지에 옮길 때",
        detail:
          "손글씨 수식을 학습지에 옮길 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-equatio-math-made-digital-1",
        value: "수학 퀴즈를 급히 만들 때",
        detail:
          "수학 퀴즈를 급히 만들 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
      {
        id: "moment-equatio-math-made-digital-2",
        value: "학생에게 디지털 식을 보여줄 때",
        detail:
          "학생에게 디지털 식을 보여줄 때에 입력 하나로 결과 하나를 확인하려는 순간입니다.",
      },
    ],
    twists: [
      {
        id: "twist-equatio-math-made-digital-0",
        kind: "replace",
        value: "한국 교과서 분수·근호 입력 버튼 제공",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 한국 교과서 분수·근호 입력 버튼 제공만 적용합니다.",
        resultTitle: "한국 교과서 분수·근호 입력 버튼 제공",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 수식·퀴즈를 입력하거나 손으로 작성.를 넣으면 한국 교과서 분수·근호 입력 버튼 제공 후 즉시 결과: 디지털 수식·퀴즈.",
      },
      {
        id: "twist-equatio-math-made-digital-1",
        kind: "add",
        value: "손글씨 수식을 디지털 수식으로 변환",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 손글씨 수식을 디지털 수식으로 변환만 적용합니다.",
        resultTitle: "손글씨 수식을 디지털 수식으로 변환",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 수식·퀴즈를 입력하거나 손으로 작성.를 넣으면 손글씨 수식을 디지털 수식으로 변환 후 즉시 결과: 디지털 수식·퀴즈.",
      },
      {
        id: "twist-equatio-math-made-digital-2",
        kind: "remove",
        value: "수식 하나를 객관식 퀴즈로 바꾸기",
        detail:
          "원본의 입력→처리→결과 흐름을 유지하면서 수식 하나를 객관식 퀴즈로 바꾸기만 적용합니다.",
        resultTitle: "수식 하나를 객관식 퀴즈로 바꾸기",
        platform: "plugin",
        smallestBuild:
          "구체적인 입력: 수식·퀴즈를 입력하거나 손으로 작성.를 넣으면 수식 하나를 객관식 퀴즈로 바꾸기 후 즉시 결과: 디지털 수식·퀴즈.",
      },
    ],
  },
  {
    id: "fan-sign-lettering",
    source: {
      id: "source-fan-sign-lettering",
      sourceName: "うちわ文字作成 アプリ ファンサください！",
      research: {
        key: "app_store:6443780213",
        url: "https://apps.apple.com/jp/app/%E3%81%86%E3%81%A1%E3%82%8F%E6%96%87%E5%AD%97%E4%BD%9C%E6%88%90-%E3%82%A2%E3%83%97%E3%83%AA-%E3%83%95%E3%82%A1%E3%83%B3%E3%82%B5%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84/id6443780213",
      },
      platform: "app",
      value:
        "응원 문구를 넣으면 공연장에서 잘 보이는 부채 글자 이미지로 만드는 앱",
      detail:
        "짧은 응원 문구 하나를 굵은 외곽선·두 줄 배치·부채 인쇄 크기에 맞춘 출력용 이미지 한 장으로 바꿉니다.",
      evidence:
        "일본 App Store 그래픽·디자인 카테고리 8위에서 문구 입력 → 팬서비스용 글자 디자인 → 응원 부채 이미지 흐름 확인",
      preservedFlow:
        "응원 문구 텍스트 입력 → 부채용 글자 배치·스타일 처리 → 출력용 글자 이미지 확인",
    },
    payers: [
      {
        id: "payer-fanclub-sign-manager",
        value: "팬클럽 응원물 제작을 맡은 총무",
        detail:
          "멤버별 응원 부채 문구를 반복해서 만들며, 글자 크기와 배치를 직접 조정하고 이미지 편집 파일을 매번 손봅니다.",
      },
      {
        id: "payer-small-fan-goods-maker",
        value: "소규모 굿즈를 주문 제작하는 팬",
        detail:
          "팬들에게 받을 응원 부채 문구를 여러 장 제작해야 해, 문구마다 글꼴·외곽선·인쇄 크기를 수작업으로 맞춥니다.",
      },
      {
        id: "payer-concert-sign-maker",
        value: "공연 응원 부채를 대신 만들어주는 제작자",
        detail:
          "주문받은 짧은 문구를 부채에 맞는 글자 이미지로 바꾸는 일을 반복하며, 멀리서 보이는 크기와 테두리를 직접 조정합니다.",
      },
    ],
    moments: [
      {
        id: "moment-sign-print-today",
        value: "오늘 바로 부채 문구를 출력해야 할 때",
        detail:
          "인쇄소 마감 전에 문구를 이미지로 완성해야 하므로, 디자인 파일을 새로 만들 시간이 없는 순간",
      },
      {
        id: "moment-sign-hard-to-see",
        value: "완성한 문구가 멀리서 안 보일 때",
        detail:
          "출력 직전 글자가 작거나 배경에 묻히는 문제가 드러나, 즉시 눈에 띄는 글자 이미지가 필요한 순간",
      },
      {
        id: "moment-sign-hard-to-read",
        value: "부채 문구가 한눈에 안 읽힐 때",
        detail:
          "출력 미리보기에서 글자가 배경에 묻히거나 배치가 답답해 보여, 지금 읽기 쉬운 글자 이미지로 바꿔야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-sign-bold-outline",
        kind: "add",
        value: "응원 문구에 굵은 외곽선을 더하기",
        detail:
          "부채 문구를 글자 이미지로 만드는 흐름은 유지하고, 글자 가장자리의 굵은 외곽선만 추가합니다.",
        resultTitle: "멀리서 보이는 부채 문구 이미지",
        platform: "web",
        smallestBuild:
          "부채에 넣을 문구 텍스트 하나를 입력하면 굵은 외곽선을 적용한 출력용 글자 이미지 한 장을 보여주는 웹 화면",
      },
      {
        id: "twist-sign-two-line-layout",
        kind: "replace",
        value: "긴 응원 문구를 두 줄로 배치하기",
        detail:
          "응원용 글자 이미지를 만드는 흐름은 유지하고, 긴 문구의 줄바꿈 방식만 두 줄로 바꿉니다.",
        resultTitle: "폭에 맞춘 두 줄 부채 글자 이미지",
        platform: "web",
        smallestBuild:
          "긴 응원 문구 텍스트 하나를 입력하면 두 줄로 배치한 부채용 글자 이미지 한 장을 즉시 만드는 웹 화면",
      },
      {
        id: "twist-sign-print-size",
        kind: "replace",
        value: "부채 인쇄 크기에 맞춰 글자를 조정하기",
        detail:
          "문구를 응원용 글자 디자인으로 만드는 흐름은 유지하고, 결과 이미지의 글자 크기와 배치만 실제 부채 출력 크기에 맞춥니다.",
        resultTitle: "부채 크기에 맞춘 문구 이미지",
        platform: "web",
        smallestBuild:
          "응원 문구 텍스트 하나를 입력하면 부채 인쇄 크기에 맞게 조정한 출력용 글자 이미지 한 장을 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "car-audio-mastering",
    source: {
      id: "source-car-audio-mastering",
      sourceName: "CarMaster",
      research: {
        key: "trustmrr:carmaster",
        url: "https://trustmrr.com/startup/carmaster",
      },
      platform: "web",
      value:
        "랩 음악 파일을 차량 스피커에서 잘 들리도록 마스터링하는 웹 서비스",
      detail:
        "랩 음원 파일 하나를 넣으면 차 안에서 뭉치는 저역·묻히는 보컬·들쭉날쭉한 체감 음량 중 한 문제를 보정한 오디오 파일을 만듭니다.",
      evidence:
        "TrustMRR 최근 30일 매출 542달러·판매 희망가 14,000달러; 음악 파일 → 차량 청취 기준 마스터링 → 저장 가능한 오디오 흐름 확인",
      preservedFlow:
        "랩 음악 파일 입력 → 차량 청취 기준 보정 → 저장 가능한 오디오 파일 확인",
    },
    payers: [
      {
        id: "payer-car-master-independent-producer",
        value: "랩 음원을 차에 납품하는 독립 프로듀서",
        detail:
          "차량 스피커에서 저역과 보컬 균형을 반복 확인해야 하며, 차에 파일을 옮겨 여러 번 재생하고 수동으로 마스터를 수정합니다.",
      },
      {
        id: "payer-car-master-release-engineer",
        value: "힙합 아티스트의 발매 음원을 검수하는 엔지니어",
        detail:
          "공개 전 랩 믹스가 차 안에서 뭉개지는지 계속 점검해야 하며, 일반 마스터와 차량 재생을 번갈아 비교합니다.",
      },
      {
        id: "payer-car-master-small-studio",
        value: "랩 음원을 여러 아티스트에게 납품하는 소규모 스튜디오",
        detail:
          "납품곡마다 차량 청취 품질을 맞춰야 하며, 파일을 차에서 들어 보고 저역·보컬·음량을 수작업으로 재조정합니다.",
      },
    ],
    moments: [
      {
        id: "moment-car-master-before-release",
        value: "발매 직전 차 안에서 랩 믹스를 처음 확인할 때",
        detail:
          "공개 후 차량에서 소리가 뭉개지면 수정 비용이 커지므로, 지금 재생한 파일의 문제를 바로 확인해야 하는 순간",
      },
      {
        id: "moment-car-master-before-delivery",
        value: "클라이언트 납품 전 차량 스피커로 최종 재생할 때",
        detail:
          "납품 직전에 보컬이 묻히거나 저역이 과하면 신뢰를 잃을 수 있어, 즉시 정리된 결과가 필요한 순간",
      },
      {
        id: "moment-car-master-promo-video",
        value: "차량용 홍보 영상에 넣을 랩 음원을 확정할 때",
        detail:
          "영상 공개 전에 차 안에서 체감 음량과 균형을 확인해야 하므로, 사전 기록 없이 파일만 넣어 바로 결과를 봐야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-car-master-low-end",
        kind: "replace",
        value: "차량에서 뭉치는 저역을 먼저 정리하기",
        detail:
          "랩 음원을 차량 청취 기준으로 마스터링하는 흐름은 유지하고, 저역 과밀을 정리하는 처리 하나만 적용합니다.",
        resultTitle: "차량 재생 저역 뭉침 정리 음원",
        platform: "web",
        smallestBuild:
          "랩 음악 파일 하나를 입력하면 차량 청취 기준으로 저역 과밀을 한 번 정리한 오디오 파일 하나를 즉시 반환하는 웹 화면",
      },
      {
        id: "twist-car-master-vocal-clarity",
        kind: "add",
        value: "차 안에서 묻히는 랩 보컬을 선명하게 보정하기",
        detail:
          "차량 청취용 마스터링과 오디오 결과 제공은 유지하고, 보컬 명료도 보정만 추가합니다.",
        resultTitle: "차량에서 묻히는 랩 보컬 보정",
        platform: "web",
        smallestBuild:
          "랩 음악 파일 하나를 입력하면 차량 청취 기준으로 보컬 명료도를 한 번 보정한 오디오 파일 하나를 즉시 반환하는 웹 화면",
      },
      {
        id: "twist-car-master-loudness",
        kind: "replace",
        value: "차 안에서 들쭉날쭉한 체감 음량을 맞추기",
        detail:
          "랩 음원 입력부터 차량 청취용 마스터링과 오디오 결과 제공까지는 유지하고, 차 안 체감 음량을 균일하게 맞추는 부분만 바꿉니다.",
        resultTitle: "차량 청취 음량 들쭉날쭉함 보정",
        platform: "web",
        smallestBuild:
          "랩 음악 파일 하나를 입력하면 차량 청취 기준으로 체감 음량을 한 번 균일화한 오디오 파일 하나를 즉시 반환하는 웹 화면",
      },
    ],
  },
  {
    id: "github-milestone-video",
    source: {
      id: "source-github-milestone-video",
      sourceName: "Milestone Clip",
      research: {
        key: "trustmrr:milestone-clip",
        url: "https://trustmrr.com/startup/milestone-clip",
      },
      platform: "web",
      value:
        "공개 GitHub 저장소의 별·포크 성과를 공유용 짧은 영상으로 만드는 웹 서비스",
      detail:
        "공개 저장소 URL 하나를 넣으면 저장소 이름과 최신 별·포크 수를 화면 비율에 맞춰 배치한 MP4 영상 하나를 만듭니다.",
      evidence:
        "TrustMRR 원본에서 GitHub 저장소 또는 사용자 입력 → 스타일·화면 비율 선택 → 1분 이내 공유용 MP4 생성 흐름 확인",
      preservedFlow:
        "공개 GitHub 저장소 URL 입력 → 저장소 이름·별·포크 수 배치 → 공유용 MP4 영상 확인",
    },
    payers: [
      {
        id: "payer-github-milestone-maintainer",
        value: "오픈소스 저장소 성과를 알리는 메인테이너",
        detail:
          "별과 포크 수가 늘 때마다 커뮤니티에 공유할 영상을 만들려고 저장소 화면을 캡처하고 편집 툴에서 수치를 배치합니다.",
      },
      {
        id: "payer-github-milestone-founder",
        value: "출시 성과를 보여줘야 하는 개발자 창업자",
        detail:
          "공개 저장소의 성장을 짧게 알리기 위해 저장소 정보를 확인하고 영상 템플릿에 수작업으로 옮기는 일을 반복합니다.",
      },
      {
        id: "payer-github-milestone-marketer",
        value: "프로젝트 홍보 콘텐츠를 만드는 개발자 마케터",
        detail:
          "오픈소스 프로젝트의 별·포크 성과를 게시물용 영상으로 바꿀 때마다 수치를 읽고 화면 비율별 영상을 따로 제작합니다.",
      },
    ],
    moments: [
      {
        id: "moment-github-milestone-changed",
        value: "공개 저장소 수치가 바뀌어 커뮤니티에 알릴 순간",
        detail:
          "성과가 신선할 때 짧은 영상을 바로 게시해야 하므로 디자인 프로그램에서 수치를 다시 배치할 시간이 없는 순간",
      },
      {
        id: "moment-github-milestone-stars",
        value: "프로젝트 별 수가 목표를 넘은 직후",
        detail:
          "커뮤니티에 달성 소식을 빠르게 공유하려면 공개 저장소의 최신 이름과 수치가 담긴 MP4가 즉시 필요한 순간",
      },
      {
        id: "moment-github-milestone-forks",
        value: "포크 증가를 주간 업데이트로 올릴 순간",
        detail:
          "주간 소식을 정해진 게시 시간에 맞춰야 해서 저장소 화면을 캡처하고 영상으로 편집하는 과정이 부담되는 순간",
      },
    ],
    twists: [
      {
        id: "twist-github-milestone-vertical",
        kind: "replace",
        value: "공개 저장소 성과를 세로형 MP4로 배치하기",
        detail:
          "공개 GitHub 저장소 URL 입력과 저장소 이름·별·포크 수를 영상으로 만드는 처리는 유지하고, 세로형 MP4 배치만 바꿉니다.",
        resultTitle: "저장소 성과 세로형 MP4 만들기",
        platform: "web",
        smallestBuild:
          "공개 GitHub 저장소 URL 하나를 입력하면 공개 저장소 이름·별·포크 수를 한 번 배치한 세로형 MP4 영상 하나를 즉시 제공하는 웹 화면",
      },
      {
        id: "twist-github-milestone-square",
        kind: "replace",
        value: "공개 저장소 성과를 정사각형 MP4로 배치하기",
        detail:
          "저장소 URL에서 공개 저장소 이름·별·포크 수를 가져와 MP4로 만드는 흐름은 유지하고, 정사각형 배치만 바꿉니다.",
        resultTitle: "저장소 성과 정사각형 MP4",
        platform: "web",
        smallestBuild:
          "공개 GitHub 저장소 URL 하나를 입력하면 저장소 이름·별·포크 수를 한 번 배치한 정사각형 MP4 영상 하나를 즉시 제공하는 웹 화면",
      },
      {
        id: "twist-github-milestone-horizontal",
        kind: "replace",
        value: "공개 저장소 성과를 가로형 MP4로 배치하기",
        detail:
          "공개 GitHub 저장소 URL 입력과 이름·별·포크 수의 영상 배치는 유지하고, 가로형 MP4 배치만 바꿉니다.",
        resultTitle: "저장소 성과 가로형 MP4",
        platform: "web",
        smallestBuild:
          "공개 GitHub 저장소 URL 하나를 입력하면 저장소 이름·별·포크 수를 한 번 배치한 가로형 MP4 영상 하나를 즉시 제공하는 웹 화면",
      },
    ],
  },
  {
    id: "video-frame-extractor",
    source: {
      id: "source-video-frame-extractor",
      sourceName: "Framera",
      research: {
        key: "trustmrr:framera",
        url: "https://trustmrr.com/startup/framera",
      },
      platform: "web",
      value:
        "영상 파일에서 원하는 시점의 고해상도 정지 이미지 한 장을 정확히 추출하는 도구",
      detail:
        "영상 파일 하나를 올리고 필요한 시점을 고르면 화면 캡처보다 선명한 원본 해상도의 이미지 파일 하나를 저장합니다.",
      evidence:
        "TrustMRR에서 실제 매출이 확인된 iOS 고해상도 영상 프레임 추출 제품",
      preservedFlow:
        "영상 파일 입력 → 필요한 시점 선택 → 고해상도 정지 이미지 저장",
    },
    payers: [
      {
        id: "payer-video-frame-youtube-editor",
        value: "유튜브 편집자",
        detail:
          "게시할 영상에서 썸네일이나 인용 장면으로 쓸 정확한 한 프레임을 반복해서 뽑아야 하며, 현재는 영상을 멈추고 화면을 캡처하거나 편집 프로그램에서 일일이 내보냅니다.",
      },
      {
        id: "payer-video-frame-shortform-creator",
        value: "숏폼 콘텐츠 제작자",
        detail:
          "릴스·쇼츠 게시 직전에 가장 선명한 한 장면을 이미지로 제출해야 하며, 현재는 재생바를 조금씩 움직여 캡처한 뒤 해상도를 다시 확인합니다.",
      },
      {
        id: "payer-video-frame-delivery-manager",
        value: "영상 제작사 납품 담당자",
        detail:
          "클라이언트에게 보낼 대표 정지 이미지를 영상마다 골라야 하며, 현재는 편집 도구에서 타임코드를 찾고 프레임을 수동 저장합니다.",
      },
    ],
    moments: [
      {
        id: "moment-video-frame-thumbnail",
        value: "게시 직전 썸네일 한 장이 필요할 때",
        detail:
          "업로드 화면에는 영상 파일만 있고 대표 이미지 제출이 바로 필요해, 지금 선명한 프레임을 저장하지 않으면 게시 일정이 밀립니다.",
      },
      {
        id: "moment-video-frame-client-review",
        value: "클라이언트 검수용 장면을 보내야 할 때",
        detail:
          "수정본 영상을 다시 설명할 시간이 없어 특정 순간을 이미지 한 장으로 즉시 전달해야 합니다.",
      },
      {
        id: "moment-video-frame-quotation",
        value: "영상에서 인용 이미지를 급히 뽑을 때",
        detail:
          "기사·제안서에 넣을 장면이 이미 정해져 있어 원본 영상을 다시 편집하지 않고 고해상도 파일이 필요합니다.",
      },
    ],
    twists: [
      {
        id: "twist-video-frame-png",
        kind: "replace",
        value: "원본 해상도 PNG로 프레임 저장",
        detail:
          "영상 파일 하나를 받아 정밀한 한 프레임을 추출하는 흐름은 유지하고, 결과 파일 형식만 원본 해상도 PNG로 바꿉니다.",
        resultTitle: "영상 한 장면을 원본 해상도 PNG로 저장",
        platform: "web",
        smallestBuild:
          "영상 파일 하나를 입력받아 지정 시점의 프레임을 한 번 추출하고 원본 해상도 PNG 이미지 파일 하나를 즉시 저장합니다.",
      },
      {
        id: "twist-video-frame-jpg",
        kind: "replace",
        value: "고화질 JPG로 프레임 저장",
        detail:
          "영상에서 정확한 프레임을 뽑는 입력과 정밀 추출 처리는 유지하고, 결과만 고화질 JPG 이미지 하나로 바꿉니다.",
        resultTitle: "영상 한 장면을 고화질 JPG로 저장",
        platform: "web",
        smallestBuild:
          "영상 파일 하나를 입력받아 지정 시점의 프레임을 한 번 추출하고 고화질 JPG 이미지 파일 하나를 즉시 저장합니다.",
      },
      {
        id: "twist-video-frame-timecode",
        kind: "add",
        value: "타임코드가 적힌 JPG 파일명으로 저장",
        detail:
          "영상 파일에서 한 프레임을 추출하는 과정은 그대로 두고, 결과 JPG 파일명에 해당 타임코드를 표시합니다.",
        resultTitle: "영상 프레임을 타임코드 JPG로 저장",
        platform: "web",
        smallestBuild:
          "영상 파일 하나를 입력받아 지정 시점의 프레임을 한 번 추출하고 타임코드가 들어간 JPG 파일 하나를 즉시 저장합니다.",
      },
    ],
  },
  {
    id: "large-file-share-link",
    source: {
      id: "source-large-file-share-link",
      sourceName: "FilexHost",
      research: {
        key: "trustmrr:filexhost",
        url: "https://trustmrr.com/startup/filexhost",
      },
      platform: "web",
      value:
        "일반 파일 하나를 업로드해 즉시 공유 가능한 다운로드·미리보기 URL 하나를 만드는 도구",
      detail:
        "민감하지 않은 파일 하나를 끌어 놓으면 별도 폴더나 협업 설정 없이 바로 전달할 수 있는 공유 링크 하나를 만듭니다.",
      evidence:
        "TrustMRR에서 파일 업로드 후 실시간 공유 URL·브라우저 미리보기·조회 분석을 제공하는 제품 확인",
      preservedFlow:
        "일반 파일 하나 업로드 → 공유 URL 생성 → 다운로드·미리보기 또는 조회 횟수 확인",
    },
    payers: [
      {
        id: "payer-large-file-video-creator",
        value: "메일 첨부 제한에 걸리는 1인 영상 제작자",
        detail:
          "완성 영상이나 원본 파일을 보낼 때마다 용량을 줄이거나 여러 조각으로 나눠 수작업으로 전달하고, 별도 공유 링크를 찾아 만듭니다.",
      },
      {
        id: "payer-large-file-freelance-designer",
        value: "큰 디자인 파일을 고객에게 보내는 프리랜서 디자이너",
        detail:
          "시안 파일이 메일에 들어가지 않아 매번 파일을 업로드하고 링크 권한을 확인한 뒤 고객에게 다시 전달합니다.",
      },
      {
        id: "payer-large-file-field-worker",
        value: "용량 큰 자료를 잠깐 공유하는 현장 실무자",
        detail:
          "회의나 검수 직전에 대용량 문서를 전달하려고 임시 업로드와 링크 복사를 반복하며, 오래 보관할 필요는 없습니다.",
      },
    ],
    moments: [
      {
        id: "moment-large-file-attachment-limit",
        value: "메일 첨부 제한으로 파일을 보낼 수 없을 때",
        detail:
          "상대방이 지금 파일을 받아야 하므로 첨부를 줄이거나 나누는 대신 즉시 열 수 있는 링크가 필요합니다.",
      },
      {
        id: "moment-large-file-client-delivery",
        value: "고객에게 큰 시안 파일을 바로 전달할 때",
        detail:
          "검수 요청을 미루지 않으려면 업로드가 끝난 직후 브라우저에서 확인할 공유 URL이 필요합니다.",
      },
      {
        id: "moment-large-file-before-meeting",
        value: "회의 직전 대용량 자료를 잠깐 공유할 때",
        detail:
          "회의 참석자가 지금 파일을 열어야 하므로 장기 보관이나 협업 설정 없이 즉시 전달 가능한 링크가 필요합니다.",
      },
    ],
    twists: [
      {
        id: "twist-large-file-direct-download",
        kind: "replace",
        value: "클릭하면 바로 다운로드되는 링크 만들기",
        detail:
          "파일 하나를 업로드해 공유 URL을 생성하는 구조는 유지하고, 공유 URL의 동작만 브라우저 미리보기 없이 즉시 다운로드로 바꿉니다.",
        resultTitle: "대용량 파일 바로 다운로드 링크",
        platform: "web",
        smallestBuild:
          "민감하지 않은 일반 파일 하나를 입력받아 한 번 업로드하고, 바로 다운로드되는 공유 링크 하나를 즉시 생성합니다.",
      },
      {
        id: "twist-large-file-browser-preview",
        kind: "add",
        value: "브라우저에서 바로 보는 파일 링크 만들기",
        detail:
          "파일 업로드와 공유 URL 생성은 유지하고, 결과 링크에서 지원되는 파일 형식의 브라우저 미리보기만 제공합니다.",
        resultTitle: "대용량 파일 브라우저 미리보기 링크",
        platform: "web",
        smallestBuild:
          "민감하지 않은 일반 파일 하나를 입력받아 한 번 업로드하고, 브라우저에서 미리 볼 수 있는 공유 링크 하나를 즉시 생성합니다.",
      },
      {
        id: "twist-large-file-view-count",
        kind: "add",
        value: "조회 횟수가 보이는 파일 링크 만들기",
        detail:
          "파일 업로드와 실시간 공유 링크 생성은 유지하고, 결과에 해당 링크의 조회 횟수만 표시합니다. 개인정보나 민감 파일은 받지 않습니다.",
        resultTitle: "조회 횟수가 보이는 파일 공유 링크",
        platform: "web",
        smallestBuild:
          "민감하지 않은 일반 파일 하나를 입력받아 한 번 업로드하고, 조회 횟수가 표시되는 공유 링크 하나를 즉시 생성합니다.",
      },
    ],
  },
  {
    id: "sheet-cut-layout",
    source: {
      id: "source-sheet-cut-layout",
      sourceName: "SketchCut PRO",
      research: {
        key: "app_store:1119117405",
        url: "https://apps.apple.com/in/app/sketchcut-pro/id1119117405",
      },
      platform: "app",
      value:
        "판재와 부품 치수 텍스트를 자투리가 적은 절단 배치 PDF 한 장으로 계산하는 제작 도구",
      detail:
        "판재 크기·톱날 폭·부품 치수와 수량을 한 번 입력하면 절단 조건을 반영해 부품을 배치하고 인쇄 가능한 PDF로 정리합니다.",
      evidence:
        "여러 국가 App Store에서 순위가 확인되고 판재 절단 배치 자동 계산·최적화·PDF 출력 기능이 명시된 제품",
      preservedFlow:
        "판재·부품 치수 입력 → 절단 조건과 배치 최적화 계산 → 인쇄 가능한 절단 배치 PDF",
    },
    payers: [
      {
        id: "payer-sheet-cut-woodworker",
        value: "맞춤 가구를 제작하는 소규모 목공 작업자",
        detail:
          "판재에서 여러 부품을 잘라낼 때 치수와 톱날 폭을 종이에 대조하며 배치를 손으로 짜고, 자투리와 재단 실수가 반복됩니다.",
      },
      {
        id: "payer-sheet-cut-kitchen-maker",
        value: "주방 가구 설치 전 판재를 발주하는 가구 제작자",
        detail:
          "부품 목록을 판재에 직접 그려 보며 필요한 장수와 절단 위치를 계산해야 해 주문 전 배치 검토에 시간이 많이 듭니다.",
      },
      {
        id: "payer-sheet-cut-interior-worker",
        value: "MDF·합판을 재단해 납품하는 인테리어 실무자",
        detail:
          "현장별 부품 치수와 수량을 수작업으로 배열하고 재단 순서를 정리하느라 주문 직전마다 계산 부담이 생깁니다.",
      },
    ],
    moments: [
      {
        id: "moment-sheet-cut-before-order",
        value: "재단소에 판재 주문을 넣기 직전",
        detail:
          "필요한 판재 수량과 자투리 발생을 지금 확인해야 잘못된 자재 주문과 추가 비용을 피할 수 있습니다.",
      },
      {
        id: "moment-sheet-cut-before-sawing",
        value: "톱질을 시작하기 전 작업대에서",
        detail:
          "부품을 어느 위치에서 잘라낼지 즉시 정해야 판재에 표시하고 재단을 바로 시작할 수 있습니다.",
      },
      {
        id: "moment-sheet-cut-after-change",
        value: "고객 치수 변경분을 새로 배치하는 순간",
        detail:
          "변경된 부품 목록을 다시 계산한 결과가 바로 필요해야 납기와 자재 사용량을 지체 없이 확정할 수 있습니다.",
      },
    ],
    twists: [
      {
        id: "twist-sheet-cut-minimize-waste",
        kind: "replace",
        value: "자투리 면적을 줄이는 배치 PDF 출력",
        detail:
          "판재와 부품 치수를 받아 절단 조건과 배치를 최적화하고 PDF로 제공하는 흐름은 유지하며, 자투리 최소 배치 결과만 바꿉니다.",
        resultTitle: "판재 치수로 자투리 최소 절단 배치 PDF",
        platform: "app",
        smallestBuild:
          "판재 크기 | 톱날 폭 | 부품 가로×세로×수량 목록 텍스트 블록 하나를 입력받아 배치를 한 번 계산하고, 자투리 최소 절단 배치 PDF 한 개를 즉시 제공합니다.",
      },
      {
        id: "twist-sheet-cut-order",
        kind: "add",
        value: "재단 순서가 표시된 배치 PDF 출력",
        detail:
          "판재와 부품 치수를 처리해 절단 조건과 최적 배치를 계산하는 메커니즘은 유지하고, 재단 순서 표시만 바꿉니다.",
        resultTitle: "판재 치수로 재단 순서 표시 PDF",
        platform: "app",
        smallestBuild:
          "판재 크기 | 톱날 폭 | 부품 가로×세로×수량 목록 텍스트 블록 하나를 입력받아 배치를 한 번 계산하고, 재단 순서가 표시된 PDF 한 개를 즉시 제공합니다.",
      },
      {
        id: "twist-sheet-cut-part-numbers",
        kind: "add",
        value: "부품 번호가 표시된 배치 PDF 출력",
        detail:
          "판재와 부품 치수를 받아 절단 조건과 배치를 계산해 PDF로 내보내는 흐름은 유지하고, 부품 번호 표시만 바꿉니다.",
        resultTitle: "판재 치수로 부품 번호 표시 절단 PDF",
        platform: "app",
        smallestBuild:
          "판재 크기 | 톱날 폭 | 부품 가로×세로×수량 목록 텍스트 블록 하나를 입력받아 배치를 한 번 계산하고, 부품 번호가 표시된 절단 PDF 한 개를 즉시 제공합니다.",
      },
    ],
  },
  {
    id: "mermaid-diagram-export",
    source: {
      id: "source-mermaid-diagram-export",
      sourceName: "mermaidonline.live",
      research: {
        key: "trustmrr:mermaidonline-live",
        url: "https://trustmrr.com/startup/mermaidonline-live",
      },
      platform: "web",
      value:
        "Mermaid 코드 블록을 문서에 바로 붙일 PNG·SVG 다이어그램 한 장으로 렌더링하는 도구",
      detail:
        "Mermaid 문법 텍스트 하나를 입력하면 다이어그램을 렌더링하고 투명 PNG, 고해상도 PNG 또는 편집 가능한 SVG 한 개로 내보냅니다.",
      evidence:
        "TrustMRR에 실제 매출 신호와 함께 Mermaid.js 문법을 다이어그램·차트로 렌더링하는 웹 편집기로 수집된 제품",
      preservedFlow:
        "Mermaid 코드 블록 입력 → 다이어그램 렌더링 → 문서에 붙일 PNG 또는 SVG 한 장",
    },
    payers: [
      {
        id: "payer-mermaid-export-1",
        value: "시스템 설계를 문서로 공유하는 백엔드 개발자",
        detail:
          "Mermaid 코드를 기술 문서·PR·발표 자료에 넣을 때마다 별도 렌더링 환경을 열어 결과를 확인하고 이미지 파일을 다시 저장한다.",
      },
      {
        id: "payer-mermaid-export-2",
        value: "설계 변경을 검토하는 개발팀 테크 리드",
        detail:
          "구조 변경을 리뷰할 때 Mermaid 코드가 문서와 슬라이드에서 어떻게 보이는지 확인하려고 여러 도구를 오가며 렌더링한다.",
      },
      {
        id: "payer-mermaid-export-3",
        value: "개발팀의 기술 발표를 준비하는 엔지니어링 매니저",
        detail:
          "PR·기술 문서의 Mermaid 코드를 발표 자료에도 재사용하려고 화면을 캡처하거나 다른 형식으로 반복 저장한다.",
      },
    ],
    moments: [
      {
        id: "moment-mermaid-export-1",
        value: "PR 설명에 다이어그램을 붙이기 직전",
        detail:
          "리뷰어에게 보일 구조가 맞는지 지금 즉시 확인해야 잘못된 문법으로 PR을 올리는 일을 막을 수 있다.",
      },
      {
        id: "moment-mermaid-export-2",
        value: "기술 문서에 흐름도를 삽입하기 직전",
        detail:
          "문서 마감 전에 코드가 실제 다이어그램으로 어떻게 보이는지 바로 확인해야 수정 시간을 확보할 수 있다.",
      },
      {
        id: "moment-mermaid-export-3",
        value: "발표 슬라이드에 시퀀스 그림을 넣기 직전",
        detail:
          "발표 자료를 마무리하려면 Mermaid 코드가 원하는 그림으로 렌더링되는지 즉시 확인해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-mermaid-export-1",
        kind: "replace",
        value: "투명 배경 PNG로 렌더링",
        detail:
          "Mermaid 코드 블록을 입력받아 다이어그램이나 차트로 렌더링하는 흐름은 유지하고, 투명 배경 PNG 출력만 바꾼다.",
        resultTitle: "Mermaid 코드의 투명 배경 PNG 다이어그램",
        platform: "web",
        smallestBuild:
          "Mermaid 코드 블록 텍스트 하나를 입력받아 렌더링을 한 번 실행하고, 투명 배경 PNG 다이어그램 파일 한 개를 즉시 보여준다.",
      },
      {
        id: "twist-mermaid-export-2",
        kind: "add",
        value: "2배 해상도 PNG로 렌더링",
        detail:
          "Mermaid 문법을 다이어그램이나 차트로 렌더링하는 메커니즘은 유지하고, 2배 해상도 PNG 출력만 바꾼다.",
        resultTitle: "Mermaid 코드의 2배 해상도 PNG 다이어그램",
        platform: "web",
        smallestBuild:
          "Mermaid 코드 블록 텍스트 하나를 입력받아 렌더링을 한 번 실행하고, 2배 해상도 PNG 다이어그램 파일 한 개를 즉시 보여준다.",
      },
      {
        id: "twist-mermaid-export-3",
        kind: "add",
        value: "편집 가능한 SVG로 렌더링",
        detail:
          "Mermaid 코드 블록을 받아 다이어그램이나 차트로 변환하는 흐름은 유지하고, 편집 가능한 SVG 출력만 바꾼다.",
        resultTitle: "Mermaid 코드의 편집 가능한 SVG 다이어그램",
        platform: "web",
        smallestBuild:
          "Mermaid 코드 블록 텍스트 하나를 입력받아 렌더링을 한 번 실행하고, 편집 가능한 SVG 다이어그램 파일 한 개를 즉시 보여준다.",
      },
    ],
  },
  {
    id: "sketch-line-art",
    source: {
      id: "source-sketch-line-art",
      sourceName: "Sketch Clean",
      research: {
        key: "app_store:6760979290",
        url: "https://apps.apple.com/us/app/sketch-clean/id6760979290",
      },
      platform: "app",
      value:
        "손그림 사진 한 장에서 종이색·그림자·연필 얼룩을 지워 투명 선화 PNG로 만드는 도구",
      detail:
        "노트나 흰 종이에 그린 스케치 사진 한 장을 입력하면 페이지를 보정하고 배경과 얼룩을 제거해 투명 배경 선화 PNG 한 개로 내보냅니다.",
      evidence:
        "App Store에 스케치 사진의 페이지 보정, 종이색·그림자·번짐 제거와 투명 배경 선화 출력 기능이 명시된 제품",
      preservedFlow:
        "스케치 사진 한 장 입력 → 페이지·배경·얼룩 정리 → 투명 배경 선화 PNG 한 장",
    },
    payers: [
      {
        id: "payer-sketch-line-art-1",
        value: "종이 스케치를 디지털 채색하는 독립 일러스트레이터",
        detail:
          "손그림을 채색·인쇄·레이어 작업에 쓰기 전에 종이색과 그림자와 연필 얼룩을 매번 수작업으로 지운다.",
      },
      {
        id: "payer-sketch-line-art-2",
        value: "아날로그 콘티를 디지털 원고로 옮기는 웹툰 작가",
        detail:
          "노트에 그린 선을 채색·인쇄·레이어 작업에 넣으려고 사진을 자르고 대비를 조정한 뒤 선만 다시 딴다.",
      },
      {
        id: "payer-sketch-line-art-3",
        value: "손그림 도안을 인쇄 파일로 만드는 굿즈 제작자",
        detail:
          "종이에 그린 도안을 디지털 채색·인쇄·레이어 작업에 사용하려고 종이 질감과 번짐을 반복해서 제거한다.",
      },
    ],
    moments: [
      {
        id: "moment-sketch-line-art-1",
        value: "손그림 사진을 디지털 채색에 넣기 직전",
        detail:
          "채색 레이어를 바로 시작하려면 종이 배경과 얼룩이 없는 투명 선화 PNG가 지금 필요하다.",
      },
      {
        id: "moment-sketch-line-art-2",
        value: "손그림 도안을 인쇄 파일로 넘기기 직전",
        detail:
          "종이 그림자와 얼룩이 인쇄되기 전에 선만 분리된 투명 PNG를 즉시 만들어야 한다.",
      },
      {
        id: "moment-sketch-line-art-3",
        value: "손그림 선을 디지털 레이어로 옮기는 순간",
        detail:
          "재드로잉 없이 다음 작업을 시작하려면 촬영한 한 장에서 정리된 투명 선화를 바로 얻어야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-sketch-line-art-1",
        kind: "replace",
        value: "종이 그림자까지 제거한 투명 선화 만들기",
        detail:
          "스케치 사진을 입력받아 페이지와 종이색과 그림자를 제거한 뒤 투명 배경 선화 PNG를 내보내는 흐름은 유지하고, 그림자 제거에만 초점을 둔다.",
        resultTitle: "스케치 사진의 종이 그림자 제거 선화",
        platform: "app",
        smallestBuild:
          "입력은 노트북 스케치 사진 1장이고, 한 번의 페이지 보정과 그림자 제거를 거쳐 투명 배경 선화 PNG 1개를 즉시 보여준다.",
      },
      {
        id: "twist-sketch-line-art-2",
        kind: "add",
        value: "연필 얼룩을 지운 투명 선화 만들기",
        detail:
          "스케치 사진에서 페이지를 보정하고 종이색을 제거해 투명 배경 PNG를 만드는 흐름은 유지하며, 연필 번짐 제거만 강조한다.",
        resultTitle: "연필 얼룩 제거 후 투명 선화 PNG",
        platform: "app",
        smallestBuild:
          "입력은 노트북 스케치 사진 1장이고, 한 번의 연필 번짐 제거 처리를 거쳐 투명 배경 선화 PNG 1개를 즉시 보여준다.",
      },
      {
        id: "twist-sketch-line-art-3",
        kind: "add",
        value: "흰 종이 배경을 투명하게 분리하기",
        detail:
          "사진 속 페이지를 보정하고 선을 분리해 PNG로 내보내는 흐름은 유지하며, 흰 배경을 투명 영역으로 바꾸는 처리만 바꾼다.",
        resultTitle: "흰 종이 배경을 투명 선화로 변환",
        platform: "app",
        smallestBuild:
          "입력은 흰 종이에 그린 스케치 사진 1장이고, 한 번의 배경 분리 처리를 거쳐 투명 배경 선화 PNG 1개를 즉시 보여준다.",
      },
    ],
  },
  {
    id: "doc-to-cms-draft",
    source: {
      id: "source-doc-to-cms-draft",
      sourceName: "Docswrite",
      research: {
        key: "trustmrr:docswrite",
        url: "https://trustmrr.com/startup/docswrite",
      },
      platform: "web",
      value:
        "Google Doc 원고를 제목·이미지 캡션·표가 깨지지 않는 CMS 게시 초안으로 바꾸는 도구",
      detail:
        "공개 Google Doc URL 하나를 입력하면 문서를 한 번 읽어 서식을 보존한 Gutenberg HTML 파일 한 개로 변환합니다.",
      evidence:
        "TrustMRR에서 최근 30일 매출 1,200달러가 확인되고 Google Doc을 WordPress·Contentful 등 CMS로 서식 손실 없이 옮기는 기능이 명시된 제품",
      preservedFlow:
        "공개 Google Doc URL 입력 → 문서 서식 보존 변환 → CMS에 붙여 넣을 Gutenberg HTML 파일",
    },
    payers: [
      {
        id: "payer-doc-to-cms-1",
        value: "주 3회 이상 블로그를 발행하는 콘텐츠 담당자",
        detail:
          "Google Doc을 WordPress로 옮길 때 제목·표·이미지가 자주 흐트러지며, 서식을 다시 손으로 고치는 시간이 반복된다.",
      },
      {
        id: "payer-doc-to-cms-2",
        value: "여러 고객 사이트에 글을 납품하는 콘텐츠 대행 실무자",
        detail:
          "작성된 문서를 CMS마다 복사해 붙여 넣고 깨진 문단과 표를 수정하는 작업을 매번 수행한다.",
      },
      {
        id: "payer-doc-to-cms-3",
        value: "제품 문서를 CMS에 게시하는 디지털 퍼블리셔",
        detail:
          "편집자가 만든 Google Doc을 게시용 형식으로 바꿔야 하며, 서식 손실 여부를 미리 확인하려고 수작업 검수를 한다.",
      },
    ],
    moments: [
      {
        id: "moment-doc-to-cms-1",
        value: "Google Doc 원고를 완성하고 CMS에 옮기기 직전",
        detail:
          "발행 일정이 이미 잡혀 있어 서식을 다시 고치는 지연 없이 바로 붙여 넣을 결과가 필요하다.",
      },
      {
        id: "moment-doc-to-cms-2",
        value: "클라이언트 원고를 WordPress에 납품하기 직전",
        detail:
          "고객에게 보낼 게시 초안의 제목과 표가 깨지지 않았는지 즉시 확인해야 한다.",
      },
      {
        id: "moment-doc-to-cms-3",
        value: "긴 문서를 CMS 편집기에 처음 붙여 넣는 순간",
        detail:
          "전체 문서를 다시 손질하기 전에 게시 가능한 형식인지 한 번에 판단해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-doc-to-cms-1",
        kind: "replace",
        value: "제목 계층을 보존한 게시 초안 만들기",
        detail:
          "공개 Google Doc URL을 읽어 CMS용 형식으로 변환하는 흐름은 유지하고 제목 단계만 보존한다.",
        resultTitle: "Google Doc 제목 계층 보존 게시 초안",
        platform: "web",
        smallestBuild:
          "공개 Google Doc URL 하나를 입력하면 문서를 한 번 변환해 제목 계층이 보존된 Gutenberg HTML 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-doc-to-cms-2",
        kind: "add",
        value: "이미지 캡션까지 보존한 게시 초안 만들기",
        detail:
          "공개 Google Doc URL 입력과 서식 보존 변환은 유지하고 이미지와 연결된 캡션만 함께 옮긴다.",
        resultTitle: "이미지 캡션이 남은 CMS 게시 초안",
        platform: "web",
        smallestBuild:
          "공개 Google Doc URL 하나를 입력하면 문서를 한 번 변환해 이미지 캡션이 포함된 Gutenberg HTML 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-doc-to-cms-3",
        kind: "add",
        value: "표 모양을 유지한 게시 초안 만들기",
        detail:
          "공개 Google Doc URL을 CMS 형식으로 바꾸는 처리는 유지하고 문서의 표 구조만 유지한다.",
        resultTitle: "표가 깨지지 않는 CMS 게시 초안",
        platform: "web",
        smallestBuild:
          "공개 Google Doc URL 하나를 입력하면 문서를 한 번 변환해 표 구조가 보존된 Gutenberg HTML 파일 하나를 즉시 제공한다.",
      },
    ],
  },
  {
    id: "scene-white-balance",
    source: {
      id: "source-scene-white-balance",
      sourceName: "White Balance Meter AI - KEV",
      research: {
        key: "app_store:1494197457",
        url: "https://apps.apple.com/au/app/white-balance-meter-ai-kev/id1494197457",
      },
      platform: "app",
      value:
        "촬영 장면을 비추면 DSLR에 바로 넣을 색온도·화이트밸런스 값을 보여 주는 현장 촬영 도구",
      detail:
        "단일 카메라 권한으로 조명 장면을 한 번 분석해 Kelvin 수치 또는 보정 권장값이 담긴 결과 한 개를 즉시 제공합니다.",
      evidence:
        "App Store 원본은 내장 카메라로 실시간 장면을 분석해 Kelvin 색온도·보정값·측정 스냅샷을 제공한다고 명시하고, 수집 시점 검색 순위 94위가 확인됩니다.",
      preservedFlow:
        "촬영 장면 카메라 입력 → 색온도 한 번 분석 → Kelvin·화이트밸런스 결과",
    },
    payers: [
      {
        id: "payer-scene-white-balance-1",
        value: "색을 맞춰 제품 사진을 납품하는 사진가",
        detail:
          "촬영 장소와 조명이 바뀔 때마다 흰색 기준이 달라져 보정 시간이 늘고, 눈대중으로 카메라 화이트밸런스를 맞춘다.",
      },
      {
        id: "payer-scene-white-balance-2",
        value: "현장 조명을 맞추는 영상 촬영감독",
        detail:
          "광원별 색온도를 촬영마다 확인해야 하며, 전문 색온도계 없이 화면을 보며 Kelvin 값을 추정한다.",
      },
      {
        id: "payer-scene-white-balance-3",
        value: "소규모 스튜디오 조명을 담당하는 운영자",
        detail:
          "제품과 인물 촬영 전 조명 색을 반복 측정해야 하고, 촬영 후 색 불일치를 줄이려고 여러 번 재촬영한다.",
      },
    ],
    moments: [
      {
        id: "moment-scene-white-balance-1",
        value: "첫 제품 촬영을 시작하기 직전",
        detail:
          "첫 프레임부터 색이 틀리면 전체 촬영물을 다시 보정해야 하므로 지금 기준값이 필요하다.",
      },
      {
        id: "moment-scene-white-balance-2",
        value: "촬영 중 광원을 교체한 직후",
        detail:
          "새 조명의 색온도를 바로 확인해야 이전 장면과 색을 맞춰 이어 촬영할 수 있다.",
      },
      {
        id: "moment-scene-white-balance-3",
        value: "색이 어긋난 장면을 재촬영하기 직전",
        detail:
          "재촬영 전에 현재 광원의 Kelvin 값을 알아야 같은 색 불일치를 반복하지 않는다.",
      },
    ],
    twists: [
      {
        id: "twist-scene-white-balance-1",
        kind: "replace",
        value: "장면의 색온도를 Kelvin 수치로 보여주기",
        detail:
          "카메라 장면을 받아 색온도를 분석하는 흐름은 유지하고, 측정값을 Kelvin 수치로 표시하는 결과만 바꾼다.",
        resultTitle: "촬영 장면 색온도 Kelvin 측정",
        platform: "app",
        smallestBuild:
          "단일 카메라 권한으로 조명 장면을 한 번 비추고 분석하여 현재 색온도 Kelvin 수치 하나를 즉시 보여준다.",
      },
      {
        id: "twist-scene-white-balance-2",
        kind: "add",
        value: "화이트밸런스 보정용 권장값을 보여주기",
        detail:
          "카메라 장면을 받아 색온도를 분석하는 흐름은 유지하고, 촬영에 적용할 보정 권장값 표시만 바꾼다.",
        resultTitle: "조명 장면 화이트밸런스 권장값",
        platform: "app",
        smallestBuild:
          "단일 카메라 권한으로 조명 장면을 한 번 비추고 분석하여 화이트밸런스 보정 권장값 하나를 즉시 보여준다.",
      },
      {
        id: "twist-scene-white-balance-3",
        kind: "add",
        value: "측정 장면과 Kelvin 값을 한 컷에 담기",
        detail:
          "카메라 장면을 받아 색온도를 분석하는 흐름은 유지하고, 측정 장면과 Kelvin 값을 함께 담는 표시만 바꾼다.",
        resultTitle: "색온도 수치가 찍힌 조명 장면",
        platform: "app",
        smallestBuild:
          "단일 카메라 권한으로 조명 장면을 한 번 비추고 분석하여 Kelvin 수치가 함께 표시된 스냅샷 하나를 즉시 보여준다.",
      },
    ],
  },
  {
    id: "raster-to-svg",
    source: {
      id: "source-raster-to-svg",
      sourceName: "Vectorize!",
      research: {
        key: "app_store:1520204499",
        url: "https://apps.apple.com/gb/app/vectorize/id1520204499",
      },
      platform: "app",
      value:
        "저해상도 JPG·PNG 로고를 확대·인쇄·커팅에 쓸 수 있는 SVG 한 파일로 바꾸는 도구",
      detail:
        "이미지 파일 하나를 입력하면 윤곽 옵션을 적용해 한 번 벡터 변환하고 바로 쓸 수 있는 SVG 파일 한 개를 만듭니다.",
      evidence:
        "App Store 원본은 JPG·PNG·TIFF·HEIC·GIF를 세부 수준·추가 윤곽·모서리 보정 옵션으로 벡터화해 SVG로 내보낸다고 명시하고, 수집 시점 카테고리 16위가 확인됩니다.",
      preservedFlow:
        "래스터 이미지 파일 입력 → 윤곽 벡터 변환 → 확대 가능한 SVG 파일",
    },
    payers: [
      {
        id: "payer-raster-to-svg-1",
        value: "소형 인쇄소에서 대형 출력하는 디자이너",
        detail:
          "저해상도 로고나 도안을 큰 판넬로 반복 출력해야 하며, 픽셀 깨짐을 막으려고 외주 변환이나 수동 윤곽 작업을 맡긴다.",
      },
      {
        id: "payer-raster-to-svg-2",
        value: "레이저 커팅 공방을 운영하는 제작자",
        detail:
          "고객 이미지마다 커팅 가능한 윤곽 파일이 필요하고, 래스터 이미지를 벡터 선으로 다시 따는 작업을 반복한다.",
      },
      {
        id: "payer-raster-to-svg-3",
        value: "로고 원본을 납품하는 프리랜서 디자이너",
        detail:
          "고객이 보낸 JPG·PNG 로고를 확대 가능한 파일로 바꿔야 하며, 펜툴로 외곽선을 직접 그리는 시간이 든다.",
      },
    ],
    moments: [
      {
        id: "moment-raster-to-svg-1",
        value: "저해상도 로고를 제작 파일로 넘기기 직전",
        detail:
          "인쇄·커팅·브랜드 납품 모두 픽셀이 깨지지 않는 SVG 원본이 있어야 다음 제작 단계로 넘어갈 수 있다.",
      },
      {
        id: "moment-raster-to-svg-2",
        value: "확대하자 픽셀 윤곽이 깨진 것을 발견한 순간",
        detail:
          "출력 방식과 관계없이 깨진 경계를 그대로 넘기면 재작업이 생기므로 벡터 변환 결과가 즉시 필요하다.",
      },
      {
        id: "moment-raster-to-svg-3",
        value: "확대 가능한 로고 원본 SVG를 요청받은 순간",
        detail:
          "인쇄소·공방·프리랜서 모두 고객 요청에 맞춰 바로 쓸 수 있는 SVG 한 개를 전달해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-raster-to-svg-1",
        kind: "replace",
        value: "윤곽선을 단순화한 SVG로 변환",
        detail:
          "JPG 또는 PNG 파일을 벡터로 변환해 SVG로 내보내는 흐름은 유지하고, 결과 윤곽을 단순화하는 옵션만 바꾼다.",
        resultTitle: "픽셀 로고의 단순화 SVG 윤곽선",
        platform: "app",
        smallestBuild:
          "JPG 또는 PNG 파일 하나를 입력하고, 픽셀 그래픽을 한 번 벡터 변환해 윤곽이 단순화된 SVG 파일 하나를 즉시 만든다.",
      },
      {
        id: "twist-raster-to-svg-2",
        kind: "add",
        value: "모서리를 매끄럽게 다듬은 SVG로 변환",
        detail:
          "이미지 파일을 SVG로 변환하는 입력·처리는 유지하며, 변환 결과의 각진 모서리를 매끄럽게 하는 옵션만 바꾼다.",
        resultTitle: "깨진 로고 모서리를 다듬은 SVG",
        platform: "app",
        smallestBuild:
          "JPG 또는 PNG 파일 하나를 입력하고, 픽셀 그래픽을 한 번 벡터 변환해 모서리가 매끄러운 SVG 파일 하나를 즉시 만든다.",
      },
      {
        id: "twist-raster-to-svg-3",
        kind: "add",
        value: "세부 수준을 낮춘 SVG로 변환",
        detail:
          "픽셀 그래픽을 벡터화해 SVG로 내보내는 흐름은 유지하고, 결과에 남기는 윤곽 세부 수준만 바꾼다.",
        resultTitle: "복잡한 이미지의 간결한 SVG 윤곽",
        platform: "app",
        smallestBuild:
          "JPG 또는 PNG 파일 하나를 입력하고, 픽셀 그래픽을 한 번 벡터 변환해 세부 수준을 낮춘 SVG 파일 하나를 즉시 만든다.",
      },
    ],
  },
  {
    id: "notion-page-to-pdf",
    source: {
      id: "source-notion-page-to-pdf",
      sourceName: "Print Notion - Export Notion to PDF",
      research: {
        key: "chrome_web_store:ijaopicbldggjdgbnfdlkljeggibmcha",
        url: "https://chromewebstore.google.com/detail/print-notion-export-notio/ijaopicbldggjdgbnfdlkljeggibmcha",
      },
      platform: "web",
      value:
        "공개 Notion 페이지를 표·이미지·다크 배치가 유지되는 전달용 PDF로 바꾸는 도구",
      detail:
        "공개 Notion 페이지 URL 하나를 입력하면 페이지를 한 번 렌더링해 선택한 배치 보존 기준이 적용된 PDF 파일 한 개로 변환합니다.",
      evidence:
        "Chrome Web Store 원본은 Notion을 PDF로 내보내면서 레이아웃·표·다크 모드를 유지한다고 명시하고, 수집 시점 검색 순위 4위와 평점 4.8이 확인됩니다.",
      preservedFlow:
        "공개 Notion 페이지 URL 입력 → 레이아웃 보존 렌더링 → 전달·인쇄 가능한 PDF 파일",
    },
    payers: [
      {
        id: "payer-notion-pdf-1",
        value: "고객에게 노션 문서를 납품하는 프리랜서",
        detail:
          "페이지 레이아웃과 표가 무너지지 않는 PDF를 만들려고 노션 내용을 복사해 문서 편집기에서 다시 손본다.",
      },
      {
        id: "payer-notion-pdf-2",
        value: "수업 자료를 인쇄해 배포하는 교사",
        detail:
          "노션의 표와 이미지가 인쇄용으로 잘리는 문제를 막기 위해 페이지마다 미리보기와 편집을 반복한다.",
      },
      {
        id: "payer-notion-pdf-3",
        value: "운영 매뉴얼을 외부 협력사에 보내는 팀 리더",
        detail:
          "공유용 노션 페이지를 고정된 PDF로 바꾸면서 다크 페이지 대비와 표 페이지 나눔을 수작업으로 조정한다.",
      },
    ],
    moments: [
      {
        id: "moment-notion-pdf-1",
        value: "노션 페이지를 고정 파일로 전달하기 직전",
        detail:
          "받는 사람이 노션을 쓰지 않아도 표·이미지·배경이 흐트러지지 않는 PDF 한 개가 지금 필요하다.",
      },
      {
        id: "moment-notion-pdf-2",
        value: "노션 문서를 인쇄 상태로 검수할 순간",
        detail:
          "종이나 PDF 화면에서 표 잘림·이미지 비율·다크 배경 대비가 유지되는지 전달 전에 확인해야 한다.",
      },
      {
        id: "moment-notion-pdf-3",
        value: "노션 원본을 열 수 없는 사람에게 보낼 순간",
        detail:
          "로그인이나 편집 권한을 요구하지 않고 누구나 같은 배치로 읽는 PDF 파일을 바로 만들어야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-notion-pdf-1",
        kind: "replace",
        value: "표 페이지 나눔을 우선 보존하기",
        detail:
          "노션 URL을 PDF로 변환하고 레이아웃과 이미지를 유지하는 흐름은 그대로 두며, 표가 행 중간에서 끊기지 않도록 페이지 나눔만 우선한다.",
        resultTitle: "노션 표 잘림 없는 인쇄용 PDF",
        platform: "web",
        smallestBuild:
          "공개 Notion 페이지 URL 하나를 입력하면 페이지를 PDF로 변환해 표 페이지 나눔이 보존된 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-notion-pdf-2",
        kind: "add",
        value: "이미지 원본 비율을 고정하기",
        detail:
          "노션 페이지를 레이아웃 보존 PDF로 바꾸는 처리와 결과는 유지하고, 삽입 이미지의 원본 비율만 고정한다.",
        resultTitle: "노션 이미지 비율 보존 PDF",
        platform: "web",
        smallestBuild:
          "공개 Notion 페이지 URL 하나를 입력하면 내용을 PDF로 변환해 이미지 비율이 보존된 파일 하나를 즉시 만든다.",
      },
      {
        id: "twist-notion-pdf-3",
        kind: "add",
        value: "다크 페이지 인쇄 대비를 보존하기",
        detail:
          "노션 URL을 PDF로 변환하며 레이아웃과 표를 유지하는 구조는 같고, 다크 페이지의 인쇄 대비만 읽기 좋게 보존한다.",
        resultTitle: "노션 다크 페이지 인쇄용 PDF",
        platform: "web",
        smallestBuild:
          "공개 Notion 페이지 URL 하나를 입력하면 페이지를 PDF로 변환해 다크 페이지 대비가 보존된 파일 하나를 즉시 보여준다.",
      },
    ],
  },
  {
    id: "chrome-extension-static-audit",
    source: {
      id: "source-chrome-extension-static-audit",
      sourceName: "Seerguard",
      research: {
        key: "chrome_web_store:nkgaaaiaadfgellaglahphkfjipcgmin",
        url: "https://chromewebstore.google.com/detail/seerguard/nkgaaaiaadfgellaglahphkfjipcgmin",
      },
      platform: "web",
      value:
        "Chrome 확장 CRX의 과도한 권한·외부 전송·난독화 위치를 설치 전에 보여 주는 정적 감사 도구",
      detail:
        "CRX 파일 하나를 입력하면 manifest와 스크립트를 한 번 정적으로 검사해 선택한 위험 단서의 파일 위치가 표시된 HTML 보고서 한 개를 만듭니다.",
      evidence:
        "Chrome Web Store 원본은 확장의 위협·의심 권한·악성 동작을 검사한다고 명시하고, 수집 시점 카테고리 9위와 평점 5.0이 확인됩니다.",
      preservedFlow:
        "Chrome 확장 CRX 파일 입력 → 권한·도메인·스크립트 정적 검사 → 위험 근거 위치 HTML 보고서",
    },
    payers: [
      {
        id: "payer-extension-audit-1",
        value: "사내 확장 프로그램 배포를 맡은 IT 관리자",
        detail:
          "직원 브라우저에 설치할 확장 프로그램마다 권한과 악성 여부를 수작업으로 검토하느라 배포가 늦어진다.",
      },
      {
        id: "payer-extension-audit-2",
        value: "고객사 브라우저 보안을 점검하는 보안 컨설턴트",
        detail:
          "고객이 전달한 CRX 파일의 외부 통신과 의심 권한을 압축 해제해 소스별로 확인한다.",
      },
      {
        id: "payer-extension-audit-3",
        value: "여러 고객의 업무용 브라우저를 관리하는 프리랜서",
        detail:
          "고객별 확장 프로그램 설치 전 위험 신호를 반복해서 찾아야 해 매번 개발자 도구와 파일 검색을 사용한다.",
      },
    ],
    moments: [
      {
        id: "moment-extension-audit-1",
        value: "새 Chrome 확장 설치를 승인하기 직전",
        detail:
          "업무 브라우저에 CRX를 배포하기 전에 권한·외부 전송·난독화 위치 중 위험 근거를 문서로 확인해야 한다.",
      },
      {
        id: "moment-extension-audit-2",
        value: "확장 프로그램 보안 근거를 보고할 순간",
        detail:
          "과도한 권한·외부 도메인·난독화 스크립트 위치를 추측이 아니라 정적 검사 결과로 제출해야 한다.",
      },
      {
        id: "moment-extension-audit-3",
        value: "다른 사람에게 설치 여부를 설명할 순간",
        detail:
          "CRX 파일에서 찾은 구체적인 위치와 근거를 보여 주며 설치 승인 또는 보류 이유를 바로 전달해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-extension-audit-1",
        kind: "replace",
        value: "과도한 권한 위치를 먼저 보여주는 검사",
        detail:
          "CRX 파일을 스캔해 위협·의심 권한·악성 동작을 확인하는 흐름은 유지하고, 권한 목록에서 과도한 항목의 위치만 먼저 강조한다.",
        resultTitle: "확장 프로그램 과도한 권한 위치 보고서",
        platform: "web",
        smallestBuild:
          "CRX 파일 하나를 올리면 확장 프로그램 권한을 정적으로 스캔해 과도한 권한 위치를 표시한 HTML 보고서 하나를 즉시 보여준다.",
      },
      {
        id: "twist-extension-audit-2",
        kind: "add",
        value: "외부 전송 도메인을 묶어 보여주는 검사",
        detail:
          "확장 프로그램 입력과 위협·권한·악성 동작 스캔은 유지하고, 코드에 포함된 외부 전송 도메인만 한눈에 묶어 표시한다.",
        resultTitle: "확장 프로그램 외부 전송 도메인 보고서",
        platform: "web",
        smallestBuild:
          "CRX 파일 하나를 올리면 내부 코드를 정적으로 스캔해 외부 전송 도메인 목록 하나가 담긴 HTML 보고서를 즉시 만든다.",
      },
      {
        id: "twist-extension-audit-3",
        kind: "add",
        value: "난독화 스크립트 파일을 표시하는 검사",
        detail:
          "CRX 파일의 위협·의심 권한·악성 동작을 정적으로 확인하는 구조는 유지하고, 난독화가 의심되는 스크립트 파일 위치만 표시한다.",
        resultTitle: "확장 프로그램 난독화 스크립트 위치표",
        platform: "web",
        smallestBuild:
          "CRX 파일 하나를 올리면 포함 스크립트를 정적으로 스캔해 난독화 의심 파일 위치 하나를 HTML로 즉시 보여준다.",
      },
    ],
  },
  {
    id: "maps-route-to-gpx",
    source: {
      id: "source-maps-route-to-gpx",
      sourceName: "Google Maps Extended Routes",
      research: {
        key: "chrome_web_store:okeampldbdmpachkggljgpngbooaclal",
        url: "https://chromewebstore.google.com/detail/google-maps-extended-rout/okeampldbdmpachkggljgpngbooaclal",
      },
      platform: "web",
      value:
        "Google Maps 장거리 경로를 경유지·구간·회차점 정보가 남는 라이딩 GPX로 바꾸는 도구",
      detail:
        "경유지가 포함된 공개 Google Maps 경로 URL 하나를 입력하면 경로를 한 번 변환해 선택한 구조가 보존된 GPX 파일 한 개를 제공합니다.",
      evidence:
        "Chrome Web Store 원본은 자전거·오토바이 장거리 경로 편집·최적화·내보내기를 명시하고, 수집 시점 카테고리 7위와 평점 5.0이 확인됩니다.",
      preservedFlow:
        "공개 Google Maps 경로 URL 입력 → 경로 구조 변환 → 기기·참가자에게 전달할 GPX 파일",
    },
    payers: [
      {
        id: "payer-route-gpx-1",
        value: "라이딩 코스를 짜는 자전거 동호회 운영자",
        detail:
          "참가자에게 보낼 장거리 경로를 지도에서 직접 편집하고 구간별 파일로 다시 정리한다.",
      },
      {
        id: "payer-route-gpx-2",
        value: "고객 투어를 준비하는 오토바이 투어 가이드",
        detail:
          "경유지와 회차점을 포함한 긴 경로를 수작업으로 다듬어 참가자에게 전달한다.",
      },
      {
        id: "payer-route-gpx-3",
        value: "장거리 라이딩 영상을 만드는 콘텐츠 제작자",
        detail:
          "촬영용 코스를 공개하기 전 지도 경로를 편집하고 공유 가능한 GPX로 다시 만든다.",
      },
    ],
    moments: [
      {
        id: "moment-route-gpx-1",
        value: "확정한 장거리 경로를 기기에 넣기 직전",
        detail:
          "Google Maps에서 만든 경유지와 트랙을 잃지 않은 GPX 파일을 내비게이션 기기에 바로 옮겨야 한다.",
      },
      {
        id: "moment-route-gpx-2",
        value: "경로의 구간과 회차점을 함께 공유할 순간",
        detail:
          "긴 경로를 따라갈 사람이 경유지·구간·회차점을 같은 파일에서 확인하도록 GPX 한 개를 보내야 한다.",
      },
      {
        id: "moment-route-gpx-3",
        value: "출발 전에 경로 파일을 최종 확인할 순간",
        detail:
          "경유지·구간 분리·회차점 이름 중 필요한 정보가 GPX에 남았는지 실제 이동 전에 확인해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-route-gpx-1",
        kind: "replace",
        value: "경유지를 보존한 GPX로 내보내기",
        detail:
          "공개 Google Maps 경로를 입력받아 경로를 편집·최적화하고 기존 경유지를 보존한 GPX 파일로 내보낸다.",
        resultTitle: "경유지 보존 장거리 경로 GPX",
        platform: "web",
        smallestBuild:
          "경유지가 포함된 공개 Google Maps 경로 URL 1개를 받아 경로를 1회 편집·최적화하고 경유지 보존 GPX 파일 1개를 제공한다.",
      },
      {
        id: "twist-route-gpx-2",
        kind: "add",
        value: "구간별 트랙으로 나눈 GPX로 내보내기",
        detail:
          "경로 편집과 최적화는 유지하고 결과 GPX만 구간별 트랙으로 나누어 제공한다.",
        resultTitle: "구간별로 나눈 라이딩 경로 GPX",
        platform: "web",
        smallestBuild:
          "경유지가 포함된 공개 Google Maps 경로 URL 1개를 받아 경로를 1회 편집·최적화하고 구간별 트랙 GPX 파일 1개를 제공한다.",
      },
      {
        id: "twist-route-gpx-3",
        kind: "add",
        value: "회차점 이름을 포함한 GPX로 내보내기",
        detail:
          "지도 경로를 편집·최적화하는 원래 흐름은 유지하며 회차점 이름을 결과 GPX에 포함한다.",
        resultTitle: "회차점 이름 포함 라이딩 GPX",
        platform: "web",
        smallestBuild:
          "경유지가 포함된 공개 Google Maps 경로 URL 1개를 받아 경로를 1회 편집·최적화하고 회차점 이름 포함 GPX 파일 1개를 제공한다.",
      },
    ],
  },
  {
    id: "pdf-layout-translation",
    source: {
      id: "source-pdf-layout-translation",
      sourceName: "PDF-Translator",
      research: {
        key: "trustmrr:pdf-translator",
        url: "https://trustmrr.com/startup/pdf-translator",
      },
      platform: "web",
      value:
        "영어 PDF 문서를 표·그림·각주 위치가 유지된 한국어 PDF 한 파일로 바꾸는 도구",
      detail:
        "영어 PDF 파일 하나를 입력하면 원본 레이아웃과 서식을 유지하면서 한국어로 번역해 수정 가능한 PDF 한 파일로 내보냅니다.",
      evidence:
        "TrustMRR에 원본 레이아웃과 서식을 보존하는 PDF 번역기이자 통합 편집기로 수집된 제품",
      preservedFlow:
        "영어 PDF 파일 입력 → 레이아웃 보존 한국어 번역 → 표·그림·각주가 유지된 번역 PDF 파일",
    },
    payers: [
      {
        id: "payer-pdf-layout-translation-1",
        value: "해외 매뉴얼을 한국어로 바꾸는 기술문서 담당자",
        detail:
          "영어 PDF의 문장을 번역하고 표와 그림 위치를 맞추느라 원본과 번역본을 오가며 수작업 편집을 반복한다.",
      },
      {
        id: "payer-pdf-layout-translation-2",
        value: "외국 자료를 빠르게 검토하는 기업 리서처",
        detail:
          "영어 보고서를 한국어로 옮긴 뒤 회의용 PDF를 다시 만들며 페이지 배치와 서식을 손으로 정리한다.",
      },
      {
        id: "payer-pdf-layout-translation-3",
        value: "수입 관련 영어 서류를 처리하는 무역 실무자",
        detail:
          "거래처 PDF를 번역해 내부 공유본으로 만들 때 표·각주·페이지 구성을 직접 보정하는 일이 반복된다.",
      },
    ],
    moments: [
      {
        id: "moment-pdf-layout-translation-1",
        value: "외국어 PDF 문서를 막 전달받은 직후",
        detail:
          "내용을 읽고 회신해야 하는 시간이 촉박해 원본 레이아웃을 유지한 한국어본이 바로 필요하다.",
      },
      {
        id: "moment-pdf-layout-translation-2",
        value: "내부 회의용 번역 PDF를 공유하기 직전",
        detail:
          "표와 그림이 어긋나면 검토가 어려워 지금 바로 공유 가능한 형태로 만들어야 한다.",
      },
      {
        id: "moment-pdf-layout-translation-3",
        value: "표와 그림을 유지한 번역본을 회의에서 열어야 하는 순간",
        detail:
          "회의가 곧 시작되므로 페이지를 다시 편집할 시간 없이 한국어 PDF가 즉시 필요하다.",
      },
    ],
    twists: [
      {
        id: "twist-pdf-layout-translation-1",
        kind: "replace",
        value: "표 배치를 우선 보존하는 한국어 번역 PDF",
        detail:
          "영어 PDF의 한국어 번역과 원본 레이아웃 유지는 유지하고 표 배치를 특히 보존한다.",
        resultTitle: "표 배치를 유지한 영어 PDF 한국어 번역",
        platform: "web",
        smallestBuild:
          "영어 PDF 문서 파일 하나를 입력받아 한국어로 번역하면서 표 배치를 유지하고 번역 PDF 파일 한 개를 즉시 만든다.",
      },
      {
        id: "twist-pdf-layout-translation-2",
        kind: "add",
        value: "이미지 캡션을 우선 보존하는 한국어 번역 PDF",
        detail:
          "문서 번역과 원본 서식 유지는 유지하고 이미지 아래 캡션 위치와 문구를 특히 보존한다.",
        resultTitle: "이미지 캡션을 살린 PDF 한국어 번역",
        platform: "web",
        smallestBuild:
          "영어 PDF 문서 파일 하나를 입력받아 한국어로 번역하면서 이미지 캡션 배치를 유지하고 번역 PDF 파일 한 개를 즉시 만든다.",
      },
      {
        id: "twist-pdf-layout-translation-3",
        kind: "add",
        value: "각주 링크를 우선 보존하는 한국어 번역 PDF",
        detail:
          "영어 PDF의 번역과 수정 가능한 결과는 유지하고 각주 링크의 위치와 연결만 특히 보존한다.",
        resultTitle: "각주 링크를 보존한 PDF 한국어 번역",
        platform: "web",
        smallestBuild:
          "영어 PDF 문서 파일 하나를 입력받아 한국어로 번역하면서 각주 링크를 유지하고 수정 가능한 번역 PDF 파일 한 개를 즉시 만든다.",
      },
    ],
  },
  {
    id: "freight-invoice-internal-audit",
    source: {
      id: "source-freight-invoice-internal-audit",
      sourceName: "DocuAudit",
      research: {
        key: "trustmrr:docuaudit",
        url: "https://trustmrr.com/startup/docuaudit",
      },
      platform: "web",
      value:
        "화물 청구서 PDF 안의 합계 불일치·동일 비용 중복·필수 필드 누락을 감사 CSV로 바꾸는 도구",
      detail:
        "운송사 화물 청구서 PDF 파일 하나를 입력하면 문서 안의 비용 행과 필드를 검사해 확인 위치가 표시된 감사 CSV 한 파일로 내보냅니다.",
      evidence:
        "TrustMRR에 물류·재무팀이 복잡한 운송사 문서를 신뢰할 수 있고 감사 가능한 데이터로 바꾸는 화물 청구서 감사 플랫폼으로 수집된 제품",
      preservedFlow:
        "화물 청구서 PDF 입력 → 문서 내부 비용·필드 감사 → 확인 위치가 표시된 감사 CSV 파일",
    },
    payers: [
      {
        id: "payer-freight-invoice-audit-1",
        value: "운송사 청구서를 대조하는 물류사 정산 담당자",
        detail:
          "화물 청구서의 운임과 항목을 문서 안에서 줄마다 확인하고 합계를 다시 계산하는 작업을 매월 반복한다.",
      },
      {
        id: "payer-freight-invoice-audit-2",
        value: "운송비 증빙을 검토하는 화주 재무 담당자",
        detail:
          "받은 운송사 PDF에서 비용 항목과 합계를 수작업으로 대조해 지급 전 오류를 찾아낸다.",
      },
      {
        id: "payer-freight-invoice-audit-3",
        value: "여러 화물 비용을 검수하는 3PL 비용 검수자",
        detail:
          "운송장과 청구서의 필수 항목을 확인하고 중복 비용이나 누락을 표시하는 일을 월말마다 반복한다.",
      },
    ],
    moments: [
      {
        id: "moment-freight-invoice-audit-1",
        value: "운송사 화물 청구서 PDF를 막 받은 직후",
        detail:
          "지급 전 오류를 찾아야 하므로 문서를 처음부터 수작업으로 대조하기 전에 즉시 감사 결과가 필요하다.",
      },
      {
        id: "moment-freight-invoice-audit-2",
        value: "청구서 지급 승인을 누르기 직전",
        detail:
          "잘못된 합계나 중복 항목을 승인하면 비용 문제가 생기므로 지금 바로 문서 내부 불일치를 확인해야 한다.",
      },
      {
        id: "moment-freight-invoice-audit-3",
        value: "월말 증빙 자료를 재무팀에 넘기기 직전",
        detail:
          "마감 전에 누락과 오류를 표시한 감사 자료가 필요해 별도 장부 작성 없이 즉시 결과를 받아야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-freight-invoice-audit-1",
        kind: "replace",
        value: "문서에 적힌 행 합계와 청구 총액만 대조하기",
        detail:
          "외부 운임표 없이 각 비용 행의 금액 합과 문서에 인쇄된 청구 총액이 다른 위치만 표시한다.",
        resultTitle: "화물 청구서 내부 합계 불일치 CSV",
        platform: "web",
        smallestBuild:
          "운송사 화물 청구서 PDF 파일 하나를 입력받아 문서 안의 비용 행 합계와 인쇄된 총액을 한 번 대조하고 불일치 행이 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
      },
      {
        id: "twist-freight-invoice-audit-2",
        kind: "add",
        value: "같은 운송장·날짜·금액이 겹친 행만 찾기",
        detail:
          "운송장 번호·청구일·비용 금액이 모두 같은 행만 중복 후보로 표시하고 외부 계약 운임은 판단하지 않는다.",
        resultTitle: "화물 청구서 동일 비용 중복 후보 CSV",
        platform: "web",
        smallestBuild:
          "운송사 화물 청구서 PDF 파일 하나를 입력받아 운송장 번호·청구일·금액이 모두 같은 비용 행을 한 번 찾고 중복 후보가 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
      },
      {
        id: "twist-freight-invoice-audit-3",
        kind: "add",
        value: "운송장 번호·청구일·통화 누락만 찾기",
        detail:
          "필수 기준을 운송장 번호·청구일·통화 세 필드로 고정하고 비어 있는 필드 위치만 표시한다.",
        resultTitle: "화물 청구서 필수 3항목 누락 CSV",
        platform: "web",
        smallestBuild:
          "운송사 화물 청구서 PDF 파일 하나를 입력받아 운송장 번호·청구일·통화 세 필드의 기재 여부를 한 번 확인하고 누락 위치가 표시된 감사 CSV 파일 한 개를 즉시 만든다.",
      },
    ],
  },
  {
    id: "fits-sky-locator",
    source: {
      id: "source-fits-sky-locator",
      sourceName: "SkySafari 8 Pro",
      research: {
        key: "app_store:6752672420",
        url: "https://apps.apple.com/au/app/skysafari-8-pro/id6752672420",
      },
      platform: "app",
      value:
        "FITS 천체 사진 한 장을 분석해 어느 하늘을 찍었는지 좌표·촬영 영역·주요 천체가 표시된 차트로 놓는 도구",
      detail:
        "FITS 파일 하나를 입력하면 별 패턴을 한 번 플레이트 솔빙하고 촬영 중심과 영역이 표시된 하늘 차트 한 개를 즉시 만듭니다.",
      evidence:
        "App Store 원본은 FITS·로컬·URL 천체 이미지를 가져와 플레이트 솔빙한 뒤 하늘 차트에 직접 배치한다고 명시하고, 수집 시점 호주 레퍼런스 카테고리 4위가 확인됩니다.",
      preservedFlow:
        "FITS 천체 이미지 입력 → 별 패턴 플레이트 솔빙 → 좌표가 표시된 하늘 차트",
    },
    payers: [
      {
        id: "payer-fits-sky-locator-1",
        value: "촬영 위치를 확인하는 아마추어 천체사진가",
        detail:
          "FITS 촬영본이 실제 하늘의 어느 영역인지 반복 확인해야 하며, 별 지도를 대조하고 좌표를 수동으로 맞추는 데 시간이 걸린다.",
      },
      {
        id: "payer-fits-sky-locator-2",
        value: "학생 관측 결과를 검토하는 학교 천문 동아리 지도교사",
        detail:
          "학생들이 촬영한 천체 이미지의 대상과 구도를 확인해야 하며, 이미지와 별자리 자료를 직접 비교해 설명한다.",
      },
      {
        id: "payer-fits-sky-locator-3",
        value: "관측 기록을 정리하는 소형 천문대 운영자",
        detail:
          "촬영 결과의 하늘 위치를 기록마다 확인해야 하며, 이미지의 별 배치를 지도와 대조해 관측 문서에 옮긴다.",
      },
    ],
    moments: [
      {
        id: "moment-fits-sky-locator-1",
        value: "천체 촬영 직후 대상이 맞는지 확인하는 순간",
        detail:
          "구도를 다시 잡거나 촬영 결과를 폐기하기 전에 이미지가 가리키는 하늘 위치를 바로 알아야 한다.",
      },
      {
        id: "moment-fits-sky-locator-2",
        value: "다음 촬영에서 구도를 수정해야 하는 순간",
        detail:
          "지난 이미지의 실제 시야를 기준으로 장비를 조정해야 하므로 차트 위 위치 확인이 지금 필요하다.",
      },
      {
        id: "moment-fits-sky-locator-3",
        value: "관측 기록을 제출하기 직전",
        detail:
          "촬영 이미지가 어느 영역을 담았는지 근거를 기록해야 해서 하늘 차트 배치 결과가 즉시 필요하다.",
      },
    ],
    twists: [
      {
        id: "twist-fits-sky-locator-1",
        kind: "replace",
        value: "중심 좌표가 찍힌 하늘 차트로 보여주기",
        detail:
          "FITS 이미지의 플레이트 솔빙과 하늘 차트 배치는 유지하고, 결과 표시만 중심 좌표를 강조한 차트로 바꾼다.",
        resultTitle: "천체 이미지 중심 좌표 하늘 차트",
        platform: "app",
        smallestBuild:
          "천체 관측용 FITS 이미지 파일 1개를 입력받아 플레이트 솔빙을 한 번 수행하고 중심 좌표가 찍힌 하늘 차트 1개를 즉시 보여준다.",
      },
      {
        id: "twist-fits-sky-locator-2",
        kind: "add",
        value: "촬영 영역 경계를 오버레이하기",
        detail:
          "같은 FITS 이미지 위치 계산은 유지하고, 결과 표시만 이미지가 차지한 촬영 영역 경계를 하늘 차트 위에 겹쳐 보여주는 것으로 바꾼다.",
        resultTitle: "천체 사진 촬영 영역 경계 확인",
        platform: "app",
        smallestBuild:
          "FITS 이미지 파일 1개를 입력받아 플레이트 솔빙을 한 번 수행하고 촬영 영역 경계가 표시된 하늘 차트 1개를 즉시 보여준다.",
      },
      {
        id: "twist-fits-sky-locator-3",
        kind: "add",
        value: "식별된 주요 천체에 라벨 붙이기",
        detail:
          "플레이트 솔빙으로 이미지 위치를 찾는 처리는 유지하고, 결과 표시만 차트 안의 주요 천체 이름 라벨로 바꾼다.",
        resultTitle: "천체 사진 속 주요 천체 라벨",
        platform: "app",
        smallestBuild:
          "천체 FITS 이미지 파일 1개를 입력받아 플레이트 솔빙을 한 번 수행하고 주요 천체 라벨이 붙은 하늘 차트 1개를 즉시 보여준다.",
      },
    ],
  },
  {
    id: "youtube-hidden-tag-export",
    source: {
      id: "source-youtube-hidden-tag-export",
      sourceName: "YouTube Tag Extractor",
      research: {
        key: "chrome_web_store:idickfnblhhleimfneihpmddjabiodlp",
        url: "https://chromewebstore.google.com/detail/youtube-tag-extractor/idickfnblhhleimfneihpmddjabiodlp",
      },
      platform: "web",
      value:
        "YouTube 영상 URL에서 공개 메타데이터의 숨은 태그를 비교 가능한 목록 파일로 만드는 도구",
      detail:
        "YouTube 영상 URL 하나를 입력하면 숨은 태그를 한 번 추출해 원래 순서·중복 제거·긴 구문 우선 중 선택한 목록 파일 한 개로 제공합니다.",
      evidence:
        "Chrome Web Store 원본은 YouTube 영상의 숨은 태그 추출을 명시하고, 수집 시점 카테고리 1위·평점 5.0·2개 목록 노출이 확인됩니다.",
      preservedFlow:
        "YouTube 영상 URL 입력 → 숨은 태그 한 번 추출 → 비교 가능한 TXT 또는 CSV 목록 파일",
    },
    payers: [
      {
        id: "payer-youtube-tag-export-1",
        value: "유튜브 채널을 매주 운영하는 영상 제작자",
        detail:
          "경쟁 채널의 숨은 태그를 확인해 제목과 태그를 손보는 일을 반복하며, 페이지 소스와 확장 도구를 번갈아 열어 태그를 수작업으로 복사한다.",
      },
      {
        id: "payer-youtube-tag-export-2",
        value: "경쟁 영상 브리프를 만드는 콘텐츠 마케터",
        detail:
          "캠페인 전 여러 유튜브 영상의 태그를 비교해야 하며, 영상별 태그를 일일이 찾아 표에 붙이고 화면 증거를 따로 캡처한다.",
      },
      {
        id: "payer-youtube-tag-export-3",
        value: "업로드 메타데이터를 검수하는 영상 대행 편집자",
        detail:
          "고객 영상과 경쟁 영상의 태그 목록을 확인하는 업무가 반복되며, 숨은 태그를 찾아 목록화하고 검수 자료용 캡처를 수동으로 만든다.",
      },
    ],
    moments: [
      {
        id: "moment-youtube-tag-export-1",
        value: "경쟁 영상의 태그를 확인해 제목을 고치려는 순간",
        detail:
          "업로드 직전에 검색 노출을 점검해야 해서, 지금 영상 URL만 넣고 태그 목록과 증거 캡처를 바로 받아야 한다.",
      },
      {
        id: "moment-youtube-tag-export-2",
        value: "경쟁 영상 조사 브리프에 태그 근거를 넣는 순간",
        detail:
          "보고서 작성이 이미 시작된 상태라 영상마다 태그를 직접 찾을 시간이 없고, 즉시 목록과 화면 자료가 필요하다.",
      },
      {
        id: "moment-youtube-tag-export-3",
        value: "고객 영상 업로드 전 메타데이터를 검수하는 순간",
        detail:
          "검수 마감 직전이라 숨은 태그가 빠졌는지 바로 확인해야 하며, 사전 등록 없이 해당 영상 URL에서 결과를 받아야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-youtube-tag-export-1",
        kind: "replace",
        value: "태그를 원래 표시 순서의 TXT 파일로 받기",
        detail:
          "유튜브 영상 URL 입력과 숨은 태그 추출 처리는 유지하고, 결과만 중복 제거 없이 원래 순서의 TXT 한 개로 바꾼다.",
        resultTitle: "유튜브 영상 태그 원래순서 TXT 목록",
        platform: "web",
        smallestBuild:
          "유튜브 영상 URL 하나를 입력받아 숨은 태그를 한 번 추출하고, 원래 순서의 태그 TXT 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-youtube-tag-export-2",
        kind: "add",
        value: "중복 태그를 제거한 CSV로 받기",
        detail:
          "영상 URL에서 숨은 태그를 추출하는 흐름은 유지하고, 결과 목록에서 중복만 제거해 CSV 파일 한 개로 바꾼다.",
        resultTitle: "유튜브 영상 중복 제거 태그 CSV",
        platform: "web",
        smallestBuild:
          "유튜브 영상 URL 하나를 입력받아 숨은 태그를 한 번 추출·중복 제거하고, 태그 CSV 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-youtube-tag-export-3",
        kind: "add",
        value: "긴 구문 태그를 앞에 둔 CSV로 받기",
        detail:
          "URL 입력과 숨은 태그 추출은 그대로 두고, 결과 목록의 정렬만 긴 구문 우선으로 바꿔 CSV 한 개로 제공한다.",
        resultTitle: "유튜브 경쟁 영상 긴 태그 우선 목록",
        platform: "web",
        smallestBuild:
          "유튜브 영상 URL 하나를 입력받아 숨은 태그를 한 번 추출·길이순 정렬하고, 태그 CSV 파일 하나를 즉시 제공한다.",
      },
    ],
  },
  {
    id: "masked-cookie-profile",
    source: {
      id: "source-masked-cookie-profile",
      sourceName: "Cookie Manager Pro",
      research: {
        key: "chrome_web_store:ijolfnkijbagodcigeebgjhlkdgcebmf",
        url: "https://chromewebstore.google.com/detail/cookie-manager-pro/ijolfnkijbagodcigeebgjhlkdgcebmf",
      },
      platform: "web",
      value:
        "현재 사이트 쿠키의 값을 노출하지 않고 재현에 필요한 구조만 JSON 프로필로 저장하는 도구",
      detail:
        "현재 사이트 쿠키를 읽는 단일 사이트 권한을 허용하면 쿠키를 한 번 필터링·그룹화하고 모든 값을 마스킹한 JSON 파일 한 개를 제공합니다.",
      evidence:
        "Chrome Web Store 원본은 쿠키 조회·편집·삭제·내보내기와 프로필 저장을 명시하고, 수집 시점 카테고리 25위와 평점 5.0이 확인됩니다.",
      preservedFlow:
        "현재 사이트 쿠키 단일 권한 → 쿠키 구조 한 번 필터링·마스킹 → 재현용 JSON 프로필 파일",
    },
    payers: [
      {
        id: "payer-masked-cookie-profile-1",
        value: "로그인 버그를 재현하는 웹 QA 엔지니어",
        detail:
          "현재 사이트의 세션 쿠키 상태를 확인하고 증거로 전달하는 일이 반복되며, 개발자 도구에서 쿠키를 열어 값을 가리고 따로 저장한다.",
      },
      {
        id: "payer-masked-cookie-profile-2",
        value: "세션 설정을 확인하는 프론트엔드 개발자",
        detail:
          "로그인 문제를 조사할 때 쿠키의 속성과 그룹을 반복 확인해야 하며, 필요한 항목을 수동으로 복사해 재현 기록을 만든다.",
      },
      {
        id: "payer-masked-cookie-profile-3",
        value: "고객 브라우저 이슈를 지원하는 기술 담당자",
        detail:
          "고객 환경의 사이트 쿠키 구성을 확인하는 요청이 반복되며, 쿠키 목록을 조회하고 민감한 값을 마스킹해 개발팀에 전달한다.",
      },
    ],
    moments: [
      {
        id: "moment-masked-cookie-profile-1",
        value: "로그인 버그 증거로 현재 쿠키 구조를 저장하는 순간",
        detail:
          "문제가 재현된 브라우저 상태가 지금뿐이라, 현재 사이트 권한을 허용하고 마스킹된 구조 JSON을 즉시 받아야 한다.",
      },
      {
        id: "moment-masked-cookie-profile-2",
        value: "세션 환경을 초기화하기 전에 쿠키 구성을 확인하는 순간",
        detail:
          "초기화하면 재현 상태가 사라질 수 있어, 삭제 전에 현재 쿠키의 플래그와 그룹을 바로 기록해야 한다.",
      },
      {
        id: "moment-masked-cookie-profile-3",
        value: "개발팀에 브라우저 이슈를 전달하는 순간",
        detail:
          "지원 답변을 기다릴 수 없는 상황이라 원문 값 없이도 쿠키 구조를 즉시 JSON으로 넘겨야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-masked-cookie-profile-1",
        kind: "replace",
        value: "session cookie만 마스킹해 JSON으로 저장하기",
        detail:
          "현재 사이트 쿠키 권한을 읽고 조회·내보내는 흐름은 유지하며, session cookie만 골라 모든 value를 마스킹한 JSON 파일 한 개를 만든다.",
        resultTitle: "현재 사이트 세션 쿠키 마스킹 JSON",
        platform: "web",
        smallestBuild:
          "현재 사이트 쿠키를 읽는 단일 사이트 권한 하나를 입력받아 session cookie만 한 번 필터링·마스킹하고, JSON 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-masked-cookie-profile-2",
        kind: "add",
        value: "SameSite·Secure 플래그만 JSON으로 저장하기",
        detail:
          "현재 사이트 쿠키를 읽어 결과 파일로 만드는 처리는 유지하고, SameSite·Secure 플래그만 남기며 모든 value를 마스킹한 JSON 한 개를 만든다.",
        resultTitle: "사이트 쿠키 보안 플래그 마스킹 JSON",
        platform: "web",
        smallestBuild:
          "현재 사이트 쿠키를 읽는 단일 사이트 권한 하나를 입력받아 SameSite·Secure 플래그만 한 번 추출·마스킹하고, JSON 파일 하나를 즉시 제공한다.",
      },
      {
        id: "twist-masked-cookie-profile-3",
        kind: "add",
        value: "domain·path별 쿠키 그룹을 JSON으로 저장하기",
        detail:
          "현재 사이트 쿠키 조회와 내보내기는 유지하고, 결과를 domain·path 그룹으로 묶으며 모든 value를 마스킹한 JSON 파일 한 개로 제한한다.",
        resultTitle: "사이트 쿠키 도메인 경로 그룹 JSON",
        platform: "web",
        smallestBuild:
          "현재 사이트 쿠키를 읽는 단일 사이트 권한 하나를 입력받아 domain·path별로 한 번 그룹화·마스킹하고, JSON 파일 하나를 즉시 제공한다.",
      },
    ],
  },
  {
    id: "website-design-token-export",
    source: {
      id: "source-website-design-token-export",
      sourceName: "Design Analyzer - Extract Design Elements",
      research: {
        key: "chrome_web_store:lcgfgelbpgaepigopgkoloicjjkgihcg",
        url: "https://chromewebstore.google.com/detail/design-analyzer-extract-d/lcgfgelbpgaepigopgkoloicjjkgihcg",
      },
      platform: "web",
      value:
        "공개 웹사이트의 색상·폰트·간격·효과를 재사용 가능한 디자인 토큰 파일로 만드는 도구",
      detail:
        "공개 웹사이트 URL 하나를 입력하면 디자인 요소를 한 번 추출해 CSS 변수·JSON 토큰·Figma 호환 토큰 중 선택한 파일 한 개를 제공합니다.",
      evidence:
        "Chrome Web Store 원본은 웹사이트의 색상·폰트·간격·그림자·효과 추출과 CSS·JSON·Figma 내보내기를 명시하고, 수집 시점 검색 순위 9위가 확인됩니다.",
      preservedFlow:
        "공개 웹사이트 URL 입력 → 디자인 요소 한 번 추출 → CSS·JSON·Figma 호환 토큰 파일",
    },
    payers: [
      {
        id: "payer-design-token-export-1",
        value: "새 디자인 시스템을 만드는 프로덕트 디자이너",
        detail:
          "참고 사이트의 색상·폰트·간격을 눈대중으로 확인해 토큰으로 옮기느라 화면별 값을 수동 기록한다.",
      },
      {
        id: "payer-design-token-export-2",
        value: "기존 CSS를 정리하는 프론트엔드 개발자",
        detail:
          "웹사이트의 스타일 값을 개발자 도구에서 하나씩 찾아 CSS 변수로 변환하는 작업이 반복된다.",
      },
      {
        id: "payer-design-token-export-3",
        value: "브랜드 일관성을 검수하는 디자인 QA",
        detail:
          "공개 사이트의 실제 색상과 효과를 확인해 브랜드 기준과 비교하려고 디자인 요소를 수작업으로 수집한다.",
      },
    ],
    moments: [
      {
        id: "moment-design-token-export-1",
        value: "리디자인 기준 사이트를 정한 직후",
        detail:
          "새 화면을 만들기 전에 참고 사이트의 실제 토큰을 바로 확보해야 임의의 값으로 작업을 시작하지 않는다.",
      },
      {
        id: "moment-design-token-export-2",
        value: "컴포넌트 CSS를 구현하려는 순간",
        detail:
          "색상·간격·폰트 값을 즉시 꺼내야 반복해서 개발자 도구를 오가며 구현이 지연되지 않는다.",
      },
      {
        id: "moment-design-token-export-3",
        value: "브랜드 화면 검수를 시작하기 직전",
        detail:
          "검수 대상 사이트의 디자인 값을 한 번에 확인해야 브랜드 기준과 다른 지점을 바로 짚을 수 있다.",
      },
    ],
    twists: [
      {
        id: "twist-design-token-export-1",
        kind: "replace",
        value: "개발자가 바로 붙이는 CSS variables로 내보내기",
        detail:
          "공개 웹사이트 URL에서 색상·폰트·간격·그림자·효과를 추출하는 흐름은 유지하고 CSS 변수 형식으로만 출력한다.",
        resultTitle: "웹사이트 디자인 값 CSS 변수 파일",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 디자인 요소를 한 번 추출하고 CSS variables 파일 하나를 즉시 반환한다.",
      },
      {
        id: "twist-design-token-export-2",
        kind: "add",
        value: "화면 값을 이름 붙은 JSON 토큰으로 정리하기",
        detail:
          "웹사이트 URL을 분석해 디자인 요소를 추출하는 처리는 유지하되, 결과를 이름 붙은 JSON token 구조로 정리한다.",
        resultTitle: "웹사이트 색상·간격 JSON 토큰 파일",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 디자인 요소를 한 번 추출하고 JSON token 파일 하나를 즉시 반환한다.",
      },
      {
        id: "twist-design-token-export-3",
        kind: "add",
        value: "Figma에서 읽기 쉬운 token JSON으로 변환하기",
        detail:
          "URL에서 색상·폰트·간격·그림자·효과를 추출하는 원본 처리는 유지하며, Figma에서 읽을 수 있는 token JSON으로만 바꾼다.",
        resultTitle: "웹사이트 디자인 값 Figma 토큰 파일",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 디자인 요소를 한 번 추출하고 Figma 호환 token JSON 파일 하나를 즉시 반환한다.",
      },
    ],
  },
  {
    id: "website-to-android-apk",
    source: {
      id: "source-website-to-android-apk",
      sourceName: "WebToApp: No Code App Converter",
      research: {
        key: "trustmrr:webtoapp-no-code-app-converter",
        url: "https://trustmrr.com/startup/webtoapp-no-code-app-converter",
      },
      platform: "app",
      value:
        "모바일 웹사이트 URL 하나를 설치 가능한 Android WebView APK 한 파일로 감싸는 도구",
      detail:
        "모바일 대응 공개 웹사이트 URL 하나를 입력하면 앱 아이콘·뒤로가기·자사 도메인 규칙 중 하나가 적용된 debug APK 한 파일로 패키징합니다.",
      evidence:
        "TrustMRR에서 최근 30일 매출 620달러와 함께 웹사이트를 네이티브 Android 앱으로 바꾸는 노코드 변환기로 수집된 제품",
      preservedFlow:
        "모바일 웹사이트 URL 입력 → Android WebView 앱 패키징 → 설치 가능한 debug APK 파일",
    },
    payers: [
      {
        id: "payer-website-android-apk-1",
        value: "자사 웹을 앱으로 보여주려는 소상공인 운영자",
        detail:
          "모바일 웹은 완성했지만 고객이 앱처럼 쉽게 열길 원해, 직접 Android 프로젝트를 만들거나 개발자에게 포장 작업을 맡겨야 한다.",
      },
      {
        id: "payer-website-android-apk-2",
        value: "지역 고객 사이트를 만드는 웹 대행자",
        detail:
          "납품 때 앱 설치본까지 요구받지만, 같은 웹사이트를 Android 껍데기로 감싸는 작업을 매번 수작업으로 처리한다.",
      },
      {
        id: "payer-website-android-apk-3",
        value: "회원용 웹서비스를 운영하는 커뮤니티 매니저",
        detail:
          "회원들이 홈 화면에서 바로 열 수 있는 설치본을 요청하지만, 네이티브 앱을 새로 개발할 인력과 시간이 없다.",
      },
    ],
    moments: [
      {
        id: "moment-website-android-apk-1",
        value: "모바일 대응 웹사이트가 완성된 직후",
        detail:
          "웹 주소는 준비됐지만 앱 설치본이 없으면 출시 확인이 늦어지므로, 테스트 가능한 Android 파일이 즉시 필요하다.",
      },
      {
        id: "moment-website-android-apk-2",
        value: "사용자가 홈 화면 앱을 요구한 직후",
        detail:
          "요청에 빠르게 응답하지 못하면 웹서비스 이용이 끊길 수 있어, 기존 사이트를 바로 설치본으로 보여줘야 한다.",
      },
      {
        id: "moment-website-android-apk-3",
        value: "테스트 단말에 설치본을 보여주기 직전",
        detail:
          "스토어 제출 전 실제 열림과 뒤로가기를 확인해야 하므로, 지금 바로 설치 가능한 파일이 필요하다.",
      },
    ],
    twists: [
      {
        id: "twist-website-android-apk-1",
        kind: "replace",
        value: "사이트 favicon을 앱 아이콘으로 쓰기",
        detail:
          "공개 웹사이트 URL을 네이티브 Android 앱으로 변환하는 흐름은 유지하되, 사이트 favicon을 앱 아이콘으로 적용한다.",
        resultTitle: "웹사이트 favicon 적용 Android 설치본",
        platform: "app",
        smallestBuild:
          "모바일 대응이 끝난 공개 웹사이트 URL 하나를 입력받아 favicon을 앱 아이콘으로 설정하고, 설치 가능한 debug APK 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-website-android-apk-2",
        kind: "add",
        value: "Android 뒤로가기를 웹처럼 처리하기",
        detail:
          "웹사이트를 Android 앱으로 감싸는 흐름은 유지하되, 단말 뒤로가기 입력이 웹 탐색처럼 동작하도록 처리한다.",
        resultTitle: "웹 뒤로가기 적용 Android 설치본",
        platform: "app",
        smallestBuild:
          "모바일 대응이 끝난 공개 웹사이트 URL 하나를 입력받아 뒤로가기 처리를 적용하고, 설치 가능한 debug APK 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-website-android-apk-3",
        kind: "add",
        value: "자사 도메인 안에서만 열기",
        detail:
          "웹사이트 URL을 Android 앱으로 변환하는 흐름은 유지하되, 자사 도메인 밖으로 이동하지 않는 규칙만 적용한다.",
        resultTitle: "자사 도메인 고정 Android 설치본",
        platform: "app",
        smallestBuild:
          "모바일 대응이 끝난 공개 웹사이트 URL 하나를 입력받아 자사 도메인 안에서만 열도록 설정하고, 설치 가능한 debug APK 파일 한 개를 즉시 반환한다.",
      },
    ],
  },
  {
    id: "web-component-code-extractor",
    source: {
      id: "source-web-component-code-extractor",
      sourceName: "scrapestudio.co",
      research: {
        key: "trustmrr:scrapestudio-co",
        url: "https://trustmrr.com/startup/scrapestudio-co",
      },
      platform: "web",
      value:
        "공개 웹페이지의 지정 컴포넌트를 재사용 가능한 HTML·React·Tailwind 코드 파일로 추출하는 도구",
      detail:
        "URL과 CSS selector가 합쳐진 텍스트 하나를 입력하면 대상 DOM과 스타일을 읽어 선택한 형식의 컴포넌트 코드 파일 한 개로 내보냅니다.",
      evidence:
        "TrustMRR에서 웹사이트 컴포넌트를 추출해 라이브러리나 프로젝트에 복사할 ready-code로 만드는 개발 도구로 수집된 제품",
      preservedFlow:
        "URL#CSS selector 입력 → 대상 DOM·스타일 추출·변환 → 재사용 가능한 컴포넌트 코드 파일",
    },
    payers: [
      {
        id: "payer-web-component-code-1",
        value: "레퍼런스 화면을 구현하는 프론트엔드 개발자",
        detail:
          "참고 사이트의 특정 컴포넌트를 빠르게 재현해야 하지만, 개발자 도구에서 구조와 스타일을 손으로 옮기며 반복 작업을 한다.",
      },
      {
        id: "payer-web-component-code-2",
        value: "고객 사이트를 제작하는 퍼블리셔",
        detail:
          "고객이 지정한 웹 컴포넌트를 비슷하게 구현해야 하지만, HTML과 CSS를 다시 작성하느라 납기 시간을 소모한다.",
      },
      {
        id: "payer-web-component-code-3",
        value: "디자인 시스템을 정리하는 UI 엔지니어",
        detail:
          "기존 사이트의 버튼이나 카드 구조를 코드 자산으로 옮겨야 하지만, 선택한 요소를 분석하고 팀 규칙에 맞게 재구성하는 일을 반복한다.",
      },
    ],
    moments: [
      {
        id: "moment-web-component-code-1",
        value: "참고할 컴포넌트가 최종 확정된 직후",
        detail:
          "이제 구현을 시작해야 하는데 구조를 다시 분석할 시간이 부족해, 선택한 요소의 코드 결과가 바로 필요하다.",
      },
      {
        id: "moment-web-component-code-2",
        value: "같은 모양을 손으로 다시 만들기 직전",
        detail:
          "수작업 구현은 간격과 상태를 놓치기 쉬우므로, 원본 컴포넌트의 구조를 즉시 가져와 출발해야 한다.",
      },
      {
        id: "moment-web-component-code-3",
        value: "구현 코드 구조를 팀에 넘기기 전",
        detail:
          "팀원이 같은 요소를 다시 해석하면 수정이 늘어나므로, 지정한 컴포넌트의 코드 파일 하나를 즉시 공유해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-web-component-code-1",
        kind: "replace",
        value: "인라인 스타일을 HTML과 CSS로 분리하기",
        detail:
          "URL과 CSS selector를 받아 웹페이지의 한 컴포넌트를 추출하는 흐름은 유지하되, 인라인 스타일을 제거한 HTML/CSS 코드만 만든다.",
        resultTitle: "인라인 스타일 제거 HTML CSS 코드",
        platform: "web",
        smallestBuild:
          "`URL#selector` 텍스트 하나를 입력받아 지정 컴포넌트의 인라인 스타일을 분리하고, HTML/CSS 코드 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-web-component-code-2",
        kind: "add",
        value: "선택 컴포넌트를 React JSX로 바꾸기",
        detail:
          "지정한 웹페이지 요소를 추출해 바로 쓸 코드를 만드는 흐름은 유지하되, 결과 형식만 React JSX로 변환한다.",
        resultTitle: "웹 컴포넌트 React JSX 변환 코드",
        platform: "web",
        smallestBuild:
          "`URL#selector` 텍스트 하나를 입력받아 지정 컴포넌트의 구조를 React JSX로 변환하고, JSX 코드 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-web-component-code-3",
        kind: "add",
        value: "선택 컴포넌트를 Tailwind 클래스로 바꾸기",
        detail:
          "웹페이지 URL과 selector로 한 컴포넌트를 추출하는 흐름은 유지하되, 스타일 표현만 Tailwind class로 변환한다.",
        resultTitle: "웹 컴포넌트 Tailwind 클래스 코드",
        platform: "web",
        smallestBuild:
          "`URL#selector` 텍스트 하나를 입력받아 지정 컴포넌트의 스타일을 Tailwind class로 변환하고, 컴포넌트 코드 파일 한 개를 즉시 반환한다.",
      },
    ],
  },
  {
    id: "single-page-performance-cause-report",
    source: {
      id: "source-single-page-performance-cause-report",
      sourceName: "Lightspeed.run",
      research: {
        key: "trustmrr:lightspeed-run",
        url: "https://trustmrr.com/startup/lightspeed-run",
      },
      platform: "web",
      value:
        "공개 웹페이지 URL 하나를 실제 브라우저로 측정해 느린 지표와 원인 요소를 붙인 보고서로 만드는 도구",
      detail:
        "공개 웹사이트 URL 하나를 입력하면 한 번 성능을 측정하고 LCP·CLS·긴 JavaScript 작업 중 하나의 원인이 표시된 HTML 보고서 한 파일로 내보냅니다.",
      evidence:
        "TrustMRR에서 최근 30일 매출 28달러와 함께 전환·SEO 개선을 위한 웹사이트 성능 측정·최적화 도구로 수집된 제품",
      preservedFlow:
        "공개 웹페이지 URL 입력 → 실제 브라우저 성능 1회 측정 → 지표와 원인 요소가 표시된 HTML 보고서",
    },
    payers: [
      {
        id: "payer-page-performance-cause-1",
        value: "자사몰을 직접 운영하는 개발자",
        detail:
          "페이지를 공개할 때마다 로딩 지연과 레이아웃 이동을 확인해야 하지만, 브라우저 도구를 여러 번 실행해 수치를 수동으로 정리한다.",
      },
      {
        id: "payer-page-performance-cause-2",
        value: "고객 랜딩페이지를 납품하는 웹 대행자",
        detail:
          "납품 전 성능 근거를 제시하려고 여러 측정 결과를 복사해 보고서를 만들며, 개선이 필요한 파일을 직접 찾아야 한다.",
      },
      {
        id: "payer-page-performance-cause-3",
        value: "콘텐츠 사이트를 관리하는 퍼블리셔",
        detail:
          "검색 유입 페이지의 느린 로딩과 화면 흔들림을 반복 점검하지만, 성능·SEO 관련 항목을 수기로 비교한다.",
      },
    ],
    moments: [
      {
        id: "moment-page-performance-cause-1",
        value: "새 페이지를 공개하기 직전 성능을 확인할 때",
        detail:
          "공개 후 수정 비용이 커지므로 지금 URL을 측정해 가장 큰 문제 하나를 바로 확인해야 한다.",
      },
      {
        id: "moment-page-performance-cause-2",
        value: "사용자가 사이트가 느리다고 말한 직후",
        detail:
          "원인을 추측할 시간이 없고, 해당 페이지의 실제 성능 수치와 문제 요소가 즉시 필요하다.",
      },
      {
        id: "moment-page-performance-cause-3",
        value: "고객에게 개선 근거를 보내기 전",
        detail:
          "설명보다 신뢰할 수 있는 1회 측정 결과가 필요하므로 URL 하나로 보고서를 바로 만들어야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-page-performance-cause-1",
        kind: "replace",
        value: "LCP와 가장 큰 요소만 보여주는 측정",
        detail:
          "공개 URL을 1회 측정해 성능·SEO 개선 결과를 보고하는 흐름은 유지하고, LCP와 가장 큰 요소에만 초점을 둔다.",
        resultTitle: "웹페이지 첫 화면 지연 원인 측정 보고서",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 1회 성능 측정을 실행하고 LCP 수치와 가장 큰 요소가 표시된 HTML 보고서 한 파일을 즉시 반환한다.",
      },
      {
        id: "twist-page-performance-cause-2",
        kind: "add",
        value: "CLS와 움직인 요소만 보여주는 측정",
        detail:
          "웹사이트 URL을 측정해 개선 근거를 제공하는 방식은 유지하고, CLS와 화면을 움직인 요소만 표시한다.",
        resultTitle: "웹페이지 화면 흔들림 원인 측정 보고서",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 1회 성능 측정을 실행하고 CLS 수치와 움직인 요소가 표시된 HTML 보고서 한 파일을 즉시 반환한다.",
      },
      {
        id: "twist-page-performance-cause-3",
        kind: "add",
        value: "긴 JavaScript 작업과 파일만 보여주는 측정",
        detail:
          "URL 1회 측정과 개선 보고서라는 결과는 유지하고, 긴 JavaScript 작업과 해당 파일 URL만 표시한다.",
        resultTitle: "웹페이지 긴 자바스크립트 작업 보고서",
        platform: "web",
        smallestBuild:
          "공개 웹사이트 URL 하나를 입력받아 1회 성능 측정을 실행하고 긴 JavaScript 작업과 파일 URL이 표시된 HTML 보고서 한 파일을 즉시 반환한다.",
      },
    ],
  },
  {
    id: "code-static-security-locations",
    source: {
      id: "source-code-static-security-locations",
      sourceName: "Beesecure",
      research: {
        key: "trustmrr:beesecure",
        url: "https://trustmrr.com/startup/beesecure",
      },
      platform: "web",
      value:
        "웹 프로젝트 코드 ZIP에서 정적으로 확인 가능한 위험 패턴의 파일·행 위치를 찾는 보안 검사 도구",
      detail:
        "웹 프로젝트 코드 ZIP 파일 하나를 입력하면 비밀키·eval 계열 호출·전체 허용 CORS 중 하나를 정적 검사해 위치가 표시된 HTML 보고서 한 파일로 내보냅니다.",
      evidence:
        "TrustMRR에서 개발자·인디해커·SaaS 창업자가 코드베이스 취약점을 빠르게 식별하도록 돕는 보안 스캔 플랫폼으로 수집된 제품",
      preservedFlow:
        "웹 프로젝트 코드 ZIP 입력 → 위험 패턴 정적 보안 검사 → 파일·행 위치가 표시된 HTML 보고서",
    },
    payers: [
      {
        id: "payer-code-static-security-1",
        value: "고객 웹사이트를 납품하는 인디 SaaS 개발자",
        detail:
          "배포 전마다 비밀키와 위험한 코드가 섞였는지 확인해야 하지만, 코드를 직접 훑거나 임시 스크립트를 돌리느라 반복적으로 시간이 든다.",
      },
      {
        id: "payer-code-static-security-2",
        value: "여러 고객 프로젝트를 검수하는 개발 대행사 리드",
        detail:
          "납품 직전 보안 실수를 찾아야 하지만, 팀원이 만든 파일을 수작업으로 열어 의심스러운 패턴과 설정을 확인한다.",
      },
      {
        id: "payer-code-static-security-3",
        value: "사내 웹 도구를 운영하는 풀스택 개발자",
        detail:
          "내부 도구를 배포할 때도 비밀정보 노출과 위험한 호출을 점검해야 하지만, 별도 보안 담당자 없이 변경 파일을 손으로 검사한다.",
      },
    ],
    moments: [
      {
        id: "moment-code-static-security-1",
        value: "웹 프로젝트 ZIP을 배포 서버에 올리기 직전",
        detail:
          "지금 취약점을 놓치면 공개 배포 뒤 바로 노출될 수 있어, 코드를 다시 검토할 시간이 없더라도 즉시 확인 결과가 필요하다.",
      },
      {
        id: "moment-code-static-security-2",
        value: "AI가 만든 코드를 기존 프로젝트에 합친 직후",
        detail:
          "새 코드의 출처와 안전성을 일일이 검증하기 전에 위험한 패턴이 들어왔는지 바로 확인해야 한다.",
      },
      {
        id: "moment-code-static-security-3",
        value: "검수된 코드를 다른 팀에 넘기기 직전",
        detail:
          "인수인계 뒤 문제가 발견되면 책임과 수정 비용이 커지므로, 전달 전에 파일과 행 위치가 있는 근거가 필요하다.",
      },
    ],
    twists: [
      {
        id: "twist-code-static-security-1",
        kind: "replace",
        value: "하드코딩된 비밀키 위치를 바로 표시하기",
        detail:
          "ZIP 파일을 받아 보안 취약점을 정적으로 스캔하고 목록을 보여주는 흐름은 유지하되, 하드코딩된 비밀키 패턴 하나만 파일·행 위치로 표시한다.",
        resultTitle: "코드 속 비밀키 위치 확인 보고서",
        platform: "web",
        smallestBuild:
          "웹 프로젝트 ZIP 파일 하나를 입력받아 하드코딩된 비밀키 패턴을 정적 검사하고, 파일·행 위치가 적힌 HTML 보고서 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-code-static-security-2",
        kind: "add",
        value: "위험한 eval 호출 위치를 바로 표시하기",
        detail:
          "ZIP 파일의 코드를 스캔해 취약점 목록을 만드는 흐름은 유지하되, 위험한 eval 계열 호출 하나만 파일·행 위치로 표시한다.",
        resultTitle: "위험한 eval 호출 위치 확인 보고서",
        platform: "web",
        smallestBuild:
          "웹 프로젝트 ZIP 파일 하나를 입력받아 위험한 eval 계열 호출을 정적 검사하고, 해당 파일·행 위치가 적힌 HTML 보고서 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-code-static-security-3",
        kind: "add",
        value: "와일드카드 CORS 허용 코드 위치만 찾기",
        detail:
          "코드 ZIP 정적검사 흐름은 유지하고, 모든 출처를 허용하는 CORS 설정 코드의 파일·행 위치만 표시한다.",
        resultTitle: "코드 속 전체 허용 CORS 위치 보고서",
        platform: "web",
        smallestBuild:
          "웹 프로젝트 ZIP 파일 하나를 입력받아 모든 출처를 허용하는 CORS 설정 패턴을 정적 검사하고, 해당 파일·행 위치가 적힌 HTML 보고서 한 개를 즉시 반환한다.",
      },
    ],
  },
  {
    id: "sitemap-to-llms-text",
    source: {
      id: "source-sitemap-to-llms-text",
      sourceName: "SiteMapToLlm",
      research: {
        key: "trustmrr:sitemaptollm",
        url: "https://trustmrr.com/startup/sitemaptollm",
      },
      platform: "web",
      value:
        "공개 XML·HTML 사이트맵 URL 하나를 구조화된 llms.txt 파일 하나로 변환하는 도구",
      detail:
        "사이트맵 URL을 한 번 파싱해 페이지 제목·경로를 읽고, 제목 목록·경로별 섹션·중복 제거 중 하나가 적용된 llms.txt 파일로 내보냅니다.",
      evidence:
        "TrustMRR에서 사이트맵을 LLM이 이해할 수 있는 llms.txt 표준 파일로 변환하는 개발 도구로 수집된 제품",
      preservedFlow:
        "공개 사이트맵 URL 입력 → 사이트맵 구조 1회 파싱 → 구조화된 llms.txt 파일",
    },
    payers: [
      {
        id: "payer-sitemap-llms-text-1",
        value: "자사 문서 사이트를 직접 운영하는 1인 SaaS 개발자",
        detail:
          "페이지가 늘 때마다 AI 도구가 읽을 경로 목록을 수기로 정리한다.",
      },
      {
        id: "payer-sitemap-llms-text-2",
        value: "여러 고객 사이트를 관리하는 콘텐츠 대행 실무자",
        detail:
          "사이트맵을 보고 llms.txt 초안을 반복 작성하며 제목과 경로를 복사한다.",
      },
      {
        id: "payer-sitemap-llms-text-3",
        value: "개발자 문서 포털을 배포하는 테크니컬 라이터",
        detail:
          "문서 구조가 바뀔 때 사이트맵과 AI 크롤러 안내 파일을 따로 맞춘다.",
      },
    ],
    moments: [
      {
        id: "moment-sitemap-llms-text-1",
        value: "사이트맵을 새로 공개한 직후",
        detail:
          "공개 경로가 준비된 지금 llms.txt를 만들지 않으면 문서 목록을 다시 모아야 한다.",
      },
      {
        id: "moment-sitemap-llms-text-2",
        value: "사이트 문서 구조를 크게 바꾼 직후",
        detail:
          "오래된 경로를 남기지 않으려면 현재 사이트맵 기준 결과가 필요하다.",
      },
      {
        id: "moment-sitemap-llms-text-3",
        value: "AI 크롤러 안내 파일을 배포하기 직전",
        detail:
          "잘못된 URL이나 중복 경로를 공개하기 전에 실제 사이트맵 결과를 검수해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-sitemap-llms-text-1",
        kind: "replace",
        value: "페이지 제목과 URL을 한 줄씩 정리하기",
        detail: "각 페이지를 제목과 URL 한 줄 형식으로 만든다.",
        resultTitle: "사이트맵 제목 URL llms.txt 변환 파일",
        platform: "web",
        smallestBuild:
          "공개 XML·HTML 사이트맵 URL 하나를 입력받아 페이지 제목과 URL을 한 번 파싱하고, 한 페이지 한 줄인 llms.txt 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-sitemap-llms-text-2",
        kind: "add",
        value: "URL 경로별로 문서 섹션 묶기",
        detail: "첫 경로 구간이 같은 페이지를 같은 섹션으로 묶는다.",
        resultTitle: "사이트맵 경로별 섹션 llms.txt 파일",
        platform: "web",
        smallestBuild:
          "공개 XML·HTML 사이트맵 URL 하나를 입력받아 URL 경로를 한 번 파싱하고, 첫 경로 구간별 섹션이 붙은 llms.txt 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-sitemap-llms-text-3",
        kind: "add",
        value: "쿼리·중복 경로를 뺀 목록 만들기",
        detail: "쿼리를 제거했을 때 같은 URL은 하나만 남긴다.",
        resultTitle: "중복 경로 제거 llms.txt 변환 파일",
        platform: "web",
        smallestBuild:
          "공개 XML·HTML 사이트맵 URL 하나를 입력받아 경로를 한 번 정규화하고, 쿼리·중복 URL이 제거된 llms.txt 파일 한 개를 즉시 반환한다.",
      },
    ],
  },
  {
    id: "football-matchday-social-card",
    source: {
      id: "source-football-matchday-social-card",
      sourceName: "myterrace.net",
      research: {
        key: "trustmrr:myterrace-net",
        url: "https://trustmrr.com/startup/myterrace-net",
      },
      platform: "app",
      value:
        "축구 경기 정보와 로고를 즉시 게시 가능한 매치데이 그래픽 한 장으로 만드는 도구",
      detail:
        "팀명·경기명·일시·스코어·로고 URL가 적힌 텍스트 하나를 입력하면 정사각형·스토리·스폰서 바 중 하나의 PNG 한 장으로 배치합니다.",
      evidence:
        "TrustMRR에서 축구 클럽이 즉시 매치데이 그래픽을 만들 수 있는 소셜 미디어 도구로 수집된 제품",
      preservedFlow:
        "축구 경기 정보·로고 입력 → 매치데이 템플릿 1회 배치 → 게시 가능한 PNG 한 장",
    },
    payers: [
      {
        id: "payer-football-matchday-card-1",
        value: "아마추어 축구팀 SNS를 맡은 선수 겸 운영자",
        detail: "디자인 담당자가 없어 경기마다 모바일 편집 앱을 반복해서 연다.",
      },
      {
        id: "payer-football-matchday-card-2",
        value: "유소년 축구클럽 경기를 알리는 코치",
        detail:
          "훈련과 이동 중에는 경기 공지 템플릿을 직접 편집할 시간이 부족하다.",
      },
      {
        id: "payer-football-matchday-card-3",
        value: "지역 풋살리그 여러 경기를 공지하는 운영자",
        detail:
          "팀과 시간이 바뀔 때마다 로고 크기와 글자 위치를 수작업으로 맞춘다.",
      },
    ],
    moments: [
      {
        id: "moment-football-matchday-card-1",
        value: "게시할 경기 정보가 최종 확정된 직후",
        detail: "입력된 팀명·일시·스코어로 바로 올릴 이미지가 필요하다.",
      },
      {
        id: "moment-football-matchday-card-2",
        value: "디자인 담당자 없이 경기 공지를 올려야 할 때",
        detail:
          "템플릿을 직접 편집하지 않아도 팀 모양을 유지한 그래픽 한 장이 필요하다.",
      },
      {
        id: "moment-football-matchday-card-3",
        value: "경기 정보를 수정해 다시 공지하기 직전",
        detail: "현재 정보로 새 이미지를 즉시 만들어야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-football-matchday-card-1",
        kind: "replace",
        value: "인스타그램 정사각형 매치데이 카드 만들기",
        detail: "1080×1080 정사각형 템플릿에 경기 정보를 배치한다.",
        resultTitle: "축구 경기 정보 정사각형 매치데이 카드",
        platform: "app",
        smallestBuild:
          "팀명·경기명·일시·스코어·로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 1080×1080 매치데이 PNG 한 장을 즉시 반환한다.",
      },
      {
        id: "twist-football-matchday-card-2",
        kind: "add",
        value: "스토리 세로형 매치데이 카드 만들기",
        detail: "1080×1920 세로 템플릿에 같은 정보를 배치한다.",
        resultTitle: "축구 경기 정보 세로형 스토리 카드",
        platform: "app",
        smallestBuild:
          "팀명·경기명·일시·스코어·로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 1080×1920 매치데이 PNG 한 장을 즉시 반환한다.",
      },
      {
        id: "twist-football-matchday-card-3",
        kind: "add",
        value: "하단 스폰서 바가 있는 매치데이 카드 만들기",
        detail: "입력된 스폰서명·로고 URL를 하단 고정 바에 배치한다.",
        resultTitle: "스폰서 바가 붙은 축구 매치데이 카드",
        platform: "app",
        smallestBuild:
          "팀명·경기명·일시·스코어·팀과 스폰서 로고 URL가 줄 단위로 적힌 텍스트 한 덩어리를 입력받아 정보를 한 번 배치하고, 하단 스폰서 바가 있는 PNG 한 장을 즉시 반환한다.",
      },
    ],
  },
  {
    id: "tailwind-selector-class-diff",
    source: {
      id: "source-tailwind-selector-class-diff",
      sourceName: "Taillens - Tool for frontend developers",
      research: {
        key: "trustmrr:taillens-tool-for-frontend-developers",
        url: "https://trustmrr.com/startup/taillens-tool-for-frontend-developers",
      },
      platform: "web",
      value:
        "공개 웹페이지의 지정 요소를 읽어 원하는 Tailwind 클래스 최소 수정 diff 한 파일로 만드는 도구",
      detail:
        "URL·CSS selector·변경값이 합쳐진 텍스트 하나를 입력하면 현재 클래스를 읽고 간격·색상·breakpoint 중 한 줄만 바뀐 diff로 내보냅니다.",
      evidence:
        "TrustMRR에서 Tailwind 개발자가 브라우저 안에서 요소를 시각 편집·검사하고 클래스 변경을 미리 보는 도구로 수집된 제품",
      preservedFlow:
        "공개 URL#selector와 변경값 입력 → 현재 Tailwind class 검사·변환 → 최소 수정 diff 파일",
    },
    payers: [
      {
        id: "payer-tailwind-class-diff-1",
        value: "Tailwind로 고객 사이트를 만드는 프론트엔드 개발자",
        detail: "브라우저에서 클래스를 바꿔 보고 코드에서 다시 찾아 수정한다.",
      },
      {
        id: "payer-tailwind-class-diff-2",
        value: "여러 반응형 페이지를 검수하는 웹 퍼블리셔",
        detail: "어떤 Tailwind 클래스가 최소 수정인지 다시 계산한다.",
      },
      {
        id: "payer-tailwind-class-diff-3",
        value: "디자인 시스템 규칙을 관리하는 UI 엔지니어",
        detail: "현재 class와 교체 class를 수기로 비교한다.",
      },
    ],
    moments: [
      {
        id: "moment-tailwind-class-diff-1",
        value: "브라우저에서 한 요소의 디자인 오류를 발견한 직후",
        detail: "대상 요소와 원하는 값을 넣어 최소 class 변경을 확인해야 한다.",
      },
      {
        id: "moment-tailwind-class-diff-2",
        value: "화면 수정 내용을 코드 리뷰에 올리기 직전",
        detail: "요청한 시각 속성만 고쳤다는 작은 diff가 필요하다.",
      },
      {
        id: "moment-tailwind-class-diff-3",
        value: "같은 요소의 Tailwind class를 다시 조합하기 전",
        detail: "현재 class에서 교체할 한 줄을 먼저 확인해야 한다.",
      },
    ],
    twists: [
      {
        id: "twist-tailwind-class-diff-1",
        kind: "replace",
        value: "간격 값을 Tailwind spacing class로 바꾸기",
        detail: "요청한 margin·padding 값만 spacing class로 바꾼다.",
        resultTitle: "Tailwind 간격 class 최소 수정 diff",
        platform: "web",
        smallestBuild:
          "`공개 URL#CSS selector|margin 또는 padding=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, spacing class 한 줄만 바뀐 diff 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-tailwind-class-diff-2",
        kind: "add",
        value: "색상 값을 Tailwind color class로 바꾸기",
        detail: "요청한 텍스트·배경색만 color class로 바꾼다.",
        resultTitle: "Tailwind 색상 class 최소 수정 diff",
        platform: "web",
        smallestBuild:
          "`공개 URL#CSS selector|text 또는 background color=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, color class 한 줄만 바뀐 diff 파일 한 개를 즉시 반환한다.",
      },
      {
        id: "twist-tailwind-class-diff-3",
        kind: "add",
        value: "변경값을 한 breakpoint에만 적용하기",
        detail: "sm·md·lg 중 한 breakpoint에만 요청 class를 붙인다.",
        resultTitle: "Tailwind 반응형 breakpoint 최소 수정 diff",
        platform: "web",
        smallestBuild:
          "`공개 URL#CSS selector|breakpoint와 class=값` 텍스트 한 덩어리를 입력받아 현재 class를 한 번 읽고, 지정 breakpoint class 한 줄만 추가된 diff 파일 한 개를 즉시 반환한다.",
      },
    ],
  },
];

export const PLATFORM_LABELS = {
  web: "웹",
  app: "앱",
  plugin: "플러그인",
} as const;

export const CHANGE_KIND_LABELS = {
  add: "하나 더하기",
  remove: "하나 빼기",
  replace: "하나 바꾸기",
} as const;
