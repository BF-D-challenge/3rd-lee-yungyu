import { expect, test, type Page } from "@playwright/test";
import {
  drawAll,
  FIXED_NOW,
  installShareMock,
  makePraiseRequest,
  praiseVote,
  seedPraiseStorage,
  shareCalls,
  trackedEvents,
  type TestPraiseRequestCard,
  type TestVote,
} from "./helpers";

const PRAISE_OPTIONS = [
  "무슨 앱인지 바로 이해됐어요",
  "실제로 써보고 싶어요",
  "차별점이 더 선명하면 좋겠어요",
] as const;

const DRAW_ALL_SETTLE_TIMEOUT = 20_000;

async function storedVotes(page: Page, slug: string): Promise<TestVote[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]"), `oneul:votes:${slug}`);
}

async function openReceivedPraise(page: Page, state: "empty" | "filled") {
  await page.getByRole("button", { name: /^받은 응원(?:, 새 응원 \d+개)?$/ }).click();
  const deck = page.locator(`section[data-state="${state}"]`);
  await expect(deck).toBeVisible();
  return deck;
}

async function expectNoLegacyMonetization(page: Page) {
  await expect(page.locator("body")).not.toContainText("990원");
  await expect(page.locator("body")).not.toContainText("결제");
  await expect(page.locator("body")).not.toContainText("30일 뒤");
  await expect(page.getByRole("button", { name: /990원|미리 보기/ })).toHaveCount(0);
}

