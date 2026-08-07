#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-ai-dominant-posters-2026-07-27",
);
const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const WIDTH = 1080;
const HEIGHT = 1350;

const variants = [
  {
    id: "a-archive-overload",
    source: path.join(GENERATED_DIR, "a-archive-overload.png"),
    title: ["저장한 맛집 쇼츠만", "200개."],
    fontSize: 76,
    titleX: 70,
    titleY: 128,
    textWidth: 760,
    promptRecipe: "ai-dominant-visual-metaphor",
    scenarioStatus: "사용자가 제시한 개인 상황값",
  },
  {
    id: "b-next-morning",
    source: path.join(GENERATED_DIR, "b-next-morning.png"),
    title: ["어젯밤 본 그 식당,", "오늘은 못 찾았다."],
    fontSize: 66,
    titleX: 70,
    titleY: 128,
    textWidth: 820,
    promptRecipe: "ai-dominant-everyday-moment",
    scenarioStatus: "제품 문제 상황",
  },
  {
    id: "c-friend-waiting",
    source: path.join(GENERATED_DIR, "c-friend-waiting.png"),
    title: ["친구에게 보내려다", "10분째 저장 목록만", "내리는 중."],
    fontSize: 58,
    titleX: 70,
    titleY: 128,
    textWidth: 760,
    promptRecipe: "ai-dominant-relatable-comedy",
    scenarioStatus: "개인 상황 예시",
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(body, width = WIDTH, height = HEIGHT) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${body}
    </svg>`,
  );
}

function titleOverlay(variant) {
  const tspans = variant.title
    .map(
      (line, index) =>
        `<tspan x="${variant.titleX}" dy="${index === 0 ? 0 : variant.fontSize * 1.25}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return svg(`
    <defs>
      <filter id="title-shadow" x="-20%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#000" flood-opacity=".55"/>
      </filter>
    </defs>
    <text x="${variant.titleX}" y="${variant.titleY}" fill="#FFF9F1"
      font-family="Apple SD Gothic Neo, Pretendard, sans-serif"
      font-size="${variant.fontSize}" font-weight="900" letter-spacing="-2.2"
      filter="url(#title-shadow)">${tspans}</text>
  `);
}

async function renderVariant(variant) {
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  await sharp(variant.source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
    .composite([{input: titleOverlay(variant), left: 0, top: 0}])
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function contactSheet(outputs) {
  const thumbWidth = 324;
  const thumbHeight = 405;
  const gutter = 18;
  const top = 68;
  const sheetWidth = thumbWidth * outputs.length + gutter * (outputs.length + 1);
  const sheetHeight = thumbHeight + top + 24;
  const composites = [];
  for (let index = 0; index < outputs.length; index += 1) {
    composites.push({
      input: await sharp(outputs[index])
        .resize(thumbWidth, thumbHeight, {fit: "cover"})
        .png()
        .toBuffer(),
      left: gutter + index * (thumbWidth + gutter),
      top,
    });
  }
  composites.push({
    input: svg(
      `<text x="${gutter}" y="40" fill="#271E18" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="27" font-weight="900">맛핀 · AI 장면 + 제목만 3안</text>`,
      sheetWidth,
      sheetHeight,
    ),
  });
  const output = path.join(CAMPAIGN_DIR, "contact-sheet.png");
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#F3EEE7",
    },
  })
    .composite(composites)
    .png()
    .toFile(output);
  return output;
}

async function qaSheet(outputs, mode) {
  const thumbWidth = 160;
  const thumbHeight = 200;
  const gutter = 12;
  const sheetWidth = thumbWidth * outputs.length + gutter * (outputs.length + 1);
  const sheetHeight = thumbHeight + gutter * 2;
  const composites = [];
  for (let index = 0; index < outputs.length; index += 1) {
    let image = sharp(outputs[index]).resize(thumbWidth, thumbHeight, {fit: "cover"});
    image = mode === "blur" ? image.blur(12) : image.grayscale();
    composites.push({
      input: await image.png().toBuffer(),
      left: gutter + index * (thumbWidth + gutter),
      top: gutter,
    });
  }
  const output = path.join(CAMPAIGN_DIR, `qa-${mode}-160.png`);
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#F3EEE7",
    },
  })
    .composite(composites)
    .png()
    .toFile(output);
  return output;
}

async function main() {
  await fs.mkdir(RENDER_DIR, {recursive: true});
  const outputs = [];
  for (const variant of variants) {
    await fs.access(variant.source);
    outputs.push(await renderVariant(variant));
  }
  const sheet = await contactSheet(outputs);
  const blur = await qaSheet(outputs, "blur");
  const grayscale = await qaSheet(outputs, "grayscale");
  const report = {
    generatedAt: new Date().toISOString(),
    profile: {id: "ig_feed_portrait", width: WIDTH, height: HEIGHT, ratio: "4:5"},
    composition: {
      aiVisualCoverage: "approximately 90%+",
      codeLayers: ["title"],
      headlineLineHeight: 1.25,
      omittedFromImage: ["logo", "support copy", "CTA", "product cards", "disclaimer"],
      externalAdFieldsRequired: ["primary text", "native CTA button", "scenario qualifier"],
    },
    variants: variants.map((variant, index) => ({
      id: variant.id,
      promptRecipe: variant.promptRecipe,
      output: path.relative(ROOT, outputs[index]),
      title: variant.title.join(" "),
      scenarioStatus: variant.scenarioStatus,
      publishable: false,
      blockReason: "사람 승인과 Meta 본문·기본 CTA 설정이 필요합니다.",
    })),
    contactSheet: path.relative(ROOT, sheet),
    qa: {
      blur160: path.relative(ROOT, blur),
      grayscale160: path.relative(ROOT, grayscale),
    },
    publishable: false,
  };
  await fs.writeFile(
    path.join(CAMPAIGN_DIR, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(outputs.map((output) => path.relative(ROOT, output)).join("\n"));
  console.log(path.relative(ROOT, sheet));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
