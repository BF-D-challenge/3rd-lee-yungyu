import type {
  MatpinAttachmentType,
  MatpinGuidanceReason,
  MatpinPlaceCandidate,
} from "@/lib/matpin/contract";
import {
  MATPIN_INSTAGRAM_TEXT_MAX_BYTES,
  matpinInstagramTextBytes,
  truncateMatpinInstagramText,
} from "@/lib/matpin/message-limits";

export type MatpinMediaKind = "릴스" | "게시물";

export function getMatpinMediaKind(input: {
  attachmentType: MatpinAttachmentType;
  reelUrl: string | null;
}): MatpinMediaKind {
  if (input.attachmentType === "ig_reel" || input.attachmentType === "reel") return "릴스";
  if (!input.reelUrl) return "게시물";

  try {
    return new URL(input.reelUrl).pathname.toLowerCase().startsWith("/reel/")
      ? "릴스"
      : "게시물";
  } catch {
    return "게시물";
  }
}

export function buildMatpinReceiptReply(input: {
  mediaKind: MatpinMediaKind;
  isReturningUser: boolean;
  alreadySavedMedia: boolean;
}): string {
  if (input.alreadySavedMedia) {
    return [
      `전에 보내주신 ${input.mediaKind}입니다.`,
      "다시 분석하지 않고 저장 내역을 확인하고 있어요.",
      "확인이 끝나면 바로 알려드리겠습니다.",
    ].join("\n");
  }

  if (!input.isReturningUser) {
    return [
      "안녕하세요. 맛핀입니다.",
      "맛핀은 맛집, 카페 또는 여행지 게시물 속 장소를 찾아 내 보관함에 저장해드려요.",
      `방금 보내주신 ${input.mediaKind}를 받았고, 장소를 확인하고 있어요.`,
      "저장되면 이 대화로 보관함 링크를 보내드릴게요.",
    ].join("\n");
  }

  return [
    `${input.mediaKind} 받았습니다.`,
    "이번 장소도 확인하고 있어요.",
    "저장이 끝나면 바로 알려드리겠습니다.",
  ].join("\n");
}

export function buildMatpinSavedReply(input: {
  candidates: MatpinPlaceCandidate[];
  totalSavedPlaceCount: number;
  isFirstSavedPlace: boolean;
  alreadySavedMedia: boolean;
  mapUrl: string;
}): string {
  if (input.alreadySavedMedia) {
    return [
      "이미 저장한 게시물입니다.",
      "찾은 장소를 보관함 최신 순으로 올렸어요.",
      `보관함에는 지금 ${input.totalSavedPlaceCount}곳이 있습니다.`,
      input.mapUrl,
    ].join("\n");
  }

  const title = input.isFirstSavedPlace
    ? input.candidates.length === 1
      ? "첫 장소를 저장했습니다."
      : `첫 장소 ${input.candidates.length}곳을 저장했습니다.`
    : input.candidates.length === 1
      ? "이번 장소를 저장했습니다."
      : `이번 게시물에서 찾은 ${input.candidates.length}곳을 저장했습니다.`;
  const places = input.candidates.length === 1
    ? [input.candidates[0].name]
    : input.candidates.map((candidate, index) => `${index + 1}. ${candidate.name}`);

  const lines = [
    title,
    ...places,
    `보관함에는 지금 ${input.totalSavedPlaceCount}곳이 있어요.`,
    input.mapUrl,
  ];
  const reply = lines.join("\n");
  if (matpinInstagramTextBytes(reply) <= MATPIN_INSTAGRAM_TEXT_MAX_BYTES) return reply;

  const closingLines = [
    `보관함에는 지금 ${input.totalSavedPlaceCount}곳이 있어요.`,
    input.mapUrl,
  ];
  const fixedReply = [title, "", ...closingLines].join("\n");
  const placeBytes = MATPIN_INSTAGRAM_TEXT_MAX_BYTES - matpinInstagramTextBytes(fixedReply);
  if (placeBytes <= 0) {
    return truncateMatpinInstagramText(reply, MATPIN_INSTAGRAM_TEXT_MAX_BYTES);
  }

  return [
    title,
    truncateMatpinInstagramText(places.join("\n"), placeBytes),
    ...closingLines,
  ].join("\n");
}

export function buildMatpinNoPlaceReply(mediaKind: MatpinMediaKind): string {
  return [
    `${mediaKind}은 확인했지만 장소를 찾지 못했습니다.`,
    "장소 이름이나 지역이 보이는 다른 공개 게시물을 보내주세요.",
  ].join("\n");
}

export function buildMatpinUnsupportedMediaReply(mediaKind: MatpinMediaKind): string {
  return [
    `이 ${mediaKind}은 아직 자동으로 확인하기 어렵습니다.`,
    "다른 공개 맛집, 카페 또는 여행지 게시물을 보내주세요.",
  ].join("\n");
}

const HELP_STEPS = [
  "맛핀에 이렇게 보내주세요.",
  "1. Instagram에서 맛집, 카페 또는 여행지 게시물을 엽니다.",
  "2. 공유 버튼을 누릅니다.",
  "3. 받는 사람으로 matpin.kr을 선택해요.",
  "4. 저장이 끝나면 보관함 링크를 보내드립니다.",
].join("\n");

export function buildMatpinGuidanceReply(reason: MatpinGuidanceReason): string {
  switch (reason) {
    case "greeting":
      return [
        "안녕하세요. 맛핀입니다.",
        "국내 맛집을 중심으로 카페와 여행지 게시물도 장소를 찾아 보관함에 저장해요.",
        "저장하고 싶은 게시물의 공유 버튼으로 보내주세요.",
      ].join("\n");
    case "appreciation":
      return [
        "유용하게 봐주셔서 감사합니다.",
        "다음에 저장하고 싶은 장소도 게시물의 공유 버튼으로 보내주세요.",
      ].join("\n");
    case "help":
      return HELP_STEPS;
    case "direct_image":
      return [
        "사진은 받았지만 저장하지 않았습니다.",
        "사진이 나온 원본 Instagram 장소 게시물을 공유해주세요.",
      ].join("\n");
    case "direct_video":
      return [
        "동영상은 받았지만 저장하지 않았습니다.",
        "원본 장소 릴스나 게시물을 공유해주세요.",
      ].join("\n");
    case "external_link":
      return [
        "이 링크는 저장하지 않았습니다.",
        "Instagram의 맛집, 카페 또는 여행지 게시물 링크를 보내주세요.",
      ].join("\n");
    case "instagram_profile":
      return [
        "프로필은 저장하지 않았습니다.",
        "저장할 장소가 나온 개별 릴스나 게시물을 보내주세요.",
      ].join("\n");
    case "unsupported_attachment":
      return [
        "보내주신 항목은 저장하지 않았습니다.",
        "Instagram의 맛집, 카페 또는 여행지 게시물을 공유해주세요.",
      ].join("\n");
    case "plain_text":
      return [
        "보내주신 글은 저장하지 않았습니다.",
        "저장할 장소 게시물의 공유 버튼으로 보내주세요.",
        "직접 보낸 글, 사진, 동영상은 저장하지 않습니다.",
      ].join("\n");
  }
}
