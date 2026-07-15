# 오늘 해볼까 — 전체 TASK 완료 감사

- 검증일: 2026-07-15
- 범위: 리서치 원본 8,406개 전수 판정과 앱 원본 100개·2,700조합
- 최종 판정: **완료 기준 6/6 통과**

## 완료 기준별 직접 증거

| 완료 기준                             | 권위 있는 증거                                                                        | 검증 결과                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 8,406개 각각 최종 판정·이유           | `docs/research/idea-source-final-ledger.jsonl`, `verify-idea-source-final-ledger.mjs` | 8,406행 모두 `finalized`, 다섯 문장·판정 이유·검토일 존재                                 |
| Fail 10% 재검사·배치별 오판율 5% 미만 | `docs/research/idea-source-batch-audits/EXH-001.json`~`EXH-085.json`                  | 85/85 `passed`, 최종 Fail 표본 총 567개, 모든 배치가 최소 10% 이상, 최종 오판율 최댓값 0% |
| 통합 원장 무결성                      | `verify-idea-source-final-ledger.mjs`                                                 | 전체 8,406행·고유 키 8,406개, 중복 0, pending 0, 빈 판정·이유 0                           |
| 앱 원본 100개 정확한 리서치 연결      | `verify-idea-lab-research-links.mjs`                                                  | 시나리오 100개, 고유 리서치 키 100개, coverage 100개, 원장 `Existing` 100개               |
| 원본마다 3×3×3, 총 2,700조합          | `verify-idea-lab-runtime-catalog.mjs`, `idea-runtime-combinations-2026-07-15.jsonl`   | 결제자 300·순간 300·한 끗 300, 생성 조합 2,700, 고유 런타임 ID 2,700                      |
| 타입·조합·E2E·판정 검증               | 아래 최종 명령                                                                        | 전부 exit 0                                                                               |

## 최종 판정 분포

- Existing: **100**
- Candidate: **2,528**
- Merge: **411**
- Reserve: **142**
- Fail: **5,225**
- 합계: **8,406**

## Fail 그림자 감사 검증 방식

각 EXH 배치의 마지막 감사 라운드에서 다음 조건을 자동 검사한다.

1. 감사 상태가 `passed`다.
2. 마지막 Fail 수의 `ceil(10%)` 이상을 표본으로 다시 읽었다.
3. 마지막 오판율이 `0.05` 미만이다.
4. EXH-001~085 감사 파일과 통합 원장의 배치가 모두 존재한다.

EXH-001은 첫 표본에서 2건이 구조돼 Fail 전체를 다시 감사했고, 두 번째 표본 7개에서 오판 0건으로 통과했다. 나머지 배치도 최종 라운드 기준을 통과했다.

## 앱 카탈로그 검증 방식

각 앱 원본에 대해 다음을 자동 검사한다.

1. 시나리오 ID와 리서치 키가 중복되지 않는다.
2. 결제자·필요한 순간·한 끗 변화가 각각 정확히 3개다.
3. 각 카드의 ID·문구·설명이 비어 있지 않다.
4. 한 끗 결과 제목·MVP·플랫폼·변경 종류가 비어 있지 않다.
5. 각 원본에서 정확히 27개 조합이 생성된다.
6. 생성된 2,700개 ID와 런타임 조합 파일 2,700행이 정확히 일치한다.

## 최종 실행 명령

```bash
npm run typecheck
npm run test:unit
PLAYWRIGHT_REUSE_EXISTING_SERVER=1 npx playwright test tests/e2e/idea-lab.spec.ts
node scripts/research/verify-idea-final-decisions.mjs
node scripts/research/verify-idea-source-experiment-manifest.mjs
node scripts/research/verify-idea-source-final-ledger.mjs
node scripts/research/verify-idea-lab-research-links.mjs
node scripts/research/verify-idea-lab-runtime-catalog.mjs
git diff --check
```

## 실행 결과

- TypeScript: 통과
- 단위 테스트: 5파일·62테스트 통과
- Idea Lab E2E: 8/8 통과
- 최근 62개 판정 사례집: 누락·중복·재진입 0
- 원본 선별 실험 manifest: 통과
- 통합 원장 및 Fail 그림자 감사: 통과
- 앱 리서치 연결: 100/100 통과
- 앱 구조 및 조합 파일: 100개·2,700조합 통과
- `git diff --check`: 통과

Batch 016은 Chrome 후보 카드 생성 도중 출력 없는 runner를 중단해 승격 후보를 만들지 않았으며, 완료 파일은 보존했다. 최종 100개는 Full-27·원본 충실도·포트폴리오 중복 감사를 모두 마친 다른 원본으로 채웠으므로 이 미완료 실험은 완료 기준에 포함되지 않는다.
