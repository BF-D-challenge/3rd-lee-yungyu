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
  await page.getByRole("button", { name: /네 장으로 결과 보기/ }).click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

test("Scenario 14: Primary 단일색과 네 분류 의미색, dark color scheme을 유지한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");

  const drawButton = page.getByRole("button", { name: /4장 한 번에 뽑기/ });
  await expect(drawButton).toHaveCSS("background-color", PRIMARY_RGB);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  // 네 분류 의미색은 뽑기 스테이지의 슬롯 라벨에서 확인한다(결과 스테이지엔 슬롯이 없다).
  const semanticColors = await page.locator(".idea-lab__slot-label").evaluateAll((labels) =>
    labels.map((label) => getComputedStyle(label).color));
  expect(new Set(semanticColors).size).toBe(4);
  expect(semanticColors).not.toContain(PRIMARY_RGB);

  await drawAll(page);
  await goResult(page);
  await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
  const shareButton = page.getByRole("button", { name: /링크 공유하고 전체 문구 열기/ });
  await expect(shareButton).toHaveCSS("background-color", PRIMARY_RGB);

  const request = makePraiseRequest();
  await page.goto(`/praise/${request.slug}`);
  // Flow B(칭찬 수신)도 같은 Primary 팔레트를 쓴다 — intro → 카드 선택 → 공개 설정 → 전송 CTA 순.
  const introCta = page.getByRole("button", { name: "익명 응원 보내기" });
  if (await introCta.count()) await introCta.first().click();
  await page.getByRole("button", { name: /시작부터 구체적이라/ }).click();
  const nextCta = page.getByRole("button", { name: "다음", exact: true });
  if (await nextCta.count()) await nextCta.first().click();
  await expect(page.getByRole("button", { name: "이 칭찬 카드 보내기" })).toHaveCSS(
    "background-color",
    PRIMARY_RGB,
  );
});

const viewports = [
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1000, height: 1000 },
  { width: 1440, height: 1000 },
] as const;

const COLUMN_MAX = 440;

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

    // A1 뽑기 스테이지: 2×2 슬롯이 세로 페이지 스크롤 없이 한 화면에 들어온다.
    const draw = await page.evaluate(() => {
      const slots = [...document.querySelectorAll<HTMLElement>(".idea-lab__slot")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, width: rect.width, height: rect.height };
      });
      return {
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
        slots,
      };
    });
    expect(draw.scrollHeight).toBeLessThanOrEqual(draw.clientHeight + 1);
    expect(draw.slots).toHaveLength(4);
    for (const rect of draw.slots) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
      expect(rect.left).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
    }
    // 2×2 그리드: 1·2행 정렬, 3·4는 아래 행.
    expect(Math.abs(draw.slots[0].top - draw.slots[1].top)).toBeLessThan(3);
    expect(draw.slots[2].top).toBeGreaterThan(draw.slots[0].top + 20);

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

    const flip = page.locator("button[aria-pressed]");
    await expect(flip).toHaveAccessibleName("오늘의 칭찬 카드 뒤집기");
    await flip.click();
    await expect(flip).toHaveAttribute("aria-pressed", "true");
    const layout = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>("button[aria-pressed='true']")!.getBoundingClientRect();
      const message = document.querySelector<HTMLElement>("[aria-hidden='false'] strong")!.getBoundingClientRect();
      const action = [...document.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent?.includes("다음 칭찬 미리 보기"))!
        .getBoundingClientRect();
      return {
        card: { top: card.top, right: card.right, bottom: card.bottom, left: card.left },
        message: { top: message.top, right: message.right, bottom: message.bottom, left: message.left },
        action: { top: action.top, bottom: action.bottom },
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(viewport.width);
    expect(layout.message.left).toBeGreaterThanOrEqual(layout.card.left);
    expect(layout.message.right).toBeLessThanOrEqual(layout.card.right);
    expect(layout.message.top).toBeGreaterThanOrEqual(layout.card.top);
    expect(layout.message.bottom).toBeLessThanOrEqual(layout.card.bottom);
    expect(layout.action.top).toBeGreaterThanOrEqual(layout.card.bottom);
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
  const flip = page.locator("button[aria-pressed]");
  await expect(flip).toHaveAccessibleName("오늘의 칭찬 카드 뒤집기");
  await expect(flip.locator(":scope > span")).toHaveCSS("transition-duration", "0s");
  await flip.click();
  await expect(flip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("움직임을 줄여도 이 칭찬은 그대로 읽을 수 있어요.")).toBeVisible();
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
