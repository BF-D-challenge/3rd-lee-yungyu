import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  FIXED_NOW,
  drawAll,
  installShareMock,
  makePraiseRequest,
  openPraiseTab,
  praiseVote,
} from "./helpers";

const PRIMARY_RGB = "rgb(255, 68, 88)";
const ACTION_PRIMARY_RGB = "rgb(217, 45, 69)";

async function setPraiseFixture(page: Page, messages: string[]) {
  const request = makePraiseRequest();
  await page.evaluate(({ saved, slug, votes }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("oneul:demo-auth", "1");
    localStorage.setItem("oneul:demo-actor", "e2e-demo-actor");
    localStorage.setItem("oneul:latest-praise-request:v1", JSON.stringify(saved));
    localStorage.setItem(`oneul:votes:${slug}`, JSON.stringify(votes));
  }, {
    saved: request.saved,
    slug: request.slug,
    votes: messages.map((praise, index) => praiseVote({
      id: `responsive-${index + 1}`,
      praise,
      at: FIXED_NOW.getTime() + index * 1_000,
    })),
  });
  await page.reload();
  await openPraiseTab(page);
}

/** A1(뽑기) → A2(결과) 스테이지 전환 */
async function goResult(page: Page) {
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

test("Scenario 14: Primary 단일색과 네 분류 의미색, dark color scheme을 유지한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true })).toHaveCount(0);
  await page.locator(".idea-lab__slot.is-carousel-active .idea-lab__card-frame button").click();
  await expect(page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true })).toHaveCount(0);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  // 네 분류 의미색은 뽑기 스테이지의 슬롯 라벨에서 확인한다(결과 스테이지엔 슬롯이 없다).
  const semanticColors = await page.locator(".idea-lab__slot-label").evaluateAll((labels) =>
    labels.map((label) => getComputedStyle(label).color));
  expect(new Set(semanticColors).size).toBe(4);
  expect(semanticColors).not.toContain(PRIMARY_RGB);

  await drawAll(page);
  await goResult(page);
  await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
  const shareButton = page.getByRole("button", {
    name: "공유하고 결과 보기",
    exact: true,
  });
  await expect(shareButton).toHaveCSS("background-color", ACTION_PRIMARY_RGB);

  const request = makePraiseRequest();
  await page.goto(`/praise/${request.slug}`);
  // Flow B(응원 수신)도 같은 Primary 팔레트를 쓴다 — 아이디어 확인 → 응원 선택 → 공개 설정 → 전송 CTA 순.
  await page.getByRole("button", { name: "반응 보내기", exact: true }).click();
  await page.getByRole("button", { name: "무슨 앱인지 바로 이해됐어요", exact: true }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("button", { name: "응원 카드 보내기", exact: true })).toHaveCSS(
    "background-color",
    ACTION_PRIMARY_RGB,
  );
});

const viewports = [
  { width: 390, height: 844 },
  { width: 440, height: 956 },
  { width: 834, height: 1112 },
  { width: 1000, height: 1000 },
  { width: 1280, height: 720 },
  { width: 1440, height: 1000 },
] as const;

const COLUMN_MAX = 440;

