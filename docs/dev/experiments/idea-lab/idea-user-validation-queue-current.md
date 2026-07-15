# 아이디어 사용자 검증 큐 — 검토 완료

생성일: 2026-07-13  
근거: [사용 순간 접근성 전체 감사 — 70개](./idea-moment-access-audit-70.md)  
추가 게이트: [플랫폼 주인 우위 재검사](./idea-platform-owner-gate-audit-62.md)  
추가 탈락 기록: [사용자 검토 전 내부 탈락 기록](./idea-pre-review-decisions-2026-07-12.md)  
고정 사용자 문항: [공통 평가표 12문항](./idea-user-evaluation-12.md)  
최종 결정 장부: [idea-final-decisions-62.jsonl](../../../research/idea-final-decisions-62.jsonl)  
기계 판독 큐: `idea-user-validation-queue-current.jsonl`

## 운영 방식

- Moment 2 이후 플랫폼 주인 우위·시장 폭·범용 AI·비결제 상대방 협조 게이트까지 통과한 후보만 포함한다.
- 62개 후보의 UX·제품·플랫폼·중복 검사를 모두 완료했다.
- 62개·56개·49개 중간 큐는 `archive/queues/` 또는 검증 로그의 폐기 스냅샷이며 현재 대기열로 사용하지 않는다.
- 새 후보는 최종 결정 장부와 ID·핵심 결과를 먼저 대조해 Fail·Merge 변형의 재진입을 막는다.
- 사용자 최종 Yes 전에는 앱 그룹과 현재 런타임 기준 27조합을 추가하지 않는다.

## 집계

- 남은 전체: **0개**
- 누적 Fail: **42개**
- 누적 Merge: **11개**
- Custom Reserve: **5개**
- 앱 그룹 승격 후보: **4개** — B09-01, B05-01, C11, LC11

## 전체 큐

| 순위 | 회차 | ID | 구분 | 제목 | 제품성 | 상태 |
|---:|---:|---|---|---|---:|---|
| - | - | - | - | 남은 후보 없음 | - | completed |
