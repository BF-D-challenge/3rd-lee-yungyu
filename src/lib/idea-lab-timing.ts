export const IDEA_LAB_READABLE_PAUSE_MS = 2_500;

/**
 * 실제 제품에서는 모션 설정과 관계없이 카드 앞면을 2.5초 보여준다.
 * 짧은 값은 명시적인 E2E 빌드에서만 허용해 회귀 테스트 시간을 줄인다.
 */
export function ideaLabReadablePauseMs({
  e2e = false,
  e2eOverride,
}: {
  e2e?: boolean;
  e2eOverride?: string;
} = {}): number {
  if (!e2e) return IDEA_LAB_READABLE_PAUSE_MS;
  const parsed = Number(e2eOverride);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : IDEA_LAB_READABLE_PAUSE_MS;
}
