# 레퍼런스: 라이브에서 언급된 그로스 모델과 실리콘밸리 원본 계보

> `coach-gillwoo`가 그로스 모델·Markov chain·전이행렬·리텐션 상태·North Star·MCC·SHAP·MMM 질문에 답할 때 쓰는 근거 지도다. 반드시 **라이브에서 실제로 말한 내용**과 **외부 원본/인접 지식**을 분리한다.

## 1. 조사 기준

- 라이브 SRT에서 키워드와 타임스탬프를 다시 추출했다.
- 외부 자료는 원저자·원회사·공식 문서·원 논문을 우선했다.
- 관계를 세 등급으로 표시한다.
  - **직접 계보**: 당사자가 선행 사례를 가져왔다고 밝히거나 같은 모델을 직접 설명한다.
  - **인접 원형**: 문제 구조가 닮았지만 강의 프레임과 동일하다고 볼 근거는 없다.
  - **강사 자체 종합**: 하길우가 직접 만들거나 종합했다고 밝힌 프레임이다.
- 공개 원문에서 확인할 수 없는 약어는 그럴듯하게 복원하지 않는다.

## 2. 라이브에서 실제로 언급된 지식 지도

| 타임스탬프 | 라이브 언급 | 근거 분류 |
|---|---|---|
| 01:24:32–01:25:21 | `목표 Y를 위한 행동 X를 Window M 기간 내 M번` 수행하게 하는 전략 문장. Aha Moment와 유사하지만 훨씬 상위 집합이라고 설명 | **강사 자체 종합** |
| 01:28:00–01:28:10 | SHAP, Markov chain, 직접 만든 3-step framework를 도구로 언급 | 혼합 |
| 01:32:15–01:32:54 | 행동 X·기간·빈도의 조작적 정의와 MCC 사용 | 외부 통계 도구의 제품 분석 적용 |
| 01:33:39–01:34:13 | PQ, segment mix, Markov/MAU 모델을 소개하고 Duolingo 사례로 종합 | Markov·Duolingo는 직접 계보, PQ는 공개 정의 불충분 |
| 01:35:51–01:36:20 | NAU·RAU 등을 MAU를 쪼개는 조직 공통 언어로 설명 | 성장 회계·상태 분해 계열 |
| 02:35:53–02:36:32 | 수강생이 Markov transition matrix로 행동 X가 상태·목표에 미치는 변화를 Excel에서 시뮬레이션해 B2B 제안에 사용 | 강의 적용 사례 |
| 03:34:49–03:36:18 | 그로스 모델·segment·PQ를 후속 학습 키워드로 제시. 사칙연산보다 의미 있는 단위로 쪼개고 합치는 사고가 본질이라고 설명 | 라이브 해석 |
| 03:48:05–03:49:16 | 로컬 최적화를 벗어나 Y–X–Window–Frequency 큰 그림을 주기적으로 재검토. 마케팅 triangulation과 MMM을 인접 모델로 언급 | 별도 모델 계열 |
| 03:51:35–03:54:30 | 매출 North Star를 구조적으로 분해하지 않으면 작은 ROAS 승리에 매몰될 수 있다고 설명. 마케팅팀 PQ 모델 사례 | 라이브 해석 |
| 03:55:35–03:56:33 | 리텐션을 제품 성장 서사로 보고, 마케팅도 채널·소재·타깃별 장기 리텐션을 봐야 한다고 설명. NA/EA/RA 구분 언급 | 상태·세그먼트 계열 |
| 03:57:07–03:58:03 | 그로스 모델은 현실을 행렬 구조로 표현한 추상화이며, 열 간 정합성과 꼼꼼함이 필요하다고 설명 | 라이브 핵심 정의 |

### 라이브 핵심 문장

```text
그로스 모델은 현실을 예쁘게 설명하는 그림이 아니라,
서로 배타적인 상태와 그 사이의 전이율로 전체 숫자를 다시 조립하여
어느 레버를 움직이면 목표가 얼마나 변하는지 팀에 보여주는 의사결정 도구다.
```

---

## 3. 직접 계보 — Zynga → MyFitnessPal → Duolingo

Duolingo 전 CPO Jorge Mazal의 직접 설명에 따르면 계보는 다음과 같다.

```text
Zynga
  CURR / NURR / RURR 주간 리텐션 상태
    ↓
MyFitnessPal
  미래 시나리오 모델링 + SURR 추가
    ↓
Duolingo
  일 단위 7개 상태 + 전이확률 + 민감도 시뮬레이션
```

### 원본 1 — Jorge Mazal의 Duolingo 회고

