# 카드 품질 실험 — 실행 설계서 (하위 에이전트용 스펙)

> 상위 계획: [`prds/오늘-해볼까-카드품질-실험계획.md`](../../../prds/오늘-해볼까-카드품질-실험계획.md)
> 이 문서는 T1~T7 태스크를 하위 에이전트에게 그대로 배분할 수 있는 실행 스펙이다.
> 모든 태스크는 **입력 → 출력 → 검증 게이트**가 파일로 고정되어 있어 순서만 지키면 병렬 실행 가능.

---

## 0. 파이프라인 개요

```
T1 표본추출 ──→ samples.json ──┬─→ T2 앵커매칭 ─→ anchors.json ─┐
                               │                                ├─→ T4 생성 (행별 파이프라인)
                               └─→ T3 H0재현 ─→ h0.json         │     core+H1+H2 → H3
                                                                ↓
                                                     gen/R01.json … R20.json
                                                                ↓
                               T5 시트조립 ─→ blind-sheet.md + answer-key.DO-NOT-OPEN.json
                                                                ↓
                               T6 QA 게이트 ─→ qa-report.md (통과 시 사용자 채점)
                                                                ↓
                               [사용자 채점: blind-sheet.md 직접 편집]
                                                                ↓
                               T7 집계·판정 ─→ results.md
```

**파일 배치** (전부 이 폴더 `docs/experiments/card-quality/` 기준, 스크립트만 `scripts/experiments/card-quality/`):

```
scripts/experiments/card-quality/
  sample-combos.mjs      # T1
  match-anchors.mjs      # T2
  render-h0.mjs          # T3
  assemble-sheet.mjs     # T5
  score-sheet.mjs        # T7
docs/experiments/card-quality/
  DESIGN.md              # 이 문서
  samples.json           # T1 출력
  anchors.json           # T2 출력
  h0.json                # T3 출력
  gen/R01.json … R20.json# T4 출력 (행당 1파일)
  blind-sheet.md         # T5 출력 → 사용자가 편집
  answer-key.DO-NOT-OPEN.json  # T5 출력 (채점 전 열람 금지)
  qa-report.md           # T6 출력
  results.md             # T7 출력
```

**공통 규칙**
- 난수는 전부 시드 고정 PRNG(mulberry32). 표본 시드 `20260707`, 셔플 시드 `20260708`. `Math.random()` 직접 사용 금지 (재현성).
- 스크립트는 Node ESM(`.mjs`), 의존성 추가 금지 (레포 기존 의존성만).
- 앱 코드(`lib/`, `components/`, `data/combos.json`)는 **일절 수정하지 않는다.** 읽기만.
- 실패 시 해당 행만 재시도, 3회 실패 시 그 행을 `status: "failed"`로 남기고 진행 (시트에서 제외하되 qa-report에 기록).

---

## 1. 데이터 계약 (JSON 스키마)

### 1-a. `samples.json` (T1 출력)

```jsonc
{
  "seedRng": 20260707,
  "rows": [
    {
      "id": "R01",                  // R01~R20
      "track": "like",              // like | know
      "seed": { "id": "running", "label": "러닝", "categoryId": "fitness" },
      "pain": { "id": 3, "label": "...", "short": "..." },   // combos.json pains에서 복사
      "format": { "id": "streak-tracker", "label": "...", "short": "...", "action": "...", "desc": "..." },
      "situation": { "id": "commute", "label": "출퇴근 짬시간" } | null,
      "psych": { "id": "...", "label": "..." } | null,
      "golden": true,               // (seed,pain,format)이 combos.golden에 존재하는가
      "forcedMismatch": false       // 부정합 강제 행 여부
    }
  ]
}
```

### 1-b. `anchors.json` (T2 출력)

