"use client";

import {
  ArrowLeft,
  ArrowDown,
  BatteryMedium,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type UIEvent,
} from "react";
import { track } from "@/lib/track";
import styles from "./matpin-mobile-frame.module.css";

const DEVICE_WIDTH = 422;
const DEVICE_HEIGHT = 876;
const instagramProfile = "https://www.instagram.com/matpin.kr/";

const aiReelThumbnails = [
  "/images/matpin/reels/ai-pork-skin-reference-v2.png",
  "/images/matpin/reels/ai-strawberry-cake-v1.png",
  "/images/matpin/reels/ai-knife-cut-noodles-v1.png",
  "/images/matpin/reels/ai-tteokbokki-v1.png",
  "/images/matpin/reels/ai-cheese-chicken-reference-v2.png",
  "/images/matpin/reels/ai-braised-ribs-reference-v2.png",
] as const;

const scenes = [
  {
    eyebrow: "",
    title: "맛집 릴스를\n역별로 모아드려요",
    description: "Instagram에서 matpin.kr로 보내면 가까운 역별 보관함에 저장해요.",
  },
  {
    eyebrow: "쌓여가는 저장 목록",
    title: "저장한 릴스는\n금세 쌓이니까",
    description: "다시 찾을 때는 가게 이름과 위치를 또 확인해야 해요.",
  },
  {
    eyebrow: "Instagram 릴스",
    title: "다시 가고 싶은\n릴스를 고르세요",
    description: "저장할 맛집 릴스 하나에서 시작해요.",
  },
  {
    eyebrow: "공유하기",
    title: "공유 버튼을\n누르세요",
    description: "릴스 오른쪽의 종이비행기 버튼을 누르면 돼요.",
  },
  {
    eyebrow: "공유할 사람",
    title: "matpin.kr로\n보내세요",
    description: "공유 대상에서 matpin.kr를 선택하고 보내기를 눌러요.",
  },
  {
    eyebrow: "역별 자동 정리",
    title: "릴스가 가까운\n역에 저장돼요",
    description: "장소를 확인해 가장 가까운 역 보관함에 연결해요.",
  },
  {
    eyebrow: "내 보관함",
    title: "보낼수록\n역별로 쌓여요",
    description: "같은 Instagram 계정으로 보낸 릴스가 하나의 보관함에 모여요.",
  },
  {
    eyebrow: "Instagram DM",
    title: "저장될 때마다\nDM이 도착해요",
    description: "각 릴스의 역별 저장 결과와 보관함 링크를 보내드려요.",
  },
] as const;

const scatteredReels = [
  { x: -122, y: -82, r: -12, ox: -102, oy: -118, or: -7, label: "껍데기 릴스", hook: "불판 위 바삭\n껍데기 한입", effect: "contrast(1.14) saturate(1.18) brightness(1.03) sepia(0.04)", src: aiReelThumbnails[0] },
  { x: 110, y: -105, r: 10, ox: 62, oy: -118, or: 5, label: "딸기 케이크 릴스", hook: "딸기 한 조각 가득\n시즌 케이크", effect: "contrast(1.06) saturate(0.96) brightness(1.08)", src: aiReelThumbnails[1] },
  { x: -142, y: 92, r: 8, ox: -52, oy: 62, or: -4, label: "칼국수 릴스", hook: "국물까지 뜨끈한\n칼국수 한 그릇", effect: "contrast(1.08) saturate(0.9) brightness(1.05)", src: aiReelThumbnails[2] },
  { x: 124, y: 76, r: -9, ox: 45, oy: 64, or: 4, label: "떡볶이 릴스", hook: "쌀떡에 양념 가득\n즉석 떡볶이", effect: "contrast(1.14) saturate(1.2) brightness(1.03)", src: aiReelThumbnails[3] },
  { x: -28, y: 148, r: 7, ox: 4, oy: 76, or: 2, label: "치즈 닭갈비 릴스", hook: "치즈가 끝없이\n늘어나는 닭갈비", effect: "contrast(1.12) saturate(1.16) brightness(1.04)", src: aiReelThumbnails[4] },
  { x: 12, y: -166, r: -4, ox: 0, oy: -72, or: -2, label: "등갈비 릴스", hook: "양념이 제대로 밴\n매운 등갈비", effect: "contrast(1.16) saturate(1.22) brightness(1.02)", src: aiReelThumbnails[5] },
] as const;

