"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import { MvpAppHeader } from "@/components/organisms/mvp-shared/mvp-app-header";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import {
  todayAStructureResponseSchema,
  type TodayAStructureRequest,
  type TodayAStructureResponse,
} from "@/lib/today-a-contract";
import styles from "./today-a.module.css";

const initialInput: TodayAStructureRequest = {
  customer: "small_business",
  strength: "operations",
  weeklyTime: "half_day",
  problem: "",
};

const SAVED_STRUCTURE_KEY = "today-a:saved-structure:v1";
const MIN_PROBLEM_LENGTH = 8;

const customerOptions: Array<{
  value: TodayAStructureRequest["customer"];
  label: string;
  description: string;
}> = [
  {
    value: "small_business",
    label: "소규모 사업자",
    description: "혼자 또는 작은 팀으로 사업을 운영해요.",
  },
  {
    value: "team",
    label: "회사 안의 팀",
    description: "반복 업무를 함께 처리하고 있어요.",
  },
  {
    value: "individual",
    label: "개인 고객",
    description: "일상에서 직접 불편을 겪고 있어요.",
  },
];

const strengthOptions: Array<{
  value: TodayAStructureRequest["strength"];
  label: string;
}> = [
  { value: "operations", label: "운영 정리" },
  { value: "content", label: "콘텐츠 만들기" },
  { value: "sales", label: "영업·고객 대화" },
  { value: "development", label: "개발·자동화" },
];

const timeOptions: Array<{
  value: TodayAStructureRequest["weeklyTime"];
  label: string;
}> = [
  { value: "two_hours", label: "2시간" },
  { value: "half_day", label: "반나절" },
  { value: "one_day", label: "하루" },
];

function selectedLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
) {
  return options.find((option) => option.value === value)?.label ?? "";
}

function structureText(result: TodayAStructureResponse["result"]): string {
  return [
    result.title,
    result.summary,
    "",
    `돈 낼 사람: ${result.structure.payer}`,
    `필요한 순간: ${result.structure.needMoment}`,
    `입력: ${result.structure.input}`,
    `처리: ${result.structure.process}`,
    `결과: ${result.structure.output}`,
    `첫 제안: ${result.structure.firstOffer}`,
    "",
    `원본 근거: ${result.evidence.sourceName} · ${result.evidence.sourceUrl}`,
    result.evidence.snapshotNotice,
  ].join("\n");
}

