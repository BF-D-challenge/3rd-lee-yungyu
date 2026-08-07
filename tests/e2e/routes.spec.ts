import { expect, test, type Page } from "@playwright/test";

function encodeLegacy(value: unknown) {
  return Buffer.from(encodeURIComponent(JSON.stringify(value)), "utf8").toString("base64url");
}

const cardFixture = {
  seedId: "e2e-route-seed",
  seedLabel: "작은 팀 회의",
  track: "know",
  painId: 1,
  formatId: "share-link",
  title: "결정만 남기는 회의 메모",
  oneliner: "회의가 끝나면 결정된 문장만 세 줄로 보여줘요.",
  target: "작은 팀의 기획자",
  situation: "회의 직후",
  psych: "정리 피로",
};

async function openWithoutRuntimeErrors(page: Page, path: string) {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto(path);
  expect(response?.status()).toBeLessThan(400);

  return async () => {
    await expect.poll(() => runtimeErrors).toEqual([]);
  };
}

test.describe("전체 앱 라우트 직접 진입", () => {
  test("홈은 네 개 독립 MVP의 실제 진입 경로를 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/");

    const experiments = page.getByRole("region", { name: "앱 선택" });
    await expect(experiments).toBeVisible();
    await expect(experiments.locator("img")).toHaveCount(4);
    for (const href of ["/matpin", "/onebite", "/today", "/story-cards"]) {
      await expect(experiments.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
    await expect(experiments.locator('a[href="/today-a"]')).toHaveCount(0);
    await expect(experiments.locator('a[href="/today-b"]')).toHaveCount(0);
    await expect(experiments.locator('a[href="/idea-fit"]')).toHaveCount(0);
    await expect(page.locator('a[href="/start"]')).toHaveCount(0);
    await expectNoErrors();
  });

  test("홈은 저장 결과가 없는 최근 앱을 처음부터 시작하게 한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/");

    await page.getByRole("link", { name: /한입코치: 음식 사진으로 행동 받기/ }).click();
    await expect(page).toHaveURL(/\/onebite$/);
    await page.goto("/");

    const recent = page.getByRole("complementary", { name: "최근 사용한 앱" });
    await expect(recent).toContainText("한입코치");
    await expect(recent).toContainText("저장한 다음 끼니 행동이 없어요.");
    await expect(recent.getByRole("link", { name: "처음부터 시작" })).toHaveAttribute("href", "/onebite");
    await expect(recent.getByRole("link", { name: "새로 시작" })).toHaveCount(0);
    await expectNoErrors();
  });

  test("홈은 실제 저장 상태가 있는 앱에 이어서 하기와 새로 시작을 나눈다", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mvp-hub:last-app:v2", "onebite");
      localStorage.setItem("onebite:next-meal-commit:v1", JSON.stringify({
        actionCode: "vegetable-first",
        actionLine: "채소를 먼저 두 입 먹기",
        savedAt: "2026-07-29T00:00:00.000Z",
      }));
    });
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/");

    const recent = page.getByRole("complementary", { name: "최근 사용한 앱" });
    await expect(recent).toContainText("지난번에 정한 다음 끼니 행동이 있어요.");
    await expect(recent.getByRole("link", { name: "이어서 하기" })).toHaveAttribute("href", "/onebite");
    await expect(recent.getByRole("link", { name: "새로 시작" })).toHaveAttribute("href", "/onebite?new=1");
    await expectNoErrors();
  });

  for (const alias of ["/tastepin", "/tastepin/map"]) {
    test(`${alias} 맛핀 별칭은 대표 주소로 합쳐진다`, async ({ page }) => {
      const expectNoErrors = await openWithoutRuntimeErrors(page, alias);
      await expect(page).toHaveURL(/\/matpin$/);
      await expectNoErrors();
    });
  }

  for (const alias of ["/start", "/slot"]) {
    test(`${alias} 별칭은 검색 조건을 보존해 제작기로 이동한다`, async ({ page }) => {
      const expectNoErrors = await openWithoutRuntimeErrors(page, `${alias}?source=route-smoke`);

      await expect(page).toHaveURL(/\/maker\?source=route-smoke$/);
      await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
      await expectNoErrors();
    });
  }

  test("/publish 직접 진입은 발행할 카드가 없을 때 제작기로 안전하게 복귀한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/publish");

    await expect(page).toHaveURL(/\/maker$/);
    await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
    await expectNoErrors();
  });

  test("/dashboard 직접 진입은 빈 상태와 다음 행동을 보여준다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/dashboard");

    await expect(page.getByRole("heading", { name: "내 카드" })).toBeVisible();
    await expect(page.getByText("아직 카드가 없어요", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "🌱 첫 카드 만들기" })).toBeVisible();
    await expectNoErrors();
  });

  test("OAuth 콜백 오류는 진행 중이던 화면으로 안전하게 돌려보낸다", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("oneul:auth-return-to", "/dashboard");
    });
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/auth/callback");

    await expect(page).toHaveURL(/\/auth\/complete\?error=missing_code$/);
    await expect(page.getByRole("heading", { name: "로그인을 마치지 못했어요" })).toBeVisible();
    await page.getByRole("button", { name: "이전 화면으로 돌아가기" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "내 카드" })).toBeVisible();
    await expectNoErrors();
  });

  test("수요 리포트 시트는 포커스를 가두고 Esc 뒤 트리거로 돌려보낸다", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("oneul:confirmed", JSON.stringify({
        seedId: "e2e-seed",
        seedLabel: "작은 팀 회의",
        track: "know",
        painId: 1,
        formatId: "share-link",
        title: "결정만 남기는 회의 메모",
        oneliner: "회의가 끝나면 결정된 문장만 세 줄로 보여줘요.",
        target: "작은 팀의 기획자",
        situation: "회의 직후",
        psych: "정리 피로",
      }));
    });
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/publish");
    const trigger = page.getByRole("button", { name: /수요 리포트 받기/ });

    await trigger.click();
    const dialog = page.getByRole("dialog", { name: /수요 리포트, 준비 중이에요/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);

    for (let index = 0; index < 3; index += 1) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectNoErrors();
  });

  test("대결 로그인 시트는 Esc로 닫고 명시적 버튼으로 다시 열 수 있다", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("oneul:demo-auth");
      localStorage.removeItem("oneul:demo-actor");
    });
    const slug = encodeLegacy({ v: 1, a: cardFixture, b: { ...cardFixture, title: "회의 결론 보관함" } });
    const expectNoErrors = await openWithoutRuntimeErrors(page, `/vs/${slug}`);
    const dialog = page.getByRole("dialog", { name: "친구의 후보를 응원해 주세요" });

    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const reopen = page.getByRole("button", { name: "로그인하고 응원하기", exact: true });
    await expect(reopen).toBeFocused();
    await reopen.click();
    await expect(dialog).toBeVisible();
    await expectNoErrors();
  });

  test("카드의 직접 응원 입력은 이름과 완료 포커스를 제공한다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.clear());
    const slug = encodeLegacy(cardFixture);
    const expectNoErrors = await openWithoutRuntimeErrors(page, `/c/${slug}`);

    await page.getByRole("button", { name: "나도 이거 필요해", exact: true }).click();
    const success = page.getByRole("status");
    await expect(success).toBeFocused();
    await page.getByRole("button", { name: "✏️ 직접 쓸래요", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "한마디 남기기", exact: true })).toBeFocused();
    await expectNoErrors();
  });

  for (const route of [
    { path: "/c/not-a-valid-slug", message: "이 카드는 사라졌어요" },
    { path: "/vs/not-a-valid-slug", message: "이 대결은 사라졌어요" },
    { path: "/praise/not-a-valid-slug", message: "응원할 아이디어를 찾을 수 없어요." },
  ]) {
    test(`${route.path} 손상 링크는 복구 가능한 안내 화면을 보여준다`, async ({ page }) => {
      const expectNoErrors = await openWithoutRuntimeErrors(page, route.path);

      await expect(page.getByText(route.message, { exact: true })).toBeVisible();
      await expectNoErrors();
    });
  }
});

test.describe("네 앱 초기 체험 예약", () => {
  for (const reservation of [
    { path: "/reserve/matpick", name: "맛핀" },
    { path: "/reserve/onebite", name: "한입코치" },
    { path: "/reserve/today", name: "오늘 해볼까" },
    { path: "/reserve/story-cards", name: "카드너머" },
  ]) {
    test(`${reservation.name} 예약 페이지는 약속과 예약 행동을 함께 보여준다`, async ({ page }) => {
      const expectNoErrors = await openWithoutRuntimeErrors(page, reservation.path);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("main img").first()).toBeVisible();
      await expect(page.locator("fieldset")).toBeVisible();
      await expect(page.getByRole("button", { name: /데모 저장/ })).toBeVisible();
      await expect(page.getByText(/세 단계로 신청하면.*아직 결제하지 않아요/)).toBeVisible();
      await expectNoErrors();
    });
  }
});
