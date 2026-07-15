# Luna C 재검증 — Firecrawl 없이 생활·이동·쇼핑·가족 20개

기존 보고서 `docs/dev/experiments/idea-lab/luna-batch-004-c-life-mobility.md`의 **동일한 20개 후보**를 다시 조사하고 판정하라. 새 후보를 만들거나 기존 후보를 삭제하지 않는다.

## 수집 방법

- Firecrawl 사용 금지.
- 공공기관·대형 플랫폼·기사: `curl` + Jina Reader(`https://r.jina.ai/http://...`, `https://r.jina.ai/https://...`).
- 한국 앱: `docs/research/store-rankings/app-store-expanded-unique-apps.jsonl`, App Store, Google Play.
- 해외 결제: `docs/research/trustmrr-acquire/ideas.jsonl`.
- 생활·반려 VOC는 필요 시 `rdt --json`, 영상은 `yt-dlp`.
- 원본은 `.research/luna-batch-004-refresh/c/`에 저장한다.

## 판정 규칙

- P1/P2/P3 중 `10초 이해·한국 실제 사용·결제 이유`를 모두 Yes로 한 인원이 2명 미만이면 즉시 실패.
- UX를 통과해도 공공기관·자동차/예약/쇼핑 플랫폼·OS가 핵심 결과를 무료 제공하면 실패.
- 단순 조회나 AI 답변은 실패. 공유 상태·증거·마감·양측 확인 중 하나를 소유해야 한다.
- 직접 확인하지 못한 국내 근거는 `미확인`으로 쓰고 통과 근거로 사용하지 않는다.
- 기존 배치와 다른 Luna 후보의 중복도 다시 검사한다.

## 산출물

`docs/dev/experiments/idea-lab/luna-batch-004-c-life-mobility-researched.md`

- 같은 20개 표
- 후보마다 직접 확인한 한국 URL 또는 `미확인`
- P1/P2/P3, UX 합의, 한국 하드게이트, 최종 판정
- 원래 판정→새 판정 변경표
- 최종 통과 후보 상세와 전체 통과/실패 수

다른 파일은 수정하지 않는다.