```jsonc
{
  "rows": [
    {
      "id": "R01",
      "candidates": [                // 3~5개, 점수 내림차순
        {
          "name": "Ploxto",
          "revenue30dUsd": 3400,
          "revenueText": "$3.4k",
          "category": "Artificial Intelligence",
          "description": "raw_description 원문",
          "problem": "problem 필드 원문",
          "url": "https://trustmrr.com/startup/...",
          "matchScore": 7,          // 키워드 매칭 점수 (디버그용)
          "matchedKeywords": ["run", "streak"]
        }
      ],
      "fallbackUsed": false          // 키워드 매칭 실패로 범용 유틸리티 폴백을 썼는가
    }
  ]
}
```

### 1-c. `h0.json` (T3 출력) — 카드 공통 형태

카드 셀 하나의 공통 형태(**CardCell**)를 모든 방향이 공유한다:

```jsonc
{
  "title": "러닝메이트 스트릭" | null,   // H0 비골든은 null
  "oneliner": "…",                      // 항상 존재 (H0 비골든은 템플릿 문장)
  "target": "…",
  "mvp": ["…","…","…","…"] | null,
  "evidence": "…" | null,               // 근거 한 줄 (H1·H3만, ≤50자)
  "reading": "…" | null,                // 운세 내레이션 (H3만, 2~4문장)
  "todayAction": "…" | null             // 오늘 반나절 액션 (H3만, 1문장)
}
```

`h0.json` = `{ "rows": [ { "id": "R01", "card": CardCell } ] }`

### 1-d. `gen/Rxx.json` (T4 출력, 행당 1파일)

```jsonc
{
  "id": "R07",
  "anchor": { "name": "…", "revenue30dUsd": 4000, "url": "…", "confidence": "high" }, // confidence: high|low
  "core": {                              // H1·H2·H3가 공유하는 아이디어 핵
    "mechanism": "앵커에서 가져온 검증 메커니즘 1문장",
    "twist": "한국 니치로 비튼 10% 1문장",
    "situationUsed": true,               // 장면 축을 문장에 녹였는가
    "psychUsed": false
  },
  "h1": CardCell,                        // evidence 필수, reading/todayAction null
  "h2": CardCell,                        // evidence null·본문에 숫자/제품명 0건, 그 외 h1과 동일 아이디어
  "h3": CardCell,                        // reading·todayAction·evidence 필수
  "status": "ok"                         // ok | failed
}
```

### 1-e. `answer-key.DO-NOT-OPEN.json` (T5 출력)

```jsonc
{
  "shuffleRng": 20260708,
  "rows": [ { "id": "R01", "안1": "H2", "안2": "H0", "안3": "H3", "안4": "H1" } ]
}
```

---

## 2. 태스크 스펙

### T1 — 표본 추출 (`sample-combos.mjs` 작성+실행)

**입력**: `data/combos.json` · **출력**: `samples.json`

층화 규칙 (순서대로 적용, 시드 20260707):

1. **골든 4행**: `combos.golden`에서 seed의 track이 like인 것 2개 + know인 것 2개를 추출. 카테고리 중복 금지.
2. **부정합 강제 2행**: 아래 고정 조합 (사용자가 지적한 실패 사례 재현):
   - `golf` × (golf allowlist에서 뽑은 pain/format) × situation `출퇴근 짬시간` + psych 랜덤
   - `baking-dessert` × (allowlist pain/format) × situation `점심시간 20분` + psych `나만 늦는 불안`
3. **일반 14행**: allowlist(1,649 조합)에서 골든 미해당 조합을 랜덤 추출하되:
   - 최종 20행이 like 10 / know 10이 되도록 충당
   - 같은 카테고리 최대 2행, 같은 seed 최대 1행 (부정합 강제 행 제외)
   - 같은 format 최대 3행
4. **장면·마음 부여**: 부정합 강제 2행 포함 총 10행에만 situation+psych를 부여 (like 트랙 우선 — 현행 know 템플릿엔 어차피 안 들어감을 H0가 재현해야 하므로 know 행은 최대 3개만). 나머지 10행은 null.

