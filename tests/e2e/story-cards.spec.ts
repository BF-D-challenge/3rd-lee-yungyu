import { expect, test } from "@playwright/test";

test.describe("카드너머", () => {
  test("타로 카드를 고르면 그가 먼저 말하고 예약 CTA까지 이어진다", async ({ page }) => {
    await page.goto("/story-cards");

    await expect(page.getByText("카드너머", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "카드를 고르면, 그가 먼저 말을 걸어요." })).toBeVisible();
    await expect(page.getByRole("group", { name: "카드너머 타로 카드 선택" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "타로 카드 선택" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "서로 다른 남자 주인공" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "고른 장면에서 바로 대화" })).toBeVisible();
    await expect(page.getByText("냉정한 제복 연상", { exact: true })).toBeVisible();
    await expect(page.getByText("대화는 이 브라우저에만 저장돼요.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /온실의 우체국장.*유리 온실의 편지.*대화 시작/ }).click();

    await expect(page.getByRole("heading", { name: "유리 온실의 편지" })).toBeFocused();
    await expect(page.getByText("햇살 같은 다정남", { exact: true })).toBeVisible();
    await expect(page.getByText("온실의 우체국장", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("이 편지는 아직 받는 사람이 없어요.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("내 이야기")).toBeVisible();
    await expect(page.getByRole("button", { name: "메시지 보내기" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "카드너머 출시 알림 예약하기" })).toBeVisible();
    await expect(page.getByText(/로그인하고|결제하기|친구 초대/)).toHaveCount(0);

    let events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "story_cards_landing_viewed" }),
      expect.objectContaining({ event: "primary_cta", product_id: "story-cards" }),
      expect.objectContaining({ event: "story_cards_result_viewed" }),
      expect.objectContaining({ event: "story_card_selected", card_id: "glass-greenhouse" }),
      expect.objectContaining({ event: "story_chat_started", card_id: "glass-greenhouse" }),
    ]));

    await page.getByRole("link", { name: "카드너머 출시 알림 예약하기" }).click();
    await expect(page).toHaveURL(/\/reserve\/story-cards$/, { timeout: 20_000 });
    events = await page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "story_cards_reservation_clicked",
        card_id: "glass-greenhouse",
      }),
    ]));
  });

  test("직접 쓴 문장을 보내고 실패하면 문장을 복구해 다시 보낼 수 있다", async ({ page }) => {
    await page.goto("/story-cards");
    await page.getByRole("button", { name: /파도 기록관.*파도 기록실.*대화 시작/ }).click();
    await expect(page.getByLabel("내 이야기")).toBeVisible();
    await expect(page.getByText("동양풍 장발 무사", { exact: true })).toBeVisible();

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

  test("이전 대화가 있으면 자동 복원하지 않고 이어서 하기와 새 카드 고르기를 선택하게 한다", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("story-cards:conversation:v1", JSON.stringify({
        session: {
          mode: "mock",
          sessionId: "saved-session",
          situation: {
            id: "glass-greenhouse",
            title: "유리 온실의 편지",
            kicker: "꺼내지 못한 마음",
            scene: "유리 온실",
            guideName: "온실지기",
            artIndex: 1,
            accent: "#9ad5bb",
          },
          messages: [
            { id: "guide-1", role: "guide", text: "이 편지는 아직 받는 사람이 없어요." },
            { id: "user-1", role: "user", text: "조금 더 생각해보고 싶어요." },
          ],
          suggestedReplies: ["천천히 말해볼게요"],
        },
        messages: [
          { id: "guide-1", role: "guide", text: "이 편지는 아직 받는 사람이 없어요." },
          { id: "user-1", role: "user", text: "조금 더 생각해보고 싶어요." },
        ],
        savedAt: "2026-07-29T00:00:00.000Z",
      }));
    });

    await page.goto("/story-cards");
    await expect(page.getByRole("heading", { name: "유리 온실의 편지" })).toBeVisible();
    await expect(page.getByRole("button", { name: "이어서 대화하기" })).toBeVisible();
    await expect(page.getByLabel("내 이야기")).toHaveCount(0);

    await page.getByRole("button", { name: "이어서 대화하기" }).click();
    await expect(page.getByLabel("내 이야기")).toBeVisible();
    await expect(page.getByText("조금 더 생각해보고 싶어요.")).toBeVisible();

    await page.goto("/story-cards");
    await page.getByRole("button", { name: "새 카드 고르기" }).click();
    await expect(page.getByRole("heading", { name: "카드를 고르면, 그가 먼저 말을 걸어요." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("story-cards:conversation:v1"))).toBeNull();
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
    await expect(page.locator("main [role='alert']")).toContainText("타로 카드를 불러오지 못했어요.");
    await page.getByRole("button", { name: "다시 불러오기" }).click();
    await expect(page.getByRole("button", { name: /마지막 열차의 기관사.*비가 멈춘 역.*대화 시작/ })).toBeVisible();
  });

  test("390×844와 모션 축소 설정에서도 카드 선택과 예약 CTA를 쓸 수 있다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/story-cards");

    const situation = page.getByRole("button", { name: /달빛 가게의 주인.*달 아래의 가게.*대화 시작/ });
    await expect(situation).toBeVisible();
    await expect(situation.getByText("위험한 은발 연하", { exact: true })).toBeVisible();
    expect((await situation.boundingBox())?.height).toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await situation.click();
    const composer = page.getByLabel("내 이야기");
    await expect(composer).toBeVisible();
    expect((await page.getByRole("button", { name: "메시지 보내기" }).boundingBox())?.height)
      .toBeGreaterThanOrEqual(48);
    await expect(page.getByRole("link", { name: "카드너머 출시 알림 예약하기" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
