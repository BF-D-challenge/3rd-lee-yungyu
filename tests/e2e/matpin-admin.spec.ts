import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

const thirdPartyScriptUrls = {
  googleAnalytics: "https://www.googletagmanager.com/gtag/js?id=G-TEST123",
  clarity: "https://www.clarity.ms/tag/clarity001",
  metaPixel: "https://connect.facebook.net/en_US/fbevents.js",
  kakao: "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js",
} as const;

type ThirdPartyScriptName = keyof typeof thirdPartyScriptUrls;

async function observeThirdPartyScripts(page: Page) {
  const requests: ThirdPartyScriptName[] = [];

  for (const [name, url] of Object.entries(thirdPartyScriptUrls) as Array<
    [ThirdPartyScriptName, string]
  >) {
    await page.route(url, async (route) => {
      requests.push(name);
      await route.abort("blockedbyclient");
    });
  }

  return requests;
}

async function requiredBox(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function expectAligned(first: number, second: number) {
  expect(Math.abs(first - second)).toBeLessThanOrEqual(1);
}

const savedMessage = {
  id: "stored-message-1",
  status: "saved",
  attachmentType: "ig_reel",
  reelUrl: "https://www.instagram.com/reel/example",
  receivedAt: "2026-08-09T09:00:00.000Z",
  repliedAt: "2026-08-09T09:01:00.000Z",
  acknowledgedAt: "2026-08-09T09:00:05.000Z",
  attemptCount: 1,
  failureCode: null,
  failureReason: null,
  lastError: null,
  analysisDurationMs: 1_840,
  totalTokens: 640,
  savedPlaceCount: 2,
} as const;

const failedMessage = {
  id: "stored-message-2",
  status: "failed",
  attachmentType: "ig_reel",
  reelUrl: "https://www.instagram.com/reel/failed-example",
  receivedAt: "2026-08-09T08:00:00.000Z",
  repliedAt: null,
  acknowledgedAt: "2026-08-09T08:00:05.000Z",
  attemptCount: 2,
  failureCode: "place_resolution_unavailable",
  failureReason: "장소 정보를 확인하지 못했습니다.",
  lastError: "장소 정보를 확인하지 못했습니다.",
  analysisDurationMs: 2_250,
  totalTokens: 770,
  savedPlaceCount: 0,
} as const;

const firstConversation = {
  id: "ig-conversation-1",
  updatedAt: "2026-08-09T09:03:00.000Z",
  profile: {
    name: "서윤",
    username: "seoyun_table",
  },
  latestMessage: {
    id: "ig-message-2",
    direction: "inbound",
    text: "성수동 카페도 저장됐나요?",
    attachmentKind: null,
    createdAt: "2026-08-09T09:03:00.000Z",
  },
  latestStoredMessage: savedMessage,
  savedPlaceCount: 2,
  failedMessageCount: 0,
  needsReply: true,
  canReply: true,
  replyWindowEndsAt: "2099-08-10T09:03:00.000Z",
} as const;

const secondConversation = {
  id: "ig-conversation-2",
  updatedAt: "2026-08-09T08:00:00.000Z",
  profile: {
    name: null,
    username: "hungry_traveler",
  },
  latestMessage: {
    id: "ig-message-3",
    direction: "inbound",
    text: null,
    attachmentKind: "share",
    createdAt: "2026-08-09T08:00:00.000Z",
  },
  latestStoredMessage: failedMessage,
  savedPlaceCount: 0,
  failedMessageCount: 1,
  needsReply: false,
  canReply: true,
  replyWindowEndsAt: "2099-08-10T08:00:00.000Z",
} as const;

const detail = {
  ...firstConversation,
  messages: [
    {
      id: "ig-message-1",
      direction: "outbound",
      text: "릴스를 확인하고 맛집을 저장했어요.",
      attachmentKind: null,
      createdAt: "2026-08-09T09:01:00.000Z",
    },
    firstConversation.latestMessage,
  ],
  storedMessages: [savedMessage],
  savedPlaces: [
    {
      id: 101,
      messageId: savedMessage.id,
      name: "서울숲 카페",
      address: "서울 성동구 서울숲길 1",
      stationName: "서울숲역",
      savedAt: "2026-08-09T09:00:30.000Z",
    },
    {
      id: 102,
      messageId: savedMessage.id,
      name: "성수 식당",
      address: "서울 성동구 연무장길 2",
      stationName: "성수역",
      savedAt: "2026-08-09T09:00:31.000Z",
    },
  ],
  messageLimit: 20,
} as const;

const secondDetail = {
  ...secondConversation,
  messages: [secondConversation.latestMessage],
  storedMessages: [failedMessage],
  savedPlaces: [],
  messageLimit: 20,
} as const;

type MockCrmOptions = {
  partial?: boolean;
  detailError?: boolean;
  firstDetailDelayMs?: number;
  abortFirstReply?: boolean;
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "cache-control": "private, no-store" },
    body: JSON.stringify(body),
  });
}

