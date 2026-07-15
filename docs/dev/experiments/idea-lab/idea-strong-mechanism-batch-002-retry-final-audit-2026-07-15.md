# 강한 메커니즘 배치 002 재작성 최종 감사

날짜: 2026-07-15

## 결론

- 재작성 대상: Hyperfocal, Chordprep 2개
- 앱 승격: 0개
- `sample-data.ts` 변경: 없음
- 앱 상태 유지: 원본 75개 / 런타임 2,025조합 / 리서치 연결 75/75

두 원본 모두 표본 검사에서는 가능성이 보였지만, 축 관계를 넓혀 확인하자 모든 조합이 자연스럽지는 않았다. 수량을 맞추기 위해 넣지 않고 보류한다.

## 단계별 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 최종 판정 |
|---|---:|---:|---:|---|
| Hyperfocal | 3/3 pass | 2 pass · 0 review · 7 fail | 미진행 | 탈락 |
| Chordprep | 3/3 pass | 9/9 pass | 21 pass · 0 review · 6 fail | 탈락 |

## Hyperfocal이 탈락한 이유

결제자는 사진과 영상을 함께 편집하는 사람으로 통일했지만, 필요한 순간과 결과 파일이 어긋났다.

예를 들어 `고객이 보낸 참고 사진의 색감을 오늘 편집에 옮겨야 할 때`라는 순간에 `영상 LUT 파일`을 주면, 사진을 바로 편집하려는 문제를 해결하지 못한다. 반대로 영상 편집 순간에 Lightroom·Photoshop 파일을 주는 조합도 생긴다.

Latin-9에서 7개가 `moment_twist_mismatch`로 실패했으므로 전체 27조합으로 확대하지 않았다.

## Chordprep이 탈락한 이유

입력 1개 → 처리 1회 → 결과 1개 구조는 명확했다.

- 입력: 목표 키나 카포 지시와 가사·코드를 담은 텍스트 블록 1개
- 처리: 코드 인식과 조옮김 계산 1회
- 결과: 연주용 코드표 1장

하지만 결제자와 필요한 순간을 예배·공연처럼 서로 다른 현장으로 나눠 작성해 교차 조합 6개가 부자연스러웠다.

실패한 두 관계는 다음과 같다. 각 관계가 한 끗 카드 3개와 결합해 총 6개가 실패했다.

1. `예배 반주자` × `공연 리허설 직후 세션팀에 새 코드표를 보내야 할 때`
2. `공연 음악 감독` × `예배 시작 전 팀이 요청한 새 키를 반영해야 할 때`

즉, 예배 반주자에게 공연 세션팀 일을 시키고 공연 음악 감독에게 예배팀 일을 시킨 셈이다. 대표 9개만 봤을 때는 이 교차 관계가 노출되지 않았지만, 전체 27개를 확인하면서 발견됐다.

## 승격 기준 적용

- [x] 앱 수정 전에 전체 27조합 결과를 문서화했다.
- [x] Full-27가 27/27이 아닌 원본을 앱에 넣지 않았다.
- [x] 낮은 품질 조합을 수량에 포함하지 않았다.
- [x] 기존 앱 데이터와 사용자 변경을 보존했다.

## 근거 파일

- 카드 초안: `docs/research/idea-strong-mechanism-batch-002-retry-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-002-retry-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-002-retry-latin-results-2026-07-15.jsonl`
- Chordprep Full-27: `docs/research/idea-strong-mechanism-batch-002-retry-full-results-2026-07-15.jsonl`
- Full-27 요약: `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-002-retry-full-summary-2026-07-15.md`

## 다음 단계

이 두 원본을 즉시 다시 고치는 대신 다음 강한 원본 배치로 이동한다. 새 원본은 세 결제자와 세 순간이 서로 교차해도 같은 업무 문맥으로 읽히는지를 카드 작성 단계에서 먼저 확인한다.
