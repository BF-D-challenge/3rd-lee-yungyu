"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Clock3, RotateCcw, Sparkles, Utensils, Video } from "lucide-react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import {
  getMvpResumeState,
  loadLastMvpApp,
  saveLastMvpApp,
  type MvpAppId,
  type MvpResumeState,
} from "@/lib/mvp-resume-state";
import styles from "./mvp-lab.module.css";

type LabKind = "hub" | "tastepin" | "onebite" | "idea-fit";

const exampleIdeas = (interest: string, time: string) => [
  { title: `${interest}에서 반복되는 일을 한 번에 남기는 카드`, first: `${time} 안에 기록 화면 한 장을 만들어 한 사람에게 써보게 하기` },
  { title: `${interest} 약속을 놓치지 않게 하는 한 번의 확인`, first: "친구 한 명과 알림 한 번을 주고받는 흐름만 만들기" },
  { title: `${interest} 정보를 다시 찾지 않게 하는 짧은 보관함`, first: "자주 찾는 정보 세 개만 저장하고 다시 찾는지 보기" },
];

const supportedVideoUrl = (value: string): boolean => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ["instagram.com", "tiktok.com", "youtube.com"].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    ) || host === "youtu.be";
  } catch {
    return false;
  }
};

function Shell({ children }: { children: React.ReactNode }) {
  return <main className={styles.page}>{children}</main>;
}

function Header({ active }: { active?: string }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="실험 허브로 이동">오늘 해볼까</Link>
      {active ? <span className={styles.badge}>{active}</span> : null}
    </header>
  );
}

function OptionalLogin() {
  return (
    <section className={styles.loginBox} aria-label="선택적 로그인">
      <p><strong>결과는 로그인 없이 볼 수 있어요.</strong><br />계정을 연결하면 공통 로그인 상태로 이 서비스를 다시 이용할 수 있어요.</p>
      <GoogleLoginButton
        context="creator"
        label="계정 연결하기"
        onAuthenticated={() => undefined}
      />
    </section>
  );
}

export function MvpLab({ kind }: { kind: LabKind }) {
  if (kind === "hub") return <Hub />;
  if (kind === "tastepin") return <Tastepin />;
  if (kind === "onebite") return <Onebite />;
  return <IdeaFit />;
}

