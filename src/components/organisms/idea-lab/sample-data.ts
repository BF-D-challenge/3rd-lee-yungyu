import type { IdeaLabAxisMeta, IdeaLabScenario } from "./types";

export const IDEA_LAB_AXIS_META: Record<"source" | "payer" | "moment" | "twist", IdeaLabAxisMeta> = {
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
      platform: "web",
      value: "정보 하나를 넣으면 상대 정보를 찾아 정리해주는 웹 서비스",
      detail: "전화번호·이메일·IP 중 하나를 넣으면 쓸 수 있는 정보인지 확인하고 근거를 한곳에 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 데이터 검증 제품",
      preservedFlow: "정보 입력 → 여러 출처 확인 → 결과와 근거 정리",
    },
    payers: [
      {
        id: "payer-solo-sales",
        value: "매주 잠재 고객을 찾는 1인 영업자",
        detail: "미팅 전에 상대 회사와 담당자를 매번 직접 검색합니다.",
      },
      {
        id: "payer-recruiter",
        value: "하루에 후보자 여러 명을 확인하는 채용 담당자",
        detail: "지원자에게 연락하기 전 공개 정보를 빠르게 교차 확인합니다.",
      },
      {
        id: "payer-agency",
        value: "새 광고주를 자주 만나는 소형 대행사 대표",
        detail: "제안 전에 회사의 규모와 최근 활동을 짧게 파악해야 합니다.",
      },
    ],
    moments: [
      {
        id: "moment-before-call",
        value: "첫 미팅 10분 전",
        detail: "검색할 시간은 부족하지만 아무것도 모르고 들어갈 수는 없는 순간",
      },
      {
        id: "moment-before-email",
        value: "처음 영업 메일을 보내기 직전",
        detail: "상대와 맞지 않는 뻔한 문장을 보내기 싫은 순간",
      },
      {
        id: "moment-lead-list",
        value: "이번 주 연락할 사람을 고르는 월요일 아침",
        detail: "긴 후보 목록에서 먼저 연락할 사람을 정해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-voice",
        kind: "replace",
        value: "긴 리포트를 빼고 30초 음성 브리핑으로 바꾸기",
        detail: "찾고 확인하는 과정은 그대로 두고 결과를 듣는 방식만 바꿉니다.",
        resultTitle: "미팅 전 30초 상대 브리핑",
        platform: "app",
        smallestBuild: "이름이나 회사 주소 하나를 넣고 30초 음성 요약을 듣는 화면",
      },
      {
        id: "twist-tab",
        kind: "add",
        value: "현재 보고 있는 웹페이지에서 바로 확인하는 버튼 하나 더하기",
        detail: "새 사이트로 이동하지 않고 현재 탭의 회사 정보를 입력으로 사용합니다.",
        resultTitle: "현재 탭 잠재고객 확인 버튼",
        platform: "plugin",
        smallestBuild: "회사 웹사이트에서 버튼을 누르면 핵심 정보 세 줄이 뜨는 브라우저 패널",
      },
      {
        id: "twist-three-lines",
        kind: "remove",
        value: "모든 세부정보를 빼고 대화거리 세 개만 남기기",
        detail: "데이터를 찾는 구조는 유지하고 최종 결과의 양만 줄입니다.",
        resultTitle: "첫 대화거리 3줄 찾기",
        platform: "web",
        smallestBuild: "회사 주소를 넣으면 근거와 함께 대화거리 세 줄만 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "voice-notes",
    source: {
      id: "source-voice",
      sourceName: "VoiceType",
      platform: "plugin",
      value: "말하면 바로 글자로 바꾸어 입력칸에 넣어주는 브라우저 확장",
      detail: "키보드 대신 말한 내용을 받아 적고, 현재 보고 있는 입력칸에 글을 넣어줍니다.",
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
        id: "twist-questions",
        kind: "add",
        value: "받아쓴 글에서 결정·할 일·열린 질문만 자동으로 나누기",
        detail: "받아쓰기는 그대로 두고 결과를 세 묶음으로 정리하는 단계만 더합니다.",
        resultTitle: "말하면 정리되는 회의 마무리",
        platform: "plugin",
        smallestBuild: "녹음 버튼과 결정·할 일·질문 세 칸이 있는 브라우저 패널",
      },
      {
        id: "twist-mobile",
        kind: "replace",
        value: "입력칸 대신 잠금화면의 빠른 녹음으로 바꾸기",
        detail: "말을 글로 바꾸는 핵심은 유지하고 시작 위치만 모바일로 옮깁니다.",
        resultTitle: "잠금화면 한 문장 메모",
        platform: "app",
        smallestBuild: "버튼을 길게 눌러 말하면 제목과 본문 한 줄이 저장되는 모바일 화면",
      },
      {
        id: "twist-summary",
        kind: "remove",
        value: "전체 받아쓰기를 숨기고 결정된 문장만 보여주기",
        detail: "변환 과정은 유지하고 사용자가 보는 결과를 결정 문장으로 줄입니다.",
        resultTitle: "결정만 남기는 음성 메모",
        platform: "web",
        smallestBuild: "1분 음성을 올리면 결정된 내용만 세 줄로 보여주는 웹 화면",
      },
    ],
  },
  {
    id: "shirt-preview",
    source: {
      id: "source-shirt",
      sourceName: "ThreadCam",
      platform: "app",
      value: "그림을 올리면 티셔츠에 입힌 모습을 3D로 보여주는 앱",
      detail: "평면 그림과 옷 색상을 고르면 실제 티셔츠처럼 돌려볼 수 있는 미리보기를 만듭니다.",
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
        detail: "작업자가 이해한 것과 고객이 기대한 것이 같은지 확인해야 하는 순간",
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
        id: "twist-approve",
        kind: "add",
        value: "공유 화면에 승인 또는 수정 요청 버튼 하나 더하기",
        detail: "3D 미리보기는 그대로 두고 고객의 결정을 받는 행동만 더합니다.",
        resultTitle: "승인까지 끝나는 티셔츠 목업",
        platform: "app",
        smallestBuild: "목업 한 장을 돌려보고 승인·수정 요청 중 하나를 누르는 모바일 화면",
      },
      {
        id: "twist-browser",
        kind: "replace",
        value: "별도 앱 대신 쇼핑몰 상품 편집 화면 안에서 미리보기",
        detail: "목업 생성은 유지하고 사용하는 장소만 브라우저 편집 화면으로 바꿉니다.",
        resultTitle: "상품 등록 중 3D 목업 확인",
        platform: "plugin",
        smallestBuild: "상품 이미지 옆에 3D 미리보기 버튼이 생기는 브라우저 확장 패널",
      },
      {
        id: "twist-one-view",
        kind: "remove",
        value: "복잡한 편집 기능을 빼고 앞·뒤 두 각도만 제공",
        detail: "목업을 만드는 구조는 유지하고 첫 검토에 필요 없는 기능을 덜어냅니다.",
        resultTitle: "두 장으로 끝내는 단체티 확인",
        platform: "web",
        smallestBuild: "그림과 티셔츠 색을 고르면 앞·뒤 이미지 두 장을 만드는 웹 화면",
      },
    ],
  },
  {
    id: "dm-concierge",
    source: {
      id: "source-dm-concierge",
      sourceName: "SetSmart",
      platform: "web",
      value: "인스타그램·왓츠앱 문의를 걸러 담당자 승인 후 상담을 예약해주는 웹 서비스",
      detail: "인스타그램 DM과 왓츠앱으로 온 문의를 조건에 맞게 골라내고, 담당자가 승인하면 상담 일정을 자동으로 잡아줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 상담 문의 선별·예약 제품",
      preservedFlow: "문의 수집 → 조건으로 선별 → 담당자 승인 후 예약",
    },
    payers: [
      {
        id: "payer-solo-consultant",
        value: "혼자 상담 문의를 받는 1인 컨설턴트",
        detail: "밤에도 인스타그램 DM으로 오는 상담 문의에 일일이 답장합니다.",
      },
      {
        id: "payer-clinic-desk",
        value: "예약 문의가 많은 병원·미용실 데스크 담당자",
        detail: "영업시간 외에 온 문의를 다음 날 아침에 몰아서 확인합니다.",
      },
      {
        id: "payer-course-seller",
        value: "여러 채널로 문의받는 온라인 강의 판매자",
        detail: "인스타그램과 왓츠앱을 오가며 같은 질문에 반복해서 답합니다.",
      },
    ],
    moments: [
      {
        id: "moment-after-hours",
        value: "영업시간이 끝난 뒤 문의가 쌓이는 밤",
        detail: "답장이 늦어지면 상대가 다른 곳을 알아볼까 조바심 나는 순간",
      },
      {
        id: "moment-before-response",
        value: "문의에 답장을 보내기 직전",
        detail: "적합한 고객인지 모른 채 시간을 들여 답하기 꺼려지는 순간",
      },
      {
        id: "moment-schedule-fill",
        value: "이번 주 상담 일정을 채워야 할 때",
        detail: "빈 시간대에 맞는 문의를 골라 예약으로 연결해야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-approval-alert",
        kind: "replace",
        value: "긴 채팅 기록을 빼고 승인 여부만 묻는 알림 하나로 바꾸기",
        detail: "문의를 선별하는 과정은 그대로 두고 담당자가 보는 화면만 알림 하나로 바꿉니다.",
        resultTitle: "한 번의 승인 알림",
        platform: "app",
        smallestBuild: "선별된 문의 하나를 보여주고 승인·거절 버튼만 있는 모바일 알림 화면",
      },
      {
        id: "twist-auto-confirm",
        kind: "add",
        value: "예약 확정 문자를 고객에게 자동으로 보내기 하나 더하기",
        detail: "선별과 승인 과정은 유지하고 예약이 끝난 뒤 고객에게 알리는 행동만 더합니다.",
        resultTitle: "예약까지 끝나는 상담봇",
        platform: "web",
        smallestBuild: "승인 후 상담 링크와 확정 문자를 자동으로 보내는 웹 대시보드 화면",
      },
      {
        id: "twist-priority-list",
        kind: "remove",
        value: "복잡한 조건 설정을 빼고 문의 우선순위 목록만 남기기",
        detail: "선별하는 구조는 유지하고 담당자가 확인해야 할 화면의 양만 줄입니다.",
        resultTitle: "오늘 답할 문의 순서",
        platform: "plugin",
        smallestBuild: "인스타그램 DM 화면 옆에 오늘 답할 순서대로 문의를 보여주는 브라우저 패널",
      },
    ],
  },
  {
    id: "cross-post-relay",
    source: {
      id: "source-cross-post",
      sourceName: "POST BRIDGE",
      platform: "plugin",
      value: "원문 하나를 여러 소셜미디어 채널에 맞게 미리보기로 만들어 한 번에 올려주는 브라우저 확장",
      detail: "글과 발행할 채널을 고르면 채널마다 다르게 보일 모습을 미리 보여주고, 승인한 채널에 동시에 올려줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 콘텐츠 동시 발행 제품",
      preservedFlow: "원문과 채널 선택 → 채널별 미리보기 생성 → 승인 후 동시 발행",
    },
    payers: [
      {
        id: "payer-social-manager",
        value: "여러 브랜드 계정을 동시에 관리하는 소셜미디어 담당자",
        detail: "같은 게시물을 채널마다 다시 올리며 형식을 매번 맞춥니다.",
      },
      {
        id: "payer-agency-junior",
        value: "여러 고객사 채널을 맡은 광고대행사 막내 직원",
        detail: "고객사마다 게시 시간과 형식이 달라 하나씩 따로 올립니다.",
      },
      {
        id: "payer-solo-creator",
        value: "여러 플랫폼에 같은 콘텐츠를 올리는 1인 크리에이터",
        detail: "채널마다 로그인해서 같은 사진과 글을 반복해서 붙여넣습니다.",
      },
    ],
    moments: [
      {
        id: "moment-new-post-ready",
        value: "새 게시물 원고가 완성된 직후",
        detail: "여러 채널에 맞춰 다시 편집하기 전, 한 번에 끝내고 싶은 순간",
      },
      {
        id: "moment-multi-channel-check",
        value: "채널마다 미리보기를 확인해야 할 때",
        detail: "형식이 깨지지 않았는지 하나하나 눈으로 확인해야 하는 순간",
      },
      {
        id: "moment-schedule-set",
        value: "다음 주 게시 일정을 한 번에 잡을 때",
        detail: "여러 채널의 게시 시간을 따로따로 맞추기 번거로운 순간",
      },
    ],
    twists: [
      {
        id: "twist-compare-view",
        kind: "replace",
        value: "채널마다 따로 확인하던 미리보기를 한 화면 비교로 바꾸기",
        detail: "채널별 미리보기를 만드는 과정은 그대로 두고 확인하는 화면만 한곳으로 모읍니다.",
        resultTitle: "한 화면 채널 비교 발행",
        platform: "web",
        smallestBuild: "채널별 미리보기 세 개를 나란히 놓고 한 번에 승인하는 웹 화면",
      },
      {
        id: "twist-publish-alert",
        kind: "add",
        value: "발행 결과 알림을 휴대폰으로 받는 기능 하나 더하기",
        detail: "동시 발행 과정은 유지하고 결과를 알려주는 행동만 더합니다.",
        resultTitle: "발행 완료 알림 확인",
        platform: "app",
        smallestBuild: "발행 성공·실패를 채널별로 보여주는 모바일 알림 화면",
      },
      {
        id: "twist-instant-post",
        kind: "remove",
        value: "복잡한 예약 설정을 빼고 지금 바로 올리기 버튼만 남기기",
        detail: "채널별 미리보기와 발행 구조는 유지하고 예약 기능만 덜어냅니다.",
        resultTitle: "지금 바로 전체 발행",
        platform: "plugin",
        smallestBuild: "글쓰기 화면 옆에 지금 바로 올리기 버튼만 있는 브라우저 패널",
      },
    ],
  },
  {
    id: "instagram-unfollow-watch",
    source: {
      id: "source-unfollow-watch",
      sourceName: "Last Followed",
      platform: "web",
      value: "인스타그램 팔로잉 목록 두 시점을 비교해 변화를 보여주는 웹 서비스",
      detail: "예전에 저장해둔 팔로잉 목록과 지금 팔로잉 목록을 넣으면 새로 팔로우한 계정과 언팔로우한 계정을 구분해서 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 인스타그램 팔로잉 변화 추적 제품",
      preservedFlow: "팔로잉 목록 두 번 넣기 → 추가·이탈 계정 비교 → 변화 표로 확인",
    },
    payers: [
      {
        id: "payer-influencer-hopeful",
        value: "팔로워 반응에 신경 쓰는 인플루언서 지망생",
        detail: "게시물을 올릴 때마다 팔로워가 줄지는 않았는지 직접 목록을 뒤져서 확인합니다.",
      },
      {
        id: "payer-following-diet",
        value: "팔로잉을 정리하고 싶은 인스타그램 오래 쓴 사용자",
        detail: "몇 년간 쌓인 팔로잉 목록에서 어떤 계정을 언제부터 팔로우했는지 기억나지 않아 목록을 위아래로 뒤집니다.",
      },
      {
        id: "payer-friend-group-keeper",
        value: "친구 관계를 잘 챙기고 싶은 인스타그램 헤비 유저",
        detail: "친한 친구 목록에서 누가 조용히 빠졌는지 신경 쓰며 팔로워 수를 자주 세어봅니다.",
      },
    ],
    moments: [
      {
        id: "moment-day-after-post",
        value: "새 게시물을 올린 다음 날 아침",
        detail: "팔로워 수가 줄어든 걸 발견하고 누가 나갔는지 알고 싶어지는 순간",
      },
      {
        id: "moment-following-cleanup",
        value: "팔로잉 정리를 결심한 일요일 밤",
        detail: "정리하고 싶지만 최근에 바뀐 것부터 봐야 할지 막막한 순간",
      },
      {
        id: "moment-friend-list-scan",
        value: "친한 친구 목록을 훑어보다 어색함을 느끼는 순간",
        detail: "누가 빠졌는지 정확히 짚어내고 싶은 순간",
      },
    ],
    twists: [
      {
        id: "twist-daily-alert",
        kind: "replace",
        value: "매번 직접 비교하는 대신 매일 아침 알림 하나로 바꾸기",
        detail: "목록을 비교하는 방식은 그대로 두고 확인하는 타이밍만 자동 알림으로 옮깁니다.",
        resultTitle: "오늘의 언팔 알림",
        platform: "app",
        smallestBuild: "전날과 오늘의 팔로잉 차이를 계정 이름 몇 개로 보여주는 알림 화면 하나",
      },
      {
        id: "twist-watchlist",
        kind: "add",
        value: "즐겨찾기한 계정의 변화를 맨 위에 보여주기 하나 더하기",
        detail: "전체 비교 기능은 그대로 두고 내가 아껴 보는 계정의 변화를 먼저 보여주는 기능만 더합니다.",
        resultTitle: "즐겨찾기 변화 먼저 보기",
        platform: "web",
        smallestBuild: "계정 몇 개를 즐겨찾기하면 그 계정들의 팔로잉 변화만 맨 위에 뜨는 웹 화면",
      },
      {
        id: "twist-names-only",
        kind: "remove",
        value: "표와 시점 정보를 빼고 언팔로우한 이름만 남기기",
        detail: "비교하는 구조는 유지하고 결과 화면에서 보여주는 정보량만 줄입니다.",
        resultTitle: "언팔 계정만 딱 보기",
        platform: "plugin",
        smallestBuild: "인스타그램 페이지에서 버튼을 누르면 언팔로우한 계정 이름만 뜨는 브라우저 패널",
      },
    ],
  },
  {
    id: "paid-study-finder",
    source: {
      id: "source-study-finder",
      sourceName: "StudyScout",
      platform: "web",
      value: "참여 조건에 맞는 유료 설문·인터뷰 공고를 모아 보여주는 웹 서비스",
      detail: "거주지와 가능한 시간을 넣으면 지금 신청할 수 있는 유료 인터뷰와 설문 공고를 자격 조건과 보상까지 정리해서 보여줍니다.",
      evidence: "TrustMRR에서 실제 매출이 확인된 유료 리서치 참여 공고 모음 제품",
      preservedFlow: "참여 조건 입력 → 신청 가능한 공고 모으기 → 자격·보상 확인 후 신청",
    },
    payers: [
      {
        id: "payer-vacation-student",
        value: "방학 동안 용돈을 벌고 싶은 대학생",
        detail: "학기 중에는 못했던 부업 자리를 방학마다 인터넷으로 직접 찾아다닙니다.",
      },
      {
        id: "payer-commute-worker",
        value: "출퇴근 시간에 부업 거리를 찾는 직장인",
        detail: "월급 외 용돈을 벌고 싶어서 지하철에서 짬짬이 부업 공고를 뒤져봅니다.",
      },
      {
        id: "payer-stay-home-parent",
        value: "아이를 돌보며 짧은 시간에 돈 벌 거리를 찾는 전업주부",
        detail: "아이가 잠깐 눈을 뗀 사이에 할 수 있는 일이 있는지 스마트폰으로 계속 찾아봅니다.",
      },
    ],
    moments: [
      {
        id: "moment-end-of-month",
        value: "통장 잔고를 확인하고 한숨 쉬는 월말",
        detail: "당장 할 수 있는 부업이 있는지 조급하게 찾고 싶어지는 순간",
      },
      {
        id: "moment-commute-break",
        value: "출퇴근길 짧은 틈에 스마트폰을 여는 순간",
        detail: "복잡한 조건을 다 읽을 시간은 없지만 놓치기는 싫은 순간",
      },
      {
        id: "moment-nap-time",
        value: "아이가 낮잠 든 사이 잠깐 시간이 나는 순간",
        detail: "몇 분 안에 신청까지 끝내야 하는 순간",
      },
    ],
    twists: [
      {
        id: "twist-deadline-alert",
        kind: "add",
        value: "마감 임박 공고 알림 하나 더하기",
        detail: "공고를 모으는 방식은 그대로 두고 마감이 얼마 안 남은 공고를 따로 알려주는 기능을 더합니다.",
        resultTitle: "마감 임박 알림",
        platform: "app",
        smallestBuild: "마감이 하루 남은 공고 하나를 알림으로 보여주는 화면",
      },
      {
        id: "twist-today-three",
        kind: "replace",
        value: "긴 목록 대신 오늘 신청 가능한 세 개 추천으로 바꾸기",
        detail: "공고를 모으는 구조는 유지하고 사용자가 보는 결과만 오늘 신청 가능한 세 개로 좁힙니다.",
        resultTitle: "오늘의 부업 3개 추천",
        platform: "web",
        smallestBuild: "조건을 넣으면 오늘 신청 가능한 공고 세 개만 카드로 보여주는 웹 화면",
      },
      {
        id: "twist-now-only",
        kind: "remove",
        value: "복잡한 조건 필터를 빼고 지금 신청 가능한 공고만 남기기",
        detail: "공고를 모으는 과정은 유지하고 마감이 지난 공고와 불필요한 필터를 걷어냅니다.",
        resultTitle: "지금 신청 가능만 보기",
        platform: "plugin",
        smallestBuild: "지금 보고 있는 페이지 옆에서 신청 가능한 공고만 뜨는 브라우저 패널",
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
