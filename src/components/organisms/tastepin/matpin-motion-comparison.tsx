"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./matpin-motion-comparison.module.css";

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

const prototypeSets = {
  "1-2": [
  {
    id: "css-3d",
    number: "01",
    name: "CSS 3D",
    summary: "원근과 회전",
    href: "/matpin/motion-lab/css-3d",
  },
  {
    id: "parallax-2-5d",
    number: "02",
    name: "2.5D 패럴랙스",
    summary: "레이어 속도 차이",
    href: "/matpin/motion-lab/parallax-2-5d",
  },
  ],
  "3-4": [
    {
      id: "motion-scroll",
      number: "03",
      name: "Motion 스크롤",
      summary: "DOM 장면 연출",
      href: "/matpin/motion-lab/motion-scroll",
    },
    {
      id: "prerendered-video",
      number: "04",
      name: "사전 렌더 영상",
      summary: "영상 프레임 스크럽",
      href: "/matpin/motion-lab/prerendered-video",
    },
  ],
  "5-6": [
    {
      id: "rive-state",
      number: "05",
      name: "Rive 상태 구조",
      summary: ".riv 미연결",
      href: "/matpin/motion-lab/rive-state",
    },
    {
      id: "spline-scene",
      number: "06",
      name: "Spline 장면 구조",
      summary: "장면 원본 미연결",
      href: "/matpin/motion-lab/spline-scene",
    },
  ],
  "5-3-1": [
    {
      id: "rive-state",
      number: "05",
      name: "Rive 상태 구조",
      summary: "고정 상태 전환",
      href: "/matpin/motion-lab/rive-state",
    },
    {
      id: "motion-scroll",
      number: "03",
      name: "Motion 스크롤",
      summary: "DOM 장면 연출",
      href: "/matpin/motion-lab/motion-scroll",
    },
    {
      id: "css-3d",
      number: "01",
      name: "CSS 3D",
      summary: "원근과 회전",
      href: "/matpin/motion-lab/css-3d",
    },
  ],
} as const;

type SetId = keyof typeof prototypeSets;
type Prototype = (typeof prototypeSets)[SetId][number];

type PrototypeId = Prototype["id"];

const beats = [
  { label: "보내기", progress: 0.04 },
  { label: "장소 확인", progress: 0.46 },
  { label: "역별 저장", progress: 0.93 },
] as const;

function getScrollProgress(frame: HTMLIFrameElement) {
  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  if (!frameWindow || !frameDocument) return 0;

  const story = frameDocument.querySelector<HTMLElement>("[data-motion-story]");
  if (!story) return 0;

  const travel = Math.max(1, story.offsetHeight - frameWindow.innerHeight);
  return Math.min(
    1,
    Math.max(0, (frameWindow.scrollY - story.offsetTop) / travel),
  );
}

function scrollFrame(frame: HTMLIFrameElement, progress: number) {
  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  if (!frameWindow || !frameDocument) return;

  const story = frameDocument.querySelector<HTMLElement>("[data-motion-story]");
  if (!story) return;

  const travel = Math.max(1, story.offsetHeight - frameWindow.innerHeight);
  frameWindow.scrollTo({
    top: story.offsetTop + travel * progress,
    behavior: "auto",
  });
}

function ScaledPrototype({
  prototype,
  onReady,
}: {
  prototype: Prototype;
  onReady: (id: PrototypeId, frame: HTMLIFrameElement) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resize = () => {
      const nextScale = Math.min(
        1,
        host.clientWidth / PHONE_WIDTH,
        host.clientHeight / PHONE_HEIGHT,
      );
      setScale(Math.max(0.1, nextScale));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const register = () => onReady(prototype.id, frame);
    frame.addEventListener("load", register);
    register();
    return () => frame.removeEventListener("load", register);
  }, [onReady, prototype.id]);

  const canvasStyle = {
    "--phone-scale": scale,
    width: PHONE_WIDTH * scale,
    height: PHONE_HEIGHT * scale,
  } as CSSProperties;

  return (
    <article className={styles.prototypePanel} aria-label={`${prototype.name} 프로토타입`}>
      <header className={styles.prototypeHeader}>
        <div>
          <span>{prototype.number}</span>
          <strong>{prototype.name}</strong>
          <small>{prototype.summary}</small>
        </div>
        <Link href={prototype.href} aria-label={`${prototype.name} 단독으로 열기`}>
          <span>단독 보기</span>
          <ExternalLink aria-hidden="true" size={15} strokeWidth={1.9} />
        </Link>
      </header>

      <div className={styles.prototypeHost} ref={hostRef}>
        <div className={styles.phoneCanvas} style={canvasStyle}>
          <iframe
            ref={frameRef}
            className={styles.prototypeFrame}
            src={prototype.href}
            title={`${prototype.name} 맛핀 모션 프로토타입`}
            width={PHONE_WIDTH}
            height={PHONE_HEIGHT}
            loading="eager"
          />
        </div>
      </div>
    </article>
  );
}

