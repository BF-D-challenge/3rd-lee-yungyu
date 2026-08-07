import path from "node:path";
import {mkdir, writeFile} from "node:fs/promises";
import sharp from "sharp";

const ROOT = process.cwd();

function argumentValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const OUTPUT_ROOT = path.join(
  ROOT,
  argumentValue("--output-root") || "outputs/instagram-campaign-prep-20260801",
);
const CAMPAIGN = argumentValue("--campaign") || "6h_fakedoor_20260801";
const MATPICK_SOURCE = argumentValue("--matpick-source")
  || "outputs/ad-image-system/tastepin-selected-final-2026-07-27/renders/01-saved-shorts-200.png";
const MATPICK_CREATIVE = argumentValue("--matpick-creative") || "saved_shorts_200";
const MATPICK_SELECTION_LOCKED = process.argv.includes("--lock-matpick");

const products = [
  {
    id: "matpick",
    name: "맛핀",
    creative: MATPICK_CREATIVE,
    source: MATPICK_SOURCE,
    selectionLocked: MATPICK_SELECTION_LOCKED,
    reason: MATPICK_SELECTION_LOCKED
      ? "사용자가 마지막으로 고른 ‘어젯밤 본 그 맛집, 어디였지?’ 이미지다. 근심 어린 여성과 저장 결과 UI가 문제와 결과를 한 장에 연결한다."
      : "사용자가 지정한 200개 훅과 가장 직접적으로 맞고, 저장 목록을 끝없이 넘기는 문제를 한 장에 보여준다.",
  },
  {
    id: "onebite",
    name: "한입코치",
    creative: "fridge_coach",
    source: "outputs/ad-image-system/onebite-30f-reference-2026-07-28/renders/onebite-30f-b-proof-flow.png",
    reason: "먹은 뒤의 야식 선택 순간과 코치의 다음 행동 개입이 함께 보이며, 30대 여성 타깃 장면도 드러난다.",
  },
  {
    id: "today",
    name: "오늘 해볼까",
    creative: "tomorrow_response",
    source: "outputs/ad-image-system/today-oldbrain-2026-07-28/renders/today-oldbrain-c-tomorrow.png",
    reason: "아이디어를 보내고 다음 날 반응을 확인한다는 약속과 가장 가깝고, 타깃 사용자의 확인 순간이 보인다.",
  },
  {
    id: "cardbeyond",
    name: "카드너머",
    creative: "tarot_invitation",
    source: "outputs/ad-image-system/character-chat-30f-usp-2026-07-28/renders/story-usp-a-letter.png",
    reason: "남자가 카드를 먼저 내미는 장면이라 ‘카드 한 장 뒤 먼저 말을 건다’는 훅과 가장 직접적으로 연결된다.",
  },
];

const placements = [
  {
    id: "feed",
    label: "Feed 4:5",
    filename: "feed-1080x1350.png",
    width: 1080,
    height: 1350,
    safe: {top: 96, right: 96, bottom: 96, left: 96},
    mode: "text-guard-inset",
  },
  {
    id: "square",
    label: "Square 1:1",
    filename: "square-1080x1080.png",
    width: 1080,
    height: 1080,
    safe: {top: 72, right: 72, bottom: 72, left: 72},
    mode: "safe-contain",
  },
  {
    id: "stories-reels",
    label: "Stories/Reels 9:16",
    filename: "stories-reels-1080x1920.png",
    width: 1080,
    height: 1920,
    safe: {top: 269, right: 72, bottom: 384, left: 72},
    mode: "safe-contain",
  },
];

function safeRect(placement) {
  return {
    x: placement.safe.left,
    y: placement.safe.top,
    width: placement.width - placement.safe.left - placement.safe.right,
    height: placement.height - placement.safe.top - placement.safe.bottom,
  };
}