export function TodayA() {
  const [input, setInput] = useState(initialInput);
  const [problemError, setProblemError] = useState("");
  const [result, setResult] = useState<TodayAStructureResponse["result"] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "done" | "error">("idle");
  const inputStartedRef = useRef(false);
  const problemRef = useRef<HTMLTextAreaElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusResultRef = useRef(false);
  const focusInputRef = useRef(false);

  useEffect(() => {
    trackMvpLandingViewed("today_a");
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_STRUCTURE_KEY) ?? "null") as unknown;
      const parsed = todayAStructureResponseSchema.safeParse({
        mode: "catalog_snapshot",
        result: saved,
      });
      if (parsed.success) {
        setResult(parsed.data.result);
        setSaveState("done");
      }
    } catch {
      // 저장된 값이 손상돼도 새 구조를 만드는 흐름은 계속 쓸 수 있다.
    }
  }, []);

  useEffect(() => {
    if (!result) return;
    trackMvpResultViewed("today_a");
    if (focusResultRef.current) {
      focusResultRef.current = false;
      requestAnimationFrame(() => resultHeadingRef.current?.focus());
    }
  }, [result]);

  useEffect(() => {
    if (!result && focusInputRef.current) {
      focusInputRef.current = false;
      requestAnimationFrame(() => problemRef.current?.focus());
    }
  }, [result]);

  const validateProblem = () => {
    if (input.problem.trim().length >= MIN_PROBLEM_LENGTH) {
      setProblemError("");
      return true;
    }
    setProblemError("누가 언제 겪는 불편인지 8자 이상 적어주세요.");
    requestAnimationFrame(() => problemRef.current?.focus());
    return false;
  };

  const generate = async () => {
    setStatus("loading");
    setCopyState("idle");
    setSaveState("idle");

    try {
      const response = await fetch("/api/today-a/structure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const body: unknown = await response.json();
      const parsed = todayAStructureResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("invalid_response");
      focusResultRef.current = true;
      setResult(parsed.data.result);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateProblem()) return;
    void generate();
  };

  const saveResult = () => {
    if (!result || saveState === "done") return;
    try {
      localStorage.setItem(SAVED_STRUCTURE_KEY, JSON.stringify(result));
      setSaveState("done");
      trackMvpDeepAction("today_a");
    } catch {
      setSaveState("error");
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(structureText(result));
      setCopyState("done");
      trackMvpDeepAction("today_a");
    } catch {
      setCopyState("error");
    }
  };

  const editConditions = () => {
    focusInputRef.current = true;
    setResult(null);
    setCopyState("idle");
    setSaveState("idle");
    setStatus("idle");
  };

  const customerLabel = selectedLabel(customerOptions, input.customer);
  const strengthLabel = selectedLabel(strengthOptions, input.strength);
  const timeLabel = selectedLabel(timeOptions, input.weeklyTime);

  return (
    <main className={styles.page}>
      <MvpAppHeader
        backClassName={styles.back}
        backLabel="실험 허브"
        className={styles.header}
        meta="TODAY A"
        metaClassName={styles.routeLabel}
      />

      {!result ? (
        <section className={styles.flow} aria-labelledby="today-a-title">
          <div className={styles.journeyIntro}>
            <p className={styles.eyebrow}>관찰한 불편에서 시작</p>
            <h1 id="today-a-title">
              본 불편을 적으면,
              <br />
              사업 구조로 정리해드려요.
            </h1>
            <p className={styles.lead}>
              돈 낼 사람과 필요한 순간, 이번 주에 건넬 첫 제안까지 바로 보여드려요.
            </p>
          </div>

          <form
            className={styles.formShell}
            onSubmit={handleSubmit}
            data-clarity-mask="true"
            noValidate
          >
            <div className={styles.formHeading}>
              <span aria-hidden>01</span>
              <div>
                <p>한 가지 질문</p>
                <h2>반복해서 보이는 불편은 무엇인가요?</h2>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="today-a-problem">관찰한 불편</label>
              <textarea
                ref={problemRef}
                id="today-a-problem"
                value={input.problem}
                onChange={(event) => {
                  const problem = event.target.value;
                  setInput({ ...input, problem });
                  setStatus("idle");
                  if (problemError && problem.trim().length >= MIN_PROBLEM_LENGTH) {
                    setProblemError("");
                  }
                  if (!inputStartedRef.current && problem.trim()) {
                    inputStartedRef.current = true;
                    trackMvpInputStarted("today_a");
                  }
                }}
                placeholder="예: 문의가 여러 채널로 들어와 답변과 예약이 자꾸 늦어져요."
                minLength={MIN_PROBLEM_LENGTH}
                maxLength={240}
                required
                aria-invalid={Boolean(problemError)}
                aria-describedby="today-a-problem-help"
              />
              <div className={styles.fieldMeta}>
                <p id="today-a-problem-help" className={problemError ? styles.fieldError : undefined}>
                  {problemError || "누가 언제 겪는 불편인지 구체적으로 적어주세요."}
                </p>
                <span aria-label={`${input.problem.length}자 입력`}>{input.problem.length} / 240</span>
              </div>
            </div>

            <section className={styles.livePreview} aria-label="적용할 조건 미리보기">
              <p>이 조건으로 비교해요</p>
              <dl>
                <div>
                  <dt>처음 만날 사람</dt>
                  <dd>{customerLabel}</dd>
                </div>
                <div>
                  <dt>쓸 수 있는 강점</dt>
                  <dd>{strengthLabel}</dd>
                </div>
                <div>
                  <dt>이번 주 시간</dt>
                  <dd>{timeLabel}</dd>
                </div>
              </dl>
            </section>

            <details className={styles.conditions}>
              <summary>비교 조건 바꾸기</summary>
              <div className={styles.conditionFields}>
                <fieldset className={styles.choiceFieldset}>
                  <legend>처음 만날 사람</legend>
                  <div className={styles.choiceList}>
                    {customerOptions.map((option) => (
                      <label key={option.value} className={styles.choice}>
                        <input
                          type="radio"
                          name="today-a-customer"
                          value={option.value}
                          checked={input.customer === option.value}
                          onChange={() => setInput({ ...input, customer: option.value })}
                        />
                        <span className={styles.choiceControl} aria-hidden>
                          <Check size={14} />
                        </span>
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className={styles.choiceFieldset}>
                  <legend>가장 자신 있는 일</legend>
                  <div className={styles.segmented} data-columns="2">
                    {strengthOptions.map((option) => (
                      <label key={option.value}>
                        <input
                          type="radio"
                          name="today-a-strength"
                          value={option.value}
                          checked={input.strength === option.value}
                          onChange={() => setInput({ ...input, strength: option.value })}
                        />
                        <span>
                          <Check aria-hidden size={14} />
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className={styles.choiceFieldset}>
                  <legend>이번 주 쓸 수 있는 시간</legend>
                  <div className={styles.segmented} data-columns="3">
                    {timeOptions.map((option) => (
                      <label key={option.value}>
                        <input
                          type="radio"
                          name="today-a-time"
                          value={option.value}
                          checked={input.weeklyTime === option.value}
                          onChange={() => setInput({ ...input, weeklyTime: option.value })}
                        />
                        <span>
                          <Check aria-hidden size={14} />
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </details>

            {status === "error" ? (
              <p className={styles.error} role="alert">
                구조를 불러오지 못했어요. 입력은 그대로 두었으니 다시 시도해 주세요.
              </p>
            ) : null}

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={status === "loading"}
              aria-busy={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <RefreshCw className={styles.spinner} aria-hidden size={18} />
                  원본과 비교하는 중…
                </>
              ) : (
                <>
                  {status === "error" ? "다시 구조 보기" : "사업 구조 바로 보기"}
                  <ArrowRight aria-hidden size={18} />
                </>
              )}
            </button>
            <p className={styles.submitNote}>
              저장된 원본 스냅샷과 비교하며, 결과를 보기 전에는 가입하지 않아요.
            </p>
          </form>
        </section>
      ) : (
        <section
          className={styles.result}
          aria-labelledby="today-a-result-title"
          aria-live="polite"
          data-clarity-mask="true"
        >
          <div className={styles.resultIntro}>
            <p className={styles.eyebrow}>
              {saveState === "done" ? "이 기기에 저장된 구조" : "가장 가까운 구조 1개"}
            </p>
            <h1 id="today-a-result-title" ref={resultHeadingRef} tabIndex={-1}>
              {result.title}
            </h1>
            <p className={styles.resultSummary}>{result.summary}</p>
            <p className={styles.fitReason}>{result.fitReason}</p>
          </div>

          <section className={styles.structure} aria-label="사업 구조">
            <div className={styles.sectionHeading}>
              <div>
                <p>STRUCTURE MAP</p>
                <h2>누가, 언제, 무엇을 받는지</h2>
              </div>
              <span>원본 비교</span>
            </div>

            <dl className={styles.decisionGrid}>
              <div>
                <dt>돈 낼 사람</dt>
                <dd>{result.structure.payer}</dd>
              </div>
              <div>
                <dt>필요한 순간</dt>
                <dd>{result.structure.needMoment}</dd>
              </div>
            </dl>

            <div className={styles.valueFlow}>
              <div>
                <span>01</span>
                <small>받을 입력</small>
                <strong>{result.structure.input}</strong>
              </div>
              <ArrowRight aria-hidden size={18} />
              <div>
                <span>02</span>
                <small>할 처리</small>
                <strong>{result.structure.process}</strong>
              </div>
              <ArrowRight aria-hidden size={18} />
              <div>
                <span>03</span>
                <small>바로 받는 결과</small>
                <strong>{result.structure.output}</strong>
              </div>
            </div>
          </section>

          <section className={styles.firstOffer} aria-labelledby="today-a-first-offer">
            <p>이번 주 첫 제안</p>
            <h2 id="today-a-first-offer">{result.structure.firstOffer}</h2>
            <span>완성 제품보다 한 사람의 반응을 먼저 확인하세요.</span>
          </section>

          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={saveResult}
              disabled={saveState === "done"}
              aria-pressed={saveState === "done"}
            >
              <Check aria-hidden size={18} />
              {saveState === "done" ? "이 기기에 구조를 저장했어요" : "이 구조 저장하기"}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={copyResult}>
              <Copy aria-hidden size={18} />
              {copyState === "done" ? "구조를 복사했어요" : "이 구조 복사하기"}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={editConditions}>
              <RefreshCw aria-hidden size={18} />
              조건을 바꿔 다시 보기
            </button>
          </div>

          <div className={styles.actionFeedback} aria-live="polite">
            {copyState === "error" ? (
              <p className={styles.error} role="alert">
                복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.
              </p>
            ) : null}
            {saveState === "error" ? (
              <p className={styles.error} role="alert">
                이 기기에 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.
              </p>
            ) : null}
          </div>

          <aside className={styles.evidence} aria-labelledby="today-a-evidence">
            <div className={styles.evidenceHeading}>
              <p>비교한 원본 스냅샷</p>
              <h2 id="today-a-evidence">{result.evidence.sourceName}</h2>
            </div>
            <p>{result.evidence.statement}</p>
            <p className={styles.notice}>{result.evidence.snapshotNotice}</p>
            <a
              href={result.evidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.sourceLink}
            >
              원본 페이지 열기
              <ArrowUpRight aria-hidden size={17} />
            </a>
          </aside>

          {saveState === "done" ? (
            <div className={styles.signup}>
                <PostResultSignup
                  experimentId="today_a"
                  label="Google 계정만 연결하기"
                />
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
