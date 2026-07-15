import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  buildDailyPraiseSchedule,
  getPraiseCardsState,
  getPraiseQueue,
  getSenderIdentityState,
  getTodayPraiseCard,
  localDateKey,
  praiseRecordFromVote,
  sanitizePraiseRecords,
  startOfLocalDay,
  type PraiseCardRecord,
} from "../../src/lib/praise-cards";

const localTime = (
  year: number,
  monthIndex: number,
  day: number,
  hour = 12,
  minute = 0,
): number => new Date(year, monthIndex, day, hour, minute).getTime();

const makeRecord = (overrides: Partial<PraiseCardRecord> = {}): PraiseCardRecord => {
  const receivedAt = overrides.receivedAt ?? localTime(2026, 6, 12, 9);
  const availableAt = overrides.availableAt ?? startOfLocalDay(receivedAt);
  return {
    id: "praise-1",
    message: "작게 시작한 점이 정말 좋아요",
    senderRevealConsent: "forever-anonymous",
    receivedAt,
    availableAt,
    ...overrides,
  };
};

const supportComment = (payload: Record<string, unknown>): string =>
  `support:v1:${JSON.stringify(payload)}`;

const validSupportPayload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  v: 1,
  praise: "오늘 작은 화면부터 만든 선택이 좋아요",
  reveal: "forever-anonymous",
  ...overrides,
});

const withTimeZone = <T>(timeZone: string, run: () => T): T => {
  const previous = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

describe("local calendar helpers", () => {
  it("formats Date and timestamp inputs with the runtime local calendar date", () => {
    const date = new Date(2026, 0, 3, 23, 59, 59);

    expect(localDateKey(date)).toBe("2026-01-03");
    expect(localDateKey(date.getTime())).toBe("2026-01-03");
  });

  it("returns local midnight without mutating the input Date", () => {
    const input = new Date(2026, 6, 12, 18, 42, 13, 321);
    const original = input.getTime();
    const start = new Date(startOfLocalDay(input));

    expect(input.getTime()).toBe(original);
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 6, 12]);
    expect([start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds()]).toEqual([0, 0, 0, 0]);
  });

  it("moves by whole local calendar days across month and year boundaries", () => {
    const december31 = localTime(2026, 11, 31);

    expect(localDateKey(addLocalDays(december31, 1))).toBe("2027-01-01");
    expect(localDateKey(addLocalDays(december31, -31))).toBe("2026-11-30");
    expect(localDateKey(addLocalDays(december31, 1.9))).toBe("2027-01-01");
    expect(localDateKey(addLocalDays(december31, -1.9))).toBe("2026-12-30");
  });

  it("preserves calendar days across 23-hour and 25-hour DST transitions", () => {
    withTimeZone("America/New_York", () => {
      const springStart = startOfLocalDay(new Date(2026, 2, 8, 12));
      const springNext = addLocalDays(springStart, 1);
      const fallStart = startOfLocalDay(new Date(2026, 10, 1, 12));
      const fallNext = addLocalDays(fallStart, 1);

      expect(localDateKey(springStart)).toBe("2026-03-08");
      expect(localDateKey(springNext)).toBe("2026-03-09");
      expect(springNext - springStart).toBe(23 * 60 * 60 * 1_000);

      expect(localDateKey(fallStart)).toBe("2026-11-01");
      expect(localDateKey(fallNext)).toBe("2026-11-02");
      expect(fallNext - fallStart).toBe(25 * 60 * 60 * 1_000);
    });
  });
});

