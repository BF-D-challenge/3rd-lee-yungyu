"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Captions,
  Check,
  LibraryBig,
  MessageCircleMore,
  Send,
  ShieldCheck,
  TrainFront,
  UserRound,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { track } from "@/lib/track";
import styles from "./matpin-home.module.css";

const instagramProfile = "https://www.instagram.com/matpin.kr/";

const sourceItems = [
  {
    icon: Captions,
    order: "먼저",
    title: "릴스 캡션",
    description: "가게 이름과 지역처럼 작성자가 직접 적은 정보를 먼저 확인해요.",
  },
  {
    icon: MessageCircleMore,
    order: "다음",
    title: "작성자 댓글",
    description: "고정 댓글을 포함해 작성자가 남긴 장소 단서도 함께 확인해요.",
  },
  {
    icon: Video,
    order: "마지막",
    title: "영상 속 단서",
    description: "캡션과 댓글만으로 부족하면 영상에 직접 나온 장소 정보를 확인해요.",
  },
];

const faqs = [
  {
    question: "내 위치도 수집하나요?",
    answer: "아니요. 현재 위치 권한을 요청하지 않아요. 릴스에서 확인한 장소 주소로 가까운 역만 찾아요.",
  },
  {
    question: "한 릴스에 장소가 여러 개면 어떻게 되나요?",
    answer: "확인된 장소는 모두 저장하고 관련된 역마다 같은 영상을 보여줘요. 사용자는 가고 싶은 역만 고르면 돼요.",
  },
  {
    question: "다른 Instagram 계정에서 보내면 같은 보관함에 저장되나요?",
    answer: "아니요. 보관함은 릴스를 보낸 Instagram 계정별로 나뉘어요. 다른 사람의 영상과 섞이지 않아요.",
  },
  {
    question: "장소 이름이 정확히 나오지 않으면요?",
    answer: "근거가 부족한 장소는 추측해서 저장하지 않아요. 확인 가능한 장소가 있는 영상만 보관함에 남겨요.",
  },
];

