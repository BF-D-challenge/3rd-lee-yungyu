import { expect, test } from "@playwright/test";
import { drawAll, trackedEvents } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("oneul:demo-auth");
    localStorage.removeItem("oneul:demo-actor");
  });
});

test("익명 사용자는 로그인 없이 카드에 진입하고 로그인은 선택적으로 연다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const lab = page.getByRole("region", {
    name: "검증된 원본에서 시작하는 네 장 아이디어 제작기",
  });
  await expect(lab).toBeVisible();
  await expect(page.getByRole("button", {
    name: "검증된 원본 카드 뽑기",
    exact: true,
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "오늘 뭐 만들지. 카드에게 물어보세요.",
  })).toHaveCount(0);

  const account = page.getByRole("button", { name: "로그인", exact: true });
  await expect(account).toBeVisible();
  const entryEvents = await trackedEvents(page);
  expect(entryEvents.filter((event) => event.event === "idea_anonymous_home_viewed")).toHaveLength(1);
  expect(entryEvents.filter((event) => event.event === "idea_lab_viewed")).toHaveLength(1);

  await page.getByRole("button", {
    name: "검증된 원본 카드 뽑기",
    exact: true,
  }).click();
  const source = page.locator('article.idea-lab__slot[data-axis="source"]');
  await expect(source).not.toHaveAttribute("data-value", "");
  await drawAll(page);
  const result = page.locator(".idea-lab__result-summary");
  const combinationId = await result.getAttribute("data-combination-id");
  expect(combinationId).not.toBeNull();

  await account.click();
  await expect(page.getByRole("heading", { name: "필요할 때만 로그인하세요" })).toBeVisible();
  await expect(page.getByText(
    "지금 결과와 받은 응원은 로그인 없이 이 기기에 남아요. 로그인하면 취향과 이미 계정에 연결된 카드를 이어볼 수 있어요.",
    { exact: true },
  )).toBeVisible();
  await expect(page.getByRole("button", { name: "Google로 시작하기", exact: true })).toBeVisible();
  await expect(result).toHaveAttribute("data-combination-id", combinationId!);

  await page.getByRole("button", { name: "Google로 시작하기", exact: true }).click();
  await expect(page.getByRole("button", { name: "내 계정", exact: true })).toBeVisible();
  await expect(result).toHaveAttribute("data-combination-id", combinationId!);
  await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();
  const authEvents = (await trackedEvents(page)).filter((event) =>
    event.event === "auth_prompt" || event.event === "auth_done");
  expect(authEvents.map((event) => event.event)).toEqual(["auth_prompt", "auth_done"]);
  expect(authEvents[1]).toMatchObject({ context: "creator", method: "demo" });
  expect((await trackedEvents(page)).filter((event) =>
    event.event === "idea_login_after_result")).toHaveLength(1);
});

test("동작 줄이기에서도 익명 카드와 수동 다음 CTA가 그대로 동작한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator(".fd-host")).toHaveAttribute("data-motion", "reduced");
  await page.getByRole("button", {
    name: "검증된 원본 카드 뽑기",
    exact: true,
  }).click();

  const source = page.locator('article.idea-lab__slot[data-axis="source"]');
  const payer = page.locator('article.idea-lab__slot[data-axis="payer"]');
  await expect(source).toHaveAttribute("data-carousel-position", "active");
  await expect(page.getByRole("button", {
    name: "읽었어요 · 다음 카드",
    exact: true,
  })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(source).toHaveAttribute("data-carousel-position", "active");
  await expect(payer).not.toHaveAttribute("data-carousel-position", "active");
});

test("200% 텍스트 확대에서도 익명 카드와 선택적 로그인 메뉴를 끝까지 조작한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });

  const draw = page.getByRole("button", {
    name: "검증된 원본 카드 뽑기",
    exact: true,
  });
  await draw.scrollIntoViewIfNeeded();
  await expect(draw).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);

  const login = page.getByRole("button", { name: "로그인", exact: true });
  await login.scrollIntoViewIfNeeded();
  await login.click();
  const google = page.getByRole("button", { name: "Google로 시작하기", exact: true });
  await google.scrollIntoViewIfNeeded();
  await expect(google).toBeVisible();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});
