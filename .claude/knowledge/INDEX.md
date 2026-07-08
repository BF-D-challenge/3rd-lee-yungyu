# .claude/knowledge/ 전체 지도

`.claude/knowledge/`는 리서치 산출물 저장소다. 이 `INDEX.md`가 전체 지도이며, 여기서부터 각 토픽의 entryPoint로 들어가면 된다.

---

## gas-app

Nikita Bier가 만든 10대 대상 익명 칭찬/투표 앱 Gas(2022 출시~2023 Discord 인수 후 종료)에 대한 제품·성장·커뮤니티·시장·안전성 리서치와, 완성도 비평으로 보강한 한국 로컬 맥락·심리학 근거·리텐션 붕괴·기술 인프라 4개 갭 문서를 종합해 "오늘 해볼까" 벤치마킹에 참고하는 리서치 코퍼스.

entryPoint: [research/gas-app/SUMMARY.md](research/gas-app/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [research/gas-app/INDEX.md](research/gas-app/INDEX.md) | Gas 앱 리서치 전체 11개 산출물의 목차·조사 방법·산출물 구조·핵심 발견 하이라이트를 정리한 안내 파일. 먼저 읽을 SUMMARY.md로 안내한다. |
| [research/gas-app/SUMMARY.md](research/gas-app/SUMMARY.md) | Gas 앱 리서치 11개 파일을 통합한 최종 보고서. K-factor>1.0 성장 메커니즘, Discord 인수 8주 전 이미 시작된 실사용 붕괴, God Mode 등 유료화 모델의 FTC 제재 계보, 한국 카피캣·규제 리스크, 심리학적 다크패턴 학술 근거, Supabase 매직링크 시간당 2통 한도 같은 기술 인프라 시사점을 "오늘 해볼까" 벤치마킹 관점으로 종합했다. |
| [research/gas-app/product/PRODUCT_OVERVIEW.md](research/gas-app/product/PRODUCT_OVERVIEW.md) | Gas 앱의 제품 개요, 출시~종료 타임라인, 핵심 게임 메커닉(폴 응답→익명 알림→60분 쿨다운+초대로 스킵), 수익화(코인+God Mode $6.99/주), 지역 제한 독점 전개 성장 전략을 정리한 제품 개요 문서. |
| [research/gas-app/mobbin/FLOWS.md](research/gas-app/mobbin/FLOWS.md) | mobbin-mcp로 실제 캡처한 Gas 앱 iOS UI 6개 플로우(온보딩·폴 응답·초대·상점·인박스·프로필)를 화면 단위로 분석한 문서. 대기시간 잠금+초대 스킵, 학교 서브도메인 딥링크 등 바이럴 루프의 UX 디테일을 기록했다. |
| [research/gas-app/community/INSIGHTS.md](research/gas-app/community/INSIGHTS.md) | Reddit·Hacker News에서 수집한 Gas 앱 커뮤니티 반응 — 가짜 답장 의혹, 유료화 회의론, Discord 인수/종료에 대한 3갈래 반응, 정식 종료보다 앞선 체감 인기 하락 증언을 정리한 VOC 문서. |
| [research/gas-app/social/SOCIAL_LISTENING.md](research/gas-app/social/SOCIAL_LISTENING.md) | twitter-cli로 확보한 Gas 창업자 Nikita Bier 본인의 트윗 원문 — K-factor>1.0 공개, 학교당 36시간 내 40-50% 침투율, 친구찾기 인프라 90% 리소스 투입 등 성장 전략 1차 발언을 시간순 정리한 소셜 리스닝 문서. |
| [research/gas-app/market/COMPETITORS.md](research/gas-app/market/COMPETITORS.md) | Gas·TBH·NGL·Sendit 등 익명 투표/컴플리먼트 앱 9곳의 비즈니스 모델·규제 이력을 매핑하고 TAM/SAM/SOM을 추정한 경쟁 지형 문서. NGL FTC $5M 합의, Sendit DOJ 제소 등 규제 리스크 비교표 포함. |
| [research/gas-app/voc/SAFETY_AND_REVIEWS.md](research/gas-app/voc/SAFETY_AND_REVIEWS.md) | Gas 앱스토어 리뷰 감정분석, 10대 안전성 논란(인신매매 괴담, 전문가 비판), Discord의 실제 종료 사유(acqui-hire), NGL·Sendit FTC 규제 사례를 정리한 VOC·안전성 문서. |
| [research/gas-app/gaps/gap-1-한국-로컬-맥락.md](research/gas-app/gaps/gap-1-한국-로컬-맥락.md) | Gas 자체는 한국 미출시지만 국산 카피캣 OMG·HYPE와 계보 앱 에스크의 실제 형사사건, 아만다 과징금 선례로 한국 리스크가 개인정보보호법·정보통신망법에서 나온다는 것을 밝힌 갭 보강 문서. |
| [research/gas-app/gaps/gap-2-심리학-다크패턴-근거.md](research/gas-app/gaps/gap-2-심리학-다크패턴-근거.md) | 언론 코멘트뿐이던 심리학적 근거를 Festinger·Leary·Nesi & Prinstein(2019)·다크패턴 taxonomy 등 학술 문헌 15건 이상으로 보강하고 근거 기반 설계 지침 5개를 도출한 갭 보강 문서. |
| [research/gas-app/gaps/gap-3-리텐션-붕괴-메커니즘.md](research/gas-app/gaps/gap-3-리텐션-붕괴-메커니즘.md) | Gas의 실사용 붕괴가 Discord 인수 발표보다 8주 앞서 이미 98% 진행됐음을 입증하고 원인을 신뢰 충격·구조적 K-factor 감쇠·변동보상 루프 신뢰붕괴 3갈래로 분석한 갭 보강 문서. |
| [research/gas-app/gaps/gap-4-기술-인프라-실패사례.md](research/gas-app/gaps/gap-4-기술-인프라-실패사례.md) | Gas 공동창업자 트윗 스레드 3건 전문(Redis SET 낭비, TLS 협상 폭주 다운타임)을 원전에서 확보해 Supabase/Vercel 스택으로 환산하고 실행 아이템 6개를 도출한 갭 보강 문서. |

---

## idea-tools-2026

"오늘 해볼까" 최종 가치(딜리버러블) 개선을 위해 유행 아이디어 생성·검증 SaaS(IdeaBrowser·DimeADozen·GummySearch 등)·GitHub OSS·Reddit/HN 실반응을 조사해, 결제 순간 공통 4층 구조(판정·근거·다음행동·재방문)와 "지인 무로그인 투표"라는 고유 자산의 시장 공백을 확인한 리서치.

entryPoint: [research/idea-tools-2026/SUMMARY.md](research/idea-tools-2026/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [research/idea-tools-2026/INDEX.md](research/idea-tools-2026/INDEX.md) | "오늘 해볼까" 최종 가치 개선을 위한 아이디어 생성·검증 도구 리서치 문서 5개(요약·시장 스캔·딜리버러블 해부·VOC·OSS 스캔)의 목차와 각 파일의 수집 수단을 정리한 인덱스. |
| [research/idea-tools-2026/SUMMARY.md](research/idea-tools-2026/SUMMARY.md) | 유행 아이디어 검증 SaaS(IdeaBrowser·DimeADozen·GummySearch 등)가 결제 순간 건네는 공통 4층 딜리버러블 구조(판정·근거·다음행동·재방문)와 실증 팩트 10개를 종합해 "오늘 해볼까" 개선 방향(실행 브리프·수요 영수증 리포트)을 도출한 통합 결론. |
| [research/idea-tools-2026/market/SAAS_SCAN.md](research/idea-tools-2026/market/SAAS_SCAN.md) | IdeaBrowser·DimeADozen·GummySearch·Exploding Topics·디스콰이엇 등 아이디어 생성·검증 SaaS 15개를 최종 가치물·가격모델·유행근거·훔칠 점 기준으로 개별 카드화한 시장 스캔(WebSearch/WebFetch 기반). |
| [research/idea-tools-2026/deep/DELIVERABLE_ANATOMY.md](research/idea-tools-2026/deep/DELIVERABLE_ANATOMY.md) | IdeaBrowser(11섹션 리포트)·DimeADozen(8섹션 $9/$129 검증 리포트)·GummySearch·Exploding Topics의 결제 순간 딜리버러블을 목차·근거출처·무료유료 경계·재방문 장치 단위까지 실물 해부하고 "오늘 해볼까"와의 갭 3줄씩 짚은 심층 분석. |
| [research/idea-tools-2026/community/VOC.md](research/idea-tools-2026/community/VOC.md) | Reddit(r/SaaS·r/startupideas·r/indiehackers)·HN에서 수집한 아이디어 생성/검증 도구에 대한 빌더 실반응 — 원하는 결과물 Top5, 지불 실증(GummySearch 유료 1만명), AI 점수 신뢰붕괴 밈 등 냉소 Top5, "오늘 해볼까" 시사점 5줄. |
| [research/idea-tools-2026/tech/OSS_SCAN.md](research/idea-tools-2026/tech/OSS_SCAN.md) | 아이디어 생성·발견·검증 GitHub 오픈소스 17개 레포(reddit-ai-trends·idea-validation-agents·subscope·fider 등)를 아웃풋·데이터소스 기준으로 스캔해 키리스 커뮤니티 마이닝·판정+다음행동 1개·CLI 스킬화 등 접근법 패턴 5가지를 도출. |

---

## oneul-haebolkka-demand

"오늘 해볼까"(씨앗 기반 아이디어 슬롯+지인 투표 수요확인 제품)의 수요 신호를 웹 시장 스캔과 Reddit/X/디스콰이엇 커뮤니티 VOC로 교차검증해 "수요 신호 중~강, 포지셔닝 조건부"라는 종합 판정과 지불 의사 패턴·설계 반영안을 도출한 2026-07-06 리서치.

entryPoint: [research/oneul-haebolkka-demand/SUMMARY.md](research/oneul-haebolkka-demand/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [research/oneul-haebolkka-demand/SUMMARY.md](research/oneul-haebolkka-demand/SUMMARY.md) | 오늘 해볼까에 대한 수요 신호를 웹·Reddit·X·국내 커뮤니티에서 교차검증한 통합 결론 — 판정은 "수요 신호 중~강, 포지셔닝 조건부"이며 지불 의사 패턴표와 설계 반영 4개 항목을 담는다. |
| [research/oneul-haebolkka-demand/INDEX.md](research/oneul-haebolkka-demand/INDEX.md) | 오늘 해볼까 수요 검증 리서치 토픽의 파일 안내 — 시장 스캔과 커뮤니티 VOC 2건을 종합한 SUMMARY.md부터 읽으라는 안내와 조사 방법·핵심 발견 하이라이트. |
| [research/oneul-haebolkka-demand/market/MARKET_ANALYSIS.md](research/oneul-haebolkka-demand/market/MARKET_ANALYSIS.md) | IdeaBrowser·IdeasAI·Kernal·ValidatorAI·DimeADozen·IdeaProof 등 아이디어 생성/검증 도구의 가격·트랙션·지불 의사 신호를 비교표로 정리하고, "지인 투표" 유료 시장은 국내외 공백이며 순수 생성은 무료화되지만 1회성 소액 리포트($9~€99)는 성립한다는 패턴을 도출한 경쟁 분석. |
| [research/oneul-haebolkka-demand/community/INSIGHTS.md](research/oneul-haebolkka-demand/community/INSIGHTS.md) | Reddit·X·디스콰이엇에서 "뭘 만들지 몰라서 못 시작한다"·"검증 없이 만들고 침묵당한다" 두 가설을 실제 원문 인용(포인트·댓글수 포함)으로 지지·반박 양쪽 다 수집하고, 솔루션 피칭 글은 죽고 문제 공감 글만 흥하는 패턴을 정리한 VOC 원자료. |

---

## card-art-prompting

카드 아트(오늘 해볼까 뒷면·축6·분야10·오로라12) 세트를 위한 전문가급 AI 이미지 프롬프트 기법 리서치 — 세트 일관성 워크플로우와 gpt-image-2 5필드 구조화 프롬프트 설계.

entryPoint: [research/card-art-prompting/INDEX.md](research/card-art-prompting/INDEX.md)

| 경로 | 설명 |
|---|---|
| [research/card-art-prompting/INDEX.md](research/card-art-prompting/INDEX.md) | card-art-prompting 리서치 폴더(파일 2개) 안내 — 카드 아트용 전문가급 AI 이미지 프롬프트 기법 조사의 진입점, 어느 파일에 무엇이 있는지 요약. |
| [research/card-art-prompting/SUMMARY.md](research/card-art-prompting/SUMMARY.md) | AI 이미지 프롬프트 리서치 종합 — 카드 세트 일관성은 "히어로 이미지 확정→스타일 앵커 재사용" 워크플로우임을 밝히고, 타로 골드라인 공식·툴별(MJ/Nano Banana/DALL-E/Flux) 구현법과 gpt-image-2 Thinking 모드의 다장 일관 생성이 왜 카드아트 세트에 특히 유리한지 정리. |
| [research/card-art-prompting/GPT2-PROMPT-STRUCTURE.md](research/card-art-prompting/GPT2-PROMPT-STRUCTURE.md) | gpt-image-2 공식 쿡북·fal.ai·Reddit 실측을 종합해 카드 아트 프롬프트를 Use case/Subject/Composition/Palette/Constraints 5필드 구조로 재설계한 근거와, 오로라 카드 12장에 실제 적용한 사례. |

---

## store-seo-title

앱스토어·크롬 웹스토어 상위 랭킹 제목을 분석해 "브랜드형 이름+구분자+검색 키워드" 제목 공식을 도출하고, 이를 오늘 해볼까 카드 40장의 제목 개선에 적용한 리서치.

entryPoint: [research/store-seo-title/SUMMARY.md](research/store-seo-title/SUMMARY.md)

| 경로 | 설명 |
|---|---|
| [research/store-seo-title/SUMMARY.md](research/store-seo-title/SUMMARY.md) | 앱스토어(Apple RSS·크롬 웹스토어) 상위 랭킹 제목 분석으로 "이름+구분자+검색키워드" 제목 공식을 도출하고, 오늘 해볼까 카드 40장의 제목을 브랜드 이름+SEO 부제 형태로 개선 적용한 기록. |
| [research/store-seo-title/INDEX.md](research/store-seo-title/INDEX.md) | store-seo-title 토픽의 파일 안내 — 현재 SUMMARY.md 하나뿐이며, 스토어 SEO 제목 공식 리서치와 카드 제목 개선 적용 결과가 담겨 있다. |
