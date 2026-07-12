"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

/**
 * Flow B 5단계: B1 아이디어 확인 → B2 칭찬 고르기 → B3 공개 설정 → B4 전송 완료 → B5 홈("/") 라우팅.
 * 각 단계는 독립된 화면이다 — B2(칭찬 4택)와 B3(공개 설정)를 한 화면에 합치지 않는다.
 */
type ReceiverStep = "intro" | "praise" | "reveal" | "sent";

const STEP_ORDER: ReceiverStep[] = ["intro", "praise", "reveal", "sent"];
const TOTAL_DOTS = 5; // B1~B5(홈 라우팅) 기준 진행 도트

export function PraiseRequestReceiver({ slug }: { slug: string }) {
  const router = useRouter();
  const card = useMemo(() => decodePraiseRequest(slug), [slug]);
  const alreadySent = useMemo(() => hasVoted(slug), [slug]);
  const [step, setStep] = useState<ReceiverStep>(() => (alreadySent ? "sent" : "intro"));
  const [selected, setSelected] = useState<string | null>(null);
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
          <button
            type="button"
            className={styles.primaryButton}
            style={{ marginTop: 20 }}
            onClick={() => router.push("/")}
          >
            내 아이디어 뽑기
          </button>
        </div>
      </main>
    );
  }

  const send = async () => {
    if (sending || sent || hasVoted(slug) || !selected) return;
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

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <main className={styles.root}>
      <div className={styles.frame}>
        <section className={styles.shell} aria-label="익명 응원 카드 보내기">
          <div className={styles.appbar}>
            <p className={styles.eyebrow}>ANONYMOUS PRAISE</p>
            <div className={styles.progress} aria-hidden="true">
              {Array.from({ length: TOTAL_DOTS }, (_, index) => (
                <span key={index} className={styles.progressDot} data-done={index <= stepIndex} />
              ))}
            </div>
          </div>

          <div className={styles.stepViewport}>
            {step === "intro" ? (
              <div className={styles.step} key="intro">
                <div className={styles.scrollArea}>
                  <div className={styles.receiverAppbarRow}>
                    <span className={styles.receiverAppbarBrand}>친구가 이번 주에 만들고 있어요</span>
                    <span className={styles.receiverAppbarMeta}>공유 링크</span>
                  </div>

                  <div className={styles.previewCard}>
                    <p className={styles.previewLabel}>친구의 아이디어</p>
                    <h1 className={styles.heroTitle}>{card.title}</h1>
                    <p className={styles.heroSummary}>{card.summary}</p>
                  </div>

                  <div className={styles.buildCard}>
                    <p className={styles.buildLabel}>이번 작은 실행</p>
                    <p className={styles.buildValue}>{card.smallestBuild}</p>
                  </div>
                  <p className={styles.twistNote}>원본에서 딱 하나 바꾼 점 · {card.twist}</p>
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setStep("praise")}
                  >
                    익명 응원 보내기
                  </button>
                </div>
              </div>
            ) : null}

            {step === "praise" ? (
              <div className={styles.step} key="praise">
                <div className={styles.scrollArea}>
                  <div className={styles.backRow}>
                    <button type="button" className={styles.backButton} onClick={() => setStep("intro")}>
                      ‹ 아이디어 다시 보기
                    </button>
                  </div>

                  <div className={styles.receiverAppbarRow}>
                    <h2 className={styles.stepHeading}>칭찬 카드 한 장을 골라주세요.</h2>
                    <span className={styles.receiverAppbarMeta}>하나 고르기</span>
                  </div>
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
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setStep("reveal")}
                    disabled={!selected}
                  >
                    다음
                  </button>
                </div>
              </div>
            ) : null}

            {step === "reveal" ? (
              <div className={styles.step} key="reveal">
                <div className={styles.scrollArea}>
                  <div className={styles.backRow}>
                    <button type="button" className={styles.backButton} onClick={() => setStep("praise")}>
                      ‹ 칭찬 다시 고르기
                    </button>
                  </div>

                  <div className={styles.revealSection}>
                    <p className={styles.revealTitle}>내 이름은 어떻게 할까요?</p>
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
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={send}
                    disabled={sending || !selected}
                  >
                    {sending ? "카드 넣는 중…" : "이 칭찬 카드 보내기"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "sent" ? (
              <div className={styles.step} key="sent">
                <div className={styles.scrollArea}>
                  <div className="text-center">
                    <span className={styles.sentPill}>칭찬 카드가 덱에 들어갔어요</span>
                    <h2 className={styles.sentHeading}>오늘의 칭찬을 보냈어요.</h2>
                    <p className={styles.sentNote}>응원은 실제로 한 번만 전달돼요. 받는 사람은 매일 한 장씩 익명 카드를 확인합니다.</p>
                  </div>
                </div>

                <div className={styles.ctaDock}>
                  <button type="button" className={styles.primaryButton} onClick={() => router.push("/")}>
                    나도 네 장 뽑아보기
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={() => router.back()}>
                    닫기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
