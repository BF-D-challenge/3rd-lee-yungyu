"use client";

import {
  Bookmark,
  Camera,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Search,
  SquarePlay,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  tastepinLibraryResponseSchema,
  type TastepinInstagramMention,
  type TastepinLibraryPlace,
  type TastepinLibraryResponse,
  type TastepinYoutubeMention,
} from "@/lib/tastepin-library-contract";
import { distanceInMeters, formatDistance } from "@/lib/tastepin-distance";
import {
  loadImportedMatpickPlaces,
  loadSavedMatpickPlaceIds,
  toggleSavedMatpickPlace,
} from "@/lib/storage";
import styles from "./tastepin-map.module.css";

type LoadState = "loading" | "ready" | "error";
type CollectionId = "all" | string;
type SortMode = "latest" | "views";

type LatestMedia =
  | {
      platform: "instagram";
      mention: TastepinInstagramMention;
      publishedAt: string | null;
    }
  | {
      platform: "youtube";
      mention: TastepinYoutubeMention;
      publishedAt: string | null;
    };

const placeYoutubeViews = (place: TastepinLibraryPlace) => (
  place.youtubeMentions
    .filter((mention) => mention.kind === "shorts")
    .reduce((total, mention) => total + (mention.viewCount ?? 0), 0)
);

const placeLatestPublishedAt = (place: TastepinLibraryPlace) => (
  [
    ...place.instagramMentions
      .filter((mention) => mention.kind === "reel")
      .map((mention) => mention.publishedAt),
    ...place.youtubeMentions
      .filter((mention) => mention.kind === "shorts")
      .map((mention) => mention.publishedAt),
  ]
    .filter((publishedAt): publishedAt is string => publishedAt !== null)
    .sort((a, b) => b.localeCompare(a))[0] ?? null
);

const comparePlaces = (
  a: TastepinLibraryPlace,
  b: TastepinLibraryPlace,
  sortMode: SortMode,
) => {
  if (sortMode === "latest") {
    const byPublishedAt = (placeLatestPublishedAt(b) ?? "")
      .localeCompare(placeLatestPublishedAt(a) ?? "");
    if (byPublishedAt !== 0) return byPublishedAt;
  }

  return (
    placeYoutubeViews(b) - placeYoutubeViews(a)
    || a.distanceMeters - b.distanceMeters
  );
};

const sortPlaces = (places: TastepinLibraryPlace[], sortMode: SortMode) => (
  [...places].sort((a, b) => comparePlaces(a, b, sortMode))
);

const formatPublishedAt = (publishedAt: string | null) => (
  publishedAt ? publishedAt.replaceAll("-", ".") : "게시일 확인 중"
);

