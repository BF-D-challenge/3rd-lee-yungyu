"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { matpinMessagePublicSchema, type MatpinMessagePublic } from "@/lib/matpin/contract";
import styles from "./matpin-account.module.css";

type State = "loading" | "ready" | "saving" | "saved" | "error";

function tokenFromHash(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

export function MatpinConfirm() {
  const searchParams = useSearchParams();
  const messageId = searchParams.get("message") ?? "";
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<MatpinMessagePublic | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = tokenFromHash();
    setToken(accessToken);
    if (!accessToken || !messageId) {
      setError("확인 링크가 올바르지 않아요. Instagram에서 받은 최신 링크를 다시 열어주세요.");
      setState("error");
      return;
    }

    const controller = new AbortController();
    void fetch(`/api/matpin/messages/${encodeURIComponent(messageId)}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
      cache: "no-store",
    }).then(async (response) => {
      const body = await response.json();
      const parsed = matpinMessagePublicSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("message_unavailable");
      setMessage(parsed.data);
      setState(parsed.data.status === "failed" || parsed.data.status === "deleted" ? "error" : "ready");
      if (parsed.data.status === "failed" || parsed.data.status === "deleted") {
        setError("더 이상 수정할 수 없는 게시물예요. Instagram에서 게시물을 다시 보내주세요.");
      }
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError("장소 후보를 불러오지 못했어요. 잠시 후 같은 링크를 다시 열어주세요.");
      setState("error");
    });
    return () => controller.abort();
  }, [messageId]);

  const savedHref = useMemo(() => `/matpin/saved#token=${encodeURIComponent(token)}`, [token]);

  const confirm = async () => {
    if (!message || message.candidates.length === 0) return;
    setState("saving");
    setError("");
    try {
      const response = await fetch(`/api/matpin/messages/${encodeURIComponent(message.id)}/confirm`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ candidateIds: message.candidates.map((candidate) => candidate.id) }),
      });
      if (!response.ok) throw new Error("confirm_failed");
      setState("saved");
    } catch {
      setError("저장하지 못했어요. 찾은 장소를 확인하고 다시 시도해주세요.");
      setState("ready");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.appBar}>
        <Link href="/matpin" aria-label="맛핀 홈으로 돌아가기"><ArrowLeft aria-hidden="true" size={22} /></Link>
        <strong>맛핀, 저장 확인</strong>
      </header>
      <section className={styles.content} aria-live="polite">
        {state === "loading" ? (
          <><LoaderCircle className={styles.spinner} aria-hidden="true" /><p className={styles.message}>받은 게시물의 장소 후보를 불러오고 있어요.</p></>
        ) : null}

        {state === "ready" && message ? (
          <>
            <p className={styles.eyebrow}>모두 저장하기</p>
            <h1>찾은 {message.candidates.length}곳을<br />모두 저장할까요?</h1>
            <p className={styles.lead}>장소와 주소를 확인한 뒤 찾은 장소를 가까운 역별 보관함에 모두 저장하세요.</p>
            <div className={styles.candidateList} aria-label="저장할 장소">
              {message.candidates.map((candidate) => (
                <article className={styles.candidate} data-selected="true" key={candidate.id}>
                  <MapPin aria-hidden="true" size={20} />
                  <span>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.area}, {candidate.category}</span>
                    <span>{candidate.address}</span>
                    <em>{candidate.matchReason}</em>
                  </span>
                  <Check className={styles.confidence} aria-hidden="true" size={19} />
                </article>
              ))}
            </div>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button className={styles.primary} type="button" onClick={confirm}>
              {message.candidates.length}곳 모두 저장하기 <ArrowRight aria-hidden="true" size={18} />
            </button>
          </>
        ) : null}

        {state === "saving" ? (
          <><LoaderCircle className={styles.spinner} aria-hidden="true" /><p className={styles.message}>찾은 장소를 모두 저장하고 있어요.</p></>
        ) : null}

        {state === "saved" ? (
          <>
            <p className={styles.eyebrow}><Check aria-hidden="true" size={16} /> 저장 완료</p>
            <h1>역별 보관함에<br />정리했어요.</h1>
            <p className={styles.lead}>같은 계정으로 게시물을 더 보내면 가까운 역에 계속 쌓여요.</p>
            <Link className={styles.primary} href={savedHref}>내 게시물 보관함 보기 <ArrowRight aria-hidden="true" size={18} /></Link>
          </>
        ) : null}

        {state === "error" ? (
          <><h1>링크를 열 수 없어요.</h1><p className={styles.error} role="alert">{error}</p><Link className={styles.secondary} href="/matpin">맛핀 홈으로</Link></>
        ) : null}
      </section>
    </main>
  );
}