- 출처: `https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth`
- 작성자: Jorge Mazal, 당시 Duolingo CPO였던 당사자.
- Zynga가 `CURR / NURR / RURR`, MyFitnessPal이 시나리오 모델과 `SURR`를 사용했다고 직접 회고한다.
- Duolingo는 주 단위 상태를 일 단위로 바꾸고 상태와 전이율을 더 세분화했다.
- 각 전이율을 한 번에 하나씩 일정 폭 움직이고 다른 조건을 고정해 DAU·MAU 민감도를 비교했다.
- CURR의 DAU 영향이 두 번째 레버보다 약 5배 크게 나타나 Retention Team의 집중 지표가 됐다.

### 원본 2 — Duolingo 공식 기술 블로그

- 출처: `https://blog.duolingo.com/growth-model-duolingo/`
- 작성자: Duolingo Data Science 팀의 공식 설명.
- 모델을 명시적으로 **Markov Model**이라고 부른다.
- 과거·현재 모든 학습자를 매일 하나의 상태에만 배정하고 상태 간 전이확률을 관찰한다.

### Duolingo의 7개 상태

| 활성 상태 | 정의 |
|---|---|
| New | 첫 사용일 |
| Current | 오늘 활성이고 최근 6일에도 활성 |
| Reactivated | 7–29일 공백 후 첫 활성 |
| Resurrected | 30일 이상 공백 후 첫 활성 |

| 비활성 상태 | 정의 |
|---|---|
| At-risk WAU | 오늘 비활성이나 최근 6일 안에는 활성 |
| At-risk MAU | 최근 7일은 비활성이나 그 전 23일 안에는 활성 |
| Dormant | 30일 이상 비활성 |

모든 사용자는 매일 정확히 한 상태에 속한다. 상태는 MECE여야 하며, 활성 네 상태의 합이 DAU가 된다.

```text
DAU_t = New_t + Current_t + Reactivated_t + Resurrected_t
```

상태 벡터 관점에서는 다음과 같이 볼 수 있다.

```text
s_t = P_t^T · s_(t-1) + new_t
```

- `s_t`: 시점 t의 상태별 사용자 수
- `P_t`: 상태 간 전이확률 행렬
- `new_t`: 시스템 외부에서 들어오는 신규 사용자

정확한 Duolingo 계산식은 공식 글 Appendix에 공개돼 있다.

### 모델을 의사결정으로 바꾸는 순서

1. 과거 일별 상태 스냅샷으로 전이율을 추정한다.
2. 한 전이율만 움직이고 다른 값은 고정하는 민감도 분석을 한다.
3. 목표 지표에 영향이 큰 레버를 찾는다.
4. 그 레버가 실제 제품 실험으로 움직일 수 있는지 확인한다.
5. 레버를 움직였을 때 상위 지표도 움직이는지 A/B 테스트한다.
6. 예측, 팀 목표, 분석 플랫폼의 공통 차원으로 모델을 재사용한다.

Duolingo는 상관만 보고 CURR를 확정하지 않았다. `CURR가 움직이는가`와 `CURR가 움직이면 DAU도 움직이는가`를 실험으로 검증했다.

### 모델의 한계도 공식 글에 포함돼 있다

- 90%의 DAU가 Current 상태에 들어가자 다시 큰 평균 덩어리가 됐다.
- Top-down 상태 정의는 팀의 선입견을 모델에 넣는다.
- Duolingo는 이를 보완하기 위해 bottom-up 비지도 세그먼테이션을 탐색했다.

즉, 상태 모델은 영구 정답이 아니라 현재 전략에 유용한 추상화다.

### Zynga 공개 보강 자료

- Reforge artifact: `https://www.reforge.com/artifacts/dau-growth-model-using-retention-inputs-at-zynga`
- Zynga에서 만든 공개 artifact가 `CURR/NURR/RURR`, DAU/WAU, 입력 레버와 민감도를 사용한다고 명시한다.
- 다만 상세 시트는 멤버 전용이다. 공개 설명과 이미지만 확인 가능하다.
- MyFitnessPal의 당시 내부 원본 문서는 공개 검색에서 찾지 못했다. MyFitnessPal 계보는 Jorge Mazal의 직접 경력 회고가 가장 강한 공개 근거다.

---

## 4. 더 오래된 원형 — Facebook과 Growth Accounting

### Alex Schultz의 Facebook/Stanford 강의

