"use client";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { trackMvpLandingViewed, trackMvpPrimaryCta } from "@/lib/mvp-experiment-analytics";
import { track } from "@/lib/track";
import styles from "./onebite-landing.module.css";

function trackPrimaryCta(
  placement: "hero" | "closing",
  destination: "/onebite" | "/reserve/onebite",
) {
  track("onebite_primary_cta_clicked", {
    event_type: "onebite_primary_cta_clicked",
    funnel_stage: "primary_cta",
    product_id: "onebite",
    product_slug: "onebite",
    cta_placement: placement,
    destination,
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
        <span>첫 코칭 무료</span>
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
          <p className={styles.eyebrow}>사진 한 장 → 팩폭 한 방 → 다음 끼니 복귀</p>
          <h1 id="onebite-landing-title">
            사진 한 장이면<br />
            혼나고,<br />
            바로 복귀.
          </h1>
          <p className={styles.lead}>
            망한 한 끼를 망한 하루로 키우지 마세요. 선택은 세게 짚고,
            다음 끼니에 할 행동 하나로 끝냅니다.
          </p>
          <div className={styles.heroActions}>
            <Link
              className={styles.primaryAction}
              href="/onebite"
              onClick={() => trackPrimaryCta("hero", "/onebite")}
            >
              무료로 한 번 혼나기
              <ArrowRight aria-hidden />
            </Link>
            <a className={styles.secondaryAction} href="#coaching-example">
              팩폭 예시 먼저 보기
            </a>
          </div>
        </div>
      </section>

      <section
        className={styles.example}
        id="coaching-example"
        aria-labelledby="coaching-example-title"
      >
        <div className={styles.sectionHeading}>
          <p>정신이 번쩍 드는 한 방</p>
          <h2 id="coaching-example-title">다정한 기록 말고, 복귀시키는 팩폭</h2>
        </div>
        <div className={styles.coachingExample}>
          <div className={styles.mealContext}>
            <span>보낸 사진 예시</span>
            <strong>야근 뒤 치킨</strong>
          </div>
          <blockquote>
            “야근은 핑계고,<br />치킨은 진심이네요.”
          </blockquote>
          <strong className={styles.exampleAction}>다음 끼니: 채소 반찬부터 담기</strong>
          <p>
            팩폭은 선택과 패턴만 짚고 반드시 복귀 행동으로 끝납니다.
            몸·외모·인격은 건드리지 않고, 칼로리·체중·질환도 판단하지 않아요.
          </p>
        </div>
      </section>

      <section className={styles.steps} aria-labelledby="onebite-steps-title">
        <div className={styles.sectionHeading}>
          <p>혼나고 끝내지 않아요</p>
          <h2 id="onebite-steps-title">다음 사진까지 이어지는 복귀 루프</h2>
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
              <strong>AI가 확인한 음식을 먼저 봅니다</strong>
              <p>사진에서 직접 확인한 음식 이름과 그룹이 맞는지 고릅니다.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>사진마다 다른 팩폭 한 방을 받습니다</strong>
              <p>몸이나 인격이 아니라, 사진에서 확인한 선택만 혼내요.</p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>다음 한 끼 행동 하나를 약속합니다</strong>
              <p>“채소 반찬부터 담기”처럼 바로 해볼 행동 하나로 끝나요.</p>
            </div>
          </li>
          <li>
            <span>5</span>
            <div>
              <strong>다음 사진에서 복귀를 확인합니다</strong>
              <p>약속을 해봤는지 기록하고, 새 사진으로 다시 코칭받아요.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.reservation} aria-labelledby="onebite-reservation-title">
        <div>
          <p>계속 혼나고 싶다면</p>
          <h2 id="onebite-reservation-title">7일 패스 4,900원</h2>
          <span>
            첫 코칭은 무료예요. 7일 패스는 준비 중이며 자동 갱신은 없습니다.
          </span>
        </div>
        <Link
          className={styles.closingAction}
          href="/reserve/onebite"
          onClick={() => trackPrimaryCta("closing", "/reserve/onebite")}
        >
          7일 패스 알림 받기
          <ArrowRight aria-hidden />
        </Link>
        <p className={styles.privacy}>
          <ShieldCheck aria-hidden />
          혼내는 건 코치뿐, 결제는 안 혼납니다. 다음 화면에서 출시 알림만 신청해요.
        </p>
      </section>

      <footer className={styles.footer}>
        <p><Check aria-hidden /> 의료·임상 영양 상담이 아닌 일반 식사 행동 코칭입니다.</p>
        <Link href="/onebite">무료로 한 번 혼나기</Link>
      </footer>
    </main>
  );
}
