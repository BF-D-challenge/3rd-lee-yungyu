"use client";

import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
  Play,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  TrainFront,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  groupMatpinPlacesByStation,
  matpinPrivateHref,
  matpinReelPath,
  matpinReelSearchText,
  matpinStationPath,
  matpinUniqueReelCount,
} from "@/lib/matpin/library";
import { MatpinReelArtwork } from "./matpin-reel-artwork";
import { useMatpinLibrary } from "./use-matpin-library";
import styles from "./matpin-map.module.css";

export function MatpinSaved({ autoFocusSearch = false }: { autoFocusSearch?: boolean }) {
  const { token, places, state, error, preview } = useMatpinLibrary();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusSearch && state === "ready") searchRef.current?.focus();
  }, [autoFocusSearch, state]);

  const groups = useMemo(() => groupMatpinPlacesByStation(places), [places]);
  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return groups;
    return groups.flatMap((group) => {
      if (group.name.toLocaleLowerCase("ko-KR").includes(normalized)) return [group];
      const reels = group.reels.filter((reel) => matpinReelSearchText(reel).includes(normalized));
      return reels.length > 0 ? [{ ...group, reels }] : [];
    });
  }, [groups, query]);
  const reelCount = useMemo(() => matpinUniqueReelCount(places), [places]);

  if (state === "loading") {
    return <main className={styles.statePage}><LoaderCircle className={styles.spinner} aria-hidden="true" /><b>역별 보관함을 열고 있어요</b><p>저장한 게시물을 가까운 역별로 모으고 있어요.</p></main>;
  }

  if (state === "error") {
    return (
      <main className={styles.statePage}>
        <TrainFront aria-hidden="true" size={34} />
        <b>개인 보관함을 열 수 없어요</b>
        <p role="alert">{error}</p>
        <Link href="/matpin">맛핀 사용 방법 보기</Link>
      </main>
    );
  }

  return (
    <main className={styles.page} data-clarity-mask="true">
      <header className={styles.topBar}>
        <Link className={styles.iconButton} href="/matpin" aria-label="맛핀 소개로 돌아가기">
          <ArrowLeft aria-hidden="true" size={22} />
        </Link>
        <Link className={styles.wordmark} href="/matpin">matpin.kr</Link>
        <a className={styles.sendButton} href="https://www.instagram.com/matpin.kr/" target="_blank" rel="noreferrer">
          <Send aria-hidden="true" size={15} /> 게시물 보내기
        </a>
      </header>

      <div className={styles.content}>
        <section className={styles.intro} aria-labelledby="saved-reels-title">
          <span className={styles.eyebrow}>내 맛집 게시물 보관함</span>
          <h1 id="saved-reels-title">저장한 역</h1>
          <p>역 {groups.length}개, 영상 {reelCount}개</p>
        </section>

        <label className={styles.searchBox}>
          <Search aria-hidden="true" size={20} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="역 이름 또는 가게 검색"
            aria-label="역 이름 또는 가게 검색"
          />
          {query ? <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기"><X aria-hidden="true" size={18} /></button> : <span />}
        </label>

        {places.length === 0 ? (
          <section className={styles.emptyState}>
            <Send aria-hidden="true" size={30} />
            <h2>아직 저장한 게시물가 없어요.</h2>
            <p>Instagram에서 맛집 게시물을 matpin.kr로 보내면 가까운 역에 자동으로 정리해요.</p>
            <a href="https://www.instagram.com/matpin.kr/" target="_blank" rel="noreferrer">Instagram에서 첫 게시물 보내기 <ChevronRight aria-hidden="true" size={17} /></a>
          </section>
        ) : filteredGroups.length > 0 ? (
          <div className={styles.stationList}>
            {filteredGroups.map((group, groupIndex) => (
              <section className={styles.stationSection} key={group.name} aria-labelledby={`station-title-${groupIndex}`}>
                <Link className={styles.stationHeading} href={matpinPrivateHref(matpinStationPath(group.name), token, preview)}>
                  <div>
                    <span>{group.isStation ? "가까운 역" : "저장한 지역"}</span>
                    <h2 id={`station-title-${groupIndex}`}>{group.name}</h2>
                  </div>
                  <b>영상 {group.reels.length}개 <ChevronRight aria-hidden="true" size={16} /></b>
                </Link>

                <div className={styles.reelRail}>
                  {group.reels.slice(0, 3).map((reel, reelIndex) => {
                    const primary = reel.places[0];
                    return (
                      <Link
                        className={styles.reelCard}
                        href={matpinPrivateHref(matpinReelPath(reel.reelId, group.name), token, preview)}
                        key={reel.key}
                        aria-label={`${group.name} ${primary.place.name} 영상 자세히 보기`}
                      >
                        <span className={styles.reelMedia}>
                          <MatpinReelArtwork reel={reel} alt={`${primary.place.name} 게시물 대표 화면`} priority={groupIndex === 0 && reelIndex < 3} />
                          <span className={styles.playBadge}><Play aria-hidden="true" fill="currentColor" size={16} /></span>
                        </span>
                        <span className={styles.reelCopy}>
                          <strong>{primary.place.name}</strong>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className={styles.noResults}>
            <Search aria-hidden="true" size={27} />
            <h2>찾는 영상이 없어요.</h2>
            <p>다른 역 이름이나 가게 이름으로 검색해보세요.</p>
            <button type="button" onClick={() => setQuery("")}>전체 영상 보기</button>
          </section>
        )}

        <aside className={styles.privacyNote}>
          <ShieldCheck aria-hidden="true" size={18} />
          <span><b>내 위치는 사용하지 않아요.</b><small>게시물 속 장소의 주소로 가까운 역만 찾아요.</small></span>
        </aside>

        <Link className={styles.dataLink} href={`/matpin/delete#token=${encodeURIComponent(token)}`}><Settings2 aria-hidden="true" size={17} /> 내 데이터 관리</Link>
      </div>
    </main>
  );
}
