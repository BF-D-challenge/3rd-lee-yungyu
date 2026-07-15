# 아이디어 원본 의미 심사 파일럿 60

생성일: 2026-07-13T05:16:10.504Z  
생성 스크립트: `scripts/research/build-idea-source-pilot-60.mjs`  
파일럿 장부: `docs/research/idea-source-experiment-pilot-60.jsonl`

## 구성

각 소스에서 혼합 점수 상위 8개, 문제 렌즈 이상치 6개, 무작위 감시 6개를 중복 없이 뽑았다.

| 소스 | 실험군 | 수 |
|---|---|---:|
| trustmrr | hybrid_high | 8 |
| trustmrr | lens_outlier | 6 |
| trustmrr | random_shadow | 6 |
| app_store | hybrid_high | 8 |
| app_store | lens_outlier | 6 |
| app_store | random_shadow | 6 |
| chrome_web_store | hybrid_high | 8 |
| chrome_web_store | lens_outlier | 6 |
| chrome_web_store | random_shadow | 6 |

합계: **60개**, 고유 키 **60개**.

## 목적

같은 60개를 두 가지 메커니즘 정규화 방식과 판례 비교 방식으로 독립 심사해, 8,406개 전수 심사에 사용할 의미 표현을 고른다. 이 파일럿의 후보는 앱 승격 후보가 아니며 방식 보정용이다.
