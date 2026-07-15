# Strong Mechanism Batch 013 최종 감사 — Chrome Web Store

- 작성일: 2026-07-15
- 입력: 전수 판정 ledger의 `chrome_web_store:` Candidate 중 미감사 원본 10개
- 기준 앱 포트폴리오: 89개 원본, 2,403개 런타임 조합
- 결과: 10개 중 Full-27을 27/27로 통과한 승격 후보 3개
- 승격 후보 조합: 81개
- 앱 반영: 이 문서를 사용자에게 먼저 공개한 뒤 통과 원본 3개만 반영

## 1. 선택 원본 10개

| 순번 | 원본                                      | source key                                          |
| ---: | ----------------------------------------- | --------------------------------------------------- |
|    1 | SelectorsHub                              | `chrome_web_store:ndgimibanhlabgdgjcpbbndiehljcpfh` |
|    2 | API Recorder                              | `chrome_web_store:bcnbbkdpnoeaaedhhnlefgpijlpbmije` |
|    3 | GitZip for github                         | `chrome_web_store:ffabmkklhbepgcgfonabamgnfafbdlkn` |
|    4 | Design Analyzer - Extract Design Elements | `chrome_web_store:lcgfgelbpgaepigopgkoloicjjkgihcg` |
|    5 | Fake Filler                               | `chrome_web_store:bnjjngeaknajbdcgpfkgnonkmififhfo` |
|    6 | YouTube Tag Extractor                     | `chrome_web_store:idickfnblhhleimfneihpmddjabiodlp` |
|    7 | Download All Images                       | `chrome_web_store:nnffbdeachhbpfapjklmpnmjcgamcdmm` |
|    8 | HTML to Figma… Wireframeit                | `chrome_web_store:nbmkpdgmnjbiohfpiofmjhpbeakpmlfd` |
|    9 | Needle Inspector                          | `chrome_web_store:jonplpbnhmanoekkgcepnedhghflblmo` |
|   10 | Cookie Manager Pro                        | `chrome_web_store:ijolfnkijbagodcigeebgjhlkdgcebmf` |

기존 앱 source key와 Strong Mechanism Batch 001~011의 입력·카드 초안 source key를 제외했다. 안전을 위해 전역 카드 초안에 이미 등장한 원본도 제외했다.

## 2. 첫 감사 결과

| 단계     | 원본 수 | 검사 행 | pass | review | fail | 다음 단계 통과 원본 |
| -------- | ------: | ------: | ---: | -----: | ---: | ------------------: |
| Stress-3 |      10 |      30 |   21 |      7 |    2 |                   5 |
| Latin-9  |       5 |      45 |   34 |     10 |    1 |                   2 |
| Full-27  |       2 |      54 |   54 |      0 |    0 |                   2 |

첫 Full-27 직행 통과:

- YouTube Tag Extractor: 27/27 pass
- Cookie Manager Pro: 27/27 pass

하드 실패 또는 한 축 문구로 고칠 수 없는 구조적 범위 문제는 다시 쓰지 않았다.

- HTML to Figma… Wireframeit: 메커니즘 이탈·MVP 과대·OS 기본 대체 가능성이 함께 나와 재시도하지 않음
- Needle Inspector: 세 Stress 조합 모두 MVP 범위가 너무 커 재시도하지 않음
- Fake Filler: Latin에서 사전 기록 필요·다단계·결과 불명확의 hard fail이 나와 재시도하지 않음

## 3. 한 번만 허용한 단일 축 재검수

재검수는 원본 메커니즘을 바꾸지 않고, 판정에서 한 축의 문구만 문제였던 5개에 한 번만 허용했다.

| 원본                | 바꾼 축     | Retry Stress-3 | Retry Latin-9 | Retry Full-27 | 최종 |
| ------------------- | ----------- | -------------: | ------------: | ------------: | ---- |
| API Recorder        | 필요한 순간 |            2/3 |    진입 안 함 |    진입 안 함 | 보류 |
| GitZip for github   | 필요한 순간 |            3/3 |           5/9 |    진입 안 함 | 탈락 |
| Download All Images | 필요한 순간 |            3/3 |           7/9 |    진입 안 함 | 보류 |
| SelectorsHub        | 결과 제목   |            0/3 |    진입 안 함 |    진입 안 함 | 탈락 |
| Design Analyzer     | 결과 제목   |            3/3 |           9/9 |         27/27 | 통과 |

Retry 단계 전체 수치:

| 단계           | 원본 수 | 검사 행 | pass | review | fail |
| -------------- | ------: | ------: | ---: | -----: | ---: |
| Retry Stress-3 |       5 |      15 |   11 |      3 |    1 |
| Retry Latin-9  |       3 |      27 |   21 |      3 |    3 |
| Retry Full-27  |       1 |      27 |   27 |      0 |    0 |

GitZip과 Download All Images는 각 역할과 순간을 따로 보면 괜찮았지만, 서로 교차했을 때 일부 결제자·순간·한 끗 조합이 여전히 자연스럽지 않았다. 두 번째 문구 수정은 허용하지 않았다.

