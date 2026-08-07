#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-format-recipes-2026-07-26",
);
const GENERATED_DIR = path.join(CAMPAIGN_DIR, "assets/generated");
const EVIDENCE_DIR = path.join(CAMPAIGN_DIR, "assets/evidence");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const WIDTH = 1080;
const HEIGHT = 1350;

const variants = [
  {
    id: "a-before-after-overlap",
    label: "A · 전후 겹침형",
    recipe: "before-after-pair",
    headline: ["저장 목록만", "내리던 밤."],
    support: "쇼츠 링크를 붙이니 식당 후보가 보였다.",
    cta: "맛집 쇼츠 링크로 식당 찾기  →",
    disclaimer: "제품 화면은 사용 예시 · 실제 분석 결과로 교체 필요",
    publishable: false,
    blockReason: "사람 승인과 실제 분석 결과 화면 교체가 필요합니다.",
  },
  {
    id: "b-result-library",
    label: "B · 여러 결과형",
    recipe: "result-library-stage",
    headline: ["한 영상에서", "식당 후보 1·2·3."],
    support: "메뉴·지역·판단 근거까지 한 번에 확인",
    cta: "영상에서 식당 후보 찾기  →",
    disclaimer: "공개 YouTube Shorts · 최대 3개 후보",
    publishable: false,
    blockReason: "사람 승인과 실제 분석 결과 화면 교체가 필요합니다.",
  },
  {
    id: "c-relatable-comedy",
    label: "C · 현실 공감형",
    recipe: "relatable-comedy-moment",
    headline: ["친구에게 보내려다", "10분째 목록만 내리는 중."],
    support: "쇼츠 링크 하나면 식당 후보를 찾는다.",
    cta: "쇼츠 링크로 식당 찾아보기  →",
    disclaimer: "10분은 개인 상황 예시 · 제품 화면은 사용 예시",
    publishable: false,
    blockReason: "사람 승인과 실제 분석 결과 화면 교체가 필요합니다.",
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

function textLines(
  lines,
  {x, y, size, fill, weight = 900, lineHeight = 1.25, anchor = "start"},
) {
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : size * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="-1.8">${tspans}</text>`;
}

async function cover(source, width = WIDTH, height = HEIGHT, position = "centre") {
  return sharp(source)
    .resize(width, height, {fit: "cover", position})
    .png()
    .toBuffer();
}

async function roundedPhoto(source, width, height, radius, position = "centre") {
  const image = await cover(source, width, height, position);
  const mask = svg(
    `<rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>`,
    width,
    height,
  );
  const shadowPad = 56;
  const shadow = svg(
    `<defs>
      <filter id="s" x="-30%" y="-30%" width="170%" height="180%">
        <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#140B06" flood-opacity=".42"/>
      </filter>
    </defs>
    <rect x="${shadowPad}" y="${shadowPad}" width="${width}" height="${height}" rx="${radius}" fill="#fff" filter="url(#s)"/>`,
    width + shadowPad * 2,
    height + shadowPad * 2,
  );
  const clipped = await sharp(image)
    .ensureAlpha()
    .composite([{input: mask, blend: "dest-in"}])
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: width + shadowPad * 2,
      height: height + shadowPad * 2,
      channels: 4,
      background: {r: 0, g: 0, b: 0, alpha: 0},
    },
  })
    .composite([
      {input: shadow},
      {input: clipped, left: shadowPad, top: shadowPad},
    ])
    .rotate(1.6, {background: {r: 0, g: 0, b: 0, alpha: 0}})
    .png()
    .toBuffer();
}

async function cropEvidence(extract, width, height) {
  const source = path.join(EVIDENCE_DIR, "tastepin-result-example-full.png");
  return sharp(source)
    .extract(extract)
    .resize(width, height, {fit: "fill"})
    .png()
    .toBuffer();
}

async function evidenceCards() {
  return {
    summary: await cropEvidence(
      {left: 0, top: 0, width: 398, height: 198},
      500,
      248,
    ),
    one: await cropEvidence(
      {left: 0, top: 198, width: 398, height: 193},
      500,
      242,
    ),
    two: await cropEvidence(
      {left: 0, top: 390, width: 398, height: 193},
      500,
      242,
    ),
    three: await cropEvidence(
      {left: 0, top: 582, width: 398, height: 193},
      500,
      242,
    ),
  };
}

async function framedCard(image, angle = 0, accent = "#C9483C") {
  const width = 500;
  const height = (await sharp(image).metadata()).height;
  const pad = 42;
  const frame = svg(
    `<defs>
      <filter id="shadow" x="-35%" y="-35%" width="180%" height="190%">
        <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#160C08" flood-opacity=".3"/>
      </filter>
    </defs>
    <rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="26" fill="#fff" filter="url(#shadow)"/>
    <rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="26" fill="none" stroke="${accent}" stroke-width="4"/>`,
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
      {input: image, left: pad, top: pad},
    ])
    .rotate(angle, {background: {r: 0, g: 0, b: 0, alpha: 0}})
    .png()
    .toBuffer();
}

function darkAtmosphere(opacity = 0.48) {
  return svg(`<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#150E0A" stop-opacity="${opacity}"/>
      <stop offset=".38" stop-color="#150E0A" stop-opacity=".08"/>
      <stop offset="1" stop-color="#150E0A" stop-opacity=".62"/>
    </linearGradient>
  </defs><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>`);
}

function copyOverlay(variant, tone = "dark") {
  const light = tone === "light";
  const ink = light ? "#271E18" : "#FFF9F1";
  const supportBg = light ? "#FFF9F1E8" : "#17100DD8";
  const supportStroke = light ? "#9D7F6940" : "#FFFFFF40";
  const ctaBg = light ? "#271E18" : "#FFF9F1";
  const ctaInk = light ? "#FFF9F1" : "#271E18";
  const headlineSize = variant.id === "c-relatable-comedy" ? 58 : 72;
  const supportY = variant.id === "c-relatable-comedy" ? 340 : 350;

  return svg(`
    <rect x="72" y="66" width="250" height="48" rx="24" fill="${light ? "#271E18" : "#17100DD8"}" stroke="#FFFFFF44"/>
    <text x="197" y="91" dominant-baseline="middle" text-anchor="middle" fill="#FFF9F1" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="19" font-weight="850">${escapeXml(variant.label)}</text>
    ${textLines(variant.headline, {x: 72, y: 181, size: headlineSize, fill: ink, lineHeight: 1.25})}
    <rect x="72" y="${supportY}" width="${variant.id === "c-relatable-comedy" ? 668 : 620}" height="62" rx="18" fill="${supportBg}" stroke="${supportStroke}"/>
    <text x="98" y="${supportY + 33}" dominant-baseline="middle" fill="${ink}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="27" font-weight="800">${escapeXml(variant.support)}</text>
    <rect x="552" y="1160" width="458" height="78" rx="39" fill="${ctaBg}" stroke="${light ? "#271E18" : "#FFFFFF"}" stroke-width="2"/>
    <text x="781" y="1200" dominant-baseline="middle" text-anchor="middle" fill="${ctaInk}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="24" font-weight="850">${escapeXml(variant.cta)}</text>
    <text x="72" y="1274" fill="${light ? "#5B4B41" : "#F4E6DB"}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="19" font-weight="650">${escapeXml(variant.disclaimer)}</text>
    <text x="1008" y="96" text-anchor="end" fill="${ink}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="24" font-weight="900">맛핀</text>
  `);
}

async function renderBeforeAfter(variant, cards) {
  const before = await cover(path.join(GENERATED_DIR, "a-before.png"));
  const after = await roundedPhoto(
    path.join(GENERATED_DIR, "a-after.png"),
    560,
    700,
    32,
    "left",
  );
  const one = await framedCard(cards.one, -3);
  const labels = svg(`
    <rect x="72" y="472" width="122" height="46" rx="23" fill="#17100DD8" stroke="#FFFFFF44"/>
    <text x="133" y="496" dominant-baseline="middle" text-anchor="middle" fill="#FFF9F1" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="20" font-weight="850">찾기 전</text>
    <rect x="802" y="474" width="190" height="46" rx="23" fill="#FFF9F1E8" stroke="#A9362C"/>
    <text x="897" y="498" dominant-baseline="middle" text-anchor="middle" fill="#8E2E27" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="20" font-weight="850">식당 후보 확인</text>
  `);
  return sharp(before)
    .composite([
      {input: darkAtmosphere(0.58)},
      {input: after, left: 438, top: 420},
      {input: one, left: 302, top: 805},
      {input: labels},
      {input: copyOverlay(variant)},
    ])
    .png({compressionLevel: 9})
    .toFile(path.join(RENDER_DIR, `${variant.id}.png`));
}

async function renderResultLibrary(variant, cards) {
  const background = await cover(path.join(GENERATED_DIR, "b-result-stage.png"));
  const one = await framedCard(cards.one, -4);
  const two = await framedCard(cards.two, 0);
  const three = await framedCard(cards.three, 4);
  const wash = svg(`<defs>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF9F1" stop-opacity=".62"/>
      <stop offset=".4" stop-color="#FFF9F1" stop-opacity=".08"/>
      <stop offset="1" stop-color="#FFF9F1" stop-opacity=".28"/>
    </linearGradient>
  </defs><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#w)"/>`);
  return sharp(background)
    .composite([
      {input: wash},
      {input: one, left: 42, top: 450},
      {input: two, left: 238, top: 660},
      {input: three, left: 430, top: 872},
      {input: copyOverlay(variant, "light")},
    ])
    .png({compressionLevel: 9})
    .toFile(path.join(RENDER_DIR, `${variant.id}.png`));
}

async function renderRelatable(variant, cards) {
  const background = await cover(
    path.join(GENERATED_DIR, "c-relatable.png"),
    WIDTH,
    HEIGHT,
    "centre",
  );
  const one = await framedCard(cards.one, 3);
  return sharp(background)
    .composite([
      {input: darkAtmosphere(0.68)},
      {input: one, left: 500, top: 748},
      {input: copyOverlay(variant)},
    ])
    .png({compressionLevel: 9})
    .toFile(path.join(RENDER_DIR, `${variant.id}.png`));
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
      `<text x="${gutter}" y="40" fill="#271E18" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="27" font-weight="900">맛핀 · 형식별 새 프롬프트 3안</text>`,
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
  const cards = await evidenceCards();
  const outputs = [
    path.join(RENDER_DIR, `${variants[0].id}.png`),
    path.join(RENDER_DIR, `${variants[1].id}.png`),
    path.join(RENDER_DIR, `${variants[2].id}.png`),
  ];
  await renderBeforeAfter(variants[0], cards);
  await renderResultLibrary(variants[1], cards);
  await renderRelatable(variants[2], cards);
  const sheet = await contactSheet(outputs);
  const blurSheet = await qaSheet(outputs, "blur");
  const grayscaleSheet = await qaSheet(outputs, "grayscale");
  const report = {
    generatedAt: new Date().toISOString(),
    profile: {id: "ig_feed_portrait", width: WIDTH, height: HEIGHT, ratio: "4:5"},
    headlineLineHeight: 1.25,
    evidence: {
      source: path.relative(
        ROOT,
        path.join(EVIDENCE_DIR, "tastepin-result-example-full.png"),
      ),
      status: "contract-compatible product UI example",
      replacementRequired: true,
    },
    variants: variants.map((variant, index) => ({
      id: variant.id,
      promptRecipe: variant.recipe,
      output: path.relative(ROOT, outputs[index]),
      headline: variant.headline.join(" "),
      support: variant.support,
      publishable: variant.publishable,
      blockReason: variant.blockReason,
    })),
    contactSheet: path.relative(ROOT, sheet),
    qa: {
      blur160: path.relative(ROOT, blurSheet),
      grayscale160: path.relative(ROOT, grayscaleSheet),
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
