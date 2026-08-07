"use client";

import { Camera, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { MatpinStationReel } from "@/lib/matpin/library";
import styles from "./matpin-map.module.css";

const presentationSchema = z.object({
  thumbnailUrl: z.string().url().nullable(),
  videoUrl: z.string().url().nullable(),
  ownerUsername: z.string().trim().min(1).max(100).nullable(),
});

const LOCAL_REEL_PREVIEWS: Record<string, string> = {
  DbTBhcZNY1b: "/images/matpick/yeoksam-sanjang-reel.jpg",
};

export type MatpinReelPresentation = z.infer<typeof presentationSchema> & {
  loading: boolean;
};

export function useMatpinReelPresentation(
  reel: Pick<MatpinStationReel, "reelId" | "reelUrl">,
  includeVideo = false,
): MatpinReelPresentation {
  const localPreview = LOCAL_REEL_PREVIEWS[reel.reelId] ?? null;
  const [presentation, setPresentation] = useState<MatpinReelPresentation>({
    thumbnailUrl: localPreview,
    videoUrl: null,
    ownerUsername: null,
    loading: Boolean(reel.reelUrl && (includeVideo || !localPreview)),
  });

  useEffect(() => {
    if (!reel.reelUrl || (!includeVideo && localPreview)) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ url: reel.reelUrl });
    void fetch(`/api/matpin/reels/preview?${query.toString()}`, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error("preview_unavailable");
      const parsed = presentationSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("preview_unavailable");
      setPresentation({
        ...parsed.data,
        thumbnailUrl: parsed.data.thumbnailUrl ?? localPreview,
        loading: false,
      });
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setPresentation((current) => ({ ...current, loading: false }));
    });
    return () => controller.abort();
  }, [includeVideo, localPreview, reel.reelUrl]);

  return presentation;
}

export function MatpinReelArtwork({
  reel,
  alt,
  priority = false,
}: {
  reel: MatpinStationReel;
  alt: string;
  priority?: boolean;
}) {
  const presentation = useMatpinReelPresentation(reel);

  if (presentation.thumbnailUrl) {
    return (
      <Image
        alt={alt}
        className={styles.reelImage}
        fill
        priority={priority}
        sizes="(max-width: 520px) 48vw, 220px"
        src={presentation.thumbnailUrl}
        unoptimized
      />
    );
  }

  return (
    <span className={styles.previewState} data-unavailable={!presentation.loading}>
      {presentation.loading ? <LoaderCircle aria-hidden="true" size={24} /> : <Camera aria-hidden="true" size={24} />}
      <small>{presentation.loading ? "영상 불러오는 중" : "Instagram에서 보기"}</small>
    </span>
  );
}
