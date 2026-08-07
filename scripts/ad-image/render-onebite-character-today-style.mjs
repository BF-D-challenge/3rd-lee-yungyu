#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {
  INSTAGRAM_SAFE_AREAS,
  assertCriticalBox,
  safeRect,
} from "./lib/instagram-safe-area.mjs";

const ROOT = process.cwd();
const FONT_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/remaining-four-apps-2026-07-28/assets/fonts",
);
process.env.FONTCONFIG_FILE = path.join(FONT_DIR, "fonts.conf");
const {default: sharp} = await import("sharp");

const WIDTH = 1080;
const HEIGHT = 1350;
const PROFILE = INSTAGRAM_SAFE_AREAS.feedPortrait;
const SAFE = safeRect(PROFILE);
const CONTACT_FONT = "Pretendard, sans-serif";

const campaigns = [
  {
    product: "한입코치",
    key: "onebite",
    out: path.join(
      ROOT,
      "outputs/ad-image-system/onebite-30f-reference-2026-07-28",
    ),
    font: "Black Han Sans, 검은고딕, sans-serif",
    fontLabel: "Black Han Sans",
    promise: "먹은 음식 사진을 보여주면 다음 끼니 행동 하나를 정한다.",
    contactSheet: "onebite-30f-contact-sheet.png",
    contactTitle: "한입코치 · 한마디는 세게, 행동은 하나만",
    variants: [
      {
        id: "onebite-30f-a-night-table",
        source: "onebite-readable-a-v7.png",
        reference: "실사 미남 트레이너 현관 배달 차단",
        lead: "야근 끝나자마자,",
        hero: ["치킨부터", "시켰어요?"],
        leadSize: 56,
        heroSize: 112,
        backdrop: "#1D1F22",
        leadColor: "#FFF7ED",
        heroColor: "#FFF7ED",
        accent: "#FFF7ED",
        artDirection: "photoreal-natural-50mm-trainer-doorway",
        selectedBoardItemId: "onebite-readable-a-v7",
      },
      {
        id: "onebite-30f-b-proof-flow",
        source: "onebite-b-v15-outside-over-shoulder.png",
        reference: "냉장고 밖 어깨너머 시점과 큰 코치 얼굴",
        lead: "밤 11시, 냉장고 앞.",
        hero: ["또 야식", "찾으러", "왔죠?"],
        leadSize: 56,
        heroSize: 112,
        backdrop: "#101921",
        leadColor: "#FFF7ED",
        heroColor: "#FFF7ED",
        accent: "#FFF7ED",
        artDirection: "photoreal-outside-over-shoulder-fridge-24mm",
        selectedBoardItemId: "onebite-b-v15-outside-over-shoulder",
      },
      {
        id: "onebite-30f-c-after-work",
        source: "onebite-c-v11-midnight-court.png",
        reference: "성인 로맨스 웹툰 야식 재판",
        lead: "변명은 됐고,",
        hero: ["오늘 야식은", "여기서 끝."],
        leadSize: 56,
        heroSize: 112,
        backdrop: "#211318",
        leadColor: "#FFF7ED",
        heroColor: "#FFF7ED",
        accent: "#FFF7ED",
        artDirection: "adult-romance-manhwa-midnight-food-court",
        imageScale: 1,
        selectedBoardItemId: "onebite-c-v11-midnight-court",
      },
    ],
  },
  {
    product: "캐릭터챗",
    key: "story",
    out: path.join(
      ROOT,
      "outputs/ad-image-system/character-chat-30f-usp-2026-07-28",
    ),
    font: "RIDIBatang, 리디바탕, serif",
    fontLabel: "RIDIBatang",
    promise:
      "마음과 가까운 장면을 고르고, 준비된 문장 또는 직접 쓴 문장으로 대화를 시작한다.",
    contactSheet: "character-chat-usp-contact-sheet.png",
    contactTitle: "캐릭터챗 · 장면을 고르고 한 문장부터",
    variants: [
      {
        id: "story-usp-a-letter",
        source: "story-selected-a-tarot-v5.png",
        reference: "여성향 남주 감정 훅 + 거대 타이포",
        lead: "오늘 못 한 말이 있다면,",
        hero: ["그에게", "말해봐요."],
        leadSize: 48,
        heroSize: 104,
        backdrop: "#282A29",
        leadColor: "#F7E9DC",
        heroColor: "#F7E9DC",
        accent: "#8EE3D1",
        artDirection: "photoreal-fantasy-tarot-postmaster",
        imageScale: 1,
        selectedBoardItemId: "story-selected-a-tarot-v5",
      },
      {
        id: "story-usp-b-bridge",
        source: "story-selected-b-v4.png",
        reference: "실사와 이야기 세계 연결",
        lead: "오늘 내 마음과 닮은",
        hero: ["장면을", "골라봐요."],
        leadSize: 48,
        heroSize: 104,
        backdrop: "#32323B",
        leadColor: "#F7EBDD",
        heroColor: "#F7EBDD",
        accent: "#E8C982",
        artDirection: "female-gaze-romance-illustration-shopkeeper",
        imageScale: 1,
        selectedBoardItemId: "story-c-v3",
      },
      {
        id: "story-usp-c-reply",
        source: "story-selected-c-tarot-v5.png",
        reference: "제품 선택 구조 + 3D 정물",
        lead: "뭐라고 답할지 막히면,",
        hero: ["골라도 되고", "직접 써도 돼요."],
        leadSize: 64,
        heroSize: 156,
        backdrop: "#191B1F",
        leadColor: "#F7E9F0",
        heroColor: "#F7E9F0",
        accent: "#F2A1BF",
        artDirection: "mature-romance-illustration-tarot",
        imageScale: 1,
        selectedBoardItemId: "story-selected-c-tarot-v5",
      },
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

function svg(body, width = WIDTH, height = HEIGHT) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );
}

function snap8(value) {
  return Math.round(value / 8) * 8;
}

function textUnits(text) {
  return [...text].reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.34;
    if (/[,.?!]/.test(character)) return total + 0.46;
    return total + 1;
  }, 0);
}

