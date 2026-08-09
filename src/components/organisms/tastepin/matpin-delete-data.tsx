"use client";

import Link from "next/link";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./matpin-account.module.css";

type State = "ready" | "confirming" | "deleting" | "deleted" | "error";

function tokenFromHash(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

export function MatpinDeleteData() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("ready");
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = tokenFromHash();
    setToken(accessToken);
    if (!accessToken) {
      setError("개인 보관함 링크가 없어요. Instagram에서 받은 최신 보관함 링크로 먼저 들어와주세요.");
      setState("error");
    }
  }, []);

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
            <p className={styles.lead}>삭제하면 저장한 장소, 게시물 처리 기록, 개인 보관함 연결 정보가 모두 사라져요.</p>
            <p className={styles.warning}>이 작업은 되돌릴 수 없어요. 나중에 다시 쓰려면 Instagram에서 새 게시물을 보내 처음부터 시작해야 해요.</p>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
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
