# Idea Lab 강한 메커니즘 배치 005 근접 통과 재감사

## 결론

- 앱 수정 전 판정: **2개 승격 가능**, 1개 탈락
- 승격 가능: `mermaidonline.live`, `Sketch Clean`
- 탈락: `Massive Dev Chart Timer`
- 현재 앱 상태: 79개 원본 · 2,133조합 (이 문서를 사용자에게 먼저 공개한 뒤에만 수정)
- 승격 후 예상 상태: 81개 원본 · 2,187조합

## 무엇을 다시 고쳤나

새 원본처럼 이름만 바꿔 재검사하지 않았다. 배치 005에서 거의 통과했지만 축 하나가 어색했던 세 원본만, 그 실패 이유에 해당하는 결제자·필요한 순간 문구를 한 번 고쳤다.

| 원본 | 기존 문제 | 이번 수정 |
|---|---|---|
| mermaidonline.live | 일부 결제자가 실제로 Mermaid 코드를 쓰는지 불명확 | Mermaid를 PR·기술 문서·발표에 이미 쓰는 개발 조직 역할로 한정 |
| Sketch Clean | 일부 순간과 사용자 조합이 어색함 | 채색·인쇄·디지털 레이어 이전이라는 실제 후속 작업으로 통일 |
| Massive Dev Chart Timer | 일부 순간에서 특정 시간표가 필요하지 않음 | 약품 투입·온도 확인·작업표 작성 직전으로 좁힘 |

## 단계별 결과

### 1. Stress-3

가장 어색해질 가능성이 높은 조합 세 개를 먼저 검사했다.

| 원본 | pass | review | fail | 결과 |
|---|---:|---:|---:|---|
| mermaidonline.live | 3 | 0 | 0 | Latin-9 진행 |
| Sketch Clean | 3 | 0 | 0 | Latin-9 진행 |
| Massive Dev Chart Timer | 2 | 0 | 1 | 탈락 |

필름 현상 타이머는 수정 뒤에도 모든 결제자×순간×한 끗 조합이 자연스럽지 않아 더 진행하지 않았다.

### 2. Latin-9

각 축을 빠짐없이 한 번씩 섞은 대표 9조합을 검사했다.

| 원본 | pass | review | fail | 결과 |
|---|---:|---:|---:|---|
| mermaidonline.live | 9 | 0 | 0 | Full-27 진행 |
| Sketch Clean | 9 | 0 | 0 | Full-27 진행 |

### 3. Full-27

결제자 3 × 필요한 순간 3 × 한 끗 3의 모든 조합을 검사했다.

| 원본 | pass | review | fail | 결과 |
|---|---:|---:|---:|---|
| mermaidonline.live | 27 | 0 | 0 | 통과 |
| Sketch Clean | 27 | 0 | 0 | 통과 |

## 원본 충실도와 중복 검사

- 원본 충실도: 54/54 통과
- 최저 원본 충실도: `0.989500`
- 기존 79개 + 후보 2개 포트폴리오: 81개, 2,187조합
- 교차 시나리오 review 임계치: `0.766888`
- 교차 시나리오 critical 임계치: `0.818701`
- 후보 관련 최고 유사도: `0.749561`
- 후보 관련 review·critical 조합: 각각 0개

가장 가까운 쌍은 Sketch Clean과 GalleryWall이지만 작동은 다르다.

- Sketch Clean: 손그림 사진 → 종이 배경·얼룩 제거 → 투명 선화 PNG
- GalleryWall: 벽 사진+액자 크기 → 벽 위 배치 계산 → 액자 배치 이미지·측정표

Mermaid 후보의 가장 가까운 기존 원본은 Framera다. 두 결과가 모두 이미지 파일일 수 있지만 입력과 처리가 다르다.

- mermaidonline.live: Mermaid 코드 → 다이어그램 렌더링 → PNG·SVG
- Framera: 동영상 → 특정 프레임 추출 → PNG·JPG

따라서 두 후보 모두 기존 앱 원본과 구별되는 메커니즘으로 판정한다.

## 승격 규칙 확인

- [x] 기존 감사의 근접 통과 원본만 한 번 재시도했다.
- [x] Stress-3 → Latin-9 → Full-27 순서를 지켰다.
- [x] Full-27 27/27인 원본만 승격 대상으로 정했다.
- [x] 원본 충실도와 기존 포트폴리오 중복을 확인했다.
- [x] 앱 수정 전에 이 보고서를 작성했다.
- [x] 사용자에게 이 보고서를 먼저 보여준다.
- [x] `sample-data.ts`에 통과 원본 2개만 추가한다.
- [x] 타입·조합 수·리서치 연결·Idea Lab E2E를 검증한다.

## 승격 후 검증

- 앱 원본: 81개
- 런타임 조합: 2,187개
- 두 신규 원본 조합: 각각 27개
- 리서치 원본 연결: 81/81
- 통합 판정 원장: 8,406/8,406 finalized, pending 0
- 최종 분포: Existing 81 · Candidate 2,547 · Merge 411 · Reserve 142 · Fail 5,225
- 타입 검사: 통과
- Idea Lab E2E: 8/8 통과

## 근거 파일

- 수정 카드: `docs/research/idea-strong-mechanism-batch-005-retry-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-005-retry-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-005-retry-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-005-retry-full-results-2026-07-15.jsonl`
- 승격 후보 데이터: `docs/research/idea-strong-mechanism-batch-005-retry-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-005-retry-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-005-retry-portfolio-similarity-2026-07-15.json`