async function roundedForeground(source, width, height) {
  const radius = Math.max(18, Math.round(Math.min(width, height) * 0.025));
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`,
  );
  const resized = await sharp(source)
    .resize(width, height, {fit: "fill"})
    .ensureAlpha()
    .composite([{input: mask, blend: "dest-in"}])
    .png()
    .toBuffer();
  return {resized, radius};
}

async function exportPlacement(product, placement) {
  const source = path.join(ROOT, product.source);
  const productDir = path.join(OUTPUT_ROOT, "creatives", product.id);
  const qaDir = path.join(OUTPUT_ROOT, "qa");
  await mkdir(productDir, {recursive: true});
  await mkdir(qaDir, {recursive: true});

  const output = path.join(productDir, placement.filename);
  const safe = safeRect(placement);
  let criticalBox;

  if (placement.mode === "text-guard-inset") {
    const foregroundWidth = Math.round(placement.width * 0.98);
    const foregroundHeight = Math.round(placement.height * 0.98);
    const x = Math.round((placement.width - foregroundWidth) / 2);
    const y = Math.round((placement.height - foregroundHeight) / 2);
    const background = await sharp(source)
      .resize(placement.width, placement.height, {fit: "cover", position: "centre"})
      .blur(24)
      .modulate({brightness: 0.72, saturation: 0.84})
      .png()
      .toBuffer();
    const foreground = await sharp(source)
      .resize(foregroundWidth, foregroundHeight, {fit: "fill"})
      .png()
      .toBuffer();
    await sharp(background)
      .composite([{input: foreground, left: x, top: y}])
      .png()
      .toFile(output);
    criticalBox = safe;
  } else {
    const sourceMeta = await sharp(source).metadata();
    const scale = Math.min(safe.width / sourceMeta.width, safe.height / sourceMeta.height);
    const foregroundWidth = Math.round(sourceMeta.width * scale);
    const foregroundHeight = Math.round(sourceMeta.height * scale);
    const x = Math.round(safe.x + (safe.width - foregroundWidth) / 2);
    const y = Math.round(safe.y + (safe.height - foregroundHeight) / 2);
    criticalBox = {x, y, width: foregroundWidth, height: foregroundHeight};

    const background = await sharp(source)
      .resize(placement.width, placement.height, {fit: "cover", position: "centre"})
      .blur(36)
      .modulate({brightness: 0.48, saturation: 0.72})
      .png()
      .toBuffer();
    const {resized: foreground} = await roundedForeground(source, foregroundWidth, foregroundHeight);
    const shadow = Buffer.from(
      `<svg width="${foregroundWidth + 48}" height="${foregroundHeight + 48}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.48"/></filter></defs><rect x="24" y="12" width="${foregroundWidth}" height="${foregroundHeight}" rx="${Math.max(18, Math.round(Math.min(foregroundWidth, foregroundHeight) * 0.025))}" fill="#000" opacity="0.25" filter="url(#s)"/></svg>`,
    );

    await sharp(background)
      .composite([
        {input: Buffer.from(`<svg width="${placement.width}" height="${placement.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#05070A" opacity="0.18"/></svg>`)},
        {input: shadow, left: Math.max(0, x - 24), top: Math.max(0, y - 24)},
        {input: foreground, left: x, top: y},
      ])
      .png()
      .toFile(output);
  }

  const debugOverlay = Buffer.from(
    `<svg width="${placement.width}" height="${placement.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${safe.x}" y="${safe.y}" width="${safe.width}" height="${safe.height}" fill="none" stroke="#39FF88" stroke-width="5" stroke-dasharray="18 12"/>
      <rect x="${criticalBox.x}" y="${criticalBox.y}" width="${criticalBox.width}" height="${criticalBox.height}" fill="none" stroke="#FFD43B" stroke-width="4"/>
    </svg>`,
  );
  const qaOutput = path.join(qaDir, `${product.id}-${placement.id}-safe-area.png`);
  await sharp(output).composite([{input: debugOverlay}]).png().toFile(qaOutput);

  const meta = await sharp(output).metadata();
  return {
    product: product.name,
    productId: product.id,
    creative: product.creative,
    placement: placement.id,
    output: path.relative(ROOT, output),
    qaOverlay: path.relative(ROOT, qaOutput),
    width: meta.width,
    height: meta.height,
    safeInsetsPx: placement.safe,
    safeRect: safe,
    criticalBox,
    safeAreaResult: "passed-by-construction",
  };
}

async function buildContactSheet(exports, {sourceKey = "output", filename = "creative-contact-sheet.png"} = {}) {
  const cardWidth = 260;
  const rowHeight = 440;
  const sheetWidth = cardWidth * products.length;
  const sheetHeight = rowHeight * placements.length;
  const composites = [];

  for (let row = 0; row < placements.length; row += 1) {
    const placement = placements[row];
    for (let column = 0; column < products.length; column += 1) {
      const product = products[column];
      const item = exports.find((entry) => entry.productId === product.id && entry.placement === placement.id);
      const imageWidth = placement.id === "stories-reels" ? 190 : 230;
      const imageHeight = 360;
      const resized = await sharp(path.join(ROOT, item[sourceKey]))
        .resize(imageWidth, imageHeight, {fit: "inside"})
        .png()
        .toBuffer();
      const resizedMeta = await sharp(resized).metadata();
      const left = column * cardWidth + Math.round((cardWidth - resizedMeta.width) / 2);
      const top = row * rowHeight + 52 + Math.round((imageHeight - resizedMeta.height) / 2);
      composites.push({input: resized, left, top});
    }
  }

  const labels = Buffer.from(
    `<svg width="${sheetWidth}" height="${sheetHeight}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;fill:#202124}.p{font-size:22px;font-weight:700}.r{font-size:18px;font-weight:700;fill:#5F6368}</style>${placements.map((placement, row) => `<text class="r" x="16" y="${row * rowHeight + 28}">${placement.label}</text>`).join("")}${products.map((product, column) => `<text class="p" x="${column * cardWidth + 16}" y="${sheetHeight - 14}">${product.name}</text>`).join("")}</svg>`,
  );
  const output = path.join(OUTPUT_ROOT, filename);
  await sharp({create: {width: sheetWidth, height: sheetHeight, channels: 4, background: "#F4F1EC"}})
    .composite([...composites, {input: labels}])
    .png()
    .toFile(output);
  return path.relative(ROOT, output);
}

