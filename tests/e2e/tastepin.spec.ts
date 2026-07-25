import { expect, test } from "@playwright/test";

test.describe("맛핀 실제 가치 행동과 독립 계측", () => {
  test("공개 쇼츠 결과에서 카카오 장소 후보를 확인한 뒤 후속 행동을 기록한다", async ({ page }) => {
    await page.route("**/api/tastepin/resolve", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          mode: "live",
          platform: "youtube_shorts",
          extraction: {
            status: "resolved",
            summary: "영상 자막과 간판에서 식당 후보를 확인했어요.",
            places: [{
              name: "테스트식당",
              branch: null,
              menus: ["비빔밥"],
              regionHints: ["서울"],
              confidence: 0.91,
              evidence: [{
                kind: "on_screen_text",
                text: "테스트식당 비빔밥",
                timestampSeconds: 4,
              }],
            }],
          },
          mapStatus: "candidates",
          mapCandidates: [{
            id: "place-1",
            name: "테스트식당",
            category: "음식점",
            address: "서울 테스트구",
            roadAddress: "서울 테스트로 1",
            phone: "",
            longitude: "127.0",
            latitude: "37.5",
            mapUrl: "https://place.map.kakao.com/1",
          }],
        }),
      });
    });

    await page.goto("/tastepin?utm_source=meta&utm_campaign=tastepin-v1&utm_content=video-a");
    await page.getByLabel("YouTube Shorts 공개 링크").fill(
      "https://www.youtube.com/shorts/abcdefghijk",
    );
    await page.getByRole("button", { name: "영상에서 식당 찾기" }).click();

    await expect(page.getByRole("heading", { name: "영상에서 이런 단서를 찾았어요." })).toBeVisible();
    await expect(page.getByRole("link", { name: /테스트식당/ })).toBeVisible();
    await page.getByRole("link", { name: /테스트식당/ }).evaluate((link) => {
      link.addEventListener("click", (event) => event.preventDefault(), { once: true });
      (link as HTMLAnchorElement).click();
    });

    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "tastepin_landing_viewed",
        product_id: "tastepin",
        product_slug: "tastepin",
        page_path: "/tastepin",
        utm_campaign: "tastepin-v1",
      }),
      expect.objectContaining({ event: "tastepin_input_started" }),
      expect.objectContaining({ event: "tastepin_result_viewed" }),
      expect.objectContaining({ event: "tastepin_place_followup_opened" }),
    ]));
    await expect(page.locator("[data-clarity-mask='true']")).toHaveCount(1);
  });
});