**검증 게이트**: 행 수 20 · like/know 10:10 · golden 정확히 4 · situation 부여 정확히 10 · forcedMismatch 정확히 2 · 모든 (pain,format)이 해당 seed의 `allow` 안에 있는지(부정합 강제 행 포함 — situation만 어긋나게 하는 것이지 pain/format은 유효해야 함) 스크립트 말미에 assert. 실패 시 exit 1.

### T2 — 앵커 후보 매칭 (`match-anchors.mjs` 작성+실행)

**입력**: `samples.json`, `research/trustmrr-acquire/ideas.jsonl` · **출력**: `anchors.json`

1. **키워드 테이블**: 20행의 seed×pain에 대해서만 영문 키워드를 스크립트 상수로 하드코딩한다(에이전트가 작성). 예: `running → [run, running, fitness, workout, marathon, strava]`, `cafe → [coffee, cafe, loyalty, barista, shop]`, pain "기록 흩어짐" → `[track, log, journal, dashboard, sync]`. seed 키워드 가중 2점, pain 키워드 1점, format 키워드 1점.
2. **스코어링**: 각 아이디어의 `name + category + raw_description + problem + target_user` 소문자 연결 문자열에 키워드 포함 여부로 점수 합산.
3. **필터**: `revenue_30d_value >= 200` 우선. 점수 상위 5개 채택. 점수 ≥3인 후보가 3개 미만이면 `fallbackUsed: true`로 표시하고, 부족분은 **범용 유틸리티 폴백 풀**(revenue_30d_value 상위이면서 category가 Productivity/SaaS/Tools류인 것 중 트래커·체크리스트·정산·리포트 메커니즘 20개를 스크립트가 사전 선정)에서 채운다.
4. revenue_30d_value가 null인 항목은 후보에서 제외.

**검증 게이트**: 모든 행 후보 ≥3 · 후보 전원 revenue30dUsd ≥ 200 · fallbackUsed 행 수를 stdout에 출력.

### T3 — H0 재현 (`render-h0.mjs` 작성+실행)

**입력**: `samples.json`, `data/combos.json` · **출력**: `h0.json`

`lib/draw.ts`·`lib/josa.ts` 로직을 **그대로 재현**한다 (import가 가능하면 tsx 없이 로직 복제 허용, 단 주석으로 원본 파일:라인 명기):

- golden 행: 해당 golden의 title/oneliner/target/mvp 그대로.
- 비골든 행: `sentenceTemplates[track]`에 fillTemplate + josa 교정. target은 `defaultTarget()` 재현 (like → "{label}을/를 좋아하는 사람", know → "{label} 실무자"). title=null, mvp=null, evidence=null.
- situation/psych가 null인 like 행: 템플릿의 `{situation}에 {psych}을 느끼는 ` 앞부분을 제거한 변형 사용 (현행 UI가 축 미선택 시 보여주는 형태와 동일하게 — 확인 필요 시 `components/organisms/slot/confirm-branch.tsx` 참조. 불일치 발견 시 실제 UI 쪽을 따르고 qa-report에 메모).

**검증 게이트**: 20행 전부 oneliner 비어있지 않음 · 골든 4행은 title 존재 · know 행 문장에 situation 문자열 미포함(현행 버그 재현 확인).

### T4 아키텍처 개정 (2026-07-08, 3라운드 실험 후 확정)

3라운드 자기개선 결과 **"프롬프트에 규칙을 계속 쌓기"는 두더지잡기로 진동**함을 확인(H1 4.08→4.04→3.54, 위반 58→50→78). 결론:

