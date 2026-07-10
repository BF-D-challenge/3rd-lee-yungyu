"use client";

import type { Combo } from "@/lib/draw";
import { josa } from "@/lib/josa";

export interface ConfirmBranchProps {
  open: boolean;
  combo: Combo | null;
  /** 결과 한 문장 — 카드에 appName/oneliner가 없을 때의 폴백 (IdeaFlipCard가 내부 처리) */
  line: string | null;
}

const isDenseGeneratedName = (value: string): boolean =>
  !/\s/.test(value) && /[가-힣]{9,}/.test(value);

const displayTitle = (combo: Combo | null, line: string | null): string => {
  const raw = combo?.appName ?? combo?.title ?? line ?? "";
  if (!combo || !isDenseGeneratedName(raw)) return raw;
  return `${combo.seed.label} ${combo.format.short}`;
};

const readableTimeline = (combo: Combo | null) => {
  if (!combo) return [];

  const storySteps = combo.frontStory?.timeline
    ?.filter((step) => step.t?.trim() && step.act?.trim() && step.emo?.trim())
    .slice(0, 3)
    .map((step) => ({
      t: step.t.trim(),
      act: step.act.trim(),
      emo: step.emo.trim(),
    }));

  if (storySteps && storySteps.length >= 3) return storySteps;

  const formatLabel = combo.format.id === "crud-app" || combo.format.short === "CRUD" ? "관리판" : combo.format.short;
  return [
        {
          t: "문제 상황",
          act: `${combo.seed.label}에서 ${combo.pain.short} 문제가 반복됨`,
          emo: "다시 확인하느라 판단이 늦어짐",
        },
        {
          t: "정리 방식",
          act: `${josa(formatLabel, "으로/로")} 기준과 결과를 한곳에 모음`,
          emo: "무엇을 먼저 볼지 분명해짐",
        },
        {
          t: "오늘 확인",
          act: "작은 입력과 결과 공유까지 바로 검증",
          emo: "지인에게 물어볼 상태가 됨",
        },
      ];
};

