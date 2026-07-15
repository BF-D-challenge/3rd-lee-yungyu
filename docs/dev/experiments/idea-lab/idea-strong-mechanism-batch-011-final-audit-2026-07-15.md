# 강한 메커니즘 배치 011 — TrustMRR 최종 감사

- 날짜: 2026-07-15
- 범위: 기존 카드 초안과 앱 포트폴리오에 없던 `trustmrr:` Candidate 10개
- 게이트: Stress-3 `3/3` → Latin-9 `9/9` → Full-27 `27/27`
- 결과: Full-27 통과 원본 2개, 승격 후보 2개
- 앱 반영: 하지 않음

## 한눈에 보는 결과

| 단계                      | 원본 수 | 조합 행 | pass | review | fail |
| ------------------------- | ------: | ------: | ---: | -----: | ---: |
| 최초 Stress-3             |      10 |      30 |   13 |      6 |   11 |
| DocuAudit 문구 1회 재검사 |       1 |       3 |    3 |      0 |    0 |
| Latin-9                   |       4 |      36 |   33 |      2 |    1 |
| Full-27                   |       2 |      54 |   54 |      0 |    0 |

## 원본별 게이트 결과

| 원본                        |                            Stress-3 |           Latin-9 | Full-27 | 최종 판정                                 |
| --------------------------- | ----------------------------------: | ----------------: | ------: | ----------------------------------------- |
| PDF-Translator              |                                 3/3 |               9/9 |   27/27 | 승격 후보                                 |
| DocuAudit                   | 1 pass · 2 review → 문구 재검사 3/3 |               9/9 |   27/27 | 승격 후보                                 |
| Chromapick Chrome extension |                                 3/3 |   8 pass · 1 fail |  미실행 | 원본에 없던 색 대비 계산으로 탈락         |
| ApiRealTest                 |                                 3/3 | 7 pass · 2 review |  미실행 | QA 결제자와 일부 순간 연결 불명확         |
| Scopepilot                  |                     2 pass · 1 fail |            미실행 |  미실행 | 추가 일정 twist와 추가비 합의 순간 불일치 |
| ReceiptWorks                |          1 pass · 1 review · 1 fail |            미실행 |  미실행 | 세금·환불 입력 근거 부족                  |
| SuperGitSight               |                            3 review |            미실행 |  미실행 | 채용 평가 점수의 안전 위험                |
| Glamour                     |                              3 fail |            미실행 |  미실행 | 범용 AI 이미지 분석 대체                  |
| DescribeIt                  |                              3 fail |            미실행 |  미실행 | 범용 AI 영상 설명 대체                    |
| AppForgeNow                 |                              3 fail |            미실행 |  미실행 | 범용 AI 설정 생성 대체                    |

## 허용한 단 한 번의 재검사

DocuAudit의 최초 review 두 건은 메커니즘 문제가 아니라 `중복`과 `필수 항목` 기준이 문구에 없던 한 twist 축 문제였다.

- 중복 기준: 운송장 번호·청구일·금액이 모두 같은 행
- 필수 기준: 운송장 번호·청구일·통화 세 필드
- 외부 운임표·계약 정보·사기 판정은 사용하지 않음
- 재검사: 3/3 pass

그 외 fail 원본은 이름을 바꾸거나 새 기능을 붙여 재검사하지 않았다.

## Full-27 통과 카드

### PDF-Translator

- 입력: 영어 PDF 문서 파일 하나
- 처리: 레이아웃을 유지한 한국어 번역 한 번
- 결과: 표 배치·이미지 캡션·각주 링크 중 하나가 보존된 번역 PDF 한 파일
- Full-27: 27 pass · 0 review · 0 fail

### DocuAudit

- 입력: 운송사 화물 청구서 PDF 파일 하나
- 처리: 문서 내부 합계·동일 비용 행·필수 세 필드 검사 한 번
- 결과: 확인 위치가 표시된 감사 CSV 한 파일
- Full-27: 27 pass · 0 review · 0 fail

## 원본 충실도 임베딩

- 모델: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- 전체: 54/54 pass
- 전체 최솟값: 0.969522
- PDF-Translator 범위: 0.969522~0.974026
- DocuAudit: 0.976002
- 원본 흐름에서 벗어난 조합: 0개

## 현재 앱 82개와 포트폴리오 중복 감사

- 입력: 기존 82개 2,214조합 + 후보 2개 54조합 = 2,268조합
- 교차 review 기준: 0.765330
- 교차 critical 기준: 0.817697
- 후보 관련 review: 19건
- 후보 관련 critical: 0건

| 후보                           | 최대 유사도 | review | 가장 가까운 기존 시나리오 | 수동 구분 근거                                                                                                                                    |
| ------------------------------ | ----------: | -----: | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| freight-invoice-internal-audit |    0.802775 |     16 | current-page-to-clean-csv | 기존 카드는 공개 웹페이지의 행을 CSV로 추출한다. 후보는 화물 청구서 PDF 내부의 합계·동일 비용·필수 필드를 감사한다. 입력·처리·업무 결과가 다르다. |
| pdf-layout-translation         |    0.794779 |      3 | one-page-seo-fix-list     | 기존 카드는 공개 웹페이지의 SEO 항목을 검사한다. 후보는 영어 PDF를 한국어로 번역하며 표·그림·각주 위치를 보존한다. 입력·처리·결과가 다르다.       |

두 후보 모두 review 기준을 넘는 가까운 문구는 있지만 critical은 없고, 가장 가까운 기존 카드와 실제 메커니즘은 구분된다. 따라서 자동 앱 반영이 아닌 **문서화된 승격 후보**로 남긴다.

## 생성 산출물

- 선택 입력: `docs/research/idea-strong-mechanism-batch-011-input-2026-07-15.jsonl`
- 카드 초안: `docs/research/idea-strong-mechanism-batch-011-card-drafts-2026-07-15.jsonl`
- Stress 결과: `docs/research/idea-strong-mechanism-batch-011-stress-results-2026-07-15.jsonl`
- 재검사 결과: `docs/research/idea-strong-mechanism-batch-011-retry-stress-results-2026-07-15.jsonl`
- Latin 결과: `docs/research/idea-strong-mechanism-batch-011-latin-results-2026-07-15.jsonl`
- Full 결과: `docs/research/idea-strong-mechanism-batch-011-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-011-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-011-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복도: `docs/research/idea-strong-mechanism-batch-011-portfolio-similarity-2026-07-15.json`

## 앱 수정 전 체크

- [x] 최종 Full-27 결과 문서화
- [x] 사용자에게 보여줄 최종 보고서 생성
- [x] 승격 후보 JSON 생성
- [x] 원본 충실도·포트폴리오 임베딩 생성
- [x] 이 보고서를 사용자에게 먼저 공개한 뒤 `sample-data.ts`에 통과 원본 2개 반영

## 앱 반영 결과

- 반영 원본: `pdf-layout-translation`, `freight-invoice-internal-audit`
- 이 배치 추가 조합: 54개
- 배치 009~011 통합 반영 후 앱: 89개 원본 / 2,403조합 / 리서치 연결 89/89
