import { AUTHORED_HERO_COPY_BATCH_A } from "./authored-hero-copy-batch-a";
import { AUTHORED_HERO_COPY_BATCH_B } from "./authored-hero-copy-batch-b";
import { AUTHORED_HERO_COPY_BATCH_C } from "./authored-hero-copy-batch-c";
import type {
  AuthoredHeroCopyBatch,
  AuthoredHeroScenarioCopy,
} from "./authored-hero-copy-types";

/**
 * 화면에 표시할 문장은 모두 이 장부에 완성형으로 저장한다.
 * 런타임에서는 문장 결합·전문용어 치환·조사 교정을 하지 않는다.
 */
export const AUTHORED_HERO_COPY: AuthoredHeroCopyBatch = {
  ...AUTHORED_HERO_COPY_BATCH_A,
  ...AUTHORED_HERO_COPY_BATCH_B,
  ...AUTHORED_HERO_COPY_BATCH_C,
};

export function authoredHeroCopyForSource(sourceId: string): AuthoredHeroScenarioCopy {
  const copy = (AUTHORED_HERO_COPY as AuthoredHeroCopyBatch)[sourceId];
  if (!copy) throw new Error(`Idea Lab 완성 카피 누락: ${sourceId}`);
  return copy;
}