- **주관 품질(니치·재미·자연스러움)은 린한 R2급 프롬프트에 맡긴다.** 비대한 R3 프롬프트(7.3KB)보다 린한 R2 프롬프트가 점수가 높았다.
- **이진 결함은 프롬프트가 아니라 결정론적 검증기로 잡는다.** 아래 5종은 코드로 O/X 판정 → 위반 시 그 규칙만 콕 집어 재생성(최대 2회):
  1. `H1.evidence`에 실명+수치 있음 / `H3`는 evidence·reading·todayAction("오늘 반나절"로 시작) 채움
  2. `H2` 숫자·통화·앵커 제품명 누출 0 (H2는 설계상 "근거 암시형"이라 숫자를 숨김 — evidence는 톤 문구 또는 null이 **정상**, 이걸 감점하면 실험을 미리 판정하는 것)
  3. 변주 간 verbatim 복제 금지: `H3`가 `H1`과 oneliner+target 동일 금지, mvp 3변주 전부 동일 금지
  4. 길이 하드컷: title ≤14 · oneliner ≤60 · target ≤50 · mvp 각 ≤22
  5. mvp 정확히 4개
- **H1 vs H2(숫자 명시 vs 암시)는 AI가 판정하지 않는다.** 블라인드 시트에서 사용자가 판정.

### T4 — 생성 (행별 파이프라인 + 검증기 재생성 루프)

**입력**: `samples.json`, `anchors.json` · **출력**: `gen/R01.json` … `gen/R20.json`

행마다 2단계 파이프라인 (행 간 병렬, 행 내 순차):

```
스테이지 A (행당 1콜): core + H1 + H2 동시 생성   ← H1/H2가 "근거 노출"만 다르게 통제됨
스테이지 B (행당 1콜): core를 받아 H3(운세체) 생성 ← H3 vs H1이 "톤"만 다르게 통제됨
```

**스테이지 A 프롬프트 필수 요소** (에이전트가 프롬프트를 조립할 때 반드시 포함):

1. 조합 원자료: seed/pain(label+short)/format(**action·desc 사용, short 금지**)/situation/psych/track.
2. 앵커 후보 3~5개 전체 (이름·매출·설명·problem) + 선택 지침: "**메커니즘 유사성 > 카테고리 유사성**. 전부 부적합하면 confidence: low로 표시하고 가장 가까운 메커니즘 하나를 고른다."
3. **90/10 규칙**: 메커니즘·과금 방식·사용 패턴은 앵커 그대로(90), 타깃·상황·소재만 이 조합의 한국 니치로 비틀기(10). 새 메커니즘 발명 금지.
4. 4대 루브릭 주입: ①니치 구체성("나 이거 아는데" 싶은 좁은 타깃·상황 — 직업·상황·고유 맥락을 1개 이상 박을 것. **단, 구체성은 실명·상황으로 채우고 약어로 채우지 말 것**) ②오늘 실행감(반나절 내 만들 수 있는 범위의 MVP 4개) ③의외성·재미(뻔한 재발명 문구 금지) ④문장 자연스러움(번역투 금지, 한국 생활어. **PB/PR/KPI/MAU류 축약어·전문용어 금지 — 니치 인사이더도 처음엔 못 알아들을 수 있다고 가정하고 무조건 우리말로 풀어쓴다.** 브랜드·앱 실명은 구체성에 도움되니 허용, 약어는 안 됨).
5. 기존 품질평가 함정 경고: "습관 트래커/체크리스트를 범용 타깃에 내면 실패(#17~19). 좁힌 마이크로 타깃·상황이 해독제."
6. 장면·마음 처리: "situation/psych가 주어졌고 seed×pain의 실제 사용 순간과 정합하면 oneliner에 녹여라. 어색하면 **과감히 생략**하고 situationUsed/psychUsed를 false로. (예: '출퇴근 짬시간'에 골프 스윙 검토는 부정합 → 생략)"
7. H2 파생 규칙: "h2는 h1과 **같은 아이디어**를 유지하되 evidence를 null로 하고, oneliner·mvp 본문에서 실제 제품명·달러 숫자를 전부 제거. 대신 '해외에선 이미 돈 내고 쓰는 유형' 수준의 문체 암시 1구절만 허용."
8. 길이 제한: title ≤ 14자 · oneliner ≤ 60자 · evidence ≤ 50자 (형식: "비슷한 유형 '{앵커명}'이 월 ${매출} — 그것의 {니치} 버전") · mvp 항목 ≤ 20자 × 정확히 4개.
9. 출력은 StructuredOutput 스키마 강제 (1-d의 core/h1/h2 부분).

