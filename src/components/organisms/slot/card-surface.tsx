"use client";

/**
 * [S1] CardSurface — 확정 카드 배경 (디자인 리셋 D2/D2c/D16, 2026-07-08).
 * f11 계열: 방사형 검정→투명 잘린 타원(틀어짐) + 최상단 inner glow(약) + 숨·시머·광원.
 * 시안 근거: public/_preview/void.html · board.html(초점형 원안). 타로 골드 PNG 대체
 * (D16: board.html의 이 글로우 표면은 "빈 칸 자리 표시" 용도 — 채워진 카드 앞면은 추후 생성 타로 이미지로 재대체 예정).
 *
 * - 전부 원본 CSS(자산 0). 컨테이너 쿼리(cqi)로 슬롯~히어로까지 자동 스케일.
 * - D2c 최종 확정(2026-07-08): 광원(orb)은 **전체 실행** — 초점(board.html 원안)이 아니라 filled 카드
 *   전부가 기본으로 광원을 돌리고(opacity .55), tier="hot"(조준/방금 뽑은 주인공)만 진하게(opacity 1 + 강한 iglow).
 *   위상(phase)마다 delay를 어긋내 5장이 기계적으로 동조하지 않게 한다.
 * - tier="empty"(빈 칸, D16)는 filled보다 더 어둡고 조용함(광원 미마운트) — aim=true(조준 중)면 예열 밝기로 광원도 옅게 마운트.
 * - 카드 면엔 글자 없음(2026-07-08 지시) — 순수 글로우 면. 값 라벨은 moonlight 원형대로
 *   카드 "밖" 아래에 별도 표기(slot-cell.tsx의 캡션, `.slot .label` 패턴).
 */

import { cn } from "@/lib/utils";

export interface CardSurfaceProps {
  /** empty(빈 칸)·filled(기본)·hot(조준/방금 뽑은 주인공 — 떠도는 광원+진한 테두리) */
  tier?: "empty" | "filled" | "hot";
  /** 빈 칸이 현재 조준 축일 때(D16 예열) — tier="empty"와 함께 사용 */
  aim?: boolean;
  /** 산세리프·플랫 리디자인: 과한 오브/시머를 눌러 담백하게(four-card 슬롯 전용) */
  calm?: boolean;
  /** 카드별 애니 위상 어긋내기 인덱스 (5장 동시 안 뜨게) — 축 배열 인덱스(0~4)를 그대로 넘길 것 */
  phase?: number;
  /** <style> 주입 여부 — 한 화면 여러 장이면 한 번만 true */
  injectStyle?: boolean;
  className?: string;
}

export function CardSurface({
  tier = "filled",
  aim = false,
  phase = 0,
  calm = false,
  injectStyle = true,
  className,
}: CardSurfaceProps) {
  // 카드별 애니 위상 어긋내기 (음수 delay)
  const d1 = `${-(phase * 1.9).toFixed(2)}s`;
  const d2 = `${-(phase * 2.7 + 1).toFixed(2)}s`;
  const d3 = `${-(phase * 1.3).toFixed(2)}s`;
  const dim = tier === "empty" && !aim;
  /** 광원 마운트 — D2c 전체 실행: 순수 empty(비조준)만 미마운트(GPU 절감), 나머지는 전부 마운트 */
  const orbMounted = tier !== "empty" || aim;

  return (
    <div className={cn("cs", tier === "empty" && "cs-empty", tier === "hot" && "cs-hot", aim && "cs-aim", calm && "cs-calm", className)}>
      {injectStyle ? <style>{CARD_SURFACE_CSS}</style> : null}
      <div className="cs-stage" style={{ animationDelay: d1 }}>
        <div className="cs-sh cs-sh1" style={{ animationDelay: d3 }} />
        {!dim && <div className="cs-sh cs-sh2" style={{ animationDelay: d3 }} />}
        <div className="cs-sh cs-sh3" style={{ animationDelay: d3 }} />
        {!dim && <div className="cs-sh cs-sh4" style={{ animationDelay: d3 }} />}
      </div>
      {orbMounted && (
        <div className="cs-orbwrap" style={{ animationDelay: d2 }}>
          <span className="cs-orb" />
        </div>
      )}
      <div className="cs-void" />
      <div className="cs-iglow" />
    </div>
  );
}

/* 확정 CSS (void.html A + D2c 전체 실행 + D16 empty/aim). cqi = 컨테이너 폭 1% → 슬롯~히어로 자동 스케일.
 * export: 한 화면에 여러 장 쓸 때(인트로 등) 1회만 주입하고 나머지는 injectStyle=false로. */
