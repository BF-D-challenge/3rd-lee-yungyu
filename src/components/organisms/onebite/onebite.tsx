"use client";

import {
  Camera,
  Check,
  CheckCircle2,
  Circle,
  History,
  ImagePlus,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ONEBITE_MAX_IMAGE_BYTES,
  ONEBITE_SUPPORTED_IMAGE_TYPES,
  onebiteRejectedResponseSchema,
  onebiteSuccessResponseSchema,
  type OnebiteRejectedResponse,
  type OnebiteSuccessResponse,
} from "@/app/api/onebite/analyze/contract";
import {
  trackMvpDeepAction,
  trackMvpLandingViewed,
  trackMvpPrimaryCta,
} from "@/lib/mvp-experiment-analytics";
import {
  loadOnebiteExecutionHistory,
  loadOnebiteSavedCommit,
  saveOnebiteExecutionRecord,
  saveOnebiteSavedCommit,
  type OnebiteExecutionRecord,
  type OnebiteExecutionStatus,
  type OnebiteSavedCommit,
} from "@/lib/onebite-revisit";
import { track } from "@/lib/track";
import styles from "./onebite.module.css";

type RequestState = "idle" | "loading" | "success" | "rejected" | "error";
const supportedTypes = new Set<string>(ONEBITE_SUPPORTED_IMAGE_TYPES);

const visibleGroupCopy: Record<
  OnebiteSuccessResponse["analysis"]["visibleGroups"][number],
  string
> = {
  starch: "밥·면·빵류",
  protein: "단백질 식품군",
  vegetable: "채소류",
  drink: "음료",
  dessert: "간식·디저트",
  unknown: "구분 어려운 음식",
};

const confidenceCopy: Record<
  OnebiteSuccessResponse["analysis"]["confidence"],
  string
> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

const errorCopy: Record<string, string> = {
  image_required: "분석할 음식 사진을 한 장 골라주세요.",
  unsupported_image_type: "JPG, PNG, WebP 사진만 올릴 수 있어요.",
  image_too_large: "사진 크기는 5MB 이하여야 해요.",
  image_decode_failed: "사진을 열 수 없어요. 다른 JPG, PNG, WebP 사진을 골라주세요.",
  gemini_not_configured: "사진 분석 설정이 아직 연결되지 않았어요.",
  gemini_timeout: "사진 분석 시간이 길어졌어요. 잠시 후 다시 시도해주세요.",
  gemini_failed: "지금은 사진을 분석하지 못했어요. 잠시 후 다시 시도해주세요.",
  history_save_failed: "실행 기록을 이 기기에 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.",
};

const rejectionCopy: Record<OnebiteRejectedResponse["error"], string> = {
  not_food: "한 끼 음식이 보이는 사진인지 확인하지 못했어요.",
  uncertain: "사진에서 음식 그룹을 충분히 구분하지 못했어요.",
  medical_or_ed:
    "이 사진은 일반 식사 행동으로 안내하기 어려워요. 질환·임신·알레르기·섭식 관련 식단은 전문가와 확인해주세요.",
};

function errorCode(body: unknown): string {
  if (
    typeof body === "object"
    && body !== null
    && "error" in body
    && typeof body.error === "string"
  ) {
    return body.error;
  }
  return "gemini_failed";
}

function recordDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "최근";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function trackPrimaryCta(placement: "result") {
  track("onebite_primary_cta_clicked", {
    event_type: "onebite_primary_cta_clicked",
    funnel_stage: "primary_cta",
    product_id: "onebite",
    product_slug: "onebite",
    cta_placement: placement,
    destination: "/reserve/onebite",
  }, { meta: false });
  trackMvpPrimaryCta("onebite");
}