- 영상: `https://www.youtube.com/watch?v=n_yHZ_vKjno`
- 발표자: Alex Schultz, 당시 Facebook VP of Growth.
- (00:09:53) 지속 가능한 성장에서 retention을 가장 중요한 축으로 설명한다.
- (00:17:33) Facebook의 “10 friends in 14 days”를 사용자에게 핵심 가치를 경험시키는 집중 지표로 설명한다.
- (00:20:29) Facebook growth accounting에서 new, resurrected, churned 사용자를 나눠 봤다고 설명한다.

이것은 하길우의 `Y–X–Window–Frequency`와 구조적으로 닮았지만 동일 프레임은 아니다.

| Facebook 사례 | 라이브 종합 프레임 |
|---|---|
| Y: 장기 활성/리텐션 | Y: 원하는 비즈니스 결과 |
| X: 친구 연결 | X: 조작 가능한 행동 |
| Window: 가입 후 14일 | Window: 제품 자연 주기에 맞춘 기간 |
| Frequency/threshold: 친구 10명 | Frequency: M회 |

강의에서는 3-step framework를 하길우가 만든 말이라고 직접 밝혔다. 따라서 Facebook을 원저자로 붙이지 않는다. **인접한 실리콘밸리 활성화 선례**로만 연결한다.

### Jonathan Hsu의 Growth Accounting

- 원문: `https://medium.com/swlh/diligence-at-social-capital-part-1-accounting-for-user-growth-4a8a449fddfc`
- 업데이트: `https://tribecap.co/essays/a-quantitative-approach-to-product-market-fit`
- 작성자: Jonathan Hsu, 당시 Social Capital 데이터 리더, 이후 Tribe Capital 공동창업자.

```text
MAU_t = New_t + Retained_t + Resurrected_t
MAU_(t-1) = Retained_t + Churned_t

ΔMAU = New_t + Resurrected_t - Churned_t
Quick Ratio = (New_t + Resurrected_t) / Churned_t
```

이 모델의 가치는 같은 MAU 성장률이라도 신규 유입으로 누수를 덮는 제품과 높은 리텐션으로 성장하는 제품을 구분하는 데 있다.

### Duolingo와의 차이

- Growth Accounting은 기간 간 사용자 증감을 회계 항등식으로 분해한다.
- Duolingo Growth Model은 더 세밀한 상태와 일별 전이확률을 둬 미래 시나리오를 계산한다.
- 전자는 건강 상태 진단에 강하고, 후자는 레버 민감도와 시뮬레이션에 더 직접적이다.

---

## 5. AARRR는 그로스 모델이 아니라 퍼널 언어다

- 원본: Dave McClure, `Startup Metrics for Pirates`, `https://www.slideshare.net/slideshow/startup-metrics-for-pirates-long-version/89026`
- Acquisition, Activation, Retention, Referral, Revenue의 고객 생애주기 전환을 본다.
- 라이브에서 AARRR는 획득·활성화·리텐션의 역할 경계를 설명하는 언어로 등장했다.
- AARRR 자체에는 상태 전이행렬, 미래 예측, 민감도 분석이 없다.

```text
AARRR = 어디를 볼지 정하는 퍼널
Growth Accounting = 숫자가 왜 늘고 줄었는지 분해하는 항등식
Markov Growth Model = 사용자가 상태 사이에서 어떻게 움직이는지 시뮬레이션
```

세 개를 같은 모델로 섞지 않는다.

---

## 6. North Star — 상위 결과와 입력 레버를 연결하는 구조

- Amplitude North Star Playbook: `https://amplitude.com/books/north-star/about-north-star-framework`
- North Star는 고객이 제품에서 얻는 가치를 가장 잘 나타내는 단일 rate/count/ratio다.
- 입력 지표 3–5개가 North Star를 만든다는 가설 트리를 함께 둔다.
- 좋은 North Star는 팀이 직접 숫자를 조작하는 지표가 아니라, 여러 입력이 함께 움직여야 변하는 한 단계 바깥의 결과다.

### Duolingo에서의 위치

- 회사 Top-line은 DAU였다.
- Markov 민감도 분석으로 CURR가 DAU에 가장 강한 레버임을 찾았다.
- Retention Team에는 CURR를 North Star로 부여했다.

따라서 `North Star = 무조건 전사 지표 하나`라고 단순화하지 않는다. 조직 수준과 의사결정 범위를 표시한다.

---

## 7. MCC — 행동 X 후보와 리텐션의 이진 연관을 보는 도구

라이브에서는 MCC를 수식으로 다루는 몇 안 되는 도구이며, 행동 X의 조작적 정의 다음에 배운다고 설명했다.

### 원래 통계량

- Matthews Correlation Coefficient는 두 이진 변수의 상관을 confusion matrix 네 칸으로 요약한다.
- 원 논문: B. W. Matthews (1975), DOI `10.1016/0005-2795(75)90109-9`, PubMed `https://pubmed.ncbi.nlm.nih.gov/1180967/`.

