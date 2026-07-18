"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  CHANGE_KIND_LABELS,
  IDEA_LAB_AXIS_META,
  KOREA_POPULAR_IDEA_LAB_SCENARIOS as IDEA_LAB_SCENARIOS,
  PLATFORM_LABELS,
} from "./sample-data";
import {
  buildDevelopmentInitPrompt,
  buildImagePrompt,
  buildIdeaResult,
  buildPrompt,
  IDEA_LAB_SEEN_SCENARIOS_KEY,
  initialScenarioIndex,
  nextScenarioIndex,
  optionFor,
  type ChoiceIndexes,
} from "./model";
import {
  IDEA_LAB_AXIS_IDS,
  type IdeaLabAxisId,
  type IdeaLabOption,
  type IdeaLabProps,
  type IdeaLabSelection,
  type IdeaLabSharePayload,
  type IdeaLabShareResult,
  type IdeaLabSourceOption,
  type IdeaLabTwistOption,
} from "./types";
import { FanDeck, FourCardCell, type DeckCard, type FanDeckHandle } from "../four-card";
import { CARD_SURFACE_CSS } from "../slot/card-surface";
import { copyText } from "@/lib/copy-text";
import {
  loadRememberedIdeaTasteAnswers,
  rememberIdeaTasteAnswer,
} from "@/lib/backend/idea-taste";
import {
  EMPTY_IDEA_TASTE_PROFILE,
  ideaTasteProfileFromAnswers,
  makeIdeaTasteAnswer,
  nextIdeaTasteQuestion,
  recommendIdeaForTaste,
  recordIdeaTasteAnswer,
  type IdeaTasteChoice,
  type IdeaTasteProfile,
  type IdeaTasteQuestion,
} from "@/lib/idea-taste";
import { ideaLabReadablePauseMs } from "@/lib/idea-lab-timing";
import { josa } from "@/lib/josa";
import { shareToKakao } from "@/lib/kakao-share";
import { track, trackIdeaFunnelEvent } from "@/lib/track";

type Revealed = Record<IdeaLabAxisId, boolean>;
type PinnedOptions = Partial<{
  source: IdeaLabSourceOption;
  payer: IdeaLabOption;
  moment: IdeaLabOption;
  twist: IdeaLabTwistOption;
}>;
/** 한 라우트 안에서 한 번에 하나의 화면만 렌더한다. */
type Stage = "draw" | "taste" | "result";
type CopiedArtifact = "development" | "image" | "brief";
type CompletionPhase = "idle" | "gather" | "settle" | "glow" | "focus" | "breathe";
type ResultEntry = "default" | "handoff" | "shared";

const EMPTY_REVEALED: Revealed = { source: false, payer: false, moment: false, twist: false };
const DEFAULT_CHOICES: ChoiceIndexes = { source: 0, payer: 0, moment: 0, twist: 0 };
/** 아크 비행 260ms · 카드 앞면을 읽는 안착 후 대기 · 결과 등장 */
const FLIGHT_MS = 260;
const AUTO_STEP_MS = ideaLabReadablePauseMs({
  e2e: process.env.NEXT_PUBLIC_E2E === "1",
  e2eOverride: process.env.NEXT_PUBLIC_E2E_IDEA_AUTO_STEP_MS,
});
const COMPLETE_SETTLE_AT_MS = 180;
const COMPLETE_GLOW_AT_MS = 280;
const COMPLETE_FOCUS_AT_MS = 420;
const COMPLETE_BREATHE_AT_MS = 580;
const COMPLETE_RESULT_MS = 720;
const COMPLETE_REDUCED_MS = 80;

const GUIDE_COPY = [
  {
    title: "오늘 만들 아이디어를 한 장씩 뽑아보세요",
    description: "네 장을 조합하면 바로 만들 수 있는 아이디어가 완성돼요.",
  },
  {
    title: "누가 돈을 낼까요?",
    description: "다음 카드를 뽑아 돈 낼 사람을 정해보세요.",
  },
  {
    title: "언제 이 앱이 필요할까요?",
    description: "다음 카드를 뽑아 필요한 순간을 정해보세요.",
  },
  {
    title: "무엇을 하나 바꿀까요?",
    description: "마지막 카드를 뽑아 한 끗 변화를 정해보세요.",
  },
  {
    title: "아이디어가 완성됐어요",
    description: "",
  },
] as const;

const AXIS_LABELS: Record<string, string> = {
  source: IDEA_LAB_AXIS_META.source.label,
  payer: IDEA_LAB_AXIS_META.payer.label,
  moment: IDEA_LAB_AXIS_META.moment.label,
  twist: IDEA_LAB_AXIS_META.twist.label,
};

type CarouselPosition = "active" | "previous" | "next" | "before" | "after";

/** 드래그 중에는 부모 CSS 변수가 아니라 각 카드에 transform을 직접 적용한다. */
const carouselTransform = (position: CarouselPosition, dragX: number) => {
  switch (position) {
    case "active":
      return `translate(calc(-50% + ${dragX}px),calc(-50% + var(--carousel-y,0px))) scale(1)`;
    case "previous":
      return `translate(calc(-100% + 48px + ${dragX}px),calc(-50% + var(--carousel-y,0px))) scale(.88)`;
    case "next":
      return `translate(calc(-48px + ${dragX}px),calc(-50% + var(--carousel-y,0px))) scale(.88)`;
    case "before":
      return `translate(calc(-50% + ${dragX}px),calc(-50% + var(--carousel-y,0px))) translateX(-190%) scale(.78)`;
    case "after":
      return `translate(calc(-50% + ${dragX}px),calc(-50% + var(--carousel-y,0px))) translateX(190%) scale(.78)`;
  }
};

const axisLabelAsObject = (axis: IdeaLabAxisId) => {
  const label = IDEA_LAB_AXIS_META[axis].label;
  return `‘${label}’${josa(label, "을/를").slice(label.length)}`;
};

/** 뒷면 익명 카드 벨트. 값은 도메인이 결정하므로 덱 카드는 축 스킨만 담는다. */
const DECK_POOL: DeckCard[] = Array.from({ length: 16 }, (_, index) => {
  const axis = IDEA_LAB_AXIS_IDS[index % IDEA_LAB_AXIS_IDS.length];
  return { axis, key: `deck-${index}`, label: IDEA_LAB_AXIS_META[axis].label };
});
const SCENARIO_IDS = new Set(IDEA_LAB_SCENARIOS.map((scenario) => scenario.id));

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const waitForPaint = () => new Promise<void>((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
});
const isReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Apple의 projected-position 방식: 빠른 짧은 스와이프도 손가락의 의도를 보존한다. */
const projectGesture = (velocityPxPerMs: number, decelerationRate = 0.99) =>
  velocityPxPerMs * decelerationRate / (1 - decelerationRate);

/** 캐러셀 끝에서는 고정 배율 대신 뷰포트 폭에 비례한 고무줄 저항을 적용한다. */
const rubberband = (distance: number, dimension: number, constant = 0.55) => {
  const safeDimension = Math.max(1, dimension);
  const magnitude = Math.abs(distance);
  const resisted = (1 - 1 / (magnitude * constant / safeDimension + 1)) * safeDimension;
  return Math.sign(distance) * resisted;
};

