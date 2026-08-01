import { expect, test } from "@playwright/test";
import { buildTodayArtifacts } from "../../src/lib/today-artifacts";
import type { TodayApplication } from "../../src/lib/today-contract";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Today · 아이디어에서 1일 fake-door 제작까지", () => {
  test("아이디어가 없으면 세 선택으로 초안을 만들고 24시간 뒤 결과를 연다", async ({ page }) => {
    const token = "playwright-access-token-longer-than-24";
    let job: TodayApplication | null = null;
    await page.route("**/api/today/applications", async (route) => {
      const input = await route.request().postDataJSON();
      const submittedAt = new Date();
      const readyAt = new Date(submittedAt.getTime() + 24 * 60 * 60 * 1_000);
      job = {
        id: "00ce0139-6d09-4bd9-9c72-3ecce16a081d",
        submittedAt: submittedAt.toISOString(),
        readyAt: readyAt.toISOString(),
        status: "queued",
        maskedEmail: "he***@example.com",
        idea: input.idea,
        channel: input.channel,
        signal: input.signal,
        artifacts: null,
        emailedAt: null,
        attemptCount: 0,
        notice: "완료되면 입력한 이메일로 전용 결과 링크를 보내드려요.",
      };
      await route.fulfill({ status: 202, json: { mode: "server_queue", job, accessToken: token } });
    });
    await page.route("**/api/today/applications/*", async (route) => {
      if (!job) return route.fulfill({ status: 404, json: { error: "not_found" } });
      await route.fulfill({ json: { mode: "server_queue", job } });
    });

    await page.goto("/today");

    await expect(page.getByRole("heading", { name: /아이디어만 알려주세요/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /24시간 뒤 광고 이미지/ })).toBeVisible();
    await expect(page.getByText("오늘 넣는 것", { exact: true })).toBeVisible();
    await expect(page.getByText("24시간 뒤", { exact: true })).toBeVisible();
    await expect(page.getByText("내일 받는 것", { exact: true })).toBeVisible();
    await expect(page.getByText("현재 가능한 범위", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /아직 아이디어가 없어요/ }).click();
    await expect(page.getByRole("heading", { name: "누구의 문제를 가장 잘 아나요?" })).toBeFocused();
    await page.getByRole("radio", { name: /혼자 일하는 사업자/ }).check();
    await page.getByRole("button", { name: "다음 질문" }).click();

    await expect(page.getByRole("heading", { name: "어떤 순간을 먼저 줄이고 싶나요?" })).toBeFocused();
    await page.getByRole("radio", { name: /고객 답변이 늦을 때/ }).check();
    await page.getByRole("button", { name: "다음 질문" }).click();

    await expect(page.getByRole("heading", { name: "내가 가장 빨리 만들 수 있는 것은?" })).toBeFocused();
    await page.getByRole("radio", { name: /대화와 안내/ }).check();
    await page.getByRole("button", { name: "아이디어 제안 보기" }).click();

    await expect(page.getByText("참고한 실제 매출 원본", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "원본 보기" })).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText(/로그인|계정 연결/)).toHaveCount(0);
    await page.getByRole("button", { name: "이 아이디어로 제작 신청" }).click();
    await expect(page.getByRole("heading", { name: "내일 받을 결과를 정하세요." })).toBeVisible();

    await page.getByLabel("결과 받을 이메일").fill("hello@example.com");
    await page.getByRole("button", { name: "24시간 제작 신청하기" }).click();

    await expect(page.getByRole("heading", { name: "제작을 접수했어요." })).toBeFocused();
    await expect(page.getByText("he***@example.com", { exact: true })).toBeVisible();
    await expect(page.getByText("작업 큐에서 순서를 기다리고 있어요.", { exact: true })).toBeVisible();
    if (process.env.CAPTURE_TODAY_DESIGN === "1") {
      await page.screenshot({
        path: "docs/research/mobbin/assets/today-real-delivery-2026-07-29/04-queued-final.jpg",
        fullPage: true,
        quality: 90,
      });
    }

    if (!job) throw new Error("mock job was not created");
    const queuedJob = job as TodayApplication;
    job = {
      ...queuedJob,
      status: "ready",
      artifacts: buildTodayArtifacts(queuedJob.idea, queuedJob.channel, queuedJob.signal),
      emailedAt: new Date().toISOString(),
    };
    await page.reload();

    await expect(page.getByRole("heading", { name: "테스트할 준비가 끝났어요." })).toBeVisible();
    await expect(page.getByRole("img", { name: /광고 시안/ })).toBeVisible();
    if (process.env.CAPTURE_TODAY_DESIGN === "1") {
      await page.screenshot({
        path: "docs/research/mobbin/assets/today-real-delivery-2026-07-29/05-ready-final.jpg",
        fullPage: true,
        quality: 90,
      });
    }
    await expect(page.getByRole("link", { name: "SVG 받기" })).toHaveAttribute("download", /\.svg$/);
    const landingLink = page.getByRole("link", { name: "전체 화면" });
    await expect(landingLink).toHaveAttribute("href", /^\/today\/preview\/.*#token=/);
    await landingLink.click();
    await expect(page.getByText("FAKE DOOR PREVIEW", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "대기 신청" }).click();
    await expect(page.getByRole("status")).toContainText("신청 의향을 기록했어요");

    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "today_landing_viewed",
        product_id: "today",
        product_slug: "today",
        page_path: "/today",
      }),
      expect.objectContaining({ event: "today_idea_started", idea_path: "guided" }),
      expect.objectContaining({ event: "today_request_submitted", channel: "instagram", signal: "waitlist" }),
    ]));
  });

  test("기존 아이디어 한 문장을 개선하고 이전 두 주소를 하나로 모은다", async ({ page }) => {
    await page.goto("/today");
    await page.getByRole("button", { name: /생각한 아이디어가 있어요/ }).click();
    await page.getByLabel("생각한 아이디어").fill(
      "인스타그램 맛집 영상을 저장하면 가까운 순서로 지도에서 보여주는 서비스",
    );
    await page.getByRole("button", { name: "아이디어 개선안 보기" }).click();

    await expect(page.getByText(/인스타그램 맛집 영상을 저장하면/)).toBeVisible();
    await page.getByRole("button", { name: "이 아이디어로 제작 신청" }).click();
    await expect(page.getByRole("heading", { name: "내일 받을 결과를 정하세요." })).toBeVisible();

    await page.goto("/today-a");
    await expect(page).toHaveURL(/\/today$/);
    await page.goto("/today-b");
    await expect(page).toHaveURL(/\/today$/);

    await page.goto("/today?new=1");
    await page.getByRole("link", { name: "24시간 제작 자리 예약하기" }).click();
    await expect(page).toHaveURL(/\/reserve\/today$/);
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "today_reservation_clicked",
        product_slug: "today",
        placement: "landing",
      }),
    ]));
  });
});