for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }] as const) {
  test(`Compact ${viewport.width}×${viewport.height}: 활성 카드와 라벨이 카드 영역 안에서 잘리지 않는다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const appbar = document.querySelector<HTMLElement>(".idea-lab__appbar")!.getBoundingClientRect();
      const slots = document.querySelector<HTMLElement>(".idea-lab__slots")!.getBoundingClientRect();
      const frame = document.querySelector<HTMLElement>(
        ".idea-lab__slot.is-carousel-active .idea-lab__card-frame",
      )!.getBoundingClientRect();
      const label = document.querySelector<HTMLElement>(
        ".idea-lab__slot.is-carousel-active .idea-lab__slot-label",
      )!.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        appbarBottom: appbar.bottom,
        slotsTop: slots.top,
        slotsBottom: slots.bottom,
        frameTop: frame.top,
        frameBottom: frame.bottom,
        labelTop: label.top,
        labelBottom: label.bottom,
      };
    });

    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.labelTop).toBeGreaterThanOrEqual(geometry.appbarBottom - 1);
    expect(geometry.frameTop).toBeGreaterThanOrEqual(geometry.slotsTop - 1);
    expect(geometry.frameBottom).toBeLessThanOrEqual(geometry.slotsBottom + 1);
    expect(geometry.labelBottom).toBeLessThanOrEqual(geometry.slotsBottom + 1);
  });
}

test("Step 2: 원본 비율의 카드 한 장에 집중하고 다음 카드는 가장자리에서 예고한다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const focus = await page.locator(".idea-lab__slot.is-carousel-active").evaluate((slot) => {
    const frame = slot.querySelector<HTMLElement>(".idea-lab__card-frame")!;
    const label = slot.querySelector<HTMLElement>(".idea-lab__slot-label")!;
    const button = frame.querySelector<HTMLButtonElement>("button")!;
    const rect = frame.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    return {
      value: slot.getAttribute("data-value"),
      width: rect.width,
      height: rect.height,
      centerGap: Math.abs((labelRect.left + labelRect.right) / 2 - (rect.left + rect.right) / 2),
      labelFontSize: Number.parseFloat(getComputedStyle(label).fontSize),
      borderRadius: button.style.borderRadius,
    };
  });
  const deckGeometry = await page.locator(".fd-card").first().evaluate((card) => {
    return { ratio: card.clientWidth / card.clientHeight };
  });
  expect(focus.value).toBe("");
  expect(focus.width).toBeGreaterThanOrEqual(230);
  expect(focus.width).toBeLessThanOrEqual(233);
  expect(Math.abs(focus.width / focus.height - deckGeometry.ratio)).toBeLessThan(0.01);
  expect(focus.centerGap).toBeLessThan(1);
  expect(focus.labelFontSize).toBeGreaterThanOrEqual(12);
  expect(focus.borderRadius).toBe("8px");
  await expect(page.locator(".idea-lab__slot.is-carousel-next")).toHaveCount(1);
  await expect(page.locator(".idea-lab__slot.is-carousel-previous")).toHaveCount(0);

  await page.locator(".idea-lab__slot.is-carousel-active .idea-lab__card-frame button").click();
  await expect(page.locator(".idea-lab__slot.is-filled")).toHaveCount(1);
  const filledRadii = await page.locator(".idea-lab__slot.is-filled .idea-lab__card-frame").evaluateAll((frames) => frames.map((frame) => {
    const button = frame.querySelector<HTMLButtonElement>("button")!;
    return (button.lastElementChild as HTMLElement).style.borderRadius;
  }));
  expect(filledRadii).toEqual(["8px"]);
  const textLimits = await page.locator(".idea-lab__slot.is-filled .idea-lab__card-frame").evaluate((frame) => ({
    title: frame.querySelector<HTMLElement>("strong")?.style.webkitLineClamp,
    detail: frame.querySelector<HTMLElement>("p")?.style.webkitLineClamp,
  }));
  expect(textLimits).toEqual({ title: "3", detail: "2" });
});

test("Step 3: 현재 빈칸을 채우면 다음 카드가 옆에서 중앙으로 들어온다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");
  await expect(page.locator(".idea-lab__stage--draw")).toHaveAttribute("data-readable-pause-ms", "80");

  const readEmptyStates = () => page.locator(".idea-lab__slot").evaluateAll((slots) =>
    slots.map((slot) => {
      const frame = slot.querySelector<HTMLElement>(".idea-lab__card-frame")!;
      const button = frame.querySelector<HTMLButtonElement>("button")!;
      return {
        current: frame.dataset.pulse === "true",
        borderStyle: getComputedStyle(button).borderStyle,
        text: button.textContent?.trim() ?? "",
      };
    }));

  const initial = await readEmptyStates();
  expect(initial).toHaveLength(4);
  expect(initial[0]).toMatchObject({ current: true, borderStyle: "dashed" });
  expect(initial[0].text).toContain("눌러서 카드 뽑기");
  for (const state of initial.slice(1)) {
    expect(state).toMatchObject({ current: false, borderStyle: "dashed" });
    expect(state.text).toContain("?");
  }

  await page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true }).click();
  await expect(page.locator(".fd-fly")).toHaveCount(1);
  await expect(page.locator("article.idea-lab__slot.is-filled")).toHaveCount(1);
  const tarotArt = page.locator("article.idea-lab__slot.is-filled [data-tarot-art]");
  await expect(tarotArt).toHaveCount(1);
  await expect(tarotArt).toHaveAttribute("shape-rendering", "crispEdges");
  await expect(tarotArt).toHaveAttribute("data-grid", "72x46");
  await expect(tarotArt).toHaveAttribute("data-palette", "mono");
  await expect(tarotArt).toHaveAttribute("data-style", "editorial-dither");
  await expect(tarotArt.locator("image")).toHaveCount(0);
  await expect(tarotArt.locator("path")).toHaveCount(1);
  const pixelArt = await tarotArt.evaluate((art) => ({
    pixelCount: Number(art.getAttribute("data-pixel-count")),
    pathLength: art.querySelector("path")?.getAttribute("d")?.length ?? 0,
    hasToneEffects: Boolean(art.querySelector("[opacity], defs, pattern, linearGradient, radialGradient, filter")),
  }));
  expect(pixelArt.pixelCount).toBeGreaterThan(700);
  expect(pixelArt.pathLength).toBeGreaterThan(3_500);
  expect(pixelArt.hasToneEffects).toBe(false);
  await expect(page.locator(".idea-lab__slot.is-carousel-active .idea-lab__slot-label")).toContainText("돈 낼 사람");
  await expect(page.locator(".idea-lab__slot.is-carousel-previous .idea-lab__slot-label")).toContainText("검증된 원본");
  const next = await readEmptyStates();
  expect(next[1]).toMatchObject({ current: true, borderStyle: "dashed" });
  expect(next[1].text).toContain("눌러서 카드 뽑기");

  const requestedSpacing = await page.evaluate(() => {
    const guide = document.querySelector<HTMLElement>(".idea-lab__appbar.is-guide")!;
    const badge = [...document.querySelectorAll<HTMLElement>(".idea-lab__slot.is-carousel-active button > span")]
      .find((element) => element.textContent?.trim() === "2")!;
    const guideStyle = getComputedStyle(guide);
    const badgeStyle = getComputedStyle(badge);
    return {
      guideBorderStyle: guideStyle.borderStyle,
      guideBackgroundImage: guideStyle.backgroundImage,
      guideBoxShadow: guideStyle.boxShadow,
      guideHeight: guide.getBoundingClientRect().height,
      guideTextAlign: guideStyle.textAlign,
      guideDisplay: guideStyle.display,
      guideJustify: guideStyle.justifyContent,
      deckPromptRemoved: document.querySelector(".idea-lab__deck-prompt") === null,
      badgeTop: Number.parseFloat(badgeStyle.top),
      badgeLeft: Number.parseFloat(badgeStyle.left),
    };
  });
  expect(requestedSpacing).toEqual({
    guideBorderStyle: "none",
    guideBackgroundImage: "none",
    guideBoxShadow: "none",
    guideHeight: 216,
    guideTextAlign: "center",
    guideDisplay: "flex",
    guideJustify: "center",
    deckPromptRemoved: true,
    badgeTop: 8,
    badgeLeft: 8,
  });
});

test("수동 진행: 완료 카드가 중앙에서 읽기 시간을 채운 뒤 다음 칸으로 넘어간다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");

  const stage = page.locator(".idea-lab__stage--draw");
  const source = page.locator('article.idea-lab__slot[data-axis="source"]');
  const payer = page.locator('article.idea-lab__slot[data-axis="payer"]');

  const indicatorProbe = page.locator(".idea-lab__progress-segments span").first();
  const originalProbeDuration = await indicatorProbe.evaluate((segment) => {
    const element = segment as HTMLElement;
    const originalDuration = element.style.getPropertyValue("--read-duration");
    element.style.setProperty("--read-duration", "400ms");
    element.classList.add("is-reading");
    const fill = document.createElement("i");
    fill.className = "idea-lab__progress-segment-fill";
    element.append(fill);
    return originalDuration;
  });
  await page.waitForTimeout(200);
  const probeFillWidth = await indicatorProbe.locator(".idea-lab__progress-segment-fill").evaluate((fill) =>
    fill.getBoundingClientRect().width);
  expect(probeFillWidth).toBeGreaterThan(2);
  expect(probeFillWidth).toBeLessThan(18);
  await indicatorProbe.evaluate((segment, originalDuration) => {
    const element = segment as HTMLElement;
    element.querySelector(".idea-lab__progress-segment-fill")?.remove();
    element.classList.remove("is-reading");
    element.style.setProperty("--read-duration", originalDuration);
  }, originalProbeDuration);

  const readingSequence = page.evaluate(() => new Promise<{
    axes: string[];
    sourceUi: {
      activeCenterDelta: number;
      progressCenterDelta: number;
      progressHeight: number;
      progressWidth: number;
      readingSegmentCount: number;
      animationPlayState: string;
      animationName: string;
      animationDurationMs: number;
      readablePauseMs: number;
      indicatorWidth: number;
      indicatorOverflow: string;
      trackBackground: string;
      fillBackground: string;
      progressLoaderContent: string;
      pauseButtonCount: number;
    };
  }>((resolve) => {
    const stageElement = document.querySelector<HTMLElement>(".idea-lab__stage--draw")!;
    const axes: string[] = [];
    let sourceUi: {
      activeCenterDelta: number;
      progressCenterDelta: number;
      progressHeight: number;
      progressWidth: number;
      readingSegmentCount: number;
      animationPlayState: string;
      animationName: string;
      animationDurationMs: number;
      readablePauseMs: number;
      indicatorWidth: number;
      indicatorOverflow: string;
      trackBackground: string;
      fillBackground: string;
      progressLoaderContent: string;
      pauseButtonCount: number;
    } | null = null;

    const inspect = () => {
      const axis = stageElement.dataset.readingAxis;
      if (!axis || axes.at(-1) === axis) return;
      axes.push(axis);
      if (axis === "source") {
        const slots = document.querySelector<HTMLElement>(".idea-lab__slots")!;
        const active = document.querySelector<HTMLElement>('.idea-lab__slot[data-carousel-position="active"]')!;
        const dock = document.querySelector<HTMLElement>(".idea-lab__progress-dock")!;
        const progress = document.querySelector<HTMLElement>(".idea-lab__progress")!;
        const segment = document.querySelector<HTMLElement>(".idea-lab__progress-segments .is-reading")!;
        const indicatorFill = segment.querySelector<HTMLElement>(".idea-lab__progress-segment-fill")!;
        const slotsRect = slots.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        const progressRect = progress.getBoundingClientRect();
        const indicatorFillStyle = getComputedStyle(indicatorFill);
        sourceUi = {
          activeCenterDelta: Math.abs(
            activeRect.left + activeRect.width / 2 - (slotsRect.left + slotsRect.width / 2),
          ),
          progressCenterDelta: Math.abs(
            progressRect.left + progressRect.width / 2 - (dockRect.left + dockRect.width / 2),
          ),
          progressHeight: progressRect.height,
          progressWidth: progressRect.width,
          readingSegmentCount: document.querySelectorAll(".idea-lab__progress-segments .is-reading").length,
          animationPlayState: indicatorFillStyle.animationPlayState,
          animationName: indicatorFillStyle.animationName,
          animationDurationMs: Number.parseFloat(indicatorFillStyle.animationDuration) * 1_000,
          readablePauseMs: Number(stageElement.dataset.readablePauseMs),
          indicatorWidth: segment.getBoundingClientRect().width,
          indicatorOverflow: getComputedStyle(segment).overflow,
          trackBackground: getComputedStyle(segment).backgroundColor,
          fillBackground: indicatorFillStyle.backgroundColor,
          progressLoaderContent: getComputedStyle(progress, "::before").content,
          pauseButtonCount: document.querySelectorAll(".idea-lab__progress-toggle").length,
        };
        observer.disconnect();
        resolve({ axes, sourceUi });
      }
    };

    const observer = new MutationObserver(inspect);
    observer.observe(stageElement, { attributes: true, attributeFilter: ["data-reading-axis"] });
    inspect();
  }));

  await page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true }).click();
  const { axes, sourceUi: readingUi } = await readingSequence;

  expect(readingUi.activeCenterDelta).toBeLessThanOrEqual(1);
  expect(readingUi.progressCenterDelta).toBeLessThanOrEqual(1);
  expect(readingUi.progressHeight).toBe(48);
  expect(readingUi.progressWidth).toBe(124);
  expect(readingUi.readingSegmentCount).toBe(1);
  expect(readingUi.animationPlayState).toBe("running");
  expect(readingUi.animationName).toBe("idea-indicator-fill");
  expect(readingUi.animationDurationMs).toBe(readingUi.readablePauseMs);
  expect(readingUi.indicatorWidth).toBe(20);
  expect(readingUi.indicatorOverflow).toBe("hidden");
  expect(readingUi.trackBackground).toBe("rgba(255, 255, 255, 0.14)");
  expect(readingUi.fillBackground).toBe("rgb(109, 180, 245)");
  expect(readingUi.fillBackground).not.toBe(readingUi.trackBackground);
  expect(readingUi.progressLoaderContent).toBe("none");
  expect(readingUi.pauseButtonCount).toBe(0);
  expect(axes).toEqual(["source"]);
  await expect(payer).toHaveAttribute("data-carousel-position", "active");
  await expect(stage).not.toHaveAttribute("data-reading-axis");
  await expect(source).not.toHaveAttribute("data-value", "");
  await expect(payer).toHaveAttribute("data-value", "");
});

test("카드 캐러셀: 인디케이터 화살표와 좌우 드래그로 준비된 카드를 탐색한다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");

  const source = page.locator('article.idea-lab__slot[data-axis="source"]');
  const payer = page.locator('article.idea-lab__slot[data-axis="payer"]');
  const previous = page.locator('button[aria-label="이전 카드 보기"]');
  const next = page.locator('button[aria-label="다음 카드 보기"]');
  const progress = page.getByRole("progressbar", { name: "아이디어 카드 완성도" });

  await page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true }).click();
  await expect(source).not.toHaveAttribute("data-value", "");
  await expect(previous).toBeEnabled();
  await expect(payer).toHaveAttribute("data-carousel-position", "active");
  await expect(next).toBeEnabled();
  await expect(progress).toHaveAttribute("aria-valuetext", "1 / 4");

  const readDockGeometry = () => page.locator(".idea-lab__progress-dock").evaluate((dock) => {
    const progress = dock.querySelector<HTMLElement>(".idea-lab__progress")!;
    const buttons = [...dock.querySelectorAll<HTMLButtonElement>(".idea-lab__carousel-arrow")];
    const dockRect = dock.getBoundingClientRect();
    const progressRect = progress.getBoundingClientRect();
    return {
      progressX: progressRect.x,
      progressWidth: progressRect.width,
      progressCenterDelta: Math.abs(
        progressRect.left + progressRect.width / 2 - (dockRect.left + dockRect.width / 2),
      ),
      arrows: buttons.map((button) => ({
        x: button.getBoundingClientRect().x,
        width: button.getBoundingClientRect().width,
        height: button.getBoundingClientRect().height,
        visibility: getComputedStyle(button).visibility,
      })),
      pauseButtonCount: dock.querySelectorAll(".idea-lab__progress-toggle").length,
    };
  });

  const payerDock = await readDockGeometry();
  expect(payerDock.progressWidth).toBe(124);
  expect(payerDock.progressCenterDelta).toBeLessThanOrEqual(1);
  expect(payerDock.arrows.map(({ width, height }) => ({ width, height }))).toEqual([
    { width: 48, height: 48 },
    { width: 48, height: 48 },
  ]);
  expect(payerDock.arrows.map(({ visibility }) => visibility)).toEqual(["visible", "visible"]);
  expect(payerDock.pauseButtonCount).toBe(0);

  await previous.click();
  await expect(source).toHaveAttribute("data-carousel-position", "active");
  await expect(next).toBeEnabled();
  const sourceDock = await readDockGeometry();
  expect(sourceDock.progressX).toBe(payerDock.progressX);
  expect(sourceDock.arrows.map(({ x }) => x)).toEqual(payerDock.arrows.map(({ x }) => x));
  expect(sourceDock.arrows.map(({ visibility }) => visibility)).toEqual(["visible", "visible"]);
  await next.click();
  await expect(payer).toHaveAttribute("data-carousel-position", "active");

  const slots = page.locator(".idea-lab__slots");
  const box = await slots.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 92, centerY, { steps: 6 });
  await page.mouse.up();
  await expect(source).toHaveAttribute("data-carousel-position", "active");
  await expect(slots).toHaveAttribute("data-dragging", "false");

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX - 92, centerY, { steps: 6 });
  await page.mouse.up();
  await expect(payer).toHaveAttribute("data-carousel-position", "active");
  await expect(progress).toHaveAttribute("aria-valuetext", "1 / 4");
  await expect(page.locator(".idea-lab__deck-prompt")).toHaveCount(0);
});

test("카드 덱: 호버 카드는 순서를 유지하고 이웃과 곡선적으로 빠르게 올라온다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");

  const apexIndex = await page.locator(".fd-card").evaluateAll((cards) => {
    const hostRect = document.querySelector<HTMLElement>(".fd-host")!.getBoundingClientRect();
    const hostCenter = hostRect.left + hostRect.width / 2;
    return cards.reduce((best, card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - hostCenter);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
  });
  const apex = page.locator(".fd-card").nth(apexIndex);
  await expect(apex.locator("svg")).toHaveAttribute("shape-rendering", "geometricPrecision");
  await expect(apex.locator("image")).toHaveCount(0);
  const visibility = await apex.evaluate((card) => {
    const cardRect = card.getBoundingClientRect();
    const deckRect = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    const deckStyle = getComputedStyle(document.querySelector<HTMLElement>(".idea-lab__deck")!);
    const exposedHeight = deckRect.bottom - Math.max(cardRect.top, deckRect.top);
    const x = deckRect.left + deckRect.width / 2;
    let visiblePixels = 0;
    for (let y = Math.ceil(deckRect.top); y < Math.floor(deckRect.bottom); y += 1) {
      if (document.elementFromPoint(x, y)?.closest(".fd-card")) visiblePixels += 1;
    }
    return {
      overflow: deckStyle.overflow,
      cardHeight: cardRect.height,
      exposedHeight,
      croppedAtBottom: cardRect.bottom > deckRect.bottom,
      visiblePixels,
    };
  });
  expect(visibility.overflow).toBe("visible");
  expect(visibility.cardHeight).toBeGreaterThanOrEqual(160);
  expect(visibility.exposedHeight).toBeGreaterThanOrEqual(44);
  expect(visibility.exposedHeight).toBeLessThan(visibility.cardHeight);
  expect(visibility.croppedAtBottom).toBe(true);
  expect(visibility.visiblePixels).toBeGreaterThanOrEqual(32);

  const interactionPoint = await page.evaluate(() => {
    const deck = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    const x = deck.left + deck.width / 2;
    const cardPixels: number[] = [];
    for (let y = Math.ceil(deck.top); y < Math.floor(deck.bottom); y += 1) {
      if (document.elementFromPoint(x, y)?.closest(".fd-card")) cardPixels.push(y);
    }
    if (!cardPixels.length) throw new Error("하단 트레이에서 포커스할 카드를 찾지 못했습니다.");
    return { x, y: (cardPixels[0] + cardPixels[cardPixels.length - 1]) / 2 };
  });
  await page.mouse.move(interactionPoint.x, interactionPoint.y);
  const focusedCard = page.locator('.fd-card[data-focus="active"]');
  await expect(focusedCard).toHaveCount(1);
  await expect.poll(() => focusedCard.evaluate((card) => {
    const pull = card.querySelector<HTMLElement>(".pull")!.getBoundingClientRect();
    const deck = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    return pull.top - deck.top;
  })).toBeLessThan(-48);
  await page.waitForTimeout(220);
  const focused = await focusedCard.evaluate((card) => {
    const pull = card.querySelector<HTMLElement>(".pull")!.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const deck = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    const host = document.querySelector<HTMLElement>(".fd-host")!;
    const deckLayer = document.querySelector<HTMLElement>(".idea-lab__deck")!;
    const slotsLayer = document.querySelector<HTMLElement>(".idea-lab__slots")!;
    const curve = [...document.querySelectorAll<HTMLElement>(".fd-card[data-focus-distance]")]
      .map((item) => {
        const itemPull = item.querySelector<HTMLElement>(".pull")!;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(itemPull).transform);
        return {
          distance: Number(item.dataset.focusDistance),
          lift: Number.parseFloat(item.style.getPropertyValue("--fd-focus-lift")),
          scale: Math.hypot(matrix.a, matrix.b),
          translateX: matrix.e,
          zIndex: Number.parseInt(getComputedStyle(item).zIndex, 10),
        };
      })
      .sort((a, b) => a.distance - b.distance);
    return {
      pullTop: pull.top,
      pullWidth: pull.width,
      cardWidth: cardRect.width,
      deckTop: deck.top,
      hostMask: getComputedStyle(host).maskImage,
      deckZIndex: Number.parseInt(getComputedStyle(deckLayer).zIndex, 10),
      slotsZIndex: Number.parseInt(getComputedStyle(slotsLayer).zIndex, 10),
      activeZIndex: Number.parseInt(getComputedStyle(card).zIndex, 10),
      curve,
    };
  });
  expect(focused.pullTop).toBeLessThan(focused.deckTop - 48);
  expect(Math.abs(focused.pullWidth - focused.cardWidth)).toBeLessThanOrEqual(0.5);
  expect(focused.hostMask).toBe("none");
  expect(focused.deckZIndex).toBeGreaterThan(focused.slotsZIndex);
  expect(focused.curve).toHaveLength(11);
  expect(focused.curve.map((item) => item.distance)).toEqual([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
  expect(focused.curve.every((item) => Math.abs(item.scale - 1) <= 0.001)).toBe(true);
  expect(focused.curve.find((item) => item.distance === 1)!.zIndex).toBeGreaterThan(focused.activeZIndex);
  const liftsByDistance = [0, 1, 2, 3, 4, 5].map((distance) =>
    Math.max(...focused.curve.filter((item) => Math.abs(item.distance) === distance).map((item) => item.lift)),
  );
  for (let index = 1; index < liftsByDistance.length; index += 1) {
    expect(liftsByDistance[index - 1]).toBeGreaterThan(liftsByDistance[index]);
  }

  const nextCardIndex = await page.locator('.fd-card[data-focus-distance="1"]').evaluate((card) =>
    [...document.querySelectorAll(".fd-card")].indexOf(card),
  );
  const nextCard = page.locator(".fd-card").nth(nextCardIndex);
  const nextPoint = await nextCard.evaluate((card, y) => {
    const rect = card.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y };
  }, interactionPoint.y);
  await page.mouse.move(nextPoint.x, nextPoint.y);
  await expect(nextCard).toHaveAttribute("data-focus", "active", { timeout: 350 });
  await page.waitForTimeout(200);
  const switched = await nextCard.evaluate((card) => {
    const pull = card.querySelector<HTMLElement>(".pull")!;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(pull).transform);
    return {
      actualX: matrix.e,
      actualY: matrix.f,
      targetX: Number.parseFloat(card.style.getPropertyValue("--fd-focus-x")),
      targetY: Number.parseFloat(card.style.getPropertyValue("--fd-focus-y")),
      transitionDuration: getComputedStyle(pull).transitionDuration,
    };
  });
  expect(Math.abs(switched.actualX - switched.targetX)).toBeLessThanOrEqual(1);
  expect(Math.abs(switched.actualY - switched.targetY)).toBeLessThanOrEqual(1);
  expect(switched.transitionDuration).toBe("0.18s");

  const edgeAlignment = await page.evaluate(async () => {
    const deck = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    return [deck.left + 72, deck.right - 72].map((x) => {
      const cardPixels: number[] = [];
      for (let y = Math.ceil(deck.top); y < Math.floor(deck.bottom); y += 1) {
        if (document.elementFromPoint(x, y)?.closest(".fd-card")) cardPixels.push(y);
      }
      if (!cardPixels.length) throw new Error("덱 가장자리의 포인터 영역을 찾지 못했습니다.");
      return { x, y: cardPixels[Math.floor(cardPixels.length / 2)] };
    });
  });
  for (const point of edgeAlignment) {
    await page.mouse.move(point.x, point.y);
    await expect(page.locator('.fd-card[data-focus="active"]')).toHaveCount(1);
    await page.waitForTimeout(200);
    const alignment = await page.locator('.fd-card[data-focus="active"]').evaluate((card, pointerX) => {
      const base = card.getBoundingClientRect();
      const pull = card.querySelector<HTMLElement>(".pull")!.getBoundingClientRect();
      return {
        baseCenterX: base.left + base.width / 2,
        pullCenterX: pull.left + pull.width / 2,
        pointerInsideActiveCard: pointerX >= pull.left && pointerX <= pull.right,
      };
    }, point.x);
    expect(Math.abs(alignment.pullCenterX - alignment.baseCenterX)).toBeLessThanOrEqual(1);
    expect(alignment.pointerInsideActiveCard).toBe(true);
  }
});

test("카드 덱: 탭 순서는 가운데 한 장만 사용하고 방향키로 이웃 카드를 고른다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const cards = page.locator(".fd-card");
  await expect(page.locator(".fd-host")).toHaveAttribute("data-motion", "reduced");
  const tabbable = page.locator('.fd-card[tabindex="0"]');
  await expect(cards).not.toHaveCount(0);
  await expect(tabbable).toHaveCount(1);

  await tabbable.focus();
  const beforeIndex = await cards.evaluateAll((items) => items.indexOf(document.activeElement as HTMLElement));
  await page.keyboard.press("ArrowRight");
  const afterIndex = await cards.evaluateAll((items) => items.indexOf(document.activeElement as HTMLElement));

  expect(beforeIndex).toBeGreaterThanOrEqual(0);
  expect(afterIndex).toBeGreaterThanOrEqual(0);
  expect(afterIndex).not.toBe(beforeIndex);
  await expect(tabbable).toHaveCount(1);

  await page.keyboard.press("Enter");
  await expect(page.getByRole("progressbar", { name: "아이디어 카드 완성도" })).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await expect(tabbable).toHaveCount(1);
});

test("카드 덱: 화면 밖에서는 회전을 멈추고 다시 보이면 이어서 움직인다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 956 });
  await page.goto("/");

  const deck = page.locator(".fd-host");
  await expect(deck).toHaveAttribute("data-motion", "running");
  await deck.evaluate((element) => { element.style.transform = "translateY(2000px)"; });
  await expect(deck).toHaveAttribute("data-motion", "paused");

  await deck.evaluate((element) => { element.style.transform = ""; });
  await expect(deck).toHaveAttribute("data-motion", "running");
});

test("카드 덱: 실제 포인터 드래그앤드롭으로 현재 빈칸을 채운다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");

  const start = await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>(".fd-host")!.getBoundingClientRect();
    const x = host.left + host.width / 2;
    const cardPixels: number[] = [];
    for (let y = Math.floor(host.top); y < host.bottom; y += 2) {
      if (document.elementFromPoint(x, y)?.closest(".fd-card")) cardPixels.push(y);
    }
    if (!cardPixels.length) throw new Error("드래그할 덱 카드를 찾지 못했습니다.");
    return { x, y: (cardPixels[0] + cardPixels[cardPixels.length - 1]) / 2 };
  });
  const target = (await page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true }).boundingBox())!;

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await expect(page.locator("article.idea-lab__slot.is-hot")).toHaveCount(1);
  await page.mouse.up();

  await expect(page.locator("article.idea-lab__slot.is-filled")).toHaveCount(1);
  await expect(page.locator(".fd-fly")).toHaveCount(0);
});

test("Steps 4-9: 핵심 조작, 진행 표시, 색상 위계와 48px 접근성을 유지한다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".idea-lab__rack")).toHaveCount(0);
  await expect(page.getByText("지금 채울 카드", { exact: false })).toHaveCount(0);
  await expect(page.getByText("오늘 해볼까", { exact: true })).toHaveCount(1);

  const progress = page.getByRole("progressbar", { name: "아이디어 카드 완성도" });
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator(".idea-lab__progress-segments span")).toHaveCount(4);
  await expect(page.locator(".idea-lab__appbar-meta")).toHaveCount(0);
  await expect(page.locator(".idea-lab__ghost-box")).toHaveCount(0);
  await expect(page.locator(".idea-lab__deck-prompt")).toHaveCount(0);
  await expect(page.getByText("네 장을 조합하면 바로 만들 수 있는 아이디어가 완성돼요.", { exact: true })).toBeVisible();
  const guidePlacement = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".idea-lab__appbar")!;
    const active = document.querySelector<HTMLElement>(".idea-lab__slot.is-carousel-active")!;
    const progress = document.querySelector<HTMLElement>(".idea-lab__progress-dock")!;
    const deck = document.querySelector<HTMLElement>(".idea-lab__deck")!;
    const activeRect = active.getBoundingClientRect();
    return {
      headerAboveCards: header.getBoundingClientRect().bottom <= activeRect.top,
      progressBelowCards: progress.getBoundingClientRect().top >= activeRect.bottom,
      progressAboveDeck: progress.getBoundingClientRect().bottom <= deck.getBoundingClientRect().top,
      activeCenterDelta: Math.abs(activeRect.top + activeRect.height / 2 - window.innerHeight / 2),
    };
  });
  expect(guidePlacement).toEqual({
    headerAboveCards: true,
    progressBelowCards: true,
    progressAboveDeck: true,
    activeCenterDelta: expect.any(Number),
  });
  expect(guidePlacement.activeCenterDelta).toBeLessThanOrEqual(2);

  const autoFill = page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true });
  await expect(autoFill).toHaveCount(0);
  await page.locator(".idea-lab__slot.is-carousel-active .idea-lab__card-frame button").click();
  await expect(autoFill).toHaveCount(0);

  const deckLayer = await page.locator(".idea-lab__deck").evaluate((deck) =>
    Number(getComputedStyle(deck).zIndex));
  expect(deckLayer).toBeGreaterThan(0);

  const navTargets = await page.locator("nav button").evaluateAll((buttons) =>
    buttons.map((button) => ({
      height: button.getBoundingClientRect().height,
      width: button.getBoundingClientRect().width,
    })));
  expect(navTargets).toHaveLength(4);
  for (const target of navTargets) {
    expect(target.height).toBeGreaterThanOrEqual(48);
    expect(target.width).toBeGreaterThanOrEqual(48);
  }
  await expect(page.getByRole("button", { name: "아이디어 만들기", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "받은 응원", exact: true })).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Tab");
  const focusState = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement;
    const style = getComputedStyle(active);
    return { height: active.getBoundingClientRect().height, outline: style.outlineStyle };
  });
  expect(focusState.height).toBeGreaterThanOrEqual(48);
  expect(focusState.outline).toBe("solid");

  const cardColors = await page.locator(".idea-lab__slot").evaluateAll((slots) =>
    slots.map((slot) => {
      const label = slot.querySelector<HTMLElement>(".idea-lab__slot-label")!;
      const face = [...slot.querySelectorAll<HTMLElement>("button div")]
        .find((element) => element.style.backfaceVisibility === "hidden" && element.style.borderColor);
      return { label: getComputedStyle(label).color, faceBorder: face?.style.borderColor ?? "" };
    }));
  expect(new Set(cardColors.map((item) => item.label)).size).toBe(4);
  expect(new Set(cardColors.map((item) => item.faceBorder).filter(Boolean)))
    .toEqual(new Set(["rgba(255, 255, 255, 0.16)"]));

  await drawAll(page);
  await expect(page.locator(".idea-lab__appbar.is-guide")).toHaveCount(0);
  await expect(progress).toHaveCount(0);
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
  await expect(page.getByText("카드 눌러 교체", { exact: true })).toHaveCount(0);
  await expect(page.locator(".idea-lab__idea-preview")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /결과 자세히 보기|4장 다시 뽑기/ })).toHaveCount(0);
  const redraw = page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true });
  await expect(redraw).toBeVisible();
  expect(await redraw.evaluate((button) => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
});

test("다시 뽑기 취향 질문은 작은 화면에서도 한 문항만 묻고 한 번에 끝난다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await drawAll(page);
  await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();

  const tasteStage = page.locator(".idea-lab__stage--taste");
  await expect(tasteStage).toBeVisible();
  await expect(tasteStage).toHaveAttribute("data-question-id", "audience");
  await expect(page.getByRole("progressbar", { name: "취향 조사 진행" })).toHaveCount(0);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(tasteStage.locator(".idea-lab__taste-choice")).toHaveCount(3);

  const geometry = await tasteStage.evaluate((stage) => {
    const choices = [...stage.querySelectorAll<HTMLElement>(".idea-lab__taste-choice")]
      .map((choice) => choice.getBoundingClientRect());
    return {
      stageOverflow: stage.scrollHeight - stage.clientHeight,
      documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
      stacked: choices.length === 3
        && choices.slice(1).every((choice, index) => choice.top >= choices[index].bottom),
      minChoiceHeight: Math.min(...choices.map((choice) => choice.height)),
    };
  });
  expect(geometry).toEqual({
    stageOverflow: 0,
    documentOverflow: 0,
    stacked: true,
    minChoiceHeight: expect.any(Number),
  });
  expect(geometry.minChoiceHeight).toBeGreaterThanOrEqual(62);

  await tasteStage.locator(".idea-lab__taste-choice").first().click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
  await expect(page.locator(".idea-lab__stage--taste")).toHaveCount(0);
});

test("T24: 단계 문구가 카드와 함께 바뀌고 네 번째 카드 뒤 결과로 바로 넘어간다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const drawLabels = ["검증된 원본", "돈 낼 사람", "필요한 순간", "한 끗 변화"] as const;

  const expected = [
    ["0 / 4", "오늘 만들 아이디어를 한 장씩 뽑아보세요", "네 장을 조합하면 바로 만들 수 있는 아이디어가 완성돼요."],
    ["1 / 4", "누가 돈을 낼까요?", "다음 카드를 뽑아 돈 낼 사람을 정해보세요."],
    ["2 / 4", "언제 이 앱이 필요할까요?", "다음 카드를 뽑아 필요한 순간을 정해보세요."],
    ["3 / 4", "무엇을 하나 바꿀까요?", "마지막 카드를 뽑아 한 끗 변화를 정해보세요."],
  ] as const;

  let baselineLayout: { headerHeight: number; slotsTop: number; deckTop: number } | null = null;
  for (let index = 0; index < expected.length; index += 1) {
    const [progressText, heading, description] = expected[index];
    const order = await page.locator(".idea-lab__stage--draw").evaluate((stage) => {
      const header = stage.querySelector(".idea-lab__appbar")!;
      const title = header.querySelector(".idea-lab__appbar-title");
      const copy = header.querySelector(".idea-lab__appbar-description");
      const progress = stage.querySelector('[role="progressbar"]') as HTMLElement | null;
      const slots = stage.querySelector(".idea-lab__slots")!;
      const active = stage.querySelector(".idea-lab__slot.is-carousel-active")!;
      const deck = stage.querySelector(".idea-lab__deck")!;
      const headerOrder = [title, copy].map((node) => node ? [...header.querySelectorAll("*")].indexOf(node) : -1);
      return {
        headerOrder,
        progressBelowCards: Boolean(progress && progress.getBoundingClientRect().top >= active.getBoundingClientRect().bottom),
        layout: {
          headerHeight: header.getBoundingClientRect().height,
          slotsTop: slots.getBoundingClientRect().top,
          deckTop: deck.getBoundingClientRect().top,
        },
      };
    });
    expect(order.headerOrder[0]).toBeLessThan(order.headerOrder[1]);
    expect(order.progressBelowCards).toBe(true);
    if (!baselineLayout) {
      baselineLayout = order.layout;
    } else {
      expect(Math.abs(order.layout.headerHeight - baselineLayout.headerHeight)).toBeLessThanOrEqual(1);
      expect(Math.abs(order.layout.slotsTop - baselineLayout.slotsTop)).toBeLessThanOrEqual(1);
      expect(Math.abs(order.layout.deckTop - baselineLayout.deckTop)).toBeLessThanOrEqual(1);
    }
    await expect(page.getByRole("progressbar", { name: "아이디어 카드 완성도" })).toHaveAttribute("aria-valuetext", progressText);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText(description, { exact: true })).toBeVisible();

    await page.getByRole("button", {
      name: `${drawLabels[index]} 카드 뽑기`,
      exact: true,
    }).click();
  }

  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
  await expect(page.getByRole("heading", { name: "아이디어가 완성됐어요", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /결과 자세히 보기/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true })).toBeVisible();
  await expect(page.locator(".idea-lab__stage--result .idea-lab__stage-top")).toHaveCount(0);
});

test("T25: 완성 시 네 카드가 모여 결과 표면으로 이어진 뒤 결과가 열린다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await page.evaluate(() => {
    const state = window as typeof window & {
      __ideaCompletionTrace?: Array<{
        phase: string;
        title: string;
        descriptionCount: number;
        previewCount: number;
        ctaButtonCount: number;
        visibleCards: number;
        glowAnimationName: string;
        glowAnimationDelay: string;
        handoffSourceCount: number;
        fullScreenFlashAnimation: string;
      }>;
    };
    state.__ideaCompletionTrace = [];
    const capture = () => {
      window.requestAnimationFrame(() => {
        const stage = document.querySelector<HTMLElement>(".idea-lab__stage--draw.is-completing");
        if (!stage) return;
        const phase = stage.dataset.completionPhase ?? "gather";
        if (state.__ideaCompletionTrace!.some((entry) => entry.phase === phase)) return;
        const cards = [...stage.querySelectorAll<HTMLElement>(".idea-lab__slot")];
        const glow = cards[0] ? getComputedStyle(cards[0], "::after") : null;
        state.__ideaCompletionTrace!.push({
          phase,
          title: stage.querySelector<HTMLElement>(".idea-lab__appbar-title")?.textContent?.trim() ?? "",
          descriptionCount: stage.querySelectorAll(".idea-lab__appbar-description").length,
          previewCount: stage.querySelectorAll(".idea-lab__idea-preview").length,
          ctaButtonCount: stage.querySelectorAll(".idea-lab__cta-bar button").length,
          visibleCards: cards.filter((card) => getComputedStyle(card).visibility === "visible").length,
          glowAnimationName: glow?.animationName ?? "",
          glowAnimationDelay: glow?.animationDelay ?? "",
          handoffSourceCount: stage.querySelectorAll(".idea-lab__slot.is-handoff-source").length,
          fullScreenFlashAnimation: getComputedStyle(stage, "::after").animationName,
        });
      });
    };
    const observer = new MutationObserver(capture);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
  });

  for (const label of ["검증된 원본", "돈 낼 사람", "필요한 순간", "한 끗 변화"]) {
    await page.getByRole("button", { name: `${label} 카드 뽑기`, exact: true }).click();
  }
  const resultStage = page.locator(".idea-lab__stage--result");
  await expect(resultStage).toBeVisible();
  await expect(resultStage.locator(".idea-lab__result-hook")).toBeFocused();
  await expect(resultStage).toHaveClass(/is-from-handoff/);
  await expect(resultStage).not.toHaveAttribute("data-anim");
  const resultReveal = await resultStage.evaluate((stage) => {
    const selectors = [
      ".idea-lab__result-summary",
      ".idea-lab__locked-details",
      ".idea-lab__unlock-guide",
      ".idea-lab__cta-bar",
    ];
    return selectors.map((selector) => {
      const style = getComputedStyle(stage.querySelector<HTMLElement>(selector)!);
      return {
        name: style.animationName,
        delay: Number.parseFloat(style.animationDelay),
        duration: Number.parseFloat(style.animationDuration),
      };
    });
  });
  const sharedHandoff = await resultStage.evaluate((stage) => stage.classList.contains("is-shared-handoff"));
  if (sharedHandoff) {
    expect(resultReveal[0].name).toBe("none");
    expect(resultReveal.slice(1).every((motion) => motion.name.includes("idea-result-content-in"))).toBe(true);
    expect(resultReveal.slice(1).map((motion) => motion.delay)).toEqual([0.06, 0.12, 0.18]);
    await expect(resultStage.locator(".idea-lab__result-summary")).toHaveCSS(
      "view-transition-name",
      "idea-result-card",
    );
  } else {
    expect(resultReveal.every((motion) => motion.name.includes("idea-result-content-in"))).toBe(true);
    expect(resultReveal.map((motion) => motion.delay)).toEqual([0.02, 0.06, 0.12, 0.18]);
  }
  expect(resultReveal.slice(1).every((motion) => motion.duration >= 0.18)).toBe(true);

  const trace = await page.evaluate(() =>
    (window as typeof window & {
      __ideaCompletionTrace?: Array<{
        phase: string;
        title: string;
        descriptionCount: number;
        previewCount: number;
        ctaButtonCount: number;
        visibleCards: number;
        glowAnimationName: string;
        glowAnimationDelay: string;
        handoffSourceCount: number;
        fullScreenFlashAnimation: string;
      }>;
    }).__ideaCompletionTrace ?? []);
  expect(trace.map((entry) => entry.phase)).toEqual([
    "gather",
    "settle",
    "glow",
    "focus",
    "breathe",
  ]);
  for (const entry of trace) {
    expect(entry.title).toBe("아이디어가 완성됐어요");
    expect(entry.descriptionCount).toBe(0);
    expect(entry.previewCount).toBe(0);
    expect(entry.ctaButtonCount).toBe(0);
    expect(entry.visibleCards).toBe(4);
    expect(entry.handoffSourceCount).toBe(1);
    expect(entry.fullScreenFlashAnimation).toBe("none");
  }
  expect(trace[0].glowAnimationName).toBe("none");
  expect(trace[1].glowAnimationName).toBe("none");
  expect(trace[2].glowAnimationName).toContain("idea-card-white-glow");
  expect(trace[2].glowAnimationDelay).toBe("0s");
});

for (const viewport of viewports) {
  test(`Scenario 15: ${viewport.width}×${viewport.height} — 모바일 컬럼 중앙 정렬, 뽑기 스테이지 무스크롤, 결과 전환`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install({ time: FIXED_NOW });
    await page.goto("/");

    // 모든 해상도에서 앱은 하나의 모바일 컬럼(≤440px)으로 중앙 정렬된다.
    const shell = await page.evaluate((max) => {
      const main = document.querySelector<HTMLElement>("main")!.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainLeft: main.left,
        mainRight: main.right,
        mainWidth: main.width,
        expectedWidth: Math.min(window.innerWidth, max),
      };
    }, COLUMN_MAX);
    expect(shell.scrollWidth).toBeLessThanOrEqual(shell.viewportWidth + 1);
    expect(shell.mainWidth).toBeLessThanOrEqual(COLUMN_MAX + 1);
    expect(Math.abs(shell.mainWidth - shell.expectedWidth)).toBeLessThan(2);
    // 중앙 정렬: 좌우 여백이 균등하다.
    expect(Math.abs(shell.mainLeft - (shell.viewportWidth - shell.mainRight))).toBeLessThan(2);

    // A1 뽑기 스테이지: 중앙 카드와 다음 카드 미리보기가 세로 스크롤 없이 한 화면에 들어온다.
    const draw = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>(".idea-lab__slots")!.getBoundingClientRect();
      const slots = [...document.querySelectorAll<HTMLElement>(".idea-lab__slot")].map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          position: element.dataset.carouselPosition,
          visibility: getComputedStyle(element).visibility,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          visibleWidth: Math.max(0, Math.min(rect.right, track.right) - Math.max(rect.left, track.left)),
        };
      });
      const heading = document.querySelector<HTMLElement>(".idea-lab__appbar-title")!.getBoundingClientRect();
      const activeLabel = document.querySelector<HTMLElement>(".idea-lab__slot.is-carousel-active .idea-lab__slot-label")!.getBoundingClientRect();
      const progress = document.querySelector<HTMLElement>(".idea-lab__progress-dock")!.getBoundingClientRect();
      return {
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
        headingBottom: heading.bottom,
        activeLabelTop: activeLabel.top,
        progressBottom: progress.bottom,
        slots,
      };
    });
    expect(draw.scrollHeight).toBeLessThanOrEqual(draw.clientHeight + 1);
    expect(draw.activeLabelTop).toBeGreaterThanOrEqual(draw.headingBottom);
    expect(draw.progressBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(draw.slots).toHaveLength(4);
    const active = draw.slots.find((slot) => slot.position === "active")!;
    const next = draw.slots.find((slot) => slot.position === "next")!;
    expect(active.visibility).toBe("visible");
    expect(active.visibleWidth).toBeGreaterThan(active.width - 2);
    expect(next.visibility).toBe("visible");
    expect(next.visibleWidth).toBeGreaterThanOrEqual(36);
    expect(next.visibleWidth).toBeLessThanOrEqual(60);
    expect(draw.slots.filter((slot) => slot.visibility === "hidden")).toHaveLength(2);

    // A2 결과 스테이지로 전환 — 슬롯은 사라지고 결과 패널이 컬럼 안에 들어온다.
    await drawAll(page);
    await goResult(page);
    const result = await page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(".idea-lab__result")!.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        slots: document.querySelectorAll(".idea-lab__slot").length,
        panel: { left: panel.left, right: panel.right, width: panel.width },
      };
    });
    expect(result.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
    expect(result.slots).toBe(0);
    expect(result.panel.width).toBeGreaterThan(0);
    expect(result.panel.left).toBeGreaterThanOrEqual(-1);
    expect(result.panel.right).toBeLessThanOrEqual(viewport.width + 1);

    const longPraise = "작은 화면부터 시작하면서도 사용자가 무엇을 넣고 어떤 결과를 받는지 아주 구체적으로 보여준 점이 정말 좋았어요. ".repeat(4).slice(0, 280);
    await setPraiseFixture(page, [longPraise, "내일 공개될 실제 두 번째 칭찬"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);

    const flip = page.locator("section[data-state='filled'] button[aria-pressed]");
    await expect(flip).toHaveAccessibleName("응원 카드 뒤집어 내용 확인하기");
    await flip.click();
    await expect(flip).toHaveAttribute("aria-pressed", "true");
    const layout = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>("section[data-state='filled'] button[aria-pressed='true']")!.getBoundingClientRect();
      const message = document.querySelector<HTMLElement>("[aria-hidden='false'] strong")!.getBoundingClientRect();
      const nextNotice = [...document.querySelectorAll<HTMLElement>("[role='status']")]
        .find((element) => element.textContent?.includes("다음 응원은"))!
        .getBoundingClientRect();
      return {
        card: { top: card.top, right: card.right, bottom: card.bottom, left: card.left },
        message: { top: message.top, right: message.right, bottom: message.bottom, left: message.left },
        nextNotice: { top: nextNotice.top, bottom: nextNotice.bottom },
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(viewport.width);
    expect(layout.message.left).toBeGreaterThanOrEqual(layout.card.left);
    expect(layout.message.right).toBeLessThanOrEqual(layout.card.right);
    expect(layout.message.top).toBeGreaterThanOrEqual(layout.card.top);
    expect(layout.message.bottom).toBeLessThanOrEqual(layout.card.bottom);
    expect(layout.nextNotice.top).toBeGreaterThanOrEqual(layout.card.bottom);
  });
}

test("Scenario 15b: 공유 뒤 같은 결과 화면에서 상세와 제작 자료가 한 열로 열린다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installShareMock(page, "kakao");
  await page.goto("/");
  await drawAll(page);
  await goResult(page);

  const beforeMainWidth = await page.locator("main").evaluate((main) =>
    main.getBoundingClientRect().width);

  await page.getByRole("button", {
    name: "공유하고 결과 보기",
    exact: true,
  }).click();
  await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();
  await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");

  const desktop = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("main")!.getBoundingClientRect();
    const details = document.querySelector<HTMLElement>(".idea-lab__locked-details")!
      .getBoundingClientRect();
    const artifacts = [...document.querySelectorAll<HTMLElement>(".idea-lab__artifact")]
      .map((element) => element.getBoundingClientRect());
    const prompt = document.querySelector<HTMLElement>(".idea-lab__prompt")!.getBoundingClientRect();
    const unlocked = document.querySelector<HTMLElement>(".idea-lab__unlocked-content")!;
    return {
      mainWidth: main.width,
      detailsBottom: details.bottom,
      firstArtifact: { top: artifacts[0].top, bottom: artifacts[0].bottom },
      secondArtifact: { top: artifacts[1].top, bottom: artifacts[1].bottom },
      promptTop: prompt.top,
      stageCount: document.querySelectorAll(".idea-lab__stage--result").length,
      unlockedColumns: getComputedStyle(unlocked).gridTemplateColumns,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  expect(Math.abs(desktop.mainWidth - beforeMainWidth)).toBeLessThanOrEqual(1);
  expect(desktop.detailsBottom).toBeLessThanOrEqual(desktop.firstArtifact.top);
  expect(desktop.secondArtifact.top).toBeGreaterThanOrEqual(desktop.firstArtifact.bottom);
  expect(desktop.promptTop).toBeGreaterThanOrEqual(desktop.secondArtifact.bottom);
  expect(desktop.stageCount).toBe(1);
  expect(desktop.unlockedColumns.split(" ").length).toBe(1);
  expect(desktop.scrollWidth).toBeLessThanOrEqual(1281);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>("main")!.getBoundingClientRect();
    const artifacts = [...document.querySelectorAll<HTMLElement>(".idea-lab__artifact")]
      .map((element) => element.getBoundingClientRect());
    return {
      mainWidth: main.width,
      firstBottom: artifacts[0].bottom,
      secondTop: artifacts[1].top,
      stageCount: document.querySelectorAll(".idea-lab__stage--result").length,
      unlockedColumns: getComputedStyle(
        document.querySelector<HTMLElement>(".idea-lab__unlocked-content")!,
      ).gridTemplateColumns,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  expect(mobile.mainWidth).toBeLessThanOrEqual(391);
  expect(mobile.secondTop).toBeGreaterThanOrEqual(mobile.firstBottom);
  expect(mobile.stageCount).toBe(1);
  expect(mobile.unlockedColumns.split(" ").length).toBe(1);
  expect(mobile.scrollWidth).toBeLessThanOrEqual(391);
});

test("Scenario 16: reduced motion에서 회전·비행·3D 전환을 제거해도 기능은 동작한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: FIXED_NOW });
  await page.goto("/");

  await expect(page.locator(".fd-wheel")).toHaveCSS("animation-name", "none");
  const readablePauseMs = Number(
    await page.locator(".idea-lab__stage--draw").getAttribute("data-readable-pause-ms"),
  );
  const startedAt = Date.now();
  await drawAll(page);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(readablePauseMs * 4);
  await expect(page.locator(".idea-lab__flight")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /네 장을 뽑으면 결과가 나와요/ })).toHaveCount(0);

  await setPraiseFixture(page, ["움직임을 줄여도 이 칭찬은 그대로 읽을 수 있어요."]);
  const flip = page.locator("section[data-state='filled'] button[aria-pressed]");
  await expect(flip).toHaveAccessibleName("응원 카드 뒤집어 내용 확인하기");
  await expect(flip.locator(":scope > span")).toHaveCSS("transition-duration", "0s");
  await flip.click();
  await expect(flip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("움직임을 줄여도 이 칭찬은 그대로 읽을 수 있어요.", { exact: true })).toBeVisible();
});

const walkFiles = (root: string): string[] => fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(root, entry.name);
  return entry.isDirectory() ? walkFiles(absolute) : [absolute];
});

test("Scenario 17: 폐기된 PixelCampfire 구현은 src에서 사라지고 레퍼런스만 archive/research에 남는다", async () => {
  const projectRoot = path.resolve(__dirname, "../..");
  // 제품 카피의 일반적인 "모닥불" 비유가 아니라 폐기된 구현 식별자만 막는다.
  const forbidden = /\bPixelCampfire\b|pixel-campfire/i;
  const sourceMatches = walkFiles(path.join(projectRoot, "src"))
    .filter((file) => /\.(?:ts|tsx|css|json)$/.test(file))
    .filter((file) => forbidden.test(fs.readFileSync(file, "utf8")));
  expect(sourceMatches).toEqual([]);

  const devRoot = path.join(projectRoot, "docs/dev");
  const misplacedNamedReferences = walkFiles(devRoot)
    .filter((file) => /(?:pixel|campfire|모닥불)/i.test(path.basename(file)))
    .filter((file) => !file.startsWith(path.join(devRoot, "archive") + path.sep));
  expect(misplacedNamedReferences).toEqual([]);

  const misplacedAnalysisPages = walkFiles(devRoot)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => !file.startsWith(path.join(devRoot, "archive") + path.sep))
    .filter((file) => /Pixel Campfire · layer analysis|PixelCampfire/.test(fs.readFileSync(file, "utf8")));
  expect(misplacedAnalysisPages).toEqual([]);

  const pixelSources = walkFiles(projectRoot)
    .filter((file) => /\.(?:scss|sass)$/.test(file))
    .filter((file) => /(?:pixel|campfire|모닥불)/i.test(file));
  expect(pixelSources.every((file) => file.startsWith(path.join(projectRoot, "docs/research") + path.sep))).toBe(true);
  expect(fs.existsSync(path.join(devRoot, "archive/pixel-campfire-analysis.html"))).toBe(true);
});
