import { NextResponse } from "next/server";
import {
  todayBExperimentRequestSchema,
  type TodayBExperimentRequest,
  type TodayBExperimentResponse,
} from "@/lib/today-b-contract";

const channelLabel: Record<TodayBExperimentRequest["channel"], string> = {
  community: "고객이 모인 커뮤니티",
  direct: "직접 연락",
  audience: "내 콘텐츠 채널",
  offline: "오프라인 접점",
};

const signalConfig: Record<
  TodayBExperimentRequest["signal"],
  { riskLabel: string; target: number; pass: number; signal: string; ask: string }
> = {
  conversation: {
    riskLabel: "문제의 시급성",
    target: 20,
    pass: 5,
    signal: "15분 문제 인터뷰 약속",
    ask: "이번 주 15분 동안 현재 해결 방식을 보여달라고 요청하세요.",
  },
  waitlist: {
    riskLabel: "행동 의향",
    target: 30,
    pass: 7,
    signal: "연락처를 남긴 대기 신청",
    ask: "만들어지면 먼저 써보겠다는 연락처를 요청하세요.",
  },
  deposit: {
    riskLabel: "지불 의향",
    target: 15,
    pass: 2,
    signal: "환불 가능한 예약금 결제",
    ask: "제공 범위와 환불 조건을 먼저 밝히고 소액 예약금을 요청하세요.",
  },
  preorder: {
    riskLabel: "구매 의향",
    target: 15,
    pass: 2,
    signal: "가격을 확인한 사전 구매",
    ask: "제공일과 환불 조건을 밝힌 사전 구매를 요청하세요.",
  },
};

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }

  const parsed = todayBExperimentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  const input = parsed.data;
  const signal = signalConfig[input.signal];
  const channel = channelLabel[input.channel];
  const assumption = `${input.customer}은(는) “${input.promise}”을(를) 얻기 위해 ${signal.signal}까지 할 것이다.`;
  const offer = `${input.idea}: ${input.promise}. 아직 제품은 만들지 않았습니다. ${signal.ask}`;

  const response: TodayBExperimentResponse = {
    mode: "rule_based_mock",
    planId: crypto.randomUUID(),
    risk: {
      label: signal.riskLabel,
      assumption,
      reason: `좋다는 반응보다 ${signal.signal}이 실제 수요에 더 가까운 신호이기 때문이에요.`,
    },
    experiment: {
      hypothesis: `${channel}에서 ${input.customer} ${signal.target}명에게 제안하면, 최소 ${signal.pass}명이 ${signal.signal}을(를) 남긴다.`,
      offer,
      targetCount: signal.target,
      passCount: signal.pass,
      passSignal: signal.signal,
      days: [
        {
          day: 1,
          title: "대상을 한 문장으로 좁히기",
          action: `${input.customer} 중 지금 이 문제를 겪는 조건 하나를 적고, 연락할 사람 ${Math.min(5, signal.target)}명을 찾으세요.`,
          evidenceToKeep: "대상 조건과 첫 연락 목록",
        },
        {
          day: 2,
          title: "설명 한 장 만들기",
          action: `문제, “${input.promise}”, ${signal.signal} 요청만 담은 짧은 소개를 만드세요. 완성된 제품 화면은 넣지 마세요.`,
          evidenceToKeep: "보낸 문구와 제안 화면",
        },
        {
          day: 3,
          title: "첫 제안 보내기",
          action: `${channel}에서 첫 ${Math.ceil(signal.target / 3)}명에게 같은 제안을 보내고 답변을 원문 그대로 기록하세요.`,
          evidenceToKeep: "발송 수, 답변 수, 실제 답변",
        },
        {
          day: 4,
          title: "거절 이유 하나 고치기",
          action: "가장 자주 나온 질문이나 거절 이유 한 가지만 설명에 반영하세요. 대상과 성공 기준은 바꾸지 마세요.",
          evidenceToKeep: "수정 전후 문구와 수정 이유",
        },
        {
          day: 5,
          title: "남은 대상에게 다시 제안하기",
          action: `같은 채널에서 누적 ${signal.target}명까지 제안하고 ${signal.signal}을(를) 다시 요청하세요.`,
          evidenceToKeep: "누적 도달 수와 행동 완료 수",
        },
        {
          day: 6,
          title: "행동 직전의 막힘 확인하기",
          action: "관심을 보였지만 행동하지 않은 사람에게 무엇이 막혔는지 한 질문만 보내세요.",
          evidenceToKeep: "행동 전 이탈 이유",
        },
        {
          day: 7,
          title: "숫자로 결정하기",
          action: `${signal.signal} 완료 수를 세고, 미리 정한 ${signal.pass}명 기준으로 계속·수정·중단을 결정하세요.`,
          evidenceToKeep: "최종 도달 수, 완료 수, 결정",
        },
      ],
      decisionRule: {
        continue: `${signal.pass}명 이상이면 가장 자주 요청받은 핵심 결과 한 가지만 만들어 다음 실험으로 넘어갑니다.`,
        revise: `1~${signal.pass - 1}명이면 대상 또는 제안 문구 중 한 가지만 바꿔 다시 시험합니다.`,
        stop: "0명이면 기능 제작을 멈추고, 문제를 실제로 겪는 대상부터 다시 찾습니다.",
      },
    },
    notice: "이 계획은 입력값을 규칙으로 조합한 Mock API 결과입니다. 실제 수요나 성공을 예측하지 않습니다.",
  };

  return noStoreJson(response);
}
