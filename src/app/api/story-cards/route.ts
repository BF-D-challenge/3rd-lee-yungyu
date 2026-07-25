import { NextResponse } from "next/server";
import {
  STORY_CARD_IDS,
  type StoryCardId,
  type StoryCardRequest,
  type StoryChatSession,
  type StorySituation,
  type StorySituationListResponse,
} from "@/lib/story-card-contract";

const situations = [
  {
    id: "rain-station",
    title: "비가 멈춘 역",
    kicker: "지나간 선택이 자꾸 생각나는 밤",
    scene: "폐역의 마지막 기관사가 당신에게 어느 시간으로 돌아가고 싶은지 묻습니다.",
    guideName: "마지막 열차의 기관사",
    artIndex: 2,
    accent: "#e8c56a",
  },
  {
    id: "glass-greenhouse",
    title: "유리 온실의 편지",
    kicker: "전하지 못한 말이 남아 있는 순간",
    scene: "식물을 돌보는 우체국장이 아직 보내지 못한 편지 한 장을 건넵니다.",
    guideName: "온실의 우체국장",
    artIndex: 0,
    accent: "#6db4f5",
  },
  {
    id: "moon-shop",
    title: "달 아래의 가게",
    kicker: "놓친 기회와 미련을 정리하고 싶은 밤",
    scene: "밤에만 문을 여는 주인이 가져간 적 없는 물건의 영수증을 보여줍니다.",
    guideName: "달빛 가게의 주인",
    artIndex: 3,
    accent: "#ff8091",
  },
  {
    id: "wave-archive",
    title: "파도 기록실",
    kicker: "내 마음을 조용히 말해보고 싶은 때",
    scene: "사라진 목소리를 보관하는 기록관이 오래 기다린 당신의 서랍을 엽니다.",
    guideName: "파도 기록관",
    artIndex: 1,
    accent: "#7de4be",
  },
] as const satisfies readonly StorySituation[];

const openingBySituation: Record<StoryCardId, string> = {
  "rain-station": "마지막 열차가 곧 떠나요. 다시 가보고 싶은 순간이 있나요, 아니면 그대로 지나가고 싶은가요?",
  "glass-greenhouse": "이 편지는 아직 받는 사람이 없어요. 지금 가장 먼저 떠오르는 사람이나 말이 있나요?",
  "moon-shop": "영수증의 마지막 줄이 비어 있어요. 오늘 내려놓고 싶은 미련 하나를 적어볼까요?",
  "wave-archive": "이 서랍에는 오래 미뤄둔 목소리가 있어요. 지금 누구에게도 못 한 말을 한 문장만 들려주세요.",
};

const suggestionBySituation: Record<StoryCardId, string[]> = {
  "rain-station": ["다시 가고 싶은 순간이 있어요", "그냥 지나가고 싶어요"],
  "glass-greenhouse": ["전하지 못한 말이 있어요", "누구에게 쓸지 모르겠어요"],
  "moon-shop": ["놓아주고 싶은 미련이 있어요", "아직 값을 치르고 싶지 않아요"],
  "wave-archive": ["조용히 털어놓고 싶어요", "무슨 말부터 해야 할지 모르겠어요"],
};

const followUps: Record<StoryCardId, readonly string[]> = {
  "rain-station": [
    "그 순간의 당신에게 지금 한마디를 보낼 수 있다면 뭐라고 말하고 싶나요?",
    "돌아가는 대신 오늘 할 수 있는 가장 작은 일은 무엇일까요?",
    "말해줘서 고마워요. 그 선택은 후회보다 지금의 방향을 더 선명하게 보여주고 있어요.",
  ],
  "glass-greenhouse": [
    "그 말을 받는 사람이 어떤 표정을 지을 것 같나요?",
    "완벽한 편지 대신 한 문장만 보낸다면 무엇을 남기고 싶나요?",
    "말해줘서 고마워요. 보내지 않아도, 마음속 문장은 이미 조금 자란 것 같아요.",
  ],
  "moon-shop": [
    "그 미련이 계속 남게 한 가장 아까운 부분은 무엇인가요?",
    "그 값을 더 치르지 않기 위해 오늘 닫을 수 있는 문이 하나 있을까요?",
    "말해줘서 고마워요. 비워둔 마지막 줄은 다음 선택을 위한 자리로 남겨둘게요.",
  ],
  "wave-archive": [
    "그 말을 처음 품었던 때의 당신은 무엇을 바라고 있었나요?",
    "지금의 당신이 그 목소리에 답한다면 어떤 문장이 될까요?",
    "말해줘서 고마워요. 이 기록은 정답이 아니라, 지금 마음을 확인한 흔적으로 남겨둘게요.",
  ],
};

const safeSituationId = (value: unknown): value is StoryCardId =>
  STORY_CARD_IDS.some((id) => id === value);

const situationFor = (id: StoryCardId): StorySituation =>
  situations.find((situation) => situation.id === id) ?? situations[0];

export async function GET() {
  const response: StorySituationListResponse = {
    mode: "mock",
    situations: [...situations],
  };
  return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  let body: StoryCardRequest | null;
  try {
    body = await request.json() as StoryCardRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || !safeSituationId(body.situationId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const situation = situationFor(body.situationId);

  if (body.action === "start") {
    const response: StoryChatSession = {
      mode: "mock",
      sessionId: crypto.randomUUID(),
      situation,
      messages: [{
        id: crypto.randomUUID(),
        role: "guide",
        text: openingBySituation[situation.id],
      }],
      suggestedReplies: suggestionBySituation[situation.id],
    };
    return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
  }

  if (
    body.action !== "reply"
    || typeof body.sessionId !== "string"
    || body.sessionId.length < 1
    || body.sessionId.length > 120
    || typeof body.message !== "string"
    || body.message.trim().length < 1
    || body.message.trim().length > 500
    || !Number.isInteger(body.messageCount)
    || body.messageCount < 1
    || body.messageCount > 50
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const followUpIndex = Math.min(body.messageCount - 1, 2);
  const response: StoryChatSession = {
    mode: "mock",
    sessionId: body.sessionId,
    situation,
    messages: [{
      id: crypto.randomUUID(),
      role: "guide",
      text: followUps[situation.id][followUpIndex],
    }],
    suggestedReplies: followUpIndex >= 2 ? [] : suggestionBySituation[situation.id],
  };
  return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
}
