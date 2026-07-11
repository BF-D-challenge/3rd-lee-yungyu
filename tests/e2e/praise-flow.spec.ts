import { expect, test, type Page } from "@playwright/test";
import {
  FIXED_NOW,
  installShareMock,
  makePraiseRequest,
  openPraiseTab,
  praiseVote,
  seedPraiseStorage,
  shareCalls,
  trackedEvents,
  type TestVote,
} from "./helpers";

const PRAISE_OPTIONS = [
  "시작부터 구체적이라 진짜 만들 수 있을 것 같아",
  "이건 완성되면 나도 써보고 싶어",
  "한 가지만 바꾼 게 오히려 더 좋아 보여",
  "오늘 작은 화면부터 만드는 선택을 응원해",
] as const;

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

async function storedVotes(page: Page, slug: string): Promise<TestVote[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]"), `oneul:votes:${slug}`);
}

async function bodyAriaSnapshot(page: Page): Promise<string> {
  return page.locator("body").ariaSnapshot();
}

async function expectNoPrivateText(page: Page, ...secrets: string[]) {
  const markup = await page.locator("body").innerHTML();
  const aria = await bodyAriaSnapshot(page);
  for (const secret of secrets) {
    expect(markup).not.toContain(secret);
    expect(aria).not.toContain(secret);
  }
}

async function expectTrackedFeature(page: Page, feature: "next_praise_preview" | "sender_identity") {
  await expect.poll(async () => trackedEvents(page)).toEqual(expect.arrayContaining([
    expect.objectContaining({
      event: "pay_demand_report_click",
      product: "demand_report",
      price: 990,
      feature,
    }),
  ]));
}

