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
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import base from "./matpin-css-3d-prototype.module.css";
import styles from "./matpin-advanced-motion-prototypes.module.css";

const instagramProfile = "https://www.instagram.com/matpin.kr/";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const range = (value: number, start: number, end: number) =>
  clamp((value - start) / Math.max(0.0001, end - start));
const lerp = (from: number, to: number, value: number) =>
  from + (to - from) * clamp(value);

type AdvancedMode =
  | "motion-scroll"
  | "prerendered-video"
  | "rive-state"
  | "spline-scene";

const prototypeCopy: Record<AdvancedMode, {
  experiment: string;
  technique: string;
  previousHref: string;
  previousLabel: string;
  finishDescription: string;
  limitation?: string;
}> = {
  "motion-scroll": {
    experiment: "모션 실험 03",
    technique: "Motion 스크롤",
    previousHref: "/matpin/motion-lab/compare-3-4",
    previousLabel: "3·4번 비교로 돌아가기",
    finishDescription: "Motion이 DOM 레이어의 위치와 투명도를 스크롤에 맞춰 직접 바꾸는 방식입니다.",
  },
  "prerendered-video": {
    experiment: "모션 실험 04",
    technique: "사전 렌더 영상",
    previousHref: "/matpin/motion-lab/compare-3-4",
    previousLabel: "3·4번 비교로 돌아가기",
    finishDescription: "실사와 릴스 이미지를 영상으로 미리 렌더하고, 스크롤 위치에 맞춰 영상 시간을 이동하는 방식입니다.",
  },
  "rive-state": {
    experiment: "모션 실험 05",
    technique: "Rive 상태 구조",
    previousHref: "/matpin/motion-lab/compare-5-6",
    previousLabel: "5·6번 비교로 돌아가기",
    finishDescription: "공유·확인·저장의 세 상태를 명확히 나누는 Rive 상태 머신용 동작 구조입니다.",
    limitation: "실제 .riv 파일 미연결 · 상태 전환 구조만 검증",
  },
  "spline-scene": {
    experiment: "모션 실험 06",
    technique: "Spline 장면 구조",
    previousHref: "/matpin/motion-lab/compare-5-6",
    previousLabel: "5·6번 비교로 돌아가기",
    finishDescription: "하나의 3D 장면에서 카메라가 릴스와 저장 결과 사이를 이동하는 Spline용 장면 구조입니다.",
    limitation: "실제 Spline 장면 미연결 · 카메라 동선만 검증",
  },
};

export function MatpinMotionScrollPrototype() {
  return <MatpinAdvancedMotionPrototype mode="motion-scroll" />;
}

export function MatpinPrerenderedVideoPrototype() {
  return <MatpinAdvancedMotionPrototype mode="prerendered-video" />;
}

export function MatpinRiveStatePrototype() {
  return <MatpinAdvancedMotionPrototype mode="rive-state" />;
}

export function MatpinSplineScenePrototype() {
  return <MatpinAdvancedMotionPrototype mode="spline-scene" />;
}

