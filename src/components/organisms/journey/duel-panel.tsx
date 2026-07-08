"use client";

// [S5-VS] A/B 응원 대결 수신자 — Gas식 긍정 전용 투표: 부정 선택지 없음, 어느 쪽이든 응원 (무로그인)
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Pill } from "@/components/atoms/pill";
import { PageShell } from "@/components/layouts/page-shell";
import { josa } from "@/lib/josa";
import { decodeDuelSlug, prefillSpinUrl, type CardPayload, type DuelPayload } from "@/lib/share";
import { castDuelVote, attachDuelComment, hasDuelVoted, type DuelSide } from "@/lib/backend/votes";
import { loadDuelVotes } from "@/lib/storage";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { cardTitle } from "./publish-card";

type State = "loading" | "gone" | "ready";
type CommentUi = "open" | "sent" | "hidden";

export function DuelPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [duel, setDuel] = useState<DuelPayload | null>(null);
  const [chosen, setChosen] = useState<DuelSide | null>(null);
  const [comment, setComment] = useState("");
  const [commentUi, setCommentUi] = useState<CommentUi>("open");

  useEffect(() => {
    const decoded = decodeDuelSlug(slug);
    if (!decoded) {
      setState("gone");
      return;
    }
    setDuel(decoded);
    if (hasDuelVoted(slug)) {
      // 이 브라우저에 쌓인 응원은 내 것뿐 → 큰 쪽이 내가 응원한 카드
      const v = loadDuelVotes(slug);
      setChosen(v.b > v.a ? "b" : "a");
      setCommentUi("hidden"); // 재방문엔 입력 없이 K 루프만
    }
    setState("ready");
    track("duel_view");
  }, [slug]);

  if (state === "loading") return null;

  if (state === "gone" || !duel) {
    return (
      <PageShell width="narrow" className="grid place-items-center text-center">
        <div>
          <p className="font-serif text-2xl text-ink">이 대결은 사라졌어요</p>
          <p className="mt-3 text-sm text-mist">링크가 잘못됐거나 만료됐을 수 있어요.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-gold underline-offset-4 hover:underline">
            오늘 해볼까 구경하기 →
          </Link>
        </div>
      </PageShell>
    );
  }

  const cheer = (side: DuelSide) => {
    if (chosen || hasDuelVoted(slug)) return; // 더블탭·다른 탭 중복 응원 방지
    void castDuelVote(slug, side); // 낙관적 UI — Supabase upsert(+local 폴백) fire-and-forget
    track("duel_vote", { side });
    setChosen(side);
  };

  const sendComment = () => {
    const text = comment.trim();
    if (!chosen || !text) return;
    void attachDuelComment(slug, text); // 이미 castDuelVote로 만든 내 행에 코멘트 갱신
    setCommentUi("sent");
  };

  const spinToo = () => {
    if (!chosen) return;
    track("duel_to_spin");
    router.push(prefillSpinUrl(duel[chosen]));
  };

  return (
    <PageShell width="narrow">
      <p className="mt-8 text-center text-sm text-caption" data-anim style={{ animation: "fade-up .4s ease both" }}>
        친구가 둘 중에 고민 중이에요
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2" data-anim style={{ animation: "fade-up .4s ease .05s both" }}>
        <DuelCard side="a" payload={duel.a} chosen={chosen} onPick={cheer} />
        <DuelCard side="b" payload={duel.b} chosen={chosen} onPick={cheer} />
      </div>

      {!chosen ? (
        <section className="mt-8 text-center" data-anim style={{ animation: "fade-up .4s ease .1s both" }}>
          <p className="text-lg text-ink">
            <b className="text-gold">어느 쪽을 응원할래?</b>
          </p>
          <p className="mt-2 text-xs text-caption">카드를 탭하면 그쪽에 응원 1표가 가요</p>
        </section>
      ) : (
        <section className="mt-8 text-center" data-anim style={{ animation: "fade-up .45s ease both" }}>
          <p className="text-sm text-gold">응원 전달됐어요 🎉</p>

          {commentUi === "open" && (
            <div className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={80}
                placeholder="응원 한마디 (선택)"
                className="glass h-11 min-w-0 flex-1 rounded-input bg-transparent px-4 text-center text-sm text-ink placeholder:text-caption focus:border-gold focus:outline-none"
              />
              <Button variant="glass" disabled={!comment.trim()} onClick={sendComment}>
                남기기
              </Button>
            </div>
          )}
          {commentUi === "sent" && <p className="mt-3 text-xs text-mist">한마디도 전달됐어요 ✓</p>}

          <p className="mt-6 font-serif text-xl leading-snug text-ink">
            너라면 <b className="text-gold">{josa(duel[chosen].seedLabel, "으로/로")}</b> 뭘 만들래?
          </p>
          <Button variant="aurora" size="lg" className="mt-5 w-full" onClick={spinToo}>
            🎰 나도 뽑아보기
          </Button>
        </section>
      )}
    </PageShell>
  );
}

interface DuelCardProps {
  side: DuelSide;
  payload: CardPayload;
  chosen: DuelSide | null;
  onPick: (side: DuelSide) => void;
}

function DuelCard({ side, payload, chosen, onPick }: DuelCardProps) {
  const isChosen = chosen === side;
  const dimmed = chosen !== null && !isChosen;
  return (
    <button
      type="button"
      onClick={() => onPick(side)}
      disabled={chosen !== null}
      aria-pressed={isChosen}
      className={cn(
        "w-full text-left transition-[opacity,transform] duration-200",
        chosen === null && "hover:-translate-y-0.5 active:translate-y-0",
        dimmed && "opacity-50",
      )}
    >
      <GlassCard strong={isChosen} className={cn("h-full p-5", isChosen && "shadow-glow-hero ring-1 ring-glow")}>
        <div className="flex items-center justify-between">
          <Pill>{side === "a" ? "A" : "B"}</Pill>
          {isChosen && <span className="text-xs text-gold">💜 내 응원</span>}
        </div>
        <p className="mt-3 text-xs text-gold">🌱 {payload.seedLabel}</p>
        <h2 className="mt-1 font-serif text-lg leading-snug text-ink">{cardTitle(payload)}</h2>
        {payload.oneliner && <p className="mt-2 text-sm leading-relaxed text-mist">{payload.oneliner}</p>}
      </GlassCard>
    </button>
  );
}
