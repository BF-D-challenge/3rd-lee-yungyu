import { expect, test } from "@playwright/test";
import { trackedEvents } from "./helpers";

test("로그인 스플래시는 인증 전 카드 뽑기를 막고 인증 후 메인 앱을 연다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    localStorage.removeItem("oneul:demo-auth");
  });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "오늘 뭐 만들지. 카드에게 물어보세요." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google로 카드 뽑기", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true })).toHaveCount(0);
  const deckPreview = page.locator(".deck-preview");
  const fakeCursor = page.locator(".deck-preview__cursor");
  await expect(deckPreview).toHaveAttribute("data-auto-preview", "playing");
  await expect(page.locator('.fd-host[data-preview-only="true"]')).toHaveCount(1);
  await expect.poll(() => page.locator('.fd-card[data-focus="active"]').count()).toBe(1);
  const maskImage = await page.locator(".deck-preview__fade").evaluate(
    (element) => getComputedStyle(element).maskImage,
  );
  expect(maskImage).toContain("linear-gradient");
  const previewBounds = await deckPreview.boundingBox();
  const focusedCardBounds = await page.locator('.fd-card[data-focus="active"] .pull').boundingBox();
  expect(previewBounds).not.toBeNull();
  expect(focusedCardBounds).not.toBeNull();
  expect(focusedCardBounds!.y + focusedCardBounds!.height)
    .toBeLessThanOrEqual(previewBounds!.y + previewBounds!.height + 1);
  const firstCursorTransform = await fakeCursor.evaluate((element) => getComputedStyle(element).transform);
  await expect.poll(
    () => fakeCursor.evaluate((element) => getComputedStyle(element).transform),
  ).not.toBe(firstCursorTransform);

  await deckPreview.hover({ position: { x: 78, y: 96 } });
  await expect(deckPreview).toHaveAttribute("data-auto-preview", "paused");
  await expect(fakeCursor).toHaveCSS("opacity", "0");
  const splashGeometry = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  expect(splashGeometry).toEqual({ width: 320, height: 568 });

  await page.getByRole("button", { name: "Google로 카드 뽑기", exact: true }).click();

  await expect(page.getByRole("button", { name: "내 계정", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true })).toBeVisible();
  const authEvents = (await trackedEvents(page)).filter((event) =>
    event.event === "auth_prompt" || event.event === "auth_done");
  expect(authEvents.map((event) => event.event)).toEqual(["auth_prompt", "auth_done"]);
  expect(authEvents[1]).toMatchObject({ context: "creator", method: "demo" });

  await page.getByRole("button", { name: "내 계정", exact: true }).click();
  await expect(page.getByRole("heading", { name: "로그인되어 있어요" })).toBeVisible();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page.getByRole("heading", { name: "오늘 뭐 만들지. 카드에게 물어보세요." })).toBeVisible();
  await expect(page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true })).toHaveCount(0);
});

test("동작 줄이기 환경에서는 자동 커서를 숨기고 덱 포커스를 정지한다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.removeItem("oneul:demo-auth");
  });
  await page.goto("/");

  const deckPreview = page.locator(".deck-preview");
  await expect(deckPreview).toHaveAttribute("data-auto-preview", "reduced");
  await expect(page.locator(".deck-preview__cursor")).toHaveCSS("display", "none");
  await expect.poll(() => page.locator('.fd-card[data-focus="active"]').count()).toBe(1);
});

test("200% 텍스트 확대에서도 로그인과 계정 메뉴를 스크롤해 끝까지 조작한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.removeItem("oneul:demo-auth");
  });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const login = page.getByRole("button", { name: "Google로 카드 뽑기", exact: true });
  await login.scrollIntoViewIfNeeded();
  await expect(login).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await login.click();

  const account = page.getByRole("button", { name: "내 계정", exact: true });
  await account.scrollIntoViewIfNeeded();
  await account.click();
  const logout = page.getByRole("button", { name: "로그아웃", exact: true });
  await logout.scrollIntoViewIfNeeded();
  await expect(logout).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
