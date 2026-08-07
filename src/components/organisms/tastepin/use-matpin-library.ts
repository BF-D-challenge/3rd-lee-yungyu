"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { matpinSavedPlaceSchema, type MatpinSavedPlace } from "@/lib/matpin/contract";
import { MATPIN_DEVELOPMENT_PREVIEW_PLACES } from "@/lib/matpin/library";

const responseSchema = z.object({ places: z.array(matpinSavedPlaceSchema).max(100) });
export type MatpinLibraryState = "loading" | "ready" | "error";

function tokenFromHash(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

export function useMatpinLibrary(): {
  token: string;
  places: MatpinSavedPlace[];
  state: MatpinLibraryState;
  error: string;
  preview: boolean;
} {
  const [token, setToken] = useState("");
  const [places, setPlaces] = useState<MatpinSavedPlace[]>([]);
  const [state, setState] = useState<MatpinLibraryState>("loading");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const developmentPreview = process.env.NODE_ENV === "development"
      && new URLSearchParams(window.location.search).get("preview") === "station-reels";
    setPreview(developmentPreview);
    if (developmentPreview) {
      setToken("local-preview");
      setPlaces(MATPIN_DEVELOPMENT_PREVIEW_PLACES);
      setState("ready");
      return;
    }

    const accessToken = tokenFromHash();
    setToken(accessToken);
    if (!accessToken) {
      setError("개인 보관함 링크가 올바르지 않아요. Instagram에서 받은 최신 링크를 다시 열어주세요.");
      setState("error");
      return;
    }

    const controller = new AbortController();
    void fetch("/api/matpin/saves", {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
      cache: "no-store",
    }).then(async (response) => {
      const body = await response.json();
      const parsed = responseSchema.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("saves_unavailable");
      setPlaces(parsed.data.places);
      setState("ready");
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError("내 맛집 릴스를 불러오지 못했어요. 잠시 후 다시 열어주세요.");
      setState("error");
    });
    return () => controller.abort();
  }, []);

  return { token, places, state, error, preview };
}
