import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Today A · 조건에서 근거 구조 찾기", () => {
  test("로그인 없이 사업 구조와 원본 근거를 먼저 보여준다", async ({ page }) => {
    await page.goto("/today-a");

    await page.getByLabel("반복해서 보이는 불편은 무엇인가요?").fill(
      "여러 채널의 고객 문의를 놓쳐 답변과 예약이 늦어져요.",
    );
    await page.getByRole("button", { name: "근거가 있는 구조 1개 보기" }).click();

    await expect(page.getByRole("region", { name: "사업 구조" })).toBeVisible();
    await expect(page.getByText("바로 받는 결과", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "원본 페이지 열기" })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText(/로그인|계정 연결/)).toHaveCount(0);
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
    await expect(page.getByRole("heading", { name: "7일 동안 할 일" })).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(7);
    await expect(page.getByText(/로그인|계정 연결/)).toHaveCount(0);

    await page.getByRole("checkbox").first().check();
    await expect(page.getByLabel("7일 중 1일 완료")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();
  });
});
