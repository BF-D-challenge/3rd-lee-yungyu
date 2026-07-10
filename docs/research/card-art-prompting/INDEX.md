---
name: card-art-prompting--index
description: card-art-prompting 리서치 폴더(파일 2개) 안내 — 카드 아트용 전문가급 AI 이미지 프롬프트 기법 조사의 진입점, 어느 파일에 무엇이 있는지 요약.
metadata:
  type: research
  topic: card-art-prompting
  category: index
  date: 2026-07-07
---

# card-art-prompting — INDEX

> 조사 대상: 오늘 해볼까 카드 아트 세트(뒷면·축 6·분야 10·오로라 12장 등)를 위한 전문가급 AI 이미지 프롬프트 기법.
> 조사일: 2026-07-06 (1차) ~ 2026-07-07 (2차, gpt-image-2 구조 설계) · 수단: WebSearch/WebFetch + rdt-cli + twitter-cli.

## 파일 구성

| 파일 | 내용 |
|---|---|
| [SUMMARY.md](SUMMARY.md) | 1차 리서치 종합: 세트 일관성 = "히어로 이미지 확정 → 스타일 앵커로 재사용" 워크플로우, 타로 골드라인 공식, 툴별(MJ/Nano Banana/DALL-E/Flux) 구현법, GPT Image 2(gpt-image-2)가 세트 생성에 특히 강한 이유. |
| [GPT2-PROMPT-STRUCTURE.md](GPT2-PROMPT-STRUCTURE.md) | 후속 심화: gpt-image-2 공식 쿡북·fal.ai·Reddit 실측을 종합해 도출한 5필드(Use case/Subject/Composition/Palette/Constraints) 구조화 프롬프트 설계와 오로라 카드 12장 적용 사례. |

## 핵심 결론 한 줄씩

- **세트 일관성의 본질은 프롬프트 문구가 아니라 워크플로우다** — 히어로 1장을 먼저 확정하고 그걸 스타일 레퍼런스로 나머지에 재사용.
- **gpt-image-2 Thinking 모드는 한 프롬프트로 최대 8장을 일관 생성** — 축 6개·분야 10개(5×2 그리드) 세트 제작에 유리.
- **전문가 프롬프트는 라벨 필드 5개, 순서 고정**(비율 → Use case → Subject → Composition/Palette → Constraints)이 모든 소스에 공통.