export function MatpinHome() {
  useEffect(() => {
    track(
      "tastepin_landing_viewed",
      {
        event_type: "tastepin_landing_viewed",
        funnel_stage: "landing",
        product_id: "tastepin",
        product_slug: "tastepin",
        product_path: "/matpin",
        experiment_id: "tastepin",
      },
      { meta: false },
    );
  }, []);

  const trackOpenInstagram = () => {
    track(
      "tastepin_primary_cta_clicked",
      {
        event_type: "tastepin_primary_cta_clicked",
        funnel_stage: "primary_cta",
        product_id: "tastepin",
        product_slug: "tastepin",
        product_path: "/matpin",
        experiment_id: "tastepin",
        destination: instagramProfile,
      },
      { meta: false },
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/matpin" aria-label="맛핀 홈">
            matpin.kr <span aria-hidden="true" />
          </Link>
          <nav className={styles.headerNav} aria-label="맛핀 소개">
            <a href="#how">저장 방법</a>
            <a href="#saved">역별 보관함</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <a
            className={styles.headerCta}
            href={instagramProfile}
            target="_blank"
            rel="noreferrer"
            onClick={trackOpenInstagram}
          >
            Instagram 열기 <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="matpin-title">
        <div className={styles.heroCopy}>
          <div className={styles.serviceStatus}>
            <Check aria-hidden="true" size={15} /> Instagram DM으로 릴스 저장
          </div>
          <p className={styles.eyebrow}>Instagram 릴스 → 역별 맛집 보관함</p>
          <h1 id="matpin-title">
            맛집 릴스는<br />
            보내기만 하세요.<br />
            역별로 모아둘게요.
          </h1>
          <p className={styles.lead}>
            Instagram에서 <strong>matpin.kr</strong> 계정으로 릴스를 보내면,
            장소를 확인해 가까운 역을 찾고 같은 계정의 보관함에 정리해요.
          </p>

          <div className={styles.heroActions}>
            <a
              className={styles.primaryAction}
              href={instagramProfile}
              target="_blank"
              rel="noreferrer"
              onClick={trackOpenInstagram}
            >
              <Send aria-hidden="true" size={20} />
              Instagram에서 matpin.kr 열기
              <ArrowUpRight aria-hidden="true" size={18} />
            </a>
          </div>

          <ul className={styles.heroFacts} aria-label="맛핀 저장 특징">
            <li><Check aria-hidden="true" size={15} /> 링크 붙여넣기 없음</li>
            <li><Check aria-hidden="true" size={15} /> 가까운 역 자동 정리</li>
            <li><Check aria-hidden="true" size={15} /> DM으로 내 보관함 받기</li>
          </ul>
        </div>

        <figure className={styles.heroVisual}>
          <Image
            className={styles.heroImage}
            src="/images/ads/matpin-woman-ad-original.png"
            alt="밤에 휴대폰으로 맛집 릴스를 보다가 저장한 장소를 다시 찾는 사람"
            fill
            priority
            sizes="(max-width: 839px) calc(100vw - 32px), 500px"
          />
          <span className={styles.privacyBadge}>
            <ShieldCheck aria-hidden="true" size={16} /> 내 위치는 수집하지 않아요
          </span>
          <figcaption>
            <span>릴스 보내기</span>
            <ArrowRight aria-hidden="true" size={16} />
            <strong>역별로 자동 정리</strong>
          </figcaption>
        </figure>
      </section>

      <section className={styles.problem} aria-labelledby="problem-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>저장 목록을 다시 내리지 않아도</p>
          <h2 id="problem-title">그때 본 맛집을<br />갈 역에서 찾으세요.</h2>
        </div>
        <div className={styles.beforeAfter}>
          <div>
            <span>릴스만 저장하면</span>
            <strong>“그 가게가 어디였지?”</strong>
            <p>영상은 남아도 가게 이름과 위치를 다시 찾아야 해요.</p>
          </div>
          <ArrowRight aria-hidden="true" size={22} />
          <div className={styles.after}>
            <span>matpin.kr로 보내면</span>
            <strong>역을 고르면 영상이 바로</strong>
            <p>가고 싶은 역에서 저장한 원본 릴스를 바로 확인할 수 있어요.</p>
          </div>
        </div>
      </section>

      <section className={styles.how} id="how" aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>저장 방법</p>
          <h2 id="how-title">복사도, 붙여넣기도<br />필요 없어요.</h2>
          <p className={styles.sectionDescription}>보내기까지 세 단계예요. 저장이 끝나면 DM으로 알려드려요.</p>
        </div>
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNumber}>1</span>
            <Send aria-hidden="true" size={24} />
            <div><b>릴스에서 공유하기</b><p>저장하고 싶은 맛집 릴스의 공유 버튼을 누르세요.</p></div>
          </li>
          <li>
            <span className={styles.stepNumber}>2</span>
            <UserRound aria-hidden="true" size={24} />
            <div><b>matpin.kr로 보내기</b><p>공유 대상에서 matpin.kr 계정을 찾아 전송하세요.</p></div>
          </li>
          <li>
            <span className={styles.stepNumber}>3</span>
            <LibraryBig aria-hidden="true" size={24} />
            <div><b>DM에서 내 보관함 열기</b><p>저장이 끝나면 같은 Instagram 계정의 DM으로 역별 보관함 링크를 보내드려요.</p></div>
          </li>
        </ol>
      </section>

      <section className={styles.sources} aria-labelledby="sources-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>장소를 찾는 순서</p>
          <h2 id="sources-title">캡션에 없으면<br />댓글과 영상까지 확인해요.</h2>
          <p className={styles.sectionDescription}>확인할 수 있는 근거가 있을 때만 장소를 저장해요.</p>
        </div>
        <ol className={styles.sourceList}>
          {sourceItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.title}>
                <span className={styles.sourceOrder}>{item.order}</span>
                <Icon aria-hidden="true" size={25} />
                <div><b>{item.title}</b><p>{item.description}</p></div>
                <span className={styles.sourceIndex}>0{index + 1}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.saved} id="saved" aria-labelledby="saved-title">
        <div className={styles.savedCopy}>
          <p className={styles.eyebrow}>Instagram 아이디 기준으로</p>
          <h2 id="saved-title">보낼수록<br />역별로 쌓여요.</h2>
          <p>
            오늘 보낸 릴스도, 다음 주에 보낸 릴스도 같은 Instagram 계정의 보관함에 모여요.
            갈 역을 고르면 관련 영상만 바로 볼 수 있어요.
          </p>
          <ul>
            <li><ShieldCheck aria-hidden="true" size={18} /> 계정마다 분리된 개인 보관함</li>
            <li><TrainFront aria-hidden="true" size={18} /> 가까운 역별 자동 정리</li>
            <li><Video aria-hidden="true" size={18} /> 장소마다 원본 릴스 함께 보관</li>
          </ul>
        </div>

        <div className={styles.savedExample} aria-label="계정별 역 보관함 예시">
          <span className={styles.exampleLabel}>저장 흐름 예시</span>
          <div className={styles.accountRow}>
            <span className={styles.accountAvatar}>@</span>
            <div><small>Instagram 계정</small><strong>내 계정</strong></div>
            <span className={styles.privatePill}><ShieldCheck size={13} /> 나만의 보관함</span>
          </div>
          <div className={styles.reelRows}>
            <div><span>릴스 A</span><p><TrainFront size={15} /> 성수역</p></div>
            <div><span>릴스 B</span><p><TrainFront size={15} /> 강남역</p></div>
          </div>
          <div className={styles.flowArrow}><ArrowDown aria-hidden="true" size={18} /></div>
          <div className={styles.mapResult}>
            <div><LibraryBig aria-hidden="true" size={27} /><span><small>내 맛집 릴스</small><strong>역별 보관함 2개</strong></span></div>
            <div className={styles.pinRail} aria-hidden="true"><span>성수</span><span>강남</span></div>
          </div>
          <p className={styles.exampleNote}>역을 누르면 그 역과 관련된 영상만 크게 보여요.</p>
        </div>
      </section>

      <section className={styles.faq} id="faq" aria-labelledby="faq-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>자주 묻는 질문</p>
          <h2 id="faq-title">보내기 전에<br />확인해보세요.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((item) => (
            <details key={item.question}>
              <summary>{item.question}<span aria-hidden="true">+</span></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-title">
        <p className={styles.eyebrow}>다음 맛집 릴스부터</p>
        <h2 id="final-title">잊기 전에 보내세요.<br />찾을 때는 역만 고르면 돼요.</h2>
        <a
          className={styles.primaryAction}
          href={instagramProfile}
          target="_blank"
          rel="noreferrer"
          onClick={trackOpenInstagram}
        >
          <Send aria-hidden="true" size={20} />
          Instagram에서 matpin.kr 열기
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>
        <p><ShieldCheck aria-hidden="true" size={16} /> 개인 보관함 링크는 릴스를 보낸 계정의 DM으로 보내요. 링크를 다른 사람과 공유하지 마세요.</p>
      </section>

      <footer className={styles.footer}>
        <div><strong>matpin.kr</strong><span>맛집 릴스를 역별로.</span></div>
        <nav aria-label="맛핀 정책">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/data-deletion">데이터 삭제</Link>
        </nav>
      </footer>

      <div className={styles.mobileDock}>
        <a href={instagramProfile} target="_blank" rel="noreferrer" onClick={trackOpenInstagram}>
          <Send aria-hidden="true" size={19} />
          Instagram에서 matpin.kr 열기
          <ArrowUpRight aria-hidden="true" size={17} />
        </a>
      </div>
    </main>
  );
}
