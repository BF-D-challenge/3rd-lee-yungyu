#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {INSTAGRAM_SAFE_AREAS} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/remaining-four-apps-2026-07-28",
);
process.env.FONTCONFIG_FILE = path.join(CAMPAIGN_DIR, "assets/fonts/fonts.conf");
const {default: sharp} = await import("sharp");

const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const TASTEPIN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders",
);
const WIDTH = 1080;
const HEIGHT = 1350;
const FEED_SAFE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const CONTACT_FONT = "Pretendard, sans-serif";

const variants = [
  {
    id: "onebite-a",
    app: "한입코치",
    lines: ["채소 또", "빼먹었죠?"],
    fact: "보이는 음식군만 확인",
    accent: "#FF5145",
    fontFamily: "Black Han Sans, 검은고딕, sans-serif",
    fontWeight: 400,
    fontLabel: "Black Han Sans",
    fontStroke: 7,
    titleFontSize: 166,
    titleX: 96,
    titleStartY: 220,
    minimalHeadline: true,
  },
  {
    id: "onebite-b",
    app: "한입코치",
    lines: ["물은 어디", "갔어요?"],
    fact: "숫자 대신 행동 하나",
    accent: "#FFF02F",
    fontFamily: "Black Han Sans, 검은고딕, sans-serif",
    fontWeight: 400,
    fontLabel: "Black Han Sans",
    fontStroke: 7,
    titleFontSize: 168,
    titleX: 96,
    titleStartY: 220,
    minimalHeadline: true,
  },
  {
    id: "onebite-c",
    app: "한입코치",
    lines: ["이걸 사진이라고", "찍었어요?"],
    fact: "불확실하면 재촬영 안내",
    accent: "#FF6C4A",
    fontFamily: "Black Han Sans, 검은고딕, sans-serif",
    fontWeight: 400,
    fontLabel: "Black Han Sans",
    fontStroke: 7,
    titleFontSize: 138,
    titleX: 96,
    titleStartY: 208,
    minimalHeadline: true,
  },
  {
    id: "today-a-a",
    app: "오늘",
    lines: ["뭘 해볼지", "모르겠다면?", "몇 가지만 골라봐."],
    fact: "쉬운 질문으로 아이디어 찾기 · 구현 전",
    accent: "#FFD84D",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: 800,
    fontLabel: "Pretendard ExtraBold",
    truthStatus: "concept-only",
  },
  {
    id: "today-a-c",
    app: "오늘",
    lines: ["아이디어를 고르면,", "광고랑 소개 페이지를", "만들어드려요."],
    fact: "광고·소개 페이지 최대 1일 · 구현 전",
    accent: "#8DFFDC",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: 800,
    fontLabel: "Pretendard ExtraBold",
    truthStatus: "concept-only",
  },
  {
    id: "today-b-b",
    app: "오늘",
    lines: ["하루 뒤,", "몇 명이 눌렀는지", "알려드려요."],
    fact: "광고 시작 뒤 1차 결과 · 구현 전",
    accent: "#F4FF4F",
    fontFamily: "Pretendard, sans-serif",
    fontWeight: 800,
    fontLabel: "Pretendard ExtraBold",
    truthStatus: "concept-only",
  },
  {
    id: "story-a",
    app: "카드형 캐릭터챗",
    lines: ["막차가 떠나기 전,", "그가 먼저", "말을 걸었다."],
    fact: "마지막 열차의 기관사",
    accent: "#FFE99A",
    fontFamily: "RIDIBatang, 리디바탕, serif",
    fontWeight: 400,
    fontLabel: "리디바탕",
  },
  {
    id: "story-b",
    app: "카드형 캐릭터챗",
    lines: ["이 편지,", "아직 보내지", "못했죠?"],
    fact: "온실의 우체국장",
    accent: "#FFB8D8",
    fontFamily: "RIDIBatang, 리디바탕, serif",
    fontWeight: 400,
    fontLabel: "리디바탕",
  },
  {
    id: "story-c",
    app: "카드형 캐릭터챗",
    lines: ["오늘 밤,", "그가 마지막 손님을", "기다린다."],
    fact: "달빛 가게의 주인",
    accent: "#A8D8FF",
    fontFamily: "RIDIBatang, 리디바탕, serif",
    fontWeight: 400,
    fontLabel: "리디바탕",
  },
].map((variant) => ({
  crop: "centre",
  truthStatus: "implemented-evidence",
  ...variant,
  source: path.join(GENERATED_DIR, `${variant.id}.png`),
}));

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

