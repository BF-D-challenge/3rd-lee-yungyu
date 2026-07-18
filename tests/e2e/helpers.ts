import { expect, type Locator, type Page } from "@playwright/test";

export const FIXED_NOW = new Date("2026-07-12T12:00:00+09:00");

export type ShareMockMode = "native" | "clipboard" | "abort";

export interface TestPraiseRequestCard {
  v: 1;
  id: string;
  title: string;
  summary: string;
  smallestBuild: string;
  source: string;
  payer?: string;
  moment?: string;
  twist: string;
  flow?: string;
  createdAt: number;
  originRequestId?: string;
  revisionId?: string;
  version?: number;
  parentRequestId?: string;
}

export interface TestVote {
  id?: string;
  type: "cheer";
  comment: string;
  at: number;
}

export const encodePraiseRequest = (card: TestPraiseRequestCard): string =>
  Buffer.from(JSON.stringify(card), "utf8").toString("base64url");

export function makePraiseRequest(overrides: Partial<TestPraiseRequestCard> = {}) {
  const card: TestPraiseRequestCard = {
    v: 1,
    id: "request-e2e-1",
    title: "결정만 남기는 음성 메모",
    summary: "작은 팀의 기획자가 회의 직후 쓰는 웹 아이디어",
    smallestBuild: "1분 음성을 올리면 결정된 내용만 세 줄로 보여주는 웹 화면",
    source: "말을 녹음하면 글로 바꾸고 정리해주는 서비스",
    payer: "작은 팀의 기획자",
    moment: "회의가 끝난 직후",
    twist: "전체 받아쓰기를 숨기고 결정된 문장만 보여주기",
    flow: "녹음 → 결정 추출 → 결정 세 줄 확인",
    createdAt: FIXED_NOW.getTime(),
    ...overrides,
  };
  const slug = encodePraiseRequest(card);
  return {
    slug,
    card,
    saved: {
      slug,
      card,
      prompt: "fixture prompt",
    },
  };
}

export function praiseVote({
  id,
  praise = "작은 디테일까지 챙기는 모습이 정말 멋졌어요.",
  reveal = "forever-anonymous",
  senderName,
  ideaTitle,
  at = FIXED_NOW.getTime(),
}: {
  id?: string;
  praise?: string;
  reveal?: "named" | "forever-anonymous" | "after-30d";
  senderName?: string;
  ideaTitle?: string;
  at?: number;
} = {}): TestVote {
  return {
    ...(id ? { id } : {}),
    type: "cheer",
    at,
    comment: `support:v1:${JSON.stringify({
      v: 1,
      praise,
      reveal,
      ...(senderName ? { senderName } : {}),
      ...(ideaTitle ? { ideaTitle } : {}),
    })}`,
  };
}

export async function installShareMock(page: Page, mode: ShareMockMode) {
  await page.addInitScript((mockMode: ShareMockMode) => {
    const state = window as typeof window & {
      __shareCalls?: ShareData[];
      __clipboardWrites?: string[];
    };
    state.__shareCalls = [];
    state.__clipboardWrites = [];

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload: ShareData) => {
        state.__shareCalls!.push(payload);
        if (mockMode === "abort") throw new DOMException("사용자가 공유를 취소했습니다.", "AbortError");
        if (mockMode === "clipboard") throw new DOMException("공유 API를 사용할 수 없습니다.", "NotAllowedError");
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          state.__clipboardWrites!.push(value);
        },
      },
    });
  }, mode);
}

export async function shareCalls(page: Page): Promise<ShareData[]> {
  return page.evaluate(() =>
    ((window as typeof window & { __shareCalls?: ShareData[] }).__shareCalls ?? []));
}

export async function clipboardWrites(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    ((window as typeof window & { __clipboardWrites?: string[] }).__clipboardWrites ?? []));
}

export async function trackedEvents(page: Page): Promise<Array<Record<string, unknown>>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("events") ?? "[]"));
}

export function axisCard(page: Page, label: string): Locator {
  return page.locator(`article.idea-lab__slot[data-axis-label="${label}"]`);
}

const DRAW_ALL_SETTLE_TIMEOUT = 20_000;

export async function drawAll(page: Page) {
  const autoFill = page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true });
  if (!await autoFill.isVisible()) {
    await page.getByRole("button", { name: "검증된 원본 카드 뽑기", exact: true }).click();
    await expect(autoFill).toBeVisible();
  }
  await autoFill.click();
  await expect(page.getByRole("button", { name: /4장 다시 뽑기/ })).toBeEnabled({ timeout: DRAW_ALL_SETTLE_TIMEOUT });
  await expect(page.locator(".idea-lab__status")).toContainText("네 장이 완성됐어요.", { timeout: DRAW_ALL_SETTLE_TIMEOUT });
}

export async function seedPraiseStorage(
  page: Page,
  {
    request = makePraiseRequest(),
    votes = [],
    voted = false,
  }: {
    request?: ReturnType<typeof makePraiseRequest>;
    votes?: TestVote[];
    voted?: boolean;
  } = {},
) {
  await page.addInitScript(({ saved, slug, seededVotes, hasVoted }) => {
    if (localStorage.getItem("__e2e_seeded_praise_storage") === "1") return;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("oneul:latest-praise-request:v1", JSON.stringify(saved));
    localStorage.setItem(`oneul:votes:${slug}`, JSON.stringify(seededVotes));
    if (hasVoted) localStorage.setItem(`oneul:voted:${slug}`, "true");
    localStorage.setItem("__e2e_seeded_praise_storage", "1");
  }, {
    saved: request.saved,
    slug: request.slug,
    seededVotes: votes,
    hasVoted: voted,
  });
  return request;
}

export async function openPraiseTab(page: Page) {
  const tab = page.getByRole("button", { name: /받은 응원/ });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("section[data-state='filled'], section[data-state='empty']")).toBeVisible();
}
