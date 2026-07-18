import { expect, test } from "@playwright/test";
import {
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
    name: "친구에게 공유하세요, 만들 자료가 바로 열려요",
    exact: true,
  })).toBeVisible();
  await expect(result.getByRole("img", {
    name: /맛집 영상 링크 입력부터 지도와 여행 동선까지 이어지는 맛핀 화면 예시/,
  })).toBeVisible();
  await expect(result.locator(".idea-lab__unlocked-content")).toHaveCount(0);
  await expect(result.locator(".idea-lab__product-proof")).toHaveCount(0);
  await expect(result.locator(".idea-lab__share-exchange")).toHaveCount(0);

  const lockedStyle = await lockedDetails.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      scrollHeight: element.scrollHeight,
      columns: style.gridTemplateColumns,
      mask: `${style.maskImage} ${style.getPropertyValue("-webkit-mask-image")}`,
    };
  });
  expect(lockedStyle.height).toBeLessThan(lockedStyle.scrollHeight);
  expect(lockedStyle.columns === "none" || lockedStyle.columns.split(" ").length === 1).toBe(true);
  expect(lockedStyle.mask).toContain("gradient");

  await result.getByRole("button", {
    name: "공유하고 결과 보기",
    exact: true,
  }).click();

  await expect(result).toHaveClass(/is-unlocked/);
  await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");
  await expect(page).toHaveURL(currentUrl);
  await expect(page.locator(".idea-lab__stage--share-preview")).toHaveCount(0);
  await expect(page.locator(".idea-lab__stage--shared")).toHaveCount(0);
  await expect(result.getByText(
    "카카오톡 공유 화면을 열었어요. 만들 자료가 모두 열렸습니다.",
    { exact: true },
  )).toBeVisible();
  await expect(result.locator(".idea-lab__artifact")).toHaveCount(2);
  await expect(result.getByRole("button", {
    name: "AI 코딩 프롬프트 복사",
    exact: true,
  })).toBeEnabled();
  await expect(result.getByRole("img", {
    name: /맛핀 이미지 예시/,
  })).toBeVisible();

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
  expect(await kakaoShareCalls(page)).toHaveLength(1);
  expect(await clipboardWrites(page)).toHaveLength(0);
});

test("카카오톡 실행이 실패하면 같은 결과 화면과 그라데이션을 유지하고 다시 시도할 수 있다", async ({ page }) => {
  await installShareMock(page, "fail-once");
  await page.goto("/");
  await drawAll(page);

  const result = page.locator(".idea-lab__stage--result");
  const shareButton = result.getByRole("button", {
    name: "공유하고 결과 보기",
    exact: true,
  });
  const currentUrl = page.url();

  await shareButton.click();
  await expect(result).not.toHaveClass(/is-unlocked/);
  await expect(page.locator(".idea-lab")).toHaveAttribute("data-stage", "result");
  await expect(page).toHaveURL(currentUrl);
  await expect(page.getByText(
    "카카오톡 공유 화면을 열지 못했어요. 결과는 그대로 보관돼요.",
    { exact: true },
  )).toBeVisible();

  const firstCalls = await shareCalls(page);
  expect(firstCalls).toHaveLength(1);
  await shareButton.click();
  await expect(result).toHaveClass(/is-unlocked/);
  const secondCalls = await shareCalls(page);
  expect(secondCalls).toHaveLength(2);
  expect(secondCalls[1].url).toBe(firstCalls[0].url);
});
