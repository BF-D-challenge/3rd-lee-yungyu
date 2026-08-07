import { expect, test } from "@playwright/test";

test.describe("한입코치 광고 랜딩", () => {
  test("390×844 첫 화면에서 팩폭 약속과 무료 코칭 CTA를 보여주고 7일 패스 알림은 뒤에서 요청한다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onebite/start");

    const title = page.getByRole("heading", {
      name: "사진 한 장이면 혼나고, 바로 복귀.",
    });
    const coach = page.getByAltText(
      "냉장고 안의 음식을 사이에 두고 정면을 바라보는 남자 헬스 트레이너",
    );
    const primaryCta = page.getByRole("link", { name: "무료로 한 번 혼나기" }).first();

    await expect(title).toBeVisible();
    await expect(coach).toBeVisible();
    await expect(primaryCta).toBeVisible();

    const firstScreen = await Promise.all([
      title.boundingBox(),
      coach.boundingBox(),
      primaryCta.boundingBox(),
    ]);
    for (const box of firstScreen) {
      expect(box).not.toBeNull();
      expect(box!.y).toBeLessThan(844);
      expect(box!.y + Math.min(box!.height, 48)).toBeGreaterThan(0);
    }

    const beforeClick = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{ event?: string }>
    );
    expect(beforeClick.filter((event) => event.event === "onebite_landing_viewed")).toHaveLength(1);
    expect(beforeClick.filter((event) => event.event?.includes("instagram"))).toHaveLength(0);
    await expect(page.getByRole("textbox", { name: /Instagram/i })).toHaveCount(0);

    await primaryCta.click();
    await expect(page).toHaveURL(/\/onebite$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "오늘 뭐 먹었어요?" }))
      .toBeVisible();

    await page.goto("/onebite/start");
    const passCta = page.getByRole("link", { name: "7일 패스 알림 받기" });
    await passCta.scrollIntoViewIfNeeded();
    await passCta.click();
    await expect(page).toHaveURL(/\/reserve\/onebite$/, { timeout: 20_000 });
    await expect(page.getByRole("textbox", {
      name: "7일 패스 소식을 받을 Instagram 아이디",
    })).toBeVisible();

    const afterClick = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{
        event?: string;
        destination?: string;
      }>
    );
    expect(afterClick.filter((event) => event.event === "onebite_primary_cta_clicked"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ destination: "/onebite" }),
        expect.objectContaining({ destination: "/reserve/onebite" }),
      ]));
    expect(afterClick.filter((event) => event.event?.startsWith("onebite_instagram")))
      .toHaveLength(0);
  });
});
