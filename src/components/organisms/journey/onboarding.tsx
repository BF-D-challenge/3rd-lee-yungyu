"use client";

// [S0] 씨앗 온보딩 — 탭 3번, 전부 객관식. 자유입력은 맨 끝 탈출구 (PRD §4-1, v4계획 §4 S0-a~c)
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { Chip } from "@/components/atoms/chip";
import { GlassCard } from "@/components/atoms/glass-card";
import { ProgressDots } from "@/components/atoms/progress-dots";
import { BottomCta } from "@/components/layouts/bottom-cta";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { combos, type Category, type Track } from "@/lib/combos";
import type { Seed } from "@/lib/draw";
import { saveSeed } from "@/lib/storage";
import { track as trackEvent } from "@/lib/track";

type Step = 0 | 1 | 2;

const TRACK_CARDS: { id: Track; emoji: string; label: string; caption: string }[] = [
  { id: "like", emoji: "❤️", label: "좋아하는 걸로", caption: "취미·취향에서 출발해요" },
  { id: "know", emoji: "🧠", label: "잘 아는 걸로", caption: "일·경험에서 출발해요" },
];

const pickRandom = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

const slugify = (label: string): string =>
  label.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [trackSel, setTrackSel] = useState<Track>("like");
  const [category, setCategory] = useState<Category | null>(null);
  const [seed, setSeed] = useState<Seed | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    trackEvent("view_start");
  }, []);

  const categories = useMemo(
    () => combos.tracks[trackSel].categories.slice(0, 4),
    [trackSel],
  );
  const popularSeeds = useMemo(
    () => combos.presetSeeds.filter((s) => s.track === trackSel).slice(0, 3),
    [trackSel],
  );

  const customSeed = (): Seed | null => {
    const label = customText.trim();
    if (!label) return null;
    return { id: `custom-${slugify(label)}`, label, track: trackSel, custom: true };
  };
  const finalSeed = customOpen ? customSeed() : seed;

  const go = (next: Seed, method: "chip" | "freetext") => {
    saveSeed(next);
    trackEvent("seed_submitted", { seed_tag: next.id, method });
    router.push("/slot");
  };

  const randomEscape = () => {
    const t = pickRandom<Track>(["like", "know"]);
    const cat = pickRandom(combos.tracks[t].categories);
    const s = pickRandom(cat.seeds);
    const next: Seed = { id: s.id, label: s.label, track: t };
    saveSeed(next);
    trackEvent("onboard_random_escape", { seed_tag: next.id });
    router.push("/slot");
  };

  const back = () => {
    if (step === 2) {
      setSeed(null);
      setCustomOpen(false);
      setStep(1);
    } else if (step === 1) {
      setCategory(null);
      setStep(0);
    }
  };

  return (
    <PageShell>
      <TopBar
        right={
          step > 0 ? (
            <button onClick={back} aria-label="뒤로" className="text-mist transition-colors hover:text-ink">
              ← 뒤로
            </button>
          ) : undefined
        }
      />
      <ProgressDots total={3} current={step} className="mt-2" />

      {step === 0 && (
        <section className="mx-auto mt-12 max-w-narrow" data-anim style={{ animation: "fade-up .4s ease both" }}>
          <h1 className="text-center font-serif text-2xl text-ink">어느 쪽에서 시작할까요?</h1>
          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
            {TRACK_CARDS.map((c) => (
              <GlassCard
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => { setTrackSel(c.id); setStep(1); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setTrackSel(c.id); setStep(1); } }}
                className="cursor-pointer p-5 text-center transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="text-3xl">{c.emoji}</div>
                <p className="mt-2 font-serif text-lg text-ink">{c.label}</p>
                <p className="mt-1 text-xs text-mist">{c.caption}</p>
              </GlassCard>
            ))}
          </div>
          <p className="mt-8 text-center">
            <button onClick={randomEscape} className="text-sm text-caption underline-offset-4 transition-colors hover:text-mist hover:underline">
              아무거나 골라주세요
            </button>
          </p>
        </section>
      )}

      {step === 1 && (
        <section className="mx-auto mt-12 max-w-narrow" data-anim style={{ animation: "fade-up .4s ease both" }}>
          <h1 className="text-center font-serif text-2xl text-ink">
            {trackSel === "like" ? "뭘 제일 좋아하세요?" : "어떤 분야를 잘 아세요?"}
          </h1>
          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
            {categories.map((c) => (
              <Chip key={c.id} className="h-14 text-base" onClick={() => { setCategory(c); setStep(2); }}>
                {c.emoji} {c.label}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {step === 2 && category && (
        <section className="mx-auto mt-10 max-w-narrow" data-anim style={{ animation: "fade-up .4s ease both" }}>
          <h1 className="text-center font-serif text-2xl text-ink">
            &ldquo;{category.label}&rdquo;에서 뭘 제일 {trackSel === "like" ? "좋아하세요?" : "잘 아세요?"}
          </h1>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {category.seeds.map((s) => (
              <Chip
                key={s.id}
                selected={!customOpen && seed?.id === s.id}
                onClick={() => { setSeed({ id: s.id, label: s.label, track: trackSel }); setCustomOpen(false); }}
              >
                {!customOpen && seed?.id === s.id ? "✓ " : ""}{s.label}
              </Chip>
            ))}
          </div>

          {popularSeeds.length > 0 && (
            <>
              <p className="mt-8 text-center text-sm text-caption">인기 씨앗</p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {popularSeeds.map((s) => (
                  <Chip
                    key={s.id}
                    selected={!customOpen && seed?.id === s.id}
                    onClick={() => { setSeed({ id: s.id, label: s.label, track: trackSel }); setCustomOpen(false); }}
                  >
                    🌱 {s.label}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            {customOpen ? (
              <div data-anim style={{ animation: "fade-up .3s ease both" }}>
                <input
                  autoFocus
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={20}
                  placeholder="예: 빵집투어"
                  className="glass h-12 w-full rounded-input bg-transparent px-4 text-center text-ink placeholder:text-caption focus:border-gold focus:outline-none"
                />
              </div>
            ) : (
              <button onClick={() => { setCustomOpen(true); setSeed(null); }} className="text-sm text-caption underline-offset-4 transition-colors hover:text-mist hover:underline">
                직접 쓸래요
              </button>
            )}
          </div>

          <BottomCta>
            <Button
              variant="aurora"
              size="lg"
              disabled={!finalSeed}
              onClick={() => finalSeed && go(finalSeed, customOpen ? "freetext" : "chip")}
            >
              이걸로 슬롯 열기 🎰
            </Button>
          </BottomCta>
        </section>
      )}
    </PageShell>
  );
}
