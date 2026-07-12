"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  CHANGE_KIND_LABELS,
  IDEA_LAB_AXIS_META,
  IDEA_LAB_SCENARIOS,
  PLATFORM_LABELS,
} from "./sample-data";
import {
  IDEA_LAB_AXIS_IDS,
  type IdeaLabAxisId,
  type IdeaLabOption,
  type IdeaLabProps,
  type IdeaLabSelection,
  type IdeaLabSharePayload,
  type IdeaLabSourceOption,
  type IdeaLabTwistOption,
} from "./types";
import { FanDeck, FourCardCell, type DeckCard, type FanDeckHandle } from "../four-card";

type ChoiceIndexes = Record<IdeaLabAxisId, number>;
type Revealed = Record<IdeaLabAxisId, boolean>;
type Overrides = Partial<Record<IdeaLabAxisId, string>>;
/** 한 라우트 안에서 한 번에 하나의 화면만 렌더 — 문서형 짬뽕 금지 */
type Stage = "draw" | "result" | "shared";

const EMPTY_REVEALED: Revealed = { source: false, payer: false, moment: false, twist: false };
const DEFAULT_CHOICES: ChoiceIndexes = { source: 0, payer: 0, moment: 0, twist: 0 };
/** 아크 비행 560ms · 자동 뽑기 스텝 간격 430ms · 마지막 안착 후 결과 등장 1150ms (원본 이식) */
const FLIGHT_MS = 560;
const AUTO_STEP_MS = 430;
const RESULT_REVEAL_MS = 1150;

const AXIS_LABELS: Record<string, string> = {
  source: IDEA_LAB_AXIS_META.source.label,
  payer: IDEA_LAB_AXIS_META.payer.label,
  moment: IDEA_LAB_AXIS_META.moment.label,
  twist: IDEA_LAB_AXIS_META.twist.label,
};

/** 뒷면 익명 카드 벨트 — 값은 도메인이 결정하므로 덱 카드는 축 스킨만 담는다 */
const DECK_POOL: DeckCard[] = Array.from({ length: 16 }, (_, index) => {
  const axis = IDEA_LAB_AXIS_IDS[index % IDEA_LAB_AXIS_IDS.length];
  return { axis, key: `deck-${index}`, label: IDEA_LAB_AXIS_META[axis].label };
});

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const isReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const optionFor = (
  axis: IdeaLabAxisId,
  scenarioIndex: number,
  choiceIndexes: ChoiceIndexes,
): IdeaLabSourceOption | IdeaLabOption | IdeaLabTwistOption => {
  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];
  if (axis === "source") return scenario.source;
  if (axis === "payer") return scenario.payers[choiceIndexes.payer % scenario.payers.length];
  if (axis === "moment") return scenario.moments[choiceIndexes.moment % scenario.moments.length];
  return scenario.twists[choiceIndexes.twist % scenario.twists.length];
};

const customOption = (axis: IdeaLabAxisId, value: string, fallback: ReturnType<typeof optionFor>) => {
  if (axis === "source") {
    const source = fallback as IdeaLabSourceOption;
    return {
      ...source,
      id: `custom-${axis}`,
      sourceName: "직접 입력",
      value,
      detail: value,
      evidence: "사용자가 직접 입력한 원본 · 출시 전 근거 확인 필요",
    } satisfies IdeaLabSourceOption;
  }
  if (axis === "twist") {
    const twist = fallback as IdeaLabTwistOption;
    return {
      ...twist,
      id: `custom-${axis}`,
      value,
      detail: "사용자가 직접 적은 한 가지 변화입니다.",
      resultTitle: value,
    } satisfies IdeaLabTwistOption;
  }
  return {
    ...(fallback as IdeaLabOption),
    id: `custom-${axis}`,
    value,
    detail: "사용자가 직접 입력했습니다.",
  } satisfies IdeaLabOption;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
};

function buildPrompt(selection: IdeaLabSelection) {
  const platform = PLATFORM_LABELS[selection.twist.platform];
  return [
    `${platform} 형태의 “${selection.twist.resultTitle}” MVP를 만들어줘.`,
    `돈을 낼 사람은 ${selection.payer.value}이고, 가장 필요한 순간은 ${selection.moment.value}이야.`,
    `원본 구조는 “${selection.source.value}”이며 ${selection.source.preservedFlow} 흐름을 그대로 유지해.`,
    `딱 한 가지 변화는 “${selection.twist.value}”야. 이 변화 외에 새로운 핵심 기능을 추가하지 마.`,
    `첫 화면에서 사용자가 무엇을 넣고, 시스템이 무엇을 처리하며, 어떤 결과를 받는지 고등학생도 이해할 문장으로 보여줘.`,
    `오늘 만들 범위는 ${selection.twist.smallestBuild} 하나로 제한해.`,
    `성공·빈 상태·처리 실패 상태를 각각 만들고, 확인되지 않은 데이터나 가짜 사용자 반응은 표시하지 마.`,
  ].join("\n");
}

/** 고등학생도 이해할 한 줄 설명 — 결과 문장과 별개로 쉬운 말로 재서술 */
function buildPlainExplain(selection: IdeaLabSelection) {
  const kind = CHANGE_KIND_LABELS[selection.twist.kind];
  return `${selection.source.sourceName}이 하던 일을 그대로 두고 딱 하나(${kind})만 다르게 했어요. ${selection.payer.value}이 ${selection.moment.value}에 열어, ${selection.twist.smallestBuild}만 보면 됩니다.`;
}

