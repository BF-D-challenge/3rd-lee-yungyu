#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {INSTAGRAM_SAFE_AREAS} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const OUT = path.join(
  ROOT,
  "outputs/ad-image-system/onebite-30f-reference-2026-07-28",
);
const GENERATED = path.join(OUT, "assets/generated");
const RENDERS = path.join(OUT, "renders");
const SYNTHETIC_UI_CHROMA = path.join(
  GENERATED,
  "onebite-synthetic-ui-overlay-chroma.png",
);
const SYNTHETIC_UI_KEYED = path.join(
  GENERATED,
  "onebite-synthetic-ui-overlay-keyed.png",
);
const WIDTH = 1080;
const HEIGHT = 1350;
const FEED_SAFE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const FONT = "Black Han Sans, 검은고딕, sans-serif";

process.env.FONTCONFIG_FILE = path.join(
  ROOT,
  "outputs/ad-image-system/remaining-four-apps-2026-07-28/assets/fonts/fonts.conf",
);

const variants = [
  {
    id: "onebite-30f-a-night-table",
    lead: ["야근 끝났는데"],
    hero: ["야식은 왜", "시작했어요?"],
    shadeOpacity: 0.72,
    leadFontSize: 92,
    heroFontSize: 150,
    source: path.join(GENERATED, "onebite-30f-a-night-table.png"),
    artDirection: "photoreal-editorial-still-life",
    syntheticUi: null,
  },
  {
    id: "onebite-30f-b-proof-flow",
    lead: ["사진 한 장이면"],
    hero: ["다음 끼니가", "정해져요."],
    shadeOpacity: 0.48,
    leadFontSize: 88,
    heroFontSize: 148,
    source: path.join(GENERATED, "onebite-30f-b-proof-stage.png"),
    artDirection: "cut-paper-proof-stage",
    syntheticUi: SYNTHETIC_UI_KEYED,
  },
  {
    id: "onebite-30f-c-after-work",
    lead: ["밤 11시 치킨,"],
    hero: ["모른 척하고", "자려고요?"],
    shadeOpacity: 0.72,
    leadFontSize: 92,
    heroFontSize: 150,
    source: path.join(GENERATED, "onebite-30f-c-after-work.png"),
    artDirection: "gouache-editorial-reaction",
    syntheticUi: null,
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

function titleOverlay(variant) {
  const x = FEED_SAFE.insets.left;
  const leadBaseline = 230;
  const heroBaseline = 414;
  const leadAdvance = Math.round(variant.leadFontSize * 1.25);
  const heroAdvance = Math.round(variant.heroFontSize * 1.25);
  const leadNodes = variant.lead
    .map((line, index) => {
      return `<text x="${x}" y="${leadBaseline + index * leadAdvance}"
        fill="#FFFFFF" stroke="#050505" stroke-width="9"
        stroke-linejoin="round" paint-order="stroke fill"
        font-family="${FONT}" font-size="${variant.leadFontSize}"
        font-weight="900" letter-spacing="${Math.round(variant.leadFontSize * -0.03)}"
        filter="url(#shadow)">${escapeXml(line)}</text>`;
    })
    .join("\n");
  const heroNodes = variant.hero
    .map((line, index) => {
      return `<text x="${x}" y="${heroBaseline + index * heroAdvance}"
        fill="#FFFFFF" stroke="#050505" stroke-width="13"
        stroke-linejoin="round" paint-order="stroke fill"
        font-family="${FONT}" font-size="${variant.heroFontSize}"
        font-weight="900" letter-spacing="${Math.round(variant.heroFontSize * -0.04)}"
        filter="url(#shadow)">${escapeXml(line)}</text>`;
    })
    .join("\n");

  return svg(`
    <defs>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#19100D" stop-opacity="${variant.shadeOpacity}"/>
        <stop offset=".72" stop-color="#19100D" stop-opacity=".18"/>
        <stop offset="1" stop-color="#19100D" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="5"
          flood-color="#000" flood-opacity=".52"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="710" fill="url(#top)"/>
    ${leadNodes}
    ${heroNodes}
  `);
}

async function prepareSyntheticUiOverlay() {
  const {data, info} = await sharp(SYNTHETIC_UI_CHROMA)
    .removeAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const output = Buffer.alloc(info.width * info.height * 4);
  for (
    let sourceIndex = 0, targetIndex = 0;
    sourceIndex < data.length;
    sourceIndex += 3, targetIndex += 4
  ) {
    const red = data[sourceIndex];
    const green = data[sourceIndex + 1];
    const blue = data[sourceIndex + 2];
    const dominance = green - Math.max(red, blue);
    let alpha = 255;
    if (green > 120 && dominance > 35) {
      alpha = Math.round(
        255 * Math.max(0, Math.min(1, (95 - dominance) / 60)),
      );
    }
    output[targetIndex] = red;
    output[targetIndex + 1] =
      alpha < 255 ? Math.min(green, Math.max(red, blue)) : green;
    output[targetIndex + 2] = blue;
    output[targetIndex + 3] = alpha;
  }
  await sharp(output, {
    raw: {width: info.width, height: info.height, channels: 4},
  })
    .trim({background: {r: 0, g: 0, b: 0, alpha: 0}, threshold: 8})
    .png({compressionLevel: 9})
    .toFile(SYNTHETIC_UI_KEYED);
}

async function renderVariant(variant) {
  const output = path.join(RENDERS, `${variant.id}.png`);
  const base = sharp(variant.source).resize(WIDTH, HEIGHT, {
    fit: "cover",
    position: "centre",
  });
  const composites = [];

  if (variant.syntheticUi) {
    const {data, info} = await sharp(variant.syntheticUi)
      .resize({height: 700, withoutEnlargement: true})
      .png()
      .toBuffer({resolveWithObject: true});
    composites.push({
      input: data,
      left: Math.round((WIDTH - info.width) / 2),
      top: 540,
    });
  }
  composites.push({input: titleOverlay(variant)});

  await base
    .composite(composites)
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function makeContactSheet(outputs) {
  const width = 320;
  const height = 400;
  const gutter = 18;
  const top = 66;
  const sheetWidth = width * 3 + gutter * 4;
  const sheetHeight = top + height + gutter * 2;
  const composites = [];

  for (let index = 0; index < outputs.length; index += 1) {
    composites.push({
      input: await sharp(outputs[index])
        .resize(width, height, {fit: "cover"})
        .png()
        .toBuffer(),
      left: gutter + index * (width + gutter),
      top,
    });
  }
  composites.push({
    input: svg(
      `<text x="${gutter}" y="41" fill="#211C19"
        font-family="Pretendard, sans-serif" font-size="29"
        font-weight="800">한입코치 · 30대 여성 타깃 3안</text>`,
      sheetWidth,
      sheetHeight,
    ),
  });
  const output = path.join(OUT, "onebite-30f-contact-sheet.png");
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#F2EDE5",
    },
  })
    .composite(composites)
    .png()
    .toFile(output);
  return output;
}

