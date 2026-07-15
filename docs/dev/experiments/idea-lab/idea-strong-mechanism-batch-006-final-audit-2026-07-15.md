# Idea Lab 강한 메커니즘 배치 006 최종 감사

## 결론

- 신규 미검토 Candidate 선별: 10개
- Stress-3 3/3 통과: 2개
- Latin-9 9/9 통과: 1개
- Full-27 27/27 통과: `Docswrite` 1개
- 앱 수정 전 판정: **Docswrite 1개만 승격 가능**
- 현재 앱: 81개 원본 · 2,187조합
- 승격 후 예상: 82개 원본 · 2,214조합

## 원본별 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 결론 |
|---|---:|---:|---:|---|
| Check Position | 1 pass · 2 fail | 미진행 | 미진행 | 비교 결과가 한 결과로 닫히지 않음 |
| Docswrite | 3/3 | 9/9 | 27/27 | 승격 가능 |
| autozoom | 2 pass · 1 fail | 미진행 | 미진행 | 일부 순간과 모션 블러 결과 불일치 |
| Bluetooth Inspector | 1 pass · 2 fail | 미진행 | 미진행 | 변화 로그에 반복 측정 필요 |
| Meyoo | 3/3 | 8 pass · 1 review | 미진행 | 가격 변경 순간과 주문별 표 1조합 불일치 |
| Pixelay for Figma | 0 pass · 3 fail | 미진행 | 미진행 | Figma·웹페이지 두 입력 필요 |
| Cable Identifier | 1 pass · 2 fail | 미진행 | 미진행 | 범용 이미지 AI 대체 가능 |
| Previewly | 0 pass · 3 fail | 미진행 | 미진행 | 외부 데이터 의존·범용 이미지 생성 대체 |
| Local Styler | 1 pass · 2 fail | 미진행 | 미진행 | 순간과 스타일 종류가 교차하지 않음 |
| yt-clipper | 0 pass · 3 fail | 미진행 | 미진행 | URL·시작·끝 시각 복수 입력 |

Meyoo는 실패가 아니라 축 하나의 `moment_twist_mismatch` review이므로 가격 변경 순간을 적자 원인 확인 순간으로 한 번 고쳐 재검수했다. 재검수 Stress-3도 2 pass·1 review여서 더 수정하지 않고 이번 배치에서 종료했다. 나머지 실패 원본도 이름만 바꿔 다시 검사하지 않는다.

## Docswrite 카드가 통과한 이유

- 돈 낼 사람 3명은 모두 Google Doc 원고를 CMS에 반복해서 옮기는 실무자다.
- 필요한 순간 3개는 모두 원고를 완성한 뒤 CMS에 붙여 넣거나 납품하기 직전이다.
- 한 끗 3개는 제목 계층, 이미지 캡션, 표 구조 중 하나를 보존한 Gutenberg HTML 파일이다.
- 모든 조합이 `공개 Google Doc URL 하나 → 서식 보존 변환 한 번 → HTML 파일 하나`로 닫힌다.
- 원본에는 최근 30일 매출 1,200달러가 있고 Google Doc을 CMS로 서식 손실 없이 옮기는 유료 메커니즘이 명시돼 있다.

## 원본 충실도·중복 보조 감사

- 원본 충실도: 27/27 통과
- 최저 원본 충실도: `0.955593`
- 기존 81개 + 후보 1개 포트폴리오: 82개, 2,214조합
- 교차 시나리오 review 임계치: `0.766359`
- 교차 시나리오 critical 임계치: `0.818389`
- 후보 관련 최고 유사도: `0.791470`
- 후보 관련 review 조합: 6개
- 후보 관련 critical 조합: 0개

가장 가까운 기존 원본은 `one-page-seo-fix-list`다. 두 카드에 웹 콘텐츠와 수정 직전이라는 문구가 겹치지만 메커니즘은 다르다.

- Docswrite: Google Doc URL → 서식 보존 변환 → Gutenberg HTML 파일
- one-page-seo-fix-list: 웹페이지 URL → SEO 항목 검사 → 수정 우선순위 목록

입력·처리·결과가 모두 달라 `Distinct`로 판정한다. 임베딩은 자동 탈락이 아니라 가까운 문구를 찾는 보조 검사로만 사용했다.

## 승격 규칙 확인

- [x] 기존에 감사하지 않은 Candidate만 골랐다.
- [x] Stress-3 → Latin-9 → Full-27 순서를 지켰다.
- [x] Full-27 27/27인 원본만 승격 대상으로 정했다.
- [x] 원본 충실도와 기존 포트폴리오 중복을 확인했다.
- [x] 앱 수정 전에 이 보고서를 작성했다.
- [x] 사용자에게 이 보고서를 먼저 보여준다.
- [x] `sample-data.ts`에 Docswrite 1개만 추가한다.
- [x] 타입·조합 수·리서치 연결·Idea Lab E2E를 검증한다.

## 승격 후 검증

- 앱 원본: 82개
- 런타임 조합: 2,214개
- Docswrite 조합: 27개
- 리서치 원본 연결: 82/82
- 통합 판정 원장: 8,406/8,406 finalized, pending 0
- 최종 분포: Existing 82 · Candidate 2,546 · Merge 411 · Reserve 142 · Fail 5,225
- 타입 검사: 통과
- Idea Lab E2E: 전용 3100 서버 재기동 후 8/8 통과

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-006-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-006-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-006-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-006-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-006-full-results-2026-07-15.jsonl`
- 승격 후보: `docs/research/idea-strong-mechanism-batch-006-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-006-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-006-portfolio-similarity-2026-07-15.json`
- Meyoo 재검수: `docs/research/idea-strong-mechanism-batch-006-retry-stress-results-2026-07-15.jsonl`