async function mockAuthorizedCrm(page: Page, options: MockCrmOptions = {}) {
  const replyRequests: unknown[] = [];
  let remainingDetailFailures = options.detailError ? 1 : 0;
  let remainingReplyAborts = options.abortFirstReply ? 1 : 0;

  await page.route("**/api/matpin/admin/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (request.method() === "GET" && pathname === "/api/matpin/admin/summary") {
      await fulfillJson(route, {
        range: url.searchParams.get("range") ?? "24h",
        generatedAt: "2026-08-09T09:05:00.000Z",
        instagramAvailable: true,
        recentConversations: 2,
        replyNeeded: 1,
        users: 3,
        messages: 9,
        processing: 0,
        failed: 1,
        savedPlaces: 2,
        cacheEntries: 1,
        cacheHits: 1,
        apiRequests: 4,
        totalTokens: 2_400,
      });
      return;
    }

    if (request.method() === "GET" && pathname === "/api/matpin/admin/conversations") {
      await fulfillJson(route, {
        conversations: [firstConversation, secondConversation],
        partial: options.partial ?? false,
        nextCursor: null,
        liveSummary: {
          instagramAvailable: true,
          recentConversations: 2,
          replyNeeded: 1,
        },
      });
      return;
    }

    if (request.method() === "GET" && pathname === `/api/matpin/admin/conversations/${firstConversation.id}`) {
      if (options.firstDetailDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.firstDetailDelayMs));
      }
      if (remainingDetailFailures > 0) {
        remainingDetailFailures -= 1;
        await fulfillJson(route, { error: "meta_admin_fetch_failed" }, 502);
      } else {
        await fulfillJson(route, detail);
      }
      return;
    }

    if (request.method() === "GET" && pathname === `/api/matpin/admin/conversations/${secondConversation.id}`) {
      await fulfillJson(route, secondDetail);
      return;
    }

    if (request.method() === "POST" && pathname === `/api/matpin/admin/conversations/${firstConversation.id}/messages`) {
      replyRequests.push(request.postDataJSON());
      if (remainingReplyAborts > 0) {
        remainingReplyAborts -= 1;
        await route.abort("failed");
        return;
      }
      await fulfillJson(route, { ok: true });
      return;
    }

    await fulfillJson(route, { error: "e2e_route_not_mocked" }, 404);
  });

  return { replyRequests };
}

test.describe("맛핀 운영 CRM 접근 제어", () => {
  test("관리자 경로에서는 분석과 Kakao SDK를 차단하고 공개 Matpin에서는 로드한다", async ({ page }) => {
    const thirdPartyRequests = await observeThirdPartyScripts(page);

    const adminResponse = await page.goto("/matpin/admin");
    expect(adminResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "관리자 접근이 잠겨 있습니다" })).toBeVisible();
    await expect(page.locator("script#kakao-javascript-sdk")).toHaveCount(0);
    await expect(page.locator("script[src*='googletagmanager.com/gtag/js']")).toHaveCount(0);
    await expect(page.locator("script#microsoft-clarity")).toHaveCount(0);
    await expect(page.locator("script#meta-pixel-bootstrap")).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(thirdPartyRequests).toEqual([]);

    const publicResponse = await page.goto("/matpin");
    expect(publicResponse?.status()).toBe(200);
    await expect(page.locator(`script[src='${thirdPartyScriptUrls.googleAnalytics}']`)).toHaveCount(1);
    await expect(page.locator("script#microsoft-clarity")).toHaveCount(1);
    await expect(page.locator("script#meta-pixel-bootstrap")).toHaveCount(1);
    await expect(page.locator(`script#kakao-javascript-sdk[src='${thirdPartyScriptUrls.kakao}']`)).toHaveCount(1);
    await expect.poll(() => [...new Set(thirdPartyRequests)].sort()).toEqual(
      (["clarity", "googleAnalytics", "kakao", "metaPixel"] satisfies ThirdPartyScriptName[]).sort(),
    );
  });

  test("허용목록과 Supabase가 없으면 데모 대신 잠금 상태를 표시한다", async ({ page }) => {
    const response = await page.goto("/matpin/admin");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: "관리자 접근이 잠겨 있습니다" })).toBeVisible();
    await expect(page.getByText("MATPIN_ADMIN_EMAILS 허용목록이 설정되지 않았습니다.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Google 계정으로 로그인/ })).toHaveCount(0);
    await expect(page.getByText("데모 로그인은 제공하지 않으며")).toBeVisible();
  });

  test("미설정 관리자 API는 private no-store로 거부한다", async ({ request }) => {
    const response = await request.get("/api/matpin/admin/summary?range=24h");
    expect(response.status()).toBe(403);
    expect(response.headers()["cache-control"]).toContain("private");
    expect(response.headers()["cache-control"]).toContain("no-store");
    await expect(response.json()).resolves.toEqual({ error: "admin_not_configured" });
  });
});

