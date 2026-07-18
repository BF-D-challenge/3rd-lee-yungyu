import { describe, expect, it, vi } from "vitest";
import {
  createFeedbackAccess,
  isFeedbackOwnerAccess,
  isFeedbackWriteAccess,
  writeAccessFrom,
} from "../../src/lib/feedback-access";

describe("feedback access tokens", () => {
  it("creates separate high-entropy write and owner-read capabilities", () => {
    let seed = 0;
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(seed);
        seed += 1;
        return bytes;
      },
    });

    const access = createFeedbackAccess();

    expect(access.requestId).toMatch(/^feedback_[A-Za-z0-9_-]{40,}$/);
    expect(access.writeToken).toHaveLength(43);
    expect(access.readToken).toHaveLength(43);
    expect(access.writeToken).not.toBe(access.readToken);
    expect(isFeedbackOwnerAccess(access)).toBe(true);
    expect(writeAccessFrom(access)).toEqual({
      requestId: access.requestId,
      writeToken: access.writeToken,
    });
  });

  it("rejects short or malformed capabilities", () => {
    expect(isFeedbackWriteAccess({ requestId: "feedback_short", writeToken: "tiny" })).toBe(false);
    expect(isFeedbackOwnerAccess({
      requestId: `feedback_${"a".repeat(43)}`,
      writeToken: "b".repeat(43),
      readToken: "b".repeat(43),
    })).toBe(false);
  });
});
