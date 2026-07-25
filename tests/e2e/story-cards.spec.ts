import { expect, test } from "@playwright/test";

test.describe("상황 카드", () => {
  test("상황을 고르면 로그인이나 확인 단계 없이 바로 채팅을 시작한다", async ({ page }) => {
    await page.goto("/story-cards");

    await expect(page.getByRole("heading", { name: "지금 마음에 가까운 상황을 골라보세요." })).toBeVisible();
    await expect(page.getByRole("group", { name: "대화를 시작할 상황" })).toBeVisible();
    await expect(page.getByRole("group", { name: /카드 덱/ })).toBeVisible();
    await expect(page.getByText("지금은 미리 준비한 안전 문장으로 답해요.", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: /유리 온실의 편지.*선택하고 대화 시작/ }).click();

    await expect(page.getByRole("heading", { name: "유리 온실의 편지" })).toBeFocused();
    await expect(page.getByText("이 편지는 아직 받는 사람이 없어요.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("내 이야기")).toBeVisible();
    await expect(page.getByRole("button", { name: "메시지 보내기" })).toBeDisabled();
    await expect(page.getByText(/로그인하고|결제하기|친구 초대/)).toHaveCount(0);

    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "story_cards_landing_viewed" }),
      expect.objectContaining({ event: "story_cards_input_started" }),
      expect.objectContaining({ event: "story_cards_result_viewed" }),
      expect.objectContaining({ event: "story_card_situation_selected", card_id: "glass-greenhouse" }),
      expect.objectContaining({ event: "story_card_chat_started", card_id: "glass-greenhouse" }),
    ]));
  });

  test("직접 쓴 문장을 보내고 실패하면 문장을 복구해 다시 보낼 수 있다", async ({ page }) => {
    await page.goto("/story-cards");
    await page.getByRole("button", { name: /파도 기록실.*선택하고 대화 시작/ }).click();
    await expect(page.getByLabel("내 이야기")).toBeVisible();

    let shouldFail = true;
    await page.route("**/api/story-cards", async (route) => {
      if (route.request().method() === "POST" && shouldFail) {
        shouldFail = false;
        await route.fulfill({ status: 503, json: { error: "temporary_failure" } });
        return;
      }
      await route.continue();
    });

    const composer = page.getByLabel("내 이야기");
    await composer.fill("무슨 말부터 해야 할지 모르겠어요");
    await page.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(page.locator("main [role='alert']")).toContainText("문장은 그대로 두었으니 다시 보내주세요.");
    await expect(composer).toHaveValue("무슨 말부터 해야 할지 모르겠어요");

    await page.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(page.getByText("그 말을 처음 품었던 때의 당신은 무엇을 바라고 있었나요?")).toBeVisible();
    await expect(composer).toHaveValue("");

    const stored = await page.evaluate(() => localStorage.getItem("events") ?? "");
    expect(stored).not.toContain("무슨 말부터 해야 할지 모르겠어요");
  });

  test("카드 목록 로딩 실패를 같은 화면에서 회복한다", async ({ page }) => {
    let shouldFail = true;
    await page.route("**/api/story-cards", async (route) => {
      if (route.request().method() === "GET" && shouldFail) {
        shouldFail = false;
        await route.fulfill({ status: 503, json: { error: "temporary_failure" } });
        return;
      }
      await route.continue();
    });

    await page.goto("/story-cards");
    await expect(page.locator("main [role='alert']")).toContainText("상황 카드를 불러오지 못했어요.");
    await page.getByRole("button", { name: "다시 불러오기" }).click();
    await expect(page.getByRole("button", { name: /비가 멈춘 역.*선택하고 대화 시작/ })).toBeVisible();
  });

  test("작은 화면과 모션 축소 설정에서도 카드 선택과 채팅 입력을 쓸 수 있다", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/story-cards");

    const situation = page.getByRole("button", { name: /달 아래의 가게.*선택하고 대화 시작/ });
    await expect(situation).toBeVisible();
    expect((await situation.boundingBox())?.height).toBeGreaterThanOrEqual(48);
    await expect(page.locator(".fd-host")).toHaveAttribute("data-motion", "reduced");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await situation.click();
    const composer = page.getByLabel("내 이야기");
    await expect(composer).toBeVisible();
    expect((await page.getByRole("button", { name: "메시지 보내기" }).boundingBox())?.height)
      .toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
