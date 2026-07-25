"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
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

export function Onebite() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [result, setResult] = useState<OnebiteSuccessResponse | null>(null);
  const [rejection, setRejection] = useState<OnebiteRejectedResponse | null>(
    null,
  );
  const [message, setMessage] = useState("");

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const resetRequest = () => {
    setResult(null);
    setRejection(null);
    setMessage("");
    setRequestState("idle");
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPreviewUrl(null);
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
    setPreviewUrl(URL.createObjectURL(nextPhoto));
    resetRequest();
  };

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!photo || requestState === "loading") return;

    setResult(null);
    setRejection(null);
    setMessage("");
    setRequestState("loading");

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
    } catch (error) {
      const code = error instanceof Error ? error.message : "gemini_failed";
      setMessage(errorCopy[code] ?? errorCopy.gemini_failed);
      setRequestState("error");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>오늘 해볼까</Link>
        <span className={styles.badge}>한입코치</span>
      </header>

      <section className={styles.content}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={17} aria-hidden />
          다른 실험 보기
        </Link>

        <p className={styles.eyebrow}>음식 사진 → 다음 한 끼 행동</p>
        <h1>숫자 말고,<br />다음 한 끼 하나만 바꿔요.</h1>
        <p className={styles.lead}>
          음식 사진 한 장에서 보이는 음식 그룹만 확인해, 다음 끼니에 할 수 있는 작은 행동 하나를 제안합니다.
        </p>

        {requestState !== "success" ? (
          <form
            className={styles.form}
            onSubmit={analyze}
            aria-busy={requestState === "loading"}
          >
            <label
              className={styles.upload}
              htmlFor="onebite-photo"
              data-has-photo={photo ? "true" : "false"}
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

            <button
              className={styles.primaryButton}
              type="submit"
              disabled={!photo || requestState === "loading"}
              aria-describedby={!photo ? "onebite-submit-help" : undefined}
            >
              {requestState === "loading"
                ? "사진에서 음식 그룹을 확인하는 중…"
                : "사진 분석하고 다음 행동 보기"}
            </button>
            {!photo ? (
              <p id="onebite-submit-help" className={styles.helper}>
                사진을 고르면 분석 버튼이 켜져요.
              </p>
            ) : null}

            <p className={styles.privacy}>
              <ShieldCheck size={16} aria-hidden />
              우리 서비스의 DB나 파일 저장소에는 사진을 보관하지 않습니다. 서버에서 크기와 메타데이터를 정리한 뒤 Gemini 분석 요청에 한 번 전송합니다.
            </p>
          </form>
        ) : null}

        {requestState === "success" && result ? (
          <Result result={result} onReset={clearPhoto} />
        ) : null}

        <p className={styles.boundary}>
          사진만으로 칼로리·중량·질환을 판단하지 않으며, 의료·임상 영양 조언을 제공하지 않습니다.
        </p>
      </section>
    </main>
  );
}

function Result({
  result,
  onReset,
}: {
  result: OnebiteSuccessResponse;
  onReset: () => void;
}) {
  return (
    <section className={styles.result} role="status" aria-live="polite">
      <span className={styles.resultIcon}><Check aria-hidden /></span>
      <p className={styles.resultLabel}>사진에서 확인한 그룹</p>
      <div className={styles.groupList}>
        {result.analysis.visibleGroups.map((group) => (
          <span key={group}>{visibleGroupCopy[group]}</span>
        ))}
      </div>
      <p className={styles.confidence}>
        사진 판독 확신도 {confidenceCopy[result.analysis.confidence]}
      </p>

      <div className={styles.action}>
        <p>다음 한 끼 행동</p>
        <h2>{result.actionLine}</h2>
      </div>

      <p className={styles.resultNote}>
        이 문장은 Gemini가 자유롭게 만든 조언이 아니라, 사진에서 확인한 그룹에 맞춰 안전한 고정 문장 중 하나를 고른 결과예요.
      </p>
      <button className={styles.secondaryButton} type="button" onClick={onReset}>
        다른 사진 분석하기
      </button>
    </section>
  );
}