describe("record sanitation and daily scheduling", () => {
  it("drops malformed records instead of creating placeholder praise", () => {
    const valid = makeRecord();
    const malformed: unknown[] = [
      null,
      [],
      {},
      { ...valid, id: "  \u0000 " },
      { ...valid, message: " \u0007 " },
      { ...valid, senderRevealConsent: "sometimes" },
      { ...valid, senderName: 123 },
      { ...valid, receivedAt: Number.NaN },
      { ...valid, availableAt: Number.POSITIVE_INFINITY },
      { ...valid, availableAt: -1 },
      valid,
    ];

    expect(sanitizePraiseRecords(malformed)).toEqual([valid]);
  });

  it("cleans and bounds text and never retains a name for permanent anonymity", () => {
    const cleaned = sanitizePraiseRecords([
      makeRecord({
        id: `  id\u0000-${"x".repeat(200)}  `,
        message: `  좋아요\u0007${"m".repeat(300)}  `,
        senderName: "노출되면 안 됨",
      }),
    ])[0];

    expect(cleaned.id.startsWith("id-")).toBe(true);
    expect(cleaned.id).toHaveLength(160);
    expect(cleaned.message.startsWith("좋아요")).toBe(true);
    expect(cleaned.message).toHaveLength(280);
    expect(cleaned).not.toHaveProperty("senderName");
  });

  it("keeps the first input record when cleaned IDs collide", () => {
    const first = makeRecord({ id: " duplicate ", message: "첫 번째", receivedAt: localTime(2026, 6, 12) });
    const earlierSecond = makeRecord({ id: "duplicate", message: "더 일찍 받은 두 번째", receivedAt: localTime(2026, 6, 11) });

    const scheduled = buildDailyPraiseSchedule([first, earlierSecond]);

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]).toMatchObject({ id: "duplicate", message: "첫 번째" });
  });

  it("sorts by received time and assigns same-day praise to consecutive local dates", () => {
    const receivedDay = localTime(2026, 6, 12, 10);
    const records = [
      makeRecord({ id: "third", message: "세 번째", receivedAt: receivedDay + 2_000, availableAt: receivedDay }),
      makeRecord({ id: "first", message: "첫 번째", receivedAt: receivedDay, availableAt: receivedDay }),
      makeRecord({ id: "second", message: "두 번째", receivedAt: receivedDay + 1_000, availableAt: receivedDay }),
    ];

    const scheduled = buildDailyPraiseSchedule(records);

    expect(scheduled.map(({ id }) => id)).toEqual(["first", "second", "third"]);
    expect(scheduled.map(({ availableAt }) => localDateKey(availableAt))).toEqual([
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
    ]);
  });

  it("never schedules before receipt and preserves a requested future gap", () => {
    const first = makeRecord({
      id: "first",
      receivedAt: localTime(2026, 6, 12, 21),
      availableAt: localTime(2026, 6, 10),
    });
    const future = makeRecord({
      id: "future",
      receivedAt: localTime(2026, 6, 13, 8),
      availableAt: localTime(2026, 6, 20),
    });

    const scheduled = buildDailyPraiseSchedule([future, first]);

    expect(scheduled.map(({ availableAt }) => localDateKey(availableAt))).toEqual(["2026-07-12", "2026-07-20"]);
  });

  it("returns new scheduled records without mutating input records or order", () => {
    const first = makeRecord({ id: "later", receivedAt: localTime(2026, 6, 12, 11) });
    const second = makeRecord({ id: "earlier", receivedAt: localTime(2026, 6, 12, 10) });
    const input = [first, second];
    const snapshot = structuredClone(input);

    const scheduled = buildDailyPraiseSchedule(input);

    expect(input).toEqual(snapshot);
    expect(input.map(({ id }) => id)).toEqual(["later", "earlier"]);
    expect(scheduled[0]).not.toBe(second);
  });

  it("keeps consecutive assignments correct when the schedule crosses DST", () => {
    withTimeZone("America/New_York", () => {
      const receivedAt = new Date(2026, 2, 8, 10).getTime();
      const scheduled = buildDailyPraiseSchedule([
        makeRecord({ id: "one", receivedAt, availableAt: receivedAt }),
        makeRecord({ id: "two", receivedAt: receivedAt + 1_000, availableAt: receivedAt }),
        makeRecord({ id: "three", receivedAt: receivedAt + 2_000, availableAt: receivedAt }),
      ]);

      expect(scheduled.map(({ availableAt }) => localDateKey(availableAt))).toEqual([
        "2026-03-08",
        "2026-03-09",
        "2026-03-10",
      ]);
      expect(scheduled[1].availableAt - scheduled[0].availableAt).toBe(23 * 60 * 60 * 1_000);
    });
  });
});

