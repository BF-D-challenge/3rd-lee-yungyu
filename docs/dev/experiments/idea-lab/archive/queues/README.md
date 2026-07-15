# 사용자 검증 큐 아카이브

이 디렉터리는 최종 판정 전의 중간 스냅샷만 보관한다. **사용자에게 다시 제시하거나 현재 상태 계산에 사용하지 않는다.**

| 스냅샷 | 상태 | 설명 |
|---|---|---|
| `idea-user-validation-queue-62.*` | ARCHIVED / DEPRECATED | 62개 판정 전 원본. 최종 결정 장부 생성의 계보 입력으로만 사용 |
| `idea-user-validation-queue-56.*` | ARCHIVED / DEPRECATED | 플랫폼 주인·시장 폭 게이트 적용 직후 중간 큐 |
| 49개 큐 | ARCHIVED TRANSIENT | 별도 파일 없이 `group-validation-log.md`에만 남은 일시적 집계. 후속 10개 재검사로 39개가 되었고 최종 0개로 닫힘 |

현재 정본:

- 최종 결정 장부: `../../../../../research/idea-final-decisions-62.jsonl`
- 현재 큐: `../../idea-user-validation-queue-current.jsonl`
- 현재 큐 설명: `../../idea-user-validation-queue-current.md`
