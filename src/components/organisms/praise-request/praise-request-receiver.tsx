"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { castVote, hasVoted } from "@/lib/backend/votes";
import { decodePraiseRequest } from "@/lib/praise-share";
import { track } from "@/lib/track";
import styles from "./praise-request-receiver.module.css";

const PRAISES = [
  "시작부터 구체적이라 진짜 만들 수 있을 것 같아",
  "이건 완성되면 나도 써보고 싶어",
  "한 가지만 바꾼 게 오히려 더 좋아 보여",
  "오늘 작은 화면부터 만드는 선택을 응원해",
];

type RevealChoice = "after-30d" | "forever-anonymous";

/** Flow B 단계: B1 아이디어 확인 → B2+B3 칭찬·공개설정 → B4 전송 완료. B5는 "/"로 라우팅한다. */
type ReceiverStep = "intro" | "praise" | "sent";

export function PraiseRequestReceiver({ slug }: { slug: string }) {
  const router = useRouter();
  const card = useMemo(() => decodePraiseRequest(slug), [slug]);
  const alreadySent = useMemo(() => hasVoted(slug), [slug]);
  const [step, setStep] = useState<ReceiverStep>(() => (alreadySent ? "sent" : "intro"));
  const [selected, setSelected] = useState(PRAISES[0]);
  const [reveal, setReveal] = useState<RevealChoice>("forever-anonymous");
  const [senderName, setSenderName] = useState("");
  const [sent, setSent] = useState(alreadySent);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (card) track("praise_request_opened", { request_id: card.id });
  }, [card]);

  if (!card) {
    return (
      <main className={`${styles.root} ${styles.notFound}`}>
        <div>
          <h1 className="text-2xl font-bold">칭찬할 아이디어를 찾을 수 없어요.</h1>
          <Button variant="aurora" className="mt-5" onClick={() => router.push("/")}>
            내 아이디어 뽑기
          </Button>
        </div>
      </main>
    );
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
    setStep("sent");
    setSending(false);
  };

  const stepIndex = step === "intro" ? 0 : step === "praise" ? 1 : 2;

  return (
    <main className={styles.root}>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
        <section className={styles.shell} aria-label="익명 응원 카드 보내기">
          <div className={styles.appbar}>
            <p className={styles.eyebrow}>ANONYMOUS PRAISE</p>
            <div className={styles.progress} aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span key={index} className={styles.progressDot} data-done={index <= stepIndex} />
              ))}
            </div>
          </div>

          {step === "intro" ? (
            <div className={styles.step} key="intro">
              <p className="text-xs text-mist">친구가 이번 주에 만들고 있어요</p>
              <h1 className={styles.heroTitle}>{card.title}</h1>
              <p className={styles.heroSummary}>{card.summary}</p>

              <div className={styles.buildCard}>
                <p className={styles.buildLabel}>이번 주 가장 작은 실행</p>
                <p className={styles.buildValue}>{card.smallestBuild}</p>
              </div>
              <p className={styles.twistNote}>원본에서 딱 하나 바꾼 점 · {card.twist}</p>

              <Button
                variant="aurora"
                size="lg"
                className={styles.primaryCta}
                onClick={() => setStep("praise")}
              >
                익명 응원 보내기
              </Button>
            </div>
          ) : null}

          {step === "praise" ? (
            <div className={styles.step} key="praise">
              <div className={styles.backRow}>
                <button type="button" className={styles.backButton} onClick={() => setStep("intro")}>
                  ‹ 아이디어 다시 보기
                </button>
              </div>

              <h2 className={styles.stepHeading}>칭찬 카드 한 장을 골라주세요.</h2>
              <div className={styles.praiseGrid}>
                {PRAISES.map((praise) => (
                  <button
                    key={praise}
                    type="button"
                    onClick={() => setSelected(praise)}
                    data-selected={selected === praise}
                    className={styles.praiseOption}
                  >
                    <span className={styles.praiseHeart} aria-hidden="true">♡ </span>
                    {praise}
                  </button>
                ))}
              </div>

              <div className={styles.revealSection}>
                <p className={styles.revealTitle}>공개 설정</p>
                <label className={styles.revealOption}>
                  <input
                    type="radio"
                    checked={reveal === "forever-anonymous"}
                    onChange={() => setReveal("forever-anonymous")}
                  />
                  <span className={styles.revealOptionLabel}>기본 · 계속 익명으로 보낼게요</span>
                </label>
                <label className={styles.revealOption}>
                  <input
                    type="radio"
                    checked={reveal === "after-30d"}
                    onChange={() => setReveal("after-30d")}
                  />
                  <span className={styles.revealOptionLabel}>선택 · 30일 뒤 이름 공개에 동의해요</span>
                </label>
                {reveal === "after-30d" ? (
                  <input
                    value={senderName}
                    onChange={(event) => setSenderName(event.target.value)}
                    placeholder="공개할 이름(선택)"
                    className={styles.senderNameInput}
                  />
                ) : null}
                <p className={styles.privacyNote}>계속 익명을 고르면 상대가 결제해도 이름은 보이지 않아요.</p>
              </div>

              <Button
                variant="aurora"
                size="lg"
                className={styles.primaryCta}
                onClick={send}
                disabled={sending}
              >
                {sending ? "카드 넣는 중…" : "이 칭찬 카드 보내기"}
              </Button>
            </div>
          ) : null}

          {step === "sent" ? (
            <div className={styles.step} key="sent">
              <div className="text-center">
                <span className={styles.sentBadge}>✓ 전송 완료</span>
                <div className={styles.sentCardArt} aria-hidden="true">
                  <span className="px-4 text-center text-sm font-bold leading-6">
                    칭찬 카드가<br />덱에 들어갔어요
                  </span>
                </div>
                <h2 className={styles.sentHeading}>오늘의 칭찬을 보냈어요.</h2>
                <p className={styles.sentNote}>응원은 실제로 한 번만 전달돼요. 받는 사람은 매일 한 장씩 익명 카드를 확인합니다.</p>
                <Button variant="aurora" size="lg" className={styles.primaryCta} onClick={() => router.push("/")}>
                  나도 네 장 뽑아보기
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
