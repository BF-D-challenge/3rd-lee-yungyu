import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  FIXED_NOW,
  drawAll,
  makePraiseRequest,
  openPraiseTab,
  praiseVote,
} from "./helpers";

const PRIMARY_RGB = "rgb(255, 68, 88)";

async function setPraiseFixture(page: Page, messages: string[]) {
  const request = makePraiseRequest();
  await page.evaluate(({ saved, slug, votes }) => {
    localStorage.clear();
    sessionStorage.clear();
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
  await page.getByRole("button", { name: /결과 자세히 보기/ }).click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

test("Scenario 14: Primary 단일색과 네 분류 의미색, dark color scheme을 유지한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");

  const drawButton = page.getByRole("button", { name: "4장 자동 채우기", exact: true });
  await expect(drawButton).not.toHaveCSS("background-color", PRIMARY_RGB);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  // 네 분류 의미색은 뽑기 스테이지의 슬롯 라벨에서 확인한다(결과 스테이지엔 슬롯이 없다).
  const semanticColors = await page.locator(".idea-lab__slot-label").evaluateAll((labels) =>
    labels.map((label) => getComputedStyle(label).color));
  expect(new Set(semanticColors).size).toBe(4);
  expect(semanticColors).not.toContain(PRIMARY_RGB);

  await drawAll(page);
  await goResult(page);
  await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
  const shareButton = page.getByRole("button", { name: /친구에게 알리고 시작하기/ });
  await expect(shareButton).toHaveCSS("background-color", PRIMARY_RGB);

  const request = makePraiseRequest();
  await page.goto(`/praise/${request.slug}`);
  // Flow B(응원 수신)도 같은 Primary 팔레트를 쓴다 — 아이디어 확인 → 응원 선택 → 공개 설정 → 전송 CTA 순.
  await page.getByRole("button", { name: "반응 보내기", exact: true }).click();
  await page.getByRole("button", { name: "무슨 앱인지 바로 이해됐어요", exact: true }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("button", { name: "응원 카드 보내기", exact: true })).toHaveCSS(
    "background-color",
    PRIMARY_RGB,
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

  await drawAll(page);
  const filledRadii = await page.locator(".idea-lab__card-frame").evaluateAll((frames) => frames.map((frame) => {
    const button = frame.querySelector<HTMLButtonElement>("button")!;
    return (button.lastElementChild as HTMLElement).style.borderRadius;
  }));
  expect(filledRadii).toEqual(["8px", "8px", "8px", "8px"]);
  const textLimits = await page.locator(".idea-lab__card-frame").first().evaluate((frame) => ({
    title: frame.querySelector<HTMLElement>("strong")?.style.webkitLineClamp,
    detail: frame.querySelector<HTMLElement>("p")?.style.webkitLineClamp,
  }));
  expect(textLimits).toEqual({ title: "3", detail: "2" });
});

test("Step 3: 현재 빈칸을 채우면 다음 카드가 옆에서 중앙으로 들어온다", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 1020 });
  await page.goto("/");

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
  expect(initial[0].text).toContain("여기에 카드 놓기");
  for (const state of initial.slice(1)) {
    expect(state).toMatchObject({ current: false, borderStyle: "dashed" });
    expect(state.text).toContain("?");
  }

  await page.getByRole("button", { name: "검증된 원본 칸 채우기", exact: true }).click();
  await expect(page.locator(".fd-fly")).toHaveCount(1);
  await expect(page.locator("article.idea-lab__slot.is-filled")).toHaveCount(1);
  await expect(page.locator(".idea-lab__slot.is-carousel-active .idea-lab__slot-label")).toContainText("돈 낼 사람");
  await expect(page.locator(".idea-lab__slot.is-carousel-previous .idea-lab__slot-label")).toContainText("검증된 원본");
  const next = await readEmptyStates();
  expect(next[1]).toMatchObject({ current: true, borderStyle: "dashed" });
  expect(next[1].text).toContain("여기에 카드 놓기");

  const requestedSpacing = await page.evaluate(() => {
    const guide = document.querySelector<HTMLElement>(".idea-lab__appbar.is-guide")!;
    const ghost = guide.querySelector<HTMLElement>(".idea-lab__ghost-box")!;
    const badge = [...document.querySelectorAll<HTMLElement>(".idea-lab__slot.is-carousel-active button > span")]
      .find((element) => element.textContent?.trim() === "2")!;
    const guideStyle = getComputedStyle(guide);
    const ghostStyle = getComputedStyle(ghost);
    const badgeStyle = getComputedStyle(badge);
    return {
      guideBorderStyle: guideStyle.borderStyle,
      guideTextAlign: guideStyle.textAlign,
      ghostBorderStyle: ghostStyle.borderStyle,
      ghostMarginTop: Number.parseFloat(ghostStyle.marginTop),
      ghostMarginBottom: Number.parseFloat(ghostStyle.marginBottom),
      badgeTop: Number.parseFloat(badgeStyle.top),
      badgeLeft: Number.parseFloat(badgeStyle.left),
    };
  });
  expect(requestedSpacing).toEqual({
    guideBorderStyle: "solid",
    guideTextAlign: "center",
    ghostBorderStyle: "none",
    ghostMarginTop: 10,
    ghostMarginBottom: 0,
    badgeTop: 8,
    badgeLeft: 8,
  });
});

