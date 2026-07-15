# Luna A 재검증 — Firecrawl 없이 돈·일·주거 20개

기존 보고서 `docs/dev/experiments/idea-lab/luna-batch-004-a-money-work.md`의 **동일한 20개 후보**를 다시 조사하고 판정하라. 새 후보를 만들거나 기존 후보를 삭제하지 않는다.

## 수집 방법

- Firecrawl 사용 금지.
- 공식 웹페이지·기사: `curl` + `https://r.jina.ai/http://...` 또는 `https://r.jina.ai/https://...`로 읽는다.
- 검색 결과 탐색: 일반 검색 HTML을 `curl`로 읽고, 선택한 결과 URL을 Jina Reader로 다시 확인한다.
- 한국 앱 수요: `docs/research/store-rankings/app-store-expanded-unique-apps.jsonl`과 실제 App Store/Google Play 페이지.
- 해외 결제 신호: `docs/research/trustmrr-acquire/ideas.jsonl`.
- 커뮤니티 VOC가 필요하면 인증된 `rdt --json`, 영상은 `yt-dlp`를 사용한다.
- 원본은 `.firecrawl`이 아니라 `.research/luna-batch-004-refresh/a/`에 저장한다.

## 판정 규칙

- P1/P2/P3 중 `10초 이해·한국 실제 사용·결제 이유`를 모두 Yes로 한 인원이 2명 미만이면 즉시 실패.
- UX를 통과해도 한국에서 이미 공공기관·대형 플랫폼·강한 무료 앱이 핵심 결과를 제공하면 실패.
- 범용 AI 답변으로 끝나거나 4주 1인 MVP가 아니면 실패.
- 직접 확인하지 못한 국내 근거는 `미확인`으로 쓰고 통과 근거로 사용하지 않는다.
- 기존 배치 중복도 다시 검사한다.

## 산출물

`docs/dev/experiments/idea-lab/luna-batch-004-a-money-work-researched.md`

- 같은 20개 표
- 후보마다 직접 확인한 한국 URL 또는 `미확인`
- P1/P2/P3, UX 합의, 한국 하드게이트, 최종 판정
- 원래 판정→새 판정 변경표
- 최종 통과 후보 상세와 전체 통과/실패 수

다른 파일은 수정하지 않는다.
