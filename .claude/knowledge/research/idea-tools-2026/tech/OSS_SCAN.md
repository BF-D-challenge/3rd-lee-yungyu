# OSS 스캔: 아이디어 생성·발견·검증 오픈소스 (2024~2026 활발)

> 조사일: 2026-07-07 · 수단: gh CLI 검색 + README 정독 · 목적: "오늘 해볼까"(1인 빌더 아이디어 뽑기 + 지인 투표 수요확인)의 최종 가치 강화 참고
> 선정 기준: 2024~2026 커밋 활발 우선, star 낮아도 접근법 신선하면 포함

## 요약 표

| # | 레포 | ⭐ | 최근 push | 최종 아웃풋 | 데이터 소스 |
|---|------|-----|----------|------------|------------|
| 1 | [liyedanpdx/reddit-ai-trends](https://github.com/liyedanpdx/reddit-ai-trends) | 855 | 2026-07-06 | 일간 트렌드 리포트(md, 2개 국어) | Reddit 공식 API + LLM |
| 2 | [MaxKmet/idea-validation-agents](https://github.com/MaxKmet/idea-validation-agents) | 363 | 2026-06-16 | 스코어된 아이디어 리스트 + decision memo | TikTok/Reddit/X/앱스토어/구글트렌드 (에이전트 웹서치) |
| 3 | [discus0434/nook](https://github.com/discus0434/nook) | 285 | 2026-04-12 | 일간 다이제스트 웹앱(요약+추가질문) | HN/Product Hunt/GitHub Trending/Reddit/RSS/논문 |
| 4 | [dancolta/subscope](https://github.com/dancolta/subscope) | 18 | 2026-06-03 | 랭킹된 구매신호 스레드 리스트(채팅 내) | Reddit 공개 RSS (키리스) |
| 5 | [arslan70/haytham](https://github.com/arslan70/haytham) | 13 | 2026-07-06 | GO/NO-GO 판정 + 구현 스펙(OpenSpec) | 에이전트 웹서치 |
| 6 | [TiyaaaJain/launch-check](https://github.com/TiyaaaJain/launch-check) | 14 | 2026-03-08 | 1-10 점수 + 판정 리포트 + PPTX | LLM + 수요신호 체크리스트 |
| 7 | [kzeitar/idea-sieve](https://github.com/kzeitar/idea-sieve) | 13 | 2026-01-24 | 웹앱 검증 리포트(경쟁사·시장) | OpenAI (LLM 분석) |
| 8 | [jmanhype/jtbd-idea-validator-agent](https://github.com/jmanhype/jtbd-idea-validator-agent) | 10 | 2026-03-25 | JTBD 분석 + 차트 + 발표자료(Gamma) | LLM (DSPy 파이프라인) |
| 9 | [kle-08/launchlens](https://github.com/kle-08/launchlens) | 6 | 2025-09-10 | 30초 YES/NO 판정 + 피벗 제안 (CLI/JSON) | LLM |
| 10 | [mplacona/ThreadScout](https://github.com/mplacona/ThreadScout) | 5 | 2025-10-27 | 기회 스코어(0-100) + 답글 초안 2종 | Reddit API/공개 JSON |
| 11 | [darrenhead/pico-pitch](https://github.com/darrenhead/pico-pitch) | 4 | 2025-06-26 | 기회별 BRD/PRD/Agile 플랜 문서 | Reddit 스크랩 + Gemini |
| 12 | [VibeCom-AI/startup-idea-validator](https://github.com/VibeCom-AI/startup-idea-validator) | 3 | 2026-03-31 | VC급 7차원 가중 스코어카드 | LLM (+웹서치 폴백) |
| 13 | [andreiprv/saas-radar](https://github.com/andreiprv/saas-radar) | 2 | 2026-02-28 | 스코어·랭킹된 마이크로SaaS 아이디어 | Reddit(OpenAI 웹서치)+X(xAI)+HN |
| 14 | [lefttree/reddit-pain-points](https://github.com/lefttree/reddit-pain-points) | 1 | 2026-02-04 | 필터링 가능한 기회 대시보드 + CSV/JSON | Reddit 12+ 서브레딧 + Gemini/Claude |
| 15 | [farazfookeer/nicheminer](https://github.com/farazfookeer/nicheminer) | 0 | 2026-03-16 | 캔버스·경쟁분석·수익계산기·검증점수·마케팅플랜 5종 | Reddit 페인포인트 + Claude 툴유즈 루프 |
| 16 | [getfider/fider](https://github.com/getfider/fider) | 4,404 | 2026-07-06 | 투표 기반 피드백 보드(셀프호스팅) | 사용자 직접 입력+투표 |
| 17 | [riggraz/astuto](https://github.com/riggraz/astuto) | 2,353 | 2026-01-09 | 피드백 수집·투표·로드맵 보드 | 사용자 직접 입력+투표 |

---

## 레포별 상세

### A. 커뮤니티 신호 마이닝 (발견 축)

#### 1. liyedanpdx/reddit-ai-trends — ⭐855 · push 2026-07-06 (매우 활발, 매일 자동 커밋)
- **아웃풋**: 매일 오전 자동 생성되는 마크다운 트렌드 리포트(영/중). "오늘의 하이라이트 → 주간 비교 → 월간 기술 진화" 3단 시간축 구조.
- **소스/방법**: Reddit 공식 API로 AI 서브레딧 수집 → DeepSeek R1(OpenRouter)/Groq로 분석·요약. 이미지(비전모델)·유튜브 자막·링크 본문(Firecrawl)까지 멀티모달 보강, MongoDB 캐싱으로 API 비용 최소화. 봇 댓글 필터링.
- **활성도**: 리포트가 레포 안에 매일 쌓임(리포트 자체가 콘텐츠 자산이자 SEO).
- **이식 아이디어**: "리포트를 레포/페이지에 매일 적재해 그 자체를 콘텐츠 자산화" — 오늘 해볼까의 발행 카드를 공개 아카이브로 쌓으면 유입 루프가 됨.

#### 2. discus0434/nook — ⭐285 · push 2026-04-12
- **아웃풋**: 날짜별로 정리된 일간 다이제스트 웹앱(일본어 요약). 각 기사에 **추가 질문을 보낼 수 있는** 대화형 뷰어.
- **소스/방법**: HN, Product Hunt, GitHub Trending, Reddit, 임의 RSS(피드별 키워드 필터), Google Alerts, HF 논문. 로컬/AWS 동일 구성으로 동작.
- **활성도**: 꾸준한 유지보수, 멀티 LLM 프로바이더 지원.
- **이식 아이디어**: "결과물에 후속 질문 버튼" — 뽑힌 아이디어 카드에서 바로 '더 파보기' 대화를 붙이는 UX.

#### 3. dancolta/subscope — ⭐18 · push 2026-06-03 (신선도 최상급 접근법)
- **아웃풋**: Claude Code 채팅 안에 랭킹된 스레드 리스트 2트랙 — **BUYER SIGNALS**(지금 지갑 여는 사람) / **AUTHORITY PLAYS**(신뢰 쌓기용 질문). 각 줄에 서브레딧·경과시간·점수·패턴 배지.
- **소스/방법**: Reddit **공개 RSS만** 사용(키·계정·OAuth 전부 불필요, 403 시 호스트 페일오버). 엔진(Python)은 후보 수집+피처 태깅만 하고 **판정은 Claude가 오퍼 프로필 대비로** 수행. 8가지 구매신호 패턴(pricing-rage, churn, build-vs-buy, rfp-bait, stack-audit, alternative-seeking, resurrect, rivals)별 별도 스코어링. 온보딩 7턴으로 "무엇을 팔고, 누가 사고, 어떤 고통인지" 타겟팅 프로필 구축, `/subscope-tune`으로 좋/나쁨 판정을 서브레딧·키워드 가중치에 역전파.
- **활성도**: 2026년 릴리스 지속, GummySearch/Syften/F5Bot 유료 대체 포지셔닝.
- **이식 아이디어**: "0개 결과여도 근접 후보+넓히는 법을 보여준다(빈 화면 금지)" + 사용자의 좋/별로 피드백을 뽑기 가중치에 역전파하는 튜닝 루프.

#### 4. lefttree/reddit-pain-points — ⭐1 · push 2026-02-04
- **아웃풋**: 필터·검색 가능한 기회 대시보드(카테고리 자동분류, 트렌딩 뷰, CSV/JSON 익스포트). 데모 모드 내장.
- **소스/방법**: 12+ 서브레딧에서 페인 언어("I wish", "frustrated", "need a tool") 키워드 매칭 스크랩(무인증 공개 API) → Gemini/Claude로 구조화 추출(페인포인트·타겟·시장크기·기존해법) → **복합 점수 = 참여도 × 심각도 × 시장 잠재력**으로 랭킹.
- **활성도**: 2026년 초 활발, 로드맵에 시계열 트렌드·멀티플랫폼 확장.
- **이식 아이디어**: "페인 언어 사전"(I wish/왜 없지/돈 내겠다) 자체가 자산 — 오늘 해볼까 '불편' 축 카드를 실제 한국어 페인 표현으로 채우는 방법론.

#### 5. mplacona/ThreadScout — ⭐5 · push 2025-10-27
- **아웃풋**: 스레드별 기회 점수(0-100) + 답글 초안 2종(도움만/도움+링크) + 성과 추적. **자동 포스팅 금지, 인간 개입 필수** 설계.
- **소스/방법**: Reddit OAuth 또는 공개 JSON. 서브레딧 규칙까지 자동 요약해 위반 없는 참여 유도. 링크 1개 제한·도메인 화이트리스트를 서버에서 강제.
- **이식 아이디어**: "커뮤니티 규칙 존중을 제품이 강제"하는 설계 — 지인 투표 요청 메시지 초안을 만들어주되 전송은 반드시 사용자가.

### B. 생성→검증 풀 파이프라인 에이전트 (뽑기+검증 축)

#### 6. MaxKmet/idea-validation-agents — ⭐363 · push 2026-06-16 (이번 스캔 최중요 레포)
- **아웃풋**: ① 아이디어 생성: 본인 배경 인터뷰 → 빌더 프로필 → 트렌드 분석 → **나에게 맞춰 스코어된 아이디어 7~10개**(`memory/ideas/`에 저장). ② 검증: 9단계 후 `decision_memo.md` — pursue/test/pivot/drop 판정 + **가장 위험한 가정 1개와 그걸 검증할 ≤2주·≤$100 실험(RAT)** + kill criteria.
- **소스/방법**: 설치·API키 0(클론하면 CLAUDE.md/AGENTS.md가 에이전트를 라우팅). 트렌드 신호는 TikTok Creative Center(해시태그 속도)·Reddit(페인 언어)·X·앱스토어(1점/3점 리뷰 마이닝)·구글트렌드에서 에이전트가 직접 수집. **곱셈-바닥(multiplicative-floor) 스코어링**: 치명 약점 1개가 전체 점수를 죽임(실제 스타트업처럼). Van Westendorp 가격 민감도 + 욕망 프리미엄 배수, 바이럴 k-factor 6종 루프 모델링, 프리모템(Klein 2007).
- **활성도**: 2026년 상반기 급성장(15 스킬), Claude Code/Codex/Cursor 3플랫폼.
- **이식 아이디어**: **"다음 행동 1개"를 파는 것** — 오늘 해볼까 유료 리포트의 핵심 차별로 'RAT: 이번 주에 2만원 이하로 해볼 검증 실험 1개'를 제시. 또한 "질문 답하기 싫으면 browse topics로 칩 선택" 탈출구 설계가 우리 객관식 원칙과 정확히 일치.

#### 7. arslan70/haytham — ⭐13 · push 2026-07-06
- **아웃풋**: 4페이즈(Why→What→How→Specs) 각각 승인 게이트를 거쳐 GO/NO-GO/PIVOT 판정 → MVP 스코프 → 빌드-바이 분석 → 코딩 에이전트에 바로 넘기는 OpenSpec. **NO-GO면 이유를 말해주는 게 존재 의의**라고 명시.
- **소스/방법**: Claude Code 플러그인, 9개 전문 에이전트, 웹서치 기반 시장·경쟁 조사. **concept-anchor.json**: 1페이즈에서 아이디어의 불변 요소를 추출해 모든 하위 에이전트에 그대로 전달 — 아이디어가 단계 거치며 밋밋해지는 "전화 게임" 방지.
- **활성도**: 2026-07 현재 개인 도구로 전환 선언했으나 커밋 활발, 예제 판정(GO/PIVOT) 공개.
- **이식 아이디어**: concept anchor — 사용자가 뽑은 씨앗·불편 조합의 원형을 카드→리포트→플랜까지 변질 없이 유지하는 불변 데이터 구조.

#### 8. farazfookeer/nicheminer — ⭐0 · push 2026-03-16 (star 무관 신선 접근)
- **아웃풋**: 니치 입력 → Reddit 페인포인트(대표 인용문+심각도) + 각 페인포인트마다 사업 아이디어 → 클릭하면 에이전트가 5종 산출물 자동 생성: 비즈니스 모델 캔버스, 경쟁 비교 매트릭스, **슬라이더 조작형 수익 계산기(12개월 MRR)**, **레이더 차트 검증 점수**(시장·경쟁·실현성·TTM·수익·방어력), 마케팅 플랜.
- **소스/방법**: FastAPI + Anthropic 툴유즈 루프(프롬프트 체인 아님 — Claude가 어떤 툴을 어떤 순서로 부를지 자율 결정, 호출 8회 캡). "make it more B2B" 같은 피드백을 주면 **영향받는 산출물만 재생성**. SSE 실시간 스트리밍.
- **이식 아이디어**: 리믹스 시 전체 재생성이 아니라 **바뀐 축에 영향받는 부분만 재생성** — 오늘 해볼까의 축 고정+리롤 루프의 백엔드 최적화와 동형.

#### 9. jmanhype/jtbd-idea-validator-agent — ⭐10 · push 2026-03-25
- **아웃풋**: 가정 해체(신뢰도 1-3) → JTBD 문장 5개(각각 push/pull/anxiety/inertia **Four Forces** 포함) → Doblin 혁신 레이어 모트 분석 → 5기준 0-10 점수. 레이더·워터폴 차트 + Gamma 발표자료 md + CSV.
- **소스/방법**: DSPy 4스테이지 파이프라인, **독립 저지 2회 실행 후 중재 병합(dual-judge)**, 시드 고정으로 재현성.
- **이식 아이디어**: 판정 신뢰도 확보용 dual-judge — 유료 수요 리포트의 점수를 2회 독립 평가 병합으로 만들면 "AI 아무말" 인상을 줄임.

#### 10. darrenhead/pico-pitch — ⭐4 · push 2025-06-26
- **아웃풋**: Reddit 페인포인트별 폴더에 BRD/PRD/Agile 플랜(1포인트 태스크) — Cursor에 바로 넣는 "AI 구현 준비 완료" 문서.
- **소스/방법**: Reddit 스크래퍼 에이전트(서브레딧 지정) → Gemini 검증 → Supabase 저장. 멀티 에이전트 자율 파이프라인.
- **이식 아이디어**: "발견→검증→**빌드 문서**"까지 잇는 엔드투엔드 — 오늘 해볼까 실행 플랜 상품의 최종 형태 참고(투표로 검증된 카드 → 바이브코딩 프롬프트 팩).

### C. 경량 스코어카드/판정기 (검증 축, 결제 상품 참고)

#### 11. kle-08/launchlens — ⭐6 · push 2025-09-10
- **아웃풋**: `launchlens "uber for dogs"` → 30초 안에 **YES/NO 판정 + 이유 3줄 + 실제 경쟁사 + 피벗 제안**("교외 노인 반려견 산책으로 좁혀라"). `--json`으로 에이전트 파이프라인에 삽입, `--roast` 독설 모드.
- **소스/방법**: LLM 기반 CLI. 데이터 수집보다 "즉답 판정 UX"가 본체.
- **이식 아이디어**: 나쁜 판정일 때 반드시 **구체적 피벗 대안**을 같이 주기 — 부정 결과가 이탈이 아니라 리롤 동기가 되게.

#### 12. VibeCom-AI/startup-idea-validator — ⭐3 · push 2026-03-31
- **아웃풋**: 7차원 가중 스코어카드(시장 25% + 창업자-시장 적합 25% + 문제해결 15% + 경쟁 10% + BM 10% + GTM 10% + 실행리스크 5%) → 가중 총점 X.X/10 + Strong/Promising/Weak/Pass + **이번 주 할 일 1개(7-day action item)**. 다국어 응답.
- **소스/방법**: SKILL.md 하나로 배포(Claude Code/Cursor/아무 채팅에나 붙여넣기 가능). 웹서치 가능하면 사용, 없으면 LLM 지식으로 우아하게 폴백.
- **이식 아이디어**: **창업자-시장 적합에 25% 가중** — 오늘 해볼까의 "씨앗(내 것)에서 시작" 철학을 점수 체계로 정당화하는 근거 프레임.

#### 13. TiyaaaJain/launch-check — ⭐14 · push 2026-03-08
- **아웃풋**: B2B/B2C 분기형 질문 트랙 → **6가지 수요 신호 체크**(온라인에 고통 서술 존재? 기존 지출? 포럼 요청? 대기명단 관심? 대안 불평?) → 5차원 점수 → 1-10 총점 + 판정 + **빌드 전에 돌릴 검증 방법 2-3개 추천**. PPTX 슬라이드 익스포트.
- **소스/방법**: Claude Code/Codex/Gemini CLI 호환 스킬.
- **이식 아이디어**: 6가지 수요 신호 체크리스트를 지인 투표 문항 설계에 재사용("이 불편으로 돈 써본 적 있어?" 등).

#### 14. kzeitar/idea-sieve — ⭐13 · push 2026-01-24
- **아웃풋**: 셀프호스팅 웹앱(TS/React/Hono/Bun/Docker)의 검증 리포트. README 최상단에 **"AI 생성 인사이트는 출발점이지 결정 근거가 아니다" 면책 배너**.
- **소스/방법**: AI SDK + OpenAI. 증거 기반·정직함을 브랜드로 내세움.
- **이식 아이디어**: 정직성 고지를 UX 요소로 — 수요 리포트에 "이건 예측이 아니라 지인 N명의 실제 반응" 프레임을 대비시켜 차별화.

### D. 투표·수요확인 인프라 (지인 투표 축)

#### 15. getfider/fider — ⭐4,404 · push 2026-07-06 (이 분야 OSS 표준)
- **아웃풋**: 셀프호스팅 피드백 보드 — 아이디어 게시 + 투표 + 상태(planned/completed) 관리.
- **소스/방법**: Go+React. 투표에 **이메일/OAuth 로그인 요구**.
- **이식 아이디어**: 반면교사 — OSS 표준조차 투표자에게 로그인을 요구함. 오늘 해볼까의 "투표 수신자 무로그인" 원칙은 기존 도구가 못 하는 빈자리(K-factor 보호)임을 확인.

#### 16. riggraz/astuto — ⭐2,353 · push 2026-01-09
- **아웃풋**: Canny 대체 셀프호스팅 피드백 도구(보드·로드맵·댓글).
- **소스/방법**: Rails. 익명 피드백 옵션은 있으나 기본은 계정 기반.
- **이식 아이디어**: "아이디어별 상태 전이(검토중→만드는중→완성)" 공개가 투표자를 재방문시키는 리텐션 장치 — 투표해준 지인에게 "그 아이디어 이렇게 됐어" 알림 루프.

### 기타 관찰 (짧게)

- **andreiprv/saas-radar** (⭐2, 2026-02): Reddit+HN+X **3소스 교차 검증**으로 아이디어 스코어링 — 한 플랫폼 신호는 노이즈, 교차되면 신호라는 원칙.
- **jermainee/ideafa.st** (⭐8, 2025-10): "가장 빠르게 나쁜 SaaS 아이디어에 도달하는 법" 유머 랜덤 생성기. 랜덤 뽑기의 재미 요소는 검증됐지만 **랜덤만으로는 8스타** — 오늘 해볼까가 씨앗 고정+수요확인을 얹는 이유.
- **Pranavharshans/ThinkTank-AI** (⭐8, 2026-07): CrewAI 다중 에이전트(시장→실현성→페르소나→BM→피치덱) 풀스택 검증기 — 2025~26년 이 패턴의 클론이 수십 개 관찰됨(레드오션).
- **bwerneckm/startup-skills** (⭐11, 2026-02) / **wolulabs/hermes-founder-os** (⭐10, 2026-05): 아이디어 검증을 포함한 "창업 운영 스킬 팩" — 검증 단품이 아니라 팩으로 묶는 배포 추세.
- **btakita/pain-point** (2008, Rails): **투표로 페인포인트를 식별**하는 앱이 18년 전에도 존재 — 개념 자체는 오래됐고, 승부처는 배포·마찰 제거.

---

## 접근법 패턴 요약 (5줄)

1. **데이터 소스는 Reddit으로 수렴, 접근은 '키리스'로 진화** — 2024~26 활발 레포의 절대다수가 LLM 순수생성 대신 Reddit 페인 언어 마이닝("I wish/frustrated/돈 내겠다")을 쓰고, 최신 세대(subscope 등)는 API키·계정 없이 공개 RSS/JSON만으로 수집해 진입 마찰을 0으로 만든다.
2. **아웃풋은 '리포트'에서 '판정 + 다음 행동 1개'로 이동** — YES/NO·GO/NO-GO·가중 스코어카드에 반드시 "이번 주 ≤$100 실험(RAT)"이나 "피벗 대안"을 붙인다. 긴 분석은 안 팔리고 결정과 첫걸음이 팔린다 (→ 오늘 해볼까 유료 리포트의 핵심 상품 정의).
3. **배포 형태는 독립 웹앱 → AI CLI 스킬/플러그인으로 격변** — 신규 프로젝트의 다수가 Claude Code/Codex/Cursor 스킬(설치·키 0)로 나오며, 독립 SaaS 웹앱은 리텐션 루프(매일 리포트 적재, 대시보드) 있는 것만 생존한다.
4. **차별화는 개인화 + 아이디어 원형 보존** — 빌더 인터뷰→프로필 매칭 스코어링(idea-validation-agents, 창업자-시장 적합 25% 가중), 피드백 역전파 튜닝(subscope), concept anchor로 변질 방지(haytham), 리믹스 시 영향 부분만 재생성(nicheminer)이 상위권의 공통 기술.
5. **'사람 투표' 검증은 OSS 공백지대** — 검증은 전부 AI 시뮬레이션이고, 투표 인프라(fider ⭐4.4k)는 투표자 로그인을 요구한다. "AI 뽑기 + 지인 무로그인 투표"를 잇는 OSS는 이번 스캔에서 발견되지 않음 = 오늘 해볼까의 포지셔닝(AI가 아니라 지인이 검증)이 실제 빈자리다.
