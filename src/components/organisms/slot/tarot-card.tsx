/**
 * [S1] TarotCard — 타로 덱 카드 렌더러 (골드 프레임 + 아치 일러스트 창 + 카투슈).
 * 컨테이너 쿼리(cqi)로 슬롯(작음)~결과 히어로(큼)까지 한 코드로 자동 스케일.
 * 아트 경로는 lib/card-art.ts에서: artForValue(v) / CATEGORY_ART / AXIS_ART / CARD_BACK.
 * 설계: docs/card-art-integration.md · 목업과 동일한 골격.
 *
 * 사용 예 (다른 세션 렌더에서):
 *   import { artForValue, CARD_BACK } from "@/lib/card-art";
 *   <TarotCard art={artForValue(v)} suit="씨앗" name={seed.label} accent="#e6b455" numeral="I" />
 *   <TarotCard art={CARD_BACK} back />                         // 뒷면
 *   <TarotCard art={...} suit="불편" name={pain.short} compact /> // 작은 슬롯
 */
import type { CSSProperties } from "react";

export interface TarotCardProps {
  /** 창에 들어갈 일러스트 (artForValue / CATEGORY_ART / AXIS_ART) */
  art: string;
  /** 카투슈 상단 수트 라벨 (씨앗·불편·형태·장면·마음) */
  suit?: string;
  /** 카투슈 카드 이름 = 구체 값 (seed.label, pain.short …) */
  name?: string;
  /** 수트 액센트 hex — 창 상단 글로우 틴트 + 수트 라벨 색 */
  accent?: string;
  /** 상단 로마숫자 (씨앗 수트 I–VI 등, 선택) */
  numeral?: string;
  /** 뒷면 — 프레임만 두르고 아트를 꽉 채운다 (창·카투슈 없음) */
  back?: boolean;
  /** 작은 슬롯용 — 로마숫자·코너·수트 라벨 숨기고 이름만 크게, 스크림 강화 */
  compact?: boolean;
  /** CSS <style> 주입 여부. 한 화면에 여러 장이면 한 번만 true로 두고 나머지는 false. 기본 true. */
  injectStyle?: boolean;
  className?: string;
}

const FLOUR = (
  <svg className="tc-fl" viewBox="0 0 40 40" aria-hidden="true">
    <path
      d="M2 2 C 2 16, 8 22, 22 22 M2 2 C 16 2, 22 8, 22 22 M2 2 L 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
    <circle cx="24" cy="24" r="1.6" fill="currentColor" />
  </svg>
);

