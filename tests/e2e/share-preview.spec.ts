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

test("공유 전부터 상세와 제작 자료를 쓰고 자발적으로 같은 결과를 공유한다", async ({ page }) => {
  await installShareMock(page, "kakao");
  await page.goto("/");
  await drawAll(page);

  const result = page.locator(".idea-lab__stage--result.is-unlocked");
  const details = result.locator(".idea-lab__locked-details");
  const currentUrl = page.url();

  await expect(result).toBeVisible();
  await expect(details).toContainText("🎯 타겟");
  await expect(details).toContainText("⚔️ 딱 하나 다른 점");
  await expect(details).toContainText("🗺️ 전체 플로우");
  await expect(details.locator(".idea-lab__result-section")).toHaveCount(3);
  await expect(result.locator(".idea-lab__unlock-guide")).toHaveCount(0);
  await expect(result.getByText(
    "공유하지 않아도 바로 쓸 수 있는 제작 자료예요.",
    { exact: true },
  )).toBeVisible();
  await expect(result.locator(".idea-lab__artifact")).toHaveCount(2);
  await expect(result.getByRole("button", {
    name: "AI 코딩 프롬프트 복사",
    exact: true,
  })).toBeEnabled();
  await expect(result.getByRole("button", {
    name: "이 기기에 결과 저장",
    exact: true,
  })).toBeVisible();

  const visibleDetails = await details.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      scrollHeight: element.scrollHeight,
      mask: `${style.maskImage} ${style.getPropertyValue("-webkit-mask-image")}`,
      columns: style.gridTemplateColumns,
    };
  });
  expect(Math.abs(visibleDetails.height - visibleDetails.scrollHeight)).toBeLessThanOrEqual(1);
  expect(visibleDetails.mask).not.toContain("gradient");
  expect(visibleDetails.columns === "none" || visibleDetails.columns.split(" ").length === 1).toBe(true);

  const actions = await result.locator(".idea-lab__cta-bar--result").evaluate((footer) => ({
    directChild: footer.parentElement === footer.closest(".idea-lab__stage--result"),
    buttonCount: footer.querySelectorAll("button").length,
    containsExplanatoryCopy: Boolean(footer.querySelector("p")),
  }));
  expect(actions).toEqual({
    directChild: true,
    buttonCount: 4,
    containsExplanatoryCopy: false,
  });

  await result.getByRole("button", {
    name: "친구에게 의견 물어보기",
    exact: true,
  }).click();
  await chooseKakaoShare(page);

  await expect(result).toBeVisible();
  await expect(page).toHaveURL(currentUrl);
  await expect(result.getByText(
    "친구에게 의견을 물어볼 공유 화면을 열었어요.",
    { exact: true },
  )).toBeVisible();
  await expect(result.locator(".idea-lab__artifact")).toHaveCount(2);

  const [kakaoCall] = await kakaoShareCalls(page);
  expect(kakaoCall.objectType).toBe("feed");
  if (kakaoCall.objectType !== "feed") throw new Error("카카오톡 이미지 피드가 아닙니다.");
  expect(kakaoCall.content.description.length).toBeGreaterThan(20);
  expect(kakaoCall.content.imageUrl).toContain("kakaocdn.net");
  expect(kakaoCall.buttonTitle).toBe("친구 반응 남기기");
  expect(await clipboardWrites(page)).toHaveLength(0);
});

test("카카오톡 실행이 실패해도 제작 자료를 유지하고 동일 URL로 다시 시도한다", async ({ page }) => {
  await installShareMock(page, "fail-once");
  await page.goto("/");
  await drawAll(page);

  const result = page.locator(".idea-lab__stage--result.is-unlocked");
  const shareButton = result.getByRole("button", {
    name: "친구에게 의견 물어보기",
    exact: true,
  });
  const currentUrl = page.url();

  await shareButton.click();
  await chooseKakaoShare(page);
  await expect(result).toBeVisible();
  await expect(page).toHaveURL(currentUrl);
  await expect(page.getByText(
    "공유를 시작하지 못했어요. 결과와 제작 자료는 그대로예요.",
    { exact: true },
  )).toBeVisible();
  await expect(result.getByRole("button", {
    name: "AI 코딩 프롬프트 복사",
    exact: true,
  })).toBeEnabled();

  const firstCalls = await shareCalls(page);
  expect(firstCalls).toHaveLength(1);
  await shareButton.click();
  await chooseKakaoShare(page);

  await expect(result).toBeVisible();
  await expect(page.getByText(
    "친구에게 의견을 물어볼 공유 화면을 열었어요.",
    { exact: true },
  )).toBeVisible();
  const secondCalls = await shareCalls(page);
  expect(secondCalls).toHaveLength(2);
  expect(secondCalls[1].url).toBe(firstCalls[0].url);
});
