import { expect, test } from "@playwright/test";

test.describe("한입코치 광고 랜딩", () => {
  test("390×844 첫 화면에서 약속·트레이너·예약 CTA를 보여주고 공통 예약으로 이동한다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onebite/start");

    const title = page.getByRole("heading", {
      name: "먹은 건 됐어요. 다음 한 끼는 제가 잡을게요.",
    });
    const coach = page.getByAltText(
      "냉장고 안의 음식을 사이에 두고 정면을 바라보는 남자 헬스 트레이너",
    );
    const primaryCta = page.getByRole("link", { name: "한입코치 예약하기" });

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
    await expect(page).toHaveURL(/\/reserve\/onebite$/, { timeout: 20_000 });
    await expect(page.getByRole("textbox", {
      name: "식단 스토리를 공유할 Instagram 아이디",
    })).toBeVisible();

    const afterClick = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{
        event?: string;
        destination?: string;
      }>
    );
    expect(afterClick.filter((event) => event.event === "onebite_primary_cta_clicked"))
      .toEqual([expect.objectContaining({ destination: "/reserve/onebite" })]);
    expect(afterClick.filter((event) => event.event?.startsWith("onebite_instagram")))
      .toHaveLength(0);
  });
});