export const CARD_SURFACE_CSS = `
.cs{position:absolute;inset:0;container-type:inline-size;border-radius:inherit;overflow:hidden;background:#000}
.cs-stage{position:absolute;inset:0;animation:cs-breathe 10s ease-in-out infinite}
@keyframes cs-breathe{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.06);opacity:1}}
.cs-sh{position:absolute;inset:0;transition:opacity .6s ease}
.cs-sh1{background:radial-gradient(96% 46% at 26% -8%, rgba(90,240,238,.7) 0%, rgba(90,240,238,0) 50%);animation:cs-shp 6.5s ease-in-out infinite}
.cs-sh2{background:radial-gradient(92% 54% at 106% 32%, rgba(78,130,255,.76) 0%, rgba(78,130,255,0) 54%);animation:cs-shp 8s ease-in-out 1.1s infinite}
.cs-sh3{background:radial-gradient(134% 36% at 50% 113%, rgba(150,180,255,.6) 0%, rgba(150,180,255,0) 58%);animation:cs-shp 7.2s ease-in-out .6s infinite}
.cs-sh4{background:radial-gradient(94% 50% at -6% 60%, rgba(66,150,250,.64) 0%, rgba(66,150,250,0) 52%);animation:cs-shp 7.8s ease-in-out .3s infinite}
@keyframes cs-shp{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
/* 떠도는 광원 — 회전 래퍼로 반응형 궤도. D2c 전체 실행: filled 기본 .55, hot만 1(진하게) */
.cs-orbwrap{position:absolute;inset:0;z-index:2;opacity:.55;transition:opacity .6s ease;animation:cs-spin 11s linear infinite}
.cs-orb{position:absolute;left:50%;top:5%;width:64cqi;height:64cqi;transform:translateX(-50%);border-radius:50%;
  mix-blend-mode:screen;filter:blur(clamp(4px,6cqi,10px));
  background:radial-gradient(closest-side, rgba(210,248,255,.95) 0%, rgba(100,180,252,.48) 40%, rgba(60,120,240,0) 70%)}
@keyframes cs-spin{to{transform:rotate(360deg)}}
/* 검정 중앙 = 방사형 검정→투명 잘린 타원(틀어짐) */
.cs-void{position:absolute;z-index:3;pointer-events:none;width:142%;height:128%;left:50%;top:52%;
  transform:translate(-50%,-50%) rotate(-8deg);border-radius:50%;
  background:radial-gradient(closest-side, #000 40%, rgba(0,0,0,.78) 64%, rgba(0,0,0,0) 100%)}
/* inner glow(약) — 최상단 · hot이면 진하게 */
.cs-iglow{position:absolute;inset:0;z-index:6;pointer-events:none;border-radius:inherit;transition:box-shadow .6s ease;
  box-shadow:inset 0 0 13cqi rgba(120,180,255,.28), inset 0 0 4.5cqi rgba(165,208,255,.2)}
.cs-hot .cs-orbwrap{opacity:1}
.cs-hot .cs-iglow{box-shadow:inset 0 0 15cqi rgba(120,180,255,.5), inset 0 0 5cqi rgba(165,208,255,.34)}

/* D16 — 빈 칸: filled보다 어둡고 조용함. cs-stage는 cs-breathe가 opacity를 상시 점유하므로
   경쟁 없는 filter(전역 감쇠)로 낮춘다. aim(조준 중)이면 예열 밝기로. */
.cs-empty .cs-void{background:radial-gradient(closest-side, #000 48%, rgba(0,0,0,.88) 68%, rgba(0,0,0,0) 100%)}
.cs-empty .cs-stage{filter:opacity(.44)}
.cs-empty.cs-aim .cs-stage{filter:opacity(.69)}
.cs-empty .cs-iglow{box-shadow:inset 0 0 8cqi rgba(120,180,255,.12), inset 0 0 3cqi rgba(165,208,255,.08)}
.cs-empty.cs-aim .cs-iglow{box-shadow:inset 0 0 11cqi rgba(120,180,255,.22), inset 0 0 3.5cqi rgba(165,208,255,.16)}
.cs-empty.cs-aim .cs-orbwrap{opacity:.3}

/* calm — 산세리프·플랫 리디자인: 오브를 눌러 끄고 시머를 감쇠(레퍼런스 ✦ 수준 절제) */
.cs-calm .cs-orbwrap{opacity:.16}
.cs-calm.cs-hot .cs-orbwrap{opacity:.28}
.cs-calm .cs-stage{filter:opacity(.5)}
.cs-calm.cs-empty .cs-stage{filter:opacity(.32)}
.cs-calm .cs-iglow{box-shadow:inset 0 0 8cqi rgba(120,180,255,.16),inset 0 0 3cqi rgba(165,208,255,.1)}
@media (prefers-reduced-motion:reduce){.cs-stage,.cs-sh,.cs-orbwrap{animation:none!important}}
`;