export function Onebite() {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputStartedRef = useRef(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [result, setResult] = useState<OnebiteSuccessResponse | null>(null);
  const [rejection, setRejection] = useState<OnebiteRejectedResponse | null>(null);
  const [message, setMessage] = useState("");
  const [savedCommit, setSavedCommit] = useState<OnebiteSavedCommit | null>(null);
  const [executionStatus, setExecutionStatus] =
    useState<OnebiteExecutionStatus | null>(null);
  const [history, setHistory] = useState<OnebiteExecutionRecord[]>([]);
  const [latestExecution, setLatestExecution] =
    useState<OnebiteExecutionRecord | null>(null);

  useEffect(() => {
    const startNew = new URLSearchParams(window.location.search).get("new") === "1";
    setSavedCommit(startNew ? null : loadOnebiteSavedCommit());
    setHistory(loadOnebiteExecutionHistory());
    if (startNew) window.history.replaceState(null, "", "/onebite");
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    track("onebite_landing_viewed", {
      event_type: "onebite_landing_viewed",
      funnel_stage: "landing",
      product_id: "onebite",
      product_slug: "onebite",
    }, { meta: false });
    trackMvpLandingViewed("onebite");
  }, []);

  const resetRequest = () => {
    setResult(null);
    setRejection(null);
    setMessage("");
    setRequestState("idle");
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPreviewUrl(null);
    setExecutionStatus(null);
    setLatestExecution(null);
    resetRequest();
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPhoto = event.target.files?.[0];
    if (!nextPhoto) return;

    if (!supportedTypes.has(nextPhoto.type)) {
      clearPhoto();
      setMessage(errorCopy.unsupported_image_type);
      setRequestState("error");
      return;
    }
    if (nextPhoto.size > ONEBITE_MAX_IMAGE_BYTES) {
      clearPhoto();
      setMessage(errorCopy.image_too_large);
      setRequestState("error");
      return;
    }

    setPhoto(nextPhoto);
    if (!inputStartedRef.current) {
      inputStartedRef.current = true;
      track("onebite_input_started", {
        event_type: "onebite_input_started",
        funnel_stage: "input",
        product_id: "onebite",
        product_slug: "onebite",
      }, { meta: false });
      trackMvpPrimaryCta("onebite");
    }
    setPreviewUrl(URL.createObjectURL(nextPhoto));
    resetRequest();
  };

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !photo
      || requestState === "loading"
      || (savedCommit && !executionStatus)
    ) return;

    setResult(null);
    setRejection(null);
    setMessage("");
    setRequestState("loading");

    if (savedCommit && executionStatus) {
      const now = new Date().toISOString();
      const record: OnebiteExecutionRecord = {
        id: savedCommit.savedAt,
        actionCode: savedCommit.actionCode,
        actionLine: savedCommit.actionLine,
        status: executionStatus,
        recordedAt: now,
        nextMealSubmittedAt: now,
      };
      try {
        const saved = saveOnebiteExecutionRecord(record);
        setHistory(saved.history);
        setLatestExecution(record);
        if (saved.inserted) {
          track("onebite_prior_action_recorded", {
            event_type: "onebite_prior_action_recorded",
            funnel_stage: "return_action",
            product_id: "onebite",
            product_slug: "onebite",
            execution_status: executionStatus,
          });
        }
      } catch {
        setMessage(errorCopy.history_save_failed);
        setRequestState("error");
        return;
      }
    }

    const formData = new FormData();
    formData.set("photo", photo);

    try {
      const response = await fetch("/api/onebite/analyze", {
        method: "POST",
        body: formData,
      });
      const body = await response.json() as unknown;

      if (response.status === 422) {
        const parsedRejection = onebiteRejectedResponseSchema.safeParse(body);
        if (!parsedRejection.success) throw new Error(errorCode(body));
        setRejection(parsedRejection.data);
        setRequestState("rejected");
        return;
      }
      if (!response.ok) throw new Error(errorCode(body));

      const parsedResult = onebiteSuccessResponseSchema.safeParse(body);
      if (!parsedResult.success) throw new Error("gemini_failed");
      setResult(parsedResult.data);
      setRequestState("success");
      track("onebite_result_viewed", {
        event_type: "onebite_result_viewed",
        funnel_stage: "result",
        product_id: "onebite",
        product_slug: "onebite",
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "gemini_failed";
      setMessage(errorCopy[code] ?? errorCopy.gemini_failed);
      setRequestState("error");
    }
  };

  const isRevisit = Boolean(savedCommit);
  const submitDisabled = !photo
    || requestState === "loading"
    || (isRevisit && !executionStatus);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>오늘 해볼까</Link>
        <span className={styles.badge}>한입코치</span>
      </header>

      <section className={styles.content}>
        <h1>
          {isRevisit
            ? <>다음 끼니를<br />보여주세요.</>
            : <>먹은 건 됐어요.<br />다음 한 끼를 잡아요.</>}
        </h1>
        <p className={styles.lead}>
          {isRevisit
            ? "사진을 고르면 지난 행동을 해봤는지 물어볼게요."
            : "사진에서 보이는 음식만 확인하고, 다음 한 끼에 할 행동 하나를 분명하게 말해요."}
        </p>

        {!isRevisit && requestState === "idle" && !photo ? (
          <figure className={styles.coachIntro}>
            <Image
              src="/images/onebite/coach-fridge.webp"
              alt="냉장고 안의 음식을 사이에 두고 정면을 바라보는 남자 헬스 트레이너"
              fill
              priority
              sizes="(max-width: 640px) calc(100vw - 2.5rem), 40rem"
            />
            <figcaption>
              <strong>“사진만 올려요.”</strong>
              <span>다음 행동은 제가 정할게요.</span>
            </figcaption>
          </figure>
        ) : null}

        {savedCommit && requestState !== "success" ? (
          <aside className={styles.resumeCard} aria-label="지난번 저장한 다음 끼니 행동">
            <span className={styles.stepNumber}>1</span>
            <div>
              <span>지난번에 정한 행동</span>
              <strong>{savedCommit.actionLine}</strong>
              <p>사진을 고른 뒤, 해봤는지 직접 기록해요.</p>
            </div>
          </aside>
        ) : null}

        {requestState !== "success" ? (
          <form
            className={styles.form}
            onSubmit={analyze}
            aria-busy={requestState === "loading"}
            data-clarity-mask="true"
          >
            {isRevisit ? <div className={styles.formHeading}>
              {isRevisit ? <span className={styles.stepNumber}>2</span> : null}
              <div>
                <strong>{isRevisit ? "다음 끼니 사진" : "음식 사진"}</strong>
                <p>{isRevisit ? "사진 파일은 저장하지 않아요." : "한 끼 전체가 보이면 더 정확해요."}</p>
              </div>
            </div> : null}

            <label
              className={styles.upload}
              htmlFor="onebite-photo"
              data-has-photo={photo ? "true" : "false"}
              data-loading={requestState === "loading" ? "true" : "false"}
            >
              {previewUrl ? (
                <>
                  <Image
                    className={styles.preview}
                    src={previewUrl}
                    alt="분석할 음식 사진 미리보기"
                    width={720}
                    height={540}
                    unoptimized
                  />
                  <span className={styles.replacePhoto}>
                    <RefreshCcw size={16} aria-hidden />
                    사진 바꾸기
                  </span>
                </>
              ) : (
                <span className={styles.uploadPrompt}>
                  <ImagePlus size={30} aria-hidden />
                  <strong>음식 사진 한 장 고르기</strong>
                  <small>JPG, PNG, WebP · 최대 5MB</small>
                </span>
              )}
              <input
                ref={inputRef}
                id="onebite-photo"
                type="file"
                accept={ONEBITE_SUPPORTED_IMAGE_TYPES.join(",")}
                onChange={selectPhoto}
                disabled={requestState === "loading"}
              />
            </label>

            {savedCommit && photo ? (
              <fieldset className={styles.executionCheck}>
                <legend>
                  <span className={styles.stepNumber}>3</span>
                  <span>
                    <strong>지난 행동을 해봤나요?</strong>
                    <small>평가하지 않아요. 사실대로 골라주세요.</small>
                  </span>
                </legend>
                <div className={styles.executionOptions}>
                  <button
                    type="button"
                    aria-pressed={executionStatus === "done"}
                    onClick={() => setExecutionStatus("done")}
                  >
                    {executionStatus === "done"
                      ? <CheckCircle2 size={20} aria-hidden />
                      : <Circle size={20} aria-hidden />}
                    해봤어요
                  </button>
                  <button
                    type="button"
                    aria-pressed={executionStatus === "not_done"}
                    onClick={() => setExecutionStatus("not_done")}
                  >
                    {executionStatus === "not_done"
                      ? <CheckCircle2 size={20} aria-hidden />
                      : <Circle size={20} aria-hidden />}
                    아직 못 했어요
                  </button>
                </div>
              </fieldset>
            ) : null}

            {message ? <p className={styles.error} role="alert">{message}</p> : null}

            {requestState === "rejected" && rejection ? (
              <section className={styles.rejection} role="status">
                <Camera size={22} aria-hidden />
                <div>
                  <h2>{rejectionCopy[rejection.error]}</h2>
                  <p>{rejection.actionLine}</p>
                </div>
              </section>
            ) : null}

            {photo ? (
              <>
                <button
                  className={styles.primaryButton}
                  type="submit"
                  disabled={submitDisabled}
                  aria-describedby={submitDisabled ? "onebite-submit-help" : undefined}
                >
                  {requestState === "loading"
                    ? (
                      <>
                        <LoaderCircle className={styles.spinner} size={18} aria-hidden />
                        사진을 확인하는 중…
                      </>
                    )
                    : isRevisit
                      ? "기록 저장하고 새 코칭 보기"
                      : "다음 한 끼 행동 보기"}
                </button>
                {submitDisabled && requestState !== "loading" ? (
                  <p id="onebite-submit-help" className={styles.helper}>
                    지난 행동을 해봤는지 하나 골라주세요.
                  </p>
                ) : null}
                <p className={styles.privacy}>
                  <ShieldCheck size={16} aria-hidden />
                  사진은 저장하지 않고 분석에 한 번만 사용해요.
                </p>
              </>
            ) : null}
          </form>
        ) : null}

        {requestState === "success" && result && previewUrl ? (
          <Result
            result={result}
            previewUrl={previewUrl}
            executionRecord={latestExecution}
            onReset={clearPhoto}
            onCommitted={setSavedCommit}
          />
        ) : null}

        {isRevisit && history.length > 0 && requestState !== "success" ? (
          <ExecutionHistory history={history.slice(0, 3)} />
        ) : null}

        <p className={styles.boundary}>
          사진에서 보이는 음식만 확인해요. 칼로리·중량·질환을 판단하거나 의료·임상 영양 조언을 하지 않습니다.
        </p>
      </section>
    </main>
  );
}

