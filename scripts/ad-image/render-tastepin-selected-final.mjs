#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {INSTAGRAM_SAFE_AREAS} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-selected-final-2026-07-27",
);
const FONT_CONFIG = path.join(CAMPAIGN_DIR, "assets/fonts/fonts.conf");
process.env.FONTCONFIG_FILE = FONT_CONFIG;
const {default: sharp} = await import("sharp");

const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const AI_UI_CHROMA_SOURCE = path.join(
  GENERATED_DIR,
  "02-ai-restaurant-ui-overlay-chroma.png",
);
const AI_UI_KEYED = path.join(
  GENERATED_DIR,
  "02-ai-restaurant-ui-overlay-keyed.png",
);
const WIDTH = 1080;
const HEIGHT = 1350;
const FEED_SAFE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const SAFE_X = FEED_SAFE.insets.left;

const variants = [
  {
    id: "01-saved-shorts-200",
    source: path.join(GENERATED_DIR, "01-saved-shorts-room.png"),
    providerCallId: "call_bqdth4eHJ0SFUtWzmHzmDf1p",
    treatment: "bold-type",
  },
  {
    id: "02-ai-restaurant-ui",
    source: path.join(GENERATED_DIR, "02-night-scroll.png"),
    providerCallId: "call_rDePE21xRIcluCgH1RD9bg9l",
    treatment: "instagram-ui",
  },
  {
    id: "02-ai-restaurant-ui-flipped",
    source: path.join(GENERATED_DIR, "02-night-scroll.png"),
    providerCallId: "call_rDePE21xRIcluCgH1RD9bg9l",
    treatment: "instagram-ui",
    flipVisualLayers: true,
  },
  {
    id: "03-dinner-scroll",
    source: path.join(GENERATED_DIR, "03-clay-dinner.png"),
    providerCallId: "call_VIe6pUMNymIaHjqw94RdhzHV",
    treatment: "bold-type",
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

function typeOverlayOne() {
  return svg(`
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#100C09" stop-opacity=".58"/>
        <stop offset=".46" stop-color="#100C09" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".46"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="600" fill="url(#shade)"/>
    <text x="${SAFE_X}" y="224" fill="#FFF7E8"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="86" font-weight="400" letter-spacing="-4"
      filter="url(#shadow)">저장한 맛집 쇼츠만</text>
    <text x="${SAFE_X}" y="444" fill="#FF5C3C"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="176" font-weight="400" letter-spacing="-7"
      filter="url(#shadow)">200개.</text>
  `);
}

function titleOverlayTwo() {
  return svg(`
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#100C09" stop-opacity=".68"/>
        <stop offset=".56" stop-color="#100C09" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".48"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="610" fill="url(#shade)"/>
    <text x="${SAFE_X}" y="226" fill="#FFF7E8"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="98" font-weight="400" letter-spacing="-5"
      filter="url(#shadow)">${escapeXml("어젯밤 본 그 맛집,")}</text>
    <text x="${SAFE_X}" y="440" fill="#FFBE46"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="168" font-weight="400" letter-spacing="-7"
      filter="url(#shadow)">${escapeXml("어디였지?")}</text>
  `);
}

function typeOverlayThree() {
  const lineOne = escapeXml("친구에게 보내려다");
  const lineTwo = escapeXml("10분째 저장 목록만");
  const lineThree = escapeXml("내리는 중.");
  return svg(`
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#180607" stop-opacity=".52"/>
        <stop offset=".56" stop-color="#180607" stop-opacity="0"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-30%" width="150%" height="180%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".48"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="710" fill="url(#shade)"/>
    <text x="${SAFE_X}" y="222" fill="#FFF3DD"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="100" font-weight="400" letter-spacing="-5"
      filter="url(#shadow)">${lineOne}</text>
    <text x="${SAFE_X}" y="347" fill="#FFF3DD"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="100" font-weight="400" letter-spacing="-5"
      filter="url(#shadow)">${lineTwo}</text>
    <text x="${SAFE_X}" y="564" fill="#FFBE46"
      font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
      font-size="176" font-weight="400" letter-spacing="-7"
      filter="url(#shadow)">${lineThree}</text>
  `);
}

function overlayFor(variant) {
  if (variant.id === "01-saved-shorts-200") return typeOverlayOne();
  if (variant.treatment === "instagram-ui") return titleOverlayTwo();
  return typeOverlayThree();
}

async function prepareAiUiOverlay() {
  const {data, info} = await sharp(AI_UI_CHROMA_SOURCE)
    .removeAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const output = Buffer.alloc(info.width * info.height * 4);

  for (let sourceIndex = 0, targetIndex = 0; sourceIndex < data.length; sourceIndex += 3, targetIndex += 4) {
    const red = data[sourceIndex];
    const green = data[sourceIndex + 1];
    const blue = data[sourceIndex + 2];
    const dominance = green - Math.max(red, blue);
    let alpha = 255;

    if (green > 125 && dominance > 45) {
      alpha = Math.round(
        255 * Math.max(0, Math.min(1, (105 - dominance) / 60)),
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
    .toFile(AI_UI_KEYED);
}

async function renderVariant(variant) {
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  const composites = [];

  if (variant.treatment === "instagram-ui") {
    let ui = sharp(AI_UI_KEYED).resize({height: 650});
    if (variant.flipVisualLayers) ui = ui.flop();
    const {data: uiLayer, info: uiInfo} = await ui.png().toBuffer({resolveWithObject: true});
    composites.push({
      input: uiLayer,
      left: variant.flipVisualLayers
        ? FEED_SAFE.insets.left
        : WIDTH - uiInfo.width - FEED_SAFE.insets.right,
      top: 595,
    });
  }
  composites.push({input: overlayFor(variant)});

  let background = sharp(variant.source)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"});
  if (variant.flipVisualLayers) background = background.flop();

  await background
    .composite(composites)
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
        `<text x="${gutter}" y="41" fill="#271E18"
          font-family="BM kkubulim, 배달의민족 꾸불림, sans-serif"
          font-size="27" font-weight="400">맛핀 · 선택 이미지 최종 3안</text>`,
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

async function writeMetadata(outputs, contactSheet, blur, grayscale) {
  const generationSources = {
    generatedAt: new Date().toISOString(),
    mode: "selected existing image_gen outputs with code overlay",
    assets: variants.map((variant) => ({
      id: variant.id,
      providerCallId: variant.providerCallId,
      localSource: path.relative(ROOT, variant.source),
      treatment: variant.treatment,
      aiImageTextPolicy: "raw image contains no generated text",
    })),
    overlayAsset: {
      id: "02-ai-restaurant-ui-overlay",
      providerCallId: "call_V13YrroFtBqD1xfQUTUZ8Tv8",
      localSource: path.relative(ROOT, AI_UI_CHROMA_SOURCE),
      keyedAsset: path.relative(ROOT, AI_UI_KEYED),
      role: "concept-only restaurant result UI layer",
      evidenceStatus: "not real product evidence",
      textPolicy: "no readable text, numbers, ratings, reviews, or logos",
    },
  };

  const projectContract = {
    version: 4,
    projectId: "tastepin-selected-final",
    product: {
      name: "맛핀",
      landing: "/tastepin",
      usp: "공개 YouTube Shorts 링크에서 식당명, 메뉴, 지역 단서를 찾는다",
      firstAction: "맛집 쇼츠 링크로 식당 찾아보기",
      evidence: [
        "src/components/organisms/tastepin/tastepin.tsx",
        "src/lib/tastepin-contract.ts",
      ],
      forbiddenClaims: [
        "모든 영상에서 식당을 찾는다",
        "장소가 100% 정확하다",
        "200개가 모든 사용자의 평균 저장 수다",
        "10분이 모든 사용자의 평균 탐색 시간이다",
      ],
    },
    reference: {
      selected: [
        {
          id: "user-selected-generated-assets",
          sourceUrl:
            "codex-imagegen://call_bqdth4eHJ0SFUtWzmHzmDf1p,call_rDePE21xRIcluCgH1RD9bg9l,call_VIe6pUMNymIaHjqw94RdhzHV",
          role: "visual-source",
          borrowedCue: "사용자가 직접 고른 3개 이미지",
          avoidCopying: "원본 광고의 문구, 인물, 카드 디자인, 촬영 구도",
        },
      ],
      approved: true,
    },
    formatContract: {
      version: 4,
      status: "locked",
      placement: "ig_feed_portrait",
      ratio: "4:5",
      largeVisualMassCount: 2,
      mainMediaCoverage: 1,
      codeLayers: ["large-title"],
      aiLayers: ["restaurant-ui-concept-on-variant-2"],
      typeface: {
        family: "BM kkubulim",
        label: "배달의민족 꾸불림체",
        source: "Woowa Brothers official CDN",
        license: "Baemin Font License Policy",
      },
      headlineLineHeight: 1.25,
      instagramUiVariantCount: 0,
      stackAnchor: {x: 0.5, y: 0.5},
      approved: true,
    },
    messageContract: {
      version: 4,
      status: "locked",
      usp: "저장한 맛집 쇼츠가 많아 식당을 다시 찾기 어려운 구체적인 순간",
      cta: "Meta 기본 버튼에서 맛집 쇼츠 링크로 식당 찾아보기",
      evidence: [
        "200개와 10분은 개인 상황 예시이며 사용자 평균으로 주장하지 않음",
        "2번 AI 식당 UI는 시각 콘셉트이며 실제 제품 증거가 아님",
      ],
      approved: true,
    },
    layers: [
      {
        id: "selected-ai-image",
        role: "ai-art",
        z: 10,
        source: {type: "generated", assetSet: "assets/generated"},
        generationPolicy: {noText: true, provenanceRecorded: true},
        approved: true,
      },
      {
        id: "code-overlay",
        role: "code-text-and-ui",
        z: 40,
        source: {type: "code", lineHeight: 1.25},
      },
    ],
    review: {
      selectedVariant: null,
      productFitApproved: false,
      ocrWarnings: 1,
    },
    placements: [
      {
        id: "ig_feed_portrait",
        ratio: "4:5",
        safeAreaWarnings: 0,
        approved: false,
      },
    ],
    finalApproval: {approved: false, publishable: false},
  };

  const report = {
    generatedAt: new Date().toISOString(),
    profile: {id: "ig_feed_portrait", width: WIDTH, height: HEIGHT, ratio: "4:5"},
    safeArea: FEED_SAFE,
    composition: {
      selectedSourceImages: variants.map((variant) => variant.providerCallId),
      variantTwoAiRestaurantUi: "call_V13YrroFtBqD1xfQUTUZ8Tv8",
      variantTwoInstagramChrome: false,
      fakeEngagementNumbers: false,
      typeface: "배달의민족 꾸불림체 (BM kkubulim)",
      headlineLineHeight: {
        variantOne: 1.25,
        variantTwo: 1.25,
        variantThree: 1.25,
      },
      externalNativeCtaRequired: true,
    },
    variants: variants.map((variant, index) => ({
      id: variant.id,
      treatment: variant.treatment,
      output: path.relative(ROOT, outputs[index]),
      publishable: false,
      blockReason: "최종 사람 승인과 Meta 본문·기본 CTA 설정이 필요합니다.",
    })),
    contactSheet: path.relative(ROOT, contactSheet),
    qa: {
      blur160: path.relative(ROOT, blur),
      grayscale160: path.relative(ROOT, grayscale),
      ocrWarnings: [
        {
          variant: "01-saved-shorts-200",
          expected: "200개.",
          detected: "200개",
          reason: "자동 OCR이 마지막 마침표만 생략함",
        },
      ],
    },
    publishable: false,
  };

  await Promise.all([
    fs.writeFile(
      path.join(CAMPAIGN_DIR, "generation-sources.json"),
      `${JSON.stringify(generationSources, null, 2)}\n`,
    ),
    fs.writeFile(
      path.join(CAMPAIGN_DIR, "project-contract.json"),
      `${JSON.stringify(projectContract, null, 2)}\n`,
    ),
    fs.writeFile(
      path.join(CAMPAIGN_DIR, "render-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    ),
  ]);
}

async function main() {
  await fs.mkdir(RENDER_DIR, {recursive: true});
  await fs.access(FONT_CONFIG);
  await fs.access(AI_UI_CHROMA_SOURCE);
  await prepareAiUiOverlay();
  const outputs = [];
  for (const variant of variants) {
    await fs.access(variant.source);
    outputs.push(await renderVariant(variant));
  }
  const contactSheet = await makeSheet(outputs);
  const blur = await makeSheet(outputs, {mode: "blur", width: 160});
  const grayscale = await makeSheet(outputs, {mode: "grayscale", width: 160});
  await writeMetadata(outputs, contactSheet, blur, grayscale);

  console.log(outputs.map((output) => path.relative(ROOT, output)).join("\n"));
  console.log(path.relative(ROOT, contactSheet));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