describe("today card, queue, and aggregate state", () => {
  it("keeps the latest unlocked card current until the next assigned card unlocks", () => {
    const first = makeRecord({ id: "first", receivedAt: localTime(2026, 6, 12), availableAt: localTime(2026, 6, 12) });
    const second = makeRecord({ id: "second", receivedAt: localTime(2026, 6, 14), availableAt: localTime(2026, 6, 14) });

    expect(getTodayPraiseCard([first, second], localTime(2026, 6, 13, 23))?.id).toBe("first");
    expect(getTodayPraiseCard([first, second], localTime(2026, 6, 14))?.id).toBe("second");
    expect(getTodayPraiseCard([first, second], localTime(2026, 6, 25))?.id).toBe("second");
  });

  it("returns no current card when every valid card is still locked", () => {
    const future = makeRecord({ receivedAt: localTime(2026, 6, 20), availableAt: localTime(2026, 6, 20) });

    expect(getTodayPraiseCard([future], localTime(2026, 6, 19, 23, 59))).toBeNull();
  });

  it("returns only future cards in queue order without praise or sender data", () => {
    const records = [0, 1, 2].map((offset) => makeRecord({
      id: `praise-${offset + 1}`,
      message: `비밀 칭찬 ${offset + 1}`,
      senderRevealConsent: "after-30d",
      senderName: `보낸 사람 ${offset + 1}`,
      receivedAt: localTime(2026, 6, 12, 10, offset),
      availableAt: localTime(2026, 6, 12),
    }));

    const queue = getPraiseQueue(records, localTime(2026, 6, 12, 23));

    expect(queue).toEqual([
      { id: "praise-2", availableAt: addLocalDays(records[0].availableAt, 1), queuePosition: 1 },
      { id: "praise-3", availableAt: addLocalDays(records[0].availableAt, 2), queuePosition: 2 },
    ]);
    expect(JSON.stringify(queue)).not.toContain("비밀 칭찬");
    expect(JSON.stringify(queue)).not.toContain("보낸 사람");
  });

  it("builds an empty state without placeholder cards", () => {
    const state = getPraiseCardsState([null, { broken: true }], localTime(2026, 6, 12));

    expect(state).toMatchObject({
      kind: "empty",
      localDateKey: "2026-07-12",
      today: null,
      next: null,
      queue: [],
      historyCount: 0,
      totalCount: 0,
    });
  });

  it("builds a waiting state when the first real praise is assigned in the future", () => {
    const future = makeRecord({ id: "future", receivedAt: localTime(2026, 6, 20), availableAt: localTime(2026, 6, 20) });
    const state = getPraiseCardsState([future], localTime(2026, 6, 19));

    expect(state.kind).toBe("waiting");
    expect(state.today).toBeNull();
    expect(state.next).toEqual({ id: "future", availableAt: startOfLocalDay(future.availableAt), queuePosition: 1 });
  });

  it("advances one card per local day and exposes only the actual next card as locked", () => {
    const receivedAt = localTime(2026, 6, 12, 10);
    const records = ["first", "second", "third"].map((id, index) => makeRecord({
      id,
      message: `${id} secret`,
      receivedAt: receivedAt + index,
      availableAt: receivedAt,
    }));

    const dayOne = getPraiseCardsState(records, localTime(2026, 6, 12, 23));
    const dayTwo = getPraiseCardsState(records, localTime(2026, 6, 13, 23));
    const dayThree = getPraiseCardsState(records, localTime(2026, 6, 14, 23));

    expect(dayOne.today?.id).toBe("first");
    expect(dayOne.next?.id).toBe("second");
    expect(dayOne.queue).toHaveLength(2);
    expect(dayTwo.today?.id).toBe("second");
    expect(dayTwo.next?.id).toBe("third");
    expect(dayTwo.queue).toHaveLength(1);
    expect(dayThree.today?.id).toBe("third");
    expect(dayThree.next).toBeNull();
    expect(dayThree.queue).toEqual([]);
  });

  it("retains the last card long enough to reveal an opted-in name for free after 30 local days", () => {
    const receivedAt = localTime(2026, 0, 10, 22, 30);
    const record = makeRecord({
      id: "named",
      senderRevealConsent: "after-30d",
      senderName: "  민정  ",
      receivedAt,
      availableAt: receivedAt,
    });
    const revealAt = addLocalDays(receivedAt, 30);
    const before = getPraiseCardsState([record], revealAt - 1);
    const after = getPraiseCardsState([record], revealAt);

    expect(before.today?.id).toBe("named");
    expect(before.today?.sender).toMatchObject({ status: "locked", displayName: null, revealAt });
    expect(after.kind).toBe("today");
    expect(after.today?.sender).toEqual({ status: "revealed", displayName: "민정", revealAt });
  });
});

