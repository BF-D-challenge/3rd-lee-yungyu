import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const TOKEN_PATTERN = /\{\{([a-zA-Z0-9_.-]+)\}\}/g;

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getToken(variables, token) {
  return token.split(".").reduce((value, key) => value?.[key], variables);
}

export function resolveTokens(value, variables) {
  if (typeof value === "string") {
    return value.replace(TOKEN_PATTERN, (_, token) => {
      const resolved = getToken(variables, token);
      if (resolved === undefined || resolved === null) {
        throw new Error(`Missing template variable: ${token}`);
      }
      return String(resolved);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTokens(item, variables));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveTokens(item, variables),
      ]),
    );
  }

  return value;
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

function wrapParagraph(paragraph, maxUnits) {
  if (!paragraph) return [""];

  const words = paragraph.split(/(\s+)/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current + word;
    if (current && textUnits(candidate) > maxUnits) {
      lines.push(current.trimEnd());
      current = word.trimStart();
      continue;
    }

    if (!current && textUnits(word) > maxUnits) {
      let chunk = "";
      for (const character of word) {
        if (chunk && textUnits(chunk + character) > maxUnits) {
          lines.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      }
      current = chunk;
      continue;
    }

    current = candidate;
  }

  if (current) lines.push(current.trimEnd());
  return lines;
}

function fitText(layer) {
  const maxLines = Number(layer.maxLines ?? 4);
  const minFontSize = Number(layer.minFontSize ?? Math.max(18, layer.fontSize * 0.65));
  let fontSize = Number(layer.fontSize);
  let lines = [];

  while (fontSize >= minFontSize) {
    const maxUnits = Number(layer.width) / fontSize;
    lines = String(layer.text)
      .split("\n")
      .flatMap((paragraph) => wrapParagraph(paragraph, maxUnits));
    if (lines.length <= maxLines) {
      return { fontSize, lines, truncated: false };
    }
    fontSize -= 2;
  }

  const clipped = lines.slice(0, maxLines);
  const finalIndex = clipped.length - 1;
  clipped[finalIndex] = `${clipped[finalIndex].replace(/[.…]+$/u, "")}…`;
  return { fontSize: minFontSize, lines: clipped, truncated: true };
}

function svgShadow(id, shadow = {}) {
  const dx = Number(shadow.x ?? 0);
  const dy = Number(shadow.y ?? 12);
  const blur = Number(shadow.blur ?? 28);
  const color = shadow.color ?? "#000000";
  const opacity = Number(shadow.opacity ?? 0.22);

  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${blur / 2}" flood-color="${escapeXml(color)}" flood-opacity="${opacity}" />
  </filter>`;
}

function renderTextLayer(layer, index, warnings) {
  const fitted = fitText(layer);
  if (fitted.truncated) {
    warnings.push(`${layer.name ?? `layer-${index}`}: text was truncated`);
  }

  const x = Number(layer.x);
  const y = Number(layer.y);
  const width = Number(layer.width);
  const align = layer.align ?? "left";
  const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
  const anchorX = align === "center" ? x + width / 2 : align === "right" ? x + width : x;
  const lineHeight = Number(layer.lineHeight ?? 1.15) * fitted.fontSize;
  const family = escapeXml(layer.fontFamily ?? "Apple SD Gothic Neo");
  const letterSpacing = Number(layer.letterSpacing ?? 0);
  const stroke = layer.stroke
    ? ` paint-order="stroke" stroke="${escapeXml(layer.stroke)}" stroke-width="${Number(layer.strokeWidth ?? 2)}" stroke-linejoin="round"`
    : "";

  const tspans = fitted.lines
    .map(
      (line, lineIndex) =>
        `<tspan x="${anchorX}" dy="${lineIndex === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<text x="${anchorX}" y="${y + fitted.fontSize}" text-anchor="${anchor}" fill="${escapeXml(layer.fill ?? "#FFFFFF")}" font-family="${family}" font-size="${fitted.fontSize}" font-weight="${Number(layer.fontWeight ?? 700)}" letter-spacing="${letterSpacing}"${stroke}>${tspans}</text>`;
}

function renderRectLayer(layer, index, defs) {
  const shadowId = `shadow-${index}`;
  if (layer.shadow) defs.push(svgShadow(shadowId, layer.shadow));
  const filter = layer.shadow ? ` filter="url(#${shadowId})"` : "";
  const stroke = layer.stroke
    ? ` stroke="${escapeXml(layer.stroke)}" stroke-width="${Number(layer.strokeWidth ?? 1)}"`
    : "";

  return `<rect x="${Number(layer.x)}" y="${Number(layer.y)}" width="${Number(layer.width)}" height="${Number(layer.height)}" rx="${Number(layer.radius ?? 0)}" fill="${escapeXml(layer.fill ?? "none")}" opacity="${Number(layer.opacity ?? 1)}"${stroke}${filter} />`;
}

function renderPillLayer(layer, index, defs) {
  const rect = renderRectLayer(layer, index, defs);
  const fontSize = Number(layer.fontSize ?? 24);
  const x = Number(layer.x);
  const y = Number(layer.y);
  const width = Number(layer.width);
  const height = Number(layer.height);

  const text = `<text x="${x + width / 2}" y="${y + height / 2}" dominant-baseline="middle" text-anchor="middle" fill="${escapeXml(layer.textFill ?? "#111111")}" font-family="${escapeXml(layer.fontFamily ?? "Apple SD Gothic Neo")}" font-size="${fontSize}" font-weight="${Number(layer.fontWeight ?? 700)}" letter-spacing="${Number(layer.letterSpacing ?? 0)}">${escapeXml(layer.text)}</text>`;
  return `${rect}${text}`;
}

function renderGradientLayer(layer, index, defs) {
  const id = `gradient-${index}`;
  const stops = (layer.stops ?? [])
    .map(
      (stop) =>
        `<stop offset="${escapeXml(stop.offset)}" stop-color="${escapeXml(stop.color)}" stop-opacity="${Number(stop.opacity ?? 1)}" />`,
    )
    .join("");
  defs.push(
    `<linearGradient id="${id}" x1="${layer.x1 ?? "0%"}" y1="${layer.y1 ?? "0%"}" x2="${layer.x2 ?? "0%"}" y2="${layer.y2 ?? "100%"}">${stops}</linearGradient>`,
  );
  return `<rect x="${Number(layer.x ?? 0)}" y="${Number(layer.y ?? 0)}" width="${Number(layer.width)}" height="${Number(layer.height)}" fill="url(#${id})" opacity="${Number(layer.opacity ?? 1)}" />`;
}

function renderCircleLayer(layer) {
  return `<circle cx="${Number(layer.cx)}" cy="${Number(layer.cy)}" r="${Number(layer.r)}" fill="${escapeXml(layer.fill ?? "none")}" opacity="${Number(layer.opacity ?? 1)}" />`;
}

function checkSafeArea(layer, safeArea, canvas, warnings) {
  if (!layer.critical || layer.type === "gradient") return;
  const left = Number(layer.x ?? layer.cx - layer.r ?? 0);
  const top = Number(layer.y ?? layer.cy - layer.r ?? 0);
  const width = Number(layer.width ?? layer.r * 2 ?? 0);
  const height = Number(
    layer.height ??
      (layer.type === "text"
        ? Number(layer.fontSize) * Number(layer.maxLines ?? 1) * Number(layer.lineHeight ?? 1.15)
        : layer.r * 2) ??
      0,
  );
  const right = left + width;
  const bottom = top + height;

  if (
    left < safeArea.left ||
    top < safeArea.top ||
    right > canvas.width - safeArea.right ||
    bottom > canvas.height - safeArea.bottom
  ) {
    warnings.push(`${layer.name ?? layer.type}: critical layer crosses the safe area`);
  }
}

function buildOverlaySvg({ canvas, safeArea, layers, debugSafeArea }) {
  const defs = [];
  const warnings = [];
  const body = layers
    .map((layer, index) => {
      checkSafeArea(layer, safeArea, canvas, warnings);
      if (layer.type === "text") return renderTextLayer(layer, index, warnings);
      if (layer.type === "rect") return renderRectLayer(layer, index, defs);
      if (layer.type === "pill") return renderPillLayer(layer, index, defs);
      if (layer.type === "gradient") return renderGradientLayer(layer, index, defs);
      if (layer.type === "circle") return renderCircleLayer(layer);
      if (layer.type === "image") return "";
      throw new Error(`Unsupported layer type: ${layer.type}`);
    })
    .join("\n");

  const debug = debugSafeArea
    ? `<rect x="${safeArea.left}" y="${safeArea.top}" width="${canvas.width - safeArea.left - safeArea.right}" height="${canvas.height - safeArea.top - safeArea.bottom}" fill="none" stroke="#FF2D55" stroke-width="3" stroke-dasharray="16 12" />`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
    <defs>${defs.join("\n")}</defs>
    ${body}
    ${debug}
  </svg>`;

  return { svg: Buffer.from(svg), warnings };
}

async function renderImageLayer(layer, cwd) {
  const width = Number(layer.width);
  const height = Number(layer.height);
  const sourcePath = path.resolve(cwd, layer.source);
  await fs.access(sourcePath);

  let image = sharp(sourcePath)
    .resize(width, height, {
      fit: layer.fit ?? "cover",
      position: layer.position ?? "centre",
      background: layer.background ?? "#00000000",
    })
    .ensureAlpha();

  if (layer.radius) {
    const radius = Number(layer.radius);
    const mask = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="${radius}" fill="#fff" />
      </svg>`,
    );
    image = image.composite([{ input: mask, blend: "dest-in" }]);
  }

  return {
    input: await image.png().toBuffer(),
    left: Number(layer.x),
    top: Number(layer.y),
  };
}

