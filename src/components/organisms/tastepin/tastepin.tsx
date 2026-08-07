"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import {
  loadTastepinSaves,
  saveTastepinResult,
  type SavedTastepinResult,
} from "@/lib/storage";
import {
  normalizeYouTubeShortsUrl,
  tastepinResolveResponseSchema,
  type TastepinResolveResponse,
} from "@/lib/tastepin-contract";
import { track } from "@/lib/track";
import styles from "./tastepin.module.css";

type RequestState = "idle" | "loading" | "success" | "error";
type View = "landing" | "onboarding" | "discover" | "saved";
type OnboardingStep = 0 | 1 | 2;

const regionOptions = ["역삼·강남", "성수·서울숲", "을지로·종로", "연남·합정", "잠실·송파"];

const errorCopy: Record<string, string> = {
  gemini_not_configured: "자동 분석 설정이 아직 연결되지 않았어요.",
  gemini_timeout: "영상 분석 시간이 길어졌어요. 잠시 후 다시 시도해주세요.",
  gemini_failed: "이 영상은 지금 분석하지 못했어요. 다른 공개 쇼츠로 다시 시도해주세요.",
};

const formatSavedAt = (timestamp: number) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

export function Tastepin() {
  const [view, setView] = useState<View>("landing");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(0);
  const [region, setRegion] = useState("");
  const [url, setUrl] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [result, setResult] = useState<TastepinResolveResponse | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<SavedTastepinResult[]>([]);
  const [message, setMessage] = useState("");
  const inputStartedRef = useRef(false);

  useEffect(() => {
    setSavedItems(loadTastepinSaves());
    trackMvpLandingViewed("tastepin");
  }, []);

  useEffect(() => {
    if (!result) return;
    trackMvpResultViewed("tastepin");
  }, [result]);

  const startOnboarding = () => {
    setOnboardingStep(0);
    setView("onboarding");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDiscover = () => {
    setView("discover");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSaved = () => {
    window.location.assign("/matpin");
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setSavedAt(null);
    setMessage("");
    setRequestState("idle");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeYouTubeShortsUrl(url.trim());
    if (!normalized) {
      setMessage("youtube.com/shorts/로 시작하는 공개 쇼츠 링크를 넣어주세요.");
      setRequestState("error");
      return;
    }

    setMessage("");
    setResult(null);
    setSavedAt(null);
    setRequestState("loading");
    track("tastepin_source_submitted", {
      product_key: "tastepin",
      platform: "youtube_shorts",
    });

    try {
      const response = await fetch("/api/tastepin/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const body = await response.json() as unknown;

      if (!response.ok) {
        const error = typeof body === "object" && body !== null && "error" in body
          ? String(body.error)
          : "gemini_failed";
        throw new Error(error);
      }

      const parsed = tastepinResolveResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("gemini_failed");

      const saved = saveTastepinResult(normalized, parsed.data);
      setSavedItems(loadTastepinSaves());
      setSavedAt(saved.savedAt);
      setResult(parsed.data);
      setRequestState("success");
      track(
        parsed.data.extraction.status === "resolved"
          ? "tastepin_extract_succeeded"
          : "tastepin_extract_insufficient",
        {
          product_key: "tastepin",
          platform: "youtube_shorts",
          place_count: parsed.data.extraction.places.length,
          map_status: parsed.data.mapStatus,
        },
      );
      track("tastepin_result_saved", {
        product_key: "tastepin",
        storage: "local_device",
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "gemini_failed";
      setMessage(errorCopy[code] ?? errorCopy.gemini_failed);
      setRequestState("error");
      track("tastepin_extract_failed", {
        product_key: "tastepin",
        platform: "youtube_shorts",
        failure_type: code,
      });
    }
  };

  if (view === "onboarding") {
    return (
      <Onboarding
        step={onboardingStep}
        region={region}
        onRegionChange={setRegion}
        onBack={() => {
          if (onboardingStep === 0) setView("landing");
          else setOnboardingStep((onboardingStep - 1) as OnboardingStep);
        }}
        onNext={() => {
          if (onboardingStep < 2) setOnboardingStep((onboardingStep + 1) as OnboardingStep);
          else openDiscover();
        }}
        onSkip={openDiscover}
      />
    );
  }

  if (view === "discover") {
    return (
      <Discover
        url={url}
        requestState={requestState}
        result={result}
        savedAt={savedAt}
        message={message}
        savedCount={savedItems.length}
        onUrlChange={(value) => {
          setUrl(value);
          if (!inputStartedRef.current && value.trim()) {
            inputStartedRef.current = true;
            trackMvpInputStarted("tastepin");
          }
          setMessage("");
          if (requestState === "error") setRequestState("idle");
        }}
        onSubmit={submit}
        onReset={reset}
        onSaved={openSaved}
        onHome={() => setView("landing")}
      />
    );
  }

  if (view === "saved") {
    return (
      <SavedLibrary
        items={savedItems}
        region={region || "내 맛집"}
        onDiscover={openDiscover}
        onHome={() => setView("landing")}
      />
    );
  }

  return (
    <Landing
      savedCount={savedItems.length}
      onStart={startOnboarding}
      onDiscover={openDiscover}
      onSaved={openSaved}
    />
  );
}

function Landing({
  savedCount,
  onStart,
  onDiscover,
  onSaved,
}: {
  savedCount: number;
  onStart: () => void;
  onDiscover: () => void;
  onSaved: () => void;
}) {
  return (
    <main className={styles.landing}>
      <header className={styles.landingNav}>
        <Link href="/" className={styles.logo}>
          <span><MapPin size={16} aria-hidden /></span>
          맛핀
        </Link>
        <nav className={styles.navLinks} aria-label="맛핀 소개">
          <button type="button" onClick={onStart}><i className={styles.dotRed} /> 어떻게?</button>
          <button type="button" onClick={onStart}><i className={styles.dotYellow} /> 왜 맛핀?</button>
          <button type="button" onClick={onSaved}><i className={styles.dotGreen} /> 저장함 {savedCount}</button>
        </nav>
        <button className={styles.navCta} type="button" onClick={onStart}>
          무료로 시작하기 <ArrowRight size={16} aria-hidden />
        </button>
      </header>

      <section className={styles.landingHero}>
        <div className={styles.promise}>
          <p className={styles.mobileLogo}>맛핀</p>
          <h1>맛집 쇼츠 저장,<br />이렇게 쉬워야 하니까.</h1>
          <p>
            YouTube Shorts에서 발견한 맛집을 잊지 마세요.
            영상 속 식당명과 지역을 찾아 지도 후보와 함께 모아드려요.
          </p>
          <p>
            현재 웹 MVP는 공개 YouTube Shorts 링크로 시작하며,
            분석 결과는 이 브라우저에만 안전하게 남습니다.
          </p>
          <button className={styles.lookLink} type="button" onClick={onStart}>
            <ArrowRight size={17} aria-hidden />
            저장 과정을 먼저 볼게요
          </button>
          <button className={styles.mobileStart} type="button" onClick={onDiscover}>
            링크로 바로 시험하기
          </button>
        </div>

        <div className={styles.discoveryCollage} aria-label="맛핀에 저장되는 정보 예시">
          <span className={`${styles.collageTag} ${styles.tagVideo}`}>영상에서 찾은 메뉴</span>
          <span className={`${styles.collageTag} ${styles.tagMap}`}>지도 후보</span>
          <span className={`${styles.collageTag} ${styles.tagPrivate}`}>내 브라우저에 저장</span>
          <article className={styles.imageTile}>
            <Image
              src="/images/ad-ai/v3/tastepin-pin-world.png"
              alt="지도 위에서 장소를 찾는 모습"
              fill
              sizes="(max-width: 720px) 45vw, 240px"
            />
          </article>
          <article className={styles.noteTile}>
            <small>영상 속 단서</small>
            <strong>역삼역<br />숙성 돼지고기</strong>
            <span>음성 · 자막 · 간판</span>
          </article>
          <article className={styles.placeTile}>
            <div className={styles.miniMap}>
              <span /><span /><span />
            </div>
            <strong>카카오맵 후보 2곳</strong>
            <small>주소를 보고 맞는 곳을 골라요</small>
          </article>
          <article className={styles.sourceTile}>
            <Video size={18} aria-hidden />
            <span><strong>YouTube Shorts</strong><small>원본과 함께 보관</small></span>
          </article>
        </div>
      </section>

      <button className={styles.cornerButton} type="button" onClick={onDiscover} aria-label="링크로 바로 시험하기">
        <ChevronDown size={20} aria-hidden />
      </button>
    </main>
  );
}

function Onboarding({
  step,
  region,
  onRegionChange,
  onBack,
  onNext,
  onSkip,
}: {
  step: OnboardingStep;
  region: string;
  onRegionChange: (region: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  if (step === 0) {
    return (
      <main className={`${styles.onboarding} ${styles.promiseScreen}`}>
        <div className={styles.onboardingMap} aria-hidden>
          {Array.from({ length: 28 }, (_, index) => (
            <span key={index} style={{ left: `${10 + (index * 31) % 82}%`, top: `${7 + (index * 47) % 57}%` }}>
              {(8.4 + (index % 15) * 0.1).toFixed(1)}
            </span>
          ))}
        </div>
        <button className={styles.onboardingBack} type="button" onClick={onBack} aria-label="랜딩으로 돌아가기">
          <ArrowLeft aria-hidden />
        </button>
        <section className={styles.promisePanel}>
          <p className={styles.beliWordmark}>맛핀</p>
          <p className={styles.stepCount}>1 / 3</p>
          <h1>Track</h1>
          <p>가본 곳과 가고 싶은 맛집을<br />쇼츠 원본과 함께 모아보세요.</p>
          <div className={styles.progressDots} aria-label="온보딩 3단계 중 1단계">
            <span className={styles.activeDot} /><span /><span />
          </div>
          <button className={styles.onboardingPrimary} type="button" onClick={onNext}>시작하기</button>
          <button className={styles.onboardingText} type="button" onClick={onSkip}>설명 없이 링크로 시험하기</button>
        </section>
      </main>
    );
  }

  if (step === 1) {
    return (
      <main className={`${styles.onboarding} ${styles.regionScreen}`}>
        <button className={styles.onboardingBack} type="button" onClick={onBack} aria-label="이전 단계">
          <ArrowLeft aria-hidden />
        </button>
        <section className={styles.regionPanel}>
          <p className={styles.stepCount}>2 / 3</p>
          <h1>어디에서 가장 자주<br />맛집을 찾나요?</h1>
          <p>저장함의 첫 지역이 됩니다. 다른 지역 맛집도 언제든 저장할 수 있어요.</p>
          <div className={styles.regionList} role="radiogroup" aria-label="자주 가는 지역">
            {regionOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={region === option}
                onClick={() => onRegionChange(option)}
              >
                {option}
                {region === option ? <Check size={18} aria-hidden /> : null}
              </button>
            ))}
          </div>
        </section>
        <footer className={styles.onboardingFooter}>
          <button className={styles.onboardingPrimary} type="button" onClick={onNext} disabled={!region}>
            계속
          </button>
        </footer>
      </main>
    );
  }

  return (
    <main className={`${styles.onboarding} ${styles.guideScreen}`}>
      <button className={styles.onboardingBack} type="button" onClick={onBack} aria-label="이전 단계">
        <ArrowLeft aria-hidden />
      </button>
      <div className={styles.guideBackdrop} aria-hidden>
        <header><strong>{region || "내 맛집"}</strong><MoreHorizontal /></header>
        {["맛집 쇼츠 저장함", "주말에 가볼 곳", "친구와 먹을 곳"].map((label) => (
          <div key={label}><span>{label}</span><Bookmark /></div>
        ))}
      </div>
      <section className={styles.guideCard}>
        <div className={styles.shareIllustration}>
          <div><Share2 size={32} aria-hidden /></div>
          <span><Plus size={36} aria-hidden /></span>
        </div>
        <p className={styles.stepCount}>3 / 3</p>
        <h1>공유 한 번이면<br />내 맛집 목록에 저장</h1>
        <p>
          설치형 공유 기능은 다음 단계에서 제공할 예정입니다.
          현재 웹 MVP는 쇼츠의 링크를 복사해 시작해요.
        </p>
        <button className={styles.onboardingPrimary} type="button" onClick={onNext}>
          링크로 첫 맛집 저장하기
        </button>
      </section>
    </main>
  );
}

function Discover({
  url,
  requestState,
  result,
  savedAt,
  message,
  savedCount,
  onUrlChange,
  onSubmit,
  onReset,
  onSaved,
  onHome,
}: {
  url: string;
  requestState: RequestState;
  result: TastepinResolveResponse | null;
  savedAt: number | null;
  message: string;
  savedCount: number;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onSaved: () => void;
  onHome: () => void;
}) {
  return (
    <main className={styles.discoverPage}>
      <header className={styles.appHeader}>
        <button type="button" onClick={onHome}><ArrowLeft size={20} aria-hidden /> 맛핀</button>
        <button type="button" onClick={onSaved}><Bookmark size={18} aria-hidden /> 저장함 {savedCount}</button>
      </header>

      <section className={styles.discoverIntro}>
        <p>웹에서 먼저 써보기</p>
        <h1>쇼츠 링크에서<br />식당을 찾아드려요.</h1>
        <span>공개 YouTube Shorts만 지원합니다.</span>
      </section>

      <section className={styles.placePhone}>
        <div className={styles.phoneStatus}><span>9:41</span><span>● ● ▰</span></div>
        {requestState !== "success" || !result ? (
          <form className={styles.linkForm} onSubmit={onSubmit} data-clarity-mask="true">
            <div className={styles.phoneTopbar}>
              <button type="button" onClick={onHome} aria-label="닫기"><X size={22} aria-hidden /></button>
              <strong>쇼츠에서 맛집 찾기</strong>
              <span />
            </div>
            <div className={styles.linkIllustration}><Link2 size={34} aria-hidden /></div>
            <h2>공개 쇼츠 링크를<br />붙여 넣어주세요.</h2>
            <p>영상의 음성·자막·간판에서 식당 단서를 찾고 이 기기에 저장합니다.</p>
            <label htmlFor="tastepin-youtube-url">YouTube Shorts 공개 링크</label>
            <div className={styles.linkInput}>
              <Video size={19} aria-hidden />
              <input
                id="tastepin-youtube-url"
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder="https://youtube.com/shorts/..."
                inputMode="url"
                autoComplete="url"
                aria-invalid={Boolean(message)}
                disabled={requestState === "loading"}
              />
            </div>
            {message ? <p className={styles.formError} role="alert">{message}</p> : null}
            <button className={styles.googlePrimary} type="submit" disabled={requestState === "loading"}>
              {requestState === "loading" ? "장소를 찾는 중…" : "식당 찾고 저장하기"}
            </button>
            <small>결과는 현재 브라우저에 최대 50개까지 저장됩니다.</small>
          </form>
        ) : (
          <Result result={result} savedAt={savedAt} onReset={onReset} onOpenSaved={onSaved} />
        )}
      </section>
    </main>
  );
}

function Result({
  result,
  savedAt,
  onReset,
  onOpenSaved,
}: {
  result: TastepinResolveResponse;
  savedAt: number | null;
  onReset: () => void;
  onOpenSaved: () => void;
}) {
  const place = result.extraction.places[0];
  const candidate = result.mapCandidates[0];

  return (
    <section className={styles.placeResult} aria-live="polite" data-clarity-mask="true">
      <div className={styles.placeTopbar}>
        <button type="button" onClick={onReset} aria-label="다른 쇼츠 분석하기"><ChevronDown size={23} aria-hidden /></button>
        <span />
        <button type="button" onClick={() => candidate && window.open(candidate.mapUrl, "_blank")} aria-label="지도 후보 공유">
          <Share2 size={21} aria-hidden />
        </button>
        <button type="button" onClick={onOpenSaved} aria-label="더 보기"><MoreHorizontal size={21} aria-hidden /></button>
      </div>

      <div className={styles.placeSummary}>
        <h2>{place?.name ?? "식당 이름을 확인하지 못했어요"}</h2>
        <p>{place ? `${place.regionHints.join(" · ") || "지역 확인 중"} · ${place.menus.join(" · ") || "메뉴 확인 중"}` : result.extraction.summary}</p>
        <span>{place ? "음식점" : "분석 결과"}</span>
      </div>

      <div className={styles.placeActions}>
        <button type="button" onClick={onOpenSaved} className={styles.savedAction}>
          <Bookmark size={20} fill="currentColor" aria-hidden />
          저장됨
        </button>
        {candidate ? (
          <a
            href={candidate.mapUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${candidate.name} 지도 후보 열기`}
            onClick={() => trackMvpDeepAction("tastepin")}
          >
            <MapPin size={20} aria-hidden />
            지도
          </a>
        ) : (
          <button type="button" onClick={onReset}><Search size={20} aria-hidden /> 다시 찾기</button>
        )}
        <button type="button" onClick={onOpenSaved} data-testid="tastepin-open-saved">
          <Bookmark size={20} aria-hidden /> 저장함
        </button>
      </div>

      <div className={styles.placeMedia}>
        <div className={styles.placeMapPreview}>
          <span className={styles.mapRoadOne} /><span className={styles.mapRoadTwo} />
          <MapPin size={34} fill="#246bfd" aria-hidden />
        </div>
        <div className={styles.placeEvidence}>
          <Sparkles size={22} aria-hidden />
          <p><strong>영상에서 찾은 단서</strong>{result.extraction.summary}</p>
        </div>
      </div>

      <nav className={styles.placeTabs} aria-label="장소 상세">
        <span className={styles.activeTab}>개요</span><span>메뉴</span><span>영상 단서</span><span>주소</span>
      </nav>

      <div className={styles.clueDetails}>
        {result.extraction.places.map((item, index) => (
          <article key={`${item.name}-${index}`}>
            <strong>{item.name}{item.branch ? ` ${item.branch}` : ""}</strong>
            <p>{item.evidence.map((evidence) => evidence.text).join(" · ")}</p>
          </article>
        ))}
      </div>

      <p className={styles.saveReceipt} aria-label="이 기기에 자동 저장됨">
        <Check size={16} aria-hidden />
        {savedAt ? `${formatSavedAt(savedAt)} 이 기기에 저장` : "이 기기에 저장"}
      </p>
      <PostResultSignup
        experimentId="tastepin"
        label="Google 계정 연결하기"
        description="이 기기에는 저장됐어요. 계정 연결은 선택 사항이며, 다른 기기와의 결과 동기화는 아직 지원하지 않아요."
      />
    </section>
  );
}

function SavedLibrary({
  items,
  region,
  onDiscover,
  onHome,
}: {
  items: SavedTastepinResult[];
  region: string;
  onDiscover: () => void;
  onHome: () => void;
}) {
  return (
    <main className={styles.savedPage}>
      <section className={styles.savedMap} aria-label={`${region} 저장 지도`}>
        <div className={styles.savedMapRoads} aria-hidden><i /><i /><i /><i /></div>
        <header className={styles.savedHeader}>
          <button type="button" onClick={onHome} aria-label="랜딩으로 돌아가기"><ArrowLeft /></button>
          <h1>{region}</h1>
          <button type="button" onClick={onDiscover} aria-label="새 쇼츠 저장하기"><Plus /></button>
          <button type="button" onClick={onDiscover} aria-label="더 보기"><Share2 /></button>
        </header>
        {items.slice(0, 5).map((item, index) => (
          <span
            className={styles.mapPlacePin}
            key={item.id}
            style={{ left: `${18 + (index * 17) % 65}%`, top: `${32 + (index * 13) % 42}%` }}
          >
            {item.result.extraction.places[0]?.name.slice(0, 8) ?? "맛집"}
          </span>
        ))}
        <div className={styles.mapFilters}>
          <button type="button"><MapPin size={15} fill="currentColor" aria-hidden /> 저장한 곳</button>
          <button type="button"><Video size={15} aria-hidden /> YouTube</button>
        </div>
      </section>

      <section className={styles.savedSheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.collectionMeta}>
          <p>@나 · {items.length}곳 · 비공개 저장함</p>
          <strong>쇼츠에서 발견한 맛집을 다시 꺼내보세요.</strong>
        </div>

        {items.length === 0 ? (
          <div className={styles.savedEmpty}>
            <Bookmark size={26} aria-hidden />
            <h2>아직 저장된 맛집이 없어요.</h2>
            <p>공개 YouTube Shorts 링크 하나를 분석하면 이 지도와 목록에 남습니다.</p>
            <button type="button" onClick={onDiscover}>첫 맛집 저장하기</button>
          </div>
        ) : (
          <div className={styles.savedList} data-clarity-mask="true">
            {items.map((item) => {
              const firstPlace = item.result.extraction.places[0];
              const firstMap = item.result.mapCandidates[0];
              return (
                <article key={item.id}>
                  <div className={styles.savedThumb}>
                    <Image
                      src="/images/ad-ai/v3/tastepin-pin-world.png"
                      alt=""
                      fill
                      sizes="88px"
                    />
                  </div>
                  <div>
                    <h2>{firstPlace?.name ?? "식당을 확인하지 못한 쇼츠"}</h2>
                    <p>{firstPlace?.menus[0] ?? "영상 단서"} · {firstPlace?.regionHints[0] ?? "지역 확인 중"}</p>
                    <small>{item.result.extraction.summary}</small>
                    <div className={styles.savedLinks}>
                      {firstMap ? (
                        <a
                          href={firstMap.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${firstMap.name} 지도 후보 열기`}
                          onClick={() => trackMvpDeepAction("tastepin")}
                        >
                          지도 열기 <ExternalLink size={14} aria-hidden />
                        </a>
                      ) : null}
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        원본 쇼츠 <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <button className={styles.savedFab} type="button" onClick={onDiscover} aria-label="새 쇼츠 저장하기">
        <Plus aria-hidden />
      </button>
    </main>
  );
}
