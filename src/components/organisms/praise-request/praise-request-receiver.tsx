"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { castVote, hasVoted } from "@/lib/backend/votes";
import { decodePraiseRequest } from "@/lib/praise-share";
import { track } from "@/lib/track";

const PRAISES = [
  "시작부터 구체적이라 진짜 만들 수 있을 것 같아",
  "이건 완성되면 나도 써보고 싶어",
  "한 가지만 바꾼 게 오히려 더 좋아 보여",
  "오늘 작은 화면부터 만드는 선택을 응원해",
];

type RevealChoice = "after-30d" | "forever-anonymous";

export function PraiseRequestReceiver({ slug }: { slug: string }) {
  const router = useRouter();
  const card = useMemo(() => decodePraiseRequest(slug), [slug]);
  const [selected, setSelected] = useState(PRAISES[0]);
  const [reveal, setReveal] = useState<RevealChoice>("forever-anonymous");
  const [senderName, setSenderName] = useState("");
  const [sent, setSent] = useState(() => hasVoted(slug));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (card) track("praise_request_opened", { request_id: card.id });
  }, [card]);

  if (!card) {
    return <main className="grid min-h-dvh place-items-center bg-bg p-6 text-center text-ink"><div><h1 className="text-2xl font-bold">칭찬할 아이디어를 찾을 수 없어요.</h1><Button variant="aurora" className="mt-5" onClick={() => router.push("/")}>내 아이디어 뽑기</Button></div></main>;
  }

  const send = async () => {
    if (sending || sent || hasVoted(slug)) return;
    setSending(true);
    const note = {
      v: 1,
      praise: selected,
      reveal,
      senderName: reveal === "after-30d" ? senderName.trim().slice(0, 20) || undefined : undefined,
    };
    await castVote(slug, "cheer", `support:v1:${JSON.stringify(note)}`);
    track("praise_card_sent", { request_id: card.id, reveal });
    setSent(true);
    setSending(false);
  };

  return (
    <main className="min-h-dvh bg-[#0d2a23] px-4 py-8 text-ink sm:py-12">
      <section className="mx-auto max-w-[760px] overflow-hidden rounded-[26px] border border-white/10 bg-[#0b1916] shadow-2xl">
        <header className="border-b border-white/10 px-5 py-5 sm:px-7">
          <p className="text-xs font-black tracking-[.15em] text-primary">ANONYMOUS PRAISE</p>
          <h1 className="mt-2 text-3xl font-bold">{card.title}</h1>
          <p className="mt-3 text-sm leading-6 text-mist">{card.summary}</p>
        </header>

        {sent ? (
          <div className="px-5 py-10 text-center sm:px-8">
            <div className="mx-auto grid h-44 w-28 rotate-[-3deg] place-items-center rounded-[14px] border-2 border-white bg-[#fffdf8] text-[#121212] shadow-[0_18px_45px_rgba(0,0,0,.35)]">
              <span className="px-4 text-sm font-bold leading-6">칭찬 카드가<br />덱에 들어갔어요</span>
            </div>
            <h2 className="mt-7 text-2xl font-bold">오늘의 칭찬을 보냈어요.</h2>
            <p className="mt-2 text-sm text-mist">받는 사람은 매일 한 장씩 익명 카드를 확인합니다.</p>
            <Button variant="aurora" size="lg" className="mt-6 w-full" onClick={() => router.push("/")}>나도 네 장 뽑기</Button>
          </div>
        ) : (
          <div className="grid gap-6 p-5 md:grid-cols-[.8fr_1.2fr] sm:p-7">
            <div className="rounded-card border border-white/10 bg-white/[.035] p-4">
              <p className="text-xs text-caption">오늘 만들 가장 작은 화면</p>
              <p className="mt-2 text-base font-semibold leading-6">{card.smallestBuild}</p>
              <p className="mt-5 text-xs text-caption">원본에서 딱 하나 바꾼 점</p>
              <p className="mt-2 text-sm text-mist">{card.twist}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold">칭찬 카드 한 장을 골라주세요.</h2>
              <div className="mt-4 grid gap-2">
                {PRAISES.map((praise) => (
                  <button key={praise} type="button" onClick={() => setSelected(praise)} className={`min-h-14 rounded-input border px-4 text-left text-sm leading-5 ${selected === praise ? "border-primary bg-[var(--primary-soft)]" : "border-white/10 bg-white/[.025]"}`}>{praise}</button>
                ))}
              </div>
              <div className="mt-4 rounded-input border border-white/10 p-3 text-sm">
                <label className="flex gap-2"><input type="radio" checked={reveal === "forever-anonymous"} onChange={() => setReveal("forever-anonymous")} /> 계속 익명</label>
                <label className="mt-2 flex gap-2"><input type="radio" checked={reveal === "after-30d"} onChange={() => setReveal("after-30d")} /> 30일 뒤 이름 공개에 동의</label>
                {reveal === "after-30d" ? <input value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="공개할 이름(선택)" className="mt-3 h-11 w-full rounded-input border border-white/10 bg-black/20 px-3 outline-none focus:border-primary" /> : null}
              </div>
              <Button variant="aurora" size="lg" className="mt-4 w-full" onClick={send} disabled={sending}>{sending ? "카드 넣는 중…" : "이 칭찬 카드 보내기"}</Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
