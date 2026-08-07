#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/final-overview-2026-07-28",
);
const OUTPUT_IMAGE = path.join(OUTPUT_DIR, "all-final-ads.png");
const OUTPUT_MANIFEST = path.join(OUTPUT_DIR, "manifest.json");
const FONT = "Pretendard, sans-serif";

const groups = [
  {
    app: "맛핀",
    status: "최종 승인 전",
    files: [
      "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/01-saved-shorts-200.png",
      "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/02-ai-restaurant-ui.png",
      "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/03-dinner-scroll.png",
    ],
  },
  {
    app: "한입코치",
    status: "최종 승인 전",
    files: [
      "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-a-night-table.png",
      "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-b-proof-flow.png",
      "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-c-after-work.png",
    ],
  },
  {
    app: "오늘 해볼까",
    status: "통합 기능 구현 전 콘셉트",
    files: [
      "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-a-memo.png",
      "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-b-first.png",
      "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-c-tomorrow.png",
    ],
  },
  {
    app: "캐릭터챗",
    status: "최종 승인 전 · Mock 대화",
    files: [
      "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-a-letter.png",
      "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-b-bridge.png",
      "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-c-reply.png",
    ],
  },
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
  await fs.mkdir(OUTPUT_DIR, {recursive: true});
  const cardWidth = 300;
  const cardHeight = 375;
  const columns = 3;
  const gutter = 22;
  const titleHeight = 116;
  const rowLabelHeight = 54;
  const rowGap = 24;
  const sheetWidth = columns * cardWidth + (columns + 1) * gutter;
  const rowHeight = rowLabelHeight + cardHeight + rowGap;
  const sheetHeight = titleHeight + groups.length * rowHeight + gutter;
  const composites = [];
  const labels = [];
  const manifestFiles = [];

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    const rowTop = titleHeight + groupIndex * rowHeight;
    labels.push(
      `<text x="${gutter}" y="${rowTop + 31}" fill="#1D1D20"
        font-family="${FONT}" font-size="27" font-weight="900">${escapeXml(group.app)}</text>`,
    );
    labels.push(
      `<text x="${sheetWidth - gutter}" y="${rowTop + 30}" fill="#736D67"
        text-anchor="end" font-family="${FONT}" font-size="16"
        font-weight="700">${escapeXml(group.status)}</text>`,
    );

    for (let column = 0; column < group.files.length; column += 1) {
      const relative = group.files[column];
      const absolute = path.join(ROOT, relative);
      const metadata = await sharp(absolute).metadata();
      if (metadata.width !== 1080 || metadata.height !== 1350) {
        throw new Error(
          `${relative} is ${metadata.width}x${metadata.height}; expected 1080x1350`,
        );
      }
      composites.push({
        input: await sharp(absolute)
          .resize(cardWidth, cardHeight, {fit: "fill"})
          .png()
          .toBuffer(),
        left: gutter + column * (cardWidth + gutter),
        top: rowTop + rowLabelHeight,
      });
      manifestFiles.push({
        app: group.app,
        order: column + 1,
        file: relative,
        width: metadata.width,
        height: metadata.height,
        status: group.status,
      });
    }
  }

  composites.push({
    input: svg(
      `<text x="${gutter}" y="42" fill="#1D1D20" font-family="${FONT}"
        font-size="34" font-weight="900">BF.D 광고 최종 정리 · 12안</text>
       <text x="${gutter}" y="74" fill="#736D67" font-family="${FONT}"
        font-size="18" font-weight="700">4개 앱 × 3개 시안 · Instagram Feed 4:5</text>
       <text x="${gutter}" y="101" fill="#9A918A" font-family="${FONT}"
        font-size="15" font-weight="700">광고 게시·예산 집행은 별도 승인 필요</text>
       ${labels.join("\n")}`,
      sheetWidth,
      sheetHeight,
    ),
  });

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#F3EEE7",
    },
  })
    .composite(composites)
    .png({compressionLevel: 9})
    .toFile(OUTPUT_IMAGE);

  const manifest = {
    generatedAt: new Date().toISOString(),
    count: manifestFiles.length,
    apps: groups.length,
    placement: {
      platform: "Instagram Feed",
      ratio: "4:5",
      width: 1080,
      height: 1350,
    },
    publishable: false,
    publishBlockers: [
      "최종 사람 승인",
      "Meta 광고 계정·예산·집행 승인",
      "오늘 해볼까 통합 기능 구현",
    ],
    overview: path.relative(ROOT, OUTPUT_IMAGE),
    files: manifestFiles,
  };
  await fs.writeFile(
    OUTPUT_MANIFEST,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
