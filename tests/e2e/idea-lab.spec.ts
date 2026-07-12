import { expect, test, type Page } from "@playwright/test";
import {
  axisCard,
  clipboardWrites,
  drawAll,
  installShareMock,
  shareCalls,
  trackedEvents,
  type TestPraiseRequestCard,
} from "./helpers";

const AXIS_LABELS = ["검증된 원본", "돈 낼 사람", "필요한 순간", "한 끗 변화"] as const;

const PRAISE_OPTIONS = [
  "시작부터 구체적이라 진짜 만들 수 있을 것 같아",
  "이건 완성되면 나도 써보고 싶어",
  "한 가지만 바꾼 게 오히려 더 좋아 보여",
  "오늘 작은 화면부터 만드는 선택을 응원해",
] as const;

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function openIdeaLab(page: Page) {
  await page.goto("/");
  const lab = page.getByRole("region", {
    name: "검증된 원본에서 시작하는 네 장 아이디어 제작기",
  });
  await expect(lab).toBeVisible();
  return lab;
}

/** A1(뽑기) → A2(결과) 스테이지 전환 */
async function goResult(page: Page) {
  await page.getByRole("button", { name: /네 장으로 결과 보기/ }).click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

/** 채워진 카드를 탭해 바꾸기/직접쓰기 바텀 시트를 연다 */
async function openCardSheet(page: Page, label: (typeof AXIS_LABELS)[number]) {
  await axisCard(page, label).locator(".idea-lab__card-frame button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function cardValue(page: Page, label: (typeof AXIS_LABELS)[number]) {
  const card = axisCard(page, label);
  await expect(card).toHaveAttribute("data-value", /.+/);
  return ((await card.getAttribute("data-value")) ?? "").trim();
}

async function cardValues(page: Page) {
  return Object.fromEntries(
    await Promise.all(AXIS_LABELS.map(async (label) => [label, await cardValue(page, label)] as const)),
  ) as Record<(typeof AXIS_LABELS)[number], string>;
}

async function assertShareEvents(page: Page, method: "native" | "clipboard") {
  const events = await trackedEvents(page);
  const created = events.find((entry) => entry.event === "praise_request_created");
  const completed = events.find((entry) => entry.event === "praise_request_share_completed");

  expect(created).toBeDefined();
  expect(completed).toBeDefined();
  expect(completed).toMatchObject({
    share_method: method,
    request_id: created?.request_id,
  });
}

test.describe("아이디어 제작과 칭찬 요청 공유", () => {
  test("Scenario 1. 뽑기 화면에서 네 장을 뽑고, 결과 화면으로 전환해 앞 3줄만 읽는다", async ({ page }) => {
    const lab = await openIdeaLab(page);

    // A1 뽑기 스테이지는 오직 슬롯·덱·뽑기 CTA만 — 결과 요소는 노출되지 않는다.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /로그인|Google로 계속/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /로그인|취향 조사/ })).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
    await expect(page.locator(".idea-lab__result")).toHaveCount(0);

    for (const label of AXIS_LABELS) {
      await expect(axisCard(page, label)).toBeVisible();
    }

    await drawAll(page);
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(4);
    for (const label of AXIS_LABELS) {
      expect(await cardValue(page, label)).not.toBe("");
    }

    // A2 결과 스테이지로 화면 전환 — 뽑기 슬롯은 사라진다.
    await goResult(page);
    await expect(page.locator(".idea-lab__stage--draw")).toHaveCount(0);
    await expect(page.locator("article.idea-lab__slot")).toHaveCount(0);

    const result = page.locator(".idea-lab__stage--result aside.idea-lab__result");
    await expect(result.locator(".idea-lab__result-head h2")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-summary")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-head > span")).toHaveText(/^(웹|앱|플러그인)$/);
    await expect(result.locator(".idea-lab__origin-label")).toHaveText("① 검증된 원본");
    await expect(result.getByText("쉽게 말하면", { exact: true })).toBeVisible();

    const promptLines = result.locator(".idea-lab__prompt-copy > p");
    await expect(promptLines).toHaveCount(7);
    for (let index = 0; index < 3; index += 1) {
      await expect(promptLines.nth(index)).toBeVisible();
      await expect(promptLines.nth(index)).not.toHaveClass(/is-locked/);
      expect((await promptLines.nth(index).innerText()).trim()).not.toBe("");
    }

    const lockedLines = result.locator(".idea-lab__prompt-copy > p.is-locked");
    await expect(lockedLines).toHaveCount(4);
    const lock = result.locator(".idea-lab__lock");
    await expect(lock).toBeVisible();
    expect(await lock.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.backdropFilter} ${(style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? ""}`;
    })).toContain("blur");
    await expect(result.getByText("공유하면 나머지 제작 문구가 열려요", { exact: true })).toBeVisible();

    // 뒤로가기 → 카드 상태를 유지한 채 A1로 복귀
    await page.getByRole("button", { name: /카드 다시 보기/ }).click();
    await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(4);
  });

  test("Scenario 2. 돈 낼 사람만 교체하면 열렸던 제작 문구가 다시 잠긴다", async ({ page }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);

    const beforeCards = await cardValues(page);

    // 결과 → 공유 → 공유 완료(A3)에서 전체 문구가 열린다.
    await goResult(page);
    const beforeMarks = await page.locator(".idea-lab__result-summary mark").allTextContents();
    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

    // A1로 돌아가 돈 낼 사람 카드만 다른 후보로 교체
    await page.getByRole("button", { name: /결과로/ }).click();
    await page.getByRole("button", { name: /카드 다시 보기/ }).click();
    await openCardSheet(page, "돈 낼 사람");
    await page.locator(".idea-lab__candidates button:not(.is-active)").first().click();
    await expect(page.getByText("돈 낼 사람 카드만 바꿨어요.", { exact: true })).toBeVisible();

    const afterCards = await cardValues(page);
    expect(afterCards["돈 낼 사람"]).not.toBe(beforeCards["돈 낼 사람"]);
    expect(afterCards["검증된 원본"]).toBe(beforeCards["검증된 원본"]);
    expect(afterCards["필요한 순간"]).toBe(beforeCards["필요한 순간"]);
    expect(afterCards["한 끗 변화"]).toBe(beforeCards["한 끗 변화"]);

    // 다시 결과로 가면 문구는 잠겨 있고(공유 CTA 재노출), 첫 mark(돈 낼 사람)만 바뀐다.
    await goResult(page);
    const afterMarks = await page.locator(".idea-lab__result-summary mark").allTextContents();
    expect(afterMarks[0]).not.toBe(beforeMarks[0]);
    expect(afterMarks.slice(1)).toEqual(beforeMarks.slice(1));
    await expect(page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toHaveCount(0);
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(4);
  });

  test("Scenario 3. 필요한 순간을 직접 입력하고 빈 문장은 적용하지 않는다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);

    await openCardSheet(page, "필요한 순간");
    const input = page.getByLabel("카드 대신 내 문장 쓰기");
    const apply = page.getByRole("button", { name: "적용", exact: true });
    await expect(input).toBeVisible();
    await expect(apply).toBeDisabled();
    await input.fill("   ");
    await expect(apply).toBeDisabled();

    const customMoment = "고객이 결제 직전에 망설이는 순간";
    await input.fill(customMoment);
    await expect(apply).toBeEnabled();
    await apply.click();

    await expect(axisCard(page, "필요한 순간")).toHaveAttribute("data-value", customMoment);
    await goResult(page);
    await expect(
      page.locator(".idea-lab__result-summary").getByText(customMoment, { exact: true }),
    ).toBeVisible();
  });

  test("Scenario 4a. native 공유 성공 후 공유 완료 화면에서 전체 문구를 연다", async ({ page }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);

    const calls = await shareCalls(page);
    expect(calls).toHaveLength(1);
    if (!calls[0].url) throw new Error("native 공유 payload에 URL이 없습니다.");
    expect(new URL(calls[0].url).pathname).toMatch(/^\/praise\/[^/]+$/);
    await assertShareEvents(page, "native");
  });

  test("Scenario 4b. clipboard 폴백 공유도 별도 방식으로 기록하고 문구를 연다", async ({ page }) => {
    await installShareMock(page, "clipboard");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);

    const calls = await shareCalls(page);
    const writes = await clipboardWrites(page);
    expect(calls).toHaveLength(1);
    expect(writes).toHaveLength(1);
    if (!calls[0].url) throw new Error("clipboard 폴백 전 공유 payload에 URL이 없습니다.");
    expect(new URL(writes[0]).pathname).toMatch(/^\/praise\/[^/]+$/);
    expect(writes[0]).toBe(calls[0].url);
    await assertShareEvents(page, "clipboard");
  });

  test("Scenario 5. 공유 취소 후 결과 화면을 유지하고 동일 URL로 다시 공유한다", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as typeof window & {
        __shareCalls?: ShareData[];
        __clipboardWrites?: string[];
        __shareAttempt?: number;
      };
      state.__shareCalls = [];
      state.__clipboardWrites = [];
      state.__shareAttempt = 0;
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (payload: ShareData) => {
          state.__shareCalls!.push(payload);
          state.__shareAttempt! += 1;
          if (state.__shareAttempt === 1) {
            throw new DOMException("사용자가 공유를 취소했습니다.", "AbortError");
          }
        },
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            state.__clipboardWrites!.push(value);
          },
        },
      });
    });

    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);
    const result = page.locator(".idea-lab__stage--result aside.idea-lab__result");
    const titleBeforeCancel = await result.locator(".idea-lab__result-head h2").innerText();
    const summaryBeforeCancel = await result.locator(".idea-lab__result-summary").textContent();

    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.getByText("공유를 마치지 않았어요. 결과는 그대로 보관돼요.", { exact: true })).toBeVisible();
    await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(4);
    await expect(result.locator(".idea-lab__result-head h2")).toHaveText(titleBeforeCancel);
    expect(await result.locator(".idea-lab__result-summary").textContent()).toBe(summaryBeforeCancel);
    await expect(page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ })).toBeEnabled();
    expect(await clipboardWrites(page)).toHaveLength(0);

    const cancelledEvents = await trackedEvents(page);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(false);

    const firstCalls = await shareCalls(page);
    expect(firstCalls).toHaveLength(1);
    if (!firstCalls[0].url) throw new Error("취소된 공유 payload에 URL이 없습니다.");
    const firstUrl = firstCalls[0].url;

    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

    const retriedCalls = await shareCalls(page);
    expect(retriedCalls).toHaveLength(2);
    if (!retriedCalls[1].url) throw new Error("재시도 공유 payload에 URL이 없습니다.");
    const retriedEvents = await trackedEvents(page);
    expect(retriedEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(retriedEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(true);
    expect(retriedEvents.find((entry) => entry.event === "praise_request_share_cancelled")).toMatchObject({
      share_method: "native",
    });
    expect(retriedEvents.find((entry) => entry.event === "praise_request_share_completed")).toMatchObject({
      share_method: "native",
    });

    expect(retriedCalls[1].url).toBe(firstUrl);
  });

  test("Scenario 6. 생성한 칭찬 링크에서 아이디어와 긍정 칭찬 4개를 연다", async ({ page, context }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }).click();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("oneul:latest-praise-request:v1") ?? "null") as {
        slug: string;
        card: TestPraiseRequestCard;
      } | null,
    );
    expect(saved).not.toBeNull();

    const calls = await shareCalls(page);
    expect(calls).toHaveLength(1);
    if (!saved || !calls[0].url) throw new Error("생성된 칭찬 요청 링크를 찾을 수 없습니다.");
    expect(new URL(calls[0].url).pathname).toBe(`/praise/${saved.slug}`);

    const receiver = await context.newPage();
    await receiver.goto(calls[0].url);
    await expect(receiver.getByRole("heading", { name: saved.card.title })).toBeVisible();
    await expect(receiver.getByText(saved.card.summary, { exact: true })).toBeVisible();
    await expect(receiver.getByText(saved.card.smallestBuild, { exact: true })).toBeVisible();
    await expect(receiver.getByText(saved.card.twist, { exact: false })).toBeVisible();

    const introCta = receiver.getByRole("button", { name: "익명 응원 보내기" });
    if (await introCta.count()) await introCta.first().click();

    await expect(receiver.getByRole("heading", { name: "칭찬 카드 한 장을 골라주세요." })).toBeVisible();
    for (const praise of PRAISE_OPTIONS) {
      await expect(receiver.getByRole("button", { name: praise, exact: true })).toBeVisible();
    }

    await expect.poll(async () => {
      const events = await trackedEvents(receiver);
      return events.some((entry) =>
        entry.event === "praise_request_opened" && entry.request_id === saved.card.id,
      );
    }).toBe(true);
  });

  test("Scenario 14 (아이디어 화면). Primary와 네 분류색을 구분하고 dark scheme을 유지한다", async ({ page }) => {
    await openIdeaLab(page);

    const theme = await page.locator("html").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        colorScheme: style.colorScheme,
        primary: style.getPropertyValue("--primary").trim().toLowerCase(),
      };
    });
    expect(theme).toEqual({ colorScheme: "dark", primary: "#ff4458" });

    const drawButton = page.getByRole("button", { name: /4장 한 번에 뽑기/ });
    await expect(drawButton).toHaveCSS("background-color", "rgb(255, 68, 88)");

    const axisColors = await Promise.all(AXIS_LABELS.map((label) =>
      axisCard(page, label).evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--axis").trim().toLowerCase()),
    ));
    expect(axisColors).toEqual(["#6db4f5", "#7de4be", "#e8c56a", "#ff8091"]);
    expect(axisColors).not.toContain(theme.primary);

    await drawAll(page);
    await goResult(page);
    await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
    await expect(page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ }))
      .toHaveCSS("background-color", "rgb(255, 68, 88)");
  });
});
