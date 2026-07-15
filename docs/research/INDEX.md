---
name: research--index
description: docs/research 전체 지도 — 리서치 문서 코퍼스, 최종 아이디어 결정 장부, JSONL 데이터셋, 디자인 레퍼런스 에셋, 낱개 실측·대본 문서까지 전부의 진입점과 한 줄 요약을 담은 최상위 인덱스.
metadata:
  type: research
  topic: research-index
  category: index
  date: 2026-07-13
---

# docs/research 전체 지도

`docs/research/`는 이 프로젝트("오늘 해볼까")의 리서치 산출물 저장소다. 이 `INDEX.md`가 전체 지도이며, 여기서부터 각 토픽의 entryPoint로 들어가면 된다.

**규약**
- 모든 마크다운 문서는 `name`/`description`/`metadata(type·topic·category·date)` YAML 프론트메터를 가진다. 파일을 열지 않고도 프론트메터의 `description`만 읽으면 내용을 알 수 있다.
- 문서 코퍼스 토픽 폴더는 `SUMMARY.md`(통합 결론)와 `INDEX.md`(파일 안내)를 가진다. **처음 읽는다면 각 토픽의 SUMMARY.md부터.**
- JSONL 데이터셋의 기계가독 카탈로그는 [MANIFEST.json](MANIFEST.json), 사람용 가이드는 [README.md](README.md)다.

## 한눈에 보기

| 토픽 | 종류 | 한 줄 요약 | entryPoint |
|---|---|---|---|
| [idea-final-decisions-62.jsonl](idea-final-decisions-62.jsonl) | 결정 장부 (JSONL 62) | 최종 Experiment Pass 4·Merge 11·Custom Reserve 5·Fail 42와 UX·게이트·사유 정본 | [JSONL](idea-final-decisions-62.jsonl) |
| [newsletter-leads/](newsletter-leads/) | 외부 발견 큐 (JSONL 7) | 뉴스레터 사례를 8,406개 전수 심사와 분리해 Hold·Merge·Fail로 기록하는 안전한 입구 | [README.md](newsletter-leads/README.md) |
| [gas-app/](gas-app/) | 문서 코퍼스 (12) | Gas 앱(익명 칭찬/투표) 성장·붕괴·규제·인프라 벤치마크 | [SUMMARY.md](gas-app/SUMMARY.md) |
| [idea-tools-2026/](idea-tools-2026/) | 문서 코퍼스 (6) | 아이디어 검증 SaaS의 결제 순간 딜리버러블 4층 구조 | [SUMMARY.md](idea-tools-2026/SUMMARY.md) |
| [oneul-haebolkka-demand/](oneul-haebolkka-demand/) | 문서 코퍼스 (4) | "오늘 해볼까" 수요 신호 교차검증 — 중~강, 포지셔닝 조건부 | [SUMMARY.md](oneul-haebolkka-demand/SUMMARY.md) |
| [oneul-haebolkka-ux-test/](oneul-haebolkka-ux-test/) | 문서 코퍼스 (2) | 전체 여정 UX 테스트 — 발행 여정 단절 3/3 합의와 Gas 루프 비교 | [SUMMARY.md](oneul-haebolkka-ux-test/SUMMARY.md) |
| [card-art-prompting/](card-art-prompting/) | 문서 코퍼스 (3) | 카드 아트 세트 일관성 프롬프트 기법 + gpt-image-2 5필드 구조 | [SUMMARY.md](card-art-prompting/SUMMARY.md) |
| [store-seo-title/](store-seo-title/) | 문서 코퍼스 (2) | 스토어 상위 랭킹 제목 공식 → 카드 40장 제목 개선 | [SUMMARY.md](store-seo-title/SUMMARY.md) |
| [mobbin/mobile-card-action-patterns.jsonl](mobbin/mobile-card-action-patterns.jsonl) | 데이터셋 (JSONL 1) | Tinder·Gas 카드 액션과 오늘 해볼까 2장 직접 선택 결론 캐시 | [JSONL](mobbin/mobile-card-action-patterns.jsonl) |
| [material-design-3/](material-design-3/) | 데이터셋 (JSONL 5) | M3 공식 문서 403개 URL의 페이지·섹션·토큰·Do/Don't/Caution 로컬 검색 코퍼스 | [README.md](material-design-3/README.md) |
| [trustmrr-acquire/](trustmrr-acquire/) | 데이터셋 (JSONL 1) | TrustMRR 인수시장 스타트업 1,863건 아이디어 씨앗 | [README.md](trustmrr-acquire/README.md) |
| [store-rankings/](store-rankings/) | 데이터셋 (JSONL 9) | 앱스토어·크롬 웹스토어 랭킹/검색 수요 신호 ~17k행 | [README.md](store-rankings/README.md) |
| [pixel-campfire/](pixel-campfire/) | 구현 근거 (3) | 참조 모닥불 SCSS의 레이어·팔레트·애니메이션을 구조화한 자료 | [README.md](pixel-campfire/README.md) |
| [moonlight-ref/](moonlight-ref/) | 에셋 (4) | Moonlight 스타일 디자인 토큰 CSS·인터랙션 데모·6축 카드 데이터·녹화 GIF | [INDEX.md](moonlight-ref/INDEX.md) |
| [class101 강의대본](class101-윤민정-cso-ai-프로덕트-빌딩-강의대본.md) | 낱개 문서 | 윤민정 CSO AI 프로덕트 빌딩 강의 유튜브 대본 원문 | 파일 자체 |
| [simplicity DOM 실측](simplicity-output-dom-실측.md) | 낱개 문서 | toss.im/simplicity 결과 화면 DOM 변화 CDP 실측 → 이식 설계 | 파일 자체 |