## 4. 최종 승격 후보 3개

| 시나리오 ID                   | 해외 원본             | 입력 → 처리 → 결과                                                 | Full-27 |
| ----------------------------- | --------------------- | ------------------------------------------------------------------ | ------: |
| `youtube-hidden-tag-export`   | YouTube Tag Extractor | YouTube 영상 URL → 숨은 태그 추출·정렬 → TXT/CSV 목록 파일         |   27/27 |
| `masked-cookie-profile`       | Cookie Manager Pro    | 현재 사이트 쿠키 권한 → 구조 필터링·값 마스킹 → 재현용 JSON        |   27/27 |
| `website-design-token-export` | Design Analyzer       | 공개 웹사이트 URL → 색상·폰트·간격·효과 추출 → CSS/JSON/Figma 토큰 |   27/27 |

세 후보 모두 결제자 3 × 순간 3 × 한 끗 3의 27개 조합 전부가 pass다.

## 5. 원본 충실도 검사

- 검사 조합: 81개
- pass: 81개
- 0.80 미만: 0개
- 유사도 최저: 0.963846
- 중앙값: 0.972608
- 유사도 최고: 0.982350

세 후보 모두 해외 원본의 입력·처리·결과를 유지했다. 새 기능을 붙여 다른 제품으로 바뀐 조합은 없었다.

## 6. 현재 앱 89개와 의미 중복 검사

- 비교 범위: 기존 89개 + 후보 3개 = 92개 원본
- 비교 조합: 2,484개
- 후보 관련 교차 비교: 196,830쌍
- review 임계값: 0.763247
- critical 임계값: 0.815356
- 후보 관련 review 쌍: 40개
- 후보 관련 critical 쌍: 0개

수치가 review 기준을 넘은 쌍은 자동 탈락시키지 않고 입력·처리·결과를 직접 비교했다.

| 후보                   | 가장 가까운 기존 시나리오 | 최고 유사도 | 수동 판정                                                                                                                                                                           |
| ---------------------- | ------------------------- | ----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YouTube 숨은 태그 목록 | `video-frame-extractor`   |    0.796760 | 통과. 둘 다 영상 실무자가 쓰지만, 기존은 영상 파일에서 JPG/PNG 프레임을 추출하고 후보는 YouTube URL에서 태그 TXT/CSV를 추출한다. 입력·처리·결과가 모두 다르다.                      |
| 마스킹 쿠키 프로필     | `accessibility-fix-five`  |    0.773833 | 통과. 둘 다 웹 QA가 개발팀에 근거를 보내지만, 기존은 DOM 접근성 규칙을 검사해 수정 티켓을 만들고 후보는 현재 사이트 쿠키를 마스킹해 JSON으로 만든다.                                |
| 웹사이트 디자인 토큰   | `site-to-brand-card`      |    0.766363 | 통과. 둘 다 사이트 URL에서 디자인 정보를 읽지만, 기존은 로고·카피·출처를 담은 마케팅용 1쪽 브랜드 카드이고 후보는 개발·디자인 시스템에 바로 넣는 CSS 변수·JSON·Figma 토큰 파일이다. |

결론: 세 후보 모두 기존 시나리오와 사용 맥락 일부는 겹치지만 같은 제품 메커니즘을 중복 추가하는 것은 아니다.

## 7. 최종 판정

- 입력 10개
- 최종 Full-27 통과 3개
- 승격률 30%
- 이 배치 기여: 원본 3개 / 런타임 조합 81개
- 배치 012~014 통합 반영 후 앱: 97개 원본 / 2,619개 런타임 조합

## 8. 산출물

- 선택: `docs/research/idea-strong-mechanism-batch-013-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-013-card-drafts-2026-07-15.jsonl`
- 첫 Stress 결과: `docs/research/idea-strong-mechanism-batch-013-stress-results-2026-07-15.jsonl`
- 첫 Latin 결과: `docs/research/idea-strong-mechanism-batch-013-latin-results-2026-07-15.jsonl`
- 첫 Full 결과: `docs/research/idea-strong-mechanism-batch-013-full-results-2026-07-15.jsonl`
- 재검수 카드: `docs/research/idea-strong-mechanism-batch-013-retry-card-drafts-2026-07-15.jsonl`
- 재검수 Stress 결과: `docs/research/idea-strong-mechanism-batch-013-retry-stress-results-2026-07-15.jsonl`
- 재검수 Latin 결과: `docs/research/idea-strong-mechanism-batch-013-retry-latin-results-2026-07-15.jsonl`
- 재검수 Full 결과: `docs/research/idea-strong-mechanism-batch-013-retry-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-013-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-013-fidelity-similarity-2026-07-15.json`
- 앱 포트폴리오 중복 검사: `docs/research/idea-strong-mechanism-batch-013-portfolio-similarity-2026-07-15.json`
