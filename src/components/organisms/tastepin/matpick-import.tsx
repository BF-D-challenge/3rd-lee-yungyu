"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ExternalLink,
  Link2,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import {
  normalizeYouTubeShortsUrl,
  tastepinResolveResponseSchema,
  type TastepinResolveResponse,
} from "@/lib/tastepin-contract";
import {
  loadImportedMatpickPlaces,
  loadTastepinSaves,
  saveMatpickPlace,
  saveTastepinResult,
} from "@/lib/storage";
import { track } from "@/lib/track";
import styles from "./matpick-import.module.css";

type RequestState = "idle" | "loading" | "review" | "success" | "error";

const googleMapsSearch = (name: string, address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;

export function MatpickImport() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [result, setResult] = useState<TastepinResolveResponse | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [message, setMessage] = useState("");
  const inputStartedRef = useRef(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setSavedCount(loadTastepinSaves().length);
    trackMvpLandingViewed("tastepin");
  }, []);

  useEffect(() => {
    if (!result) return;
    trackMvpResultViewed("tastepin");
    resultHeadingRef.current?.focus();
  }, [result]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeYouTubeShortsUrl(url.trim());
    if (!normalized) {
      setState("error");
      setMessage("youtube.com/shorts/로 시작하는 공개 Shorts 링크를 넣어주세요.");
      return;
    }

    setState("loading");
    setMessage("");
    setResult(null);
    track("tastepin_source_submitted", {
      product_key: "tastepin",
      platform: "youtube_shorts",
    });

    try {
      const response = await fetch("/api/tastepin/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const parsed = tastepinResolveResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("invalid_response");

      setResult(parsed.data);
      setState("review");
    } catch {
      setState("error");
      setMessage("이 영상에서 장소를 찾지 못했어요. 공개 Shorts인지 확인하고 다시 시도해주세요.");
    }
  };

  const reset = () => {
    setUrl("");
    setState("idle");
    setResult(null);
    setSavedAt(null);
    setMessage("");
  };

  const candidate = result?.mapCandidates[0] ?? null;
  const place = result?.extraction.places[0] ?? null;

  const confirmSave = () => {
    const normalized = normalizeYouTubeShortsUrl(url.trim());
    if (!normalized || !result) return;
    const saved = saveTastepinResult(normalized, result);
    loadImportedMatpickPlaces()
      .filter((importedPlace) => importedPlace.source.url === normalized)
      .forEach((importedPlace) => saveMatpickPlace(importedPlace));
    setSavedAt(saved.savedAt);
    setSavedCount(loadTastepinSaves().length);
    setState("success");
  };

  return (
    <main className={styles.page}>
      <header className={styles.appBar}>
        <Link href="/matpin/map" aria-label="맛핀 맛집 목록으로 돌아가기">
          <ArrowLeft aria-hidden size={21} />
        </Link>
        <div>
          <strong>맛핀</strong>
          <span>Shorts 저장</span>
        </div>
        <Link className={styles.savedLink} href="/matpin/map">
          <Bookmark aria-hidden size={16} />
          {savedCount}
        </Link>
      </header>

      <section className={styles.content} aria-labelledby="matpick-import-title">
        {!result ? (
          <>
            <div className={styles.intro}>
              <span className={styles.icon}><Video aria-hidden size={22} /></span>
              <p>YOUTUBE SHORTS</p>
              <h1 id="matpick-import-title">맛집 Shorts 링크를<br />하나 붙여넣으세요.</h1>
              <p>
                영상에서 식당명과 지역 단서를 찾고, 장소 후보를 확인한 뒤 저장해요.
              </p>
            </div>

            <form className={styles.form} onSubmit={submit}>
              <label htmlFor="matpick-video-url">YouTube Shorts 공개 링크</label>
              <div className={styles.inputShell} data-invalid={state === "error"}>
                <Link2 aria-hidden size={19} />
                <input
                  id="matpick-video-url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setMessage("");
                    if (!inputStartedRef.current && event.target.value.trim()) {
                      inputStartedRef.current = true;
                      trackMvpInputStarted("tastepin");
                    }
                  }}
                  placeholder="https://www.youtube.com/shorts/..."
                  inputMode="url"
                  autoComplete="url"
                  aria-invalid={state === "error"}
                  aria-describedby="matpick-import-help"
                  disabled={state === "loading"}
                />
              </div>
              <p id="matpick-import-help" className={state === "error" ? styles.error : styles.helper} role={state === "error" ? "alert" : undefined}>
                {message || "현재 웹 MVP는 공개 YouTube Shorts 링크를 지원합니다."}
              </p>
              <button className={styles.primaryButton} type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  <><LoaderCircle className={styles.spin} aria-hidden size={19} /> 장소 찾는 중…</>
                ) : (
                  <>이 Shorts에서 장소 찾기 <ArrowRight aria-hidden size={18} /></>
                )}
              </button>
            </form>

            <aside className={styles.privacy}>
              <Check aria-hidden size={17} />
              <p><strong>계정 없이 시작해요.</strong> 확인한 결과만 현재 브라우저에 저장되고, 원본 영상과 함께 다시 볼 수 있어요.</p>
            </aside>
          </>
        ) : (
          <section className={styles.result} aria-live="polite" data-clarity-mask="true">
            <div className={styles.resultStatus}>
              <span><Check aria-hidden size={18} /></span>
              <p>{state === "success" ? "내 저장함에 추가했어요" : "장소 후보를 찾았어요"}</p>
            </div>
            <h1 id="matpick-import-title" ref={resultHeadingRef} tabIndex={-1}>
              {candidate?.name ?? place?.name ?? "장소 단서를 저장했어요"}
            </h1>
            <p className={styles.resultSummary}>{result.extraction.summary}</p>

            <dl className={styles.clues}>
              <div>
                <dt>지역 단서</dt>
                <dd>{place?.regionHints.join(" · ") || candidate?.roadAddress || "지도에서 확인 필요"}</dd>
              </div>
              <div>
                <dt>메뉴 단서</dt>
                <dd>{place?.menus.join(" · ") || "영상 원본에서 확인"}</dd>
              </div>
            </dl>

            {candidate ? (
              <article className={styles.placeCard}>
                <span className={styles.placePin}><MapPin aria-hidden size={21} fill="currentColor" /></span>
                <div>
                  <strong>{candidate.name}</strong>
                  <p>{candidate.roadAddress || candidate.address}</p>
                  <small>{candidate.category || "음식점"}</small>
                </div>
                <a
                  href={googleMapsSearch(candidate.name, candidate.roadAddress || candidate.address)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${candidate.name} Google 지도에서 확인`}
                  onClick={() => trackMvpDeepAction("tastepin")}
                >
                  확인 <ExternalLink aria-hidden size={14} />
                </a>
              </article>
            ) : (
              <p className={styles.noCandidate}>장소 후보는 찾지 못했지만 영상에서 확인한 단서는 저장했어요.</p>
            )}

            {state === "success" ? (
              <>
                <p className={styles.receipt} aria-label="이 브라우저에 저장됨">
                  <Check aria-hidden size={16} />
                  {savedAt ? "이 브라우저에 저장 완료" : "저장 완료"}
                </p>
                <Link
                  className={styles.mapButton}
                  href="/matpin/map?saved=1"
                  data-testid="tastepin-open-saved"
                  onClick={() => trackMvpDeepAction("tastepin")}
                >
                  내 저장함에서 보기
                  <ArrowRight aria-hidden size={18} />
                </Link>
              </>
            ) : (
              <button className={styles.mapButton} type="button" onClick={confirmSave}>
                {candidate ? "이 장소 저장" : "확인한 단서 저장"}
                <Bookmark aria-hidden size={18} />
              </button>
            )}
            <button className={styles.resetButton} type="button" onClick={reset}>
              <RotateCcw aria-hidden size={17} />
              다른 Shorts 확인
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
