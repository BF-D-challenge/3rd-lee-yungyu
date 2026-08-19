import { expect, test, type Request } from "@playwright/test";

test("공개 Instagram 아이디 주소는 읽기 전용 보관함만 보여준다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const redirect = await page.request.get("/@public_foodie_e2e", { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers().location).toBe("/matpin/saved/public_foodie_e2e");
  const requests: Request[] = [];
  page.on("request", (request) => requests.push(request));
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto("/@public_foodie_e2e");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/matpin\/saved\/public_foodie_e2e$/);
  expect(response?.request().redirectedFrom()?.url()).toMatch(/\/@public_foodie_e2e$/);
  await expect(page.getByTestId("matpin-saved-view")).toBeVisible();
  await expect(page.getByText("@public_foodie_e2e의 맛집 게시물 보관함")).toBeVisible();
  await expect(page.getByRole("heading", { name: "저장한 역" })).toBeVisible();
  await expect(page.getByText("역 1개, 영상 3개")).toBeVisible();
  await expect(page.getByRole("heading", { name: "역삼역" })).toBeVisible();
  for (const [name, id] of [
    ["산장장작구이", "DbTBhcZNY1b"],
    ["돝고기506", "C3kGesnvLr2"],
    ["치솟 역삼본점", "DMSqZGLSOA9"],
  ]) {
    await expect(page.getByRole("link", { name: new RegExp(`${name} 원본 게시물 보기`) }))
      .toHaveAttribute("href", `https://www.instagram.com/reel/${id}/`);
  }
  await expect(page.getByText("내 위치는 사용하지 않아요.")).toBeVisible();
  await expect(page.getByText("내 데이터 관리")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://matpin-kr.vercel.app/@public_foodie_e2e",
  );

  const html = await page.content();
  for (const secret of ["#token=", "access_token", "sender_hash", "sender_ciphertext", "/matpin/delete"]) {
    expect(html).not.toContain(secret);
  }
  expect(requests.some((request) => request.method() === "DELETE")).toBe(false);
  expect(requests.some((request) => ["PATCH", "POST"].includes(request.method()))).toBe(false);
  expect(requests.some((request) => Boolean(request.headers().authorization))).toBe(false);
  expect(requests.some((request) => request.url().includes("/api/matpin/saves"))).toBe(false);
  await expect(page.locator('a[href*="#token="]')).toHaveCount(0);
  await expect(page.locator('a[href^="/matpin/delete"], a[href^="/matpin/station/"], a[href^="/matpin/reel/"]')).toHaveCount(0);
  expect(requests.some((request) => /googletagmanager|google-analytics|clarity\.ms|facebook\.net|kakaocdn\.net/.test(request.url()))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(runtimeErrors).toEqual([]);

  await page.goto("/@public_foodie_e2e#token=PUBLIC_FRAGMENT_CANARY");
  await expect(page).toHaveURL(/\/matpin\/saved\/public_foodie_e2e$/);
  expect(page.url()).not.toContain("PUBLIC_FRAGMENT_CANARY");
  await expect(page.getByTestId("matpin-saved-view")).toBeVisible();
});

test("공개하지 않은 Instagram 아이디는 같은 404로 숨긴다", async ({ page }) => {
  const unknown = await page.goto("/@not_public_e2e");
  expect(unknown?.status()).toBe(404);
  await expect(page).toHaveURL(/\/matpin\/saved\/not_public_e2e$/);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("비공개 전환과 삭제는 실제 로그인 전에는 열리지 않는다", async ({ page }) => {
  const requests: Request[] = [];
  page.on("request", (request) => requests.push(request));

  await page.goto("/matpin/delete#token=test-private-link");
  await expect(page.getByRole("button", { name: "Google로 로그인하고 관리하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: /공개 보관함 비공개로 전환/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /모든 맛핀 데이터 삭제/ })).toHaveCount(0);
  expect(requests.some((request) => ["DELETE", "PATCH"].includes(request.method()))).toBe(false);
  expect(requests.some((request) => /googletagmanager|google-analytics|clarity\.ms|facebook\.net|kakaocdn\.net/.test(request.url()))).toBe(false);
});