export function IdeaLab({ initialScenarioId, onShare, onDraftReady, onViewPraise, className }: IdeaLabProps) {
  const [scenarioIndex, setScenarioIndex] = useState(() => initialScenarioIndex(initialScenarioId));
  const [choiceIndexes, setChoiceIndexes] = useState<ChoiceIndexes>(DEFAULT_CHOICES);
  const [revealed, setRevealed] = useState<Revealed>(EMPTY_REVEALED);
  const [pinnedOptions, setPinnedOptions] = useState<PinnedOptions>({});
  const [replacementAxis, setReplacementAxis] = useState<IdeaLabAxisId | null>(null);
  const [busy, setBusy] = useState(false);
  const [hotAxis, setHotAxis] = useState<IdeaLabAxisId | null>(null);
  const [focusedAxis, setFocusedAxis] = useState<IdeaLabAxisId>("source");
  const [readingAxis, setReadingAxis] = useState<IdeaLabAxisId | null>(null);
  const [carouselDragX, setCarouselDragX] = useState(0);
  const [carouselDragging, setCarouselDragging] = useState(false);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [stage, setStage] = useState<Stage>("draw");
  const [completionPhase, setCompletionPhase] = useState<CompletionPhase>("idle");
  const [resultEntry, setResultEntry] = useState<ResultEntry>("default");
  const [tasteQuestion, setTasteQuestion] = useState<IdeaTasteQuestion | null>(null);
  const [tasteApplied, setTasteApplied] = useState(false);
  const [message, setMessage] = useState("네 장을 먼저 뽑아보세요.");
  const [copiedArtifact, setCopiedArtifact] = useState<CopiedArtifact | null>(null);

  const deckRef = useRef<FanDeckHandle>(null);
  const drawStageRef = useRef<HTMLDivElement>(null);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStageRef = useRef(stage);
  const copyResetTimerRef = useRef<number | null>(null);
  const cellRefs = useRef<Partial<Record<IdeaLabAxisId, HTMLElement | null>>>({});
  const seenScenarioIdsRef = useRef<Set<string> | null>(null);
  const startedScenarioRef = useRef(false);
  const revealedRef = useRef(revealed);
  const autoDrawingRef = useRef(false);
  const attemptRef = useRef(0);
  const viewTrackedRef = useRef(false);
  const completionStartedRef = useRef(false);
  const tasteProfileRef = useRef<IdeaTasteProfile>(EMPTY_IDEA_TASTE_PROFILE);
  const tasteStorageRef = useRef<"database" | "local" | null>(null);
  const carouselDragRef = useRef({
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastAt: 0,
    velocityX: 0,
    dragging: false,
  });
  const suppressCarouselClickRef = useRef(false);
  revealedRef.current = revealed;

  const seenScenarioIds = () => {
    if (seenScenarioIdsRef.current) return seenScenarioIdsRef.current;
    const seen = new Set<string>();
    try {
      const stored = JSON.parse(localStorage.getItem(IDEA_LAB_SEEN_SCENARIOS_KEY) ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        stored.forEach((id) => {
          if (typeof id === "string" && SCENARIO_IDS.has(id)) seen.add(id);
        });
      }
    } catch {
      // 기록이 깨져도 카드 뽑기는 계속 동작한다.
    }
    seenScenarioIdsRef.current = seen;
    return seen;
  };

  const rememberScenario = (index: number) => {
    const seen = seenScenarioIds();
    seen.add(IDEA_LAB_SCENARIOS[index].id);
    try {
      localStorage.setItem(IDEA_LAB_SEEN_SCENARIOS_KEY, JSON.stringify([...seen]));
    } catch {
      // 저장이 막힌 브라우저에서는 현재 세션의 ref만 사용한다.
    }
  };

  const chooseScenarioForNextIdea = () => {
    const explicitInitialIndex = initialScenarioId ? initialScenarioIndex(initialScenarioId) : -1;
    if (!startedScenarioRef.current && explicitInitialIndex >= 0) {
      startedScenarioRef.current = true;
      rememberScenario(explicitInitialIndex);
      return explicitInitialIndex;
    }

    const seen = seenScenarioIds();
    if (seen.size >= IDEA_LAB_SCENARIOS.length) {
      seen.clear();
      seen.add(IDEA_LAB_SCENARIOS[scenarioIndex].id);
    }
    const nextIndex = nextScenarioIndex(seen, scenarioIndex);
    startedScenarioRef.current = true;
    rememberScenario(nextIndex);
    return nextIndex;
  };

  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];

  const resolved = useMemo(() => {
    const result = {} as Record<IdeaLabAxisId, ReturnType<typeof optionFor> | null>;
    IDEA_LAB_AXIS_IDS.forEach((axis) => {
      if (!revealed[axis]) {
        result[axis] = null;
        return;
      }
      result[axis] = pinnedOptions[axis] ?? optionFor(axis, scenarioIndex, choiceIndexes);
    });
    return result;
  }, [choiceIndexes, pinnedOptions, revealed, scenarioIndex]);

  const complete = IDEA_LAB_AXIS_IDS.every((axis) => resolved[axis] !== null);
  const aimAxis = IDEA_LAB_AXIS_IDS.find((axis) => !revealed[axis]) ?? null;
  const inactiveAxes = IDEA_LAB_AXIS_IDS.filter((axis) => revealed[axis]);
  const completedCount = inactiveAxes.length;
  const carouselAxis = replacementAxis ?? readingAxis ?? focusedAxis;
  const carouselIndex = IDEA_LAB_AXIS_IDS.indexOf(carouselAxis);
  const maxNavigableIndex = complete
    ? IDEA_LAB_AXIS_IDS.length - 1
    : Math.min(completedCount, IDEA_LAB_AXIS_IDS.length - 1);
  const canNavigateCarousel = !busy && !replacementAxis && maxNavigableIndex > 0;
  const guideCopy = replacementAxis
    ? {
        title: `${IDEA_LAB_AXIS_META[replacementAxis].label} 교체`,
        description: "새 카드를 뽑아 이 한 장만 바꿔보세요.",
      }
    : GUIDE_COPY[completedCount];
  const completing = completionPhase !== "idle";

  const selection = useMemo<IdeaLabSelection | null>(() => complete
    ? ({
        source: resolved.source as IdeaLabSourceOption,
        payer: resolved.payer as IdeaLabOption,
        moment: resolved.moment as IdeaLabOption,
        twist: resolved.twist as IdeaLabTwistOption,
      } satisfies IdeaLabSelection)
    : null, [complete, resolved]);
  const prompt = useMemo(() => selection ? buildPrompt(selection) : "", [selection]);
  const promptLines = useMemo(() => prompt ? prompt.split("\n") : [], [prompt]);
  const developmentPrompt = useMemo(
    () => selection ? buildDevelopmentInitPrompt(selection) : "",
    [selection],
  );
  const imagePrompt = useMemo(
    () => selection ? buildImagePrompt(selection) : "",
    [selection],
  );
  const ideaResult = useMemo(() => selection ? buildIdeaResult(selection) : null, [selection]);
  const ideaResultLabel = ideaResult ? `${ideaResult.title}. ${ideaResult.summary}` : "";

  useEffect(() => {
    if (stage === "draw" && drawStageRef.current) drawStageRef.current.scrollTop = 0;
  }, [completedCount, replacementAxis, stage]);

  useEffect(() => {
    if (previousStageRef.current === stage) return;
    previousStageRef.current = stage;
    const frame = window.requestAnimationFrame(() => {
      stageHeadingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stage]);

  useEffect(() => () => {
    if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current);
  }, []);

  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    trackIdeaFunnelEvent("idea_lab_viewed");
  }, []);

  useEffect(() => {
    let active = true;
    void loadRememberedIdeaTasteAnswers().then((answers) => {
      if (!active) return;
      const rememberedProfile = ideaTasteProfileFromAnswers(answers);
      tasteProfileRef.current = rememberedProfile;
    });
    return () => {
      active = false;
    };
  }, []);

  const navigateCarousel = (direction: -1 | 1) => {
    if (busy || replacementAxis) return;
    const carouselLength = maxNavigableIndex + 1;
    if (carouselLength <= 1) return;
    const targetIndex = (carouselIndex + direction + carouselLength) % carouselLength;
    if (targetIndex === carouselIndex) return;
    setFocusedAxis(IDEA_LAB_AXIS_IDS[targetIndex]);
  };

  const resetCarouselDrag = () => {
    carouselDragRef.current = {
      pointerId: -1,
      startX: 0,
      lastX: 0,
      lastAt: 0,
      velocityX: 0,
      dragging: false,
    };
    setCarouselDragX(0);
    setCarouselDragging(false);
  };

  const onCarouselPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      busy
      || replacementAxis
      || carouselDragRef.current.pointerId !== -1
      || (event.pointerType === "mouse" && event.button !== 0)
    ) return;
    carouselDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastAt: event.timeStamp,
      velocityX: 0,
      dragging: false,
    };
  };

  const onCarouselPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = carouselDragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const rawX = event.clientX - drag.startX;
    const elapsed = Math.max(1, event.timeStamp - drag.lastAt);
    const instantVelocity = (event.clientX - drag.lastX) / elapsed;
    drag.velocityX = drag.velocityX * 0.25 + instantVelocity * 0.75;
    drag.lastX = event.clientX;
    drag.lastAt = event.timeStamp;
    if (!drag.dragging && Math.abs(rawX) < 7) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    drag.dragging = true;
    setCarouselDragging(true);
    event.preventDefault();
    const atStart = carouselIndex === 0 && rawX > 0;
    const atEnd = carouselIndex === maxNavigableIndex && rawX < 0;
    const resistedX = atStart || atEnd
      ? rubberband(rawX, event.currentTarget.clientWidth)
      : rawX;
    setCarouselDragX(Math.max(-96, Math.min(96, resistedX)));
  };

  const onCarouselPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = carouselDragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const threshold = Math.min(64, event.currentTarget.clientWidth * 0.16);
    const velocityX = event.timeStamp - drag.lastAt <= 80 ? drag.velocityX : 0;
    const projectedX = deltaX + projectGesture(velocityX);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.dragging) {
      suppressCarouselClickRef.current = true;
      window.setTimeout(() => { suppressCarouselClickRef.current = false; }, 0);
      const intendedX = Math.abs(deltaX) >= threshold ? deltaX : projectedX;
      if (Math.abs(intendedX) >= threshold) navigateCarousel(intendedX < 0 ? 1 : -1);
    }
    resetCarouselDrag();
  };

  const onCarouselPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (carouselDragRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetCarouselDrag();
  };

  const onCarouselClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressCarouselClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressCarouselClickRef.current = false;
  };

  const optionsForAxis = (axis: IdeaLabAxisId): IdeaLabOption[] =>
    axis === "payer" ? scenario.payers : axis === "moment" ? scenario.moments : scenario.twists;

  /** 한 축을 랜덤 후보로 채워 공개한다 (source는 시나리오당 하나라 공개만) */
  const fillAxis = (axis: IdeaLabAxisId) => {
    if (axis === "source") {
      setRevealed((current) => ({ ...current, source: true }));
      return;
    }
    const options = optionsForAxis(axis);
    const index = Math.floor(Math.random() * options.length);
    setChoiceIndexes((current) => ({ ...current, [axis]: index }));
    setPinnedOptions((current) => ({ ...current, [axis]: undefined }));
    setRevealed((current) => ({ ...current, [axis]: true }));
  };

  /** 교체 덱에서 도착한 카드로 선택한 한 축만 바꾼다. */
  const replaceDrawnAxis = (axis: IdeaLabAxisId) => {
    if (axis === "source") {
      const nextIndex = chooseScenarioForNextIdea();
      const nextScenario = IDEA_LAB_SCENARIOS[nextIndex];
      setScenarioIndex(nextIndex);
      setChoiceIndexes({
        source: 0,
        payer: Math.floor(Math.random() * nextScenario.payers.length),
        moment: Math.floor(Math.random() * nextScenario.moments.length),
        twist: Math.floor(Math.random() * nextScenario.twists.length),
      });
      setPinnedOptions({});
      setMessage("검증된 원본이 바뀌어 나머지 세 장도 새 원본에 맞췄어요.");
    } else {
      const options = optionsForAxis(axis);
      const nextIndex = options.findIndex((option) => option.id !== resolved[axis]?.id);
      setChoiceIndexes((current) => ({ ...current, [axis]: Math.max(0, nextIndex) }));
      setPinnedOptions((current) => ({ ...current, [axis]: undefined }));
      setMessage(`${IDEA_LAB_AXIS_META[axis].label} 카드만 새로 뽑았어요.`);
    }
    setPromptUnlocked(false);
    setReplacementAxis(null);
    setHotAxis(null);
  };

  /** 덱 카드가 안착한 실제 축만 채운다. 빈칸 탭과 드롭이 같은 비행 경로를 쓴다. */
  const onDeckPick = (_card: DeckCard, targetAxis: string) => {
    const axis = targetAxis as IdeaLabAxisId;
    if (!IDEA_LAB_AXIS_IDS.includes(axis)) return;
    if (replacementAxis) {
      if (axis === replacementAxis) replaceDrawnAxis(axis);
      return;
    }
    if (revealedRef.current[axis]) return;
    const nextCount = IDEA_LAB_AXIS_IDS.filter((item) => revealedRef.current[item]).length + 1;
    const drawMethod = autoDrawingRef.current ? "auto_fill" : "manual";
    if (nextCount === 1) {
      attemptRef.current += 1;
      trackIdeaFunnelEvent("idea_first_card_drawn", {
        attempt: attemptRef.current,
        draw_method: drawMethod,
      });
    }
    if (nextCount === IDEA_LAB_AXIS_IDS.length) {
      trackIdeaFunnelEvent("idea_four_cards_completed", {
        attempt: attemptRef.current,
        draw_method: drawMethod,
      });
    }
    fillAxis(axis);
    setFocusedAxis(axis);
    setReadingAxis(axis);
    setPromptUnlocked(false);
    setMessage(nextCount >= IDEA_LAB_AXIS_IDS.length
      ? "친구에게 먼저 알리고, 실제 반응을 받은 뒤 만들기 시작해보세요."
      : `${IDEA_LAB_AXIS_META[axis].label} 카드가 도착했어요.`);
    if (!autoDrawingRef.current) {
      const nextAxis = IDEA_LAB_AXIS_IDS[IDEA_LAB_AXIS_IDS.indexOf(axis) + 1];
      if (nextAxis) setFocusedAxis(nextAxis);
      setBusy(false);
      void waitForReadablePause().then(() => {
        setReadingAxis((current) => current === axis ? null : current);
      });
    }
  };

  const getTargetRect = (axis: string) =>
    (autoDrawingRef.current && axis !== carouselAxis
      ? cellRefs.current[carouselAxis]
      : cellRefs.current[axis as IdeaLabAxisId])?.getBoundingClientRect() ?? null;

  const waitForReadablePause = async () => {
    // 모션은 줄여도 읽을 시간은 줄이지 않는다. 카드 앞면이 그려진 뒤부터 시간을 센다.
    await waitForPaint();
    await wait(AUTO_STEP_MS);
  };

  const drawSingle = (axis: IdeaLabAxisId, skipMotion = false) => {
    if (busy || revealedRef.current[axis]) return;
    if (axis === "source") setScenarioIndex(chooseScenarioForNextIdea());
    setFocusedAxis(axis);
    setReadingAxis(null);
    setBusy(true);
    autoDrawingRef.current = false;
    setPromptUnlocked(false);
    setHotAxis(null);
    setMessage(`${IDEA_LAB_AXIS_META[axis].label} 카드를 가져오고 있어요.`);
    const ok = deckRef.current?.drawTo(axis, () => undefined, skipMotion);
    if (ok) return;
    onDeckPick(DECK_POOL[0], axis);
  };

  const startReplacement = (axis: IdeaLabAxisId) => {
    if (!complete || busy) return;
    setFocusedAxis(axis);
    setReplacementAxis(axis);
    setHotAxis(null);
    setMessage(`새 카드를 뽑아 ${axisLabelAsObject(axis)} 교체하세요.`);
  };

  const cancelReplacement = () => {
    setReplacementAxis(null);
    setHotAxis(null);
    setMessage("교체를 취소했어요. 네 장은 그대로예요.");
  };

  const goResult = useCallback((entry: ResultEntry = "default") => {
    if (!selection) return;
    trackIdeaFunnelEvent("idea_result_viewed", { attempt: attemptRef.current });
    setReplacementAxis(null);
    setMessage(tasteApplied
      ? tasteStorageRef.current === "database"
        ? "방금 답한 한 가지 취향을 계정에 기억하고 새 결과에 반영했어요."
        : "방금 답한 한 가지 취향을 이 기기에 기억하고 새 결과에 반영했어요."
      : "친구에게 먼저 알리고, 실제 반응을 받은 뒤 만들기 시작해보세요.");
    setResultEntry(entry);
    setStage("result");
  }, [selection, tasteApplied]);

  const startTasteSurvey = () => {
    if (!selection) return;
    const question = nextIdeaTasteQuestion(tasteProfileRef.current);
    completionStartedRef.current = false;
    setCompletionPhase("idle");
    setResultEntry("default");
    setBusy(false);
    setPromptUnlocked(false);
    setReplacementAxis(null);
    setReadingAxis(null);
    setHotAxis(null);
    setTasteQuestion(question);
    setTasteApplied(false);
    tasteStorageRef.current = null;
    track("idea_taste_question_viewed", {
      question_id: question.id,
      prior_answer_count: tasteProfileRef.current.answerCount,
    });
    setStage("taste");
  };

  const chooseTasteChoice = (choice: IdeaTasteChoice) => {
    if (!tasteQuestion) return;
    const answer = makeIdeaTasteAnswer(tasteQuestion.id, choice.id);
    if (!answer) return;
    const nextProfile = recordIdeaTasteAnswer(
      tasteProfileRef.current,
      tasteQuestion.id,
      choice.id,
    );
    const recommendation = recommendIdeaForTaste(
      IDEA_LAB_SCENARIOS,
      nextProfile,
      seenScenarioIds(),
      scenarioIndex,
    );
    tasteProfileRef.current = nextProfile;
    setTasteQuestion(null);
    void rememberIdeaTasteAnswer(answer).then((storage) => {
      tasteStorageRef.current = storage;
      setMessage(storage === "database"
        ? "한 가지 취향을 계정에 기억하고 새 결과에 반영했어요."
        : "한 가지 취향을 이 기기에 기억하고 새 결과에 반영했어요.");
    });
    track("idea_taste_answered", {
      question_id: answer.questionId,
      answer_id: answer.answerId,
      trait_id: answer.traitId,
    });
    attemptRef.current += 1;
    trackIdeaFunnelEvent("idea_four_cards_completed", {
      attempt: attemptRef.current,
      draw_method: "taste_answer",
    });
    rememberScenario(recommendation.scenarioIndex);
    setScenarioIndex(recommendation.scenarioIndex);
    setChoiceIndexes(recommendation.choiceIndexes);
    setPinnedOptions({});
    setRevealed({ source: true, payer: true, moment: true, twist: true });
    setFocusedAxis("twist");
    setReadingAxis(null);
    setTasteApplied(true);
    setMessage("한 가지 답을 반영해 새 결과를 고르고 있어요.");
    completionStartedRef.current = false;
    setCompletionPhase("idle");
    setStage("draw");
  };

  const cancelTasteSurvey = () => {
    setTasteQuestion(null);
    setTasteApplied(false);
    setResultEntry("default");
    setStage("result");
  };

  useEffect(() => {
    if (stage !== "draw" || !selection || replacementAxis) {
      completionStartedRef.current = false;
      return;
    }
    if (completionStartedRef.current) return;
    completionStartedRef.current = true;
    autoDrawingRef.current = false;
    setBusy(false);
    const reducedMotion = isReduced();
    setCompletionPhase(reducedMotion ? "focus" : "gather");
    const settleTimer = reducedMotion
      ? null
      : window.setTimeout(() => setCompletionPhase("settle"), COMPLETE_SETTLE_AT_MS);
    const glowTimer = reducedMotion
      ? null
      : window.setTimeout(() => setCompletionPhase("glow"), COMPLETE_GLOW_AT_MS);
    const focusTimer = reducedMotion
      ? null
      : window.setTimeout(() => setCompletionPhase("focus"), COMPLETE_FOCUS_AT_MS);
    const breatheTimer = reducedMotion
      ? null
      : window.setTimeout(() => setCompletionPhase("breathe"), COMPLETE_BREATHE_AT_MS);
    const resultTimer = window.setTimeout(() => {
      completionStartedRef.current = false;
      const finish = (entry: ResultEntry) => {
        setCompletionPhase("idle");
        goResult(entry);
      };
      const transitionDocument = document as Document & {
        startViewTransition?: (update: () => void) => unknown;
      };
      if (!reducedMotion && transitionDocument.startViewTransition) {
        transitionDocument.startViewTransition(() => {
          flushSync(() => finish("shared"));
        });
      } else {
        finish("handoff");
      }
    }, reducedMotion ? COMPLETE_REDUCED_MS : COMPLETE_RESULT_MS);
    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (glowTimer !== null) window.clearTimeout(glowTimer);
      if (focusTimer !== null) window.clearTimeout(focusTimer);
      if (breatheTimer !== null) window.clearTimeout(breatheTimer);
      window.clearTimeout(resultTimer);
    };
  }, [goResult, replacementAxis, selection, stage]);

  const sharePayload = useMemo<IdeaLabSharePayload | null>(() => selection
    ? ({
        title: selection.twist.resultTitle,
        summary: ideaResult!.uvp,
        prompt,
        developmentPrompt,
        imagePrompt,
        platform: selection.twist.platform,
        selection,
      } satisfies IdeaLabSharePayload)
    : null, [developmentPrompt, ideaResult, imagePrompt, prompt, selection]);

  useEffect(() => {
    if (sharePayload) onDraftReady?.(sharePayload);
  }, [onDraftReady, sharePayload]);

  const shareAndUnlock = async () => {
    if (!sharePayload || busy) return;
    setBusy(true);
    let result: IdeaLabShareResult = { ok: false, method: "kakao" };
    const url = window.location.href;
    try {
      if (onShare) {
        result = await onShare(sharePayload);
      } else {
        result = await shareToKakao(url, {
          title: sharePayload.title,
          text: `${sharePayload.summary}\n원본에서 한 곳만 바꾼 아이디어예요. 어떻게 생각해?`,
        });
      }
    } finally {
      setBusy(false);
    }
    if (result.ok) {
      setPromptUnlocked(true);
      setPromptExpanded(false);
      setMessage("카카오톡 공유 화면을 열었어요. 오늘 만들 자료가 열렸습니다.");
    } else {
      setMessage(
        result.reason === "not_configured" || result.reason === "sdk_unavailable"
          ? "카카오톡 공유를 준비하지 못했어요. 잠시 후 다시 시도해 주세요."
          : "카카오톡 공유 화면을 열지 못했어요. 결과는 그대로 보관돼요.",
      );
    }
  };

  const copyArtifact = async (
    artifact: CopiedArtifact,
    value: string,
    label: string,
  ) => {
    if (!promptUnlocked || !value) return;
    const success = await copyText(value);
    setCopiedArtifact(success ? artifact : null);
    setMessage(success ? `${label}를 복사했어요.` : "복사가 막혔어요. 문구를 직접 선택해 주세요.");
    if (success) {
      if (copyResetTimerRef.current !== null) window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = window.setTimeout(
        () => setCopiedArtifact((current) => current === artifact ? null : current),
        1800,
      );
    }
  };

  return (
    <section
      className={`idea-lab ${className ?? ""}`}
      data-stage={stage}
      aria-label="검증된 원본에서 시작하는 네 장 아이디어 제작기"
    >
      <style suppressHydrationWarning>{IDEA_LAB_CSS}</style>
      <style>{CARD_SURFACE_CSS}</style>

      {/* ── A1 뽑기 스테이지 ─────────────────────────────────────── */}
      {stage === "draw" ? (
        <div
          ref={drawStageRef}
          className={`idea-lab__stage idea-lab__stage--draw ${completing ? `is-completing is-completion-${completionPhase}` : ""}`}
          data-anim
          data-readable-pause-ms={AUTO_STEP_MS}
          data-reading-axis={readingAxis ?? undefined}
          data-scenario-id={selection ? scenario.id : undefined}
          data-replacement-axis={replacementAxis ?? undefined}
          data-completion-phase={completionPhase}
        >
          <header className={`idea-lab__appbar ${!selection ? "is-guide" : ""} ${selection ? "is-complete" : ""} ${selection && !replacementAxis && !completing ? "is-summary" : ""} ${completing ? "is-completion-message" : ""}`}>
            <div className="idea-lab__appbar-row">
              <div className="idea-lab__intro">
                <h1
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="idea-lab__appbar-title outline-none"
                >
                  {completing ? "아이디어가 완성됐어요" : guideCopy.title}
                </h1>
                {!completing && guideCopy.description ? (
                  <p className="idea-lab__appbar-description">{guideCopy.description}</p>
                ) : null}
              </div>
              {selection && !completing ? (
                replacementAxis ? (
                  <button type="button" className="idea-lab__cancel-replacement" onClick={cancelReplacement}>
                    교체 취소
                  </button>
                ) : (
                  <span className="idea-lab__complete-hint">카드 눌러 교체</span>
                )
              ) : null}
            </div>
            {selection && !completing ? (
              <div
                className={`idea-lab__appbar-result ${replacementAxis ? "is-replacing" : ""}`}
              >
                {replacementAxis ? (
                  <p className="idea-lab__replace-instruction">덱에서 새 카드를 뽑으세요.</p>
                ) : (
                  <output className="idea-lab__idea-preview" aria-label={ideaResultLabel}>
                    <strong>{ideaResult!.title}</strong>
                    <span>{ideaResult!.summary}</span>
                    <small>검수 원본 · {selection.source.sourceName}</small>
                  </output>
                )}
              </div>
            ) : null}
            <p className="idea-lab__status" aria-live="polite">{message}</p>
          </header>

          <div
            className={`idea-lab__slots ${carouselDragging ? "is-dragging" : ""}`}
            role="list"
            aria-label="아이디어 카드 캐러셀"
            data-dragging={carouselDragging ? "true" : "false"}
            onPointerDown={onCarouselPointerDown}
            onPointerMove={onCarouselPointerMove}
            onPointerUp={onCarouselPointerUp}
            onPointerCancel={onCarouselPointerCancel}
            onClickCapture={onCarouselClickCapture}
          >
            {IDEA_LAB_AXIS_IDS.map((axis, index) => {
              const meta = IDEA_LAB_AXIS_META[axis];
              const value = resolved[axis];
              const sourceValue = axis === "source" && value ? (value as IdeaLabSourceOption) : null;
              const twistValue = axis === "twist" && value ? (value as IdeaLabTwistOption) : null;
              const eyebrow = sourceValue
                ? `${sourceValue.sourceName} · ${PLATFORM_LABELS[sourceValue.platform]}`
                : twistValue
                  ? `${CHANGE_KIND_LABELS[twistValue.kind]} · ${PLATFORM_LABELS[twistValue.platform]}`
                  : undefined;
              const content = value
                ? { eyebrow: eyebrow ?? meta.label, value: value.value, detail: value.detail }
                : null;
              const contentKey = value ? `${axis}:${value.id}` : "";
              const offset = index - carouselIndex;
              const carouselPosition: CarouselPosition = offset === 0
                ? "active"
                : offset === -1
                  ? "previous"
                  : offset === 1
                    ? "next"
                    : offset < 0
                      ? "before"
                      : "after";
              const isActive = carouselPosition === "active";
              return (
                <article
                  key={axis}
                  className={`idea-lab__slot is-carousel-${carouselPosition} ${value ? "is-filled" : ""} ${aimAxis === axis && !busy ? "is-aim" : ""} ${hotAxis === axis ? "is-hot" : ""} ${replacementAxis === axis ? "is-replacing" : ""} ${replacementAxis && replacementAxis !== axis ? "is-replacement-muted" : ""} ${completing && axis === "twist" ? "is-handoff-source" : ""}`}
                  data-axis={axis}
                  data-axis-label={meta.label}
                  data-value={value?.value ?? ""}
                  data-carousel-position={carouselPosition}
                  aria-current={isActive ? "step" : undefined}
                  style={{
                    "--axis": meta.color,
                    "--axis-soft": meta.softColor,
                    "--card-order": index,
                    "--pile-x": `${(index - 1.5) * 4}px`,
                    "--pile-y": `${Math.abs(index - 1.5) * 2}px`,
                    "--pile-rotate": `${(index - 1.5) * -2.2}deg`,
                    transform: carouselTransform(carouselPosition, carouselDragX),
                  } as CSSProperties}
                >
                  <div className="idea-lab__slot-label"><span>{String(index + 1).padStart(2, "0")}</span>{meta.label}</div>
                  <FourCardCell
                    ref={(node) => { cellRefs.current[axis] = node; }}
                    axisLabel={meta.label}
                    axisColor={meta.color}
                    axisIndex={index}
                    content={content}
                    contentKey={contentKey}
                    hot={hotAxis === axis}
                    pulse={aimAxis === axis && !busy}
                    badge={value ? undefined : `${index + 1}`}
                    floaty={complete && !completing}
                    floatDelay={index}
                    interactive={!completing && isActive && (complete || axis === aimAxis || axis === replacementAxis)}
                    frameClassName="idea-lab__card-frame"
                    onFill={(options) => drawSingle(axis, Boolean(options?.skipMotion))}
                    onSwap={() => startReplacement(axis)}
                  />
                  {!completing
                    && !replacementAxis
                    && !isActive
                    && index <= maxNavigableIndex
                    && (carouselPosition === "previous" || carouselPosition === "next") ? (
                    <button
                      type="button"
                      className="idea-lab__peek-button"
                      aria-label={`${meta.label} 카드 보기`}
                      disabled={busy}
                      onClick={() => setFocusedAxis(axis)}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className={`idea-lab__progress-dock ${busy ? "is-running" : ""}`}>
            <button
              type="button"
              className="idea-lab__carousel-arrow"
              aria-label="이전 카드 보기"
              disabled={!canNavigateCarousel}
              onClick={() => navigateCarousel(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div
              className="idea-lab__progress"
              role="progressbar"
              aria-label="아이디어 카드 완성도"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={completedCount}
              aria-valuetext={`${completedCount} / 4`}
            >
              <div className="idea-lab__progress-segments" aria-hidden="true">
                {IDEA_LAB_AXIS_IDS.map((axis) => (
                  <span
                    key={axis}
                    className={`idea-lab__progress-segment ${revealed[axis] ? "is-complete" : ""} ${carouselAxis === axis && readingAxis !== axis ? "is-current" : ""} ${readingAxis === axis ? "is-reading" : ""}`}
                    style={{
                      "--axis": IDEA_LAB_AXIS_META[axis].color,
                      "--read-duration": `${AUTO_STEP_MS}ms`,
                      backgroundColor: readingAxis === axis ? "rgba(255,255,255,.14)" : undefined,
                    } as CSSProperties}
                  >
                    {readingAxis === axis ? (
                      <i className="idea-lab__progress-segment-fill" />
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="idea-lab__carousel-arrow"
              aria-label="다음 카드 보기"
              disabled={!canNavigateCarousel}
              onClick={() => navigateCarousel(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div
            className={`idea-lab__deck ${completedCount === 0 ? "is-initial" : ""}`}
            aria-hidden={busy ? "true" : undefined}
          >
            <div className="idea-lab__deck-stage">
              <FanDeck
                ref={deckRef}
                cards={DECK_POOL}
                axisLabels={AXIS_LABELS}
                aimAxis={replacementAxis ?? aimAxis}
                inactiveAxes={replacementAxis
                  ? IDEA_LAB_AXIS_IDS.filter((axis) => axis !== replacementAxis)
                  : inactiveAxes}
                flightDurationMs={FLIGHT_MS}
                getTargetRect={getTargetRect}
                onDragOver={(axis) => setHotAxis((axis as IdeaLabAxisId | null) ?? null)}
                onPick={onDeckPick}
              />
            </div>
          </div>

        </div>
      ) : null}

      {/* ── 다시 뽑기마다 정확히 한 문항만 묻는 추상 취향 질문 ────── */}
      {stage === "taste" && tasteQuestion ? (
        <div
          className="idea-lab__stage idea-lab__stage--taste"
          data-anim
          data-question-id={tasteQuestion.id}
        >
          <header className="idea-lab__taste-head">
            <div className="idea-lab__taste-kicker">
              <small>이번 다시 뽑기 · 취향 질문 1개</small>
            </div>
            <h2 ref={stageHeadingRef} tabIndex={-1} className="outline-none">{tasteQuestion.prompt}</h2>
            <p>아이디어를 직접 고르지 않아도 돼요. 첫 느낌에 가까운 답 하나만 눌러요.</p>
          </header>

          <div
            className="idea-lab__taste-options"
            role="group"
            aria-label={tasteQuestion.prompt}
          >
            {tasteQuestion.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                className="idea-lab__taste-choice"
                data-testid={`taste-choice-${choice.id}`}
                onClick={() => chooseTasteChoice(choice)}
              >
                <span aria-hidden="true">{index + 1}</span>
                <strong>{choice.label}</strong>
              </button>
            ))}
          </div>

          <footer className="idea-lab__taste-footer">
            <p>답하면 취향을 기억하고 새 결과 한 개를 바로 골라요.</p>
            <button type="button" onClick={cancelTasteSurvey}>현재 결과로 돌아가기</button>
          </footer>
        </div>
      ) : null}

      {/* ── A2 결과: 요약 → 그라데이션 상세 → 같은 화면에서 제작 자료 열기 ── */}
      {stage === "result" && selection ? (
        <div
          className={`idea-lab__stage idea-lab__stage--result ${resultEntry !== "default" ? "is-from-handoff" : ""} ${resultEntry === "shared" ? "is-shared-handoff" : ""} ${promptUnlocked ? "is-unlocked" : ""}`}
          data-anim={resultEntry === "default" ? "" : undefined}
        >
          <div className="idea-lab__stage-scroll">
            <aside className="idea-lab__result is-ready">
              <article
                className="idea-lab__result-summary"
                aria-label="오늘 만들 아이디어 요약"
                data-combination-id={ideaResult!.combinationId}
              >
                <div className="idea-lab__result-head">
                  <p className="idea-lab__result-name">
                    <b>📍 {ideaResult!.hero.name}</b>
                  </p>
                  {ideaResult!.hero.tagline ? (
                    <p className="idea-lab__result-tagline">{ideaResult!.hero.tagline}</p>
                  ) : null}
                </div>
                <h2
                  ref={stageHeadingRef}
                  tabIndex={-1}
                  className="idea-lab__result-hook outline-none"
                >
                  {ideaResult!.hero.painQuestion}
                </h2>
                <p className="idea-lab__result-story">
                  <span>{ideaResult!.hero.before}</span>
                  <strong>{ideaResult!.hero.after}</strong>
                </p>
              </article>

              <div
                className="idea-lab__locked-details"
                aria-label="아이디어 상세"
                data-source-name={selection.source.sourceName}
              >
                <div className="idea-lab__locked-details-body">
                  <section className="idea-lab__result-section">
                    <div className="idea-lab__result-section-head">
                      <h3>🎯 타겟</h3>
                    </div>
                    <p>{selection.payer.value}</p>
                  </section>

                  <section className="idea-lab__result-section">
                    <div className="idea-lab__result-section-head">
                      <h3>⚔️ 딱 하나 다른 점</h3>
                    </div>
                    <div className="idea-lab__difference-list">
                      <div>
                        <b>기존 · {selection.source.sourceName}</b>
                        <p>{ideaResult!.sourceValue}</p>
                      </div>
                      <div className="is-ours">
                        <b>{ideaResult!.hero.name}</b>
                        <p>{ideaResult!.difference}</p>
                      </div>
                    </div>
                  </section>

                  <section className="idea-lab__result-section is-flow">
                    <div className="idea-lab__result-section-head">
                      <h3>🗺️ 전체 플로우</h3>
                    </div>
                    <p className="idea-lab__flow-copy">{ideaResult!.flowSteps.join(" → ")}</p>
                  </section>

                  <p className="idea-lab__closing-line">
                    오늘 시작: <strong>{ideaResult!.flowSteps[0]}</strong>
                  </p>
                </div>
              </div>

              {!promptUnlocked ? (
                <div className="idea-lab__unlock-guide">
                  <h3>친구에게 공유하세요, 만들 자료가 바로 열려요</h3>
                  <ul>
                    <li><span>1</span><b>타깃 · 차별점 · 검증 가설</b></li>
                    <li><span>2</span><b>AI 코딩 프롬프트</b></li>
                    <li><span>3</span><b>이미지 프롬프트 · 예시 이미지</b></li>
                  </ul>
                  <figure className="idea-lab__unlock-example">
                    <Image
                      src="/images/idea-lab/image-prompt-example.png"
                      alt="맛집 영상 링크 입력부터 지도와 여행 동선까지 이어지는 맛핀 화면 예시"
                      width={1672}
                      height={941}
                      sizes="(max-width: 460px) calc(100vw - 64px), 376px"
                    />
                    <figcaption>맛핀 예시 · 링크 입력부터 여행 동선까지</figcaption>
                  </figure>
                  <div className="idea-lab__cta-bar idea-lab__cta-bar--stack idea-lab__cta-bar--inline">
                    {tasteApplied || message.includes("못했어요") ? (
                      <p className="idea-lab__result-note" aria-live="polite">{message}</p>
                    ) : null}
                    <button
                      type="button"
                      className="idea-lab__cta idea-lab__cta--primary"
                      onClick={shareAndUnlock}
                      disabled={busy}
                    >
                      공유하고 결과 보기
                    </button>
                    <p className="idea-lab__privacy-note">
                      카카오톡에서 친구를 직접 선택해요. 자동으로 게시되지 않아요.
                    </p>
                    <button type="button" className="idea-lab__text-action" onClick={startTasteSurvey}>
                      다른 아이디어 뽑기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="idea-lab__unlocked-content">
                  <p className="idea-lab__banner" aria-live="polite">
                    카카오톡 공유 화면을 열었어요. 만들 자료가 모두 열렸습니다.
                  </p>

                  <div className="idea-lab__artifacts" aria-label="독립 제작 프롬프트">
                    <section className="idea-lab__artifact idea-lab__artifact--development">
                      <div className="idea-lab__artifact-head">
                        <div><b>AI 코딩 프롬프트</b></div>
                        <span>바로 붙여넣기</span>
                      </div>
                      <pre>{developmentPrompt}</pre>
                      <button
                        type="button"
                        onClick={() => copyArtifact("development", developmentPrompt, "AI 코딩 프롬프트")}
                      >
                        {copiedArtifact === "development" ? "복사했어요 ✓" : "AI 코딩 프롬프트 복사"}
                      </button>
                    </section>

                    <section className="idea-lab__artifact idea-lab__artifact--image">
                      <div className="idea-lab__artifact-head">
                        <div><b>이미지 생성 프롬프트</b></div>
                      </div>
                      <pre>{imagePrompt}</pre>
                      <figure className="idea-lab__artifact-example">
                        <Image
                          src="/images/idea-lab/image-prompt-example.png"
                          alt="맛집 영상 링크 입력부터 지도와 여행 동선까지 이어지는 맛핀 이미지 예시"
                          width={1672}
                          height={941}
                          sizes="(max-width: 460px) calc(100vw - 72px), 368px"
                        />
                        <figcaption>맛핀 예시 · 링크 입력부터 여행 동선까지</figcaption>
                      </figure>
                      <button
                        type="button"
                        onClick={() => copyArtifact("image", imagePrompt, "이미지 생성 프롬프트")}
                      >
                        {copiedArtifact === "image" ? "복사했어요 ✓" : "이미지 프롬프트 복사"}
                      </button>
                    </section>
                  </div>

                  <div className={`idea-lab__prompt is-unlocked ${promptExpanded ? "is-expanded" : ""}`}>
                    <div className="idea-lab__prompt-head">
                      <div><b>전체 아이디어 브리프</b></div>
                    </div>
                    <div className="idea-lab__prompt-copy" id="idea-lab-full-prompt">
                      {promptLines.map((line, index) => (
                        <p key={`prompt-full-${index}`}>{line}</p>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="idea-lab__prompt-toggle"
                      aria-expanded={promptExpanded}
                      aria-controls="idea-lab-full-prompt"
                      onClick={() => setPromptExpanded((expanded) => !expanded)}
                    >
                      {promptExpanded ? "전체 브리프 접기" : "전체 브리프 보기"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="idea-lab__cta idea-lab__cta--ghost"
                    onClick={() => copyArtifact("brief", prompt, "전체 아이디어 브리프")}
                  >
                    {copiedArtifact === "brief" ? "복사했어요 ✓" : "전체 아이디어 브리프 복사"}
                  </button>
                  {onViewPraise ? (
                    <button type="button" className="idea-lab__text-action" onClick={onViewPraise}>
                      받은 응원 보기 →
                    </button>
                  ) : null}
                  <button type="button" className="idea-lab__text-action" onClick={startTasteSurvey}>
                    다른 아이디어 뽑기
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const IDEA_LAB_CSS = `
.idea-lab{--lab-bg:#090b10;--lab-surface:#11151d;--lab-surface-2:#171c26;--lab-line:rgba(255,255,255,.11);--lab-hairline:rgba(255,255,255,.16);--lab-text:#f4f1e9;--lab-muted:#9ba2ae;--lab-primary:var(--primary,#ff4458);--lab-deco:var(--deco-glow,#6db4f5);--lab-ease:var(--ease-out,cubic-bezier(.23,1,.32,1));--lab-spring:var(--spring,cubic-bezier(.34,1.56,.64,1));--result-surface-container:#1c1c1e;--result-on-surface:#f5f5f7;--result-on-surface-variant:rgba(235,235,245,.6);--result-primary:#ff8fa0;--action-primary:#d92d45;--action-primary-hover:#c62842;--action-on-primary:#fff;position:relative;display:block;width:100%;height:100%;color:var(--lab-text);font-family:var(--font-sans),system-ui,sans-serif}
.idea-lab *{box-sizing:border-box}.idea-lab button,.idea-lab input{font:inherit}.idea-lab button{color:inherit}
.idea-lab button:focus-visible,.idea-lab input:focus-visible{outline:2px solid var(--lab-text);outline-offset:2px;box-shadow:0 0 0 4px color-mix(in srgb,var(--lab-primary) 52%,transparent)}
.idea-lab ::selection{background:color-mix(in srgb,var(--lab-primary) 34%,transparent);color:#fff}

/* ── 스테이지 셸 ── */
.idea-lab__stage{position:relative;display:flex;flex-direction:column;height:100%;min-height:0}
.idea-lab__stage--draw{user-select:none;-webkit-user-select:none}
.idea-lab__stage--draw input,.idea-lab__stage--draw textarea{user-select:text;-webkit-user-select:text}
@keyframes idea-stage-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes idea-indicator-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.idea-lab__stage[data-anim]{animation:idea-stage-in .24s var(--lab-ease) both}
.idea-lab__stage--result{overflow:hidden;padding:0}
.idea-lab__stage-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:14px 16px 8px}
.idea-lab__stage-scroll::-webkit-scrollbar{width:.4rem}
.idea-lab__stage-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--lab-primary) 26%,transparent);border-radius:1rem}

/* ── A1 뽑기 스테이지 (100dvh 한 화면 완결) ── */
.idea-lab__stage--draw{--progress-lift:-96px;padding:28px 16px 0;overflow:hidden}
.idea-lab__appbar{flex:none;height:216px;min-height:216px;overflow:hidden;padding:4px 2px 12px}.idea-lab__appbar-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.idea-lab__appbar.is-guide,.idea-lab__appbar.is-summary{margin:10px 8px 18px;padding:14px 12px 18px;text-align:center}
.idea-lab__appbar.is-guide{display:flex;height:216px;min-height:216px;flex-direction:column;justify-content:center;margin:10px 8px 18px;padding:24px 8px 10px;border:0;border-radius:0;background:none;box-shadow:none}
.idea-lab__appbar.is-guide .idea-lab__appbar-row,.idea-lab__appbar.is-summary .idea-lab__appbar-row{flex-direction:column;align-items:center;justify-content:center;gap:8px}
.idea-lab__appbar.is-guide .idea-lab__intro,.idea-lab__appbar.is-summary .idea-lab__intro{width:100%;text-align:center}
.idea-lab__appbar.is-guide .idea-lab__progress{padding-top:0}
.idea-lab__appbar.is-summary .idea-lab__complete-hint{padding-top:0;text-align:center}
.idea-lab__appbar.is-summary .idea-lab__appbar-result{margin-top:14px;padding-top:14px}
.idea-lab__appbar.is-summary .idea-lab__idea-preview{align-items:center;text-align:center}
.idea-lab__intro{min-width:0}.idea-lab__appbar-title{margin:0;font-family:inherit;font-weight:800;font-size:20px;line-height:1.2;letter-spacing:-.015em}
.idea-lab__appbar-description{margin:7px 0 0;color:var(--lab-muted);font-size:12px;font-weight:700;line-height:1.45;text-wrap:balance}
.idea-lab__appbar.is-guide .idea-lab__appbar-title{letter-spacing:-.025em}
.idea-lab__appbar.is-guide .idea-lab__appbar-description{max-width:320px;margin-right:auto;margin-left:auto}
.idea-lab__progress-dock{flex:none;display:grid;width:228px;max-width:100%;height:48px;min-height:48px;grid-template-columns:48px 124px 48px;align-self:center;align-items:center;justify-content:center;gap:4px;margin:0 auto;padding:0;contain:layout;transform:translateY(var(--progress-lift))}
.idea-lab__progress{display:flex;width:124px;height:48px;min-height:48px;box-sizing:border-box;align-items:center;justify-content:center;gap:9px;padding:12px;border:1px solid rgba(255,255,255,.045);border-radius:999px;background:rgba(255,255,255,.035);transition:background .2s ease,border-color .2s ease}
.idea-lab__progress-dock.is-running .idea-lab__progress{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.07)}
.idea-lab__progress.is-visually-hidden,.idea-lab__status{position:absolute;width:1px;height:1px;min-width:0;min-height:0;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.idea-lab__progress-segments{display:flex;align-items:center;gap:6px}
.idea-lab__progress-segment{position:relative;display:block;width:20px;height:7px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.38);transform:scaleX(.35);transform-origin:center;transition:transform .24s ease}
.idea-lab__progress-segment.is-current{transform:scaleX(1);background:var(--lab-text);box-shadow:0 0 0 1px rgba(255,255,255,.1)}
.idea-lab__progress-segment.is-complete{background:var(--axis)}
.idea-lab__progress-segments .idea-lab__progress-segment.is-reading{transform:scaleX(1);background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.idea-lab__progress-segment-fill{position:absolute;inset:0;display:block;width:100%;height:100%;border-radius:inherit;background:var(--axis);transform:scaleX(0);transform-origin:left center;animation:idea-indicator-fill var(--read-duration) linear forwards;will-change:transform}
.idea-lab__carousel-arrow{display:grid;width:48px;height:48px;flex:none;place-items:center;border:0;border-radius:50%;background:rgba(255,255,255,.045);color:var(--lab-text);font-size:25px;font-weight:500;line-height:1;cursor:pointer;transition:background .16s ease,opacity .16s ease,transform .16s ease}
.idea-lab__carousel-arrow:not(:disabled):active{transform:scale(.97)}
.idea-lab__carousel-arrow:disabled{visibility:visible;opacity:.28;cursor:default}
.idea-lab__appbar-meta{flex:none;color:var(--lab-muted);font-size:10px;font-weight:700}
.idea-lab__slots{flex:1 1 auto;min-height:0;position:relative;z-index:0;overflow:hidden;margin:0 -16px;padding:2px 16px 8px;isolation:isolate;touch-action:pan-y;cursor:grab;transform:translateY(-104px)}
.idea-lab__slots.is-dragging{cursor:grabbing}
.idea-lab__slot{position:absolute;left:50%;top:50%;width:min(58vw,27vh,232px);min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px;transition:transform .24s var(--lab-ease),opacity .16s ease-out,filter .16s ease-out;will-change:transform,opacity}
.idea-lab__slots.is-dragging .idea-lab__slot{transition:none}
.idea-lab__slot.is-carousel-active{z-index:3;opacity:1;filter:none}
.idea-lab__slot.is-carousel-previous{left:0;z-index:2;transform-origin:right center;opacity:.68;filter:saturate(.72) brightness(.78)}
.idea-lab__slot.is-carousel-next{left:100%;z-index:2;transform-origin:left center;opacity:.68;filter:saturate(.72) brightness(.78)}
.idea-lab__slot.is-carousel-before{opacity:0;visibility:hidden}
.idea-lab__slot.is-carousel-after{opacity:0;visibility:hidden}
.idea-lab__slot.is-replacing .idea-lab__card-frame{filter:drop-shadow(0 0 14px color-mix(in srgb,var(--axis) 46%,transparent))}
.idea-lab__slot.is-replacement-muted{opacity:.22;filter:saturate(.35) brightness(.56)}
.idea-lab__slot:not(.is-carousel-active) .idea-lab__card-frame{pointer-events:none}
.idea-lab__card-frame{width:100%;max-width:none}
.idea-lab__slot-label{display:flex;width:100%;align-items:center;justify-content:center;gap:6px;color:var(--axis);font-size:12px;font-weight:800;letter-spacing:.02em;text-align:center}.idea-lab__slot-label span{font-size:12px;font-weight:900;font-variant-numeric:tabular-nums;opacity:.92}
.idea-lab__peek-button{position:absolute;top:0;bottom:0;z-index:4;width:56px;min-height:48px;border:0;background:transparent;cursor:pointer}.idea-lab__peek-button:disabled{cursor:default}.idea-lab__slot.is-carousel-previous .idea-lab__peek-button{right:0}.idea-lab__slot.is-carousel-next .idea-lab__peek-button{left:0}
.idea-lab__cancel-replacement{flex:none;min-height:48px;padding:0 4px;border:0;background:transparent;color:var(--lab-muted)!important;font-size:12px;font-weight:800;cursor:pointer}
.idea-lab__complete-hint{flex:none;padding-top:4px;color:var(--lab-muted);font-size:11px;font-weight:700}.idea-lab__appbar-result{height:96px;min-height:96px;max-height:96px;overflow:hidden;margin-top:8px;padding-top:8px;border-top:1px solid var(--lab-line)}
.idea-lab__replace-instruction{margin:0;color:var(--lab-muted);font-size:12px;line-height:1.4}
.idea-lab__idea-preview{display:flex;flex-direction:column;align-items:flex-start;gap:5px;width:100%;color:var(--lab-text);white-space:normal}.idea-lab__idea-preview strong,.idea-lab__idea-preview span{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;text-wrap:balance}.idea-lab__idea-preview strong{-webkit-line-clamp:2;font-size:16px;font-weight:900;line-height:1.3}.idea-lab__idea-preview span{-webkit-line-clamp:2;color:#d7dbe1;font-size:12px;font-weight:700;line-height:1.45}.idea-lab__idea-preview small{max-width:100%;overflow:hidden;color:var(--lab-muted);font-size:10px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.idea-lab__deck{flex:none;position:relative;z-index:50;height:calc(84px + env(safe-area-inset-bottom,0px));margin:0 -16px;overflow:visible;pointer-events:none;background:linear-gradient(to bottom,transparent 0,rgba(9,11,16,.38) 52%,var(--lab-bg) 100%)}
.idea-lab__deck .fd-card{pointer-events:auto}
.idea-lab__deck-stage{position:absolute;top:12px;right:0;left:0;height:160px;overflow:visible}
.idea-lab__deck-stage .fd-wheel{margin-top:0}
@keyframes idea-deck-invite{0%,100%{transform:translateY(0)}42%{transform:translateY(-8px)}}
.idea-lab__deck.is-initial .idea-lab__deck-stage{animation:idea-deck-invite .42s var(--lab-ease) .18s both}
@keyframes idea-card-white-glow{
  0%{opacity:0;transform:scale(.965)}
  38%{opacity:.82}
  74%{opacity:.5;transform:scale(1.018)}
  100%{opacity:.16;transform:scale(1.01)}
}
@keyframes idea-result-content-soft-in{from{opacity:0}to{opacity:1}}
@keyframes idea-result-content-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes idea-shared-card-old{from{opacity:1}to{opacity:0}}
@keyframes idea-shared-card-new{from{opacity:.34}to{opacity:1}}
.idea-lab__appbar.is-completion-message{display:grid;height:216px;min-height:216px;place-items:center;margin:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;text-align:center}
.idea-lab__appbar.is-completion-message .idea-lab__appbar-row{justify-content:center}
.idea-lab__appbar.is-completion-message .idea-lab__intro{width:100%}
.idea-lab__appbar.is-completion-message .idea-lab__appbar-title{font-size:20px;letter-spacing:-.025em}
.idea-lab__stage--draw.is-completing{overflow:hidden}
.idea-lab__stage--draw.is-completing .idea-lab__slots{pointer-events:none}
.idea-lab__stage--draw.is-completing .idea-lab__slot{left:50%;top:50%;z-index:calc(10 + var(--card-order));opacity:1;visibility:visible;filter:none;transform:translate(calc(-50% + var(--pile-x)),calc(-50% + var(--pile-y))) rotate(var(--pile-rotate)) scale(.96)!important;transition:transform 180ms cubic-bezier(.77,0,.175,1),opacity 160ms var(--lab-ease),filter 160ms var(--lab-ease);isolation:isolate}
.idea-lab__stage--draw.is-completing .idea-lab__slot::after{content:"";position:absolute;inset:20px -5px -5px;z-index:8;border:2px solid rgba(255,255,255,.94);border-radius:18px;box-shadow:0 0 14px rgba(255,255,255,.92),0 0 38px rgba(255,255,255,.5),inset 0 0 18px rgba(255,255,255,.28);pointer-events:none;opacity:0;transform:scale(.965);will-change:opacity,transform}
.idea-lab__stage--draw:is(.is-completion-glow,.is-completion-focus,.is-completion-breathe) .idea-lab__slot::after{animation:idea-card-white-glow 190ms ease-in-out both;animation-delay:calc(var(--card-order) * 30ms)}
.idea-lab__stage--draw.is-completing .idea-lab__slot-label{opacity:0;transform:translateY(-4px);transition:opacity 120ms ease-out,transform 160ms var(--lab-ease)}
.idea-lab__stage--draw:is(.is-completion-focus,.is-completion-breathe) .idea-lab__appbar.is-completion-message{opacity:0;transform:translateY(-4px);transition:opacity 220ms var(--lab-ease),transform 280ms cubic-bezier(.77,0,.175,1)}
.idea-lab__stage--draw:is(.is-completion-focus,.is-completion-breathe) .idea-lab__slot{transition:transform 180ms cubic-bezier(.77,0,.175,1),opacity 180ms var(--lab-ease),filter 180ms var(--lab-ease)}
.idea-lab__stage--draw:is(.is-completion-focus,.is-completion-breathe) .idea-lab__slot:not(.is-handoff-source){opacity:.12;filter:saturate(.55) brightness(.72);transform:translate(calc(-50% + var(--pile-x)),calc(-50% + var(--pile-y))) rotate(var(--pile-rotate)) scale(.935)!important}
.idea-lab__stage--draw:is(.is-completion-focus,.is-completion-breathe) .idea-lab__slot.is-handoff-source{z-index:20;opacity:1;transform:translate(-50%,-50%) rotate(0deg) scale(.98)!important;view-transition-name:idea-result-card}
.idea-lab__stage--draw.is-completing .idea-lab__progress-dock{pointer-events:none;opacity:0;transform:translateY(calc(var(--progress-lift) + 6px));transition:opacity 160ms ease-out,transform 180ms var(--lab-ease)}
.idea-lab__stage--draw.is-completing .idea-lab__cta-bar,.idea-lab__stage--draw.is-completing .idea-lab__deck{pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity 160ms ease-out,transform 180ms var(--lab-ease)}
.idea-lab__stage--draw .idea-lab__cta-bar.is-complete{display:none}
@supports(view-transition-name:idea-result-card){
  .idea-lab__stage--result.is-shared-handoff .idea-lab__result-summary{view-transition-name:idea-result-card}
  ::view-transition-group(idea-result-card){animation-duration:360ms;animation-timing-function:cubic-bezier(.77,0,.175,1)}
  ::view-transition-image-pair(idea-result-card){isolation:auto}
  ::view-transition-old(idea-result-card){animation:idea-shared-card-old 180ms var(--lab-ease) both;mix-blend-mode:normal}
  ::view-transition-new(idea-result-card){animation:idea-shared-card-new 360ms cubic-bezier(.77,0,.175,1) both;mix-blend-mode:normal}
}

@media (max-height:760px){
  .idea-lab__stage--draw{--progress-lift:-64px;padding-top:12px;overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain}
  .idea-lab__appbar,.idea-lab__appbar.is-guide{height:clamp(132px,24dvh,160px);min-height:clamp(132px,24dvh,160px)}
  .idea-lab__appbar.is-guide{margin:0 8px 8px;padding:12px 8px 6px}
  .idea-lab__slots{flex:none;height:clamp(230px,42dvh,300px);min-height:230px;transform:translateY(-64px)}
  .idea-lab__slot{width:min(58vw,24dvh,200px)}
  .idea-lab__cta-bar.is-placeholder{display:none}
  .idea-lab__deck{height:calc(64px + env(safe-area-inset-bottom,0px))}
  .idea-lab__deck-stage{top:10px;height:144px}
  .idea-lab__appbar.is-completion-message{height:clamp(132px,24dvh,160px);min-height:clamp(132px,24dvh,160px)}
}
@media (max-height:700px){
  .idea-lab__stage--draw{--progress-lift:0;padding-top:8px}
  .idea-lab__appbar,.idea-lab__appbar.is-guide{height:120px;min-height:120px}
  .idea-lab__appbar.is-guide{margin:0 8px 4px;padding:8px 8px 4px}
  .idea-lab__slots{height:224px;min-height:224px;transform:none}
  .idea-lab__slot{--carousel-y:10px;width:min(54vw,21dvh,123px)}
  .idea-lab__progress-dock{transform:none}
  .idea-lab__deck{height:calc(56px + env(safe-area-inset-bottom,0px))}
  .idea-lab__deck-stage{top:8px;height:136px}
  .idea-lab__appbar.is-completion-message{height:120px;min-height:120px}
}
.idea-lab__cta-bar{flex:none;position:sticky;bottom:0;z-index:8;display:grid;min-height:60px;gap:8px;padding:4px 0 8px;background:linear-gradient(to top,var(--lab-bg) 54%,transparent)}
.idea-lab__stage--draw .idea-lab__cta-bar{position:static}
.idea-lab__stage--draw .idea-lab__cta-bar{grid-template-columns:1fr auto}
.idea-lab__stage--draw .idea-lab__cta-bar:has(.idea-lab__cta--ghost){grid-template-columns:1fr auto}
.idea-lab__stage--draw .idea-lab__cta-bar:not(:has(.idea-lab__cta--ghost)){grid-template-columns:1fr}
.idea-lab__cta-bar.is-placeholder{pointer-events:none}.idea-lab__cta-placeholder{display:block;height:48px}
.idea-lab__cta{min-height:48px;padding:0 18px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .1s ease}
.idea-lab__cta--primary{border:1px solid var(--action-primary);background:var(--action-primary);color:var(--action-on-primary)!important}
.idea-lab__cta--kakao{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #fee500;background:#fee500;color:#191600!important}
.idea-lab__cta--kakao>span{font-size:16px;line-height:1}
.idea-lab__cta--primary:active:not(:disabled){transform:scale(.97)}
.idea-lab__cta--kakao:active:not(:disabled){transform:scale(.97)}
.idea-lab__cta--ghost{border:1px solid var(--lab-hairline);background:rgba(255,255,255,.04);color:var(--lab-text);white-space:nowrap}
.idea-lab__cta--ghost:active:not(:disabled){transform:scale(.97)}
.idea-lab__cta--shortcut{justify-self:center;padding:0 14px;border:0;background:transparent;color:var(--lab-muted);font-size:11px;font-weight:700}
.idea-lab__cta--shortcut:active:not(:disabled){transform:scale(.97)}
.idea-lab__cta:disabled{opacity:.55;cursor:wait}
@media (hover:hover) and (pointer:fine){.idea-lab__carousel-arrow:not(:disabled):hover{background:rgba(255,255,255,.11)}.idea-lab__cta--primary:hover:not(:disabled){border-color:var(--action-primary-hover);background:var(--action-primary-hover)}.idea-lab__cta--kakao:hover:not(:disabled){border-color:#f5dc00;background:#f5dc00}.idea-lab__cta--ghost:hover:not(:disabled){border-color:color-mix(in srgb,var(--lab-primary) 42%,transparent)}.idea-lab__cta--shortcut:hover:not(:disabled){color:var(--lab-text);background:rgba(255,255,255,.04)}}
@media(prefers-reduced-motion:reduce){.idea-lab__slot{transition:opacity .16s ease,filter .16s ease}.idea-lab__deck.is-initial .idea-lab__deck-stage{animation:none}.idea-lab__stage--draw.is-completing .idea-lab__slot{animation:none;transform:translate(calc(-50% + var(--pile-x)),calc(-50% + var(--pile-y))) rotate(var(--pile-rotate)) scale(.96)!important;transition:opacity .12s ease}.idea-lab__stage--draw.is-completion-focus .idea-lab__slot:not(.is-handoff-source){opacity:.18}.idea-lab__stage--draw.is-completing .idea-lab__slot::after{animation:idea-result-content-soft-in 160ms ease-out both}.idea-lab__stage--draw.is-completing .idea-lab__progress-dock{transform:translateY(var(--progress-lift))}.idea-lab__stage--draw.is-completing .idea-lab__cta-bar,.idea-lab__stage--draw.is-completing .idea-lab__deck{transform:none}.idea-lab__stage--result.is-from-handoff :is(.idea-lab__result-summary,.idea-lab__locked-details,.idea-lab__unlock-guide,.idea-lab__cta-bar){animation:idea-result-content-soft-in 160ms ease-out both}}

/* ── 다시 뽑기 전 추상 취향 한 문항 ── */
.idea-lab__stage--taste{overflow:hidden;padding:clamp(18px,3dvh,30px) 16px calc(16px + env(safe-area-inset-bottom,0px))}
.idea-lab__taste-head{flex:none;text-align:center}.idea-lab__taste-kicker{display:flex;min-height:42px;align-items:center;justify-content:center}.idea-lab__taste-kicker small{color:var(--lab-primary);font-weight:900;letter-spacing:.02em}.idea-lab__taste-head h2{margin:10px 0 0;font-size:clamp(24px,3.4dvh,30px);line-height:1.25;letter-spacing:-.03em;text-wrap:balance}.idea-lab__taste-head p{max-width:420px;margin:10px auto 0;color:var(--lab-muted);font-weight:700;line-height:1.5;text-wrap:balance}
.idea-lab__taste-options{display:grid;width:100%;max-width:420px;grid-template-columns:minmax(0,1fr);flex:1 1 auto;align-content:center;align-self:center;gap:12px;margin:clamp(14px,2.5dvh,24px) auto}
.idea-lab__taste-choice{position:relative;display:flex;min-width:0;min-height:72px;align-items:center;justify-content:flex-start;gap:14px;overflow:hidden;padding:14px 18px;border:1px solid var(--lab-hairline);border-radius:18px;background:linear-gradient(145deg,rgba(109,180,245,.11),rgba(255,255,255,.025) 68%);text-align:left;cursor:pointer;transition:transform .18s var(--lab-ease),border-color .18s ease,background .18s ease}
.idea-lab__taste-choice:nth-child(2){background:linear-gradient(145deg,rgba(255,128,145,.11),rgba(255,255,255,.025) 68%)}.idea-lab__taste-choice:nth-child(3){background:rgba(255,255,255,.035)}.idea-lab__taste-choice>span{display:grid;width:38px;height:38px;flex:none;place-items:center;border-radius:50%;background:#6db4f5;color:#071018;font-weight:950}.idea-lab__taste-choice:nth-child(2)>span{background:#ff8091;color:#18070b}.idea-lab__taste-choice:nth-child(3)>span{background:#343b47;color:#e5e8ec}.idea-lab__taste-choice strong{min-width:0;color:var(--lab-text);font-size:clamp(18px,2.4dvh,21px);font-weight:850;line-height:1.35;letter-spacing:-.02em;text-wrap:balance}.idea-lab__taste-choice:active{transform:scale(.98)}
.idea-lab__taste-footer{flex:none;text-align:center}.idea-lab__taste-footer p{margin:0;color:var(--lab-muted);line-height:1.45;text-wrap:balance}.idea-lab__taste-footer button{min-height:48px;margin-top:4px;padding:0 14px;border:0;background:transparent;color:#c5cad2;font-weight:800;cursor:pointer}
@media(hover:hover) and (pointer:fine){.idea-lab__taste-choice:hover{border-color:rgba(109,180,245,.56);background:linear-gradient(160deg,rgba(109,180,245,.17),rgba(255,255,255,.04) 58%);transform:translateY(-2px)}.idea-lab__taste-choice:nth-child(2):hover{border-color:rgba(255,128,145,.56);background:linear-gradient(160deg,rgba(255,128,145,.17),rgba(255,255,255,.04) 58%)}.idea-lab__taste-footer button:hover{color:var(--lab-text)}}
@media(max-height:680px){.idea-lab__stage--taste{padding-top:10px}.idea-lab__taste-kicker{min-height:34px}.idea-lab__taste-head h2{margin-top:4px;font-size:22px}.idea-lab__taste-head p{margin-top:6px}.idea-lab__taste-options{gap:8px;margin:8px auto}.idea-lab__taste-choice{min-height:62px;padding:10px 14px}.idea-lab__taste-choice>span{width:34px;height:34px}.idea-lab__taste-footer p{display:none}}

/* 한 문항 화면도 이전 화면과 같은 최소 14pt 읽기 기준을 유지한다. */
.idea-lab .idea-lab__stage.idea-lab__stage--taste :where(h2,small,p,span,strong,button){font-size:max(14pt,1em)!important}
.idea-lab__stage--taste h2{font-size:clamp(24px,3.4dvh,30px)!important}.idea-lab__stage--taste .idea-lab__taste-choice strong{font-size:clamp(19px,2.5dvh,23px)!important}

.idea-lab__cta-bar--stack{grid-template-columns:1fr}
.idea-lab__result-note{margin:0;color:var(--lab-muted);font-size:11px;text-align:center;text-wrap:balance}
.idea-lab__stage--result>.idea-lab__cta-bar{position:static;flex:none;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--lab-line);background:linear-gradient(to top,var(--lab-bg),color-mix(in srgb,var(--lab-bg) 88%,transparent))}
.idea-lab__cta-bar--inline{position:static;min-height:0;margin-top:18px;padding:18px 0 2px;border-top:1px solid var(--lab-line);background:none}
.idea-lab__stage--result.is-from-handoff:not(.is-shared-handoff) .idea-lab__result-summary{animation:idea-result-content-in 200ms var(--lab-ease) 20ms both}
.idea-lab__stage--result.is-from-handoff .idea-lab__locked-details{animation:idea-result-content-in 200ms var(--lab-ease) 60ms both}
.idea-lab__stage--result.is-from-handoff .idea-lab__unlock-guide{animation:idea-result-content-in 200ms var(--lab-ease) 120ms both}
.idea-lab__stage--result.is-from-handoff .idea-lab__cta-bar{animation:idea-result-content-in 180ms var(--lab-ease) 180ms both}

/* ── 결과 패널 (moon-panel급 표면) ── */
.idea-lab__result{position:relative;border:1px solid var(--lab-hairline);border-radius:16px;padding:18px;background:var(--lab-surface)}
.idea-lab__result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--lab-line)}.idea-lab__result-head small{color:var(--lab-primary);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.idea-lab__result-head h2{margin:6px 0 0;font-family:inherit;font-weight:800;font-size:20px;line-height:1.25;letter-spacing:-.01em;text-wrap:balance}.idea-lab__result-head>span{flex:none;padding:5px 10px;border:1px solid rgba(255,68,88,.35);border-radius:999px;background:rgba(255,68,88,.08);color:#ff9ca8;font-size:10px;font-weight:900;white-space:nowrap}
.idea-lab__result-concept{margin:16px 0 0;padding:14px;border:1px solid color-mix(in srgb,var(--lab-primary) 38%,var(--lab-line));border-radius:10px;background:color-mix(in srgb,var(--lab-primary) 8%,#0b0e14)}.idea-lab__result-concept small{color:#ff9ca8;font-size:10px;font-weight:900}.idea-lab__result-concept p{margin:7px 0 0;color:var(--lab-text);font-size:16px;font-weight:800;line-height:1.55;text-wrap:balance}
.idea-lab__result-hook{margin:14px 0 0;padding:0;border:0}.idea-lab__result-hook small{color:var(--lab-muted);font-size:11px;font-weight:800}.idea-lab__result-hook p{margin:7px 0 0;color:var(--lab-text);font-size:18px;font-weight:850;line-height:1.48;letter-spacing:-.01em;text-wrap:balance}.idea-lab__result-hook span{display:block;margin-top:8px;color:#cbd0d8;font-size:13px;line-height:1.6}
.idea-lab__result-section{padding:14px 0;border-top:1px solid var(--lab-line)}.idea-lab__result-section small,.idea-lab__result-cards summary{color:var(--lab-muted);font-size:12px;font-weight:800}.idea-lab__result-section p{margin:7px 0 0;color:#d7dbe1;font-size:14px;line-height:1.6}
.idea-lab__comparison-row{display:grid;grid-template-columns:42px 1fr;gap:9px;margin-top:10px;align-items:start}.idea-lab__comparison-row b{padding-top:2px;color:#8dc8ff;font-size:11px}.idea-lab__comparison-row p{margin:0}.idea-lab__comparison-row.is-difference b{color:#ff9ca8}.idea-lab__proof-note{display:block;margin-top:9px;color:#747d89;font-size:10px;line-height:1.45}
.idea-lab__comparison-row.is-claim b{color:var(--good,#6fce9f)}.idea-lab__comparison-row.is-claim p{font-weight:750}
.idea-lab__result-section.is-flow ol{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 0;padding:0;list-style:none}.idea-lab__result-section.is-flow li{display:flex;align-items:center;gap:6px;min-height:34px;padding:6px 9px;border:1px solid var(--lab-line);border-radius:8px;background:rgba(255,255,255,.025)}.idea-lab__result-section.is-flow li span{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:rgba(255,255,255,.09);color:#cdd2da;font-size:9px;font-weight:900}.idea-lab__result-section.is-flow li b{color:#d7dbe1;font-size:11px;line-height:1.35}
.idea-lab__result-cards{padding:14px 0;border-top:1px solid var(--lab-line)}.idea-lab__result-cards summary{min-height:48px;display:flex;align-items:center;cursor:pointer;list-style:none}.idea-lab__result-cards summary::-webkit-details-marker{display:none}.idea-lab__result-cards summary::after{content:"+";margin-left:auto;color:var(--lab-muted);font-size:18px}.idea-lab__result-cards[open] summary::after{content:"−"}.idea-lab__result-cards dl{display:grid;gap:10px;margin:2px 0 0}.idea-lab__result-cards dl>div{display:grid;gap:3px}.idea-lab__result-cards dt{color:var(--lab-muted);font-size:11px;font-weight:800}.idea-lab__result-cards dd{margin:0;color:#d7dbe1;font-size:13px;line-height:1.5}

/* ── A2 결과: 요약 카드 뒤로 상세가 이어지는 단일 스크롤 ── */
.idea-lab__stage--result .idea-lab__stage-scroll{padding:14px 16px 20px;scroll-behavior:smooth}
.idea-lab__stage--result .idea-lab__result{display:grid;grid-template-columns:minmax(0,1fr);width:100%;min-width:0;gap:0;border:0;border-radius:0;padding:0;background:none}
.idea-lab__result-summary{position:relative;width:100%;min-width:0;max-width:100%;margin-bottom:0;padding:1.5rem;border:0;border-radius:1.5rem;background:var(--result-surface-container);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07),0 12px 32px rgba(0,0,0,.22);font-family:-apple-system,BlinkMacSystemFont,var(--font-sans),system-ui,sans-serif}
.idea-lab__result-summary-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.idea-lab__result-summary-top small{color:#ff9ca8;font-size:11px;font-weight:900;letter-spacing:.08em}.idea-lab__result-summary-top span{flex:none;padding:5px 9px;border:1px solid rgba(255,68,88,.35);border-radius:999px;background:rgba(255,68,88,.08);color:#ff9ca8;font-size:11px;font-weight:900}
.idea-lab__result-summary .idea-lab__result-head{display:block;margin:0;padding:0;border:0}.idea-lab__result-summary .idea-lab__result-name{max-width:none;margin:0;color:var(--result-primary);font-size:14pt;font-weight:800;line-height:1.35;letter-spacing:-.02em;word-break:keep-all;overflow-wrap:break-word;text-wrap:pretty}.idea-lab__result-name b{font:inherit}.idea-lab__result-name span{color:var(--result-on-surface-variant);font-weight:650}
.idea-lab__result-tagline{margin:.3rem 0 0;color:var(--result-on-surface-variant);font-size:14pt;font-weight:650;line-height:1.4;letter-spacing:-.01em;word-break:keep-all;text-wrap:pretty}
.idea-lab__result-summary .idea-lab__result-hook{max-width:none;margin:1.15rem 0 0;padding:0;border:0;color:var(--result-on-surface);font-size:clamp(23px,5.4vw,26px);font-weight:720;line-height:1.32;letter-spacing:-.022em;word-break:keep-all;overflow-wrap:normal;text-wrap:pretty}
.idea-lab__result-story{display:grid;gap:.85rem;margin:1.15rem 0 0;word-break:keep-all}.idea-lab__result-story span,.idea-lab__result-story strong{display:block;font-size:14pt;line-height:1.5;text-wrap:pretty}.idea-lab__result-story span{color:var(--result-on-surface-variant);font-weight:600;letter-spacing:0}.idea-lab__result-story strong{color:var(--result-on-surface);font-weight:650;letter-spacing:-.01em}
.idea-lab__result-story small{display:block;margin-bottom:3px;color:var(--result-on-surface-variant);font-size:11px;font-weight:850;line-height:1.3}.idea-lab__result-story strong small{color:var(--result-primary)}
@media(prefers-contrast:more){.idea-lab__result-summary{box-shadow:inset 0 0 0 1px rgba(255,255,255,.24)}.idea-lab__result-story span{color:#d2d2d7}}

/* ── 결과 상세 → 공유 → 같은 화면에서 제작 자료 열기 ── */
.idea-lab__privacy-note{margin:0;color:#9aa3af;font-size:11px;font-weight:700;line-height:1.45;text-align:center;text-wrap:balance}
.idea-lab__text-action{justify-self:center;min-height:48px;padding:0 10px;border:0;background:transparent;color:#aeb6c2;font-size:12px;font-weight:800;text-decoration:underline;text-decoration-color:rgba(255,255,255,.22);text-underline-offset:4px;cursor:pointer}
.idea-lab__locked-details{position:relative;height:460px;overflow:hidden;margin-top:0;pointer-events:none;user-select:none;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 48%,rgba(0,0,0,.88) 60%,rgba(0,0,0,.5) 76%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 48%,rgba(0,0,0,.88) 60%,rgba(0,0,0,.5) 76%,transparent 100%)}
.idea-lab__locked-details-body{opacity:1;filter:none}
.idea-lab__stage--result.is-unlocked .idea-lab__locked-details{height:auto;overflow:visible;pointer-events:auto;user-select:text;-webkit-mask-image:none;mask-image:none}
.idea-lab__unlock-guide{padding:18px 4px 12px;text-align:center}
.idea-lab__unlock-guide h3{margin:0;font-size:18px;line-height:1.35;letter-spacing:-.025em;text-wrap:balance}.idea-lab__unlock-guide ul{display:grid;width:max-content;max-width:100%;justify-items:start;gap:8px;margin:14px auto 0;padding:0;list-style:none}.idea-lab__unlock-guide li{display:flex;align-items:center;justify-content:flex-start;gap:9px;text-align:left}.idea-lab__unlock-guide li span{display:grid;width:24px;height:24px;flex:none;place-items:center;border-radius:50%;background:rgba(255,68,88,.14);color:#ff9ca8;font-weight:900}.idea-lab__unlock-guide li b{line-height:1.35}
.idea-lab__unlock-example{width:calc(100% - 32px);max-width:376px;margin:20px auto 0}.idea-lab__unlock-example img{display:block;width:100%;height:auto;border-radius:12px}.idea-lab__unlock-example figcaption{margin-top:8px;color:var(--lab-muted);line-height:1.4;text-align:center}
.idea-lab__stage--result .idea-lab__result-section{margin:0;padding:30px 4px;border:0;border-top:1px solid var(--lab-line);border-radius:0;background:none}
.idea-lab__result-section-head{display:block}.idea-lab__result-section-head h3{margin:0;color:var(--lab-text);font-size:20px;line-height:1.35;letter-spacing:-.02em}
.idea-lab__stage--result .idea-lab__result-section>p{margin:14px 0 0;color:#e4e1dc;font-size:16px;line-height:1.68}
.idea-lab__difference-list{display:grid;grid-template-columns:minmax(0,1fr);gap:0;margin-top:16px}.idea-lab__difference-list>div{padding:0 0 16px}.idea-lab__difference-list>div+div{padding:16px 0 0;border-top:1px solid var(--lab-line)}.idea-lab__difference-list b{display:block;color:#8dc8ff;line-height:1.45}.idea-lab__difference-list p{margin:7px 0 0;color:#dfe2e7;line-height:1.62}.idea-lab__difference-list .is-ours{padding-left:14px;border-left:3px solid var(--good,#6fce9f)}.idea-lab__difference-list .is-ours b{color:var(--good,#6fce9f)}
.idea-lab__stage--result .idea-lab__flow-copy{color:#e4e1dc;font-weight:700;line-height:1.72}
.idea-lab__stage--result .idea-lab__closing-line{margin-top:26px;padding-top:18px;border-top:1px dashed var(--lab-line);color:#d9dce2;font-size:16px;font-weight:750}
.idea-lab__stage--result .idea-lab__result-cards{padding:6px 4px 0;border:0;border-top:1px solid var(--lab-line);border-radius:0;background:none}.idea-lab__stage--result .idea-lab__result-cards summary{font-size:14px}.idea-lab__stage--result .idea-lab__result-cards dl{padding:4px 0 18px}.idea-lab__stage--result .idea-lab__result-cards dt{font-size:12px}.idea-lab__stage--result .idea-lab__result-cards dd{font-size:15px;line-height:1.6}
@media(max-height:760px){.idea-lab__result-summary{padding:18px}.idea-lab__result-summary .idea-lab__result-head{margin-top:0}.idea-lab__result-summary .idea-lab__result-hook{margin-top:15px}.idea-lab__locked-details{height:400px}.idea-lab__unlock-guide{padding:16px 4px 10px}.idea-lab__unlock-guide ul{gap:6px;margin-top:11px}}
.idea-lab__stage--result.is-unlocked .idea-lab__locked-details{height:auto}
.idea-lab__unlocked-content{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;padding:28px 4px 0;border-top:1px solid var(--lab-line)}
.idea-lab__unlocked-content .idea-lab__banner{margin:0 0 2px}
.idea-lab__banner{margin-bottom:12px;padding:11px 13px;border:1px solid color-mix(in srgb,var(--good,#6fce9f) 34%,transparent);border-radius:12px;background:color-mix(in srgb,var(--good,#6fce9f) 10%,transparent);color:var(--good,#6fce9f);font-size:12px;font-weight:800;text-align:center}
.idea-lab__linkstate{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--good,#6fce9f) 8%,transparent);color:color-mix(in srgb,var(--good,#6fce9f) 88%,#fff);font-size:10.5px;line-height:1.4;text-align:center}
.idea-lab__artifacts{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;margin-bottom:10px}.idea-lab__artifact{overflow:hidden;border:1px solid var(--lab-line);border-radius:13px;background:#090c11}.idea-lab__artifact-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-bottom:1px solid var(--lab-line)}.idea-lab__artifact-head small{display:block;color:#7e8794;font-size:9px}.idea-lab__artifact-head b{display:block;margin-top:2px;font-size:12px}.idea-lab__artifact-head>span{flex:none;color:var(--good,#6fce9f);font-size:9px;font-weight:800}.idea-lab__artifact pre{max-height:132px;overflow:hidden;white-space:pre-wrap;word-break:break-word;margin:0;padding:12px;color:#c2c9d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:1.55;mask-image:linear-gradient(#000 58%,transparent)}.idea-lab__artifact-example{margin:0;padding:0 12px 12px}.idea-lab__artifact-example img{display:block;width:100%;height:auto;border-radius:10px}.idea-lab__artifact-example figcaption{margin-top:8px;color:var(--lab-muted);line-height:1.4;text-align:center}.idea-lab__artifact>button{display:flex;width:100%;min-height:48px;align-items:center;justify-content:center;border:0;border-top:1px solid var(--lab-line);background:rgba(255,255,255,.035);color:var(--lab-text);font-size:11px;font-weight:850;cursor:pointer}.idea-lab__artifact>button:active{transform:scale(.98)}@media(hover:hover) and (pointer:fine){.idea-lab__artifact>button:hover{background:rgba(255,255,255,.07)}}
.idea-lab__prompt{overflow:hidden;border:1px solid var(--lab-line);border-radius:13px;background:#090c11}.idea-lab__prompt-head{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--lab-line)}.idea-lab__prompt-head small{display:block;color:#7e8794;font-size:9px}.idea-lab__prompt-head b{display:block;margin-top:2px;font-size:12px}.idea-lab__prompt-tag{color:#828b96;font-size:9px;font-weight:800}.idea-lab__prompt.is-unlocked .idea-lab__prompt-tag{color:var(--good,#6fce9f)}
.idea-lab__prompt-copy{position:relative;max-height:170px;overflow:hidden;padding:12px}.idea-lab__prompt.is-unlocked .idea-lab__prompt-copy{max-height:220px}.idea-lab__prompt.is-unlocked.is-expanded .idea-lab__prompt-copy{max-height:none}.idea-lab__prompt.is-unlocked:not(.is-expanded) .idea-lab__prompt-copy::after{content:"";position:absolute;right:0;bottom:0;left:0;height:72px;pointer-events:none;background:linear-gradient(transparent,#090c11)}.idea-lab__prompt-copy p{margin:0 0 7px;color:#c2c9d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:1.55}.idea-lab__prompt-copy p.is-locked{opacity:.72}
.idea-lab__prompt-toggle{display:flex;width:100%;min-height:48px;align-items:center;justify-content:center;border:0;border-top:1px solid var(--lab-line);background:rgba(255,255,255,.025);color:var(--lab-text);font-size:11px;font-weight:800;cursor:pointer;transition:background .16s var(--lab-ease),transform .16s var(--lab-ease)}.idea-lab__prompt-toggle:active{transform:scale(.98)}@media(hover:hover) and (pointer:fine){.idea-lab__prompt-toggle:hover{background:rgba(255,255,255,.06)}}
.idea-lab__lock{position:absolute;right:0;bottom:0;left:0;display:grid;height:104px;place-content:end center;padding-bottom:13px;text-align:center;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}.idea-lab__lock::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(transparent,rgba(9,12,17,.97) 52%)}.idea-lab__lock b{font-size:12px}.idea-lab__lock span{margin-top:4px;color:#828a95;font-size:9.5px}

/* 공유 뒤 같은 결과 화면에 열리는 제작 자료도 최소 14pt 읽기 기준을 유지한다. */
.idea-lab .idea-lab__stage--result .idea-lab__locked-details :where(p,b,strong,small,li){font-size:max(14pt,1em)!important}
.idea-lab .idea-lab__stage--result.is-unlocked .idea-lab__unlocked-content :where(h2,h3,small,p,span,b,strong,button,summary,dt,dd,li,i,pre,figcaption){font-size:max(14pt,1em)!important}
.idea-lab__stage--result .idea-lab__cta,.idea-lab__stage--result .idea-lab__privacy-note,.idea-lab__stage--result .idea-lab__text-action,.idea-lab__stage--result .idea-lab__result-note,.idea-lab__stage--result .idea-lab__unlock-guide :where(li,b,figcaption){font-size:14pt}
.idea-lab__stage--result h3{font-size:20px!important}

/* prefers-reduced-motion */
@media(prefers-reduced-motion:reduce){.idea-lab__stage[data-anim]{animation:none}.idea-lab__stage--result.is-from-handoff :is(.idea-lab__result-summary,.idea-lab__locked-details,.idea-lab__unlock-guide,.idea-lab__cta-bar){animation:idea-result-content-soft-in 120ms ease-out both!important}.idea-lab__cta{transition:background-color .12s ease,border-color .12s ease,color .12s ease,opacity .12s ease}}
`;
