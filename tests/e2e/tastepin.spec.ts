import { expect, test } from "@playwright/test";

test.describe("맛핀 Instagram 공유 진입과 독립 계측", () => {
  test("이전 링크 붙여넣기 주소를 대표 랜딩으로 모으고 Instagram 시작 행동을 안내한다", async ({ page }) => {
    await page.goto("/matpin/import");
    await expect(page).toHaveURL(/\/matpin#how$/);
    await expect(page.getByRole("heading", { name: "맛집 게시물을 역별로 모아드려요" })).toBeAttached();
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

  for (const viewport of [
    { label: "데스크톱", width: 1280, height: 720 },
    { label: "모바일", width: 390, height: 844 },
  ] as const) {
    test(`${viewport.label}에서 초기 #how와 후속 해시 변경은 게시물 선택 장면을 활성화한다`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto("/matpin#how");
      await expect(page.locator("#how")).toBeAttached();
      await expect(page.getByTestId("device-screen"))
        .toHaveAttribute("data-scene", "2");
      await expect(page.getByTestId("device-screen")).toHaveAttribute(
        "aria-label",
        "맛핀 모션 이야기 3단계: 다시 가고 싶은 게시물을 고르세요",
      );

      await page.goto("/matpin");
      await expect(page.getByTestId("device-screen"))
        .toHaveAttribute("data-scene", "0");
      await page.evaluate(() => {
        window.location.hash = "how";
      });

      await expect(page).toHaveURL(/\/matpin#how$/);
      await expect(page.getByTestId("device-screen"))
        .toHaveAttribute("data-scene", "2");
      await expect(page.getByTestId("device-screen")).toHaveAttribute(
        "aria-label",
        "맛핀 모션 이야기 3단계: 다시 가고 싶은 게시물을 고르세요",
      );
      await expect(page.getByRole("button", { name: "다음" })).toBeVisible();
      await page.getByRole("button", { name: "다음" }).click();
      await expect(page.getByTestId("device-screen")).toHaveAttribute("data-scene", "3");
      await expect(page.getByTestId("device-screen")).toHaveAttribute(
        "aria-label",
        "맛핀 모션 이야기 4단계: 공유 버튼을 누르세요",
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
  }
});