function Hub() {
  const cards = [
    {
      id: "matpick" as const,
      href: "/matpick",
      image: "/images/experiment-gallery/matpick.jpg",
      imageAlt: "맛핀 화면. 강남역과 역삼역 주변 맛집을 원본 영상과 함께 보는 저장함",
      label: "맛핀",
      input: "Instagram에서 모은 맛집",
      output: "장소 확인·원본 영상 저장",
      title: "릴스를 보내고 맛집으로 다시 찾아요.",
      cta: "릴스 저장 시작하기",
      tone: "#4285f4",
    },
    {
      id: "onebite" as const,
      href: "/onebite",
      image: "/images/experiment-gallery/onebite-redesign.jpg",
      imageAlt: "한입코치 화면. 음식 사진 한 장을 고르고 다음 한 끼 행동을 받는 화면",
      label: "한입코치",
      input: "음식 사진 한 장",
      output: "다음 끼니 행동 하나",
      title: "다음 한 끼 행동 하나를 받아요.",
      cta: "음식 사진으로 행동 받기",
      tone: "#7bc8a4",
    },
    {
      id: "today" as const,
      href: "/today",
      image: "/images/experiment-gallery/today-unified.svg",
      imageAlt: "오늘 해볼까 화면. 아이디어를 만들거나 개선해 24시간 제작을 신청하는 화면",
      label: "오늘 해볼까",
      input: "아이디어 한 문장 또는 선택 세 가지",
      output: "24시간 뒤 광고·가짜문 랜딩·측정 기준",
      title: "아이디어를 내일 테스트해요.",
      cta: "아이디어 테스트 신청하기",
      tone: "#244bdb",
    },
    {
      id: "story-cards" as const,
      href: "/story-cards",
      image: "/images/experiment-gallery/story-cards-redesign.jpg",
      imageAlt: "카드너머 화면. 네 장의 타로 스타일 상황에서 하나를 고르는 화면",
      label: "카드너머",
      input: "마음에 가까운 상황 한 장",
      output: "장면 속 안내자와 바로 채팅",
      title: "상황을 고르고 바로 대화해요.",
      cta: "상황 고르고 채팅 시작하기",
      tone: "#a98ce5",
    },
  ];
  const [recentAppId, setRecentAppId] = useState<MvpAppId | null>(null);
  const [resumeState, setResumeState] = useState<MvpResumeState | null>(null);
  const recentCard = cards.find((card) => card.id === recentAppId);

  useEffect(() => {
    const saved = loadLastMvpApp();
    if (saved) {
      setRecentAppId(saved);
      setResumeState(getMvpResumeState(saved));
    }
  }, []);

  const rememberApp = (appId: MvpAppId) => {
    saveLastMvpApp(appId);
    setRecentAppId(appId);
    setResumeState(getMvpResumeState(appId));
  };

  return <Shell><Header active="4개 앱" />
    <section className={styles.hubHero} aria-labelledby="hub-title">
      <p className={styles.eyebrow}>4개 앱 · 모두 로그인 없이</p>
      <h1 id="hub-title">오늘 무엇을<br />해볼까요?</h1>
      <p>원하는 결과를 고르면 바로 시작해요.</p>
    </section>

    {recentCard && resumeState ? <aside className={styles.recentApp} aria-label="최근 사용한 앱">
      <div>
        <span>{resumeState.kind === "resume" ? "이어서 할 수 있어요" : "최근 사용"}</span>
        <strong>{recentCard.label}</strong>
        <p>{resumeState.summary}</p>
      </div>
      <div className={styles.recentActions}>
        <Link
          className={styles.recentPrimary}
          href={resumeState.resumeHref}
          onClick={() => rememberApp(recentCard.id)}
        >
          {resumeState.kind === "resume" ? "이어서 하기" : "처음부터 시작"}
          <ArrowRight size={17} aria-hidden />
        </Link>
        {resumeState.kind === "resume" ? (
          <Link
            className={styles.recentSecondary}
            href={resumeState.newHref}
            onClick={() => rememberApp(recentCard.id)}
          >
            <RotateCcw size={16} aria-hidden />
            새로 시작
          </Link>
        ) : null}
      </div>
    </aside> : null}

    <section className={styles.appChooser} aria-labelledby="chooser-title">
      <div className={styles.chooserHeading}>
        <h2 id="chooser-title">{recentCard ? "다른 앱 화면 보기" : "앱 화면을 보고 고르세요"}</h2>
      </div>
      <div className={styles.chooserGrid} role="region" aria-label="앱 선택">
        {cards.map((card) => (
          <Link
            className={styles.chooserCard}
            href={card.href}
            key={card.href}
            onClick={() => rememberApp(card.id)}
            style={{ "--app-tone": card.tone } as CSSProperties}
            aria-label={`${card.label}: ${card.cta}`}
          >
            <div className={styles.chooserPreview}>
              <Image
                src={card.image}
                alt={card.imageAlt}
                width={960}
                height={540}
                sizes="(min-width: 840px) 42vw, 92vw"
              />
              <span className={styles.previewBadge}>화면 미리보기</span>
            </div>
            <div className={styles.chooserBody}>
              <strong className={styles.chooserLabel}>{card.label}</strong>
              <h3>{card.title}</h3>
              <p
                className={styles.chooserFlow}
                aria-label={`입력 ${card.input}, 결과 ${card.output}`}
              >
                <span>{card.input}</span>
                <ArrowRight size={14} aria-hidden />
                <strong>{card.output}</strong>
              </p>
            </div>
            <span className={styles.chooserArrow} aria-hidden>
              <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  </Shell>;
}

function Tastepin() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recentRequest, setRecentRequest] = useState("");
  const [urlError, setUrlError] = useState("");
  const valid = supportedVideoUrl(url.trim());
  useEffect(() => {
    const saved = localStorage.getItem("mvp-lab:tastepin:last-request") ?? "";
    if (saved) {
      setRecentRequest(saved);
      setSubmitted(true);
    }
  }, []);
  const requestReview = () => {
    if (!valid) {
      setUrlError("Instagram, TikTok 또는 YouTube의 공개 영상 링크만 넣을 수 있어요.");
      return;
    }
    const next = url.trim();
    localStorage.setItem("mvp-lab:tastepin:last-request", next);
    setRecentRequest(next);
    setSubmitted(true);
  };
  return <Shell><Header active="맛핀" />
    <section className={styles.flow}><Link href="/" className={styles.back}><ArrowLeft size={17} /> 다른 실험 보기</Link>
      <p className={styles.eyebrow}>맛집 영상 → 갈 곳</p><h1>저장만 한 영상,<br />오늘 갈 곳으로 바꿔요.</h1>
      {!submitted ? <form className={styles.form} onSubmit={(event) => { event.preventDefault(); requestReview(); }}>
        <label htmlFor="video-url">맛집 영상 링크 하나</label>
        <div className={styles.inputRow}><Video size={20} aria-hidden /><input id="video-url" value={url} onChange={(e) => { setUrl(e.target.value); setUrlError(""); }} placeholder="Instagram, TikTok 또는 YouTube 공개 링크" inputMode="url" autoComplete="url" aria-invalid={Boolean(urlError)} /></div>
        {urlError ? <p className={styles.error} role="alert">{urlError}</p> : null}
        <p className={styles.helper}>지금은 사람이 영상을 확인해 장소와 지도 핀을 전달하는 초기 실험입니다.</p>
        <button className={styles.primaryButton} type="submit">검토 요청 기록하기</button>
      </form> : <section className={styles.result} aria-live="polite"><span className={styles.resultIcon}><Clock3 aria-hidden /></span><h2>검토 요청을 이 기기에 기록했어요.</h2><p>아직 장소나 지도 핀은 만들어지지 않았습니다. 자동 추출 전 단계라 결과를 약속하지 않고, 이 기기에서 나중에 다시 열어 요청 상태를 확인할 수 있게만 저장합니다.</p><p className={styles.sourceUrl}>{recentRequest || url}</p><OptionalLogin /></section>}
    </section>
  </Shell>;
}

function Onebite() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [coached, setCoached] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhoto(null);
      setPhotoError("JPG, PNG, WebP 같은 이미지 파일만 올릴 수 있어요.");
      event.target.value = "";
      return;
    }
    setPhotoError("");
    setPhoto(URL.createObjectURL(file));
    setCoached(false);
  };
  return <Shell><Header active="한입코치" />
    <section className={styles.flow}><Link href="/" className={styles.back}><ArrowLeft size={17} /> 다른 실험 보기</Link>
      <p className={styles.eyebrow}>사진 한 장 · 예시 행동 하나</p><h1>한 끼가 망해도,<br />다음 끼니는 괜찮아요.</h1>
      {!coached ? <section className={styles.form}><label className={styles.upload} htmlFor="food-photo">{photo ? <Image src={photo} alt="선택한 음식 사진 미리보기" width={720} height={420} unoptimized /> : <><Utensils size={28} aria-hidden /><strong>음식 사진 한 장 올리기</strong><span>사진은 이 화면에서만 사용돼요.</span></>}<input id="food-photo" type="file" accept="image/*" onChange={upload} /></label>
        {photoError ? <p className={styles.error} role="alert">{photoError}</p> : null}
        <button className={styles.primaryButton} type="button" disabled={!photo} onClick={() => setCoached(true)}>예시 코칭 보기</button>
        <p className={styles.notice}>현재는 사진을 실제 분석하지 않는 예시 코칭입니다. 진단, 정확한 칼로리 계산, 감량 결과를 제공하지 않습니다.</p>
      </section> : <section className={styles.result} aria-live="polite"><span className={styles.resultIcon}><Sparkles aria-hidden /></span><h2>예시 코칭이에요.</h2><p className={styles.coachLine}>다음 끼니에는 단백질 하나와 채소 하나를 먼저 담아보세요.</p><p>사진 분석 결과가 아닌, 음식과 다음 행동만 다루는 일반 예시입니다.</p><OptionalLogin /></section>}
    </section>
  </Shell>;
}