describe("sender identity rules", () => {
  it("shows an explicitly named sender immediately without a paid reveal", () => {
    const record = makeRecord({
      senderRevealConsent: "named",
      senderName: "민정",
    });

    expect(getSenderIdentityState(record, record.receivedAt)).toEqual({
      status: "revealed",
      displayName: "민정",
      revealAt: record.receivedAt,
    });
  });

  it("forbids sender lookup for permanent anonymity even if a name is present in raw input", () => {
    const record = makeRecord({ senderName: "절대 노출 금지" });

    expect(getSenderIdentityState(record, addLocalDays(record.receivedAt, 100))).toEqual({
      status: "forever-anonymous",
      displayName: null,
      revealAt: null,
    });
  });

  it("does not offer sender lookup when an opted-in card has no usable name", () => {
    const record = makeRecord({ senderRevealConsent: "after-30d", senderName: "  " });

    expect(getSenderIdentityState(record, record.receivedAt)).toEqual({
      status: "name-not-provided",
      displayName: null,
      revealAt: null,
    });
  });

  it("keeps the name absent before 30 days and makes it free exactly at the boundary", () => {
    const record = makeRecord({ senderRevealConsent: "after-30d", senderName: "서연" });
    const revealAt = addLocalDays(record.receivedAt, 30);

    expect(getSenderIdentityState(record, revealAt - 1)).toEqual({
      status: "locked",
      displayName: null,
      revealAt,
    });
    expect(getSenderIdentityState(record, revealAt)).toEqual({
      status: "revealed",
      displayName: "서연",
      revealAt,
    });
  });

  it("preserves the 30-local-day reveal boundary across DST", () => {
    withTimeZone("America/New_York", () => {
      const receivedAt = new Date(2026, 1, 7, 23, 59).getTime();
      const record = makeRecord({ senderRevealConsent: "after-30d", senderName: "Alex", receivedAt, availableAt: receivedAt });
      const revealAt = addLocalDays(receivedAt, 30);

      expect(localDateKey(revealAt)).toBe("2026-03-09");
      expect(getSenderIdentityState(record, revealAt - 1).status).toBe("locked");
      expect(getSenderIdentityState(record, revealAt)).toEqual({
        status: "revealed",
        displayName: "Alex",
        revealAt,
      });
    });
  });
});

