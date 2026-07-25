"use client";

import { ArrowLeft, ExternalLink, MapPin, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { trackMvpDeepAction, trackMvpResultViewed } from "@/lib/mvp-experiment-analytics";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import { track } from "@/lib/track";
import {
  normalizeYouTubeShortsUrl,
  tastepinResolveResponseSchema,
  type TastepinResolveResponse,
} from "@/lib/tastepin-contract";
import styles from "./tastepin.module.css";

type RequestState = "idle" | "loading" | "success" | "error";

const errorCopy: Record<string, string> = {
  gemini_not_configured: "자동 분석 설정이 아직 연결되지 않았어요.",
  gemini_timeout: "영상 분석 시간이 길어졌어요. 잠시 후 다시 시도해주세요.",
  gemini_failed: "이 영상은 지금 분석하지 못했어요. 다른 공개 쇼츠로 다시 시도해주세요.",
};

export function Tastepin() {
  const [url, setUrl] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [result, setResult] = useState<TastepinResolveResponse | null>(null);
  const [message, setMessage] = useState("");
  const viewedSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!result) return;
    trackMvpResultViewed("tastepin");
    viewedSourceRef.current = url;
  }, [result, url]);

  const reset = () => {
    setUrl("");
    setResult(null);
    setMessage("");
    setRequestState("idle");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeYouTubeShortsUrl(url.trim());
    if (!normalized) {
      setMessage("youtube.com/shorts/로 시작하는 공개 쇼츠 링크를 넣어주세요.");
      setRequestState("error");
      return;
    }

    setMessage("");
    if (viewedSourceRef.current && viewedSourceRef.current !== normalized) {
      trackMvpDeepAction("tastepin");
      viewedSourceRef.current = null;
    }
    setResult(null);
    setRequestState("loading");
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
      const body = await response.json() as unknown;

      if (!response.ok) {
        const error = typeof body === "object" && body !== null && "error" in body
          ? String(body.error)
          : "gemini_failed";
        throw new Error(error);
      }

      const parsed = tastepinResolveResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("gemini_failed");

      setResult(parsed.data);
      setRequestState("success");
      track(
        parsed.data.extraction.status === "resolved"
          ? "tastepin_extract_succeeded"
          : "tastepin_extract_insufficient",
        {
          product_key: "tastepin",
          platform: "youtube_shorts",
          place_count: parsed.data.extraction.places.length,
          map_status: parsed.data.mapStatus,
        },
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "gemini_failed";
      setMessage(errorCopy[code] ?? errorCopy.gemini_failed);
      setRequestState("error");
      track("tastepin_extract_failed", {
        product_key: "tastepin",
        platform: "youtube_shorts",
        failure_type: code,
      });
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>오늘 해볼까</Link>
        <span className={styles.badge}>YouTube Shorts 실험</span>
      </header>

      <section className={styles.content}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={17} aria-hidden />
          다른 실험 보기
        </Link>

        <p className={styles.eyebrow}>맛집 쇼츠 → 식당 단서</p>
        <h1>맛집 쇼츠 링크만<br />붙여 넣어보세요.</h1>
        <p className={styles.lead}>
          Gemini가 영상의 음성·화면 글자·간판을 읽고 식당명, 메뉴, 지역 단서를 자동으로 찾습니다.
        </p>

        {requestState !== "success" ? (
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="tastepin-youtube-url">YouTube Shorts 공개 링크</label>
            <div className={styles.inputRow}>
              <Video size={20} aria-hidden />
              <input
                id="tastepin-youtube-url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setMessage("");
                  if (requestState === "error") setRequestState("idle");
                }}
                placeholder="https://www.youtube.com/shorts/..."
                inputMode="url"
                autoComplete="url"
                aria-invalid={Boolean(message)}
                disabled={requestState === "loading"}
              />
            </div>
            {message ? <p className={styles.error} role="alert">{message}</p> : null}
            <p className={styles.helper}>
              현재는 공개 YouTube Shorts만 지원합니다. Instagram과 TikTok 링크는 받지 않습니다.
            </p>
            <button className={styles.primaryButton} type="submit" disabled={requestState === "loading"}>
              {requestState === "loading" ? "영상 속 장소를 찾는 중…" : "영상에서 식당 찾기"}
            </button>
            <p className={styles.privacy}>
              링크는 분석 요청에만 사용하며, 브라우저 기록이나 광고 이벤트에 저장하지 않습니다.
            </p>
          </form>
        ) : null}

        {requestState === "success" && result ? (
          <Result result={result} onReset={reset} />
        ) : null}
      </section>
    </main>
  );
}

