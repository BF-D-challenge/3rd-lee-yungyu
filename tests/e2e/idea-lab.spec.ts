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
  test("Scenario 1. 첫 방문에서 네 장을 뽑고 제작 문구의 앞 3줄만 읽는다", async ({ page }) => {
    const lab = await openIdeaLab(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /로그인|Google로 계속/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /로그인|취향 조사/ })).toHaveCount(0);

    for (const label of AXIS_LABELS) {
      await expect(axisCard(page, label)).toBeVisible();
    }

    await drawAll(page);
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(4);
    for (const label of AXIS_LABELS) {
      expect(await cardValue(page, label)).not.toBe("");
    }

    const result = page.locator("aside.idea-lab__result");
    await expect(result.locator(".idea-lab__result-head h2")).not.toHaveText("네 장을 뽑으면 결과가 나와요");
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
    // 잠금은 개별 줄 blur가 아니라 고정 높이 + 그라데이션 오버레이(backdrop blur)로 처리한다.
    const lock = result.locator(".idea-lab__lock");
    await expect(lock).toBeVisible();
    expect(await lock.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.backdropFilter} ${(style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? ""}`;
    })).toContain("blur");
    await expect(result.getByText("공유하면 나머지 제작 문구가 열려요", { exact: true })).toBeVisible();
  });

  test("Scenario 2. 돈 낼 사람만 교체하고 열린 제작 문구를 다시 잠근다", async ({ page }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);

    const result = page.locator("aside.idea-lab__result");
    const beforeCards = await cardValues(page);
    const beforeMarks = await result.locator(".idea-lab__result-summary mark").allTextContents();
    const beforeTitle = await result.locator(".idea-lab__result-head h2").innerText();
    const beforePlatform = await result.locator(".idea-lab__result-head > span").innerText();

    await result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
    await expect(result.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

    await axisCard(page, "돈 낼 사람").getByRole("button", { name: /이 카드만 바꾸기/ }).click();
    await expect(page.getByText("돈 낼 사람 카드만 바꿨어요.", { exact: true })).toBeVisible();

    const afterCards = await cardValues(page);
    expect(afterCards["돈 낼 사람"]).not.toBe(beforeCards["돈 낼 사람"]);
    expect(afterCards["검증된 원본"]).toBe(beforeCards["검증된 원본"]);
    expect(afterCards["필요한 순간"]).toBe(beforeCards["필요한 순간"]);
    expect(afterCards["한 끗 변화"]).toBe(beforeCards["한 끗 변화"]);

    const afterMarks = await result.locator(".idea-lab__result-summary mark").allTextContents();
    expect(afterMarks[0]).not.toBe(beforeMarks[0]);
    expect(afterMarks.slice(1)).toEqual(beforeMarks.slice(1));
    await expect(result.locator(".idea-lab__result-head h2")).toHaveText(beforeTitle);
    await expect(result.locator(".idea-lab__result-head > span")).toHaveText(beforePlatform);

    await expect(result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ })).toBeEnabled();
    await expect(result.getByRole("button", { name: "전체 제작 문구 복사" })).toHaveCount(0);
    await expect(result.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(4);
  });

  test("Scenario 3. 필요한 순간을 직접 입력하고 빈 문장은 적용하지 않는다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);

    const momentCard = axisCard(page, "필요한 순간");
    await momentCard.getByRole("button", { name: "직접 쓰기" }).click();

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

    await expect(momentCard).toHaveAttribute("data-value", customMoment);
    await expect(
      page.locator("aside.idea-lab__result").getByText(customMoment, { exact: true }),
    ).toBeVisible();
  });

  test("Scenario 4a. native 공유 성공 후 제작 문구를 열고 완료 이벤트를 기록한다", async ({ page }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);

    const result = page.locator("aside.idea-lab__result");
    await result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
    await expect(result.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();
    await expect(result.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);

    const calls = await shareCalls(page);
    expect(calls).toHaveLength(1);
    if (!calls[0].url) throw new Error("native 공유 payload에 URL이 없습니다.");
    expect(new URL(calls[0].url).pathname).toMatch(/^\/praise\/[^/]+$/);
    await assertShareEvents(page, "native");
  });

  test("Scenario 4b. clipboard 폴백 공유도 별도 방식으로 기록하고 제작 문구를 연다", async ({ page }) => {
    await installShareMock(page, "clipboard");
    await openIdeaLab(page);
    await drawAll(page);

    const result = page.locator("aside.idea-lab__result");
    await result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
    await expect(result.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();
    await expect(result.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);

    const calls = await shareCalls(page);
    const writes = await clipboardWrites(page);
    expect(calls).toHaveLength(1);
    expect(writes).toHaveLength(1);
    if (!calls[0].url) throw new Error("clipboard 폴백 전 공유 payload에 URL이 없습니다.");
    expect(new URL(writes[0]).pathname).toMatch(/^\/praise\/[^/]+$/);
    expect(writes[0]).toBe(calls[0].url);
    await assertShareEvents(page, "clipboard");
  });

  test("Scenario 5. 공유 취소 후 결과를 유지하고 동일 URL로 다시 공유한다", async ({ page }) => {
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
    const result = page.locator("aside.idea-lab__result");
    const titleBeforeCancel = await result.locator(".idea-lab__result-head h2").innerText();
    const summaryBeforeCancel = await result.locator(".idea-lab__result-summary").textContent();

    await result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
    await expect(page.getByText("공유를 마치지 않았어요. 결과는 그대로 보관돼요.", { exact: true })).toBeVisible();
    await expect(result.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(4);
    await expect(result.locator(".idea-lab__result-head h2")).toHaveText(titleBeforeCancel);
    expect(await result.locator(".idea-lab__result-summary").textContent()).toBe(summaryBeforeCancel);
    await expect(result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ })).toBeEnabled();
    expect(await clipboardWrites(page)).toHaveLength(0);

    const cancelledEvents = await trackedEvents(page);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(false);

    const firstCalls = await shareCalls(page);
    expect(firstCalls).toHaveLength(1);
    if (!firstCalls[0].url) throw new Error("취소된 공유 payload에 URL이 없습니다.");
    const firstUrl = firstCalls[0].url;

    await result.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
    await expect(result.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

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

    // 같은 결과의 취소 재시도는 최초에 만든 칭찬 요청 URL을 그대로 재사용해야 한다.
    expect(retriedCalls[1].url).toBe(firstUrl);
  });

  test("Scenario 6. 생성한 칭찬 링크에서 아이디어와 긍정 칭찬 4개를 연다", async ({ page, context }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);

    await page.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }).click();
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
    // 칭찬 수신 화면은 twist를 "원본에서 딱 하나 바꾼 점 · …" 접두와 함께 렌더한다.
    await expect(receiver.getByText(saved.card.twist, { exact: false })).toBeVisible();

    // Flow B(칭찬 수신) UI는 병렬로 개편 중이라 intro 단계가 있을 수도 없을 수도 있다 — 있으면 통과한다.
    const introCta = receiver.getByRole("button", { name: "익명 응원 보내기" });
    if (await introCta.count()) await introCta.first().click();

    await expect(receiver.getByRole("heading", { name: "칭찬 카드 한 장을 골라주세요." })).toBeVisible();
    // 4개의 긍정 칭찬이 각각 버튼으로 열린다(장식 하트는 aria-hidden이라 접근성 이름에 영향 없음).
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
    await expect(page.getByRole("button", { name: /친구에게 물어보고 전체 열기/ }))
      .toHaveCSS("background-color", "rgb(255, 68, 88)");
  });
});
