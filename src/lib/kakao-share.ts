import { toPublicShareUrl } from "./public-share-url";

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
    sendDefault: (settings: {
      objectType: "text";
      text: string;
      link: {
        mobileWebUrl: string;
        webUrl: string;
      };
      buttonTitle: string;
      installTalk: boolean;
      serverCallbackArgs?: Record<string, string>;
    }) => void;
  };
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
    kakao.Share.sendDefault({
      objectType: "text",
      text: kakaoMessage(options.title, options.text),
      link: {
        mobileWebUrl: absoluteUrl,
        webUrl: absoluteUrl,
      },
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
