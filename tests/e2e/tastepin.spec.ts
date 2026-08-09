import { expect, test } from "@playwright/test";

test.describe("맛핀 Instagram 공유 진입과 독립 계측", () => {
  test("이전 링크 붙여넣기 주소를 대표 랜딩으로 모으고 Instagram 시작 행동을 안내한다", async ({ page }) => {
    await page.goto("/matpin/import");
    await expect(page).toHaveURL(/\/matpin#how$/);
    await expect(page.getByRole("heading", { name: "맛집 릴스를 역별로 모아드려요" })).toBeAttached();
    await expect(page.getByRole("link", { name: "Instagram에서 시작하기" }).first()).toHaveAttribute(
      "href",
      "https://www.instagram.com/matpin.kr/",
    );

    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "tastepin_landing_viewed",
        page_path: "/matpin",
      }),
      expect.objectContaining({
        event: "landing_view",
        product_id: "matpick",
        page_path: "/matpin",
      }),
    ]));
  });
});
