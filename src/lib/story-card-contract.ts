export const STORY_CARD_IDS = [
  "rain-station",
  "glass-greenhouse",
  "moon-shop",
  "wave-archive",
] as const;

export type StoryCardId = (typeof STORY_CARD_IDS)[number];
export type StoryChoiceId = "observe" | "answer" | "leave";
export type StoryChoice = { id: StoryChoiceId; label: string };

export type StoryCardSession = {
  mode: "mock";
  sessionId: string;
  cardId: StoryCardId;
  cardTitle: string;
  character: string;
  scene: string;
  turn: number;
  totalTurns: 8;
  choiceHistory: StoryChoiceId[];
  passage: string;
  choices: StoryChoice[];
};

export type StoryCardEnding = {
  mode: "mock";
  sessionId: string;
  cardId: StoryCardId;
  cardTitle: string;
  character: string;
  scene: string;
  turn: 8;
  totalTurns: 8;
  choiceHistory: StoryChoiceId[];
  endingTitle: string;
  ending: string;
};

export type StoryCardResponse = StoryCardSession | StoryCardEnding;

export type StoryCardRequest =
  | { action: "draw"; excludeCardId?: StoryCardId }
  | {
      action: "choose";
      session: Pick<StoryCardSession, "sessionId" | "cardId" | "turn" | "choiceHistory">;
      choiceId: StoryChoiceId;
    };

export const isStoryEnding = (value: StoryCardResponse): value is StoryCardEnding => "ending" in value;
