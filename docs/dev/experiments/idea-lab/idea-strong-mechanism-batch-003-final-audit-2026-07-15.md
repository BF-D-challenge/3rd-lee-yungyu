# 강한 메커니즘 배치 003 — 승격 전 최종 감사

날짜: 2026-07-15

## 결론

- 사전 선별 원본: 8개
- Stress-3 3/3 통과: 4개
- Latin-9 9/9 통과: 2개
- Full-27 27/27 통과: 1개
- 승격 대상: `Milestone Clip` 1개
- 앱 반영: Milestone Clip 1개만 완료

## 원본별 결과

| 원본 | Stress-3 | Latin-9 | Full-27 | 최종 판정 |
|---|---:|---:|---:|---|
| Compresso | 0 pass · 3 fail | 미진행 | 미진행 | OS 기본 압축으로 대체 가능 |
| Handwritten Signature Generator | 0 pass · 3 fail | 미진행 | 미진행 | 범용 AI 대체·서명 안전 위험 |
| TheMemoryChess | 0 pass · 3 fail | 미진행 | 미진행 | 답변 입력과 채점이 추가로 필요 |
| Milestone Clip | 3/3 pass | 9/9 pass | 27/27 pass | 승격 대상 |
| QRAnalytica | 3/3 pass | 4 pass · 5 fail | 미진행 | 결제자와 순간의 인쇄 문맥 불일치 |
| GifDuo | 3/3 pass | 7 pass · 2 fail | 미진행 | 결제자와 순간의 프로필 문맥 불일치 |
| Vibe App Scanner | 3/3 pass | 9/9 pass | 18 pass · 9 review | 안전 보장으로 오해될 위험 |
| Moldaspace | 0 pass · 3 fail | 미진행 | 미진행 | 범용 이미지 AI 한 번으로 대체 가능 |

## 승격 대상 카드

원본: [Milestone Clip](https://trustmrr.com/startup/milestone-clip)

원본에서 확인한 흐름은 `공개 GitHub 저장소 URL → 저장소 이름·별·포크 수 배치 → MP4 영상`이다. 비공개 데이터나 성장 원인 분석은 추가하지 않았다.

### 돈 낼 사람 3개

1. **오픈소스 저장소 성과를 알리는 메인테이너**  
   별과 포크 수가 늘 때마다 저장소 화면을 캡처하고 편집 툴에서 수치를 다시 배치한다.
2. **출시 성과를 보여줘야 하는 개발자 창업자**  
   공개 저장소의 성장을 알리려고 저장소 정보를 영상 템플릿에 반복해서 옮긴다.
3. **프로젝트 홍보 콘텐츠를 만드는 개발자 마케터**  
   게시 채널마다 화면 비율이 달라 같은 성과 영상을 여러 번 제작한다.

### 필요한 순간 3개

1. **공개 저장소 수치가 바뀌어 커뮤니티에 알릴 순간**  
   성과가 신선할 때 바로 게시해야 해 영상 편집을 새로 할 시간이 없다.
2. **프로젝트 별 수가 목표를 넘은 직후**  
   최신 저장소 이름과 수치가 담긴 MP4를 즉시 공유해야 한다.
3. **포크 증가를 주간 업데이트로 올릴 순간**  
   정해진 게시 시간 전에 캡처와 편집을 끝내야 하는 부담이 생긴다.

### 한 끗 변화 3개

1. **저장소 성과 세로형 MP4 만들기**  
   공개 GitHub 저장소 URL 1개를 받아 이름·별·포크 수를 한 번 배치하고 세로형 MP4 1개를 반환한다.
2. **저장소 성과 정사각형 MP4**  
   같은 입력과 처리를 유지하고 정사각형 배치의 MP4 1개를 반환한다.
3. **저장소 성과 가로형 MP4**  
   같은 입력과 처리를 유지하고 가로형 배치의 MP4 1개를 반환한다.

## 27조합 감사 해석

- 결제자 3명은 모두 공개 오픈소스 성과를 알리는 사람이다.
- 순간 3개는 모두 공개 수치가 바뀐 뒤 빠르게 게시해야 하는 때다.
- 결과 3개는 내용이 아니라 게시 화면 비율만 달라진다.
- 따라서 어느 결제자와 어느 순간에 어느 화면 비율을 붙여도 같은 문제로 읽힌다.
- 공개 GitHub URL 하나가 사용자가 주는 입력이고, 공개 API 조회와 영상 렌더링은 한 번의 처리 안에 닫힌다.
- 저장소 이름·별·포크 수가 들어간 MP4 하나가 즉시 결과다.

## 보류한 Full-27 후보

`Vibe App Scanner`는 입력 URL과 관찰 보고서 구조는 작동하지만, 공개 관리 경로 점검이 일부 결제자·순간에서 전문 보안 진단처럼 읽힐 수 있었다. 전체 27개 중 9개가 `safety_or_regulation_risk`로 review여서 이번 배치에서는 승격하지 않는다.

## 승격 규칙 확인

- [x] 실제 카드의 `moment`와 `smallestBuild`를 기준으로 검사했다.
- [x] Stress-3 → Latin-9 → Full-27 순서를 지켰다.
- [x] Full-27 27/27인 원본만 승격 대상으로 정했다.
- [x] 앱 수정 전에 이 보고서를 작성했다.
- [x] 사용자에게 이 보고서를 먼저 보여준다.
- [x] `sample-data.ts`에 통과 원본 1개만 추가한다.
- [x] 타입·조합 수·리서치 연결·Idea Lab E2E를 검증한다.

## 승격 후 검증

- 앱 원본: 76개
- 런타임 조합: 2,052개
- Milestone Clip 조합: 27개
- 리서치 원본 연결: 76/76
- 통합 판정 원장: 8,406/8,406 finalized, pending 0
- 타입 검사: 통과
- Idea Lab E2E: 8/8 통과
- `git diff --check`: 통과

## 근거 파일

- 후보: `docs/research/idea-strong-mechanism-batch-003-input-2026-07-15.jsonl`
- 카드: `docs/research/idea-strong-mechanism-batch-003-card-drafts-2026-07-15.jsonl`
- Stress-3: `docs/research/idea-strong-mechanism-batch-003-stress-results-2026-07-15.jsonl`
- Latin-9: `docs/research/idea-strong-mechanism-batch-003-latin-results-2026-07-15.jsonl`
- Full-27: `docs/research/idea-strong-mechanism-batch-003-full-results-2026-07-15.jsonl`
