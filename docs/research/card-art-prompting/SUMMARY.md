---
name: card-art-prompting--summary
description: AI 이미지 프롬프트 리서치 종합 — 카드 세트 일관성은 "히어로 이미지 확정→스타일 앵커 재사용" 워크플로우임을 밝히고, 타로 골드라인 공식·툴별(MJ/Nano Banana/DALL-E/Flux) 구현법과 gpt-image-2 Thinking 모드의 다장 일관 생성이 왜 카드아트 세트에 특히 유리한지 정리.
metadata:
  type: research
  topic: card-art-prompting
  category: summary
  date: 2026-07-06
---

# 리서치: 전문가급 AI 이미지 프롬프트 (카드 아트 세트용)

> Trust Level: L1 (Draft) · 2026-07-06 · @researcher
> 목적: `docs/card-art-prompts.md`(오늘 해볼까 카드 19장 세트)를 전문가 수준으로 끌어올릴 기법 수집.
> 수집 수단: WebSearch ×4, WebFetch ×2(christytuckerlearning, aiarty), twitter-cli search ×2, rdt-cli search ×3.

## 핵심 결론 (한 줄)

**세트 일관성은 "좋은 프롬프트 한 줄"이 아니라 "히어로 1장을 먼저 확정→그걸 스타일 앵커로 나머지를 찍는 워크플로우"다.** 우리는 뒷면 1장을 히어로로 삼으면 된다.

## 발견 1 — 일관성 = 워크플로우 (모든 소스 공통)

- **프로의 표준 절차**: 첫 이미지를 뽑아 다듬고, *그 한 장을 스타일 레퍼런스로* 나머지 전부에 재사용. "the simplest and fastest method"로 반복 언급됨.
- 툴별 구현:
  - **Midjourney**: `--sref <히어로 이미지 URL 또는 스타일코드>` 뒤에 붙임. 참조는 **1~3개까지만**(많으면 시그널이 섞여 스타일이 묽어짐). `--cw`(character weight)·`--sw`(style weight)로 강도 조절. `--stylize`는 중간값, `--seed`·`--ar` 고정으로 드리프트 억제.
  - **Nano Banana Pro (Gemini 3 Pro Image)**: 히어로를 **레퍼런스 이미지로 첨부**(최대 14장). 오브젝트 14개·캐릭터 5개까지 동일성 유지 → **자산 세트 일관성엔 현재 가장 강력**. 2~3 변형 뽑아 베스트 선택 권장.
  - **DALL-E 3 / ChatGPT Images**: 자연어형, ChatGPT가 프롬프트를 다시 씀. 레퍼런스 이미지 지원. 글자 삽입은 최강이지만 우리는 글자 금지라 이점 아님.
  - **Flux**: 자연어 지시 준수도 최고, 키워드 스터핑 의존 낮음 → 정밀한 지시가 필요할 때.

## 발견 2 — 골드 라인 타로 공식 (커뮤니티 검증)

실제 MJ 타로덱에서 반복 사용되는 스타일 꼬리표:
```
… Black paper with intricate and vibrant Gold line work, decorated border --ar 9:16
```
→ 우리 `STYLE_BLOCK`(다크+골드 인그레이빙)과 **정확히 일치**. 즉 우리 방향은 이미 커뮤니티가 검증한 포뮬러다. 타로 표준 비율은 **--ar 3:5 또는 9:16**(우리 300:485 ≈ 5:8, 3:5에 근접).

## 발견 3 — 아이콘 세트 라인 공식

```
[매체] line icon, [스트로크], [주제], [주색] with [강조색] accents, [배경]
예) "Hand drawn line icon, thick marker strokes, a person climbing a mountain with a flag, navy blue with orange accents, white background"
```
- 첫 아이콘 확정 → `--sref`로 나머지. 저자도 "그래도 라인 스타일 미세 불일치는 남아 수작업 보정 필요"라고 인정 → **완벽 자동 통일은 환상, 큐레이션·보정 전제**.

## 발견 4 — 구조화 프롬프트 공식

- **CRAFT**: Context(주제+배경) → Rendering(화풍·매체) → Atmosphere(무드·조명) → Fidelity(구도·카메라) → Tool(파라미터·네거티브).
- **Nano Banana 구조**: `[주제+형용사] doing [행동] in [맥락], [구도/앵글], [조명/분위기], [스타일/매체], [특정 제약(글자 등)]`.
- 공통: **스타일 가이드를 먼저 정의**(팔레트·조명·구도 규칙) → 전 컷에 동일 적용. 우리는 Moonlight 토큰이 이미 스타일 가이드.

## 발견 5 — 드리프트/품질 통제 체크리스트

- seed·aspect ratio 고정 / stylize 중간 / 참조 1~3개 / **한 세트는 한 세션에서 배치 생성** / 상위 10~20%만 큐레이션 / 수작업 보정 전제 / 멀티모델 교차(같은 프롬프트를 MJ·Flux·Nano Banana에 돌려 자산별 베스트 채택).

## 오늘 해볼까에 적용할 액션 (→ docs/card-art-prompts.md 반영)

