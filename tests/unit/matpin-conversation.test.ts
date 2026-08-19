import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildMatpinGuidanceReply,
  buildMatpinNoPlaceReply,
  buildMatpinReceiptReply,
  buildMatpinSavedReply,
  getMatpinMediaKind,
} from "@/lib/matpin/conversation-copy";
import {
  MATPIN_INSTAGRAM_TEXT_MAX_BYTES,
  matpinInstagramTextBytes,
  truncateMatpinInstagramText,
} from "@/lib/matpin/message-limits";

const candidate = {
  id: "place-1",
  name: "산장장작구이",
  area: "서울 강남구",
  category: "한식",
  address: "서울 강남구 테헤란로 1",
  latitude: 37.5,
  longitude: 127.01,
  mapUrl: "https://place.map.kakao.com/1",
  confidence: 0.96,
  matchReason: "게시물의 식당명과 주소가 일치합니다.",
};

describe("Matpin conversation copy", () => {
  it("distinguishes Reels from posts without claiming carousel detection", () => {
    expect(getMatpinMediaKind({
      attachmentType: "share",
      reelUrl: "https://www.instagram.com/reel/Reel_123/",
    })).toBe("릴스");
    expect(getMatpinMediaKind({
      attachmentType: "share",
      reelUrl: "https://www.instagram.com/p/Post_123/",
    })).toBe("게시물");
    expect(getMatpinMediaKind({ attachmentType: "share", reelUrl: null })).toBe("게시물");
  });

  it("adapts the receipt to first, returning, and repeat users", () => {
    expect(buildMatpinReceiptReply({
      mediaKind: "릴스",
      isReturningUser: false,
      alreadySavedMedia: false,
    })).toBe([
      "안녕하세요. 맛핀입니다.",
      "맛핀은 맛집, 카페 또는 여행지 게시물 속 장소를 찾아 내 보관함에 저장해드려요.",
      "방금 보내주신 릴스를 받았고, 장소를 확인하고 있어요.",
      "저장되면 이 대화로 보관함 링크를 보내드릴게요.",
    ].join("\n"));
    expect(buildMatpinReceiptReply({
      mediaKind: "게시물",
      isReturningUser: true,
      alreadySavedMedia: false,
    })).toContain("이번 장소도 확인하고 있어요");
    expect(buildMatpinReceiptReply({
      mediaKind: "게시물",
      isReturningUser: true,
      alreadySavedMedia: true,
    })).toContain("다시 분석하지 않고 저장 내역을 확인하고 있어요");
  });

  it("names saved places and reports the real library total", () => {
    const reply = buildMatpinSavedReply({
      candidates: [candidate],
      totalSavedPlaceCount: 4,
      isFirstSavedPlace: false,
      alreadySavedMedia: false,
      mapUrl: "https://matpin.kr/s/AbCdEfGhIjKlMnOp",
    });

    expect(reply).toContain("이번 장소를 저장했습니다");
    expect(reply).toContain("산장장작구이");
    expect(reply).toContain("지금 4곳");
  });

  it("does not imply a new save for repeated media", () => {
    const reply = buildMatpinSavedReply({
      candidates: [candidate],
      totalSavedPlaceCount: 1,
      isFirstSavedPlace: false,
      alreadySavedMedia: true,
      mapUrl: "https://matpin.kr/s/AbCdEfGhIjKlMnOp",
    });

    expect(reply).toContain("이미 저장한 게시물입니다");
    expect(reply).toContain("최신 순으로 올렸어요");
    expect(reply).not.toContain("새로 저장");
  });

  it("keeps an automatic saved reply within 1,000 UTF-8 bytes", () => {
    const mapUrl = "https://matpin.kr/s/AbCdEfGhIjKlMnOp";
    const oversizedName = "😀".repeat(908);
    const unboundedReply = [
      "이번 장소를 저장했습니다.",
      oversizedName,
      "보관함에는 지금 1곳이 있어요.",
      mapUrl,
    ].join("\n");
    expect(matpinInstagramTextBytes(unboundedReply)).toBe(3_748);

    const reply = buildMatpinSavedReply({
      candidates: [{ ...candidate, name: oversizedName }],
      totalSavedPlaceCount: 1,
      isFirstSavedPlace: false,
      alreadySavedMedia: false,
      mapUrl,
    });

    expect(matpinInstagramTextBytes(reply)).toBeLessThanOrEqual(
      MATPIN_INSTAGRAM_TEXT_MAX_BYTES,
    );
    expect(reply).toContain("…\n보관함에는 지금 1곳이 있어요.");
    expect(reply.endsWith(mapUrl)).toBe(true);
    expect(reply).not.toContain("�");
  });

  it("does not split Hangul or a joined emoji grapheme while truncating", () => {
    const familyEmoji = "👨‍👩‍👧‍👦";
    expect(truncateMatpinInstagramText(`가${familyEmoji}나`, 30)).toBe("가…");
  });

  it("keeps failure and direct-message guidance accurate", () => {
    expect(buildMatpinNoPlaceReply("릴스")).toContain("장소를 찾지 못했습니다");
    expect(buildMatpinGuidanceReply("direct_image")).toContain("사진은 받았지만 저장하지 않았습니다");
    expect(buildMatpinGuidanceReply("direct_video")).toContain("동영상은 받았지만 저장하지 않았습니다");
    expect(buildMatpinGuidanceReply("plain_text")).toContain("직접 보낸 글, 사진, 동영상은 저장하지 않습니다");
  });

  it("keeps domestic restaurants primary while clearly allowing cafes and travel places", () => {
    const greeting = buildMatpinGuidanceReply("greeting");
    const help = buildMatpinGuidanceReply("help");

    expect(greeting).toContain("국내 맛집을 중심으로");
    expect(greeting).toContain("카페와 여행지");
    expect(help).toContain("맛집, 카페 또는 여행지");
  });
});

describe("Matpin conversation CRM migration", () => {
  const sql = readFileSync(
    "supabase/migrations/20260809123904_add_matpin_conversation_crm.sql",
    "utf8",
  );

  it("keeps webhook retries unique while allowing repeat media events", () => {
    expect(sql).toContain("drop constraint if exists matpin_instagram_messages_sender_hash_reel_id_key");
    expect(sql).toContain("on conflict (meta_message_id) do nothing");
    expect(sql).toContain("matpin_messages_sender_media_received_idx");
  });

  it("keeps CRM context and acknowledgement functions service-only", () => {
    expect(sql).toContain("matpin_conversation_context");
    expect(sql).toContain("matpin_mark_message_acknowledged");
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain("to service_role");
  });
});
