"use client";

// [S5] 수신자 공개 카드 — 3초 투표, 어떤 요구도 없이 바로 (PRD §6.3 · K의 심장, R9)
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { PageShell } from "@/components/layouts/page-shell";
import { josa } from "@/lib/josa";
import { decodeSlug, prefillSpinUrl, type CardPayload } from "@/lib/share";
import { addVote, hasVoted, type VoteType } from "@/lib/storage";
import { track } from "@/lib/track";
import { cardTitle } from "./publish-card";

const VOTE_BUTTONS: { type: VoteType; label: string }[] = [
  { type: "try", label: "🔥 나도 써볼래" },
  { type: "empathy", label: "💬 문제 공감" },
  { type: "meh", label: "🤔 글쎄" },
];

type State = "loading" | "gone" | "ready";

export function VotePanel({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [voted, setVoted] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const decoded = decodeSlug(slug);
    if (!decoded) {
      setState("gone");
      return;
    }
    setPayload(decoded);
    setVoted(hasVoted(slug));
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

  const vote = (type: VoteType) => {
    if (voted || hasVoted(slug)) return; // 더블클릭·다른 탭 중복 투표 방지
    const trimmed = comment.trim();
    addVote(slug, { type, comment: trimmed || undefined, at: Date.now() });
    track("card_vote", { vote_type: type });
    setVoted(true);
  };

  const spinToo = () => {
    track("vote_to_spin");
    router.push(prefillSpinUrl(payload));
  };

  return (
    <PageShell width="narrow">
      <p className="mt-8 text-center text-sm text-caption" data-anim style={{ animation: "fade-up .4s ease both" }}>
        친구가 물어봐요
      </p>

      <GlassCard strong className="mt-4 p-6 text-center" data-anim style={{ animation: "fade-up .4s ease .05s both" }}>
        <p className="text-xs text-gold">🌱 {payload.seedLabel}</p>
        <h1 className="mt-2 font-serif text-2xl leading-snug text-ink">{cardTitle(payload)}</h1>
        {payload.oneliner && <p className="mt-3 text-sm leading-relaxed text-mist">{payload.oneliner}</p>}
      </GlassCard>

      {!voted ? (
        <section className="mt-8" data-anim style={{ animation: "fade-up .4s ease .1s both" }}>
          <p className="text-center text-lg text-ink">
            <b className="text-gold">3초 투표</b>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {VOTE_BUTTONS.map((b) => (
              <Button key={b.type} variant="glass" className="px-2 text-sm" onClick={() => vote(b.type)}>
                {b.label}
              </Button>
            ))}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={80}
            placeholder="한마디 남기기 (선택)"
            className="glass mt-3 h-11 w-full rounded-input bg-transparent px-4 text-center text-sm text-ink placeholder:text-caption focus:border-gold focus:outline-none"
          />
        </section>
      ) : (
        <section className="mt-8 text-center" data-anim style={{ animation: "fade-up .45s ease both" }}>
          <p className="text-sm text-mist">고마워요, 전달됐어요 ✓</p>
          <p className="mt-6 font-serif text-xl leading-snug text-ink">
            너라면 <b className="text-gold">{josa(payload.seedLabel, "으로/로")}</b> 뭘 만들래?
          </p>
          <Button variant="aurora" size="lg" className="mt-5 w-full" onClick={spinToo}>
            🎰 나도 뽑아보기
          </Button>
        </section>
      )}
    </PageShell>
  );
}
