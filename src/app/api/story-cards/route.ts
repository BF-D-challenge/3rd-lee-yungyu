import { NextResponse } from "next/server";
import {
  STORY_CARD_IDS,
  type StoryCardId,
  type StoryCardRequest,
  type StoryCardResponse,
  type StoryChoice,
  type StoryChoiceId,
} from "@/lib/story-card-contract";

const cards = [
  {
    cardId: "rain-station",
    cardTitle: "비가 멈춘 역",
    character: "마지막 열차의 기관사",
    scene: "비가 멈춘 새벽, 폐역 플랫폼의 시계만 거꾸로 갑니다.",
    opening: "기관사는 멈춘 열차의 문을 열고 묻습니다. “이번에는 어느 쪽 시간을 고르겠어요?”",
    reveals: [
      "젖은 승차권에 아직 오지 않은 날짜가 번집니다.",
      "대합실 의자 아래에서 어린 시절의 목소리가 들립니다.",
      "거꾸로 가던 시계가 당신의 심장 박자에 맞춰 멈춥니다.",
      "빈 선로 위로 목적지가 적히지 않은 열차가 들어옵니다.",
      "기관사는 주머니에서 두 개의 출발 종을 꺼냅니다.",
      "플랫폼 끝에 돌아가는 문과 남는 문이 함께 열립니다.",
      "새벽 첫빛이 닿자 마지막 승차권의 글자가 선명해집니다.",
    ],
    endings: {
      observe: "당신은 서두르지 않고 시계가 제 속도를 찾는 순간을 지켜봤습니다. 역은 사라졌지만, 주머니 속 승차권에는 돌아올 수 있는 시간이 남았습니다.",
      answer: "당신이 먼저 목적지를 말하자 열차가 움직였습니다. 도착한 곳은 미래가 아니라, 오래 미뤄 둔 오늘의 첫 장면이었습니다.",
      leave: "당신은 열차 대신 플랫폼 밖의 길을 골랐습니다. 역의 불은 꺼졌지만, 걸음을 옮길 때마다 뒤에서 새로운 선로가 생겨났습니다.",
    },
  },
  {
    cardId: "glass-greenhouse",
    cardTitle: "유리 온실의 편지",
    character: "식물을 돌보는 우체국장",
    scene: "도착하지 못한 편지가 유리 온실 한가운데에서 싹을 틔웠습니다.",
    opening: "우체국장은 잎사귀 봉투 하나를 내밉니다. “받는 사람을 정해야 이 편지가 자라요.”",
    reveals: [
      "봉투의 맥을 따라 작은 주소들이 빛납니다.",
      "유리 천장에 보내지 못한 문장들이 비처럼 맺힙니다.",
      "가장 오래된 화분에서 당신의 필체가 발견됩니다.",
      "편지나무가 세 갈래로 가지를 뻗습니다.",
      "우체국장은 한 번도 찍지 않은 소인을 꺼냅니다.",
      "온실 문밖에 편지를 기다리는 그림자가 멈춰 섭니다.",
      "마지막 봉투가 열리며 빈 답장지 한 장이 떨어집니다.",
    ],
    endings: {
      observe: "당신은 답을 쓰기 전에 편지가 자라는 모습을 끝까지 보았습니다. 빈 답장지는 사라지고, 꼭 전해야 할 한 문장만 잎맥처럼 남았습니다.",
      answer: "당신이 받는 사람의 이름을 부르자 온실의 모든 봉투가 열렸습니다. 가장 먼저 도착한 것은 오래전의 당신이 보낸 짧은 안부였습니다.",
      leave: "당신은 편지를 들고 온실 밖으로 나왔습니다. 주소는 끝내 나타나지 않았지만, 길에서 만난 사람마다 봉투에 새로운 잎 하나를 더했습니다.",
    },
  },
  {
    cardId: "moon-shop",
    cardTitle: "달 아래의 가게",
    character: "밤에만 문을 여는 상점 주인",
    scene: "달빛으로만 계산할 수 있는 가게에서 당신 이름의 영수증을 발견합니다.",
    opening: "주인은 빈 저울에 영수증을 올립니다. “가져간 적 없는 물건의 값을 오늘 치르시겠어요?”",
    reveals: [
      "진열장 안의 병마다 잊어버린 하루가 흔들립니다.",
      "저울 반대편에 아직 하지 않은 약속이 놓입니다.",
      "영수증 뒷면에서 작은 달 하나가 떠오릅니다.",
      "가게 문이 열릴 때마다 다른 계절의 냄새가 들어옵니다.",
      "주인은 가격 대신 선택 하나를 적어 달라고 말합니다.",
      "선반 끝에서 당신의 이름을 부르는 상자가 열립니다.",
      "새벽이 가까워지자 영수증의 마지막 줄이 비어납니다.",
    ],
    endings: {
      observe: "당신은 빈 마지막 줄을 그대로 남겼습니다. 가게는 문을 닫았지만, 영수증에는 값을 매기지 않아도 되는 것들의 목록이 새로 적혔습니다.",
      answer: "당신이 선택을 또박또박 적자 저울이 수평을 찾았습니다. 상자 안에는 잃어버린 물건 대신, 내일 쓸 수 있는 한 시간이 들어 있었습니다.",
      leave: "당신은 아무것도 사지 않고 가게를 나왔습니다. 영수증은 달빛 속에서 사라졌고, 주머니에는 스스로 고른 것만 남았습니다.",
    },
  },
  {
    cardId: "wave-archive",
    cardTitle: "파도 기록실",
    character: "사라진 목소리를 보관하는 기록관",
    scene: "밀물이 들어오면 누군가의 오래된 선택이 책장 사이에서 들립니다.",
    opening: "기록관은 젖은 서랍 하나를 엽니다. “당신 목소리도 이 안에서 오래 기다렸어요.”",
    reveals: [
      "서랍 속 조개가 당신이 잊은 대답을 되풀이합니다.",
      "책장 사이로 들어온 파도가 한 권의 제목을 지웁니다.",
      "기록관의 펜 끝에서 낯익은 웃음소리가 번집니다.",
      "바닥의 물결마다 고르지 않은 길이 비칩니다.",
      "멀리서 같은 장면을 기억하는 종이 세 번 울립니다.",
      "기록관은 보관할 목소리와 돌려줄 목소리를 나눕니다.",
      "물이 빠지며 이름 없는 마지막 기록 한 장이 드러납니다.",
    ],
    endings: {
      observe: "당신은 마지막 파도가 빠질 때까지 아무 기록도 덮지 않았습니다. 조용해진 서랍에는 목소리 대신, 잊지 않겠다는 마음만 남았습니다.",
      answer: "당신이 오래된 대답을 새로 말하자 기록실의 물이 맑아졌습니다. 되돌아온 목소리는 과거의 것이 아니라 지금의 당신 목소리였습니다.",
      leave: "당신은 보관된 목소리를 두고 물 밖으로 걸어 나왔습니다. 뒤에서 파도는 계속 기록했지만, 이제 다음 문장은 당신 앞에서 시작됐습니다.",
    },
  },
] as const satisfies ReadonlyArray<{
  cardId: StoryCardId;
  cardTitle: string;
  character: string;
  scene: string;
  opening: string;
  reveals: readonly string[];
  endings: Record<StoryChoiceId, string>;
}>;

