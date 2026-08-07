"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  ChevronRight,
  Expand,
  MapPin,
  MessageCircle,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./matpin-storyboard-ranking.module.css";

const STORAGE_KEY = "matpin:storyboard-ranking:v1";

const reelImages = [
  "/images/matpin/reels/ai-pork-skin-reference-v2.png",
  "/images/matpin/reels/ai-beef-cubes-reference-v2.png",
  "/images/matpin/reels/ai-braised-ribs-reference-v2.png",
  "/images/matpin/reels/ai-cheese-chicken-reference-v2.png",
] as const;

const storyboards = [
  {
    id: "portal",
    code: "A",
    name: "휴대폰 포털",
    intent: "보던 릴스가 휴대폰 밖으로 나와 맛핀으로 이동하는 장면",
    strength: "입력과 결과의 인과가 가장 선명해요.",
    lens: "정면 · 풀블리드",
    reference: "Crème 상세",
    referenceUrl: "https://mobbin.com/screens/1fd7eb47-6704-44e8-bc3a-45a91b22627a",
    referenceUse: "큰 콘텐츠와 바로 붙은 행동",
    imageOffset: 0,
    shots: ["정면 풀블리드", "포털 줌인", "중앙 포커스", "정면 그리드"],
    accent: "#ff5a64",
    accentSoft: "rgba(255, 90, 100, 0.18)",
  },
  {
    id: "orbit",
    code: "B",
    name: "릴스 궤도",
    intent: "흩어진 릴스가 matpin.kr 주위를 돌다가 역별로 모이는 장면",
    strength: "여러 영상이 흩어져 있다는 문제가 잘 보여요.",
    lens: "탑뷰 · 궤도",
    reference: "Beli 목록",
    referenceUrl: "https://mobbin.com/flows/3255694a-faad-444f-914d-4b7c82083fa6",
    referenceUse: "저장 목록 우선 탐색",
    imageOffset: 1,
    shots: ["탑뷰 발견", "궤도 회전", "레이더 탑뷰", "리스트 줌아웃"],
    accent: "#8979ff",
    accentSoft: "rgba(137, 121, 255, 0.2)",
  },
  {
    id: "stack",
    code: "C",
    name: "영상 카드 스택",
    intent: "릴스 카드가 한 장씩 쌓여 역삼역 보관함이 되는 장면",
    strength: "저장된다는 감각이 가장 직접적이에요.",
    lens: "3/4 사선 · 적층",
    reference: "Canopi 컬렉션",
    referenceUrl: "https://mobbin.com/screens/246066eb-4a3b-4076-94ee-540ae6789009",
    referenceUse: "겹친 정보 카드의 깊이",
    imageOffset: 2,
    shots: ["3/4 사선", "카드 적층", "레이어 분해", "겹친 보관함"],
    accent: "#ffb34d",
    accentSoft: "rgba(255, 179, 77, 0.18)",
  },
  {
    id: "signal",
    code: "D",
    name: "장소 단서 신호",
    intent: "캡션·댓글·영상 단서가 한 장소로 연결되는 장면",
    strength: "맛핀이 무엇을 확인하는지 이해하기 쉬워요.",
    lens: "매크로 · 스캔",
    reference: "Crème 저장 피드백",
    referenceUrl: "https://mobbin.com/screens/9cce0c35-df8e-4798-a6e3-a1c894bc71a3",
    referenceUse: "현재 화면을 유지한 완료 신호",
    imageOffset: 3,
    shots: ["매크로 크롭", "신호 스캔", "단서 확대", "데이터 리스트"],
    accent: "#44d5a3",
    accentSoft: "rgba(68, 213, 163, 0.18)",
  },
  {
    id: "station",
    code: "E",
    name: "역별 영상 레일",
    intent: "저장 영상이 역 이름 아래 가로 레일로 정리되는 장면",
    strength: "최종 제품 화면과 가장 가까워요.",
    lens: "측면 · 영상 레일",
    reference: "Beli 저장 목록",
    referenceUrl: "https://mobbin.com/flows/3255694a-faad-444f-914d-4b7c82083fa6",
    referenceUse: "목록 기본·지도 보조",
    imageOffset: 0,
    shots: ["측면 레일", "가로 이동", "역명 도착", "영상 플랫폼"],
    accent: "#67a8ff",
    accentSoft: "rgba(103, 168, 255, 0.19)",
  },
  {
    id: "split",
    code: "F",
    name: "보내기 전후 분할",
    intent: "Instagram의 흩어진 상태와 맛핀의 역별 결과를 좌우로 비교하는 장면",
    strength: "저장 전과 후의 차이를 빠르게 비교해요.",
    lens: "대각 분할 · 전후",
    reference: "Google Maps 반례",
    referenceUrl: "https://mobbin.com/flows/fc8dfce3-bd09-4346-9a97-441f0948cf53",
    referenceUse: "지도 우선 구조는 사용하지 않음",
    imageOffset: 2,
    shots: ["대각 분할", "전후 비교", "원인과 결과", "정리 완료"],
    accent: "#f17ad7",
    accentSoft: "rgba(241, 122, 215, 0.18)",
  },
] as const;

