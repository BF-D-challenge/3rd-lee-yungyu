import { copyText } from "./copy-text";
import {
  shareToKakao,
  type KakaoShareFailureReason,
  type KakaoShareOptions,
} from "./kakao-share";
import { toPublicShareUrl } from "./public-share-url";
import { createShareCardFile } from "./share-card-image";

export type ShareChannel = "instagram" | "kakao" | "copy";
export type ShareFailureReason =
  | KakaoShareFailureReason
  | "cancelled"
  | "share_unavailable"
  | "copy_failed";

export interface ShareResult {
  ok: boolean;
  method: ShareChannel | null;
  reason?: ShareFailureReason;
  /** 인스타그램 직접 전달을 지원하지 않는 브라우저에서 링크 복사로 보존했는지 표시한다. */
  fallback?: "copy";
}

export type ShareChannelResult = ShareResult & { method: ShareChannel };
export type ShareOptions = KakaoShareOptions;

const shareData = (
  url: string,
  options: ShareOptions,
): ShareData => ({
  ...(options.title?.trim() ? { title: options.title.trim() } : {}),
  ...(options.text?.trim() ? { text: options.text.trim() } : {}),
  url,
});

export async function shareToInstagram(
  url: string,
  options: ShareOptions = {},
): Promise<ShareChannelResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { ok: false, method: "instagram", reason: "share_unavailable" };
  }

  const absoluteUrl = toPublicShareUrl(url);
  if (typeof navigator.share === "function") {
    let storyFile: File | null = null;
    if (typeof navigator.canShare === "function") {
      try {
        storyFile = await createShareCardFile(absoluteUrl, options);
      } catch {
        storyFile = null;
      }
    }

    if (storyFile && navigator.canShare?.({ files: [storyFile] })) {
      try {
        await navigator.share({
          ...(options.title?.trim() ? { title: options.title.trim() } : {}),
          text: [options.text?.trim(), absoluteUrl].filter(Boolean).join("\n\n"),
          files: [storyFile],
        });
        return { ok: true, method: "instagram" };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return { ok: false, method: "instagram", reason: "cancelled" };
        }
        // 파일 공유 대상이 없으면 아래 링크 공유로 한 번 더 시도한다.
      }
    }

    try {
      // 웹에서는 특정 앱을 강제로 지정할 수 없어 기기의 공유 메뉴에서 인스타그램을 고른다.
      await navigator.share(shareData(absoluteUrl, options));
      return { ok: true, method: "instagram" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { ok: false, method: "instagram", reason: "cancelled" };
      }
      // 미지원·권한 차단 환경은 아래 링크 복사 경로로 이어진다.
    }
  }

  const copied = await copyText(absoluteUrl);
  return copied
    ? { ok: true, method: "instagram", fallback: "copy" }
    : { ok: false, method: "instagram", reason: "copy_failed" };
}

export async function copyShareLink(url: string): Promise<ShareChannelResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { ok: false, method: "copy", reason: "share_unavailable" };
  }
  const copied = await copyText(toPublicShareUrl(url));
  return copied
    ? { ok: true, method: "copy" }
    : { ok: false, method: "copy", reason: "copy_failed" };
}

export async function shareByChannel(
  channel: ShareChannel,
  url: string,
  options: ShareOptions = {},
): Promise<ShareChannelResult> {
  if (channel === "kakao") return shareToKakao(url, options);
  if (channel === "instagram") return shareToInstagram(url, options);
  return copyShareLink(url);
}

export function shareSuccessNotice(result: ShareResult): string {
  if (result.method === "copy") return "링크를 복사했어요.";
  if (result.method === "instagram" && result.fallback === "copy") {
    return "링크를 복사했어요. 인스타그램에 붙여넣어 공유해 주세요.";
  }
  if (result.method === "instagram") {
    return "공유 화면을 열었어요. 인스타그램을 선택해 주세요.";
  }
  return "카카오톡 공유 화면을 열었어요.";
}
