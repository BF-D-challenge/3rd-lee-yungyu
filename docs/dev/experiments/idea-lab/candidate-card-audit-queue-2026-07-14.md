# Candidate-card audit queue — 2026-07-14

상태: **카드 초안 대기열 생성 완료. 앱 데이터 변경 없음.**

## 전수 판정과의 관계

8,406개 원본 전수 판정과 최종 원장을 먼저 완료했다. 최종 원장 분포는 `Candidate 2,576 / Merge 411 / Reserve 142 / Fail 5,225 / Existing 52`이며, 이 문서는 Candidate를 자동 승격하는 문서가 아니다. 아래 10개는 첫 카드 감사 배치의 작업 대기열일 뿐이다.

선정 시 다음을 적용했다.

- 현재 `sample-data.ts`의 52개 `sourceName`과 겹치지 않는 원본만 남겼다.
- 최종 판정이 `Candidate`이고 `provisional_decision`이 `Reserve`인 원본은 제외했다.
- 제목만으로 입력 → 처리 → 결과 세로 조각이 보이고, URL·파일·사진·단일 권한 중 하나로 닫히는 후보를 우선했다.
- 건강·금융·양면 마켓플레이스·상대방의 새 행동이 핵심인 후보는 이번 배치에서 제외했다.

## 배치 001 대기열

정확한 원본 키·URL과 상태는 [idea-candidate-card-audit-queue-2026-07-14.jsonl](../../../research/idea-candidate-card-audit-queue-2026-07-14.jsonl)에 고정했다.

| 순번 | 원본 | 기대 세로 조각 | 상태 |
|---:|---|---|---|
| 1 | YouTube Tag Extractor | YouTube URL 1개 → 태그 추출 → 태그 목록·캡처 | 카드 초안 대기 |
| 2 | Enhanced GitHub | GitHub URL 1개 → 파일 크기 계산 → 표시·복사 | 카드 초안 대기 |
| 3 | Base44 Downloader | 워크스페이스 파일 1개 → 변환 → ZIP/JSON | 카드 초안 대기 |
| 4 | Clip Mojo | 웹페이지 색상 1개 → 팔레트·대비 계산 → 스와치·검사표 | 카드 초안 대기 |
| 5 | Print Notion | Notion URL 1개 → 레이아웃 보존 변환 → PDF | 카드 초안 대기 |
| 6 | Blurred Out | 공유 화면 영역 1개 → 선택 블러 → 가린 화면 | 카드 초안 대기 |
| 7 | App Privacy Insights | iOS NDJSON 파일 1개 → 권한·네트워크 로그 정리 → 앱별 리포트 | 카드 초안 대기 |
| 8 | Zero Bounce | 발송 전 메시지 1개 → 전달 가능성 검사 → 문제 리포트 | 카드 초안 대기 |
| 9 | Aliexpress price tracker | 상품 URL 1개 → 가격 이력 조회 → 구매 판단 카드 | 카드 초안 대기 |
| 10 | Html2Email | HTML 코드 1개 → 메일 서식 삽입 → 작성창 미리보기 | 카드 초안 대기 |

## 각 후보의 다음 감사 산출물

후보별로 앱에 넣기 전에 다음을 작성한다.

1. 결제자 3개, 필요한 순간 3개, 한 끗 3개
2. 3×3×3 전체 27조합의 제목·UVP·입력·처리·즉시 결과·실패 코드·한 줄 근거
3. 원본 URL과 원문 입력 → 처리 → 결과 연결
4. 기존 앱 52개와의 유사 쌍 수동 판정 (`Distinct / Merge / Rewrite`)
5. 신입·중급·숙련 합성 UX 3명 평가 — 조합별 2/3 이상
6. local fastembed와 OpenAI embedding은 보조 신호로만 기록

하나라도 하드게이트를 통과하지 못하면 후보를 수정한 뒤 27개 전체를 다시 본다. 감사 보고서를 사용자에게 먼저 보여주기 전까지 `sample-data.ts`는 수정하지 않는다.

## 현재 상태

- 전수 원장: 8,406/8,406 finalized, 누락·중복 0
- 후보 대기열: 10개
- 카드 초안: 0개
- 27조합 감사 완료: 0/10
- 앱 데이터 변경: 없음

