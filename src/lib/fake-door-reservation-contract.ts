import { z } from "zod";
import { instagramHandleSchema } from "./instagram-handle";

export const fakeDoorProductSchema = z.enum([
  "matpick",
  "onebite",
  "today",
  "story-cards",
]);

export type FakeDoorTestProduct = z.infer<typeof fakeDoorProductSchema>;

export const fakeDoorSlotSchema = z.enum([
  "this-week",
  "next-week",
  "launch-notice",
]);

export type FakeDoorSlot = z.infer<typeof fakeDoorSlotSchema>;

export const FAKE_DOOR_LEAD_PRIVACY_VERSION = "2026-08-01" as const;

export const fakeDoorAttributionValueSchema = z.string().trim().min(1).max(120).nullable();

export const fakeDoorReservationAttributionSchema = z.object({
  acquisition_source: fakeDoorAttributionValueSchema,
  utm_source: fakeDoorAttributionValueSchema,
  utm_medium: fakeDoorAttributionValueSchema,
  utm_campaign: fakeDoorAttributionValueSchema,
  utm_content: fakeDoorAttributionValueSchema,
  utm_term: fakeDoorAttributionValueSchema,
});

export type FakeDoorReservationAttribution = z.infer<
  typeof fakeDoorReservationAttributionSchema
>;

export interface FakeDoorSlotOption {
  value: FakeDoorSlot;
  label: string;
  description: string;
}

export interface FakeDoorProductConfig {
  product: FakeDoorTestProduct;
  name: string;
  eyebrow: string;
  headline: string;
  description: string;
  promise: string;
  proof: readonly [string, string, string];
  image: string;
  imageAlt: string;
  appHref: string;
  accent: string;
  accentStrong: string;
  background: string;
  surface: string;
  ink: string;
  muted: string;
  dark: boolean;
  requiresInstagram: boolean;
  slots: readonly FakeDoorSlotOption[];
}

const defaultSlots: readonly FakeDoorSlotOption[] = [
  {
    value: "this-week",
    label: "이번 주에 써보기",
    description: "가장 빠른 체험 자리가 생기면 알려드려요.",
  },
  {
    value: "next-week",
    label: "다음 주에 써보기",
    description: "다음 모집 일정에 먼저 안내해드려요.",
  },
  {
    value: "launch-notice",
    label: "출시 소식만 받기",
    description: "일정이 확정됐을 때 한 번만 알려드려요.",
  },
] as const;

