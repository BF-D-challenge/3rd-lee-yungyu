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
    color: "#f3c969",
    softColor: "rgba(243, 201, 105, .13)",
  },
  moment: {
    id: "moment",
    label: "필요한 순간",
    question: "언제 해결 욕구가 가장 커지나요?",
    color: "#7de4be",
    softColor: "rgba(125, 228, 190, .13)",
  },
  twist: {
    id: "twist",
    label: "한 끗 변화",
    question: "딱 하나만 무엇을 바꿀까요?",
    color: "#e99bb0",
    softColor: "rgba(233, 155, 176, .13)",
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
