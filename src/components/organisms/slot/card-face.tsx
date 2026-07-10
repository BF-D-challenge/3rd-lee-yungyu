import { BACK_DOTS, BACK_RAYS } from "./card-back";

export interface CardFaceProps {
  axisLabel: string;
  value: string;
  caption?: string;
  /** 매출 근거가 있는 사전검수 콤보와 일치 — 잉크를 골드 톤으로, 카드지·그라데이션은 그대로(카드 자체엔 그라데이션 금지) */
  golden?: boolean;
}

const splitValue = (value: string): string[] => {
  const chars = Array.from(value);
  if (chars.length <= 8) return [value];
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid).join(""), chars.slice(mid).join("")];
};

/** 잉크 색 — 기본은 흑백(D12), golden은 같은 명도의 앤틱 골드로 치환 */
const INK = { plain: "234,234,234", golden: "224,182,96" };

export function CardFace({ axisLabel, value, caption, golden }: CardFaceProps) {
  const lines = splitValue(value);
  const isMultiline = lines.length > 1;
  const ink = golden ? INK.golden : INK.plain;

  return (
    <svg
      viewBox="0 0 300 485"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      className="block h-full w-full rounded-card"
    >
      <rect
        x="0"
        y="0"
        width="300"
        height="485"
        rx="48"
        fill="#0d0d0f"
      />
      <rect
        x="4.5"
        y="4.5"
        width="291"
        height="476"
        rx="42"
        fill="none"
        stroke={`rgba(${ink},.9)`}
        strokeWidth={golden ? 2 : 1.5}
      />
      <rect
        x="17"
        y="17"
        width="266"
        height="451"
        rx="11"
        fill="none"
        stroke={`rgba(${ink},.3)`}
        strokeWidth="1"
      />
      <g fill={`rgba(${ink},.55)`} dangerouslySetInnerHTML={{ __html: BACK_DOTS }} />
      <g
        stroke={`rgba(${ink},${golden ? 0.1 : 0.06})`}
        strokeWidth="1.7"
        strokeLinecap="round"
        dangerouslySetInnerHTML={{ __html: BACK_RAYS }}
      />
      <text
        x="150"
        y="64"
        textAnchor="middle"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="20"
        fontStyle="italic"
        letterSpacing=".14em"
        fill={`rgba(${ink},.6)`}
      >
        {axisLabel}
        {golden ? " ✨" : ""}
      </text>
      <text
        x="150"
        y={isMultiline ? 232 : 242}
        textAnchor="middle"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize={isMultiline ? 24 : 32}
        fontStyle="italic"
        fill={`rgba(${ink},.97)`}
      >
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x="150" dy={index === 0 ? 0 : "1.24em"}>
            {line}
          </tspan>
        ))}
      </text>
      <line x1="124" y1="352" x2="176" y2="352" stroke={`rgba(${ink},.4)`} strokeWidth="1" />
      {caption && (
        <text
          x="150"
          y="396"
          textAnchor="middle"
          fontFamily="var(--font-serif), Georgia, serif"
          fontSize="18"
          fontStyle="italic"
          fill={`rgba(${ink},.65)`}
        >
          {caption}
        </text>
      )}
    </svg>
  );
}
