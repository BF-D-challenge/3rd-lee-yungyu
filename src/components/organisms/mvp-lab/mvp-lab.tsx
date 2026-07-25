"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, BookOpen, Clock3, ExternalLink, Lightbulb, MapPin, Sparkles, Utensils, Video } from "lucide-react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
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
      <Link href="/" className={styles.brand} aria-label="실험 허브로 이동">오늘의 작은 실험</Link>
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
    { href: "/tastepin", icon: <MapPin aria-hidden />, label: "맛핀", title: "맛집 쇼츠에서 식당 단서 찾기", text: "공개 YouTube Shorts 링크를 넣으면 영상 속 식당명·메뉴·지역 단서를 찾습니다.", cta: "맛집 쇼츠 넣기" },
    { href: "/onebite", icon: <Utensils aria-hidden />, label: "한입코치", title: "사진에서 다음 한 끼 행동 찾기", text: "음식 사진 한 장에서 확인한 내용으로 다음 끼니에 할 행동 하나를 제안합니다.", cta: "음식 사진 올리기" },
    { href: "/today-a", icon: <Lightbulb aria-hidden />, label: "Today A", title: "내 조건에서 사업 구조 하나 찾기", text: "고객·반복 불편·강점·이번 주 시간을 실제 제품 원본과 비교해 구조 하나로 정리합니다.", cta: "내 조건 입력하기" },
    { href: "/today-b", icon: <Clock3 aria-hidden />, label: "Today B", title: "아이디어의 7일 수요 실험 만들기", text: "지금 가진 아이디어의 가장 위험한 가정과 실제 행동을 셀 7일 계획을 만듭니다.", cta: "7일 실험 만들기" },
    { href: "/story-cards", icon: <BookOpen aria-hidden />, label: "랜덤 엔딩", title: "카드 한 장에서 시작하는 8번의 선택", text: "랜덤 카드로 시작해 여덟 번의 선택 뒤 한 편의 결말을 완성합니다.", cta: "첫 카드 열기" },
  ];
  return <Shell><Header />
    <section className={styles.hero}>
      <p className={styles.eyebrow}>서로 다른 실험을 따로 검증합니다</p>
      <h1>지금 필요한 한 가지를<br />직접 써보세요.</h1>
      <p>각 실험은 한 가지 행동과 한 가지 결과만 제공합니다. 아직 준비 중인 기능은 결과처럼 보이게 하지 않습니다.</p>
      <Link className={styles.makerLink} href="/start">기존 오늘해볼까 제작기 열기 <ExternalLink size={16} aria-hidden /></Link>
    </section>
    <section className={styles.grid} aria-label="실험 선택">
      {cards.map((card) => <article className={styles.experimentCard} key={card.href}>
        <span className={styles.icon}>{card.icon}</span><p className={styles.cardLabel}>{card.label}</p>
        <h2>{card.title}</h2><p>{card.text}</p>
        <Link className={styles.primaryLink} href={card.href}>{card.cta}<ExternalLink size={17} aria-hidden /></Link>
      </article>)}
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
