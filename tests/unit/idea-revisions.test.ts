import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadIdeaRevisionHistory,
  revisionCardFrom,
  saveIdeaRevision,
} from "../../src/lib/idea-revisions";
import type { PraiseRequestCard } from "../../src/lib/praise-share";

const card: PraiseRequestCard = {
  v: 1,
  id: "origin-request",
  title: "결정만 남기는 음성 메모",
  summary: "음성을 올리면 결정 세 줄을 보여주는 웹 화면",
  smallestBuild: "음성을 올리면 결정 세 줄을 보여주는 웹 화면",
  source: "Voice Note — 음성을 글로 정리하는 서비스",
  payer: "작은 팀 기획자",
  moment: "회의가 끝난 직후",
  twist: "전체 받아쓰기를 숨기기",
  flow: "녹음 → 정리 → 결과",
  createdAt: 100,
};

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
    removeItem: (key: string) => { memory.delete(key); },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
});

describe("idea revisions", () => {
  it("saves a separate revision without overwriting the original card", () => {
    const saved = saveIdeaRevision(card, {
      uvp: "회의 음성 하나를 올리면 결정과 담당자만 바로 공유하는 웹 화면",
      difference: "결정과 담당자만 먼저 보여주기",
    }, 200);

    expect(saved.history.originCard).toEqual(card);
    expect(saved.revision.version).toBe(1);
    expect(saved.card).toMatchObject({
      id: saved.revision.requestId,
      originRequestId: card.id,
      revisionId: saved.revision.id,
      version: 1,
      summary: saved.revision.uvp,
      twist: saved.revision.difference,
    });
    expect(loadIdeaRevisionHistory(card.id)).toEqual(saved.history);
    expect(card.summary).toBe("음성을 올리면 결정 세 줄을 보여주는 웹 화면");
  });

  it("increments versions and keeps each version's share link and reaction identity separate", () => {
    const first = saveIdeaRevision(card, { uvp: "첫 번째 수정 UVP", difference: "첫 번째 차별점" }, 200);
    const second = saveIdeaRevision(first.card, { uvp: "두 번째 수정 UVP", difference: "두 번째 차별점" }, 300);

    expect(second.revision.version).toBe(2);
    expect(second.revision.parentRequestId).toBe(first.card.id);
    expect(second.revision.slug).not.toBe(first.revision.slug);
    expect(revisionCardFrom(second.history.originCard, first.revision).summary).toBe("첫 번째 수정 UVP");
    expect(revisionCardFrom(second.history.originCard, second.revision).summary).toBe("두 번째 수정 UVP");
    expect(second.history.revisions).toHaveLength(2);
  });
});