export function TarotCard({
  art,
  suit,
  name,
  accent = "#c9a962",
  numeral,
  back = false,
  compact = false,
  injectStyle = true,
  className,
}: TarotCardProps) {
  return (
    <div
      className={["tc", compact ? "tc-compact" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{ "--tc-accent": accent } as CSSProperties}
    >
      {injectStyle ? <style>{TC_CSS}</style> : null}
      <div className={["tc-frame", back ? "tc-back" : ""].filter(Boolean).join(" ")}>
        {!compact && (
          <>
            <span className="tc-corner tl">{FLOUR}</span>
            <span className="tc-corner tr">{FLOUR}</span>
            <span className="tc-corner bl">{FLOUR}</span>
            <span className="tc-corner br">{FLOUR}</span>
          </>
        )}
        {back ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="tc-full" src={art} alt="" />
        ) : (
          <>
            {numeral && !compact ? <span className="tc-num">{numeral}</span> : null}
            <div className="tc-window">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="tc-art" src={art} alt="" />
              <span className="tc-glow" aria-hidden />
              <span className="tc-tint" aria-hidden />
            </div>
            {(suit || name) && (
              <div className="tc-cartouche">
                {suit && !compact ? <span className="tc-suit">{suit}</span> : null}
                {name ? <span className="tc-name">{name}</span> : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* cqi = 카드 너비 1% — 슬롯이든 히어로든 같은 비율로 스케일 */
const TC_CSS = `
.tc{container-type:inline-size;width:100%;--tc-gold:#c9a962;--tc-hair:rgba(201,169,98,.22);--tc-line:rgba(201,169,98,.42)}
.tc-frame{position:relative;aspect-ratio:300/500;border-radius:3.2cqi;overflow:hidden;
 background:radial-gradient(120% 80% at 50% 6%, #1a2140, transparent 60%), linear-gradient(#0d1124,#090a15);
 border:.5cqi solid var(--tc-line);
 box-shadow:0 4cqi 9cqi rgba(0,0,0,.5), inset 0 0 0 1.2cqi #0b0d1a, inset 0 0 0 1.5cqi var(--tc-hair);
 padding:3.4cqi 3cqi 3cqi}
.tc-corner{position:absolute;width:6.5cqi;height:6.5cqi;color:var(--tc-gold);opacity:.9}
.tc-corner .tc-fl{width:100%;height:100%;display:block}
.tc-corner.tl{top:2cqi;left:2cqi}.tc-corner.tr{top:2cqi;right:2cqi;transform:scaleX(-1)}
.tc-corner.bl{bottom:2cqi;left:2cqi;transform:scaleY(-1)}.tc-corner.br{bottom:2cqi;right:2cqi;transform:scale(-1,-1)}
.tc-num{position:absolute;top:2.4cqi;left:50%;transform:translateX(-50%);z-index:3;
 font-family:var(--font-serif,serif);font-size:3.2cqi;color:var(--tc-gold);letter-spacing:.08em;
 padding:.3cqi 2.4cqi;border:1px solid var(--tc-hair);border-radius:20px;background:rgba(9,10,21,.7)}
.tc-window{position:relative;margin-top:4.6cqi;height:70%;overflow:hidden;border:1px solid var(--tc-line);
 border-radius:46% 46% 1.8cqi 1.8cqi / 26% 26% 1.8cqi 1.8cqi;box-shadow:inset 0 0 5cqi rgba(0,0,0,.7)}
.tc-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;
 filter:saturate(1.05) contrast(1.02);display:block}
.tc-glow{position:absolute;inset:0;
 background:radial-gradient(70% 55% at 50% 42%, transparent 42%, rgba(0,0,0,.32) 100%),
 linear-gradient(to bottom, transparent 62%, rgba(9,10,21,.5));mix-blend-mode:multiply}
.tc-tint{position:absolute;inset:0;border-radius:inherit;pointer-events:none;
 background:radial-gradient(60% 40% at 50% 30%, color-mix(in srgb, var(--tc-accent) 24%, transparent), transparent 70%);
 mix-blend-mode:screen}
.tc-cartouche{position:absolute;left:2.6cqi;right:2.6cqi;bottom:2.6cqi;z-index:3;display:flex;
 flex-direction:column;align-items:center;gap:.4cqi;padding:1.8cqi 2cqi 2cqi;
 border:1px solid var(--tc-hair);border-radius:1.8cqi;
 background:linear-gradient(rgba(9,10,21,.5), rgba(9,10,21,.82))}
.tc-suit{font-size:2.3cqi;letter-spacing:.32em;text-transform:uppercase;color:var(--tc-accent,var(--tc-gold))}
.tc-name{font-family:var(--font-serif,serif);font-size:7.2cqi;line-height:1.12;color:#fff;text-align:center;
 text-wrap:balance;text-shadow:0 1px 8px rgba(0,0,0,.6)}
.tc-back{padding:2.2cqi}
.tc-full{position:absolute;inset:2.2cqi;width:calc(100% - 4.4cqi);height:calc(100% - 4.4cqi);
 object-fit:cover;border-radius:2cqi;border:1px solid var(--tc-hair);display:block}
/* compact(작은 슬롯): 창을 키우고 이름만 크게, 스크림 강화 */
.tc-compact .tc-window{margin-top:2cqi;height:100%;border-radius:3cqi}
.tc-compact .tc-glow{background:linear-gradient(to top, rgba(0,0,0,.82) 8%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.4))}
.tc-compact .tc-cartouche{border:0;background:none;padding:0 2cqi 2.4cqi}
.tc-compact .tc-name{font-size:9.5cqi}
@media (prefers-reduced-motion:reduce){.tc *{animation:none!important}}
`;
