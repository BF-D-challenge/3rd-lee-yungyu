---
name: card-art-prompting--gpt2-structure
description: gpt-image-2 공식 쿡북·fal.ai·Reddit 실측을 종합해 카드 아트 프롬프트를 Use case/Subject/Composition/Palette/Constraints 5필드 구조로 재설계한 근거와, 오로라 카드 12장에 실제 적용한 사례.
metadata:
  type: research
  topic: card-art-prompting
  category: deep
  date: 2026-07-07
---

# 리서치: GPT Image 2 전문 프롬프트 "구조" 설계

> Trust Level: L1 (Draft) · 2026-07-07 · @researcher
> 목적: 오로라 카드 12장(`docs/aurora-card-prompts.md`)을 gpt-image-2 공식 구조 문법으로 재설계.
> 수집: WebFetch(OpenAI 쿡북, fal.ai) · WebSearch · rdt read(실측 스레드) · twitter search. SUMMARY.md의 후속.

## 결론 — 전문가 구조는 "라벨 필드 5개, 순서 고정"

모든 소스가 같은 뼈대에 수렴:

```
[비율/사이즈 — 첫 문장]
Use case:    [무엇에 쓰는 이미지인지 — 모델의 '모드'를 세팅]
Subject:     [핵심 하나 — 우리는 '빛의 동사']
Composition: [어디서 시작해 어디로 흐르고 프레임을 어떻게 채우는지]
Palette:     [주색→보조색 hex, 깊이 톤]
Constraints: [불변 규칙 + NO 리스트 — 매 호출 동일하게 반복]
```

### 근거별 핵심

1. **공식 순서** (쿡북·fal.ai 공통): `Scene → Subject → Details → Use case → Constraints`, 긴 프롬프트는 한 문단 말고 **라벨 세그먼트/줄바꿈**. "The model responds to structure."
2. **Use case 필드가 모드를 결정** — "premium fintech keyvisual"처럼 용도를 명시하면 결과 레지스터가 바뀜(쿡북: intended use로 creative mode 세팅).
3. **스타일 키워드는 1개만 지배적으로.** 나머지는 구체적 시각 구현으로 풀 것. fal.ai: *"Excitement does not render"* — "minimalist brutalist luxury" 나열(약함) vs "brushed aluminum, 50mm feel, soft bounce light"(강함). 형용사 말고 **그릴 수 있는 것**을 쓴다.
4. **Constraints는 매 반복 동일하게 재선언** (preserve list 반복 원칙). 세트 생성에서 불변 블록이 통일성을 담당.
5. **실측 6필드 템플릿** (r/ChatGPTPromptGenius 주말 실측 ^33): Subject/Layout/Palette/Typography/On-image text/Style. "vibes 프롬프트는 절반이 실패, 필드 분해가 일관 성공." 글자 있는 카드엔 텍스트를 따옴표로(패러프레이즈 방지) — 우리는 무텍스트라 Typography/On-image text 필드 삭제.
6. **JSON 프롬프트도 유효** (dev.to·dualview): `visual_style{aesthetic, mood, lighting, color_palette}`, `composition{...}` 키 구조. 쿡북: "유지보수 쉬운 형식을 써라" — 사람이 관리할 문서면 라벨 텍스트, 코드 파이프라인이면 JSON.
7. **비율은 맨 앞 고정**(모델이 알아서 안 정해줌) + 파라미터: size는 16의 배수·비율 ≤3:1, quality 초안 low/medium·최종 high, `n=4` 변형 비교. gpt-image-2는 `input_fidelity` 비활성(기본 고충실).
8. **레퍼런스는 역할 라벨링**: "Image 1: style reference … apply Image 1's style to …" — 어떤 입력이 스타일이고 콘텐츠인지 지목.

## 우리 적용 (오로라 12장)

- 필드 중 Scene은 추상 라이트필드라 생략, **Subject=빛의 동사 1개**가 지배 키워드.
- Palette에 **앱 실제 토큰 hex**(globals.css: `#2dffa0` `#22d3ee` `#3a63ff` `#1a2fb5`)를 박아 "구체가 이긴다" 원칙 + UI 일치를 동시에.
- 카드별로 Subject/Composition/Palette 3필드만 바뀌고 Use case/Constraints는 불변 → 유지보수·통일성 둘 다 확보.
- → 반영: `docs/aurora-card-prompts.md` v2.1 (구조화 템플릿 + 12장 필드 재작성).

## 소스

- OpenAI 쿡북(구조·제약·파라미터): https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- fal.ai GPT Image 2 프롬프팅(5섹션 앵커·"excitement does not render"): https://fal.ai/learn/tools/prompting-gpt-image-2
- 실측 구조 스레드(rdt read 1ty814a, r/ChatGPTPromptGenius ^33): https://reddit.com/r/ChatGPTPromptGenius/comments/1ty814a/ → 원문 블로그 30 템플릿: https://israynotarray.com/en/ai/2026/05/02/gpt-5-5-chatgpt-images-2-0-guide-30-prompt-templates/
- JSON 스타일 가이드: https://dev.to/worldlinetech/json-style-guides-for-controlled-image-generation-with-gpt-4o-and-gpt-image-1-36p · https://www.dualview.ai/blog/guides/json-prompts-ai-image.html
- 템플릿 모음: https://evolink.ai/gpt-image-2-prompts · https://help.apiyi.com/en/gpt-image-2-prompts-collection-april-2026-en.html
- 필드 가이드(가격·모드, 기존 수집): https://reddit.com/r/promptingmagic/comments/1ss8j4e/

## 미수집(사유)

- 추상 그라디언트 전용 공식 가이드는 부재(쿡북·fal.ai 모두 구체 피사체 중심) → 구조 원칙을 추상에 이식하는 건 우리 설계 판단.
- twitter 검색은 중국어 인물 프롬프트·홍보 위주로 저신호 → 인용 제외.
