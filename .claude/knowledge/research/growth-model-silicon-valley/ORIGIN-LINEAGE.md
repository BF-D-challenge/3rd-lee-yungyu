# 라이브 개념의 원형과 실리콘밸리 계보

조사일: 2026-07-13  
대상: CLASS101 라이브 `AI 시대, DA로 살아남는 법` 화자 분리 대본

## 한 문장 결론

라이브의 지식은 한 명의 실리콘밸리 구루가 만든 단일 프레임워크가 아니다. **Markov·조작적 정의·Shapley value·MCC 같은 오래된 학술 원형**, **Facebook·Social Capital·Zynga·MyFitnessPal·Duolingo가 만든 제품 성장 실무**, 그리고 **하길우가 이를 Y–X–Window–Frequency와 3-step 흐름으로 재조립한 독자적 종합**의 세 층이다.

가장 직접적인 제품 계보는 다음이다.

```text
Zynga의 CURR/NURR/RURR 주간 리텐션 모델
  → MyFitnessPal의 미래 시나리오 모델 + SURR
  → Duolingo의 일 단위 7상태 Markov Growth Model
  → 민감도 분석으로 CURR를 선택하고 실험으로 DAU 영향을 검증
```

이 계보는 Duolingo 전 CPO Jorge Mazal의 [당사자 회고](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)와 [Duolingo 공식 설명](https://blog.duolingo.com/growth-model-duolingo/)이 서로 맞물려 증명한다.

## 먼저 분리해야 할 네 가지

| 질문 | 뜻 | 이 조사에서의 예 |
|---|---|---|
| 최초 원형은 누가 만들었나? | 수학·통계·과학 개념의 시작 | Markov, Bridgman, Shapley, Matthews |
| 제품에 먼저 적용한 조직은 어디인가? | 제품 행동과 성장 지표로 번역 | Zynga, Facebook, Social Capital |
| 공개적으로 퍼뜨린 사람은 누구인가? | 글·강연·플레이북으로 전파 | Alex Schultz, Jonathan Hsu, Jorge Mazal, Sean Ellis, Amplitude |
| 라이브 프레임의 저자는 누구인가? | 여러 도구를 한 의사결정 흐름으로 조립 | 하길우 |

이 구분 없이 모두를 “실리콘밸리 원본”이라고 부르면 계보가 틀어진다.

## 개념별 판정표

등급은 `A=원논문·당사자·회사 공식`, `B=신뢰할 만한 실무자 공개 자료`, `U=공개 검증 불가`다.

| 라이브 개념 | 더 오래된 원형 | 실리콘밸리 적용·대중화 | 라이브와의 관계 | 판정 |
|---|---|---|---|---|
| Y–X–Window–Frequency | 목표-선행행동-기간-임계값이라는 일반 측정 구조 | Facebook의 `10 friends in 14 days`를 Zuckerberg가 말했고 Alex Schultz가 2014년 공개 강의에서 설명 | 구조가 닮은 **인접 선례**. 라이브의 3-step은 하길우가 만들었다고 직접 말함 | A |
| Growth Model | 상태 분해, 회계 항등식, Markov process | Zynga → MyFitnessPal → Duolingo | 가장 강한 **직접 계보** | A |
| Markov chain·전이행렬 | Andrey Markov의 1906년 종속 사건 연구 | Duolingo가 사용자 상태 모델로 명시적 적용 | 수학 원형 + 직접 제품 적용 | A |
| Growth Accounting·MAU 분해 | 회계식 분해라는 일반 사고 | Jonathan Hsu/Social Capital, 2015. Quick Ratio 명칭은 Mamoon Hamid의 2015년 덱을 인용 | NAU/RAU·MAU 상태 분해의 강한 인접 원형 | A |
| North Star Metric | OMTM·핵심 가치 지표 등 선행 문법 | Facebook growth practice, Ed Baker·Uber 사례, Sean Ellis, Amplitude의 프레임워크화 | Y와 팀 정렬을 설명하는 인접·보완 계열 | A-/B |
| SHAP | Lloyd Shapley의 1952 RAND 메모·1953년 Shapley value | Lundberg & Lee가 2017년 SHAP으로 ML 예측 해석에 적용 | X 후보 발굴 도구. **원인 증명 도구 아님** | A |
| MCC | 2×2 이진 상관 계열, B. W. Matthews의 1975년 논문에서 현재 명칭의 원형 | Paul Levchuk가 2022년 기능 사용-리텐션 분석에 적용, Amplitude가 소개 | X와 후속 결과의 이진 연관 탐색 | A(통계), B(제품 적용) |
| 조작적 정의 | P. W. Bridgman, 1927, *The Logic of Modern Physics* | 제품 분석에서 이벤트·행동을 측정 가능하게 정의하는 일반 실무로 흡수 | 학술 원형은 명확하나 하길우의 3-step 배열은 독자적 | A |
| AARRR | 고객 생애주기·퍼널 사고 | Dave McClure, 2007 `Startup Metrics for Pirates` | Activation·Retention·Referral의 언어. 전이 모델 자체는 아님 | A |
| Viral loop | 네트워크 확산·초대 메커니즘 | Andrew Chen이 2007년경 공개적으로 체계화. 글에서 Jia Shen의 선행 언급도 인정 | 바이럴 플레이북의 인접 원형, 최초 발명자로 단정 불가 | B |
| OMTM | 집중 지표·제약 이론과 가까운 일반 사고 | Alistair Croll·Benjamin Yoskovitz, *Lean Analytics*, 2013 | North Star의 가까운 선행 문법이지만 동일 개념은 아님 | A |
| MMM | 1960년대부터의 마케팅·계량경제 회귀 | Meta Robyn, Google Meridian이 현대 오픈소스 실행 체계로 대중화 | 사용자 상태 모델과 별도 계열 | A |
| PQ modeling | 공개 라이브에서 P와 Q를 풀어 정의하지 않음 | 일치하는 제품 분석 표준 원전을 찾지 못함 | 하길우의 실무 분해 템플릿일 가능성이 높지만 확정 불가 | U |
| Segment Mix modeling | 구성비·mix-shift 분해라는 일반 분석 계열 | 일치하는 단일 실리콘밸리 원전 없음 | 강의 템플릿의 정확한 규격은 비공개 | U |
| NAU·RAU | New/Retained/Reactivated/Resurrected 사용자 분해 계열 | Social Capital·Zynga·MyFitnessPal·Duolingo의 상태 언어가 가장 가까움 | 정확한 약어 정의가 공개되지 않아 1:1 동일시 금지 | U/A(인접 계보) |

## 1. Y–X–Window–Frequency의 가장 가까운 공개 선례

라이브에서 하길우는 다음 흐름을 제시한다.

- `01:30:46–01:31:55`: 목표 Y를 정한 뒤 SHAP으로 행동 X 후보를 찾는 흐름
- `01:32:15–01:32:29`: X를 일정 기간 안에 일정 횟수 수행하도록 정의하고, 이 흐름을 자신이 만든 3-step framework라고 설명
- `01:32:43–01:32:54`: X의 조작적 정의 다음에 MCC를 사용

가장 가까운 공개 사례는 Facebook의 activation metric이다. Alex Schultz는 [YC/Stanford 강의](https://www.youtube.com/watch?v=n_yHZ_vKjno&t=1053s)에서 Zuckerberg가 YC에서 `가입 후 14일 안에 친구 10명`을 말했고, Facebook이 그 지표에 집중한 이유는 친구 연결이 뉴스피드와 재방문의 핵심 가치를 만들기 때문이라고 설명한다.

```text
Facebook 공개 사례
Y: 장기 활성·재방문
X: 친구 연결
Window: 가입 후 14일
Threshold: 친구 10명
```

다만 이것을 하길우 프레임의 원전이라고 단정할 수는 없다. Facebook은 특정 제품의 activation inflection metric이고, 하길우는 Y·X 발굴, 조작적 정의, 빈도·기간, 모델링, 설득까지 묶은 일반 의사결정 프로세스다.

또한 공개 자료에는 `7 friends in 10 days` 변형도 있다. [Amplitude 글](https://amplitude.com/blog/product-north-star-metric)은 이 버전을 소개한다. 따라서 숫자를 Facebook의 단일한 역사적 진실처럼 쓰지 말고 **공개 회고마다 수치가 다르다**고 밝혀야 한다.

## 2. Growth Model의 직접 계보

### Zynga

Zynga는 주간 리텐션을 다음 세 전이율로 분해했다.

- `CURR`: 직전 기간의 current user가 다시 current로 남는 비율
- `NURR`: 신규 사용자가 다음 기간에도 돌아오는 비율
- `RURR`: reactivated 사용자가 다음 기간에도 돌아오는 비율

[Reforge의 Zynga artifact](https://www.reforge.com/artifacts/dau-growth-model-using-retention-inputs-at-zynga)는 이를 “Created at Zynga”라고 명시하지만, 공개 페이지는 조직 내부의 최초 개인 발명자를 특정하지 않는다. 따라서 `Zynga가 만들었다`까지는 말할 수 있어도 특정 개인을 창시자로 붙이면 안 된다.

### MyFitnessPal

Jorge Mazal은 MyFitnessPal이 Zynga의 모델을 채택해 미래 시나리오에 사용하고 `SURR`, 즉 장기 이탈 뒤 돌아온 resurrected user의 다음 기간 리텐션을 추가했다고 회고한다. 당시 내부 원문은 공개 검색에서 확인되지 않았으므로 **MyFitnessPal 단계의 가장 강한 근거는 Mazal의 직접 경력 회고**다.

### Duolingo

Mazal과 Duolingo 팀은 주 단위를 일 단위로 바꾸고 7개 MECE 상태와 전이율로 확장했다. [Duolingo 공식 글](https://blog.duolingo.com/growth-model-duolingo/)은 이를 명시적으로 Markov Model이라고 부른다.

```text
DAU_t = New_t + Current_t + Reactivated_t + Resurrected_t
s_t = P_t^T · s_(t-1) + new_t
```

각 전이율을 따로 2%씩 움직이는 민감도 분석에서 CURR의 DAU 영향이 두 번째 레버보다 약 5배 컸다. 이후 Duolingo는 A/B 테스트로 `CURR가 실제로 움직이는가`와 `CURR를 움직이면 DAU도 움직이는가`를 따로 검증했다. 이것이 단순 상관표가 아니라 의사결정 모델인 이유다.

## 3. Markov는 실리콘밸리에서 시작되지 않았다

[Markov chain의 수학적 시작](https://www.americanscientist.org/article/first-links-in-the-markov-chain)은 Andrey A. Markov가 1906년 독립이 아닌 종속 사건에도 대수의 법칙을 확장하려 한 연구다. 현재 상태만 알면 다음 상태 확률을 기술할 수 있다는 제약이 핵심이다.

Duolingo의 기여는 Markov chain을 발명한 것이 아니라 다음 제품 질문으로 번역한 데 있다.

> 모든 사용자를 오늘 하나의 상태에 넣고, 내일 어떤 상태로 이동할 확률을 알면, 특정 전이율을 바꿀 때 DAU·MAU가 어떻게 변하는지 계산할 수 있는가?

따라서 “Markov Growth Model의 창시자”를 찾는 질문은 둘로 나눠야 한다.

- 수학: Andrey Markov, 1906
- 공개 제품 성장 구현: Zynga → MyFitnessPal → Jorge Mazal과 Duolingo 팀

## 4. MAU 분해와 Growth Accounting

Jonathan Hsu는 2015년 [Social Capital 글](https://medium.com/swlh/diligence-at-social-capital-part-1-accounting-for-user-growth-4a8a449fddfc)에서 사용자 성장을 회계 항등식으로 정리했다.

```text
MAU_t = New_t + Retained_t + Resurrected_t
MAU_(t-1) = Retained_t + Churned_t
ΔMAU = New_t + Resurrected_t - Churned_t
Quick Ratio = (New_t + Resurrected_t) / Churned_t
```

Hsu는 Quick Ratio라는 명칭을 같은 해 Mamoon Hamid의 덱에서 가져왔다고 직접 적었다. 여기서 분리해야 할 점은 다음과 같다.

- Growth Accounting은 “왜 사용자가 늘거나 줄었나”를 기간 간 항등식으로 분해한다.
- Markov Growth Model은 “사용자가 상태 사이에서 어떻게 움직이나”를 전이확률로 시뮬레이션한다.
- 라이브의 NAU·RAU는 이 계열과 가까우나, 공개 대본에서 정확한 정의가 없으므로 같은 약어라고 확정하지 않는다.

## 5. SHAP은 Shapley value에서 왔다

Lloyd Shapley의 [RAND 메모 `A Value for n-Person Games`](https://www.rand.org/content/dam/rand/pubs/papers/2021/P295.pdf)는 1952년 3월 작성됐고, 1953년 출판된 Shapley value의 원형이다. 협력 게임의 전체 성과를 각 참가자의 한계 기여에 따라 배분한다.

Scott Lundberg와 Su-In Lee는 2017년 [SHAP 논문](https://arxiv.org/abs/1705.07874)에서 이 아이디어를 ML 예측 해석으로 옮겼다. 각 feature가 특정 예측값에 기여한 정도를 설명하고 기존 여섯 방법을 한 additive feature-attribution 계열로 통합했다.

라이브의 사용 맥락은 `Y에 기여해 보이는 X 후보를 찾는 것`이다. 안전한 해석은 다음이다.

```text
SHAP → 후보와 가설 생성
시간 순서·노출 기회·교란 검토 → 분석 설계
실험 또는 준실험 → 인과 검증
```

`SHAP 값이 크다 = 그 행동을 시키면 Y가 오른다`는 결론은 틀리다.

## 6. MCC의 원형과 제품 분석 적용

B. W. Matthews의 1975년 논문 [“Comparison of the predicted and observed secondary structure of T4 phage lysozyme”](https://doi.org/10.1016/0005-2795(75)90109-9)은 현재 Matthews Correlation Coefficient라는 이름의 원형이다. 본래 단백질 2차 구조 예측과 관측을 비교하는 이진 분류 문제였다.

```text
MCC = (TP·TN - FP·FN)
      / sqrt((TP+FP)(TP+FN)(TN+FP)(TN+FN))
```

제품 분석으로의 공개 적용은 훨씬 뒤다. Paul Levchuk는 2022년 [기능 사용과 리텐션의 이진 상관 분석](https://medium.com/@paul.levchuk/product-feature-retention-deep-dive-mcc-coefficient-3e04150e56f7)에 MCC를 사용했고, [Amplitude가 이 접근을 소개](https://amplitude.com/blog/ultimate-guide-product-feature-analysis)했다.

즉:

- MCC의 통계적 기원: Matthews, 1975
- 제품 기능-리텐션 분석의 공개 실무 사례: Paul Levchuk, 2022; Amplitude의 후속 확산
- 하길우의 기여: 이를 조작적 정의와 행동 X 발굴 과정 안에 교육적으로 배치

MCC도 상관이다. 사용자가 이미 고품질이어서 X를 쓴 것인지, X가 리텐션을 높였는지는 별도 검증이 필요하다.

## 7. 조작적 정의는 1927년 물리학에서 왔다

[Stanford Encyclopedia of Philosophy의 Operationalism 항목](https://plato.stanford.edu/archives/win2017/entries/operationalism/)은 P. W. Bridgman이 1927년 *The Logic of Modern Physics*에서 개념의 의미를 그것을 측정하는 operations와 연결한 데서 시작됐다고 설명한다.

제품 분석으로 번역하면 다음 질문이 된다.

- `활성 사용자`는 정확히 어떤 이벤트를, 어떤 기간에, 몇 번 한 사람인가?
- `주문 완료`는 결제 요청인가, 승인인가, 배송 완료인가?
- `친구 연결`은 요청 발송인가, 상대 수락인가, 상호 콘텐츠 노출인가?

하길우가 조작적 정의를 만든 것은 아니다. 다만 Y–X–기간–빈도와 MCC·모델링 사이에 조작적 정의를 배치한 3-step 구성은 그의 독자적 교육·실무 종합이다.

## 8. North Star와 OMTM

North Star는 단일 창시자를 확정하기 어렵다. 확보된 일차·당사자 자료가 보여주는 계보는 다음이다.

- Sean Ellis의 [2019년 글](https://medium.com/growthhackers/finding-your-north-star-metric-fc1c1f71cbcb)은 Ed Baker가 Facebook 국제 성장팀에서 North Star 개념을 익혔고 Uber에서 `weekly trips`를 선택했다고 회고한다.
- Sean Ellis는 North Star를 고객이 얻는 가치의 확장을 수량화하는 지표로 설명했다.
- [Amplitude](https://amplitude.com/blog/product-north-star-metric)는 고객 가치·제품 전략·미래 성공의 선행성을 갖춘 단일 지표와 3–5개 input metric 구조로 프레임워크를 체계화했다.
- 그보다 가까운 선행 문법으로 Alistair Croll과 Benjamin Yoskovitz의 2013년 *Lean Analytics*에 나온 [One Metric That Matters](https://leananalyticsbook.com/one-metric-that-matters/)가 있다. OMTM은 단계마다 가장 중요한 하나에 집중하라는 개념이고, North Star는 제품이 제공하는 지속 가능한 고객 가치를 나타내는 장기 방향이라는 차이가 있다.

검색 결과에는 Sean Ellis가 용어를 만들었다는 2차 자료가 많지만, 이번 조사에서는 그 주장을 직접 증명하는 초기 원문을 확보하지 못했다. 따라서 **Sean Ellis가 대중화했다**까지는 강하게 말할 수 있으나 **그가 최초로 용어를 만들었다**고 확정하지 않는다.

## 9. AARRR와 viral loop

Dave McClure는 2007년 Ignite Seattle에서 [Startup Metrics for Pirates](https://www.youtube.com/watch?v=irjgfW0BIrw)를 발표했고, Acquisition–Activation–Retention–Referral–Revenue라는 AARRR 언어를 퍼뜨렸다. AARRR는 사용자 생애주기의 어디가 막혔는지 보는 퍼널이지 상태 전이행렬이나 미래 시뮬레이션이 아니다.

Andrew Chen의 [viral loop 글](https://andrewchen.com/whats-your-viral-loop-understanding-the-engine-of-adoption/)은 초대·위젯·뉴스피드 등 제품 안의 확산 경로를 funnel과 compounding loop로 설명한 초기 공개 글이다. Chen 자신도 이 용어를 오프라인에서 자주 들었고, 검색에서 RockYou 공동창업자 Jia Shen의 선행 언급을 찾았다고 적었다. 따라서 Chen은 강한 초기 대중화자지만 최초 발명자로 단정하지 않는다.

## 10. MMM은 1960년대 계량경제 모델의 현대화다

Google 연구진의 [Challenges and Opportunities in Media Mix Modeling](https://research.google.com/pubs/archive/45998.pdf)은 MMM이 여러 형태로 1960년대부터 존재했다고 정리한다. 집계 시계열로 광고·가격·프로모션·계절성·경쟁 같은 변수가 매출에 미친 영향을 회귀로 추정하는 계열이다.

현대 실리콘밸리의 기여는 발명보다 오픈소스화·자동화·현대적 인과 가정의 명시다.

- [Meta Robyn](https://facebookexperimental.github.io/Robyn/docs/analysts-guide-to-MMM/): ridge regression, adstock, saturation, 자동화된 모델 탐색과 예산 배분
- [Google Meridian](https://developers.google.com/meridian/docs/basics/meridian-introduction): Bayesian MMM, prior, geo-level data, causal inference 가정, reach/frequency, 시나리오 최적화

Google 연구진은 관측 집계자료의 회귀가 일반적으로는 상관 결과이며, 좁은 조건에서만 인과로 읽을 수 있다고 경고한다. 따라서 `MMM = 채널별 진짜 인과 ROI를 자동으로 알려주는 기계`로 이해하면 안 된다.

## 11. 공개 원전을 찾지 못한 개념

### PQ modeling

라이브 `01:33:45`, `01:34:26`, `03:35:00`에서 반복되지만 P와 Q를 풀어 정의하지 않는다. 정확 일치 검색에서 제품 분석·그로스 분야의 표준 원전이 나오지 않았다.

현재 가능한 판정은 여기까지다.

- 상위 결과를 사칙연산 가능한 입력으로 분해하는 하길우의 모델 템플릿 중 하나다.
- Price × Quantity 또는 Price–Volume–Mix와 닮았을 수는 있다.
- 그러나 공개 근거 없이 `P=Price, Q=Quantity`라고 확정하지 않는다.

### Segment Mix modeling

구성비 변화와 세그먼트별 성과를 분리하는 분석은 널리 쓰이지만, 라이브의 정확한 Excel 규격과 일치하는 단일 원전은 찾지 못했다. 공개 자료만으로는 일반 방법론인지, 하길우가 현업에 맞게 규격화한 템플릿인지 분리할 수 없다.

### NAU·RAU

라이브 `01:35:55–01:36:18`에서 하길우 본인도 이를 정확히 정리한 문서가 없다고 말한다. `New Active User`, `Returning/Reactivated Active User` 같은 확장은 가능해 보이지만 공개 대본만으로 확정하지 않는다. Social Capital과 Duolingo 계열은 **인접한 상태 분해 원형**이지 약어 사전이 아니다.

## 12. 역설계한 전체 구조

```text
1. Y를 정한다
   └─ North Star / OMTM / 사업 지표 구조

2. X 후보를 찾는다
   └─ SHAP / cohort / feature analysis

3. 측정 가능한 문장으로 만든다
   └─ 조작적 정의 + Window + Frequency

4. X와 Y의 연관을 선별한다
   └─ MCC 등. 인과가 아니라 후보 압축

5. 전체 숫자를 의미 있는 상태·세그먼트로 쪼갠다
   └─ Growth Accounting / Segment Mix / PQ

6. 변화 경로와 민감도를 계산한다
   └─ Markov transition matrix / Growth Model

7. 실제 개입으로 검증한다
   └─ A/B test / 준실험 / backtest

8. 팀의 목표와 플레이북으로 만든다
   └─ North Star inputs / Activation / Retention / Viral

9. 마케팅 예산의 장기 배분은 별도 모델로 본다
   └─ MMM / experiments / triangulation
```

이 배열 자체가 라이브의 독창성이 있는 부분이다. 각 부품은 오래됐지만, 분석가가 문제 정의에서 팀 액션과 설득까지 가도록 한 줄로 엮는 방식은 하길우의 현업 종합에 가깝다.

## 13. 말하면 안 되는 주장

- `Y–X–Window–Frequency는 Facebook이 만든 프레임워크다.` → 인접 사례일 뿐이다.
- `PQ는 Price×Quantity다.` → 공개 정의가 없다.
- `NAU/RAU는 Duolingo 약어다.` → 공개 근거가 없다.
- `SHAP 또는 MCC가 행동의 인과효과를 증명한다.` → 둘 다 기본적으로 연관·예측 설명 도구다.
- `AARRR, Growth Accounting, Markov Growth Model, North Star, MMM은 같은 모델이다.` → 의사결정 층과 데이터 생성 과정이 다르다.
- `Duolingo가 Markov chain을 만들었다.` → 제품 성장에 적용했다.
- `Sean Ellis가 North Star Metric이라는 말을 최초로 만들었다.` → 이번 조사에서 일차 증거가 부족하다.

## 14. 가장 먼저 읽을 원문

1. [Jorge Mazal — How Duolingo reignited user growth](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
2. [Duolingo — Meaningful metrics: The Growth Model](https://blog.duolingo.com/growth-model-duolingo/)
3. [Jonathan Hsu — Accounting for user growth](https://medium.com/swlh/diligence-at-social-capital-part-1-accounting-for-user-growth-4a8a449fddfc)
4. [Alex Schultz — Lecture 6: Growth](https://www.youtube.com/watch?v=n_yHZ_vKjno)
5. [Lundberg & Lee — SHAP](https://arxiv.org/abs/1705.07874)
6. [Shapley — A Value for n-Person Games](https://www.rand.org/content/dam/rand/pubs/papers/2021/P295.pdf)
7. [Bridgman 계보 — Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/archives/win2017/entries/operationalism/)
8. [Matthews 1975 — MCC 원 논문](https://doi.org/10.1016/0005-2795(75)90109-9)
9. [Sean Ellis — Finding the Right North Star Metric](https://medium.com/growthhackers/finding-your-north-star-metric-fc1c1f71cbcb)
10. [Google — Challenges and Opportunities in Media Mix Modeling](https://research.google.com/pubs/archive/45998.pdf)

## 조사 제한

- Zynga 상세 모델 시트는 Reforge 멤버 전용이라 공개 요약과 이미지까지만 확인했다.
- MyFitnessPal 당시 내부 원문은 찾지 못해 Jorge Mazal의 직접 회고에 의존한다.
- PQ·Segment Mix·NAU/RAU의 강의 내 정확한 정의는 공개 자료가 없다.
- “최초” 주장은 더 오래된 비공개 사내 문서가 발견되면 바뀔 수 있다.

