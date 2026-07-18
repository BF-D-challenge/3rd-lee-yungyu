import { IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_A } from "./product-identities-brand-batch-a";
import { IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_B } from "./product-identities-brand-batch-b";
import { IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_C } from "./product-identities-brand-batch-c";
import type { IdeaProductIdentity } from "./product-identity-types";

export type { IdeaProductIdentity } from "./product-identity-types";

/**
 * 모든 결과에 맛핀처럼 기억 가능한 이름과 한 줄 설명을 붙인다.
 * 이름은 브랜드 역할만 하고, 구체적인 입력과 결과는 tagline이 설명한다.
 */
export const IDEA_PRODUCT_IDENTITIES = {
  ...IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_A,
  ...IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_B,
  ...IDEA_PRODUCT_IDENTITIES_BRAND_BATCH_C,
} as const satisfies Record<string, IdeaProductIdentity>;

export function productIdentityForSource(sourceId: string): IdeaProductIdentity {
  const identity = (IDEA_PRODUCT_IDENTITIES as Record<string, IdeaProductIdentity>)[sourceId];
  if (!identity) throw new Error(`Idea Lab 브랜드명 누락: ${sourceId}`);
  return identity;
}
