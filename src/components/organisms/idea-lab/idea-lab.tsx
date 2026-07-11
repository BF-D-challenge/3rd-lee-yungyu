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

export function IdeaLab({ initialScenarioId, onShare, className }: IdeaLabProps) {
  const [scenarioIndex, setScenarioIndex] = useState(() => initialScenarioIndex(initialScenarioId));
  const [choiceIndexes, setChoiceIndexes] = useState<ChoiceIndexes>(DEFAULT_CHOICES);
  const [revealed, setRevealed] = useState<Revealed>(EMPTY_REVEALED);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editorAxis, setEditorAxis] = useState<IdeaLabAxisId | null>(null);
  const [customDraft, setCustomDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [hotAxis, setHotAxis] = useState<IdeaLabAxisId | null>(null);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
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
  const filledCount = IDEA_LAB_AXIS_IDS.filter((axis) => resolved[axis] !== null).length;
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
      setMessage("네 장이 완성됐어요. 카드 하나만 바꾸거나 직접 적을 수 있어요.");
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
    setMessage("네 장이 완성됐어요. 카드 하나만 바꾸거나 직접 적을 수 있어요.");
    setBusy(false);
  };

  /** 이 카드만 바꾸기 — 제자리 스왑(400ms 재플립), 비행 없음 (전체 다시 뽑기와 명확히 구분) */
  const replaceAxis = async (axis: IdeaLabAxisId, nextIndex?: number) => {
    if (busy) return;
    setBusy(true);
    setPromptUnlocked(false);
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
  };

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
    <section className={`idea-lab ${className ?? ""}`} aria-label="검증된 원본에서 시작하는 네 장 아이디어 제작기">
      <style suppressHydrationWarning>{IDEA_LAB_CSS}</style>
      <header className="idea-lab__header">
        <div>
          <p className="idea-lab__eyebrow">오늘 해볼까 · 새 4카드 제작 흐름</p>
          <h1>잘되는 제품에서 한 곳만 바꿔보세요.</h1>
          <p>로그인이나 취향 조사는 없습니다. 네 장을 먼저 뽑고, 마음에 안 드는 장만 바꾸면 됩니다.</p>
        </div>
        <div className="idea-lab__platforms" aria-label="다루는 결과 형태">
          <span>웹</span><span>앱</span><span>플러그인</span>
        </div>
      </header>

      <div className={`idea-lab__workspace ${selection ? "has-result" : ""}`}>
        <div className="idea-lab__maker">
          <div className="idea-lab__board-head">
            <div>
              <p>네 장의 기준</p>
              <strong>{complete ? "완성 · 한 장씩 바꿀 수 있어요" : `${filledCount} / 4`}</strong>
            </div>
            <button type="button" className="idea-lab__draw-button" onClick={drawAll} disabled={busy}>
              {busy ? "뽑는 중…" : complete ? "↻ 4장 다시 뽑기" : "✦ 4장 한 번에 뽑기"}
            </button>
          </div>

          <div className="idea-lab__slots">
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
                  className={`idea-lab__slot ${value ? "is-filled" : ""}`}
                  data-value={value?.value ?? ""}
                  style={{ "--axis": meta.color, "--axis-soft": meta.softColor } as CSSProperties}
                >
                  <div className="idea-lab__slot-label"><span>{index + 1}</span>{meta.label}</div>
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
                    onFill={() => fillAxis(axis)}
                    onSwap={() => replaceAxis(axis)}
                  />
                  {value ? (
                    <div className="idea-lab__slot-actions">
                      <button type="button" onClick={() => replaceAxis(axis)} disabled={busy}>↻ 이 카드만 바꾸기</button>
                      <button type="button" onClick={() => openEditor(axis)}>직접 쓰기</button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <p className="idea-lab__status" aria-live="polite">{message}</p>

          {editorAxis ? (
            <div className="idea-lab__editor" style={{ "--axis": IDEA_LAB_AXIS_META[editorAxis].color } as CSSProperties}>
              <div className="idea-lab__editor-head">
                <div><small>활성 카드</small><h2>{IDEA_LAB_AXIS_META[editorAxis].label}</h2></div>
                <button type="button" onClick={() => setEditorAxis(null)} aria-label="후보 닫기">×</button>
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
          ) : null}

          <div className="idea-lab__deck">
            <p>카드는 마스크 안에서 계속 돌아갑니다. 탭하거나 끌어 조준 칸을 채워보세요.</p>
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
        </div>

        <aside className={`idea-lab__result ${selection ? "is-ready" : ""}`}>
          <div className="idea-lab__result-head">
            <div><small>한 끗 결과</small><h2>{selection ? selection.twist.resultTitle : "네 장을 뽑으면 결과가 나와요"}</h2></div>
            {selection ? <span>{PLATFORM_LABELS[selection.twist.platform]}</span> : null}
          </div>
          {selection ? (
            <>
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

              <div className={`idea-lab__prompt ${promptUnlocked ? "is-unlocked" : ""}`}>
                <div className="idea-lab__prompt-head">
                  <div><small>AI 코딩 도구에 붙여 넣을</small><b>제작 문구</b></div>
                  <span className="idea-lab__prompt-tag">{promptUnlocked ? "전체 공개" : "앞부분 미리보기"}</span>
                </div>
                <div className="idea-lab__prompt-copy">
                  {promptLines.map((line, index) => (
                    <p key={line} className={!promptUnlocked && index >= 3 ? "is-locked" : ""}>{line}</p>
                  ))}
                  {!promptUnlocked ? (
                    <div className="idea-lab__lock">
                      <b>공유하면 나머지 제작 문구가 열려요</b>
                      <span>아이디어 링크를 공유하면 무료로 열려요.</span>
                    </div>
                  ) : null}
                </div>
                {promptUnlocked ? (
                  <button type="button" className="idea-lab__copy" onClick={copyPrompt}>{copied ? "복사했어요 ✓" : "전체 제작 문구 복사"}</button>
                ) : (
                  <button type="button" className="idea-lab__share" onClick={shareAndUnlock} disabled={busy}>친구에게 물어보고 전체 열기 ↗</button>
                )}
              </div>
            </>
          ) : (
            <div className="idea-lab__result-empty">
              <div><i /><i /><i /><i /></div>
              <p>검증된 원본, 돈 낼 사람, 필요한 순간, 한 끗 변화가 한 문장으로 연결됩니다.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

const IDEA_LAB_CSS = `
.idea-lab{--lab-bg:#090b10;--lab-surface:#11151d;--lab-surface-2:#171c26;--lab-line:rgba(255,255,255,.11);--lab-text:#f4f1e9;--lab-muted:#9ba2ae;--lab-primary:var(--primary,#ff4458);--lab-deco:var(--deco-glow,#6db4f5);position:relative;display:block;width:100%;max-width:1440px;margin:0 auto;padding:clamp(16px,3vw,42px);padding-bottom:calc(clamp(16px,3vw,42px) + env(safe-area-inset-bottom,0px));overflow:hidden;border:1px solid var(--lab-line);border-radius:28px;background:radial-gradient(900px 460px at 8% -5%,rgba(255,68,88,.1),transparent 70%),radial-gradient(760px 420px at 96% 0%,var(--deco-glow-soft,rgba(109,180,245,.12)),transparent 72%),var(--lab-bg);color:var(--lab-text);font-family:var(--font-sans),system-ui,sans-serif}
.idea-lab *{box-sizing:border-box}.idea-lab button,.idea-lab input{font:inherit}.idea-lab button{color:inherit}
.idea-lab__header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:22px}.idea-lab__eyebrow{margin:0 0 9px;color:var(--lab-primary);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.idea-lab__header h1{max-width:720px;margin:0;font-family:var(--font-serif),Georgia,serif;font-size:clamp(24px,4vw,46px);line-height:1.05;letter-spacing:-.035em}.idea-lab__header p:not(.idea-lab__eyebrow){max-width:640px;margin:11px 0 0;color:var(--lab-muted);font-size:14px;line-height:1.65}.idea-lab__platforms{display:flex;gap:6px}.idea-lab__platforms span{padding:7px 11px;border:1px solid var(--lab-line);border-radius:999px;background:rgba(255,255,255,.035);color:#c8ced8;font-size:11px;font-weight:800}
.idea-lab__workspace{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start}
.idea-lab__maker,.idea-lab__result{border:1px solid var(--lab-line);border-radius:22px;background:rgba(17,21,29,.82);box-shadow:0 24px 70px rgba(0,0,0,.24)}.idea-lab__maker{padding:16px;overflow:hidden}
.idea-lab__board-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px}.idea-lab__board-head p{margin:0;color:var(--lab-muted);font-size:11px}.idea-lab__board-head strong{display:block;margin-top:3px;font-size:14px}
.idea-lab__draw-button{min-height:44px;padding:0 16px;border:1px solid var(--lab-primary);border-radius:12px;background:var(--lab-primary);color:#fff!important;box-shadow:0 9px 24px rgba(255,68,88,.24);font-size:12px;font-weight:900;cursor:pointer;transition:transform .2s ease,background .2s ease}.idea-lab__draw-button:hover:not(:disabled){transform:translateY(-2px);background:var(--primary-hover,#ff5f70)}.idea-lab button:disabled{opacity:.5;cursor:wait}
.idea-lab__slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.idea-lab__slot{position:relative;min-width:0;display:flex;flex-direction:column;gap:8px}
.idea-lab__slot-label{display:flex;align-items:center;gap:6px;color:var(--axis);font-size:11px;font-weight:900;letter-spacing:.02em}.idea-lab__slot-label span{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:var(--axis-soft);font-size:9px}
.idea-lab__slot-actions{display:grid;grid-template-columns:1fr auto;gap:6px}.idea-lab__slot-actions button{min-height:30px;padding:0 8px;border:1px solid var(--lab-line);border-radius:9px;background:rgba(255,255,255,.04);font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}.idea-lab__slot-actions button:first-child{border-color:color-mix(in srgb,var(--axis) 34%,transparent);color:var(--axis)}
.idea-lab__status{min-height:16px;margin:12px 2px 0;color:var(--lab-muted);font-size:11px}
.idea-lab__editor{margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,var(--axis) 38%,transparent);border-radius:15px;background:#0c0f15}.idea-lab__editor-head{display:flex;align-items:center;justify-content:space-between}.idea-lab__editor-head small{color:var(--lab-muted);font-size:9px}.idea-lab__editor-head h2{margin:2px 0 0;color:var(--axis);font-size:14px}.idea-lab__editor-head>button{width:30px;height:30px;border:1px solid var(--lab-line);border-radius:50%;background:transparent;color:var(--lab-muted);cursor:pointer}
.idea-lab__candidates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.idea-lab__candidates button{min-height:66px;padding:9px;border:1px solid var(--lab-line);border-radius:11px;background:rgba(255,255,255,.025);text-align:left;cursor:pointer}.idea-lab__candidates button.is-active{border-color:var(--axis);background:color-mix(in srgb,var(--axis) 12%,transparent)}.idea-lab__candidates small{display:block;margin-bottom:4px;color:var(--axis);font-size:8.5px}.idea-lab__candidates b{font-size:10px;line-height:1.35}
.idea-lab__custom{margin-top:11px}.idea-lab__custom label{display:block;margin-bottom:5px;color:var(--lab-muted);font-size:9.5px}.idea-lab__custom>div{display:grid;grid-template-columns:1fr auto;gap:6px}.idea-lab__custom input{min-width:0;height:40px;padding:0 11px;border:1px solid var(--lab-line);border-radius:9px;outline:0;background:#07090d;color:var(--lab-text);font-size:11px}.idea-lab__custom input:focus{border-color:var(--axis)}.idea-lab__custom button{padding:0 14px;border:0;border-radius:9px;background:var(--axis);color:#091016!important;font-size:11px;font-weight:900;cursor:pointer}
.idea-lab__deck{margin:14px -16px -16px}.idea-lab__deck>p{margin:0 16px 4px;color:#606875;font-size:9px;text-align:center}.idea-lab__deck-stage{position:relative;height:clamp(148px,26vw,200px);overflow:hidden}
.idea-lab__result{position:relative;padding:18px}
.idea-lab__result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--lab-line)}.idea-lab__result-head small{color:var(--lab-primary);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.idea-lab__result-head h2{margin:5px 0 0;font-family:var(--font-serif),Georgia,serif;font-size:22px;line-height:1.12}.idea-lab__result-head>span{padding:5px 9px;border:1px solid rgba(255,68,88,.35);border-radius:999px;background:rgba(255,68,88,.08);color:#ff9ca8;font-size:9px;font-weight:900;white-space:nowrap}
.idea-lab__result-summary{margin:16px 0;font-size:15px;font-weight:800;line-height:1.78}.idea-lab__result-summary mark{padding:1px 4px;border-radius:4px;background:color-mix(in srgb,var(--mark) 8%,transparent);box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--mark) 60%,transparent);color:var(--lab-text)}
.idea-lab__origin{margin-bottom:10px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--lab-deco) 32%,transparent);border-left:3px solid var(--lab-deco);border-radius:11px;background:color-mix(in srgb,var(--lab-deco) 7%,transparent)}.idea-lab__origin-label{display:inline-block;margin-bottom:6px;color:var(--lab-deco);font-size:10px;font-weight:900;letter-spacing:.04em}.idea-lab__origin b{display:block;font-size:12px;line-height:1.45}.idea-lab__origin small{display:block;margin-top:6px;color:#7f8792;font-size:9px}
.idea-lab__explain{margin-bottom:12px;padding:11px 12px;border:1px solid var(--lab-line);border-radius:11px;background:rgba(255,255,255,.024)}.idea-lab__explain b{font-size:11px}.idea-lab__explain p{margin:6px 0 0;color:#c6ccd5;font-size:11px;line-height:1.55}
.idea-lab__prompt{overflow:hidden;border:1px solid var(--lab-line);border-radius:13px;background:#090c11}.idea-lab__prompt-head{display:flex;align-items:center;justify-content:space-between;padding:11px;border-bottom:1px solid var(--lab-line)}.idea-lab__prompt-head small{display:block;color:#7e8794;font-size:8.5px}.idea-lab__prompt-head b{display:block;margin-top:2px;font-size:11px}.idea-lab__prompt-tag{color:#828b96;font-size:8.5px}.idea-lab.is-unlocked .idea-lab__prompt-tag,.idea-lab__prompt.is-unlocked .idea-lab__prompt-tag{color:var(--good,#6fce9f)}
.idea-lab__prompt-copy{position:relative;max-height:150px;overflow:hidden;padding:11px}.idea-lab__prompt.is-unlocked .idea-lab__prompt-copy{max-height:none}.idea-lab__prompt-copy p{margin:0 0 6px;color:#c2c9d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;line-height:1.5}.idea-lab__prompt-copy p.is-locked{opacity:.72}
.idea-lab__lock{position:absolute;right:0;bottom:0;left:0;display:grid;height:96px;place-content:end center;padding-bottom:12px;text-align:center;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}.idea-lab__lock::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(transparent,rgba(8,11,17,.97) 52%)}.idea-lab__lock b{font-size:11px}.idea-lab__lock span{margin-top:3px;color:#828a95;font-size:8.5px}
.idea-lab__share,.idea-lab__copy{width:calc(100% - 22px);min-height:44px;margin:0 11px 11px;border:1px solid var(--lab-primary);border-radius:11px;background:var(--lab-primary);color:#fff!important;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 9px 24px rgba(255,68,88,.22)}
.idea-lab__result-empty{display:grid;place-content:center;padding:26px 20px;text-align:center}.idea-lab__result-empty>div{display:flex;justify-content:center;gap:8px}.idea-lab__result-empty i{width:34px;height:52px;border:1px dashed #3a414d;border-radius:8px}.idea-lab__result-empty i:nth-child(1){border-color:var(--axis-source,#6db4f5)}.idea-lab__result-empty i:nth-child(2){border-color:var(--axis-payer,#7de4be)}.idea-lab__result-empty i:nth-child(3){border-color:var(--axis-moment,#e8c56a)}.idea-lab__result-empty i:nth-child(4){border-color:var(--axis-twist,#ff8091)}.idea-lab__result-empty p{max-width:280px;margin:15px auto 0;color:var(--lab-muted);font-size:11px;line-height:1.6}
@media(min-width:901px){.idea-lab__workspace{grid-template-columns:minmax(0,1.42fr) minmax(320px,.58fr)}.idea-lab__slots{grid-template-columns:repeat(4,minmax(0,1fr))}.idea-lab__board-head{margin-bottom:10px}.idea-lab__result{position:sticky;top:16px}.idea-lab__workspace:not(.has-result) .idea-lab__result{align-self:start}}
@media(max-width:900px){.idea-lab__result{min-height:0}}
@media(max-width:560px){.idea-lab{padding:14px;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px));border-radius:0}.idea-lab__header{align-items:flex-start;flex-direction:column;margin-bottom:16px}.idea-lab__platforms{width:100%}.idea-lab__platforms span{flex:1;text-align:center}.idea-lab__maker{padding:12px}.idea-lab__board-head{align-items:stretch;flex-direction:column}.idea-lab__draw-button{width:100%}.idea-lab__slots{gap:10px}.idea-lab__slot-actions button{font-size:9px;padding:0 6px}.idea-lab__candidates{display:flex;overflow-x:auto;scroll-snap-type:x mandatory}.idea-lab__candidates button{min-width:74%;scroll-snap-align:start}.idea-lab__result{padding:14px}.idea-lab__result-head h2{font-size:19px}.idea-lab__deck{margin:12px -12px -12px}}
@media(prefers-reduced-motion:reduce){.idea-lab__draw-button{transition:none}}
`;