---

## gas-app

Nikita Bier가 만든 10대 대상 익명 칭찬/투표 앱 Gas(2022 출시~2023 Discord 인수 후 종료)에 대한 제품·성장·커뮤니티·시장·안전성 리서치와, 완성도 비평으로 보강한 한국 로컬 맥락·심리학 근거·리텐션 붕괴·기술 인프라 4개 갭 문서를 종합해 "오늘 해볼까" 벤치마킹에 참고하는 리서치 코퍼스.

entryPoint: [gas-app/SUMMARY.md](gas-app/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [gas-app/INDEX.md](gas-app/INDEX.md) | Gas 앱 리서치 전체 11개 산출물의 목차·조사 방법·산출물 구조·핵심 발견 하이라이트를 정리한 안내 파일. 먼저 읽을 SUMMARY.md로 안내한다. |
| [gas-app/SUMMARY.md](gas-app/SUMMARY.md) | Gas 앱 리서치 11개 파일을 통합한 최종 보고서. K-factor>1.0 성장 메커니즘, Discord 인수 8주 전 이미 시작된 실사용 붕괴, God Mode 등 유료화 모델의 FTC 제재 계보, 한국 카피캣·규제 리스크, 심리학적 다크패턴 학술 근거, Supabase 매직링크 시간당 2통 한도 같은 기술 인프라 시사점을 "오늘 해볼까" 벤치마킹 관점으로 종합했다. |
| [gas-app/product/PRODUCT_OVERVIEW.md](gas-app/product/PRODUCT_OVERVIEW.md) | Gas 앱의 제품 개요, 출시~종료 타임라인, 핵심 게임 메커닉(폴 응답→익명 알림→60분 쿨다운+초대로 스킵), 수익화(코인+God Mode $6.99/주), 지역 제한 독점 전개 성장 전략을 정리한 제품 개요 문서. |
| [gas-app/mobbin/FLOWS.md](gas-app/mobbin/FLOWS.md) | mobbin-mcp로 실제 캡처한 Gas 앱 iOS UI 6개 플로우(온보딩·폴 응답·초대·상점·인박스·프로필)를 화면 단위로 분석한 문서. 대기시간 잠금+초대 스킵, 학교 서브도메인 딥링크 등 바이럴 루프의 UX 디테일을 기록했다. |
| [gas-app/community/INSIGHTS.md](gas-app/community/INSIGHTS.md) | Reddit·Hacker News에서 수집한 Gas 앱 커뮤니티 반응 — 가짜 답장 의혹, 유료화 회의론, Discord 인수/종료에 대한 3갈래 반응, 정식 종료보다 앞선 체감 인기 하락 증언을 정리한 VOC 문서. |
| [gas-app/social/SOCIAL_LISTENING.md](gas-app/social/SOCIAL_LISTENING.md) | twitter-cli로 확보한 Gas 창업자 Nikita Bier 본인의 트윗 원문 — K-factor>1.0 공개, 학교당 36시간 내 40-50% 침투율, 친구찾기 인프라 90% 리소스 투입 등 성장 전략 1차 발언을 시간순 정리한 소셜 리스닝 문서. |
| [gas-app/market/COMPETITORS.md](gas-app/market/COMPETITORS.md) | Gas·TBH·NGL·Sendit 등 익명 투표/컴플리먼트 앱 9곳의 비즈니스 모델·규제 이력을 매핑하고 TAM/SAM/SOM을 추정한 경쟁 지형 문서. NGL FTC $5M 합의, Sendit DOJ 제소 등 규제 리스크 비교표 포함. |
| [gas-app/voc/SAFETY_AND_REVIEWS.md](gas-app/voc/SAFETY_AND_REVIEWS.md) | Gas 앱스토어 리뷰 감정분석, 10대 안전성 논란(인신매매 괴담, 전문가 비판), Discord의 실제 종료 사유(acqui-hire), NGL·Sendit FTC 규제 사례를 정리한 VOC·안전성 문서. |
| [gas-app/gaps/gap-1-한국-로컬-맥락.md](gas-app/gaps/gap-1-한국-로컬-맥락.md) | Gas 자체는 한국 미출시지만 국산 카피캣 OMG·HYPE와 계보 앱 에스크의 실제 형사사건, 아만다 과징금 선례로 한국 리스크가 개인정보보호법·정보통신망법에서 나온다는 것을 밝힌 갭 보강 문서. |
| [gas-app/gaps/gap-2-심리학-다크패턴-근거.md](gas-app/gaps/gap-2-심리학-다크패턴-근거.md) | 언론 코멘트뿐이던 심리학적 근거를 Festinger·Leary·Nesi & Prinstein(2019)·다크패턴 taxonomy 등 학술 문헌 15건 이상으로 보강하고 근거 기반 설계 지침 5개를 도출한 갭 보강 문서. |
| [gas-app/gaps/gap-3-리텐션-붕괴-메커니즘.md](gas-app/gaps/gap-3-리텐션-붕괴-메커니즘.md) | Gas의 실사용 붕괴가 Discord 인수 발표보다 8주 앞서 이미 98% 진행됐음을 입증하고 원인을 신뢰 충격·구조적 K-factor 감쇠·변동보상 루프 신뢰붕괴 3갈래로 분석한 갭 보강 문서. |
| [gas-app/gaps/gap-4-기술-인프라-실패사례.md](gas-app/gaps/gap-4-기술-인프라-실패사례.md) | Gas 공동창업자 트윗 스레드 3건 전문(Redis SET 낭비, TLS 협상 폭주 다운타임)을 원전에서 확보해 Supabase/Vercel 스택으로 환산하고 실행 아이템 6개를 도출한 갭 보강 문서. |
| [gas-app/gaps/gap-5-K팩터-심리학-근본원인.md](gas-app/gaps/gap-5-K팩터-심리학-근본원인.md) | 5 Whys 3사슬·K 수식 분해·Hooked 모델·역방향 검증으로 K>1의 근본 원인("사적 칭찬을 공개적 정체성 퍼즐로 바꾸고 정답 후보를 같은 공동체에 몰아넣은 설계")을 도출한 종합 분석. 오늘 해볼까 함의 3개 포함. |

---

## idea-tools-2026

"오늘 해볼까" 최종 가치(딜리버러블) 개선을 위해 유행 아이디어 생성·검증 SaaS(IdeaBrowser·DimeADozen·GummySearch 등)·GitHub OSS·Reddit/HN 실반응을 조사해, 결제 순간 공통 4층 구조(판정·근거·다음행동·재방문)와 "지인 무로그인 투표"라는 고유 자산의 시장 공백을 확인한 리서치.

entryPoint: [idea-tools-2026/SUMMARY.md](idea-tools-2026/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [idea-tools-2026/INDEX.md](idea-tools-2026/INDEX.md) | "오늘 해볼까" 최종 가치 개선을 위한 아이디어 생성·검증 도구 리서치 문서 5개(요약·시장 스캔·딜리버러블 해부·VOC·OSS 스캔)의 목차와 각 파일의 수집 수단을 정리한 인덱스. |
| [idea-tools-2026/SUMMARY.md](idea-tools-2026/SUMMARY.md) | 유행 아이디어 검증 SaaS(IdeaBrowser·DimeADozen·GummySearch 등)가 결제 순간 건네는 공통 4층 딜리버러블 구조(판정·근거·다음행동·재방문)와 실증 팩트 10개를 종합해 "오늘 해볼까" 개선 방향(실행 브리프·수요 영수증 리포트)을 도출한 통합 결론. |
| [idea-tools-2026/market/SAAS_SCAN.md](idea-tools-2026/market/SAAS_SCAN.md) | IdeaBrowser·DimeADozen·GummySearch·Exploding Topics·디스콰이엇 등 아이디어 생성·검증 SaaS 15개를 최종 가치물·가격모델·유행근거·훔칠 점 기준으로 개별 카드화한 시장 스캔(WebSearch/WebFetch 기반). |
| [idea-tools-2026/deep/DELIVERABLE_ANATOMY.md](idea-tools-2026/deep/DELIVERABLE_ANATOMY.md) | IdeaBrowser(11섹션 리포트)·DimeADozen(8섹션 $9/$129 검증 리포트)·GummySearch·Exploding Topics의 결제 순간 딜리버러블을 목차·근거출처·무료유료 경계·재방문 장치 단위까지 실물 해부하고 "오늘 해볼까"와의 갭 3줄씩 짚은 심층 분석. |
| [idea-tools-2026/community/VOC.md](idea-tools-2026/community/VOC.md) | Reddit(r/SaaS·r/startupideas·r/indiehackers)·HN에서 수집한 아이디어 생성/검증 도구에 대한 빌더 실반응 — 원하는 결과물 Top5, 지불 실증(GummySearch 유료 1만명), AI 점수 신뢰붕괴 밈 등 냉소 Top5, "오늘 해볼까" 시사점 5줄. |
| [idea-tools-2026/tech/OSS_SCAN.md](idea-tools-2026/tech/OSS_SCAN.md) | 아이디어 생성·발견·검증 GitHub 오픈소스 17개 레포(reddit-ai-trends·idea-validation-agents·subscope·fider 등)를 아웃풋·데이터소스 기준으로 스캔해 키리스 커뮤니티 마이닝·판정+다음행동 1개·CLI 스킬화 등 접근법 패턴 5가지를 도출. |

---

## oneul-haebolkka-demand

"오늘 해볼까"(씨앗 기반 아이디어 슬롯+지인 투표 수요확인 제품)의 수요 신호를 웹 시장 스캔과 Reddit/X/디스콰이엇 커뮤니티 VOC로 교차검증해 "수요 신호 중~강, 포지셔닝 조건부"라는 종합 판정과 지불 의사 패턴·설계 반영안을 도출한 2026-07-06 리서치.

entryPoint: [oneul-haebolkka-demand/SUMMARY.md](oneul-haebolkka-demand/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [oneul-haebolkka-demand/SUMMARY.md](oneul-haebolkka-demand/SUMMARY.md) | 오늘 해볼까에 대한 수요 신호를 웹·Reddit·X·국내 커뮤니티에서 교차검증한 통합 결론 — 판정은 "수요 신호 중~강, 포지셔닝 조건부"이며 지불 의사 패턴표와 설계 반영 4개 항목을 담는다. |
| [oneul-haebolkka-demand/INDEX.md](oneul-haebolkka-demand/INDEX.md) | 오늘 해볼까 수요 검증 리서치 토픽의 파일 안내 — 시장 스캔과 커뮤니티 VOC 2건을 종합한 SUMMARY.md부터 읽으라는 안내와 조사 방법·핵심 발견 하이라이트. |
| [oneul-haebolkka-demand/market/MARKET_ANALYSIS.md](oneul-haebolkka-demand/market/MARKET_ANALYSIS.md) | IdeaBrowser·IdeasAI·Kernal·ValidatorAI·DimeADozen·IdeaProof 등 아이디어 생성/검증 도구의 가격·트랙션·지불 의사 신호를 비교표로 정리하고, "지인 투표" 유료 시장은 국내외 공백이며 순수 생성은 무료화되지만 1회성 소액 리포트($9~€99)는 성립한다는 패턴을 도출한 경쟁 분석. |
| [oneul-haebolkka-demand/community/INSIGHTS.md](oneul-haebolkka-demand/community/INSIGHTS.md) | Reddit·X·디스콰이엇에서 "뭘 만들지 몰라서 못 시작한다"·"검증 없이 만들고 침묵당한다" 두 가설을 실제 원문 인용(포인트·댓글수 포함)으로 지지·반박 양쪽 다 수집하고, 솔루션 피칭 글은 죽고 문제 공감 글만 흥하는 패턴을 정리한 VOC 원자료. |

---

## oneul-haebolkka-ux-test

"오늘 해볼까" 전체 여정(뽑기→확정→발행·공유→수신자 응원)을 실제 클릭 캡처와 3개 경험층 페르소나로 점검한 UX 리포트. 최대 발견은 발행→로그인→대시보드 단절이며, Gas 벤치마크의 K 루프 조건과 비교해 개선 우선순위를 정리했다.

entryPoint: [oneul-haebolkka-ux-test/SUMMARY.md](oneul-haebolkka-ux-test/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [oneul-haebolkka-ux-test/SUMMARY.md](oneul-haebolkka-ux-test/SUMMARY.md) | 오늘 해볼까 전체 여정 UX 테스트 통합 리포트 — 신입·중급·숙련 페르소나 워크스루, 독립 리뷰, Gas 벤치마크 비교, 발행 여정 봉합 액션을 포함한다. |
| [oneul-haebolkka-ux-test/INDEX.md](oneul-haebolkka-ux-test/INDEX.md) | UX 테스트 토픽의 짧은 안내와 진입점. |

---

## card-art-prompting

카드 아트(오늘 해볼까 뒷면·축6·분야10·오로라12) 세트를 위한 전문가급 AI 이미지 프롬프트 기법 리서치 — 세트 일관성 워크플로우와 gpt-image-2 5필드 구조화 프롬프트 설계.

entryPoint: [card-art-prompting/SUMMARY.md](card-art-prompting/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [card-art-prompting/INDEX.md](card-art-prompting/INDEX.md) | card-art-prompting 리서치 폴더 안내 — 카드 아트용 전문가급 AI 이미지 프롬프트 기법 조사의 진입점, 어느 파일에 무엇이 있는지 요약. |
| [card-art-prompting/SUMMARY.md](card-art-prompting/SUMMARY.md) | AI 이미지 프롬프트 리서치 종합 — 카드 세트 일관성은 "히어로 이미지 확정→스타일 앵커 재사용" 워크플로우임을 밝히고, 타로 골드라인 공식·툴별(MJ/Nano Banana/DALL-E/Flux) 구현법과 gpt-image-2 Thinking 모드의 다장 일관 생성이 왜 카드아트 세트에 특히 유리한지 정리. |
| [card-art-prompting/GPT2-PROMPT-STRUCTURE.md](card-art-prompting/GPT2-PROMPT-STRUCTURE.md) | gpt-image-2 공식 쿡북·fal.ai·Reddit 실측을 종합해 카드 아트 프롬프트를 Use case/Subject/Composition/Palette/Constraints 5필드 구조로 재설계한 근거와, 오로라 카드 12장에 실제 적용한 사례. |

---

## store-seo-title

앱스토어·크롬 웹스토어 상위 랭킹 제목을 분석해 "브랜드형 이름+구분자+검색 키워드" 제목 공식을 도출하고, 이를 오늘 해볼까 카드 40장의 제목 개선에 적용한 리서치.

entryPoint: [store-seo-title/SUMMARY.md](store-seo-title/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [store-seo-title/SUMMARY.md](store-seo-title/SUMMARY.md) | 앱스토어(Apple RSS·크롬 웹스토어) 상위 랭킹 제목 분석으로 "이름+구분자+검색키워드" 제목 공식을 도출하고, 오늘 해볼까 카드 40장의 제목을 브랜드 이름+SEO 부제 형태로 개선 적용한 기록. |
| [store-seo-title/INDEX.md](store-seo-title/INDEX.md) | store-seo-title 토픽의 파일 안내 — 현재 SUMMARY.md 하나뿐이며, 스토어 SEO 제목 공식 리서치와 카드 제목 개선 적용 결과가 담겨 있다. |

---

## idea-source-coverage (아이디어 원본 검토 장부)

TrustMRR·App Store·Chrome Web Store의 컴팩트 원본 8,406건을 한 장부로 합쳐 `unseen`부터 사용자 승인까지 검토 상태를 추적한다. 현재 앱에 있다는 사실과 품질 승인을 분리하고, 정규화 이름은 중복 후보 탐색에만 사용한다.

entryPoint: [idea-source-coverage-summary.md](idea-source-coverage-summary.md)

| 경로 | 설명 |
|---|---|
| [idea-source-coverage-summary.md](idea-source-coverage-summary.md) | 데이터셋별 수, 초기 상태, 앱 원본 연결 상태, 다음 회차 사용법을 정리한 사람용 요약. |
| [idea-source-coverage.jsonl](idea-source-coverage.jsonl) | 원본 1건=1행(8,406행). `review_status`·`review_batch`·`rejection_code`·`matched_scenario_ids`로 반복 검사를 막는다. |
| [../../scripts/research/build-idea-source-coverage.mjs](../../scripts/research/build-idea-source-coverage.mjs) | 세 컴팩트 데이터셋과 현재 Idea Lab 시나리오를 읽어 장부·요약을 재생성하는 스크립트. |

---

## newsletter-leads (외부 발견 큐)

뉴스레터에서 발견한 제품·운영 사례를 카드 원본으로 오인하지 않도록 분리한 큐다. 모든 행이 `denominator_effect: 0`이므로 8,406개 원본 장부와 EXH 통계에는 영향을 주지 않는다. 공식 제품 원문과 27개 조합 감사를 통과하기 전에는 앱 데이터에 넣지 않는다.

entryPoint: [newsletter-leads/README.md](newsletter-leads/README.md)

| 경로 | 설명 |
|---|---|
| [newsletter-leads/README.md](newsletter-leads/README.md) | 분리 원칙, 뉴스레터별 역할, 정식 후보로 이동하는 조건, 검증 명령을 설명한다. |
| [newsletter-leads/newsletter-leads.jsonl](newsletter-leads/newsletter-leads.jsonl) | 뉴스레터 발견 사례 1건=1행. `Hold`·`Merge`·`Fail`만 허용하며 `Candidate`는 넣지 않는다. |
| [../../scripts/research/verify-newsletter-idea-leads.mjs](../../scripts/research/verify-newsletter-idea-leads.mjs) | 분모 오염, 중복 ID, 무근거 8,406개 키, 조기 Candidate 승격을 검사한다. |

---

## trustmrr-acquire (데이터셋)

TrustMRR 인수 마켓플레이스(trustmrr.com/acquire)를 로그인 상태 무한스크롤로 전량 수집한 스타트업 1,863건 — 매출·희망가·배수·문제·기회·MVP 앵글 필드를 가진 아이디어 씨앗 데이터셋. 슬롯 카드덱 v5(134장)의 원천 데이터이기도 하다.

entryPoint: [trustmrr-acquire/README.md](trustmrr-acquire/README.md)

| 경로 | 설명 |
|---|---|
| [trustmrr-acquire/README.md](trustmrr-acquire/README.md) | 수집 방법·필드 정의·카테고리 분포·최고 매출/최저 희망가 시그널·PRD 후보 풀을 정리한 사람용 가이드. |
| [trustmrr-acquire/ideas.jsonl](trustmrr-acquire/ideas.jsonl) | 스타트업 1건=1행(1,863행). `revenue_30d_value`·`asking_price_value`·`problem`·`mvp_angle` 등으로 필터링해 쓴다. |

---

## store-rankings (데이터셋)

Apple 앱스토어(RSS 차트·카테고리 차트·키워드 검색)와 크롬 웹스토어(카테고리·톱차트·키워드 검색)의 랭킹/노출 신호를 수집·정규화한 JSONL 9종(~17,000행). PRD 아이디어 마이닝에서 TrustMRR과 교차 검증용.

entryPoint: [store-rankings/README.md](store-rankings/README.md)

| 경로 | 설명 |
|---|---|
| [store-rankings/README.md](store-rankings/README.md) | 파일별 용도·수집 방법 테스트 결과·국가/카테고리/키워드 커버리지·행 수를 정리한 사람용 가이드. |
| [store-rankings/app-store-expanded-unique-apps.jsonl](store-rankings/app-store-expanded-unique-apps.jsonl) | 앱 단위 중복 제거 요약(4,512앱) — 컴팩트한 App Store 유니버스가 필요할 때 시작점. |
| [store-rankings/chrome-webstore-expanded-unique-extensions.jsonl](store-rankings/chrome-webstore-expanded-unique-extensions.jsonl) | 확장 단위 중복 제거 요약(2,031개) — 컴팩트한 크롬 웹스토어 유니버스 시작점. |
| 나머지 appearance/baseline 6종 + overlap 1종 | 랭크·출처·국가·쿼리 맥락이 필요할 때만 파고드는 상세 파일. [store-rankings/README.md](store-rankings/README.md)와 [MANIFEST.json](MANIFEST.json) 참조. |

---

## moonlight-ref (디자인 레퍼런스 에셋)

app.moonlight.world에서 추출한 "오늘 해볼까" 아웃풋 UI 스타일 레퍼런스 — 드롭인 디자인 토큰 CSS, 6축 카드 뽑기 인터랙션 데모 HTML, 6축 카드 데이터 JS.

entryPoint: [moonlight-ref/INDEX.md](moonlight-ref/INDEX.md)

| 경로 | 설명 |
|---|---|
| [moonlight-ref/INDEX.md](moonlight-ref/INDEX.md) | 에셋 3종의 출처·용도·주의점 안내. |
| [moonlight-ref/moonlight-tokens.css](moonlight-ref/moonlight-tokens.css) | Moonlight 라이브 DOM에서 추출(2026-07-05)한 드롭인 디자인 토큰 — 폰트(Work Sans/Playfair Display/Pinyon Script)·컬러·radius·하드 오프셋 그림자·카드 flip 값. |
| [moonlight-ref/moonlight-interaction.html](moonlight-ref/moonlight-interaction.html) | 6축 카드 뽑기 인터랙션 단일 파일 데모(폰트 임베드, v7: 카드 고정+리롤) — 팬덱·슬롯 UX의 원형. |
| [moonlight-ref/axes-data.js](moonlight-ref/axes-data.js) | trustmrr+App Store 리서치를 층화샘플한 6축(누가/고민/장면/모양/방법/마음) 134장 카드 데이터, 도메인 태그 포함. |
| [moonlight-ref/moonlight-freeform.gif](moonlight-ref/moonlight-freeform.gif) | Moonlight 인터랙션 화면 녹화 GIF — 움직임 레퍼런스. |

---

## 낱개 문서

| 경로 | 설명 |
|---|---|
| [class101-윤민정-cso-ai-프로덕트-빌딩-강의대본.md](class101-윤민정-cso-ai-프로덕트-빌딩-강의대본.md) | 윤민정(Class101 CSO) 진행 "AI시대 누구나 혼자서도 시작 가능한 프로덕트 빌딩" 유튜브 강의의 자동 자막 대본 원문(게스트 김시현·네오). minjung-coach 스킬의 원천 자료. |
| [simplicity-output-dom-실측.md](simplicity-output-dom-실측.md) | toss.im/simplicity 결과·상세 화면의 DOM 변화를 CDP+MutationObserver로 실측(2026-07-06) — 인라인 style 뮤테이션 애니메이션, 스토리형 상세 UI, 가라오케 자막 메커니즘과 "오늘 해볼까" 이식 설계표. |

## 기계가독 카탈로그

- [MANIFEST.json](MANIFEST.json) — JSONL 데이터셋 카탈로그(행 수·키 필드·출처·파생 관계). 데이터셋을 코드로 다룰 때 시작점.
- [README.md](README.md) — 데이터셋 전용 사람용 가이드(추천 탐색 경로·조인 키·jq 예시 명령).
