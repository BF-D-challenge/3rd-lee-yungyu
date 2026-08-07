import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const reservations = [
  {
    product: "matpick",
    name: "맛핀",
    imageVersion: "v2",
    requiresInstagram: true,
    handle: "matpin_test",
    instagramLabel: "맛집 릴스를 보낼 Instagram 아이디",
    instagramHelp: "예약 뒤 안내받은 방법으로 맛집 릴스를 보내면 내 맛집 저장함을 준비해드려요.",
  },
  {
    product: "onebite",
    name: "한입코치",
    imageVersion: "v2",
    requiresInstagram: true,
    handle: "onebite_test",
    instagramLabel: "7일 패스 소식을 받을 Instagram 아이디",
    instagramHelp: "패스가 열리면 연결한 계정 기준으로 한 번 알려드려요. 아직 결제하지 않아요.",
  },
  {
    product: "today",
    name: "오늘 해볼까",
    imageVersion: "v4",
    requiresInstagram: false,
    handle: null,
    instagramLabel: null,
    instagramHelp: null,
  },
  {
    product: "story-cards",
    name: "카드너머",
    imageVersion: "v2",
    requiresInstagram: false,
    handle: null,
    instagramLabel: null,
    instagramHelp: null,
  },
] as const;

test.describe("공통 fake door 예약", () => {
  for (const reservation of reservations) {
    test(`${reservation.name}: 필요한 정보만 받고 데모 예약을 다시 불러온다`, async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.goto(
        `/reserve/${reservation.product}?utm_source=instagram&utm_medium=paid_social&utm_campaign=fake_door_e2e&utm_content=${reservation.product}`,
      );
      await expect(page.getByText(/로컬 데모 모드/)).toBeVisible();
      await expect(page.getByRole("heading", { name: "지금은 예약만 받아요." })).toBeVisible();
      await expect(page.getByText("지금은 예약만 받아요 · 아직 결제하지 않아요.", {
        exact: true,
      })).toBeVisible();
      await expect(page.getByText("AI 제품 화면 시안", { exact: true })).toBeVisible();
      const productPreview = page.locator('img[src*="reservation-ai"]');
      await expect(productPreview).toHaveCount(1);
      const previewEvidence = await productPreview.evaluate((image) => {
        const rect = image.getBoundingClientRect();
        return {
          source: decodeURIComponent(image.getAttribute("src") ?? ""),
          ratio: rect.width / rect.height,
        };
      });
      expect(previewEvidence.source).toContain(
        `/images/reservation-ai/${reservation.product}-mobile-ui-${reservation.imageVersion}.webp`,
      );
      expect(Math.abs(previewEvidence.ratio - 390 / 844)).toBeLessThan(0.01);
      const jumpToBooking = page.getByRole("link", { name: "예약 정보 입력하기" });
      await expect(jumpToBooking).toHaveAttribute("href", "#reservation-form");
      const pageWidth = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(pageWidth.scroll).toBeLessThanOrEqual(pageWidth.client + 1);
      const loginButton = page.getByRole("button", { name: "로컬 데모로 계속하기" });
      const contactConsent = page.getByRole("checkbox", {
        name: reservation.product === "onebite"
          ? "Google 계정 이메일로 7일 패스 출시 안내를 받는 데 동의해요."
          : "Google 계정 이메일로 출시와 초기 체험 안내를 받는 데 동의해요.",
      });
      await expect(contactConsent).not.toBeChecked();
      await expect(loginButton).toBeDisabled();

      const stepOrder = await page.locator("[data-reservation-step]").evaluateAll((steps) =>
        steps.map((step) => step.getAttribute("data-reservation-step")),
      );
      expect(stepOrder).toEqual(
        reservation.requiresInstagram
          ? ["instagram", "slot", "auth"]
          : ["slot", "auth"],
      );

      const instagram = page.locator("#reservation-instagram");
      if (
        reservation.requiresInstagram
        && reservation.handle
        && reservation.instagramLabel
        && reservation.instagramHelp
      ) {
        await expect(instagram).toHaveAccessibleName(reservation.instagramLabel);
        await expect(page.getByText(reservation.instagramHelp, { exact: true })).toBeVisible();
        await instagram.fill("invalid handle");
        await instagram.blur();
        await expect(page.locator("#reservation-instagram-error")).toContainText(
          "영문, 숫자, 마침표, 밑줄",
        );
        await instagram.fill(`@${reservation.handle}`);
        await expect(instagram).toHaveAttribute("data-clarity-mask", "true");
      } else {
        await expect(instagram).toHaveCount(0);
      }
      await page.locator('input[name="reservation-slot"][value="next-week"]').check();
      await contactConsent.check();
      await expect(loginButton).toBeEnabled();
      await loginButton.click();
      await expect(page.getByText("로컬 데모 준비 완료", { exact: true })).toBeVisible();

      const completedStepOrder = await page.locator("[data-reservation-step]").evaluateAll((steps) =>
        steps.map((step) => step.getAttribute("data-reservation-step")),
      );
      expect(completedStepOrder).toEqual(
        reservation.requiresInstagram
          ? ["instagram", "slot", "auth", "save"]
          : ["slot", "auth", "save"],
      );

      await page.getByRole("button", { name: /데모 저장$/ }).click();
      await expect(page.getByText("데모 저장 완료", { exact: true })).toBeVisible();
      await expect(page.getByText("실제 예약이나 전환으로 집계되지 않아요.")).toBeVisible();
      await expect(page.getByText("이 페이지를 닫아도 예약 신청은 저장돼요.")).toBeVisible();
      await expect(page.getByRole("link")).toHaveCount(1);
      if (reservation.handle) {
        await expect(page.getByText(`@${reservation.handle}`, { exact: true })).toBeVisible();
        await expect(page.getByText(`@${reservation.handle}`, { exact: true })).toHaveAttribute(
          "data-clarity-mask",
          "true",
        );
      }

      const evidence = await page.evaluate(({ product, handle }) => {
        const rows = JSON.parse(
          localStorage.getItem("oneul:fake-door-reservations:v1") ?? "[]",
        ) as Array<{
          product: string;
          instagram_handle: string | null;
          contact_consent_at: string;
          privacy_version: string;
          acquisition_source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
        }>;
        const events = JSON.parse(localStorage.getItem("events") ?? "[]") as Array<{
          event: string;
          [key: string]: unknown;
        }>;
        return {
          saved: rows.find((row) => row.product === product),
          eventNames: events.map((event) => event.event),
          serializedEvents: JSON.stringify(events),
          handle,
        };
      }, { product: reservation.product, handle: reservation.handle });

      expect(evidence.saved).toMatchObject({
        product: reservation.product,
        instagram_handle: reservation.handle,
        privacy_version: "2026-08-01",
        acquisition_source: "instagram",
        utm_source: "instagram",
        utm_medium: "paid_social",
        utm_campaign: "fake_door_e2e",
        utm_content: reservation.product,
        utm_term: null,
      });
      expect(evidence.saved?.contact_consent_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(evidence.eventNames).toContain("fake_door_reservation_demo_saved");
      expect(evidence.eventNames).not.toContain("fake_door_reservation_submit");
      expect(evidence.eventNames).not.toContain("fake_door_reservation_completed");
      expect(evidence.eventNames).not.toContain("login_completed");
      expect(evidence.eventNames).not.toContain("reservation_completed");
      expect(evidence.serializedEvents).not.toContain("instagram_handle");
      expect(evidence.serializedEvents).not.toContain("contact_email");
      if (evidence.handle) {
        expect(evidence.eventNames).toContain("instagram_input_started");
        expect(evidence.serializedEvents).not.toContain(evidence.handle);
      }

      await page.reload();
      await expect(page.getByText("데모 저장 완료", { exact: true })).toBeVisible();
      if (reservation.handle) {
        await expect(page.getByText(`@${reservation.handle}`, { exact: true })).toBeVisible();
      }
    });
  }

  test("큰 화면에서도 모바일 단일 셸을 유지한다", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/reserve/today");

    const shellWidth = await page.locator("main").evaluate((shell) =>
      shell.getBoundingClientRect().width,
    );
    expect(shellWidth).toBeLessThanOrEqual(480);
  });
});