```text
MCC = (TP·TN - FP·FN)
      / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))
```

- 범위는 -1부터 1이다.
- 제품 분석에서는 `행동 X 수행 여부`와 `후속 리텐션 여부`를 두 이진 변수로 놓을 수 있다.

### 제품 분석 적용의 공개 근거

- Paul Levchuk: `https://medium.com/@paul.levchuk/product-feature-retention-deep-dive-mcc-coefficient-3e04150e56f7`
- Amplitude가 이 접근을 소개: `https://amplitude.com/blog/ultimate-guide-product-feature-analysis`
- 인기 기능은 상단 퍼널에 노출돼 사용량은 많아도 리텐션과 음의 관계일 수 있으므로 사용량만으로 행동 X를 고르면 안 된다는 문제를 다룬다.

### 방어선

- MCC는 연관성이다. 행동 X가 리텐션을 만들었다는 인과 증거가 아니다.
- 자기선택, 기존 사용자 품질, 노출 기회, 생존자 편향을 통제해야 한다.
- 후보 탐색 뒤 cohort 비교·matched analysis·실험으로 검증한다.
- 제품 분석에 MCC를 적용한 공개 자료는 실무자 기고가 중심이다. Duolingo Markov 모델처럼 한 회사의 공식 핵심 프레임과 같은 증거 수준으로 다루지 않는다.

---

## 8. SHAP — 원인 발굴기가 아니라 예측 모델 해석기다

- 원 논문: Lundberg & Lee, “A Unified Approach to Interpreting Model Predictions”, NeurIPS 2017.
- URL: `https://proceedings.neurips.cc/paper/7062-a-unified-approach-to-interpreting-model-predictions.pdf`
- SHAP은 예측값에 각 feature가 기여한 정도를 Shapley value 관점으로 설명한다.

라이브/공개 글에서는 성공률에 영향을 주는 세그먼트 축의 가설을 얻는 용도로 등장한다.

### 방어선

- 중요 feature가 개입 가능한 레버라는 뜻은 아니다.
- feature importance는 인과효과가 아니다.
- 미래 정보가 들어간 leakage와 사후 변수인지 확인한다.
- SHAP으로 Who 후보를 찾고, 메커니즘·시간 순서·실험으로 Why를 검증한다.

---

## 9. PQ·Segment Mix — 공개 정의의 한계

- 라이브는 `PQ 모델링`, `segment mix modeling`, `MAU/Markov modeling`을 세 모델로 열거했다.
- PQ는 사칙연산으로 만들 수 있고 마케팅 매출 모델 사례에 썼다고 했지만, 이 라이브에서는 P와 Q의 정식 정의를 풀어 말하지 않았다.
- 공개 검색에서도 하길우가 말한 정확한 `PQ 모델링`과 일치하는 실리콘밸리 표준 원전을 찾지 못했다.

따라서 다음을 금지한다.

- P를 Price, Q를 Quantity라고 확정하기.
- Price–Volume–Mix 분석을 동일 원전이라고 단정하기.
- Segment Mix를 특정 회사의 표준 모델로 귀속하기.

안전한 표현은 다음과 같다.

> 라이브에서 PQ는 상위 결과를 곱셈·덧셈 가능한 입력으로 분해하는 단순 모델 계열로 소개됐지만, 약어의 정확한 확장은 공개 라이브만으로 확인되지 않는다.

강의 자료나 본 과정 시트가 확보되면 정의를 갱신한다.

---

## 10. MMM은 사용자 상태 모델과 다른 모델 계열이다

라이브는 마케팅의 단기 로컬 최적화와 중장기 큰 그림을 대비하며 triangulation과 MMM을 언급했다.

### Google Meridian

- 공식 문서: `https://developers.google.com/meridian/docs/basics/meridian-introduction`
- 채널별 기여·ROI·response curve·미래 예산 배분을 추정하는 Bayesian MMM이다.
- lag, saturation, confounder, geo-level variation, prior를 다룬다.
- 시나리오 계획과 budget optimization을 제공한다.

### Google 원 논문

- `https://research.google/pubs/bayesian-methods-for-media-mix-modeling-with-carryover-and-shape-effects/`
- 광고의 carryover와 diminishing returns를 유연한 함수로 모델링한다.
- 데이터가 작을 때 prior가 posterior를 크게 좌우하고 편향될 수 있음을 경고한다.

### Meta Robyn

