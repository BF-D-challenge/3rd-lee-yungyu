import { expect, test, type Page } from "@playwright/test";

const messageId = "11111111-1111-4111-8111-111111111111";

const candidates = [
  {
    id: "place-1",
    name: "튜니니",
    area: "서울 용산구",
    category: "이탈리안",
    address: "서울 용산구 한남대로 91",
    latitude: 37.537,
    longitude: 127.001,
    mapUrl: "https://map.kakao.com/?q=%ED%8A%9C%EB%8B%88%EB%8B%88",
    confidence: 0.96,
    matchReason: "게시물의 캡션과 작성자 댓글에서 확인한 장소예요.",
  },
  {
    id: "place-2",
    name: "구테로이테",
    area: "서울 강남구",
    category: "카페",
    address: "서울 강남구 선릉로131길 16",
    latitude: 37.518,
    longitude: 127.039,
    mapUrl: "https://map.kakao.com/?q=%EA%B5%AC%ED%85%8C%EB%A1%9C%EC%9D%B4%ED%85%8C",
    confidence: 0.93,
    matchReason: "게시물의 고정 댓글에서 확인한 장소예요.",
  },
  {
    id: "place-3",
    name: "달라디저트",
    area: "서울 마포구",
    category: "디저트",
    address: "서울 마포구 동교로38길 33",
    latitude: 37.561,
    longitude: 126.926,
    mapUrl: "https://map.kakao.com/?q=%EB%8B%AC%EB%9D%BC%EB%94%94%EC%A0%80%ED%8A%B8",
    confidence: 0.91,
    matchReason: "게시물 영상과 캡션에서 확인한 장소예요.",
  },
] as const;

const savedPlaces = [
  {
    id: 1,
    messageId: "11111111-1111-4111-8111-111111111111",
    reelId: "DbTBhcZNY1b",
    reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
    place: {
      id: "preview-sanjang",
      name: "산장장작구이",
      area: "역삼역",
      category: "한식",
      address: "서울 강남구 봉은사로30길 70 1층",
      latitude: 37.5029761,
      longitude: 127.0367068,
      mapUrl: "https://maps.google.com/?q=sanjang",
      confidence: 0.96,
      matchReason: "영상의 간판과 메뉴에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-08-02T02:30:00.000Z",
  },
  {
    id: 2,
    messageId: "22222222-2222-4222-8222-222222222222",
    reelId: "C3kGesnvLr2",
    reelUrl: "https://www.instagram.com/reel/C3kGesnvLr2/",
    place: {
      id: "preview-dotgogi",
      name: "돝고기506",
      area: "역삼역",
      category: "한식",
      address: "서울 강남구 역삼로17길 53",
      latitude: 37.4963358,
      longitude: 127.0362866,
      mapUrl: "https://maps.google.com/?q=dotgogi506",
      confidence: 0.93,
      matchReason: "게시물의 캡션에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-08-01T17:10:00.000Z",
  },
  {
    id: 3,
    messageId: "33333333-3333-4333-8333-333333333333",
    reelId: "DMSqZGLSOA9",
    reelUrl: "https://www.instagram.com/reel/DMSqZGLSOA9/",
    place: {
      id: "preview-chisot",
      name: "치솟 역삼본점",
      area: "역삼역",
      category: "일식",
      address: "서울 강남구 봉은사로30길 59 1층 102호",
      latitude: 37.5036927,
      longitude: 127.0366875,
      mapUrl: "https://maps.google.com/?q=chisot",
      confidence: 0.91,
      matchReason: "게시물의 캡션과 영상에서 확인한 장소예요.",
    },
    confirmationSource: "automatic_high_confidence",
    savedAt: "2026-07-30T12:15:00.000Z",
  },
] as const;

async function openWithoutRuntimeErrors(page: Page, path: string) {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(400);
  return async () => expect.poll(() => runtimeErrors).toEqual([]);
}

async function mockSavedPlaces(page: Page) {
  await page.route("**/api/matpin/saves", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ places: savedPlaces }) });
  });
}

