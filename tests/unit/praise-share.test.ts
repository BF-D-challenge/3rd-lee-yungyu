import { describe, expect, it } from "vitest";
import type { IdeaLabSharePayload } from "../../src/components/organisms/idea-lab";
import {
  decodePraiseRequest,
  encodePraiseRequest,
  praiseRequestFromIdea,
  type PraiseRequestCard,
} from "../../src/lib/praise-share";

const payload: IdeaLabSharePayload = {
  title: "결정만 남기는 음성 메모",
  summary: "음성 메모 × 작은 팀 기획자 × 회의 직후 × 결정 세 줄",
  prompt: "fixture prompt",
  platform: "web",
  selection: {
    source: {
      id: "source",
      value: "음성 메모를 글로 정리하는 서비스",
      detail: "음성을 텍스트로 정리합니다.",
      sourceName: "Voice Note",
      platform: "web",
      evidence: "검증된 원본",
      preservedFlow: "녹음 → 정리 → 결과",
    },
    payer: {
      id: "payer",
      value: "작은 팀 기획자",
      detail: "회의 결정을 정리합니다.",
    },
    moment: {
      id: "moment",
      value: "회의가 끝난 직후",
      detail: "결정을 팀에 전달해야 합니다.",
    },
    twist: {
      id: "twist",
      value: "전체 받아쓰기를 숨기기",
      detail: "결정만 보여줍니다.",
      kind: "remove",
      resultTitle: "결정 세 줄",
      platform: "web",
      smallestBuild: "음성을 올리면 결정 세 줄을 보여주는 화면",
    },
  },
};

describe("praise request sharing", () => {
  it("carries all four idea axes into a new praise request", () => {
    expect(praiseRequestFromIdea(payload)).toMatchObject({
      title: payload.title,
      summary: payload.summary,
      source: `${payload.selection.source.sourceName} — ${payload.selection.source.value}`,
      payer: payload.selection.payer.value,
      moment: payload.selection.moment.value,
      twist: payload.selection.twist.detail,
      flow: `${payload.selection.source.preservedFlow} → ${payload.selection.twist.resultTitle}`,
    });
  });

  it("round-trips a new request and still accepts a legacy request without optional axes", () => {
    const current = praiseRequestFromIdea(payload);
    expect(decodePraiseRequest(encodePraiseRequest(current))).toEqual(current);

    const legacy: PraiseRequestCard = {
      v: 1,
      id: "legacy",
      title: "예전 아이디어",
      summary: "예전 한 줄 요약",
      smallestBuild: "작은 화면",
      source: "원본",
      twist: "변화",
      createdAt: 1,
    };
    expect(decodePraiseRequest(encodePraiseRequest(legacy))).toEqual(legacy);
  });
});