test("카드 덱: 위로 꺼낸 카드가 덱 경계에 잘리지 않는다", async ({ page }) => {
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
  await page.addStyleTag({ content: ".fd-card.is-clip-test{z-index:600!important}.fd-card.is-clip-test .pull{transform:translateY(-30px) scale(1.03)!important}" });
  await apex.evaluate((card) => card.classList.add("is-clip-test"));
  await page.waitForTimeout(350);

  const visibility = await apex.evaluate((card) => {
    const pull = card.querySelector<HTMLElement>(".pull")!;
    const pullRect = pull.getBoundingClientRect();
    const deckRect = document.querySelector<HTMLElement>(".idea-lab__deck")!.getBoundingClientRect();
    const stageRect = document.querySelector<HTMLElement>(".idea-lab__deck-stage")!.getBoundingClientRect();
    const hit = document.elementFromPoint(pullRect.left + pullRect.width / 2, pullRect.top + 2);
    return {
      risesAboveDeck: pullRect.top < deckRect.top,
      staysInsideStage: pullRect.top >= stageRect.top,
      visibleAtTop: !!hit && pull.contains(hit),
    };
  });
  expect(visibility).toEqual({ risesAboveDeck: true, staysInsideStage: true, visibleAtTop: true });
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
  const target = (await page.getByRole("button", { name: "검증된 원본 칸 채우기", exact: true }).boundingBox())!;

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
  const guide = page.locator(".idea-lab__appbar > .idea-lab__ghost-box");
  await expect(guide).toBeVisible();
  await expect(guide).toHaveText("카드를 끌어 빈칸에 놓거나 눌러 뽑으세요.");
  await expect(page.getByText("네 장의 카드를 조합해 오늘 시험할 아이디어를 만들어보세요.", { exact: true })).toHaveCount(0);
  await expect(page.locator(".idea-lab__stage--draw > .idea-lab__ghost-box")).toHaveCount(0);
  const guidePlacement = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".idea-lab__appbar")!;
    const guide = header.querySelector<HTMLElement>(":scope > .idea-lab__ghost-box")!;
    const slots = document.querySelector<HTMLElement>(".idea-lab__slots")!;
    return {
      insideHeader: header.contains(guide),
      aboveCards: guide.getBoundingClientRect().bottom <= slots.getBoundingClientRect().top,
    };
  });
  expect(guidePlacement).toEqual({ insideHeader: true, aboveCards: true });

  const autoFill = page.getByRole("button", { name: "4장 자동 채우기", exact: true });
  await expect(autoFill).not.toHaveCSS("background-color", PRIMARY_RGB);
  expect(await autoFill.evaluate((button) => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);

  const layers = await page.evaluate(() => ({
    deck: Number(getComputedStyle(document.querySelector<HTMLElement>(".idea-lab__deck")!).zIndex),
    cta: Number(getComputedStyle(document.querySelector<HTMLElement>(".idea-lab__cta-bar")!).zIndex),
  }));
  expect(layers.deck).toBeGreaterThan(layers.cta);

  const navTargets = await page.locator("nav button").evaluateAll((buttons) =>
    buttons.map((button) => ({
      height: button.getBoundingClientRect().height,
      width: button.getBoundingClientRect().width,
    })));
  expect(navTargets).toHaveLength(3);
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

  await drawAll(page);
  await expect(page.locator(".idea-lab__appbar.is-guide")).toHaveCount(0);
  await expect(progress).toHaveAttribute("aria-valuenow", "4");
  const completedProgress = await progress.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { width: rect.width, height: rect.height, overflow: style.overflow, clip: style.clip };
  });
  expect(completedProgress.width).toBeLessThanOrEqual(1);
  expect(completedProgress.height).toBeLessThanOrEqual(1);
  expect(completedProgress.overflow).toBe("hidden");
  expect(completedProgress.clip).not.toBe("auto");
  await expect(page.getByRole("heading", { name: "완성된 아이디어", exact: true })).toBeVisible();
  await expect(page.getByText("완성된 아이디어", { exact: true })).toHaveCount(1);
  await expect(page.getByText("카드 눌러 교체", { exact: true })).toBeVisible();
  const summaryLayout = await page.locator(".idea-lab__appbar.is-summary").evaluate((header) => {
    const style = getComputedStyle(header);
    const row = header.querySelector<HTMLElement>(".idea-lab__appbar-row")!;
    const preview = header.querySelector<HTMLElement>(".idea-lab__idea-preview")!;
    return {
      marginTop: parseFloat(style.marginTop),
      marginRight: parseFloat(style.marginRight),
      marginBottom: parseFloat(style.marginBottom),
      marginLeft: parseFloat(style.marginLeft),
      textAlign: style.textAlign,
      rowAlign: getComputedStyle(row).alignItems,
      previewAlign: getComputedStyle(preview).alignItems,
    };
  });
  expect(summaryLayout).toEqual({
    marginTop: 10,
    marginRight: 8,
    marginBottom: 18,
    marginLeft: 8,
    textAlign: "center",
    rowAlign: "center",
    previewAlign: "center",
  });
  await expect(page.locator(".idea-lab__uvp-head, .idea-lab__completion-message")).toHaveCount(0);
  const ideaPreview = page.locator(".idea-lab__idea-preview");
  await expect(ideaPreview).toBeVisible();
  await expect(page.locator(".idea-lab__appbar")).toContainText("완성된 아이디어");
  await expect(page.locator(".idea-lab__appbar > .idea-lab__ghost-box")).toHaveCount(0);
  await expect(ideaPreview.locator("strong")).not.toHaveText("");
  await expect(ideaPreview.locator("span")).not.toHaveText("");
  await expect(ideaPreview.locator("small")).toContainText("검수 원본");
  await expect(ideaPreview).toHaveCSS("white-space", "normal");
  expect(await ideaPreview.evaluate((line) => line.scrollWidth <= line.clientWidth + 1)).toBe(true);
  const resultPlacement = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".idea-lab__appbar")!;
    const result = document.querySelector<HTMLElement>(".idea-lab__appbar-result")!;
    const card = document.querySelector<HTMLElement>(".idea-lab__slot.is-carousel-active")!;
    return {
      resultInsideHeader: header.contains(result),
      resultAboveCard: result.getBoundingClientRect().bottom <= card.getBoundingClientRect().top,
    };
  });
  expect(resultPlacement).toEqual({ resultInsideHeader: true, resultAboveCard: true });
  const cardColors = await page.locator(".idea-lab__slot").evaluateAll((slots) =>
    slots.map((slot) => {
      const label = slot.querySelector<HTMLElement>(".idea-lab__slot-label")!;
      const face = [...slot.querySelectorAll<HTMLElement>("button div")]
        .find((element) => element.style.backfaceVisibility === "hidden" && element.style.borderColor);
      return { label: getComputedStyle(label).color, faceBorder: face?.style.borderColor ?? "" };
    }));
  expect(new Set(cardColors.map((item) => item.label)).size).toBe(4);
  expect(new Set(cardColors.map((item) => item.faceBorder))).toEqual(new Set(["rgba(255, 255, 255, 0.16)"]));
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
      return {
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
        headingBottom: heading.bottom,
        activeLabelTop: activeLabel.top,
        slots,
      };
    });
    expect(draw.scrollHeight).toBeLessThanOrEqual(draw.clientHeight + 1);
    expect(draw.activeLabelTop).toBeGreaterThanOrEqual(draw.headingBottom);
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

    // 뒤로가기 → 카드 상태 유지한 채 A1 복귀.
    await page.getByRole("button", { name: /카드 다시 보기/ }).click();
    await expect(page.locator("article.idea-lab__slot.is-filled")).toHaveCount(4);

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

test("Scenario 16: reduced motion에서 회전·비행·3D 전환을 제거해도 기능은 동작한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: FIXED_NOW });
  await page.goto("/");

  await expect(page.locator(".fd-wheel")).toHaveCSS("animation-name", "none");
  const startedAt = Date.now();
  await drawAll(page);
  expect(Date.now() - startedAt).toBeLessThan(1_500);
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

test("Scenario 17: 폐기된 모닥불 구현은 src에서 사라지고 레퍼런스만 archive/research에 남는다", async () => {
  const projectRoot = path.resolve(__dirname, "../..");
  const forbidden = /PixelCampfire|campfire|모닥불|유령|불꽃/;
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
