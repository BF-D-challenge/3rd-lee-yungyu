"use client";

import Link from "next/link";
import { ArrowLeft, Check, EyeOff, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import { checkAuthSession } from "@/lib/auth-session";
import styles from "./matpin-account.module.css";

type State = "checking_auth" | "login_required" | "ready" | "confirming" | "deleting" | "deleted" | "error";
type VisibilityState = "ready" | "updating" | "private" | "error";

function tokenFromHash(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

export function MatpinDeleteData() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("checking_auth");
  const [visibilityState, setVisibilityState] = useState<VisibilityState>("ready");
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = tokenFromHash();
    setToken(accessToken);
    if (!accessToken) {
      setError("개인 보관함 링크가 없어요. Instagram에서 받은 최신 보관함 링크로 먼저 들어와주세요.");
      setState("error");
      return;
    }
    let cancelled = false;
    void checkAuthSession({ requireSupabaseWhenConfigured: true }).then((session) => {
      if (!cancelled) setState(session && !session.demo && !session.anonymous ? "ready" : "login_required");
    }).catch(() => {
      if (!cancelled) setState("login_required");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const makePrivate = async () => {
    setVisibilityState("updating");
    setError("");
    try {
      const response = await fetch("/api/matpin/profile/visibility", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ isPublic: false }),
      });
      if (!response.ok) throw new Error("visibility_failed");
      setVisibilityState("private");
    } catch {
      setError("공개 보관함을 비공개로 바꾸지 못했어요. 잠시 후 다시 시도해주세요.");
      setVisibilityState("error");
    }
  };

  const removeAll = async () => {
    setState("deleting");
    setError("");
    try {
      const response = await fetch("/api/matpin/account", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("delete_failed");
      window.history.replaceState(null, "", "/matpin/delete");
      setState("deleted");
    } catch {
      setError("데이터를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
      setState("confirming");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.appBar}>
        <Link href={`/matpin/saved#token=${encodeURIComponent(token)}`} aria-label="내 보관함으로 돌아가기"><ArrowLeft aria-hidden="true" size={22} /></Link>
        <strong>맛핀, 데이터 관리</strong>
      </header>
      <section className={styles.content} aria-live="polite">
        {state === "deleted" ? (
          <>
            <p className={styles.eyebrow}><Check aria-hidden="true" size={16} /> 삭제 완료</p>
            <h1>맛핀 데이터를<br />모두 삭제했어요.</h1>
            <p className={styles.lead}>저장한 장소, 게시물 처리 기록, 개인 보관함 연결 정보는 복구할 수 없어요.</p>
            <Link className={styles.primary} href="/matpin">맛핀 홈으로</Link>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>개인정보 관리</p>
            <h1>내 데이터를<br />직접 삭제할 수 있어요.</h1>
            {state === "checking_auth" ? (
              <><LoaderCircle aria-hidden="true" size={24} /><p className={styles.lead}>로그인 상태를 확인하고 있어요.</p></>
            ) : null}
            {state === "login_required" ? (
              <>
                <p className={styles.lead}>비공개 전환과 삭제는 로그인한 뒤에만 할 수 있어요.</p>
                <GoogleLoginButton
                  context="matpin_data"
                  label="Google로 로그인하고 관리하기"
                  requireSupabaseWhenConfigured
                  onAuthenticated={(session) => {
                    if (session.demo || session.anonymous) {
                      setError("실제 Google 로그인이 필요해요. Supabase 로그인을 먼저 설정해주세요.");
                      setState("login_required");
                      return;
                    }
                    setState("ready");
                  }}
                />
              </>
            ) : null}
            {state !== "checking_auth" && state !== "login_required" ? (
              <>
                <p className={styles.lead}>이 Google 계정을 Instagram 채팅방의 관리 계정으로 연결한 뒤, 공개 보관함을 비공개로 바꾸거나 데이터를 삭제할 수 있어요.</p>
                <p className={styles.warning}>전체 삭제는 되돌릴 수 없어요. 나중에 다시 쓰려면 Instagram에서 새 게시물을 보내 처음부터 시작해야 해요.</p>
              </>
            ) : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {state === "ready" && visibilityState === "ready" ? (
              <button className={styles.secondary} type="button" onClick={makePrivate}>
                공개 보관함 비공개로 전환 <EyeOff aria-hidden="true" size={18} />
              </button>
            ) : null}
            {visibilityState === "updating" ? <button className={styles.secondary} type="button" disabled>비공개로 바꾸고 있어요…</button> : null}
            {visibilityState === "private" ? <p className={styles.lead}><Check aria-hidden="true" size={16} /> 공개 보관함을 비공개로 바꿨어요.</p> : null}
            {state === "ready" ? (
              <button className={styles.secondary} type="button" onClick={() => setState("confirming")} disabled={!token}>
                모든 맛핀 데이터 삭제 <Trash2 aria-hidden="true" size={18} />
              </button>
            ) : null}
            {state === "confirming" ? (
              <>
                <button className={styles.danger} type="button" onClick={removeAll}>정말 모두 삭제하기</button>
                <button className={styles.secondary} type="button" onClick={() => setState("ready")}>취소</button>
              </>
            ) : null}
            {state === "deleting" ? <button className={styles.danger} type="button" disabled>삭제하고 있어요…</button> : null}
          </>
        )}
      </section>
    </main>
  );
}
