# 오늘 해볼까 — 최종 TASK

업데이트: 2026-07-15

## 우리가 만들고 있는 것

`오늘 해볼까`는 사용자가 버튼을 누를 때 AI가 새 아이디어를 만드는 앱이 아니다.

해외에서 실제로 사용되는 제품 아이디어를 미리 조사하고, 아래 카드 네 장을 미리 만들어 두는 앱이다.

1. 검증된 원본
2. 돈 낼 사람
3. 필요한 순간
4. 한 끗 변화

목표는 **좋은 원본 100개**를 준비하는 것이다. 원본마다 27조합이 나오므로 최종 결과는 **2,700조합**이다.

## 현재 상태

- 앱에는 원본 100개가 들어 있다.
- 따라서 앱은 현재 2,700조합을 만들 수 있다.
- 과거 교체 판정 10개를 다시 확인해 8개는 한국형 카드로 재작성하고 2개는 새 원본으로 교체했다.
- 현재 앱 100개는 리서치 원본 8,406개 중 정확한 원본 100개와 모두 연결돼 있다.
- 리서치 원본은 총 8,406개다.
- 1단계 원본 재감사와 2단계 필터 실험은 끝났다.
- 네이버 검색 수요 30개 파일럿은 끝났고, 검색 신호는 품질 필터로 쓸 수 없다는 결론이 났다.
- Google Trends 한국 공개 화면은 로그인된 브라우저에서 조회 가능함을 1개 표본으로 확인했다.
- 8,406행 통합 판정 원장을 만들었고 2026-07-14 현재 8,406개가 모두 최종 판정됐다. pending은 0개다.
- EXH-001~006, 총 600개 원본은 Fail 그림자 감사까지 통과했다. 배치별 결정 파일은 `passed` 감사와 다섯 문장 근거가 모두 있을 때만 최종 원장에 반영한다.
- EXH-001 후보 9개는 9칸 81/81·27조합 243/243·UX 3/3 감사를 통과해 앱에 승격됐다.
- 실행 전환(2026-07-14): Claude 사용량 소진 뒤 `judge-idea-source-corpus-codex.py`의 **Codex CLI 단일 심사**로 전환한다. 이미 저장된 부분 판정은 지우지 않고, `passed` 감사가 없는 배치만 이어서 심사한다.
- 2026-07-14 적응형 Candidate 감사: 대표 게이트 2,576개 → 스트레스 3조합 150개 → Latin-9 88개 → 전체 27조합 40개를 순서대로 검사했다. 전체 27조합 통과 21개 중 우선순위 상위 21개를 앱에 추가해 73개/1,971조합이 됐다. 최종 보고서는 docs/dev/experiments/idea-lab/adaptive-card-audit-final-report-2026-07-14.md다.
- 11개 review 원본의 18조합 재감사도 완료했다. pass 12·review 53·fail 133이며, 18개 모두 통과한 원본은 0개라 추가 승격하지 않았다. 실패 이유는 `generic_ai`, `scope_broad`, `multi_input`, `vague_title` 등으로 기록했다.
- 다음 gate-pass 후보 60개도 스트레스 180개와 Latin-9 27개까지 검사했다. 스트레스 3/3 통과는 3개였지만 Latin-9 전체 통과는 0개라 승격하지 않았다. 결과는 `docs/dev/experiments/idea-lab/idea-next-batch-060-audit-summary-2026-07-14.md`에 남겼다.
- 이어서 중복 없는 2개 배치(각 60개)를 더 검사했다. 두 번째 배치는 Latin-9 전체 통과 0개, 세 번째 배치도 스트레스 3/3 통과 6개가 Latin-9에서 모두 탈락·재검토되어 승격 0개였다. 세 번째 결과는 `docs/dev/experiments/idea-lab/idea-next-batch-060c-audit-summary-2026-07-14.md`에 남겼다.
- 2026-07-15 Codex 병렬 감사로 061~069 배치 9개(서로 겹치지 않는 원본 481개)를 완료했다. 스트레스 1,443행은 pass 366·review 269·fail 808, Latin-9 666행은 pass 136·review 311·fail 219이었다. Latin-9를 모두 통과한 3개 원본만 전체 27조합 81행으로 넓혔고 pass 16·review 32·fail 33으로 끝나, 전체 27조합 통과 원본과 앱 승격 원본은 0개다. 배치별 결과는 `docs/dev/experiments/idea-lab/idea-next-batch-061-stress-summary-2026-07-14.md`부터 `idea-next-batch-069-audit-summary-2026-07-14.md`까지 남겼다.
- 061~069 실패 원인을 재검토해 해외 제품명을 사용자 제목처럼 검사하던 구조 오류를 수정했다. Latin-9에서 fail 0·hard fail 0인 24개를 앱형 카드로 다시 작성했지만 스트레스 72행 28/18/26, Latin-9 36행 22/4/10으로 9/9 통과 원본은 0개였다. 7/2/0 원본 2개도 두 차례 재작성 후 스트레스 3/3을 통과하지 못해 승격하지 않았다. 최종 결과는 `docs/dev/experiments/idea-lab/idea-review-rewrite-final-report-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 001: 남은 미검토 gate-pass 43개 중 8개만 사전 선별해 앱형 카드를 작성했다. `응원 부채 글자 만들기` 1개가 축 통일 후 Stress-3 3/3·Latin-9 9/9·Full-27 27/27을 통과해 앱에 승격했다. 앱은 74개/1,998조합이며 리서치 원본 74/74가 정확히 연결된다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-001-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 002: 과거 gate review·hard gate pass 원본에서 5개를 다시 골랐다. 실제 카드 대신 원본 요약의 순간·입력 범위를 읽던 감사 오류를 수정한 뒤 CarMaster가 Stress-3 3/3·Latin-9 9/9·Full-27 27/27을 통과해 앱에 승격됐다. 앱은 75개/2,025조합이며 리서치 원본 75/75가 정확히 연결된다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-002-final-audit-2026-07-15.md`다.
- 2026-07-15 배치 002 잔여 후보 재작성: Hyperfocal은 Stress-3 3/3 뒤 Latin-9에서 2/9만 통과해 탈락했다. Chordprep은 Stress-3 3/3·Latin-9 9/9를 통과했지만 Full-27에서 결제자와 순간의 현장 문맥이 어긋난 6개가 발견돼 21/27로 탈락했다. 두 원본 모두 앱에 넣지 않았으며 결과는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-002-retry-final-audit-2026-07-15.md`에 남겼다.
- 2026-07-15 강한 메커니즘 배치 003: 입력 1개·즉시 결과 1개가 선명한 원본 8개를 선별했다. Stress-3 4개, Latin-9 2개가 살아남았고 `Milestone Clip`만 Full-27 27/27을 통과해 앱에 승격됐다. 앱은 76개/2,052조합이며 리서치 원본 76/76이 정확히 연결된다. `Vibe App Scanner`는 Full-27 18 pass·9 review라 보류했다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-003-final-audit-2026-07-15.md`다.
- 2026-07-15 배치 003 1회 재작성 재검사: QRAnalytica는 원본의 동적 QR 메커니즘이 정적 QR 생성으로 변해 0/3, GifDuo는 2 pass·1 review, Vibe App Scanner는 안전 위험으로 재작성하지 않아 추가 승격 0개로 닫았다. 결과는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-003-retry-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 004: 전문 계산·파일 변환 원본 10개를 선별했다. Stress-3 3/3 통과 3개 중 Framera와 FilexHost가 Latin-9 9/9·Full-27 27/27을 통과했다. 원본 충실도 54/54와 기존 포트폴리오 중복 보조 감사 뒤 두 원본만 앱에 승격했다. 앱은 78개/2,106조합이고 리서치 연결은 78/78이다. 통합 원장은 Existing 78·Candidate 2,550·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-004-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 005: 과거 Stress·Latin 결과를 재사용해 근접 통과 원본 10개를 골랐다. Stress-3 3/3 통과 7개 중 SketchCut PRO만 Latin-9 9/9·Full-27 27/27을 통과했다. 원본 충실도 27/27, 기존 포트폴리오 중복 review 0건을 확인한 뒤 앱에 승격했다. 앱은 79개/2,133조합이고 리서치 연결은 79/79다. 통합 원장은 Existing 79·Candidate 2,549·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-005-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 005 근접 통과 재감사: 기존 실패 이유가 축 문구에 한정된 3개만 한 번 수정했다. mermaidonline.live와 Sketch Clean이 Stress-3 3/3·Latin-9 9/9·Full-27 27/27, 원본 충실도 54/54를 통과했고 포트폴리오 중복 review 0건을 확인해 승격했다. Massive Dev Chart Timer는 Stress-3 2/3으로 제외했다. 앱은 81개/2,187조합, 리서치 연결 81/81이며 통합 원장은 Existing 81·Candidate 2,547·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-005-retry-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 006: 기존 감사에 없는 전문 작업 Candidate 10개를 선별했다. Stress-3 3/3 통과 2개 중 Docswrite만 Latin-9 9/9·Full-27 27/27을 통과했다. 원본 충실도 27/27과 기존 포트폴리오 중복 수동 판정을 마친 뒤 Docswrite 1개만 승격했다. 앱은 82개/2,214조합, 리서치 연결 82/82이며 통합 원장은 Existing 82·Candidate 2,546·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-006-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 007: 미검사 전문 작업 Candidate 10개를 선별했다. Stream은 첫 Latin-9 9/9 뒤 Full-27 15/27, Figma AI Rename은 1회 재검수 Latin-9 9/9 뒤 Full-27 21/27로 탈락했다. Full-27 27/27 원본이 없어 승격 0개이며 앱은 82개/2,214조합을 유지한다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-007-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 008: 한국 맥락·전문 파일 작업 Candidate 10개를 선별하고 5개를 한 번 재검수했다. HWP→PDF가 재검수 Latin-9 9/9까지 통과했지만 Full-27은 24 pass·3 review라 승격하지 않았다. URL 입력을 외부 데이터로 오인하던 평가 문구도 수정해 CORSPROXY와 Scribbr를 동일 카드로 재판정했으나 Latin-9 완전 통과는 없었다. 승격 0개이며 앱은 82개/2,214조합을 유지한다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-008-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 009: App Store 전문 도구 Candidate 10개를 검사했다. White Balance Meter AI - KEV와 Vectorize!가 Full-27 54/54·원본 충실도 54/54를 통과했고, Vectorize!와 기존 SVG 최적화 카드의 입력·처리 방향이 다름을 수동 확인해 2개를 승격했다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-009-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 010: Chrome 전문 도구 Candidate 10개를 검사했다. Print Notion, Seerguard, Google Maps Extended Routes가 1회 단일 축 재검수 뒤 Full-27 81/81·원본 충실도 81/81을 통과해 3개를 승격했다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-010-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 011: TrustMRR 전문 파일 작업 Candidate 10개를 검사했다. PDF-Translator와 DocuAudit가 Full-27 54/54·원본 충실도 54/54를 통과하고 기존 카드와 메커니즘이 구분돼 2개를 승격했다. 세 배치 반영 후 앱은 89개/2,403조합, 리서치 연결 89/89이며 통합 원장은 Existing 89·Candidate 2,539·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-011-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 012: App Store Candidate 10개를 검사했다. SkySafari 8 Pro가 Full-27 27/27·원본 충실도 27/27을 통과하고 기존 카드와 별도 메커니즘임을 확인해 `fits-sky-locator` 1개를 승격했다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-012-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 013: Chrome Candidate 10개를 검사했다. YouTube Tag Extractor, Cookie Manager Pro, Design Analyzer가 Full-27 81/81·원본 충실도 81/81을 통과해 3개를 승격했다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-013-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 014: TrustMRR Candidate 10개를 검사했다. WebToApp, scrapestudio.co, Lightspeed.run, Beesecure가 Full-27 108/108·원본 충실도 108/108을 통과했다. 성능 보고서와 기존 SEO 카드의 critical 유사도 1건도 실제 브라우저 측정과 메타 검사로 메커니즘이 구분돼 4개를 승격했다. 세 배치 반영 후 앱은 97개/2,619조합, 리서치 연결 97/97이며 통합 원장은 Existing 97·Candidate 2,531·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-014-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 015: App Store Candidate 10개를 검사했다. Bake Master가 Latin-9 9/9까지 통과했지만 Full-27은 22 pass·3 review·2 fail이라 승격하지 않았다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-015-final-audit-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 016: Chrome Candidate 10개를 선별하고 앞 5개 카드만 작성했다. 뒤 5개 카드 생성이 두 번 출력 없이 멈춰 완료 파일을 보존한 채 중단했으며 Stress 감사와 앱 승격은 진행하지 않았다. 100개 목표를 다른 배치에서 달성해 재개하지 않는다. 상태 문서는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-016-incomplete-status-2026-07-15.md`다.
- 2026-07-15 강한 메커니즘 배치 017: TrustMRR Candidate 10개를 검사해 6개가 Full-27 162/162·원본 충실도 162/162를 통과했다. 기존 97개와의 포트폴리오 중복 감사에서 review·critical이 가장 낮은 `football-matchday-social-card`, `sitemap-to-llms-text`, `tailwind-selector-class-diff` 상위 3개만 승격하고 나머지 3개는 통과 후보로 보존했다. 앱은 100개/2,700조합, 리서치 연결 100/100이며 통합 원장은 Existing 100·Candidate 2,528·Merge 411·Reserve 142·Fail 5,225다. 최종 감사는 `docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-017-final-audit-2026-07-15.md`다.

**새 필터·검색 실험은 더 늘리지 않는다. 8,406개 원본 판정은 끝났고, 후보 추가는 대표 게이트 → 스트레스 3조합 → Latin-9 → 전체 27조합 순서로 진행한다. 앱에는 27조합을 통과한 원본만 추가한다.**

재검토 대상 10개:

```text
cross-post-relay
connected-knowledge
class-material-coach
track-form-coach
n8n-workflow-architect
small-business-site
safe-message-reply
bulk-shop-listing
social-comment-guard
employee-review-team
```

---

## 1단계. 과거 교체 판정 10개 재확인

### 2026-07-13 재감사 체크포인트

- [x] 10개 원본 근거·현재 카드·한국 사용 맥락 재확인
- [x] `카드 재작성 8 / 일반 앱 교체 2` 확정
- [x] 재작성 8개의 결제자 3×순간 3×한 끗 3, 총 216조합 감사
- [x] 병렬 실험 후보 6개의 결제자 3×순간 3×한 끗 3, 총 162조합 감사
- [x] local fastembed 원본 충실도·기존 포트폴리오 중복 검사
- [x] 신입·중급·숙련 UX 합성 평가 3/3
- [x] 앱 수정 전 감사 문서 작성
- [x] 사용자에게 첫 결과 보고 후 통과 카드만 `sample-data.ts`에 반영
- [x] 타입·1,026조합·Idea Lab E2E 검증
- [x] 앱 38개와 리서치 원본 38개 정확 연결
- [x] 최종 1,026조합 local fastembed 원본 충실도 통과

감사 문서:

- `docs/dev/experiments/idea-lab/task1-current-ten-localization-reaudit-2026-07-13.md`
- `docs/dev/experiments/idea-lab/task1-parallel-six-27-combination-audit-2026-07-13.md`

이 10개를 자동으로 교체하지 않는다. 현재 원본·결제자·순간·한 끗 카드를 다시 읽고 다음 순서로 판단한다.

- [x] 현재 카드 그대로 모든 27조합이 자연스러우면 `유지`
- [x] 해외 플랫폼 이름만 문제라면 한국의 실제 사용 채널로 바꿔도 원본 메커니즘이 유지되는지 먼저 확인
- [x] 플랫폼 발행 권한이 필요하면 직접 발행 대신 업로드 파일·검토 초안처럼 제품이 소유하는 결과로 줄일 수 있는지 확인
- [x] 원본 메커니즘을 살리면서 입력 1개 → 결과 1개로 줄일 수 있으면 `카드 재작성`
- [x] 줄이는 순간 원본의 핵심이 사라지거나 플랫폼·상대방 권한이 필수면 `교체`
- [x] 10개 각각의 결정적 이유와 살릴 수 없는 이유를 문서로 먼저 보여준다.

예시:

- `bulk-shop-listing`: Shopify 자체가 핵심이 아니다. `공급사 상품표 → 네이버 스마트스토어 필수 항목 매핑 → 누락 확인이 끝난 등록 초안·업로드 파일`로 로컬화할 수 있으므로 우선 `카드 재작성`으로 검토한다.
- `n8n-workflow-architect`: n8n을 실제로 쓰는 한국 결제자가 제한적이고 업무 한 줄→자동화 순서가 범용 AI로 대체되기 쉬우므로, 일반 후보보다 자동화 컨설턴트용 `Reserve` 또는 교체로 검토한다.

재확인 결과 실제 교체가 필요한 수만큼, 이미 찾은 후보 6개부터 검사한다.

1. Alitools Shopping Assistant
2. Language Learning with Netflix & YouTube
3. Rocket Money
4. Unroll.Me
5. Tab Wrangler
6. MyScript Notes

각 후보에서 다음을 확인한다.

- [x] 돈 낼 사람 3개가 자연스러운가?
- [x] 필요한 순간 3개가 실제로 있는가?
- [x] 한 끗 변화 3개가 모두 매력적인가?
- [x] 27개 조합이 모두 말이 되는가?
- [x] 파일·URL·사진·텍스트 등 현실적인 입력으로 작동하는가?
- [x] 기본 앱이나 ChatGPT 한 번보다 분명히 나은가?
- [x] 혼자서 반나절~2일 안에 핵심 기능을 만들 수 있는가?

실제 교체 확정 수보다 통과 후보가 부족하면 2단계 실험에서 더 찾는다.

- [x] 실제 교체 확정 수만큼 새 후보의 검사 결과를 문서로 먼저 보여준다.
- [x] 통과한 후보만 교체 확정 원본과 1:1로 바꾼다.
- [x] 교체 전후 앱 원본 수는 38개로 유지한다.
- [x] 교체가 끝나면 “고품질 원본 38개” 체크포인트를 확정한다.

---

## 2단계. 좋은 필터 찾기

8,406개를 무작정 처음부터 읽으면 오래 걸린다. 여러 필터로 “먼저 읽을 후보”를 찾는다.

다음 7가지 방법을 서로 독립적으로 시험한다.

1. 현재 페이지에서 설치 직후 결과가 나오는 아이디어
2. 돈 손실·누락·마감처럼 통증과 결과가 분명한 아이디어
3. 입력 1개 → 처리 1회 → 결과 1개가 분명한 아이디어
4. 현재 좋은 원본과는 가깝고 기존 Fail 원본과는 먼 아이디어
5. 이미 뽑힌 후보와 다른 종류의 아이디어
6. 문제가 생긴 뒤 설치해도 바로 작동하는 아이디어
7. 아무 조건 없이 무작위로 뽑는 비교용 아이디어

실험 방법:

- [x] 각 방법이 8,406개 전체를 따로 확인한다.
- [x] 각 방법에서 상위 6개만 뽑는다.
- [x] 총 42개 실험 슬롯을 같은 기준으로 검사한다.
- [x] 무작위보다 좋은 후보를 더 많이 찾은 방법만 남긴다.
- [x] 가장 좋은 방법 2개 정도만 30개 규모로 확대한다.
- [x] 여기서 필터 실험을 끝낸다. 새 필터를 계속 추가하지 않는다.

2026-07-13 실험 결과:

- 7개 방법 모두 8,406개 전체를 점수화하고, 각 상위 6개인 42칸을 같은 하드게이트로 직접 감사했다.
- 무작위는 정밀검사 후보 0/6이었다.
- `A_immediate_result`와 `D_pass_near_fail_far`가 각각 2/6으로 가장 나아 두 방법만 30개로 확장했다.
- 30개 확장 결과는 각각 4/30, 3/30이었고, 중복을 빼면 정밀검사할 실제 원본 5개가 남았다.
- 필터는 합격 판정에 쓰지 않고 3단계에서 사람이 먼저 읽을 순서에만 쓴다.
- 전체 판정과 실제 원본은 `docs/dev/experiments/idea-lab/task2-filter-experiment-final-2026-07-13.md`에 기록했다.

중요: 필터는 아이디어를 자동 탈락시키지 않는다. 사람이 먼저 읽을 순서만 정한다.

---

## 3단계. 8,406개 전부 확인

필터 점수와 관계없이 8,406개는 모두 한 번씩 판정한다. 한 번에 100개씩, `84개 배치 × 100개 + 마지막 6개`로 진행한다.

기존에 끝난 판정은 버리지 않는다.

- 앱과 연결된 원본 52개는 `Existing`으로 가져온다.
- `idea-final-decisions-62.jsonl`의 62개 판정은 원본 키와 판정 근거를 검증한 뒤 가져온다.
- 2단계에서 직접 감사한 원본도 근거 문서가 있으면 가져온다.
- 같은 원본이 여러 실험에 나왔으면 한 줄로 합치고, 더 깊게 검토한 판정을 남긴다.
- 가져온 판정과 새 판정을 합쳐 8,406개가 정확히 한 번씩 나타나는지는 자동 검사한다.

아직 판정하지 않은 원본은 다음 순서로 읽는다.

1. `A_immediate_result`와 `D_pass_near_fail_far` 상위 원본
2. 입력·처리·결과 설명이 충분한 원본
3. 나머지 원본을 데이터셋별 원래 순서로 전부 확인

이 순서는 먼저 읽는 순서일 뿐 합격 점수가 아니다.

각 원본에는 다음 다섯 가지를 한 문장씩 남긴다.

```text
무엇을 넣는가?
무엇을 한 번 처리하는가?
어떤 결과가 바로 나오는가?
사용자는 언제 이것을 찾는가?
왜 기본 기능이나 ChatGPT보다 나은가?
```

그리고 다섯 가지 중 하나로 판정한다.

- `Existing`: 현재 앱 52개와 이미 정확히 연결됨
- `후보`: 새 원본으로 더 검사할 가치가 있음
- `Merge`: 기존 원본의 카드 재료로 사용
- `Reserve`: 특정 전문지식이나 고객 채널이 있을 때만 사용
- `탈락`: 구체적인 실패 이유가 있음

### 배치 하나의 완료 조건

각 100개 배치는 아래 순서를 모두 끝내야 완료다.

1. 100개 모두에 다섯 문장과 판정 이유를 남긴다.
2. 설명이 부족하면 바로 탈락시키지 않고 원문을 한 번 보강한다.
3. 탈락 판정의 10%를 무작위로 다시 읽는다.
4. 재검사에서 잘못 탈락한 비율이 5% 이상이면 그 배치의 탈락 판정을 다시 본다.
5. 중복 키·빈 판정·빈 이유·누락을 자동 검사한다.
6. 배치 결과와 실제 사용한 원본을 문서로 남긴다.

### 전수 판정 체크포인트

- [x] 기존 판정과 앱 원본을 합친 통합 판정 원장을 만든다. — 8,406행, 고유 키 8,406개
- [x] Batch 001: 첫 100개 판정·10% 재검사·자동 검증 — 2차 표본 7개 오판 0%
- [x] Batch 010 누적: 1,000개 배치 원본 판정·10% Fail 그림자 감사 통과 — EXH-001~010
- [x] Batch 025 누적: 2,500개 판정
- [x] Batch 050 누적: 5,000개 판정
- [x] Batch 075 누적: 7,500개 판정
- [x] Batch 085 완료: 8,406개 판정
- [x] 최종 원장에 8,406개가 정확히 한 번씩 있고 빈 판정이 없는지 검증

경쟁 앱이 있다는 이유만으로 탈락시키지 않는다.

### 한국 검색 수요 보조 근거

검색 수요는 새 필터나 자동 탈락 기준이 아니다. 8,406개 모두에 검색어를 만들지 않고, `후보` 또는 한국어 표현이 불분명한 원본에만 붙이는 보조 증거다.

필요할 때만 다음 검색어 묶음 3개를 만든다.

```text
문제가 생겼을 때 찾는 말
원하는 결과를 찾는 말
도구 범주를 찾는 말
```

- [x] 현재 앱 체크포인트 10 / 2단계 정밀검사 5 / 2단계 탈락 10 / 무작위 5, 총 30개 표본 구성
- [x] 원본 30개에 한국어 검색어 묶음 3개씩, 총 90개 작성
- [x] 네이버 데이터랩 수집기와 `미수집 ≠ 검색량 0` 검증 추가
- [x] Google Trends 공개 호출 제한을 0점이 아닌 `rate_limited_public_endpoint`로 기록
- [x] 네이버 개발자 API 인증 후 30개 24개월 월간 추세 수집
- [x] Google Trends 한국 공개 화면이 로그인된 브라우저에서 조회되는지 1개 표본으로 확인
- [x] 현재 좋은 원본 오판율 확인: 3/10(30%)로 5%를 넘어 필터·자동 정렬은 불채택, 수동 보조 근거만 채택
- [x] Google 30개 전수 교차 확인은 필수 TASK에서 제외: 품질 판정을 바꾸지 못하고 공개 화면 호출 제한 위험이 있음

파일럿 문서:

- `docs/research/idea-search-demand-pilot-30-input-summary.md`
- `docs/research/idea-search-demand-pilot-analysis.json`
- `docs/dev/experiments/idea-lab/search-demand-pilot-analysis-2026-07-14.md`
- `docs/dev/experiments/idea-lab/search-demand-pilot-30-2026-07-13.md`

검색량이 낮아도 실제 매출·명확한 결제자·전문 고객 채널이 있으면 B2B 원본을 탈락시키지 않는다. 네이버와 Google의 상대지수로 서로 다른 원본의 절대 수요 순위를 만들지 않는다. Google Trends는 후보의 한국어 표현이 맞는지 확인할 때만 로그인된 브라우저에서 천천히 조회한다.

---

### 뉴스레터 외부 발견 큐 — 전수 판정 분모 밖

뉴스레터는 좋은 원본과 한국 구매 맥락을 발견하는 보조 입구다. 그러나 글 제목·매출·바이럴만으로 앱 원본을 늘리지 않는다. 이 큐는 새로운 필터 실험도, 8,406개 전수 판정의 일부도 아니다.

- [x] Solo Business Night·050 SaaS·조쉬·주간 SaaS·HOW TO 1000 LABS·언섹시 비즈니스·Lenny를 별도 발견 채널로 등록
- [x] 초기 7건을 `Hold 1 / Merge 2 / Fail 4`로 기록하고 `Candidate 0`을 확인
- [x] 전수 판정 분모에 영향이 없고 조기 Candidate를 막는 검증기 추가

사용 순서:

1. 뉴스레터에서 제품·공식 링크·한국 결제/순간 단서를 발견한다.
2. 원문 공식 페이지에서 입력 → 처리 → 결과를 확인한다.
3. 8,406개와 정확히 일치하면 새 줄을 만들지 않고 기존 EXH 판정을 따른다.
4. 비슷하면 Merge 카드 재료로만 남긴다. 상대방·현장 운영·양면 시장이 필수면 Fail로 닫는다.
5. 8,406개 밖의 검증된 새 원본만 전수 판정 완료 뒤 별도 후보 배치에 넣고, 27조합 감사를 끝낸 뒤에만 앱에 넣는다.

관련 파일: [newsletter-leads/README.md](./docs/research/newsletter-leads/README.md), [newsletter-leads.jsonl](./docs/research/newsletter-leads/newsletter-leads.jsonl)

---

## 4단계. 좋은 후보만 앱에 추가

3단계에서 `후보`가 된 원본만 최대 10개씩 모아 카드 작성을 시작한다. 후보가 10개보다 적으면 있는 수만 검사한다.

1. 돈 낼 사람 3개 작성
2. 필요한 순간 3개 작성
3. 한 끗 변화 3개 작성
4. 대표 9조합은 초안 문제를 찾는 보조 점검으로만 쓰고, 통과 근거로 세지 않는다.
5. 27조합 각각에 제목·UVP·실제 입력·처리·즉시 결과·실패 코드·한 줄 근거를 남긴다. 하나라도 실패하면 수정 뒤 27개 전체를 다시 본다.
6. 원문 발췌와 원본 입력→처리→결과를 각 조합에 연결해 사람이 먼저 원본 충실도를 판정하고, local fastembed·OpenAI 임베딩은 보조 신호로만 쓴다.
7. 기존 앱+후보 전체의 유사 쌍마다 `Distinct / Merge / Rewrite` 수동 판정을 남긴다. 유사도 숫자만으로 자동 탈락시키지 않는다.
8. 신입·중급·숙련이 27조합을 독립적으로 보고, 각 조합에서 10초 문제 이해·첫 입력 찾기·결과 설명을 평가한다. 조합마다 UX 2/3 이상이어야 한다.
9. 앱과 연결할 정확한 리서치 원본 키·URL·원문 발췌를 확인한다.
10. 검사 결과 문서를 먼저 보여주기
11. 통과한 원본만 앱 데이터에 추가

### 4단계 Batch 001 — 2단계 생존 후보 5개

- [x] 돈 낼 사람 3개씩 작성
- [x] 필요한 순간 3개씩 작성
- [x] 한 끗 변화 3개씩 작성
- [x] 대표 9조합씩 검사
- [x] 전체 27조합씩, 총 135조합 검사
- [x] local fastembed 원본 충실도·기존 38개 중복 검사
- [x] 합성 UX 3명 평가와 경계 카드 수정·재평가
- [x] 정확한 리서치 원본 키 5개 연결
- [x] 앱 수정 전 감사 보고서 작성
- [x] 통과한 원본 5개를 앱 데이터에 추가

감사 결과: [TASK 4 후보 5개 27조합 승격 전 감사](./docs/dev/experiments/idea-lab/task4-candidate-five-27-combination-audit-2026-07-14.md)  
판정: Pass 5 / Merge 0 / Reserve 0 / Fail 0. 앱 반영과 검증을 마쳐 현재 43개 / 1,161조합이다.

확장 체크포인트:

- [x] 고품질 원본 38개 / 1,026조합
- [x] 4단계 Batch 001 원본 43개 / 1,161조합
- [x] 과거 원본 50개 체크포인트 — 당시 실제 52개 / 1,404조합
- [x] 원본 75개 / 2,025조합
- [x] 현재 원본 78개 / 2,106조합
- [x] 현재 원본 79개 / 2,133조합
- [x] 현재 원본 81개 / 2,187조합
- [x] 현재 원본 82개 / 2,214조합
- [x] 현재 원본 89개 / 2,403조합
- [x] 현재 원본 97개 / 2,619조합
- [x] 원본 100개 / 2,700조합

한 번에 최대 10개 후보만 작업한다. 10개 중 4개만 통과하면 4개만 앱에 넣는다. 수량을 맞추려고 낮은 품질 후보를 넣지 않는다.

2026-07-14부터 새 후보 배치는 **대표 게이트 → 스트레스 3조합 → Latin-9 → 전체 27조합** 순서로 적응형 감사를 적용한다. 먼저 2,576개를 빠르게 거르고, 통과 후보만 3조합으로 위험을 찾고, 살아남은 후보만 9개 관계와 전체 27개 조합까지 넓힌다. 과거 EXH-001의 27조합·대표 조합 감사는 역사 기록으로 보존하되, 새 후보에 자동 `pass`를 쓰지 않는다. 자세한 기준은 `docs/dev/experiments/idea-lab/adaptive-card-audit-method-2026-07-14.md`에 남긴다.

---

## 지금 바로 할 일

남은 후보 확장에서는 아래 순서만 반복한다.

1. [x] 기존 앱 43개·최근 62개 판정·2단계 감사 결과를 통합 원장에 가져온다.
2. [x] 중복을 제거하고 아직 판정하지 않은 실제 개수를 자동 계산한다. — 2026-07-14 현재 8,406/8,406 finalized, pending 0
3. [x] Candidate 2,576개를 메커니즘·이름 provisional cluster로 묶고 빠른 레인 대표 100개를 고정한다.
4. [x] 100개 모두에 다섯 문장·판정·구체적인 이유를 작성한다.
5. [x] 탈락을 무작위 재검사하고 배치 검증을 통과시킨다. — 1차 실패 후 Fail 전체 재감사, 2차 0/7
6. [x] 새 후보 2,576개 대표 게이트와 shortlist 150개를 검사했다.
7. [x] shortlist의 스트레스 3조합·Latin-9·전체 27조합을 단계적으로 확대했다.
8. [x] 감사 문서를 먼저 보여주고 최종 Pass 21개를 앱에 추가했다.
9. [x] 남은 고품질 후보를 같은 절차로 검토해 50개 → 75개 → 100개까지 확장했다. — 2026-07-15 현재 100개 / 2,700조합

### 전체 TASK 완료 기준 — 2026-07-15 검증 완료

- [x] 8,406개 각각에 최종 판정과 이유가 있다.
- [x] 탈락 10% 재검사에서 배치별 오판율이 5% 미만이다. — EXH 85개, 최종 표본 567개, 최대 0%
- [x] 통합 원장에 누락·중복·빈 판정이 없다. — 8,406행 / 고유 키 8,406개 / pending 0
- [x] 앱 원본 100개가 각각 정확한 리서치 원본과 연결돼 있다. — 100/100 `Existing`
- [x] 모든 앱 원본에 결제자 3 × 순간 3 × 한 끗 3이 있고 2,700조합이 생성된다. — 각 축 300개 / 고유 조합 2,700개
- [x] 타입 검사·조합 수 검사·Idea Lab E2E·판정 원장 검증이 모두 통과한다.

최종 증거: `docs/dev/experiments/idea-lab/idea-goal-completion-audit-2026-07-15.md`

## 앱 데이터를 수정할 때 실행할 검사

```bash
npm run typecheck
npm run test:unit
npx playwright test tests/e2e/idea-lab.spec.ts
node scripts/research/verify-idea-final-decisions.mjs
node scripts/research/verify-idea-source-experiment-manifest.mjs
node scripts/research/verify-idea-source-final-ledger.mjs
node scripts/research/verify-idea-lab-research-links.mjs
node scripts/research/verify-idea-lab-runtime-catalog.mjs
git diff --check
```

## 하지 않을 일

- 런타임에서 LLM으로 새 아이디어 만들기
- 3단계 전에 새 필터 실험을 더 만들기
- 8,406개 모두에 네이버·Google 검색어를 기계적으로 붙이기
- Google Trends 30개 교차 확인을 전수 판정의 선행 조건으로 만들기
- 필터 점수만으로 자동 탈락시키기
- 경쟁 앱이 있다는 이유만으로 탈락시키기
- Merge를 새 원본 수로 세기
- Reserve를 일반 후보로 자동 승격하기
- `후보` 판정 전부터 3×3×3 카드를 작성하기
- 감사 문서를 보여주기 전에 앱 데이터에 추가하기
- 과거 교체 판정을 재확인하지 않고 자동으로 삭제·교체하기
- 기존 사용자 파일이나 미추적 파일 삭제하기
