#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-concrete-hooks-2026-07-26",
);
const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const EVIDENCE_DIR = path.join(CAMPAIGN_DIR, "assets/evidence");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const WIDTH = 1080;
const HEIGHT = 1350;

const variants = [
  {
    id: "a-recommendation",
    label: "A · 추천안",
    background: path.join(GENERATED_DIR, "a-reaction.png"),
    tone: "dark",
    headline: ["저장한 맛집 쇼츠만", "200개."],
    support: "그 식당은 어디였지?",
    cta: "쇼츠 링크로 식당 찾아보기  →",
    disclaimer: "200개는 개인 상황 예시 · 제품 화면은 사용 예시",
    evidenceLayout: "right-fan",
    publishable: false,
    blockReason: "사람 승인과 실제 분석 결과 화면 교체가 필요합니다.",
  },
  {
    id: "b-safe",
    label: "B · 안전안",
    background: path.join(GENERATED_DIR, "b-product-first.png"),
    tone: "light",
    headline: ["친구에게 보내려다", "10분째 저장 목록만 내리는 중."],
    support: "쇼츠 링크 하나면 식당 후보 1·2·3",
    cta: "영상에서 식당 찾기  →",
    disclaimer: "10분은 개인 상황 예시 · 공개 YouTube Shorts만 지원",
    evidenceLayout: "center-stack",
    publishable: false,
    blockReason: "사람 승인과 실제 분석 결과 화면 교체가 필요합니다.",
  },
  {
    id: "c-bold-reels-concept",
    label: "C · 릴스 콘셉트",
    background: path.join(GENERATED_DIR, "c-reels-archive.png"),
    tone: "dark",
    headline: ["저장한 릴스만", "200개."],
    support: "그 맛집은 또 실종.",
    cta: "릴스 연동 후 · 내 맛집 저장 시작하기",
    disclaimer: "CONCEPT ONLY · Instagram Reels 입력 구현 후 집행",
    evidenceLayout: "right-compact",
    publishable: false,
    blockReason: "Instagram Reels 입력이 아직 구현되지 않았습니다.",
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

function textLines(lines, {x, y, size, fill, weight = 900, lineHeight = 1.25, anchor = "start"}) {
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="-1.8">${tspans}</text>`;
}

async function roundedCrop(source, extract, width, height, radius) {
  const image = await sharp(source)
    .extract(extract)
    .resize(width, height, {fit: "fill"})
    .png()
    .toBuffer();
  const mask = svg(
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="#fff"/>`,
    width,
    height,
  );
  return sharp(image)
    .ensureAlpha()
    .composite([{input: mask, blend: "dest-in"}])
    .png()
    .toBuffer();
}

async function framedCard(image, width, height, angle, accent) {
  const pad = 50;
  const frame = svg(
    `<defs>
       <filter id="shadow" x="-40%" y="-40%" width="180%" height="190%">
         <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".32"/>
       </filter>
     </defs>
     <rect x="${pad}" y="${pad - 8}" width="${width}" height="${height}" rx="28" fill="#fff" filter="url(#shadow)"/>
     <rect x="${pad}" y="${pad - 8}" width="${width}" height="${height}" rx="28" fill="none" stroke="${accent}" stroke-width="4"/>`,
    width + pad * 2,
    height + pad * 2,
  );
  return sharp({
    create: {
      width: width + pad * 2,
      height: height + pad * 2,
      channels: 4,
      background: {r: 0, g: 0, b: 0, alpha: 0},
    },
  })
    .composite([
      {input: frame},
      {input: image, left: pad, top: pad - 8},
    ])
    .rotate(angle, {background: {r: 0, g: 0, b: 0, alpha: 0}})
    .png()
    .toBuffer();
}

async function placeCard(composites, image, left, top) {
  const metadata = await sharp(image).metadata();
  composites.push({
    input: image,
    left: Math.round(left - (metadata.width - 500) / 2),
    top: Math.round(top),
  });
}

function atmosphere(variant) {
  if (variant.tone === "light") {
    return svg(`<defs>
      <linearGradient id="soft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFF8EE" stop-opacity=".76"/>
        <stop offset=".38" stop-color="#FFF8EE" stop-opacity=".18"/>
        <stop offset="1" stop-color="#5A3828" stop-opacity=".18"/>
      </linearGradient>
    </defs><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#soft)"/>`);
  }
  return svg(`<defs>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#120D0A" stop-opacity=".74"/>
      <stop offset=".42" stop-color="#120D0A" stop-opacity=".12"/>
      <stop offset="1" stop-color="#120D0A" stop-opacity=".6"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#120D0A" stop-opacity=".18"/>
      <stop offset="1" stop-color="#120D0A" stop-opacity=".35"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#top)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#side)"/>`);
}

function copyOverlay(variant) {
  const light = variant.tone === "light";
  const ink = light ? "#251D18" : "#FFF8EF";
  const soft = light ? "#5E5148" : "#F6E8DB";
  const pill = light ? "#251D18" : "#FFF8EF";
  const pillText = light ? "#FFF8EF" : "#251D18";
  const labelFill =
    variant.id === "c-bold-reels-concept" ? "#A9362C" : light ? "#251D18" : "#1B1512CC";
  const labelText = "#FFF8EF";
  const supportY = variant.id === "b-safe" ? 300 : 330;

  return svg(`
    <rect x="76" y="72" width="226" height="46" rx="23" fill="${labelFill}" stroke="#FFFFFF44"/>
    <text x="189" y="95" dominant-baseline="middle" text-anchor="middle" fill="${labelText}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="19" font-weight="800">${escapeXml(variant.label)}</text>
    ${textLines(variant.headline, {x: 76, y: 184, size: variant.id === "b-safe" ? 58 : 76, fill: ink, lineHeight: 1.25})}
    <rect x="76" y="${supportY}" width="${variant.id === "b-safe" ? 780 : 500}" height="64" rx="18" fill="${light ? "#FFF8EEEB" : "#1B1512C9"}" stroke="${light ? "#B998844D" : "#FFFFFF40"}"/>
    <text x="102" y="${supportY + 34}" dominant-baseline="middle" fill="${ink}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="${variant.id === "b-safe" ? 27 : 31}" font-weight="800">${escapeXml(variant.support)}</text>
    <rect x="566" y="1160" width="444" height="78" rx="39" fill="${pill}" stroke="${light ? "#251D18" : "#FFFFFF"}" stroke-width="2"/>
    <text x="788" y="1200" dominant-baseline="middle" text-anchor="middle" fill="${pillText}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="25" font-weight="850">${escapeXml(variant.cta)}</text>
    ${light ? '<rect x="60" y="1238" width="560" height="54" rx="18" fill="#FFF8EEF2"/>' : ""}
    <text x="76" y="1272" fill="${light ? "#5E5148" : "#F6E8DB"}" opacity=".9" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="19" font-weight="650">${escapeXml(variant.disclaimer)}</text>
    <text x="1004" y="100" text-anchor="end" fill="${ink}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="24" font-weight="900">맛핀</text>
  `);
}

async function createEvidenceCards() {
  const source = path.join(EVIDENCE_DIR, "tastepin-result-example-full.png");
  const specs = [
    {name: "summary", extract: {left: 0, top: 0, width: 398, height: 198}, width: 500, height: 248},
    {name: "candidate-1", extract: {left: 0, top: 198, width: 398, height: 193}, width: 500, height: 242},
    {name: "candidate-2", extract: {left: 0, top: 390, width: 398, height: 193}, width: 500, height: 242},
    {name: "candidate-3", extract: {left: 0, top: 582, width: 398, height: 193}, width: 500, height: 242},
  ];
  const cards = {};
  for (const spec of specs) {
    cards[spec.name] = await roundedCrop(
      source,
      spec.extract,
      spec.width,
      spec.height,
      28,
    );
  }
  return cards;
}

async function evidenceComposites(variant, cards) {
  const accent = variant.id === "c-bold-reels-concept" ? "#A9362C" : "#C84638";
  const composites = [];
  const summary = await framedCard(cards.summary, 500, 248, -3, accent);
  const one = await framedCard(cards["candidate-1"], 500, 242, -4, accent);
  const two = await framedCard(cards["candidate-2"], 500, 242, 0, accent);
  const three = await framedCard(cards["candidate-3"], 500, 242, 4, accent);

  if (variant.evidenceLayout === "right-fan") {
    await placeCard(composites, summary, 590, 500);
    await placeCard(composites, one, 545, 760);
  } else if (variant.evidenceLayout === "center-stack") {
    await placeCard(composites, one, 105, 460);
    await placeCard(composites, two, 150, 680);
    await placeCard(composites, three, 195, 900);
  } else {
    await placeCard(composites, summary, 610, 500);
    await placeCard(composites, one, 565, 780);
  }
  return composites;
}

async function renderVariant(variant, cards) {
  const composites = [
    {input: atmosphere(variant), left: 0, top: 0},
    ...(await evidenceComposites(variant, cards)),
    {input: copyOverlay(variant), left: 0, top: 0},
  ];
  const output = path.join(RENDER_DIR, `${variant.id}.png`);
  await sharp(variant.background)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
    .composite(composites)
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
    const thumb = await sharp(outputs[index])
      .resize(thumbWidth, thumbHeight, {fit: "cover"})
      .png()
      .toBuffer();
    composites.push({
      input: thumb,
      left: gutter + index * (thumbWidth + gutter),
      top,
    });
  }
  composites.push({
    input: svg(
      `<text x="${gutter}" y="40" fill="#251D18" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="27" font-weight="900">맛핀 · 현실 상황 광고 A/B/C</text>`,
      sheetWidth,
      sheetHeight,
    ),
    left: 0,
    top: 0,
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

async function main() {
  await fs.mkdir(RENDER_DIR, {recursive: true});
  for (const variant of variants) {
    await fs.access(variant.background);
  }
  const cards = await createEvidenceCards();
  const outputs = [];
  for (const variant of variants) {
    outputs.push(await renderVariant(variant, cards));
  }
  const sheet = await contactSheet(outputs);
  const report = {
    generatedAt: new Date().toISOString(),
    profile: {id: "ig_feed_portrait", width: WIDTH, height: HEIGHT, ratio: "4:5"},
    evidence: {
      source: path.relative(ROOT, path.join(EVIDENCE_DIR, "tastepin-result-example-full.png")),
      status: "contract-compatible product UI example",
      replacementRequired: true,
    },
    variants: variants.map((variant, index) => ({
      id: variant.id,
      output: path.relative(ROOT, outputs[index]),
      headline: variant.headline.join(" "),
      support: variant.support,
      publishable: variant.publishable,
      blockReason: variant.blockReason,
    })),
    contactSheet: path.relative(ROOT, sheet),
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
