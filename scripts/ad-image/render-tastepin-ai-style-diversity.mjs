#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-ai-style-diversity-2026-07-27",
);
const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const WIDTH = 1080;
const HEIGHT = 1350;

const variants = [
  {
    id: "a-studio-3d",
    source: path.join(GENERATED_DIR, "a-studio-3d.png"),
    artDirection: "studio-3d-sculpture",
    title: ["저장한 맛집 쇼츠만", "200개."],
    size: 112,
    fill: "#FFF3DC",
  },
  {
    id: "b-cut-paper",
    source: path.join(GENERATED_DIR, "b-cut-paper.png"),
    artDirection: "cut-paper-editorial",
    title: ["어젯밤 본 그 식당,", "오늘은 못 찾았다."],
    size: 88,
    fill: "#FFF0D0",
  },
  {
    id: "c-clay-stop-motion",
    source: path.join(GENERATED_DIR, "c-clay-stop-motion.png"),
    artDirection: "clay-stop-motion",
    title: ["친구에게 보내려다", "10분째 저장 목록만", "내리는 중."],
    size: 80,
    fill: "#FFF1D8",
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
  const x = 68;
  const y = 145;
  const lines = variant.title
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : variant.size * 1.25}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return svg(`
    <defs>
      <filter id="shadow" x="-20%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".34"/>
      </filter>
    </defs>
    <text x="${x}" y="${y}" fill="${variant.fill}"
      font-family="Apple SD Gothic Neo, Pretendard, sans-serif"
      font-size="${variant.size}" font-weight="900" letter-spacing="-3"
      filter="url(#shadow)">${lines}</text>
  `);
}

async function renderVariant(variant) {
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  await sharp(variant.source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
    .composite([{input: titleOverlay(variant)}])
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function makeSheet(outputs, {mode = "normal", width = 324} = {}) {
  const height = Math.round(width * 1.25);
  const gutter = mode === "normal" ? 18 : 12;
  const top = mode === "normal" ? 68 : gutter;
  const sheetWidth = width * outputs.length + gutter * (outputs.length + 1);
  const sheetHeight = height + top + (mode === "normal" ? 24 : gutter);
  const composites = [];
  for (let index = 0; index < outputs.length; index += 1) {
    let image = sharp(outputs[index]).resize(width, height, {fit: "cover"});
    if (mode === "blur") image = image.blur(12);
    if (mode === "grayscale") image = image.grayscale();
    composites.push({
      input: await image.png().toBuffer(),
      left: gutter + index * (width + gutter),
      top,
    });
  }
  if (mode === "normal") {
    composites.push({
      input: svg(
        `<text x="${gutter}" y="40" fill="#271E18" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="27" font-weight="900">맛핀 · 서로 다른 AI 미술 방식 3안</text>`,
        sheetWidth,
        sheetHeight,
      ),
    });
  }
  const filename =
    mode === "normal" ? "contact-sheet.png" : `qa-${mode}-160.png`;
  const output = path.join(CAMPAIGN_DIR, filename);
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
  const contactSheet = await makeSheet(outputs);
  const blur = await makeSheet(outputs, {mode: "blur", width: 160});
  const grayscale = await makeSheet(outputs, {mode: "grayscale", width: 160});
  const report = {
    generatedAt: new Date().toISOString(),
    profile: {id: "ig_feed_portrait", width: WIDTH, height: HEIGHT, ratio: "4:5"},
    composition: {
      aiVisualCoverage: "approximately 90%+",
      codeLayers: ["title"],
      headlineLineHeight: 1.25,
      headlineFontRange: "80-112px",
      distinctArtDirections: variants.map((variant) => variant.artDirection),
      photorealHumanVariantCount: 0,
    },
    variants: variants.map((variant, index) => ({
      id: variant.id,
      artDirection: variant.artDirection,
      output: path.relative(ROOT, outputs[index]),
      title: variant.title.join(" "),
      fontSize: variant.size,
      publishable: false,
      blockReason: "사람 승인과 Meta 본문·기본 CTA 설정이 필요합니다.",
    })),
    contactSheet: path.relative(ROOT, contactSheet),
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
  console.log(path.relative(ROOT, contactSheet));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
