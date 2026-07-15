# Candidate 2,576개 적응형 카드 감사 최종 보고서

## 결론

- 전체 27조합을 통과한 원본 중 우선순위가 높은 21개를 앱에 승격했습니다.
- 현재 앱은 73개 시나리오와 1,971개 런타임 조합입니다.
- 2,576개를 모두 같은 27조합으로 반복하지 않고, 대표 게이트 → 3개 스트레스 조합 → Latin-9 → 전체 27조합 순서로 줄였습니다.
- 전체 27조합을 통과한 원본은 21개입니다.
- 일부 조합만 review인 원본은 11개이며, 문구를 고친 뒤 재감사해야 합니다.
- fail 조합이 있는 원본은 8개이며, 이번 승격에서 제외합니다.
- 11개 review 원본을 18개 조합으로 재감사한 결과는 pass 12·review 53·fail 133입니다. 원본 단위로 18개를 모두 통과한 후보는 0개이므로 추가 승격하지 않습니다.

## 단계별 숫자

| 단계 | 검사량 | pass | review | fail | 의미 |
|---|---:|---:|---:|---:|---|
| 대표 게이트 | 2576 | 854 | 570 | 1152 | 원본 메커니즘이 작동할 수 있는지 먼저 확인 |
| 스트레스 3조합 | 450 | 351 | 55 | 44 | 결제자·순간·한 끗이 실제로 어울리는지 확인 |
| Latin-9 | 792 | 569 | 112 | 111 | 세 축의 쌍을 빠르게 모두 확인 |
| 전체 27조합 | 1080 | 911 | 98 | 71 | 최종 승격 전 전체 확인 |

## 판정 예시

- 통과 예: 사진 한 장을 넣어 배경을 바꾸고 결과 이미지를 받는 조합. 입력과 결과가 한 번에 보이고 다른 사람의 행동이 필요하지 않습니다.
- review 예: 기능 자체는 되지만 특정 플랫폼 권한이나 전문 용어가 필요한 조합. 문구를 고치거나 입력 조건을 더 분명히 해야 합니다.
- fail 예: 과거 3개월 가격처럼 설치 전에 모아 둔 데이터가 필요한 조합, 또는 브라우저 확장 권한·외부 기관의 행동이 필요한 조합.

## 전체 27조합 통과 원본

- trustmrr:photogenius
- trustmrr:mockly
- trustmrr:tariffsapi
- trustmrr:casora
- trustmrr:youtube-transcript-dev-extract-download-video-transcripts
- app_store:1551532207
- app_store:6739045501
- trustmrr:backdropboost
- app_store:1624892520
- trustmrr:mergeitai
- chrome_web_store:ngbhbpaflbegfjgaibhldjlmmfonpief
- trustmrr:not-for-me-drink-less
- trustmrr:cantsayno
- trustmrr:simplesvgs
- trustmrr:michikanji
- trustmrr:finishdraft
- chrome_web_store:dhmckhpkidimmjfhpplhpfapedefgmne
- chrome_web_store:gpmodmeblccallcadopbcoeoejepgpnb
- trustmrr:billbatch
- chrome_web_store:nahkhbckoojacpfmjonkbmmjhkknjmid
- chrome_web_store:hjngolefdpdnooamgdldlkjgmdcmcjnc

## 다음 순서

1. 위 21개를 한국 사용자용 카드 문구로 다시 읽고, 제목·UVP·입력·결과가 한 줄에 보이는지 확인합니다.
2. 11개 review 원본의 18조합 재감사 결과를 보존하고, `generic_ai`, `scope_broad`, `multi_input`, `vague_title` 같은 실패 이유를 카드 문구에 반영합니다.
3. 문구를 실제로 고친 후보가 생길 때만 27조합을 다시 검사합니다.
4. 다음 승격에서도 typecheck, 조합 수 검사, Idea Lab E2E를 먼저 실행합니다.

검사 산출물: docs/research/idea-candidate-gate-summary-2026-07-14.md, docs/research/idea-candidate-stress-audit-summary-2026-07-14.md, docs/research/idea-candidate-latin-shortlist-summary-2026-07-14.md, docs/research/idea-candidate-full-audit-summary-2026-07-14.md, docs/dev/experiments/idea-lab/idea-candidate-review-rerun-summary-2026-07-14.md
