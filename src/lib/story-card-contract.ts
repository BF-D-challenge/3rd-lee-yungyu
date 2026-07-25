export const STORY_CARD_IDS = [
  "rain-station",
  "glass-greenhouse",
  "moon-shop",
  "wave-archive",
] as const;

export type StoryCardId = (typeof STORY_CARD_IDS)[number];

export type StorySituation = {
  id: StoryCardId;
  title: string;
  kicker: string;
  scene: string;
  guideName: string;
  artIndex: number;
  accent: string;
};

export type StoryChatMessage = {
  id: string;
  role: "guide" | "user";
  text: string;
};

export type StorySituationListResponse = {
  mode: "mock";
  situations: StorySituation[];
};

export type StoryChatSession = {
  mode: "mock";
  sessionId: string;
  situation: StorySituation;
  messages: StoryChatMessage[];
  suggestedReplies: string[];
};

export type StoryCardRequest =
  | { action: "start"; situationId: StoryCardId }
  | {
      action: "reply";
      sessionId: string;
      situationId: StoryCardId;
      message: string;
      messageCount: number;
    };
