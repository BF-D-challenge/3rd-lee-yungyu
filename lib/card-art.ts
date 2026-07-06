/**
 * 카드 아트 이미지 매핑 — codex image_gen.imagegen로 생성한 자산(`public/cards/`).
 *
 * 현행(v2): **오로라 풀블리드** — 토스뱅크 키비주얼 방향. 카드 전체를 세로로 꽉 채우는
 *   추상 라이트필드(직각 모서리, 카드별 '빛의 동사' 1개). 앱 aurora mesh 토큰과 한 몸.
 *   프롬프트: docs/aurora-card-prompts.md · 구조 근거: .claude/knowledge/research/card-art-prompting/GPT2-PROMPT-STRUCTURE.md
 *
 * ★ 라이브 모델과 1:1 정합: CATEGORY_ART 키 = combos.json 씨앗 카테고리 id, AXIS_ART 키 = lib/pools AxisId.
 *
 * ⚠ 렌더 컴포넌트(slot-cell.tsx / fan-deck.tsx / slot-machine.tsx)는 다른 세션이 편집 중.
 *    그 파일을 직접 고치지 말고 이 모듈만 import해서 연결. 연결법: docs/card-art-integration.md
 */
import type { AxisId } from "@/lib/pools";

const AURORA = "/cards/aurora";

/** 씨앗 카테고리 6종 (combos.json tracks[].categories[].id 와 일치) */
export type CategoryId =
  | "fitness" | "food" | "content"   // track: like
  | "dev" | "commerce" | "marketing"; // track: know

/** 카테고리 타일 — 온보딩·취향 선택 화면(카테고리 고르기)에 깔리는 풀블리드 아트. */
export const CATEGORY_ART: Record<CategoryId, string> = {
  fitness: `${AURORA}/category/fitness.png`,   // 솟다 rise · emerald→cyan
  food: `${AURORA}/category/food.png`,          // 피다 bloom · coral→amber
  content: `${AURORA}/category/content.png`,     // 흐르다 flow · magenta→pink
  dev: `${AURORA}/category/dev.png`,             // 맺히다 structure · electric blue
  commerce: `${AURORA}/category/commerce.png`,   // 모이다 converge · amber→magenta
  marketing: `${AURORA}/category/marketing.png`, // 퍼지다 radiate · violet starburst
};

/** 축 5종 (lib/pools AxisId 와 일치) — 슬롯 카드 표면 풀블리드 아트. 이모지 🌱😖📦🎬💭 대체. */
export const AXIS_ART: Record<AxisId, string> = {
  seed: `${AURORA}/axis/seed.png`,            // 깨어나다 emerge · champagne gold
  pain: `${AURORA}/axis/pain.png`,            // 맞서다 clash · crimson seam
  format: `${AURORA}/axis/format.png`,        // 정돈되다 settle · turquoise layers
  situation: `${AURORA}/axis/situation.png`,  // 물들다 drift · dusk horizon
  psych: `${AURORA}/axis/psych.png`,          // 고동치다 pulse · lavender halos
};

/** 공용 카드 뒷면 (덱 56장 + 슬롯 셀). 잠들다 slumber · 근검정 숨결. 축 힌트는 컴포넌트에서 오버레이. */
export const CARD_BACK = `${AURORA}/back.png`;

export const categoryArt = (id: CategoryId): string => CATEGORY_ART[id];
export const axisArt = (axis: AxisId): string => AXIS_ART[axis];

/**
 * 아카이브(v1) — 골드 라인 타로 세트. 현행 아님(오로라로 완전 피벗). 비교·회귀·재활용 대비 보존.
 * 프롬프트: docs/card-art-prompts.md (ARCHIVED). 자산: public/cards/{back.png, axis/, domain/}.
 */
export type DomainKey =
  | "learn" | "work" | "image" | "biz" | "content"
  | "shop" | "money" | "health" | "life" | "general";

export const LEGACY_GOLD = {
  back: "/cards/back.png",
  axis: {
    seed: "/cards/axis/seed.png", pain: "/cards/axis/pain.png",
    format: "/cards/axis/format.png", situation: "/cards/axis/situation.png",
    psych: "/cards/axis/psych.png",
  } as Record<AxisId, string>,
  domain: {
    learn: "/cards/domain/learn.png", work: "/cards/domain/work.png",
    image: "/cards/domain/image.png", biz: "/cards/domain/biz.png",
    content: "/cards/domain/content.png", shop: "/cards/domain/shop.png",
    money: "/cards/domain/money.png", health: "/cards/domain/health.png",
    life: "/cards/domain/life.png", general: "/cards/domain/general.png",
  } as Record<DomainKey, string>,
} as const;
