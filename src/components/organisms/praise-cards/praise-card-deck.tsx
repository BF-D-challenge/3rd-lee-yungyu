"use client";

import { useEffect, useMemo, useState, type CSSProperties, type HTMLAttributes } from "react";
import styles from "./praise-card-deck.module.css";

export type PraiseCardEmblem = "spark" | "wave" | "leaf" | "moon";

export interface PraiseCard {
  id: string;
  message: string;
  arrivedAt: string;
  anonymousLabel?: string;
  emblem?: PraiseCardEmblem;
}

export interface PraiseCardDeckPalette {
  table: string;
  tableEdge: string;
  card: string;
  cardInk: string;
  cardMuted: string;
  cardBack: string;
  cardBackLine: string;
  accent: string;
}

export interface PraiseCardDeckProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "color"> {
  /** null이면 공유 CTA가 있는 empty 상태를 렌더합니다. */
  card?: PraiseCard | null;
  /** 현재 카드가 처음부터 앞면으로 열릴지 결정합니다. */
  initiallyFaceUp?: boolean;
  /** 뒤에서 일부 보이는 잠긴 다음 카드의 안내 문구입니다. */
  nextCardLabel?: string;
  /** 실제 잠긴 다음 카드가 있을 때만 true. false면 장식용 가짜 카드를 만들지 않습니다. */
  hasNextCard?: boolean;
  palette?: Partial<PraiseCardDeckPalette>;
  ariaLabel?: string;
  onRequestPraise?: () => void;
  onRevealSender?: (card: PraiseCard) => void;
  onPreviewNext?: (card: PraiseCard) => void;
}

const DEFAULT_PALETTE: PraiseCardDeckPalette = {
  table: "#0b2925",
  tableEdge: "#071a19",
  card: "#f4efe5",
  cardInk: "#1d2428",
  cardMuted: "#6c706e",
  cardBack: "#27314f",
  cardBackLine: "#9aa8d0",
  accent: "#ff4458",
};

const EMBLEM: Record<PraiseCardEmblem, { symbol: string; label: string; tone: "warm" | "cool" }> = {
  spark: { symbol: "✦", label: "반짝임", tone: "warm" },
  wave: { symbol: "≋", label: "물결", tone: "cool" },
  leaf: { symbol: "❧", label: "잎", tone: "cool" },
  moon: { symbol: "◒", label: "달", tone: "warm" },
};

/**
 * 일반 카드 게임의 테이블·스택·수트·딜 문법만 추상화한 익명 칭찬 카드입니다.
 * 결제 상태나 결제 동작은 포함하지 않습니다.
 *
 * @example
 * <PraiseCardDeck
 *   card={{ id: "praise-1", message: "작은 디테일까지 챙기는 모습이 멋졌어요.", arrivedAt: "2026. 7. 12." }}
 *   onRequestPraise={() => sharePraiseLink()}
 *   onRevealSender={(card) => openSenderSheet(card.id)}
 *   onPreviewNext={(card) => openNextPreview(card.id)}
 * />
 */
