# 강한 메커니즘 배치 014 — TrustMRR 최종 감사

- 날짜: 2026-07-15
- 범위: 기존 카드 초안과 앱 포트폴리오에 없던 `trustmrr:` Candidate 10개
- 게이트: Stress-3 `3/3` → Latin-9 `9/9` → Full-27 `27/27`
- 결과: Full-27 통과 원본 4개, 승격 후보 4개
- 앱 반영: 이 보고서를 사용자에게 먼저 공개한 뒤 통과 원본 4개 반영

## 한눈에 보는 결과

| 단계                                 | 원본 수 | 조합 행 | pass | review | fail |
| ------------------------------------ | ------: | ------: | ---: | -----: | ---: |
| 최초 Stress-3                        |      10 |      30 |   23 |      1 |    6 |
| checkemail 순간 문구 1회 재검사      |       1 |       3 |    2 |      1 |    0 |
| 최초 Latin-9                         |       5 |      45 |   37 |      8 |    0 |
| Beesecure twist 문구 재검사 Stress-3 |       1 |       3 |    3 |      0 |    0 |
| Beesecure twist 문구 재검사 Latin-9  |       1 |       9 |    9 |      0 |    0 |
| Full-27                              |       4 |     108 |  108 |      0 |    0 |

## 원본별 게이트 결과

| 원본                            |                                               Stress-3 |                             Latin-9 |                                                     Full-27 | 최종 판정                                                      |
| ------------------------------- | -----------------------------------------------------: | ----------------------------------: | ----------------------------------------------------------: | -------------------------------------------------------------- |
| WebToApp: No Code App Converter |                                                    3/3 |                                 9/9 |                                                       27/27 | 승격 후보                                                      |
| scrapestudio.co                 |                                                    3/3 |                                 9/9 |                                                       27/27 | 승격 후보                                                      |
| Lightspeed.run                  |                                                    3/3 |                                 9/9 |                                                       27/27 | 승격 후보; 포트폴리오 critical 1건 수동 구분                   |
| Beesecure                       |                                                    3/3 | 6 pass · 3 review → 문구 재검사 9/9 |                                                       27/27 | 승격 후보                                                      |
| ContextBlur                     |                                                    3/3 |                   4 pass · 5 review |                                                      미실행 | 결제자 구체성·안전성의 여러 축이 동시에 불명확해 중단          |
| checkemail.dev                  | 2 pass · 1 review → 순간 문구 재검사 2 pass · 1 review |                              미실행 | 한 번의 허용 재검사 뒤에도 결제자·순간 연결이 불명확해 중단 |
| SheetSandBox                    |                                        2 pass · 1 fail |                              미실행 |                                                      미실행 | 실제 API 링크 없이 OpenAPI 문서를 만드는 메커니즘 이탈로 중단  |
| Trainy \| Train Identifier      |                                        2 pass · 1 fail |                              미실행 |                                                      미실행 | 결제자와 필요한 순간이 맞지 않아 중단                          |
| ShipTested                      |                                                 3 fail |                              미실행 |                                                      미실행 | 입력 한 개·처리 한 번·결과 한 개를 벗어난 다단계 작업이라 중단 |
| FormNX                          |                                        2 pass · 1 fail |                              미실행 |                                                      미실행 | 원본 메커니즘 이탈과 결제자·순간 불일치로 중단                 |

## 허용한 재검사

재검사는 원본을 새 아이디어로 바꾸는 작업이 아니라, 한 축의 문구만 불명확한 경우 원본마다 한 번만 허용했다.

### checkemail.dev

- 최초 Stress-3: 2 pass · 1 review
- 변경한 축: 필요한 순간 문구만 수정
- 재검사: 2 pass · 1 review
- 결론: 재검사 뒤에도 통과하지 못해 Latin-9로 보내지 않았다.

### Beesecure

- 최초 Stress-3: 3/3
- 최초 Latin-9: 6 pass · 3 review
- 문제: 세 번째 twist의 `보안 헤더 누락 행 위치`가 정적 코드 검사 결과로 명확하지 않았다.
- 변경한 축: 세 번째 twist만 `전체 허용 CORS 정적 코드 위치`로 수정
- 재검사: Stress-3 3/3, Latin-9 9/9
- 결론: 한 축 수정으로 게이트를 통과해 Full-27로 보냈다.

그 외 hard fail 또는 여러 축 문제가 있는 원본은 이름을 바꾸거나 기능을 붙여 재검사하지 않았다.

## Full-27 통과 카드

### WebToApp: No Code App Converter

- 입력: 모바일 대응 공개 웹사이트 URL 하나
- 처리: Android WebView 앱 패키징 한 번
- 결과: favicon·뒤로가기·자사 도메인 규칙 중 하나가 적용된 debug APK 한 파일
- Full-27: 27 pass · 0 review · 0 fail

### scrapestudio.co

- 입력: 공개 웹페이지 URL과 CSS selector가 합쳐진 텍스트 하나
- 처리: 지정 컴포넌트의 DOM·스타일 추출 및 변환 한 번
- 결과: HTML/CSS·React JSX·Tailwind 중 하나의 컴포넌트 코드 파일
- Full-27: 27 pass · 0 review · 0 fail

### Lightspeed.run

- 입력: 공개 웹페이지 URL 하나
- 처리: 실제 브라우저 성능 측정 한 번
- 결과: LCP·CLS·긴 JavaScript 작업 중 하나와 원인 요소·파일이 표시된 HTML 보고서
- Full-27: 27 pass · 0 review · 0 fail