**스테이지 B 프롬프트 필수 요소**:

1. 스테이지 A의 core + h1 전체를 입력으로 전달. **아이디어 내용 변경 금지** — 톤 전환만.
2. 타로 리딩 톤 가이드: 2인칭 존대("당신"), Moonlight식 차분한 리딩체. `reading` 2~4문장 구조 = ①카드가 당신에게 온 이유(장면·마음이 정합하면 여기에 녹임) ②카드가 가리키는 것(아이디어 핵심) ③근거의 속삭임(앵커 매출을 운명적 표현으로: "바다 건너 누군가는 이미 이 카드로 월 $4k를 거둡니다"). `todayAction` = "오늘 반나절"로 시작하는 명령형 1문장.
3. 금지: 점성술 클리셰 남발(수성 역행 등), 허황된 예언("대박날 것입니다"), 정보 손실(target·mvp는 h1 것을 유지·복사).
4. title은 타로 카드명처럼 재작명 가능 (≤14자).

**모델·에포트**: 세션 기본 모델, effort 기본. 스키마 검증 실패 시 자동 재시도에 맡기고, 행 단위 3회 실패 시 `status: "failed"`.

**검증 게이트** (T4 종료 후 일괄 스크립트 or T6에 위임): 20파일 존재 · status ok ≥ 18 · 모든 h2에서 정규식 `\$[\d,.]+|앵커명` 검출 0건 · forcedMismatch 2행의 situationUsed가 false인지 확인(true면 생성 품질 경고).

### T5 — 시트 조립 (`assemble-sheet.mjs` 작성+실행)

**입력**: `samples.json`, `h0.json`, `gen/*.json` · **출력**: `blind-sheet.md`, `answer-key.DO-NOT-OPEN.json`

1. 행마다 [H0, H1, H2, H3]를 시드 20260708 PRNG로 셔플 → 안1~안4에 배정. 배정표는 answer-key에만 기록.
2. `blind-sheet.md` 렌더 형식 (행당 섹션, 표 금지 — 멀티라인 카드라 표가 깨짐):

```markdown
## R07 · 러닝 × 기록 흩어짐 × 공유 링크툴 〔장면: 밤 11시 노트 앞 · 마음: 진짜 반응을 보고 싶은 마음〕

### 안1
**러닝메이트 스트릭**
혼자 뛰는 3개월차 러너가 …
- 타깃: …
- MVP: … / … / … / …
- 근거: 비슷한 유형 'RunLog'가 월 $3.4k — …

### 안2
…

**✍️ 채점** → 승자: `안_` · 탈락(있으면): `안_` · 메모:
```

   - 카드 필드가 null이면 그 줄 자체를 생략 (H0 비골든은 자연히 짧게 보임 — 의도된 현실 재현).
   - H3의 reading은 본문으로, todayAction은 `- 오늘: …` 줄로.
   - **방향 라벨(H0~H3)·앵커 URL은 시트에 절대 노출 금지.**
3. 시트 머리에 채점 안내 4줄: 기준 4개(니치 구체성/오늘 실행감/의외성·재미/자연스러움)를 종합해 행당 승자 1개, 백틱 안만 수정, 동점이면 승자 2개 허용(`안1,안3`), 소요 15~20분.

**검증 게이트**: `H0|H1|H2|H3|trustmrr|http` 문자열이 blind-sheet.md에 0건 · 20행 × 4안 모두 렌더됨 · 셔플이 전 행 동일 배열이 아님.

