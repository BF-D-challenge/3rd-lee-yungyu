import { expect, test } from "@playwright/test";
import {
  chooseKakaoShare,
  clipboardWrites,
  drawAll,
  installShareMock,
  kakaoShareCalls,
  shareCalls,
} from "./helpers";

test.use({ contextOptions: { reducedMotion: "reduce" } });

test("그라데이션 상세를 확인한 뒤 공유하면 같은 결과 화면에서 제작 자료가 열린다", async ({ page }) => {
  await installShareMock(page, "kakao");
  await page.goto("/");
  await drawAll(page);

  const result = page.locator(".idea-lab__stage--result");
  const currentUrl = page.url();
  const lockedDetails = result.locator(".idea-lab__locked-details");

  await expect(result).toBeVisible();
  await expect(result.locator(".idea-lab__result-story b")).toHaveCount(0);
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
  await expect(result.getByText(
    "혼자 저장해두면 아이디어로 끝납니다. 친구 반응을 받고 바로 만들기까지 한 번에 이어가세요.",
    { exact: true },
  )).toBeVisible();
  const unlockSummary = result.locator(".idea-lab__unlock-summary");
  await expect(result.locator(".idea-lab__unlock-summary > div")).toHaveCount(2);
  await expect(unlockSummary).toContainText("친구가 받는 것");
  await expect(unlockSummary).toContainText("아이디어 한 장과 한 줄 반응 링크");
  await expect(unlockSummary).toContainText("내가 받는 것");
  await expect(unlockSummary).toContainText("전체 브리프와 바로 붙여넣는 AI 프롬프트 2개");
  await expect(result.locator(".idea-lab__share-preview")).toHaveCount(0);
  await expect(result.locator(".idea-lab__unlock-example")).toHaveCount(0);
  const unlockAlignment = await result.locator(".idea-lab__unlock-guide").evaluate((guide) => {
    const textAlign = (selector: string) => getComputedStyle(
      guide.querySelector<HTMLElement>(selector)!,
    ).textAlign;
    const headingLeft = guide.querySelector<HTMLElement>("h3")!.getBoundingClientRect().left;
    const summaryLeft = guide.querySelector<HTMLElement>(".idea-lab__unlock-summary")!
      .getBoundingClientRect().left;

    return {
      heading: textAlign("h3"),
      summary: textAlign("dd"),
      privacy: textAlign(".idea-lab__privacy-note"),
      summaryOffset: Math.abs(summaryLeft - headingLeft),
      borderTopWidth: Number.parseFloat(getComputedStyle(guide).borderTopWidth),
    };
  });
  expect(unlockAlignment).toEqual({
    heading: "left",
    summary: "left",
    privacy: "left",
    summaryOffset: 0,
    borderTopWidth: 0,
  });
  const hierarchy = await result.evaluate((stage) => {
    const fontSize = (selector: string) => Number.parseFloat(
      getComputedStyle(stage.querySelector<HTMLElement>(selector)!).fontSize,
    );
    const guideStyle = getComputedStyle(stage.querySelector<HTMLElement>(".idea-lab__unlock-guide")!);
    return {
      resultHook: fontSize(".idea-lab__result-hook"),
      unlockHeading: fontSize(".idea-lab__unlock-intro h3"),
      summaryTitle: fontSize(".idea-lab__unlock-summary dt"),
      summaryBody: fontSize(".idea-lab__unlock-summary dd"),
      guidePaddingTop: Number.parseFloat(guideStyle.paddingTop),
      guidePaddingInline: Number.parseFloat(guideStyle.paddingLeft),
    };
  });
  expect(hierarchy.resultHook).toBeGreaterThan(hierarchy.unlockHeading);
  expect(hierarchy.unlockHeading).toBeGreaterThan(hierarchy.summaryBody);
  expect(hierarchy.summaryBody).toBeGreaterThan(hierarchy.summaryTitle);
  expect(hierarchy.guidePaddingTop).toBeGreaterThanOrEqual(28);
  expect(hierarchy.guidePaddingInline).toBeGreaterThanOrEqual(16);
  const readingRhythm = await result.evaluate((stage) => {
    const ratio = (selector: string) => {
      const style = getComputedStyle(stage.querySelector<HTMLElement>(selector)!);
      return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize);
    };
    return {
      resultTitle: ratio(".idea-lab__result-hook"),
      sectionTitle: ratio(".idea-lab__unlock-intro h3"),
      summaryTitle: ratio(".idea-lab__unlock-summary dt"),
      summaryBody: ratio(".idea-lab__unlock-summary dd"),
    };
  });
  expect(readingRhythm.resultTitle).toBeCloseTo(1.5, 2);
  expect(readingRhythm.sectionTitle).toBeCloseTo(1.5, 2);
  expect(readingRhythm.summaryTitle).toBeCloseTo(1.5, 2);
  expect(readingRhythm.summaryBody).toBeCloseTo(1.75, 2);
  const cleanedDividers = await result.evaluate((stage) => {
    const firstSection = stage.querySelector<HTMLElement>(".idea-lab__result-section:first-child")!;
    const ours = stage.querySelector<HTMLElement>(".idea-lab__difference-list .is-ours")!;
    const firstStyle = getComputedStyle(firstSection);
    const oursStyle = getComputedStyle(ours);
    return {
      targetTopBorder: Number.parseFloat(firstStyle.borderTopWidth),
      quoteLeftBorder: Number.parseFloat(oursStyle.borderLeftWidth),
      quoteLeftPadding: Number.parseFloat(oursStyle.paddingLeft),
    };
  });
  expect(cleanedDividers).toEqual({
    targetTopBorder: 0,
    quoteLeftBorder: 0,
    quoteLeftPadding: 0,
  });
  const resultActions = await result.locator(".idea-lab__cta-bar--result").evaluate((actions) => ({
    directChild: actions.parentElement === actions.closest(".idea-lab__stage--result"),
    buttonCount: actions.querySelectorAll("button").length,
    containsExplanatoryCopy: Boolean(actions.querySelector("p")),
  }));
  expect(resultActions).toEqual({
    directChild: true,
    buttonCount: 2,
    containsExplanatoryCopy: false,
  });
  await expect(result.locator(".idea-lab__unlocked-content")).toHaveCount(0);
  await expect(result.locator(".idea-lab__product-proof")).toHaveCount(0);
  await expect(result.locator(".idea-lab__share-exchange")).toHaveCount(0);

  const lockedStyle = await lockedDetails.evaluate((element) => {
    const style = getComputedStyle(element);
    const fade = getComputedStyle(element, "::after");
    return {
      height: element.getBoundingClientRect().height,
      scrollHeight: element.scrollHeight,
      columns: style.gridTemplateColumns,
      mask: `${style.maskImage} ${style.getPropertyValue("-webkit-mask-image")}`,
      fadeHeight: Number.parseFloat(fade.height),
      fadeBackground: fade.backgroundImage,
      fadeBlur: `${fade.backdropFilter} ${fade.getPropertyValue("-webkit-backdrop-filter")}`,
    };
  });
  expect(lockedStyle.height).toBeLessThan(lockedStyle.scrollHeight);
  expect(lockedStyle.columns === "none" || lockedStyle.columns.split(" ").length === 1).toBe(true);
  expect(lockedStyle.mask).toContain("gradient");
  expect(lockedStyle.fadeHeight).toBeGreaterThanOrEqual(260);
  expect(lockedStyle.fadeBackground).toContain("gradient");
  expect(lockedStyle.fadeBlur).toContain("blur(5px)");

  await result.getByRole("button", {
    name: "공유하고 제작 자료 3개 열기",
    exact: true,
  }).click();
  await chooseKakaoShare(page);

  await expect(result).toHaveClass(/is-unlocked/);
  await expect.poll(() => lockedDetails.evaluate((element) =>
    getComputedStyle(element, "::after").display)).toBe("none");
  await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");
  await expect(page).toHaveURL(currentUrl);
  await expect(page.locator(".idea-lab__stage--share-preview")).toHaveCount(0);
  await expect(page.locator(".idea-lab__stage--shared")).toHaveCount(0);
  await expect(result.getByText(
    "제작 자료 3개를 열었어요.",
    { exact: true },
  )).toBeVisible();
  await expect(result.locator(".idea-lab__banner")).toHaveCSS("text-align", "left");
  await expect(result.locator(".idea-lab__artifact")).toHaveCount(2);
  await expect(result.getByRole("button", {
    name: "AI 코딩 프롬프트 복사",
    exact: true,
  })).toBeEnabled();
  await expect(result.getByRole("img", {
    name: /맛핀 이미지 예시/,
  })).toBeVisible();
  const fixedPraiseAction = result.locator(".idea-lab__cta-bar--result").getByRole("button", {
    name: "받은 응원 보기 →",
    exact: true,
  });
  await expect(fixedPraiseAction).toBeVisible();
  await expect(result.locator(".idea-lab__unlocked-content").getByRole("button", {
    name: "받은 응원 보기 →",
    exact: true,
  })).toHaveCount(0);

  const unlockedLayout = await result.evaluate((stage) => {
    const details = stage.querySelector<HTMLElement>(".idea-lab__locked-details")!;
    const artifacts = [...stage.querySelectorAll<HTMLElement>(".idea-lab__artifact")]
      .map((element) => element.getBoundingClientRect());
    const style = getComputedStyle(details);
    return {
      mask: `${style.maskImage} ${style.getPropertyValue("-webkit-mask-image")}`,
      detailsHeight: details.getBoundingClientRect().height,
      detailsScrollHeight: details.scrollHeight,
      firstBottom: artifacts[0].bottom,
      secondTop: artifacts[1].top,
      unlockedColumns: getComputedStyle(
        stage.querySelector<HTMLElement>(".idea-lab__unlocked-content")!,
      ).gridTemplateColumns,
    };
  });
  expect(unlockedLayout.mask).not.toContain("gradient");
  expect(Math.abs(unlockedLayout.detailsHeight - unlockedLayout.detailsScrollHeight)).toBeLessThanOrEqual(1);
  expect(unlockedLayout.secondTop).toBeGreaterThanOrEqual(unlockedLayout.firstBottom);
  expect(unlockedLayout.unlockedColumns.split(" ").length).toBe(1);
  const [kakaoCall] = await kakaoShareCalls(page);
  expect(kakaoCall.objectType).toBe("feed");
  if (kakaoCall.objectType !== "feed") throw new Error("카카오톡 이미지 피드가 아닙니다.");
  expect(kakaoCall.content.description.length).toBeGreaterThan(20);
  expect(kakaoCall.content.imageUrl).toContain("kakaocdn.net");
  expect(kakaoCall.buttonTitle).toBe("친구 반응 남기기");
  expect(await clipboardWrites(page)).toHaveLength(0);
});

test("카카오톡 실행이 실패하면 같은 결과 화면과 그라데이션을 유지하고 다시 시도할 수 있다", async ({ page }) => {
  await installShareMock(page, "fail-once");
  await page.goto("/");
  await drawAll(page);

  const result = page.locator(".idea-lab__stage--result");
  const shareButton = result.getByRole("button", {
    name: "공유하고 제작 자료 3개 열기",
    exact: true,
  });
  const currentUrl = page.url();

  await shareButton.click();
  await chooseKakaoShare(page);
  await expect(result).not.toHaveClass(/is-unlocked/);
  await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");
  await expect(page).toHaveURL(currentUrl);
  await expect(page.getByText(
    "공유를 시작하지 못했어요. 결과는 그대로 보관돼요.",
    { exact: true },
  )).toBeVisible();

  const firstCalls = await shareCalls(page);
  expect(firstCalls).toHaveLength(1);
  await shareButton.click();
  await chooseKakaoShare(page);
  await expect(result).toHaveClass(/is-unlocked/);
  const secondCalls = await shareCalls(page);
  expect(secondCalls).toHaveLength(2);
  expect(secondCalls[1].url).toBe(firstCalls[0].url);
});