type StoryboardId = (typeof storyboards)[number]["id"];
type Storyboard = (typeof storyboards)[number];

type Review = {
  rating: number;
  note: string;
  shortlisted: boolean;
};

type Reviews = Record<StoryboardId, Review>;

type RoundSnapshot = {
  round: number;
  order: StoryboardId[];
  reviews: Reviews;
  advanced: StoryboardId[];
};

type PersistedState = {
  round: number;
  order: StoryboardId[];
  reviews: Reviews;
  history: RoundSnapshot[];
  winnerId: StoryboardId | null;
};

const initialOrder = storyboards.map((board) => board.id);

function emptyReview(): Review {
  return { rating: 0, note: "", shortlisted: false };
}

function makeReviews(): Reviews {
  return Object.fromEntries(
    storyboards.map((board) => [board.id, emptyReview()]),
  ) as Reviews;
}

function isStoryboardId(value: string): value is StoryboardId {
  return storyboards.some((board) => board.id === value);
}

function parseSavedState(raw: string | null): PersistedState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!Array.isArray(parsed.order)) return null;
    const order = parsed.order.filter((id): id is StoryboardId => typeof id === "string" && isStoryboardId(id));
    if (order.length === 0) return null;

    return {
      round: typeof parsed.round === "number" && parsed.round > 0 ? parsed.round : 1,
      order,
      reviews: { ...makeReviews(), ...parsed.reviews },
      history: Array.isArray(parsed.history) ? parsed.history : [],
      winnerId: typeof parsed.winnerId === "string" && isStoryboardId(parsed.winnerId)
        ? parsed.winnerId
        : null,
    };
  } catch {
    return null;
  }
}

function StoryboardFrames({ board, large = false }: { board: Storyboard; large?: boolean }) {
  const boardReels = reelImages.map(
    (_, index) => reelImages[(index + board.imageOffset) % reelImages.length],
  );
  const boardStyle = {
    "--board-accent": board.accent,
    "--board-accent-soft": board.accentSoft,
  } as CSSProperties;

  return (
    <div
      className={styles.storyboardFrames}
      data-visual={board.id}
      data-large={large ? "true" : "false"}
      style={boardStyle}
      aria-label={`${board.name} 4장면 스토리보드`}
    >
      <article className={styles.storyFrame}>
        <MobileStoryboardScreen number="01" shot={board.shots[0]}>
          <div className={styles.reelScene} aria-hidden="true">
            <Image src={boardReels[0]} alt="" fill sizes={large ? "220px" : "140px"} />
            <div className={styles.reelChrome}><Camera size={10} /><span>Reels</span></div>
            <strong>가고 싶은 곳을<br />발견한 순간</strong>
            <span className={styles.shareCue}><Send size={10} /> 공유</span>
          </div>
        </MobileStoryboardScreen>
        <footer><b>발견</b><span>릴스를 봐요</span></footer>
      </article>

      <article className={styles.storyFrame}>
        <MobileStoryboardScreen number="02" shot={board.shots[1]}>
          <div className={styles.transferScene} aria-hidden="true">
            <span className={styles.transferLine} />
            {[0, 1, 2].map((imageIndex) => (
              <span className={styles.floatingReel} key={boardReels[imageIndex]}>
                <Image src={boardReels[imageIndex]} alt="" fill sizes="70px" />
              </span>
            ))}
            <strong>matpin.kr</strong>
            <span className={styles.sendDot}><Send size={11} /></span>
          </div>
        </MobileStoryboardScreen>
        <footer><b>보내기</b><span>공유 대상을 골라요</span></footer>
      </article>

      <article className={styles.storyFrame}>
        <MobileStoryboardScreen number="03" shot={board.shots[2]}>
          <div className={styles.analyzeScene} aria-hidden="true">
            <span className={styles.analysisCore}>
              <Image src={boardReels[2]} alt="" fill sizes="90px" />
            </span>
            <span className={styles.clueChip}><MessageCircle size={10} /> 댓글</span>
            <span className={styles.clueChip}><Play size={9} /> 영상</span>
            <span className={styles.clueChip}><Sparkles size={10} /> 캡션</span>
            <i /><i /><i />
          </div>
        </MobileStoryboardScreen>
        <footer><b>장소 확인</b><span>릴스 속 단서를 읽어요</span></footer>
      </article>

      <article className={styles.storyFrame}>
        <MobileStoryboardScreen number="04" shot={board.shots[3]}>
          <div className={styles.stationScene} aria-hidden="true">
            <header><span><MapPin size={11} /> 역삼역</span><small>영상 4개</small></header>
            <div>
              {boardReels.map((src) => (
                <span key={src}><Image src={src} alt="" fill sizes="70px" /></span>
              ))}
            </div>
            <strong><Check size={10} /> 역별 저장 완료</strong>
          </div>
        </MobileStoryboardScreen>
        <footer><b>정리</b><span>역별로 다시 찾아요</span></footer>
      </article>
    </div>
  );
}

