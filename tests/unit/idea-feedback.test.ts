import { describe, expect, it } from "vitest";
import {
  IDEA_FEEDBACK_MESSAGES,
  nextIdeaFeedbackActions,
  summarizeIdeaFeedback,
} from "../../src/lib/idea-feedback";

describe("idea feedback summary", () => {
  it("counts the three fixed reactions and preserves custom feedback as its own group", () => {
    expect(summarizeIdeaFeedback([
      IDEA_FEEDBACK_MESSAGES.understood,
      IDEA_FEEDBACK_MESSAGES.understood,
      IDEA_FEEDBACK_MESSAGES.wantToUse,
      IDEA_FEEDBACK_MESSAGES.needsDifference,
      "가격이 얼마인지 궁금해요",
    ])).toEqual({
      total: 5,
      understood: 2,
      wantToUse: 1,
      needsDifference: 1,
      custom: 1,
    });
  });

  it("returns an empty summary without inventing feedback", () => {
    expect(summarizeIdeaFeedback([])).toEqual({
      total: 0,
      understood: 0,
      wantToUse: 0,
      needsDifference: 0,
      custom: 0,
    });
  });

  it("prioritizes a real difference signal, then real written opinions", () => {
    expect(nextIdeaFeedbackActions({ total: 3, understood: 1, wantToUse: 0, needsDifference: 1, custom: 1 })).toEqual([
      { kind: "edit-difference", label: "차별점 문장 고치기" },
      { kind: "read-custom", label: "친구가 직접 쓴 의견 1개 읽기" },
    ]);
  });

  it("offers another invite only for positive fixed reactions", () => {
    expect(nextIdeaFeedbackActions({ total: 2, understood: 1, wantToUse: 1, needsDifference: 0, custom: 0 })).toEqual([
      { kind: "reinvite", label: "친구 한 명 더 초대하기" },
    ]);
  });
});