async function buildLayerComposites({
  canvas,
  safeArea,
  layers,
  cwd,
  debugSafeArea,
}) {
  const composites = [];
  const warnings = [];

  for (const [index, layer] of layers.entries()) {
    checkSafeArea(layer, safeArea, canvas, warnings);
    if (layer.type === "image") {
      composites.push(await renderImageLayer(layer, cwd));
      continue;
    }

    const overlay = buildOverlaySvg({
      canvas,
      safeArea,
      layers: [layer],
      debugSafeArea: false,
    });
    warnings.push(...overlay.warnings);
    composites.push({ input: overlay.svg, left: 0, top: 0 });
  }

  if (debugSafeArea) {
    const debug = buildOverlaySvg({
      canvas,
      safeArea,
      layers: [],
      debugSafeArea: true,
    });
    composites.push({ input: debug.svg, left: 0, top: 0 });
  }

  return { composites, warnings: [...new Set(warnings)] };
}

function placeholderSvg(canvas, placeholder = {}, creativeId) {
  const palette = placeholder.palette ?? ["#F7B2D9", "#6C63FF", "#111322"];
  const seed = [...creativeId].reduce((sum, char) => sum + char.codePointAt(0), 0);
  const circles = Array.from({ length: 8 }, (_, index) => {
    const cx = (seed * (index + 3) * 41) % canvas.width;
    const cy = (seed * (index + 5) * 29) % canvas.height;
    const radius = 120 + ((seed * (index + 7)) % 280);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${palette[index % palette.length]}" opacity="${0.18 + (index % 3) * 0.08}" />`;
  }).join("");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
    <defs>
      <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}" />
        <stop offset="55%" stop-color="${palette[1] ?? palette[0]}" />
        <stop offset="100%" stop-color="${palette[2] ?? palette[0]}" />
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="36" /></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#base)" />
    <g filter="url(#blur)">${circles}</g>
  </svg>`);
}

async function ensureBackground({
  creative,
  canvas,
  backgroundPath,
  placeholderPath,
  allowPlaceholder,
}) {
  if (creative.background.fill) {
    return { path: null, placeholder: false, fill: creative.background.fill };
  }

  try {
    await fs.access(backgroundPath);
    return { path: backgroundPath, placeholder: false };
  } catch {
    if (!allowPlaceholder || !creative.background.placeholder) {
      throw new Error(`Background not found: ${backgroundPath}`);
    }

    await fs.mkdir(path.dirname(placeholderPath), { recursive: true });
    const svg = placeholderSvg(canvas, creative.background.placeholder, creative.id);
    await sharp(svg).png().toFile(placeholderPath);
    return { path: placeholderPath, placeholder: true };
  }
}

export async function renderCreative({
  creative,
  template,
  canvas,
  safeArea,
  cwd,
  outputDir,
  debugSafeArea = false,
  requireRealBackgrounds = false,
}) {
  const startedAt = performance.now();
  const backgroundPath = creative.background.source
    ? path.resolve(cwd, creative.background.source)
    : null;
  const placeholderPath = path.join(
    outputDir,
    "_placeholders",
    `${creative.id}.png`,
  );
  const background = await ensureBackground({
    creative,
    canvas,
    backgroundPath,
    placeholderPath,
    allowPlaceholder: !requireRealBackgrounds,
  });
  const variables = { ...creative.variables, creativeId: creative.id };
  const layers = resolveTokens(template.layers, variables);
  const { composites, warnings } = await buildLayerComposites({
    canvas,
    safeArea,
    layers,
    cwd,
    debugSafeArea,
  });
  if (background.placeholder) {
    warnings.unshift("placeholder background used; replace it before publishing");
  }

  const outputPath = path.join(outputDir, `${creative.id}.png`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const base = background.path
    ? sharp(background.path).resize(canvas.width, canvas.height, {
        fit: creative.background.fit ?? "cover",
        position: creative.background.position ?? "centre",
      })
    : sharp({
        create: {
          width: canvas.width,
          height: canvas.height,
          channels: 4,
          background: background.fill,
        },
      });
  await base
    .composite(composites)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  const buffer = await fs.readFile(outputPath);
  return {
    id: creative.id,
    idea: creative.idea,
    moment: creative.moment,
    output: path.relative(cwd, outputPath),
    background: background.path ? path.relative(cwd, background.path) : background.fill,
    placeholder: background.placeholder,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
    warnings,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

export async function createContactSheet({ results, canvas, cwd, outputDir }) {
  const columns = 5;
  const thumbWidth = 216;
  const thumbHeight = Math.round((thumbWidth / canvas.width) * canvas.height);
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

  const contactSheetPath = path.join(outputDir, "contact-sheet.jpg");
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
    .toFile(contactSheetPath);
  return path.relative(cwd, contactSheetPath);
}
