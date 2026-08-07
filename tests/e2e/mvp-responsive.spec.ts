import { expect, test } from "@playwright/test";

const routes = ["/", "/matpin", "/onebite", "/today", "/story-cards"] as const;
const viewports = [
  { name: "compact", width: 390, height: 844 },
  { name: "medium-boundary", width: 839, height: 900 },
  { name: "expanded-boundary", width: 840, height: 900 },
  { name: "expanded", width: 1280, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} ${viewport.width}px에서 4개 앱에 가로 넘침이 없다`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const sizes = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(
        sizes.scrollWidth,
        `${route} ${viewport.width}px scrollWidth`,
      ).toBeLessThanOrEqual(sizes.clientWidth + 1);
    }
  });
}

test("840px부터 허브 앱 네 개가 안정적인 2×2 배열이 된다", async ({ page }) => {
  await page.setViewportSize({ width: 840, height: 1000 });
  await page.goto("/");

  const cards = page.getByRole("region", { name: "앱 선택" }).getByRole("link");
  await expect(cards).toHaveCount(4);
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: Math.round(rect.left), top: Math.round(rect.top), height: Math.round(rect.height) };
  }));

  expect(boxes[0].left).toBe(boxes[2].left);
  expect(boxes[1].left).toBe(boxes[3].left);
  expect(boxes[0].top).toBe(boxes[1].top);
  expect(boxes[2].top).toBe(boxes[3].top);
  expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
});

test("모바일 첫 화면의 모든 버튼과 이동 링크는 48px 터치 영역을 가진다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of routes) {
    await page.goto(route);
    const undersized = await page.locator("main button, main a[href], main select").evaluateAll(
      (elements) => elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const visible = (
          style.display !== "none"
          && style.visibility !== "hidden"
          && Number(style.opacity) > 0
          && rect.width > 0
          && rect.height > 0
        );
        return visible && rect.height < 47.5
          ? [{
              label: element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40) ?? element.tagName,
              height: Math.round(rect.height * 10) / 10,
            }]
          : [];
      }),
    );

    expect(undersized, `${route}의 48px 미만 조작 요소`).toEqual([]);
  }
});

test("200% 텍스트에서도 허브와 주요 입력 화면을 가로 스크롤 없이 쓴다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/onebite", "/today", "/story-cards"]) {
    await page.goto(route);
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await page.evaluate(() => document.fonts.ready);
    const sizes = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(sizes.scrollWidth, `${route} 200% scrollWidth`).toBeLessThanOrEqual(
      sizes.clientWidth + 1,
    );
  }
});
