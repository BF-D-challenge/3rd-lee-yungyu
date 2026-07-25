import { expect, test } from "@playwright/test";

test.describe("랜덤 엔딩 독립 MVP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/story-cards");
    await page.evaluate(() => {
      localStorage.removeItem("random-ending:daily-draws:v1");
    });
    await page.reload();
  });

  test("로그인과 결제 없이 랜덤 카드부터 여덟 번째 선택의 결말까지 간다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "랜덤 카드 한 장, 8번 고르면 끝." })).toBeVisible();
    await expect(page.getByText("오늘 여러 장 무료", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "랜덤 카드 무료로 열기" })).toBeVisible();
    await expect(page.getByText(/로그인이나 결제 없이 결말까지/)).toBeVisible();

    await page.getByRole("button", { name: "랜덤 카드 무료로 열기" }).click();

    for (let turn = 1; turn <= 8; turn += 1) {
      await expect(page.getByText(`${turn} / 8번째 선택`, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "단서를 더 살펴본다" }).click();
    }

    await expect(page.getByText("8번의 선택으로 완성한 결말", { exact: true })).toBeVisible();
    await expect(page.getByText("결말을 먼저 보여드렸어요. 로그인·결제·공유 조건은 없습니다.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "다른 카드도 무료로 열기" })).toBeVisible();
    await expect(page.getByText("단서를 살핀 선택", { exact: true })).toBeVisible();
    await expect(page.getByText("8번", { exact: true })).toBeVisible();
    await expect(page.getByText(/로그인하고|결제하기|친구 초대/)).toHaveCount(0);
  });

  test("첫 완주 뒤 다른 무료 카드를 바로 열고 오늘 뽑기 수를 유지한다", async ({ page }) => {
    await page.getByRole("button", { name: "랜덤 카드 무료로 열기" }).click();
    const firstTitle = await page.locator("section").filter({ hasText: "1 / 8번째 선택" })
      .getByRole("heading")
      .textContent();

    for (let turn = 1; turn <= 8; turn += 1) {
      await page.getByRole("button", { name: "먼저 말을 건넨다" }).click();
    }

    await page.getByRole("button", { name: "다른 카드도 무료로 열기" }).click();
    await expect(page.getByText("1 / 8번째 선택", { exact: true })).toBeVisible();
    const secondTitle = await page.locator("section").filter({ hasText: "1 / 8번째 선택" })
      .getByRole("heading")
      .textContent();
    expect(secondTitle).not.toBe(firstTitle);

    await page.getByRole("button", { name: "이 이야기를 멈추고 덱으로" }).click();
    await expect(page.getByText("오늘 이 기기에서 2장 열었어요. 바로 또 열 수 있어요.", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("오늘 이 기기에서 2장 열었어요. 바로 또 열 수 있어요.", { exact: true })).toBeVisible();
  });

  test("작은 화면과 모션 축소 설정에서도 무료 뽑기와 선택 버튼을 쓸 수 있다", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();

    const drawButton = page.getByRole("button", { name: "랜덤 카드 무료로 열기" });
    await expect(drawButton).toBeVisible();
    expect((await drawButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await drawButton.click();
    const firstChoice = page.getByRole("button", { name: "단서를 더 살펴본다" });
    await expect(firstChoice).toBeVisible();
    expect((await firstChoice.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
