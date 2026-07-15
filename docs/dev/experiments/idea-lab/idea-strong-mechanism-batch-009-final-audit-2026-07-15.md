# Idea Lab 강한 메커니즘 배치 009 최종 감사

## 결론

- 신규 미검토 App Store Candidate 선별: 10개
- 최초 Stress-3: 30행 · 23 pass · 4 review · 3 fail
- 최초 Latin-9: 6개 · 54행 · 40 pass · 1 review · 13 fail
- moment 축 1회 재검수 Latin-9: 3개 · 27행 · 22 pass · 5 review · 0 fail
- Full-27: 4개 · 108행 · 72 pass · 0 review · 36 fail
- Full-27 27/27 통과: `White Balance Meter AI - KEV`, `Vectorize!` 2개
- 앱 수정 전 판정: **2개만 승격 후보**
- 검사 시작 시점 앱: 82개 원본 · 2,214조합
- 배치 009만 승격할 경우 예상: 84개 원본 · 2,268조합
- `sample-data.ts`, `TASK.md`, 앱 포트폴리오·커버리지·원장: 수정하지 않음

## 원본별 결과

| 원본                         |              최초 Stress-3 |               최초 Latin-9 |                           1회 재검수 |          Full-27 | 결론                                                  |
| ---------------------------- | -------------------------: | -------------------------: | -----------------------------------: | ---------------: | ----------------------------------------------------- |
| myLightMeter PRO             |          2 pass · 1 review |                     미진행 |             Stress 2 pass · 1 review |           미진행 | 노출 설정과 재촬영 moment 불일치로 종료               |
| SprintTimer                  |                        3/3 |            7 pass · 2 fail |               Stress 3/3 · Latin 9/9 | 9 pass · 18 fail | 정밀 다수 기록 판정이 2일 MVP를 넘고 공식 판정 위험   |
| Camping Assistant: Level     |            2 pass · 1 fail |                     미진행 |                               미진행 |           미진행 | 수평 여부 한 끗은 OS 수평계 대체 가능                 |
| Drumtune PRO                 |                        3/3 |            2 pass · 7 fail |                               미진행 |           미진행 | 러그·상하피 분석에 여러 번 타격해야 해 다중 입력·처리 |
| Vectorize!                   |                        3/3 | 6 pass · 1 review · 2 fail |               Stress 3/3 · Latin 9/9 |            27/27 | 승격 후보                                             |
| Format JSON for Safari       |          2 pass · 1 review |              재검수 후 9/9 |                           Stress 3/3 | 9 pass · 18 fail | 범용 JSON·브라우저 도구가 더 간단해 종료              |
| Triangle3                    | 1 pass · 1 review · 1 fail |                     미진행 |                               미진행 |           미진행 | 단순 삼각 계산은 기본 계산기 대체 가능                |
| White Balance Meter AI - KEV |                        3/3 |                        9/9 |                               미진행 |            27/27 | 승격 후보                                             |
| AXCI 센터링 판정             |                        3/3 |            7 pass · 2 fail | Stress 3/3 · Latin 4 pass · 5 review |           미진행 | 결과 제목이 선별·기록 판단을 끝내지 못해 종료         |
| Notation Scanner             | 1 pass · 1 review · 1 fail |                     미진행 |                               미진행 |           미진행 | 마디·성부 선택이 추가 입력·처리가 되어 종료           |

## 1회 재검수 원칙

이름만 바꿔 실패 원본을 다시 검사하지 않았다.

- 최초 Stress에서 review만 있던 `myLightMeter PRO`, `Format JSON for Safari`는 문제가 난 twist 문구 하나만 한 번 수정했다. JSON만 3/3이 되어 Latin으로 갔다.
- 최초 Latin에서 `payer_moment_mismatch` 한 축만 확인된 `SprintTimer`, `Vectorize!`, `AXCI`는 세 moment를 모든 payer가 함께 겪는 작업 순간으로 한 번 통일했다.
- 다중 입력·OS 대체·MVP 범위·안전 위험이 확인된 hard fail은 재검수하지 않았다.
- 각 원본의 재검수는 한 번으로 끝냈다.

## 27/27 통과 원본

### White Balance Meter AI - KEV

