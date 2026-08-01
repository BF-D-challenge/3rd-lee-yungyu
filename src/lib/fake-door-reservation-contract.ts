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
    label: "이번 주에 써보고 싶어요",
    description: "가장 빠른 체험 모집이 열리면 알려드려요.",
  },
  {
    value: "next-week",
    label: "다음 주에 써보고 싶어요",
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
    headline: "내 맛집 저장함을 먼저 써볼 사람을 찾고 있어요.",
    description:
      "릴스를 보내면 장소와 원본 영상을 함께 정리하는 맛핀의 선공개 체험을 예약해요. 기능이 준비되면 따로 안내해드릴게요.",
    promise: "맛핀이 준비 중인 선공개 체험",
    proof: [
      "Instagram 맛집 릴스를 장소로 정리",
      "내 주변에서 가까운 맛집부터 확인",
      "장소와 원본 영상을 한 화면에서 다시 보기",
    ],
    image: "/images/experiment-gallery/matpick.jpg",
    imageAlt: "강남역과 역삼역 주변 맛집과 원본 영상이 함께 보이는 맛핀 저장함",
    appHref: "/matpin",
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
    eyebrow: "첫 코칭 뒤에도 계속 혼나고 싶다면",
    headline: "7일 패스가 열리면 알려드릴게요.",
    description:
      "첫 코칭은 무료예요. 팩폭과 다음 끼니 행동을 7일 동안 이어가는 4,900원 패스는 준비 중이며 자동 갱신되지 않아요. 지금은 결제 없이 출시 알림만 신청합니다.",
    promise: "한입코치 7일 패스",
    proof: [
      "음식 사진마다 선택을 짚는 팩폭 한 방",
      "다음 끼니 행동 하나와 다음 사진 확인",
      "7일 4,900원 · 자동 갱신 없음",
    ],
    image: "/images/experiment-gallery/onebite-redesign.jpg",
    imageAlt: "음식 사진을 고르고 다음 한 끼 행동을 받는 한입코치 화면",
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
    headline: "테스트 제작이 열리면 먼저 알려드릴게요.",
    description:
      "아이디어를 광고 이미지, 가짜문 랜딩, 측정 기준으로 바꾸는 제작 체험을 준비 중이에요. 지금은 원하는 시점만 예약해요.",
    promise: "오늘 해볼까가 준비 중인 테스트 제작 체험",
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
        label: "가장 먼저 써보고 싶어요",
        description: "첫 제작 체험 모집이 열리면 알려드려요.",
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
    headline: "첫 대화 체험이 열리면 알려드릴게요.",
    description:
      "마음에 가까운 장면을 고르고 그 장면의 남자 주인공과 대화하는 선공개 체험을 준비 중이에요. 체험이 열리면 Instagram DM으로 안내해드려요.",
    promise: "카드너머가 준비 중인 선공개 대화 체험",
    proof: [
      "지금 마음에 가까운 상황 카드 선택",
      "장면마다 다른 남자 주인공과 첫 대화",
      "Instagram DM으로 첫 대화 안내",
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
    requiresInstagram: true,
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
