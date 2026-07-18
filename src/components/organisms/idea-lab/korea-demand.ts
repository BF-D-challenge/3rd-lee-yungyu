/**
 * 한국의 대중 소비자가 설명 없이 자기 문제로 알아볼 수 있는 원본만 남긴다.
 *
 * 아래 조건을 모두 만족해야 실제 랜덤 뽑기에 들어간다.
 * - 특정 직무·해외 플랫폼·전문 파일 형식을 알아야 이해하는 문제가 아니다.
 * - 학생·직장인·부모·여행자처럼 큰 생활 행동군이 반복해서 겪는다.
 * - 입력 하나와 눈에 보이는 결과 하나를 중학생도 바로 설명할 수 있다.
 *
 * 원본 100개와 2,700개 조합은 삭제하지 않는다. 이 목록은 런타임 노출만 제한한다.
 */
export const KOREA_POPULAR_SCENARIO_IDS = [
  "voice-notes",
  "schedule-to-calendar-file",
  "video-recipe-card",
  "passport-photo-print-sheet",
  "party-imposter",
  "class-material-coach",
  "youtube-language-loop",
  "audio-noise-cleaner",
  "safe-message-reply",
  "recurring-charge-finder",
  "meal-habit-loop",
  "family-notice-one-sheet",
  "game-assessment-rehearsal",
  "screen-recording-tutorial",
  "video-place-route",
  "hotel-final-price-compare",
  "next-set-weight-reps",
  "candidate-youtube-transcript-dev-extract-download-video-tr",
  "candidate-casora",
  "worry-guardian-ritual",
  "candidate-tickoff",
  "candidate-not-for-me-drink-less",
  "silent-companion-session",
  "daily-character-world",
  "video-frame-extractor",
  "large-file-share-link",
] as const;

export type KoreaPopularScenarioId =
  (typeof KOREA_POPULAR_SCENARIO_IDS)[number];

const KOREA_POPULAR_SCENARIO_ID_SET = new Set<string>(
  KOREA_POPULAR_SCENARIO_IDS,
);

export const KOREA_POPULAR_SCENARIO_COUNT =
  KOREA_POPULAR_SCENARIO_IDS.length;

export function isKoreaPopularScenarioId(
  scenarioId: string,
): scenarioId is KoreaPopularScenarioId {
  return KOREA_POPULAR_SCENARIO_ID_SET.has(scenarioId);
}
