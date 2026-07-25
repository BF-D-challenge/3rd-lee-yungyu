import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Today A · 조건에서 근거 구조 찾기", () => {
  test("로그인 없이 사업 구조와 원본 근거를 먼저 보여준다", async ({ page }) => {
    await page.goto("/today-a");

    await page.getByRole("textbox", { name: "관찰한 불편" }).fill(
      "여러 채널의 고객 문의를 놓쳐 답변과 예약이 늦어져요.",
    );
    await page.getByRole("button", { name: "다음: 고객 고르기" }).click();
    await expect(page.getByRole("heading", { name: "누가 이 불편으로 가장 곤란한가요?" })).toBeFocused();
    await page.getByRole("button", { name: "다음: 실행 조건 고르기" }).click();
    await expect(page.getByRole("heading", { name: "이번 주에 해낼 수 있는 크기로 좁혀요." })).toBeFocused();
    await page.getByRole("button", { name: "근거가 있는 구조 1개 보기" }).click();

    await expect(page.getByRole("region", { name: "사업 구조" })).toBeVisible();
    await expect(page.getByText("바로 받는 결과", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "원본 페이지 열기" })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText(/로그인|계정 연결/)).toHaveCount(0);

    await page.getByRole("button", { name: "이 구조 저장하기" }).click();
    await expect(page.getByRole("button", { name: "이 기기에 구조를 저장했어요" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("region", { name: "사업 구조" })).toBeVisible();
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "today_a_landing_viewed",
        product_id: "today_a",
        product_slug: "today-a",
        page_path: "/today-a",
      }),
      expect.objectContaining({ event: "today_a_input_started" }),
      expect.objectContaining({ event: "today_a_result_viewed" }),
      expect.objectContaining({ event: "today_a_structure_saved" }),
    ]));
    await expect(page.locator("[data-clarity-mask='true']")).toHaveCount(1);
  });
});

test.describe("Today B · 기존 아이디어 수요 실험", () => {
  test("가장 위험한 가정과 7일 실행 체크를 로그인 없이 저장한다", async ({ page }) => {
    await page.goto("/today-b");

    await page.getByLabel("해보고 싶은 아이디어").fill("고객 문의 답변 초안을 만드는 작은 도구");
    await page.getByLabel("처음 제안할 고객").fill("혼자 쇼핑몰을 운영하는 사람");
    await page.getByLabel("고객이 바로 얻는 결과").fill("문의 10개의 답변 초안을 5분 안에 받기");
    await page.getByText("예약금", { exact: true }).click();
    await page.getByRole("button", { name: "7일 수요 실험 만들기" }).click();

    await expect(page.getByRole("heading", { name: "지불 의향" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "오늘부터 7일, 하나씩" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "7일 실험 진행률" })).toHaveAttribute("value", "0");
    await expect(page.getByRole("checkbox")).toHaveCount(7);
    await expect(page.getByText(/로그인|계정 연결/)).toHaveCount(0);

    const beforeStart = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(beforeStart.some((entry: { event?: string }) => entry.event === "today_b_experiment_started")).toBe(false);
    await page.getByRole("button", { name: "이 7일 실험 시작하기" }).click();
    await expect(page.getByRole("button", { name: "이 기기에서 7일 실험을 시작했어요" })).toBeVisible();

    await page.getByRole("checkbox").first().check();
    await expect(page.getByLabel("7일 중 1일 완료")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "7일 실험 진행률" })).toHaveAttribute("value", "1");
    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();
    await expect(page.getByRole("button", { name: "이 기기에서 7일 실험을 시작했어요" })).toBeVisible();
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "today_b_landing_viewed",
        product_id: "today_b",
        product_slug: "today-b",
        page_path: "/today-b",
      }),
      expect.objectContaining({ event: "today_b_input_started" }),
      expect.objectContaining({ event: "today_b_result_viewed" }),
      expect.objectContaining({ event: "today_b_experiment_started" }),
    ]));
    expect(events.filter((entry: { event?: string }) => entry.event === "today_b_experiment_started")).toHaveLength(1);
    await expect(page.locator("[data-clarity-mask='true']")).toHaveCount(1);
  });
});
