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

type ChoiceIndexes = Record<IdeaLabAxisId, number>;
type Revealed = Record<IdeaLabAxisId, boolean>;
type Overrides = Partial<Record<IdeaLabAxisId, string>>;
type Flight = {
  key: number;
  color: string;
  left: number;
  top: number;
  dx: number;
  dy: number;
};

const EMPTY_REVEALED: Revealed = { source: false, payer: false, moment: false, twist: false };
const DEFAULT_CHOICES: ChoiceIndexes = { source: 0, payer: 0, moment: 0, twist: 0 };
const FLIGHT_MS = 420;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

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

const choicesForRandomDraw = (scenarioIndex: number): ChoiceIndexes => {
  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];
  return {
    source: 0,
    payer: Math.floor(Math.random() * scenario.payers.length),
    moment: Math.floor(Math.random() * scenario.moments.length),
    twist: Math.floor(Math.random() * scenario.twists.length),
  };
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
  const [flight, setFlight] = useState<Flight | null>(null);
  const [promptUnlocked, setPromptUnlocked] = useState(false);
  const [message, setMessage] = useState("네 장을 먼저 뽑아보세요.");
  const [copied, setCopied] = useState(false);
  const deckAnchorRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Partial<Record<IdeaLabAxisId, HTMLElement | null>>>({});
  const flightKeyRef = useRef(0);

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
  const selection = complete
    ? ({
        source: resolved.source as IdeaLabSourceOption,
        payer: resolved.payer as IdeaLabOption,
        moment: resolved.moment as IdeaLabOption,
        twist: resolved.twist as IdeaLabTwistOption,
      } satisfies IdeaLabSelection)
    : null;
  const prompt = selection ? buildPrompt(selection) : "";

  const flyTo = async (axis: IdeaLabAxisId, commit: () => void) => {
    const from = deckAnchorRef.current?.getBoundingClientRect();
    const to = slotRefs.current[axis]?.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (from && to && !reduced) {
      const left = from.left + from.width / 2 - 25;
      const top = from.top + from.height / 2 - 35;
      setFlight({
        key: ++flightKeyRef.current,
        color: IDEA_LAB_AXIS_META[axis].color,
        left,
        top,
        dx: to.left + to.width / 2 - 25 - left,
        dy: to.top + to.height / 2 - 35 - top,
      });
      await wait(FLIGHT_MS);
    } else {
      await wait(90);
    }
    commit();
    setFlight(null);
    await wait(reduced ? 30 : 110);
  };

  const drawAll = async () => {
    if (busy) return;
    setBusy(true);
    setPromptUnlocked(false);
    setEditorAxis(null);
    setOverrides({});
    setRevealed(EMPTY_REVEALED);
    const nextScenario = complete ? (scenarioIndex + 1) % IDEA_LAB_SCENARIOS.length : scenarioIndex;
    const nextChoices = choicesForRandomDraw(nextScenario);
    setScenarioIndex(nextScenario);
    setChoiceIndexes(nextChoices);
    setMessage("회전하는 덱에서 서로 맞는 네 장을 뽑고 있어요.");
    for (const axis of IDEA_LAB_AXIS_IDS) {
      await flyTo(axis, () => setRevealed((current) => ({ ...current, [axis]: true })));
    }
    setMessage("네 장이 완성됐어요. 카드 하나만 바꾸거나 직접 적을 수 있어요.");
    setBusy(false);
  };

  const replaceAxis = async (axis: IdeaLabAxisId, nextIndex?: number) => {
    if (busy) return;
    setBusy(true);
    setPromptUnlocked(false);
    setEditorAxis(axis);
    if (axis === "source") {
      const nextScenario = nextIndex ?? (scenarioIndex + 1) % IDEA_LAB_SCENARIOS.length;
      await flyTo(axis, () => {
        setScenarioIndex(nextScenario);
        setChoiceIndexes(DEFAULT_CHOICES);
        setOverrides({});
        setRevealed({ source: true, payer: true, moment: true, twist: true });
      });
      setMessage("원본이 바뀌어 나머지 세 장도 맞는 후보로 다시 연결했어요.");
    } else {
      const options = axis === "payer" ? scenario.payers : axis === "moment" ? scenario.moments : scenario.twists;
      const index = nextIndex ?? (choiceIndexes[axis] + 1) % options.length;
      await flyTo(axis, () => {
        setChoiceIndexes((current) => ({ ...current, [axis]: index }));
        setOverrides((current) => ({ ...current, [axis]: undefined }));
        setRevealed((current) => ({ ...current, [axis]: true }));
      });
      setMessage(`${IDEA_LAB_AXIS_META[axis].label} 카드만 바꿨어요.`);
    }
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
      : editorAxis === "payer"
        ? scenario.payers
        : editorAxis === "moment"
          ? scenario.moments
          : scenario.twists
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

      <div className="idea-lab__workspace">
        <div className="idea-lab__maker">
          <div className="idea-lab__board-head">
            <div>
              <p>네 장의 기준</p>
              <strong>{complete ? "완성 · 한 장씩 바꿀 수 있어요" : `${Object.values(revealed).filter(Boolean).length} / 4`}</strong>
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
              return (
                <article
                  key={axis}
                  ref={(node) => { slotRefs.current[axis] = node; }}
                  className={`idea-lab__slot ${value ? "is-filled" : ""}`}
                  style={{ "--axis": meta.color, "--axis-soft": meta.softColor, "--delay": `${index * 70}ms` } as CSSProperties}
                >
                  <div className="idea-lab__slot-label"><span>{index + 1}</span>{meta.label}</div>
                  {value ? (
                    <>
                      <button type="button" className="idea-lab__slot-body" onClick={() => openEditor(axis)} aria-label={`${meta.label} 후보 열기`}>
                        {sourceValue ? (
                          <span className="idea-lab__source-meta">
                            <b>{sourceValue.sourceName}</b>
                            <i>{PLATFORM_LABELS[sourceValue.platform]}</i>
                          </span>
                        ) : null}
                        {twistValue ? <small>{CHANGE_KIND_LABELS[twistValue.kind]} · {PLATFORM_LABELS[twistValue.platform]}</small> : null}
                        <strong>{value.value}</strong>
                        <p>{value.detail}</p>
                      </button>
                      <div className="idea-lab__slot-actions">
                        <button type="button" onClick={() => replaceAxis(axis)} disabled={busy}>↻ 이 카드만 바꾸기</button>
                        <button type="button" onClick={() => openEditor(axis)}>직접 쓰기</button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="idea-lab__empty" onClick={() => replaceAxis(axis)} disabled={busy}>
                      <span>?</span><b>{meta.question}</b>
                    </button>
                  )}
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

          <div className="idea-lab__deck" aria-hidden="true">
            <p>카드는 마스크 안에서 360° 계속 돌아갑니다.</p>
            <div className="idea-lab__deck-window">
              <div className="idea-lab__wheel">
                {Array.from({ length: 16 }, (_, index) => (
                  <i
                    key={index}
                    style={{ "--angle": `${index * 22.5}deg`, "--card-color": IDEA_LAB_AXIS_META[IDEA_LAB_AXIS_IDS[index % 4]].color } as CSSProperties}
                  />
                ))}
              </div>
              <div ref={deckAnchorRef} className="idea-lab__deck-anchor" />
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
                <mark style={{ "--mark": IDEA_LAB_AXIS_META.payer.color } as CSSProperties}>{selection.payer.value}</mark>이<br />
                <mark style={{ "--mark": IDEA_LAB_AXIS_META.moment.color } as CSSProperties}>{selection.moment.value}</mark>에 쓰도록,<br />
                <mark style={{ "--mark": IDEA_LAB_AXIS_META.source.color } as CSSProperties}>{selection.source.value}</mark>에서<br />
                <mark style={{ "--mark": IDEA_LAB_AXIS_META.twist.color } as CSSProperties}>{selection.twist.value}</mark>만 적용합니다.
              </p>

              <div className="idea-lab__explain">
                <div style={{ "--axis": IDEA_LAB_AXIS_META.source.color } as CSSProperties}>
                  <b>원래 제품을 쉽게 말하면</b>
                  <p>{selection.source.detail}</p>
                  <small>근거 · {selection.source.evidence}</small>
                </div>
                <div style={{ "--axis": IDEA_LAB_AXIS_META.twist.color } as CSSProperties}>
                  <b>80~90% 남기고 딱 하나</b>
                  <p>그대로 · {selection.source.preservedFlow}</p>
                  <p>변화 · {selection.twist.value}</p>
                </div>
                <div>
                  <b>오늘 만들 가장 작은 화면</b>
                  <p>{selection.twist.smallestBuild}</p>
                </div>
              </div>

              <div className={`idea-lab__prompt ${promptUnlocked ? "is-unlocked" : ""}`}>
                <div className="idea-lab__prompt-head">
                  <div><small>AI 코딩 도구에 붙여 넣을</small><b>제작 문구</b></div>
                  <span>{promptUnlocked ? "전체 공개" : "앞부분 미리보기"}</span>
                </div>
                <div className="idea-lab__prompt-copy">
                  {prompt.split("\n").map((line, index) => (
                    <p key={line} className={!promptUnlocked && index >= 3 ? "is-locked" : ""}>{line}</p>
                  ))}
                  {!promptUnlocked ? <div className="idea-lab__lock"><b>전체 제작 문구 열기</b><span>아이디어 링크를 공유하면 무료로 열려요.</span></div> : null}
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

      {flight ? (
        <div
          key={flight.key}
          className="idea-lab__flight"
          style={{
            left: flight.left,
            top: flight.top,
            "--dx": `${flight.dx}px`,
            "--dy": `${flight.dy}px`,
            "--flight-color": flight.color,
          } as CSSProperties}
        />
      ) : null}
    </section>
  );
}

