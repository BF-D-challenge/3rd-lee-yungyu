"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { trackMvpLandingViewed, trackMvpPrimaryCta } from "@/lib/mvp-experiment-analytics";
import { track } from "@/lib/track";
import styles from "./onebite-landing.module.css";

function trackPrimaryCta(placement: "hero" | "closing") {
  track("onebite_primary_cta_clicked", {
    event_type: "onebite_primary_cta_clicked",
    funnel_stage: "primary_cta",
    product_id: "onebite",
    product_slug: "onebite",
    cta_placement: placement,
    destination: "/reserve/onebite",
  }, { meta: false });
  trackMvpPrimaryCta("onebite");
}

export function OnebiteLanding() {
  useEffect(() => {
    track("onebite_landing_viewed", {
      event_type: "onebite_landing_viewed",
      funnel_stage: "landing",
      product_id: "onebite",
      product_slug: "onebite",
      entry_path: "/onebite/start",
    }, { meta: false });
    trackMvpLandingViewed("onebite");
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>한입코치</Link>
        <span>초기 체험</span>
      </header>

      <section className={styles.hero} aria-labelledby="onebite-landing-title">
        <Image
          className={styles.heroImage}
          src="/images/onebite/coach-fridge.webp"
          alt="냉장고 안의 음식을 사이에 두고 정면을 바라보는 남자 헬스 트레이너"
          fill
          priority
          sizes="(max-width: 839px) 100vw, 76rem"
        />
        <div className={styles.heroShade} aria-hidden />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>사진 한 장 → 다음 한 끼 행동 하나</p>
          <h1 id="onebite-landing-title">
            먹은 건 됐어요.<br />
            다음 한 끼는<br />
            제가 잡을게요.
          </h1>
          <p className={styles.lead}>
            음식 사진에서 보이는 것만 확인해요. 몸 상태를 진단하지 않고,
            다음에 할 일 하나만 분명하게 말해요.
          </p>
          <div className={styles.heroActions}>
            <Link
              className={styles.primaryAction}
              href="/reserve/onebite"
              onClick={() => trackPrimaryCta("hero")}
            >
              한입코치 예약하기
              <ArrowRight aria-hidden />
            </Link>
            <Link className={styles.secondaryAction} href="/onebite">
              사진으로 먼저 해보기
            </Link>
          </div>
        </div>
      </section>

      <section
        className={styles.example}
        id="coaching-example"
        aria-labelledby="coaching-example-title"
      >
        <div className={styles.sectionHeading}>
          <p>코치는 세게, 기준은 안전하게</p>
          <h2 id="coaching-example-title">혼내는 건 음식이 아니라, 다음 행동이에요</h2>
        </div>
        <div className={styles.coachingExample}>
          <div className={styles.mealContext}>
            <span>보낸 사진 예시</span>
            <strong>어젯밤 치킨과 맥주</strong>
          </div>
          <blockquote>
            “치킨 먹은 건 됐어요.<br />다음 끼니엔 채소 반찬부터 담아요.”
          </blockquote>
          <p>
            예시 문구예요. 실제 답은 사진에서 보이는 음식 그룹에 맞춰 정해집니다.
            칼로리, 체중, 질환은 판단하지 않아요.
          </p>
        </div>
      </section>

      <section className={styles.steps} aria-labelledby="onebite-steps-title">
        <div className={styles.sectionHeading}>
          <p>받는 것은 딱 하나</p>
          <h2 id="onebite-steps-title">다음 식사에서 바로 해볼 행동</h2>
        </div>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>먹은 음식 사진을 보냅니다</strong>
              <p>한 끼 전체가 보이는 사진 한 장이면 돼요.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>사진에 보이는 음식만 확인합니다</strong>
              <p>칼로리를 맞히거나 먹은 사람을 점수로 매기지 않아요.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>다음 한 끼 행동 하나를 받습니다</strong>
              <p>“채소 반찬부터 담기”처럼 바로 할 수 있는 말로 끝나요.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.reservation} aria-labelledby="onebite-reservation-title">
        <div>
          <p>초기 체험 예약</p>
          <h2 id="onebite-reservation-title">다음 한 끼를 바꿀 준비만 해요</h2>
          <span>
            Instagram 아이디 저장과 Google 로그인은 다음 예약 화면에서 한 번에 진행합니다.
          </span>
        </div>
        <Link
          className={styles.closingAction}
          href="/reserve/onebite"
          onClick={() => trackPrimaryCta("closing")}
        >
          예약 화면으로 가기
          <ArrowRight aria-hidden />
        </Link>
        <p className={styles.privacy}>
          <ShieldCheck aria-hidden />
          이 화면에서는 Instagram 아이디나 Google 계정을 받지 않아요.
        </p>
      </section>

      <footer className={styles.footer}>
        <p><Check aria-hidden /> 의료·임상 영양 상담이 아닌 일반 식사 행동 코칭입니다.</p>
        <Link href="/onebite">사진으로 먼저 해보기</Link>
      </footer>
    </main>
  );
}
