"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Heart,
  LoaderCircle,
  MapPin,
  Navigation,
  Share2,
  TrainFront,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  groupMatpinPlacesByStation,
  matpinPrivateHref,
  matpinStationPath,
  type MatpinStationReel,
} from "@/lib/matpin/library";
import { stationForMatpinPlace, walkingMinutes } from "@/lib/matpin/stations";
import { MatpinReelArtwork, useMatpinReelPresentation } from "./matpin-reel-artwork";
import { useMatpinLibrary } from "./use-matpin-library";
import styles from "./matpin-map.module.css";

type ShareState = "idle" | "shared" | "copied" | "error";

export function MatpinReelDetail({ reelId, stationName }: { reelId: string; stationName: string }) {
  const { token, places, state, error, preview } = useMatpinLibrary();
  const detailsRef = useRef<HTMLElement | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const groups = useMemo(() => groupMatpinPlacesByStation(places), [places]);
  const group = groups.find((item) => item.name === stationName) ?? null;
  const reel = group?.reels.find((item) => item.reelId === reelId) ?? null;
  const presentationTarget: Pick<MatpinStationReel, "reelId" | "reelUrl"> = reel ?? { reelId, reelUrl: null };
  const presentation = useMatpinReelPresentation(presentationTarget, true);

  if (state === "loading") {
    return <main className={styles.statePage}><LoaderCircle className={styles.spinner} aria-hidden="true" /><b>릴스를 열고 있어요</b></main>;
  }

  if (state === "error") {
    return <main className={styles.statePage}><TrainFront aria-hidden="true" size={34} /><b>영상을 열 수 없어요</b><p role="alert">{error}</p><Link href="/matpin">맛핀 사용 방법 보기</Link></main>;
  }

  if (!group || !reel) {
    return <main className={styles.statePage}><CircleHelp aria-hidden="true" size={34} /><b>저장한 영상을 찾지 못했어요</b><p>역별 보관함으로 돌아가 다른 영상을 골라주세요.</p><Link href={matpinPrivateHref("/matpin/saved", token, preview)}>내 보관함으로</Link></main>;
  }

  const primary = reel.places[0];
  const originalUrl = reel.reelUrl;
  const backHref = matpinPrivateHref(matpinStationPath(group.name), token, preview);

  const shareOriginal = async () => {
    if (!originalUrl) {
      setShareState("error");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: primary.place.name, text: `${group.name}에서 저장한 맛집 릴스`, url: originalUrl });
        setShareState("shared");
      } else {
        await navigator.clipboard.writeText(originalUrl);
        setShareState("copied");
      }
    } catch (reason: unknown) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setShareState("error");
    }
  };

  return (
    <main className={styles.detailPage} data-clarity-mask="true">
      <section className={styles.detailMedia} aria-label={`${primary.place.name} 릴스`}>
        {presentation.videoUrl ? (
          <video
            className={styles.detailVideo}
            controls
            playsInline
            preload="metadata"
            poster={presentation.thumbnailUrl ?? undefined}
          >
            <source src={presentation.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <MatpinReelArtwork reel={reel} alt={`${primary.place.name} 릴스 대표 화면`} priority />
        )}
        <div className={styles.detailShade} aria-hidden="true" />
        <div className={styles.detailTopActions}>
          <Link href={backHref} aria-label={`${group.name} 영상 목록으로 돌아가기`}><ArrowLeft aria-hidden="true" size={22} /></Link>
          <span aria-label="저장됨" title="저장됨"><Heart aria-hidden="true" fill="currentColor" size={18} /></span>
        </div>
      </section>

      <section className={styles.detailBody}>
        <div className={styles.detailTitle}>
          <span><TrainFront aria-hidden="true" size={14} /> {group.name}</span>
          <h1>{primary.place.name}</h1>
          <p>{presentation.ownerUsername ? `@${presentation.ownerUsername}` : "Instagram 원본 릴스"}</p>
        </div>

        <nav className={styles.detailActions} aria-label="릴스 주요 행동">
          {originalUrl ? (
            <a href={originalUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" size={18} /><span>원본 릴스</span></a>
          ) : <span aria-disabled="true"><ExternalLink aria-hidden="true" size={18} /><span>원본 없음</span></span>}
          <a href={primary.place.mapUrl} target="_blank" rel="noreferrer"><Navigation aria-hidden="true" size={18} /><span>길찾기</span></a>
          <button type="button" onClick={shareOriginal}><Share2 aria-hidden="true" size={18} /><span>원본 릴스 공유</span></button>
          <button type="button" onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}><MapPin aria-hidden="true" size={18} /><span>장소 정보</span></button>
        </nav>

        {shareState !== "idle" ? (
          <p className={styles.shareFeedback} aria-live="polite">
            {shareState === "shared" ? <><Check aria-hidden="true" size={14} /> 원본 릴스를 공유했어요.</> : null}
            {shareState === "copied" ? <><Check aria-hidden="true" size={14} /> 원본 릴스 링크를 복사했어요.</> : null}
            {shareState === "error" ? "원본 릴스를 공유하지 못했어요. 원본 릴스 버튼을 이용해주세요." : null}
          </p>
        ) : null}

        <p className={styles.detailDescription}>{primary.place.matchReason}</p>

        <section className={styles.placeDetails} ref={detailsRef} aria-labelledby="place-details-title">
          <div className={styles.detailSectionHeading}>
            <span>이 역에서 찾은 장소</span>
            <h2 id="place-details-title">{group.name}에서<br />가기 쉬워요.</h2>
          </div>

          <div className={styles.placeDetailList}>
            {reel.places.map((saved) => {
              const station = stationForMatpinPlace(saved.place);
              const minutes = walkingMinutes(station.distanceMeters);
              return (
                <article key={saved.id}>
                  <div>
                    <strong>{saved.place.name}</strong>
                    <p>{group.name}{minutes ? `, 도보 약 ${minutes}분` : ""}</p>
                  </div>
                  <a href={saved.place.mapUrl} target="_blank" rel="noreferrer" aria-label={`${saved.place.name} 길찾기`}><ChevronRight aria-hidden="true" size={20} /></a>
                  <dl>
                    <div><dt>주소</dt><dd>{saved.place.address}</dd></div>
                    {saved.place.category ? <div><dt>종류</dt><dd>{saved.place.category}</dd></div> : null}
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        <aside className={styles.detailPrivacy}>
          <Check aria-hidden="true" size={16} /> 내 위치가 아니라 릴스 속 장소 주소로 역을 정했어요.
        </aside>
      </section>
    </main>
  );
}
