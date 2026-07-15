# 강한 메커니즘 배치 004 — 승격 전 최종 감사

날짜: 2026-07-15

## 결론

- 사전 선별 원본: 10개
- Stress-3 3/3 통과: 3개
- Latin-9 진행: 3개
- Latin-9 9/9 통과: 2개
- Full-27 진행: 2개
- Full-27 결과: `Framera 27/27`, `FilexHost 27/27`
- 승격 대상: `Framera`, `FilexHost` 2개
- 앱 반영: Framera·FilexHost 2개 완료

## 원본별 적응형 감사 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 최종 판정 |
|---|---:|---:|---:|---|
| Framera | 3/3 pass | 9/9 pass | 27/27 pass | 승격 대상 |
| Print to Size | 1 pass · 2 fail | 미진행 | 미진행 | 인쇄 크기와 순간이 일부 어긋남 |
| Spectra - Music Visualizer | 3/3 pass | 5 pass · 1 review · 3 fail | 미진행 | 시각화 결과와 사용 순간이 일부 어긋남 |
| Pipefitter | 1 pass · 1 review · 1 fail | 미진행 | 전문 계산 입력과 결제자 문맥이 일부 어긋남 |
| Sun Surveyor | 1 pass · 2 fail | 미진행 | 촬영 계획 입력과 결과가 일부 순간에서 닫히지 않음 |
| Tome of D2 | 1 pass · 2 review | 미진행 | 게임 규칙·입력 범위가 일부 조합에서 넓음 |
| Validemail.co | 2 pass · 1 fail | 미진행 | 검증 결과를 실제 수신 가능성처럼 읽을 위험 |
| FilexHost | 3/3 pass | 9/9 pass | 27/27 pass | 승격 대상 |
| myjson.online | 2 pass · 1 review | 미진행 | 임시 저장·버전 범위가 일부 조합에서 넓음 |
| Mockphine | 1 pass · 1 review · 1 fail | 미진행 | 초보자 입력과 로컬 서버 범위가 일부 조합에서 어려움 |

## 승격 대상 1 — Framera

