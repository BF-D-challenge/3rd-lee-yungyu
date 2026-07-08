"use client";

// [S5] 수신자 응원 화면 — 카드 히어로 + 2×2 긍정 응원칩 (Aurora 글래스).
// 무로그인·설치문구 0자·부정 선택지 0 (PRD §6.3 · K의 심장, R9 · CLAUDE.local.md K 보호).
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { PageShell } from "@/components/layouts/page-shell";
import { cn } from "@/lib/utils";
import { josa } from "@/lib/josa";
import { decodeSlug, prefillSpinUrl, type CardPayload } from "@/lib/share";
import { castVote, attachVoteComment, hasVoted, type VoteType } from "@/lib/backend/votes";
import { loadVotes } from "@/lib/storage";
import { track } from "@/lib/track";
import { PublishCard } from "./publish-card";

// 읽기순 TL→TR→BL→BR = 수요 내림차순(need>notify>watch>cheer). 라벨은 전부 확정형 긍정.
// fill·글자색·크기는 4칩 완전 동일 — 수요 강도는 오직 accent 온도(warm gold→cool plain)로만 인코딩.
type Chip = { type: VoteType; emoji: string; label: string; glow: string; stop: string };
const CHIPS: Chip[] = [
  { type: "need", emoji: "🔥", label: "나도 이거 필요해", glow: "0 0 22px rgba(201,169,98,.30)", stop: "52%" },
  { type: "notify", emoji: "🙌", label: "완성하면 알려줘", glow: "0 0 15px rgba(201,169,98,.15)", stop: "40%" },
  { type: "watch", emoji: "👀", label: "지켜볼게", glow: "0 0 13px rgba(34,211,238,.14)", stop: "26%" },
  { type: "cheer", emoji: "💪", label: "너라면 만들어", glow: "none", stop: "14%" },
];

const CHEER_PRESETS = ["완성 기대할게 🙌", "이거 진짜 필요했어", "화이팅! 🔥"];

type State = "loading" | "gone" | "ready";

/** 원본 payload(내가 응원한 카드) — 슬롯까지 들고 가서 듀얼 공유 체인에 쓴다. confirm-branch.tsx와 리터럴 일치시킬 것 */
const ORIGIN_PAYLOAD_KEY = "oneul:origin_payload";