function fittedSize(lines, requested, width = SAFE.width) {
  const maxUnits = Math.max(...lines.map(textUnits));
  return Math.min(requested, Math.floor(width / (maxUnits * 0.93)));
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function contrastReport(variant) {
  const pairs = [
    {role: "lead", foreground: variant.leadColor},
    {role: "hero", foreground: variant.heroColor},
    {role: "accent", foreground: variant.accent},
  ].map((pair) => ({
    ...pair,
    background: variant.backdrop,
    ratio: Number(
      contrastRatio(pair.foreground, variant.backdrop).toFixed(2),
    ),
  }));
  for (const pair of pairs) {
    if (pair.ratio < 4.5) {
      throw new Error(
        `${variant.id} ${pair.role} contrast ${pair.ratio}:1 is below WCAG AA 4.5:1`,
      );
    }
  }
  return pairs;
}

function overlayFor(campaign, variant) {
  const leadLines = Array.isArray(variant.lead)
    ? variant.lead
    : [variant.lead];
  const leadSize = fittedSize(leadLines, variant.leadSize);
  const heroSize = fittedSize(variant.hero, variant.heroSize);
  const leadFirstY = snap8(PROFILE.insets.top + leadSize + 16);
  const leadLineAdvance = snap8(leadSize * 1.25);
  const leadLastY =
    leadFirstY + (leadLines.length - 1) * leadLineAdvance;
  const heroLineAdvance = snap8(heroSize * 1.25);
  const smallToHeroBaselineGap = heroLineAdvance + 32;
  const heroFirstY = leadLastY + smallToHeroBaselineGap;
  const heroBottom =
    heroFirstY + (variant.hero.length - 1) * heroLineAdvance;

  assertCriticalBox(
    PROFILE,
    {
      x: SAFE.x,
      y: PROFILE.insets.top,
      width: SAFE.width,
      height: heroBottom - PROFILE.insets.top + 40,
    },
    `${variant.id} headline`,
  );

  const heroNodes = variant.hero
    .map((line, index) => {
      const y = heroFirstY + index * heroLineAdvance;
      const fill =
        index === variant.hero.length - 1
          ? variant.accent
          : variant.heroColor;
      return `<text x="${SAFE.x}" y="${y}" fill="${fill}"
        font-family="${campaign.font}" font-size="${heroSize}"
        font-weight="${campaign.key === "onebite" ? 900 : 400}"
        letter-spacing="${Math.round(heroSize * -0.045)}"
        >${escapeXml(line)}</text>`;
    })
    .join("\n");
  const leadNodes = leadLines
    .map((line, index) => {
      const y = leadFirstY + index * leadLineAdvance;
      return `<text x="${SAFE.x}" y="${y}" fill="${variant.leadColor}"
        font-family="${campaign.font}" font-size="${leadSize}"
        font-weight="${campaign.key === "onebite" ? 900 : 400}"
        letter-spacing="${Math.round(leadSize * -0.035)}"
        >${escapeXml(line)}</text>`;
    })
    .join("\n");

  return {
    buffer: svg(`
      ${leadNodes}
      ${heroNodes}
    `),
    metrics: {
      leadSize,
      leadLineAdvancePx: leadLineAdvance,
      heroSize,
      heroLineAdvancePx: heroLineAdvance,
      smallToHeroBaselineGapPx: smallToHeroBaselineGap,
    },
  };
}

async function renderVariant(campaign, variant) {
  const generated = path.join(campaign.out, "assets/generated", variant.source);
  const output = path.join(campaign.out, "renders", `${variant.id}.png`);
  const overlay = overlayFor(campaign, variant);
  const imageScale = variant.imageScale ?? 1;
  let base = sharp(generated);
  if (imageScale > 1) {
    const scaledWidth = Math.round(WIDTH * imageScale);
    const scaledHeight = Math.round(HEIGHT * imageScale);
    const horizontalOffset =
      variant.imageAnchor === "bottom-right"
        ? scaledWidth - WIDTH
        : Math.floor((scaledWidth - WIDTH) / 2);
    base = base
      .resize(scaledWidth, scaledHeight, {fit: "fill"})
      .extract({
        left: horizontalOffset,
        top: scaledHeight - HEIGHT,
        width: WIDTH,
        height: HEIGHT,
      });
  } else {
    base = base.resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"});
  }
  await base
    .composite([{input: overlay.buffer}])
    .png({compressionLevel: 9})
    .toFile(output);
  return {output, metrics: overlay.metrics};
}

async function makeContactSheet(campaign, rendered) {
  const cardWidth = 324;
  const cardHeight = 405;
  const gutter = 20;
  const header = 92;
  const captionHeight = 66;
  const width = cardWidth * 3 + gutter * 4;
  const height = header + cardHeight + captionHeight + gutter * 2;
  const composites = [];

  for (let index = 0; index < rendered.length; index += 1) {
    const left = gutter + index * (cardWidth + gutter);
    composites.push({
      input: await sharp(rendered[index].output)
        .resize(cardWidth, cardHeight, {fit: "cover"})
        .png()
        .toBuffer(),
      left,
      top: header,
    });
    composites.push({
      input: svg(
        `<text x="0" y="27" fill="#171A23" font-family="${CONTACT_FONT}"
          font-size="20" font-weight="900">${String.fromCharCode(65 + index)}안</text>
         <text x="0" y="52" fill="#6D6A66" font-family="${CONTACT_FONT}"
          font-size="15" font-weight="700">${escapeXml(campaign.variants[index].reference)}</text>`,
        cardWidth,
        captionHeight,
      ),
      left,
      top: header + cardHeight + 8,
    });
  }

  composites.push({
    input: svg(
      `<text x="${gutter}" y="44" fill="#171A23" font-family="${CONTACT_FONT}"
        font-size="30" font-weight="900">${escapeXml(campaign.contactTitle)}</text>
       <text x="${gutter}" y="73" fill="#6D6A66" font-family="${CONTACT_FONT}"
        font-size="16" font-weight="700">자연 여백 위에 코드 제목만 합성 · 가짜 UI 없음</text>`,
      width,
      height,
    ),
  });

  const output = path.join(campaign.out, campaign.contactSheet);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#F3EEE7",
    },
  })
    .composite(composites)
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function renderCampaign(campaign) {
  await fs.mkdir(path.join(campaign.out, "renders"), {recursive: true});
  const missing = [];
  for (const variant of campaign.variants) {
    const source = path.join(campaign.out, "assets/generated", variant.source);
    try {
      await fs.access(source);
    } catch {
      missing.push(path.relative(ROOT, source));
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing generated backgrounds:\n${missing.join("\n")}`);
  }

  const rendered = [];
  for (const variant of campaign.variants) {
    rendered.push(await renderVariant(campaign, variant));
  }
  const contactSheet = await makeContactSheet(campaign, rendered);
  const manifest = {
    generatedAt: new Date().toISOString(),
    product: campaign.product,
    status: "concept-only",
    publishable: false,
    primaryClaim: campaign.promise,
    format: PROFILE,
    safeRect: SAFE,
    typography: {
      family: campaign.fontLabel,
      lineHeight: 1.25,
      hierarchyLevels: 2,
      grid: 8,
      smallToHeroGap:
        "큰 제목 줄 간격보다 32px 크게 설정하고 8px 그리드에 스냅",
      effects: {
        shadow: false,
        outline: false,
        glow: false,
        texture: false,
        gradientFill: false,
      },
      textLayer: "SVG code overlay",
    },
    imageLayer:
      "AI-generated scene with natural negative space; no readable text, product UI, screenshots, or metrics",
    variants: campaign.variants.map((variant, index) => ({
      id: variant.id,
      reference: variant.reference,
      lead: variant.lead,
      hero: variant.hero,
      artDirection: variant.artDirection,
      selectedBoardItemId: variant.selectedBoardItemId ?? null,
      imageScale: variant.imageScale ?? 1,
      imageAnchor:
        variant.imageAnchor ?? (variant.imageScale ? "bottom-center" : "center"),
      source: path.relative(
        ROOT,
        path.join(campaign.out, "assets/generated", variant.source),
      ),
      render: path.relative(ROOT, rendered[index].output),
      spacing: {
        gridPx: 8,
        ...rendered[index].metrics,
      },
      accessibility: {
        standard: "WCAG 2.x AA normal text threshold",
        minimumContrastRatio: 4.5,
        expectedNaturalNegativeSpaceColor: variant.backdrop,
        opaqueBackdropOverlay: false,
        contrastPairs: contrastReport(variant),
      },
      uiMode: "none",
    })),
    contactSheet: path.relative(ROOT, contactSheet),
    actualProductScreensUsed: false,
    publishBlockers: [
      "최종 사람 승인",
      "Meta 광고 계정·예산·집행 승인",
    ],
  };
  await fs.writeFile(
    path.join(campaign.out, "today-style-render-report.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(campaign.out, "render-report.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

async function main() {
  const campaignArg = process.argv.find((argument) =>
    argument.startsWith("--campaign="),
  );
  const selectedCampaign = campaignArg?.split("=")[1];
  const targets = selectedCampaign
    ? campaigns.filter((campaign) => campaign.key === selectedCampaign)
    : campaigns;
  if (selectedCampaign && targets.length === 0) {
    throw new Error(`Unknown campaign: ${selectedCampaign}`);
  }
  const reports = [];
  for (const campaign of targets) {
    reports.push(await renderCampaign(campaign));
  }
  console.log(JSON.stringify(reports, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