원본: [Framera](https://trustmrr.com/startup/framera)

원본 흐름은 `영상 파일 입력 → 필요한 시점 선택 → 고해상도 정지 이미지 저장`이다. 썸네일 디자인, AI 장면 추천, 자세 분석을 붙이지 않았다.

### 돈 낼 사람 3개

1. **유튜브 편집자** — 영상에서 썸네일·인용 장면으로 쓸 정확한 프레임을 반복해서 캡처하거나 편집 도구로 내보낸다.
2. **숏폼 콘텐츠 제작자** — 릴스·쇼츠 게시 직전에 선명한 장면을 찾으려고 재생바를 움직이고 해상도를 다시 확인한다.
3. **영상 제작사 납품 담당자** — 클라이언트에게 보낼 대표 정지 이미지를 영상마다 골라 수동 저장한다.

### 필요한 순간 3개

1. **게시 직전 썸네일 한 장이 필요할 때** — 영상만 있고 대표 이미지를 바로 제출해야 한다.
2. **클라이언트 검수용 장면을 보내야 할 때** — 특정 수정 장면을 영상 전체가 아닌 이미지 한 장으로 즉시 전달해야 한다.
3. **영상에서 인용 이미지를 급히 뽑을 때** — 기사·제안서에 넣을 장면의 고해상도 파일이 필요하다.

### 한 끗 변화 3개

1. **영상 한 장면을 원본 해상도 PNG로 저장** — 영상 파일 하나와 지정 시점을 받아 원본 해상도 PNG 하나를 반환한다.
2. **영상 한 장면을 고화질 JPG로 저장** — 같은 입력·처리를 유지하고 고화질 JPG 하나를 반환한다.
3. **영상 프레임을 타임코드 JPG로 저장** — 같은 프레임 추출을 유지하고 파일명에 타임코드가 들어간 JPG 하나를 반환한다.

## 승격 대상 2 — FilexHost

원본: [FilexHost](https://trustmrr.com/startup/filexhost)

원본 흐름은 `일반 파일 하나 업로드 → 공유 URL 생성 → 다운로드·미리보기 또는 조회 횟수 확인`이다. 개인정보·민감 파일, 장기 보관, 폴더, 협업 권한은 범위에서 제외했다.

### 돈 낼 사람 3개

1. **메일 첨부 제한에 걸리는 1인 영상 제작자** — 완성 영상·원본 파일을 줄이거나 여러 조각으로 나눠 전달한다.
2. **큰 디자인 파일을 고객에게 보내는 프리랜서 디자이너** — 시안 파일을 별도 서비스에 올리고 권한을 확인한 뒤 링크를 보낸다.
3. **용량 큰 자료를 잠깐 공유하는 현장 실무자** — 회의·검수 직전에 임시 업로드와 링크 복사를 반복한다.

### 필요한 순간 3개

1. **메일 첨부 제한으로 파일을 보낼 수 없을 때** — 파일을 줄이거나 나누지 않고 바로 열 수 있는 링크가 필요하다.
2. **고객에게 큰 시안 파일을 바로 전달할 때** — 업로드 직후 브라우저에서 확인할 URL이 필요하다.
3. **회의 직전 대용량 자료를 잠깐 공유할 때** — 장기 보관·협업 설정 없이 즉시 전달할 링크가 필요하다.

### 한 끗 변화 3개

1. **대용량 파일 바로 다운로드 링크** — 일반 파일 하나를 올려 클릭하면 바로 다운로드되는 URL 하나를 반환한다.
2. **대용량 파일 브라우저 미리보기 링크** — 같은 업로드 흐름을 유지하고 지원 형식을 브라우저에서 보는 URL 하나를 반환한다.
3. **조회 횟수가 보이는 파일 공유 링크** — 같은 공유 URL에 해당 링크의 조회 횟수만 표시한다.

## 27조합 감사 해석

### Framera

- 결제자 3명은 모두 영상에서 정확한 정지 이미지 한 장을 뽑는 제작 실무자다.
- 순간 3개는 모두 이미 영상이 있고 지금 이미지 파일 하나가 필요한 때다.
- 결과 3개는 프레임 추출 메커니즘을 유지한 채 파일 형식·파일명만 바뀐다.
- 따라서 `3 × 3 × 3 = 27`개가 모두 입력 1개 → 추출 1회 → 이미지 1개로 닫힌다.

### FilexHost

- 결제자 3명은 모두 메일로 보내기 어려운 큰 파일을 잠깐 전달하는 실무자다.
- 순간 3개는 모두 파일이 이미 있고 지금 공유 URL이 필요한 때다.
- 결과 3개는 업로드·URL 생성은 유지한 채 링크 동작만 바뀐다.
- 상대방의 회신·승인 없이도 사용자가 공유 URL을 만드는 즉시 결과가 생긴다.
- 따라서 27개 모두 일반 파일 1개 → 업로드 1회 → 공유 URL 1개로 닫힌다.

## 원본 충실도·중복 보조 감사

local fastembed `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`를 같은 실행 안에서만 비교했다.

- 원본 충실도: 54/54 통과
- 최저 원본 충실도: `0.949860`
- 기존 76개 + 후보 2개 포트폴리오: 78개, 2,106조합
- 교차 시나리오 review 임계치: `0.768778`
- 교차 시나리오 critical 임계치: `0.820068`
- 후보 관련 최고 유사도: `0.832692`
- 후보 관련 critical 조합 쌍: 8개

높은 점수는 아래 두 문맥에 몰렸다.

1. **Framera ↔ FilexHost (`0.832692`)**  
   둘 다 영상 제작자·클라이언트 전달 문구가 있지만, Framera는 `영상 → 프레임 이미지`, FilexHost는 `일반 파일 → 공유 URL`이다. 입력·처리·결과가 달라 `Distinct`다.
2. **Framera ↔ NoViolation (`0.826852`)**  
   둘 다 숏폼 제작·검수 문구가 있지만, NoViolation은 `영상 → 정책 위험 구간`, Framera는 `영상 → 정지 이미지`다. 처리와 결과가 달라 `Distinct`다.

임베딩 점수는 자동 탈락 조건으로 사용하지 않았다. 가까운 문구를 찾은 뒤 입력·처리·결과를 사람이 비교해 두 후보 모두 기존 앱 원본과 다른 메커니즘으로 판정했다.

## 승격 규칙 확인

- [x] 실제 카드의 `moment`와 `smallestBuild`를 기준으로 검사했다.
- [x] Stress-3 → Latin-9 → Full-27 순서를 지켰다.
- [x] Full-27 27/27인 원본만 승격 대상으로 정했다.
- [x] 원본 충실도 54/54와 기존 포트폴리오 중복 후보를 보조 검사했다.
- [x] 앱 수정 전에 이 보고서를 작성했다.
- [x] 사용자에게 이 보고서를 먼저 보여준다.
- [x] `sample-data.ts`에 통과 원본 2개만 추가한다.
- [x] 타입·조합 수·리서치 연결·Idea Lab E2E를 검증한다.

## 승격 후 검증

- 앱 원본: 78개
- 런타임 조합: 2,106개
- Framera 조합: 27개
- FilexHost 조합: 27개
- 리서치 원본 연결: 78/78
- 통합 판정 원장: 8,406/8,406 finalized, pending 0
- 최종 분포: Existing 78 · Candidate 2,550 · Merge 411 · Reserve 142 · Fail 5,225
- 타입 검사: 통과
- Idea Lab E2E: 8/8 통과

## 근거 파일

- 선별: `docs/research/idea-strong-mechanism-batch-004-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-004-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-004-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-004-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-004-full-results-2026-07-15.jsonl`
- 승격 후보 데이터: `docs/research/idea-strong-mechanism-batch-004-promotion-candidates-2026-07-15.json`
- 원본 충실도: `docs/research/idea-strong-mechanism-batch-004-fidelity-similarity-2026-07-15.json`
- 포트폴리오 중복: `docs/research/idea-strong-mechanism-batch-004-portfolio-similarity-2026-07-15.json`