export function PraiseCardDeck({
  card = null,
  initiallyFaceUp = false,
  nextCardLabel = "다음 칭찬은 아직 잠겨 있어요",
  hasNextCard = false,
  palette,
  ariaLabel,
  onRequestPraise,
  onRevealSender,
  onPreviewNext,
  className,
  style,
  ...props
}: PraiseCardDeckProps) {
  const cardIdentity = card?.id ?? "empty";
  const [faceUp, setFaceUp] = useState(initiallyFaceUp);

  useEffect(() => {
    setFaceUp(initiallyFaceUp);
  }, [cardIdentity, initiallyFaceUp]);

  const colors = { ...DEFAULT_PALETTE, ...palette };
  const cssVariables = {
    "--praise-table": colors.table,
    "--praise-table-edge": colors.tableEdge,
    "--praise-card": colors.card,
    "--praise-card-ink": colors.cardInk,
    "--praise-card-muted": colors.cardMuted,
    "--praise-card-back": colors.cardBack,
    "--praise-card-back-line": colors.cardBackLine,
    "--praise-accent": colors.accent,
    ...style,
  } as CSSProperties;

  const emblem = useMemo(() => EMBLEM[card?.emblem ?? "spark"], [card?.emblem]);
  const deckLabel =
    ariaLabel ??
    (card
      ? `오늘 공개된 익명 칭찬 카드. ${faceUp ? "앞면이 열려 있습니다." : "뒷면이 보입니다."}`
      : "아직 공개된 칭찬 카드가 없습니다.");

  return (
    <section
      {...props}
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={cssVariables}
      aria-label={deckLabel}
      data-state={card ? "filled" : "empty"}
    >
      <div className={styles.table}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>TODAY&apos;S PRAISE</span>
            <h2>{card ? "오늘 공개된 익명 칭찬" : "오늘의 칭찬 카드"}</h2>
          </div>
          <span className={styles.tableMark} aria-hidden="true">✦</span>
        </header>

        {card ? (
          <>
            <div className={styles.deck} data-face-up={faceUp}>
              {hasNextCard ? (
                <div className={styles.nextCard} aria-hidden="true">
                  <div className={styles.backPattern} />
                  <span className={styles.lockMark}>잠김</span>
                </div>
              ) : null}

              <button
                type="button"
                className={styles.flipCard}
                aria-label={faceUp ? "칭찬 카드 뒷면 보기" : "오늘의 칭찬 카드 뒤집기"}
                aria-pressed={faceUp}
                onClick={() => setFaceUp((current) => !current)}
              >
                <span className={styles.flipInner}>
                  <span className={styles.cardBack} aria-hidden={faceUp}>
                    <span className={styles.backBorder} aria-hidden="true">
                      <span className={styles.backSuit}>✦</span>
                    </span>
                    <span className={styles.flipHint}>탭해서 칭찬 열기</span>
                  </span>

                  <span className={styles.cardFront} data-tone={emblem.tone} aria-hidden={!faceUp}>
                    <span className={styles.suitTop} aria-label={`${emblem.label} 표식`}>
                      <b>TODAY</b>
                      <i aria-hidden="true">{emblem.symbol}</i>
                    </span>
                    <span className={styles.praiseBody}>
                      <span className={styles.quoteMark} aria-hidden="true">“</span>
                      <strong>{card.message}</strong>
                      <span className={styles.sender}>{card.anonymousLabel ?? "익명"}</span>
                    </span>
                    <span className={styles.arrivedAt}>도착일 · {card.arrivedAt}</span>
                    <span className={styles.suitBottom} aria-hidden="true">
                      <b>익명</b>
                      <i>{emblem.symbol}</i>
                    </span>
                  </span>
                </span>
              </button>

              {hasNextCard ? <span className={styles.srOnly}>{nextCardLabel}</span> : null}
            </div>

            <p className={styles.deckHint}>
              {faceUp ? "카드를 다시 누르면 뒷면으로 돌아가요." : "오늘 공개된 카드를 한 장 뒤집어 보세요."}
            </p>

            {onRevealSender || (hasNextCard && onPreviewNext) ? (
              <div className={styles.actions}>
                {onRevealSender ? (
                  <button type="button" className={styles.primaryAction} onClick={() => onRevealSender(card)}>
                    누가 보냈는지 보기
                  </button>
                ) : null}
                {hasNextCard && onPreviewNext ? (
                  <button type="button" className={styles.secondaryAction} onClick={() => onPreviewNext(card)}>
                    다음 칭찬 미리 보기
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStack} aria-hidden="true">
              <span className={styles.emptyBack} />
              <span className={styles.emptyFront}>?</span>
            </div>
            <h3>아직 도착한 칭찬이 없어요</h3>
            <p>공유 링크를 보내면 친구가 익명으로 칭찬 카드를 남길 수 있어요.</p>
            <button
              type="button"
              className={styles.shareAction}
              disabled={!onRequestPraise}
              onClick={onRequestPraise}
            >
              칭찬 받아오기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