function titleFontSize(variant) {
  const requested = variant.titleFontSize;
  const longest = Math.max(
    ...variant.lines.map((line) => [...line.replaceAll(" ", "")].length),
  );
  let size = 108;
  if (longest <= 7) size = 142;
  else if (longest === 8) size = 132;
  else if (longest === 9) size = 120;
  if (variant.fontLabel === "리디바탕") size = Math.min(size, 116);
  const maxUnits = Math.max(
    ...variant.lines.map((line) =>
      [...line].reduce((sum, character) => {
        if (/\s/.test(character)) return sum + 0.32;
        if (/[,.?!]/.test(character)) return sum + 0.45;
        return sum + 1;
      }, 0),
    ),
  );
  const safeWidth = WIDTH - FEED_SAFE.insets.left - FEED_SAFE.insets.right;
  const fitSize = Math.floor(safeWidth / (maxUnits * 0.9));
  return Math.min(requested ?? size, size, fitSize);
}

function overlayFor(variant) {
  const fontSize = titleFontSize(variant);
  const lineAdvance = Math.round(fontSize * 1.25);
  const titleX = variant.titleX ?? FEED_SAFE.insets.left;
  const startY = Math.max(
    variant.titleStartY ?? 174,
    FEED_SAFE.insets.top + fontSize + 32,
  );
  const titleNodes = variant.lines
    .map((line, index) => {
      const fill =
        index === variant.lines.length - 1 ? variant.accent : "#FFF9ED";
      const transform = variant.titleRotation
        ? ` transform="rotate(${variant.titleRotation} ${titleX} ${startY + index * lineAdvance})"`
        : "";
      return `<text x="${titleX}" y="${startY + index * lineAdvance}"${transform}
        fill="${fill}" font-family="${variant.fontFamily}"
        font-size="${fontSize}" font-weight="${variant.fontWeight}"
        stroke="${fill}" stroke-width="${variant.fontStroke ?? 0}"
        paint-order="stroke fill"
        letter-spacing="${Math.round(fontSize * -0.035)}"
        filter="url(#shadow)">${escapeXml(line)}</text>`;
    })
    .join("\n");
  const revealLines = variant.revealLines ?? (variant.reveal ? [variant.reveal] : []);
  const revealWidth =
    revealLines.length > 0
      ? Math.min(
          940,
          80 +
            Math.max(...revealLines.map((line) => [...line].length)) * 43,
        )
      : 0;
  const revealY = variant.revealY ?? 326;
  const revealHeight = revealLines.length === 1 ? 82 : 142;
  const revealTextNodes = revealLines
    .map(
      (line, index) =>
        `<text x="${FEED_SAFE.insets.left + 26}" y="${revealY + 50 + index * 58}" fill="#151515"
          font-family="${CONTACT_FONT}" font-size="43" font-weight="800"
          letter-spacing="-2"
          transform="rotate(${variant.titleRotation ?? 0} ${FEED_SAFE.insets.left + 26} ${revealY + 50 + index * 58})">${escapeXml(line)}</text>`,
    )
    .join("\n");
  const revealNode =
    revealLines.length > 0
      ? `<rect x="${FEED_SAFE.insets.left}" y="${revealY}" width="${Math.min(revealWidth, WIDTH - FEED_SAFE.insets.left - FEED_SAFE.insets.right)}" height="${revealHeight}"
          rx="14" fill="#FFF9ED" fill-opacity=".95"
          transform="rotate(${variant.titleRotation ?? 0} ${FEED_SAFE.insets.left} ${revealY})"/>
         ${revealTextNodes}`
      : "";
  const footerNode = variant.minimalHeadline
    ? ""
    : `<circle cx="104" cy="1218" r="8" fill="${variant.accent}"/>
       <text x="126" y="1230" fill="#FFF9ED"
         font-family="${CONTACT_FONT}" font-size="34" font-weight="800"
         letter-spacing="-1">${escapeXml(variant.app)}</text>
       <text x="${WIDTH - FEED_SAFE.insets.right}" y="1230" fill="#FFF9ED" fill-opacity=".9"
         text-anchor="end" font-family="${CONTACT_FONT}"
         font-size="23" font-weight="800" letter-spacing="-1">${escapeXml(variant.fact)}</text>`;

  return svg(`
    <defs>
      <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#090B12" stop-opacity=".86"/>
        <stop offset=".62" stop-color="#090B12" stop-opacity=".38"/>
        <stop offset="1" stop-color="#090B12" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#090B12" stop-opacity="0"/>
        <stop offset="1" stop-color="#090B12" stop-opacity=".72"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#000" flood-opacity=".55"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="760" fill="url(#topShade)"/>
    <rect y="1030" width="${WIDTH}" height="320" fill="url(#bottomShade)"/>
    ${titleNodes}
    ${revealNode}
    ${footerNode}
  `);
}

