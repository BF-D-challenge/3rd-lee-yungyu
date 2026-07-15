# 강한 메커니즘 배치 017 — TrustMRR 최종 감사

- 날짜: 2026-07-15
- 범위: 기존 앱 97개와 strong-mechanism batch 001~014 input/card-drafts에 없던 `trustmrr:` Candidate 10개
- 게이트: Stress-3 `3/3` → Latin-9 `9/9` → Full-27 `27/27`
- 결과: Full-27 통과 원본 6개, promotion candidate 6개
- 앱 반영: 이 보고서를 사용자에게 먼저 공개한 뒤 중복 위험이 가장 낮은 상위 3개만 반영했다.

## 한눈에 보는 결과

| 단계                                   | 원본 수 | 조합 행 | pass | review | fail |
| -------------------------------------- | ------: | ------: | ---: | -----: | ---: |
| 최초 Stress-3                          |      10 |      30 |   22 |      4 |    4 |
| Octree·Beep 단일 축 1회 수정 Stress-3  |       2 |       6 |    6 |      0 |    0 |
| Latin-9                                |       8 |      72 |   65 |      1 |    6 |
| 최초 Full-27                           |       7 |     189 |  186 |      3 |    0 |
| Takeout Tools moment 1회 수정 Stress-3 |       1 |       3 |    3 |      0 |    0 |
| Takeout Tools 수정 Latin-9             |       1 |       9 |    8 |      1 |    0 |
| 최종 Full-27 통과분                    |       6 |     162 |  162 |      0 |    0 |

## 원본별 게이트 결과

| 원본                   |                   Stress-3 |                    Latin-9 |            Full-27 | 최종 판정                             |
| ---------------------- | -------------------------: | -------------------------: | -----------------: | ------------------------------------- |
| SiteMapToLlm           |                        3/3 |                        9/9 |              27/27 | promotion candidate                   |
| myterrace.net          |                        3/3 |                        9/9 |              27/27 | promotion candidate                   |
| Taillens               |                        3/3 |                        9/9 |              27/27 | promotion candidate                   |
| Fonzo.io               |                        3/3 |                        9/9 |              27/27 | promotion candidate                   |
| Octree                 |    2 pass · 1 review → 3/3 |                        9/9 |              27/27 | 제목 1축 수정 후 promotion candidate  |
| Beep Productivity Inc. |    2 pass · 1 review → 3/3 |                        9/9 |              27/27 | payer 1축 수정 후 promotion candidate |
| Takeout Tools          |                        3/3 |                        9/9 | 24 pass · 3 review | moment 1축 수정 뒤 Latin 8/9라 종료   |
| SessionWatcher         |                        3/3 | 2 pass · 1 review · 6 fail |             미실행 | 여러 축 hard fail로 종료              |
| PayPing                | 0 pass · 2 review · 1 fail |                     미실행 |             미실행 | 범용 AI 대체 hard fail로 종료         |
| Resume Parse           |                     3 fail |                     미실행 |             미실행 | 범용 AI 대체 hard fail로 종료         |

## 최종 6개가 만드는 결과

### SiteMapToLlm

- 입력: 공개 XML·HTML 사이트맵 URL 하나
- 처리: 제목·경로를 한 번 파싱하고 섹션화 또는 중복 제거
- 결과: 구조화된 `llms.txt` 파일 하나
- Full-27: 27/27 pass

### myterrace.net

- 입력: 팀명·경기명·일시·스코어·로고 URL가 적힌 텍스트 한 덩어리
- 처리: 정사각형·스토리·스폰서 바 템플릿 중 하나에 한 번 배치
- 결과: 즉시 게시 가능한 축구 매치데이 PNG 한 장
- Full-27: 27/27 pass

### Taillens

- 입력: `공개 URL#CSS selector|원하는 Tailwind 변경값` 텍스트 하나
- 처리: 현재 class를 읽어 간격·색상·breakpoint 한 줄만 변경
- 결과: Tailwind 최소 수정 diff 파일 하나
- Full-27: 27/27 pass

### Fonzo.io

