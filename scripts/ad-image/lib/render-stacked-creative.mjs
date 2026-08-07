import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_CANVAS = { width: 1080, height: 1350 };
const DEFAULT_SOURCE_ANCHOR = { x: 0.52, y: 0.55 };

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function glyphUnits(character) {
  if (/\s/.test(character)) return 0.32;
  if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u3000-\u9fff]/.test(character)) {
    return 1;
  }
  if (/[A-Z0-9]/.test(character)) return 0.64;
  return 0.54;
}

function textUnits(text) {
  return [...text].reduce((sum, character) => sum + glyphUnits(character), 0);
}

function wrapText(text, maxUnits, maxLines) {
  const paragraphs = String(text).split("\n");
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/(\s+)/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const next = current + word;
      if (current && textUnits(next) > maxUnits) {
        lines.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current = next;
      }
    }
    if (current) lines.push(current.trimEnd());
  }

  if (lines.length <= maxLines) return { lines, truncated: false };
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[.…]+$/u, "")}…`;
  return { lines: clipped, truncated: true };
}

function textLayer(name, text, x, y, width, options = {}) {
  return {
    type: "text",
    name,
    text,
    x,
    y,
    width,
    height: options.height ?? options.fontSize * (options.maxLines ?? 2) * (options.lineHeight ?? 1.32),
    fontSize: options.fontSize,
    minFontSize: options.minFontSize ?? Math.round(options.fontSize * 0.72),
    maxLines: options.maxLines ?? 2,
    lineHeight: options.lineHeight ?? 1.32,
    fill: options.fill,
    fontWeight: options.fontWeight ?? 700,
    align: options.align ?? "left",
    z: options.z ?? 40,
    critical: options.critical ?? true,
    rotate: options.rotate ?? 0,
  };
}

function rectLayer(name, x, y, width, height, options = {}) {
  return {
    type: "rect",
    name,
    x,
    y,
    width,
    height,
    fill: options.fill,
    stroke: options.stroke,
    strokeWidth: options.strokeWidth ?? 0,
    radius: options.radius ?? 28,
    opacity: options.opacity ?? 1,
    shadow: options.shadow ?? false,
    z: options.z ?? 20,
    rotate: options.rotate ?? 0,
    critical: options.critical ?? false,
  };
}

function imageLayer(name, source, x, y, width, height, options = {}) {
  return {
    type: "image",
    name,
    source,
    x,
    y,
    width,
    height,
    radius: options.radius ?? 30,
    fit: options.fit ?? "cover",
    position: options.position ?? "centre",
    shadow: options.shadow ?? true,
    z: options.z ?? 20,
    rotate: options.rotate ?? 0,
    critical: options.critical ?? false,
    role: options.role ?? "evidence",
  };
}

function pillLayer(name, text, x, y, width, height, options = {}) {
  return {
    type: "pill",
    name,
    text,
    x,
    y,
    width,
    height,
    fill: options.fill,
    textFill: options.textFill,
    stroke: options.stroke,
    fontSize: options.fontSize ?? 25,
    fontWeight: options.fontWeight ?? 700,
    radius: options.radius ?? Math.round(height / 2),
    shadow: options.shadow ?? false,
    z: options.z ?? 45,
    rotate: options.rotate ?? 0,
    critical: options.critical ?? true,
  };
}

function shootingLayer(creative, palette, x = 105, y = 240, width = 790, height = 760) {
  return [
    rectLayer("shooting-slot", x, y, width, height, {
      fill: palette.shooting,
      stroke: palette.ink,
      strokeWidth: 3,
      radius: 44,
      rotate: -4,
      shadow: true,
      z: 12,
    }),
    textLayer(
      "shooting-label",
      creative.shootingLabel ?? "실사 촬영 슬롯",
      x + 70,
      y + 300,
      width - 140,
      {
        fontSize: 44,
        maxLines: 2,
        align: "center",
        fill: palette.ink,
        z: 14,
        critical: false,
      },
    ),
  ];
}

function evidenceStack(creative, palette, options = {}) {
  const source = creative.evidenceSource;
  const x = options.x ?? 150;
  const y = options.y ?? 350;
  const width = options.width ?? 790;
  const height = options.height ?? 585;
  return [
    rectLayer("evidence-underlay", x - 26, y - 22, width, height, {
      fill: palette.accent,
      radius: 38,
      rotate: -4,
      shadow: true,
      z: 18,
    }),
    imageLayer("evidence-back", source, x, y, width, height, {
      radius: 34,
      rotate: -2,
      z: 20,
      position: options.position ?? "centre",
    }),
    imageLayer(
      "evidence-front",
      creative.evidenceSecondary ?? source,
      x + (options.frontDx ?? 105),
      y + (options.frontDy ?? 135),
      width * (options.frontScale ?? 0.78),
      height * (options.frontScale ?? 0.78),
      {
        radius: 30,
        rotate: 3,
        z: 24,
        position: options.frontPosition ?? "centre",
      },
    ),
  ];
}

function aiWorld(creative, options = {}) {
  if (!creative.aiAsset) return [];
  return [
    imageLayer(
      "ai-world",
      creative.aiAsset,
      options.x ?? 70,
      options.y ?? 150,
      options.width ?? 900,
      options.height ?? 760,
      {
        radius: options.radius ?? 48,
        fit: options.fit ?? "cover",
        position: options.position ?? "centre",
        rotate: options.rotate ?? -4,
        z: options.z ?? 10,
        role: "ai-art",
      },
    ),
  ];
}

function copyChrome(creative, palette, options = {}) {
  const headlineY = options.headlineY ?? 74;
  const headlineX = options.headlineX ?? 76;
  const headlineWidth = options.headlineWidth ?? 900;
  const headlineSize = options.headlineSize ?? 66;
  const supportY = options.supportY ?? 260;
  const ctaY = options.ctaY ?? 1100;
  const layers = [
    pillLayer("brand-label", creative.eyebrow, 76, 80, options.brandWidth ?? 310, 52, {
      fill: palette.ink,
      textFill: palette.bg,
      fontSize: 21,
      z: 44,
      critical: true,
    }),
    textLayer("headline", creative.headline, headlineX, headlineY + 60, headlineWidth, {
      fontSize: headlineSize,
      minFontSize: 44,
      maxLines: options.headlineLines ?? 3,
      lineHeight: 1.28,
      fill: palette.ink,
      z: 42,
      critical: true,
    }),
  ];

  if (creative.support) {
    layers.push(
      rectLayer("support-scrim", options.supportX ?? 76, supportY - 20, options.supportWidth ?? 760, options.supportHeight ?? 108, {
        fill: palette.surface,
        opacity: 0.94,
        radius: 20,
        z: 36,
      }),
      textLayer("support", creative.support, options.supportX ?? 96, supportY, (options.supportWidth ?? 760) - 40, {
        fontSize: options.supportSize ?? 29,
        minFontSize: 22,
        maxLines: options.supportLines ?? 2,
        lineHeight: 1.5,
        fill: palette.ink,
        z: 41,
        critical: true,
      }),
    );
  }

  layers.push(
    pillLayer("cta", creative.cta, options.ctaX ?? 520, ctaY, options.ctaWidth ?? 480, 82, {
      fill: palette.ink,
      textFill: palette.bg,
      fontSize: options.ctaSize ?? 27,
      shadow: true,
      z: 50,
      critical: true,
    }),
  );

  if (creative.disclaimer) {
    layers.push(
      textLayer("disclaimer", creative.disclaimer, 86, options.disclaimerY ?? 1210, 850, {
        fontSize: 21,
        minFontSize: 18,
        maxLines: 2,
        lineHeight: 1.45,
        fill: palette.ink,
        z: 46,
        critical: false,
      }),
    );
  }
  return layers;
}

function itemPills(creative, palette, options = {}) {
  const items = creative.items ?? [];
  return items.map((item, index) =>
    pillLayer(
      `item-${index + 1}`,
      item,
      (options.x ?? 116) + index * (options.dx ?? 18),
      (options.y ?? 720) + index * (options.dy ?? 94),
      options.width ?? 620,
      options.height ?? 72,
      {
        fill: index === items.length - 1 ? palette.accent : palette.surface,
        textFill: palette.ink,
        stroke: palette.ink,
        fontSize: options.fontSize ?? 25,
        rotate: (options.rotations ?? [-3, 1, -1, 2])[index] ?? 0,
        shadow: true,
        z: (options.z ?? 30) + index,
        critical: false,
      },
    ),
  );
}

function styleGiantType(creative, palette) {
  return [
    ...evidenceStack(creative, palette, {
      x: 116,
      y: 440,
      width: 820,
      height: 610,
      frontDx: 120,
      frontDy: 115,
      frontScale: 0.72,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 86,
      headlineLines: 3,
      supportY: 430,
      supportWidth: 660,
      ctaY: 1100,
    }),
  ];
}

function styleFanLibrary(creative, palette) {
  const source = creative.evidenceSource;
  return [
    rectLayer("library-back", 110, 250, 820, 690, {
      fill: palette.accent,
      radius: 42,
      rotate: -5,
      shadow: true,
      z: 15,
    }),
    imageLayer("result-1", source, 126, 300, 690, 470, {
      rotate: -5,
      z: 20,
      position: "left",
    }),
    imageLayer("result-2", source, 190, 390, 690, 470, {
      rotate: -1,
      z: 22,
      position: "centre",
    }),
    imageLayer("result-3", source, 260, 485, 690, 470, {
      rotate: 4,
      z: 24,
      position: "right",
    }),
    ...copyChrome(creative, palette, {
      headlineY: 72,
      headlineSize: 62,
      supportY: 975,
      supportWidth: 650,
      supportHeight: 92,
      ctaY: 1100,
    }),
  ];
}

function styleUgc(creative, palette) {
  return [
    ...shootingLayer(creative, palette, 94, 210, 820, 800),
    ...aiWorld(creative, {
      x: 690,
      y: 210,
      width: 260,
      height: 320,
      fit: "contain",
      rotate: 4,
      radius: 32,
      z: 18,
    }),
    ...evidenceStack(creative, palette, {
      x: 330,
      y: 490,
      width: 650,
      height: 480,
      frontDx: -70,
      frontDy: 120,
      frontScale: 0.78,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 76,
      headlineSize: 66,
      headlineWidth: 750,
      supportY: 930,
      supportX: 86,
      supportWidth: 620,
      ctaY: 1100,
    }),
  ];
}

function styleIceberg(creative, palette) {
  return [
    ...aiWorld(creative, { x: 72, y: 170, width: 930, height: 850, rotate: -3 }),
    ...itemPills(creative, palette, { x: 100, y: 580, width: 500, dy: 82, rotations: [-4, -1, 2, 4], z: 25 }),
    ...evidenceStack(creative, palette, {
      x: 470,
      y: 665,
      width: 520,
      height: 390,
      frontDx: -60,
      frontDy: 105,
      frontScale: 0.78,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 63,
      supportY: 330,
      supportWidth: 610,
      ctaY: 1100,
    }),
  ];
}

function styleTop3(creative, palette) {
  return [
    ...aiWorld(creative, { x: 345, y: 170, width: 650, height: 770, rotate: 3 }),
    ...itemPills(creative, palette, { x: 86, y: 590, width: 620, dy: 104, rotations: [-4, -1, 2], z: 26 }),
    ...evidenceStack(creative, palette, {
      x: 500,
      y: 720,
      width: 470,
      height: 350,
      frontDx: -55,
      frontDy: 90,
      frontScale: 0.76,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 72,
      headlineSize: 65,
      supportY: 355,
      supportWidth: 580,
      ctaY: 1100,
    }),
  ];
}

function styleFormula(creative, palette) {
  return [
    ...aiWorld(creative, { x: 330, y: 200, width: 650, height: 600, rotate: 4 }),
    ...itemPills(creative, palette, { x: 90, y: 515, width: 470, dy: 84, rotations: [-4, -1, 2, 4], z: 26 }),
    ...evidenceStack(creative, palette, {
      x: 390,
      y: 650,
      width: 590,
      height: 440,
      frontDx: -70,
      frontDy: 105,
      frontScale: 0.76,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 70,
      headlineWidth: 760,
      supportY: 365,
      supportWidth: 570,
      ctaY: 1100,
    }),
  ];
}

function styleEditorial(creative, palette) {
  return [
    ...evidenceStack(creative, palette, {
      x: 124,
      y: 270,
      width: 840,
      height: 625,
      frontDx: 105,
      frontDy: 160,
      frontScale: 0.72,
    }),
    rectLayer("article-sheet", 82, 730, 720, 300, {
      fill: palette.surface,
      rotate: -2,
      radius: 28,
      shadow: true,
      z: 30,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 72,
      headlineSize: 64,
      headlineWidth: 780,
      supportY: 790,
      supportX: 118,
      supportWidth: 620,
      supportHeight: 165,
      supportLines: 3,
      ctaY: 1100,
    }),
  ];
}

function styleParadox(creative, palette) {
  return [
    ...aiWorld(creative, { x: 90, y: 180, width: 900, height: 640, rotate: -4 }),
    pillLayer("compare-left", creative.items?.[0] ?? "기능 10개", 100, 560, 430, 128, {
      fill: palette.surface,
      textFill: palette.ink,
      stroke: palette.ink,
      fontSize: 36,
      rotate: -4,
      shadow: true,
      z: 25,
      critical: false,
    }),
    pillLayer("compare-right", creative.items?.[1] ?? "첫 제안 1개", 430, 650, 520, 148, {
      fill: palette.accent,
      textFill: palette.ink,
      stroke: palette.ink,
      fontSize: 42,
      rotate: 3,
      shadow: true,
      z: 28,
      critical: false,
    }),
    ...evidenceStack(creative, palette, {
      x: 360,
      y: 770,
      width: 590,
      height: 390,
      frontDx: -80,
      frontDy: 70,
      frontScale: 0.74,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 61,
      supportY: 360,
      supportWidth: 670,
      ctaY: 1100,
    }),
  ];
}

function styleBeforeAfter(creative, palette) {
  const source = creative.evidenceSource;
  return [
    imageLayer("before", source, 90, 350, 690, 520, {
      rotate: -5,
      z: 18,
      position: "left",
    }),
    pillLayer("before-label", "BEFORE", 105, 320, 210, 62, {
      fill: palette.surface,
      textFill: palette.ink,
      stroke: palette.ink,
      rotate: -5,
      z: 20,
      critical: false,
    }),
    imageLayer("after", source, 285, 500, 690, 520, {
      rotate: 3,
      z: 24,
      position: "right",
    }),
    pillLayer("after-label", "AFTER", 710, 470, 220, 64, {
      fill: palette.accent,
      textFill: palette.ink,
      stroke: palette.ink,
      rotate: 3,
      z: 26,
      critical: false,
    }),
    ...itemPills(creative, palette, { x: 100, y: 825, width: 540, dy: 86, rotations: [-2, 2], z: 30 }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 62,
      supportY: 275,
      supportWidth: 700,
      ctaY: 1100,
    }),
  ];
}

function styleVersus(creative, palette) {
  return [
    ...aiWorld(creative, { x: 80, y: 220, width: 920, height: 720, rotate: -2 }),
    pillLayer("versus", "VS", 450, 505, 180, 180, {
      fill: palette.ink,
      textFill: palette.bg,
      fontSize: 62,
      radius: 90,
      shadow: true,
      z: 32,
      critical: false,
    }),
    ...itemPills(creative, palette, { x: 100, y: 750, width: 710, dy: 90, rotations: [-3, 2], z: 34 }),
    ...evidenceStack(creative, palette, {
      x: 510,
      y: 800,
      width: 450,
      height: 330,
      frontDx: -50,
      frontDy: 70,
      frontScale: 0.76,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 62,
      supportY: 340,
      supportWidth: 620,
      ctaY: 1100,
    }),
  ];
}

function styleProofLibrary(creative, palette) {
  const source = creative.evidenceSource;
  const layers = creative.shootingLabel ? shootingLayer(creative, palette, 78, 205, 900, 820) : [];
  return [
    ...layers,
    imageLayer("proof-1", source, 100, 360, 660, 430, {
      rotate: -5,
      z: 20,
      position: "left",
    }),
    imageLayer("proof-2", source, 220, 480, 660, 430, {
      rotate: -1,
      z: 23,
      position: "centre",
    }),
    imageLayer("proof-3", source, 330, 600, 630, 410, {
      rotate: 4,
      z: 26,
      position: "right",
    }),
    ...itemPills(creative, palette, { x: 90, y: 850, width: 520, dy: 82, rotations: [-3, 1, 3], z: 30 }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 62,
      supportY: 300,
      supportWidth: 650,
      ctaY: 1100,
    }),
  ];
}

function styleCharacterReturn(creative, palette) {
  return [
    ...aiWorld(creative, { x: 65, y: 135, width: 950, height: 930, rotate: -2 }),
    rectLayer("headline-scrim", 60, 70, 780, 370, {
      fill: palette.surface,
      opacity: 0.9,
      radius: 32,
      rotate: -3,
      shadow: true,
      z: 32,
    }),
    ...evidenceStack(creative, palette, {
      x: 475,
      y: 720,
      width: 500,
      height: 365,
      frontDx: -70,
      frontDy: 90,
      frontScale: 0.75,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 78,
      headlineX: 90,
      headlineWidth: 700,
      headlineSize: 67,
      supportY: 360,
      supportX: 95,
      supportWidth: 590,
      ctaY: 1100,
    }),
  ];
}

function styleMaking(creative, palette) {
  return [
    ...shootingLayer(creative, palette, 80, 190, 920, 860),
    ...aiWorld(creative, {
      x: 490,
      y: 260,
      width: 470,
      height: 590,
      fit: "cover",
      rotate: 5,
      z: 22,
    }),
    ...evidenceStack(creative, palette, {
      x: 140,
      y: 650,
      width: 650,
      height: 460,
      frontDx: 155,
      frontDy: 35,
      frontScale: 0.7,
    }),
    ...copyChrome(creative, palette, {
      headlineY: 70,
      headlineSize: 58,
      headlineWidth: 760,
      supportY: 930,
      supportWidth: 700,
      supportHeight: 115,
      ctaY: 1100,
    }),
  ];
}

function referenceLayer(layer, options = {}) {
  return {
    ...layer,
    normalized: true,
    anchorSafeBottom: options.anchorSafeBottom ?? false,
    safeBottomOffset: options.safeBottomOffset ?? 0,
    fitSafeArea: options.fitSafeArea ?? false,
    excludeProfiles: options.excludeProfiles ?? [],
  };
}

function stylePhoneEditorial(creative, palette) {
  const scene = imageLayer(
    "phone-scene",
    creative.aiAsset,
    0,
    0,
    SOURCE_CANVAS.width,
    SOURCE_CANVAS.height,
    {
      radius: 0,
      fit: "cover",
      shadow: false,
      z: 10,
      role: "ai-art",
    },
  );
  scene.fullBleed = true;

  return [
    scene,
    referenceLayer(
      rectLayer("phone-top-scrim", 0, 0, 1080, 360, {
        fill: "#07151C",
        opacity: 0.72,
        radius: 0,
        z: 18,
      }),
    ),
    referenceLayer(
      pillLayer("phone-brand-label", creative.eyebrow, 360, 94, 360, 52, {
        fill: palette.accent,
        textFill: "#07151C",
        fontSize: 22,
        shadow: false,
        z: 40,
        critical: false,
      }),
    ),
    referenceLayer(
      textLayer("phone-headline", creative.headline, 120, 184, 840, {
        fontSize: 66,
        minFontSize: 54,
        maxLines: 2,
        lineHeight: 1.18,
        align: "center",
        fill: "#FFFFFF",
        z: 42,
        critical: true,
      }),
      { fitSafeArea: true },
    ),
    referenceLayer(
      rectLayer("phone-question-scrim", 110, 1010, 860, 112, {
        fill: "#08151C",
        opacity: 0.86,
        stroke: "#FFFFFF55",
        strokeWidth: 2,
        radius: 56,
        z: 34,
      }),
      {
        anchorSafeBottom: true,
        safeBottomOffset: 150,
        excludeProfiles: ["ig_reels_cover"],
      },
    ),
    referenceLayer(
      textLayer("phone-question", creative.support, 150, 1030, 780, {
        fontSize: 31,
        minFontSize: 25,
        maxLines: 2,
        lineHeight: 1.35,
        align: "center",
        fill: "#FFFFFF",
        z: 42,
        critical: true,
      }),
      {
        anchorSafeBottom: true,
        safeBottomOffset: 165,
        fitSafeArea: true,
        excludeProfiles: ["ig_reels_cover"],
      },
    ),
    referenceLayer(
      pillLayer("cta", creative.cta, 300, 1182, 480, 72, {
        fill: "#08151C",
        textFill: "#FFFFFF",
        stroke: "#FFFFFF66",
        fontSize: 24,
        shadow: false,
        z: 46,
        critical: true,
      }),
      {
        anchorSafeBottom: true,
        safeBottomOffset: 44,
        excludeProfiles: ["ig_reels_cover"],
      },
    ),
    referenceLayer(
      textLayer("phone-disclaimer", creative.disclaimer, 145, 1282, 790, {
        fontSize: 17,
        minFontSize: 15,
        maxLines: 2,
        lineHeight: 1.4,
        align: "center",
        fill: "#FFFFFFAA",
        z: 46,
        critical: false,
      }),
      { excludeProfiles: ["ig_reels_cover"] },
    ),
  ];
}

function styleComicDiptych(creative, palette) {
  const scene = imageLayer(
    "comic-scene",
    creative.aiAsset,
    0,
    0,
    SOURCE_CANVAS.width,
    SOURCE_CANVAS.height,
    {
      radius: 0,
      fit: "cover",
      shadow: false,
      z: 10,
      role: "ai-art",
    },
  );
  scene.fullBleed = true;

  return [
    scene,
    referenceLayer(
      rectLayer("comic-title-scrim", 0, 1050, 1080, 300, {
        fill: "#06131A",
        opacity: 0.84,
        radius: 0,
        z: 18,
      }),
    ),
    referenceLayer(
      pillLayer("comic-brand-label", "AI 생성 장면 · STORY CARDS", 720, 28, 332, 42, {
        fill: "#07141ACC",
        textFill: "#FFFFFF",
        fontSize: 18,
        shadow: false,
        z: 40,
        critical: false,
      }),
    ),
    referenceLayer(
      textLayer(
        "comic-question",
        creative.support,
        10,
        82,
        272,
        {
          fontSize: 27,
          minFontSize: 23,
          maxLines: 2,
          lineHeight: 1.34,
          align: "center",
          fill: "#17242B",
          z: 42,
          critical: false,
        },
      ),
    ),
    referenceLayer(
      textLayer(
        "comic-dialogue",
        creative.dialogue ?? "이번엔,\n끝까지 들어줄게요.",
        720,
        820,
        300,
        {
          fontSize: 26,
          minFontSize: 22,
          maxLines: 2,
          lineHeight: 1.28,
          align: "center",
          fill: "#F8EFE1",
          z: 42,
          critical: false,
        },
      ),
    ),
    referenceLayer(
      textLayer("headline", creative.headline, 82, 1080, 916, {
        fontSize: 64,
        minFontSize: 48,
        maxLines: 2,
        lineHeight: 1.13,
        align: "center",
        fill: "#FFFFFF",
        z: 44,
        critical: true,
      }),
      { anchorSafeBottom: true, safeBottomOffset: 48 },
    ),
    referenceLayer(
      rectLayer("comic-accent", 806, 1262, 192, 8, {
        fill: palette.accent,
        radius: 4,
        z: 45,
      }),
      { anchorSafeBottom: true, safeBottomOffset: 34 },
    ),
  ];
}

const STYLE_BUILDERS = {
  "giant-type": styleGiantType,
  "fan-library": styleFanLibrary,
  "ugc-reel": styleUgc,
  iceberg: styleIceberg,
  reaction: styleUgc,
  top3: styleTop3,
  formula: styleFormula,
  editorial: styleEditorial,
  paradox: styleParadox,
  "before-after": styleBeforeAfter,
  versus: styleVersus,
  "proof-library": styleProofLibrary,
  "character-return": styleCharacterReturn,
  making: styleMaking,
  "phone-editorial": stylePhoneEditorial,
  "comic-diptych": styleComicDiptych,
  "scene-top3": styleTop3,
};

export function buildCreativeLayers(creative) {
  const builder = STYLE_BUILDERS[creative.style];
  if (!builder) throw new Error(`${creative.id}: unknown style ${creative.style}`);
  return builder(creative, creative.palette).sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
}

function transformLayer(layer, profile, sourceAnchor = DEFAULT_SOURCE_ANCHOR) {
  if (layer.excludeProfiles?.includes(profile.id)) {
    return { ...layer, hidden: true };
  }

  if (layer.fullBleed) {
    return {
      ...layer,
      x: 0,
      y: 0,
      width: profile.width,
      height: profile.height,
    };
  }

  if (layer.normalized) {
    const horizontalScale = profile.width / SOURCE_CANVAS.width;
    const verticalScale = profile.height / SOURCE_CANVAS.height;
    const fontScale = Math.min(horizontalScale, verticalScale);
    const transformed = {
      ...layer,
      x: layer.x * horizontalScale,
      y: layer.y * verticalScale,
      width: layer.width * horizontalScale,
      height: layer.height * verticalScale,
      radius: (layer.radius ?? 0) * fontScale,
      fontSize: layer.fontSize ? layer.fontSize * fontScale : undefined,
      minFontSize: layer.minFontSize ? layer.minFontSize * fontScale : undefined,
      strokeWidth: layer.strokeWidth ? layer.strokeWidth * fontScale : undefined,
    };
    if (layer.anchorSafeBottom) {
      transformed.y =
        profile.height -
        profile.safeArea.bottom -
        transformed.height -
        (layer.safeBottomOffset ?? 0) * fontScale;
    }
    if (layer.fitSafeArea) {
      const safeLeft = profile.safeArea.left;
      const safeRight = profile.width - profile.safeArea.right;
      const currentRight = transformed.x + transformed.width;
      transformed.x = Math.max(transformed.x, safeLeft);
      transformed.width =
        Math.min(currentRight, safeRight) - transformed.x;
    }
    return transformed;
  }

  const scale = (profile.width / SOURCE_CANVAS.width) * profile.stackScale;
  const sourceAnchorX = sourceAnchor.x * SOURCE_CANVAS.width;
  const sourceAnchorY = sourceAnchor.y * SOURCE_CANVAS.height;
  const targetAnchorX = profile.stackAnchor.x * profile.width;
  const targetAnchorY = profile.stackAnchor.y * profile.height;

  const transformed = {
    ...layer,
    x: targetAnchorX + (layer.x - sourceAnchorX) * scale,
    y: targetAnchorY + (layer.y - sourceAnchorY) * scale,
    width: layer.width * scale,
    height: layer.height * scale,
    radius: (layer.radius ?? 0) * scale,
    fontSize: layer.fontSize ? layer.fontSize * scale : undefined,
    minFontSize: layer.minFontSize ? layer.minFontSize * scale : undefined,
    strokeWidth: layer.strokeWidth ? layer.strokeWidth * scale : undefined,
  };

  if (profile.aspectRatio === "9:16" && layer.name === "cta") {
    transformed.y =
      profile.height - profile.safeArea.bottom - transformed.height - 28;
  }
  if (profile.aspectRatio === "9:16" && layer.name === "disclaimer") {
    const ctaHeight = 82 * scale;
    const ctaY =
      profile.height - profile.safeArea.bottom - ctaHeight - 28;
    transformed.y = ctaY - transformed.height - 24;
  }
  if (profile.aspectRatio === "9:16" && layer.name === "shooting-slot") {
    transformed.x = 0;
    transformed.y = 0;
    transformed.width = profile.width;
    transformed.height = profile.height;
    transformed.radius = 0;
    transformed.rotate = 0;
  }
  if (profile.aspectRatio === "9:16" && layer.name === "shooting-label") {
    transformed.x = profile.safeArea.left + 40;
    transformed.y = profile.height * 0.52;
    transformed.width =
      profile.width - profile.safeArea.left - profile.safeArea.right - 80;
    transformed.rotate = 0;
  }

  return transformed;
}

function layerBounds(layer) {
  return {
    left: layer.x,
    top: layer.y,
    right: layer.x + layer.width,
    bottom: layer.y + layer.height,
  };
}

function safeAreaWarnings(layers, profile) {
  const safe = profile.safeArea;
  const warnings = [];
  for (const layer of layers) {
    if (!layer.critical) continue;
    const bounds = layerBounds(layer);
    if (
      bounds.left < safe.left ||
      bounds.top < safe.top ||
      bounds.right > profile.width - safe.right ||
      bounds.bottom > profile.height - safe.bottom
    ) {
      warnings.push(`${layer.name}: critical layer crosses ${profile.id} safe area`);
    }
  }
  return warnings;
}

async function imageDataUri(source, cwd, cache) {
  const sourcePath = path.resolve(cwd, source);
  if (cache.has(sourcePath)) return cache.get(sourcePath);
  const buffer = await fs.readFile(sourcePath);
  const extension = path.extname(sourcePath).toLowerCase();
  const mime =
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const uri = `data:${mime};base64,${buffer.toString("base64")}`;
  cache.set(sourcePath, uri);
  return uri;
}

function transformAttribute(layer) {
  if (!layer.rotate) return "";
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  return ` transform="rotate(${Number(layer.rotate)} ${cx} ${cy})"`;
}

function shadowFilter(id, strong = false) {
  return `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="${strong ? 18 : 12}" stdDeviation="${strong ? 18 : 12}" flood-color="#000000" flood-opacity="${strong ? 0.28 : 0.2}" />
  </filter>`;
}

async function renderLayerSvg(layer, index, defs, cwd, imageCache, warnings) {
  const transform = transformAttribute(layer);
  const filterId = `shadow-${index}`;
  const filter = layer.shadow ? ` filter="url(#${filterId})"` : "";
  if (layer.shadow) defs.push(shadowFilter(filterId, layer.z >= 24));

  if (layer.type === "image") {
    const clipId = `clip-${index}`;
    defs.push(
      `<clipPath id="${clipId}"><rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${layer.radius}" /></clipPath>`,
    );
    const uri = await imageDataUri(layer.source, cwd, imageCache);
    const fit = layer.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    return `<g${transform}${filter}><image href="${uri}" x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" preserveAspectRatio="${fit}" clip-path="url(#${clipId})" /></g>`;
  }

  if (layer.type === "rect") {
    const stroke = layer.stroke
      ? ` stroke="${escapeXml(layer.stroke)}" stroke-width="${Number(layer.strokeWidth ?? 1)}"`
      : "";
    return `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${layer.radius}" fill="${escapeXml(layer.fill)}" opacity="${layer.opacity ?? 1}"${stroke}${transform}${filter} />`;
  }

  if (layer.type === "pill") {
    const stroke = layer.stroke
      ? ` stroke="${escapeXml(layer.stroke)}" stroke-width="${Number(layer.strokeWidth ?? 1)}"`
      : "";
    return `<g${transform}${filter}>
      <rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" rx="${layer.radius}" fill="${escapeXml(layer.fill)}"${stroke} />
      <text x="${layer.x + layer.width / 2}" y="${layer.y + layer.height / 2}" dominant-baseline="middle" text-anchor="middle" fill="${escapeXml(layer.textFill)}" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-size="${layer.fontSize}" font-weight="${layer.fontWeight}">${escapeXml(layer.text)}</text>
    </g>`;
  }

  if (layer.type === "text") {
    let fontSize = layer.fontSize;
    let fitted;
    while (fontSize >= layer.minFontSize) {
      fitted = wrapText(layer.text, layer.width / fontSize, layer.maxLines);
      if (!fitted.truncated) break;
      fontSize -= Math.max(1, layer.fontSize * 0.03);
    }
    if (fitted.truncated) warnings.push(`${layer.name}: text truncated`);
    const lineHeight = fontSize * layer.lineHeight;
    const anchor =
      layer.align === "center" ? "middle" : layer.align === "right" ? "end" : "start";
    const x =
      layer.align === "center"
        ? layer.x + layer.width / 2
        : layer.align === "right"
          ? layer.x + layer.width
          : layer.x;
    const tspans = fitted.lines
      .map(
        (line, lineIndex) =>
          `<tspan x="${x}" dy="${lineIndex === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
      )
      .join("");
    return `<text x="${x}" y="${layer.y + fontSize}" text-anchor="${anchor}" fill="${escapeXml(layer.fill)}" font-family="Pretendard, Apple SD Gothic Neo, sans-serif" font-size="${fontSize}" font-weight="${layer.fontWeight}"${transform}>${tspans}</text>`;
  }

  throw new Error(`Unsupported v3 layer type: ${layer.type}`);
}

function debugSafeAreaSvg(profile) {
  const safe = profile.safeArea;
  return `<rect x="${safe.left}" y="${safe.top}" width="${profile.width - safe.left - safe.right}" height="${profile.height - safe.top - safe.bottom}" fill="none" stroke="#FF2D55" stroke-width="4" stroke-dasharray="18 12" />`;
}

async function renderSvg({
  creative,
  profile,
  layers,
  cwd,
  debugSafeArea,
}) {
  const defs = [];
  const warnings = safeAreaWarnings(layers, profile);
  const imageCache = new Map();
  const body = [];
  for (const [index, layer] of layers.entries()) {
    body.push(await renderLayerSvg(layer, index, defs, cwd, imageCache, warnings));
  }

  const [start, end] = creative.palette.backgroundGradient ?? [
    creative.palette.bg,
    creative.palette.surface,
  ];
  defs.push(
    `<linearGradient id="background" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${escapeXml(start)}" /><stop offset="100%" stop-color="${escapeXml(end)}" /></linearGradient>`,
  );

  const safe = debugSafeArea ? debugSafeAreaSvg(profile) : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${profile.width}" height="${profile.height}" viewBox="0 0 ${profile.width} ${profile.height}">
    <defs>${defs.join("\n")}</defs>
    <rect width="100%" height="100%" fill="url(#background)" />
    <circle cx="${profile.width * 0.88}" cy="${profile.height * 0.13}" r="${profile.width * 0.2}" fill="${escapeXml(creative.palette.accent)}" opacity="0.34" />
    ${body.join("\n")}
    ${safe}
  </svg>`;
  return { svg: Buffer.from(svg), warnings: [...new Set(warnings)] };
}

export function validateStackGeometry(layers, composition) {
  const stackLayers = layers.filter((layer) =>
    ["image", "rect"].includes(layer.type) && layer.z >= 10 && layer.z <= 30,
  );
  const warnings = [];
  if (stackLayers.length < 2) {
    warnings.push("stack requires at least two visual layers");
    return warnings;
  }

  const sorted = [...stackLayers].sort((a, b) => a.z - b.z);
  for (let index = 1; index < sorted.length; index += 1) {
    const a = layerBounds(sorted[index - 1]);
    const b = layerBounds(sorted[index]);
    const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const overlapArea = overlapWidth * overlapHeight;
    const smallerArea = Math.min(
      (a.right - a.left) * (a.bottom - a.top),
      (b.right - b.left) * (b.bottom - b.top),
    );
    const ratio = smallerArea ? overlapArea / smallerArea : 0;
    if (ratio < composition.overlapRatio.min) {
      warnings.push(
        `${sorted[index - 1].name} → ${sorted[index].name}: overlap ${ratio.toFixed(2)} below ${composition.overlapRatio.min}`,
      );
    }
  }
  return warnings;
}

export async function renderStackedCreative({
  creative,
  profileId,
  profile,
  composition,
  cwd,
  outputDir,
  debugSafeArea = false,
}) {
  const startedAt = performance.now();
  const sourceLayers = buildCreativeLayers(creative);
  const layers = sourceLayers
    .map((layer) =>
      transformLayer(layer, { ...profile, id: profileId }, creative.stackAnchor),
    )
    .filter((layer) => !layer.hidden);
  const geometryWarnings = validateStackGeometry(sourceLayers, composition);
  const { svg, warnings } = await renderSvg({
    creative,
    profile: { ...profile, id: profileId },
    layers,
    cwd,
    debugSafeArea,
  });

  const outputPath = path.join(outputDir, profileId, `${creative.id}.png`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(svg)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  const buffer = await fs.readFile(outputPath);

  return {
    id: creative.id,
    profile: profileId,
    placement: profile.placements,
    output: path.relative(cwd, outputPath),
    route: creative.route,
    approval: creative.approval?.status ?? "draft",
    shootingPending: Boolean(creative.shootingLabel),
    motionPending: profileId === "ig_reels",
    warnings: [...new Set([...geometryWarnings, ...warnings])],
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    durationMs: Math.round(performance.now() - startedAt),
  };
}

export async function createPlacementContactSheet({
  results,
  profile,
  profileId,
  cwd,
  outputDir,
}) {
  if (!results.length) return null;
  const columns = Math.min(5, results.length);
  const thumbWidth = profile.aspectRatio === "9:16" ? 126 : 190;
  const thumbHeight = Math.round((thumbWidth / profile.width) * profile.height);
  const gap = 16;
  const rows = Math.ceil(results.length / columns);
  const width = columns * thumbWidth + (columns + 1) * gap;
  const height = rows * thumbHeight + (rows + 1) * gap;
  const composites = [];

  for (const [index, result] of results.entries()) {
    const input = await sharp(path.resolve(cwd, result.output))
      .resize(thumbWidth, thumbHeight, { fit: "cover" })
      .png()
      .toBuffer();
    composites.push({
      input,
      left: gap + (index % columns) * (thumbWidth + gap),
      top: gap + Math.floor(index / columns) * (thumbHeight + gap),
    });
  }

  const outputPath = path.join(outputDir, `contact-sheet-${profileId}.jpg`);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#ECEEF3",
    },
  })
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outputPath);
  return path.relative(cwd, outputPath);
}
