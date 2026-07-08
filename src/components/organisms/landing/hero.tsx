"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";

/**
 * 히어로 — toss.im/simplicity 라이브 실측 1:1 재현 (2026-07-07 CDP 프레임+DOM 덤프,
 * scratchpad/toss-live/*). 비디오 자산 대신 CSS 그라디언트/글리치로 등가 구현.
 *
 * [데스크톱 1440×900 실측]
 * - 인트로: 검정 위 작은 워드들이 가로로 자간 넓게 순차 등장(~2s), 블루 글리치 고스트
 *   → 워드마크로 수렴(색수차) → 풀블리드 글로우(파란 테두리+검정 심부)가 화면을 덮고
 *   → 센터 카드 자리로 수축(settle) → 사이드 카드·pill 페이드인.
 * - idle: 카드 열 1행. 센터 344×575(글로우 카드), 사이드 344×542(흑색 코어+블루 림),
 *   센터 간격 348px(gap 6px), 카드 bottom 정렬(y≈721), 센터 중심 y=433/900.
 *   pill: bottom 48px, h40, bg #1f1f21, "펼쳐보기"+카드팬 아이콘, 우측 리스트 아이콘.
 *
 * [모바일 390×844 실측]
 * - 인트로: 워드가 세로로 크게 쌓임(+블루 모션블러 고스트) → 수렴 → 풀블리드 글로우
 *   → 3×3 그리드의 센터 셀로 수축.
 * - idle: 3열 그리드. 셀 309.6×487.6(=79.4vw, 비율 0.635), gap 4px, 센터 셀이
 *   타이틀 카드(워드마크+서브타이틀), 주변 셀은 흑색+블루 림. 하단 중앙에 그리드
 *   아이콘 버튼(48×48 라운드)+리스트 아이콘, 우상단 ☰.
 *
 * 모션: pill/그리드 버튼 탭 → 센터 카드 한 바퀴 플립+확대(hero-launch) 후 /slot.
 * 인트로는 세션 1회·아무 입력이든 스킵·reduced-motion 시 생략.
 */

type Phase = "words" | "mark" | "flood" | "settle" | "idle";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const LAUNCH_MS = 950;

/* ── 실측 상수 ─────────────────────────────────────────────── */
const DESK = { cw: 344, chC: 575, chS: 542, step: 348, pillBottom: 48 };
/** 모바일 셀: 309.6/390 = 79.4vw, 세로 = 가로×1.575 */
const MOB = { cw: "79.4vw", ratio: 1.575, gapPx: 4 };

/* ── 실측 그라디언트 (f10/f11/f13 + mob-f08) ────────────────────
   센터 글로우 카드: 좌상 시안 광원 → 상단 블루 필드 → 심부 블랙 보이드,
   좌우 엣지 블루 번짐, 바닥 백광. */
const GLOW_CARD: CSSProperties = {
  background: [
    "radial-gradient(105% 55% at 14% -4%, #b9ecec 0%, #6db4f5 20%, rgba(66,84,232,0) 52%)",
    "radial-gradient(130% 70% at 82% 4%, rgba(93,96,247,0.9) 0%, rgba(66,74,228,0) 55%)",
    "radial-gradient(120% 60% at 50% 8%, #3646d8 0%, rgba(28,38,150,0) 68%)",
    "radial-gradient(60% 46% at 0% 58%, rgba(46,63,224,0.5) 0%, rgba(46,63,224,0) 70%)",
    "radial-gradient(60% 46% at 100% 58%, rgba(46,63,224,0.45) 0%, rgba(46,63,224,0) 70%)",
    "radial-gradient(90% 14% at 50% 104%, rgba(238,242,252,0.55) 0%, rgba(238,242,252,0) 78%)",
    "linear-gradient(180deg, #2733be 0%, #17206e 32%, #060a1d 58%, #000 88%)",
  ].join(", "),
};

/** 사이드/그리드 카드 — 흑색 코어 + 블루 림 (card-sub 글로우 비디오의 정지 인상) */
const RIM_CARD: CSSProperties = {
  background:
    "radial-gradient(120% 90% at 50% 50%, #000 55%, rgba(38,64,214,0.20) 86%, rgba(56,92,255,0.34) 100%)",
  border: "1px solid rgba(80,110,255,0.16)",
  boxShadow: "0 0 26px rgba(40,80,255,0.30), 0 0 64px rgba(30,60,220,0.16)",
};

