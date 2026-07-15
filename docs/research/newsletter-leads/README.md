---
name: research--newsletter-leads
description: 뉴스레터에서 발견한 제품·메커니즘을 8,406개 원본 전수 심사와 분리해 기록하는 외부 발견 큐. 뉴스레터는 카드 원본이 아니라 발견·한국 맥락 보조 근거다.
metadata:
  type: dataset
  topic: idea-lab-newsletter-intake
  category: research
  date: 2026-07-14
---

# Newsletter Idea Leads

이 폴더는 뉴스레터에서 발견한 사례를 **카드 후보로 바로 승격하지 않고** 안전하게 보관하는 입구다. `newsletter-leads.jsonl`의 한 줄은 "이 사례를 다시 확인할 가치가 있는가"에 대한 기록이지, 앱에 넣을 원본의 승인 기록이 아니다.

## 가장 중요한 분리 원칙

- 이 큐의 모든 행은 `denominator_effect: 0`이다. 따라서 `idea-source-coverage.jsonl`의 **8,406개 분모**, EXH 배치, 전수 판정 통계에 절대 들어가지 않는다.
- 뉴스레터는 발견·시장 맥락·한국어 표현의 보조 근거다. 앱 원본은 반드시 공식 제품 페이지, App Store, Chrome Web Store, TrustMRR 같은 1차 원문으로 다시 확인한다.
- `canonical_source_key`는 8,406개 안의 **같은 제품 원본**을 정확히 찾았을 때만 쓴다. 비슷한 제품이나 같은 메커니즘은 `comparison_source_key`로만 남긴다.
- `Candidate`는 이 큐에서 허용하지 않는다. `Hold`를 1차 원문으로 확인한 뒤에만 별도 후보 배치와 3×3×3의 27개 조합 감사로 보낸다.
- `Merge`는 새 원본 수가 아니다. 기존 시나리오의 결제자·순간·한 끗 문구 재료인지 검토할 수 있을 뿐이다.
- `Fail`은 이름을 바꿔 다시 열지 않는다. 새롭고 다른 입력→처리→결과가 실제로 확인될 때만 새 리드로 기록한다.

## 들어오는 뉴스레터의 역할

| 출처 | 이 큐에서 하는 일 | 단독으로 할 수 없는 일 |
| --- | --- | --- |
| [Solo Business Night](https://solobiznight.com/) | 실제 1인 제품의 원본 링크·메커니즘을 찾는다. | 매출·바이럴만으로 카드 승격 |
| [050 SaaS](https://insighter050.substack.com/) | 한국 B2B 결제자·구매 순간·유통 맥락을 보강한다. | 인용된 제품을 원본 확인 없이 Candidate 처리 |
| [조쉬의 뉴스레터](https://maily.so/josh) | 국내/해외 제품 사례와 제품 링크를 발견한다. | "ChatGPT 보조" 같은 범용 표현을 그대로 카드화 |
| [주간 SaaS](https://maily.so/saascenter) | B2B SaaS의 구매자·기술 경계를 이해한다. | 대형 아키텍처 글을 2일 MVP 원본으로 오인 |
| [HOW TO 1000 LABS](https://maily.so/howto1000labs) | 초기 고객을 찾을 수 있는 채널·도메인 맥락을 본다. | 성장 사례를 제품 원본으로 처리 |
| [언섹시 비즈니스](https://maily.so/unsexybusinesskr) | 한국의 좁은 업종·결제 신호를 발견한다. | 양면 마켓·현장 대행을 디지털 MVP로 오인 |
| [Lenny's Newsletter](https://www.lennysnewsletter.com/) | 제품 운영 패턴과 원본 제품 링크를 발견한다. | 인터뷰·빌더 운영 방식을 제품 원본으로 처리 |

## 한 줄의 흐름

```text
뉴스레터 사례 발견
  → 이 큐에 Hold / Merge / Fail로 기록
  → 공식 원문에서 입력 → 처리 → 즉시 결과 확인
  → 8,406개 정확 일치면 해당 EXH 판정을 따른다
  → 외부 새 원본이면 전수 심사 완료 뒤 별도 후보 배치로 이동
  → 27개 조합·UX 감사 통과 뒤에만 앱 데이터 변경
```

## 필드 요약

| 필드 | 뜻 |
| --- | --- |
| `lead_id` | 뉴스레터 전용의 안정적인 식별자 |
| `queue_scope` / `denominator_effect` | 전수 심사와 분리됐음을 기계적으로 보장하는 안전장치 |
| `newsletter` | 발견한 글과 근거 위치 |
| `mechanism` | 원문에서 확인한 입력→처리→결과. 미확인이면 `primary_source_needed`를 쓴다. |
| `corpus_link` | 정확 일치·비교용 유사 원본·기존 앱 Merge 여부 |
| `preliminary` | 지금 닫을지, 원문을 더 확인할지. 여기서는 Candidate 금지 |

## 검증

```bash
node scripts/research/verify-newsletter-idea-leads.mjs
```

검증기는 행 중복, 분모 오염, 허용되지 않은 `Candidate`, 잘못된 8,406개 키 참조를 막는다. 이 검증이 통과해도 앱 카드 품질이나 27조합 통과를 뜻하지 않는다.