function ExecutionHistory({ history }: { history: OnebiteExecutionRecord[] }) {
  return (
    <section className={styles.historySection} aria-labelledby="onebite-history-title">
      <div className={styles.historyHeading}>
        <History size={18} aria-hidden />
        <h2 id="onebite-history-title">최근 실행 기록</h2>
      </div>
      <ul className={styles.historyList}>
        {history.map((record) => (
          <li key={record.id}>
            <div>
              <strong>{record.actionLine}</strong>
              <time dateTime={record.recordedAt}>{recordDate(record.recordedAt)}</time>
            </div>
            <span data-status={record.status}>
              {record.status === "done" ? "해봤어요" : "아직 못 했어요"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Result({
  result,
  previewUrl,
  executionRecord,
  onReset,
  onCommitted,
}: {
  result: OnebiteSuccessResponse;
  previewUrl: string;
  executionRecord: OnebiteExecutionRecord | null;
  onReset: () => void;
  onCommitted: (commit: OnebiteSavedCommit) => void;
}) {
  const [committed, setCommitted] = useState(false);
  const [commitError, setCommitError] = useState(false);

  useEffect(() => {
    if (executionRecord) {
      setCommitted(false);
      return;
    }
    setCommitted(loadOnebiteSavedCommit()?.actionCode === result.analysis.actionCode);
  }, [executionRecord, result.analysis.actionCode]);

  const commitAction = () => {
    if (committed) return;
    try {
      const savedCommit: OnebiteSavedCommit = {
        actionCode: result.analysis.actionCode,
        actionLine: result.actionLine,
        savedAt: new Date().toISOString(),
      };
      saveOnebiteSavedCommit(savedCommit);
      onCommitted(savedCommit);
      setCommitted(true);
      setCommitError(false);
      trackMvpDeepAction("onebite");
    } catch {
      setCommitError(true);
    }
  };

  return (
    <section
      className={styles.result}
      aria-labelledby="onebite-result-title"
      aria-live="polite"
      data-clarity-mask="true"
    >
      {executionRecord ? (
        <div className={styles.recordReceipt} role="status">
          <CheckCircle2 size={20} aria-hidden />
          <div>
            <strong>지난 행동을 기록했어요</strong>
            <span>
              {executionRecord.status === "done" ? "해봤어요" : "아직 못 했어요"}
            </span>
          </div>
        </div>
      ) : null}

      <div className={styles.resultIntro}>
        <p>다음 한 끼에 해볼 일</p>
        <h2 id="onebite-result-title">{result.actionLine}</h2>
      </div>

      <div className={styles.resultEvidence}>
        <div className={styles.resultPhotoFrame}>
          <Image
            className={styles.resultPhoto}
            src={previewUrl}
            alt="확인한 음식 사진"
            width={160}
            height={160}
            unoptimized
          />
          <span className={styles.resultIcon}><Check size={18} aria-hidden /></span>
        </div>
        <div>
          <h3 className={styles.resultLabel}>사진에서 보인 음식</h3>
          <div className={styles.groupList}>
            {result.analysis.visibleGroups.map((group) => (
              <span key={group}>{visibleGroupCopy[group]}</span>
            ))}
          </div>
          <p className={styles.confidence}>
            음식이 보인 정도 {confidenceCopy[result.analysis.confidence]}
          </p>
        </div>
      </div>

      <p className={styles.resultNote}>
        사진에서 보인 음식에 맞춰 미리 정한 안전한 행동 중 하나를 골랐어요.
      </p>
      {committed ? (
        <p
          className={styles.savedStatus}
          role="status"
          aria-label="이 기기에 다음 끼니 행동을 저장했어요"
        >
          <Check size={18} aria-hidden />
          이 기기에 다음 끼니 행동을 저장했어요
        </p>
      ) : (
        <button className={styles.primaryButton} type="button" onClick={commitAction}>
          다음 끼니 행동으로 저장하기
        </button>
      )}
      {commitError ? (
        <p className={styles.error} role="alert">
          이 기기에 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.
        </p>
      ) : null}
      <button className={styles.secondaryButton} type="button" onClick={onReset}>
        다른 사진 분석하기
      </button>
      <Link
        className={styles.reserveButton}
        href="/reserve/onebite"
        onClick={() => trackPrimaryCta("result")}
      >
        한입코치 예약하기
      </Link>
    </section>
  );
}