- 입력: 단색 SVG 아이콘 ZIP 하나
- 처리: glyph 웹폰트로 한 번 변환하고 class·viewBox·미리보기 중 하나 적용
- 결과: CSS·웹폰트·미리보기가 든 ZIP 한 개
- Full-27: 27/27 pass

### Octree

- 입력: LaTeX `.tex` 파일 하나
- 처리: 특수문자 4종·한 줄 중괄호·단순 표 열 개수 중 하나를 정적 검사·보정
- 결과: 수정된 `.tex` 파일 하나
- Full-27: 27/27 pass

### Beep Productivity Inc.

- 입력: `공개 URL#CSS selector|댓글` 텍스트 하나
- 처리: 대상 요소를 데스크톱 또는 모바일 화면에서 한 번 캡처·표시
- 결과: 위치·댓글·selector가 보이는 HTML 피드백 파일 하나
- Full-27: 27/27 pass

## 원본 충실도 임베딩

- 실행 환경: `/Users/yungyulee/.local/share/idea-embedding-venv/bin/python`
- 모델: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- 전체: **162/162 pass**
- 기준 미달 0.80 미만: 0개
- 전체 최솟값: 0.974295
- 전체 최댓값: 0.991437
- 목표 밴드 0.80~0.99: 108개
- 원본과 사실상 동일해 허용한 0.99 초과: 54개

| 후보                             | 충실도 최솟값 |   최댓값 |  pass |
| -------------------------------- | ------------: | -------: | ----: |
| football-matchday-social-card    |      0.974651 | 0.980249 | 27/27 |
| sitemap-to-llms-text             |      0.974296 | 0.974296 | 27/27 |
| tailwind-selector-class-diff     |      0.977271 | 0.977271 | 27/27 |
| web-element-visual-feedback-file |      0.975855 | 0.975855 | 27/27 |
| latex-static-error-fix-file      |      0.991437 | 0.991437 | 27/27 |
| svg-icons-to-webfont-package     |      0.990364 | 0.990364 | 27/27 |

## 현재 앱 97개와 포트폴리오 중복 감사

- 입력: 기존 앱 97개 2,619조합 + 후보 6개 162조합 = 2,781조합
- 교차 review 기준: 0.762689
- 교차 critical 기준: 0.814986
- 아래 review/critical은 후보와 기존 앱 97개의 조합쌍만 다시 집계한 값이다.

| 우선순위 | 후보                             | 최대 유사도 | review | critical | 가장 가까운 기존 시나리오      | 수동 판정                                                                                                                                                                           |
| -------: | -------------------------------- | ----------: | -----: | -------: | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|        1 | football-matchday-social-card    |    0.742835 |      0 |        0 | game-assessment-rehearsal      | 기존은 구직자의 게임형 평가 재연습이다. 후보는 축구 경기 정보 텍스트를 매치데이 PNG로 배치하므로 입력·처리·결과가 모두 다르다.                                                      |
|        2 | sitemap-to-llms-text             |    0.797921 |      3 |        0 | code-static-security-locations | 기존은 코드 ZIP을 정적 보안 검사해 파일·행 보고서를 만든다. 후보는 공개 사이트맵 URL을 파싱해 llms.txt를 만든다. 배포 직전이라는 문맥만 가깝다.                                     |
|        3 | tailwind-selector-class-diff     |    0.798631 |     10 |        0 | web-component-code-extractor   | 둘 다 URL#selector를 쓰지만 기존은 DOM·스타일을 새 컴포넌트 코드로 추출하고, 후보는 현재 Tailwind class 한 줄만 바꾼 diff를 만든다.                                                 |
|        4 | web-element-visual-feedback-file |    0.817533 |     19 |        1 | website-design-token-export    | 기존은 사이트 전체의 색상·폰트·간격을 디자인 토큰으로 추출한다. 후보는 지정 요소를 캡처해 위치·댓글이 붙은 피드백 파일을 만든다. 입력 범위·처리·결과가 구분된다.                    |
|        5 | latex-static-error-fix-file      |    0.849078 |    122 |       21 | notion-page-to-pdf             | 교사·문서·PDF 직전 문맥이 가깝다. 기존은 Notion 페이지를 렌더링해 PDF로 내보내고 후보는 `.tex` 문법을 정적 수정해 `.tex`로 돌려주므로 실제 메커니즘은 다르다.                       |
|        6 | svg-icons-to-webfont-package     |    0.889304 |    375 |      150 | candidate-simplesvgs           | 둘 다 SVG 아이콘 작업이다. 기존은 SVG 한 파일의 압축·최적화 결과이고 후보는 여러 SVG ZIP을 glyph 웹폰트·CSS 패키지 ZIP으로 바꾼다. 메커니즘은 구분되지만 도메인 중복이 커 후순위다. |

