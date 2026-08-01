import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Camera,
  ExternalLink,
  Link2,
  ListVideo,
  Send,
  Share2,
  ShieldCheck,
  SquarePlay,
} from "lucide-react";
import type { TastepinLibraryPlace } from "@/lib/tastepin-library-contract";
import { createTastepinLibrary } from "@/lib/tastepin-library-data";
import { formatDistance } from "@/lib/tastepin-distance";
import styles from "./matpick-start.module.css";

export const metadata: Metadata = {
  title: "역삼역 숏폼 맛집 — MATPICK",
  description: "역삼역에서 최근 공개 릴스와 쇼츠에 나온 맛집을 먼저 보고, 원본 영상과 함께 저장하세요.",
};

const instagramUrl = "https://www.instagram.com/matpickapp/";
const dmReady = process.env.NEXT_PUBLIC_MATPICK_DM_READY === "true";

const steps = [
  {
    icon: Share2,
    title: "릴스에서 공유를 눌러요",
    description: "나중에 가고 싶은 맛집 영상을 발견한 순간 시작해요.",
  },
  {
    icon: Send,
    title: "@matpickapp으로 보내요",
    description: "받는 사람에서 MATPICK 계정을 고르면 돼요.",
  },
  {
    icon: ListVideo,
    title: "장소를 확인하고 저장해요",
    description: "맞는 식당을 고르면 원본 영상과 함께 내 저장함에 들어가요.",
  },
] as const;

const mediaForPlace = (place: TastepinLibraryPlace) => {
  const instagram = place.instagramMentions
    .filter((mention) => mention.kind === "reel")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];
  const youtube = place.youtubeMentions
    .filter((mention) => mention.kind === "shorts")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];

  if ((instagram?.publishedAt ?? "") >= (youtube?.publishedAt ?? "") && instagram) {
    return {
      platform: "instagram" as const,
      poster: instagram.thumbnailUrl,
      publishedAt: instagram.publishedAt,
    };
  }

  return youtube
    ? {
        platform: "youtube" as const,
        poster: youtube.thumbnailUrl,
        publishedAt: youtube.publishedAt,
      }
    : null;
};

export default function MatpickStartPage() {
  const library = createTastepinLibrary();
  const yeoksam = library.stationCollections.find(
    (collection) => collection.id === "yeoksam-station",
  );
  const featuredPlaces = library.places
    .filter((place) => yeoksam?.placeIds.includes(place.id))
    .filter((place) => mediaForPlace(place) !== null)
    .sort((a, b) => (
      (mediaForPlace(b)?.publishedAt ?? "").localeCompare(
        mediaForPlace(a)?.publishedAt ?? "",
      )
    ))
    .slice(0, 3);

  return (
    <main className={styles.shell}>
      <header className={styles.appBar}>
        <Link className={styles.backButton} href="/" aria-label="앱 목록으로 돌아가기">
          <ArrowLeft aria-hidden="true" size={21} />
        </Link>
        <Link className={styles.brand} href="/matpick" aria-label="MATPICK 홈">
          MATPICK
        </Link>
        <Link className={styles.savedLink} href="/matpick/map?saved=1" aria-label="내 저장함 보기">
          <Bookmark aria-hidden="true" size={20} />
        </Link>
      </header>

      <div className={styles.content}>
        <section className={styles.discovery} aria-labelledby="matpick-start-title">
          <p className={styles.eyebrow}>역삼역 · 최근 공개 릴스와 쇼츠</p>
          <h1 id="matpick-start-title">
            역삼역에서
            <br />
            지금 볼 맛집
          </h1>
          <p className={styles.lead}>
            오래된 블로그 목록 대신 최근 숏폼에 나온 식당과 원본 영상을 함께 보여드려요.
          </p>

          <div className={styles.previewGrid} aria-label="역삼역 최신 숏폼 맛집 미리보기">
            {featuredPlaces.map((place) => {
              const media = mediaForPlace(place);
              return (
                <article className={styles.previewCard} key={place.id}>
                  <span
                    className={styles.previewPoster}
                    style={media?.poster ? { backgroundImage: `url("${media.poster}")` } : undefined}
                  >
                    <span className={styles.previewGradient} aria-hidden="true" />
                    <span className={styles.previewCopy}>
                      <strong>{place.name}</strong>
                      <small>
                        {media?.platform === "instagram" ? (
                          <Camera aria-hidden="true" size={13} />
                        ) : (
                          <SquarePlay aria-hidden="true" size={13} />
                        )}
                        {formatDistance(place.distanceMeters)}
                      </small>
                    </span>
                  </span>
                </article>
              );
            })}
          </div>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/matpick/map?station=yeoksam-station">
              역삼역 {yeoksam?.placeIds.length ?? featuredPlaces.length}곳 보기
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a className={styles.secondaryAction} href="#save-reels">
              내 릴스 저장 방법
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <Link className={styles.secondaryAction} href="/reserve/matpick">
              MATPICK 초기 체험 예약
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>

          <p className={styles.accountNote}>
            <ShieldCheck aria-hidden="true" size={18} />
            회원가입 없이 먼저 둘러봐요. 계정 연결은 저장함을 다른 기기에서 복구할 때만 필요해요.
          </p>
        </section>

        <section className={styles.saveFlow} id="save-reels" aria-labelledby="save-reels-title">
          <p className={styles.eyebrow}>내가 본 릴스도 저장</p>
          <h2 id="save-reels-title">공유 한 번이면 장소별로 정리돼요</h2>
          <p className={styles.saveLead}>Instagram을 보다가 맛집 릴스를 발견하면 MATPICK으로 보내세요.</p>

          <ol className={styles.steps} aria-label="릴스 저장 방법">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className={styles.step}>
                <span className={styles.stepIcon}>
                  <Icon aria-hidden="true" size={21} strokeWidth={2} />
                </span>
                <span className={styles.stepText}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </li>
            ))}
          </ol>

          <div className={styles.status} role="status">
            <span className={dmReady ? styles.readyDot : styles.preparingDot} aria-hidden="true" />
            <div>
              <strong>{dmReady ? "Instagram 저장을 사용할 수 있어요" : "Instagram 자동 저장을 연결하고 있어요"}</strong>
              <p>
                {dmReady
                  ? "프로필에서 메시지를 열고 맛집 릴스를 보내주세요."
                  : "지금은 공개 릴스 링크로 같은 저장 흐름을 체험할 수 있어요."}
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/matpick/dm">
              릴스 저장 흐름 체험
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a
              className={styles.secondaryAction}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram에서 matpickapp 프로필 열기, 새 창"
            >
              @matpickapp 열기
              <ExternalLink aria-hidden="true" size={18} />
            </a>
          </div>

          <Link className={styles.fallbackLink} href="/matpick/import">
            <Link2 aria-hidden="true" size={17} />
            YouTube Shorts 링크로 저장하기
          </Link>
        </section>
      </div>
    </main>
  );
}