test.describe("A안 아이디어 응원 여정", () => {
  test.use({ timezoneId: "Asia/Seoul" });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: FIXED_NOW });
  });

  test("공유 링크에서 완성된 아이디어와 네 가지 카드 축을 먼저 확인한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-receiver-context" });

    await page.goto(`/praise/${request.slug}`);

    await expect(page.getByRole("heading", { name: request.card.title })).toBeVisible();
    await expect(page.getByText(request.card.summary, { exact: true })).toBeVisible();
    for (const [label, value] of [
      ["문제", request.card.moment],
      ["타겟", request.card.payer],
      ["기존에 잘되는 앱", request.card.source],
      ["차별점", request.card.twist],
    ] as const) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
      await expect(page.getByText(value!, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(request.card.flow!, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "반응 보내기", exact: true })).toBeVisible();
    await expectNoLegacyMonetization(page);
  });

  test("기본 응원을 익명으로 한 번만 보내고 아이디어 제목을 함께 저장한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-preset-anonymous" });
    const selectedPraise = PRAISE_OPTIONS[1];

    await page.goto(`/praise/${request.slug}`);
    await page.getByRole("button", { name: "반응 보내기", exact: true }).click();
    await expect(page.getByRole("heading", { name: "어떤 반응을 보낼까요?" })).toBeFocused();
    await page.getByRole("button", { name: selectedPraise }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await expect(page.getByText("보낸 사람에게 이름을 보여줄까요?", { exact: true })).toBeFocused();
    await expect(page.getByText(selectedPraise, { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: "익명으로 보내기" }).check();
    await page.getByRole("button", { name: "응원 카드 보내기", exact: true }).click();

    await expect(page.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "응원을 보냈어요." })).toBeFocused();
    await expect(page.getByText("친구는 이 메시지를 응원 카드로 받게 됩니다.", { exact: true })).toBeVisible();
    const votes = await storedVotes(page, request.slug);
    expect(votes).toHaveLength(1);
    expect(JSON.parse(votes[0].comment.replace(/^support:v1:/, ""))).toEqual({
      v: 1,
      praise: selectedPraise,
      reveal: "forever-anonymous",
      ideaTitle: request.card.title,
    });
    expect(await trackedEvents(page)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        event: "praise_card_sent",
        request_id: request.card.id,
        reveal: "forever-anonymous",
      }),
    ]));
    await expectNoLegacyMonetization(page);

    await page.reload();
    await expect(page.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();
    expect(await storedVotes(page, request.slug)).toHaveLength(1);
  });

  test("직접 쓴 한 줄 응원을 이름과 함께 공개한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-custom-named" });
    const customPraise = "문제가 선명해서 바로 시험해보고 싶어요";
    const senderName = "하나";

    await page.goto(`/praise/${request.slug}`);
    await page.getByRole("button", { name: "반응 보내기", exact: true }).click();
    await page.getByRole("button", { name: "직접 작성하기" }).click();
    await page.getByLabel("한 줄 의견").fill(customPraise);
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByRole("radio", { name: "이름 공개하기" }).check();

    const sendButton = page.getByRole("button", { name: "응원 카드 보내기", exact: true });
    await expect(sendButton).toBeDisabled();
    await page.getByLabel("표시할 이름").fill(senderName);
    await sendButton.click();

    await expect(page.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();
    const votes = await storedVotes(page, request.slug);
    expect(votes).toHaveLength(1);
    expect(JSON.parse(votes[0].comment.replace(/^support:v1:/, ""))).toEqual({
      v: 1,
      praise: customPraise,
      reveal: "named",
      ideaTitle: request.card.title,
      senderName,
    });
    await expectNoLegacyMonetization(page);
  });

  test("브라우저 UUID 생성 API가 실패해도 세션 식별자로 응원을 보낸다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-retry" });
    const selectedPraise = PRAISE_OPTIONS[0];

    await page.goto(`/praise/${request.slug}`);
    await page.getByRole("button", { name: "반응 보내기", exact: true }).click();
    await page.getByRole("button", { name: selectedPraise }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByRole("radio", { name: "익명으로 보내기" }).check();

    // 일부 보안 브라우저가 randomUUID를 막아도 세션 한정 식별자로 전송을 이어간다.
    await page.evaluate(() => {
      const randomUUID = crypto.randomUUID.bind(crypto);
      let shouldFail = true;
      Object.defineProperty(crypto, "randomUUID", {
        configurable: true,
        value: () => {
          if (shouldFail) {
            shouldFail = false;
            throw new Error("일시적인 전송 실패");
          }
          return randomUUID();
        },
      });
    });

    const sendButton = page.getByRole("button", { name: "응원 카드 보내기", exact: true });
    await sendButton.click();
    await expect(page.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();
    expect(await storedVotes(page, request.slug)).toHaveLength(1);
  });

  test("키보드로 아이디어를 공유한 뒤 친구의 응원 카드를 새로고침 없이 받는다", async ({ page, context }) => {
    const selectedPraise = PRAISE_OPTIONS[2];
    await installShareMock(page, "kakao");
    await page.goto("/");
    await page.locator(".idea-lab__slot.is-carousel-active .idea-lab__card-frame button").press("Enter");
    for (const label of ["돈 낼 사람", "필요한 순간", "한 끗 변화"]) {
      const drawButton = page.getByRole("button", { name: `${label} 카드 뽑기`, exact: true });
      await expect(drawButton).toBeVisible();
      await drawButton.press("Enter");
    }
    await expect(page.locator(".idea-lab__stage--result")).toBeVisible({ timeout: DRAW_ALL_SETTLE_TIMEOUT });
    await page.getByRole("button", {
      name: "공유하고 결과 보기",
      exact: true,
    }).press("Enter");
    await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("oneul:latest-praise-request:v1") ?? "null") as {
        slug: string;
        card: TestPraiseRequestCard;
      } | null,
    );
    if (!saved) throw new Error("생성된 응원 요청을 찾을 수 없습니다.");

    const receiver = await context.newPage();
    await receiver.clock.install({ time: FIXED_NOW });
    await receiver.goto(`/praise/${saved.slug}`);
    const startResponse = receiver.getByRole("button", { name: "반응 보내기", exact: true });
    await startResponse.press("Enter");
    const praiseOption = receiver.getByRole("button", { name: selectedPraise });
    await expect(praiseOption).toBeVisible();
    await praiseOption.press("Enter");
    const nextButton = receiver.getByRole("button", { name: "다음", exact: true });
    await expect(nextButton).toBeEnabled();
    await nextButton.press("Enter");
    const anonymous = receiver.getByRole("radio", { name: "익명으로 보내기" });
    await expect(anonymous).toBeVisible();
    await anonymous.press("Space");
    const sendButton = receiver.getByRole("button", { name: "응원 카드 보내기", exact: true });
    await sendButton.press("Enter");
    await expect(receiver.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();

    await page.bringToFront();
    await page.clock.runFor(15_000);
    const receivedTab = page.getByRole("button", { name: "받은 응원, 새 응원 1개" });
    await receivedTab.press("Enter");
    const deck = page.locator('section[data-state="filled"]');
    await expect(deck).toBeVisible();
    const flipCard = deck.getByRole("button", { name: "응원 카드 뒤집어 내용 확인하기" });
    await flipCard.press("Enter");
    await expect(deck.getByText(selectedPraise, { exact: true })).toBeVisible();
    await expect(deck.getByText(`아이디어 · ${saved.card.title}`, { exact: true })).toBeVisible();
  });

  test("손상된 공유 링크는 안전한 오류 화면을 보여준다", async ({ page }) => {
    await page.goto("/praise/not-a-valid-request");

    await expect(page.getByRole("heading", { name: "응원할 아이디어를 찾을 수 없어요." })).toBeVisible();
    await expect(page.getByText("링크가 오래됐거나 일부가 손상되었을 수 있어요.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "아이디어 만들기", exact: true })).toBeVisible();
  });

  test("받은 응원이 없으면 아이디어 만들기 또는 공유를 안내한다", async ({ page }) => {
    await page.goto("/");
    await openReceivedPraise(page, "empty");

    await expect(page.getByRole("heading", { name: "아직 도착한 응원이 없어요" })).toBeVisible();
    await expect(page.getByText("먼저 아이디어를 만들고 친구에게 공유해보세요.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "먼저 아이디어 만들기", exact: true })).toBeVisible();
    await expectNoLegacyMonetization(page);
  });

  test("완성했지만 아직 공유하지 않은 아이디어도 받은 응원에서 바로 공유한다", async ({ page }) => {
    await installShareMock(page, "kakao");
    await page.goto("/");
    await drawAll(page);
    await openReceivedPraise(page, "empty");

    await expect(page.getByText("완성한 아이디어를 공유하고 친구의 응원을 받아보세요.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "내 아이디어 공유하기", exact: true }).click();
    await expect(page.getByText("카카오톡 공유 화면을 열었어요.", { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const saved = localStorage.getItem("oneul:latest-praise-request:v1");
      const calls = (window as typeof window & { __kakaoShareCalls?: unknown[] }).__kakaoShareCalls ?? [];
      return { hasSavedRequest: Boolean(saved), kakaoCalls: calls.length };
    })).toEqual({ hasSavedRequest: true, kakaoCalls: 1 });
  });

  test("받은 반응을 네 가지 신호로 요약하고 친구 한 명을 더 초대한다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-feedback-summary" });
    await installShareMock(page, "kakao");
    await seedPraiseStorage(page, {
      request,
      votes: [
        praiseVote({ id: "feedback-1", praise: PRAISE_OPTIONS[0] }),
        praiseVote({ id: "feedback-2", praise: PRAISE_OPTIONS[0] }),
        praiseVote({ id: "feedback-3", praise: PRAISE_OPTIONS[1] }),
        praiseVote({ id: "feedback-4", praise: PRAISE_OPTIONS[2] }),
        praiseVote({ id: "feedback-5", praise: "가격이 얼마인지 궁금해요" }),
      ],
    });
    await page.goto("/");
    await openReceivedPraise(page, "filled");

    await expect(page.getByRole("heading", { name: "친구 반응 5개", exact: true })).toBeVisible();
    for (const label of ["바로 이해 2개", "써보고 싶음 1개", "차별점 보완 1개", "직접 쓴 의견 1개"]) {
      await expect(page.getByRole("listitem", { name: label, exact: true })).toBeVisible();
    }

    await page.getByRole("button", { name: "친구 한 명 더 초대하기", exact: true }).click();
    await expect(page.getByText("카카오톡 공유 화면을 열었어요.", { exact: true })).toBeVisible();
    await expect.poll(async () => (await shareCalls(page)).length).toBe(1);
  });

  test("공개 응원 카드는 아이디어 제목과 보낸 사람을 함께 보여준다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-inbox-named" });
    const message = "오늘 바로 검증할 수 있는 범위라서 좋아요";
    const senderName = "하나";
    await seedPraiseStorage(page, {
      request,
      votes: [praiseVote({
        praise: message,
        reveal: "named",
        senderName,
        ideaTitle: request.card.title,
      })],
    });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "받은 응원, 새 응원 1개" })).toBeVisible();
    await openReceivedPraise(page, "filled");

    const card = page.getByRole("button", { name: "응원 카드 뒤집어 내용 확인하기" });
    await expect(card).toHaveAttribute("aria-pressed", "false");
    await card.click();
    await expect(page.getByRole("button", { name: "받은 응원", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate((requestId) => {
      const value = JSON.parse(localStorage.getItem(`oneul:read-praise:${requestId}`) ?? "[]");
      return Array.isArray(value) ? value.length : 0;
    }, request.card.id)).toBe(1);
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText(`아이디어 · ${request.card.title}`, { exact: true })).toBeVisible();
    await expect(page.getByText(`보낸 사람 · ${senderName}`, { exact: true })).toBeVisible();
    await expect(page.getByText("도착한 응원을 모두 확인했어요.", { exact: true })).toBeVisible();
    await expectNoLegacyMonetization(page);

    const revisit = await page.context().newPage();
    await revisit.clock.install({ time: FIXED_NOW });
    await revisit.goto("/");
    await openReceivedPraise(revisit, "filled");
    await expect(revisit.getByRole("button", { name: "응원 카드 뒷면 보기" })).toHaveAttribute("aria-pressed", "true");
    await expect(revisit.getByText(message, { exact: true })).toBeVisible();
    await expect(revisit.getByText("도착한 응원을 모두 확인했어요.", { exact: true })).toBeVisible();
    await revisit.close();
  });

  test("익명 응원 카드는 이름을 노출하지 않고 가짜 문을 만들지 않는다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-inbox-anonymous" });
    const message = "대상이 선명해서 이해하기 쉬워요";
    const privateName = "노출되면안되는이름";
    await seedPraiseStorage(page, {
      request,
      votes: [praiseVote({
        praise: message,
        reveal: "forever-anonymous",
        senderName: privateName,
        ideaTitle: request.card.title,
      })],
    });
    await page.goto("/");
    await openReceivedPraise(page, "filled");

    await page.getByRole("button", { name: "응원 카드 뒤집어 내용 확인하기" }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText(`아이디어 · ${request.card.title}`, { exact: true })).toBeVisible();
    await expect(page.getByText(privateName, { exact: false })).toHaveCount(0);
    await expect(page.getByText(/보낸 사람 ·/)).toHaveCount(0);
    await expectNoLegacyMonetization(page);
  });

  test("차별점 반응을 수정본으로 저장하고 재공유한 뒤 원본 반응과 분리한다", async ({ page, context }) => {
    const request = makePraiseRequest({ id: "request-revision-flow" });
    await installShareMock(page, "kakao");
    await seedPraiseStorage(page, {
      request,
      votes: [praiseVote({ id: "original-feedback", praise: PRAISE_OPTIONS[2] })],
    });
    await page.goto("/");
    await openReceivedPraise(page, "filled");

    await expect(page.getByRole("button", { name: "차별점 문장 고치기", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "차별점 문장 고치기", exact: true }).click();
    const uvp = "회의 음성 하나를 올리면 결정과 담당자만 바로 공유하는 웹 화면";
    const difference = "결정과 담당자만 먼저 보여주기";
    await page.getByRole("textbox", { name: "한 문장 UVP", exact: true }).fill(uvp);
    await page.getByRole("textbox", { name: "차별점", exact: true }).fill(difference);

    await page.getByRole("button", { name: "원본으로 되돌리기", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "한 문장 UVP", exact: true })).toHaveValue(request.card.summary);
    await expect(page.getByRole("textbox", { name: "차별점", exact: true })).toHaveValue(request.card.twist);
    await page.getByRole("textbox", { name: "한 문장 UVP", exact: true }).fill(uvp);
    await page.getByRole("textbox", { name: "차별점", exact: true }).fill(difference);
    await page.getByRole("button", { name: "수정본 저장", exact: true }).click();
    await expect(page.getByText("수정본 1을 저장했어요.", { exact: true })).toBeVisible();
    await expect(page.getByText(uvp, { exact: true })).toBeVisible();

    await page.reload();
    await openReceivedPraise(page, "filled");
    await expect(page.getByText("현재 공유 중인 버전 · 원본", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem", { name: "수정본 1 반응 0개", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "수정한 아이디어 다시 물어보기", exact: true }).click();
    await expect(page.getByText("수정본 1의 카카오톡 공유 화면을 열었어요.", { exact: true })).toBeVisible();

    const revised = await page.evaluate(() => JSON.parse(localStorage.getItem("oneul:latest-praise-request:v1") ?? "null") as {
      slug: string;
      card: TestPraiseRequestCard;
    });
    expect(revised.card.version).toBe(1);
    expect(revised.card.originRequestId).toBe(request.card.id);
    expect(revised.card.id).not.toBe(request.card.id);
    expect(revised.card.summary).toBe(uvp);
    expect(revised.card.twist).toBe(difference);

    const receiver = await context.newPage();
    await receiver.clock.install({ time: FIXED_NOW });
    await receiver.goto(`/praise/${revised.slug}`);
    await expect(receiver.getByText(uvp, { exact: true })).toBeVisible();
    await expect(receiver.getByText(difference, { exact: true })).toBeVisible();
    await receiver.getByRole("button", { name: "반응 보내기", exact: true }).click();
    await receiver.getByRole("button", { name: PRAISE_OPTIONS[1], exact: true }).click();
    await receiver.getByRole("button", { name: "다음", exact: true }).click();
    await receiver.getByRole("radio", { name: "익명으로 보내기" }).check();
    await receiver.getByRole("button", { name: "응원 카드 보내기", exact: true }).click();
    await expect(receiver.getByRole("heading", { name: "응원을 보냈어요." })).toBeVisible();

    await page.bringToFront();
    await page.clock.runFor(15_000);
    await page.reload();
    await openReceivedPraise(page, "filled");
    await expect(page.getByText("현재 공유 중인 버전 · 수정본 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("listitem", { name: "원본 반응 1개", exact: true })).toBeVisible();
    await expect(page.getByRole("listitem", { name: "수정본 1 반응 1개", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "친구 반응 1개", exact: true })).toBeVisible();

    const events = await trackedEvents(page);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "idea_revision_saved", revision_id: expect.any(String), version: 1 }),
      expect.objectContaining({ event: "idea_revision_shared", revision_id: expect.any(String), version: 1 }),
    ]));
    expect(JSON.stringify(events)).not.toContain("결정과 담당자만");
    await receiver.close();
  });

  test("반응이 없으면 다음 수정 조언을 만들지 않는다", async ({ page }) => {
    const request = makePraiseRequest({ id: "request-no-feedback" });
    await seedPraiseStorage(page, { request });
    await page.goto("/");
    await openReceivedPraise(page, "empty");
    await expect(page.getByText("다음에 무엇을 고칠까요?", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "차별점 문장 고치기", exact: true })).toHaveCount(0);
  });
});
