import { toPublicShareUrl } from "./public-share-url";
import { createShareCardFile } from "./share-card-image";

export const KAKAO_JAVASCRIPT_SDK_URL =
  "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
export const KAKAO_JAVASCRIPT_SDK_INTEGRITY =
  "sha384-OL+ylM/iuPLtW5U3XcvLSGhE8JzReKDank5InqlHGWPhb4140/yrBw0bg0y7+C9J";

export type KakaoShareFailureReason =
  | "not_configured"
  | "sdk_unavailable"
  | "initialization_failed"
  | "launch_failed";

export interface KakaoShareResult {
  ok: boolean;
  method: "kakao";
  reason?: KakaoShareFailureReason;
}
export interface KakaoShareOptions {
  title?: string;
  text?: string;
  buttonTitle?: string;
  serverCallbackArgs?: Record<string, string>;
}

interface KakaoJavascriptSdk {
  init: (javascriptKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    uploadImage?: (settings: { file: FileList }) => Promise<Array<{
      url: string;
      length: number;
      content_type: string;
      width: number;
      height: number;
    }>>;
    sendDefault: (settings: {
      objectType: "text";
      text: string;
      link: KakaoShareLink;
      buttonTitle: string;
      installTalk: boolean;
      serverCallbackArgs?: Record<string, string>;
    } | {
      objectType: "feed";
      content: {
        title: string;
        description: string;
        imageUrl: string;
        imageWidth: number;
        imageHeight: number;
        link: KakaoShareLink;
      };
      buttonTitle: string;
      installTalk: boolean;
      serverCallbackArgs?: Record<string, string>;
    }) => void;
  };
}

interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

declare global {
  interface Window {
    Kakao?: KakaoJavascriptSdk;
  }
}

const KAKAO_TEXT_LIMIT = 200;
const compact = (value: string | undefined): string =>
  value?.replace(/\s+/g, " ").trim() ?? "";

const kakaoMessage = (title: string | undefined, text: string | undefined): string => {
  const message = [compact(title), compact(text)].filter(Boolean).join("\n\n");
  const characters = Array.from(message || "오늘 해볼까에서 만든 아이디어예요. 같이 봐주세요.");
  if (characters.length <= KAKAO_TEXT_LIMIT) return characters.join("");
  return `${characters.slice(0, KAKAO_TEXT_LIMIT - 1).join("")}…`;
};

const kakaoDescription = (text: string | undefined): string => {
  const characters = Array.from(compact(text) || "친구의 짧은 응원이나 의견을 남겨주세요.");
  if (characters.length <= KAKAO_TEXT_LIMIT) return characters.join("");
  return `${characters.slice(0, KAKAO_TEXT_LIMIT - 1).join("")}…`;
};

const shareImageFiles = async (
  url: string,
  options: KakaoShareOptions,
): Promise<FileList | null> => {
  if (typeof DataTransfer === "undefined") return null;
  const imageFile = await createShareCardFile(url, options);
  if (!imageFile) return null;
  const transfer = new DataTransfer();
  transfer.items.add(imageFile);
  return transfer.files;
};

/**
 * Kakao JavaScript SDK 전용 공유.
 * Web Share API나 클립보드로 폴백하지 않아 모든 공유가 카카오톡 선택 화면으로만 이어진다.
 * sendDefault는 전송 완료 콜백을 제공하지 않으므로 ok는 "공유 화면 열기 요청 성공"을 뜻한다.
 */
export async function shareToKakao(
  url: string,
  options: KakaoShareOptions = {},
): Promise<KakaoShareResult> {
  if (typeof window === "undefined") {
    return { ok: false, method: "kakao", reason: "sdk_unavailable" };
  }

  const kakao = window.Kakao;
  if (!kakao) {
    return { ok: false, method: "kakao", reason: "sdk_unavailable" };
  }

  if (!kakao.isInitialized()) {
    const javascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
    if (!javascriptKey) {
      return { ok: false, method: "kakao", reason: "not_configured" };
    }
    try {
      kakao.init(javascriptKey);
    } catch {
      return { ok: false, method: "kakao", reason: "initialization_failed" };
    }
    if (!kakao.isInitialized()) {
      return { ok: false, method: "kakao", reason: "initialization_failed" };
    }
  }

  try {
    const absoluteUrl = toPublicShareUrl(url);
    const link = {
      mobileWebUrl: absoluteUrl,
      webUrl: absoluteUrl,
    };
    const imageFiles = kakao.Share.uploadImage
      ? await shareImageFiles(absoluteUrl, options)
      : null;

    if (imageFiles && kakao.Share.uploadImage) {
      const [image] = await kakao.Share.uploadImage({ file: imageFiles });
      if (!image?.url) throw new Error("Kakao image upload returned no URL.");
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: compact(options.title) || "오늘 해볼까에서 만든 아이디어",
          description: kakaoDescription(options.text),
          imageUrl: image.url,
          imageWidth: image.width,
          imageHeight: image.height,
          link,
        },
        buttonTitle: options.buttonTitle ?? "친구 반응 남기기",
        installTalk: true,
        ...(options.serverCallbackArgs
          ? { serverCallbackArgs: options.serverCallbackArgs }
          : {}),
      });
      return { ok: true, method: "kakao" };
    }

    kakao.Share.sendDefault({
      objectType: "text",
      text: kakaoMessage(options.title, options.text),
      link,
      buttonTitle: options.buttonTitle ?? "친구 반응 남기기",
      installTalk: true,
      ...(options.serverCallbackArgs
        ? { serverCallbackArgs: options.serverCallbackArgs }
        : {}),
    });
    return { ok: true, method: "kakao" };
  } catch {
    return { ok: false, method: "kakao", reason: "launch_failed" };
  }
}
