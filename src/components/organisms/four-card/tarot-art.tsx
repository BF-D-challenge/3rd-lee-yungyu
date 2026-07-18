/**
 * 단색 고밀도 타로 픽셀 아트.
 * 72×46 그리드의 불투명 픽셀을 SVG path 하나로 병합해, 색조 없이 밀도만으로 명암을 만든다.
 * Paxel의 큰 디더 셀과 State of AI Design의 편집형 크롭을 참고하되 외부 이미지는 사용하지 않는다.
 */

import { cn } from "@/lib/utils";

export const TAROT_PIXEL_GRID = { width: 72, height: 46 } as const;

const { width: GRID_WIDTH, height: GRID_HEIGHT } = TAROT_PIXEL_GRID;
const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
] as const;

type PixelGrid = Uint8Array;
type Point = readonly [number, number];

const pixelIndex = (x: number, y: number) => y * GRID_WIDTH + x;

const paintPixel = (grid: PixelGrid, x: number, y: number, value = 1) => {
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
  grid[pixelIndex(x, y)] = value;
};

const paintBrush = (grid: PixelGrid, x: number, y: number, radius: number, value = 1) => {
  for (let py = y - radius; py <= y + radius; py += 1) {
    for (let px = x - radius; px <= x + radius; px += 1) paintPixel(grid, px, py, value);
  }
};

const paintLine = (
  grid: PixelGrid,
  from: Point,
  to: Point,
  radius = 0,
  value = 1,
) => {
  let [x, y] = from;
  const [endX, endY] = to;
  const dx = Math.abs(endX - x);
  const dy = Math.abs(endY - y);
  const sx = x < endX ? 1 : -1;
  const sy = y < endY ? 1 : -1;
  let error = dx - dy;

  while (true) {
    paintBrush(grid, x, y, radius, value);
    if (x === endX && y === endY) break;
    const doubled = error * 2;
    if (doubled > -dy) {
      error -= dy;
      x += sx;
    }
    if (doubled < dx) {
      error += dx;
      y += sy;
    }
  }
};

const ellipseValue = (x: number, y: number, radiusX: number, radiusY: number) =>
  x * x * radiusY * radiusY + y * y * radiusX * radiusX;

const paintEllipse = (
  grid: PixelGrid,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  thickness = 1,
  value = 1,
) => {
  const outer = radiusX * radiusX * radiusY * radiusY;
  const innerX = Math.max(0, radiusX - thickness);
  const innerY = Math.max(0, radiusY - thickness);
  const inner = innerX * innerX * innerY * innerY;

  for (let y = -radiusY; y <= radiusY; y += 1) {
    for (let x = -radiusX; x <= radiusX; x += 1) {
      const outerValue = ellipseValue(x, y, radiusX, radiusY);
      const innerValue = ellipseValue(x, y, innerX, innerY);
      if (outerValue <= outer && (innerX === 0 || innerY === 0 || innerValue > inner)) {
        paintPixel(grid, centerX + x, centerY + y, value);
      }
    }
  }
};

const fillEllipse = (
  grid: PixelGrid,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  value = 1,
) => {
  const outer = radiusX * radiusX * radiusY * radiusY;
  for (let y = -radiusY; y <= radiusY; y += 1) {
    for (let x = -radiusX; x <= radiusX; x += 1) {
      if (ellipseValue(x, y, radiusX, radiusY) <= outer) {
        paintPixel(grid, centerX + x, centerY + y, value);
      }
    }
  }
};

const isInsidePolygon = (x: number, y: number, points: readonly Point[]) => {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[previous];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
};

const ditherThreshold = (x: number, y: number, phase = 0) =>
  BAYER_8[((y + phase) & 7) * 8 + ((x + phase * 3) & 7)];

const paintPolygon = (grid: PixelGrid, points: readonly Point[], value = 1, dither = 64, phase = 0) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(GRID_WIDTH - 1, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(GRID_HEIGHT - 1, Math.max(...ys));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (isInsidePolygon(x + 0.5, y + 0.5, points) && ditherThreshold(x, y, phase) < dither) {
        paintPixel(grid, x, y, value);
      }
    }
  }
};

const outlinePolygon = (grid: PixelGrid, points: readonly Point[]) => {
  points.forEach((point, index) => paintLine(grid, point, points[(index + 1) % points.length]));
};

const outlineBox = (grid: PixelGrid, left: number, top: number, right: number, bottom: number) => {
  paintLine(grid, [left, top], [right, top]);
  paintLine(grid, [right, top], [right, bottom]);
  paintLine(grid, [right, bottom], [left, bottom]);
  paintLine(grid, [left, bottom], [left, top]);
};

const clearBox = (grid: PixelGrid, left: number, top: number, right: number, bottom: number) => {
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) paintPixel(grid, x, y, 0);
  }
};

