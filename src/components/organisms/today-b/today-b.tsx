"use client";

import Link from "next/link";
import { ArrowLeft, Check, ClipboardCheck, Copy, RotateCcw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { trackMvpDeepAction, trackMvpResultViewed } from "@/lib/mvp-experiment-analytics";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import {
  todayBExperimentResponseSchema,
  type TodayBExperimentRequest,
  type TodayBExperimentResponse,
} from "@/lib/today-b-contract";
import styles from "./today-b.module.css";

const RESULT_KEY = "today-b:last-plan:v1";
const PROGRESS_KEY = "today-b:plan-progress:v1";

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
}> = [
  { value: "conversation", title: "문제 인터뷰", description: "지금 겪는 문제를 15분 보여주기" },
  { value: "waitlist", title: "대기 신청", description: "출시 알림을 받을 연락처 남기기" },
  { value: "deposit", title: "예약금", description: "환불 가능한 소액 예약금 내기" },
  { value: "preorder", title: "사전 구매", description: "가격과 제공일을 보고 먼저 결제하기" },
];

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
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [completedDays, setCompletedDays] = useState<number[]>([]);

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
    } catch {
      localStorage.removeItem(RESULT_KEY);
      localStorage.removeItem(PROGRESS_KEY);
    }
  }, []);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      localStorage.setItem(RESULT_KEY, JSON.stringify(parsed.data));
      trackMvpDeepAction("today_b");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const toggleDay = (day: number) => {
    if (!plan) return;
    const next = completedDays.includes(day)
      ? completedDays.filter((item) => item !== day)
      : [...completedDays, day].sort((a, b) => a - b);
    setCompletedDays(next);
    try {
      const progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...progress, [plan.planId]: next }));
    } catch {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ [plan.planId]: next }));
    }
  };

  const reset = () => {
    setPlan(null);
    setCompletedDays([]);
    setCopyState("idle");
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
        <span className={styles.routeLabel}>TODAY B</span>
      </header>

      {!plan ? (
        <section className={styles.flow} aria-labelledby="today-b-title">
          <p className={styles.eyebrow}>아이디어가 이미 있다면</p>
          <h1 id="today-b-title">기능보다 먼저,<br />가장 위험한 가정을 시험해요.</h1>
          <p className={styles.lead}>
            아이디어와 고객을 적으면, 좋아요가 아니라 실제 행동을 세는 7일 수요 실험을 만듭니다.
          </p>

          <form className={styles.form} onSubmit={generate}>
            <div className={styles.field}>
              <label htmlFor="today-b-idea">해보고 싶은 아이디어</label>
              <textarea
                id="today-b-idea"
                value={input.idea}
                onChange={(event) => setInput({ ...input, idea: event.target.value })}
                placeholder="예: 고객 문의를 읽고 답변 초안을 만드는 작은 도구"
                minLength={8}
                maxLength={240}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="today-b-customer">처음 제안할 고객</label>
              <input
                id="today-b-customer"
                value={input.customer}
                onChange={(event) => setInput({ ...input, customer: event.target.value })}
                placeholder="예: 혼자 쇼핑몰을 운영하는 사람"
                minLength={4}
                maxLength={120}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="today-b-promise">고객이 바로 얻는 결과</label>
              <input
                id="today-b-promise"
                value={input.promise}
                onChange={(event) => setInput({ ...input, promise: event.target.value })}
                placeholder="예: 문의 10개의 답변 초안을 5분 안에 받기"
                minLength={6}
                maxLength={180}
                required
              />
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
              <legend>이번 주 확인할 행동</legend>
              <p>지금 요청해도 부담스럽지 않은 가장 강한 신호를 고르세요.</p>
              <div className={styles.signalOptions}>
                {signalOptions.map((option) => (
                  <label key={option.value} className={styles.signalOption}>
                    <input
                      type="radio"
                      name="today-b-signal"
                      value={option.value}
                      checked={input.signal === option.value}
                      onChange={() => setInput({ ...input, signal: option.value })}
                    />
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {status === "error" ? (
              <p className={styles.error} role="alert">
                실험 계획을 만들지 못했어요. 입력은 그대로 두었으니 다시 시도해 주세요.
              </p>
            ) : null}
            <button className={styles.primaryButton} type="submit" disabled={status === "loading"} aria-busy={status === "loading"}>
              {status === "loading" ? "가정과 기준을 만드는 중…" : status === "error" ? "다시 실험 만들기" : "7일 수요 실험 만들기"}
            </button>
          </form>
        </section>
      ) : (
        <section className={styles.result} aria-labelledby="today-b-result-title" aria-live="polite">
          <div className={styles.resultIntro}>
            <p className={styles.eyebrow}>가장 먼저 확인할 위험</p>
            <h1 id="today-b-result-title">{plan.risk.label}</h1>
            <p className={styles.assumption}>{plan.risk.assumption}</p>
            <p>{plan.risk.reason}</p>
          </div>

          <section className={styles.hypothesis} aria-labelledby="today-b-hypothesis">
            <p>7일 가설</p>
            <h2 id="today-b-hypothesis">{plan.experiment.hypothesis}</h2>
            <div className={styles.metric}>
              <span><strong>{plan.experiment.targetCount}</strong>명에게 제안</span>
              <span><strong>{plan.experiment.passCount}</strong>명 행동 시 계속</span>
            </div>
          </section>

          <section className={styles.offer} aria-labelledby="today-b-offer">
            <p>그대로 보낼 첫 제안</p>
            <h2 id="today-b-offer">{plan.experiment.offer}</h2>
          </section>

          <section className={styles.days} aria-labelledby="today-b-days">
            <div className={styles.daysHeader}>
              <div>
                <p>실행 체크리스트</p>
                <h2 id="today-b-days">7일 동안 할 일</h2>
              </div>
              <span aria-label={`7일 중 ${completedDays.length}일 완료`}>{completedDays.length}/7</span>
            </div>
            <p className={styles.localNotice}>체크 상태와 이 계획은 이 기기에만 저장됩니다.</p>
            <ol>
              {plan.experiment.days.map((day) => {
                const checked = completedDays.includes(day.day);
                return (
                  <li key={day.day} className={checked ? styles.dayDone : undefined}>
                    <label>
                      <input type="checkbox" checked={checked} onChange={() => toggleDay(day.day)} />
                      <span className={styles.checkmark} aria-hidden>{checked ? <Check size={16} /> : day.day}</span>
                      <span>
                        <strong>{day.day}일차 · {day.title}</strong>
                        <small>{day.action}</small>
                        <em>남길 근거: {day.evidenceToKeep}</em>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={styles.decision} aria-labelledby="today-b-decision">
            <p>7일 뒤 결정 기준</p>
            <h2 id="today-b-decision">결과를 보고 이렇게 결정하세요.</h2>
            <dl>
              <div><dt>계속</dt><dd>{plan.experiment.decisionRule.continue}</dd></div>
              <div><dt>수정</dt><dd>{plan.experiment.decisionRule.revise}</dd></div>
              <div><dt>중단</dt><dd>{plan.experiment.decisionRule.stop}</dd></div>
            </dl>
          </section>

          <p className={styles.notice}>{plan.notice}</p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" onClick={copyPlan}>
              {copyState === "done" ? <ClipboardCheck aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
              {copyState === "done" ? "계획을 복사했어요" : "전체 계획 복사하기"}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={reset}>
              <RotateCcw aria-hidden size={18} />
              다른 아이디어 넣기
            </button>
          </div>
          {copyState === "error" ? <p className={styles.error} role="alert">복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.</p> : null}
          <PostResultSignup experimentId="today_b" label="7일 실험을 이어가려면 Google로 연결하기" />
        </section>
      )}
    </main>
  );
}
