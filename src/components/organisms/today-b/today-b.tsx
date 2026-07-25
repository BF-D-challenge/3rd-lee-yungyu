"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import {
  todayBExperimentResponseSchema,
  type TodayBExperimentRequest,
  type TodayBExperimentResponse,
} from "@/lib/today-b-contract";
import styles from "./today-b.module.css";

const RESULT_KEY = "today-b:last-plan:v1";
const PROGRESS_KEY = "today-b:plan-progress:v1";
const STARTED_KEY = "today-b:started-plans:v1";

const initialInput: TodayBExperimentRequest = {
  idea: "",
  customer: "",
  promise: "",
  channel: "direct",
  signal: "conversation",
};

const signalOptions: Array<{
  value: TodayBExperimentRequest["signal"];
  title: string;
  description: string;
  strength: string;
}> = [
  {
    value: "conversation",
    title: "문제 인터뷰",
    description: "15분 동안 지금의 해결 방식을 보여달라고 요청해요.",
    strength: "관심 확인",
  },
  {
    value: "waitlist",
    title: "대기 신청",
    description: "출시 소식을 받을 연락처를 남겨달라고 요청해요.",
    strength: "행동 확인",
  },
  {
    value: "deposit",
    title: "예약금",
    description: "환불 조건을 밝히고 소액 예약금을 요청해요.",
    strength: "지불 확인",
  },
  {
    value: "preorder",
    title: "사전 구매",
    description: "가격과 제공일을 밝히고 먼저 결제를 요청해요.",
    strength: "구매 확인",
  },
];

type FieldErrors = Partial<Record<"idea" | "customer" | "promise", string>>;

function validateInput(input: TodayBExperimentRequest): FieldErrors {
  const errors: FieldErrors = {};
  const ideaLength = input.idea.trim().length;
  const customerLength = input.customer.trim().length;
  const promiseLength = input.promise.trim().length;

  if (ideaLength < 8) errors.idea = "아이디어를 8자 이상 적어 주세요.";
  if (customerLength < 4) errors.customer = "처음 만날 고객을 4자 이상 적어 주세요.";
  if (promiseLength < 6) errors.promise = "고객이 받는 결과를 6자 이상 적어 주세요.";
  return errors;
}

function planText(plan: TodayBExperimentResponse): string {
  return [
    "가장 위험한 가정",
    `${plan.risk.label}: ${plan.risk.assumption}`,
    plan.risk.reason,
    "",
    "7일 수요 실험",
    plan.experiment.hypothesis,
    `제안 문구: ${plan.experiment.offer}`,
    ...plan.experiment.days.flatMap((day) => [
      "",
      `${day.day}일차 · ${day.title}`,
      day.action,
      `남길 근거: ${day.evidenceToKeep}`,
    ]),
    "",
    `계속: ${plan.experiment.decisionRule.continue}`,
    `수정: ${plan.experiment.decisionRule.revise}`,
    `중단: ${plan.experiment.decisionRule.stop}`,
    "",
    plan.notice,
  ].join("\n");
}

