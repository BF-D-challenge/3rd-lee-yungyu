#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const goldenPath = path.join(repoRoot, "public/data/golden.json");
const cards = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const key = (card) => `${card.seed}|${card.pain}|${card.format}`;

const patches = {
  "community-launch-board|72|vote-card": {
    title: "런칭 도움 요청 매칭카드",
    oneliner: "공개 이틀 전 남은 일과 도움 후보를 올리고, 부탁 난이도와 소요 시간에 동료 반응을 받아 보낼 요청 한 장을 정한다.",
    mvp: ["남은 일 입력", "도움 후보 추가", "부탁 부담 표시", "요청 한 장 고르기"],
    evidence: "Changelogfy는 사용자 피드백을 제품 결정으로 바꾸는 서비스로 월매출 약 243만원의 수요가 있어요.",
    todayAction: "오늘 반나절 안에 런칭 전 남은 일과 도움 후보를 카드로 만들고, 동료 반응으로 먼저 보낼 요청 한 장을 정할 수 있어요.",
    buildPrompt: "1인 빌더가 런칭 전에 남은 일과 도움을 요청할 동료 후보를 입력하는 카드 화면을 만들어줘. 각 카드에는 소요 시간, 부탁 부담, 마감, 보낼 요청 문장을 붙이고 동료가 가장 도울 수 있는 한 장에 반응하게 해줘. 선택 결과와 최종 요청 문장은 브라우저에 저장해줘.",
    anchorName: "Changelogfy",
    anchorDetail: "Changelogfy: 사용자 피드백을 제품 의사결정으로 바꾸는 서비스, 월매출 약 243만원.",
    appName: "런칭 도움 요청 매칭카드",
    whyItMatters: "1인 빌더는 도움을 청할 대상을 못 정해 남은 일을 다시 떠안기 쉽습니다. 부탁의 크기와 문장이 보이면 동료가 답하기 쉬운 요청부터 보낼 수 있습니다.",
    differentiationAxis: {
      socialContext: "1인 빌더가 공개 이틀 전 동료에게 도움을 요청하는 장면",
      outputShape: "도움 요청 매칭카드",
      anchorMechanism: "피드백을 다음 제품 결정으로 바꾸는 방식"
    }
  },
  "ai-workout-coach|13|vote-card": {
    title: "홈트 질문 장면 투표카드",
    oneliner: "홈트 자세 영상에서 무릎·허리·균형 중 어느 구간을 트레이너에게 먼저 물을지 운동 경험자 투표로 고르는 카드.",
    target: "전문가에게 질문하기 전 위험해 보이는 장면을 좁히려는 홈트 초보",
    mvp: ["자세 영상 등록", "걱정 부위 표시", "질문할 장면 고르기", "전문가 질문 저장"],
    evidence: "3AK Track & Field는 개인 훈련으로 자세 교정을 돕는 앱이며 월매출 약 2,025만원의 수요가 있어요.",
    todayAction: "오늘 반나절 안에 홈트 영상을 올리고 무릎·허리·균형 중 먼저 물을 장면을 고르는 질문 카드를 만들 수 있어요.",
    buildPrompt: "홈트 초보가 자세 영상을 올리고 운동 경험자에게 전문가에게 먼저 물을 장면을 고르는 카드를 만들어줘. 각 장면에는 무릎, 허리, 균형 중 걱정 부위를 표시하게 하고, 정확하거나 안전하다고 판정하지 말고 질문 우선순위만 모으게 해줘. 최종 질문과 영상 타임코드는 브라우저에 저장해줘.",
    anchorName: "3AK Track & Field",
    anchorDetail: "3AK Track & Field: 개인 훈련으로 운동 자세 교정을 돕는 앱, 월매출 약 2,025만원.",
    appName: "홈트 질문 장면 투표카드",
    whyItMatters: "비전문가 반응은 자세의 안전성을 판정할 수 없지만, 어떤 장면을 전문가에게 먼저 물을지는 좁힐 수 있습니다. 질문이 구체적이면 운동을 무작정 중단하는 시간을 줄일 수 있습니다.",
    differentiationAxis: {
      socialContext: "혼자 홈트 영상을 본 뒤 전문가 질문을 준비하는 장면",
      outputShape: "자세 질문 우선순위 카드",
      emotionalResolution: "막연한 불안이 구체적인 질문으로 바뀜",
      anchorMechanism: "개인 훈련 피드백으로 자세 개선을 돕는 방식"
    }
  },
  "community-niche-forum|16|chatbot": {
    title: "후기 속 내 조건 질문봇",
    oneliner: "장비명·예산·사용 장소를 넣으면, 결제 전에 후기에서 확인해야 할 질문 세 가지만 뽑아준다.",
    evidence: "Amazon Reviews Extractor는 상품 후기를 추출하고 요약하는 도구로 월매출 약 13만원의 유료 신호가 있어요.",
    todayAction: "오늘 반나절 안에 장비명·예산·사용 장소를 넣고 후기에서 확인할 질문 세 가지를 만드는 화면을 만들 수 있어요.",
    anchorName: "Amazon Reviews Extractor",
    anchorDetail: "Amazon Reviews Extractor: 상품 후기를 추출하고 장단점을 요약하는 도구, 월매출 약 13만원.",
    appName: "후기 속 내 조건 질문봇",
    differentiationAxis: {
      outputShape: "내 조건 후기 질문봇",
      anchorMechanism: "흩어진 상품 후기를 추출하고 장단점으로 요약하는 방식"
    }
  },
  "backend|33|digest-bot": {
    title: "CORS 오류 다음 확인봇",
    oneliner: "낯선 CORS 오류를 붙여 넣으면 설정을 바꾸기 전 먼저 볼 요청·응답 한 곳과 확인 순서를 짧은 알림으로 보내준다.",
    target: "CORS 오류 앞에서 프록시 예제부터 붙여 넣는 초보 개발자",
    mvp: ["CORS 오류 붙이기", "요청 주소 입력", "먼저 볼 응답 받기", "확인 순서 저장"],
    evidence: "CORSPROXY는 CORS 오류 해결에 집중한 서비스로 월매출 약 162만원의 수요가 있어요.",
    todayAction: "오늘 반나절 안에 CORS 오류와 요청 주소를 넣고, 먼저 볼 응답 헤더와 확인 순서를 받는 봇을 만들 수 있어요.",
    buildPrompt: "초보 개발자가 CORS 오류 문구, 요청 주소, 프론트 주소를 입력하면 설정을 바꾸기 전에 확인할 요청과 응답 헤더를 한 곳씩 알려주는 화면을 만들어줘. 무작정 프록시를 권하지 말고 서버 허용 출처, preflight 응답, 자격 증명 순서로 확인하게 해줘. 결과는 저장하고 공유할 수 있게 해줘.",
    anchorName: "CORSPROXY",
    anchorDetail: "CORSPROXY: CORS 오류 해결에 집중한 서비스, 월매출 약 162만원.",
    appName: "CORS 오류 다음 확인봇",
    needSource: "direct",
    differentiationAxis: {
      socialContext: "배포 전 CORS 오류를 혼자 읽는 초보 개발자",
      outputShape: "CORS 확인 순서 알림",
      anchorMechanism: "CORS 오류 해결에 집중해 다음 확인을 줄이는 방식"
    }
  },
  "cafe|18|curation": {
    title: "점심 뒤 팀 카페 세 곳",
    oneliner: "팀원이 각자 가능한 걷는 거리와 대기 시간을 고르면, 날씨까지 반영해 오늘 갈 카페 세 곳만 남긴다.",
    evidence: "takeout-tools는 Google Maps 저장 목록을 주소와 좌표로 정리하는 서비스로 월매출 약 100만원의 수요가 있어요.",
    todayAction: "오늘 반나절 안에 팀 근처 카페와 거리·대기 조건을 넣고, 각자 선택을 반영해 세 곳만 남기는 목록을 만들 수 있어요.",
    anchorName: "takeout-tools",
    anchorDetail: "takeout-tools: Google Maps 저장 목록을 주소와 좌표로 정리하는 서비스, 월매출 약 100만원.",
    appName: "점심 뒤 팀 카페 세 곳",
    differentiationAxis: {
      outputShape: "오늘 갈 팀 카페 세 곳",
      anchorMechanism: "저장한 장소 목록을 위치 정보로 정리하는 방식"
    }
  },
  "mobile-apps-ai-reply-generator|10|calc-tool": {
    title: "AI 답장 앱 첫 기능 결정표",
    oneliner: "사과·거절·예약 변경을 빈도·표현 위험·결제 가능성으로 비교해, 첫 출시에서 검증할 상황 하나를 정한다.",
    evidence: "Ticketdesk AI는 고객 문의에 자동 답장하는 지원 도구로 월매출 약 297만원의 수요가 있어요.",
    anchorName: "Ticketdesk AI",
    anchorDetail: "Ticketdesk AI: 지식 기반으로 고객 문의와 채팅에 자동 답장하는 도구, 월매출 약 297만원.",
    appName: "AI 답장 앱 첫 기능 결정표",
    differentiationAxis: {
      outputShape: "AI 답장 첫 기능 결정표",
      anchorMechanism: "고객 문의에 지식 기반 답장 초안을 만드는 방식"
    }
  }
};

let changed = 0;
for (const card of cards) {
  const patch = patches[key(card)];
  if (!patch) continue;
  const differentiationAxis = patch.differentiationAxis
    ? { ...card.differentiationAxis, ...patch.differentiationAxis }
    : card.differentiationAxis;
  Object.assign(card, patch, { differentiationAxis });
  changed += 1;
}

if (changed !== Object.keys(patches).length) {
  throw new Error(`Expected ${Object.keys(patches).length} cards, updated ${changed}`);
}

fs.writeFileSync(goldenPath, JSON.stringify(cards, null, 2) + "\n");
console.log(JSON.stringify({ changed, keys: Object.keys(patches) }, null, 2));
