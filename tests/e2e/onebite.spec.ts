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
  test("사진 제출부터 음식 확인·동적 팩폭·다음 한입 약속까지 이어진다", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          localStorage.setItem("onebite:last-share", JSON.stringify(data));
        },
      });
    });
    await page.route("**/api/onebite/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          mode: "live",
          analysis: {
            isMealPhoto: true,
            visibleGroups: ["starch", "protein"],
            visibleFoods: ["밥", "닭고기 반찬"],
            actionCode: "add_vegetable",
            confidence: "high",
            riskFlag: "none",
          },
          roastLine: "밥과 닭고기가 접시를 점령하고 채소 입국 심사대를 폐쇄했네요.",
          actionLine: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
        }),
      });
    });

    await page.goto("/onebite");

    await expect(page.getByRole("heading", {
      name: "오늘 뭐 먹었어요?",
    })).toBeVisible();
    await expect(page.getByAltText(
      "냉장고 안의 음식을 사이에 두고 정면을 바라보는 남자 헬스 트레이너",
    )).toBeVisible();
    await expect(page.getByText("음식 사진 한 장 고르기", { exact: true })).toBeVisible();

    await page.getByLabel(/음식 사진 한 장 고르기/).setInputFiles(photoPayload);
    await expect(page.getByAltText("분석할 음식 사진 미리보기")).toBeVisible();
    const submit = page.getByRole("button", {
      name: "사진 속 음식 확인하기",
    });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole("heading", { name: "이 음식들이 맞나요?" })).toBeVisible();
    await expect(page.getByText("밥", { exact: true })).toBeVisible();
    await expect(page.getByText("닭고기 반찬", { exact: true })).toBeVisible();
    await expect(page.getByText("밥·면·빵류", { exact: true })).toBeVisible();
    await expect(page.getByText("단백질 식품군", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "맞아요. 제대로 혼내주세요" }).click();
    await expect(page.getByRole("heading", {
      name: "밥과 닭고기가 접시를 점령하고 채소 입국 심사대를 폐쇄했네요.",
    })).toBeVisible();
    await page.getByRole("button", { name: "웃었으면 다음 한입으로 복귀" }).click();
    await expect(page.getByRole("heading", {
      name: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
    })).toBeVisible();
    await expect(page.getByText(/칼로리·중량·질환을 판단하거나/)).toBeVisible();

    await page.getByRole("button", { name: "이 행동으로 약속하기" }).click();
    await expect(page.getByRole("status", { name: "다음 한입 약속 완료" })).toBeVisible();
    await page.getByRole("button", { name: "오늘의 팩폭 공유하기" }).click();
    await expect(page.getByRole("status", { name: "오늘의 팩폭을 공유했어요." }))
      .toBeVisible();
    const shared = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("onebite:last-share") ?? "null") as ShareData | null
    );
    expect(shared?.text).toContain("밥과 닭고기가 접시를 점령하고 채소 입국 심사대를 폐쇄했네요.");
    expect(shared?.text).toContain("다음 끼니 약속:");

    await expect(page.getByRole("button", {
      name: "이 행동으로 약속하기",
    })).toHaveCount(0);
    const persisted = await page.evaluate(() => localStorage.getItem("onebite:next-meal-commit:v1"));
    expect(persisted).toContain("add_vegetable");
    await page.getByRole("button", { name: "다른 사진으로 혼나기" }).click();
    await expect(page.getByRole("complementary", {
      name: "지난번 저장한 다음 끼니 행동",
    })).toContainText("다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.");
    await page.reload();
    await expect(page.getByRole("complementary", {
      name: "지난번 저장한 다음 끼니 행동",
    })).toBeVisible();
    await expect(page.getByRole("heading", {
      name: "지난 약속, 이번엔 어땠어요?",
    })).toBeVisible();

    await page.getByLabel(/음식 사진 한 장 고르기/).setInputFiles(photoPayload);
    const revisitSubmit = page.getByRole("button", {
      name: "기록 저장하고 새 코칭 보기",
    });
    await expect(revisitSubmit).toBeDisabled();
    await page.getByRole("button", { name: "해봤어요" }).click();
    await expect(revisitSubmit).toBeEnabled();
    await revisitSubmit.click();

    await page.getByRole("button", { name: "맞아요. 제대로 혼내주세요" }).click();
    await page.getByRole("button", { name: "웃었으면 다음 한입으로 복귀" }).click();
    await expect(page.getByRole("status")).toContainText("지난 행동을 기록했어요");
    const history = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("onebite:action-history:v1") ?? "[]")
    );
    expect(history).toEqual([
      expect.objectContaining({
        actionCode: "add_vegetable",
        status: "done",
      }),
    ]);
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
      expect.objectContaining({ event: "onebite_prior_action_recorded" }),
    ]));
    await expect(page.locator("[data-clarity-mask='true']")).toHaveCount(1);

    await page.getByRole("button", { name: "이 행동으로 약속하기" }).click();
    await page.getByRole("link", { name: "7일 패스 나오면 알려주세요" }).click();
    await expect(page).toHaveURL(/\/reserve\/onebite$/);
    const reservationEvents = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{
        event?: string;
        cta_placement?: string;
      }>
    );
    expect(reservationEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "onebite_primary_cta_clicked",
        cta_placement: "result",
      }),
    ]));
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
            visibleFoods: [],
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
      name: "사진 속 음식 확인하기",
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