function MatpinMotionSetComparison({ setId }: { setId: SetId }) {
  const prototypes = prototypeSets[setId];
  const framesRef = useRef<Partial<Record<PrototypeId, HTMLIFrameElement>>>({});
  const cleanupRef = useRef<Partial<Record<PrototypeId, () => void>>>({});
  const synchronizingRef = useRef(false);
  const releaseFrameRef = useRef<number>(0);
  const progressRef = useRef(0.04);
  const [progress, setProgress] = useState(0.04);
  const [reducedMotion, setReducedMotion] = useState(false);

  const releaseSyncLock = useCallback(() => {
    if (releaseFrameRef.current) cancelAnimationFrame(releaseFrameRef.current);
    releaseFrameRef.current = requestAnimationFrame(() => {
      releaseFrameRef.current = requestAnimationFrame(() => {
        synchronizingRef.current = false;
      });
    });
  }, []);

  const moveAll = useCallback((nextProgress: number) => {
    const bounded = Math.min(1, Math.max(0, nextProgress));
    progressRef.current = bounded;
    setProgress(bounded);
    synchronizingRef.current = true;
    Object.values(framesRef.current).forEach((frame) => {
      if (frame) scrollFrame(frame, bounded);
    });
    releaseSyncLock();
  }, [releaseSyncLock]);

  const registerFrame = useCallback((id: PrototypeId, frame: HTMLIFrameElement) => {
    cleanupRef.current[id]?.();
    framesRef.current[id] = frame;

    const frameWindow = frame.contentWindow;
    if (!frameWindow) return;

    scrollFrame(frame, progressRef.current);

    const handleScroll = () => {
      if (synchronizingRef.current) return;

      const nextProgress = getScrollProgress(frame);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      synchronizingRef.current = true;

      Object.entries(framesRef.current).forEach(([otherId, otherFrame]) => {
        if (otherId !== id && otherFrame) scrollFrame(otherFrame, nextProgress);
      });
      releaseSyncLock();
    };

    frameWindow.addEventListener("scroll", handleScroll, { passive: true });
    cleanupRef.current[id] = () => {
      frameWindow.removeEventListener("scroll", handleScroll);
    };
  }, [releaseSyncLock]);

  useEffect(() => () => {
    Object.values(cleanupRef.current).forEach((cleanup) => cleanup?.());
    if (releaseFrameRef.current) cancelAnimationFrame(releaseFrameRef.current);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const activeBeat = progress < 0.25 ? 0 : progress < 0.7 ? 1 : 2;
  const isTriple = prototypes.length === 3;
  const hasStructuralPrototype = prototypes.some(
    (prototype) => prototype.id === "rive-state" || prototype.id === "spline-scene",
  );
  const heading = isTriple
    ? "05 · 03 · 01 동시에 비교"
    : setId === "1-2"
      ? "같은 장면으로 비교해보세요."
      : `${prototypes[0].number} · ${prototypes[1].number} 나란히 비교`;

  return (
    <main className={`${styles.page} ${hasStructuralPrototype ? styles.hasRuntimeNotice : ""}`}>
      <header className={styles.pageHeader}>
        <Link href="/matpin" className={styles.backLink} aria-label="맛핀으로 돌아가기">
          <ArrowLeft aria-hidden="true" size={20} strokeWidth={2} />
        </Link>
        <div className={styles.heading}>
          <span>MATPIN MOTION LAB</span>
          <h1>{heading}</h1>
        </div>
        <div className={styles.syncStatus} aria-live="polite">
          <span aria-hidden="true" />
          {reducedMotion ? "정적 비교" : `${Math.round(progress * 100)}% 동기화`}
        </div>
      </header>

      {hasStructuralPrototype ? (
        <p className={styles.runtimeNotice}>
          05는 실제 .riv 파일 대신 고정 상태 전환 구조를 비교합니다.
        </p>
      ) : null}

      <section
        className={styles.compareGrid}
        data-columns={prototypes.length}
        aria-label={`${prototypes.length}개 맛핀 모션 프로토타입 비교`}
      >
        {prototypes.map((prototype) => (
          <ScaledPrototype
            key={prototype.id}
            prototype={prototype}
            onReady={registerFrame}
          />
        ))}
      </section>

      <section className={styles.controls} aria-label={`${prototypes.length}개 프로토타입 함께 움직이기`}>
        <div className={styles.controlTitle}>
          <strong>{reducedMotion ? "모션 최소화가 켜져 있어요" : `${prototypes.length}개 화면 같이 움직이기`}</strong>
          <span>{reducedMotion ? "각 방식을 정적인 세 단계로 보여드려요." : "한 화면을 직접 스크롤해도 나머지가 따라가요."}</span>
        </div>
        <label className={styles.scrubber}>
          <span className={styles.srOnly}>{prototypes.length}개 프로토타입 진행률</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(progress * 100)}
            disabled={reducedMotion}
            onChange={(event) => moveAll(Number(event.currentTarget.value) / 100)}
          />
        </label>
        <nav className={styles.beats} aria-label="비교할 장면 선택">
          {beats.map((beat, index) => (
            <button
              key={beat.label}
              type="button"
              disabled={reducedMotion}
              aria-current={activeBeat === index ? "step" : undefined}
              onClick={() => moveAll(beat.progress)}
            >
              <span>{index + 1}</span>
              {beat.label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

export function MatpinMotionComparison() {
  return <MatpinMotionSetComparison setId="1-2" />;
}

export function MatpinMotionComparison34() {
  return <MatpinMotionSetComparison setId="3-4" />;
}

export function MatpinMotionComparison56() {
  return <MatpinMotionSetComparison setId="5-6" />;
}

export function MatpinMotionComparison531() {
  return <MatpinMotionSetComparison setId="5-3-1" />;
}