function MobileStoryboardScreen({ number, shot, children }: { number: string; shot: string; children: ReactNode }) {
  return (
    <div className={styles.mobileScreen}>
      <div className={styles.mobileStatus} aria-hidden="true">
        <time>9:41</time>
        <span>5G&nbsp; ▰</span>
      </div>
      <span className={styles.mobileIsland} aria-hidden="true" />
      <span className={styles.frameNumber}>{number}</span>
      <span className={styles.shotLabel}>{shot}</span>
      {children}
      <span className={styles.mobileHomeBar} aria-hidden="true" />
    </div>
  );
}

function StarRating({ board, review, onChange }: {
  board: Storyboard;
  review: Review;
  onChange: (rating: number) => void;
}) {
  return (
    <fieldset className={styles.ratingField}>
      <legend>별점</legend>
      <div aria-label={`${board.name} 별점 ${review.rating || "미입력"}`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-label={`${score}점 주기`}
            aria-pressed={score <= review.rating}
            onClick={() => onChange(score)}
          >
            <Star size={20} fill={score <= review.rating ? "currentColor" : "none"} />
          </button>
        ))}
        <span>{review.rating ? `${review.rating}.0` : "점수 없음"}</span>
      </div>
    </fieldset>
  );
}

export function MatpinStoryboardRanking() {
  const [round, setRound] = useState(1);
  const [order, setOrder] = useState<StoryboardId[]>(initialOrder);
  const [reviews, setReviews] = useState<Reviews>(makeReviews);
  const [history, setHistory] = useState<RoundSnapshot[]>([]);
  const [winnerId, setWinnerId] = useState<StoryboardId | null>(null);
  const [expandedId, setExpandedId] = useState<StoryboardId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = parseSavedState(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setRound(saved.round);
      setOrder(saved.order);
      setReviews(saved.reviews);
      setHistory(saved.history);
      setWinnerId(saved.winnerId);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const state: PersistedState = { round, order, reviews, history, winnerId };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [history, order, ready, reviews, round, winnerId]);

  useEffect(() => {
    if (!expandedId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedId]);

  const orderedBoards = useMemo(
    () => order.map((id) => storyboards.find((board) => board.id === id)).filter(Boolean) as Storyboard[],
    [order],
  );
  const shortlisted = order.filter((id) => reviews[id]?.shortlisted);
  const winner = winnerId ? storyboards.find((board) => board.id === winnerId) ?? null : null;
  const expandedBoard = expandedId ? storyboards.find((board) => board.id === expandedId) ?? null : null;

  const updateReview = (id: StoryboardId, patch: Partial<Review>) => {
    setReviews((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const moveBoard = (id: StoryboardId, direction: -1 | 1) => {
    setOrder((current) => {
      const from = current.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const advanceRound = () => {
    if (shortlisted.length === 0) return;
    const snapshot: RoundSnapshot = {
      round,
      order: [...order],
      reviews: structuredClone(reviews),
      advanced: [...shortlisted],
    };
    setHistory((current) => [...current, snapshot]);

    if (shortlisted.length === 1) {
      setWinnerId(shortlisted[0]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setRound((current) => current + 1);
    setOrder(shortlisted);
    setReviews(makeReviews());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restoreRound = (historyIndex: number) => {
    const snapshot = history[historyIndex];
    if (!snapshot) return;
    setRound(snapshot.round);
    setOrder(snapshot.order);
    setReviews(snapshot.reviews);
    setHistory((current) => current.slice(0, historyIndex));
    setWinnerId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetAll = () => {
    if (!window.confirm("모든 라운드의 별점과 의견을 지우고 처음부터 시작할까요?")) return;
    setRound(1);
    setOrder(initialOrder);
    setReviews(makeReviews());
    setHistory([]);
    setWinnerId(null);
    setExpandedId(null);
    window.localStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/matpin/motion-lab/mobile-frame" aria-label="맛핀 모바일 프레임으로 돌아가기">
          <ArrowLeft size={19} />
        </Link>
        <div>
          <span>MATPIN DESIGN RANKING</span>
          <strong>스토리보드 선택실</strong>
        </div>
        <button type="button" onClick={resetAll}><RotateCcw size={16} /> 처음부터</button>
      </header>

      <section className={styles.hero}>
        <div>
          <span className={styles.roundEyebrow}>ROUND {String(round).padStart(2, "0")}</span>
          <h1>{winner ? "최종 1위를 정했어요" : "좋은 장면만 남겨보세요"}</h1>
          <p>
            {winner
              ? "이 결정은 브라우저에 저장돼요. 이전 라운드로 돌아가 다시 고를 수도 있어요."
              : "별점과 의견을 남기고 순서를 바꾼 다음, 다음 라운드에 남길 안을 골라주세요."}
          </p>
        </div>
        <aside aria-label="현재 평가 상태">
          <div><small>현재 후보</small><strong>{order.length}</strong></div>
          <div><small>통과 선택</small><strong>{shortlisted.length}</strong></div>
          <div><small>완료 라운드</small><strong>{history.length}</strong></div>
        </aside>
      </section>

      <section className={styles.principleBar} aria-label="평가 기준">
        <strong>이번에 볼 것</strong>
        <span>① 릴스를 보낸다는 행동</span>
        <span>② 흩어진 영상이 모이는 변화</span>
        <span>③ 역별 보관함이라는 결과</span>
      </section>

      {winner ? (
        <section className={styles.winnerSection} aria-live="polite">
          <div className={styles.winnerMark}><Check size={24} /></div>
          <span>YOUR TOP STORYBOARD</span>
          <h2>{winner.code}. {winner.name}</h2>
          <p>{winner.intent}</p>
          <StoryboardFrames board={winner} large />
          <button type="button" onClick={() => restoreRound(Math.max(0, history.length - 1))}>
            마지막 라운드 다시 고르기
          </button>
        </section>
      ) : (
        <section className={styles.rankingList} aria-label={`${round}라운드 스토리보드 후보`}>
          {orderedBoards.map((board, index) => {
            const review = reviews[board.id];
            return (
              <article
                className={styles.rankingCard}
                data-shortlisted={review.shortlisted}
                key={board.id}
                style={{ "--board-accent": board.accent, "--board-accent-soft": board.accentSoft } as CSSProperties}
              >
                <header className={styles.cardHeader}>
                  <span className={styles.rankNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <small>STORYBOARD {board.code}</small>
                    <span className={styles.mobileSpec}>4 MOBILE SCREENS · 390 × 844</span>
                    <h2>{board.name}</h2>
                    <p>{board.intent}</p>
                    <div className={styles.referenceMeta}>
                      <span>{board.lens}</span>
                      <a href={board.referenceUrl} target="_blank" rel="noreferrer">
                        MOBBIN · {board.reference} <ChevronRight size={11} />
                      </a>
                      <em>{board.referenceUse}</em>
                    </div>
                  </div>
                  <div className={styles.rankControls} aria-label={`${board.name} 순위 조정`}>
                    <button type="button" onClick={() => moveBoard(board.id, -1)} disabled={index === 0} aria-label="한 순위 올리기"><ArrowUp size={17} /></button>
                    <button type="button" onClick={() => moveBoard(board.id, 1)} disabled={index === orderedBoards.length - 1} aria-label="한 순위 내리기"><ArrowDown size={17} /></button>
                  </div>
                </header>

                <div className={styles.boardViewport}>
                  <StoryboardFrames board={board} />
                  <button type="button" className={styles.expandButton} onClick={() => setExpandedId(board.id)}>
                    <Expand size={15} /> 크게 보기
                  </button>
                </div>

                <div className={styles.reviewArea}>
                  <div>
                    <StarRating board={board} review={review} onChange={(rating) => updateReview(board.id, { rating })} />
                    <p className={styles.strength}><Sparkles size={14} /> {board.strength}</p>
                  </div>
                  <label className={styles.noteField}>
                    <span>의견 <small>{review.note.length}/240</small></span>
                    <textarea
                      value={review.note}
                      maxLength={240}
                      placeholder="좋았던 점과 아쉬운 점을 적어주세요."
                      onChange={(event) => updateReview(board.id, { note: event.target.value })}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.shortlistButton}
                  aria-pressed={review.shortlisted}
                  onClick={() => updateReview(board.id, { shortlisted: !review.shortlisted })}
                >
                  <span>{review.shortlisted ? <Check size={17} /> : null}</span>
                  {review.shortlisted ? "다음 라운드에 남겨뒀어요" : "다음 라운드에 남기기"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {!winner ? (
        <section className={styles.roundAction}>
          <div>
            <span>{shortlisted.length ? `${shortlisted.length}개 선택됨` : "아직 선택하지 않았어요"}</span>
            <p>
              {shortlisted.length === 0 && "다음 라운드에 남길 안을 하나 이상 골라주세요."}
              {shortlisted.length === 1 && "한 개만 남기면 이 안이 최종 1위가 돼요."}
              {shortlisted.length > 1 && `고른 ${shortlisted.length}개만 남겨 ${round + 1}라운드를 시작해요.`}
            </p>
          </div>
          <button type="button" disabled={shortlisted.length === 0} onClick={advanceRound}>
            {shortlisted.length === 1 ? "이 안을 1위로 확정" : `${round + 1}라운드 시작`}
            <ChevronRight size={18} />
          </button>
        </section>
      ) : null}

      {history.length ? (
        <section className={styles.historySection}>
          <header>
            <span>ROUND HISTORY</span>
            <h2>이전 선택과 의견</h2>
          </header>
          <div className={styles.historyList}>
            {history.map((snapshot, historyIndex) => (
              <article key={`${snapshot.round}-${historyIndex}`}>
                <header>
                  <strong>{snapshot.round}라운드</strong>
                  <span>{snapshot.order.length}개 평가 · {snapshot.advanced.length}개 통과</span>
                  <button type="button" onClick={() => restoreRound(historyIndex)}>이 라운드 다시 편집</button>
                </header>
                <ol>
                  {snapshot.order.map((id, index) => {
                    const board = storyboards.find((item) => item.id === id);
                    const review = snapshot.reviews[id];
                    if (!board) return null;
                    return (
                      <li key={id} data-advanced={snapshot.advanced.includes(id)}>
                        <span>{index + 1}</span>
                        <strong>{board.code}. {board.name}</strong>
                        <small>{review?.rating ? `★ ${review.rating}.0` : "별점 없음"}</small>
                        <p>{review?.note || "의견 없음"}</p>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer className={styles.pageFooter}>
        <p>평가 내용은 이 브라우저에만 저장됩니다. 새 스토리보드 자동 생성 기능은 아직 연결하지 않았어요.</p>
        <a href="https://www.youtube.com/watch?v=BL8cZvMIzi4" target="_blank" rel="noreferrer">참조 영상 보기</a>
      </footer>

      {expandedBoard ? (
        <div className={styles.previewDialog} role="dialog" aria-modal="true" aria-labelledby="storyboard-preview-title">
          <button className={styles.dialogBackdrop} type="button" onClick={() => setExpandedId(null)} aria-label="확대 화면 닫기" />
          <section>
            <header>
              <div>
                <span>STORYBOARD {expandedBoard.code}</span>
                <h2 id="storyboard-preview-title">{expandedBoard.name}</h2>
                <p>{expandedBoard.intent}</p>
                <div className={styles.dialogReference}>
                  <span>{expandedBoard.lens}</span>
                  <a href={expandedBoard.referenceUrl} target="_blank" rel="noreferrer">
                    {expandedBoard.reference} 참고 <ChevronRight size={11} />
                  </a>
                </div>
              </div>
              <button type="button" onClick={() => setExpandedId(null)} aria-label="닫기"><X size={21} /></button>
            </header>
            <StoryboardFrames board={expandedBoard} large />
          </section>
        </div>
      ) : null}
    </main>
  );
}
