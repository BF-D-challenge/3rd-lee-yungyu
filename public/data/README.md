# 런타임 데이터

- source-cards.json: 감사 통과한 검증된 원본 카드. 사람이 이해할 수 있는 원본 설명과 대상·문제·입력·처리·결과를 담는다.
- golden.json: 기존 런타임 조합 데이터. v4 전환이 끝날 때까지 회귀 비교용으로 보존한다.

source-cards.json은 scripts/rollout/build-source-cards.mjs로 다시 만든다.