const IDEA_LAB_CSS = `
.idea-lab{--lab-bg:#090b10;--lab-surface:#11151d;--lab-surface-2:#171c26;--lab-line:rgba(255,255,255,.11);--lab-text:#f4f1e9;--lab-muted:#9ba2ae;--lab-primary:var(--primary,#ff4458);position:relative;display:block;width:100%;max-width:1440px;margin:0 auto;padding:clamp(18px,3vw,42px);overflow:hidden;border:1px solid var(--lab-line);border-radius:28px;background:radial-gradient(900px 460px at 8% -5%,rgba(255,68,88,.11),transparent 70%),var(--lab-bg);color:var(--lab-text);font-family:var(--font-sans),system-ui,sans-serif}
.idea-lab *{box-sizing:border-box}.idea-lab button,.idea-lab input{font:inherit}.idea-lab button{color:inherit}.idea-lab__header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:26px}.idea-lab__eyebrow{margin:0 0 9px;color:var(--lab-primary);font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.idea-lab__header h1{max-width:720px;margin:0;font-family:var(--font-serif),Georgia,serif;font-size:clamp(26px,4vw,48px);line-height:1.04;letter-spacing:-.035em}.idea-lab__header p:not(.idea-lab__eyebrow){max-width:660px;margin:12px 0 0;color:var(--lab-muted);font-size:14px;line-height:1.65}.idea-lab__platforms{display:flex;gap:6px}.idea-lab__platforms span{padding:7px 11px;border:1px solid var(--lab-line);border-radius:999px;background:rgba(255,255,255,.035);color:#c8ced8;font-size:11px;font-weight:800}
.idea-lab__workspace{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(330px,.65fr);gap:18px;align-items:start}.idea-lab__maker,.idea-lab__result{border:1px solid var(--lab-line);border-radius:22px;background:rgba(17,21,29,.82);box-shadow:0 24px 70px rgba(0,0,0,.24)}.idea-lab__maker{padding:16px;overflow:hidden}.idea-lab__board-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}.idea-lab__board-head p{margin:0;color:var(--lab-muted);font-size:11px}.idea-lab__board-head strong{display:block;margin-top:3px;font-size:14px}.idea-lab__draw-button{min-height:44px;padding:0 15px;border:1px solid var(--lab-primary);border-radius:12px;background:var(--lab-primary);color:#fff!important;box-shadow:0 9px 24px rgba(255,68,88,.22);font-size:12px;font-weight:900;cursor:pointer;transition:transform .2s ease,background .2s ease}.idea-lab__draw-button:hover:not(:disabled){transform:translateY(-2px);background:var(--primary-hover,#ff5f70)}.idea-lab button:disabled{opacity:.48;cursor:wait}
.idea-lab__slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.idea-lab__slot{position:relative;min-width:0;min-height:254px;overflow:hidden;border:1px solid var(--lab-line);border-radius:16px;background:linear-gradient(155deg,var(--axis-soft),rgba(255,255,255,.018) 45%),#0d1016;transition:border-color .25s ease,transform .25s ease,box-shadow .25s ease}.idea-lab__slot.is-filled{border-color:color-mix(in srgb,var(--axis) 48%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.idea-lab__slot.is-filled::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--axis)}.idea-lab__slot-label{display:flex;align-items:center;gap:6px;padding:10px 10px 8px;color:var(--axis);font-size:10px;font-weight:900;letter-spacing:.02em}.idea-lab__slot-label span{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:var(--axis-soft);font-size:9px}.idea-lab__slot-body{display:block;width:100%;min-height:166px;padding:3px 10px 10px;border:0;background:transparent;text-align:left;cursor:pointer}.idea-lab__slot-body>small{display:block;margin-bottom:7px;color:var(--axis);font-size:9px;font-weight:800}.idea-lab__slot-body>strong{display:block;font-size:13px;line-height:1.35}.idea-lab__slot-body>p{margin:8px 0 0;color:var(--lab-muted);font-size:10.5px;line-height:1.45}.idea-lab__source-meta{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-bottom:9px}.idea-lab__source-meta b{font-size:10px}.idea-lab__source-meta i{padding:3px 6px;border-radius:999px;background:var(--axis-soft);color:var(--axis);font-size:8px;font-style:normal;font-weight:900}.idea-lab__slot-actions{position:absolute;right:8px;bottom:8px;left:8px;display:grid;gap:5px}.idea-lab__slot-actions button{min-height:29px;border:1px solid var(--lab-line);border-radius:8px;background:rgba(255,255,255,.035);font-size:9px;font-weight:800;cursor:pointer}.idea-lab__slot-actions button:first-child{border-color:color-mix(in srgb,var(--axis) 34%,transparent);color:var(--axis)}.idea-lab__empty{display:grid;width:100%;min-height:200px;padding:20px;place-items:center;border:0;background:transparent;color:var(--lab-muted);text-align:center;cursor:pointer}.idea-lab__empty span{display:grid;width:48px;height:68px;place-items:center;border:1px dashed var(--axis);border-radius:10px;background:var(--axis-soft);color:var(--axis);font-family:Georgia,serif;font-size:24px}.idea-lab__empty b{font-size:10px;line-height:1.45}.idea-lab__status{min-height:18px;margin:10px 2px 0;color:var(--lab-muted);font-size:10px}
.idea-lab__editor{margin-top:9px;padding:11px;border:1px solid color-mix(in srgb,var(--axis) 38%,transparent);border-radius:15px;background:#0c0f15}.idea-lab__editor-head{display:flex;align-items:center;justify-content:space-between}.idea-lab__editor-head small{color:var(--lab-muted);font-size:8px}.idea-lab__editor-head h2{margin:2px 0 0;color:var(--axis);font-size:13px}.idea-lab__editor-head>button{width:29px;height:29px;border:1px solid var(--lab-line);border-radius:50%;background:transparent;color:var(--lab-muted);cursor:pointer}.idea-lab__candidates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}.idea-lab__candidates button{min-height:64px;padding:8px;border:1px solid var(--lab-line);border-radius:10px;background:rgba(255,255,255,.025);text-align:left;cursor:pointer}.idea-lab__candidates button.is-active{border-color:var(--axis);background:color-mix(in srgb,var(--axis) 10%,transparent)}.idea-lab__candidates small{display:block;margin-bottom:4px;color:var(--axis);font-size:8px}.idea-lab__candidates b{font-size:9.5px;line-height:1.35}.idea-lab__custom{margin-top:10px}.idea-lab__custom label{display:block;margin-bottom:5px;color:var(--lab-muted);font-size:9px}.idea-lab__custom>div{display:grid;grid-template-columns:1fr auto;gap:6px}.idea-lab__custom input{min-width:0;height:39px;padding:0 10px;border:1px solid var(--lab-line);border-radius:9px;outline:0;background:#07090d;color:var(--lab-text);font-size:10px}.idea-lab__custom input:focus{border-color:var(--axis)}.idea-lab__custom button{padding:0 13px;border:0;border-radius:9px;background:var(--axis);color:#091016!important;font-size:10px;font-weight:900;cursor:pointer}
.idea-lab__deck{margin:12px -16px -16px}.idea-lab__deck>p{margin:0 16px 3px;color:#606875;font-size:8px;text-align:center}.idea-lab__deck-window{position:relative;height:126px;overflow:hidden;mask-image:linear-gradient(to right,transparent,#000 12%,#000 88%,transparent),linear-gradient(to top,transparent,#000 35%);mask-composite:intersect;-webkit-mask-image:linear-gradient(to right,transparent,#000 12%,#000 88%,transparent),linear-gradient(to top,transparent,#000 35%);-webkit-mask-composite:source-in}.idea-lab__wheel{position:absolute;left:50%;top:105px;width:0;height:0;animation:idea-lab-spin 11s linear infinite}.idea-lab__wheel i{position:absolute;left:-28px;top:-41px;width:56px;height:82px;border:1px solid color-mix(in srgb,var(--card-color) 55%,white 5%);border-radius:8px;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--card-color) 28%,transparent),transparent 55%),#0e1219;box-shadow:0 7px 16px rgba(0,0,0,.36);transform:rotate(var(--angle)) translateY(-108px)}.idea-lab__wheel i::after{content:"✦";position:absolute;inset:0;display:grid;place-items:center;color:var(--card-color);font-size:12px}.idea-lab__deck-anchor{position:absolute;left:50%;top:2px;width:50px;height:70px;transform:translateX(-50%)}@keyframes idea-lab-spin{to{transform:rotate(360deg)}}
.idea-lab__result{position:sticky;top:16px;min-height:620px;padding:19px}.idea-lab__result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--lab-line)}.idea-lab__result-head small{color:var(--lab-primary);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.idea-lab__result-head h2{margin:5px 0 0;font-family:var(--font-serif),Georgia,serif;font-size:22px;line-height:1.12}.idea-lab__result-head>span{padding:5px 8px;border:1px solid rgba(255,68,88,.35);border-radius:999px;background:rgba(255,68,88,.08);color:#ff9ca8;font-size:9px;font-weight:900}.idea-lab__result-summary{margin:17px 0;font-size:15px;font-weight:800;line-height:1.75}.idea-lab__result-summary mark{padding:1px 3px;border-radius:3px;background:color-mix(in srgb,var(--mark) 15%,transparent);box-shadow:inset 0 -1px 0 var(--mark);color:var(--lab-text)}.idea-lab__explain{display:grid;gap:7px}.idea-lab__explain>div{padding:10px;border:1px solid var(--lab-line);border-left:3px solid var(--axis,var(--lab-line));border-radius:10px;background:rgba(255,255,255,.024)}.idea-lab__explain b{font-size:10px}.idea-lab__explain p{margin:5px 0 0;color:#c6ccd5;font-size:10.5px;line-height:1.5}.idea-lab__explain small{display:block;margin-top:6px;color:#737b88;font-size:8px}.idea-lab__prompt{margin-top:12px;overflow:hidden;border:1px solid var(--lab-line);border-radius:13px;background:#090c11}.idea-lab__prompt-head{display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid var(--lab-line)}.idea-lab__prompt-head small{display:block;color:#7e8794;font-size:8px}.idea-lab__prompt-head b{display:block;margin-top:2px;font-size:11px}.idea-lab__prompt-head span{color:var(--lab-primary);font-size:8px}.idea-lab__prompt-copy{position:relative;max-height:190px;overflow:hidden;padding:10px}.idea-lab__prompt.is-unlocked .idea-lab__prompt-copy{max-height:none}.idea-lab__prompt-copy p{margin:0 0 6px;color:#c2c9d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:8.5px;line-height:1.45}.idea-lab__prompt-copy p.is-locked{filter:blur(4px);opacity:.45;user-select:none}.idea-lab__lock{position:absolute;right:0;bottom:0;left:0;display:grid;height:92px;place-content:end center;padding-bottom:12px;background:linear-gradient(transparent,rgba(9,12,17,.93) 48%);text-align:center}.idea-lab__lock b{font-size:10px}.idea-lab__lock span{margin-top:2px;color:#828a95;font-size:8px}.idea-lab__share,.idea-lab__copy{width:calc(100% - 20px);min-height:43px;margin:0 10px 10px;border:1px solid var(--lab-primary);border-radius:10px;background:var(--lab-primary);color:#fff!important;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 9px 24px rgba(255,68,88,.2)}.idea-lab__result-empty{display:grid;min-height:500px;place-content:center;padding:20px;text-align:center}.idea-lab__result-empty>div{display:flex;justify-content:center;gap:7px}.idea-lab__result-empty i{width:38px;height:57px;border:1px dashed #3a414d;border-radius:7px}.idea-lab__result-empty i:nth-child(1){border-color:#6db4f5}.idea-lab__result-empty i:nth-child(2){border-color:#f3c969}.idea-lab__result-empty i:nth-child(3){border-color:#7de4be}.idea-lab__result-empty i:nth-child(4){border-color:#e99bb0}.idea-lab__result-empty p{max-width:260px;margin:15px auto 0;color:var(--lab-muted);font-size:11px;line-height:1.6}
.idea-lab__flight{position:fixed;z-index:999;width:50px;height:70px;pointer-events:none;border:1px solid var(--flight-color);border-radius:8px;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--flight-color) 32%,transparent),transparent 60%),#10141c;box-shadow:0 16px 32px rgba(0,0,0,.5);animation:idea-lab-flight ${FLIGHT_MS}ms cubic-bezier(.65,0,.35,1) forwards}.idea-lab__flight::after{content:"✦";position:absolute;inset:0;display:grid;place-items:center;color:var(--flight-color)}@keyframes idea-lab-flight{0%{transform:translate(0,0) rotate(-5deg) scale(1);opacity:1}45%{transform:translate(calc(var(--dx)*.48),calc(var(--dy)*.48 - 70px)) rotate(8deg) scale(1.08)}100%{transform:translate(var(--dx),var(--dy)) rotate(0) scale(.82);opacity:.18}}
@media(max-width:980px){.idea-lab__workspace{grid-template-columns:1fr}.idea-lab__result{position:relative;top:auto;min-height:0}.idea-lab__slots{grid-template-columns:repeat(2,minmax(0,1fr))}.idea-lab__slot{min-height:230px}.idea-lab__header{align-items:flex-start;flex-direction:column}}
@media(max-width:560px){.idea-lab{padding:14px;border-radius:0}.idea-lab__header{margin-bottom:18px}.idea-lab__platforms{width:100%}.idea-lab__platforms span{flex:1;text-align:center}.idea-lab__maker{padding:10px}.idea-lab__board-head{align-items:stretch;flex-direction:column}.idea-lab__draw-button{width:100%}.idea-lab__slots{grid-template-columns:1fr 1fr;gap:6px}.idea-lab__slot{min-height:224px;border-radius:13px}.idea-lab__slot-body>strong{font-size:11px}.idea-lab__slot-body>p{font-size:9px}.idea-lab__candidates{display:flex;overflow-x:auto;scroll-snap-type:x mandatory}.idea-lab__candidates button{min-width:76%;scroll-snap-align:start}.idea-lab__result{padding:14px}.idea-lab__result-head h2{font-size:19px}}
@media(prefers-reduced-motion:reduce){.idea-lab__wheel{animation:none}.idea-lab__flight{animation-duration:100ms}.idea-lab__draw-button,.idea-lab__slot{transition:none}}
`;
