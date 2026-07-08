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

export interface IdeaFlipCardProps {
  combo: Combo;
  story: FrontStory | null;
  /** 씨앗 라벨 (art 표시) */
  seedLabel: string;
  /** 브랜드 이름 (제목의 appName 부분) */
  appName: string | null;
  /** 공유 = 링크 복사 → 성공 시 true (게이트 해제) */
  onShare: () => Promise<boolean>;
  /** 만들 프롬프트 복사 → 성공 시 true */
  onCopyPrompt: () => Promise<boolean>;
  /** 정식 발행(투표 현황)으로 이동 */
  onVote: () => void;
  /** 시각 검증용 초기 상태 (기본 false) */
  initialFlipped?: boolean;
  initialShared?: boolean;
}

const painFallback = (c: Combo): FrontStory => ({
  persona: c.target,
  timeline: [
    { t: "평소", act: `${c.seed.label} — 매일 겪는 일`, emo: "그냥 참고 지냄", pain: false },
    { t: "그 순간", act: c.pain.label.slice(0, 24), emo: "또 막힘", pain: true },
    { t: "직전", act: "그냥 포기할까 싶음", emo: "다 헛수고 같음", pain: true },
  ],
});

export function IdeaFlipCard({ combo, story, seedLabel, appName, onShare, onCopyPrompt, onVote, initialFlipped = false, initialShared = false }: IdeaFlipCardProps) {
  const [flipped, setFlipped] = useState(initialFlipped);
  const [shared, setShared] = useState(initialShared);
  const [promptCopied, setPromptCopied] = useState(false);

  const s = story ?? painFallback(combo);
  const subtitle = appName && combo.title?.includes(" — ") ? combo.title.split(" — ")[1] : combo.title;
  const prompt = buildPrompt(combo);

  const doShare = async () => {
    if (await onShare()) setShared(true);
  };
  const doCopy = async () => {
    if (await onCopyPrompt()) {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };

  const faceBase =
    "absolute inset-0 flex flex-col overflow-hidden rounded-card border border-glow/40 bg-card shadow-hard [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    <div className="mx-auto w-full max-w-[372px] [perspective:1600px]">
      <div
        className="relative w-full [transform-style:preserve-3d]"
        style={{
          aspectRatio: "300 / 485",
          transition: "transform .7s cubic-bezier(.65,0,.35,1)",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* ── FRONT : 설명 + 고통 타임라인 ── */}
        <div className={faceBase}>
          <div className="flex shrink-0 items-start justify-between bg-gradient-to-br from-glow/30 to-glow/60 px-4 py-3">
            <span className="rounded-pill bg-white/20 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur">
              🌱 내가 고른 · {seedLabel}
            </span>
            <span className="font-serif text-2xl font-bold text-ink/70">✦</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-3.5">
            <h2 className="font-serif text-lg font-bold leading-tight text-ink">{appName ?? combo.title}</h2>
            <p className="mt-1 text-xs text-mist">{s.persona}</p>
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-wider text-rose">😣 이런 고통을 겪어요</p>
            <ol className="mt-2">
              {s.timeline.map((st, i) => (
                <li key={i} className="grid grid-cols-[52px_1fr] gap-2.5">
                  <span className="pt-2 text-right text-[11px] font-bold text-caption">{st.t}</span>
                  <span className={`relative border-l-2 py-1.5 pl-4 ${i === s.timeline.length - 1 ? "border-transparent" : "border-white/10"}`}>
                    <span
                      className="absolute -left-[6px] top-2.5 h-2.5 w-2.5 rounded-full border-[3px] border-card"
                      style={{ background: st.pain ? "var(--rose,#b34c5c)" : "var(--caption,#9a91a6)" }}
                    />
                    <span className="block text-[13px] font-semibold text-ink">{st.act}</span>
                    <span className={`block text-[11.5px] ${st.pain ? "text-rose" : "text-caption"}`}>{st.emo}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="shrink-0 px-4 pb-4">
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="flex w-full items-center justify-center gap-2 rounded-card bg-glow px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_3px_0_0_rgba(0,0,0,.2)] transition hover:brightness-105"
            >
              이 사람, 어떻게 붙잡죠? · 뒷면에서 해결 보기 →
            </button>
          </div>
        </div>

        {/* ── BACK : 해결 + 근거 + 공유 게이트 ── */}
        <div className={faceBase} style={{ transform: "rotateY(180deg)" }}>
          <div className="flex-1 overflow-y-auto px-4 pt-4">
            <button type="button" onClick={() => setFlipped(false)} className="pb-2 text-xs font-semibold text-mist hover:text-glow">
              ← 앞면(고통) 다시 보기
            </button>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-good">💡 이렇게 풀어요</p>
            <p className="mt-1.5 text-[14px] font-bold leading-snug text-ink">{subtitle}</p>
            {combo.oneliner && <p className="mt-1 text-xs leading-snug text-mist">{combo.oneliner}</p>}
            {combo.mvp && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {combo.mvp.slice(0, 3).map((m) => (
                  <span key={m} className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-ink">
                    {m}
                  </span>
                ))}
              </div>
            )}
            {combo.evidence && (
              <p className="mt-3 text-[11px] italic leading-snug text-caption">📈 {combo.evidence}</p>
            )}

            {!shared ? (
              <div className="mt-3.5 rounded-card border border-dashed border-white/20 bg-white/5 p-3.5 text-center">
                <p className="text-sm font-bold text-mist">🔒 오늘 만들기 프롬프트</p>
                <p className="mt-1 text-[11px] leading-snug text-caption">공유하면 열려요 — 지인 반응도 받고, 붙여넣어 만들 준비물도</p>
              </div>
            ) : (
              <div className="mt-3.5 rounded-card border border-good/60 bg-good/10 p-3">
                <p className="text-[11px] font-extrabold text-good">🔓 만들기 프롬프트 (열림)</p>
                <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md border border-white/10 bg-bg/60 p-2.5 text-[10.5px] leading-snug text-ink">
                  {prompt}
                </pre>
                <button
                  type="button"
                  onClick={doCopy}
                  className="mt-2 w-full rounded-md bg-good py-2 text-[13px] font-bold text-white"
                >
                  {promptCopied ? "복사됐어요 ✓" : "🛠 프롬프트 복사해서 오늘 만들기"}
                </button>
              </div>
            )}
          </div>
          <div className="shrink-0 px-4 pb-4">
            {!shared ? (
              <button
                type="button"
                onClick={doShare}
                className="flex w-full flex-col items-center justify-center rounded-card bg-glow px-4 py-3 text-sm font-extrabold text-white shadow-[0_3px_0_0_rgba(0,0,0,.2)] transition hover:brightness-105"
              >
                <span>📮 공유 링크 복사해서 물어보기</span>
                <span className="text-[11px] font-normal opacity-80">친구가 3초 투표 · 공유하면 프롬프트가 열려요</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onVote}
                className="w-full rounded-card border border-white/15 py-2.5 text-sm font-semibold text-mist transition hover:text-ink"
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
