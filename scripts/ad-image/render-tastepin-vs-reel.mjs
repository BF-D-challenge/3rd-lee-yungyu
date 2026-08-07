#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const CAMPAIGN_DIR = path.join(
  ROOT,
  "outputs/ad-image-system/tastepin-vs-reel-2026-07-27",
);
const SOURCE = path.join(CAMPAIGN_DIR, "assets/generated/vs-choice-stage.png");
const RENDER_DIR = path.join(CAMPAIGN_DIR, "renders");
const FRAME_DIR = path.join(CAMPAIGN_DIR, ".frames");
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION = 4.2;
const FRAME_COUNT = Math.round(FPS * DURATION);

function svg(body, width = WIDTH, height = HEIGHT) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${body}
    </svg>`,
  );
}

function easeOutCubic(value) {
  const t = Math.max(0, Math.min(1, value));
  return 1 - (1 - t) ** 3;
}

function progress(time, start, duration) {
  return easeOutCubic((time - start) / duration);
}

function overlayAt(time, forceFinal = false) {
  const leftP = forceFinal ? 1 : progress(time, 0.15, 0.45);
  const vsP = forceFinal ? 1 : progress(time, 0.85, 0.35);
  const rightP = forceFinal ? 1 : progress(time, 1.35, 0.55);
  const leftX = -86 * (1 - leftP);
  const rightX = 86 * (1 - rightP);
  const vsScale = 0.95 + 0.05 * vsP;
  return svg(`
    <defs>
      <filter id="shadow" x="-25%" y="-30%" width="170%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#00133B" flood-opacity=".52"/>
      </filter>
    </defs>
    <g transform="translate(${leftX} 0)" opacity="${leftP}">
      <text x="72" y="250" fill="#FFF4DC"
        font-family="Apple SD Gothic Neo, Pretendard, sans-serif"
        font-size="124" font-weight="900" letter-spacing="-4"
        filter="url(#shadow)">
        <tspan x="72">저장만</tspan>
        <tspan x="72" dy="155">하기</tspan>
      </text>
    </g>
    <g transform="translate(540 625) scale(${vsScale}) translate(-540 -625)" opacity="${vsP}">
      <text x="540" y="625" text-anchor="middle" fill="#FF604A"
        stroke="#FFF4DC" stroke-width="5" paint-order="stroke"
        font-family="Arial Black, Arial, sans-serif"
        font-size="190" font-weight="950" letter-spacing="-8"
        filter="url(#shadow)">VS</text>
    </g>
    <g transform="translate(${rightX} 0)" opacity="${rightP}">
      <text x="1008" y="790" text-anchor="end" fill="#FFF4DC"
        font-family="Apple SD Gothic Neo, Pretendard, sans-serif"
        font-size="116" font-weight="900" letter-spacing="-4"
        filter="url(#shadow)">
        <tspan x="1008">식당까지</tspan>
        <tspan x="1008" dy="145">찾기</tspan>
      </text>
    </g>
  `);
}

async function makeBase() {
  return sharp(SOURCE)
    .resize(WIDTH, HEIGHT, {fit: "cover", position: "centre"})
    .png()
    .toBuffer();
}

async function renderPoster(base) {
  const output = path.join(RENDER_DIR, "tastepin-vs-poster-9x16.png");
  await sharp(base)
    .composite([{input: overlayAt(DURATION, true)}])
    .png({compressionLevel: 9})
    .toFile(output);
  return output;
}

async function renderFrames(base) {
  await fs.rm(FRAME_DIR, {recursive: true, force: true});
  await fs.mkdir(FRAME_DIR, {recursive: true});
  const keyFrames = new Map([
    [0, "01-scene"],
    [Math.round(0.7 * FPS), "02-left"],
    [Math.round(1.25 * FPS), "03-vs"],
    [Math.round(2.15 * FPS), "04-final"],
  ]);
  const snapshots = [];
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const time = index / FPS;
    const frame = await sharp(base)
      .composite([{input: overlayAt(time)}])
      .png()
      .toBuffer();
    const framePath = path.join(
      FRAME_DIR,
      `frame-${String(index).padStart(4, "0")}.png`,
    );
    await fs.writeFile(framePath, frame);
    if (keyFrames.has(index)) {
      const snapshot = path.join(
        RENDER_DIR,
        `${keyFrames.get(index)}.png`,
      );
      await fs.writeFile(snapshot, frame);
      snapshots.push(snapshot);
    }
  }
  return snapshots;
}

async function encodeVideo() {
  const output = path.join(RENDER_DIR, "tastepin-vs-reel-9x16.mp4");
  await execFileAsync(
    "/opt/homebrew/bin/ffmpeg",
    [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      path.join(FRAME_DIR, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
    {maxBuffer: 1024 * 1024 * 10},
  );
  await fs.rm(FRAME_DIR, {recursive: true, force: true});
  return output;
}

async function storyboard(snapshots) {
  const width = 240;
  const height = Math.round(width * (HEIGHT / WIDTH));
  const gutter = 14;
  const sheetWidth = snapshots.length * width + (snapshots.length + 1) * gutter;
  const sheetHeight = height + gutter * 2;
  const composites = [];
  for (let index = 0; index < snapshots.length; index += 1) {
    composites.push({
      input: await sharp(snapshots[index])
        .resize(width, height, {fit: "cover"})
        .png()
        .toBuffer(),
      left: gutter + index * (width + gutter),
      top: gutter,
    });
  }
  const output = path.join(CAMPAIGN_DIR, "storyboard.png");
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
  await fs.access(SOURCE);
  const base = await makeBase();
  const poster = await renderPoster(base);
  const snapshots = await renderFrames(base);
  const video = await encodeVideo();
  const board = await storyboard(snapshots);
  const report = {
    generatedAt: new Date().toISOString(),
    promptRecipe: "versus-choice-reel",
    profile: {id: "ig_reels", width: WIDTH, height: HEIGHT, ratio: "9:16"},
    motion: {
      purpose: "두 선택의 읽는 순서를 설명",
      trigger: "자동 재생",
      target: "코드 제목",
      handoff: "왼쪽 선택에서 중앙 VS를 거쳐 오른쪽 선택으로 이동",
      durationSeconds: DURATION,
      fps: FPS,
      backgroundMotion: "none",
      finalHoldSeconds: DURATION - 1.9,
      reducedMotionAlternative: path.relative(ROOT, poster),
    },
    outputs: {
      poster: path.relative(ROOT, poster),
      video: path.relative(ROOT, video),
      storyboard: path.relative(ROOT, board),
    },
    publishable: false,
    blockReason: "사람 승인과 Meta 본문·기본 CTA 설정이 필요합니다.",
  };
  await fs.writeFile(
    path.join(CAMPAIGN_DIR, "render-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(path.relative(ROOT, poster));
  console.log(path.relative(ROOT, video));
  console.log(path.relative(ROOT, board));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