function Result({
  result,
  onReset,
}: {
  result: TastepinResolveResponse;
  onReset: () => void;
}) {
  if (result.extraction.status === "insufficient") {
    return (
      <section className={styles.result} aria-live="polite">
        <span className={styles.resultIcon}><Video aria-hidden /></span>
        <h2>이 영상에서는 식당 이름을 확인하지 못했어요.</h2>
        <p>{result.extraction.summary}</p>
        <button className={styles.secondaryButton} type="button" onClick={onReset}>
          다른 쇼츠 넣기
        </button>
        <PostResultSignup experimentId="tastepin" label="맛핀을 다시 쓰려면 Google로 연결하기" />
      </section>
    );
  }

  return (
    <section className={styles.result} aria-live="polite">
      <span className={styles.resultIcon}><Sparkles aria-hidden /></span>
      <h2>영상에서 이런 단서를 찾았어요.</h2>
      <p>{result.extraction.summary}</p>

      <div className={styles.clueList}>
        {result.extraction.places.map((place, index) => (
          <article className={styles.clueCard} key={`${place.name}-${index}`}>
            <p className={styles.clueLabel}>식당 후보 {index + 1}</p>
            <h3>{place.name}{place.branch ? ` ${place.branch}` : ""}</h3>
            <dl>
              <div>
                <dt>메뉴</dt>
                <dd>{place.menus.length > 0 ? place.menus.join(", ") : "영상에서 확인되지 않음"}</dd>
              </div>
              <div>
                <dt>지역</dt>
                <dd>{place.regionHints.length > 0 ? place.regionHints.join(", ") : "영상에서 확인되지 않음"}</dd>
              </div>
            </dl>
            <p className={styles.evidence}>
              근거: {place.evidence.map((evidence) => evidence.text).join(" · ")}
            </p>
          </article>
        ))}
      </div>

      {result.mapStatus === "candidates" ? (
        <section className={styles.mapSection}>
          <h3><MapPin size={18} aria-hidden /> 카카오맵 장소 후보</h3>
          {result.mapCandidates.map((candidate) => (
            <a
              className={styles.mapCandidate}
              href={candidate.mapUrl}
              target="_blank"
              rel="noreferrer"
              key={candidate.id}
            >
              <span>
                <strong>{candidate.name}</strong>
                <small>{candidate.roadAddress || candidate.address}</small>
              </span>
              <ExternalLink size={17} aria-hidden />
            </a>
          ))}
          <p className={styles.helper}>주소를 확인한 뒤 맞는 장소를 선택해주세요.</p>
        </section>
      ) : (
        <p className={styles.mapNotice}>
          {result.mapStatus === "not_configured"
            ? "식당 단서 추출은 완료됐어요. 정확한 지도 장소 연결은 Kakao Local 서버 키가 연결된 뒤 제공됩니다."
            : result.mapStatus === "no_match"
              ? "식당 단서는 찾았지만 카카오맵에서 일치하는 장소를 찾지 못했어요."
              : "식당 단서는 찾았지만 지도 후보를 불러오지 못했어요."}
        </p>
      )}

      <button className={styles.secondaryButton} type="button" onClick={onReset}>
        다른 쇼츠 넣기
      </button>
      <PostResultSignup experimentId="tastepin" label="맛핀을 다시 쓰려면 Google로 연결하기" />
    </section>
  );
}
