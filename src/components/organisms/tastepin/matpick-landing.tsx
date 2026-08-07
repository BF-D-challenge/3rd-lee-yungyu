"use client";

import { ArrowRight, MapPin } from "lucide-react";
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
  product_path: "/matpin",
  experiment_id: "tastepin",
} as const;

const destinations = {
  flow: "/matpin/start#save-reels",
  reservation: "/reserve/matpick",
} as const;

const dmReady = process.env.NEXT_PUBLIC_MATPICK_DM_READY === "true";

export function MatpickLanding() {
  useEffect(() => {
    track("tastepin_landing_viewed", {
      event_type: "tastepin_landing_viewed",
      funnel_stage: "landing",
      product_id: "tastepin",
      product_slug: "tastepin",
      product_path: "/matpin",
      experiment_id: "tastepin",
    }, { meta: false });
    trackMvpLandingViewed("matpick");
  }, []);

  const trackPrimaryCta = (destination: (typeof destinations)[keyof typeof destinations]) => {
    track("tastepin_primary_cta_clicked", {
      ...productEventParams,
      destination,
    }, { meta: false });
    trackMvpPrimaryCta("matpick");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="BF.D 제품 목록으로 돌아가기">
          <span aria-hidden="true"><MapPin size={17} strokeWidth={2.5} /></span>
          맛핀
        </Link>
        <span className={styles.stageBadge}>{dmReady ? "Instagram 자동 저장 사용 가능" : "Instagram 연동 준비 중"}</span>
      </header>

      <section className={styles.hero} aria-labelledby="matpick-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Instagram에서 보던 그 자리에서 저장</p>
          <h1 id="matpick-title">
            맛집 릴스를
            <br />matpin.kr로 보내면,
            <br />지도에 정리돼요.
          </h1>
          <p className={styles.lead}>
            Instagram 릴스에서 공유하기를 누르고 matpin.kr를 선택하세요. 맛핀이 영상 속
            장소와 원본 릴스를 찾아 한 지도에 자동으로 정리해요.
          </p>

          <div className={styles.actions}>
            <Link
              className={styles.primaryAction}
              href={destinations.flow}
              onClick={() => trackPrimaryCta(destinations.flow)}
            >
              릴스 저장 방법 보기
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <Link
              className={styles.demoAction}
              href={destinations.reservation}
              onClick={() => trackPrimaryCta(destinations.reservation)}
            >
              초기 체험 예약하기
            </Link>
          </div>

          <p className={styles.honestyNote}>
            {dmReady
              ? "Instagram에서 보낸 릴스를 분석한 뒤, 장소가 확실하지 않으면 저장 전에 확인을 요청해요."
              : "Instagram 공유 자동 저장은 현재 연결 중이에요. 지금은 공개 릴스 링크로 장소를 확인한 뒤 지도에 저장하는 같은 흐름을 먼저 체험할 수 있어요."}
          </p>
        </div>

        <figure className={styles.flowPreview}>
          <Image
            alt="릴스에서 공유하기, matpin.kr로 보내기, 지도에 자동 정리되는 맛핀 3단계 사용 흐름 예시"
            height={941}
            priority
            sizes="(max-width: 820px) calc(100vw - 40px), 520px"
            src="/images/matpick/matpin-instagram-share-flow.png"
            width={1672}
          />
          <figcaption>사용 흐름 예시 · Instagram 공유부터 지도 저장까지</figcaption>
        </figure>
      </section>

      <section className={styles.flow} aria-labelledby="flow-title">
        <div>
          <p className={styles.sectionEyebrow}>맛핀의 핵심 사용법</p>
          <h2 id="flow-title">공유 한 번이면 지도에 정리돼요.</h2>
          <p>Instagram에서 맛집 릴스를 보던 흐름을 끊지 않고 바로 저장할 수 있어요.</p>
        </div>
        <ol>
          <li><span>1</span><p><strong>릴스에서 공유하기 누르기</strong><small>나중에 가고 싶은 맛집을 발견한 순간 시작해요.</small></p></li>
          <li><span>2</span><p><strong>matpin.kr로 보내기</strong><small>공유할 계정에서 맛핀을 선택하면 돼요.</small></p></li>
          <li><span>3</span><p><strong>지도에 자동 정리</strong><small>영상 속 장소와 원본 릴스가 한 지도에 함께 모여요.</small></p></li>
        </ol>
      </section>

      <section className={styles.finalCta}>
        <p>이 문제가 내 이야기라면</p>
        <h2>먼저 써보고 싶은 이유를 알려주세요.</h2>
        <Link
          href={destinations.reservation}
          onClick={() => trackPrimaryCta(destinations.reservation)}
        >
          초기 체험 예약하기
          <ArrowRight aria-hidden="true" size={19} />
        </Link>
      </section>

      <nav className={styles.legalLinks} aria-label="맛핀 법적 안내">
        <Link href="/privacy">개인정보처리방침</Link>{" · "}
        <Link href="/terms">이용약관</Link>{" · "}
        <Link href="/data-deletion">데이터 삭제</Link>
      </nav>

      <div className={styles.mobileDock}>
        <Link href={destinations.flow} onClick={() => trackPrimaryCta(destinations.flow)}>
          릴스 저장 방법 보기
          <ArrowRight aria-hidden="true" size={19} />
        </Link>
      </div>
    </main>
  );
}
