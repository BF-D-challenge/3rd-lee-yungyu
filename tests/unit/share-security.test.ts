import { describe, expect, it } from "vitest";
import { encodeBinaryBase64Url } from "../../src/lib/base64-url";
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
const rawSlug = (value: unknown): string =>
  encodeBinaryBase64Url(encodeURIComponent(JSON.stringify(value)));

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

  it("rejects oversized or structurally invalid public payloads", () => {
    const access = owner("a");
    const valid = card("카드", access);

    expect(decodeSlug("a".repeat(16_385))).toBeNull();
    expect(decodeSlug(rawSlug({ ...valid, track: "admin" }))).toBeNull();
    expect(decodeSlug(rawSlug({ ...valid, target: { injected: true } }))).toBeNull();
    expect(decodeDuelSlug(rawSlug({
      v: 2,
      a: valid,
      b: valid,
      roundId: "",
      rootRoundId: "root",
    }))).toBeNull();
  });

  it("removes capabilities injected into nested duel cards", () => {
    const access = owner("a");
    const decoded = decodeDuelSlug(rawSlug({
      v: 1,
      a: card("A", access),
      b: card("B", access),
    }));

    expect(decoded?.a.feedback).toBeUndefined();
    expect(decoded?.b.feedback).toBeUndefined();
  });
});
