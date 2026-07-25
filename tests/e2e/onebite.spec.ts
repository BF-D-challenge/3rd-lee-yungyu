import { expect, test } from "@playwright/test";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const photoPayload = {
  name: "meal.png",
  mimeType: "image/png",
  buffer: onePixelPng,
};

test.describe("한입코치 실제 분석 화면 계약", () => {
  test("사진을 고른 뒤 서버의 안전한 고정 행동 결과를 보여준다", async ({
    page,
  }) => {
    await page.route("**/api/onebite/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          mode: "live",
          analysis: {
            isMealPhoto: true,
            visibleGroups: ["starch", "protein"],
            actionCode: "add_vegetable",
            confidence: "high",
            riskFlag: "none",
          },
          actionLine: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
        }),
      });
    });

    await page.goto("/onebite");
    const submit = page.getByRole("button", {
      name: "사진 분석하고 다음 행동 보기",
    });

    await expect(page.getByRole("heading", {
      name: "숫자 말고, 다음 한 끼 하나만 바꿔요.",
    })).toBeVisible();
    await expect(submit).toBeDisabled();

    await page.getByLabel(/음식 사진 한 장 고르기/).setInputFiles(photoPayload);
    await expect(page.getByAltText("분석할 음식 사진 미리보기")).toBeVisible();
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText("밥·면·빵류", { exact: true })).toBeVisible();
    await expect(page.getByText("단백질 식품군", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", {
      name: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
    })).toBeVisible();
    await expect(page.getByAltText("분석한 음식 사진")).toBeVisible();
    await expect(page.getByText(/칼로리·중량·질환은 판단하지 않아요/)).toBeVisible();

    await page.getByRole("button", { name: "다음 끼니 행동으로 저장하기" }).click();
    await expect(page.getByRole("status", {
      name: "이 기기에 다음 끼니 행동을 저장했어요",
    })).toBeVisible();
    await expect(page.getByRole("button", {
      name: "다음 끼니 행동으로 저장하기",
    })).toHaveCount(0);
    const persisted = await page.evaluate(() => localStorage.getItem("onebite:next-meal-commit:v1"));
    expect(persisted).toContain("add_vegetable");
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "onebite_landing_viewed",
        product_id: "onebite",
        product_slug: "onebite",
        page_path: "/onebite",
      }),
      expect.objectContaining({ event: "onebite_input_started" }),
      expect.objectContaining({ event: "onebite_result_viewed" }),
      expect.objectContaining({ event: "onebite_next_meal_commit_saved" }),
    ]));
    await expect(page.locator("[data-clarity-mask='true']")).toHaveCount(1);
  });

  test("불확실한 사진은 422 안내와 다시 찍는 행동으로 복구한다", async ({
    page,
  }) => {
    await page.route("**/api/onebite/analyze", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          error: "uncertain",
          analysis: {
            isMealPhoto: true,
            visibleGroups: ["unknown"],
            actionCode: "retake_photo",
            confidence: "low",
            riskFlag: "uncertain",
          },
          actionLine: "음식 전체가 밝게 보이도록 위에서 다시 찍어주세요.",
        }),
      });
    });

    await page.goto("/onebite");
    await page.getByLabel(/음식 사진 한 장 고르기/).setInputFiles(photoPayload);
    await page.getByRole("button", {
      name: "사진 분석하고 다음 행동 보기",
    }).click();

    await expect(page.getByRole("status")).toContainText(
      "사진에서 음식 그룹을 충분히 구분하지 못했어요.",
    );
    await expect(page.getByRole("status")).toContainText(
      "음식 전체가 밝게 보이도록 위에서 다시 찍어주세요.",
    );
    await expect(page.locator("#onebite-photo")).toBeEnabled();
  });
});
