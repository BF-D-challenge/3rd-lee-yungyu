"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { castVote, hasVoted } from "@/lib/backend/votes";
import { feedbackApiConfigured } from "@/lib/backend/feedback-api";
import { IDEA_FEEDBACK_MESSAGES } from "@/lib/idea-feedback";
import { decodePraiseRequest } from "@/lib/praise-share";
import { track, trackIdeaEvent } from "@/lib/track";
import styles from "./praise-request-receiver.module.css";

const PRAISES = Object.values(IDEA_FEEDBACK_MESSAGES);

const CUSTOM_PRAISE = "custom";
const MAX_PRAISE_LENGTH = 80;
const MAX_NAME_LENGTH = 20;

type PraiseChoice = (typeof PRAISES)[number] | typeof CUSTOM_PRAISE;
type RevealChoice = "named" | "forever-anonymous";
type ReceiverStep = "intro" | "praise" | "reveal" | "sent";

const STEP_ORDER: ReceiverStep[] = ["intro", "praise", "reveal", "sent"];

export function PraiseRequestReceiver({ slug }: { slug: string }) {
  const router = useRouter();
  const card = useMemo(() => decodePraiseRequest(slug), [slug]);
  const alreadySent = useMemo(() => hasVoted(slug), [slug]);
  const [step, setStep] = useState<ReceiverStep>(() => (alreadySent ? "sent" : "intro"));
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [selected, setSelected] = useState<PraiseChoice | null>(null);
  const [customPraise, setCustomPraise] = useState("");
  const [reveal, setReveal] = useState<RevealChoice>("forever-anonymous");
  const [senderName, setSenderName] = useState("");
  const [sent, setSent] = useState(alreadySent);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const stepFocusRef = useRef<HTMLElement | null>(null);
  const previousStepRef = useRef(step);
  const legacyExpired = Boolean(card && feedbackApiConfigured() && !card.feedback);

  useEffect(() => {
    if (card) {
      track("praise_request_opened", { request_id: card.id });
      trackIdeaEvent("idea_share_opened", {
        request_id: card.id,
        origin_request_id: card.originRequestId ?? card.id,
        revision_id: card.revisionId,
        version: card.version ?? 0,
        entry_path: window.location.pathname,
      });
    }
  }, [card]);

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    const frame = window.requestAnimationFrame(() => {
      stepFocusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  if (!card) {
    return (
      <main className={`${styles.root} ${styles.notFound}`}>
        <div>
          <h1 className="text-2xl font-bold">응원할 아이디어를 찾을 수 없어요.</h1>
          <p className={styles.notFoundNote}>링크가 오래됐거나 일부가 손상되었을 수 있어요.</p>
          <button
            type="button"
            className={styles.primaryButton}
            style={{ marginTop: 20 }}
            onClick={() => router.push("/")}
          >
            아이디어 만들기
          </button>
        </div>
      </main>
    );
  }

  const selectedPraise = selected === CUSTOM_PRAISE ? customPraise.trim() : selected ?? "";
  const canContinue = selectedPraise.length > 0;
  const canSend = canContinue && (reveal === "forever-anonymous" || senderName.trim().length > 0);
  const moveToStep = (next: ReceiverStep) => {
    setDirection(STEP_ORDER.indexOf(next) < STEP_ORDER.indexOf(step) ? "backward" : "forward");
    setStep(next);
  };

  const send = async () => {
    if (sending || sent || !canSend) return;
    if (hasVoted(slug)) {
      setSent(true);
      moveToStep("sent");
      return;
    }

    setSending(true);
    setSendError(false);
    const name = senderName.trim().slice(0, MAX_NAME_LENGTH);
    const note = {
      v: 1,
      praise: selectedPraise,
      reveal,
      ideaTitle: card.title,
      ...(reveal === "named" && name ? { senderName: name } : {}),
    };

    try {
      const result = await castVote(
        slug,
        "cheer",
        `support:v1:${JSON.stringify(note)}`,
        card.feedback,
      );
      if (result === "failed") throw new Error("응원이 원격 저장소에 도달하지 않았습니다.");
      track("praise_card_sent", { request_id: card.id, reveal });
      trackIdeaEvent("idea_feedback_sent", {
        request_id: card.id,
        origin_request_id: card.originRequestId ?? card.id,
        revision_id: card.revisionId,
        version: card.version ?? 0,
        entry_path: window.location.pathname,
      });
      setSent(true);
      moveToStep("sent");
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const stepIndex = STEP_ORDER.indexOf(step);
  const pitchSections = [
    ...(card.moment ? [{ label: "문제", value: card.moment }] : []),
    ...(card.payer ? [{ label: "타겟", value: card.payer }] : []),
    { label: "기존에 잘되는 앱", value: card.source },
    { label: "차별점", value: card.twist },
  ];

  return (
    <main className={styles.root}>
      <div className={styles.frame}>
        <section className={styles.shell} aria-label="아이디어 반응 보내기">
          <div className={styles.appbar}>
            <p className={styles.eyebrow}>오늘 해볼까</p>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label="반응 보내기 진행률"
              aria-valuemin={1}
              aria-valuemax={STEP_ORDER.length}
              aria-valuenow={stepIndex + 1}
            >
              {STEP_ORDER.map((item, index) => (
                <span
                  key={item}
                  className={styles.progressDot}
                  data-done={index <= stepIndex}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          <div className={styles.stepViewport}>
            {step === "intro" ? (
              <div className={`${styles.step} ${direction === "backward" ? styles.stepBack : ""}`} key="intro">
                <div className={styles.scrollArea}>
                  <div className={styles.receiverAppbarRow}>
                    <span className={styles.receiverAppbarBrand}>친구가 오늘 만든 아이디어예요</span>
                    <span className={styles.receiverAppbarMeta}>공유 링크</span>
                  </div>

                  <div className={styles.previewCard}>
                    <p className={styles.previewLabel}>친구가 시작하려는 제품</p>
                    <h1
                      ref={(node) => { stepFocusRef.current = node; }}
                      tabIndex={-1}
                      className={`${styles.heroTitle} ${styles.stepFocus}`}
                    >
                      {card.title}
                    </h1>
                    <p className={styles.heroSummary}>{card.summary}</p>
                  </div>

                  <section className={styles.contextSection} aria-labelledby="idea-context-heading">
                    <h2 id="idea-context-heading" className={styles.contextHeading}>누구의 어떤 문제를 푸나요?</h2>
                    <dl className={styles.contextList}>
                      {pitchSections.map((section) => (
                        <div className={styles.contextItem} key={section.label}>
                          <dt>{section.label}</dt>
                          <dd>{section.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <div className={styles.buildCard}>
                    <p className={styles.buildLabel}>전체 플로우</p>
                    <p className={styles.buildValue}>{card.flow ?? card.smallestBuild}</p>
                  </div>

                  <div className={styles.requestNote}>
                    <p className={styles.requestLabel}>친구가 부탁한 것</p>
                    <p>{legacyExpired
                      ? "보안 업데이트 전에 만든 링크예요. 아이디어를 만든 친구에게 새 링크를 요청해 주세요."
                      : "이해되는지, 써보고 싶은지, 차별점이 보이는지 솔직하게 알려주세요."}</p>
                  </div>
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => moveToStep("praise")}
                    disabled={legacyExpired}
                  >
                    {legacyExpired ? "새 공유 링크가 필요해요" : "반응 보내기"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "praise" ? (
              <div className={`${styles.step} ${direction === "backward" ? styles.stepBack : ""}`} key="praise">
                <div className={styles.scrollArea}>
                  <div className={styles.backRow}>
                    <button type="button" className={styles.backButton} onClick={() => moveToStep("intro")}>
                      ‹ 아이디어 다시 보기
                    </button>
                  </div>

                  <div className={styles.receiverAppbarRow}>
                    <h2
                      ref={(node) => { stepFocusRef.current = node; }}
                      tabIndex={-1}
                      className={`${styles.stepHeading} ${styles.stepFocus}`}
                    >
                      어떤 반응을 보낼까요?
                    </h2>
                    <span className={styles.receiverAppbarMeta}>하나 고르기</span>
                  </div>
                  <p className={styles.stepDescription}>읽고 난 뒤 가장 가까운 반응 하나를 골라주세요.</p>

                  <div className={styles.praiseGrid} role="group" aria-label="아이디어 반응 선택">
                    {PRAISES.map((praise) => (
                      <button
                        key={praise}
                        type="button"
                        onClick={() => setSelected(praise)}
                        aria-pressed={selected === praise}
                        data-selected={selected === praise}
                        className={styles.praiseOption}
                      >
                        <span className={styles.praiseHeart} aria-hidden="true">♡</span>
                        <span>{praise}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelected(CUSTOM_PRAISE)}
                      aria-pressed={selected === CUSTOM_PRAISE}
                      data-selected={selected === CUSTOM_PRAISE}
                      className={styles.praiseOption}
                    >
                      <span className={styles.praiseHeart} aria-hidden="true">✎</span>
                      <span>직접 작성하기</span>
                    </button>
                  </div>

                  {selected === CUSTOM_PRAISE ? (
                    <div id="custom-praise-field" className={styles.customField}>
                      <label htmlFor="custom-praise" className={styles.customLabel}>한 줄 의견</label>
                      <input
                        id="custom-praise"
                        type="text"
                        value={customPraise}
                        maxLength={MAX_PRAISE_LENGTH}
                        autoComplete="off"
                        enterKeyHint="next"
                        onChange={(event) => setCustomPraise(event.target.value)}
                        placeholder="응원이나 의견을 한 줄로 적어주세요"
                        className={styles.customInput}
                        aria-describedby="custom-praise-count"
                        autoFocus
                      />
                      <span id="custom-praise-count" className={styles.characterCount}>
                        {customPraise.length}/{MAX_PRAISE_LENGTH}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => moveToStep("reveal")}
                    disabled={!canContinue}
                  >
                    다음
                  </button>
                </div>
              </div>
            ) : null}

            {step === "reveal" ? (
              <div className={`${styles.step} ${direction === "backward" ? styles.stepBack : ""}`} key="reveal">
                <div className={styles.scrollArea}>
                  <div className={styles.backRow}>
                    <button type="button" className={styles.backButton} onClick={() => moveToStep("praise")}>
                      ‹ 반응 다시 고르기
                    </button>
                  </div>

                  <div className={styles.selectionPreview}>
                    <p className={styles.previewLabel}>보낼 반응</p>
                    <p>{selectedPraise}</p>
                  </div>

                  <fieldset className={styles.revealSection}>
                    <legend
                      ref={(node) => { stepFocusRef.current = node; }}
                      tabIndex={-1}
                      className={`${styles.revealTitle} ${styles.stepFocus}`}
                    >
                      보낸 사람에게 이름을 보여줄까요?
                    </legend>
                    <label className={styles.revealOption}>
                      <input
                        type="radio"
                        name="reveal"
                        checked={reveal === "named"}
                        onChange={() => setReveal("named")}
                      />
                      <span className={styles.revealOptionLabel}>이름 공개하기</span>
                    </label>
                    <label className={styles.revealOption}>
                      <input
                        type="radio"
                        name="reveal"
                        checked={reveal === "forever-anonymous"}
                        onChange={() => setReveal("forever-anonymous")}
                      />
                      <span className={styles.revealOptionLabel}>익명으로 보내기</span>
                    </label>

                    {reveal === "named" ? (
                      <div className={styles.nameField}>
                        <label htmlFor="sender-name" className={styles.customLabel}>표시할 이름</label>
                        <input
                          id="sender-name"
                          value={senderName}
                          maxLength={MAX_NAME_LENGTH}
                          autoComplete="name"
                          onChange={(event) => setSenderName(event.target.value)}
                          placeholder="이름을 입력해주세요"
                          className={styles.senderNameInput}
                          required
                        />
                        <p className={styles.privacyNote}>입력한 이름은 이 응원 카드에 함께 표시돼요.</p>
                      </div>
                    ) : (
                      <p className={styles.privacyNote}>이름 정보는 응원 카드에 포함되지 않아요.</p>
                    )}
                  </fieldset>

                  {sendError ? (
                    <p className={styles.formError} role="alert">
                      응원을 보내지 못했어요. 잠시 후 다시 시도해주세요.
                    </p>
                  ) : null}
                </div>

                <div className={styles.ctaDock}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={send}
                    disabled={sending || !canSend}
                  >
                    {sending ? "응원 카드 보내는 중…" : "응원 카드 보내기"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "sent" ? (
              <div className={`${styles.step} ${direction === "backward" ? styles.stepBack : ""}`} key="sent">
                <div className={styles.sentContent}>
                  <span className={styles.sentPill}>전달 완료</span>
                  <h2
                    ref={(node) => { stepFocusRef.current = node; }}
                    tabIndex={-1}
                    className={`${styles.sentHeading} ${styles.stepFocus}`}
                  >
                    응원을 보냈어요.
                  </h2>
                  <p className={styles.sentNote}>친구는 이 메시지를 응원 카드로 받게 됩니다.</p>
                </div>

                <div className={styles.ctaDock}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => {
                        trackIdeaEvent("receiver_started_idea", {
                          request_id: card.id,
                          origin_request_id: card.originRequestId ?? card.id,
                          revision_id: card.revisionId,
                          version: card.version ?? 0,
                          entry_path: window.location.pathname,
                        });
                        router.push("/");
                      }}
                    >
                    나도 아이디어 만들기
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={() => router.back()}>
                    창 닫기
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
