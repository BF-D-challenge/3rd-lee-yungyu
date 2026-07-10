"use client";

/**
 * [아이디어 flip 카드] — 확정 디자인 (타로 비율 300:485 + 공유 게이트).
 * 앞면 = 설명 + 고통 타임라인 → 주요액션 "뒷면 보기".
 * 뒷면 = 해결 + 근거 → 주요액션 "공유"(공유해야 만들 프롬프트가 열림 = K 루프 강제).
 * 하단 액션은 앞·뒤 같은 위치 고정. 데이터: combo(v7 필드) + frontStory(persona·timeline).
 */

import { useState } from "react";
import type { Combo } from "@/lib/draw";
import type { FrontStory } from "@/lib/combos";
import { buildPrompt } from "@/lib/brief";
import { BACK_DOTS, BACK_RAYS } from "./card-back";

export interface IdeaFlipCardProps {
  combo: Combo;
  story: FrontStory | null;
  /** 씨앗 라벨 (art 표시) */
  seedLabel: string;
  /** 브랜드 이름 (제목의 appName 부분) */
  appName: string | null;
  /** 결과 한 문장 — appName/title 부재 시 제목 폴백 */
  line?: string | null;
  /** 공유 = 링크 복사 → 성공 시 true (게이트 해제) */
  onShare: () => Promise<boolean>;
  /** 만들 프롬프트 복사 → 성공 시 true */
  onCopyPrompt: () => Promise<boolean>;
  /** 정식 발행(투표 현황)으로 이동 */
  onVote: () => void;
  /** 시각 검증용 초기 상태 (기본 false) */
  initialFlipped?: boolean;
  initialShared?: boolean;
  shape?: "portrait" | "square";
  className?: string;
}

const painFallback = (c: Combo): FrontStory => ({
  persona: c.target,
  timeline: [
    { t: "평소", act: `${c.seed.label} — 매일 겪는 일`, emo: "그냥 참고 지냄", pain: false },
    { t: "그 순간", act: c.pain.label.slice(0, 24), emo: "또 막힘", pain: true },
    { t: "직전", act: "그냥 포기할까 싶음", emo: "다 헛수고 같음", pain: true },
  ],
});