/* ── 아이콘 (레퍼런스 pill/컨트롤 글리프) ───────────────────── */
function FanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="6" y="2.2" width="7" height="10" rx="1.4" stroke="white" strokeWidth="1.2" transform="rotate(14 9.5 7.2)" />
      <rect x="4.5" y="2.6" width="7" height="10" rx="1.4" stroke="white" strokeWidth="1.2" fill="#1f1f21" />
      <rect x="1.6" y="3.4" width="7" height="10" rx="1.4" stroke="white" strokeWidth="1.2" fill="#1f1f21" transform="rotate(-14 5.1 8.4)" />
    </svg>
  );
}
function ListIcon({ dim = true }: { dim?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="3" cy="4.5" r="1" fill={dim ? "#8e8e93" : "#fff"} />
      <circle cx="3" cy="9" r="1" fill={dim ? "#8e8e93" : "#fff"} />
      <circle cx="3" cy="13.5" r="1" fill={dim ? "#8e8e93" : "#fff"} />
      <path d="M6.5 4.5h9M6.5 9h9M6.5 13.5h9" stroke={dim ? "#8e8e93" : "#fff"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="6" height="6" rx="1.4" stroke="#fff" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.4" stroke="#fff" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" stroke="#fff" strokeWidth="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.4" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path d="M6 10h18M6 15.5h18M6 21h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 인트로 워드 — 블루 비디오 글리치를 고스트 복제(blur+translate) 플리커로 등가 재현 */
function GlitchWord({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="hg-word" style={{ animationDelay: `${delay}ms` }}>
      <span aria-hidden className="hg-ghost hg-ghost-up">{text}</span>
      <span aria-hidden className="hg-ghost hg-ghost-dn">{text}</span>
      {text}
    </span>
  );
}

export function Hero() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null); // null = 판정 전(순흑)
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [launching, setLaunching] = useState(false);
  const floodScale = useRef({ x: 4, y: 1.8 });

  /* 인트로 타임라인 (라이브 실측 타이밍: words~3.4s → mark → flood → settle~6.4s) */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    setIsMobile(mq.matches);
    const onMq = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onMq);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("introSeen");
    } catch {
      /* 스토리지 차단 시 인트로 1회 재생 */
    }
    if (reduced || seen) {
      setPhase("idle");
      return () => mq.removeEventListener("change", onMq);
    }

    // 풀블리드 스케일: 카드 슬롯 → 뷰포트를 덮는 비율 (여유 1.06)
    const cw = mq.matches ? innerWidth * 0.794 : DESK.cw;
    const ch = mq.matches ? cw * MOB.ratio : DESK.chC;
    floodScale.current = { x: (innerWidth / cw) * 1.06, y: (innerHeight / ch) * 1.06 };

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem("introSeen", "1");
      } catch {
        /* noop */
      }
    };
    const timers = [
      setTimeout(() => setPhase("words"), 60),
      setTimeout(() => setPhase("mark"), 3400),
      setTimeout(() => setPhase("flood"), 3950),
      setTimeout(() => setPhase("settle"), 4350),
      setTimeout(() => {
        setPhase("idle");
        finish();
      }, 6400),
    ];
    const skip = () => {
      timers.forEach(clearTimeout);
      finish();
      setPhase("idle");
      track("intro_skip");
    };
    const evts = ["pointerdown", "wheel", "keydown"] as const;
    evts.forEach((e) => window.addEventListener(e, skip));
    return () => {
      timers.forEach(clearTimeout);
      evts.forEach((e) => window.removeEventListener(e, skip));
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const launch = () => {
    if (launching) return;
    track("landing_cta_click", { position: "hero" });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/slot");
      return;
    }
    setLaunching(true);
    setTimeout(() => router.push("/slot"), LAUNCH_MS);
  };

  const p = phase ?? "words";
  const intro = p !== "idle";
  const showWords = p === "words";
  const showMarkSmall = p === "mark" || p === "flood";
  const flooded = p === "flood";
  const settled = p === "settle" || p === "idle";
  const chrome = p === "idle" || p === "settle"; // 사이드·컨트롤은 settle 중반부터 (CSS delay)

  /* 센터 글로우 카드의 transform: flood(풀블리드) → settle(1,1) */
  const centerTransform = flooded
    ? `scale(${floodScale.current.x}, ${floodScale.current.y})`
    : "scale(1, 1)";
  const centerVisible = flooded || settled;

  return (
    <section
      className="relative flex h-dvh w-full flex-col items-center overflow-hidden bg-black"
      style={{ "--cw": isMobile ? MOB.cw : `${DESK.cw}px` } as CSSProperties}
    >
      <style>{HERO_CSS}</style>

      {/* ── 인트로 A: 워드 등장 (데스크톱 가로 나열 · 모바일 세로 스택) ── */}
      {(showWords || showMarkSmall) && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-50 flex items-center justify-center",
            isMobile ? "flex-col gap-[18vh]" : "flex-row gap-[5.2vw]",
            showMarkSmall && "hg-collapse",
          )}
        >
          {showWords && (
            <>
              <GlitchWord text="오늘" delay={1700} />
              <GlitchWord text="해볼까" delay={2500} />
            </>
          )}
          {showMarkSmall && (
            <span className="hg-mark">
              <span aria-hidden className="hg-ab hg-ab-b">오늘 해볼까</span>
              <span aria-hidden className="hg-ab hg-ab-w">오늘 해볼까</span>
              오늘 해볼까
            </span>
          )}
        </div>
      )}

      {/* ── 카드 스테이지 ─────────────────────────────────────── */}
      {isMobile === null ? null : isMobile ? (
        /* 모바일: 3×3 그리드 — 셀 79.4vw×(×1.575), gap 4px, 센터 셀 = 타이틀 카드 */
        <div className="relative flex h-full w-full items-center justify-center">
          {[-1, 0, 1].flatMap((row) =>
            [-1, 0, 1].map((col) => {
              const isCenter = row === 0 && col === 0;
              const common: CSSProperties = {
                width: "var(--cw)",
                aspectRatio: `1 / ${MOB.ratio}`,
                transform: `translate(calc(${col} * (var(--cw) + ${MOB.gapPx}px)), calc(${row} * (var(--cw) * ${MOB.ratio} + ${MOB.gapPx}px)))`,
              };
              return isCenter ? (
                <div
                  key="c"
                  className={cn("absolute z-30 rounded-[20px]", launching && "hero-launch")}
                  style={{
                    ...common,
                    ...GLOW_CARD,
                    transformStyle: "preserve-3d",
                    transition: `transform 2s ${EASE_OUT}, opacity .5s ease`,
                    transform: launching ? undefined : `${common.transform} ${centerTransform}`,
                    opacity: intro && !centerVisible ? 0 : 1,
                  }}
                >
                  <div
                    className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center transition-opacity duration-700"
                    style={{ opacity: settled ? 1 : 0 }}
                  >
                    <h1 className="font-sans text-[40px] font-bold tracking-[-0.02em] text-white">오늘 해볼까</h1>
                    <p className="text-[17px] font-semibold text-[#9aa3c7]">좋아하는 것 하나로, 오늘 만들 한 개</p>
                  </div>
                </div>
              ) : (
                <div
                  key={`${row}${col}`}
                  aria-hidden
                  className="absolute z-10 rounded-[20px] transition-opacity duration-700"
                  style={{
                    ...common,
                    ...RIM_CARD,
                    opacity: launching ? 0 : chrome ? 1 : 0,
                    transitionDelay: chrome && !launching ? "600ms" : "0ms",
                  }}
                />
              );
            }),
          )}

          {/* 우상단 ☰ (실측 30×30 · right 22 · top 26) */}
          <Link
            href="/start"
            aria-label="안내 보기"
            className="absolute right-[22px] top-[26px] z-40 transition-opacity duration-500"
            style={{ opacity: chrome && !launching ? 1 : 0, transitionDelay: "800ms" }}
          >
            <MenuIcon />
          </Link>

          {/* 하단 컨트롤: 그리드 버튼(48×48 라운드) + 리스트 아이콘 */}
          <div
            className="absolute bottom-[34px] z-40 flex items-center gap-5 transition-opacity duration-500"
            style={{ opacity: chrome && !launching ? 1 : 0, transitionDelay: "800ms" }}
          >
            <button
              type="button"
              onClick={launch}
              disabled={launching}
              aria-label="펼쳐보기"
              className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#1f1f21] transition-colors hover:bg-[#2a2a2d]"
            >
              <GridIcon />
            </button>
            <Link href="/start" aria-label="안내 보기" className="p-1">
              <ListIcon />
            </Link>
          </div>
        </div>
      ) : (
        /* 데스크톱: 1행 캐러셀 — 센터 344×575 + 사이드 344×542(바닥 정렬), 간격 348px */
        <div className="relative flex h-full w-full items-center justify-center" style={{ paddingBottom: "3.8vh" }}>
          {/* 스테이지 = 센터 카드 박스 (575px). 사이드는 바닥 정렬 */}
          <div className="relative" style={{ width: DESK.cw, height: DESK.chC }}>
            {[-2, -1, 1, 2].map((dx) => (
              <div
                key={dx}
                aria-hidden
                className="absolute bottom-0 rounded-[20px] transition-opacity duration-700"
                style={{
                  width: DESK.cw,
                  height: DESK.chS,
                  left: "50%",
                  transform: `translateX(calc(-50% + ${dx * DESK.step}px))`,
                  zIndex: 10,
                  ...RIM_CARD,
                  opacity: launching ? 0 : chrome ? 1 : 0,
                  transitionDelay: chrome && !launching ? "600ms" : "0ms",
                }}
              />
            ))}

            {/* 센터 글로우 카드 — 풀블리드에서 이 슬롯으로 수축 */}
            <div
              className={cn("absolute inset-0 z-30 rounded-[20px]", launching && "hero-launch")}
              style={{
                ...GLOW_CARD,
                transformStyle: "preserve-3d",
                boxShadow: "0 0 70px rgba(72, 106, 255, 0.25)",
                transition: `transform 2s ${EASE_OUT}, opacity .5s ease`,
                transform: launching ? undefined : centerTransform,
                opacity: intro && !centerVisible ? 0 : 1,
              }}
            >
              <div
                className="flex h-full items-center justify-center transition-opacity duration-700"
                style={{ opacity: settled ? 1 : 0 }}
              >
                <h1 className="font-sans text-[44px] font-bold tracking-[-0.02em] text-white">오늘 해볼까</h1>
              </div>
            </div>
          </div>

          {/* 하단 pill (실측: bottom 48 · h40 · #1f1f21) + 리스트 아이콘 */}
          <div
            className="absolute z-40 flex items-center gap-4 transition-opacity duration-500"
            style={{ bottom: DESK.pillBottom, opacity: chrome && !launching ? 1 : 0, transitionDelay: "800ms" }}
          >
            <button
              type="button"
              onClick={launch}
              disabled={launching}
              aria-busy={launching}
              className="flex h-10 items-center gap-2 rounded-full bg-[#1f1f21] px-[18px] text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2d] disabled:pointer-events-none"
            >
              <FanIcon />
              펼쳐보기
            </button>
            <Link href="/start" aria-label="안내 보기" className="p-1 opacity-80 transition-opacity hover:opacity-100">
              <ListIcon />
            </Link>
          </div>
        </div>
      )}

      {/* 전환 오버레이 — 플립 확대가 화면을 덮는 타이밍에 앱 배경으로 이어붙임 */}
      {launching && (
        <div aria-hidden className="fixed inset-0 z-40 bg-bg" style={{ animation: "bloom 500ms ease 400ms both" }} />
      )}
    </section>
  );
}

