import { expect, test, type Page } from "@playwright/test";

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
  test("홈은 현재 아이디어 제작기를 연다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/");

    await expect(page.getByRole("region", {
      name: "검증된 원본에서 시작하는 네 장 아이디어 제작기",
    })).toBeVisible();
    await expectNoErrors();
  });

  for (const alias of ["/start", "/slot"]) {
    test(`${alias} 별칭은 검색 조건을 보존해 홈으로 이동한다`, async ({ page }) => {
      const expectNoErrors = await openWithoutRuntimeErrors(page, `${alias}?source=route-smoke`);

      await expect(page).toHaveURL(/\/\?source=route-smoke$/);
      await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
      await expectNoErrors();
    });
  }

  test("/publish 직접 진입은 발행할 카드가 없을 때 홈으로 안전하게 복귀한다", async ({ page }) => {
    const expectNoErrors = await openWithoutRuntimeErrors(page, "/publish");

    await expect(page).toHaveURL(/\/$/);
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