export function TodayB() {
  const [input, setInput] = useState(initialInput);
  const [plan, setPlan] = useState<TodayBExperimentResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [startState, setStartState] = useState<"idle" | "done" | "error">("idle");
  const [progressState, setProgressState] = useState<"idle" | "error">("idle");
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const inputStartedRef = useRef(false);

  useEffect(() => {
    trackMvpLandingViewed("today_b");
  }, []);

  useEffect(() => {
    if (plan) trackMvpResultViewed("today_b");
  }, [plan]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RESULT_KEY) ?? "null") as unknown;
      const parsed = todayBExperimentResponseSchema.safeParse(saved);
      if (!parsed.success) return;
      setPlan(parsed.data);

      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, unknown>;
      const savedDays = progress[parsed.data.planId];
      if (Array.isArray(savedDays)) {
        setCompletedDays(savedDays.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 7));
      }

      const starts = JSON.parse(localStorage.getItem(STARTED_KEY) ?? "{}") as Record<string, unknown>;
      if (typeof starts[parsed.data.planId] === "string") setStartState("done");
    } catch {
      localStorage.removeItem(RESULT_KEY);
      localStorage.removeItem(PROGRESS_KEY);
    }
  }, []);

  const updateTextField = (
    field: "idea" | "customer" | "promise",
    value: string,
  ) => {
    setInput((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateInput(input);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const firstField = Object.keys(nextErrors)[0];
      requestAnimationFrame(() => document.getElementById(`today-b-${firstField}`)?.focus());
      return;
    }

    setStatus("loading");
    setCopyState("idle");

    try {
      const response = await fetch("/api/today-b/experiment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const body: unknown = await response.json();
      const parsed = todayBExperimentResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("invalid_response");
      setPlan(parsed.data);
      setCompletedDays([]);
      setStartState("idle");
      setProgressState("idle");
      localStorage.setItem(RESULT_KEY, JSON.stringify(parsed.data));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const startExperiment = () => {
    if (!plan || startState === "done") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STARTED_KEY) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(STARTED_KEY, JSON.stringify({
        ...saved,
        [plan.planId]: new Date().toISOString(),
      }));
      setStartState("done");
      trackMvpDeepAction("today_b");
    } catch {
      setStartState("error");
    }
  };

  const toggleDay = (day: number) => {
    if (!plan) return;
    const wasCompleted = completedDays.includes(day);
    const next = wasCompleted
      ? completedDays.filter((item) => item !== day)
      : [...completedDays, day].sort((a, b) => a - b);

    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, [plan.planId]: next }));
      setCompletedDays(next);
      setProgressState("idle");
      if (!wasCompleted) startExperiment();
    } catch {
      setProgressState("error");
    }
  };

  const reset = () => {
    setPlan(null);
    setCompletedDays([]);
    setCopyState("idle");
    setStartState("idle");
    setProgressState("idle");
    setStatus("idle");
    localStorage.removeItem(RESULT_KEY);
  };

  const copyPlan = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(planText(plan));
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <ArrowLeft aria-hidden size={18} />
          실험 허브
        </Link>
        <span className={styles.routeLabel}>
          <FlaskConical aria-hidden size={14} />
          TODAY B
        </span>
      </header>

      {!plan ? (
        <section className={styles.flow} aria-labelledby="today-b-title">
          <div className={styles.intro}>
            <p className={styles.eyebrow}>아이디어가 있다면, 제작 전 7일</p>
            <h1 id="today-b-title">좋다는 말 말고,<br />실제 행동을 확인해요.</h1>
            <p className={styles.lead}>
              아이디어와 고객을 알려 주세요. 가장 위험한 가정 하나와 오늘부터 실행할 계획을 만듭니다.
            </p>
            <ol className={styles.previewSteps} aria-label="7일 수요 실험을 만드는 순서">
              <li><span>1</span><strong>아이디어를 한 문장으로 정리</strong></li>
              <li><span>2</span><strong>확인할 행동 신호 선택</strong></li>
              <li><span>3</span><strong>7일 실행 계획 시작</strong></li>
            </ol>
          </div>

          <form className={styles.form} onSubmit={generate} noValidate data-clarity-mask="true">
            <div className={styles.formHeading}>
              <span>STEP 1</span>
              <div>
                <h2>누구에게 무엇을 제안하나요?</h2>
                <p>완성된 기획서 대신, 고객과 결과만 구체적으로 적어 주세요.</p>
              </div>
            </div>

            <div className={`${styles.field} ${fieldErrors.idea ? styles.fieldInvalid : ""}`}>
              <div className={styles.labelRow}>
                <label htmlFor="today-b-idea">해보고 싶은 아이디어</label>
                <span>{input.idea.length}/240</span>
              </div>
              <textarea
                id="today-b-idea"
                value={input.idea}
                onChange={(event) => {
                  updateTextField("idea", event.target.value);
                  if (!inputStartedRef.current && event.target.value.trim()) {
                    inputStartedRef.current = true;
                    trackMvpInputStarted("today_b");
                  }
                }}
                placeholder="예: 고객 문의를 읽고 답변 초안을 만드는 작은 도구"
                minLength={8}
                maxLength={240}
                required
                aria-invalid={Boolean(fieldErrors.idea)}
                aria-describedby={fieldErrors.idea ? "today-b-idea-error" : "today-b-idea-hint"}
              />
              <p id={fieldErrors.idea ? "today-b-idea-error" : "today-b-idea-hint"} role={fieldErrors.idea ? "alert" : undefined}>
                {fieldErrors.idea ?? "아직 만들지 않은 아이디어도 괜찮아요."}
              </p>
            </div>

            <div className={styles.fieldPair}>
              <div className={`${styles.field} ${fieldErrors.customer ? styles.fieldInvalid : ""}`}>
                <label htmlFor="today-b-customer">처음 제안할 고객</label>
                <input
                  id="today-b-customer"
                  value={input.customer}
                  onChange={(event) => updateTextField("customer", event.target.value)}
                  placeholder="예: 혼자 쇼핑몰을 운영하는 사람"
                  minLength={4}
                  maxLength={120}
                  required
                  aria-invalid={Boolean(fieldErrors.customer)}
                  aria-describedby={fieldErrors.customer ? "today-b-customer-error" : undefined}
                />
                {fieldErrors.customer ? <p id="today-b-customer-error" role="alert">{fieldErrors.customer}</p> : null}
              </div>

              <div className={`${styles.field} ${fieldErrors.promise ? styles.fieldInvalid : ""}`}>
                <label htmlFor="today-b-promise">고객이 바로 얻는 결과</label>
                <input
                  id="today-b-promise"
                  value={input.promise}
                  onChange={(event) => updateTextField("promise", event.target.value)}
                  placeholder="예: 문의 10개 답변을 5분 안에 받기"
                  minLength={6}
                  maxLength={180}
                  required
                  aria-invalid={Boolean(fieldErrors.promise)}
                  aria-describedby={fieldErrors.promise ? "today-b-promise-error" : undefined}
                />
                {fieldErrors.promise ? <p id="today-b-promise-error" role="alert">{fieldErrors.promise}</p> : null}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="today-b-channel">이 고객에게 닿을 수 있는 곳</label>
              <select
                id="today-b-channel"
                value={input.channel}
                onChange={(event) => setInput({ ...input, channel: event.target.value as TodayBExperimentRequest["channel"] })}
              >
                <option value="direct">직접 연락할 수 있어요</option>
                <option value="community">모여 있는 커뮤니티가 있어요</option>
                <option value="audience">내 콘텐츠 채널에 있어요</option>
                <option value="offline">오프라인에서 만날 수 있어요</option>
              </select>
            </div>

            <fieldset className={styles.signalGroup}>
              <legend>
                <span>STEP 2</span>
                이번 주에 어떤 행동을 확인할까요?
              </legend>
              <p>지금 요청해도 무리가 없는 범위에서 가장 강한 신호를 고르세요.</p>
              <div className={styles.signalOptions}>
                {signalOptions.map((option) => (
                  <label
                    key={option.value}
                    className={styles.signalOption}
                    data-selected={input.signal === option.value}
                  >
                    <input
                      type="radio"
                      name="today-b-signal"
                      value={option.value}
                      checked={input.signal === option.value}
                      onChange={() => setInput({ ...input, signal: option.value })}
                    />
                    <span className={styles.radioMark} aria-hidden>
                      <span />
                    </span>
                    <span className={styles.signalCopy}>
                      <span className={styles.signalTitle}>
                        <strong>{option.title}</strong>
                        <em>{option.strength}</em>
                      </span>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.submitArea}>
              <div>
                <strong>다음 화면에서 바로 확인해요</strong>
                <span>가장 위험한 가정 · 성공 기준 · 1~7일차 행동</span>
              </div>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={status === "loading"}
                aria-busy={status === "loading"}
              >
                {status === "loading" ? "7일 계획을 만드는 중…" : status === "error" ? "다시 7일 계획 만들기" : "7일 수요 실험 만들기"}
                {status !== "loading" ? <ArrowRight aria-hidden size={18} /> : null}
              </button>
            </div>
            {status === "error" ? (
              <p className={styles.error} role="alert">
                계획을 불러오지 못했어요. 작성한 내용은 그대로 있으니 다시 시도해 주세요.
              </p>
            ) : null}
          </form>
        </section>
      ) : (
        <section
          className={styles.result}
          aria-labelledby="today-b-result-title"
          aria-live="polite"
          data-clarity-mask="true"
        >
          <div className={styles.resultIntro}>
            <div className={styles.resultMeta}>
              <p className={styles.eyebrow}>가장 먼저 확인할 위험</p>
              <span>Mock API 계획</span>
            </div>
            <h1 id="today-b-result-title">{plan.risk.label}</h1>
            <p className={styles.assumption}>{plan.risk.assumption}</p>
            <p className={styles.riskReason}>{plan.risk.reason}</p>
          </div>

          <section className={styles.hypothesis} aria-labelledby="today-b-hypothesis">
            <p>이번 주의 한 문장 가설</p>
            <h2 id="today-b-hypothesis">{plan.experiment.hypothesis}</h2>
            <div className={styles.metric} aria-label="실험 성공 기준">
              <span>
                <small>제안할 사람</small>
                <strong>{plan.experiment.targetCount}<em>명</em></strong>
              </span>
              <ArrowRight aria-hidden size={20} />
              <span>
                <small>계속할 기준</small>
                <strong>{plan.experiment.passCount}<em>명 행동</em></strong>
              </span>
            </div>
          </section>

          <section className={styles.offer} aria-labelledby="today-b-offer">
            <div className={styles.sectionLabel}>
              <span>보낼 문구</span>
              <p>첫 제안에 그대로 써도 돼요.</p>
            </div>
            <h2 id="today-b-offer">{plan.experiment.offer}</h2>
          </section>

          <section className={styles.days} aria-labelledby="today-b-days">
            <div className={styles.daysHeader}>
              <div>
                <p>실행 보드</p>
                <h2 id="today-b-days">오늘부터 7일, 하나씩</h2>
              </div>
              <span aria-label={`7일 중 ${completedDays.length}일 완료`}>{completedDays.length}/7</span>
            </div>
            <progress aria-label="7일 실험 진행률" max={7} value={completedDays.length}>
              {completedDays.length}/7
            </progress>
            <p className={styles.localNotice}>체크한 날은 이 기기에 바로 저장됩니다.</p>
            <ol>
              {plan.experiment.days.map((day) => {
                const checked = completedDays.includes(day.day);
                return (
                  <li key={day.day} className={checked ? styles.dayDone : undefined}>
                    <label>
                      <input type="checkbox" checked={checked} onChange={() => toggleDay(day.day)} />
                      <span className={styles.checkmark} aria-hidden>
                        {checked ? <Check size={17} strokeWidth={3} /> : day.day}
                      </span>
                      <span className={styles.dayCopy}>
                        <strong>{day.title}</strong>
                        <small>{day.action}</small>
                        <em><span>남길 근거</span>{day.evidenceToKeep}</em>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
            {completedDays.length === 7 ? (
              <p className={styles.completeMessage} role="status">
                7일 기록이 모두 모였어요. 아래 기준으로 계속할지 결정해 보세요.
              </p>
            ) : null}
            {progressState === "error" ? (
              <p className={styles.error} role="alert">
                체크 상태를 저장하지 못했어요. 브라우저 저장 공간을 확인한 뒤 다시 눌러 주세요.
              </p>
            ) : null}
          </section>

          <section className={styles.decision} aria-labelledby="today-b-decision">
            <div className={styles.sectionLabel}>
              <span>7일 뒤</span>
              <p>느낌이 아니라 숫자로 결정해요.</p>
            </div>
            <h2 id="today-b-decision">결과에 따라 다음 행동을 고르세요.</h2>
            <dl>
              <div className={styles.continueDecision}>
                <dt>계속</dt>
                <dd>{plan.experiment.decisionRule.continue}</dd>
              </div>
              <div>
                <dt>수정</dt>
                <dd>{plan.experiment.decisionRule.revise}</dd>
              </div>
              <div className={styles.stopDecision}>
                <dt>중단</dt>
                <dd>{plan.experiment.decisionRule.stop}</dd>
              </div>
            </dl>
          </section>

          <aside className={styles.actionPanel} aria-label="7일 실험 실행 메뉴">
            <p className={styles.notice}>{plan.notice}</p>
            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={startExperiment}
                disabled={startState === "done"}
              >
                <Check aria-hidden size={18} />
                {startState === "done" ? "이 기기에서 7일 실험을 시작했어요" : "이 7일 실험 시작하기"}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={copyPlan}>
                {copyState === "done" ? <ClipboardCheck aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
                {copyState === "done" ? "계획을 복사했어요" : "전체 계획 복사하기"}
              </button>
              <button className={styles.textButton} type="button" onClick={reset}>
                <RotateCcw aria-hidden size={17} />
                다른 아이디어로 다시 만들기
              </button>
            </div>
            {copyState === "error" ? (
              <p className={styles.error} role="alert">
                복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.
              </p>
            ) : null}
            {startState === "error" ? (
              <p className={styles.error} role="alert">
                시작 상태를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.
              </p>
            ) : null}
            <PostResultSignup experimentId="today_b" label="다른 기기에서도 이어서 체크하기" />
          </aside>
        </section>
      )}
    </main>
  );
}
