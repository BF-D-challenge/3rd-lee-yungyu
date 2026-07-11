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
  twist: string;
  createdAt: number;
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
    twist: "전체 받아쓰기를 숨기고 결정된 문장만 보여주기",
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
  at = FIXED_NOW.getTime(),
}: {
  id?: string;
  praise?: string;
  reveal?: "forever-anonymous" | "after-30d";
  senderName?: string;
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
  return page.getByRole("article").filter({ hasText: label });
}

export async function drawAll(page: Page) {
  await page.getByRole("button", { name: /4장 한 번에 뽑기/ }).click();
  await expect(page.getByRole("button", { name: /4장 다시 뽑기/ })).toBeEnabled();
  await expect(page.getByText("네 장이 완성됐어요.", { exact: false })).toBeVisible();
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
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("oneul:latest-praise-request:v1", JSON.stringify(saved));
    localStorage.setItem(`oneul:votes:${slug}`, JSON.stringify(seededVotes));
    if (hasVoted) localStorage.setItem(`oneul:voted:${slug}`, "true");
  }, {
    saved: request.saved,
    slug: request.slug,
    seededVotes: votes,
    hasVoted: voted,
  });
  return request;
}

export async function openPraiseTab(page: Page) {
  await page.getByRole("button", { name: /오늘의 칭찬/ }).click();
  await expect(page.getByRole("heading", { name: "매일 익명의 칭찬 한 장" })).toBeVisible();
}