async function renderVariant(variant) {
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  await sharp(variant.source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: variant.crop})
    .composite([{input: overlayFor(variant)}])
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function makeAppSheet(app, outputs) {
  const width = 320;
  const height = 400;
  const gutter = 18;
  const top = 66;
  const columns = 3;
  const rows = Math.ceil(outputs.length / columns);
  const sheetWidth = width * columns + gutter * (columns + 1);
  const sheetHeight = top + rows * height + (rows + 1) * gutter;
  const composites = [];

  for (let index = 0; index < outputs.length; index += 1) {
    composites.push({
      input: await sharp(outputs[index])
        .resize(width, height, {fit: "cover"})
        .png()
        .toBuffer(),
      left: gutter + (index % columns) * (width + gutter),
      top: top + Math.floor(index / columns) * (height + gutter),
    });
  }
  composites.push({
    input: svg(
      `<text x="${gutter}" y="41" fill="#211C19"
        font-family="${CONTACT_FONT}" font-size="29" font-weight="800">${escapeXml(app)} · 광고 ${outputs.length}안</text>`,
      sheetWidth,
      sheetHeight,
    ),
  });

  const slug = {
    "한입코치": "onebite",
    "오늘": "today-unified",
    "카드형 캐릭터챗": "story-cards",
  }[app];
  const output = path.join(CAMPAIGN_DIR, `${slug}-contact-sheet.png`);
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

async function makeAllSheet(newOutputs) {
  const tastepin = [
    path.join(TASTEPIN_DIR, "01-saved-shorts-200.png"),
    path.join(TASTEPIN_DIR, "02-ai-restaurant-ui.png"),
    path.join(TASTEPIN_DIR, "03-dinner-scroll.png"),
  ];
  const groups = [
    {label: "맛핀", files: tastepin},
    {
      label: "한입코치",
      files: newOutputs.filter((_, index) => variants[index].app === "한입코치"),
    },
    {
      label: "오늘",
      files: newOutputs.filter((_, index) => variants[index].app === "오늘"),
    },
    {
      label: "카드형 캐릭터챗",
      files: newOutputs.filter(
        (_, index) => variants[index].app === "카드형 캐릭터챗",
      ),
    },
  ];
  const width = 280;
  const height = 350;
  const gutter = 16;
  const top = 76;
  const rowLabelHeight = 42;
  const columns = 3;
  const rowHeight = rowLabelHeight + height + gutter;
  const rows = groups.reduce(
    (total, group) => total + Math.ceil(group.files.length / columns),
    0,
  );
  const sheetWidth = columns * width + (columns + 1) * gutter;
  const sheetHeight = top + rows * rowHeight + gutter;
  const composites = [];
  const groupNodes = [];
  let currentRow = 0;

  for (const group of groups) {
    groupNodes.push(
      `<text x="${gutter}" y="${top + currentRow * rowHeight + 29}" fill="#211C19"
        font-family="${CONTACT_FONT}" font-size="27" font-weight="800">${escapeXml(group.label)} · ${group.files.length}안</text>`,
    );
    for (let index = 0; index < group.files.length; index += 1) {
      const column = index % columns;
      const row = currentRow + Math.floor(index / columns);
      composites.push({
        input: await sharp(group.files[index])
          .resize(width, height, {fit: "cover"})
          .png()
          .toBuffer(),
        left: gutter + column * (width + gutter),
        top: top + row * rowHeight + rowLabelHeight,
      });
    }
    currentRow += Math.ceil(group.files.length / columns);
  }

  composites.push({
    input: svg(
      `<text x="${gutter}" y="43" fill="#211C19"
        font-family="${CONTACT_FONT}" font-size="30" font-weight="800">BF.D · 4개 앱 광고 12종</text>
       ${groupNodes.join("\n")}`,
      sheetWidth,
      sheetHeight,
    ),
  });

  const output = path.join(CAMPAIGN_DIR, "all-12-contact-sheet.png");
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

async function makeQaSheet(outputs, mode) {
  const width = 160;
  const height = 200;
  const gutter = 8;
  const columns = 4;
  const rows = Math.ceil(outputs.length / columns);
  const sheetWidth = columns * width + (columns + 1) * gutter;
  const sheetHeight = rows * height + (rows + 1) * gutter;
  const composites = [];

  for (let index = 0; index < outputs.length; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    let image = sharp(outputs[index]).resize(width, height, {fit: "cover"});
    if (mode === "blur") image = image.blur(11);
    if (mode === "grayscale") image = image.grayscale();
    composites.push({
      input: await image.png().toBuffer(),
      left: gutter + column * (width + gutter),
      top: gutter + row * (height + gutter),
    });
  }

  const output = path.join(CAMPAIGN_DIR, `qa-${mode}-160.png`);
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#EFE9E1",
    },
  })
    .composite(composites)
    .png()
    .toFile(output);
  return output;
}