1. **뒷면을 "히어로"로 최우선 확정** → 스타일 앵커. 이후 축 6·분야 10은 뒷면을 `--sref`(MJ)/레퍼런스 첨부(Nano Banana)로.
2. STYLE_BLOCK에 커뮤니티 검증 문구("Black paper with vibrant gold line work, decorated border") 반영.
3. 툴별 문법 변형(MJ `--sref/--ar/--stylize/--seed`, Nano Banana 레퍼런스 첨부, Flux 자연어) 병기.
4. 세트는 한 세션 배치 + 상위 큐레이션 + 수작업 보정 단계 명시.

## 발견 6 — GPT Image 2.0 (`gpt-image-2`)가 우리 세트에 특히 강한 이유 (2026-07-06 추가)

> 2026-04-21 출시. `gpt-image-2`(alias `chatgpt-image-latest`). 출시 12시간 만에 Image Arena 1위(+242, 역대 최대 격차).

- **★ Thinking 모드 = 한 프롬프트로 최대 8장 일관 생성.** 축 엠블럼 6개를 *한 번에* 통일된 스타일로 뽑을 수 있음 → MJ의 "히어로→sref 반복"보다 세트에 유리. (Instant=1장, Thinking=Plus/Pro/Business.)
- **10×10 그리드**를 공식적으로 "icon sets with consistent style"에 추천 → 분야 10개는 5×2 그리드 1장으로 뽑아 슬라이스하면 선 굵기 강제 통일.
- **투명 PNG 네이티브**: `transparent PNG background, no background fill` → CSS 틴트에 바로. 우리 아이콘 요구와 정확히 맞음.
- **레퍼런스 이미지 최대 16장**, 인덱스로 지목(`Image 1: … apply style to …`) → 뒷면 스타일 락.
- **프롬프트 규칙**: 앞 단어가 시각 비중 최대 → **비율·스타일을 첫 문장에**. 순서 `배경→주제→디테일→제약`. 네거티브 `NO X, NO Y`. `professional`보다 `editorial`.
- **주의**: 간판 기능인 "글자 렌더링"은 우리에겐 역효과(엠블럼 글자 0 목표) → 네거티브로 강하게 억제. `input_fidelity`는 gpt-image-2에선 비활성.
- **비용**: quality low $0.006 / medium $0.053 / high $0.211 (per 1024²). 초안 low·medium, 최종만 high. API `n=4` 변형.
- **접근**: ChatGPT(Free 포함·세트는 Thinking=유료), chatgpt.com/images, API, Recraft/Figma/Adobe Firefly 통합.
- → docs §6 "GPT Image 2.0 전용 레시피"로 구체 프롬프트 3종(뒷면/축6 세트/분야10 그리드) 반영.

## 소스

- Midjourney Style Reference (공식): https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference
- Consistent style in Midjourney: https://christytuckerlearning.com/ai-images-with-consistent-style-in-midjourney/
- **Generate icon sets with AI**(정독): https://christytuckerlearning.com/how-to-generate-icon-sets-with-ai/
- SREF 가이드: https://claudioautiero.substack.com/p/midjourney-style-reference-guide-sref
- 타로 프롬프트 25선(골드 라인 공식): https://openart.ai/blog/post/midjourney-prompts-for-tarot-card
- 타로 프롬프트 가이드(정독): https://www.aiarty.com/midjourney-prompts/midjourney-tarot-card-prompts.htm
- Nano Banana Pro 공식 프롬프트 팁: https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/
- Nano Banana 프롬프트 가이드(Google Cloud): https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana
- 2026 프롬프트 엔지니어링 가이드: https://insights.vanikya.ai/prompt-engineering-ai-image-generation-2026/
- 모델 비교(MJ vs DALL-E vs Flux): https://precisionaiacademy.com/blog/ai-image-generation-2026
- Twitter 실사용례: @michaelrabone(MJ 8.1 `--sref 1852485870`), @gensou_ai_(`--sref`+`--cw` 강도조절), @craftian_keskin(스타일코드 공유)
- Reddit 신호: r/midjourney "Trouble with Consistent Icon Creation", r/GeminiAI "30 Nano Banana prompts for infographics"(^112), r/HollowKnight 78장 타로덱 OC(^2259) — 세트 제작 실증
- **GPT Image 2.0 공식 쿡북**(정독): https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- **ChatGPT Images 2.0 필드 가이드**(rdt read, r/promptingmagic ^71): https://reddit.com/r/promptingmagic/comments/1ss8j4e/
- GPT Image 2 리뷰·80프롬프트: https://pixverse.ai/en/blog/gpt-image-2-review-and-prompt-guide
- GPT-Image-2 7 기법: https://framia.converge.ai/page/en-US/blog/gpt-image-2-prompt-guide
- ChatGPT Images 2.0 개요: https://morphic.com/resources/how-to/chatgpt-images-2.0-guide

## 미수집(사유)

- Reddit 검색 관련도 낮음(디코 검색 API 특성) → 정독 대상 스레드는 링크만 확보, 본문 미수집. 필요 시 `rdt read <ID> --json`로 후속.
- YouTube 튜토리얼 transcript: 시간 대비 저효율 판단해 스킵.