### T6 — QA 게이트 (에이전트 1콜, 읽기 전용)

**입력**: 산출물 전부 · **출력**: `qa-report.md` (PASS/FAIL + 지적 목록)

체크리스트:
- [ ] T4·T5 검증 게이트 재확인 (h2 숫자 누출, 시트 라벨 누출, 행·안 개수)
- [ ] H1/H2 쌍이 아이디어 동일·근거만 상이한지 5행 표본 검사
- [ ] H3가 target·mvp 정보를 잃지 않았는지 5행 표본 검사
- [ ] 번역투·어색한 조사 표본 검사 (10셀), 발견 시 해당 행 재생성 권고
- [ ] 부정합 강제 2행에서 각 방향이 어떻게 처리했는지 서술 (이 행들이 실험의 핵심 관찰점)

FAIL 항목이 있으면 해당 행만 T4 재실행 → T5 재조립 → T6 재검. 2회 순환 후에도 FAIL이면 그 행을 시트에서 제외하고 사용자에게 보고.

### T7 — 집계·판정 (`score-sheet.mjs` 작성+실행, 사용자 채점 후)

**입력**: 사용자가 편집한 `blind-sheet.md`, `answer-key.DO-NOT-OPEN.json` · **출력**: `results.md`

1. 파싱: 각 행의 ``승자: `안X` `` 백틱 값 추출 (복수 승자는 각 0.5승, 탈락 표기는 해당 방향 감점 기록). 파싱 불가 행은 무효 처리하고 목록 출력.
2. 집계: 방향별 총 승수 + 층화별 분해(like/know · 골든 4행 · 장면 부여 10행 · 부정합 2행) + 탈락 횟수.
3. 판정 (상위 계획 §4): 최다 방향 승수 ≥ 12 → 확정 채택. H1 vs H2 상대 전적 → 앵커 노출 여부 결정. H3 우세 → 컨셉 전환 검토 확대. 과반 없음 → 메모 열을 모아 2차 가설 제안 초안까지 자동 생성.

---

## 3. 실행 규모·순서 요약

| 단계 | 실행 주체 | 병렬성 | 예상 |
|---|---|---|---|
| T1→T2→T3 | 스크립트 에이전트 1~3개 (T2·T3는 T1 후 병렬 가능) | 부분 병렬 | 각 1콜 |
| T4 | 행별 파이프라인 20행 × 2스테이지 | 행 간 병렬 (동시 ~10) | 40콜, 벽시계 ~10분 |
| T5 | 스크립트 에이전트 1개 | — | 1콜 |
| T6 | QA 에이전트 1개 | — | 1콜 |
| (사용자 채점 15~20분) | | | |
| T7 | 스크립트 에이전트 1개 | — | 1콜 |

총 에이전트 콜 ≈ 45. 사용자 개입 지점은 **채점 1회**뿐.

## 4. 설계 근거 메모 (에이전트 오해 방지)

- **H1·H2를 한 콜에서 생성**하는 이유: 아이디어 품질 편차가 "근거 노출" 변수에 섞이는 교란을 차단. 별도 생성 금지.
- **H3에 core를 물려주는 이유**: H3 vs H1이 순수 톤 비교가 되도록. H3가 아이디어를 바꾸면 실험 무효.
- **H0를 있는 그대로(빈약하게) 보여주는 이유**: 현행 경험의 정직한 재현이 목적. 보정 금지.
- **부정합 강제 2행**: 사용자가 지적한 실패 모드("출퇴근에 골프 스윙")를 4방향이 각각 어떻게 소화하는지 보는 관찰점. 생성 단계에서 situation을 몰래 빼고 시작하면 안 됨 — 입력엔 그대로 주고 생성기가 스스로 생략하는지 본다.
- 이 실험은 **콘텐츠 카피 비교**다. UI·스키마 변경, combos.json 수정, 앱 코드 수정은 전부 롤아웃 단계(검증 후)의 일이다.
