"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Clock3, Sparkles, Utensils, Video } from "lucide-react";
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
      href: "/tastepin",
      image: "/images/experiment-gallery/tastepin.jpg",
      imageAlt: "맛핀 화면. YouTube Shorts 링크를 넣어 식당 단서를 찾는 입력 화면",
      label: "맛핀",
      input: "공개 YouTube Shorts 링크",
      output: "식당명·메뉴·지역 단서",
      title: "저장한 맛집 쇼츠에서 갈 곳을 찾아요.",
      text: "영상 속 음성·화면 글자·간판을 읽어 식당을 찾는 데 필요한 단서만 정리합니다.",
      cta: "쇼츠 링크로 식당 찾기",
    },
    {
      href: "/onebite",
      image: "/images/experiment-gallery/onebite.jpg",
      imageAlt: "한입코치 화면. 음식 사진 한 장을 고르고 다음 한 끼 행동을 받는 화면",
      label: "한입코치",
      input: "음식 사진 한 장",
      output: "다음 끼니 행동 하나",
      title: "먹은 걸 탓하지 않고, 다음 한 끼를 정해요.",
      text: "칼로리를 단정하지 않아요. 사진에서 확인한 음식 그룹을 바탕으로 작은 행동 하나를 제안합니다.",
      cta: "음식 사진으로 행동 받기",
    },
    {
      href: "/today-a",
      image: "/images/experiment-gallery/today-a.jpg",
      imageAlt: "Today A 화면. 고객과 반복 불편, 강점, 시간을 입력하는 화면",
      label: "Today A",
      input: "고객·불편·강점·이번 주 시간",
      output: "근거가 있는 사업 구조 하나",
      title: "내가 할 수 있는 조건에서 사업 구조를 찾아요.",
      text: "저장된 실제 제품 원본과 비교해 돈 낼 사람·필요한 순간·입력·결과를 한 줄씩 정리합니다.",
      cta: "내 조건으로 구조 받기",
    },
    {
      href: "/today-b",
      image: "/images/experiment-gallery/today-b.jpg",
      imageAlt: "Today B 화면. 아이디어와 고객, 얻을 결과를 입력해 7일 실험을 만드는 화면",
      label: "Today B",
      input: "아이디어·고객·얻을 결과",
      output: "가장 위험한 가정의 7일 실험",
      title: "아이디어가 있다면, 기능보다 수요를 먼저 봐요.",
      text: "좋아요 대신 인터뷰·예약금·대기 신청·사전 구매처럼 실제 행동을 셀 계획을 만듭니다.",
      cta: "아이디어로 7일 실험 만들기",
    },
    {
      href: "/story-cards",
      image: "/images/experiment-gallery/story-cards.jpg",
      imageAlt: "상황 카드 화면. 네 장의 타로 스타일 상황에서 하나를 고르는 화면",
      label: "상황 카드",
      input: "마음에 가까운 상황 한 장",
      output: "장면 속 안내자와 바로 채팅",
      title: "설명하기 어려운 마음은 장면부터 골라요.",
      text: "타로 카드처럼 펼쳐진 네 장의 상황 중 하나를 고르면, 로그인 없이 대화가 시작됩니다.",
      cta: "상황 고르고 채팅 시작하기",
    },
  ];
  return <Shell><Header active="5개 실험" />
    <section className={styles.hero}>
      <p className={styles.eyebrow}>오늘 바로 써보는 5개 앱</p>
      <h1>필요한 결과부터<br />고르세요.</h1>
      <p>무엇을 넣고, 바로 무엇을 받는지 같은 순서로 보여드려요. 다섯 앱 모두 로그인 없이 시작할 수 있습니다.</p>
      <div className={styles.heroActions}>
        <Link className={styles.heroPrimary} href="#experiment-gallery">앱 5개 비교하기 <ArrowDown size={17} aria-hidden /></Link>
        <Link className={styles.makerLink} href="/start">새 아이디어 만들기 <ArrowRight size={16} aria-hidden /></Link>
      </div>
    </section>
    <section className={styles.gallerySection} id="experiment-gallery" aria-labelledby="gallery-title">
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>INPUT → RESULT</p>
        <h2 id="gallery-title">넣는 것과 받는 것을 먼저 비교해요.</h2>
        <p>각 앱의 대표 화면과 결과를 보고, 지금 필요한 한 곳만 열어보세요.</p>
      </div>
      <div className={styles.grid} role="region" aria-label="실험 선택">
        {cards.map((card, index) => <article className={styles.experimentCard} key={card.href}>
          <figure className={styles.preview}>
            <Image
              src={card.image}
              alt={card.imageAlt}
              width={1920}
              height={1083}
              sizes="(min-width: 1080px) 56vw, (min-width: 720px) 52vw, 92vw"
            />
            <figcaption>{card.label} 실제 입력 화면</figcaption>
          </figure>
          <div className={styles.cardBody}>
            <div className={styles.appMeta}>
              <p className={styles.cardLabel}><span>{String(index + 1).padStart(2, "0")}</span>{card.label}</p>
              <span className={styles.noLogin}>로그인 없이 시작</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <dl className={styles.inputOutput}>
              <div className={styles.ioItem}>
                <dt>넣는 것</dt>
                <dd>{card.input}</dd>
              </div>
              <ArrowRight className={styles.ioArrow} size={18} aria-hidden />
              <div className={styles.ioItem}>
                <dt>바로 받는 것</dt>
                <dd>{card.output}</dd>
              </div>
            </dl>
            <Link className={styles.primaryLink} href={card.href}>{card.cta}<ArrowRight size={17} aria-hidden /></Link>
          </div>
        </article>)}
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