### Beesecure

- 입력: 웹 프로젝트 코드 ZIP 하나
- 처리: 비밀키·`eval` 계열 호출·전체 허용 CORS 중 하나의 정적 검사 한 번
- 결과: 위험 패턴의 파일·행 위치가 표시된 HTML 보고서
- Full-27: 27 pass · 0 review · 0 fail

## Full-27 선행 문서 확인

- 선행 보고서: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-014-full-27-audit-2026-07-15.md`
- 결과: 4개 원본, 108/108 pass
- 선행 조건: 위 보고서를 promotion candidate JSON보다 먼저 작성했다.

## 원본 충실도 임베딩

- 모델: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- 전체: 108/108 pass
- 전체 최솟값: 0.973202
- 전체 최댓값: 0.991315
- 목표 밴드: 81개
- 원본과 사실상 동일해 허용한 조합: 27개
- 원본 흐름에서 벗어난 조합: 0개

## 현재 앱 89개와 포트폴리오 중복 감사

- 입력: 기존 89개 2,403조합 + 후보 4개 108조합 = 2,511조합
- 교차 review 기준: 0.762689
- 교차 critical 기준: 0.814986
- 후보 관련 review: 50건
- 후보 관련 critical: 1건

| 후보                                 | 최대 유사도 | review | critical | 가장 가까운 기존 시나리오     | 수동 구분 근거                                                                                                                                                                                              |
| ------------------------------------ | ----------: | -----: | -------: | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| website-to-android-apk               |    0.676920 |      0 |        0 | sheet-to-apps-script-form     | 기존 카드는 Google Sheet를 Apps Script 입력 앱으로 만든다. 후보는 이미 존재하는 모바일 웹 URL을 Android WebView APK로 감싼다. 입력·처리·결과가 다르다.                                                      |
| web-component-code-extractor         |    0.756575 |      0 |        0 | candidate-base44-downloader   | 기존 카드는 Base44 워크스페이스 파일을 내려받아 구조를 정리한다. 후보는 공개 웹페이지의 CSS selector 대상 DOM·스타일을 HTML/CSS·JSX·Tailwind 코드로 변환한다.                                               |
| code-static-security-locations       |    0.785107 |      5 |        0 | chrome-extension-static-audit | 기존 카드는 Chrome 확장 CRX의 권한·외부 전송 도메인·난독화를 감사한다. 후보는 일반 웹 프로젝트 ZIP의 비밀키·`eval`·전체 허용 CORS를 파일·행 단위로 찾는다. 입력 형식과 검사 규칙이 구분된다.                |
| single-page-performance-cause-report |    0.816249 |     45 |        1 | one-page-seo-fix-list         | 기존 카드는 title·meta·H1·canonical과 검색 미리보기를 검사한다. 후보는 실제 브라우저로 LCP·CLS·긴 JavaScript 작업을 측정하고 원인 요소·파일을 표시한다. 같은 웹페이지 납품 문맥이지만 처리와 결과는 다르다. |

`single-page-performance-cause-report`의 critical 1건은 결제자와 순간의 문장 문맥이 가까워 발생했다. 그러나 SEO 메타데이터 검사와 런타임 성능 측정은 사용자가 넣는 URL만 같고, 계산하는 값과 받는 결과가 다르므로 중복 원본으로 보지 않는다. 네 후보 모두 자동 앱 반영이 아닌 **문서화된 승격 후보**로 유지한다.

## 생성 산출물

- 선택 입력: `docs/research/idea-strong-mechanism-batch-014-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-014-card-drafts-2026-07-15.jsonl`
- Stress 결과: `docs/research/idea-strong-mechanism-batch-014-stress-results-2026-07-15.jsonl`
- checkemail 재검사: `docs/research/idea-strong-mechanism-batch-014-retry-stress-results-2026-07-15.jsonl`
- Latin 결과: `docs/research/idea-strong-mechanism-batch-014-latin-results-2026-07-15.jsonl`
- Beesecure 재검사 Stress: `docs/research/idea-strong-mechanism-batch-014-beesecure-retry-stress-results-2026-07-15.jsonl`
- Beesecure 재검사 Latin: `docs/research/idea-strong-mechanism-batch-014-beesecure-retry-latin-results-2026-07-15.jsonl`
- Full 결과: `docs/research/idea-strong-mechanism-batch-014-full-results-2026-07-15.jsonl`
- Full 선행 보고서: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-014-full-27-audit-2026-07-15.md`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-014-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-014-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복도: `docs/research/idea-strong-mechanism-batch-014-portfolio-similarity-2026-07-15.json`
- WebToApp 별도 포커스: `docs/research/idea-strong-mechanism-batch-014-website-apk-focus-similarity-2026-07-15.json`

## 앱 수정 전 체크

- [x] 최종 Full-27 결과를 promotion candidate 생성 전에 문서화
- [x] 승격 후보 JSON 생성
- [x] 원본 충실도 108/108 확인
- [x] 현재 앱 89개 포트폴리오와 임베딩 중복 검사
- [x] review·critical 후보의 입력·처리·결과를 수동 판정
- [x] 사용자에게 먼저 보여줄 최종 보고서 생성
- [x] `sample-data.ts` 반영 — 보고서 공개 뒤 통과 원본 4개만 적용

## 앱 반영 결과

- 이 배치 기여: 원본 4개 / 런타임 조합 108개
- 배치 012~014 통합 반영 후 앱: 97개 원본 / 2,619조합 / 리서치 연결 97/97
