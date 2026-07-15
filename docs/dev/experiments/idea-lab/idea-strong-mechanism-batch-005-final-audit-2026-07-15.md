# 강한 메커니즘 배치 005 — 승격 전 최종 감사

날짜: 2026-07-15

## 결론

- 과거 감사 결과를 재활용해 선별한 원본: 10개
- Stress-3: 24 pass · 1 review · 5 fail
- Stress-3 3/3 통과: 7개
- Latin-9: 41 pass · 11 review · 11 fail
- Latin-9 9/9 통과: 1개
- Full-27: `SketchCut PRO 27/27 pass`
- 승격 대상: `SketchCut PRO` 1개
- 앱 반영: SketchCut PRO 1개 완료

## 과거 결과를 어떻게 재사용했나

- 사전 수집 파일 의존으로 이미 탈락한 takeout-tools·App Privacy Insights는 다시 검사하지 않았다.
- 범용 계산기·AI로 대체된 SlushIQ·PicToLines·myterrace.net은 다시 검사하지 않았다.
- 과거에 메커니즘은 통과했지만 제목·payer·moment 범위가 어긋났던 근접 통과 후보만 카드 축을 실제로 좁혀 다시 검사했다.
- 이미 앱에 있는 78개 원본과 배치 001~004에 사용한 원본은 제외했다.

## 원본별 적응형 감사 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 최종 판정 |
|---|---:|---:|---:|---|
| Photo String Art | 3/3 pass | 5 pass · 4 review | 미진행 | 제작자와 수업·견적 순간이 일부 어긋남 |
| Smokify | 0 pass · 3 fail | 미진행 | 미진행 | 시작일·개비·가격이 복수 입력으로 판정됨 |
| EXIF Data | 1 pass · 2 fail | 미진행 | 미진행 | OS 기본 메타데이터 제거로 대체 가능 |
| mermaidonline.live | 3/3 pass | 7 pass · 2 review | 미진행 | 개발자·강사와 발표·PR 순간이 일부 어긋남 |
| SketchCut PRO | 3/3 pass | 9/9 pass | 27/27 pass | 승격 대상 |
| Sketch Clean | 3/3 pass | 8 pass · 1 review | 미진행 | 굿즈 제작자와 콘티 디지털화 순간이 어긋남 |
| iPray | 2 pass · 1 review | 미진행 | 미진행 | 기도 시각 순간과 방향 카드가 일부 어긋남 |
| 기타 튜너 - LikeTones | 3/3 pass | 4 pass · 3 review · 2 fail | 미진행 | 한 음만으로 실제 줄 이름 확정 불가 |
| JSON Tools | 3/3 pass | 0 pass · 9 fail | 미진행 | 범용 AI 한 번으로 오류 위치 확인 가능 |
| Massive Dev Chart Timer | 3/3 pass | 8 pass · 1 review | 미진행 | 푸시 현상 순간과 교반 결과가 일부 어긋남 |

## 승격 대상 — SketchCut PRO

