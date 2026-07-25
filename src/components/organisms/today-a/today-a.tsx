"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { trackMvpDeepAction, trackMvpResultViewed } from "@/lib/mvp-experiment-analytics";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
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
  const [result, setResult] = useState<TodayAStructureResponse["result"] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");

  useEffect(() => {
    if (result) trackMvpResultViewed("today_a");
  }, [result]);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setCopyState("idle");

    try {
      const response = await fetch("/api/today-a/structure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const body: unknown = await response.json();
      const parsed = todayAStructureResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("invalid_response");
      setResult(parsed.data.result);
      setStatus("idle");
    } catch {
      setStatus("error");
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <ArrowLeft aria-hidden size={18} />
          실험 허브
        </Link>
        <span className={styles.routeLabel}>TODAY A</span>
      </header>

      {!result ? (
        <section className={styles.flow} aria-labelledby="today-a-title">
          <p className={styles.eyebrow}>조건에서 시작하기</p>
          <h1 id="today-a-title">할 수 있는 조건을 넣으면<br />사업 구조 하나가 나와요.</h1>
          <p className={styles.lead}>
            저장된 실제 제품 원본과 비교해, 돈 낼 사람·필요한 순간·입력·처리·결과를 한 줄씩 정리합니다.
          </p>

          <form className={styles.form} onSubmit={generate}>
            <div className={styles.field}>
              <label htmlFor="today-a-customer">누구의 문제를 풀고 싶나요?</label>
              <select
                id="today-a-customer"
                value={input.customer}
                onChange={(event) => setInput({ ...input, customer: event.target.value as TodayAStructureRequest["customer"] })}
              >
                <option value="small_business">소규모 사업자</option>
                <option value="team">회사 안의 팀</option>
                <option value="individual">개인 고객</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="today-a-problem">반복해서 보이는 불편은 무엇인가요?</label>
              <textarea
                id="today-a-problem"
                value={input.problem}
                onChange={(event) => setInput({ ...input, problem: event.target.value })}
                placeholder="예: 문의가 여러 채널로 들어와 답변과 예약이 자꾸 늦어져요."
                minLength={8}
                maxLength={240}
                required
                aria-describedby="today-a-problem-help"
              />
              <p id="today-a-problem-help">누가, 언제 겪는 불편인지 8자 이상 적어주세요.</p>
            </div>

            <div className={styles.twoFields}>
              <div className={styles.field}>
                <label htmlFor="today-a-strength">가장 자신 있는 일</label>
                <select
                  id="today-a-strength"
                  value={input.strength}
                  onChange={(event) => setInput({ ...input, strength: event.target.value as TodayAStructureRequest["strength"] })}
                >
                  <option value="operations">운영 정리</option>
                  <option value="content">콘텐츠 만들기</option>
                  <option value="sales">영업·고객 대화</option>
                  <option value="development">개발·자동화</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="today-a-time">이번 주 쓸 수 있는 시간</label>
                <select
                  id="today-a-time"
                  value={input.weeklyTime}
                  onChange={(event) => setInput({ ...input, weeklyTime: event.target.value as TodayAStructureRequest["weeklyTime"] })}
                >
                  <option value="two_hours">2시간</option>
                  <option value="half_day">반나절</option>
                  <option value="one_day">하루</option>
                </select>
              </div>
            </div>

            {status === "error" ? (
              <p className={styles.error} role="alert">
                구조를 불러오지 못했어요. 입력은 그대로 두었으니 다시 시도해 주세요.
              </p>
            ) : null}
            <button className={styles.primaryButton} type="submit" disabled={status === "loading"} aria-busy={status === "loading"}>
              {status === "loading" ? "원본과 비교하는 중…" : status === "error" ? "다시 구조 찾기" : "근거가 있는 구조 1개 보기"}
            </button>
          </form>
        </section>
      ) : (
        <section className={styles.result} aria-labelledby="today-a-result-title" aria-live="polite">
          <div className={styles.resultIntro}>
            <p className={styles.eyebrow}>조건에 가장 가까운 구조 1개</p>
            <h1 id="today-a-result-title">{result.title}</h1>
            <p>{result.summary}</p>
            <p className={styles.fitReason}>{result.fitReason}</p>
          </div>

          <section className={styles.structure} aria-label="사업 구조">
            <div><span>돈 낼 사람</span><strong>{result.structure.payer}</strong></div>
            <div><span>필요한 순간</span><strong>{result.structure.needMoment}</strong></div>
            <div><span>입력</span><strong>{result.structure.input}</strong></div>
            <div><span>처리</span><strong>{result.structure.process}</strong></div>
            <div><span>바로 받는 결과</span><strong>{result.structure.output}</strong></div>
          </section>

          <section className={styles.firstOffer} aria-labelledby="today-a-first-offer">
            <p>이번 주 첫 제안</p>
            <h2 id="today-a-first-offer">{result.structure.firstOffer}</h2>
          </section>

          <section className={styles.evidence} aria-labelledby="today-a-evidence">
            <div>
              <p>비교한 원본</p>
              <h2 id="today-a-evidence">{result.evidence.sourceName}</h2>
            </div>
            <p>{result.evidence.statement}</p>
            <p className={styles.notice}>{result.evidence.snapshotNotice}</p>
            <a href={result.evidence.sourceUrl} target="_blank" rel="noreferrer" className={styles.sourceLink}>
              원본 페이지 열기
              <ArrowUpRight aria-hidden size={17} />
            </a>
          </section>

          <div className={styles.actions}>
            <button className={styles.primaryButton} type="button" onClick={copyResult}>
              {copyState === "done" ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
              {copyState === "done" ? "구조를 복사했어요" : "이 구조 복사하기"}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setResult(null);
                setCopyState("idle");
              }}
            >
              <RefreshCw aria-hidden size={18} />
              조건 고치기
            </button>
          </div>
          {copyState === "error" ? <p className={styles.error} role="alert">복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.</p> : null}
          <PostResultSignup experimentId="today_a" label="내 구조를 다시 만들려면 Google로 연결하기" />
        </section>
      )}
    </main>
  );
}
