import { describe, expect, it } from "vitest";
import {
  parseOnebiteExecutionHistory,
  parseOnebiteSavedCommit,
  upsertOnebiteExecutionRecord,
  type OnebiteExecutionRecord,
} from "@/lib/onebite-revisit";

const doneRecord: OnebiteExecutionRecord = {
  id: "2026-07-28T10:00:00.000Z",
  actionCode: "add_vegetable",
  actionLine: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
  status: "done",
  recordedAt: "2026-07-29T10:00:00.000Z",
  nextMealSubmittedAt: "2026-07-29T10:00:00.000Z",
};

describe("한입코치 재방문 저장 계약", () => {
  it("유효한 저장 행동만 복원한다", () => {
    expect(parseOnebiteSavedCommit(JSON.stringify({
      actionCode: "add_vegetable",
      actionLine: "채소 반찬을 먼저 담아보세요.",
      savedAt: "2026-07-28T10:00:00.000Z",
    }))).toEqual({
      actionCode: "add_vegetable",
      actionLine: "채소 반찬을 먼저 담아보세요.",
      savedAt: "2026-07-28T10:00:00.000Z",
    });
    expect(parseOnebiteSavedCommit("{broken")).toBeNull();
    expect(parseOnebiteSavedCommit(JSON.stringify({ actionCode: "x" }))).toBeNull();
  });

  it("같은 저장 행동은 중복 추가하지 않고 실행 결과를 갱신한다", () => {
    const first = upsertOnebiteExecutionRecord([], doneRecord);
    expect(first.inserted).toBe(true);

    const updated = upsertOnebiteExecutionRecord(first.history, {
      ...doneRecord,
      status: "not_done",
      recordedAt: "2026-07-29T11:00:00.000Z",
    });
    expect(updated.inserted).toBe(false);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0]).toMatchObject({
      status: "not_done",
      recordedAt: "2026-07-29T11:00:00.000Z",
    });
  });

  it("깨진 기록은 버리고 최신 실행 기록부터 복원한다", () => {
    const earlier = {
      ...doneRecord,
      id: "earlier",
      recordedAt: "2026-07-29T09:00:00.000Z",
    };
    const parsed = parseOnebiteExecutionHistory(JSON.stringify([
      earlier,
      { id: "broken" },
      doneRecord,
    ]));
    expect(parsed.map((record) => record.id)).toEqual([
      doneRecord.id,
      "earlier",
    ]);
  });
});