원본: [SketchCut PRO](https://apps.apple.com/in/app/sketchcut-pro/id1119117405)

원본 흐름은 `판재·부품 치수 입력 → 절단 조건과 배치 최적화 계산 → 인쇄 가능한 절단 배치 PDF`다. 판재 구매, 재단소 연동, 기계 제어는 추가하지 않았다.

### 돈 낼 사람 3개

1. **맞춤 가구를 제작하는 소규모 목공 작업자** — 치수와 톱날 폭을 종이에 대조해 배치를 손으로 짜며 자투리·재단 실수가 반복된다.
2. **주방 가구 설치 전 판재를 발주하는 가구 제작자** — 필요한 판재 장수와 절단 위치를 직접 그려 주문 전 배치를 검토한다.
3. **MDF·합판을 재단해 납품하는 인테리어 실무자** — 현장별 부품 치수·수량을 수작업으로 배열하고 재단 순서를 정리한다.

### 필요한 순간 3개

1. **재단소에 판재 주문을 넣기 직전** — 필요한 판재 수량과 자투리를 지금 확인해야 추가 비용을 막을 수 있다.
2. **톱질을 시작하기 전 작업대에서** — 부품 위치를 바로 정해야 판재에 표시하고 재단을 시작할 수 있다.
3. **고객 치수 변경분을 새로 배치하는 순간** — 변경된 목록의 자재 사용량과 납기를 즉시 다시 확정해야 한다.

### 한 끗 변화 3개

1. **판재 치수로 자투리 최소 절단 배치 PDF** — 치수 텍스트 블록 하나를 받아 자투리 최소 배치를 한 번 계산하고 PDF 하나를 반환한다.
2. **판재 치수로 재단 순서 표시 PDF** — 같은 입력·계산을 유지하고 재단 순서가 표시된 PDF 하나를 반환한다.
3. **판재 치수로 부품 번호 표시 절단 PDF** — 같은 입력·계산을 유지하고 부품 번호가 표시된 PDF 하나를 반환한다.

## 27조합 감사 해석

- 결제자 3명은 모두 판재를 실제로 발주하거나 직접 재단하는 제작 실무자다.
- 순간 3개는 모두 부품 치수 목록이 이미 있고 재단 배치를 확정해야 하는 때다.
- 결과 3개는 절단 배치 계산을 유지한 채 PDF에서 강조하는 정보만 바뀐다.
- 어느 조합도 다른 사람의 승인, 기관 연동, 사전 기록을 요구하지 않는다.
- 따라서 27개 모두 `치수 텍스트 블록 1개 → 배치 계산 1회 → 절단 PDF 1개`로 닫힌다.

## 원본 충실도·중복 보조 감사

local fastembed `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`를 같은 실행 안에서만 비교했다.

- 원본 충실도: 27/27 통과
- 최저 원본 충실도: `0.977446`
- 기존 78개 + 후보 1개 포트폴리오: 79개, 2,133조합
- 교차 시나리오 review 임계치: `0.768092`
- 교차 시나리오 critical 임계치: `0.819581`
- 후보 관련 최고 유사도: `0.748840`
- 후보 관련 review·critical 조합: 각각 0개
- 가장 가까운 기존 원본: Casora (`방 사진 → 인테리어 재디자인 이미지`)

Casora는 사진을 생성 이미지로 바꾸고, SketchCut은 판재·부품 치수를 절단 배치 PDF로 계산한다. 입력·처리·결과가 모두 달라 `Distinct`다.

## 승격 규칙 확인

- [x] 기존 전수·적응형 감사 결과로 재검사 대상을 줄였다.
- [x] 실제 카드의 `moment`와 `smallestBuild`를 기준으로 검사했다.
- [x] Stress-3 → Latin-9 → Full-27 순서를 지켰다.
- [x] Full-27 27/27인 원본만 승격 대상으로 정했다.
- [x] 원본 충실도와 기존 포트폴리오 중복을 보조 검사했다.
- [x] 앱 수정 전에 이 보고서를 작성했다.
- [x] 사용자에게 이 보고서를 먼저 보여준다.
- [x] `sample-data.ts`에 통과 원본 1개만 추가한다.
- [x] 타입·조합 수·리서치 연결·Idea Lab E2E를 검증한다.

## 승격 후 검증

- 앱 원본: 79개
- 런타임 조합: 2,133개
- SketchCut PRO 조합: 27개
- 리서치 원본 연결: 79/79
- 통합 판정 원장: 8,406/8,406 finalized, pending 0
- 최종 분포: Existing 79 · Candidate 2,549 · Merge 411 · Reserve 142 · Fail 5,225
- 타입 검사: 통과
- Idea Lab E2E: 8/8 통과

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-005-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-005-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-005-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-005-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-005-full-results-2026-07-15.jsonl`
- 승격 후보 데이터: `docs/research/idea-strong-mechanism-batch-005-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-005-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-005-portfolio-similarity-2026-07-15.json`
