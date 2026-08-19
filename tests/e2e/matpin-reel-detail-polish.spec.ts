import { expect, test } from "@playwright/test";

const savedPlaceWithoutOriginal = {
  id: 91,
  messageId: "00000091-1111-4111-8111-111111111111",
  reelId: "missing-original",
  reelUrl: null,
  place: {
    id: "place-91",
    name: "원본 없는 식당",
    area: "역삼역",
    category: "한식",
    address: "서울 강남구",
    latitude: 37.5,
    longitude: 127.03,
    mapUrl: "https://maps.google.com/?q=place-91",
    confidence: 0.95,
    matchReason: "게시물의 장소 정보에서 확인한 장소예요.",
  },
  confirmationSource: "automatic_high_confidence",
  savedAt: "2026-08-19T10:00:00.000Z",
};

test("게시물 한 건 상세는 저장 상태와 실제 가능한 행동을 구분한다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route("**/api/matpin/saves", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ places: [savedPlaceWithoutOriginal] }),
    });
  });
  await page.route("**/api/matpin/reels/preview?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ thumbnailUrl: null, videoUrl: null, ownerUsername: null }),
    });
  });

  await page.goto("/matpin/reel/missing-original?station=%EC%97%AD%EC%82%BC%EC%97%AD#token=test-access-token");

  const title = page.getByRole("heading", { name: "원본 없는 식당" });
  await expect(title).toBeVisible();
  const titleTypography = await title.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      scrollHeight: element.scrollHeight,
    };
  });
  expect(titleTypography.lineHeight / titleTypography.fontSize).toBeGreaterThanOrEqual(1.25);
  expect(titleTypography.scrollHeight).toBeLessThanOrEqual(Math.ceil(titleTypography.lineHeight) + 1);
  const savedStatus = page.getByLabel("저장된 게시물");
  await expect(savedStatus).toContainText("저장됨");
  await expect(savedStatus).not.toHaveAttribute("role", "button");
  await expect(page.getByText("원본 없음", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "원본 게시물 공유" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "길찾기", exact: true }))
    .toHaveAttribute("href", savedPlaceWithoutOriginal.place.mapUrl);
  const unavailableAction = page.locator('[aria-disabled="true"]').filter({ hasText: "원본 없음" });
  const backgroundBeforeHover = await unavailableAction.evaluate((element) => getComputedStyle(element).backgroundColor);
  await unavailableAction.hover();
  expect(await unavailableAction.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(backgroundBeforeHover);

  const detailsButton = page.getByRole("button", { name: "장소 정보" });
  await expect(detailsButton).toBeEnabled();
  await detailsButton.click();
  const detailsHeading = page.getByRole("heading", { name: "역삼역에서 가기 쉬워요." });
  await expect(detailsHeading).toBeFocused();
  const detailsHeadingTypography = await detailsHeading.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: Number.parseFloat(style.fontSize),
      lineHeight: Number.parseFloat(style.lineHeight),
      scrollHeight: element.scrollHeight,
    };
  });
  expect(detailsHeadingTypography.lineHeight / detailsHeadingTypography.fontSize).toBeGreaterThanOrEqual(1.25);
  expect(detailsHeadingTypography.scrollHeight).toBeLessThanOrEqual(Math.ceil(detailsHeadingTypography.lineHeight) + 1);

  const bodyCopy = page.getByText(savedPlaceWithoutOriginal.place.matchReason);
  const bodyTypography = await bodyCopy.evaluate((element) => {
    const style = getComputedStyle(element);
    return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
  });
  expect(bodyTypography).toBeGreaterThanOrEqual(1.75);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  for (const width of [340, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.getByRole("navigation", { name: "게시물 주요 행동" }).evaluate((element) => (
      getComputedStyle(element).gridTemplateColumns.split(" ").length
    ))).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }

  await page.setViewportSize({ width: 195, height: 844 });
  expect((await title.evaluate((element) => element.scrollHeight))).toBeLessThanOrEqual(
    Math.ceil(await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).lineHeight))) + 1,
  );
  expect((await detailsHeading.evaluate((element) => element.scrollHeight))).toBeLessThanOrEqual(
    Math.ceil(await detailsHeading.evaluate((element) => Number.parseFloat(getComputedStyle(element).lineHeight))) + 1,
  );
});

test("게시물 한 건 상세 미디어는 영상과 대표 화면의 전체 프레임을 보존한다", async ({ page }) => {
  const savedPlaceWithOriginal = {
    ...savedPlaceWithoutOriginal,
    id: 92,
    reelId: "DbTBhcZNY1b",
    reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
  };
  await page.route("**/api/matpin/saves", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ places: [savedPlaceWithOriginal] }),
    });
  });
  await page.route("**/api/matpin/reels/preview?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        thumbnailUrl: "https://example.com/matpin-detail.jpg",
        videoUrl: "https://example.com/matpin-detail.mp4",
        ownerUsername: "matpin",
      }),
    });
  });

  await page.goto("/matpin/reel/DbTBhcZNY1b?station=%EC%97%AD%EC%82%BC%EC%97%AD#token=test-access-token");
  await expect(page.locator("video")).toHaveCSS("object-fit", "contain");
});