export function IdeaFlipCard({
  combo,
  story,
  seedLabel,
  appName,
  line = null,
  onShare,
  onCopyPrompt,
  onVote,
  initialFlipped = false,
  initialShared = false,
  shape = "portrait",
  className,
}: IdeaFlipCardProps) {
  const [flipped, setFlipped] = useState(initialFlipped);
  const [shared, setShared] = useState(initialShared);
  const [promptCopied, setPromptCopied] = useState(false);

  const s = story ?? painFallback(combo);
  const title = appName ?? combo.title ?? line ?? seedLabel;
  const subtitle = appName && combo.title?.includes(" — ") ? combo.title.split(" — ")[1] : (combo.title ?? line ?? title);
  const mvpItems = combo.mvp ?? [];
  const prompt = buildPrompt(combo);
  /** 매출 근거가 있는 사전검수 콤보 — 확정 카드도 골드 톤으로 이어간다 */
  const golden = combo.golden;

  const doShare = async () => {
    if (await onShare()) setShared(true);
  };
  const doCopy = async () => {
    if (await onCopyPrompt()) {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };

  const faceBase = golden
    ? "absolute inset-0 flex flex-col overflow-hidden rounded-[20px] border border-[#e0b660]/90 bg-[#0d0d0f] text-[#eaeaea] shadow-[inset_0_1px_0_rgba(224,182,96,.1),0_18px_44px_rgba(0,0,0,.45)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
    : "absolute inset-0 flex flex-col overflow-hidden rounded-[20px] border border-[#eaeaea]/90 bg-[#0d0d0f] text-[#eaeaea] shadow-[inset_0_1px_0_rgba(234,234,234,.08),0_18px_44px_rgba(0,0,0,.45)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";
  const ctaBase = golden
    ? "border-[#e0b660]/90 bg-[#e0b660] shadow-[0_3px_0_0_rgba(224,182,96,.3)] hover:bg-[#e8c377]"
    : "border-[#eaeaea]/85 bg-[#eaeaea] shadow-[0_3px_0_0_rgba(234,234,234,.24)] hover:bg-[#f7f7f7]";

  const renderFrame = () => (
    <>
      <div
        className={`pointer-events-none absolute inset-[13px] rounded-[11px] border ${golden ? "border-[#e0b660]/30" : "border-[#eaeaea]/25"}`}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 300 485"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2"
      >
        <g fill={golden ? "rgba(224,182,96,.3)" : "rgba(234,234,234,.22)"} dangerouslySetInnerHTML={{ __html: BACK_DOTS }} />
        <g
          stroke={golden ? "rgba(224,182,96,.09)" : "rgba(234,234,234,.055)"}
          strokeWidth="1.7"
          strokeLinecap="round"
          dangerouslySetInnerHTML={{ __html: BACK_RAYS }}
        />
      </svg>
    </>
  );

  return (
    <div
      className={className ?? "mx-auto w-full max-w-[372px] [perspective:1600px]"}
    >
      <div
        className="relative w-full [transform-style:preserve-3d]"
        style={{
          aspectRatio: shape === "square" ? "1 / 1" : "300 / 485",
          transition: "transform .7s cubic-bezier(.65,0,.35,1)",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* ── FRONT : 설명 + 고통 타임라인 ── */}
        <div className={faceBase}>
          {renderFrame()}
          <div className="relative z-10 flex shrink-0 items-start justify-between border-b border-[#eaeaea]/10 px-4 py-3">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${golden ? "border-[#e0b660]/40 bg-[#e0b660]/[.08] text-[#e0b660]" : "border-[#eaeaea]/30 bg-[#eaeaea]/[.06] text-[#eaeaea]/85"}`}
            >
              🌱 내가 고른 · {seedLabel}
            </span>
            <span className={`font-serif text-2xl font-bold ${golden ? "text-[#e0b660]/80" : "text-[#eaeaea]/60"}`}>
              {golden ? "🌟" : "✦"}
            </span>
          </div>
          <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-3.5">
            <h2 className="font-serif text-lg font-bold leading-tight text-[#eaeaea]">{title}</h2>
            <p className="mt-1 text-xs text-[#eaeaea]/60">{s.persona}</p>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-[#eaeaea]/70">😣 이런 고통을 겪어요</p>
            <ol className="mt-2">
              {s.timeline.map((st, i) => (
                <li key={i} className="grid grid-cols-[52px_1fr] gap-2.5">
                  <span className="pt-2 text-right text-[11px] font-bold text-[#eaeaea]/40">{st.t}</span>
                  <span className={`relative border-l-2 py-1.5 pl-4 ${i === s.timeline.length - 1 ? "border-transparent" : "border-[#eaeaea]/10"}`}>
                    <span
                      className="absolute -left-[6px] top-2.5 h-2.5 w-2.5 rounded-full border-[3px] border-[#0d0d0f]"
                      style={{ background: st.pain ? "rgba(234,234,234,.9)" : "rgba(234,234,234,.35)" }}
                    />
                    <span className="block text-[13px] font-semibold text-[#eaeaea]/90">{st.act}</span>
                    <span className={`block text-[11.5px] ${st.pain ? "text-[#eaeaea]/70" : "text-[#eaeaea]/40"}`}>{st.emo}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative z-10 shrink-0 px-4 pb-4">
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-[12px] border px-4 py-3.5 text-sm font-extrabold text-[#0d0d0f] transition ${ctaBase}`}
            >
              이 사람, 어떻게 붙잡죠? · 뒷면에서 해결 보기 →
            </button>
          </div>
        </div>

        {/* ── BACK : 해결 + 근거 + 공유 게이트 ── */}
        <div className={faceBase} style={{ transform: "rotateY(180deg)" }}>
          {renderFrame()}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-4">
            <button type="button" onClick={() => setFlipped(false)} className="pb-2 text-xs font-semibold text-[#eaeaea]/60 transition hover:text-[#eaeaea]">
              ← 앞면(고통) 다시 보기
            </button>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#eaeaea]/70">💡 이렇게 풀어요</p>
            <p className="mt-1.5 text-[14px] font-bold leading-snug text-[#eaeaea]">{subtitle}</p>
            {combo.oneliner && <p className="mt-1 text-xs leading-snug text-[#eaeaea]/60">{combo.oneliner}</p>}
            {combo.todayAction && (
              <p className="mt-2.5 rounded-md border border-[#eaeaea]/15 bg-[#eaeaea]/[.05] px-2.5 py-2 text-[11px] leading-snug text-[#eaeaea]/80">
                <span className="font-extrabold text-[#eaeaea]">🟣 오늘 만들 것</span> {combo.todayAction}
              </p>
            )}
            {mvpItems.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {mvpItems.map((m, index) => {
                  const nextStep = index === mvpItems.length - 1 && mvpItems.length >= 4;
                  return (
                    <span
                      key={`${m}-${index}`}
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        nextStep
                          ? "border-dashed border-[#eaeaea]/20 bg-transparent text-[#eaeaea]/60"
                          : "border-[#eaeaea]/10 bg-[#eaeaea]/[.07] text-[#eaeaea]/85"
                      }`}
                    >
                      {nextStep && <span className="mr-1 text-[9px] font-extrabold uppercase text-[#eaeaea]/40">다음</span>}
                      {m}
                    </span>
                  );
                })}
              </div>
            )}
            {combo.evidence && (
              <p className="mt-3 text-[11px] italic leading-snug text-[#eaeaea]/45">📈 {combo.evidence}</p>
            )}

            {!shared ? (
              <div className="mt-3.5 rounded-[14px] border border-dashed border-[#eaeaea]/25 bg-[#eaeaea]/[.04] p-3.5 text-center">
                <p className="text-sm font-bold text-[#eaeaea]/75">🔒 오늘 만들기 프롬프트</p>
                <p className="mt-1 text-[11px] leading-snug text-[#eaeaea]/45">공유하면 열려요 — 지인 반응도 받고, 붙여넣어 만들 준비물도</p>
              </div>
            ) : (
              <div className="mt-3.5 rounded-[14px] border border-[#eaeaea]/45 bg-[#eaeaea]/[.06] p-3">
                <p className="text-[11px] font-extrabold text-[#eaeaea]/85">🔓 만들기 프롬프트 (열림)</p>
                <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md border border-[#eaeaea]/10 bg-black/35 p-2.5 text-[10.5px] leading-snug text-[#eaeaea]/85">
                  {prompt}
                </pre>
                <button
                  type="button"
                  onClick={doCopy}
                  className={`mt-2 w-full rounded-md border py-2 text-[13px] font-bold text-[#0d0d0f] transition ${ctaBase}`}
                >
                  {promptCopied ? "복사됐어요 ✓" : "🛠 프롬프트 복사해서 오늘 만들기"}
                </button>
              </div>
            )}
          </div>
          <div className="relative z-10 shrink-0 px-4 pb-4">
            {!shared ? (
              <>
                <p className="mb-2 text-center text-[11px] leading-snug text-[#eaeaea]/50">
                  공유하면 지인이 🔥🙌👀 중 하나로 답해요
                </p>
                <button
                  type="button"
                  onClick={doShare}
                  className={`flex w-full flex-col items-center justify-center rounded-[12px] border px-4 py-3 text-sm font-extrabold text-[#0d0d0f] transition ${ctaBase}`}
                >
                  <span>📮 공유해서 물어보기</span>
                  <span className="text-[11px] font-normal opacity-70">친구가 3초 투표 · 공유하면 프롬프트가 열려요</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onVote}
                className="w-full rounded-[12px] border border-[#eaeaea]/20 py-2.5 text-sm font-semibold text-[#eaeaea]/60 transition hover:border-[#eaeaea]/35 hover:text-[#eaeaea]"
              >
                🗳 정식 발행하고 투표 현황 보기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