const heroStationGroups = [
  { name: "역삼역", reelCount: 4, reels: scatteredReels.slice(0, 3) },
  { name: "성수역", reelCount: 3, reels: scatteredReels.slice(3, 6) },
] as const;

const dockItems = [
  { label: "릴스 보내기", scene: 2, Icon: Send },
  { label: "장소 확인", scene: 5, Icon: Search },
  { label: "역별 보관함", scene: 6, Icon: MapPin },
] as const;

const dmUpdates = [
  { station: "역삼역", detail: "즉석 떡볶이", reelIndex: 3, time: "방금" },
  { station: "성수역", detail: "딸기 케이크", reelIndex: 1, time: "1분" },
  { station: "을지로입구역", detail: "불판 껍데기", reelIndex: 0, time: "2분" },
] as const;

type MatpinMobileFramePrototypeProps = {
  variant?: "landing" | "prototype";
};

export function MatpinMobileFramePrototype({ variant = "prototype" }: MatpinMobileFramePrototypeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (variant !== "landing") return;
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
  }, [variant]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resize = () => {
      const nextScale = Math.min(
        1,
        host.clientWidth / DEVICE_WIDTH,
        host.clientHeight / DEVICE_HEIGHT,
      );
      setScale(Math.max(0.45, nextScale));
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return () => observer.disconnect();
  }, []);

  const canvasStyle = {
    "--device-scale": scale,
    width: DEVICE_WIDTH * scale,
    height: DEVICE_HEIGHT * scale,
  } as CSSProperties;

  const goToScene = useCallback((nextScene: number) => {
    const scroller = scrollerRef.current;
    const target = Math.max(0, Math.min(scenes.length - 1, nextScene));
    if (!scroller) {
      setScene(target);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      top: target * scroller.clientHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, []);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    const nextScene = Math.round(scroller.scrollTop / scroller.clientHeight);
    setScene(Math.max(0, Math.min(scenes.length - 1, nextScene)));
  };

  const trackOpenInstagram = () => {
    if (variant !== "landing") return;
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
    <main className={`${styles.page} ${variant === "landing" ? styles.landingPage : ""}`}>
      {variant === "prototype" ? (
        <header className={styles.previewHeader}>
          <Link href="/matpin/motion-lab/compare-5-3-1" aria-label="모션 비교 화면으로 돌아가기">
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <div>
            <h1>맛핀 모바일 흐름, 시안</h1>
          </div>
          <div className={styles.previewActions}>
            <Link href="/matpin/storyboard-ranking">평가하기</Link>
          </div>
        </header>
      ) : null}

      <section className={styles.mockupStage} aria-label="Poly 흐름을 적용한 맛핀 모바일 목업">
        <div className={styles.deviceHost} ref={hostRef}>
          <div className={styles.deviceCanvas} style={canvasStyle}>
            <div className={styles.deviceFrame} data-testid="phone-frame">
              <span className={styles.silentButton} aria-hidden="true" />
              <span className={styles.volumeUpButton} aria-hidden="true" />
              <span className={styles.volumeDownButton} aria-hidden="true" />
              <span className={styles.powerButton} aria-hidden="true" />

              <section
                className={styles.deviceScreen}
                data-phone-screen
                data-testid="device-screen"
                data-scene={scene}
                aria-label={`맛핀 모션 이야기 ${scene + 1}단계: ${scenes[scene].title.replace("\n", " ")}`}
              >
                <div className={styles.dynamicIsland} aria-hidden="true" />
                <div className={styles.statusBar} aria-hidden="true">
                  <time>9:41</time>
                  <span><b>5G</b><Wifi size={15} strokeWidth={2.4} /><BatteryMedium size={20} strokeWidth={2.2} /></span>
                </div>

                <div className={styles.visualStage} aria-hidden="true">
                  <div className={styles.digitalGrid} />
                  <div className={styles.instagramGlow} />

                  <div className={styles.sceneCopies}>
                    {scenes.map((item, index) => (
                      <article key={item.eyebrow} data-active={scene === index}>
                        <span>{item.eyebrow}</span>
                        <h2>{item.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
                        <p>{item.description}</p>
                      </article>
                    ))}
                  </div>

                  <div className={styles.heroEvidence}>
                    <Image
                      className={styles.heroWorkspaceImage}
                      src="/images/matpin/matpin-poly-workspace-viewer-v2.png"
                      alt=""
                      fill
                      priority
                      sizes="390px"
                    />
                    <span className={styles.heroWorkspaceShade} />

                    <article className={styles.heroPhoneUi}>
                      <header>
                        <strong>matpin</strong>
                        <small>내 보관함</small>
                      </header>
                      <div className={styles.heroPhoneBody} data-testid="hero-station-library">
                        <div className={styles.heroLibraryIntro}>
                          <p>내 맛집 릴스 보관함</p>
                          <h3>저장한 역</h3>
                          <small>역 3개, 영상 12개</small>
                        </div>
                        <div className={styles.heroLibrarySearch}>
                          <Search size={8} />
                          <span>역 또는 가게 검색</span>
                        </div>
                        <div className={styles.heroStationList}>
                          {heroStationGroups.map((group, groupIndex) => (
                            <section className={styles.heroStationGroup} data-station={group.name} key={group.name}>
                              <header>
                                <div>
                                  <small>가까운 역</small>
                                  <strong>{group.name}</strong>
                                </div>
                                <span>영상 {group.reelCount}개 <ChevronRight size={7} /></span>
                              </header>
                              <div className={styles.heroStationRail}>
                                {group.reels.map((reel, reelIndex) => (
                                  <div
                                    key={reel.label}
                                    style={{ "--reel-filter": reel.effect } as CSSProperties}
                                  >
                                    <Image
                                      src={reel.src}
                                      alt=""
                                      fill
                                      sizes="38px"
                                      style={{ objectPosition: `${30 + (groupIndex * 3 + reelIndex) * 10}% center` }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    </article>

                  </div>

                  <div className={styles.instagramReference}>
                    <div className={styles.igReelScreen}>
                      <Image
                        className={styles.igReelImage}
                        src={aiReelThumbnails[3]}
                        alt=""
                        fill
                        sizes="300px"
                      />
                      <span className={styles.igReelShade} />
                      <header className={styles.igReelTop}>
                        <ArrowLeft size={19} />
                        <strong>릴스</strong>
                        <Camera size={19} />
                      </header>
                      <div className={styles.igReelRail}>
                        <span><Heart size={22} /><small>1.2만</small></span>
                        <span><MessageCircle size={22} /><small>328</small></span>
                        <span className={styles.igShareTarget}><Send size={22} /><small>공유</small></span>
                        <span><Bookmark size={21} /></span>
                        <span><MoreHorizontal size={21} /></span>
                      </div>
                      <div className={styles.igReelCaption}>
                        <strong>@seoul_food_log</strong>
                        <p>역삼역에서 찾은 매콤한 즉석 떡볶이</p>
                        <small>원본 오디오</small>
                      </div>
                    </div>

                    <div className={styles.igShareSheet}>
                      <i aria-hidden="true" />
                      <div className={styles.igSearchField}><Search size={15} /> matpin.kr</div>
                      <div className={styles.igRecipients}>
                        <span className={styles.igRecipientSelected}>
                          <b className={styles.igMatpinAvatar}>m</b>
                          <small>matpin.kr</small>
                          <em><Check size={11} /></em>
                        </span>
                        <span><b className={styles.igAvatarWarm}>수</b><small>sooyeon</small></span>
                        <span><b className={styles.igAvatarCool}>민</b><small>minji.zip</small></span>
                      </div>
                      <div className={styles.igSendButton}><Send size={15} /> 보내기</div>
                    </div>
                  </div>

                  <div className={styles.dmThread} data-testid="dm-thread">
                    <header>
                      <span>m</span>
                      <div>
                        <strong>matpin.kr</strong>
                        <small>릴스 저장 알림 3개</small>
                      </div>
                    </header>
                    <div className={styles.dmMessages}>
                      {dmUpdates.map((update) => (
                        <article
                          key={`${update.station}-${update.detail}`}
                          data-testid="dm-message"
                        >
                          <span className={styles.dmReelThumb}>
                            <Image
                              src={aiReelThumbnails[update.reelIndex]}
                              alt=""
                              fill
                              sizes="34px"
                            />
                          </span>
                          <div>
                            <strong><Check size={11} /> {update.station}에 저장했어요</strong>
                            <small>{update.detail}</small>
                          </div>
                          <time>{update.time}</time>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className={styles.dmCollectionSummary} data-testid="dm-collection-summary">
                    <div>
                      <small>내 역별 보관함</small>
                      <strong>역 3개, 릴스 12개</strong>
                    </div>
                    <span>보관함 열기 <ExternalLink size={11} /></span>
                  </div>

                  <div className={styles.productPhone}>
                    <div className={styles.productPhoneTop}>
                      <strong>matpin</strong>
                      <span>내 보관함</span>
                    </div>
                    <div className={styles.productPhoneBody}>
                      <p>저장한 역</p>
                      <h3>역삼역 <small>릴스 3개</small></h3>
                      <div className={styles.productReelGrid}>
                        {[3, 0, 2].map((reelIndex, index) => (
                          <div
                            key={scatteredReels[reelIndex].label}
                            className={styles.productGridReel}
                            style={{ "--reel-filter": scatteredReels[reelIndex].effect } as CSSProperties}
                          >
                            <Image
                              src={aiReelThumbnails[reelIndex]}
                              alt=""
                              fill
                              sizes="120px"
                              style={{ objectPosition: `${34 + index * 11}% center` }}
                            />
                            {index === 0 ? <span><Check size={10} /> 방금 저장</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.phoneLight} />

                  <div className={styles.reelsField}>
                    {scatteredReels.map((reel, index) => (
                      <article
                        key={`${reel.label}-${index}`}
                        className={styles.scatteredReel}
                        style={{
                          "--scatter-x": `${reel.x}px`,
                          "--scatter-y": `${reel.y}px`,
                          "--scatter-r": `${reel.r}deg`,
                          "--burst-x": `${reel.x * 0.36}px`,
                          "--burst-y": `${reel.y * 0.36}px`,
                          "--burst-r": `${reel.r * 0.5}deg`,
                          "--emphasis-x": `${reel.x * 1.12}px`,
                          "--emphasis-y": `${reel.y * 1.08}px`,
                          "--organize-x": `${reel.ox}px`,
                          "--organize-y": `${reel.oy}px`,
                          "--organize-r": `${reel.or}deg`,
                          "--organized-opacity": Math.max(0.27, 0.52 - index * 0.045),
                          "--reel-index": index,
                          "--image-position": `${30 + index * 9}% center`,
                          "--reel-filter": reel.effect,
                        } as CSSProperties}
                      >
                        <Image
                          src={reel.src}
                          alt=""
                          fill
                          sizes="110px"
                          style={{ objectPosition: `${30 + index * 9}% center` }}
                        />
                        <span className={styles.reelOverlay} />
                        <span className={styles.reelBadge}><Camera size={10} /> 릴스</span>
                        <strong className={styles.reelHook}>
                          {reel.hook.split("\n").map((line) => <span key={line}>{line}</span>)}
                        </strong>
                      </article>
                    ))}
                  </div>

                  <div className={styles.stationShelf}>
                    <div className={styles.stationMatch}>
                      <span>장소 확인 완료</span>
                      <ArrowDown size={15} aria-hidden="true" />
                      <strong><MapPin size={14} /> 가장 가까운 역, 역삼역</strong>
                    </div>
                    <div className={styles.stationShelfHead}>
                      <div>
                        <small>역별 보관함</small>
                        <span>역삼역</span>
                      </div>
                      <small>도보 3분</small>
                    </div>
                    <div className={styles.stationSaveResult}>
                      <div
                        className={styles.stationSavedCard}
                        style={{ "--reel-filter": scatteredReels[3].effect } as CSSProperties}
                      >
                        <Image
                          src={aiReelThumbnails[3]}
                          alt=""
                          fill
                          sizes="170px"
                        />
                        <strong className={styles.stationReelHook}>
                          {scatteredReels[3].hook.split("\n").map((line) => <span key={line}>{line}</span>)}
                        </strong>
                      </div>
                      <div className={styles.stationSaveCopy}>
                        <span className={styles.stationSavedBadge}><Check size={13} /> 저장 완료</span>
                        <strong>이 릴스를<br />역삼역에 넣었어요</strong>
                        <small>역삼역, 저장한 릴스 1개</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.srOnly} aria-live="polite">
                  {variant === "landing" && scene === 0 ? (
                    <h1>{scenes[scene].title.replace("\n", " ")}</h1>
                  ) : (
                    <h2>{scenes[scene].title.replace("\n", " ")}</h2>
                  )}
                  <p>{scenes[scene].description}</p>
                </div>

                <div
                  ref={scrollerRef}
                  className={styles.storyScroller}
                  onScroll={handleScroll}
                  aria-label="맛핀 소개 장면. 위아래로 스크롤할 수 있습니다."
                >
                  {scenes.map((item, index) => (
                    <section key={item.eyebrow} aria-label={`${index + 1}단계 ${item.eyebrow}`} />
                  ))}
                </div>

                <header className={styles.appHeader}>
                  <strong>matpin</strong>
                  {scene === 0 || scene === scenes.length - 1 ? (
                    null
                  ) : (
                    <button type="button" onClick={() => goToScene(scenes.length - 1)}>결과 보기</button>
                  )}
                </header>

                <div className={styles.sceneProgress} aria-live="polite">
                  <span>{String(scene + 1).padStart(2, "0")}</span>
                  <i><b style={{ width: `${((scene + 1) / scenes.length) * 100}%` }} /></i>
                  <span>{String(scenes.length).padStart(2, "0")}</span>
                </div>

                {scene === 0 ? (
                  <div className={styles.heroActions}>
                    <a href={instagramProfile} target="_blank" rel="noreferrer" onClick={trackOpenInstagram}>
                      <Camera size={17} aria-hidden="true" />
                      Instagram에서 시작하기
                    </a>
                  </div>
                ) : scene < scenes.length - 1 ? (
                  <button className={styles.nextControl} type="button" onClick={() => goToScene(scene + 1)}>
                    <ArrowDown size={16} aria-hidden="true" />
                    다음
                  </button>
                ) : (
                  <a className={styles.finalCta} href={instagramProfile} target="_blank" rel="noreferrer" onClick={trackOpenInstagram}>
                    <Camera size={18} aria-hidden="true" />
                    Instagram에서 시작하기
                  </a>
                )}

                <nav className={styles.storyDock} aria-label="맛핀 소개 장면 바로가기">
                  {dockItems.map(({ label, scene: targetScene, Icon }) => {
                    const nextTarget = dockItems.find((item) => item.scene > targetScene)?.scene ?? scenes.length;
                    const active = scene >= targetScene && scene < nextTarget;
                    return (
                      <button
                        key={label}
                        type="button"
                        data-active={active}
                        aria-current={active ? "step" : undefined}
                        onClick={() => goToScene(targetScene)}
                      >
                        <Icon size={17} aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className={styles.homeIndicator} aria-hidden="true" />
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
