# Gas 앱 리서치 — INDEX

> 조사 대상: **Gas** — Nikita Bier가 만든 10대 대상 익명 칭찬/투표 소셜 앱. 2022-08 출시 → 3개월 만에 1,000만 유저 → 2023-01 Discord 인수 → 2023-11 서비스 종료.
> 조사일: 2026-07-08 · 요청: "GAS에 대해 다양한 각도로 전체 조사 + mobbin-mcp로 주요 flow 저장·분석"
> **먼저 읽을 것: [`SUMMARY.md`](SUMMARY.md)** — 아래 전체 산출물을 종합한 최종 보고서.

## 조사 방법

- **UI 실측**: mobbin-mcp `search_flows`/`search_screens`로 iOS 앱 화면 11개 플로우 캡처.
- **1차 소스 검증**: WebSearch/WebFetch(TechCrunch, Wikipedia, FTC.gov, Appfigures, 42matters 등), twitter-cli/rdt-cli(인증됨, Nikita Bier·Dave Schatz 본인 트윗 원문 대조).
- **품질 관리**: Workflow로 문서 간 모순 7건을 원문 대조해 사실검증하고, 완성도 비평(completeness critic)으로 놓친 각도 4건을 찾아 추가 보강.

## 산출물 구조

```
gas-app/
├── SUMMARY.md                  ← 통합 최종 보고서 (여기부터 읽기)
├── INDEX.md                     ← 이 파일
├── product/PRODUCT_OVERVIEW.md  ← 제품 개요·타임라인·핵심 루프
├── mobbin/FLOWS.md              ← 실제 UI 캡처 분석 (온보딩/폴/초대/상점/인박스/프로필)
├── community/INSIGHTS.md        ← Reddit/HN 커뮤니티 반응
├── social/SOCIAL_LISTENING.md   ← Twitter/X 소셜 리스닝 (창업자 본인 발언 포함)
├── market/COMPETITORS.md        ← 경쟁사 매핑·비즈니스모델·TAM/SAM/SOM
├── voc/SAFETY_AND_REVIEWS.md    ← 앱스토어 VOC·안전성 논란·규제 리스크
└── gaps/                        ← 완성도 비평으로 보강한 갭 4건
    ├── gap-1-한국-로컬-...md     ← 한국 카피캣(OMG/HYPE)·규제환경(개인정보보호법 등)
    ├── gap-2-심리학-다크패턴-...md ← 사회비교이론·다크패턴 학술근거·설계지침 5개
    ├── gap-3-리텐션-붕괴-...md    ← 실사용 붕괴 타임라인·구조적 K-factor 감쇠
    └── gap-4-기술-인프라-...md   ← Redis 장애 원전 분석 → Supabase/Vercel 환산
```

## 핵심 발견 하이라이트 (상세는 SUMMARY.md)

1. 창업자 본인이 공개한 K-factor > 1.0의 구체적 메커니즘(트윗 원문 검증 완료).
2. 실사용 붕괴는 Discord 인수 발표보다 8주 앞섰다 — "인수사 방치" 설이 아니라 장르 구조적 현상.
3. God Mode($6.99/주) 등 "결제해야 발신자 공개" 모델은 카피캣 NGL·Sendit에서 FTC 제재로 이어짐.
4. 한국에도 동일 구조의 카피캣(OMG·HYPE)과 실제 형사사건까지 간 계보 앱(에스크)이 존재 — 국내 개인정보보호법·정보통신망법이 직접 리스크.
5. Supabase 매직링크 로그인이 내장 이메일 시간당 2통 한도와 충돌 — 바이럴 성공 시나리오에서 자기파괴적 장애 가능성(즉시 조치 권고).

## 사실검증으로 정정된 사항

God Mode 정확한 가격($6.99/주), Discord 인수가($7M은 인수가 아니라 Gas 자체 순수익이었음), TBH 인수가(공식 비공개, "$1억" 추정은 근거 약함) — 상세는 SUMMARY.md 8절.
