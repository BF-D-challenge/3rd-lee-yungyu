"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Download,
  Lightbulb,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MvpAppHeader } from "@/components/organisms/mvp-shared/mvp-app-header";
import { todayAdSvgDataUrl } from "@/lib/today-artifacts";
import {
  todayApplicationResponseSchema,
  todayApplicationStatusResponseSchema,
  todayIdeaResponseSchema,
  todayJobLocatorSchema,
  type TodayApplication,
  type TodayChannel,
  type TodayIdeaRequest,
  type TodayIdeaResult,
  type TodayJobLocator,
  type TodaySignal,
} from "@/lib/today-contract";
import {
  trackTodayEvent,
} from "@/lib/today-analytics";
import styles from "./today.module.css";

const DRAFT_KEY = "today:idea-draft:v1";
const JOB_KEY = "today:application-locator:v2";

type Stage = "start" | "existing" | "guided" | "draft" | "apply" | "queued" | "ready";
type GuidedAnswers = NonNullable<TodayIdeaRequest["answers"]>;

const initialAnswers: GuidedAnswers = {
  customer: "solo_business",
  moment: "repetitive_work",
  strength: "organize",
};

const questions = [
  {
    key: "customer" as const,
    kicker: "1 / 3 · 고객",
    title: "누구의 문제를 가장 잘 아나요?",
    options: [
      { value: "solo_business", label: "혼자 일하는 사업자", description: "작은 가게, 프리랜서, 1인 사업자" },
      { value: "team", label: "회사 안의 팀", description: "같은 업무를 반복해서 처리하는 팀" },
      { value: "consumer", label: "나와 비슷한 개인", description: "일상에서 같은 불편을 겪는 사람" },
    ],
  },
  {
    key: "moment" as const,
    kicker: "2 / 3 · 순간",
    title: "어떤 순간을 먼저 줄이고 싶나요?",
    options: [
      { value: "repetitive_work", label: "같은 일을 또 할 때", description: "복사, 정리, 확인을 반복해요." },
      { value: "missed_sales", label: "고객 답변이 늦을 때", description: "문의나 예약 기회를 놓쳐요." },
      { value: "scattered_info", label: "저장한 걸 못 찾을 때", description: "정보가 여러 앱에 흩어져요." },
    ],
  },
  {
    key: "strength" as const,
    kicker: "3 / 3 · 강점",
    title: "내가 가장 빨리 만들 수 있는 것은?",
    options: [
      { value: "organize", label: "정리된 결과", description: "자료를 모아 보기 쉽게 만들어요." },
      { value: "talk", label: "대화와 안내", description: "질문하고 답을 이어가게 만들어요." },
      { value: "build", label: "작은 도구", description: "입력하면 결과가 나오는 기능을 만들어요." },
    ],
  },
] as const;

const channelOptions: Array<{ value: TodayChannel; label: string; description: string }> = [
  { value: "instagram", label: "Instagram", description: "피드·스토리 광고로 보여줘요." },
  { value: "community", label: "고객 커뮤니티", description: "관련 모임에 같은 제안을 올려요." },
  { value: "direct", label: "직접 메시지", description: "대상 고객에게 한 명씩 보내요." },
];

const signalOptions: Array<{ value: TodaySignal; label: string; description: string }> = [
  { value: "waitlist", label: "대기 신청", description: "연락처를 남기는지 확인해요." },
  { value: "interview", label: "15분 인터뷰", description: "실제 문제를 보여줄지 확인해요." },
  { value: "deposit", label: "환불 가능한 예약금", description: "가장 강한 지불 의향을 확인해요." },
];

function formatReadyAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function loadLocator(): TodayJobLocator | null {
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const fromUrl = todayJobLocatorSchema.safeParse({
      id: hash.get("job"),
      token: hash.get("token"),
    });
    if (fromUrl.success) return fromUrl.data;
    const parsed = todayJobLocatorSchema.safeParse(JSON.parse(localStorage.getItem(JOB_KEY) ?? "null"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function Today() {
  const [stage, setStage] = useState<Stage>("start");
  const [ideaText, setIdeaText] = useState("");
  const [guidedStep, setGuidedStep] = useState(0);
  const [answers, setAnswers] = useState<GuidedAnswers>(initialAnswers);
  const [draft, setDraft] = useState<TodayIdeaResult | null>(null);
  const [job, setJob] = useState<TodayApplication | null>(null);
  const [locator, setLocator] = useState<TodayJobLocator | null>(null);
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<TodayChannel>("instagram");
  const [signal, setSignal] = useState<TodaySignal>("waitlist");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const startedRef = useRef(false);
  const landingTrackedRef = useRef(false);

  useEffect(() => {
    if (!landingTrackedRef.current) {
      landingTrackedRef.current = true;
      trackTodayEvent("today_landing_viewed");
    }
    const startNew = new URLSearchParams(window.location.search).get("new") === "1";
    if (startNew) {
      window.history.replaceState(null, "", "/today");
      return;
    }
    const savedLocator = loadLocator();
    if (savedLocator) {
      setLocator(savedLocator);
      void fetch(`/api/today/applications/${savedLocator.id}`, {
        cache: "no-store",
        headers: { "x-today-access-token": savedLocator.token },
      }).then(async (response) => {
        const body: unknown = await response.json();
        const parsed = todayApplicationStatusResponseSchema.safeParse(body);
        if (!response.ok || !parsed.success || parsed.data.job.status === "cancelled") {
          throw new Error("job_not_found");
        }
        setJob(parsed.data.job);
        setDraft(parsed.data.job.idea);
        setStage(parsed.data.job.status === "ready" && parsed.data.job.artifacts ? "ready" : "queued");
      }).catch(() => {
        localStorage.removeItem(JOB_KEY);
        setLocator(null);
      });
      return;
    }
    try {
      const parsed = todayIdeaResponseSchema.shape.result.safeParse(
        JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"),
      );
      if (parsed.success) {
        setDraft(parsed.data);
        setSignal(parsed.data.productionScope.suggestedSignal);
        setStage("draft");
      }
    } catch {
      // A damaged local draft should never block a fresh start.
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const focusTarget: Partial<Record<Stage, string>> = {
      existing: "today-existing-title",
      guided: "today-guided-title",
      draft: "today-draft-title",
      apply: "today-apply-title",
      queued: "today-queued-title",
      ready: "today-ready-title",
    };
    const targetId = focusTarget[stage];
    if (!targetId) return;
    const frame = requestAnimationFrame(() => document.getElementById(targetId)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [stage]);

  useEffect(() => {
    if (!locator || stage !== "queued") return;
    const refresh = async () => {
      try {
        const response = await fetch(
          `/api/today/applications/${locator.id}`,
          { cache: "no-store", headers: { "x-today-access-token": locator.token } },
        );
        const body: unknown = await response.json();
        const parsed = todayApplicationStatusResponseSchema.safeParse(body);
        if (!response.ok || !parsed.success) return;
        setJob(parsed.data.job);
        if (parsed.data.job.status === "ready" && parsed.data.job.artifacts) setStage("ready");
      } catch {
        // A temporary refresh failure does not invalidate the emailed access link.
      }
    };
    const timer = window.setInterval(() => { void refresh(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [locator, stage]);

  const markStarted = (ideaPath?: "existing" | "guided") => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackTodayEvent("today_idea_started", ideaPath ? { idea_path: ideaPath } : {});
  };

  const selectPath = (path: "existing" | "guided") => {
    markStarted(path);
    setError("");
    setStage(path);
    requestAnimationFrame(() => {
      document.getElementById(path === "existing" ? "today-existing-idea" : "today-guided-title")?.focus();
    });
  };

  const createIdea = async (request: TodayIdeaRequest) => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/today/idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const body: unknown = await response.json();
      const parsed = todayIdeaResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("invalid_response");
      localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed.data.result));
      setDraft(parsed.data.result);
      setSignal(parsed.data.result.productionScope.suggestedSignal);
      setStage("draft");
      setStatus("idle");
      requestAnimationFrame(() => document.getElementById("today-draft-title")?.focus());
    } catch {
      setStatus("error");
      setError("아이디어를 정리하지 못했어요. 잠시 뒤 다시 시도해주세요.");
    }
  };

  const submitExisting = (event: FormEvent) => {
    event.preventDefault();
    if (ideaText.trim().length < 12) {
      setError("누구의 어떤 문제를 해결하는지 12자 이상 적어주세요.");
      requestAnimationFrame(() => document.getElementById("today-existing-idea")?.focus());
      return;
    }
    void createIdea({ path: "existing", idea: ideaText });
  };

  const advanceGuided = () => {
    if (guidedStep < questions.length - 1) {
      setGuidedStep((value) => value + 1);
      requestAnimationFrame(() => document.getElementById("today-guided-title")?.focus());
      return;
    }
    void createIdea({ path: "guided", idea: "", answers });
  };

  const apply = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("결과를 확인할 이메일 주소를 정확히 적어주세요.");
      requestAnimationFrame(() => document.getElementById("today-email")?.focus());
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/today/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea: draft, email, channel, signal }),
      });
      const body: unknown = await response.json();
      const parsed = todayApplicationResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) {
        const detail = typeof body === "object" && body && "notice" in body
          ? String(body.notice)
          : "제작 신청을 접수하지 못했어요.";
        throw new Error(detail);
      }
      const nextLocator = { id: parsed.data.job.id, token: parsed.data.accessToken };
      localStorage.setItem(JOB_KEY, JSON.stringify(nextLocator));
      window.history.replaceState(
        null,
        "",
        `/today#job=${nextLocator.id}&token=${encodeURIComponent(nextLocator.token)}`,
      );
      setLocator(nextLocator);
      setJob(parsed.data.job);
      setStage("queued");
      setStatus("idle");
      trackTodayEvent("today_request_submitted", { channel, signal });
      requestAnimationFrame(() => document.getElementById("today-queued-title")?.focus());
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "제작 신청을 접수하지 못했어요.");
    }
  };

  const reset = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(JOB_KEY);
    setDraft(null);
    setJob(null);
    setLocator(null);
    setIdeaText("");
    setGuidedStep(0);
    setAnswers(initialAnswers);
    setEmail("");
    setError("");
    setStatus("idle");
    startedRef.current = false;
    window.history.replaceState(null, "", "/today");
    setStage("start");
  };

  const cancel = async () => {
    if (!locator) return;
    setStatus("loading");
    try {
      const response = await fetch(
        `/api/today/applications/${locator.id}`,
        { method: "DELETE", headers: { "x-today-access-token": locator.token } },
      );
      if (!response.ok) throw new Error("cancel_failed");
      reset();
    } catch {
      setStatus("error");
      setError("신청을 취소하지 못했어요. 잠시 뒤 다시 시도해주세요.");
    }
  };

  const adUrl = useMemo(
    () => job?.artifacts ? todayAdSvgDataUrl({ id: job.id, artifacts: job.artifacts }) : "",
    [job],
  );
  const activeQuestion = questions[guidedStep];

  return (
    <main className={styles.page}>
      <MvpAppHeader
        backClassName={styles.back}
        backLabel="실험 허브"
        className={styles.header}
        meta="TODAY"
        metaClassName={styles.routeLabel}
      />

      {stage === "start" ? (
        <section className={styles.intro} aria-labelledby="today-title">
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>오늘 신청 · 24시간 뒤 도착</p>
            <h1 id="today-title">아이디어만 알려주세요.<br />테스트 자료는 내일 받아요.</h1>
            <p className={styles.lead}>광고 이미지, 가짜문 랜딩, 계속할지 판단하는 기준을 한 번에 준비해요.</p>
          </div>
          <div className={styles.promiseVisual}>
            <Image
              src="/images/experiment-gallery/today-unified.svg"
              alt="오늘 아이디어를 신청하고 24시간 뒤 광고 이미지, 가짜문 랜딩, 측정 기준을 받는 과정"
              width={960}
              height={540}
              priority
              sizes="(max-width: 839px) 100vw, 42rem"
            />
          </div>
          <section className={styles.deliveryFlow} aria-labelledby="today-delivery-flow-title">
            <div>
              <p className={styles.flowLabel}>오늘 넣는 것</p>
              <h2 id="today-delivery-flow-title">신청 전에 정해요</h2>
              <ul>
                <li><Check aria-hidden /> 아이디어 한 문장 또는 객관식 답 3개</li>
                <li><Check aria-hidden /> 보여줄 곳과 성공으로 볼 행동</li>
                <li><Check aria-hidden /> 결과 받을 이메일</li>
              </ul>
            </div>
            <div className={styles.dayBridge} aria-label="24시간 뒤 전달">
              <Clock3 aria-hidden />
              <strong>24시간 뒤</strong>
              <span>내일 이메일로 도착</span>
            </div>
            <div>
              <p className={styles.flowLabel}>내일 받는 것</p>
              <h2>바로 테스트할 초안이에요</h2>
              <ul>
                <li><Check aria-hidden /> 정사각형 광고 이미지 1장</li>
                <li><Check aria-hidden /> 신청 행동이 있는 가짜문 랜딩</li>
                <li><Check aria-hidden /> 계속·수정·중단 측정 기준</li>
              </ul>
            </div>
          </section>
          <div className={styles.pathPanel} aria-label="아이디어 시작 방법">
            <p>아이디어부터 정리해볼까요?</p>
            <button type="button" className={styles.pathCard} onClick={() => selectPath("existing")}>
              <span className={styles.pathIcon}><Lightbulb aria-hidden /></span>
              <span><strong>생각한 아이디어가 있어요</strong><small>한 문장으로 적고 자료를 바탕으로 다듬어요.</small></span>
              <ArrowRight aria-hidden />
            </button>
            <button type="button" className={styles.pathCard} onClick={() => selectPath("guided")}>
              <span className={styles.pathIcon}><Sparkles aria-hidden /></span>
              <span><strong>아직 아이디어가 없어요</strong><small>쉬운 객관식 질문 세 개로 찾아요.</small></span>
              <ArrowRight aria-hidden />
            </button>
            <p className={styles.noSignup}>가입 없이 아이디어 결과를 먼저 볼 수 있어요.</p>
          </div>
          <aside className={styles.scopeNotice} aria-label="현재 제공 범위">
            <strong>현재 가능한 범위</strong>
            <p>아이디어 문장은 Gemini가 연결된 경우에만 AI가 다듬어요. 연결되지 않으면 저장된 실제 사례와 규칙형 템플릿을 사용해요. 광고 이미지와 랜딩도 테스트용 초안이며, 실제 광고 게재는 포함하지 않아요.</p>
          </aside>
          <Link
            className={styles.reservationCta}
            href="/reserve/today"
            onClick={() => trackTodayEvent("today_reservation_clicked", { placement: "landing" })}
          >
            24시간 제작 자리 예약하기 <ArrowRight aria-hidden />
          </Link>
        </section>
      ) : null}

      {stage === "existing" ? (
        <section className={styles.workspace} aria-labelledby="today-existing-title">
          <form className={styles.questionPanel} onSubmit={submitExisting} data-clarity-mask="true" noValidate>
            <button type="button" className={styles.textButton} onClick={() => setStage("start")}><ArrowLeft size={17} /> 시작으로</button>
            <p className={styles.stepLabel}>1 / 1 · 내 아이디어</p>
            <h1 id="today-existing-title">누구의 어떤 문제를 해결하고 싶나요?</h1>
            <label htmlFor="today-existing-idea">생각한 아이디어</label>
            <textarea
              id="today-existing-idea"
              value={ideaText}
              onChange={(event) => { setIdeaText(event.target.value); setError(""); markStarted("existing"); }}
              placeholder="예: 인스타그램 맛집 영상을 저장하면 가까운 순서로 지도에서 보여주는 서비스"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "today-error" : "today-existing-help"}
              autoFocus
            />
            <div className={styles.fieldMeta}>
              <p id={error ? "today-error" : "today-existing-help"} role={error ? "alert" : undefined}>{error || "완성된 문장일 필요 없어요. 떠오른 상태 그대로 적어도 됩니다."}</p>
              <span>{ideaText.length}/500</span>
            </div>
            <button type="submit" className={styles.primaryButton} disabled={status === "loading"}>
              {status === "loading" ? <><RefreshCw className={styles.spin} aria-hidden /> 근거와 비교하는 중</> : <>아이디어 개선안 보기 <ArrowRight aria-hidden /></>}
            </button>
          </form>
        </section>
      ) : null}

      {stage === "guided" ? (
        <section className={styles.workspace} aria-labelledby="today-guided-title">
          <section className={styles.questionPanel}>
            <button type="button" className={styles.textButton} onClick={() => guidedStep === 0 ? setStage("start") : setGuidedStep((value) => value - 1)}><ArrowLeft size={17} /> {guidedStep === 0 ? "시작으로" : "이전 질문"}</button>
            <p className={styles.stepLabel}>{activeQuestion.kicker}</p>
            <h1 id="today-guided-title" tabIndex={-1}>{activeQuestion.title}</h1>
            <div className={styles.optionGrid} role="radiogroup" aria-label={activeQuestion.title}>
              {activeQuestion.options.map((option) => (
                <label className={styles.optionCard} key={option.value}>
                  <input
                    type="radio"
                    name={activeQuestion.key}
                    value={option.value}
                    checked={answers[activeQuestion.key] === option.value}
                    onChange={() => {
                      setAnswers((value) => ({ ...value, [activeQuestion.key]: option.value }));
                      markStarted("guided");
                    }}
                  />
                  <span><strong>{option.label}</strong><small>{option.description}</small></span>
                  <span className={styles.radioMark} aria-hidden />
                </label>
              ))}
            </div>
            <button type="button" className={styles.primaryButton} onClick={advanceGuided} disabled={status === "loading"}>
              {status === "loading" ? <><RefreshCw className={styles.spin} aria-hidden /> 근거와 비교하는 중</> : guidedStep === 2 ? <>아이디어 제안 보기 <WandSparkles aria-hidden /></> : <>다음 질문 <ArrowRight aria-hidden /></>}
            </button>
            {error ? <p id="today-error" className={styles.error} role="alert">{error}</p> : null}
          </section>
        </section>
      ) : null}

      {stage === "draft" && draft ? (
        <section className={styles.resultWorkspace} aria-labelledby="today-draft-title">
          <article className={styles.ideaSheet}>
            <div className={styles.sheetTopline}>
              <span>아이디어 초안</span>
              <button type="button" onClick={reset}><RefreshCw size={15} /> 다시 만들기</button>
            </div>
            <p className={styles.eyebrow}>근거에서 한 끗 바꾼 아이디어</p>
            <h1 id="today-draft-title" tabIndex={-1}>{draft.title}</h1>
            <p className={styles.ideaOneLiner}>{draft.oneLiner}</p>
            <dl className={styles.ideaFacts}>
              <div><dt>누가</dt><dd>{draft.customer}</dd></div>
              <div><dt>언제</dt><dd>{draft.problem}</dd></div>
              <div><dt>무엇을 받나</dt><dd>{draft.promise}</dd></div>
            </dl>
            <section className={styles.mechanism} aria-labelledby="today-mechanism">
              <h2 id="today-mechanism">작동 구조</h2>
              <div><span>입력</span><p>{draft.mechanism.input}</p></div>
              <ArrowRight aria-hidden />
              <div><span>처리</span><p>{draft.mechanism.process}</p></div>
              <ArrowRight aria-hidden />
              <div><span>결과</span><p>{draft.mechanism.output}</p></div>
            </section>
            <aside className={styles.evidence}>
              <div><p>참고한 실제 매출 원본</p><h2>{draft.evidence.sourceName}</h2></div>
              <a href={draft.evidence.sourceUrl} target="_blank" rel="noreferrer">원본 보기 <ArrowUpRight size={16} /></a>
              <p>{draft.evidence.statement}</p>
              <p><strong>바꾼 점</strong> {draft.adaptation}</p>
              <small>{draft.evidence.snapshotNotice}</small>
            </aside>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setError("");
                setStage("apply");
              }}
            >
              이 아이디어로 제작 신청 <ArrowRight aria-hidden />
            </button>
          </article>
        </section>
      ) : null}

      {stage === "apply" && draft ? (
        <section className={styles.applyWorkspace} aria-labelledby="today-apply-title">
          <form className={styles.applyPanel} onSubmit={apply} data-clarity-mask="true" noValidate>
            <button type="button" className={styles.textButton} onClick={() => setStage("draft")}><ArrowLeft size={17} /> 아이디어로</button>
            <p className={styles.stepLabel}>마지막 단계 · 제작 신청</p>
            <h1 id="today-apply-title" tabIndex={-1}>내일 받을 결과를<br />정하세요.</h1>
            <div className={styles.deliveryCards}>
              <div><span>01</span><strong>광고 이미지</strong><small>정사각형 1장</small></div>
              <div><span>02</span><strong>가짜문 랜딩</strong><small>신청 행동 1개</small></div>
              <div><span>03</span><strong>측정 기준</strong><small>계속·수정·중단</small></div>
            </div>
            <fieldset className={styles.compactFieldset}>
              <legend>어디에서 보여줄까요?</legend>
              {channelOptions.map((option) => (
                <label key={option.value}>
                  <input type="radio" name="channel" value={option.value} checked={channel === option.value} onChange={() => setChannel(option.value)} />
                  <span><strong>{option.label}</strong><small>{option.description}</small></span>
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.compactFieldset}>
              <legend>어떤 행동을 성공으로 볼까요?</legend>
              {signalOptions.map((option) => (
                <label key={option.value}>
                  <input type="radio" name="signal" value={option.value} checked={signal === option.value} onChange={() => setSignal(option.value)} />
                  <span><strong>{option.label}</strong><small>{option.description}</small></span>
                </label>
              ))}
            </fieldset>
            <label className={styles.emailField} htmlFor="today-email">
              <span>결과 받을 이메일</span>
              <input
                id="today-email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "today-apply-error" : "today-apply-help"}
              />
            </label>
            <p id="today-apply-help" className={styles.demoNotice}>신청 정보는 서버에 보관하고, 제작이 끝나면 이 주소로 전용 결과 링크를 보내드려요.</p>
            {error ? <p id="today-apply-error" className={styles.error} role="alert">{error}</p> : null}
            <button type="submit" className={styles.primaryButton} disabled={status === "loading"}>
              {status === "loading" ? <><RefreshCw className={styles.spin} aria-hidden /> 신청 저장 중</> : <>24시간 제작 신청하기 <ArrowRight aria-hidden /></>}
            </button>
          </form>
        </section>
      ) : null}

      {stage === "queued" && job ? (
        <section className={styles.statusPage} aria-labelledby="today-queued-title">
          <div className={styles.statusIcon}><Clock3 aria-hidden /></div>
          <p className={styles.eyebrow}>제작 번호 · {job.id.slice(0, 8).toUpperCase()}</p>
          <h1 id="today-queued-title" tabIndex={-1}>
            {job.status === "failed" ? "전달 중 문제가 생겼어요." : "제작을 접수했어요."}
          </h1>
          <p className={styles.lead}>
            {job.status === "failed"
              ? "자동 재시도가 끝났지만 이메일을 보내지 못했어요. 이 페이지를 보관한 뒤 다시 신청해주세요."
              : `${formatReadyAt(job.readyAt)}까지 광고 이미지, 가짜문 랜딩, 측정 기준을 만들고 이메일로 알려드릴게요.`}
          </p>
          <ol className={styles.statusSteps}>
            <li className={styles.done}><Check aria-hidden /><span><strong>신청 정보 저장</strong><small>서버에 안전하게 접수했어요.</small></span></li>
            <li className={job.status === "failed" ? styles.failed : styles.active}>
              <RefreshCw aria-hidden />
              <span>
                <strong>광고·랜딩 제작</strong>
                <small>
                  {job.status === "queued" ? "작업 큐에서 순서를 기다리고 있어요."
                    : job.status === "processing" ? "지금 결과를 만들고 있어요."
                      : job.status === "delivery_failed" ? "이메일 전달을 다시 시도하고 있어요."
                        : "자동 재시도가 끝났어요."}
                </small>
              </span>
            </li>
            <li><Clock3 aria-hidden /><span><strong>전용 링크 이메일 전달</strong><small>{formatReadyAt(job.readyAt)} 예정</small></span></li>
          </ol>
          <div className={styles.statusMeta}><span>결과 받을 주소</span><strong>{job.maskedEmail}</strong></div>
          <p className={styles.demoNotice}>{job.notice}</p>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.statusActions}>
            <Link href="/">다른 앱 보기</Link>
            <Link
              href="/reserve/today"
              onClick={() => trackTodayEvent("today_reservation_clicked", { placement: "queued" })}
            >
              다음 제작 자리 예약
            </Link>
            <button type="button" onClick={() => { void cancel(); }} disabled={status === "loading"}>신청 취소</button>
          </div>
        </section>
      ) : null}

      {stage === "ready" && job?.artifacts ? (
        <section className={styles.readyPage} aria-labelledby="today-ready-title">
          <header className={styles.readyHeader}>
            <div>
              <p className={styles.eyebrow}>1일 제작 결과</p>
              <h1 id="today-ready-title" tabIndex={-1}>테스트할 준비가 끝났어요.</h1>
              <p>{job.idea.title}의 가짜문 광고와 랜딩을 같은 약속으로 맞췄습니다.</p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={reset}><RefreshCw size={17} /> 새 아이디어</button>
          </header>
          <div className={styles.artifactGrid}>
            <article className={styles.artifactCard}>
              <div className={styles.artifactHeading}><span>01 · 광고 이미지</span><a href={adUrl} download={`today-${job.id}-ad.svg`}><Download size={16} /> SVG 받기</a></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.adImage} src={adUrl} alt={`${job.artifacts.ad.headline} 광고 시안`} />
              <p><strong>시각 방향</strong> {job.artifacts.ad.visualLabel}</p>
            </article>
            <article className={styles.artifactCard}>
              <div className={styles.artifactHeading}><span>02 · 가짜문 랜딩</span><Link href={`/today/preview/${job.id}#token=${encodeURIComponent(locator?.token ?? "")}`}>전체 화면 <ArrowUpRight size={16} /></Link></div>
              <div className={styles.landingPreview}>
                <p>{job.artifacts.landing.eyebrow}</p>
                <h2>{job.artifacts.landing.headline}</h2>
                <span>{job.artifacts.landing.body}</span>
                <ul>{job.artifacts.landing.proof.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul>
                <span className={styles.previewCta}>{job.artifacts.landing.cta}</span>
              </div>
            </article>
            <article className={`${styles.artifactCard} ${styles.planCard}`}>
              <div className={styles.artifactHeading}><span>03 · 측정 기준</span></div>
              <dl>
                <div><dt>보여줄 곳</dt><dd>{job.artifacts.testPlan.channel}</dd></div>
                <div><dt>성공 행동</dt><dd>{job.artifacts.testPlan.signal}</dd></div>
                <div><dt>목표</dt><dd>{job.artifacts.testPlan.target}명 중 {job.artifacts.testPlan.pass}명</dd></div>
              </dl>
              <p>{job.artifacts.testPlan.rule}</p>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
