import { expect, test, type Page } from "@playwright/test";
import { IDEA_LAB_SEEN_SCENARIOS_KEY } from "../../src/components/organisms/idea-lab/model";
import { IDEA_LAB_SCENARIOS } from "../../src/components/organisms/idea-lab/sample-data";
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
const AXIS_IDS: Record<(typeof AXIS_LABELS)[number], "source" | "payer" | "moment" | "twist"> = {
  "검증된 원본": "source",
  "돈 낼 사람": "payer",
  "필요한 순간": "moment",
  "한 끗 변화": "twist",
};

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
  await page.getByRole("button", { name: /결과 자세히 보기/ }).click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

/** 완성된 카드를 중앙에 놓고 카드 뽑기식 교체 모드로 들어간다. */
async function startReplacement(page: Page, label: (typeof AXIS_LABELS)[number]) {
  const target = axisCard(page, label);
  for (let step = 0; step < AXIS_LABELS.length; step += 1) {
    const position = await target.getAttribute("data-carousel-position");
    if (position === "active") break;
    const direction = position === "previous" || position === "before" ? "previous" : "next";
    await page.locator(`.idea-lab__slot.is-carousel-${direction} .idea-lab__peek-button`).click();
  }
  await expect(target).toHaveAttribute("data-carousel-position", "active");
  await target.locator(".idea-lab__card-frame button").click();
  await expect(page.locator(".idea-lab__stage--draw")).toHaveAttribute("data-replacement-axis", AXIS_IDS[label]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function drawReplacementCard(page: Page, label: (typeof AXIS_LABELS)[number]) {
  const axis = AXIS_IDS[label];
  const point = await page.evaluate((targetAxis) => {
    const host = document.querySelector<HTMLElement>(".fd-host")!.getBoundingClientRect();
    const x = host.left + host.width / 2;
    const pixels: number[] = [];
    for (let y = Math.floor(host.top); y < host.bottom; y += 2) {
      const card = document.elementFromPoint(x, y)?.closest<HTMLElement>(
        `.fd-card[data-axis='${targetAxis}'][data-active='true']`,
      );
      if (card) pixels.push(y);
    }
    if (!pixels.length) throw new Error(`${targetAxis} 교체 덱의 맨 위 카드를 찾지 못했습니다.`);
    return { x, y: (pixels[0] + pixels[pixels.length - 1]) / 2 };
  }, axis);
  await page.mouse.click(point.x, point.y);
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
  test("Scenario 1. 도움말을 눌러 첫 카드를 뽑고, 네 장의 결과를 중요한 순서로 읽는다", async ({ page }) => {
    const lab = await openIdeaLab(page);

    // A1 뽑기 스테이지는 오직 슬롯·덱·뽑기 CTA만 — 결과 요소는 노출되지 않는다.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /로그인|Google로 계속/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /로그인|취향 조사/ })).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
    await expect(page.locator(".idea-lab__result")).toHaveCount(0);

    for (const label of AXIS_LABELS) await expect(axisCard(page, label)).toHaveCount(1);
    await expect(axisCard(page, "검증된 원본")).toHaveAttribute("data-carousel-position", "active");
    await expect(axisCard(page, "돈 낼 사람")).toHaveAttribute("data-carousel-position", "next");
    await expect(page.getByText("네 장의 카드를 조합해 오늘 시험할 아이디어를 만들어보세요.", { exact: true })).toHaveCount(0);

    // 큰 고스트 도움말도 빈칸 탭과 같은 카드 비행 경로를 사용한다.
    await page.getByRole("button", { name: "카드를 끌어 빈칸에 놓거나 눌러 뽑으세요.", exact: true }).click();
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(1);
    await expect(axisCard(page, "돈 낼 사람")).toHaveAttribute("data-carousel-position", "active");
    await expect(page.getByText("‘돈 낼 사람’ 카드를 끌어 놓거나 눌러 뽑으세요.", { exact: true })).toBeVisible();

    await drawAll(page);
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(4);
    for (const label of AXIS_LABELS) {
      expect(await cardValue(page, label)).not.toBe("");
    }
    await expect(page.locator(".idea-lab__idea-preview strong")).not.toHaveText("");
    await expect(page.locator(".idea-lab__idea-preview")).toContainText("검수 원본");

    // A2 결과 스테이지로 화면 전환 — 뽑기 슬롯은 사라진다.
    await goResult(page);
    await expect(page.locator(".idea-lab__stage--draw")).toHaveCount(0);
    await expect(page.locator("article.idea-lab__slot")).toHaveCount(0);

    const result = page.locator(".idea-lab__stage--result aside.idea-lab__result");
    await expect(result.locator(".idea-lab__result-head h2")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-concept")).toBeVisible();
    await expect(result.getByText("한 문장 UVP", { exact: true })).toBeVisible();
    await expect(result.getByText("이 문제가 생기는 순간", { exact: true })).toBeVisible();
    await expect(result.locator(".idea-lab__result-head > span")).toHaveText(/^(웹|앱|플러그인)$/);
    await expect(result.getByText("🎯 타겟", { exact: true })).toBeVisible();
    await expect(result.getByText("⚔️ 기존에 잘되는 앱 vs 차별점", { exact: true })).toBeVisible();
    await expect(result.getByText("🔄 전체 플로우", { exact: true })).toBeVisible();
    await expect(result.getByText("이 아이디어가 나온 네 장 보기", { exact: true })).toBeVisible();
    await expect(result.locator(".idea-lab__prompt")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "친구에게 알리고 시작하기" })).toBeEnabled();

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
    const beforeParts = await page.locator(".idea-lab__result-cards dd").allTextContents();
    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByText("공유했어요 ✓", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();

    // A1로 돌아가 돈 낼 사람 카드만 다른 후보로 교체
    await page.getByRole("button", { name: /아이디어로 돌아가기/ }).click();
    await page.getByRole("button", { name: /카드 다시 보기/ }).click();
    await startReplacement(page, "돈 낼 사람");
    await expect(page.getByRole("progressbar", { name: "아이디어 카드 완성도" })).toHaveAttribute("aria-valuenow", "4");
    await drawReplacementCard(page, "돈 낼 사람");
    await expect(page.locator(".idea-lab__status")).toHaveText("돈 낼 사람 카드만 새로 뽑았어요.");

    const afterCards = await cardValues(page);
    expect(afterCards["돈 낼 사람"]).not.toBe(beforeCards["돈 낼 사람"]);
    expect(afterCards["검증된 원본"]).toBe(beforeCards["검증된 원본"]);
    expect(afterCards["필요한 순간"]).toBe(beforeCards["필요한 순간"]);
    expect(afterCards["한 끗 변화"]).toBe(beforeCards["한 끗 변화"]);

    // 다시 결과로 가면 두 번째 요약값(돈 낼 사람)만 바뀌고 공유 행동이 다시 열린다.
    await goResult(page);
    const afterParts = await page.locator(".idea-lab__result-cards dd").allTextContents();
    expect(afterParts[1]).not.toBe(beforeParts[1]);
    expect(afterParts[0]).toBe(beforeParts[0]);
    expect(afterParts.slice(2)).toEqual(beforeParts.slice(2));
    await expect(page.getByRole("button", { name: /친구에게 알리고 시작하기/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toHaveCount(0);
  });

  test("Scenario 3. 카드 교체를 취소하면 네 장과 4 / 4 진행 상태가 유지된다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);
    const beforeCards = await cardValues(page);

    await startReplacement(page, "한 끗 변화");
    await expect(page.getByText("덱에서 새 카드를 뽑으세요.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "교체 취소", exact: true }).click();

    await expect(page.locator(".idea-lab__stage--draw")).not.toHaveAttribute("data-replacement-axis", /.+/);
    await expect(page.getByRole("progressbar", { name: "아이디어 카드 완성도" })).toHaveAttribute("aria-valuenow", "4");
    expect(await cardValues(page)).toEqual(beforeCards);
  });

  test("Scenario 3a. 아직 보지 않은 100번째 검수 원본도 첫 뽑기에 바로 나온다", async ({ page }) => {
    const lastScenario = IDEA_LAB_SCENARIOS.at(-1)!;
    const seenIds = IDEA_LAB_SCENARIOS.slice(0, -1).map((scenario) => scenario.id);
    await page.addInitScript(({ key, ids }) => {
      localStorage.setItem(key, JSON.stringify(ids));
    }, { key: IDEA_LAB_SEEN_SCENARIOS_KEY, ids: seenIds });

    await openIdeaLab(page);
    await drawAll(page);

    await expect(page.locator(".idea-lab__stage--draw")).toHaveAttribute("data-scenario-id", lastScenario.id);
    await expect(axisCard(page, "검증된 원본")).toHaveAttribute("data-value", lastScenario.source.value);
    await expect(page.locator(".idea-lab__idea-preview")).toContainText(lastScenario.source.sourceName);
  });

  test("Scenario 3b. 검증된 원본을 바꾸면 나머지 세 장도 새 원본 안에서 다시 맞춘다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);
    const beforeScenarioId = await page.locator(".idea-lab__stage--draw").getAttribute("data-scenario-id");

    await startReplacement(page, "검증된 원본");
    await drawReplacementCard(page, "검증된 원본");
    await expect(page.locator(".idea-lab__status"))
      .toHaveText("검증된 원본이 바뀌어 나머지 세 장도 새 원본에 맞췄어요.");

    const afterScenarioId = await page.locator(".idea-lab__stage--draw").getAttribute("data-scenario-id");
    expect(afterScenarioId).not.toBe(beforeScenarioId);
    const afterScenario = IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === afterScenarioId);
    expect(afterScenario).toBeDefined();

    const afterCards = await cardValues(page);
    expect(afterCards["검증된 원본"]).toBe(afterScenario!.source.value);
    expect(afterScenario!.payers.map((option) => option.value)).toContain(afterCards["돈 낼 사람"]);
    expect(afterScenario!.moments.map((option) => option.value)).toContain(afterCards["필요한 순간"]);
    expect(afterScenario!.twists.map((option) => option.value)).toContain(afterCards["한 끗 변화"]);
  });

  test("Scenario 4a. native 공유 성공 후 공유 완료 화면에서 전체 문구를 연다", async ({ page }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByText("공유했어요 ✓", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "전체 제작 문구 복사" })).toBeEnabled();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);
    await expect(page.locator(".idea-lab__prompt-copy")).toContainText("제품 메커니즘을 80~99% 그대로");
    await expect(page.locator(".idea-lab__prompt-copy")).toContainText("MVP 하드 게이트");
    await expect(page.locator(".idea-lab__prompt-copy")).toContainText("범위가 크면 다음 순서로 핵심 아이디어를 쪼개");

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

    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
    await expect(page.locator(".idea-lab__stage--shared")).toBeVisible();
    await expect(page.getByText("링크를 복사했어요 ✓", { exact: true })).toBeVisible();
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
    const summaryBeforeCancel = await result.locator(".idea-lab__result-concept").textContent();

    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
    await expect(page.getByText("공유를 마치지 않았어요. 결과는 그대로 보관돼요.", { exact: true })).toBeVisible();
    await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
    await expect(page.locator(".idea-lab__stage--result .idea-lab__prompt")).toHaveCount(0);
    await expect(result.locator(".idea-lab__result-head h2")).toHaveText(titleBeforeCancel);
    expect(await result.locator(".idea-lab__result-concept").textContent()).toBe(summaryBeforeCancel);
    await expect(page.getByRole("button", { name: /친구에게 알리고 시작하기/ })).toBeEnabled();
    expect(await clipboardWrites(page)).toHaveLength(0);

    const cancelledEvents = await trackedEvents(page);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(false);

    const firstCalls = await shareCalls(page);
    expect(firstCalls).toHaveLength(1);
    if (!firstCalls[0].url) throw new Error("취소된 공유 payload에 URL이 없습니다.");
    const firstUrl = firstCalls[0].url;

    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
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

  test("Scenario 6. 생성한 응원 링크에서 공유한 아이디어와 응원 행동을 연다", async ({ page, context }) => {
    await installShareMock(page, "native");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", { name: /친구에게 알리고 시작하기/ }).click();
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
    await expect(receiver.getByRole("button", { name: "반응 보내기", exact: true })).toBeVisible();

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

    const drawButton = page.getByRole("button", { name: "4장 자동 채우기", exact: true });
    await expect(drawButton).not.toHaveCSS("background-color", "rgb(255, 68, 88)");

    const axisColors = await Promise.all(AXIS_LABELS.map((label) =>
      axisCard(page, label).evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--axis").trim().toLowerCase()),
    ));
    expect(axisColors).toEqual(["#6db4f5", "#7de4be", "#e8c56a", "#ff8091"]);
    expect(axisColors).not.toContain(theme.primary);

    await drawAll(page);
    await goResult(page);
    await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
    await expect(page.getByRole("button", { name: /친구에게 알리고 시작하기/ }))
      .toHaveCSS("background-color", "rgb(255, 68, 88)");
  });
});