async function main() {
  await fs.mkdir(RENDERS, {recursive: true});
  const missing = [];
  for (const variant of variants) {
    try {
      await fs.access(variant.source);
    } catch {
      missing.push(path.relative(ROOT, variant.source));
    }
  }
  try {
    await fs.access(SYNTHETIC_UI_CHROMA);
  } catch {
    missing.push(path.relative(ROOT, SYNTHETIC_UI_CHROMA));
  }
  if (missing.length > 0) {
    throw new Error(`Missing assets:\n${missing.join("\n")}`);
  }
  await prepareSyntheticUiOverlay();

  const outputs = [];
  for (const variant of variants) outputs.push(await renderVariant(variant));
  const contactSheet = await makeContactSheet(outputs);
  const files = await Promise.all(
    outputs.map(async (output, index) => {
      const info = await sharp(output).metadata();
      return {
        id: variants[index].id,
        output: path.relative(ROOT, output),
        width: info.width,
        height: info.height,
        title: [...variants[index].lead, ...variants[index].hero].join("\n"),
        headlineHierarchy: {
          levels: 2,
          lead: variants[index].lead,
          hero: variants[index].hero,
          leadFontSize: variants[index].leadFontSize,
          heroFontSize: variants[index].heroFontSize,
        },
        typography: {
          fill: "#FFFFFF",
          outline: "#050505",
          leadOutlinePx: 9,
          heroOutlinePx: 13,
          font: "Black Han Sans",
          weight: 900,
          lineHeight: 1.25,
        },
        artDirection: variants[index].artDirection,
        syntheticUi: variants[index].syntheticUi
          ? path.relative(ROOT, variants[index].syntheticUi)
          : null,
        uiMode: variants[index].syntheticUi
          ? "ai-synthetic-concept"
          : "none",
        target: "30대 여성",
        visibleSupportingCopy: false,
        headlinePaddingPx: FEED_SAFE.insets,
        reference: "reference-high-response.png",
        publishable: false,
      };
    }),
  );
  const report = {
    generatedAt: new Date().toISOString(),
    count: files.length,
    canvas: {width: WIDTH, height: HEIGHT},
    safeArea: FEED_SAFE,
    contactSheet: path.relative(ROOT, contactSheet),
    sourceReference: path.relative(
      ROOT,
      path.join(OUT, "reference-high-response.png"),
    ),
    productEvidence: [],
    actualProductScreensUsed: false,
    syntheticUiSource: path.relative(ROOT, SYNTHETIC_UI_CHROMA),
    files,
  };
  await fs.writeFile(
    path.join(OUT, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
