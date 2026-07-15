"use client";

import { useEffect, useMemo, useState, type CSSProperties, type HTMLAttributes } from "react";
import styles from "./praise-card-deck.module.css";

export type PraiseCardEmblem = "spark" | "wave" | "leaf" | "moon";

export interface PraiseCard {
  id: string;
  message: string;
  arrivedAt: string;
  ideaTitle?: string;
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
  /** 빈 덱 상태 CTA 문구. 다시 공유할 링크가 있는지에 따라 호출부가 다르게 넘긴다. */
  shareActionLabel?: string;
  emptyDescription?: string;
  onRequestPraise?: () => void;
  onReveal?: (card: PraiseCard) => void;
  onStartIdea?: () => void;
}

const DEFAULT_PALETTE: PraiseCardDeckPalette = {
  table: "#0d0d10",
  tableEdge: "#060608",
  card: "#f4f1ea",
  cardInk: "#1a1a1e",
  cardMuted: "#6c6c72",
  cardBack: "#17171c",
  cardBackLine: "#8a8a92",
  accent: "#ff4458",
};

const EMBLEM: Record<PraiseCardEmblem, { symbol: string; label: string; tone: "warm" | "cool" }> = {
  spark: { symbol: "✦", label: "반짝임", tone: "warm" },
  wave: { symbol: "≋", label: "물결", tone: "cool" },
  leaf: { symbol: "❧", label: "잎", tone: "cool" },
  moon: { symbol: "◒", label: "달", tone: "warm" },
};

/**
 * 일반 카드 게임의 테이블·스택·수트·딜 문법만 추상화한 응원 카드입니다.
 * 결제 상태나 결제 동작은 포함하지 않습니다.
 *
 * @example
 * <PraiseCardDeck
 *   card={{ id: "praise-1", message: "작은 디테일까지 챙기는 모습이 멋졌어요.", arrivedAt: "2026. 7. 12." }}
 *   onRequestPraise={() => sharePraiseLink()}
 *   onStartIdea={() => showIdeaMaker()}
 * />
 */
export function PraiseCardDeck({
  card = null,
  initiallyFaceUp = false,
  nextCardLabel = "다음 응원은 아직 잠겨 있어요.",
  hasNextCard = false,
  palette,
  ariaLabel,
  shareActionLabel = "응원 받아오기",
  emptyDescription = "완성한 아이디어를 공유하고 친구의 응원을 받아보세요.",
  onRequestPraise,
  onReveal,
  onStartIdea,
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
      ? `받은 응원 카드. ${faceUp ? "앞면이 열려 있습니다." : "뒷면이 보입니다."}`
      : "아직 도착한 응원 카드가 없습니다.");

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
            <span className={styles.eyebrow}>PRAISE CARD</span>
            <h2>{card ? "도착한 응원 한 장" : "받은 응원"}</h2>
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
                aria-label={faceUp ? "응원 카드 뒷면 보기" : "응원 카드 뒤집어 내용 확인하기"}
                aria-pressed={faceUp}
                onClick={() => {
                  if (!faceUp) onReveal?.(card);
                  setFaceUp((current) => !current);
                }}
              >
                <span className={styles.flipInner}>
                  <span className={styles.cardBack} aria-hidden={faceUp}>
                    <span className={styles.backBorder} aria-hidden="true">
                      <span className={styles.backSuit}>✦</span>
                    </span>
                    <span className={styles.flipHint}>눌러서 응원 확인하기</span>
                  </span>

                  <span className={styles.cardFront} data-tone={emblem.tone} aria-hidden={!faceUp}>
                    <span className={styles.suitTop} aria-label={`${emblem.label} 표식`}>
                      <b>TODAY</b>
                      <i aria-hidden="true">{emblem.symbol}</i>
                    </span>
                    <span className={styles.praiseBody}>
                      <span className={styles.quoteMark} aria-hidden="true">“</span>
                      <strong>{card.message}</strong>
                      {card.ideaTitle ? <span className={styles.ideaTitle}>아이디어 · {card.ideaTitle}</span> : null}
                      {card.anonymousLabel ? <span className={styles.sender}>{card.anonymousLabel}</span> : null}
                    </span>
                    <span className={styles.arrivedAt}>도착일 · {card.arrivedAt}</span>
                    <span className={styles.suitBottom} aria-hidden="true">
                      <b>응원</b>
                      <i>{emblem.symbol}</i>
                    </span>
                  </span>
                </span>
              </button>

              {hasNextCard ? <span className={styles.srOnly}>{nextCardLabel}</span> : null}
            </div>

            <p className={styles.deckHint}>
              {faceUp ? "응원을 확인했어요." : "카드를 눌러 응원을 확인하세요."}
            </p>

            {faceUp && hasNextCard ? (
              <p className={styles.nextNotice} role="status">{nextCardLabel}</p>
            ) : null}

            {faceUp && !hasNextCard ? (
              <div className={styles.completion}>
                <strong role="status">도착한 응원을 모두 확인했어요.</strong>
                {onStartIdea ? (
                  <button type="button" className={styles.primaryAction} onClick={onStartIdea}>
                    새 아이디어 만들기
                  </button>
                ) : null}
              </div>
            ) : null}

            <span className={styles.srOnly} aria-live="polite">
              {faceUp ? `응원 내용: ${card.message}` : "응원 카드 뒷면이 보입니다."}
            </span>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStack} aria-hidden="true">
              <span className={styles.emptyBack} />
              <span className={styles.emptyFront}>?</span>
            </div>
            <h3>아직 도착한 응원이 없어요</h3>
            <p>{emptyDescription}</p>
            {onRequestPraise ? (
              <button type="button" className={styles.shareAction} onClick={onRequestPraise}>
                {shareActionLabel}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
