# 라이브 기반 그로스 모델 원본 리서치

> 개념별 최초 원형, 실리콘밸리 적용·대중화자, 증거 등급은 [ORIGIN-LINEAGE.md](./ORIGIN-LINEAGE.md)에 정리했다.

## 결론

라이브의 그로스 모델 지식은 하나의 단일 프레임워크가 아니라 다음 계층의 종합이다.

```text
고객 생애주기 언어: AARRR
  → 사용자 증감 회계: Growth Accounting
  → 상태와 전이: Zynga → MyFitnessPal → Duolingo Markov Growth Model
  → 팀 목표: North Star와 input metrics
  → 행동 후보: MCC·SHAP·cohort/feature analysis
  → 행동을 팀에 전달: 하길우의 Y–X–Window–Frequency
  → 마케팅 중장기 배분: MMM
```

이 중 `Y–X–Window–Frequency`와 3-step framework는 라이브에서 하길우가 직접 만든 종합이라고 밝혔다. Facebook의 “10 friends in 14 days”는 인접 선례이지 동일 원전이 아니다.

## 라이브의 중요한 타임스탬프

| 시간 | 내용 |
|---|---|
| 01:24:32–01:25:21 | Y–X–Window–Frequency와 Aha Moment의 관계 |
| 01:28:00–01:28:10 | SHAP·Markov·3-step framework |
| 01:32:15–01:32:54 | 조작적 정의와 MCC |
| 01:33:39–01:34:13 | PQ·segment mix·Markov/MAU와 Duolingo |
| 01:35:51–01:36:20 | NAU·RAU 상태 분해 |
| 02:35:53–02:36:32 | B2B 제안에 transition matrix를 적용한 수강생 사례 |
| 03:34:49–03:36:18 | 의미 있게 쪼개고 합치는 것이 모델링의 본질 |
| 03:48:05–03:49:16 | local optimization, Y–X–Window–Frequency, MMM |
| 03:51:35–03:56:33 | North Star·PQ·리텐션·마케팅 세그먼트 |
| 03:57:07–03:58:03 | 현실의 행렬 추상화와 정합성 |

## 가장 강한 원본 자료

1. [Duolingo 공식 Growth Model](https://blog.duolingo.com/growth-model-duolingo/)
   - 모델을 Markov Model로 명시한다.
   - 7개 MECE 상태와 전이확률, 공식 계산식, 민감도 분석, 평균 모델의 한계를 공개한다.
2. [Jorge Mazal의 Duolingo 성장 회고](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
   - 전 CPO가 `Zynga → MyFitnessPal → Duolingo` 계보를 직접 설명한다.
   - CURR 민감도, 팀 조직, leaderboard·notification·streak 실행까지 연결한다.
3. [Jonathan Hsu의 Growth Accounting](https://medium.com/swlh/diligence-at-social-capital-part-1-accounting-for-user-growth-4a8a449fddfc)
   - `MAU = new + retained + resurrected`, quick ratio의 원형을 제시한다.
4. [Tribe Capital의 업데이트된 PMF 정량화](https://tribecap.co/essays/a-quantitative-approach-to-product-market-fit)
   - 사용자와 매출의 growth accounting을 gross retention·net churn까지 확장한다.
5. [Alex Schultz의 Stanford/YC Growth 강의](https://www.youtube.com/watch?v=n_yHZ_vKjno)
   - retention, Facebook activation metric, new/resurrected/churned growth accounting을 당사자가 설명한다.
6. [Amplitude North Star Playbook](https://amplitude.com/books/north-star/about-north-star-framework)
   - North Star를 고객 가치 결과와 3–5개 input metric의 가설 트리로 설명한다.
7. [Reforge Zynga DAU Model artifact](https://www.reforge.com/artifacts/dau-growth-model-using-retention-inputs-at-zynga)
   - CURR/NURR/RURR·DAU/WAU·민감도 레버를 공개 요약한다.
8. [Google Meridian](https://developers.google.com/meridian/docs/basics/meridian-introduction), [Google MMM 논문](https://research.google/pubs/bayesian-methods-for-media-mix-modeling-with-carryover-and-shape-effects/), [Meta Robyn](https://facebookexperimental.github.io/Robyn/docs/analysts-guide-to-MMM/)
   - MMM을 사용자 상태 모델과 구분하고 채널 기여·ROI·예산 배분 모델로 설명한다.

## 중요한 정정

- PQ는 공개 라이브에서 약어를 풀어 정의하지 않았다. Price×Quantity라고 확정하지 않는다.
- MCC의 제품 분석 적용은 Paul Levchuk의 실무자 글과 이를 소개한 Amplitude 글이 공개 근거다. Duolingo 공식 모델과 같은 증거 수준이 아니다.
- SHAP은 예측 설명 도구다. 세그먼트·행동 원인을 증명하지 않는다.
- North Star, Markov user-state model, Growth Accounting, AARRR, MMM은 서로 다른 층이다.

## 수집 방법

- 로컬 SRT: `rg`와 구간 읽기로 타임스탬프 검증
- 웹 탐색·본문: Firecrawl CLI `search`, `scrape`
- Alex Schultz 강의: `yt-dlp --write-auto-subs --sub-lang en --skip-download`

## 미수집·제한

- MyFitnessPal 당시 내부 모델 원문: 공개 검색에서 미확인. Jorge Mazal의 당사자 회고만 확보.
- Zynga 상세 Excel: Reforge 멤버 전용. 공개 설명과 이미지·작성자 정보만 확인.
- Matthews 1975 원 논문 PubMed 본문: CAPTCHA로 직접 수집 실패. 서지·DOI는 PubMed/검색 메타데이터로 확인.
- PQ 약어의 정확한 확장: 공개 라이브와 공개 웹에서 확인하지 못함.

## 스킬 반영 위치

- 상세 지식 지도: `../../../skills/coach-gillwoo/references/growth-model-silicon-valley-sources.md`
- 라이브 타임스탬프: `../../../skills/coach-gillwoo/references/live-class101-ai-da-2026-07-12.md`
