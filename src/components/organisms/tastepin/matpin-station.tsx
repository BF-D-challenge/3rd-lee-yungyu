"use client";

import { ArrowLeft, LoaderCircle, MapPin, Play, TrainFront } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  groupMatpinPlacesByStation,
  matpinPrivateHref,
  matpinReelPath,
} from "@/lib/matpin/library";
import { walkingMinutes } from "@/lib/matpin/stations";
import { MatpinReelArtwork } from "./matpin-reel-artwork";
import { useMatpinLibrary } from "./use-matpin-library";
import styles from "./matpin-map.module.css";

const RECENT_STATIONS_KEY = "matpin:recent-stations";

function rememberStation(name: string) {
  try {
    const current = JSON.parse(localStorage.getItem(RECENT_STATIONS_KEY) ?? "[]") as unknown;
    const names = Array.isArray(current) ? current.filter((item): item is string => typeof item === "string") : [];
    localStorage.setItem(RECENT_STATIONS_KEY, JSON.stringify([name, ...names.filter((item) => item !== name)].slice(0, 3)));
  } catch {
    localStorage.setItem(RECENT_STATIONS_KEY, JSON.stringify([name]));
  }
}

export function MatpinStation({ stationName }: { stationName: string }) {
  const { token, places, state, error, preview } = useMatpinLibrary();
  const [category, setCategory] = useState("전체");
  const groups = useMemo(() => groupMatpinPlacesByStation(places), [places]);
  const group = groups.find((item) => item.name === stationName) ?? null;
  const categories = useMemo(() => {
    if (!group) return ["전체"];
    return ["전체", ...new Set(group.reels.flatMap((reel) => reel.places.map((saved) => saved.place.category).filter(Boolean)))];
  }, [group]);
  const reels = useMemo(() => {
    if (!group || category === "전체") return group?.reels ?? [];
    return group.reels.filter((reel) => reel.places.some((saved) => saved.place.category === category));
  }, [category, group]);

  useEffect(() => {
    if (state === "ready" && group) rememberStation(group.name);
  }, [group, state]);

  if (state === "loading") {
    return <main className={styles.statePage}><LoaderCircle className={styles.spinner} aria-hidden="true" /><b>{stationName} 영상을 모으고 있어요</b></main>;
  }

  if (state === "error") {
    return <main className={styles.statePage}><TrainFront aria-hidden="true" size={34} /><b>역별 보관함을 열 수 없어요</b><p role="alert">{error}</p><Link href="/matpin">맛핀 사용 방법 보기</Link></main>;
  }

  if (!group) {
    return <main className={styles.statePage}><TrainFront aria-hidden="true" size={34} /><b>저장한 역을 찾지 못했어요</b><p>보관함으로 돌아가 다른 역을 골라주세요.</p><Link href={matpinPrivateHref("/matpin/saved", token, preview)}>내 보관함으로</Link></main>;
  }

  return (
    <main className={`${styles.page} ${styles.stationPage}`} data-clarity-mask="true">
      <header className={styles.stationTopBar}>
        <Link className={styles.iconButton} href={matpinPrivateHref("/matpin/saved", token, preview)} aria-label="역별 보관함으로 돌아가기">
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <div><h1>{group.name}</h1><span>영상 {group.reels.length}개</span></div>
      </header>

      <div className={styles.stationPageContent}>
        <nav className={styles.categoryNav} aria-label={`${group.name} 영상 종류`}>
          {categories.map((item) => (
            <button key={item} type="button" data-active={category === item} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </nav>

        {reels.length > 0 ? (
          <section className={styles.stationGrid} aria-label={`${group.name} 저장 영상`}>
            {reels.map((reel, index) => {
              const primary = reel.places[0];
              const minutes = walkingMinutes(reel.distanceMeters);
              return (
                <Link
                  className={styles.gridReelCard}
                  href={matpinPrivateHref(matpinReelPath(reel.reelId, group.name), token, preview)}
                  key={reel.key}
                  aria-label={`${primary.place.name} 영상 자세히 보기`}
                >
                  <span className={styles.gridReelMedia}>
                    <MatpinReelArtwork reel={reel} alt={`${primary.place.name} 릴스 대표 화면`} priority={index < 2} />
                    <span className={styles.gridPlay}><Play aria-hidden="true" fill="currentColor" size={15} /></span>
                  </span>
                  <span className={styles.gridReelCopy}>
                    <strong>{primary.place.name}</strong>
                    <small><MapPin aria-hidden="true" size={13} /> {minutes ? `도보 약 ${minutes}분` : `${group.name} 근처`}</small>
                  </span>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className={styles.noResults}>
            <TrainFront aria-hidden="true" size={28} />
            <h2>{category} 영상이 아직 없어요.</h2>
            <button type="button" onClick={() => setCategory("전체")}>전체 영상 보기</button>
          </section>
        )}
      </div>
    </main>
  );
}
