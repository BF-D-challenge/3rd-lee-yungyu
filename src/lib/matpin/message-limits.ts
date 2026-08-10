export const MATPIN_INSTAGRAM_TEXT_MAX_BYTES = 1_000;

const UTF8_ENCODER = new TextEncoder();
const GRAPHEME_SEGMENTER = new Intl.Segmenter("ko", { granularity: "grapheme" });
const TRUNCATION_MARK = "…";

export function matpinInstagramTextBytes(value: string): number {
  return UTF8_ENCODER.encode(value).byteLength;
}

export function isMatpinInstagramTextWithinLimit(value: string): boolean {
  return matpinInstagramTextBytes(value) <= MATPIN_INSTAGRAM_TEXT_MAX_BYTES;
}

export function truncateMatpinInstagramText(value: string, maxBytes: number): string {
  if (maxBytes <= 0) return "";
  if (matpinInstagramTextBytes(value) <= maxBytes) return value;

  const markBytes = matpinInstagramTextBytes(TRUNCATION_MARK);
  if (markBytes > maxBytes) return "";

  const contentMaxBytes = maxBytes - markBytes;
  let content = "";
  let contentBytes = 0;

  for (const { segment } of GRAPHEME_SEGMENTER.segment(value)) {
    const segmentBytes = matpinInstagramTextBytes(segment);
    if (contentBytes + segmentBytes > contentMaxBytes) break;
    content += segment;
    contentBytes += segmentBytes;
  }

  return `${content}${TRUNCATION_MARK}`;
}