export const fakeDoorProductConfigs: Record<FakeDoorTestProduct, FakeDoorProductConfig> = {
  matpick: {
    product: "matpick",
    name: "맛핀",
    eyebrow: "저장한 맛집 릴스, 다시 찾게",
    headline: "내 맛집 저장함을 먼저 써보세요.",
    description:
      "릴스를 보내면 장소와 원본 영상을 함께 정리하는 맛핀 초기 체험을 예약해요.",
    promise: "저장한 릴스를 장소별로 정리하는 초기 체험",
    proof: [
      "Instagram 맛집 릴스를 장소로 정리",
      "내 주변에서 가까운 맛집부터 확인",
      "장소와 원본 영상을 한 화면에서 다시 보기",
    ],
    image: "/images/experiment-gallery/matpick.jpg",
    imageAlt: "강남역과 역삼역 주변 맛집과 원본 영상이 함께 보이는 맛핀 저장함",
    appHref: "/matpick",
    accent: "#2468d9",
    accentStrong: "#174eae",
    background: "#f2f5fa",
    surface: "#ffffff",
    ink: "#17213a",
    muted: "#5d6678",
    dark: false,
    requiresInstagram: true,
    slots: defaultSlots,
  },
  onebite: {
    product: "onebite",
    name: "한입코치",
    eyebrow: "식단 스토리를 올리면, 다음 한 끼가 달라지게",
    headline: "식단 스토리를 공유하면 코치해드려요.",
    description:
      "먹은 음식 사진을 Instagram 스토리에 올리고 공유하면, 사진에서 보이는 식단을 바탕으로 다음 한 끼 행동 하나를 알려드리는 한입코치 초기 체험을 예약해요.",
    promise: "식단 스토리를 공유하고 받는 다음 한 끼 코칭",
    proof: [
      "먹은 음식 사진을 Instagram 스토리에 올리기",
      "예약 뒤 안내받은 방법으로 스토리 공유하기",
      "다음 한 끼에 할 행동 하나 받기",
    ],
    image: "/images/experiment-gallery/onebite-redesign.jpg",
    imageAlt: "식단 스토리를 공유하고 다음 한 끼 행동을 받는 한입코치 화면",
    appHref: "/onebite",
    accent: "#2f765a",
    accentStrong: "#225943",
    background: "#eef4ea",
    surface: "#fbfdf9",
    ink: "#14261d",
    muted: "#5d6f65",
    dark: false,
    requiresInstagram: true,
    slots: defaultSlots,
  },
  today: {
    product: "today",
    name: "오늘 해볼까",
    eyebrow: "아이디어만 주면, 테스트는 내일",
    headline: "내일 받을 테스트 제작을 예약하세요.",
    description:
      "아이디어를 신청하면 24시간 뒤 광고 이미지, 가짜문 랜딩, 측정 기준을 함께 받아요.",
    promise: "24시간 뒤 받는 광고·가짜문 랜딩·측정 기준",
    proof: [
      "아이디어가 있으면 근거로 더 선명하게 개선",
      "아이디어가 없으면 세 가지 질문으로 시작",
      "광고와 랜딩을 같은 약속으로 제작",
    ],
    image: "/images/experiment-gallery/today-unified.svg",
    imageAlt: "아이디어를 입력하고 하루 뒤 광고와 가짜문 랜딩을 받는 Today 화면",
    appHref: "/today",
    accent: "#3156c8",
    accentStrong: "#24429e",
    background: "#f1f3f9",
    surface: "#ffffff",
    ink: "#171b27",
    muted: "#636b7c",
    dark: false,
    requiresInstagram: false,
    slots: [
      {
        value: "this-week",
        label: "내일 결과 받아보기",
        description: "가장 빠른 24시간 제작 자리가 생기면 알려드려요.",
      },
      {
        value: "next-week",
        label: "다음 주에 테스트하기",
        description: "다음 제작 일정에 먼저 안내해드려요.",
      },
      {
        value: "launch-notice",
        label: "출시 소식만 받기",
        description: "제작 신청이 정식으로 열릴 때 한 번만 알려드려요.",
      },
    ],
  },
  "story-cards": {
    product: "story-cards",
    name: "카드너머",
    eyebrow: "상황을 고르면, 그 사람이 먼저 말을 걸게",
    headline: "다음 이야기의 첫 대화를 예약하세요.",
    description:
      "마음에 가까운 장면을 고르면 그 장면의 매력적인 남자 주인공과 바로 대화하는 초기 체험을 예약해요.",
    promise: "고른 장면의 남자 주인공과 시작하는 첫 대화",
    proof: [
      "지금 마음에 가까운 상황 카드 선택",
      "장면마다 다른 남자 주인공과 첫 대화",
      "짧은 선택지와 직접 입력을 함께 지원",
    ],
    image: "/images/experiment-gallery/story-cards-redesign.jpg",
    imageAlt: "어두운 카드 덱에서 상황을 고르고 대화를 시작하는 카드너머 화면",
    appHref: "/story-cards",
    accent: "#d0ad65",
    accentStrong: "#a17d38",
    background: "#090b0f",
    surface: "#12151c",
    ink: "#f5f2eb",
    muted: "#aaa69d",
    dark: true,
    requiresInstagram: false,
    slots: defaultSlots,
  },
};

export const fakeDoorReservationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product: fakeDoorProductSchema,
  slot_key: fakeDoorSlotSchema,
  status: z.enum(["reserved", "cancelled"]),
  source_path: z.string(),
  instagram_handle: instagramHandleSchema.nullable(),
  contact_consent_at: z.string().datetime({ offset: true }),
  privacy_version: z.literal(FAKE_DOOR_LEAD_PRIVACY_VERSION),
  acquisition_source: fakeDoorAttributionValueSchema,
  utm_source: fakeDoorAttributionValueSchema,
  utm_medium: fakeDoorAttributionValueSchema,
  utm_campaign: fakeDoorAttributionValueSchema,
  utm_content: fakeDoorAttributionValueSchema,
  utm_term: fakeDoorAttributionValueSchema,
  created_at: z.string(),
  updated_at: z.string(),
}).superRefine((reservation, context) => {
  const config = fakeDoorProductConfigs[reservation.product];
  if (config.requiresInstagram && !reservation.instagram_handle) {
    context.addIssue({
      code: "custom",
      path: ["instagram_handle"],
      message: `${config.name}은 Instagram 아이디가 필요해요.`,
    });
  }
  if (!config.requiresInstagram && reservation.instagram_handle) {
    context.addIssue({
      code: "custom",
      path: ["instagram_handle"],
      message: `${config.name} 예약에는 Instagram 아이디를 저장하지 않아요.`,
    });
  }
});

export type FakeDoorReservation = z.infer<typeof fakeDoorReservationSchema>;