test.describe("맛핀 운영 CRM 승인된 화면", () => {
  test("데스크톱에서 대화, 메시지, 사용자 맥락을 함께 보고 답장을 한 번만 보낸다", async ({ page }) => {
    const { replyRequests } = await mockAuthorizedCrm(page);

    const response = await page.goto("/matpin/admin/__e2e__");
    expect(response?.status()).toBe(200);

    const conversationList = page.getByRole("region", { name: "대화 목록" });
    const conversationPanel = page.getByRole("region", { name: "선택한 대화" });
    const contextPanel = page.getByRole("complementary", { name: "사용자 맥락" });
    await expect(conversationList).toBeVisible();
    await expect(conversationPanel).toBeVisible();
    await expect(contextPanel).toBeVisible();
    await expect(conversationList.getByText("서윤", { exact: true }).first()).toBeVisible();
    await expect(conversationPanel.getByText("성수동 카페도 저장됐나요?", { exact: true })).toBeVisible();
    await expect(contextPanel.getByText("서울숲 카페", { exact: true })).toBeVisible();

    const metricCells = page
      .getByRole("region", { name: "운영 지표" })
      .locator(":scope > div")
      .nth(1)
      .locator(":scope > div");
    await expect(metricCells).toHaveCount(8);
    const [listBox, panelBox, contextBox, secondMetricBox, sixthMetricBox] = await Promise.all([
      requiredBox(conversationList),
      requiredBox(conversationPanel),
      requiredBox(contextPanel),
      requiredBox(metricCells.nth(1)),
      requiredBox(metricCells.nth(5)),
    ]);
    expectAligned(listBox.x + listBox.width, secondMetricBox.x + secondMetricBox.width);
    expectAligned(panelBox.x + panelBox.width, sixthMetricBox.x + sixthMetricBox.width);
    expectAligned(contextBox.x, sixthMetricBox.x + sixthMetricBox.width);

    const [listHeaderBox, conversationHeaderBox, contextHeaderBox, filtersBox, noticeBox] = await Promise.all([
      requiredBox(conversationList.locator(":scope > div").first()),
      requiredBox(conversationPanel.locator(":scope > div").first()),
      requiredBox(contextPanel.locator(":scope > div").first()),
      requiredBox(conversationList.locator(":scope > div").nth(1)),
      requiredBox(conversationPanel.locator(":scope > div").nth(1)),
    ]);
    expectAligned(listHeaderBox.y + listHeaderBox.height, conversationHeaderBox.y + conversationHeaderBox.height);
    expectAligned(listHeaderBox.y + listHeaderBox.height, contextHeaderBox.y + contextHeaderBox.height);
    expectAligned(filtersBox.y + filtersBox.height, noticeBox.y + noticeBox.height);

    await conversationPanel.getByRole("button", { name: "답장 작성" }).click();
    const dialog = page.getByRole("dialog", { name: "개별 답장 확인" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("서윤", { exact: true })).toBeVisible();
    await expect(dialog.getByText("성수동 카페도 저장됐나요?", { exact: true })).toBeVisible();

    await dialog.getByRole("textbox", { name: "보낼 문구" }).fill("네, 서울숲 카페와 성수 식당을 저장했어요.");
    await dialog.getByRole("button", { name: "확인하고 보내기" }).click();

    await expect(dialog).toBeHidden();
    expect(replyRequests).toHaveLength(1);
    expect(replyRequests[0]).toMatchObject({
      text: "네, 서울숲 카페와 성수 식당을 저장했어요.",
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
  });

  test("모바일에서 목록, 대화, 사용자 정보 시트, 목록 복귀를 순서대로 이동한다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAuthorizedCrm(page);
    await page.goto("/matpin/admin/__e2e__");

    const conversationList = page.getByRole("region", { name: "대화 목록" });
    const conversationPanel = page.getByRole("region", { name: "선택한 대화" });
    await expect(conversationList).toBeVisible();
    await expect(conversationPanel).toBeHidden();

    await conversationList.getByRole("button", { name: /서윤/ }).click();
    await expect(conversationList).toBeHidden();
    await expect(conversationPanel).toBeVisible();
    await expect(conversationPanel.getByText("성수동 카페도 저장됐나요?", { exact: true })).toBeVisible();

    await conversationPanel.getByRole("button", { name: "사용자 정보 열기" }).click();
    const contextSheet = page.getByRole("dialog", { name: "사용자 맥락" });
    await expect(contextSheet).toBeVisible();
    await expect(contextSheet.getByRole("heading", { name: "사용자 맥락" })).toBeVisible();
    await expect(contextSheet.getByText("서울숲 카페", { exact: true })).toBeVisible();
    await contextSheet.getByRole("button", { name: "사용자 정보 닫기" }).click();
    await expect(contextSheet).toBeHidden();

    await conversationPanel.getByRole("button", { name: "대화 목록으로 돌아가기" }).click();
    await expect(conversationList).toBeVisible();
    await expect(conversationPanel).toBeHidden();
  });

  test("일부 대화만 불러온 상태를 숨기지 않는다", async ({ page }) => {
    await mockAuthorizedCrm(page, { partial: true });
    await page.goto("/matpin/admin/__e2e__");

    await expect(page.getByRole("status").filter({ hasText: "일부 Instagram 대화는 불러오지 못했습니다" })).toBeVisible();
    await expect(page.getByRole("region", { name: "대화 목록" }).getByText("서윤", { exact: true }).first()).toBeVisible();
  });

  test("선택한 대화 상세 조회 실패를 알리고 다시 불러온다", async ({ page }) => {
    await mockAuthorizedCrm(page, { detailError: true });
    await page.goto("/matpin/admin/__e2e__");

    const conversationPanel = page.getByRole("region", { name: "선택한 대화" });
    const retryState = conversationPanel.getByRole("alert");
    await expect(retryState).toContainText("Instagram 대화를 불러오지 못했습니다");
    await retryState.getByRole("button", { name: "다시 시도" }).click();

    await expect(retryState).toBeHidden();
    await expect(conversationPanel.getByText("성수동 카페도 저장됐나요?", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "사용자 맥락" }).getByText("서울숲 카페", { exact: true })).toBeVisible();
  });

  test("늦게 도착한 이전 상세가 새로 선택한 사용자를 덮지 않는다", async ({ page }) => {
    await mockAuthorizedCrm(page, { firstDetailDelayMs: 250 });
    await page.goto("/matpin/admin/__e2e__");

    const list = page.getByRole("region", { name: "대화 목록" });
    await list.getByRole("button", { name: /hungry_traveler/ }).click();

    const panel = page.getByRole("region", { name: "선택한 대화" });
    await expect(panel.getByText("@hungry_traveler", { exact: true }).first()).toBeVisible();
    await expect(panel.getByText("공유 게시물", { exact: true })).toBeVisible();
    await expect(panel.getByText("성수동 카페도 저장됐나요?", { exact: true })).toHaveCount(0);
  });

  test("응답이 끊긴 답장을 같은 멱등성 키로 다시 확인한다", async ({ page }) => {
    const { replyRequests } = await mockAuthorizedCrm(page, { abortFirstReply: true });
    await page.goto("/matpin/admin/__e2e__");

    await page.getByRole("region", { name: "선택한 대화" }).getByRole("button", { name: "답장 작성" }).click();
    const dialog = page.getByRole("dialog", { name: "개별 답장 확인" });
    await dialog.getByRole("textbox", { name: "보낼 문구" }).fill("네, 두 곳 모두 저장했습니다.");
    await dialog.getByRole("button", { name: "확인하고 보내기" }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await dialog.getByRole("button", { name: "확인하고 보내기" }).click();

    await expect(dialog).toBeHidden();
    expect(replyRequests).toHaveLength(2);
    expect(replyRequests[1]).toMatchObject({
      text: "네, 두 곳 모두 저장했습니다.",
      idempotencyKey: (replyRequests[0] as { idempotencyKey: string }).idempotencyKey,
    });
  });
});