const paintDitherField = (
  grid: PixelGrid,
  seed: number,
  densityAt: (x: number, y: number) => number,
) => {
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const grain = (x * 11 + y * 7 + seed * 17) % 19 < 4 ? 5 : 0;
      const density = Math.max(0, Math.min(64, Math.round(densityAt(x, y) + grain)));
      if (ditherThreshold(x, y, seed) < density) paintPixel(grid, x, y);
    }
  }
};

const buildSourceArt = () => {
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  paintDitherField(grid, 1, (x, y) => {
    const edge = Math.abs(x - 36) / 36;
    const top = 1 - y / GRID_HEIGHT;
    return 6 + edge * 30 + top * 14;
  });
  fillEllipse(grid, 36, 22, 24, 20, 0);

  const star: readonly Point[] = [
    [36, 1], [41, 14], [52, 7], [48, 18], [70, 22], [49, 26], [58, 42], [41, 31],
    [36, 45], [31, 32], [15, 42], [23, 27], [2, 23], [23, 18], [14, 6], [31, 14],
  ];
  paintPolygon(grid, star, 1, 39, 1);
  outlinePolygon(grid, star);
  paintEllipse(grid, 36, 22, 11, 7, 2);
  paintEllipse(grid, 36, 22, 7, 4);
  fillEllipse(grid, 36, 22, 2, 2);
  paintLine(grid, [36, 5], [36, 39]);
  paintLine(grid, [18, 22], [54, 22]);
  paintLine(grid, [24, 10], [48, 34]);
  paintLine(grid, [48, 10], [24, 34]);
  outlineBox(grid, 3, 3, 68, 43);
  paintLine(grid, [4, 10], [10, 10]);
  paintLine(grid, [62, 35], [68, 35]);
  return grid;
};

const buildPayerArt = () => {
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  paintDitherField(grid, 2, (x, y) => {
    const side = Math.abs(x - 36) / 36;
    const bottom = y / GRID_HEIGHT;
    return 8 + side * 25 + bottom * 18;
  });
  fillEllipse(grid, 36, 16, 21, 16, 0);
  paintPolygon(grid, [[0, 46], [0, 39], [18, 31], [28, 28], [36, 33], [44, 28], [54, 31], [72, 39], [72, 46]], 0);

  const rays: readonly [Point, Point][] = [
    [[36, 0], [36, 3]], [[36, 29], [36, 32]], [[16, 16], [20, 16]], [[52, 16], [56, 16]],
    [[22, 2], [25, 6]], [[50, 2], [47, 6]], [[22, 29], [25, 26]], [[50, 29], [47, 26]],
    [[18, 7], [23, 9]], [[54, 7], [49, 9]], [[18, 25], [23, 23]], [[54, 25], [49, 23]],
  ];
  rays.forEach(([from, to]) => paintLine(grid, from, to));
  paintEllipse(grid, 36, 16, 14, 14, 2);
  paintEllipse(grid, 36, 16, 11, 11);
  fillEllipse(grid, 36, 14, 6, 7);
  fillEllipse(grid, 38, 15, 4, 6, 0);
  paintLine(grid, [32, 22], [31, 29], 1);
  paintLine(grid, [40, 21], [42, 29], 1);

  const shoulders: readonly Point[] = [[13, 45], [17, 37], [29, 29], [36, 33], [43, 29], [55, 37], [59, 45]];
  paintPolygon(grid, shoulders, 1, 44, 3);
  outlinePolygon(grid, shoulders);
  paintLine(grid, [18, 39], [31, 31]);
  paintLine(grid, [54, 39], [41, 31]);

  paintEllipse(grid, 9, 29, 6, 6, 2);
  paintEllipse(grid, 63, 29, 6, 6, 2);
  paintLine(grid, [7, 29], [11, 29]);
  paintLine(grid, [9, 26], [9, 32]);
  paintLine(grid, [61, 29], [65, 29]);
  paintLine(grid, [63, 26], [63, 32]);
  outlineBox(grid, 2, 3, 69, 44);
  return grid;
};