test.describe("익명 칭찬 통합 시나리오", () => {
  test.use({ timezoneId: "Asia/Seoul" });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: FIXED_NOW });
  });

  test("Scenario 7. 영구 익명 칭찬은 한 번만 전송되고 공개 설정이 계측된다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-7" });
    const selectedPraise = PRAISE_OPTIONS[1];

    await page.goto(`/praise/${request.slug}`);
    await expect(page.getByRole("heading", { name: request.card.title })).toBeVisible();
    await page.getByRole("button", { name: "익명 응원 보내기" }).click();
    await page.getByRole("button", { name: selectedPraise }).click();
    await page.getByRole("radio", { name: "기본 · 계속 익명으로 보낼게요" }).check();
    await page.getByRole("button", { name: "이 칭찬 카드 보내기" }).click();

    await expect(page.getByRole("heading", { name: "오늘의 칭찬을 보냈어요." })).toBeVisible();
    await expect(page.getByText(/칭찬 카드가\s*덱에 들어갔어요/)).toBeVisible();

    const votes = await storedVotes(page, request.slug);
    expect(votes).toHaveLength(1);
    const note = JSON.parse(votes[0].comment.replace(/^support:v1:/, ""));
    expect(note).toEqual({
      v: 1,
      praise: selectedPraise,
      reveal: "forever-anonymous",
    });
    expect(await trackedEvents(page)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "praise_card_sent",
        request_id: request.card.id,
        reveal: "forever-anonymous",
      }),
    ]));

    await page.reload();
    await expect(page.getByRole("heading", { name: "오늘의 칭찬을 보냈어요." })).toBeVisible();
    await expect(page.getByRole("button", { name: "이 칭찬 카드 보내기" })).toHaveCount(0);
    expect(await storedVotes(page, request.slug)).toHaveLength(1);
  });

  test("Scenario 8. 30일 공개 동의 이름은 즉시 숨고 30일 뒤 마지막 카드에서 무료 공개된다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-8" });
    const selectedPraise = PRAISE_OPTIONS[2];
    const senderName = "삼십일뒤공개이름";

    await page.goto(`/praise/${request.slug}`);
    await page.getByRole("button", { name: "익명 응원 보내기" }).click();
    await page.getByRole("button", { name: selectedPraise }).click();
    await page.getByRole("radio", { name: "선택 · 30일 뒤 이름 공개에 동의해요" }).check();
    await page.getByPlaceholder("공개할 이름(선택)").fill(senderName);
    await page.getByRole("button", { name: "이 칭찬 카드 보내기" }).click();
    await expect(page.getByRole("heading", { name: "오늘의 칭찬을 보냈어요." })).toBeVisible();

    await page.evaluate((saved) => {
      localStorage.setItem("oneul:latest-praise-request:v1", JSON.stringify(saved));
    }, request.saved);
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByRole("button", { name: "오늘의 칭찬 카드 뒤집기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "990원에 지금 확인" })).toBeVisible();
    await expectNoPrivateText(page, senderName);

    await page.clock.setFixedTime(addDays(FIXED_NOW, 30));
    await page.getByRole("button", { name: "아이디어 뽑기" }).click();
    await openPraiseTab(page);
    // praise 탭 진입 effect가 새 Date.now()로 record를 다시 계산할 때까지 기다린다.
    await page.waitForTimeout(250);

    // 30일이 지나도 마지막으로 무료 해제된 카드를 보존하고, 동의한 이름을 결제 없이 보여줘야 한다.
    await page.getByRole("button", { name: "오늘의 칭찬 카드 뒤집기" }).click();
    await expect(page.getByText(selectedPraise, { exact: true })).toBeVisible();
    await expect(page.getByText(senderName, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "990원에 지금 확인" })).toHaveCount(0);
  });

  test("Scenario 9. 칭찬이 없고 공유할 아이디어도 없으면 아이디어 뽑기로 돌아간다", async ({ page }) => {
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByText("아직 도착한 칭찬이 없어요", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "아이디어 먼저 뽑기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "990원에 지금 확인" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다음 칭찬 미리 보기" })).toHaveCount(0);

    await page.getByRole("button", { name: "아이디어 먼저 뽑기" }).click();
    await expect(page.locator("section[aria-label='검증된 원본에서 시작하는 네 장 아이디어 제작기']")).toBeVisible();
  });

  test("Scenario 9. 칭찬이 없고 공유할 아이디어가 있으면 기존 칭찬 요청 링크를 다시 공유한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-9-reshare" });
    await installShareMock(page, "native");
    await seedPraiseStorage(page, { request });
    await page.goto("/");
    await openPraiseTab(page);

    await page.getByRole("button", { name: "링크 다시 공유하기" }).click();
    await expect.poll(async () => shareCalls(page)).toHaveLength(1);
    expect((await shareCalls(page))[0].url).toBe(`${new URL(page.url()).origin}/praise/${request.slug}`);
    expect(await trackedEvents(page)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "praise_request_reshare_completed",
        request_id: request.card.id,
        share_method: "native",
      }),
    ]));
  });

  test("Scenario 10. 오늘 카드는 뒷면에서 한 번 뒤집히고 이름 없이 본문과 도착일을 보여준다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-10" });
    const message = "작은 범위로 바로 시작한 선택이 정말 좋아 보여요.";
    const senderName = "즉시노출금지이름";
    await seedPraiseStorage(page, {
      request,
      votes: [praiseVote({ praise: message, reveal: "after-30d", senderName })],
    });
    await page.goto("/");
    await openPraiseTab(page);

    const card = page.getByRole("button", { name: "오늘의 칭찬 카드 뒤집기" });
    await expect(card).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("section[data-state='filled']")).toHaveAttribute("aria-label", /뒷면이 보입니다/);
    await expectNoPrivateText(page, senderName);

    await card.click();
    await expect(page.getByRole("button", { name: "칭찬 카드 뒷면 보기" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText("익명의 칭찬", { exact: true })).toBeVisible();
    await expect(page.getByText("도착일 · 7월 12일", { exact: true })).toBeVisible();
    await expectNoPrivateText(page, senderName);
  });

  test("Scenario 11. 같은 날 온 세 칭찬은 하루 한 장씩 배정되고 잠긴 내용은 누출되지 않는다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-11" });
    const first = { message: "첫째 날에만 보일 칭찬", name: "첫째보낸이" };
    const second = { message: "둘째 날에만 보일 칭찬", name: "둘째보낸이" };
    const third = { message: "셋째 날에만 보일 칭찬", name: "셋째보낸이" };
    await seedPraiseStorage(page, {
      request,
      votes: [
        praiseVote({ praise: first.message, reveal: "after-30d", senderName: first.name, at: FIXED_NOW.getTime() }),
        praiseVote({ praise: second.message, reveal: "after-30d", senderName: second.name, at: FIXED_NOW.getTime() + 1 }),
        praiseVote({ praise: third.message, reveal: "after-30d", senderName: third.name, at: FIXED_NOW.getTime() + 2 }),
      ],
    });
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByText(first.message, { exact: true })).toHaveCount(1);
    await expect(page.getByText("잠김", { exact: true })).toBeVisible();
    await expect(page.getByText("다음 칭찬은 7월 13일에 열려요", { exact: true })).toHaveCount(1);
    await expectNoPrivateText(page, second.message, second.name, third.message, third.name);

    await page.clock.setFixedTime(addDays(FIXED_NOW, 1));
    await page.getByRole("button", { name: "아이디어 뽑기" }).click();
    await openPraiseTab(page);

    await expect(page.getByText(second.message, { exact: true })).toHaveCount(1);
    await expect(page.getByText(first.message, { exact: true })).toHaveCount(0);
    await expect(page.getByText("다음 칭찬은 7월 14일에 열려요", { exact: true })).toHaveCount(1);
    await expectNoPrivateText(page, first.name, third.message, third.name);
  });

  test("Scenario 12. 실제 다음 카드가 있을 때만 미리 보기 가짜 문을 열고 feature를 기록한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-12-next" });
    const nextMessage = "잠긴 다음 카드의 비밀 칭찬";
    const nextName = "잠긴다음보낸이";
    await seedPraiseStorage(page, {
      request,
      votes: [
        praiseVote({ praise: "오늘 공개된 칭찬" }),
        praiseVote({ praise: nextMessage, reveal: "after-30d", senderName: nextName, at: FIXED_NOW.getTime() + 1 }),
      ],
    });
    await page.goto("/");
    await openPraiseTab(page);
    await expectNoPrivateText(page, nextMessage, nextName);

    await page.getByRole("button", { name: "다음 칭찬 미리 보기" }).click();
    await expect(page.getByRole("dialog", { name: "다음 칭찬 카드 미리 보기" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "다음 칭찬 카드 미리 보기, 준비 중이에요" })).toBeVisible();
    await expectTrackedFeature(page, "next_praise_preview");
    await expectNoPrivateText(page, nextMessage, nextName);
  });

  test("Scenario 12. 실제 다음 카드가 없으면 미리 보기 버튼과 잠금 장식을 만들지 않는다", async ({ page }) => {
    await seedPraiseStorage(page, { votes: [praiseVote({ praise: "유일한 오늘 칭찬" })] });
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByRole("button", { name: "다음 칭찬 미리 보기" })).toHaveCount(0);
    await expect(page.getByText("잠김", { exact: true })).toHaveCount(0);
  });

  test("Scenario 13. 공개 동의한 잠긴 이름은 가짜 문에서도 노출하지 않고 sender_identity를 기록한다", async ({ page }) => {
    const senderName = "결제전노출금지이름";
    await seedPraiseStorage(page, {
      request: makePraiseRequest({ id: "request-scenario-13-sender" }),
      votes: [praiseVote({ reveal: "after-30d", senderName })],
    });
    await page.goto("/");
    await openPraiseTab(page);
    await expectNoPrivateText(page, senderName);

    await page.getByRole("button", { name: "990원에 지금 확인" }).click();
    await expect(page.getByRole("dialog", { name: "이 칭찬을 보낸 사람 확인" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "이 칭찬을 보낸 사람 확인, 준비 중이에요" })).toBeVisible();
    await expectTrackedFeature(page, "sender_identity");
    await expectNoPrivateText(page, senderName);
  });

  test("Scenario 13. 영구 익명 카드에는 보낸 사람 결제 CTA가 없다", async ({ page }) => {
    await seedPraiseStorage(page, {
      request: makePraiseRequest({ id: "request-scenario-13-anonymous" }),
      votes: [praiseVote({ reveal: "forever-anonymous", senderName: "저장되면안되는이름" })],
    });
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByRole("button", { name: "990원에 지금 확인" })).toHaveCount(0);
    await expectNoPrivateText(page, "저장되면안되는이름");
  });

  test("Scenario 13. 공개 동의했지만 이름을 쓰지 않은 카드에는 보낸 사람 결제 CTA가 없다", async ({ page }) => {
    await seedPraiseStorage(page, {
      request: makePraiseRequest({ id: "request-scenario-13-no-name" }),
      votes: [praiseVote({ reveal: "after-30d" })],
    });
    await page.goto("/");
    await openPraiseTab(page);

    await expect(page.getByRole("button", { name: "990원에 지금 확인" })).toHaveCount(0);
  });

  test("Scenario 14. 칭찬 주요 CTA와 전체 문서는 Primary 다크 토큰을 유지한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-scenario-14" });
    await page.goto(`/praise/${request.slug}`);
    await page.getByRole("button", { name: "익명 응원 보내기" }).click();

    const sendButton = page.getByRole("button", { name: "이 칭찬 카드 보내기" });
    const colors = await sendButton.evaluate((button) => {
      const root = getComputedStyle(document.documentElement);
      const style = getComputedStyle(button);
      return {
        primary: root.getPropertyValue("--primary").trim(),
        colorScheme: root.colorScheme,
        buttonBackground: style.backgroundColor,
        buttonBackgroundImage: style.backgroundImage,
      };
    });

    expect(colors).toEqual({
      primary: "#ff4458",
      colorScheme: "dark",
      buttonBackground: "rgb(255, 68, 88)",
      buttonBackgroundImage: "none",
    });
  });
});