describe("praiseRecordFromVote", () => {
  it("parses immediate name consent and keeps the related idea title", () => {
    const at = localTime(2026, 6, 12, 17, 45);
    const record = praiseRecordFromVote(
      {
        at,
        comment: supportComment(validSupportPayload({
          praise: "대상이 명확해서 이해하기 쉬워요",
          reveal: "named",
          senderName: "  지수  ",
          ideaTitle: "  결정만 남기는 음성 메모  ",
        })),
      },
      { id: "vote-id" },
    );

    expect(record).toMatchObject({
      senderRevealConsent: "named",
      senderName: "지수",
      ideaTitle: "결정만 남기는 음성 메모",
    });
  });

  it("uses the request title when a legacy payload has no idea title", () => {
    const record = praiseRecordFromVote(
      {
        at: localTime(2026, 6, 12),
        comment: supportComment(validSupportPayload()),
      },
      { id: "vote-id", ideaTitle: "공유 요청의 아이디어" },
    );

    expect(record?.ideaTitle).toBe("공유 요청의 아이디어");
  });

  it("parses and cleans a valid opted-in support payload", () => {
    const at = localTime(2026, 6, 12, 17, 45);
    const requestedDay = new Date(2026, 6, 15, 20);
    const record = praiseRecordFromVote(
      {
        type: "cheer",
        at,
        comment: supportComment(validSupportPayload({
          praise: "  구체적이라 좋아요\u0007  ",
          reveal: "after-30d",
          senderName: "  지수\u0000  ",
        })),
      },
      { id: "  vote-id\u0000  ", availableAt: requestedDay },
    );

    expect(record).toEqual({
      id: "vote-id",
      message: "구체적이라 좋아요",
      senderRevealConsent: "after-30d",
      senderName: "지수",
      receivedAt: at,
      availableAt: startOfLocalDay(requestedDay),
    });
  });

  it("defaults availability to the received local date and strips names for permanent anonymity", () => {
    const at = localTime(2026, 6, 12, 23, 59);
    const record = praiseRecordFromVote(
      {
        at,
        comment: supportComment(validSupportPayload({ senderName: "노출 금지" })),
      },
      { id: "vote-id" },
    );

    expect(record).toEqual({
      id: "vote-id",
      message: "오늘 작은 화면부터 만든 선택이 좋아요",
      senderRevealConsent: "forever-anonymous",
      receivedAt: at,
      availableAt: startOfLocalDay(at),
    });
  });

  it.each([
    ["null vote", null],
    ["array vote", []],
    ["ordinary comment", { at: 1, comment: "좋아요" }],
    ["damaged JSON", { at: 1, comment: "support:v1:{broken" }],
    ["null payload", { at: 1, comment: "support:v1:null" }],
    ["wrong version", { at: 1, comment: supportComment(validSupportPayload({ v: 2 })) }],
    ["non-string praise", { at: 1, comment: supportComment(validSupportPayload({ praise: 123 })) }],
    ["empty praise", { at: 1, comment: supportComment(validSupportPayload({ praise: "   \u0007 " })) }],
    ["invalid reveal", { at: 1, comment: supportComment(validSupportPayload({ reveal: "sometimes" })) }],
    ["non-string sender name", { at: 1, comment: supportComment(validSupportPayload({ senderName: 123 })) }],
    ["negative received time", { at: -1, comment: supportComment(validSupportPayload()) }],
    ["NaN received time", { at: Number.NaN, comment: supportComment(validSupportPayload()) }],
    ["infinite received time", { at: Number.POSITIVE_INFINITY, comment: supportComment(validSupportPayload()) }],
  ])("rejects %s", (_label, vote) => {
    expect(praiseRecordFromVote(vote, { id: "vote-id" })).toBeNull();
  });

  it("rejects an empty stable ID and invalid requested availability", () => {
    const vote = { at: localTime(2026, 6, 12), comment: supportComment(validSupportPayload()) };

    expect(praiseRecordFromVote(vote, { id: " \u0000 " })).toBeNull();
    expect(praiseRecordFromVote(vote, { id: "valid", availableAt: new Date(Number.NaN) })).toBeNull();
    expect(praiseRecordFromVote(vote, { id: "valid", availableAt: -1 })).toBeNull();
  });

  it("bounds message, sender name, and stable ID lengths", () => {
    const record = praiseRecordFromVote(
      {
        at: localTime(2026, 6, 12),
        comment: supportComment(validSupportPayload({
          praise: "p".repeat(400),
          reveal: "after-30d",
          senderName: "n".repeat(100),
        })),
      },
      { id: "i".repeat(200) },
    );

    expect(record?.id).toHaveLength(160);
    expect(record?.message).toHaveLength(280);
    expect(record?.senderName).toHaveLength(40);
  });
});
