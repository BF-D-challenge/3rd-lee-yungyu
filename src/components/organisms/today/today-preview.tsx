"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  todayApplicationStatusResponseSchema,
  type TodayApplication,
} from "@/lib/today-contract";
import styles from "./today-preview.module.css";

export function TodayPreview({ id }: { id: string }) {
  const [job, setJob] = useState<TodayApplication | null>(null);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token")?.trim() ?? "";
    setToken(accessToken);
    if (!accessToken) {
      setState("error");
      return;
    }
    void fetch(`/api/today/applications/${id}`, {
      cache: "no-store",
      headers: { "x-today-access-token": accessToken },
    }).then(async (response) => {
      const body: unknown = await response.json();
      const parsed = todayApplicationStatusResponseSchema.safeParse(body);
      if (!response.ok || !parsed.success || parsed.data.job.status !== "ready" || !parsed.data.job.artifacts) {
        throw new Error("result_not_ready");
      }
      setJob(parsed.data.job);
      setState("ready");
    }).catch(() => setState("error"));
  }, [id]);

  if (state === "loading") {
    return <main className={styles.empty}>
      <h1>제작 결과를 불러오고 있어요.</h1>
      <p>전용 링크를 확인하는 중입니다.</p>
    </main>;
  }

  if (!job?.artifacts || state === "error") {
    return <main className={styles.empty}>
      <h1>이 결과를 열 수 없어요.</h1>
      <p>이메일로 받은 전용 링크를 다시 열거나, 아직 제작 중이라면 완료 알림을 기다려주세요.</p>
      <Link href="/today"><ArrowLeft size={17} /> Today로 돌아가기</Link>
    </main>;
  }

  const landing = job.artifacts.landing;
  const resultHref = `/today#job=${job.id}&token=${encodeURIComponent(token)}`;
  const recordInterest = () => {
    const key = `today:fake-door:${job.id}:v1`;
    localStorage.setItem(key, JSON.stringify({
      jobId: job.id,
      signal: job.signal,
      clickedAt: new Date().toISOString(),
    }));
    setConverted(true);
  };

  return (
    <main className={styles.page}>
      <header><Link href={resultHref}><ArrowLeft size={17} /> 제작 결과</Link><span>FAKE DOOR PREVIEW</span></header>
      <section className={styles.hero}>
        <div>
          <p>{landing.eyebrow}</p>
          <h1>{landing.headline}</h1>
          <span>{landing.body}</span>
          {converted ? (
            <p className={styles.receipt} role="status">
              신청 의향을 기록했어요. 실제 결제나 예약은 진행되지 않았습니다.
            </p>
          ) : (
            <button type="button" onClick={recordInterest}>{landing.cta}</button>
          )}
          <small>버튼을 누르면 실제 결제 대신 이 브라우저에 수요 행동만 기록합니다.</small>
        </div>
        <aside>
          <span>지금 받는 결과</span>
          <ul>{landing.proof.map((item) => <li key={item}><Check size={18} /> {item}</li>)}</ul>
        </aside>
      </section>
    </main>
  );
}
