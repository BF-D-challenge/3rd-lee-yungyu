import { describe, expect, it } from "vitest";
import type { FeedbackOwnerAccess } from "../../src/lib/feedback-access";
import {
  decodeDuelSlug,
  decodeSlug,
  encodeDuelSlug,
  encodeSlug,
  type CardPayload,
} from "../../src/lib/share";

const owner = (letter: string): FeedbackOwnerAccess => ({
  requestId: `feedback_${letter.repeat(43)}`,
  writeToken: letter.toUpperCase().repeat(43),
  readToken: `${letter}r`.repeat(22).slice(0, 43),
});

const card = (title: string, access: FeedbackOwnerAccess): CardPayload => ({
  seedId: "seed",
  seedLabel: "테스트",
  track: "like",
  painId: 1,
  formatId: "share-link",
  title,
  oneliner: "한 줄 설명",
  target: "테스터",
  situation: "배포 직전",
  psych: "안심하고 싶다",
  feedback: {
    requestId: access.requestId,
    writeToken: access.writeToken,
  },
});

describe("share capability separation", () => {
  it("puts only the card write capability in a card link", () => {
    const access = owner("a");
    const decoded = decodeSlug(encodeSlug(card("카드", access)));

    expect(decoded?.feedback).toEqual({
      requestId: access.requestId,
      writeToken: access.writeToken,
    });
    expect(decoded?.feedback).not.toHaveProperty("readToken");
  });

  it("keeps only the duel write capability and strips nested card capabilities", () => {
    const cardA = owner("a");
    const cardB = owner("b");
    const duel = owner("d");
    const decoded = decodeDuelSlug(encodeDuelSlug(
      card("A", cardA),
      card("B", cardB),
      {
        roundId: "round-secure",
        rootRoundId: "round-secure",
        feedback: {
          requestId: duel.requestId,
          writeToken: duel.writeToken,
        },
      },
    ));

    expect(decoded?.feedback).toEqual({
      requestId: duel.requestId,
      writeToken: duel.writeToken,
    });
    expect(decoded?.feedback).not.toHaveProperty("readToken");
    expect(decoded?.a.feedback).toBeUndefined();
    expect(decoded?.b.feedback).toBeUndefined();
  });
});