async function main() {
  await fs.mkdir(RENDER_DIR, {recursive: true});
  await fs.access(process.env.FONTCONFIG_FILE);
  const missing = [];
  for (const variant of variants) {
    try {
      await fs.access(variant.source);
    } catch {
      missing.push(path.relative(ROOT, variant.source));
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing generated assets:\n${missing.join("\n")}`);
  }

  const outputs = [];
  for (const variant of variants) outputs.push(await renderVariant(variant));

  const appSheets = [];
  for (const app of [...new Set(variants.map((variant) => variant.app))]) {
    const appOutputs = variants
      .map((variant, index) => ({variant, output: outputs[index]}))
      .filter(({variant}) => variant.app === app)
      .map(({output}) => output);
    appSheets.push(await makeAppSheet(app, appOutputs));
  }

  const allSheet = await makeAllSheet(outputs);
  const blur = await makeQaSheet(outputs, "blur");
  const grayscale = await makeQaSheet(outputs, "grayscale");
  const metadata = await Promise.all(
    outputs.map(async (output, index) => {
      const info = await sharp(output).metadata();
      return {
        id: variants[index].id,
        app: variants[index].app,
        output: path.relative(ROOT, output),
        source: path.relative(ROOT, variants[index].source),
        width: info.width,
        height: info.height,
        title: variants[index].lines.join("\n"),
        reveal: variants[index].revealLines?.join("\n") ?? variants[index].reveal ?? null,
        visibleSupportingCopy: !variants[index].minimalHeadline,
        lineHeight: 1.25,
        font: variants[index].fontLabel,
        truthStatus: variants[index].truthStatus,
        publishable: false,
      };
    }),
  );
  const report = {
    generatedAt: new Date().toISOString(),
    count: outputs.length,
    expectedCount: 9,
    totalWithTastepin: 12,
    appCount: 4,
    canvas: {width: WIDTH, height: HEIGHT},
    safeArea: FEED_SAFE,
    titleLayer: {
      renderer: "SVG/code",
      fontMode: "per-app",
      fonts: [...new Set(variants.map((variant) => variant.fontLabel))],
      lineHeight: 1.25,
    },
    files: metadata,
    appSheets: appSheets.map((file) => path.relative(ROOT, file)),
    all12Sheet: path.relative(ROOT, allSheet),
    qa: {
      smallBlur: path.relative(ROOT, blur),
      grayscale: path.relative(ROOT, grayscale),
    },
    publishable: false,
  };
  await fs.writeFile(
    path.join(CAMPAIGN_DIR, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
}

await main();