수동 판정 결과 여섯 후보 모두 기존 카드와 입력·처리·결과가 구분된다. 다만 100개 목표는 3개만 더 필요하므로, 중복 위험이 낮은 상위 3개를 먼저 반영하고 나머지 3개는 promotion candidate로 보존하는 것이 안전하다.

## 100개 목표 추천 순서

평가 순서는 요청받은 기준 그대로 적용했다: `critical/review 낮음 → 입력·처리·결과 구분 → 원본 충실도 → 한국 순간·제목 매력도`.

1. **football-matchday-social-card** — review/critical 0/0이고 결과 이미지가 제목만으로 바로 보인다.
2. **sitemap-to-llms-text** — critical 0, review 3이며 기존 보안 검사와 메커니즘이 명확히 다르다.
3. **tailwind-selector-class-diff** — critical 0, review 10이며 기존 컴포넌트 추출보다 결과가 한 줄 diff로 더 좁다.
4. **web-element-visual-feedback-file** — critical 1이 있지만 디자인 토큰 추출과 결과가 분명히 다르다.
5. **latex-static-error-fix-file** — 실제 처리는 독립적이지만 교사·문서 납품 문맥 때문에 critical 21이 생긴다.
6. **svg-icons-to-webfont-package** — 웹폰트 변환은 독립적이지만 기존 SVG 최적화 카드와 도메인 중복이 가장 크다.

## 생성 산출물

- 선택 입력: `docs/research/idea-strong-mechanism-batch-017-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-017-card-drafts-2026-07-15.jsonl`
- Full-27 선행 보고서: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-017-full-27-audit-2026-07-15.md`
- promotion candidates: `docs/research/idea-strong-mechanism-batch-017-promotion-candidates-2026-07-15.json`
- 원본 충실도 입력·결과: `docs/research/idea-strong-mechanism-batch-017-fidelity-input-2026-07-15.jsonl`, `docs/research/idea-strong-mechanism-batch-017-fidelity-similarity-2026-07-15.json`
- 포트폴리오 입력·결과: `docs/research/idea-strong-mechanism-batch-017-portfolio-input-2026-07-15.jsonl`, `docs/research/idea-strong-mechanism-batch-017-portfolio-similarity-2026-07-15.json`

## 앱 수정 전 체크

- [x] 기존 앱과 batch 001~014의 모든 source key 제외
- [x] 정확히 10개 TrustMRR Candidate 선별
- [x] hard fail 재검사 금지
- [x] 원본별 단일 축 문구 수정 최대 1회
- [x] Full-27 27/27 통과 원본만 선행 문서에 기록
- [x] 원본 충실도 162/162 확인
- [x] 앱 97개와 포트폴리오 임베딩 중복 검사
- [x] review·critical 후보의 입력·처리·결과 수동 판정
- [x] promotion candidate 6개 보존
- [x] 최종 보고서 작성
- [x] 앱 반영 — 보고서 공개 뒤 상위 3개만 승격

## 앱 반영 결과

- 승격: `football-matchday-social-card`, `sitemap-to-llms-text`, `tailwind-selector-class-diff`
- 보존 후보: `web-element-visual-feedback-file`, `latex-static-error-fix-file`, `svg-icons-to-webfont-package`
- 최종 앱: 원본 100개 / 런타임 조합 2,700개 / 리서치 연결 100/100
- 최종 원장: Existing 100 / Candidate 2,528 / Merge 411 / Reserve 142 / Fail 5,225