test.describe("맛핀 대표 경로", () => {
  test("모바일 랜딩은 Instagram 공유와 역별 자동 정리를 먼저 설명한다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpin?utm_source=meta&utm_campaign=matpin-share");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://matpin-kr.vercel.app/matpin");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://matpin-kr.vercel.app/matpin");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://matpin-kr.vercel.app/images/matpick/matpin-instagram-share-flow.png",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.getByTestId("phone-frame")).toBeVisible();
    await expect(page.getByTestId("device-screen"))
      .toHaveAttribute("data-scene", "0");
    await expect(page.getByTestId("device-screen")).toHaveAttribute(
      "aria-label",
      "맛핀 모션 이야기 1단계: 맛집 게시물을 역별로 모아드려요",
    );
    const heroLibrary = page.getByTestId("hero-station-library");
    await expect(heroLibrary.locator("[data-station]")).toHaveCount(2);
    await expect(heroLibrary.locator("[data-station] img")).toHaveCount(6);
    await expect(heroLibrary).toContainText("역삼역");
    await expect(heroLibrary).toContainText("성수역");
    const instagramCta = page.getByRole("link", { name: "Instagram에서 시작하기" });
    await expect(instagramCta).toBeVisible();
    await expect(instagramCta).toHaveAttribute("href", "https://www.instagram.com/matpin.kr/");
    for (const linkName of ["개인정보", "이용약관", "데이터 삭제"]) {
      const legalLink = page.getByRole("link", { name: linkName, exact: true });
      await expect(legalLink).toBeVisible();
      const legalBox = await legalLink.boundingBox();
      expect(legalBox?.height).toBeGreaterThanOrEqual(44);
    }
    await instagramCta.evaluate((element) => {
      element.addEventListener("click", (event) => event.preventDefault(), { once: true });
    });
    await instagramCta.click();
    const storyScroller = page.getByLabel("맛핀 소개 장면. 위아래로 스크롤할 수 있습니다.");
    await expect(storyScroller.getByRole("region")).toHaveCount(8);
    await storyScroller.evaluate((element) => {
      element.scrollTo({ top: element.clientHeight * 7, behavior: "auto" });
    });
    await expect(page.getByTestId("device-screen")).toHaveAttribute(
      "aria-label",
      "맛핀 모션 이야기 8단계: 저장될 때마다 DM이 도착해요",
    );
    await expect(page.getByTestId("dm-thread")).toContainText("게시물 저장 알림 3개");
    await expect(page.getByTestId("dm-message")).toHaveCount(3);
    await expect(page.getByTestId("dm-collection-summary")).toContainText("역 3개, 게시물 12개");
    const phoneBox = await page.getByTestId("phone-frame").boundingBox();
    expect(phoneBox).not.toBeNull();
    expect(phoneBox!.x).toBeGreaterThanOrEqual(0);
    expect(phoneBox!.x + phoneBox!.width).toBeLessThanOrEqual(390);
    expect(phoneBox!.y).toBeGreaterThanOrEqual(0);
    expect(phoneBox!.y + phoneBox!.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "tastepin_landing_viewed", page_path: "/matpin", utm_campaign: "matpin-share" }),
      expect.objectContaining({ event: "landing_view", product_id: "matpick", page_path: "/matpin" }),
      expect.objectContaining({ event: "tastepin_primary_cta_clicked", page_path: "/matpin" }),
      expect.objectContaining({ event: "primary_cta", product_id: "matpick", page_path: "/matpin" }),
    ]));
    await expectNoErrors();
  });

  test("이전 데모 진입점은 실제 Instagram 저장 방법으로 모인다", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    for (const path of ["/matpin/start", "/matpin/dm", "/matpin/import"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/matpin#how$/);
      await expect(page.locator("#how")).toBeAttached();
      await expect(page.getByTestId("device-screen"))
        .toHaveAttribute("data-scene", "2");
      await expect(page.getByTestId("device-screen")).toHaveAttribute(
        "aria-label",
        "맛핀 모션 이야기 3단계: 다시 가고 싶은 게시물을 고르세요",
      );
      await expect(page.getByRole("link", { name: "Instagram에서 시작하기" }).first()).toBeVisible();
    }
  });

  test("토큰 없는 확인 링크와 개인 보관함은 저장 데이터를 노출하지 않는다", async ({ page }) => {
    await page.goto("/matpin/confirm");
    await expect(page.getByRole("heading", { name: "링크를 열 수 없어요." })).toBeVisible();
    await expect(page.getByText(/Instagram에서 받은 최신 링크/)).toBeVisible();

    await page.goto("/matpin/saved");
    await expect(page.getByText("개인 보관함을 열 수 없어요")).toBeVisible();
    await expect(page.getByText(/개인 보관함 링크가 올바르지 않아요/)).toBeVisible();
  });

  test("빈 개인 보관함은 저장한 게시물이 없는 상태를 정확히 안내한다", async ({ page }) => {
    await page.route("**/api/matpin/saves", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ places: [] }),
      });
    });

    await page.goto("/matpin/saved#token=test-access-token");
    await expect(page.getByRole("heading", { name: "아직 저장한 게시물이 없어요." })).toBeVisible();
  });

  test("이전 확인 링크도 후보 장소를 모두 한 번에 저장한다", async ({ page }) => {
    await page.route(`**/api/matpin/messages/${messageId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: messageId,
          status: "needs_confirmation",
          selectedPlaceId: null,
          reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
          candidates,
          receivedAt: "2026-08-02T02:20:00.000Z",
          notice: "찾은 장소를 모두 저장합니다.",
        }),
      });
    });
    await page.route(`**/api/matpin/messages/${messageId}/confirm`, async (route) => {
      expect(route.request().headers().authorization).toBe("Bearer test-access-token");
      expect(route.request().postDataJSON()).toEqual({ candidateIds: candidates.map((candidate) => candidate.id) });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, savedCount: 3 }) });
    });

    const expectNoErrors = await openWithoutRuntimeErrors(page, `/matpin/confirm?message=${messageId}#token=test-access-token`);
    await expect(page.getByRole("heading", { name: /찾은 3곳을 모두 저장할까요/ })).toBeVisible();
    await expect(page.getByLabel("저장할 장소").getByRole("article")).toHaveCount(3);
    await page.getByRole("button", { name: "3곳 모두 저장하기" }).click();
    await expect(page.getByRole("heading", { name: /역별 보관함에 정리했어요/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /내 게시물 보관함 보기/ })).toHaveAttribute("href", "/matpin/saved#token=test-access-token");
    await expectNoErrors();
  });

  test("개인 보관함은 저장한 게시물을 가까운 역별로 보여준다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSavedPlaces(page);

    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpin/saved#token=test-access-token");
    await expect(page.getByRole("heading", { name: "저장한 역" })).toBeVisible();
    await expect(page.getByText("역 1개, 영상 3개")).toBeVisible();
    await expect(page.getByRole("link", { name: /가까운 역 역삼역 영상 3개/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /역삼역 산장장작구이 영상 자세히 보기/ })).toHaveAttribute("href", "/matpin/reel/DbTBhcZNY1b?station=%EC%97%AD%EC%82%BC%EC%97%AD#token=test-access-token");
    await expect(page.getByText("내 위치는 사용하지 않아요.")).toBeVisible();
    await expect(page.getByRole("link", { name: /내 데이터 관리/ })).toHaveAttribute("href", "/matpin/delete#token=test-access-token");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expectNoErrors();
  });

  test("검색 경로는 개인 장소 검색에 자동 포커스한다", async ({ page }) => {
    await mockSavedPlaces(page);
    await page.goto("/matpin/search#token=test-access-token");
    const search = page.getByRole("searchbox", { name: "역 이름 또는 가게 검색" });
    await expect(search).toBeFocused();
    await search.fill("치솟");
    await expect(page.getByRole("link", { name: /역삼역 치솟 역삼본점 영상 자세히 보기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /산장장작구이 영상 자세히 보기/ })).toHaveCount(0);
  });

  test("역 화면 필터와 Crème형 영상 상세가 실제 행동으로 이어진다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSavedPlaces(page);
    await page.route("**/api/matpin/reels/preview?*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ thumbnailUrl: null, videoUrl: null, ownerUsername: "mattjun11" }),
      });
    });

    await page.goto("/matpin/station/%EC%97%AD%EC%82%BC%EC%97%AD#token=test-access-token");
    await expect(page.getByRole("heading", { name: "역삼역" })).toBeVisible();
    await page.getByRole("button", { name: "일식" }).click();
    await expect(page.getByRole("link", { name: "치솟 역삼본점 영상 자세히 보기" })).toBeVisible();
    await expect(page.getByRole("link", { name: "산장장작구이 영상 자세히 보기" })).toHaveCount(0);
    await page.getByRole("button", { name: "전체" }).click();
    await page.getByRole("link", { name: "산장장작구이 영상 자세히 보기" }).click();
    await expect(page.getByRole("heading", { name: "산장장작구이" })).toBeVisible();
    await expect(page.getByRole("link", { name: "원본 게시물" })).toHaveAttribute("href", "https://www.instagram.com/reel/DbTBhcZNY1b/");
    await expect(page.getByRole("link", { name: "길찾기", exact: true })).toHaveAttribute("href", "https://maps.google.com/?q=sanjang");
    await expect(page.getByRole("button", { name: "원본 게시물 공유" })).toBeVisible();
    await expect(page.getByRole("button", { name: "장소 정보" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("기존 tastepin과 matpick 주소는 matpin으로 이동한다", async ({ page }) => {
    await page.goto("/tastepin");
    await expect(page).toHaveURL(/\/matpin$/);
    await page.goto("/tastepin/map");
    await expect(page).toHaveURL(/\/matpin$/);
    await page.goto("/matpick?source=legacy");
    await expect(page).toHaveURL(/\/matpin\?source=legacy$/);
    await page.goto("/matpick/map#token=test-token");
    await expect(page).toHaveURL(/\/matpin\/map#token=test-token$/);
  });
});
