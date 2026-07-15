# Idea Lab 강한 메커니즘 배치 012 최종 감사

## 결론

- 신규 미검토 App Store Candidate 선별: 10개
- 최초 Stress-3: 30행 · 20 pass · 2 review · 8 fail
- 최초 Latin-9: 3개 · 27행 · 20 pass · 2 review · 5 fail
- moment 축 1회 재검수 Stress-3: 1개 · 2 pass · 1 review · 0 fail
- Full-27: 1개 · 27행 · 27 pass · 0 review · 0 fail
- Full-27 27/27 통과: `SkySafari 8 Pro` 1개
- 앱 수정 전 판정: **1개만 승격 후보**
- 검사 시작 시점 앱: 89개 원본 · 2,403조합
- 배치 012만 승격할 경우 예상: 90개 원본 · 2,430조합
- 이 보고서를 사용자에게 먼저 공개한 뒤 `fits-sky-locator`를 앱과 공용 원장에 반영함
- 이 배치 기여: 원본 1개·조합 27개
- 배치 012~014 통합 반영 후 앱: 97개·2,619조합

## 원본별 결과

| 원본                    |                   Stress-3 |           Latin-9 |               1회 재검수 | Full-27 | 결론                                                         |
| ----------------------- | -------------------------: | ----------------: | -----------------------: | ------: | ------------------------------------------------------------ |
| App Privacy Insights    |                        3/3 | 7 pass · 2 review | Stress 2 pass · 1 review |  미진행 | 공통 moment로 한 번 고쳤지만 3/3 미달로 종료                 |
| Hexer — Hex File Viewer |            2 pass · 1 fail |            미진행 |                   미진행 |  미진행 | 바이트 검색어가 파일 외 추가 입력이 되어 종료                |
| SlushIQ                 |            1 pass · 2 fail |            미진행 |                   미진행 |  미진행 | 증량 moment와 설탕·물 조정 twist가 교차하면 결과가 어긋남    |
| App Icon Extractor      |            2 pass · 1 fail |            미진행 |                   미진행 |  미진행 | 앱 이름 외 App Store 외부 데이터가 필요해 종료               |
| SkySafari 8 Pro         |                        3/3 |               9/9 |                   미진행 |   27/27 | 승격 후보                                                    |
| VocalPitchMonitor       | 0 pass · 2 review · 1 fail |            미진행 |                   미진행 |  미진행 | 목표 음 입력 없이 이탈·차이를 계산할 수 없어 종료            |
| Libreoffice Viewer      |                        3/3 |   4 pass · 5 fail |                   미진행 |  미진행 | 특정 직군에 맞춘 moment가 다른 payer와 교차하면 부자연스러움 |
| IP Scanner Ultra        |            2 pass · 1 fail |            미진행 |                   미진행 |  미진행 | 새 장치 판정에 이전 스캔 기록이 필요해 종료                  |
| Any Roll Length         |            2 pass · 1 fail |            미진행 |                   미진행 |  미진행 | 원본에 없는 오차 범위를 추가해 메커니즘이 벗어남             |
| GPS 진단                |            2 pass · 1 fail |            미진행 |                   미진행 |  미진행 | 방향 진단 twist가 판정 기준상 원본 결과를 벗어나 종료        |

## 1회 재검수 원칙

이름만 바꿔 실패 원본을 다시 검사하지 않았다.

- 최초 Latin에서 `payer_moment_mismatch`만 나온 `App Privacy Insights`는 moment 세 개를 모든 payer가 함께 겪는 점검 순간으로 한 번 통일했다.
- 수정 후 Stress-3이 2 pass · 1 review여서 두 번째 수정 없이 종료했다.
- 다중 입력·외부 데이터·이전 기록·원본 이탈처럼 `hard_gate: fail`이 나온 원본은 재검수하지 않았다.

## 27/27 통과 원본

### SkySafari 8 Pro → `fits-sky-locator`

- 돈 낼 사람 3명은 아마추어 천체사진가, 학교 천문 동아리 지도교사, 소형 천문대 운영자다.
- moment 3개는 촬영 대상 확인, 다음 촬영 구도 수정, 관측 기록 제출 직전이다.
- twist 3개는 중심 좌표가 찍힌 하늘 차트, 촬영 영역 경계, 주요 천체 라벨이다.
- 모든 조합이 `FITS 천체 이미지 파일 하나 → 플레이트 솔빙 한 번 → 좌표가 표시된 하늘 차트 한 개`로 닫힌다.
- Full-27 결과 보고서가 먼저 생성된 뒤에 승격 후보 JSON을 만들었다.

## 원본 충실도 감사

- 검사: 27조합
- 통과: 27/27
- 최저·최고 유사도: `0.990872`
- 판정: 원본의 `천체 이미지 가져오기 → plate solving → sky chart 배치` 흐름을 그대로 보존한다.

## 89개 앱 포트폴리오 중복 수동 판정

- 비교 범위: 기존 89개 + 후보 1개 = 90개, 2,430조합
- 교차 시나리오 review 임계치: `0.764450`
- 교차 시나리오 critical 임계치: `0.816525`
- 후보 관련 review 조합: 20개
- 후보 관련 critical 조합: 2개
- 후보 관련 최고 유사도: `0.822616`

가장 가까운 시나리오는 `candidate-casora`와 `candidate-photogenius`지만 실제 메커니즘은 다르다.

- `candidate-casora`: 방 사진 + 색상 선택 → 인테리어 색을 바꾼 합성 이미지
- `candidate-photogenius`: 오래된 사진 → 화질·얼굴 복원 → 선명해진 사진
- `fits-sky-locator`: FITS 천체 사진 → 별 패턴 플레이트 솔빙 → 실제 하늘 좌표·촬영 영역 차트

사진 입력, 교사 payer, 결과 확인 같은 한국어 표현 때문에 임베딩 점수가 높아졌지만 입력 형식·핵심 처리·결과가 모두 다르다. 기존 앱을 대체하거나 합쳐야 하는 중복이 아니므로 `Distinct`로 판정한다. 임베딩은 자동 탈락이 아니라 가까운 문구를 찾는 보조 검사로만 사용했다.

## 승격 규칙 확인

- [x] 정확히 10개의 미검수 `app_store:` Candidate만 선별했다.
- [x] 현재 앱 source key와 배치 001~011 input/card-drafts source key를 제외했다.
- [x] Stress-3 3/3 → Latin-9 9/9 → Full-27 27/27 순서를 지켰다.
- [x] 단일 축 문구 문제만 원본별 한 번 재검수했다.
- [x] hard fail 원본은 재검사하지 않았다.
- [x] Full-27 보고서를 승격 후보 JSON보다 먼저 만들었다.
- [x] 원본 충실도와 현재 89개 앱 포트폴리오 중복을 수동 판정했다.
- [x] 보고서 공개 뒤 통과 원본 1개만 앱에 반영했다.

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-012-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-012-card-drafts-raw-2026-07-15.jsonl`
- 최초 Stress-3: `docs/research/idea-strong-mechanism-batch-012-stress-results-2026-07-15.jsonl`
- 최초 Latin-9: `docs/research/idea-strong-mechanism-batch-012-latin-results-2026-07-15.jsonl`
- moment 축 재검수: `docs/research/idea-strong-mechanism-batch-012-latin-axis-retry-stress-results-2026-07-15.jsonl`
- Full-27 보고서: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-012-full-summary-2026-07-15.md`
- Full-27 결과: `docs/research/idea-strong-mechanism-batch-012-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-012-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-012-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-012-portfolio-similarity-2026-07-15.json`