function initialScenarioIndex(initialScenarioId?: string) {
  if (!initialScenarioId) return 0;
  const index = IDEA_LAB_SCENARIOS.findIndex((scenario) => scenario.id === initialScenarioId);
  return index >= 0 ? index : 0;
}

export function IdeaLab({ initialScenarioId, onShare, onViewPraise, className }: IdeaLabProps) {
  const [scenarioIndex, setScenarioIndex] = useState(() => initialScenarioIndex(initialScenarioId));
  const [choiceIndexes, setChoiceIndexes] = useState<ChoiceIndexes>(DEFAULT_CHOICES);
  const [revealed, setRevealed] = useState<Revealed>(EMPTY_REVEALED);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editorAxis, setEditorAxis] = useState<IdeaLabAxisId | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [hotAxis, setHotAxis] = useState<IdeaLabAxisId | null>(null);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
  const [stage, setStage] = useState<Stage>("draw");
  const [message, setMessage] = useState("네 장을 먼저 뽑아보세요.");
  const [copied, setCopied] = useState(false);

  const deckRef = useRef<FanDeckHandle>(null);
  const cellRefs = useRef<Partial<Record<IdeaLabAxisId, HTMLElement | null>>>({});
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const scenarioRef = useRef(scenarioIndex);
  scenarioRef.current = scenarioIndex;

  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];

  const resolved = useMemo(() => {
    const result = {} as Record<IdeaLabAxisId, ReturnType<typeof optionFor> | null>;
    IDEA_LAB_AXIS_IDS.forEach((axis) => {
      if (!revealed[axis]) {
        result[axis] = null;
        return;
      }
      const fallback = optionFor(axis, scenarioIndex, choiceIndexes);
      result[axis] = overrides[axis]?.trim() ? customOption(axis, overrides[axis]!.trim(), fallback) : fallback;
    });
    return result;
  }, [choiceIndexes, overrides, revealed, scenarioIndex]);

  const complete = IDEA_LAB_AXIS_IDS.every((axis) => resolved[axis] !== null);
  const aimAxis = IDEA_LAB_AXIS_IDS.find((axis) => !revealed[axis]) ?? null;
  const inactiveAxes = IDEA_LAB_AXIS_IDS.filter((axis) => revealed[axis]);

  const selection = complete
    ? ({
        source: resolved.source as IdeaLabSourceOption,
        payer: resolved.payer as IdeaLabOption,
        moment: resolved.moment as IdeaLabOption,
        twist: resolved.twist as IdeaLabTwistOption,
      } satisfies IdeaLabSelection)
    : null;
  const prompt = selection ? buildPrompt(selection) : "";
  const promptLines = prompt ? prompt.split("\n") : [];

  const optionsForAxis = (axis: IdeaLabAxisId): IdeaLabOption[] =>
    axis === "payer" ? scenario.payers : axis === "moment" ? scenario.moments : scenario.twists;

  /** active-rack — 지금 조준 중인(다음 채울) 축의 대안 후보 스트립. 뽑는 중·완성 시엔 감춘다. */
  const rackAxis = !complete && !busy ? aimAxis : null;
  const rackOptions: IdeaLabOption[] = rackAxis
    ? rackAxis === "source"
      ? (IDEA_LAB_SCENARIOS.map((item) => item.source) as unknown as IdeaLabOption[])
      : optionsForAxis(rackAxis)
    : [];

  /** active-rack 후보 탭 → 그 축만 해당 후보로 채워 공개 (드래그·탭 뽑기의 대안 경로) */
  const pickCandidate = (axis: IdeaLabAxisId, index: number) => {
    if (busy) return;
    if (axis === "source") {
      setScenarioIndex(index);
      setChoiceIndexes(DEFAULT_CHOICES);
      setOverrides({});
      setRevealed({ source: true, payer: false, moment: false, twist: false });
    } else {
      setChoiceIndexes((current) => ({ ...current, [axis]: index }));
      setOverrides((current) => ({ ...current, [axis]: undefined }));
      setRevealed((current) => ({ ...current, [axis]: true }));
    }
    setPromptUnlocked(false);
  };

  /** 한 축을 랜덤 후보로 채워 공개한다 (source는 시나리오당 하나라 공개만) */
  const fillAxis = (axis: IdeaLabAxisId) => {
    if (axis === "source") {
      setRevealed((current) => ({ ...current, source: true }));
      return;
    }
    const options = optionsForAxis(axis);
    const index = Math.floor(Math.random() * options.length);
    setChoiceIndexes((current) => ({ ...current, [axis]: index }));
    setOverrides((current) => ({ ...current, [axis]: undefined }));
    setRevealed((current) => ({ ...current, [axis]: true }));
  };

  /** 덱 카드가 조준 칸에 안착하는 순간 — 그 시점의 첫 빈 축을 채운다 */
  const onDeckPick = () => {
    const axis = IDEA_LAB_AXIS_IDS.find((a) => !revealedRef.current[a]);
    if (!axis) return;
    fillAxis(axis);
    setPromptUnlocked(false);
    if (IDEA_LAB_AXIS_IDS.filter((a) => revealedRef.current[a]).length + 1 >= IDEA_LAB_AXIS_IDS.length) {
      setMessage("네 장이 완성됐어요. 카드를 탭해 바꾸거나, 네 장으로 결과를 보세요.");
    }
  };

  const getTargetRect = (axis: string) =>
    cellRefs.current[axis as IdeaLabAxisId]?.getBoundingClientRect() ?? null;

  const drawOne = (axis: IdeaLabAxisId, rm: boolean) =>
    new Promise<void>((resolve) => {
      const step = () => window.setTimeout(resolve, rm ? 60 : AUTO_STEP_MS);
      const ok = deckRef.current?.drawTo(axis, step);
      if (!ok) {
        fillAxis(axis);
        window.setTimeout(resolve, rm ? 40 : 200);
      }
    });

  const drawAll = async () => {
    if (busy) return;
    setBusy(true);
    setPromptUnlocked(false);
    setEditorAxis(null);
    setHotAxis(null);
    const rm = isReduced();
    const nextScenario = complete ? (scenarioIndex + 1) % IDEA_LAB_SCENARIOS.length : scenarioIndex;
    setScenarioIndex(nextScenario);
    setChoiceIndexes(DEFAULT_CHOICES);
    setOverrides({});
    setRevealed(EMPTY_REVEALED);
    setMessage("회전하는 덱에서 서로 맞는 네 장을 뽑고 있어요.");
    deckRef.current?.hold(true);
    await wait(rm ? 20 : 240);
    for (const axis of IDEA_LAB_AXIS_IDS) {
      await drawOne(axis, rm);
    }
    deckRef.current?.hold(false);
    if (!rm) await wait(RESULT_REVEAL_MS);
    setMessage("네 장이 완성됐어요. 카드를 탭해 바꾸거나, 네 장으로 결과를 보세요.");
    setBusy(false);
  };

  /** 이 카드만 바꾸기 — 제자리 스왑(400ms 재플립), 비행 없음 (전체 다시 뽑기와 명확히 구분) */
  const replaceAxis = async (axis: IdeaLabAxisId, nextIndex?: number) => {
    if (busy) return;
    setBusy(true);
    setPromptUnlocked(false);
    setEditorAxis(null);
    if (axis === "source") {
      const nextScenario = nextIndex ?? (scenarioIndex + 1) % IDEA_LAB_SCENARIOS.length;
      setScenarioIndex(nextScenario);
      setChoiceIndexes(DEFAULT_CHOICES);
      setOverrides({});
      setRevealed({ source: true, payer: true, moment: true, twist: true });
      setMessage("원본이 바뀌어 나머지 세 장도 맞는 후보로 다시 연결했어요.");
    } else {
      const options = optionsForAxis(axis);
      const index = nextIndex ?? (choiceIndexes[axis] + 1) % options.length;
      setChoiceIndexes((current) => ({ ...current, [axis]: index }));
      setOverrides((current) => ({ ...current, [axis]: undefined }));
      setRevealed((current) => ({ ...current, [axis]: true }));
      setMessage(`${IDEA_LAB_AXIS_META[axis].label} 카드만 바꿨어요.`);
    }
    await wait(isReduced() ? 30 : 450);
    setBusy(false);
  };

  const openEditor = (axis: IdeaLabAxisId) => {
    setEditorAxis(axis);
    setCustomDraft(overrides[axis] ?? "");
  };

  const saveCustom = () => {
    if (!editorAxis || !customDraft.trim()) return;
    setOverrides((current) => ({ ...current, [editorAxis]: customDraft.trim() }));
    setRevealed((current) => ({ ...current, [editorAxis]: true }));
    setPromptUnlocked(false);
    setMessage(`${IDEA_LAB_AXIS_META[editorAxis].label}에 직접 쓴 문장을 넣었어요.`);
    setCustomDraft("");
    setEditorAxis(null);
  };

  const goResult = () => {
    if (!selection) return;
    setEditorAxis(null);
    setMessage("친구에게 물어보면 전체 제작 문구가 무료로 열려요.");
    setStage("result");
  };
  const goDraw = () => setStage("draw");

  const sharePayload = selection
    ? ({
        title: selection.twist.resultTitle,
        summary: `${selection.payer.value}이 ${selection.moment.value}에 쓰는 ${PLATFORM_LABELS[selection.twist.platform]} 아이디어`,
        prompt,
        platform: selection.twist.platform,
        selection,
      } satisfies IdeaLabSharePayload)
    : null;

  const shareAndUnlock = async () => {
    if (!sharePayload || busy) return;
    setBusy(true);
    let success = false;
    const url = window.location.href;
    try {
      if (onShare) {
        success = await onShare(sharePayload);
      } else if (navigator.share) {
        try {
          await navigator.share({
            title: sharePayload.title,
            text: `${sharePayload.summary}\n\n원본에서 한 곳만 바꾼 아이디어예요. 어떻게 생각해?`,
            url,
          });
          success = true;
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== "AbortError") {
            success = await copyText(`${sharePayload.title}\n${sharePayload.summary}\n${url}`);
          }
        }
      } else {
        success = await copyText(`${sharePayload.title}\n${sharePayload.summary}\n${url}`);
      }
    } finally {
      setBusy(false);
    }
    if (success) {
      setPromptUnlocked(true);
      setStage("shared");
      setMessage("공유가 끝나 전체 제작 문구를 열었어요.");
    } else {
      setMessage("공유를 마치지 않았어요. 결과는 그대로 보관돼요.");
    }
  };

  const copyPrompt = async () => {
    if (!promptUnlocked || !prompt) return;
    const success = await copyText(prompt);
    setCopied(success);
    setMessage(success ? "전체 제작 문구를 복사했어요." : "복사가 막혔어요. 문구를 직접 선택해 주세요.");
    if (success) window.setTimeout(() => setCopied(false), 1800);
  };

  const editorOptions = editorAxis
    ? editorAxis === "source"
      ? IDEA_LAB_SCENARIOS.map((item) => item.source)
      : optionsForAxis(editorAxis)
    : [];

  return (
    <section
      className={`idea-lab ${className ?? ""}`}
      data-stage={stage}
      aria-label="검증된 원본에서 시작하는 네 장 아이디어 제작기"
    >
      <style suppressHydrationWarning>{IDEA_LAB_CSS}</style>

      {/* ── A1 뽑기 스테이지 ─────────────────────────────────────── */}
      {stage === "draw" ? (
        <div className="idea-lab__stage idea-lab__stage--draw" data-anim>
          <header className="idea-lab__appbar">
            <div>
              <p className="idea-lab__appbar-eyebrow">오늘 해볼까</p>
              <h1 className="idea-lab__appbar-title">오늘은 뭘 만들어볼까요?</h1>
            </div>
            <span className="idea-lab__appbar-meta">{inactiveAxes.length} / 4</span>
          </header>

          <div className="idea-lab__slots" role="list">
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
              const contentKey = value ? `${axis}:${value.id}:${overrides[axis] ?? ""}` : "";
              return (
                <article
                  key={axis}
                  className={`idea-lab__slot ${value ? "is-filled" : ""} ${aimAxis === axis && !busy ? "is-aim" : ""} ${hotAxis === axis ? "is-hot" : ""}`}
                  data-value={value?.value ?? ""}
                  style={{ "--axis": meta.color, "--axis-soft": meta.softColor } as CSSProperties}
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
                    floaty={complete}
                    floatDelay={index}
                    frameClassName="idea-lab__card-frame"
                    onFill={() => fillAxis(axis)}
                    onSwap={() => openEditor(axis)}
                  />
                </article>
              );
            })}
          </div>

          <p className="idea-lab__status" aria-live="polite">
            {complete ? message : busy ? message : "카드를 탭·드래그하거나 한 번에 네 장을 뽑아요."}
          </p>

          {rackAxis ? (
            <div
              className="idea-lab__rack"
              style={{ "--axis": IDEA_LAB_AXIS_META[rackAxis].color } as CSSProperties}
            >
              <b className="idea-lab__rack-title">
                지금 채울 카드 · {IDEA_LAB_AXIS_META[rackAxis].label}
              </b>
              <div className="idea-lab__rack-cards">
                {rackOptions.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => pickCandidate(rackAxis, index)}
                    disabled={busy}
                  >
                    {option.value}
                  </button>
                ))}
                <button
                  type="button"
                  className="idea-lab__rack-custom"
                  onClick={() => openEditor(rackAxis)}
                  disabled={busy}
                >
                  직접 쓰기
                </button>
              </div>
            </div>
          ) : null}

          <div className="idea-lab__deck" aria-hidden={busy ? "true" : undefined}>
            <div className="idea-lab__deck-stage">
              <FanDeck
                ref={deckRef}
                cards={DECK_POOL}
                axisLabels={AXIS_LABELS}
                aimAxis={aimAxis}
                inactiveAxes={inactiveAxes}
                disabled={!!editorAxis}
                flightDurationMs={FLIGHT_MS}
                getTargetRect={getTargetRect}
                onDragOver={(axis) => setHotAxis((axis as IdeaLabAxisId | null) ?? null)}
                onPick={onDeckPick}
              />
            </div>
          </div>

          <div className="idea-lab__cta-bar">
            {complete ? (
              <>
                <button type="button" className="idea-lab__cta idea-lab__cta--primary" onClick={goResult}>
                  네 장으로 결과 보기 →
                </button>
                <button type="button" className="idea-lab__cta idea-lab__cta--ghost" onClick={drawAll} disabled={busy}>
                  {busy ? "뽑는 중…" : "↻ 4장 다시 뽑기"}
                </button>
              </>
            ) : (
              <button type="button" className="idea-lab__cta idea-lab__cta--primary" onClick={drawAll} disabled={busy}>
                {busy ? "뽑는 중…" : "✦ 4장 한 번에 뽑기"}
              </button>
            )}
          </div>

          {editorAxis ? (
            <div className="idea-lab__sheet-wrap" role="dialog" aria-modal="true" aria-label={`${IDEA_LAB_AXIS_META[editorAxis].label} 카드 바꾸기`}>
              <button type="button" className="idea-lab__sheet-scrim" aria-label="닫기" onClick={() => setEditorAxis(null)} />
              <div className="idea-lab__sheet" style={{ "--axis": IDEA_LAB_AXIS_META[editorAxis].color } as CSSProperties}>
                <div className="idea-lab__sheet-head">
                  <div><small>이 카드</small><h2>{IDEA_LAB_AXIS_META[editorAxis].label}</h2></div>
                  <div className="idea-lab__sheet-head-actions">
                    <button type="button" className="idea-lab__sheet-reroll" onClick={() => replaceAxis(editorAxis)} disabled={busy}>↻ 이 카드만 바꾸기</button>
                    <button type="button" className="idea-lab__sheet-close" onClick={() => setEditorAxis(null)} aria-label="후보 닫기">×</button>
                  </div>
                </div>
                <div className="idea-lab__candidates">
                  {editorOptions.map((option, index) => {
                    const active = editorAxis === "source"
                      ? scenario.source.id === option.id && !overrides.source
                      : choiceIndexes[editorAxis] === index && !overrides[editorAxis];
                    return (
                      <button
                        type="button"
                        key={option.id}
                        className={active ? "is-active" : ""}
                        onClick={() => replaceAxis(editorAxis, index)}
                        disabled={busy}
                      >
                        {editorAxis === "source" ? <small>{PLATFORM_LABELS[(option as IdeaLabSourceOption).platform]}</small> : null}
                        <b>{option.value}</b>
                      </button>
                    );
                  })}
                </div>
                <div className="idea-lab__custom">
                  <label htmlFor={`idea-lab-custom-${editorAxis}`}>카드 대신 내 문장 쓰기</label>
                  <div>
                    <input
                      id={`idea-lab-custom-${editorAxis}`}
                      value={customDraft}
                      onChange={(event) => setCustomDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") saveCustom(); }}
                      placeholder={`${IDEA_LAB_AXIS_META[editorAxis].label}을 한 문장으로 적어주세요`}
                    />
                    <button type="button" onClick={saveCustom} disabled={!customDraft.trim()}>적용</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── A2 결과 스테이지 ─────────────────────────────────────── */}
      {stage === "result" && selection ? (
        <div className="idea-lab__stage idea-lab__stage--result" data-anim>
          <div className="idea-lab__stage-scroll">
          <div className="idea-lab__stage-top">
            <button type="button" className="idea-lab__back" onClick={goDraw}>← 카드 다시 보기</button>
          </div>
          <aside className="idea-lab__result is-ready">
            <div className="idea-lab__result-head">
              <div><small>한 끗 결과</small><h2>{selection.twist.resultTitle}</h2></div>
              <span>{PLATFORM_LABELS[selection.twist.platform]}</span>
            </div>

            <p className="idea-lab__result-summary">
              <mark className="is-payer" style={{ "--mark": IDEA_LAB_AXIS_META.payer.color } as CSSProperties}>{selection.payer.value}</mark>이<br />
              <mark className="is-moment" style={{ "--mark": IDEA_LAB_AXIS_META.moment.color } as CSSProperties}>{selection.moment.value}</mark>에 쓰도록,<br />
              원본에서 <mark className="is-twist" style={{ "--mark": IDEA_LAB_AXIS_META.twist.color } as CSSProperties}>{selection.twist.value}</mark>만 적용합니다.
            </p>

            <div className="idea-lab__origin">
              <span className="idea-lab__origin-label">① 검증된 원본</span>
              <b>{selection.source.sourceName} · {selection.source.value}</b>
              <small>근거 · {selection.source.evidence}</small>
            </div>

            <div className="idea-lab__explain">
              <b>쉽게 말하면</b>
              <p>{buildPlainExplain(selection)}</p>
            </div>

            <div className="idea-lab__keepchange">
              <div>
                <small>그대로 남김</small>
                <p>{selection.source.preservedFlow}</p>
              </div>
              <div>
                <small>한 가지만 변경</small>
                <p>{selection.twist.value}</p>
              </div>
            </div>

            <div className="idea-lab__prompt">
              <div className="idea-lab__prompt-head">
                <div><small>AI 코딩 도구에 붙여 넣을</small><b>제작 문구</b></div>
                <span className="idea-lab__prompt-tag">앞부분 미리보기</span>
              </div>
              <div className="idea-lab__prompt-copy">
                {promptLines.map((line, index) => (
                  <p key={line} className={index >= 3 ? "is-locked" : ""}>{line}</p>
                ))}
                <div className="idea-lab__lock">
                  <b>공유하면 나머지 제작 문구가 열려요</b>
                  <span>아이디어 링크를 공유하면 무료로 열려요.</span>
                </div>
              </div>
            </div>
          </aside>
          </div>

          <div className="idea-lab__cta-bar idea-lab__cta-bar--stack">
            <p className="idea-lab__result-note" aria-live="polite">{message}</p>
            <button type="button" className="idea-lab__cta idea-lab__cta--primary" onClick={shareAndUnlock} disabled={busy}>
              링크 공유하고 전체 문구 열기
            </button>
          </div>
        </div>
      ) : null}

      {/* ── A3 공유 완료 스테이지 ────────────────────────────────── */}
      {stage === "shared" && selection ? (
        <div className="idea-lab__stage idea-lab__stage--shared" data-anim>
          <div className="idea-lab__stage-scroll">
          <div className="idea-lab__stage-top">
            <button type="button" className="idea-lab__back" onClick={() => setStage("result")}>← 결과로</button>
            <span className="idea-lab__done-tag">공유 완료 ✓</span>
          </div>
          <div className="idea-lab__banner">전체 제작 문구가 열렸어요</div>
          <aside className="idea-lab__result is-ready">
            <div className="idea-lab__result-head">
              <div><small>전체 공개</small><h2>{selection.twist.resultTitle}</h2></div>
              <span>{PLATFORM_LABELS[selection.twist.platform]}</span>
            </div>
            <div className="idea-lab__prompt is-unlocked">
              <div className="idea-lab__prompt-head">
                <div><small>AI 코딩 도구에 붙여 넣을</small><b>제작 문구</b></div>
                <span className="idea-lab__prompt-tag">전체 공개</span>
              </div>
              <div className="idea-lab__prompt-copy">
                {promptLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
            <p className="idea-lab__linkstate">공유 링크 전송 완료 · 익명 칭찬이 오면 알려드려요</p>
          </aside>
          </div>

          <div className="idea-lab__cta-bar idea-lab__cta-bar--stack">
            <button type="button" className="idea-lab__cta idea-lab__cta--primary" onClick={copyPrompt}>
              {copied ? "복사했어요 ✓" : "전체 제작 문구 복사"}
            </button>
            {onViewPraise ? (
              <button type="button" className="idea-lab__cta idea-lab__cta--ghost" onClick={onViewPraise}>
                오늘의 칭찬 보러가기 →
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const IDEA_LAB_CSS = `
.idea-lab{--lab-bg:#090b10;--lab-surface:#11151d;--lab-surface-2:#171c26;--lab-line:rgba(255,255,255,.11);--lab-hairline:rgba(255,255,255,.16);--lab-text:#f4f1e9;--lab-muted:#9ba2ae;--lab-primary:var(--primary,#ff4458);--lab-deco:var(--deco-glow,#6db4f5);--lab-ease:var(--ease,cubic-bezier(.65,0,.35,1));--lab-spring:var(--spring,cubic-bezier(.34,1.56,.64,1));position:relative;display:block;width:100%;height:100%;color:var(--lab-text);font-family:var(--font-sans),system-ui,sans-serif}
.idea-lab *{box-sizing:border-box}.idea-lab button,.idea-lab input{font:inherit}.idea-lab button{color:inherit}
.idea-lab button:focus-visible,.idea-lab input:focus-visible{outline:2px solid var(--lab-primary);outline-offset:2px}
.idea-lab ::selection{background:color-mix(in srgb,var(--lab-primary) 34%,transparent);color:#fff}

/* ── 스테이지 셸 ── */
.idea-lab__stage{position:relative;display:flex;flex-direction:column;height:100%;min-height:0}
.idea-lab__stage--draw{user-select:none;-webkit-user-select:none}
.idea-lab__stage--draw input,.idea-lab__stage--draw textarea{user-select:text;-webkit-user-select:text}
@keyframes idea-stage-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.idea-lab__stage[data-anim]{animation:idea-stage-in .32s var(--lab-ease) both}
.idea-lab__stage--result,.idea-lab__stage--shared{overflow:hidden;padding:0}
.idea-lab__stage-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:14px 16px 8px}
.idea-lab__stage-scroll::-webkit-scrollbar{width:.4rem}
.idea-lab__stage-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--lab-primary) 26%,transparent);border-radius:1rem}

/* ── A1 뽑기 스테이지 (100dvh 한 화면 완결) ── */
.idea-lab__stage--draw{padding:10px 16px 0;overflow:hidden}
.idea-lab__appbar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 2px 10px}
.idea-lab__appbar-eyebrow{margin:0;color:var(--lab-primary);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.idea-lab__appbar-title{margin:3px 0 0;font-family:inherit;font-weight:800;font-size:15px;line-height:1.25;letter-spacing:-.01em}
.idea-lab__appbar-meta{flex:none;color:var(--lab-muted);font-size:10px;font-weight:700}
.idea-lab__slots{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:min-content;gap:10px;align-content:center;padding:2px 0}
.idea-lab__slot{position:relative;min-width:0;display:flex;flex-direction:column;gap:6px;padding:8px 8px 10px;border:1px solid var(--lab-line);border-radius:14px;background:var(--lab-surface);overflow:hidden;transition:border-color .18s ease}
.idea-lab__slot::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--axis)}
.idea-lab__slot.is-aim,.idea-lab__slot.is-hot{border-color:var(--axis)}
.idea-lab__card-frame{max-width:min(38vw,13vh)}
.idea-lab__slot-label{display:flex;align-items:center;gap:5px;color:var(--axis);font-size:10.5px;font-weight:800;letter-spacing:.02em}.idea-lab__slot-label span{font-size:9.5px;font-weight:900;font-variant-numeric:tabular-nums;opacity:.92}
.idea-lab__slot.is-aim,.idea-lab__slot.is-hot{box-shadow:0 0 0 1px color-mix(in srgb,var(--axis) 32%,transparent)}
.idea-lab__status{flex:none;min-height:15px;margin:4px 2px 6px;color:var(--lab-muted);font-size:11px;text-align:center;text-wrap:balance}
.idea-lab__rack{flex:none;margin:0 0 8px;padding:8px 9px;border:1px solid color-mix(in srgb,var(--axis) 30%,transparent);border-radius:12px;background:color-mix(in srgb,var(--axis) 7%,var(--lab-surface))}
.idea-lab__rack-title{display:block;color:var(--axis);font-size:9.5px;font-weight:800;letter-spacing:.02em}
.idea-lab__rack-cards{display:flex;gap:6px;margin-top:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.idea-lab__rack-cards::-webkit-scrollbar{display:none}
.idea-lab__rack-cards button{flex:0 0 auto;max-width:160px;padding:7px 10px;border:1px solid var(--lab-line);border-radius:9px;background:rgba(255,255,255,.04);color:var(--lab-text);font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;transition:border-color .16s ease}
.idea-lab__rack-cards button:hover:not(:disabled){border-color:color-mix(in srgb,var(--axis) 50%,transparent)}
.idea-lab__rack-cards button:active:not(:disabled){transform:translateY(1px)}
.idea-lab__rack-cards button:disabled{opacity:.5;cursor:default}
.idea-lab__rack-custom{color:var(--lab-muted)!important;border-style:dashed!important}
.idea-lab__deck{flex:none;position:relative;z-index:3;height:clamp(112px,18vh,150px);margin:0 -16px 0;border-top:1px solid var(--lab-line)}
.idea-lab__deck-stage{position:absolute;inset:0;overflow:hidden}
.idea-lab__cta-bar{flex:none;position:sticky;bottom:0;z-index:8;display:grid;gap:8px;padding:12px 0 calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,var(--lab-bg) 68%,transparent)}
.idea-lab__stage--draw .idea-lab__cta-bar{grid-template-columns:1fr auto}
.idea-lab__stage--draw .idea-lab__cta-bar:has(.idea-lab__cta--ghost){grid-template-columns:1fr auto}
.idea-lab__stage--draw .idea-lab__cta-bar:not(:has(.idea-lab__cta--ghost)){grid-template-columns:1fr}
.idea-lab__cta{min-height:48px;padding:0 18px;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .1s ease}
.idea-lab__cta--primary{border:1px solid var(--lab-primary);background:var(--lab-primary);color:#fff!important}
.idea-lab__cta--primary:hover:not(:disabled){background:var(--primary-hover,#ff5f70)}
.idea-lab__cta--primary:active:not(:disabled){transform:translateY(1px)}
.idea-lab__cta--ghost{border:1px solid var(--lab-hairline);background:rgba(255,255,255,.04);color:var(--lab-text);white-space:nowrap}
.idea-lab__cta--ghost:hover:not(:disabled){border-color:color-mix(in srgb,var(--lab-primary) 42%,transparent)}
.idea-lab__cta--ghost:active:not(:disabled){transform:translateY(1px)}
.idea-lab__cta:disabled{opacity:.55;cursor:wait}
.idea-lab__cta-bar--stack{grid-template-columns:1fr}
.idea-lab__result-note{margin:0;color:var(--lab-muted);font-size:11px;text-align:center;text-wrap:balance}
.idea-lab__stage--result .idea-lab__cta-bar,.idea-lab__stage--shared .idea-lab__cta-bar{position:static;flex:none;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--lab-line);background:linear-gradient(to top,var(--lab-bg),color-mix(in srgb,var(--lab-bg) 88%,transparent))}

/* ── 바텀 시트 (카드 바꾸기 / 직접 쓰기) ── */
.idea-lab__sheet-wrap{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;justify-content:flex-end}
.idea-lab__sheet-scrim{flex:1;border:0;background:rgba(4,6,10,.62);cursor:pointer;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:idea-fade .18s ease both}
@keyframes idea-fade{from{opacity:0}to{opacity:1}}
@keyframes idea-sheet-up{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.idea-lab__sheet{border-top:1px solid color-mix(in srgb,var(--axis) 42%,transparent);border-radius:20px 20px 0 0;padding:14px 14px calc(16px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,var(--lab-surface-2),var(--lab-surface));box-shadow:0 -14px 40px rgba(0,0,0,.5);animation:idea-sheet-up .26s var(--lab-ease) both}
.idea-lab__sheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.idea-lab__sheet-head small{color:var(--lab-muted);font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.idea-lab__sheet-head h2{margin:2px 0 0;color:var(--axis);font-size:16px;font-weight:800}
.idea-lab__sheet-head-actions{display:flex;align-items:center;gap:7px}
.idea-lab__sheet-reroll{min-height:34px;padding:0 11px;border:1px solid color-mix(in srgb,var(--axis) 40%,transparent);border-radius:10px;background:color-mix(in srgb,var(--axis) 12%,transparent);color:var(--axis);font-size:11px;font-weight:800;cursor:pointer}
.idea-lab__sheet-close{width:32px;height:32px;flex:none;border:1px solid var(--lab-line);border-radius:50%;background:transparent;color:var(--lab-muted);font-size:15px;cursor:pointer}
.idea-lab__candidates{display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:4px;scroll-snap-type:x mandatory}
.idea-lab__candidates::-webkit-scrollbar{height:.3rem}.idea-lab__candidates::-webkit-scrollbar-thumb{background:var(--lab-line);border-radius:1rem}
.idea-lab__candidates button{flex:0 0 72%;min-height:70px;padding:11px;border:1px solid var(--lab-line);border-radius:12px;background:rgba(255,255,255,.03);text-align:left;cursor:pointer;scroll-snap-align:start;transition:border-color .16s ease,transform .16s var(--lab-spring)}
.idea-lab__candidates button:active{transform:scale(.98)}
.idea-lab__candidates button.is-active{border-color:var(--axis);background:color-mix(in srgb,var(--axis) 14%,transparent)}
.idea-lab__candidates small{display:block;margin-bottom:5px;color:var(--axis);font-size:9px;font-weight:800}.idea-lab__candidates b{font-size:12px;line-height:1.4;font-weight:700}
.idea-lab__custom{margin-top:13px}.idea-lab__custom label{display:block;margin-bottom:6px;color:var(--lab-muted);font-size:10px}.idea-lab__custom>div{display:grid;grid-template-columns:1fr auto;gap:7px}.idea-lab__custom input{min-width:0;height:44px;padding:0 12px;border:1px solid var(--lab-line);border-radius:11px;outline:0;background:#07090d;color:var(--lab-text);font-size:12px}.idea-lab__custom input:focus{border-color:var(--axis)}.idea-lab__custom button{padding:0 16px;border:0;border-radius:11px;background:var(--axis);color:#091016!important;font-size:12px;font-weight:900;cursor:pointer}.idea-lab__custom button:disabled{opacity:.5}

/* ── A2/A3 상단 ── */
.idea-lab__stage-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.idea-lab__back{min-height:38px;padding:0 13px;border:1px solid var(--lab-hairline);border-radius:pill;border-radius:999px;background:rgba(255,255,255,.04);color:var(--lab-text);font-size:12px;font-weight:800;cursor:pointer;transition:transform .16s var(--lab-spring),border-color .16s ease}
.idea-lab__back:hover{border-color:color-mix(in srgb,var(--lab-primary) 40%,transparent)}.idea-lab__back:active{transform:translateX(-2px)}
.idea-lab__done-tag{padding:6px 11px;border:1px solid color-mix(in srgb,var(--good,#6fce9f) 42%,transparent);border-radius:999px;background:color-mix(in srgb,var(--good,#6fce9f) 12%,transparent);color:var(--good,#6fce9f);font-size:11px;font-weight:900}

/* ── 결과 패널 (moon-panel급 표면) ── */
.idea-lab__result{position:relative;border:1px solid var(--lab-hairline);border-radius:16px;padding:18px;background:var(--lab-surface)}
.idea-lab__result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--lab-line)}.idea-lab__result-head small{color:var(--lab-primary);font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.idea-lab__result-head h2{margin:6px 0 0;font-family:inherit;font-weight:800;font-size:20px;line-height:1.25;letter-spacing:-.01em;text-wrap:balance}.idea-lab__result-head>span{flex:none;padding:5px 10px;border:1px solid rgba(255,68,88,.35);border-radius:999px;background:rgba(255,68,88,.08);color:#ff9ca8;font-size:10px;font-weight:900;white-space:nowrap}
.idea-lab__result-summary{margin:16px 0;font-size:16px;font-weight:800;line-height:1.8}.idea-lab__result-summary mark{padding:1px 5px;border-radius:5px;background:color-mix(in srgb,var(--mark) 9%,transparent);box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--mark) 62%,transparent);color:var(--lab-text)}
.idea-lab__origin{margin-bottom:11px;padding:12px 13px;border:1px solid color-mix(in srgb,var(--lab-deco) 32%,transparent);border-left:3px solid var(--lab-deco);border-radius:12px;background:color-mix(in srgb,var(--lab-deco) 7%,transparent)}.idea-lab__origin-label{display:inline-block;margin-bottom:6px;color:var(--lab-deco);font-size:10px;font-weight:900;letter-spacing:.04em}.idea-lab__origin b{display:block;font-size:13px;line-height:1.5;font-weight:700}.idea-lab__origin small{display:block;margin-top:7px;color:#7f8792;font-size:10px;line-height:1.5}
.idea-lab__explain{margin-bottom:12px;padding:12px 13px;border:1px solid var(--lab-line);border-radius:12px;background:rgba(255,255,255,.024)}.idea-lab__explain b{font-size:12px}.idea-lab__explain p{margin:7px 0 0;color:#c6ccd5;font-size:12px;line-height:1.6}
.idea-lab__keepchange{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.idea-lab__keepchange>div{padding:11px 12px;border:1px solid var(--lab-line);border-radius:12px;background:rgba(255,255,255,.024)}.idea-lab__keepchange small{font-size:9px;font-weight:900;letter-spacing:.02em}.idea-lab__keepchange>div:first-child small{color:var(--axis-source)}.idea-lab__keepchange>div:last-child small{color:var(--axis-twist)}.idea-lab__keepchange p{margin:6px 0 0;color:#c6ccd5;font-size:11px;line-height:1.5}
.idea-lab__banner{margin-bottom:12px;padding:11px 13px;border:1px solid color-mix(in srgb,var(--good,#6fce9f) 34%,transparent);border-radius:12px;background:color-mix(in srgb,var(--good,#6fce9f) 10%,transparent);color:var(--good,#6fce9f);font-size:12px;font-weight:800;text-align:center}
.idea-lab__linkstate{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--good,#6fce9f) 8%,transparent);color:color-mix(in srgb,var(--good,#6fce9f) 88%,#fff);font-size:10.5px;line-height:1.4;text-align:center}
.idea-lab__prompt{overflow:hidden;border:1px solid var(--lab-line);border-radius:13px;background:#090c11}.idea-lab__prompt-head{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid var(--lab-line)}.idea-lab__prompt-head small{display:block;color:#7e8794;font-size:9px}.idea-lab__prompt-head b{display:block;margin-top:2px;font-size:12px}.idea-lab__prompt-tag{color:#828b96;font-size:9px;font-weight:800}.idea-lab__prompt.is-unlocked .idea-lab__prompt-tag{color:var(--good,#6fce9f)}
.idea-lab__prompt-copy{position:relative;max-height:170px;overflow:hidden;padding:12px}.idea-lab__prompt.is-unlocked .idea-lab__prompt-copy{max-height:none}.idea-lab__prompt-copy p{margin:0 0 7px;color:#c2c9d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;line-height:1.55}.idea-lab__prompt-copy p.is-locked{opacity:.72}
.idea-lab__lock{position:absolute;right:0;bottom:0;left:0;display:grid;height:104px;place-content:end center;padding-bottom:13px;text-align:center;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}.idea-lab__lock::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(transparent,rgba(9,12,17,.97) 52%)}.idea-lab__lock b{font-size:12px}.idea-lab__lock span{margin-top:4px;color:#828a95;font-size:9.5px}

/* prefers-reduced-motion */
@media(prefers-reduced-motion:reduce){.idea-lab__stage[data-anim]{animation:none}.idea-lab__sheet,.idea-lab__sheet-scrim{animation:none}.idea-lab__cta,.idea-lab__back,.idea-lab__candidates button{transition:none}}
`;
