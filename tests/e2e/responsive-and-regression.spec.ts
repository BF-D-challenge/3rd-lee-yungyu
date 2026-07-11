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

test("Scenario 14: Primary 단일색과 네 분류 의미색, dark color scheme을 유지한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");

  const drawButton = page.getByRole("button", { name: /4장 한 번에 뽑기/ });
  await expect(drawButton).toHaveCSS("background-color", PRIMARY_RGB);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  await drawAll(page);
  const shareButton = page.getByRole("button", { name: /친구에게 물어보고 전체 열기/ });
  await expect(shareButton).toHaveCSS("background-color", PRIMARY_RGB);

  const semanticColors = await page.locator(".idea-lab__slot-label").evaluateAll((labels) =>
    labels.map((label) => getComputedStyle(label).color));
  expect(new Set(semanticColors).size).toBe(4);
  expect(semanticColors).not.toContain(PRIMARY_RGB);

  const request = makePraiseRequest();
  await page.goto(`/praise/${request.slug}`);
  // Flow B(칭찬 수신) UI는 병렬 개편 중 — intro 단계가 있으면 통과한 뒤 전송 CTA를 확인한다.
  const introCta = page.getByRole("button", { name: "익명 응원 보내기" });
  if (await introCta.count()) await introCta.first().click();
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

for (const viewport of viewports) {
  test(`Scenario 15: ${viewport.width}×${viewport.height}에서 잘림·가로 오버플로·CTA 겹침이 없다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install({ time: FIXED_NOW });
    await page.goto("/");
    await drawAll(page);

    const ideaLayout = await page.evaluate(() => {
      const slots = [...document.querySelectorAll<HTMLElement>(".idea-lab__slot")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, width: rect.width, height: rect.height };
      });
      const result = document.querySelector<HTMLElement>(".idea-lab__result")!.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        slots,
        result: { left: result.left, right: result.right, top: result.top, width: result.width, height: result.height },
      };
    });

    expect(ideaLayout.scrollWidth).toBeLessThanOrEqual(ideaLayout.viewportWidth);
    expect(ideaLayout.slots).toHaveLength(4);
    for (const rect of [...ideaLayout.slots, ideaLayout.result]) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
      expect(rect.left).toBeGreaterThanOrEqual(-1);
      expect(rect.right).toBeLessThanOrEqual(viewport.width + 1);
    }

    if (viewport.width <= 834) {
      expect(Math.abs(ideaLayout.slots[0].top - ideaLayout.slots[1].top)).toBeLessThan(3);
      expect(ideaLayout.slots[2].top).toBeGreaterThan(ideaLayout.slots[0].top + 20);
      expect(ideaLayout.result.top).toBeGreaterThan(ideaLayout.slots[2].top);
    } else {
      expect(Math.max(...ideaLayout.slots.map(({ top }) => top)) - Math.min(...ideaLayout.slots.map(({ top }) => top))).toBeLessThan(3);
      expect(Math.abs(ideaLayout.result.top - ideaLayout.slots[0].top)).toBeLessThan(80);
    }

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