export function ConfirmBranch({ open, combo, line }: ConfirmBranchProps) {
  const visible = open && !!combo;
  const title = displayTitle(combo, line);
  const subtitle =
    combo?.oneliner ??
    (combo ? `${combo.seed.label} · ${combo.pain.short} · ${combo.format.short}` : "");
  const timeline = readableTimeline(combo);
  const todayAction = combo?.todayAction ?? (combo ? `${combo.format.short}으로 ${combo.pain.short}를 줄이는 첫 화면 만들기` : "");
  const mvpItems = combo?.mvp?.slice(0, 3) ?? [];
  const waitingTitle = "카드를 읽는 중";
  const waitingSubtitle = "네 장이 모두 놓이면 오늘의 아이디어가 드러나요";

  return (
    <section
      className="pointer-events-auto relative mx-auto w-[min(92vw,768px)] select-none"
      aria-label="완성 카드"
    >
      <style>{`
        @keyframes result-copy-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tarot-letter-in {
          from { opacity: 0; transform: translateY(14px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes tarot-mask-breathe {
          0%, 100% { opacity: .42; transform: scale(.98); }
          50% { opacity: .72; transform: scale(1.02); }
        }
        @keyframes tarot-sheen {
          from { transform: translateX(-130%) rotate(-8deg); }
          to { transform: translateX(130%) rotate(-8deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .result-copy-fade,
          .tarot-letter,
          .tarot-mask,
          .tarot-sheen { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}</style>
      <div
        className="flex aspect-video items-center justify-center rounded-lg border border-white/[.08] bg-white/[.055] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]"
        aria-live="polite"
      >
        {visible ? (
          <div
            key={`${combo.seed.id}:${combo.pain.id}:${combo.format.id}:${combo.situation}`}
            className="result-copy-fade grid h-full w-full grid-cols-[1fr_1.05fr] gap-6"
            style={{ animation: "result-copy-fade .32s ease-out both" }}
          >
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <p className="text-base font-semibold leading-snug text-caption">오늘 만들어볼 한 개</p>
                <h2 className="mt-2 break-keep font-serif text-2xl leading-tight text-ink">
                  {title}
                </h2>
                <p className="mt-4 break-keep text-base leading-relaxed text-mist/75">
                  {subtitle}
                </p>
              </div>

              <div className="mt-4 rounded-md border border-white/[.07] bg-black/[.16] p-4">
                <p className="text-base font-bold leading-snug text-mist/80">오늘 만들 것</p>
                <p className="mt-2 break-keep text-base leading-snug text-ink/90">{todayAction}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col text-left">
              <p className="text-base font-bold leading-snug text-mist/80">이런 흐름을 겪어요</p>
              <ol className="mt-4 space-y-2">
                {timeline.slice(0, 3).map((step, index) => (
                  <li key={`${step.t}-${index}`} className="grid grid-cols-[72px_1fr] gap-4 text-base leading-snug">
                    <span className="pt-0.5 text-right font-semibold text-caption">{step.t}</span>
                    <span className="border-l border-white/[.12] pl-2">
                      <span className="block break-keep font-semibold text-mist">{step.act}</span>
                      <span className="block break-keep text-caption">{step.emo}</span>
                    </span>
                  </li>
                ))}
              </ol>

              {mvpItems.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {mvpItems.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded border border-white/[.08] bg-white/[.045] px-2 py-2 text-base leading-snug text-mist/75"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {combo.evidence && (
                <p className="mt-2 break-keep text-base leading-snug text-caption">근거: {combo.evidence}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex h-full w-full overflow-hidden rounded-md" aria-label="카드를 읽는 중">
            <div
              aria-hidden
              className="tarot-mask absolute inset-0"
              style={{
                animation: "tarot-mask-breathe 3.6s ease-in-out infinite",
                background:
                  "radial-gradient(circle at 50% 46%, rgba(232,228,210,.13), transparent 24%), radial-gradient(circle at 50% 50%, rgba(109,180,245,.12), transparent 42%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.015))",
                maskImage: "radial-gradient(ellipse at 50% 50%, #000 0 52%, transparent 78%)",
                WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, #000 0 52%, transparent 78%)",
              }}
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-40 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/[.12] bg-black/20 shadow-[0_24px_56px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.05)]"
            >
              <div className="absolute inset-4 rounded-md border border-white/[.08]" />
              <div className="absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-white/[.14]" />
              <div className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-white/[.14]" />
              <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 shadow-[0_0_32px_rgba(255,255,255,.32)]" />
              <div
                className="tarot-sheen absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/[.08] to-transparent"
                style={{ animation: "tarot-sheen 2.8s ease-in-out infinite" }}
              />
            </div>
            <div className="relative z-10 m-auto flex max-w-[560px] flex-col items-center px-8 text-center">
              <p className="text-base font-semibold leading-snug text-caption">오늘의 리딩</p>
              <p className="mt-4 font-serif text-3xl leading-tight text-ink" aria-label={waitingTitle}>
                {waitingTitle.split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    aria-hidden
                    className="tarot-letter inline-block"
                    style={{ animation: `tarot-letter-in .54s cubic-bezier(.2,.8,.2,1) ${index * 45}ms both` }}
                  >
                    {char === " " ? "\u00a0" : char}
                  </span>
                ))}
              </p>
              <p className="mt-4 text-base leading-relaxed text-mist/75" aria-label={waitingSubtitle}>
                {waitingSubtitle.split("").map((char, index) => (
                  <span
                    key={`${char}-${index}`}
                    aria-hidden
                    className="tarot-letter inline-block"
                    style={{ animation: `tarot-letter-in .5s cubic-bezier(.2,.8,.2,1) ${420 + index * 24}ms both` }}
                  >
                    {char === " " ? "\u00a0" : char}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