function IdeaFit() {
  const [interest, setInterest] = useState("");
  const [time, setTime] = useState("");
  const [shown, setShown] = useState(false);
  const ready = interest.trim().length > 0 && time !== "";
  return <Shell><Header active="아이디어핏" />
    <section className={styles.flow}><Link href="/" className={styles.back}><ArrowLeft size={17} /> 다른 실험 보기</Link>
      <p className={styles.eyebrow}>조건 → 검증 전 예시 후보</p><h1>랜덤이 아니라,<br />내가 만들 수 있는 아이디어.</h1>
      {!shown ? <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (ready) setShown(true); }}>
        <label htmlFor="interest">이번에 관심 있는 분야</label><input className={styles.fullInput} id="interest" value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="예: 동네 생활, 운동, 반려동물" />
        <label htmlFor="time">이번 주 가능한 시간</label><select className={styles.fullInput} id="time" value={time} onChange={(e) => setTime(e.target.value)}><option value="">시간을 골라주세요</option><option value="2시간 이하">2시간 이하</option><option value="반나절">반나절</option><option value="하루 이상">하루 이상</option></select>
        <button className={styles.primaryButton} type="submit" disabled={!ready}>내 조건의 예시 후보 3개 보기</button>
      </form> : <section className={styles.ideaResults} aria-live="polite"><p className={styles.resultIntro}><strong>{interest}</strong> · <strong>{time}</strong> 조건을 반영한 사전 준비 예시입니다. 실제 불편 출처가 연결되기 전이라, 수요가 검증된 아이디어라고 보지 마세요.</p>{exampleIdeas(interest, time).map((idea) => <article className={styles.ideaCard} key={idea.title}><h2>{idea.title}</h2><p>첫 실험: {idea.first}</p><p className={styles.evidence}>근거 상태: 예시 근거 · 출처 수집 전</p><p className={styles.meta}>출처 유형: 예시 · 확인 날짜: 미확정</p></article>)}<OptionalLogin /></section>}
    </section>
  </Shell>;
}
