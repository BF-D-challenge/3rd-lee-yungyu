import { expect, test, type Page } from "@playwright/test";
import { IDEA_LAB_SEEN_SCENARIOS_KEY } from "../../src/components/organisms/idea-lab/model";
import {
  KOREA_POPULAR_IDEA_LAB_SCENARIOS as IDEA_LAB_SCENARIOS,
} from "../../src/components/organisms/idea-lab/sample-data";
import {
  axisCard,
  chooseKakaoShare,
  clipboardWrites,
  drawAll,
  installShareMock,
  kakaoShareCalls,
  shareIdeaFromResult,
  shareCalls,
  trackedEvents,
  type TestPraiseRequestCard,
} from "./helpers";

const AXIS_LABELS = ["검증된 원본", "돈 낼 사람", "필요한 순간", "한 끗 변화"] as const;
const AXIS_IDS: Record<(typeof AXIS_LABELS)[number], "source" | "payer" | "moment" | "twist"> = {
  "검증된 원본": "source",
  "돈 낼 사람": "payer",
  "필요한 순간": "moment",
  "한 끗 변화": "twist",
};

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function openIdeaLab(page: Page) {
  await page.goto("/");
  const lab = page.getByRole("region", {
    name: "검증된 원본에서 시작하는 네 장 아이디어 제작기",
  });
  await expect(lab).toBeVisible();
  return lab;
}

