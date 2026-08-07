"use client";

import {
  ArrowLeft,
  Captions,
  Check,
  MessageCircleMore,
  Play,
  Send,
  TrainFront,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./matpin-css-3d-prototype.module.css";

const instagramProfile = "https://www.instagram.com/matpin.kr/";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const range = (progress: number, start: number, end: number) =>
  clamp((progress - start) / Math.max(0.0001, end - start));

const mix = (from: number, to: number, progress: number) =>
  lerp(from, to, clamp(progress));

type MotionRefs = {
  woman: HTMLDivElement | null;
  reel: HTMLDivElement | null;
  share: HTMLDivElement | null;
  clueCaption: HTMLDivElement | null;
  clueComment: HTMLDivElement | null;
  clueVideo: HTMLDivElement | null;
  station: HTMLDivElement | null;
  copyOne: HTMLDivElement | null;
  copyTwo: HTMLDivElement | null;
  copyThree: HTMLDivElement | null;
  hint: HTMLDivElement | null;
  progress: HTMLDivElement | null;
};

type MotionMode = "css-3d" | "parallax-2-5d";

const prototypeCopy: Record<MotionMode, {
  experiment: string;
  technique: string;
  previousHref: string;
  previousLabel: string;
  finishLabel: string;
  finishDescription: string;
}> = {
  "css-3d": {
    experiment: "모션 실험 01",
    technique: "CSS 3D",
    previousHref: "/matpin",
    previousLabel: "맛핀으로 돌아가기",
    finishLabel: "CSS 3D 프로토타입 01",
    finishDescription: "원근과 회전을 사용해 릴스가 화면 앞으로 나오는 방식입니다.",
  },
  "parallax-2-5d": {
    experiment: "모션 실험 02",
    technique: "2.5D 패럴랙스",
    previousHref: "/matpin/motion-lab/css-3d",
    previousLabel: "CSS 3D 실험으로 돌아가기",
    finishLabel: "2.5D 패럴랙스 프로토타입 02",
    finishDescription: "회전 없이 배경·릴스·단서의 이동 속도 차이로 깊이를 만드는 방식입니다.",
  },
};

function applyOpacity(element: HTMLElement | null, value: number) {
  if (element) element.style.opacity = String(clamp(value));
}

export function MatpinCss3dPrototype() {
  return <MatpinMotionPrototype mode="css-3d" />;
}

export function MatpinParallaxPrototype() {
  return <MatpinMotionPrototype mode="parallax-2-5d" />;
}

function MatpinMotionPrototype({ mode }: { mode: MotionMode }) {
  const pageRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const refs = useRef<MotionRefs>({
    woman: null,
    reel: null,
    share: null,
    clueCaption: null,
    clueComment: null,
    clueVideo: null,
    station: null,
    copyOne: null,
    copyTwo: null,
    copyThree: null,
    hint: null,
    progress: null,
  });

  useEffect(() => {
    const page = pageRef.current;
    const story = storyRef.current;
    if (!page || !story) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = true;

    page.dataset.enhanced = "true";

    const readProgress = () => {
      const rect = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      return clamp(-rect.top / travel);
    };

    const render = () => {
      frame = 0;
      if (!visible || media.matches) return;

      const progress = readProgress();
      const firstExit = range(progress, 0.18, 0.36);
      const analysisEnter = range(progress, 0.24, 0.39);
      const analysisExit = range(progress, 0.55, 0.7);
      const savedEnter = range(progress, 0.66, 0.83);
      const middle = range(progress, 0.24, 0.64);
      const finish = range(progress, 0.64, 0.92);
      const clues = range(progress, 0.31, 0.58);
      const stageWidth = Math.min(window.innerWidth, 520);
      const stageHeight = Math.max(window.innerHeight, 620);
      const savedX = 86 - stageWidth / 2;
      const savedY = stageHeight * 0.354 - 70;
      const savedScale = 0.41;

      if (refs.current.woman) {
        refs.current.woman.style.opacity = String(mix(1, 0.1, range(progress, 0.2, 0.72)));
        refs.current.woman.style.transform = mode === "css-3d"
          ? `translate3d(0, ${mix(0, -18, range(progress, 0, 0.62))}px, -90px) scale(${mix(1.03, 1.08, range(progress, 0, 0.62))})`
          : `translate3d(0, ${mix(-8, 8, range(progress, 0, 0.72))}px, 0) scale(${mix(1.02, 1.04, range(progress, 0, 0.72))})`;
      }

      if (refs.current.reel) {
        let x = mix(mode === "css-3d" ? 43 : 18, 0, middle);
        let y = mix(52, -6, middle);
        let z = mode === "css-3d" ? mix(10, 128, middle) : 0;
        let scale = mix(mode === "css-3d" ? 0.72 : 0.82, 1.02, middle);
        let rotateY = mode === "css-3d" ? mix(-13, 0, middle) : 0;
        let rotateZ = mode === "css-3d" ? mix(-5, 0, middle) : 0;

        if (progress > 0.64) {
          x = mix(0, savedX, finish);
          y = mix(-6, savedY, finish);
          z = mode === "css-3d" ? mix(128, 24, finish) : 0;
          scale = mix(1.02, savedScale, finish);
          rotateY = mode === "css-3d" ? mix(0, -5, finish) : 0;
          rotateZ = mode === "css-3d" ? mix(0, -2, finish) : 0;
        }

        refs.current.reel.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
      }

      if (refs.current.share) {
        refs.current.share.style.opacity = String(1 - range(progress, 0.12, 0.29));
        refs.current.share.style.transform = mode === "css-3d"
          ? `translate3d(0, ${mix(0, -16, firstExit)}px, 90px) scale(${mix(1, 0.96, firstExit)})`
          : `translate3d(0, ${mix(12, -20, firstExit)}px, 0) scale(${mix(1, 0.96, firstExit)})`;
      }

      const clueOpacity = analysisEnter * (1 - analysisExit);
      applyOpacity(refs.current.clueCaption, clueOpacity);
      applyOpacity(refs.current.clueComment, clueOpacity);
      applyOpacity(refs.current.clueVideo, clueOpacity);

      if (refs.current.clueCaption) {
        refs.current.clueCaption.style.transform = mode === "css-3d"
          ? `translate3d(${mix(-44, -12, clues)}px, ${mix(-44, -14, clues)}px, ${mix(36, 92, clues)}px) rotateZ(${mix(-7, -2, clues)}deg)`
          : `translate3d(${mix(-72, -16, clues)}px, ${mix(-38, -10, clues)}px, 0)`;
      }
      if (refs.current.clueComment) {
        refs.current.clueComment.style.transform = mode === "css-3d"
          ? `translate3d(${mix(52, 18, clues)}px, ${mix(-12, 4, clues)}px, ${mix(28, 88, clues)}px) rotateZ(${mix(8, 2, clues)}deg)`
          : `translate3d(${mix(76, 18, clues)}px, ${mix(-8, 4, clues)}px, 0)`;
      }
      if (refs.current.clueVideo) {
        refs.current.clueVideo.style.transform = mode === "css-3d"
          ? `translate3d(${mix(-28, -8, clues)}px, ${mix(46, 20, clues)}px, ${mix(18, 82, clues)}px) rotateZ(${mix(-5, -1, clues)}deg)`
          : `translate3d(${mix(-56, -10, clues)}px, ${mix(62, 22, clues)}px, 0)`;
      }

      if (refs.current.station) {
        refs.current.station.style.opacity = String(savedEnter);
        refs.current.station.style.transform = mode === "css-3d"
          ? `translate3d(0, ${mix(34, 0, savedEnter)}px, -10px) scale(${mix(0.96, 1, savedEnter)})`
          : `translate3d(0, ${mix(46, 0, savedEnter)}px, 0) scale(${mix(0.98, 1, savedEnter)})`;
      }

      applyOpacity(refs.current.copyOne, 1 - firstExit);
      applyOpacity(refs.current.copyTwo, analysisEnter * (1 - analysisExit));
      applyOpacity(refs.current.copyThree, savedEnter);
      applyOpacity(refs.current.hint, 1 - range(progress, 0.02, 0.16));

      if (refs.current.progress) {
        refs.current.progress.style.transform = `scaleX(${Math.max(0.015, progress)})`;
      }
    };

    const requestRender = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) requestRender();
      },
      { rootMargin: "100% 0px" },
    );

    observer.observe(story);
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    requestRender();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      if (frame) window.cancelAnimationFrame(frame);
      delete page.dataset.enhanced;
    };
  }, [mode]);

  const moveToBeat = (progress: number) => {
    const story = storyRef.current;
    if (!story) return;
    const travel = Math.max(1, story.offsetHeight - window.innerHeight);
    const top = window.scrollY + story.getBoundingClientRect().top + travel * progress;
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <main ref={pageRef} className={styles.page} data-enhanced="false" data-mode={mode}>
      <div className={styles.desktopBackdrop} aria-hidden="true" />

      <div className={styles.fallbackStory}>
        <FallbackContent />
      </div>

      <section
        ref={storyRef}
        className={styles.story}
        aria-label="맛핀이 릴스를 역별로 정리하는 과정"
        data-motion-story
      >
        <div className={styles.stage}>
          <header className={styles.header}>
            <Link href={prototypeCopy[mode].previousHref} aria-label={prototypeCopy[mode].previousLabel}><ArrowLeft aria-hidden="true" size={20} /></Link>
            <span><b>{prototypeCopy[mode].experiment}</b> {prototypeCopy[mode].technique}</span>
            <a href={instagramProfile} target="_blank" rel="noreferrer" aria-label="Instagram에서 matpin.kr 열기">
              <Send aria-hidden="true" size={18} />
            </a>
          </header>

          <div className={styles.progressTrack} aria-hidden="true">
            <div ref={(node) => { refs.current.progress = node; }} />
          </div>

          <div className={styles.perspective}>
            <div
              ref={(node) => { refs.current.woman = node; }}
              className={styles.womanLayer}
              aria-hidden="true"
            >
              <Image
                src="/images/ads/matpin-woman-ad-original.png"
                alt=""
                fill
                priority
                sizes="(max-width: 520px) 100vw, 480px"
              />
            </div>

            <div ref={(node) => { refs.current.reel = node; }} className={styles.reelCard}>
              <Image
                src="/images/matpick/yeoksam-sanjang-reel.jpg"
                alt="강남에서 줄 서는 껍데기 삼겹살 릴스"
                fill
                priority
                sizes="220px"
              />
              <span className={styles.reelShade} aria-hidden="true" />
              <span className={styles.playBadge} aria-hidden="true"><Play fill="currentColor" size={17} /></span>
              <span className={styles.reelOwner}>@food.zip</span>
            </div>

            <div ref={(node) => { refs.current.share = node; }} className={styles.shareCard}>
              <span><Send aria-hidden="true" size={17} /></span>
              <div><small>공유 대상</small><b>matpin.kr</b></div>
              <Check aria-hidden="true" size={17} />
            </div>

            <div ref={(node) => { refs.current.clueCaption = node; }} className={`${styles.clue} ${styles.clueCaption}`}>
              <Captions aria-hidden="true" size={17} /><span><small>캡션</small><b>역삼동 · 삼겹살</b></span>
            </div>
            <div ref={(node) => { refs.current.clueComment = node; }} className={`${styles.clue} ${styles.clueComment}`}>
              <MessageCircleMore aria-hidden="true" size={17} /><span><small>작성자 댓글</small><b>산장가든</b></span>
            </div>
            <div ref={(node) => { refs.current.clueVideo = node; }} className={`${styles.clue} ${styles.clueVideo}`}>
              <Video aria-hidden="true" size={17} /><span><small>영상 단서</small><b>역삼역 4번 출구</b></span>
            </div>

            <div ref={(node) => { refs.current.station = node; }} className={styles.stationPanel}>
              <div className={styles.stationHeading}>
                <span><TrainFront aria-hidden="true" size={16} /> 가까운 역</span>
                <h3>역삼역</h3>
                <small>저장한 영상 1개</small>
              </div>
              <div className={styles.stationRail} aria-hidden="true">
                <span className={styles.savedSlot} />
              </div>
            </div>

            <div ref={(node) => { refs.current.copyOne = node; }} className={`${styles.copy} ${styles.copyOne}`}>
              <p>Instagram에서 보던 그 자리에서</p>
              <h1>릴스는<br />보내기만 하세요.</h1>
              <span>공유 대상을 matpin.kr로 고르면 시작돼요.</span>
            </div>
            <div ref={(node) => { refs.current.copyTwo = node; }} className={`${styles.copy} ${styles.copyTwo}`}>
              <p>캡션 · 댓글 · 영상 단서</p>
              <h2>장소를 확인하고</h2>
              <span>확인할 수 있는 정보만 한곳에 모아요.</span>
            </div>
            <div ref={(node) => { refs.current.copyThree = node; }} className={`${styles.copy} ${styles.copyThree}`}>
              <p>Instagram 아이디 기준으로</p>
              <h2>역별 보관함에<br />차곡차곡.</h2>
              <span>역을 누르면 저장한 원본 릴스를 바로 볼 수 있어요.</span>
            </div>
          </div>

          <nav className={styles.beatNav} aria-label="장면 바로가기">
            <button type="button" onClick={() => moveToBeat(0.04)}><span>1</span>보내기</button>
            <button type="button" onClick={() => moveToBeat(0.46)}><span>2</span>장소 확인</button>
            <button type="button" onClick={() => moveToBeat(0.93)}><span>3</span>역별 저장</button>
          </nav>

          <div ref={(node) => { refs.current.hint = node; }} className={styles.scrollHint} aria-hidden="true">
            <span /> 아래로 스크롤
          </div>
        </div>
      </section>

      <section className={styles.finish} aria-labelledby="prototype-finish-title">
        <span>{prototypeCopy[mode].finishLabel}</span>
        <h2 id="prototype-finish-title">같은 릴스가<br />역별 보관함까지 이어졌어요.</h2>
        <p>{prototypeCopy[mode].finishDescription} 현재 맛핀 랜딩에는 아직 적용하지 않았습니다.</p>
        <a href={instagramProfile} target="_blank" rel="noreferrer"><Send aria-hidden="true" size={18} /> Instagram에서 matpin.kr 열기</a>
        <Link href="/matpin">현재 맛핀으로 돌아가기</Link>
      </section>
    </main>
  );
}

function FallbackContent() {
  return (
    <div className={styles.fallbackInner}>
      <b>matpin.kr</b>
      <h1>릴스를 보내면<br />역별로 모아둘게요.</h1>
      <ol>
        <li><Send aria-hidden="true" size={20} /><span><b>릴스 보내기</b><small>Instagram에서 matpin.kr로 공유해요.</small></span></li>
        <li><Captions aria-hidden="true" size={20} /><span><b>장소 확인</b><small>캡션·댓글·영상에서 장소를 확인해요.</small></span></li>
        <li><TrainFront aria-hidden="true" size={20} /><span><b>역별 저장</b><small>같은 계정의 역별 보관함에 저장해요.</small></span></li>
      </ol>
      <a href={instagramProfile} target="_blank" rel="noreferrer">Instagram에서 matpin.kr 열기</a>
    </div>
  );
}
