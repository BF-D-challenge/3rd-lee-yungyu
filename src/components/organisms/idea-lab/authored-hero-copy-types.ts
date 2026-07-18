export interface AuthoredHeroScenarioCopy {
  /** moment id마다 해결책을 말하지 않는 완성형 자기진단 질문 한 문장 */
  hooks: Record<string, string>;
  /** payer id마다 지금 반복하는 수작업과 손실을 담은 완성형 존댓말 한 문장 */
  before: Record<string, string>;
  /** twist id마다 입력 하나에서 눈에 보이는 결과 하나로 끝나는 완성형 존댓말 한 문장 */
  after: Record<string, string>;
}

export type AuthoredHeroCopyBatch = Record<string, AuthoredHeroScenarioCopy>;
