"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Camera,
  Check,
  ExternalLink,
  Link2,
  LoaderCircle,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  matpickDmResponseSchema,
  normalizeInstagramReelUrl,
  type MatpickDmResponse,
} from "@/lib/matpick-dm-contract";
import {
  loadSavedMatpickPlaceIds,
  saveMatpickPlace,
  saveMatpickDmPlace,
} from "@/lib/storage";
import { track } from "@/lib/track";
import styles from "./matpick-dm.module.css";

type RequestState = "idle" | "loading" | "candidates" | "saved" | "error";

const samples = [
  {
    label: "산장장작구이 릴스",
    url: "https://www.instagram.com/reel/DbTBhcZNY1b/",
  },
  {
    label: "치솟 역삼본점 릴스",
    url: "https://www.instagram.com/reel/DMSqZGLSOA9/",
  },
  {
    label: "돝고기506 릴스",
    url: "https://www.instagram.com/reel/C3kGesnvLr2/",
  },
] as const;

export function MatpickDm() {
  const [url, setUrl] = useState<string>(samples[0].url);
  const [state, setState] = useState<RequestState>("idle");
  const [result, setResult] = useState<MatpickDmResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [duplicate, setDuplicate] = useState(false);
  const [message, setMessage] = useState("");
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setSavedCount(loadSavedMatpickPlaceIds().length);
  }, []);

  useEffect(() => {
    if (state === "candidates" || state === "saved") {
      resultHeadingRef.current?.focus();
    }
    if (state === "candidates") {
      track("tastepin_result_viewed", {
        event_type: "tastepin_result_viewed",
        funnel_stage: "result",
        product_id: "tastepin",
        product_slug: "tastepin",
        product_path: "/matpick",
        experiment_id: "tastepin",
      });
    }
  }, [state]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUrl = normalizeInstagramReelUrl(url);
    if (!normalizedUrl) {
      setState("error");
      setMessage("instagram.com/reel/로 시작하는 공개 릴스 링크를 넣어주세요.");
      return;
    }

    setState("loading");
    setMessage("");
    setResult(null);
    setSelectedId("");
    setDuplicate(false);

    try {
      const response = await fetch("/api/matpick/dm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reelUrl: normalizedUrl }),
      });
      const body = await response.json();
      const parsed = matpickDmResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("invalid_response");

      setResult(parsed.data);
      setSelectedId(parsed.data.candidates[0]?.id ?? "");
      setState("candidates");
    } catch {
      setState("error");
      setMessage("링크를 처리하지 못했어요. 공개 릴스인지 확인하고 다시 시도해주세요.");
    }
  };

  const confirm = () => {
    const candidate = result?.candidates.find((item) => item.id === selectedId);
    if (!result || !candidate) {
      setMessage("저장할 장소를 하나 골라주세요.");
      return;
    }

    const saved = saveMatpickDmPlace(result, candidate);
    saveMatpickPlace(candidate);
    setDuplicate(saved.duplicate);
    setSavedCount(loadSavedMatpickPlaceIds().length);
    setState("saved");
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setSelectedId("");
    setDuplicate(false);
    setMessage("");
  };

  const selectedCandidate = result?.candidates.find((item) => item.id === selectedId) ?? null;

  return (
    <main className={styles.page}>
      <header className={styles.appBar}>
        <Link href="/matpick" aria-label="맛핀 홈으로 돌아가기">
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <div>
          <strong>맛핀</strong>
          <span>릴스 저장</span>
        </div>
        <Link className={styles.savedLink} href="/matpick/map" aria-label={`내 저장함 ${savedCount}곳 보기`}>
          <Bookmark aria-hidden="true" size={18} />
          <span>{savedCount}</span>
        </Link>
      </header>

      <section className={styles.content}>
        <ol className={styles.progress} aria-label="릴스 저장 진행 단계">
          {["링크 확인", "장소 선택", "저장"].map((label, index) => {
            const currentStep = state === "candidates" ? 1 : state === "saved" ? 2 : 0;
            return (
              <li
                aria-current={currentStep === index ? "step" : undefined}
                data-complete={currentStep > index}
                key={label}
              >
                <span>{currentStep > index ? <Check aria-hidden="true" size={13} /> : index + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>

        {state === "idle" || state === "loading" || state === "error" ? (
          <>
            <div className={styles.intro}>
              <p>INSTAGRAM 릴스</p>
              <h1 id="matpick-dm-title">
                릴스 링크를
                <br />붙여넣으세요.
              </h1>
              <p className={styles.lead}>
                공개 릴스에서 장소 후보를 찾고, 맞는 식당을 고른 뒤에만 저장해요.
              </p>
            </div>

            <form className={styles.form} onSubmit={submit} aria-labelledby="matpick-dm-title">
              <label htmlFor="matpick-reel-url">Instagram 릴스 공개 링크</label>
              <div className={styles.inputShell} data-invalid={state === "error"}>
                <Camera aria-hidden="true" size={20} />
                <input
                  id="matpick-reel-url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setMessage("");
                    if (state === "error") setState("idle");
                  }}
                  placeholder="https://www.instagram.com/reel/..."
                  inputMode="url"
                  autoComplete="url"
                  aria-invalid={state === "error"}
                  aria-describedby="matpick-dm-help"
                  disabled={state === "loading"}
                />
              </div>

              <div className={styles.samples} aria-label="바로 확인할 수 있는 공개 릴스">
                {samples.map((sample) => (
                  <button
                    key={sample.url}
                    type="button"
                    aria-pressed={url === sample.url}
                    onClick={() => {
                      setUrl(sample.url);
                      setMessage("");
                      setState("idle");
                    }}
                    disabled={state === "loading"}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <p
                id="matpick-dm-help"
                className={state === "error" ? styles.error : styles.helper}
                role={state === "error" ? "alert" : undefined}
              >
                {message || "실제 DM을 읽지 않으며, 입력한 공개 링크만 Mock API로 처리해요."}
              </p>

              <button className={styles.primaryButton} type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  <>
                    <LoaderCircle className={styles.spin} aria-hidden="true" size={20} />
                    받은 링크 확인 중…
                  </>
                ) : (
                  <>
                    이 릴스에서 장소 찾기
                    <ArrowRight aria-hidden="true" size={19} />
                  </>
                )}
              </button>
            </form>

            <aside className={styles.notice}>
              <ShieldCheck aria-hidden="true" size={19} />
              <p>
                <strong>회원가입 없이 체험해요.</strong> 실제 Instagram 계정이나 메시지에는
                접근하지 않고, 저장 결과는 현재 브라우저에만 남아요.
              </p>
            </aside>
          </>
        ) : null}

        {state === "candidates" && result ? (
          <section className={styles.candidateSection} aria-live="polite">
            <div className={styles.resultEyebrow}>
              <span><Check aria-hidden="true" size={18} /></span>
              <p>공개 릴스를 받았어요</p>
            </div>
            <h1 ref={resultHeadingRef} tabIndex={-1}>
              영상에 나온 장소가 맞나요?
            </h1>
            <p className={styles.resultLead}>
              자동 추출은 틀릴 수 있어요. 영상에 나온 곳과 같은 장소를 직접 골라주세요.
            </p>

            <article className={styles.reelReceipt}>
              <Camera aria-hidden="true" size={21} />
              <div>
                <strong>{result.reel.title}</strong>
                <span>{result.reel.creator}</span>
              </div>
              <a href={result.reel.url} target="_blank" rel="noreferrer" aria-label="Instagram에서 받은 릴스 원본 보기">
                원본 <ExternalLink aria-hidden="true" size={14} />
              </a>
            </article>

            <fieldset className={styles.candidateList}>
              <legend>저장할 장소</legend>
              {result.candidates.map((candidate) => (
                <label key={candidate.id} className={styles.candidateCard} data-selected={selectedId === candidate.id}>
                  <input
                    type="radio"
                    name="matpick-place"
                    value={candidate.id}
                    checked={selectedId === candidate.id}
                    onChange={() => {
                      setSelectedId(candidate.id);
                      setMessage("");
                    }}
                  />
                  <span className={styles.radioVisual} aria-hidden="true" />
                  <span className={styles.candidateBody}>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.area} · {candidate.category}</span>
                    <small>{candidate.address}</small>
                    <em>{candidate.matchReason}</em>
                  </span>
                  <span className={styles.confidence}>{Math.round(candidate.confidence * 100)}%</span>
                </label>
              ))}
            </fieldset>

            {message ? <p className={styles.error} role="alert">{message}</p> : null}

            <button className={styles.primaryButton} type="button" onClick={confirm}>
              선택한 장소 저장
              <Bookmark aria-hidden="true" size={19} />
            </button>
            <button className={styles.textButton} type="button" onClick={reset}>
              <RotateCcw aria-hidden="true" size={17} />
              다른 릴스 확인
            </button>
          </section>
        ) : null}

        {state === "saved" && result && selectedCandidate ? (
          <section className={styles.success} aria-live="polite">
            <span className={styles.successIcon}><Check aria-hidden="true" size={28} /></span>
            <p>{duplicate ? "이미 저장한 장소예요" : "내 저장함에 추가했어요"}</p>
            <h1 ref={resultHeadingRef} tabIndex={-1}>{selectedCandidate.name}</h1>
            <span className={styles.successMeta}>
              {selectedCandidate.area} · {selectedCandidate.category}
            </span>

            <article className={styles.savedCard}>
              <span><MapPin aria-hidden="true" size={22} fill="currentColor" /></span>
              <div>
                <strong>{selectedCandidate.name}</strong>
                <p>{selectedCandidate.address}</p>
                <small>원본 릴스와 함께 이 기기에 저장됨</small>
              </div>
            </article>

            <Link className={styles.primaryButton} href="/matpick/map?saved=1">
              내 저장함에서 보기
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <a
              className={styles.secondaryButton}
              href={result.reel.url}
              target="_blank"
              rel="noreferrer"
            >
              원본 릴스 다시 보기
              <ExternalLink aria-hidden="true" size={17} />
            </a>
            <button className={styles.textButton} type="button" onClick={reset}>
              <Link2 aria-hidden="true" size={17} />
              다른 릴스 저장
            </button>
          </section>
        ) : null}
      </section>
    </main>
  );
}