- 돈 낼 사람 3명은 모두 촬영 현장에서 색을 맞춰 결과를 납품하는 사진·영상 실무자다.
- moment 3개는 첫 촬영, 광원 교체, 색 불일치 재촬영 직전으로 모두 즉시 색온도가 필요하다.
- twist 3개는 Kelvin 수치, 화이트밸런스 권장값, Kelvin 스냅샷이다.
- 모든 조합이 `단일 카메라 권한 → 장면 색온도 분석 한 번 → 촬영 설정 결과 한 개`로 닫힌다.

### Vectorize!

- 돈 낼 사람 3명은 인쇄·레이저 커팅·로고 납품을 위해 SVG를 반복 제작한다.
- moment 3개는 저해상도 제작 파일 전달, 확대 시 픽셀 깨짐 발견, SVG 원본 요청 직후로 통일했다.
- twist 3개는 윤곽 단순화, 모서리 보정, 세부 수준 축소다.
- 모든 조합이 `JPG·PNG 파일 하나 → 벡터 변환 한 번 → SVG 파일 하나`로 닫힌다.

## 원본 충실도·포트폴리오 보조 감사

- 원본 충실도: 54/54 통과
- 최저 원본 충실도: `0.981969`
- 기존 82개 + 후보 2개 포트폴리오: 84개, 2,268조합
- 교차 시나리오 review 임계치: `0.766341`
- 교차 시나리오 critical 임계치: `0.818494`
- 후보 관련 최고 유사도: `0.850806`
- 후보 관련 review 조합: 116개
- 후보 관련 critical 조합: 15개

가장 가까운 쌍은 `raster-to-svg`와 기존 `candidate-simplesvgs`다. 결과 파일과 사용자 직군 문구가 비슷해 임계치를 넘지만 입력과 처리가 반대 방향으로 다르다.

- raster-to-svg: JPG·PNG 입력 → 픽셀 윤곽 벡터화 → 새 SVG 파일
- candidate-simplesvgs: 이미 존재하는 SVG 입력 → 경로·용량 최적화 → 더 작은 SVG 파일

두 도구는 대체 관계가 아니라 앞뒤로 이어 쓸 수 있는 별도 단계이므로 `Distinct`로 판정한다. `scene-white-balance`의 기존 원본 최고 유사도는 `candidate-backdropboost`와의 `0.752130`으로 review 임계치 아래다. 임베딩은 자동 탈락이 아니라 가까운 문구를 찾는 보조 검사로만 사용했다.

## 승격 규칙 확인

- [x] 정확히 10개의 미검수 `app_store:` Candidate만 선별했다.
- [x] 기존 `*card-drafts*.jsonl`과 앱 포트폴리오의 source key를 제외했다.
- [x] Stress-3 → 3/3만 Latin-9 → 9/9만 Full-27 순서를 지켰다.
- [x] 단일 축 문구 문제만 원본별 1회 재검수했다.
- [x] Full-27 27/27인 두 원본만 승격 후보 JSON에 넣었다.
- [x] 원본 충실도와 기존 포트폴리오 중복을 확인했다.
- [x] 이 보고서를 사용자에게 먼저 공개한 뒤 통과 원본 2개를 앱에 반영했다.

## 앱 반영 결과

- 반영 원본: `scene-white-balance`, `raster-to-svg`
- 전체 앱 상태: 89개 원본 중 이 배치 기여 2개
- 이 배치 추가 조합: 54개

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-009-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-009-card-drafts-2026-07-15.jsonl`
- 최초 Stress-3: `docs/research/idea-strong-mechanism-batch-009-stress-results-2026-07-15.jsonl`
- 최초 Latin-9: `docs/research/idea-strong-mechanism-batch-009-latin-results-2026-07-15.jsonl`
- Stress 단일 축 재검수: `docs/research/idea-strong-mechanism-batch-009-retry-stress-results-2026-07-15.jsonl`
- moment 축 재검수 Stress-3: `docs/research/idea-strong-mechanism-batch-009-latin-axis-retry-stress-results-2026-07-15.jsonl`
- moment 축 재검수 Latin-9: `docs/research/idea-strong-mechanism-batch-009-latin-axis-retry-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-009-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-009-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-009-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-009-portfolio-similarity-2026-07-15.json`
