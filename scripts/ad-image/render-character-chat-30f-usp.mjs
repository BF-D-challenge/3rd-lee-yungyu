#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {INSTAGRAM_SAFE_AREAS} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const OUT = path.join(
  ROOT,
  "outputs/ad-image-system/character-chat-30f-usp-2026-07-28",
);
const GENERATED = path.join(OUT, "assets/generated");
const RENDERS = path.join(OUT, "renders");
const SYNTHETIC_UI_CHROMA = path.join(
  GENERATED,
  "story-synthetic-reply-overlay-chroma.png",
);
const SYNTHETIC_UI_KEYED = path.join(
  GENERATED,
  "story-synthetic-reply-overlay-keyed.png",
);
const WIDTH = 1080;
const HEIGHT = 1350;
const FEED_SAFE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const TITLE_FONT = "RIDIBatang, 리디바탕, serif";
const CONTACT_FONT = "Pretendard, sans-serif";

process.env.FONTCONFIG_FILE = path.join(
  ROOT,
  "outputs/ad-image-system/remaining-four-apps-2026-07-28/assets/fonts/fonts.conf",
);

const variants = [
  {
    id: "story-usp-a-letter",
    title: ["못 보낸 말이 있다면,", "그가 먼저", "물어봐요."],
    accent: "#93CFFF",
    fontSize: 96,
    source: path.join(GENERATED, "story-usp-a-letter.png"),
    artDirection: "mature-josei-manhwa",
    syntheticUi: null,
  },
  {
    id: "story-usp-b-bridge",
    title: ["오늘 마음에 가까운", "장면 하나를", "골라보세요."],
    accent: "#7DE4BE",
    fontSize: 94,
    source: path.join(GENERATED, "story-usp-b-bridge.png"),
    artDirection: "photoreal-animation-bridge",
    syntheticUi: null,
  },
  {
    id: "story-usp-c-reply",
    title: ["답장은 골라도 되고,", "직접 써도", "괜찮아요."],
    accent: "#FF91B5",
    fontSize: 96,
    source: path.join(GENERATED, "story-usp-c-reply.png"),
    artDirection: "tactile-3d-product-demo",
    syntheticUi: SYNTHETIC_UI_KEYED,
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
  const firstBaseline = FEED_SAFE.insets.top + variant.fontSize + 32;
  const advance = Math.round(variant.fontSize * 1.25);
  const nodes = variant.title
    .map((line, index) => {
      const fill =
        index === variant.title.length - 1 ? variant.accent : "#FFF9EF";
      return `<text x="${x}" y="${firstBaseline + index * advance}"
        fill="${fill}" stroke="${fill}" stroke-width="3"
        paint-order="stroke fill"
        font-family="${TITLE_FONT}" font-size="${variant.fontSize}"
        font-weight="400" letter-spacing="${Math.round(variant.fontSize * -0.04)}"
        filter="url(#shadow)">${escapeXml(line)}</text>`;
    })
    .join("\n");
  return svg(`
    <defs>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#05070D" stop-opacity=".82"/>
        <stop offset=".7" stop-color="#05070D" stop-opacity=".18"/>
        <stop offset="1" stop-color="#05070D" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="9"
          flood-color="#000" flood-opacity=".62"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="650" fill="url(#top)"/>
    ${nodes}
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
  const composites = [];
  if (variant.syntheticUi) {
    const {data, info} = await sharp(variant.syntheticUi)
      .resize({height: 620, withoutEnlargement: true})
      .png()
      .toBuffer({resolveWithObject: true});
    composites.push({
      input: data,
      left: WIDTH - FEED_SAFE.insets.right - info.width,
      top: 620,
    });
  }
  composites.push({input: titleOverlay(variant)});
  await sharp(variant.source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
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
        font-family="${CONTACT_FONT}" font-size="29"
        font-weight="800">상황 카드 캐릭터챗 · USP 광고 3안</text>`,
      sheetWidth,
      sheetHeight,
    ),
  });
  const output = path.join(OUT, "character-chat-usp-contact-sheet.png");
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
      const metadata = await sharp(output).metadata();
      return {
        id: variants[index].id,
        output: path.relative(ROOT, output),
        width: metadata.width,
        height: metadata.height,
        title: variants[index].title.join("\n"),
        artDirection: variants[index].artDirection,
        target: "30대 여성",
        productEvidence: [],
        syntheticUi: variants[index].syntheticUi
          ? path.relative(ROOT, variants[index].syntheticUi)
          : null,
        uiMode: variants[index].syntheticUi
          ? "ai-synthetic-concept"
          : "none",
        truthStatus: "mock-prepared-dialogue",
        publishable: false,
      };
    }),
  );
  const report = {
    generatedAt: new Date().toISOString(),
    count: files.length,
    canvas: {width: WIDTH, height: HEIGHT},
    safeArea: FEED_SAFE,
    lineHeight: 1.25,
    font: "리디바탕",
    contactSheet: path.relative(ROOT, contactSheet),
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
