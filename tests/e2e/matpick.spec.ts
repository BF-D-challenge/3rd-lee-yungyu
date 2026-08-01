import { expect, test, type Page } from "@playwright/test";

async function openWithoutRuntimeErrors(page: Page, path: string) {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(400);

  return async () => {
    await expect.poll(() => runtimeErrors).toEqual([]);
  };
}

async function expectMatpickBrand(page: Page) {
  await expect(page.locator("body")).toContainText(/MATPICK|맛픽/);
  await expect(page.locator("body")).not.toContainText("맛핀");
}

test.describe("MATPICK 리브랜딩 경로", () => {
  test("/matpick 광고 랜딩은 390×844에서 문제, 정직한 범위, 예약 CTA를 먼저 보여준다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const expectNoErrors = await openWithoutRuntimeErrors(
      page,
      "/matpick?utm_source=meta&utm_campaign=tastepin-fake-door",
    );

    await expectMatpickBrand(page);
    await expect(page.getByRole("heading", { name: /저장한 맛집 릴스만 200개/ })).toBeVisible();
    await expect(page.getByText(/공개 릴스 링크로 장소 후보를 확인하는 데모만 제공/)).toBeVisible();
    await expect(page.getByText(/Instagram 저장함 전체 가져오기와 자동 DM 수집은 아직 지원하지 않아요/)).toBeVisible();
    await expect(page.getByRole("img", { name: "산장장작구이 공개 릴스의 음식 장면" })).toBeVisible();

    const primaryCta = page.getByRole("link", { name: /초기 체험 예약하기/ }).first();
    await expect(primaryCta).toHaveAttribute("href", "/reserve/matpick");
    const ctaBox = await primaryCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.x).toBeGreaterThanOrEqual(0);
    expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(390);

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(390);

    await primaryCta.click();
    await expect(page).toHaveURL(/\/reserve\/matpick$/);
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "tastepin_landing_viewed",
        product_id: "tastepin",
        page_path: "/matpick",
        utm_campaign: "tastepin-fake-door",
      }),
      expect.objectContaining({
        event: "tastepin_primary_cta_clicked",
        destination: "/reserve/matpick",
      }),
    ]));
    await expectNoErrors();
  });

  test("/matpick/map은 지역 전체의 최신 숏폼 그리드를 보여준다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await expect(page).toHaveURL(/\/matpick\/map$/);
    await expectMatpickBrand(page);
    await expect(page.getByRole("button", { name: /지역 전체 \d+곳/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "맛집 숏폼 목록" })).toBeVisible();
    await expect(page.getByRole("button", { name: /명동손칼국수, 990m, 원본 영상 재생/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "정렬 기준" })).toHaveValue("latest");
    await expect(page.getByRole("button", { name: "지도에서 보기" })).toHaveCount(0);
    await expectNoErrors();
  });

  test("/matpick/import는 영상 링크로 장소를 추가하는 보조 흐름을 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/import");

    await expect(page).toHaveURL(/\/matpick\/import$/);
    await expectMatpickBrand(page);
    await expect(page.getByRole("heading", { name: /맛집 Shorts 링크를/ })).toBeVisible();
    await expect(page.getByLabel("YouTube Shorts 공개 링크")).toBeVisible();
    await expectNoErrors();
  });

  test("/matpick/start는 광고 유입에서 역삼역 가치를 먼저 보여준다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/start");

    await expect(page).toHaveURL(/\/matpick\/start$/);
    await expectMatpickBrand(page);
    await expect(page.getByRole("heading", { name: /역삼역에서 지금 볼 맛집/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /역삼역 \d+곳 보기/ })).toHaveAttribute(
      "href",
      "/matpick/map?station=yeoksam-station",
    );
    await expect(page.getByRole("list", { name: "릴스 저장 방법" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("link", { name: /릴스 저장 흐름 체험/ })).toHaveAttribute(
      "href",
      "/matpick/dm",
    );
    await expect(page.getByRole("link", { name: /matpickapp 프로필 열기/ })).toHaveAttribute(
      "href",
      "https://www.instagram.com/matpickapp/",
    );
    await expect(page.getByRole("link", { name: "YouTube Shorts 링크로 저장하기" })).toHaveAttribute(
      "href",
      "/matpick/import",
    );
    await expect(page.getByText(/회원가입 없이 먼저 둘러봐요/)).toBeVisible();
    await expectNoErrors();
  });

  test("공개 릴스 DM 데모는 장소 확인 뒤 개인 저장함에 추가한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/dm");

    await expect(page.getByRole("heading", { name: /릴스 링크를 붙여넣으세요/ })).toBeVisible();
    await expect(page.getByText(/실제 DM을 읽지 않으며/)).toBeVisible();
    await page.getByRole("button", { name: "이 릴스에서 장소 찾기" }).click();

    await expect(page.getByRole("heading", { name: "영상에 나온 장소가 맞나요?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /산장장작구이/ })).toBeChecked();
    await page.getByRole("button", { name: "선택한 장소 저장" }).click();

    await expect(page.getByRole("heading", { name: "산장장작구이" })).toBeVisible();
    await expect(page.getByText("내 저장함에 추가했어요")).toBeVisible();
    const resultEvents = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(resultEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "tastepin_result_viewed",
        product_id: "tastepin",
        page_path: "/matpick/dm",
      }),
    ]));
    await page.getByRole("link", { name: "내 저장함에서 보기" }).click();
    await expect(page).toHaveURL(/\/matpick\/map\?saved=1$/);
    await expect(page.getByRole("button", { name: "전체 맛집 보기" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: /산장장작구이,.*원본 영상 재생/ })).toBeVisible();
    await expectNoErrors();
  });

  test("헤더의 저장 목록은 현재 지역의 저장된 맛집만 보여준다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await page.getByRole("button", { name: "명동손칼국수 저장" }).click();
    await page.getByRole("button", { name: /저장한 맛집 1곳 보기/ }).click();
    await expect(page.getByRole("button", { name: "전체 맛집 보기" })).toHaveAttribute("aria-pressed", "true");
    const savedList = page.getByRole("region", { name: "맛집 숏폼 목록" });
    await expect(savedList.getByRole("article")).toHaveCount(1);
    await expect(savedList.getByRole("button", { name: /명동손칼국수,.*원본 영상 재생/ })).toBeVisible();
    await expect(savedList.getByRole("button", { name: /전설의우대갈비/ })).toHaveCount(0);
    await expectNoErrors();
  });

  test("/matpick/map 직접 진입은 데모 저장함을 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await expect(page).toHaveURL(/\/matpick\/map$/);
    await expectMatpickBrand(page);
    await expect(page.getByRole("region", { name: "맛집 숏폼 목록" })).toBeVisible();
    await expect(page.getByRole("button", { name: /명동손칼국수,.*원본 영상 재생/ })).toBeVisible();
    await expectNoErrors();
  });

  test("장소를 같은 화면에서 저장하고 재방문해도 상태를 유지한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    const saveButton = page.getByRole("button", { name: "명동손칼국수 저장" });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await expect(page.getByRole("button", { name: "명동손칼국수 저장 취소" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();
    await expect(page.getByRole("button", { name: "명동손칼국수 저장 취소" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectNoErrors();
  });

  test("공개 Instagram 릴스를 9:16 상세에서 열고 원본으로 이동할 수 있다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await page.getByRole("button", { name: "역삼역 3곳" }).click();
    await page.getByRole("button", { name: /산장장작구이,.*원본 영상 재생/ }).click();
    await expect(page.getByRole("heading", { name: "산장장작구이" })).toBeVisible();
    await expect(page.getByTitle("지리산 흑돼지 껍데기 삼겹")).toHaveAttribute(
      "src",
      "https://www.instagram.com/reel/DbTBhcZNY1b/embed/captioned/",
    );
    await expect(page.getByRole("link", { name: "원본 영상 보기" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/reel/DbTBhcZNY1b/",
    );
    await expectNoErrors();
  });

  test("역별 모음을 고르면 최신순 목록과 상세가 같은 역으로 함께 바뀐다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    const yeoksamCollection = page.getByRole("button", { name: "역삼역 3곳" });
    await yeoksamCollection.click();

    await expect(yeoksamCollection).toHaveAttribute("aria-pressed", "true");
    const stationList = page.getByRole("region", { name: "맛집 숏폼 목록" });
    await expect(stationList.getByRole("article")).toHaveCount(3);
    await expect(page.getByRole("button", { name: /산장장작구이,.*원본 영상 재생/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /치솟 역삼본점,.*원본 영상 재생/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /땀땀 강남점/ })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "정렬 기준" })).toHaveValue("latest");
    await expectNoErrors();
  });

  test("광고 딥링크는 역삼역 모음을 바로 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(
      page,
      "/matpick/map?station=yeoksam-station",
    );

    await expect(page.getByRole("button", { name: "역삼역 3곳" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: /산장장작구이,.*원본 영상 재생/ })).toBeVisible();
    await expectNoErrors();
  });

  test("지도 UI와 위치 권한 요청은 MVP에서 노출하지 않는다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await expect(page.getByRole("button", { name: "지도에서 보기" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /현재 위치/ })).toHaveCount(0);
    await expect(page.getByText(/지도에서 위치 보기/)).toHaveCount(0);
    await expectNoErrors();
  });

  test("근처 역 3개와 지역 전체 필터를 제공한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await expect(page.getByRole("button", { name: /강남역 \d+곳/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /역삼역 \d+곳/ })).toBeVisible();
    const sinnnonhyeon = page.getByRole("button", { name: "신논현역 1곳" });
    await expect(sinnnonhyeon).toBeVisible();
    await expect(page.getByRole("button", { name: /지역 전체 \d+곳/ })).toBeVisible();

    await sinnnonhyeon.click();
    await expect(sinnnonhyeon).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /전설의우대갈비.*,.*원본 영상 재생/ })).toBeVisible();
    await expectNoErrors();
  });

  test("검색 아이콘은 자동 포커스된 전용 검색 페이지를 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/matpick/map");

    await page.getByRole("link", { name: "맛집 검색" }).click();
    await expect(page).toHaveURL(/\/matpick\/search$/);

    const searchbox = page.getByRole("searchbox", { name: "음식점, 지역, 메뉴 검색" });
    await expect(searchbox).toBeFocused();
    await searchbox.fill("역삼");
    await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible();
    await expect(page.getByRole("link", { name: /산장장작구이.*언급 영상 보기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /치솟 역삼본점.*언급 영상 보기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /돝고기506.*언급 영상 보기/ })).toBeVisible();

    await searchbox.press("Enter");
    await page.getByRole("button", { name: "검색어 지우기" }).click();
    await expect(page.getByRole("button", { name: "역삼", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "닫기" }).click();
    await expect(page).toHaveURL(/\/matpick\/map$/);
    await expectNoErrors();
  });

});