const latestMediaForPlace = (place: TastepinLibraryPlace): LatestMedia | null => {
  const media: LatestMedia[] = [
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

const youtubeFrameUrl = (id: string) => (
  `https://i.ytimg.com/vi/${id}/hq2.jpg`
);

const posterForPlace = (place: TastepinLibraryPlace) => {
  const latest = latestMediaForPlace(place);
  if (latest?.platform === "instagram" && latest.mention.thumbnailUrl) {
    return latest.mention.thumbnailUrl;
  }
  if (latest?.platform === "youtube") return youtubeFrameUrl(latest.mention.id);
  const fallbackVideo = place.youtubeMentions.find((mention) => mention.kind === "shorts")
    ?? place.youtubeMentions[0];

  return (fallbackVideo ? youtubeFrameUrl(fallbackVideo.id) : null)
    ?? place.instagramMentions.find(
      (mention) => mention.kind === "reel" && mention.thumbnailUrl,
    )?.thumbnailUrl
    ?? null;
};

const compactDisplayName = (name: string) => (
  name.replace(" 강남직영점", "")
);

export function TastepinMap({
  initialLibrary,
}: {
  initialLibrary: TastepinLibraryResponse;
}) {
  const initialCollectionId: CollectionId = "all";
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [library, setLibrary] = useState<TastepinLibraryResponse>(initialLibrary);
  const [activeCollectionId, setActiveCollectionId] = useState<CollectionId>(
    initialCollectionId,
  );
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeInstagram, setActiveInstagram] = useState<TastepinInstagramMention | null>(null);
  const [activeVideo, setActiveVideo] = useState<TastepinYoutubeMention | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const detailRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedStation = searchParams.get("station");
    const requestedCollection = initialLibrary.stationCollections.find(
      (collection) => (
        collection.id === requestedStation
        || collection.station === requestedStation
      ),
    );

    setSavedPlaceIds(loadSavedMatpickPlaceIds());
    setSavedOnly(searchParams.get("saved") === "1");
    if (requestedCollection) setActiveCollectionId(requestedCollection.id);
    const importedPlaces = loadImportedMatpickPlaces().map((place) => ({
      ...place,
      distanceMeters: distanceInMeters(initialLibrary.origin, place),
    }));
    if (importedPlaces.length === 0) return;

    setLibrary((current) => ({
      ...current,
      places: [
        ...importedPlaces,
        ...current.places.filter((place) => (
          !importedPlaces.some((imported) => imported.id === place.id)
        )),
      ].sort((a, b) => a.distanceMeters - b.distanceMeters),
    }));
  }, [initialLibrary.origin, initialLibrary.stationCollections]);

  const loadLibrary = useCallback(async () => {
    setLoadState("loading");

    try {
      const response = await fetch("/api/tastepin/library", { cache: "no-store" });
      const parsed = tastepinLibraryResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) throw new Error("invalid_library");
      const importedPlaces = loadImportedMatpickPlaces().map((place) => ({
        ...place,
        distanceMeters: distanceInMeters(parsed.data.origin, place),
      }));
      const nextLibrary = {
        ...parsed.data,
        places: [
          ...importedPlaces,
          ...parsed.data.places.filter((place) => (
            !importedPlaces.some((imported) => imported.id === place.id)
          )),
        ].sort((a, b) => a.distanceMeters - b.distanceMeters),
      };

      setLibrary(nextLibrary);
      setActiveCollectionId("all");
      setSelectedId(null);
      setActiveInstagram(null);
      setActiveVideo(null);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  const activeCollection = library.stationCollections.find(
    (collection) => collection.id === activeCollectionId,
  ) ?? null;

  const shortFormPlaces = useMemo(
    () => library.places.filter((place) => latestMediaForPlace(place) !== null),
    [library.places],
  );

  const collectionPlaces = useMemo(
    () => activeCollection
      ? shortFormPlaces.filter((place) => activeCollection.placeIds.includes(place.id))
      : shortFormPlaces,
    [activeCollection, shortFormPlaces],
  );

  const visiblePlaces = useMemo(
    () => sortPlaces(
      collectionPlaces.filter((place) => {
        if (savedOnly && !savedPlaceIds.includes(place.id)) return false;
        return true;
      }),
      sortMode,
    ),
    [collectionPlaces, savedOnly, savedPlaceIds, sortMode],
  );

  const selectedPlace = selectedId
    ? library.places.find((place) => place.id === selectedId) ?? null
    : null;

  const selectCollection = (collectionId: CollectionId) => {
    setActiveCollectionId(collectionId);
    setSavedOnly(false);
    setSelectedId(null);
    setActiveInstagram(null);
    setActiveVideo(null);
  };

  const selectSortMode = (nextSortMode: SortMode) => {
    setSortMode(nextSortMode);
    setSelectedId(null);
    setActiveInstagram(null);
    setActiveVideo(null);
  };

  const openPlace = (place: TastepinLibraryPlace) => {
    const latest = latestMediaForPlace(place);
    setSelectedId(place.id);
    setActiveInstagram(latest?.platform === "instagram" ? latest.mention : null);
    setActiveVideo(latest?.platform === "youtube" ? latest.mention : null);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  const toggleSave = (place: TastepinLibraryPlace) => {
    const next = toggleSavedMatpickPlace(place);
    setSavedPlaceIds(next.ids);
  };

  const toggleSavedOnly = () => {
    setSavedOnly((current) => !current);
    setSelectedId(null);
    setActiveInstagram(null);
    setActiveVideo(null);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.appBar}>
        <Link className={styles.brandLink} href="/matpin" aria-label="맛핀 소개로 돌아가기">
          맛핀
        </Link>
        <div className={styles.headerActions}>
          <Link
            aria-label="맛집 검색"
            className={styles.headerIconAction}
            href="/matpin/search"
          >
            <Search aria-hidden="true" size={21} />
          </Link>
          <button
            className={styles.savedHeaderAction}
            data-selected={savedOnly}
            onClick={toggleSavedOnly}
            type="button"
            aria-label={savedOnly ? "전체 맛집 보기" : `저장한 맛집 ${savedPlaceIds.length}곳 보기`}
            aria-pressed={savedOnly}
          >
            <Bookmark
              aria-hidden="true"
              fill={savedOnly ? "currentColor" : "none"}
              size={21}
            />
            <span aria-hidden="true">{savedPlaceIds.length}</span>
          </button>
        </div>
      </header>

      {loadState === "loading" ? (
        <LoadingView />
      ) : loadState === "error" ? (
        <ErrorView onRetry={() => void loadLibrary()} />
      ) : (
        <div className={styles.content}>
          <nav className={styles.stationScroller} aria-label="정렬 및 지역 선택">
            <label className={styles.sortSelect}>
              <span className={styles.srOnly}>정렬 기준</span>
              <select
                aria-label="정렬 기준"
                onChange={(event) => selectSortMode(event.target.value as SortMode)}
                value={sortMode}
              >
                <option value="latest">최신순</option>
                <option value="views">조회수순</option>
              </select>
              <ChevronDown aria-hidden="true" size={16} />
            </label>
            <span className={styles.filterDivider} aria-hidden="true" />
            {library.stationCollections.map((collection) => {
              const placeCount = shortFormPlaces.filter(
                (place) => collection.placeIds.includes(place.id),
              ).length;

              return (
                <button
                  className={styles.stationChip}
                  data-selected={activeCollectionId === collection.id}
                  key={collection.id}
                  onClick={() => selectCollection(collection.id)}
                  type="button"
                  aria-label={`${collection.station} ${placeCount}곳`}
                  aria-pressed={activeCollectionId === collection.id}
                >
                  {collection.station}
                </button>
              );
            })}
            <button
              className={styles.stationChip}
              data-selected={activeCollectionId === "all"}
              onClick={() => selectCollection("all")}
              type="button"
              aria-label={`지역 전체 ${shortFormPlaces.length}곳`}
              aria-pressed={activeCollectionId === "all"}
            >
              지역 전체
            </button>
          </nav>

          {visiblePlaces.length > 0 ? (
            <section className={styles.discoverGridSection} aria-label="맛집 숏폼 목록">
              <div className={styles.placeGrid}>
                {visiblePlaces.map((place) => (
                  <CompactPlaceCard
                    key={place.id}
                    onOpen={() => openPlace(place)}
                    onToggleSave={() => toggleSave(place)}
                    place={place}
                    saved={savedPlaceIds.includes(place.id)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <EmptyResultsView
              savedOnly={savedOnly}
              onClear={() => setSavedOnly(false)}
            />
          )}

          {selectedPlace ? (
            <section className={styles.detailSection} ref={detailRef} aria-label="선택한 맛집 영상">
              <SelectedPlaceCard
                activeInstagram={activeInstagram}
                activeVideo={activeVideo}
                onCloseInstagram={() => setActiveInstagram(null)}
                onCloseVideo={() => setActiveVideo(null)}
                onDismiss={() => {
                  setSelectedId(null);
                  setActiveInstagram(null);
                  setActiveVideo(null);
                }}
                onOpenInstagram={(mention) => {
                  setActiveVideo(null);
                  setActiveInstagram(mention);
                }}
                onPlayVideo={(video) => {
                  setActiveInstagram(null);
                  setActiveVideo(video);
                }}
                onToggleSave={() => toggleSave(selectedPlace)}
                place={selectedPlace}
                saved={savedPlaceIds.includes(selectedPlace.id)}
              />
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}

function CompactPlaceCard({
  onOpen,
  onToggleSave,
  place,
  saved,
}: {
  onOpen: () => void;
  onToggleSave: () => void;
  place: TastepinLibraryPlace;
  saved: boolean;
}) {
  const media = latestMediaForPlace(place);
  const poster = posterForPlace(place);

  return (
    <article className={styles.compactPlace}>
      <button
        className={styles.compactMainAction}
        onClick={onOpen}
        type="button"
        aria-label={`${place.name}, ${formatDistance(place.distanceMeters)}, 원본 영상 재생`}
      >
        <span
          className={styles.compactThumb}
          style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
          aria-hidden="true"
        >
          <span className={styles.compactInfoShelf} />
          <span className={styles.compactName}>{compactDisplayName(place.name)}</span>
          <span
            className={styles.compactMeta}
            data-platform={media?.platform ?? "youtube"}
          >
            {media?.platform === "instagram" ? (
              <Camera aria-hidden="true" size={14} />
            ) : (
              <SquarePlay aria-hidden="true" size={14} />
            )}
            {formatDistance(place.distanceMeters)}
          </span>
        </span>
      </button>
      <button
        className={styles.compactBookmark}
        data-saved={saved}
        onClick={onToggleSave}
        type="button"
        aria-label={`${place.name} ${saved ? "저장 취소" : "저장"}`}
        aria-pressed={saved}
      >
        <Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} size={19} />
      </button>
    </article>
  );
}

function SelectedPlaceCard({
  activeInstagram,
  activeVideo,
  onCloseInstagram,
  onCloseVideo,
  onDismiss,
  onOpenInstagram,
  onPlayVideo,
  onToggleSave,
  place,
  saved,
}: {
  activeInstagram: TastepinInstagramMention | null;
  activeVideo: TastepinYoutubeMention | null;
  onCloseInstagram: () => void;
  onCloseVideo: () => void;
  onDismiss: () => void;
  onOpenInstagram: (mention: TastepinInstagramMention) => void;
  onPlayVideo: (video: TastepinYoutubeMention) => void;
  onToggleSave: () => void;
  place: TastepinLibraryPlace;
  saved: boolean;
}) {
  const latest = latestMediaForPlace(place);
  const reelMentions = place.instagramMentions.filter(
    (mention) => mention.kind === "reel",
  );
  const shortsMentions = place.youtubeMentions.filter(
    (mention) => mention.kind === "shorts",
  );
  const originalUrl = activeInstagram?.url
    ?? activeVideo?.url
    ?? (latest?.platform === "instagram" ? latest.mention.url : latest?.mention.url)
    ?? place.source.url;

  return (
    <article className={styles.selectedCard} aria-live="polite">
      <div className={styles.selectedHeader}>
        <div>
          <span>{formatDistance(place.distanceMeters)} · {place.category} · {place.area}</span>
          <h2>{place.name}</h2>
          <p>{place.address}</p>
        </div>
        <button className={styles.closeDetail} onClick={onDismiss} type="button" aria-label="상세 닫기">
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      {activeInstagram ? (
        <div
          className={`${styles.inlinePlayer} ${styles.instagramPlayer}`}
          data-orientation="portrait"
        >
          <div className={styles.playerBar}>
            <span>Instagram {activeInstagram.creator}</span>
            <button type="button" onClick={onCloseInstagram} aria-label="Instagram 닫기">
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <iframe
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            src={activeInstagram.embedUrl}
            title={activeInstagram.title}
          />
        </div>
      ) : activeVideo ? (
        <div className={styles.inlinePlayer} data-orientation="portrait">
          <div className={styles.playerBar}>
            <span>{activeVideo.channel}</span>
            <button type="button" onClick={onCloseVideo} aria-label="영상 닫기">
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <iframe
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
            title={activeVideo.title}
          />
        </div>
      ) : (
        <div className={styles.mediaChoices}>
          {reelMentions.map((mention) => (
            <button key={mention.id} onClick={() => onOpenInstagram(mention)} type="button">
              <Camera aria-hidden="true" size={18} />
              <span>
                <b>{mention.title}</b>
                <small>{formatPublishedAt(mention.publishedAt)} · Instagram</small>
              </span>
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          ))}
          {shortsMentions.map((video) => (
            <button key={video.id} onClick={() => onPlayVideo(video)} type="button">
              <SquarePlay aria-hidden="true" size={18} />
              <span>
                <b>{video.title}</b>
                <small>{formatPublishedAt(video.publishedAt)} · YouTube</small>
              </span>
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.placeActions}>
        <button
          className={styles.saveAction}
          data-saved={saved}
          onClick={onToggleSave}
          type="button"
          aria-pressed={saved}
        >
          <Bookmark aria-hidden="true" size={18} fill={saved ? "currentColor" : "none"} />
          {saved ? "저장됨" : "저장하기"}
        </button>
        {originalUrl ? (
          <a className={styles.primaryAction} href={originalUrl} target="_blank" rel="noreferrer">
            원본 영상 보기
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function EmptyResultsView({
  onClear,
  savedOnly,
}: {
  onClear: () => void;
  savedOnly: boolean;
}) {
  return (
    <section className={styles.emptyView}>
      <Bookmark aria-hidden="true" size={28} />
      <b>저장한 맛집이 아직 없어요.</b>
      <span>영상의 저장 버튼을 누르면 여기에 모여요.</span>
      <button type="button" onClick={onClear}>
        {savedOnly ? "전체 맛집 보기" : "목록으로 돌아가기"}
      </button>
    </section>
  );
}

function LoadingView() {
  return (
    <div className={styles.stateView} role="status">
      <div className={styles.loader} />
      <b>최신 릴스와 쇼츠를 불러오고 있어요</b>
      <span>잠시만 기다려주세요.</span>
    </div>
  );
}

function ErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.stateView}>
      <b>최신 맛집을 불러오지 못했어요.</b>
      <span>연결을 확인하고 다시 시도해주세요.</span>
      <button type="button" onClick={onRetry}>
        <RotateCcw aria-hidden="true" size={17} />
        다시 불러오기
      </button>
    </div>
  );
}
