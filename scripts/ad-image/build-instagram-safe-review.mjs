#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  INSTAGRAM_SAFE_AREAS,
  safeRect,
} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const PROFILE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const REVIEW_OUTPUT = path.join(
  ROOT,
  "outputs/ad-image-system/instagram-safe-area-review-2026-07-28.png",
);
const REPORT_OUTPUT = path.join(
  ROOT,
  "outputs/ad-image-system/instagram-safe-area-report-2026-07-28.json",
);
const FILES = [
  ["맛핀", "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/01-saved-shorts-200.png"],
  ["맛핀", "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/02-ai-restaurant-ui.png"],
  ["맛핀", "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/03-dinner-scroll.png"],
  ["한입코치", "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-a-night-table.png"],
  ["한입코치", "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-b-proof-flow.png"],
  ["한입코치", "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-c-after-work.png"],
  ["오늘", "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-a-memo.png"],
  ["오늘", "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-b-first.png"],
  ["오늘", "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-c-tomorrow.png"],
  ["캐릭터챗", "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-a-letter.png"],
  ["캐릭터챗", "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-b-bridge.png"],
  ["캐릭터챗", "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-c-reply.png"],
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(body, width, height) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

async function main() {
  const thumbWidth = 270;
  const thumbHeight = 338;
  const columns = 4;
  const rows = Math.ceil(FILES.length / columns);
  const gutter = 18;
  const header = 72;
  const labelHeight = 34;
  const sheetWidth = columns * thumbWidth + (columns + 1) * gutter;
  const sheetHeight =
    header + rows * (thumbHeight + labelHeight + gutter) + gutter;
  const scaledSafe = {
    x: Math.round((PROFILE.insets.left / PROFILE.width) * thumbWidth),
    y: Math.round((PROFILE.insets.top / PROFILE.height) * thumbHeight),
    width: Math.round(
      ((PROFILE.width - PROFILE.insets.left - PROFILE.insets.right) /
        PROFILE.width) *
        thumbWidth,
    ),
    height: Math.round(
      ((PROFILE.height - PROFILE.insets.top - PROFILE.insets.bottom) /
        PROFILE.height) *
        thumbHeight,
    ),
  };
  const composites = [];
  const files = [];

  for (let index = 0; index < FILES.length; index += 1) {
    const [app, relative] = FILES[index];
    const absolute = path.join(ROOT, relative);
    const metadata = await sharp(absolute).metadata();
    if (metadata.width !== PROFILE.width || metadata.height !== PROFILE.height) {
      throw new Error(
        `${relative} is ${metadata.width}x${metadata.height}; expected ${PROFILE.width}x${PROFILE.height}`,
      );
    }
    const left = gutter + (index % columns) * (thumbWidth + gutter);
    const top =
      header +
      Math.floor(index / columns) * (thumbHeight + labelHeight + gutter);
    const thumbnail = await sharp(absolute)
      .resize(thumbWidth, thumbHeight, {fit: "fill"})
      .composite([
        {
          input: svg(
            `<rect x="${scaledSafe.x}" y="${scaledSafe.y}" width="${scaledSafe.width}" height="${scaledSafe.height}"
              fill="none" stroke="#22E38A" stroke-width="4" stroke-dasharray="12 8"/>`,
            thumbWidth,
            thumbHeight,
          ),
        },
      ])
      .png()
      .toBuffer();
    composites.push({input: thumbnail, left, top});
    composites.push({
      input: svg(
        `<text x="0" y="24" fill="#241F1B" font-family="Pretendard, sans-serif"
          font-size="20" font-weight="800">${escapeXml(app)} ${index % 3 + 1}</text>`,
        thumbWidth,
        labelHeight,
      ),
      left,
      top: top + thumbHeight,
    });
    files.push({
      app,
      file: relative,
      width: metadata.width,
      height: metadata.height,
      result: "dimensions-passed-human-safe-area-review-required",
    });
  }

  composites.push({
    input: svg(
      `<text x="${gutter}" y="38" fill="#211C19" font-family="Pretendard, sans-serif"
        font-size="28" font-weight="800">Instagram Feed 4:5 · 공통 안전영역 검수</text>
       <text x="${gutter}" y="61" fill="#615A54" font-family="Pretendard, sans-serif"
        font-size="16" font-weight="600">초록 점선 안에 제목·로고·제품 증거를 유지 · 상하좌우 96px</text>`,
      sheetWidth,
      sheetHeight,
    ),
  });

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#F4EFE8",
    },
  })
    .composite(composites)
    .png({compressionLevel: 9})
    .toFile(REVIEW_OUTPUT);

  await fs.writeFile(
    REPORT_OUTPUT,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        feedPolicy: PROFILE,
        feedSafeRect: safeRect(PROFILE),
        storiesReelsPolicy: INSTAGRAM_SAFE_AREAS.storiesReels,
        files,
        reviewImage: path.relative(ROOT, REVIEW_OUTPUT),
        status: "dimensions-passed-human-safe-area-review-required",
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
