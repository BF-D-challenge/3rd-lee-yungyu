"use client";

import {
  ArrowLeft,
  Camera,
  Clock3,
  Search,
  SquarePlay,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  TastepinInstagramMention,
  TastepinLibraryPlace,
  TastepinLibraryResponse,
  TastepinYoutubeMention,
} from "@/lib/tastepin-library-contract";
import { formatDistance } from "@/lib/tastepin-distance";
import styles from "./matpick-search.module.css";

const RECENT_SEARCHES_KEY = "matpick:recent-searches:v1";
const MAX_RECENT_SEARCHES = 6;

type SearchMedia =
  | { platform: "instagram"; mention: TastepinInstagramMention }
  | { platform: "youtube"; mention: TastepinYoutubeMention };

const latestMediaForPlace = (place: TastepinLibraryPlace): SearchMedia | null => {
  const media: Array<SearchMedia & { publishedAt: string | null }> = [
    ...place.instagramMentions
      .filter((mention) => mention.kind === "reel")
      .map((mention) => ({
        platform: "instagram" as const,
        mention,
        publishedAt: mention.publishedAt,
      })),
    ...place.youtubeMentions
      .filter((mention) => mention.kind === "shorts")
      .map((mention) => ({
        platform: "youtube" as const,
        mention,
        publishedAt: mention.publishedAt,
      })),
  ];

  return media.sort(
    (a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
  )[0] ?? null;
};

const posterForPlace = (place: TastepinLibraryPlace) => {
  const media = latestMediaForPlace(place);
  if (media?.platform === "instagram" && media.mention.thumbnailUrl) {
    return media.mention.thumbnailUrl;
  }
  if (media?.platform === "youtube") return media.mention.thumbnailUrl;
  return null;
};

const searchableTextForPlace = (place: TastepinLibraryPlace) => {
  const media = latestMediaForPlace(place);
  return [
    place.name,
    place.area,
    place.category,
    place.occasion,
    place.address,
    media?.mention.title,
    media?.platform === "instagram" ? media.mention.creator : media?.mention.channel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
};

const readRecentSearches = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
};

const writeRecentSearches = (searches: string[]) => {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
};

const stationSearches = ["강남역", "역삼역", "신논현역", "지역 전체"] as const;

export function MatpickSearch({
  initialLibrary,
}: {
  initialLibrary: TastepinLibraryResponse;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(readRecentSearches());
    inputRef.current?.focus();
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const searchablePlaces = useMemo(
    () => initialLibrary.places.filter((place) => latestMediaForPlace(place) !== null),
    [initialLibrary.places],
  );
  const latestPlaces = useMemo(
    () => [...searchablePlaces]
      .sort((a, b) => (
        (latestMediaForPlace(b)?.mention.publishedAt ?? "").localeCompare(
          latestMediaForPlace(a)?.mention.publishedAt ?? "",
        )
      ))
      .slice(0, 6),
    [searchablePlaces],
  );
  const results = useMemo(
    () => normalizedQuery
      ? searchablePlaces
        .filter((place) => searchableTextForPlace(place).includes(normalizedQuery))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
      : [],
    [normalizedQuery, searchablePlaces],
  );

  const saveRecentSearch = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue || normalizedValue === "지역 전체") return;
    setRecentSearches((current) => {
      const next = [
        normalizedValue,
        ...current.filter((item) => item !== normalizedValue),
      ].slice(0, MAX_RECENT_SEARCHES);
      writeRecentSearches(next);
      return next;
    });
  };

  const applySearch = (value: string) => {
    if (value === "지역 전체") {
      setQuery("");
    } else {
      setQuery(value);
      saveRecentSearch(value);
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveRecentSearch(query);
  };

  const removeRecentSearch = (value: string) => {
    setRecentSearches((current) => {
      const next = current.filter((item) => item !== value);
      writeRecentSearches(next);
      return next;
    });
  };

  const clearRecentSearches = () => {
    writeRecentSearches([]);
    setRecentSearches([]);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.searchHeader}>
        <button
          aria-label="맛집 목록으로 돌아가기"
          className={styles.backButton}
          onClick={() => router.push("/matpin/map")}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={24} />
        </button>
        <form className={styles.searchForm} onSubmit={submitSearch} role="search">
          <Search aria-hidden="true" size={21} />
          <input
            aria-label="음식점, 지역, 메뉴 검색"
            autoComplete="off"
            autoFocus
            enterKeyHint="search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveRecentSearch(event.currentTarget.value);
            }}
            placeholder="음식점, 지역, 메뉴 검색"
            ref={inputRef}
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="검색어 지우기"
              className={styles.clearQuery}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          ) : null}
        </form>
        <button
          className={styles.closeButton}
          onClick={() => router.push("/matpin/map")}
          type="button"
        >
          닫기
        </button>
      </header>

      <div className={styles.content}>
        <nav className={styles.stationRail} aria-label="지역 빠른 검색">
          {stationSearches.map((label) => (
            <button
              aria-pressed={query === label || (label === "지역 전체" && !query)}
              key={label}
              onClick={() => applySearch(label)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {normalizedQuery ? (
          <section aria-live="polite" aria-label="검색 결과">
            <div className={styles.sectionHeader}>
              <h1>검색 결과</h1>
              <span>{results.length}곳</span>
            </div>
            {results.length > 0 ? (
              <ul className={styles.resultGrid}>
                {results.map((place) => (
                  <SearchResult
                    key={place.id}
                    onOpen={() => saveRecentSearch(query)}
                    place={place}
                  />
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <Search aria-hidden="true" size={28} />
                <b>검색 결과가 없어요.</b>
                <p>다른 음식점, 지역, 메뉴로 검색해보세요.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            <section aria-labelledby="latest-search-title">
              <div className={styles.sectionHeader}>
                <h1 id="latest-search-title">최신 영상</h1>
                <span>{latestPlaces.length}곳</span>
              </div>
              <ul className={styles.resultGrid}>
                {latestPlaces.map((place) => (
                  <SearchResult key={place.id} onOpen={() => undefined} place={place} />
                ))}
              </ul>
            </section>

            <section className={styles.recentSection} aria-labelledby="recent-search-title">
              <div className={styles.sectionHeader}>
                <h2 id="recent-search-title">최근 검색</h2>
                {recentSearches.length > 0 ? (
                  <button onClick={clearRecentSearches} type="button">전체 삭제</button>
                ) : null}
              </div>
              {recentSearches.length > 0 ? (
                <ul className={styles.recentList}>
                  {recentSearches.map((item) => (
                    <li key={item}>
                      <button
                        className={styles.recentQuery}
                        onClick={() => applySearch(item)}
                        type="button"
                      >
                        <Clock3 aria-hidden="true" size={20} />
                        <span>{item}</span>
                      </button>
                      <button
                        aria-label={`${item} 최근 검색에서 삭제`}
                        className={styles.removeRecent}
                        onClick={() => removeRecentSearch(item)}
                        type="button"
                      >
                        <X aria-hidden="true" size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noRecent}>검색한 맛집과 지역이 여기에 저장돼요.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SearchResult({
  onOpen,
  place,
}: {
  onOpen: () => void;
  place: TastepinLibraryPlace;
}) {
  const media = latestMediaForPlace(place);
  const poster = posterForPlace(place);
  const mediaUrl = media?.mention.url ?? place.source.url ?? place.mapUrl;

  return (
    <li>
      <a
        aria-label={`${place.name} 언급 영상 보기`}
        className={styles.resultCard}
        href={mediaUrl}
        onClick={onOpen}
        rel="noreferrer"
        target="_blank"
      >
        <span
          className={styles.resultThumb}
          style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
        >
          <span className={styles.resultGradient} aria-hidden="true" />
          <span className={styles.resultCopy}>
            <b>{place.name}</b>
            <small>
              {media?.platform === "instagram" ? (
                <Camera aria-hidden="true" size={14} />
              ) : (
                <SquarePlay aria-hidden="true" size={14} />
              )}
              {formatDistance(place.distanceMeters)}
            </small>
          </span>
        </span>
      </a>
    </li>
  );
}