/* 인트로 워드 글리치·워드마크 색수차 — 전부 opacity/transform/filter (합성 전용) */
const HERO_CSS = `
.hg-word{position:relative;font-weight:700;color:#fff;letter-spacing:.42em;
  font-size:14px;animation:hg-in .7s ${EASE_OUT} both}
@media (max-width:760px){.hg-word{font-size:40px;letter-spacing:.06em}}
.hg-ghost{position:absolute;inset:0;color:#3b6cff;filter:blur(4px);pointer-events:none}
.hg-ghost-up{transform:translateY(-58%);animation:hg-flicker .34s steps(2) infinite}
.hg-ghost-dn{transform:translateY(58%);animation:hg-flicker .41s steps(2) infinite reverse}
.hg-mark{position:relative;font-weight:700;color:#fff;letter-spacing:-0.02em;font-size:26px;
  animation:hg-in .45s ${EASE_OUT} both}
@media (max-width:760px){.hg-mark{font-size:34px}}
.hg-ab{position:absolute;inset:0;pointer-events:none}
.hg-ab-b{color:#4a7dff;transform:translate(-2px,-1px);opacity:.8;filter:blur(1px)}
.hg-ab-w{color:#fff;transform:translate(2px,1px);opacity:.35;filter:blur(1px)}
.hg-collapse{animation:hg-collapse .5s ${EASE_OUT} both}
@keyframes hg-in{from{opacity:0}to{opacity:1}}
@keyframes hg-flicker{0%{opacity:.85}50%{opacity:.2}100%{opacity:.7}}
@keyframes hg-collapse{from{letter-spacing:.42em}to{letter-spacing:0}}
@media (prefers-reduced-motion:reduce){.hg-word,.hg-mark,.hg-ghost-up,.hg-ghost-dn,.hg-collapse{animation:none}}
`;