- 공식 가이드: `https://facebookexperimental.github.io/Robyn/docs/analysts-guide-to-MMM/`
- 집계 시계열로 마케팅·비마케팅 요인이 KPI에 미친 incremental sales impact와 ROI를 추정한다.
- 데이터 수집·검토·반복 모델링·의사결정 질문 정의를 별도 단계로 강조한다.

### Markov Growth Model과의 차이

| Markov user-state model | MMM |
|---|---|
| 사용자 상태와 전이 | 채널 지출·외부 요인과 KPI |
| 개별/코호트 행동 데이터 | 집계 시계열·지역 데이터 |
| 리텐션·활성·부활 레버 | 채널 기여·ROI·예산 배분 |
| 상태 전이 시뮬레이션 | 회귀·Bayesian causal inference |

두 모델 모두 현실을 구조화하지만 데이터 생성 과정과 의사결정이 다르다.

---

## 11. 실무 구축 체크리스트

### A. 목적과 정의

1. 어떤 결정을 바꾸기 위한 모델인가?
2. Top-line Y는 고객 가치·사업 결과와 어떻게 연결되는가?
3. `active`, `new`, `current`, `reactivated`, `resurrected`, `dormant`의 기간 정의는 무엇인가?
4. 제품의 자연 사용 주기에 맞는 일/주/월 단위는 무엇인가?

### B. 상태 모델

1. 모든 사용자가 정확히 한 상태에 속하는가?
2. 신규 유입을 제외하고 상태 흐름이 보존되는가?
3. 계정 aliasing·기기 변경·익명 사용자를 처리했는가?
4. 전이행렬 각 행의 합이 1인가?
5. 실제 과거 데이터를 재현하는지 backtest했는가?

### C. 레버 선택

1. 레버를 같은 폭으로 움직이는 민감도 분석을 했는가?
2. 상위 지표 영향과 실제 이동 가능성을 분리했는가?
3. 세그먼트 평균이 병목을 숨기지 않는가?
4. 상관 레버를 실험으로 검증했는가?

### D. 의사결정 전달

```text
현재 상태: [상태별 규모와 전이율]
목표 Y: [상위 지표]
핵심 레버: [전이율]
행동 X: [제품·운영 개입]
시나리오: [전이율 Δ → Y의 예상 Δ]
검증: [실험·holdout·backtest]
틀렸을 때: [상태 정의 / 전이 가정 / 행동 메커니즘 중 돌아갈 곳]
```

모델 이름을 경영진에게 설명하는 것이 목적이 아니다. 어떤 행동을 하면 어느 상태 전이가 바뀌고, 그 결과 목표가 얼마나 달라지는지를 보여준다.

---

## 12. 근거 수준 표

| 자료 | 유형 | 근거 수준 | 사용 범위 |
|---|---|---|---|
| Duolingo 공식 Growth Model | 회사 공식 | A | 상태·전이·수식·민감도·한계 |
| Jorge Mazal 회고 | 당사자 원문 | A | Zynga→MyFitnessPal→Duolingo 계보와 실행 |
| Alex Schultz Stanford/YC 강의 | 당사자 강의 | A | Facebook activation·growth accounting |
| Jonathan Hsu Social Capital/Tribe | 원저자 글 | A | Growth Accounting·PMF |
| Reforge Zynga artifact | 회사/실무자 artifact | A- | Zynga 모델 공개 보강, 상세 시트는 제한 |
| Amplitude North Star Playbook | 공식 | A | North Star와 입력 트리 |
| MCC 원 논문 | 원 논문 | A | 통계량의 정의만 |
| Paul Levchuk + Amplitude MCC 소개 | 실무자 글 + 플랫폼 소개 | B | 제품 feature-retention 적용 |
| SHAP NeurIPS 논문 | 원 논문 | A | 예측 설명 방법의 정의 |
| Google Meridian/Google Research | 공식/원 논문 | A | MMM·carryover·saturation·causal assumptions |
| Meta Robyn | 공식 | A | MMM 실행 과정·ROI·집계 모델 |

## 13. 응답 계약

그로스 모델 질문에는 다음 형식을 지킨다.

```markdown
### 라이브에서 실제로 한 말
[타임스탬프와 요약]

### 원본 계보
[원저자·원회사·공식 URL]

### 같은 것 / 인접한 것 / 하길우의 종합
- 같은 것:
- 인접한 것:
- 자체 종합:

### 실무 적용
[정의 → 모델 → 검증 → 결정]

### 과대해석 방지
[상관/인과, 상태 정의, 데이터 한계]
```

원본이 확인되지 않은 항목은 `공개 원본 미확인`으로 표시하고 유사 개념으로 빈칸을 채우지 않는다.
