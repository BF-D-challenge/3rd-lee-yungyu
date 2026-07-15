# 아이디어 ID 계보

업데이트: 2026-07-13

과거 배치 002·003·005가 각각 배치 내부 ID `C09`를 재사용해 서로 다른 아이디어가 같은 전역 ID로 보였다. 데이터 결합 시 배치 번호를 포함하도록 아래처럼 정규화했다.

| 기존 ID | 정규화 ID | 원본 | 아이디어 | 역사/최종 상태 |
|---|---|---|---|---|
| `C09` | `C02-09` | `batch-002-*` | 통신비구멍 | 배치 002 UX 3/3·Pass 역사 보존 |
| `C09` | `C03-09` | `batch-003-*` | 예약금마감 → 노쇼입금판 | 배치 003 UX 2/3. 62개 최종 장부의 Fail 판정 유지 |
| `C09` | `C05-09` | `luna-batch-005-c-family-home-mobility.md` | 방문차량확인 | UX 0/3·Fail 역사 보존 |

`C09-01`~`C09-25`는 배치 009의 완전한 ID라 변경하지 않는다. 정규화는 제목이나 판정을 바꾸지 않고 출처 충돌만 제거한다.

정본:

- 최종 62개 판정: `docs/research/idea-final-decisions-62.jsonl`
- 62개 원본 큐: `archive/queues/idea-user-validation-queue-62.jsonl`
- 현재 대기열: `idea-user-validation-queue-current.jsonl`