function MatpinAdvancedMotionPrototype({ mode }: { mode: AdvancedMode }) {
  const pageRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"share" | "analyze" | "saved">("share");
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ["start start", "end end"],
  });

  const progressScale = useTransform(scrollYProgress, (p) => Math.max(0.015, p));
  const womanOpacity = useTransform(scrollYProgress, (p) => lerp(1, 0.1, range(p, 0.2, 0.72)));
  const womanTransform = useTransform(scrollYProgress, (p) => {
    const camera = range(p, 0, 0.72);
    if (mode === "spline-scene") {
      return `translate3d(${lerp(-10, 8, camera)}px, ${lerp(-10, 14, camera)}px, -120px) scale(${lerp(1.08, 1.14, camera)}) rotateY(${lerp(-3, 4, camera)}deg)`;
    }
    return `translate3d(0, ${lerp(0, -18, camera)}px, -70px) scale(${lerp(1.03, 1.08, camera)})`;
  });
  const reelTransform = useTransform(scrollYProgress, (p) => {
    const middle = range(p, 0.24, 0.64);
    const finish = range(p, 0.64, 0.92);
    let x = lerp(43, 0, middle);
    let y = lerp(52, -6, middle);
    let z = lerp(10, 118, middle);
    let scale = lerp(0.72, 1.02, middle);
    let rotateY = lerp(-13, 0, middle);
    let rotateZ = lerp(-5, 0, middle);

    if (p > 0.64) {
      x = lerp(0, -109, finish);
      y = lerp(-6, 228, finish);
      z = lerp(118, 20, finish);
      scale = lerp(1.02, 0.41, finish);
      rotateY = lerp(0, -5, finish);
      rotateZ = lerp(0, -2, finish);
    }

    if (mode === "spline-scene") {
      rotateY += lerp(-5, 7, range(p, 0.1, 0.78));
      z += lerp(-20, 48, range(p, 0.18, 0.64));
    }

    return `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
  });
  const shareOpacity = useTransform(scrollYProgress, (p) => 1 - range(p, 0.12, 0.29));
  const shareTransform = useTransform(scrollYProgress, (p) => {
    const exit = range(p, 0.18, 0.36);
    return `translate3d(0, ${lerp(0, -16, exit)}px, 90px) scale(${lerp(1, 0.96, exit)})`;
  });
  const clueOpacity = useTransform(scrollYProgress, (p) =>
    range(p, 0.24, 0.39) * (1 - range(p, 0.55, 0.7)),
  );
  const clueCaptionTransform = useTransform(scrollYProgress, (p) => {
    const clue = range(p, 0.31, 0.58);
    return `translate3d(${lerp(-44, -12, clue)}px, ${lerp(-44, -14, clue)}px, ${lerp(36, 92, clue)}px) rotateZ(${lerp(-7, -2, clue)}deg)`;
  });
  const clueCommentTransform = useTransform(scrollYProgress, (p) => {
    const clue = range(p, 0.31, 0.58);
    return `translate3d(${lerp(52, 18, clue)}px, ${lerp(-12, 4, clue)}px, ${lerp(28, 88, clue)}px) rotateZ(${lerp(8, 2, clue)}deg)`;
  });
  const clueVideoTransform = useTransform(scrollYProgress, (p) => {
    const clue = range(p, 0.31, 0.58);
    return `translate3d(${lerp(-28, -8, clue)}px, ${lerp(46, 20, clue)}px, ${lerp(18, 82, clue)}px) rotateZ(${lerp(-5, -1, clue)}deg)`;
  });
  const stationOpacity = useTransform(scrollYProgress, (p) => range(p, 0.66, 0.83));
  const stationTransform = useTransform(scrollYProgress, (p) => {
    const enter = range(p, 0.66, 0.83);
    return `translate3d(0, ${lerp(34, 0, enter)}px, -10px) scale(${lerp(0.96, 1, enter)})`;
  });
  const copyOneOpacity = useTransform(scrollYProgress, (p) => 1 - range(p, 0.18, 0.36));
  const copyTwoOpacity = useTransform(scrollYProgress, (p) =>
    range(p, 0.24, 0.39) * (1 - range(p, 0.55, 0.7)),
  );
  const copyThreeOpacity = useTransform(scrollYProgress, (p) => range(p, 0.66, 0.83));
  const hintOpacity = useTransform(scrollYProgress, (p) => 1 - range(p, 0.02, 0.16));

  useEffect(() => {
    if (pageRef.current) pageRef.current.dataset.enhanced = "true";
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const nextState = progress < 0.28 ? "share" : progress < 0.7 ? "analyze" : "saved";
    setState((current) => current === nextState ? current : nextState);

    if (mode === "prerendered-video") {
      const video = videoRef.current;
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(video.duration - 0.02, progress * video.duration);
      }
    }
  });

  const moveToBeat = (progress: number) => {
    const story = storyRef.current;
    if (!story) return;
    const travel = Math.max(1, story.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: window.scrollY + story.getBoundingClientRect().top + travel * progress,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const stateMode = mode === "rive-state";
  const videoMode = mode === "prerendered-video";

  return (
    <main
      ref={pageRef}
      className={`${base.page} ${styles.page}`}
      data-enhanced="false"
      data-advanced-mode={mode}
      data-state={state}
    >
      <div className={base.desktopBackdrop} aria-hidden="true" />
      <div className={base.fallbackStory}><FallbackContent /></div>

      <section
        ref={storyRef}
        className={base.story}
        aria-label="맛핀이 릴스를 역별로 정리하는 과정"
        data-motion-story
      >
        <div className={base.stage}>
          <header className={base.header}>
            <Link href={prototypeCopy[mode].previousHref} aria-label={prototypeCopy[mode].previousLabel}>
              <ArrowLeft aria-hidden="true" size={20} />
            </Link>
            <span><b>{prototypeCopy[mode].experiment}</b>{prototypeCopy[mode].technique}</span>
            <a href={instagramProfile} target="_blank" rel="noreferrer" aria-label="Instagram에서 matpin.kr 열기">
              <Send aria-hidden="true" size={18} />
            </a>
          </header>

          {prototypeCopy[mode].limitation ? (
            <div className={styles.engineNotice}>{prototypeCopy[mode].limitation}</div>
          ) : null}

          <div className={base.progressTrack} aria-hidden="true">
            <motion.div style={{ scaleX: progressScale }} />
          </div>

          <div className={`${base.perspective} ${styles.scene}`}>
            {videoMode ? (
              <video
                ref={videoRef}
                className={styles.videoLayer}
                src="/videos/matpin/matpin-prerendered-scene.mp4"
                poster="/videos/matpin/matpin-prerendered-poster.jpg"
                muted
                playsInline
                preload="auto"
                aria-label="여성과 릴스 이미지를 미리 렌더한 스크롤 영상"
                onLoadedMetadata={(event) => {
                  event.currentTarget.currentTime = scrollYProgress.get() * event.currentTarget.duration;
                }}
              />
            ) : (
              <>
                <motion.div className={base.womanLayer} aria-hidden="true" style={stateMode ? undefined : { opacity: womanOpacity, transform: womanTransform }}>
                  <Image src="/images/ads/matpin-woman-ad-original.png" alt="" fill priority sizes="(max-width: 520px) 100vw, 480px" />
                </motion.div>
                <motion.div className={base.reelCard} style={stateMode ? undefined : { transform: reelTransform }}>
                  <Image src="/images/matpick/yeoksam-sanjang-reel.jpg" alt="강남에서 줄 서는 껍데기 삼겹살 릴스" fill priority sizes="220px" />
                  <span className={base.reelShade} aria-hidden="true" />
                  <span className={base.playBadge} aria-hidden="true"><Play fill="currentColor" size={17} /></span>
                  <span className={base.reelOwner}>@food.zip</span>
                </motion.div>
              </>
            )}

            <motion.div className={base.shareCard} style={stateMode ? undefined : { opacity: shareOpacity, transform: shareTransform }}>
              <span><Send aria-hidden="true" size={17} /></span>
              <div><small>공유 대상</small><b>matpin.kr</b></div>
              <Check aria-hidden="true" size={17} />
            </motion.div>

            <motion.div className={`${base.clue} ${base.clueCaption}`} style={stateMode ? undefined : { opacity: clueOpacity, transform: clueCaptionTransform }}>
              <Captions aria-hidden="true" size={17} /><span><small>캡션</small><b>역삼동 · 삼겹살</b></span>
            </motion.div>
            <motion.div className={`${base.clue} ${base.clueComment}`} style={stateMode ? undefined : { opacity: clueOpacity, transform: clueCommentTransform }}>
              <MessageCircleMore aria-hidden="true" size={17} /><span><small>작성자 댓글</small><b>산장가든</b></span>
            </motion.div>
            <motion.div className={`${base.clue} ${base.clueVideo}`} style={stateMode ? undefined : { opacity: clueOpacity, transform: clueVideoTransform }}>
              <Video aria-hidden="true" size={17} /><span><small>영상 단서</small><b>역삼역 4번 출구</b></span>
            </motion.div>

            <motion.div className={base.stationPanel} style={stateMode ? undefined : { opacity: stationOpacity, transform: stationTransform }}>
              <div className={base.stationHeading}>
                <span><TrainFront aria-hidden="true" size={16} /> 가까운 역</span>
                <h3>역삼역</h3>
                <small>저장한 영상 1개</small>
              </div>
              <div className={base.stationRail}>
                <span className={`${base.savedSlot} ${styles.savedSlot}`}>
                  <Image src="/images/matpick/yeoksam-sanjang-reel.jpg" alt="저장된 산장가든 릴스" fill sizes="104px" />
                </span>
              </div>
            </motion.div>

            <motion.div className={`${base.copy} ${styles.copyOne}`} style={stateMode ? undefined : { opacity: copyOneOpacity }}>
              <p>Instagram에서 보던 그 자리에서</p><h1>릴스는<br />보내기만 하세요.</h1><span>공유 대상을 matpin.kr로 고르면 시작돼요.</span>
            </motion.div>
            <motion.div className={`${base.copy} ${base.copyTwo} ${styles.copyTwo}`} style={stateMode ? undefined : { opacity: copyTwoOpacity }}>
              <p>캡션 · 댓글 · 영상 단서</p><h2>장소를 확인하고</h2><span>확인할 수 있는 정보만 한곳에 모아요.</span>
            </motion.div>
            <motion.div className={`${base.copy} ${base.copyThree} ${styles.copyThree}`} style={stateMode ? undefined : { opacity: copyThreeOpacity }}>
              <p>Instagram 아이디 기준으로</p><h2>역별 보관함에<br />차곡차곡.</h2><span>역을 누르면 저장한 원본 릴스를 바로 볼 수 있어요.</span>
            </motion.div>
          </div>

          <nav className={base.beatNav} aria-label="장면 바로가기">
            <button type="button" onClick={() => moveToBeat(0.04)}><span>1</span>보내기</button>
            <button type="button" onClick={() => moveToBeat(0.46)}><span>2</span>장소 확인</button>
            <button type="button" onClick={() => moveToBeat(0.93)}><span>3</span>역별 저장</button>
          </nav>

          <motion.div className={base.scrollHint} style={stateMode ? undefined : { opacity: hintOpacity }} aria-hidden="true">
            <span /> 아래로 스크롤
          </motion.div>
        </div>
      </section>

      <section className={base.finish} aria-labelledby={`${mode}-finish-title`}>
        <span>{prototypeCopy[mode].experiment}</span>
        <h2 id={`${mode}-finish-title`}>같은 릴스가<br />역별 보관함까지 이어졌어요.</h2>
        <p>{prototypeCopy[mode].finishDescription} 현재 맛핀 랜딩에는 아직 적용하지 않았습니다.</p>
        <a href={instagramProfile} target="_blank" rel="noreferrer"><Send aria-hidden="true" size={18} /> Instagram에서 matpin.kr 열기</a>
        <Link href={prototypeCopy[mode].previousHref}>비교 화면으로 돌아가기</Link>
      </section>
    </main>
  );
}

function FallbackContent() {
  return (
    <div className={base.fallbackInner}>
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
