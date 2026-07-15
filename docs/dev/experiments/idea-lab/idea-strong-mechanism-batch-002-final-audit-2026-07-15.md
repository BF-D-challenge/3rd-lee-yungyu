# 강한 메커니즘 배치 002 — 앱 승격 전 감사

## 결론

- 과거 gate에서 `review`였지만 hard gate는 통과한 원본 중 5개를 다시 골랐다.
- 원본마다 입력과 세 결과 변화를 먼저 고정하고 앱형 payer 3·moment 3·twist 3을 작성했다.
- 실제 카드 대신 원본 요약의 `need_moment`를 읽거나, 원본의 모든 입력 형식을 MVP에 요구하던 감사 오류를 수정했다.
- 수정된 동일 기준으로 Stress-3과 Latin-9를 전부 다시 검사했다.
- CarMaster만 Stress-3 3/3·Latin-9 9/9·Full-27 27/27을 통과했다.
- 전체 27조합 결과는 **pass 27·review 0·fail 0**, 위험 플래그 0개다.
- 이 문서를 사용자에게 먼저 공개한 뒤에만 앱에 승격한다.

## 통과 원본

- 원본 키: `trustmrr:carmaster`
- 원본명: `CarMaster`
- 원본 URL: `https://trustmrr.com/startup/carmaster`
- 시장 근거: TrustMRR 최근 30일 매출 542달러, 판매 희망가 14,000달러
- 원본 메커니즘: 랩 음악 파일 하나를 차량 청취 기준으로 마스터링해 저장 가능한 오디오 파일 하나를 만든다.
- 한국형 제목: `차량 스피커용 랩 음원 마스터링`

## 앱 카드

### 돈 낼 사람 3개

1. 랩 음원을 차에 납품하는 독립 프로듀서
2. 힙합 아티스트의 발매 음원을 검수하는 엔지니어
3. 랩 음원을 여러 아티스트에게 납품하는 소규모 스튜디오

### 필요한 순간 3개

1. 발매 직전 차 안에서 랩 믹스를 처음 확인할 때
2. 클라이언트 납품 전 차량 스피커로 최종 재생할 때
3. 차량용 홍보 영상에 넣을 랩 음원을 확정할 때

### 한 끗 변화 3개

1. 차량에서 뭉치는 저역을 먼저 정리한다.
   - 결과 제목: `차량 재생 저역 뭉침 정리 음원`
2. 차 안에서 묻히는 랩 보컬을 선명하게 보정한다.
   - 결과 제목: `차량에서 묻히는 랩 보컬 보정`
3. 차 안에서 들쭉날쭉한 체감 음량을 맞춘다.
   - 결과 제목: `차량 청취 음량 들쭉날쭉함 보정`

세 변화 모두 `랩 음악 파일 1개 → 차량 청취 기준 보정 1회 → 보정 오디오 파일 1개`로 끝난다.

## 배치 002 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 결론 |
|---|---:|---:|---:|---|
| CarMaster | 3/3 | 9/9 | 27/27 | 앱 승격 가능 |
| SQLFlow | 3/3 | 0/9 | 미진행 | 범용 AI 파일 분석으로 대체 가능 |
| Chordprep | 1 pass·2 review | 미진행 | 미진행 | 입력·결과가 한 개로 닫히지 않음 |
| Mockphine | 3/3 | 0 pass·9 review | 미진행 | 초보자 UX와 순간 연결 불명확 |
| Hyperfocal | 3/3 | 0 pass·6 review·3 fail | 미진행 | 사진·영상 출력 형식과 순간 불일치 |

## 감사 규칙 수정

1. 실제 필요한 순간은 row의 `moment`와 `moment_detail`만 평가한다.
2. 실제 MVP 입력·처리·결과는 `smallest_build`를 기준으로 평가한다.
3. `source_five_sentences`는 해외 원본 근거이며 실제 카드 문구 대신 사용하지 않는다.
4. 원본의 여러 입력 형식 중 하나로 MVP를 좁히는 것은 허용한다.
5. 범용 AI가 더 편한 경우는 수정 후에도 그대로 실패 처리한다.

## 근거 파일

- 후보: `docs/research/idea-strong-mechanism-batch-002-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-002-card-drafts-2026-07-15.jsonl`
- Stress: `docs/research/idea-strong-mechanism-batch-002-stress-results-2026-07-15.jsonl`
- Latin: `docs/research/idea-strong-mechanism-batch-002-latin-results-2026-07-15.jsonl`
- CarMaster Full-27: `docs/research/idea-strong-mechanism-batch-002-full-results-2026-07-15.jsonl`

## 앱 승격 전 확인

- [x] 제목만 읽어도 문제와 결과가 보인다.
- [x] 실제 반복 결제자가 있다.
- [x] 문제 발생 뒤 음악 파일 하나만 넣어 작동한다.
- [x] 상대방·기관의 새 행동이 필요 없다.
- [x] 차량 청취에 특화돼 범용 AI 한 번보다 결과가 구체적이다.
- [x] 1인 빌더가 핵심 처리 1회·파일 1개 결과로 MVP를 만들 수 있다.
- [x] 27개 조합이 모두 통과했다.
- [x] 사용자에게 이 문서를 공개한다.
- [x] 공개 후 `sample-data.ts`에 승격한다.

## 앱 반영 후 검증

- 앱 원본: 75개
- 런타임 조합: 2,025개
- 리서치 원본 연결: 75/75
- `npm run typecheck`: 통과
- `npx playwright test tests/e2e/idea-lab.spec.ts`: 8/8 통과
- `node scripts/research/verify-idea-final-decisions.mjs`: 통과
- `node scripts/research/verify-idea-source-final-ledger.mjs`: 통과
- `node scripts/research/verify-idea-lab-research-links.mjs`: 통과
- `git diff --check`: 통과