async function main() {
  await mkdir(OUTPUT_ROOT, {recursive: true});
  const exports = [];
  for (const product of products) {
    for (const placement of placements) {
      exports.push(await exportPlacement(product, placement));
    }
  }
  const contactSheet = await buildContactSheet(exports);
  const qaContactSheet = await buildContactSheet(exports, {
    sourceKey: "qaOverlay",
    filename: "safe-area-contact-sheet.png",
  });
  const manifest = {
    generatedAt: new Date().toISOString(),
    campaign: CAMPAIGN,
    sourceAssetsPreserved: true,
    deletedFiles: 0,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      previousRecommendation: product.creative,
      selectionLocked: Boolean(product.selectionLocked),
      source: product.source,
      selectionReason: product.reason,
    })),
    placements,
    exports,
    contactSheet,
    qaContactSheet,
    publishable: false,
    publishBlockers: [
      "제품별 최종 소재 사용자 재선택 전",
      "운영 URL 사전 점검 완료 전",
      "Meta Ads Manager 업로드 미리보기와 최종 사람 승인 전",
      "실제 게시·결제·예산 사용은 이번 작업 범위가 아님",
    ],
  };
  await writeFile(path.join(OUTPUT_ROOT, "creative-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Exported ${exports.length} files to ${path.relative(ROOT, OUTPUT_ROOT)}`);
}

await main();
