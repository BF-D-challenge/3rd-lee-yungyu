"use client";

import { ArrowRight, Bookmark, Check, MapPin, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { trackMvpLandingViewed, trackMvpPrimaryCta } from "@/lib/mvp-experiment-analytics";
import { track } from "@/lib/track";
import styles from "./matpick-landing.module.css";

const productEventParams = {
  event_type: "tastepin_primary_cta_clicked",
  funnel_stage: "primary_cta",
  product_id: "tastepin",
  product_slug: "tastepin",
  product_path: "/matpick",
  experiment_id: "tastepin",
  destination: "/reserve/matpick",
} as const;

export function MatpickLanding() {
  useEffect(() => {
    track("tastepin_landing_viewed", {
      event_type: "tastepin_landing_viewed",
      funnel_stage: "landing",
      product_id: "tastepin",
      product_slug: "tastepin",
      product_path: "/matpick",
      experiment_id: "tastepin",
    }, { meta: false });
    trackMvpLandingViewed("matpick");
  }, []);

  const trackPrimaryCta = () => {
    track("tastepin_primary_cta_clicked", productEventParams, { meta: false });
    trackMvpPrimaryCta("matpick");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="BF.D 제품 목록으로 돌아가기">
          <span aria-hidden="true"><MapPin size={17} strokeWidth={2.5} /></span>
          맛핀
        </Link>
        <span className={styles.stageBadge}>초기 체험 모집 중</span>
      </header>

      <section className={styles.hero} aria-labelledby="matpick-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>저장한 릴스가 쌓일수록, 다시 찾기는 더 어려워져요</p>
          <h1 id="matpick-title">
            저장한 맛집 릴스만 200개.
            <br />오늘 갈 곳은 또 못 찾았다.
          </h1>
          <p className={styles.lead}>
            맛핀은 맛집 릴스 링크에서 장소 후보를 찾아, 원본 영상과 함께 다시 볼 수 있게
            정리하려는 초기 제품이에요.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/reserve/matpick" onClick={trackPrimaryCta}>
              초기 체험 예약하기
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <Link className={styles.demoAction} href="/matpick/dm">
              공개 릴스로 30초 데모 보기
            </Link>
          </div>

          <p className={styles.honestyNote}>
            지금은 공개 릴스 링크로 장소 후보를 확인하는 데모만 제공해요. Instagram 저장함
            전체 가져오기와 자동 DM 수집은 아직 지원하지 않아요.
          </p>
        </div>

        <div className={styles.problemScene} aria-label="저장한 릴스에서 오늘 갈 맛집을 다시 찾는 상황 예시">
          <div className={styles.sceneHeader}>
            <span>오늘 저녁 · 역삼</span>
            <span><Bookmark aria-hidden="true" size={15} fill="currentColor" /> 저장됨 200</span>
          </div>

          <div className={styles.searchAttempt}>
            <div className={styles.searchField}>
              <Search aria-hidden="true" size={17} />
              <span>오늘 갈 맛집</span>
            </div>
            <p>결국 저장한 릴스를 하나씩 다시 여는 중…</p>
          </div>

          <div className={styles.demoDivider}>
            <span />
            <b>맛핀 데모</b>
            <span />
          </div>

          <article className={styles.resultCard}>
            <div className={styles.resultImage}>
              <Image
                alt="산장장작구이 공개 릴스의 음식 장면"
                fill
                priority
                sizes="(max-width: 720px) 116px, 148px"
                src="/images/matpick/yeoksam-sanjang-reel.jpg"
              />
            </div>
            <div className={styles.resultCopy}>
              <span><Sparkles aria-hidden="true" size={14} /> 공개 릴스 예시 결과</span>
              <strong>산장장작구이</strong>
              <p>역삼역 · 고기구이</p>
              <small><Check aria-hidden="true" size={13} /> 장소 후보를 직접 확인한 뒤 저장</small>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.flow} aria-labelledby="flow-title">
        <div>
          <p className={styles.sectionEyebrow}>지금 체험할 수 있는 흐름</p>
          <h2 id="flow-title">링크 하나, 장소 확인, 저장.</h2>
          <p>검색·지도·가져오기를 모두 설명하지 않고, 현재 동작하는 가장 짧은 데모만 남겼어요.</p>
        </div>
        <ol>
          <li><span>1</span><p><strong>공개 릴스 링크 붙여넣기</strong><small>실제 DM이나 Instagram 계정에는 접근하지 않아요.</small></p></li>
          <li><span>2</span><p><strong>장소 후보 직접 확인하기</strong><small>자동 추출이 틀릴 수 있어 사용자가 마지막으로 골라요.</small></p></li>
          <li><span>3</span><p><strong>이 브라우저에 저장하기</strong><small>원본 릴스와 장소를 현재 기기에 함께 남겨요.</small></p></li>
        </ol>
      </section>

      <section className={styles.finalCta}>
        <p>이 문제가 내 이야기라면</p>
        <h2>먼저 써보고 싶은 이유를 알려주세요.</h2>
        <Link href="/reserve/matpick" onClick={trackPrimaryCta}>
          초기 체험 예약하기
          <ArrowRight aria-hidden="true" size={19} />
        </Link>
      </section>

      <div className={styles.mobileDock}>
        <Link href="/reserve/matpick" onClick={trackPrimaryCta}>
          초기 체험 예약하기
          <ArrowRight aria-hidden="true" size={19} />
        </Link>
      </div>
    </main>
  );
}