const choices: StoryChoice[] = [
  { id: "observe", label: "단서를 더 살펴본다" },
  { id: "answer", label: "먼저 말을 건넨다" },
  { id: "leave", label: "다른 길을 찾아본다" },
];

const safeText = (value: unknown, max = 120): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const safeTurn = (value: unknown): value is number => Number.isInteger(value) && typeof value === "number" && value >= 1 && value <= 8;
const safeChoice = (value: unknown): value is StoryChoiceId => value === "observe" || value === "answer" || value === "leave";
const safeCardId = (value: unknown): value is StoryCardId => STORY_CARD_IDS.some((cardId) => cardId === value);
const safeHistory = (value: unknown, turn: number): value is StoryChoiceId[] =>
  Array.isArray(value)
  && value.length === turn - 1
  && value.every(safeChoice);

const nextPassage = (
  card: (typeof cards)[number],
  turn: number,
  choiceId: StoryChoiceId,
) => {
  const action = choiceId === "observe"
    ? "당신이 잠시 멈춰 단서를 살피자,"
    : choiceId === "answer"
      ? "당신이 먼저 말을 건네자,"
      : "당신이 다른 길로 몸을 돌리자,";
  return `${action} ${card.character}의 표정이 달라집니다. ${card.reveals[turn - 2]}`;
};

export async function POST(request: Request) {
  let body: StoryCardRequest | null;
  try {
    body = await request.json() as StoryCardRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || (body.action !== "draw" && body.action !== "choose")) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (body.action === "draw") {
    const availableCards = safeCardId(body.excludeCardId)
      ? cards.filter((card) => card.cardId !== body.excludeCardId)
      : cards;
    const card = availableCards[Math.floor(Math.random() * availableCards.length)];
    const response: StoryCardResponse = {
      mode: "mock",
      sessionId: crypto.randomUUID(),
      cardId: card.cardId,
      cardTitle: card.cardTitle,
      character: card.character,
      scene: card.scene,
      turn: 1,
      totalTurns: 8,
      choiceHistory: [],
      passage: card.opening,
      choices,
    };
    return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
  }
  const session = body.session;
  if (
    !session
    || !safeChoice(body.choiceId)
    || !safeText(session.sessionId)
    || !safeCardId(session.cardId)
    || !safeTurn(session.turn)
    || !safeHistory(session.choiceHistory, session.turn)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const card = cards.find((candidate) => candidate.cardId === session.cardId);
  if (!card) return NextResponse.json({ error: "invalid_card" }, { status: 400 });

  const choiceHistory = [...session.choiceHistory, body.choiceId];
  if (session.turn === 8) {
    const totals = choiceHistory.reduce<Record<StoryChoiceId, number>>(
      (result, choiceId) => ({ ...result, [choiceId]: result[choiceId] + 1 }),
      { observe: 0, answer: 0, leave: 0 },
    );
    const dominantChoice = (Object.entries(totals) as Array<[StoryChoiceId, number]>)
      .reduce<StoryChoiceId>(
        (best, [choiceId, count]) => count >= totals[best] ? choiceId : best,
        body.choiceId,
      );
    const endingTitle = dominantChoice === "answer"
      ? "먼저 말을 건넨 사람"
      : dominantChoice === "observe"
        ? "끝까지 단서를 본 사람"
        : "자기 길을 고른 사람";
    const response: StoryCardResponse = {
      mode: "mock",
      sessionId: session.sessionId,
      cardId: card.cardId,
      cardTitle: card.cardTitle,
      character: card.character,
      scene: card.scene,
      turn: 8,
      totalTurns: 8,
      choiceHistory,
      endingTitle,
      ending: card.endings[dominantChoice],
    };
    return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
  }
  const nextTurn = session.turn + 1;
  const response: StoryCardResponse = {
    mode: "mock",
    sessionId: session.sessionId,
    cardId: card.cardId,
    cardTitle: card.cardTitle,
    character: card.character,
    scene: card.scene,
    turn: nextTurn,
    totalTurns: 8,
    choiceHistory,
    passage: nextPassage(card, nextTurn, body.choiceId),
    choices,
  };
  return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
}
