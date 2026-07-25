/** 카드 공개 뒤 다음 단계는 타이머가 아니라 사용자의 명시적 버튼 입력으로만 진행한다. */
export const IDEA_LAB_AUTO_ADVANCE_ENABLED = false as const;

/** 분석에는 문장 원문 대신 공개 시점부터 버튼 입력까지의 체류 시간만 남긴다. */
export function ideaLabReadDurationMs(startedAt: number | null, endedAt: number): number {
  if (
    startedAt === null
    || !Number.isFinite(startedAt)
    || !Number.isFinite(endedAt)
    || endedAt < startedAt
  ) return 0;
  return Math.max(0, Math.round(endedAt - startedAt));
}
