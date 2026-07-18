export interface ShareCardOptions {
  title?: string;
  text?: string;
}

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

const compact = (value: string | undefined): string =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const wrappedCanvasLines = (
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
): string[] => {
  const characters = Array.from(compact(value));
  const lines: string[] = [];
  let line = "";

  for (const character of characters) {
    const candidate = `${line}${character}`;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line.trim());
      line = character.trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line.trim());
  if (lines.length === maxLines && characters.join("") !== lines.join("")) {
    let last = lines[maxLines - 1];
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = Array.from(last).slice(0, -1).join("");
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
};

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.94));

/**
 * Instagram과 KakaoTalk이 함께 사용하는 9:16 공유 카드 PNG를 만든다.
 * 사용자 아이디어는 외부 서버에 저장하지 않고 공유 직전에 브라우저에서만 그린다.
 */
export async function createShareCardFile(
  url: string,
  options: ShareCardOptions = {},
): Promise<File | null> {
  if (
    typeof document === "undefined"
    || typeof File === "undefined"
  ) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const background = context.createLinearGradient(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  background.addColorStop(0, "#17141f");
  background.addColorStop(0.48, "#0a0a0b");
  background.addColorStop(1, "#111a2e");
  context.fillStyle = background;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const roseGlow = context.createRadialGradient(150, 260, 0, 150, 260, 620);
  roseGlow.addColorStop(0, "rgba(255,68,88,0.38)");
  roseGlow.addColorStop(1, "rgba(255,68,88,0)");
  context.fillStyle = roseGlow;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, 900);

  const blueGlow = context.createRadialGradient(930, 1650, 0, 930, 1650, 680);
  blueGlow.addColorStop(0, "rgba(58,99,255,0.32)");
  blueGlow.addColorStop(1, "rgba(58,99,255,0)");
  context.fillStyle = blueGlow;
  context.fillRect(250, 950, 830, 970);

  context.fillStyle = "#ff4458";
  roundedRect(context, 82, 88, 274, 74, 37);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("오늘 해볼까", 219, 125);

  context.textAlign = "left";
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.font = '600 34px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText("오늘 만든 아이디어", 82, 278);

  context.fillStyle = "rgba(20,20,24,0.82)";
  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.lineWidth = 3;
  roundedRect(context, 62, 338, 956, 1060, 52);
  context.fill();
  context.stroke();

  context.fillStyle = "#e8c56a";
  context.font = '700 30px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText("MY IDEA", 124, 442);

  const title = compact(options.title) || "오늘 만든 아이디어";
  context.fillStyle = "#ffffff";
  context.font = '800 78px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  const titleLines = wrappedCanvasLines(context, title, 832, 4);
  titleLines.forEach((line, index) => {
    context.fillText(line, 124, 560 + index * 104);
  });

  const summaryTop = 560 + titleLines.length * 104 + 58;
  const summary = compact(options.text).replace(/짧은 응원이나 의견을 남겨주세요\.?$/u, "").trim();
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.font = '500 42px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  const maxSummaryLines = Math.max(2, Math.floor((1148 - summaryTop) / 66) + 1);
  const summaryLines = wrappedCanvasLines(
    context,
    summary || "친구에게 보여주고 짧은 반응을 받아보세요.",
    832,
    maxSummaryLines,
  );
  summaryLines.forEach((line, index) => {
    context.fillText(line, 124, summaryTop + index * 66);
  });

  context.fillStyle = "rgba(255,255,255,0.08)";
  roundedRect(context, 124, 1220, 832, 3, 1.5);
  context.fill();
  context.fillStyle = "#7de4be";
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText("친구의 한마디로 다음 버전을 정해요", 124, 1290);

  const publicUrl = new URL(url);
  context.fillStyle = "#ffffff";
  context.font = '800 58px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText("이 아이디어, 어때?", 82, 1535);
  context.fillStyle = "rgba(255,255,255,0.62)";
  context.font = '500 32px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText("공유된 링크에서 응원이나 의견을 남길 수 있어요.", 82, 1600);

  context.fillStyle = "rgba(255,255,255,0.12)";
  roundedRect(context, 82, 1698, 916, 108, 28);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = '650 31px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  context.fillText(`오늘 해볼까 · ${publicUrl.hostname}`, 122, 1752);

  const blob = await canvasBlob(canvas);
  if (!blob) return null;
  return new File([blob], "oneul-haebolkka-share.png", {
    type: "image/png",
    lastModified: Date.now(),
  });
}
