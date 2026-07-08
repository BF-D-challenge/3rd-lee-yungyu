/**
 * 카드 아트 3티어 매핑 — 타로 덱 시스템 (2026-07-07 확정).
 * 값은 수백 개지만 그림은 10장 + 뒷면: 일러스트는 "수트의 무드", 카투슈의 이름이 구체 값을 담당.
 *   프롬프트/설계: docs/aurora-card-prompts.md · 목업/원칙: docs/card-art-integration.md
 *
 * ⚠ 렌더 컴포넌트(slot-cell.tsx / fan-deck.tsx / slot-machine.tsx / taste-sheet.tsx)는 다른 세션 편집 중.
 *    직접 고치지 말고 이 모듈 + components/organisms/slot/tarot-card.tsx 를 import해 연결.
 */
import { categoryOfSeed, type AxisId, type AxisValue } from "@/lib/pools";

const A = "/cards/aurora";

/** 씨앗 카테고리 id (combos.json tracks[].categories[].id 와 일치) */
export type CategoryId =
  | "fitness" | "food" | "content"   // track: like
  | "dev" | "commerce" | "marketing"; // track: know

/** 티어 1 · 씨앗 수트 — 카테고리별 아르카나 (6). 씨앗 카드는 세부 값과 무관하게 카테고리 아트를 쓴다. */
export const CATEGORY_ART: Record<CategoryId, string> = {
  fitness: `${A}/category/fitness.png`,     // 도약하는 활력
  food: `${A}/category/food.png`,            // 불꽃을 돌보는 온기
  content: `${A}/category/content.png`,      // 빛 리본을 뿜는 뮤즈
  dev: `${A}/category/dev.png`,              // 빛의 격자를 짜는 빌더
  commerce: `${A}/category/commerce.png`,    // 손 사이 황금 교환
  marketing: `${A}/category/marketing.png`,  // 밖으로 퍼뜨리는 전령
};

/**
 * 티어 2 · 축별 보편 아르카나. 세부 값은 카투슈 텍스트가 담당.
 * seed는 기본 아르카나(씨앗별-star)로 두되, **정확한 per-category 아트는 artForValue/seedArt를 쓴다.**
 * (전체 AxisId로 인덱싱 가능 — 렌더에서 `AXIS_ART[axis]` 하위호환 유지.)
 */
export const AXIS_ART: Record<AxisId, string> = {
  seed: `${A}/axis/seed.png`,            // 씨앗 기본 아르카나 (fallback; per-category는 artForValue)
  pain: `${A}/axis/pain.png`,            // 장애에 얽힌 형상
  format: `${A}/axis/format.png`,        // 빛으로 도구를 빚는 정령
  situation: `${A}/axis/situation.png`,  // 문턱의 순간
  psych: `${A}/axis/psych.png`,          // 생각별이 도는 옆모습
};

/** 공용 카드 뒷면 — 골드 하이브리드(골드 프레임 + 블루 아우라). */
export const CARD_BACK = `${A}/back.png`;

/** 씨앗 수트 카테고리 순번 (카투슈 로마숫자, 선택). */
export const CATEGORY_NUMERAL: Record<CategoryId, string> = {
  fitness: "I", food: "II", content: "III", dev: "IV", commerce: "V", marketing: "VI",
};

/** 수트 액센트 색 — TarotCard 창 글로우 틴트 + 카투슈 수트 라벨. */
export const AXIS_ACCENT: Record<AxisId, string> = {
  seed: "#e6b455",       // 골드
  pain: "#e0607a",       // 크림슨
  format: "#39c9b0",     // 틸
  situation: "#5b8bff",  // 블루
  psych: "#b39cff",      // 라벤더
};

const CATEGORY_IDS: readonly CategoryId[] = [
  "fitness", "food", "content", "dev", "commerce", "marketing",
];
const isCategoryId = (x: string): x is CategoryId =>
  (CATEGORY_IDS as readonly string[]).includes(x);

export const categoryArt = (id: CategoryId): string => CATEGORY_ART[id];

/** 씨앗 id → 그 카테고리의 아르카나. 매칭 실패 시 dev로 폴백. */
export function seedArt(seedId: string): string {
  const cat = categoryOfSeed(seedId)?.category.id;
  return cat && isCategoryId(cat) ? CATEGORY_ART[cat] : CATEGORY_ART.dev;
}

/** ★ 3티어 리졸버 — 슬롯에 놓인 값 하나의 아트 경로. (씨앗=카테고리 / 그 외=축) */
export function artForValue(v: AxisValue): string {
  return v.axis === "seed" ? seedArt(v.seed.id) : AXIS_ART[v.axis];
}

/**
 * 아카이브(v1) — 골드 라인 타로 이모지 세트. 현행 아님(아우라 아르카나로 대체). 비교·회귀용 보존.
 * 자산: public/cards/{back.png, axis/*.png(골드), domain/*.png}.
 */
export const LEGACY_GOLD = {
  back: "/cards/back.png",
  domainDir: "/cards/domain",
} as const;