const buildMomentArt = () => {
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  paintDitherField(grid, 3, (x, y) => {
    const side = Math.abs(x - 36) / 36;
    const middle = 1 - Math.abs(y - 23) / 23;
    return 5 + side * 34 + middle * 13;
  });
  clearBox(grid, 23, 2, 49, 43);

  fillEllipse(grid, 10, 10, 6, 6);
  fillEllipse(grid, 13, 8, 6, 6, 0);
  paintEllipse(grid, 62, 10, 5, 5, 2);
  paintLine(grid, [62, 2], [62, 5]);
  paintLine(grid, [62, 15], [62, 18]);
  paintLine(grid, [54, 10], [57, 10]);
  paintLine(grid, [67, 10], [70, 10]);
  [[13, 24], [8, 31], [16, 38], [57, 25], [64, 31], [58, 39]].forEach(([x, y], index) => {
    paintPixel(grid, x, y);
    if (index % 2 === 0) {
      paintPixel(grid, x - 1, y);
      paintPixel(grid, x + 1, y);
      paintPixel(grid, x, y - 1);
      paintPixel(grid, x, y + 1);
    }
  });

  paintLine(grid, [23, 3], [49, 3], 1);
  paintLine(grid, [23, 42], [49, 42], 1);
  paintLine(grid, [26, 7], [46, 7]);
  paintLine(grid, [26, 38], [46, 38]);
  paintLine(grid, [26, 7], [33, 20]);
  paintLine(grid, [46, 7], [39, 20]);
  paintLine(grid, [33, 20], [26, 38]);
  paintLine(grid, [39, 20], [46, 38]);
  paintPolygon(grid, [[28, 8], [44, 8], [36, 20]], 1, 36, 1);
  paintPolygon(grid, [[36, 24], [28, 37], [44, 37]], 1, 48, 2);
  paintLine(grid, [36, 18], [36, 28]);
  paintPixel(grid, 35, 22, 0);
  paintPixel(grid, 36, 24, 0);
  paintPixel(grid, 37, 26, 0);
  outlineBox(grid, 2, 2, 69, 43);
  return grid;
};

const buildTwistArt = () => {
  const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  paintDitherField(grid, 4, (x, y) => {
    const diagonal = (x + y * 1.4) / (GRID_WIDTH + GRID_HEIGHT * 1.4);
    const split = x < 36 ? diagonal : 1 - diagonal;
    return 10 + split * 38;
  });
  paintLine(grid, [51, 0], [36, 19], 6, 0);
  paintLine(grid, [40, 17], [23, 46], 6, 0);

  const bolt: readonly Point[] = [[46, 0], [22, 25], [34, 25], [21, 46], [55, 17], [42, 17], [60, 0]];
  paintPolygon(grid, bolt, 1, 58, 4);
  outlinePolygon(grid, bolt);
  paintPixel(grid, 44, 8, 0);
  paintPixel(grid, 40, 14, 0);
  paintPixel(grid, 32, 31, 0);
  paintPixel(grid, 29, 36, 0);

  const shockLines: readonly [Point, Point][] = [
    [[2, 6], [17, 12]], [[3, 22], [18, 22]], [[2, 39], [16, 32]],
    [[70, 5], [57, 11]], [[69, 23], [54, 23]], [[70, 40], [55, 33]],
  ];
  shockLines.forEach(([from, to]) => paintLine(grid, from, to));
  paintLine(grid, [0, 42], [13, 35]);
  paintLine(grid, [13, 35], [21, 42]);
  paintLine(grid, [51, 42], [59, 35]);
  paintLine(grid, [59, 35], [71, 42]);
  outlineBox(grid, 2, 2, 69, 43);
  return grid;
};

const gridToPath = (grid: PixelGrid) => {
  let path = "";
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH;) {
      if (grid[pixelIndex(x, y)] === 0) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < GRID_WIDTH && grid[pixelIndex(end, y)] === 1) end += 1;
      path += `M${x},${y}h${end - x}v1H${x}z`;
      x = end;
    }
  }
  return path;
};

const ART_NAMES = ["source-compass", "payer-portrait", "moment-hourglass", "twist-bolt"] as const;
const ART_GRIDS = [buildSourceArt(), buildPayerArt(), buildMomentArt(), buildTwistArt()] as const;

export const TAROT_ART_PATHS = ART_GRIDS.map(gridToPath);
export const TAROT_ART_STATS = ART_GRIDS.map((grid, index) => ({
  name: ART_NAMES[index],
  pixels: grid.reduce((total, pixel) => total + pixel, 0),
  pathLength: TAROT_ART_PATHS[index].length,
}));

export interface TarotArtProps {
  axisIndex: number;
  color: string;
  className?: string;
}

export function TarotArt({ axisIndex, color, className }: TarotArtProps) {
  const index = Math.abs(axisIndex) % TAROT_ART_PATHS.length;
  const stats = TAROT_ART_STATS[index];

  return (
    <svg
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
      data-art={stats.name}
      data-grid={`${GRID_WIDTH}x${GRID_HEIGHT}`}
      data-palette="mono"
      data-pixel-count={stats.pixels}
      data-style="editorial-dither"
      data-tarot-art={index}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      style={{ color }}
      viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
    >
      <rect width={GRID_WIDTH} height={GRID_HEIGHT} fill="#090a0d" />
      <path d={TAROT_ART_PATHS[index]} fill="currentColor" />
    </svg>
  );
}
