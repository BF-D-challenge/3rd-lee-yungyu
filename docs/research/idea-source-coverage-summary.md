# 아이디어 원본 커버리지 장부 요약

생성일: 2026-07-15

생성 스크립트: `scripts/research/build-idea-source-coverage.mjs`

기계 판독 장부: `docs/research/idea-source-coverage.jsonl`

## 결론

- 원본 **8,406건**을 하나의 추적 장부로 통합했다.
- TrustMRR 1,863 / App Store 4,512 / Chrome Web Store 2,031건이다.
- 현재 앱 원본의 정규 `research.key`·`research.url`과 정확히 연결된 원본 레코드는 **100건**이다.
- 현재 앱 100개 시나리오 중 로컬 원본 레코드와 정확히 연결된 시나리오는 **100개**, 미연결은 **0개**다.
- 정규화 이름 중복 후보 클러스터는 **48개**, 서로 다른 데이터셋 사이의 중복 후보는 **14개**다.

`in_app_unverified`는 앱의 정규 원본 키·URL이 연구 장부와 정확히 같다는 뜻일 뿐 사용자 승인이나 품질 통과가 아니다. 이름이 같아도 이 직접 연결이 없으면 앱 원본으로 취급하지 않는다.

## 데이터셋별 수

| 데이터셋 | 원본 수 |
|---|---:|
| TrustMRR | 1,863 |
| App Store | 4,512 |
| Chrome Web Store | 2,031 |
| **합계** | **8,406** |

## 초기 상태

| 상태 | 수 | 의미 |
|---|---:|---|
| `unseen` | 8,306 | 아직 원본 단위 심사를 시작하지 않음 |
| `in_app_unverified` | 100 | 현재 앱의 정규 키·URL과 연결됐지만 품질·사용자 승인 상태는 별도 확인 필요 |

## 현재 앱에서 원본 레코드와 정확히 연결되지 않은 시나리오

- 없음

미연결은 원본 부재를 의미하지 않는다. 상품명 변형, 기능명 사용, 다른 조사 소스 사용 가능성이 있으므로 수동 링크가 필요하다.

## 다음 사용법

1. 매 회차 `unseen` 원본 50개만 선택한다.
2. 검사 결과를 `auto_reject / shortlist / deep_reviewed / user_queue / approved / merge / custom_reserve / rejected` 중 하나로 바꾼다.
3. `review_batch`, `reviewed_at`, `rejection_code`를 반드시 기록한다.
4. 정규화 이름 중복은 후보 탐색에만 사용하고 수동 확인 뒤 병합한다.
5. 앱에 들어 있는 원본도 사용자 최종 Yes 전에는 `approved`로 바꾸지 않는다.