export function VotePanel({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState<VoteType | null>(null);
  const [commentSent, setCommentSent] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    const decoded = decodeSlug(slug);
    if (!decoded) {
      setState("gone");
      return;
    }
    setPayload(decoded);
    if (hasVoted(slug)) {
      const v = loadVotes(slug);
      setSelected(v[v.length - 1]?.type ?? null);
      setVoted(true);
    }
    setState("ready");
    track("public_card_view");
  }, [slug]);

  if (state === "loading") return null;

  if (state === "gone" || !payload) {
    return (
      <PageShell width="narrow" className="grid place-items-center text-center">
        <div>
          <p className="font-serif text-2xl text-ink">이 카드는 사라졌어요</p>
          <p className="mt-3 text-sm text-mist">링크가 잘못됐거나 만료됐을 수 있어요.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-gold underline-offset-4 hover:underline">
            오늘 해볼까 구경하기 →
          </Link>
        </div>
      </PageShell>
    );
  }

  const tapChip = (type: VoteType) => {
    if (voted || hasVoted(slug)) return; // 더블탭·다른 탭 중복 응원 방지
    setSelected(type);
    void castVote(slug, type); // 낙관적 UI 유지 — Supabase upsert(+local 폴백)는 fire-and-forget
    track("card_vote", { vote_type: type });
    setTimeout(() => setVoted(true), 520); // 필 애니메이션이 끝난 뒤 응원 후 화면으로 스왑
  };

  const pickPreset = (text: string) => {
    void attachVoteComment(slug, text);
    track("vote_comment", { via: "preset" });
    setCommentSent(text);
  };

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const t = customText.trim();
    if (!t) return;
    void attachVoteComment(slug, t);
    track("vote_comment", { via: "custom" });
    setCommentSent(t);
  };

  const spinToo = () => {
    track("vote_to_spin");
    try {
      sessionStorage.setItem(ORIGIN_PAYLOAD_KEY, JSON.stringify(payload));
    } catch {
      /* 스토리지 차단 환경 — 듀얼 체인만 비활성, 나머지 흐름엔 영향 없음 */
    }
    router.push(prefillSpinUrl(payload));
  };

  const chosen = CHIPS.find((c) => c.type === selected);

  return (
    <PageShell width="narrow" className="flex min-h-dvh flex-col">
      <style>{`@keyframes chip-pop{0%{transform:scale(1)}45%{transform:scale(1.18)}100%{transform:scale(1)}}`}</style>

      {/* 상단 맥락 — 조용한 캡션 (수신자에게 로그인·설치 카피 절대 노출 금지) */}
      <p className="text-center text-sm text-caption" data-anim style={{ animation: "fade-up .4s ease both" }}>
        친구가 물어봐요
      </p>

      {/* 히어로 카드 — PublishCard 재사용, 높이 ~44vh 캡(SE 667h에서도 2×2가 폴드 위) */}
      <div className="mt-3 flex justify-center" data-anim style={{ animation: "fade-up .4s ease .05s both" }}>
        <PublishCard payload={payload} className="h-[44vh] max-h-[320px] w-auto max-w-none shrink-0" />
      </div>

      {!voted ? (
        <>
          <p
            className="mt-4 text-center font-serif text-xl text-ink"
            data-anim
            style={{ animation: "fade-up .4s ease .1s both" }}
          >
            이 아이디어, 어때?
          </p>

          <div
            className="mt-3 grid grid-cols-2 gap-3"
            data-anim
            style={{ animation: "fade-up .4s ease .15s both" }}
          >
            {CHIPS.map((chip) => {
              const isSel = selected === chip.type;
              const dimmed = selected !== null && !isSel;
              return (
                <button
                  key={chip.type}
                  onClick={() => tapChip(chip.type)}
                  disabled={selected !== null}
                  aria-label={chip.label}
                  className={cn(
                    "glass relative flex min-h-[108px] flex-col items-center justify-center overflow-hidden rounded-card",
                    "transition-[opacity,transform] duration-200 active:scale-[.98]",
                    dimmed ? "scale-95 opacity-25" : "opacity-100",
                  )}
                  style={{ boxShadow: chip.glow === "none" ? undefined : chip.glow }}
                >
                  {/* 좌→우 aurora 컬러필 — transform만(GPU 합성), 온도차는 accent-stop으로 */}
                  <span
                    aria-hidden
                    data-anim
                    className={cn("absolute inset-0", isSel && "aurora")}
                    style={
                      {
                        borderRadius: "inherit",
                        transformOrigin: "left",
                        transform: isSel ? "scaleX(1)" : "scaleX(0)",
                        transition: "transform .36s cubic-bezier(.65,0,.35,1)",
                        ...(isSel ? { "--aurora-accent-stop": chip.stop } : {}),
                      } as CSSProperties
                    }
                  />
                  <span className="relative z-10 flex flex-col items-center">
                    <span
                      data-anim
                      className="text-[32px] leading-none"
                      style={{ display: "inline-block", animation: isSel ? "chip-pop .3s ease both" : undefined }}
                    >
                      {chip.emoji}
                    </span>
                    <span className={cn("mt-2 text-[15px] font-medium", isSel ? "text-white" : "text-ink")}>
                      {chip.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <section className="mt-5 text-center" data-anim style={{ animation: "fade-up .45s ease both" }}>
          <span
            data-anim
            className="text-[44px] leading-none"
            style={{ display: "inline-block", animation: "chip-pop .34s ease both" }}
          >
            {chosen?.emoji ?? "🙌"}
          </span>
          <p className="mt-2 text-[13px] text-mist">전달됐어요 ✓</p>
          <p className="mt-4 font-serif text-xl leading-snug text-ink">
            너라면 <b className="text-gold">{josa(payload.seedLabel, "으로/로")}</b> 뭘 만들래?
          </p>

          {/* 한마디 — 응원형 프리셋 + 직접 쓸래요 탈출구 (선택, CTA는 언제나 열림) */}
          {!commentSent ? (
            <div className="mt-4">
              <div className="flex flex-wrap justify-center gap-2">
                {CHEER_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => pickPreset(p)}
                    className="glass rounded-pill px-3.5 py-2 text-[13px] text-ink transition-transform active:scale-[.97]"
                  >
                    {p}
                  </button>
                ))}
                {!customOpen && (
                  <button
                    onClick={() => setCustomOpen(true)}
                    className="glass rounded-pill px-3.5 py-2 text-[13px] text-mist transition-transform active:scale-[.97]"
                  >
                    ✏️ 직접 쓸래요
                  </button>
                )}
              </div>
              {customOpen && (
                <form onSubmit={submitCustom} className="mt-2 flex gap-2">
                  <input
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={40}
                    autoFocus
                    placeholder="한마디 남기기"
                    className="glass h-11 flex-1 rounded-input bg-transparent px-4 text-center text-sm text-ink placeholder:text-caption focus:border-gold focus:outline-none"
                  />
                  <Button type="submit" variant="glass">
                    남기기
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-mist">“{commentSent}” 한마디 고마워요</p>
          )}

          <Button variant="aurora" size="lg" className="mt-5 w-full" onClick={spinToo}>
            🎰 나도 뽑아보기
          </Button>
        </section>
      )}
    </PageShell>
  );
}