/** A1(뽑기) → A2(결과) 스테이지 전환 */
async function goResult(page: Page) {
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

async function answerOneTasteQuestion(page: Page, choiceIndex = 0) {
  const tasteStage = page.locator(".idea-lab__stage--taste");
  await expect(tasteStage).toBeVisible();
  await expect(tasteStage.locator(".idea-lab__taste-choice")).toHaveCount(3);
  await tasteStage.locator(".idea-lab__taste-choice").nth(choiceIndex).click();
  await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
}

async function drawDeckCard(page: Page, label: (typeof AXIS_LABELS)[number]) {
  const axis = AXIS_IDS[label];
  const point = await page.evaluate((targetAxis) => {
    const host = document.querySelector<HTMLElement>(".fd-host")!.getBoundingClientRect();
    const x = host.left + host.width / 2;
    const pixels: number[] = [];
    for (let y = Math.floor(host.top); y < host.bottom; y += 2) {
      const card = document.elementFromPoint(x, y)?.closest<HTMLElement>(
        `.fd-card[data-axis='${targetAxis}'][data-active='true']`,
      );
      if (card) pixels.push(y);
    }
    if (!pixels.length) throw new Error(`${targetAxis} 교체 덱의 맨 위 카드를 찾지 못했습니다.`);
    return { x, y: (pixels[0] + pixels[pixels.length - 1]) / 2 };
  }, axis);
  await page.mouse.click(point.x, point.y);
}

async function assertShareEvents(page: Page) {
  const events = await trackedEvents(page);
  const created = events.find((entry) => entry.event === "praise_request_created");
  const completed = events.find((entry) => entry.event === "praise_request_share_completed");

  expect(created).toBeDefined();
  expect(completed).toBeDefined();
  expect(completed).toMatchObject({
    share_method: "kakao",
    request_id: created?.request_id,
    completion_signal: "picker_opened",
  });
}

test.describe("아이디어 제작과 칭찬 요청 공유", () => {
  test("첫 화면 진입부터 결과 확인까지 제작 퍼널을 순서대로 기록한다", async ({ page }) => {
    await openIdeaLab(page);

    for (let index = 0; index < AXIS_LABELS.length; index += 1) {
      await page.getByRole("button", {
        name: `${AXIS_LABELS[index]} 카드 뽑기`,
        exact: true,
      }).click();
    }
    await goResult(page);

    const funnelNames = (await trackedEvents(page))
      .map((entry) => entry.event)
      .filter((event) => typeof event === "string" && event.startsWith("idea_"));
    expect(funnelNames).toEqual([
      "idea_lab_viewed",
      "idea_first_card_drawn",
      "idea_four_cards_completed",
      "idea_result_viewed",
    ]);

    const firstCard = (await trackedEvents(page)).find((entry) => entry.event === "idea_first_card_drawn");
    expect(firstCard).toMatchObject({ attempt: 1, draw_method: "manual", entry_path: "/" });
  });

  test("Scenario 1. 하단 덱에서 첫 카드를 뽑고, 네 장의 결과를 중요한 순서로 읽는다", async ({ page }) => {
    const lab = await openIdeaLab(page);

    // A1 뽑기 스테이지는 오직 슬롯·덱·뽑기 CTA만 표시한다. 결과 요소는 노출하지 않는다.
    await expect(page).toHaveURL(/\/$/);
    await expect(lab.getByRole("button", { name: /로그인|Google로 계속/ })).toHaveCount(0);
    await expect(lab.getByRole("heading", { name: /로그인|취향 조사/ })).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--draw")).toBeVisible();
    await expect(page.locator(".idea-lab__result")).toHaveCount(0);

    for (const label of AXIS_LABELS) await expect(axisCard(page, label)).toHaveCount(1);
    await expect(axisCard(page, "검증된 원본")).toHaveAttribute("data-carousel-position", "active");
    await expect(axisCard(page, "돈 낼 사람")).toHaveAttribute("data-carousel-position", "next");
    await expect(page.getByText("네 장의 카드를 조합해 오늘 시험할 아이디어를 만들어보세요.", { exact: true })).toHaveCount(0);

    // 첫 화면은 하단 덱 하나를 주요 진입점으로 사용한다.
    await drawDeckCard(page, "검증된 원본");
    await expect(lab.locator("article.idea-lab__slot.is-filled")).toHaveCount(1);
    await expect(axisCard(page, "돈 낼 사람")).toHaveAttribute("data-carousel-position", "active");
    await expect(page.locator(".idea-lab__deck-prompt")).toHaveCount(0);

    await drawAll(page);
    // 네 번째 카드 뒤 완료 편집 화면 없이 A2 결과로 바로 전환된다.
    await expect(page.locator(".idea-lab__stage--draw")).toHaveCount(0);
    await expect(page.locator("article.idea-lab__slot")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /결과 자세히 보기/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /4장 다시 뽑기/ })).toHaveCount(0);

    const result = page.locator(".idea-lab__stage--result");
    await expect(result.locator(".idea-lab__result-name")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-name")).not.toContainText("—");
    await expect(result.locator(".idea-lab__result-head > span")).toHaveCount(0);
    await expect(result.locator(".idea-lab__result-summary")).toHaveAttribute("data-combination-id", /.+/);
    await expect(result.locator("h2.idea-lab__result-hook")).not.toHaveText("");
    await expect(result.locator("h2.idea-lab__result-hook")).toContainText("?");
    await expect(result.locator(".idea-lab__result-story span")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-story strong")).not.toHaveText("");
    await expect(result.locator(".idea-lab__result-story b")).toHaveCount(0);
    const lockedDetails = result.locator(".idea-lab__locked-details");
    await expect(lockedDetails).toBeVisible();
    await expect(lockedDetails).toContainText("🎯 타겟");
    await expect(lockedDetails).toContainText("⚔️ 딱 하나 다른 점");
    await expect(lockedDetails).toContainText("🗺️ 전체 플로우");
    await expect(lockedDetails.locator(".idea-lab__difference-list > div")).toHaveCount(2);
    await expect(lockedDetails).not.toContainText("유일 주장");
    await expect(lockedDetails.locator(".idea-lab__result-section")).toHaveCount(3);
    await expect(result.getByRole("heading", {
      name: "보내는 순간, 오늘 만들 제작 자료 3개가 열려요",
      exact: true,
    })).toBeVisible();
    await expect(result.locator(".idea-lab__prompt")).toHaveCount(0);
    await expect(result.locator(".idea-lab__unlocked-content")).toHaveCount(0);
    await expect(result.locator(".idea-lab__unlock-summary > div")).toHaveCount(2);
    await expect(result.locator(".idea-lab__share-preview")).toHaveCount(0);
    await expect(page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    })).toBeEnabled();
    await expect(page.getByText(
      "인스타그램 · 카카오톡 · 링크 복사 중에서 직접 선택해요.",
      { exact: true },
    )).toBeVisible();
    await expect(page.getByRole("button", {
      name: "다른 아이디어 뽑기",
      exact: true,
    })).toBeVisible();
    await expect(result.locator(".idea-lab__result-summary-top")).toHaveCount(0);

    // 요약 → 그라데이션 상세 → 공유 안내가 한 열로 이어진다.
    const resultGeometry = await result.evaluate((panel) => {
      const summary = panel.querySelector<HTMLElement>(".idea-lab__result-summary")!;
      const details = panel.querySelector<HTMLElement>(".idea-lab__locked-details")!;
      const guide = panel.querySelector<HTMLElement>(".idea-lab__unlock-guide")!;
      return {
        summaryBeforeDetails:
          summary.getBoundingClientRect().bottom <= details.getBoundingClientRect().top + 1,
        detailsBeforeGuide:
          details.getBoundingClientRect().bottom <= guide.getBoundingClientRect().top + 1,
        detailsOneColumn: getComputedStyle(details).gridTemplateColumns.split(" ").length === 1,
        detailsMasked: `${getComputedStyle(details).maskImage} ${getComputedStyle(details).webkitMaskImage}`
          .includes("gradient"),
        summaryHeight: summary.getBoundingClientRect().height,
      };
    });
    expect(resultGeometry.summaryBeforeDetails).toBe(true);
    expect(resultGeometry.detailsBeforeGuide).toBe(true);
    expect(resultGeometry.detailsOneColumn).toBe(true);
    expect(resultGeometry.detailsMasked).toBe(true);
    expect(resultGeometry.summaryHeight).toBeLessThanOrEqual(430);
    const fixedActions = await result.evaluate((stage) => {
      const scroller = stage.querySelector<HTMLElement>(".idea-lab__stage-scroll")!;
      const actions = stage.querySelector<HTMLElement>(".idea-lab__cta-bar--result")!;
      const stageRect = stage.getBoundingClientRect();
      const scrollRect = scroller.getBoundingClientRect();
      const actionRect = actions.getBoundingClientRect();
      return {
        directChild: actions.parentElement === stage,
        scrollBeforeActions: scrollRect.bottom <= actionRect.top + 1,
        dockedToBottom: Math.abs(stageRect.bottom - actionRect.bottom) <= 1,
        buttons: actions.querySelectorAll("button").length,
      };
    });
    expect(fixedActions).toEqual({
      directChild: true,
      scrollBeforeActions: true,
      dockedToBottom: true,
      buttons: 2,
    });
    const resultTypeScale = await page.locator(".idea-lab__stage--result").evaluate((stage) => {
      const fontSize = (selector: string) =>
        Number.parseFloat(getComputedStyle(stage.querySelector<HTMLElement>(selector)!).fontSize);
      return {
        name: fontSize(".idea-lab__result-name"),
        headline: fontSize("h2.idea-lab__result-hook"),
        before: fontSize(".idea-lab__result-story span"),
        after: fontSize(".idea-lab__result-story strong"),
        action: fontSize(".idea-lab__cta--primary"),
      };
    });
    expect(resultTypeScale.name).toBeGreaterThanOrEqual(18.5);
    expect(resultTypeScale.headline).toBeGreaterThanOrEqual(23);
    expect(resultTypeScale.before).toBeGreaterThanOrEqual(18.5);
    expect(resultTypeScale.after).toBeGreaterThanOrEqual(18.5);
    expect(resultTypeScale.action).toBeGreaterThanOrEqual(15);
    expect(resultTypeScale.headline).toBeGreaterThan(resultTypeScale.name);
    expect(resultTypeScale.headline).toBeGreaterThan(resultTypeScale.after);
    const primaryActionContrast = await page.locator(".idea-lab__cta--primary").evaluate((button) => {
      const rgb = (value: string) => value.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number);
      const luminance = (value: string) => {
        const [red, green, blue] = rgb(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        }) as [number, number, number];
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const style = getComputedStyle(button);
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05)
        / (Math.min(foreground, background) + 0.05);
    });
    expect(primaryActionContrast).toBeGreaterThanOrEqual(4.5);

    // 다시 뽑기 → 아이디어 후보가 아닌 추상 취향 한 문항만 답하고 새 결과로 복귀
    const firstCombination = await result.locator(".idea-lab__result-summary")
      .getAttribute("data-combination-id");
    const firstSource = (await result.locator(".idea-lab__locked-details")
      .getAttribute("data-source-name")) ?? "";
    expect(firstSource).not.toBe("");
    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    const tasteStage = page.locator(".idea-lab__stage--taste");
    await expect(tasteStage).toHaveAttribute("data-question-id", "audience");
    await expect(page.getByRole("heading", { name: "누구의 하루를 더 바꾸고 싶나요?" })).toBeVisible();
    await expect(page.getByText("이번 다시 뽑기 · 취향 질문 1개", { exact: true })).toBeVisible();
    await expect(page.getByRole("timer")).toHaveCount(0);
    await expect(page.getByRole("progressbar", { name: "취향 조사 진행" })).toHaveCount(0);
    await expect(tasteStage.locator(".idea-lab__taste-choice")).toHaveCount(3);
    await expect(tasteStage).not.toContainText(firstSource.split(" · ")[0]);
    const tasteLayout = await page.locator(".idea-lab__taste-options").evaluate((group) => {
      const choices = [...group.querySelectorAll<HTMLElement>(".idea-lab__taste-choice")];
      return {
        sameLeft: Math.max(
          ...choices.slice(1).map((choice) =>
            Math.abs(choices[0].getBoundingClientRect().left - choice.getBoundingClientRect().left)),
        ),
        verticalGaps: choices.slice(1).map((choice, index) =>
          choice.getBoundingClientRect().top - choices[index].getBoundingClientRect().bottom),
        maximumChoiceLength: Math.max(
          ...choices.map((choice) => Array.from(choice.querySelector("strong")?.textContent ?? "").length),
        ),
        minimumFontSize: Math.min(
          ...[...group.closest(".idea-lab__stage--taste")!.querySelectorAll<HTMLElement>(
            "h2,small,p,span,strong,button",
          )].map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
        ),
      };
    });
    expect(tasteLayout.sameLeft).toBeLessThanOrEqual(1);
    expect(tasteLayout.verticalGaps.every((gap) => gap > 0)).toBe(true);
    expect(tasteLayout.maximumChoiceLength).toBeLessThanOrEqual(35);
    expect(tasteLayout.minimumFontSize).toBeGreaterThanOrEqual(18.6);
    await answerOneTasteQuestion(page);
    await expect(result.locator(".idea-lab__result-summary"))
      .not.toHaveAttribute("data-combination-id", firstCombination!);
    await expect(page.getByText(/한 가지 취향을 .*기억하고 새 결과에 반영했어요/)).toBeVisible();
  });

  test("Scenario 2. 공유 뒤 다시 뽑으면 새 결과가 나오고 제작 문구가 다시 잠긴다", async ({ page }) => {
    await installShareMock(page, "kakao");
    await openIdeaLab(page);
    await drawAll(page);

    const beforeCombination = await page.locator(".idea-lab__result-summary")
      .getAttribute("data-combination-id");
    await shareIdeaFromResult(page);
    await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();
    await expect(page.getByText(
      "제작 자료 3개를 열었어요.",
      { exact: true },
    )).toBeVisible();
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();

    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    await answerOneTasteQuestion(page, 1);

    await expect(page.locator(".idea-lab__result-summary"))
      .not.toHaveAttribute("data-combination-id", beforeCombination!);
    await expect(page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    })).toBeEnabled();
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toHaveCount(0);
  });

  test("Scenario 2a. 다시 뽑을 때마다 한 문항만 묻고 다음에는 다른 축을 묻는다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);

    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    await expect(page.locator(".idea-lab__stage--taste")).toHaveAttribute("data-question-id", "audience");
    await answerOneTasteQuestion(page);
    const rememberedAnswers = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("oneul:idea-taste-answers:v2") ?? "[]"));
    expect(rememberedAnswers).toEqual([
      expect.objectContaining({
        questionId: "audience",
        answerId: "personal",
        traitId: "audience:personal",
        ownerId: null,
      }),
    ]);
    expect((await trackedEvents(page)).find((event) => event.event === "idea_taste_answered"))
      .toMatchObject({
        question_id: "audience",
        answer_id: "personal",
        trait_id: "audience:personal",
      });

    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    await expect(page.locator(".idea-lab__stage--taste")).toHaveAttribute("data-question-id", "input");
    await expect(page.locator(".idea-lab__taste-choice")).toHaveCount(3);
    await page.getByRole("button", { name: "현재 결과로 돌아가기", exact: true }).click();
    await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
  });

  test("Scenario 3. 완료 결과에는 중간 완료 CTA나 카드 미리보기가 남지 않는다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);
    await expect(page.locator(".idea-lab__stage--draw")).toHaveCount(0);
    await expect(page.locator(".idea-lab__idea-preview")).toHaveCount(0);
    await expect(page.getByText("카드 눌러 교체", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /결과 자세히 보기|4장 다시 뽑기/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true })).toBeVisible();
  });

  test("Scenario 3a. 아직 보지 않은 마지막 한국 수요 원본도 첫 뽑기에 바로 나온다", async ({ page }) => {
    const lastScenario = IDEA_LAB_SCENARIOS.at(-1)!;
    const seenIds = IDEA_LAB_SCENARIOS.slice(0, -1).map((scenario) => scenario.id);
    await page.addInitScript(({ key, ids }) => {
      localStorage.setItem(key, JSON.stringify(ids));
    }, { key: IDEA_LAB_SEEN_SCENARIOS_KEY, ids: seenIds });

    await openIdeaLab(page);
    await drawAll(page);

    await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
    await expect(page.locator(".idea-lab__locked-details"))
      .toHaveAttribute("data-source-name", lastScenario.source.sourceName);
  });

  test("Scenario 3b. 다시 뽑으면 다음 검증 원본에 맞춘 새 조합이 나온다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);
    const beforeSource = await page.locator(".idea-lab__locked-details")
      .getAttribute("data-source-name");
    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    await answerOneTasteQuestion(page, 1);
    const afterSource = await page.locator(".idea-lab__locked-details")
      .getAttribute("data-source-name");
    expect(afterSource).not.toBe(beforeSource);

    await page.getByRole("button", { name: "다른 아이디어 뽑기", exact: true }).click();
    await expect(page.locator(".idea-lab__stage--taste")).toHaveAttribute("data-question-id", "input");
    await expect(page.locator(".idea-lab__stage--taste")).not.toContainText(afterSource!);
    await page.getByRole("button", { name: "현재 결과로 돌아가기", exact: true }).click();
    await expect(page.locator(".idea-lab__stage--result")).toBeVisible();
  });

  test("Scenario 4a. 카카오톡 공유 화면을 연 뒤 전체 문구를 연다", async ({ page }) => {
    await installShareMock(page, "kakao");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await shareIdeaFromResult(page);
    const sharedStage = page.locator(".idea-lab__stage--result.is-unlocked");
    await expect(sharedStage).toBeVisible();
    await expect(page.locator(".idea-lab__stage--share-preview")).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--shared")).toHaveCount(0);
    await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");
    await expect(sharedStage.getByText(
      "제작 자료 3개를 열었어요.",
      { exact: true },
    ))
      .toBeVisible();
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "이미지 프롬프트 복사" })).toBeEnabled();
    await expect(sharedStage.locator(".idea-lab__artifact-example img"))
      .toBeVisible();
    await expect(page.getByRole("button", { name: "전체 아이디어 브리프 복사" })).toBeEnabled();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);
    await expect(page.locator(".idea-lab__artifact").first()).toContainText("## 하드 게이트");
    await expect(page.locator(".idea-lab__artifact").nth(1)).toContainText("DESIGN SYSTEM");
    await expect(page.locator(".idea-lab__prompt-copy"))
      .toContainText("5) AI 코딩 도구에 붙여넣는 제작 프롬프트");
    await expect(page.locator(".idea-lab__prompt-copy")).toContainText("6) 이미지 생성 프롬프트");
    const promptToggle = page.getByRole("button", { name: "전체 브리프 보기" });
    await expect(promptToggle).toHaveAttribute("aria-expanded", "false");
    const collapsedPrompt = await page.locator(".idea-lab__prompt-copy").evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(collapsedPrompt.clientHeight).toBeLessThan(collapsedPrompt.scrollHeight);
    await promptToggle.click();
    await expect(page.getByRole("button", { name: "전체 브리프 접기" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".idea-lab__prompt-copy")).toHaveCSS("max-height", "none");

    const calls = await shareCalls(page);
    expect(calls).toHaveLength(1);
    if (!calls[0].url) throw new Error("카카오톡 공유 payload에 URL이 없습니다.");
    expect(new URL(calls[0].url).pathname).toMatch(/^\/praise\/[^/]+$/);
    const kakaoCalls = await kakaoShareCalls(page);
    expect(kakaoCalls).toHaveLength(1);
    expect(kakaoCalls[0]).toMatchObject({
      objectType: "text",
      buttonTitle: "친구 반응 남기기",
      installTalk: true,
      link: {
        webUrl: calls[0].url,
        mobileWebUrl: calls[0].url,
      },
      serverCallbackArgs: {
        request_id: expect.any(String),
      },
    });
    expect(await clipboardWrites(page)).toHaveLength(0);
    await assertShareEvents(page);
  });

  test("Scenario 4b. 하단 시트에서 카카오톡을 선택하면 Web Share와 클립보드를 쓰지 않는다", async ({ page }) => {
    await installShareMock(page, "kakao");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await shareIdeaFromResult(page);
    await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "이미지 프롬프트 복사" })).toBeEnabled();
    await expect(page.locator(".idea-lab__prompt-copy > p.is-locked")).toHaveCount(0);

    const calls = await shareCalls(page);
    const writes = await clipboardWrites(page);
    expect(calls).toHaveLength(1);
    expect(writes).toHaveLength(0);
    if (!calls[0].url) throw new Error("카카오톡 공유 payload에 URL이 없습니다.");
    expect(new URL(calls[0].url).pathname).toMatch(/^\/praise\/[^/]+$/);
    await assertShareEvents(page);
  });

  test("Scenario 4c. 공유 하단 시트는 세 경로를 보여주고 링크 복사로도 자료를 연다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installShareMock(page, "kakao");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    }).click();
    const sheet = page.getByRole("dialog", { name: "공유", exact: true });
    await expect(sheet).toBeVisible();
    for (const channel of ["인스타그램", "카카오톡", "링크 복사"]) {
      await expect(sheet.getByRole("button", { name: channel, exact: true })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--result")).not.toHaveClass(/is-unlocked/);
    await page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "링크 복사", exact: true }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();
    expect(await shareCalls(page)).toHaveLength(0);
    expect(await clipboardWrites(page)).toHaveLength(1);
    const events = await trackedEvents(page);
    expect(events.find((entry) => entry.event === "praise_request_share_completed")).toMatchObject({
      share_method: "copy",
      completion_signal: "link_copied",
    });
  });

  test("Scenario 5. 카카오톡 실행 실패 후 결과를 유지하고 동일 URL로 다시 시도한다", async ({ page }) => {
    await installShareMock(page, "fail-once");

    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    const kakaoButton = page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    });
    await kakaoButton.click();
    await chooseKakaoShare(page);
    await expect(page.getByText("공유를 시작하지 못했어요. 결과는 그대로 보관돼요.", { exact: true })).toBeVisible();
    await expect(page.locator(".idea-lab__stage--result")).not.toHaveClass(/is-unlocked/);
    await expect(kakaoButton).toBeEnabled();
    expect(await clipboardWrites(page)).toHaveLength(0);

    const cancelledEvents = await trackedEvents(page);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(cancelledEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(false);

    const firstCalls = await shareCalls(page);
    expect(firstCalls).toHaveLength(1);
    if (!firstCalls[0].url) throw new Error("취소된 공유 payload에 URL이 없습니다.");
    const firstUrl = firstCalls[0].url;

    await kakaoButton.click();
    await chooseKakaoShare(page);
    await expect(page.locator(".idea-lab__stage--result.is-unlocked")).toBeVisible();
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();

    const retriedCalls = await shareCalls(page);
    expect(retriedCalls).toHaveLength(2);
    if (!retriedCalls[1].url) throw new Error("재시도 공유 payload에 URL이 없습니다.");
    const retriedEvents = await trackedEvents(page);
    expect(retriedEvents.some((entry) => entry.event === "praise_request_share_cancelled")).toBe(true);
    expect(retriedEvents.some((entry) => entry.event === "praise_request_share_completed")).toBe(true);
    expect(retriedEvents.find((entry) => entry.event === "praise_request_share_cancelled")).toMatchObject({
      share_method: "kakao",
    });
    expect(retriedEvents.find((entry) => entry.event === "praise_request_share_completed")).toMatchObject({
      share_method: "kakao",
    });

    expect(retriedCalls[1].url).toBe(firstUrl);
  });

  test("Scenario 6. 생성한 응원 링크에서 공유한 아이디어와 응원 행동을 연다", async ({ page, context }) => {
    await installShareMock(page, "kakao");
    await openIdeaLab(page);
    await drawAll(page);
    await goResult(page);

    await shareIdeaFromResult(page);
    await expect(page.getByRole("button", { name: "AI 코딩 프롬프트 복사" })).toBeEnabled();

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("oneul:latest-praise-request:v1") ?? "null") as {
        slug: string;
        card: TestPraiseRequestCard;
      } | null,
    );
    expect(saved).not.toBeNull();

    const calls = await shareCalls(page);
    expect(calls).toHaveLength(1);
    if (!saved || !calls[0].url) throw new Error("생성된 칭찬 요청 링크를 찾을 수 없습니다.");
    expect(new URL(calls[0].url).pathname).toBe(`/praise/${saved.slug}`);

    const receiver = await context.newPage();
    await receiver.goto(calls[0].url);
    await expect(receiver.getByRole("heading", { name: saved.card.title })).toBeVisible();
    await expect(receiver.getByText(saved.card.summary, { exact: true })).toBeVisible();
    await expect(receiver.getByRole("button", { name: "반응 보내기", exact: true })).toBeVisible();

    await expect.poll(async () => {
      const events = await trackedEvents(receiver);
      return events.some((entry) =>
        entry.event === "praise_request_opened" && entry.request_id === saved.card.id,
      );
    }).toBe(true);
  });

  test("Scenario 14 (아이디어 화면). 브랜드색·접근 가능한 액션색·네 분류색을 구분하고 dark scheme을 유지한다", async ({ page }) => {
    await openIdeaLab(page);

    const theme = await page.locator("html").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        colorScheme: style.colorScheme,
        primary: style.getPropertyValue("--primary").trim().toLowerCase(),
      };
    });
    expect(theme).toEqual({ colorScheme: "dark", primary: "#ff4458" });

    await expect(page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true })).toHaveCount(0);
    await page.locator(".idea-lab__slot.is-carousel-active .idea-lab__card-frame button").click();
    await expect(page.getByRole("button", { name: "나머지 자동으로 뽑기", exact: true })).toHaveCount(0);

    const axisColors = await Promise.all(AXIS_LABELS.map((label) =>
      axisCard(page, label).evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--axis").trim().toLowerCase()),
    ));
    expect(axisColors).toEqual(["#6db4f5", "#7de4be", "#e8c56a", "#ff8091"]);
    expect(axisColors).not.toContain(theme.primary);

    await drawAll(page);
    await goResult(page);
    await page.mouse.move(0, 0); // 방금 클릭한 위치의 :hover 색이 잡히지 않도록 포인터를 치운다
    const actionPrimary = await page.locator(".idea-lab").evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--action-primary").trim().toLowerCase());
    expect(actionPrimary).toBe("#d92d45");
    await expect(page.getByRole("button", {
      name: "공유하고 제작 자료 3개 열기",
      exact: true,
    }))
      .toHaveCSS("background-color", "rgb(217, 45, 69)");
  });

  test("Scenario 15. 390px 화면의 200% 확대 등가 폭에서도 결과 카드가 가로로 잘리지 않는다", async ({ page }) => {
    await page.setViewportSize({ width: 195, height: 422 });
    await openIdeaLab(page);
    await drawAll(page);

    const layout = await page.locator(".idea-lab__stage--result").evaluate((stage) => {
      const scroll = stage.querySelector<HTMLElement>(".idea-lab__stage-scroll")!;
      const result = stage.querySelector<HTMLElement>(".idea-lab__result")!;
      const summary = stage.querySelector<HTMLElement>(".idea-lab__result-summary")!;
      return {
        documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        scrollFits: scroll.scrollWidth <= scroll.clientWidth,
        resultFits: result.scrollWidth <= result.clientWidth,
        summaryFits: summary.scrollWidth <= summary.clientWidth,
        summaryWithinResult:
          summary.getBoundingClientRect().left >= result.getBoundingClientRect().left
          && summary.getBoundingClientRect().right <= result.getBoundingClientRect().right,
      };
    });
    expect(layout).toEqual({
      documentFits: true,
      scrollFits: true,
      resultFits: true,
      summaryFits: true,
      summaryWithinResult: true,
    });
  });

  test("Scenario 16. 결과 카드는 질문 우선 타입 위계와 4.5대 1 액션 대비를 유지한다", async ({ page }) => {
    await openIdeaLab(page);
    await drawAll(page);

    const result = page.locator(".idea-lab__stage--result");
    const typeScale = await result.evaluate((stage) => {
      const fontSize = (selector: string) =>
        Number.parseFloat(getComputedStyle(stage.querySelector<HTMLElement>(selector)!).fontSize);
      const headline = stage.querySelector<HTMLElement>(".idea-lab__result-hook")!;
      const headlineLineHeight = Number.parseFloat(getComputedStyle(headline).lineHeight);
      return {
        nameTag: stage.querySelector(".idea-lab__result-name")!.tagName,
        headlineTag: headline.tagName,
        headlineLines: Math.round(headline.getBoundingClientRect().height / headlineLineHeight),
        name: fontSize(".idea-lab__result-name"),
        headline: fontSize(".idea-lab__result-hook"),
        before: fontSize(".idea-lab__result-story span"),
        after: fontSize(".idea-lab__result-story strong"),
        action: fontSize(".idea-lab__cta--primary"),
      };
    });
    expect(typeScale.nameTag).toBe("P");
    expect(typeScale.headlineTag).toBe("H2");
    expect(typeScale.headlineLines).toBeLessThanOrEqual(3);
    expect(typeScale.name).toBeGreaterThanOrEqual(18.5);
    expect(typeScale.headline).toBeGreaterThanOrEqual(23);
    expect(typeScale.before).toBeGreaterThanOrEqual(18.5);
    expect(typeScale.after).toBeGreaterThanOrEqual(18.5);
    expect(typeScale.action).toBeGreaterThanOrEqual(15);
    expect(typeScale.headline).toBeGreaterThan(typeScale.name);
    expect(typeScale.headline).toBeGreaterThan(typeScale.after);

    const actionContrast = await result.locator(".idea-lab__cta--primary").evaluate((button) => {
      const channels = (value: string) =>
        value.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number];
      const luminance = (value: string) => {
        const [red, green, blue] = channels(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        }) as [number, number, number];
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const style = getComputedStyle(button);
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05)
        / (Math.min(foreground, background) + 0.05);
    });
    expect(actionContrast).toBeGreaterThanOrEqual(4.5);
  });
});
