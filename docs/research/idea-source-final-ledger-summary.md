# 아이디어 원본 최종 판정 통합 원장

생성일: 2026-07-15T06:44:07.339Z  
생성 스크립트: `scripts/research/build-idea-source-final-ledger.mjs`  
기계 판독 원장: `docs/research/idea-source-final-ledger.jsonl`

## 현재 진행률

- 전체 원본: **8,406개**
- 최종 판정 완료: **8,406개**
- 기존 수동 감사는 있으나 다섯 문장 정규화가 남음: **0개**
- 아직 판정 전: **0개**
- 100개 판정은 끝났으나 Fail 재감사 미통과: **0개**
- 완료 배치: **85개** — EXH-001, EXH-002, EXH-003, EXH-004, EXH-005, EXH-006, EXH-007, EXH-008, EXH-009, EXH-010, EXH-011, EXH-012, EXH-013, EXH-014, EXH-015, EXH-016, EXH-017, EXH-018, EXH-019, EXH-020, EXH-021, EXH-022, EXH-023, EXH-024, EXH-025, EXH-026, EXH-027, EXH-028, EXH-029, EXH-030, EXH-031, EXH-032, EXH-033, EXH-034, EXH-035, EXH-036, EXH-037, EXH-038, EXH-039, EXH-040, EXH-041, EXH-042, EXH-043, EXH-044, EXH-045, EXH-046, EXH-047, EXH-048, EXH-049, EXH-050, EXH-051, EXH-052, EXH-053, EXH-054, EXH-055, EXH-056, EXH-057, EXH-058, EXH-059, EXH-060, EXH-061, EXH-062, EXH-063, EXH-064, EXH-065, EXH-066, EXH-067, EXH-068, EXH-069, EXH-070, EXH-071, EXH-072, EXH-073, EXH-074, EXH-075, EXH-076, EXH-077, EXH-078, EXH-079, EXH-080, EXH-081, EXH-082, EXH-083, EXH-084, EXH-085

## 최종 판정 수

- Reserve: **142개**
- Merge: **411개**
- Existing: **100개**
- Fail: **5,225개**
- Candidate: **2,528개**

## 기존 기록을 가져온 방법

- 현재 앱과 정확히 연결된 100개 원본은 `Existing`으로 최종 반영했다.
- 2단계 필터 실험의 고유 원본 57개 중 앱 원본과 겹치지 않는 0개는 기존 판정과 이유를 보존하되, 다섯 문장을 채우기 전에는 최종 완료로 세지 않는다.
- 최근 카드 판정 62개는 `idea-final-decisions-62.jsonl`에 원본 키가 없고 한 원본과 1:1 대응하지 않는 아이디어 판정이다. 원본 수를 부풀리지 않기 위해 8,406행에 억지로 매핑하지 않고, Fail·Merge·Reserve 재진입을 막는 판정 사례집으로만 사용한다.

## 완료 기준

모든 행이 `finalized`이고, 다섯 문장·판정·구체적 이유가 비어 있지 않아야 한다. 각 100개 배치는 Fail의 10% 재검사를 별도 파일에 남기고 오판율 5% 미만을 확인한 뒤 완료한다.
