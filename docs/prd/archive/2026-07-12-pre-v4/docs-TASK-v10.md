# 오늘 해볼까 — 실행 계획 (TASK.md)

> **현재 실행 정본은 [모바일 최종 플로우 v10](prd/오늘-해볼까-모바일-최종-플로우-v10.md)이다.** 2026-07-10에 `/` 로그인·취향·직접 카드 2장과 `/vs/[slug]` 로그인·선택·칭찬·재생산 루프로 교체했다.
> 아래 §1~§7은 2026-07-08 코드 스냅샷을 보존한 레거시 참고다. 구형 4축 슬롯·확정·발행·대시보드 체크리스트를 현재 실행 작업으로 사용하지 않는다.

## 0. v10 현재 작업판 (2026-07-10)

### 완료

- [x] `/` 진입 시 로그인 필수, OAuth 복귀 URL과 맥락 보존, 데모 세션 폴백
- [x] 첫 취향 3-8개 필수 다중선택, 재방문 편집은 모달 바텀시트
- [x] 카드 A/B를 표면 탭 두 번으로 직접 공개, 중앙 덱은 비행 출발점인 비입력 요소
- [x] 공유 URL v2에 `round_id`, `parent_round_id`, `root_round_id`, 취향 계보 포함
- [x] `/vs/[slug]` 로그인 시트, 라디오 그룹·방향키, 긍정 칭찬 3개, 선택 초안 복원
- [x] Supabase 저장 확인 전 성공 표시 금지, 네트워크 실패 로컬 큐·온라인 재전송
- [x] `project-bfd`에 `v10_duel_vote_lineage_and_idempotency` 마이그레이션 적용
- [x] K 퍼널 이벤트와 고유 `round_opened` 중복 방지, 공유 클릭은 K에서 제외
- [x] 320/360/390px·1280px, 키보드, reduced motion, 네트워크 실패, 서버 실저장 브라우저 검증
- [x] `npm run build`, `npm run typecheck`, `npm run lint`, 금칙어 검색 통과
- [x] 카드 선정 H0~H5 20,000회 비교 후 `fit-contrast-v2` 적용: 라우팅 프로필 적합 100%, 차별성 95.4%
- [x] 의미 앵커 전수 검토 12장: 6장 문구·근거 수정, 6장 런타임 격리, 승인 카드 67장

### 남은 외부 검증

- [ ] Supabase Google provider와 redirect URL을 운영 도메인에 연결하고 `NEXT_PUBLIC_GOOGLE_LOGIN=1` 실 OAuth 왕복 확인
- [ ] 실 OAuth 전환 뒤 `duel_votes`의 익명 insert 정책을 authenticated/Edge Function 기반으로 강화
- [ ] BF.D 코호트에서 `unique round_opened x opened→round_shared`를 측정해 K>=1.1 여부 확인
- [ ] `fit-contrast-v2`의 카드 키별 `round_shared`·`praise_sent` 전환을 측정해 다음 카피 수정 순서 확정
- [ ] `src/data/card-quality-gates.json`의 격리 6장에 검증 가능한 앵커를 붙여 한 장씩 재승인
- [ ] 카드별 `monetizable`·`oneDay`·`local`·`aiNative` 정규화 태그를 검수해 취향 칩의 강한 약속을 별도 게이트로 전환

---

## A. 레거시 원칙 (2026-07-08 스냅샷)

1. **디자인 완성도 기준 = toss.im/simplicity.** 인트로→히어로 원 컨티뉴어스 샷, opacity/transform만. 인트로는 [`docs/dev/references/simplicity-intro/README.md`](dev/references/simplicity-intro/README.md)의 재현 원칙 4개를 따른다. **단, 디자인 리셋 완료 후에는 랜딩 자체가 사라지고 인트로가 게임판(`/slot`→`/`) 안에 내장된다** — [docs/prd/오늘-해볼까-디자인-리셋.md](prd/오늘-해볼까-디자인-리셋.md) D6~D8, D17.
1-1. **표면 문법 = glassmorphism 2.0 + Aurora Mesh** (현재 상태) → **moonlight 게임판(다크+블루 글로우+세리프)로 이행 중** (목표 상태, 미착수). 임의의 불투명 배경 패널 금지.
2. **아토믹 계층(atoms → molecules → organisms → layouts → routes), 파일 하나가 한 가지 일.** 라우트에 로직 없음(organism에 위임). 250줄 상한 — 슬롯 인터랙션 코어(`fan-deck`·`slot-cell`·`slot-machine`)만 예외 허용.
3. **응원 데이터는 Supabase가 진실의 원천, localStorage는 오프라인 폴백.** 로그인·결제 지점은 여전히 가짜 문(로그인은 env 플래그로 실전환 가능). 카피 금칙어(아이디어 생성기·AI 추천·랜덤)·여정·계측은 PRD를 그대로 따른다.
4. **문서(`docs/`)와 코드(`src/`)는 최상위에서 분리, 코드 안에서도 프론트(`src/app`·`src/components`·`src/lib`)와 DB 연동 계층(`src/lib/backend/`)을 분리한다** (2026-07-08 재정리). 단, 진짜 백엔드 서버는 없다 — `src/lib/backend/`도 브라우저에서 실행되는 Supabase 클라이언트 코드다(RLS로 보호). `public/`·`supabase/`(DB 스키마)·`scripts/`는 Next.js 규칙·배포 편의상 리포 루트에 그대로 둔다.

---

## 1. 디렉터리 아키텍처 (구현 실측 — 2026-07-08, src/ 재구성 반영)

```
src/
  app/                          # 라우트·레이아웃만. 로직 없음
    layout.tsx                  #   폰트 + 전역 셸
    page.tsx                    #   [L] 인트로 + 랜딩 (stage: boot→intro→landing) — 리셋 시 폐기 예정
    start/page.tsx               #   [S0] 씨앗 온보딩 — 여정 밖 독립 페이지
    slot/page.tsx                #   [S1] 빈 슬롯 (+ ?seed=&via=vote 수신자 프리필 → 자동 스핀 1회)
    publish/page.tsx             #   [S3] 카드 발행
    c/[slug]/page.tsx            #   [S5] 수신자 공개 카드 응원 (무로그인) — OG 메타 없음(§5 P0)
    vs/[slug]/page.tsx           #   [S5-VS] A/B 응원 대결 — 무로그인, 역시 OG 메타 없음
    dashboard/page.tsx           #   [S6] 수요 대시보드 + A/B 대결 생성
    globals.css                  #   다크 토큰 + aurora/glass 유틸 + 인트로 keyframes
  components/
    atoms/                      # button, chip, pill, glass-card, blur-veil, progress-dots
    molecules/                  # fake-door-sheet ("준비 중이에요" 시트 — 계측은 CTA 쪽 fakeDoor())
    organisms/
      intro-sequence.tsx        # [L] 인트로 4단계
      landing/                  # hero · how-it-works · faq · final-cta — 리셋 시 폐기 예정
      slot/                     # slot-machine(오케스트레이터) · fan-deck(부채꼴 덱)
                                #   · slot-cell · card-surface(카드 표면 스킨) · taste-sheet · gold-sentence
                                #   · assemble(조사 교정) · confirm-branch(확정 분기, flip 카드 호출) · idea-flip-card(v6/v7 flip UI + 공유 게이트) · paywall-sheet(S1b)
      journey/                  # onboarding(S0) · publish-flow/publish-card/share-row(S3)
                                #   · vote-panel(S5, 4칩 긍정 전용) · duel-panel(S5-VS) · duel-status
                                #   · demand-board(S6, 리포트 placeholder + A/B 대결 생성)
    layouts/                    # page-shell, top-bar, bottom-cta
  lib/
    pools.ts                    # ★빈 슬롯 뽑기 엔진 — 취향 80/20 가중 + 씨앗 allowlist 앵커
                                #   + buildDeck + 골든 판정(goldenFor) + taste 저장/로드
    slot-store.ts               # zustand: 필수 4칸+옵션 마음(35%) · 🔒고정(Prioritize)
                                #   · 개별 채움/교체/제거 캡 미소모 · 🎲전체 뽑기만 캡 5 소모
    backend/                    # ★DB 연동 계층 (2026-07-08 lib/supabase + lib/votes.ts 통합 재배치)
      client.ts                 #   Supabase 브라우저 클라이언트 초기화
      auth.ts                   #   구글 OAuth — env(NEXT_PUBLIC_GOOGLE_LOGIN)+provider 설정 시 실 로그인, 아니면 가짜 통과 폴백
      votes.ts                  #   응원 데이터층 — Supabase 우선 + localStorage 낙관/폴백, voterFp 익명 dedup
    brief.ts                    # buildPrompt — 확정 카드의 "만들기 프롬프트" 생성(공유 게이트 뒤에서 언락)
    golden-store.ts             # public/data/golden.json 런타임 fetch 저장소
    combos.ts                   # 카드 데이터 로직 (tracks·pains·formats·allow·templates, trustmrr 앵커 반영 v6/v7)
    draw.ts                     # 3릴 시절 순수 함수 (pools가 대체 — 타입 공급용으로 잔존)
    josa.ts / share.ts / storage.ts / track.ts / utils.ts
  data/combos.json              # 카드 데이터 (combos.ts가 로드)
public/cards/                   # 과거 카드 이미지 자산 — 현재 런타임은 잉크/SVG 카드 중심, 파일은 비교용 보존
supabase/                        # DB 스키마(.sql) — 개인 대시보드 SQL Editor로만 적용
scripts/                        # 개발 도구 — Supabase 연결 확인, 카드 품질 실험 스크립트
```

의존 방향은 아래로만: routes → organisms → molecules → atoms / 전 계층 → lib·data. atoms는 `cn` 외 import 없음. `@/*` 별칭은 `src/*`를 가리킨다(`tsconfig.json`).

---

## 2. 구현 현황 ✅ (2026-07-08 기준)

| 화면 | 구현된 것 | 핵심 계측 |
|---|---|---|
| **[L]** 랜딩+인트로 | 인트로 4단계 + 미니멀 4섹션. **디자인 리셋 확정으로 폐기 예정**(아직 코드엔 남아 있음) | `view_landing` `intro_skip` `landing_cta_click` |
| **[S1]** 빈 슬롯 | 4칸 빈 시작, 부채꼴 덱에서 한 장씩 채움 → 탭=교체·✕=제거·🔒고정(교체/제거/전체뽑기 면제)·🎲전체 뽑기만 캡 5 소모. 옵션 💭마음 35%. 취향 시트: 2번째 전체 뽑기부터 미설정 시 40% 등장, 이후 덱·뽑기 취향 80/20 가중. 불편·형태는 씨앗 allowlist 앵커 | `slot_fill` `slot_swap` `slot_remove` `reel_lock_toggle` `slot_spin` `spin_cap_hit` `taste_submitted/skipped` `idea_confirmed` |
| **[S1b]** 페이월① | 캡 소진 시트: 공유 +3 / 오늘 패스 1,900 가짜 문 | `paywall_view` `paywall_share_choose` `pay_day_pass_click` |
| **[확정 분기]** | **flip 카드**(`idea-flip-card.tsx`, 타로 비율 300:485): 앞면=설명+고통 타임라인, 뒷면=해결+근거(trustmrr 앵커)+MVP. **공유해야 만들기 프롬프트가 열리는 공유 게이트** — 실행 플랜 990원은 폐지됨 | `confirm_vote_first_click` `confirm_share_click` `prompt_copied` `confirm_later_click` |
| **[S3]** 발행 | 구글 로그인(env 플래그로 실전환 가능, 기본은 가짜 통과) → 9:16 카드 + 공유(카톡/링크/스토리) | `auth_prompt/done` `card_share` |
| **[S5]** 응원 | slug 디코딩 공개 카드, 무로그인, **4칩 긍정 전용**(🔥나도 이거 필요해/🙌완성하면 알려줘/👀지켜볼게/💪너라면 만들어, 부정 선택지 없음) + Supabase 실연동(`castVote`) + 중복 방지(voterFp) → "나도 뽑아보기" 프리필 재진입 | `public_card_view` `card_vote` `vote_comment` `vote_to_spin` |
| **[S5-VS]** A/B 응원 대결 | 최근 카드 2장으로 대결 링크 생성(`/vs/[slug]`), Gas식 강제 양자택일이되 둘 다 응원(부정 없음), 무로그인 | `duel_created` (대시보드) · 대결 페이지 자체 계측은 vote-panel과 동형 |
| **[S6]** 대시보드 | 발행 카드별 무료 = "N명 도착"+첫 반응 1개(BlurVeil, 판정/유형분해는 아직 `●` placeholder), 5표 게이트, A/B 대결 만들기, 리포트 가짜 문 | `dashboard_view` `pay_demand_report_click`(=`fakeDoor`) |
| **[S0]** 온보딩 | 독립 페이지(여정 밖) — 씨앗 칩 선택 → `oneul:seed` 저장 | — |

가짜 문 공통: `fakeDoor(product, price)` → `pay_{day_pass|demand_report}_click` 기록 후 "준비 중이에요" 시트.

---

## 3. 레거시 Phase 3 통합 검증 (v10에서 대체됨)

- [ ] `npm run typecheck` + `next build` 통과, 콘솔 에러 0
- [ ] **스모크 여정 (현재 구현 기준) 무단절 확인**:
  1. 인트로 완주 → 랜딩 CTA → `/slot` 4칸 빈 시작
  2. 덱에서 4장 채워 첫 아이디어 완성 → 🔒 고정 후 🎲 → 잠긴 축 유지 확인
  3. 취향 시트 등장 → 제출 → 이후 결과가 취향 가중되는지
  4. 확정 → flip 카드 앞/뒤 전환 → 공유 전엔 프롬프트 잠김 확인 → 공유 후 언락 → `/publish` 로그인 → 발행
  5. 링크 복사 → `/c/[slug]` 응원(4칩) → "나도 뽑아보기" 재진입 루프
  6. 대시보드에서 카드 2장 이상일 때 A/B 대결 생성 → `/vs/[slug]`에서 응원
  7. `localStorage.events`에 §2 이벤트 전부 적재 확인
- [ ] 금칙어 grep 0건: `grep -rn "아이디어 생성기\|AI 추천\|랜덤 아이디어\|판정: ●●●\|검증된 고유 투표자" src/app src/components` — **현재 2건 잔존(demand-board.tsx), 미해결**
- [ ] S5·S5-VS 소스에 로그인·설치 관련 문자열 0자 확인

## 4. 레거시 Phase 4 품질 패스 (v10에서 대체됨)

- [ ] `codex exec -s read-only --skip-git-repo-check -C . "<리뷰 프롬프트>" < /dev/null` — 슬롯 상태머신(고정/교체/캡)·fan-deck 이벤트 누수·slug 왕복 인코딩(단일+대결 두 형식)·race 중점
- [ ] 발견 검증 후 취사 반영 → 재스모크

## 5. 레거시 백로그 (v10 핵심 플로우 제외)

- [ ] **per-slug 서버 OG 메타** — `/c/[slug]`·`/vs/[slug]`가 전부 `"use client"`라 카톡 인앱 브라우저 링크 프리뷰가 빈 화면. `generateMetadata` + 최소 `opengraph-image` 필요. **카톡 오픈률 직결 — 최우선**
- [ ] **수요 리포트 4층 실장** — ①규칙 기반 판정(🔥 비율·표본 임계값) ②반응유형 실제 집계(현재 `●` placeholder → `row.votes` 기반) ③리드 목록 + 아웃리치 초안 ④재방문 카피. 현재 결제해도 실제 콘텐츠 없음
- [ ] **금칙어 스윕** — `demand-board.tsx`의 "판정: ●●●" · "검증된 고유 투표자" 삭제/교체
- [ ] **디자인 리셋 P1~P5 잔여 확인** — [docs/prd/오늘-해볼까-디자인-리셋.md](prd/오늘-해볼까-디자인-리셋.md) §5 구현 순서. `src/lib/card-art.ts`·`TarotCard` 런타임 참조 제거는 반영됨. 남은 작업은 `draw.ts` 3릴 잔재, 보존용 `public/cards/aurora/**`의 사용 여부, 화면별 스모크 확인.
- [x] ~~유령 씨앗 12개 승격~~ — `src/data/combos.json`에서 확인 완료, 기존 골든 카드 뽑기 가능
- [ ] `src/lib/draw.ts` 3릴 잔재 정리 — pools로 타입 이관 후 제거
- [ ] R5 경계(대시보드 무료/유료 분기)·리빌(실명 옵트인)·힌트 1회권 990원 도입 여부 — 사용자 결정 필요(PRD §5 표 참고)

---

## 6. 주차별 계획 (실측이 무엇을 진짜로 만들지 결정 — PRD §6)

| 주차 | 목표 | 산출물 |
|------|------|--------|
| **1주차 7/6–7/12** | 진행 중, 일부 계획보다 초과 달성 | ✅ 완료: 전 여정 골격, 카드 콘텐츠 v6/v7, Supabase 응원 백엔드(계획보다 조기), A/B 응원 대결. ❌ 남음: §5 백로그 전부(OG메타·수요리포트·금칙어·디자인리셋) |
| **2주차 7/13–7/19** | 실유저 투하 → 병목 1개 확정 | 씨앗 입력 난이도·공유 실발생 여부·지불 클릭 실측(Supabase 실 데이터로 즉시 확인 가능). 골든 조합 확장 |
| **3주차 7/20–7/26** | 로그인 실전환 + 결제 실물화 | `NEXT_PUBLIC_GOOGLE_LOGIN=1` 전환 + 구글 provider 설정, 수요 리포트 4층 실장. 결제는 계속 가짜 문 |
| **4주차 7/27–8/2** | 실전 투하 + 실측 | BF.D 코호트 배포, K·결제 클릭·씨앗 품질 실측, 데모 영상 + 백로그 |

**4주 내 비접촉(PRD Non-goals)**: 이메일 인프라, 스핀 캡 강제, 진짜 PG, 매직링크, 투표 알림, 리텐션 기계.

---

## 7. Definition of Done (1주차)

1. typecheck·build 통과, 콘솔 에러 0.
2. §3 스모크 여정이 한 번도 끊기지 않는다 (수신자 프리필 루프 + A/B 대결 포함).
3. 금칙어 grep 0건 — **현재 2건 잔존, 미충족**. S5·S5-VS 소스에 로그인·설치 문자열 0자.
4. 컴포넌트 파일당 250줄 이하 — 슬롯 인터랙션 코어(`fan-deck`·`slot-cell`·`slot-machine`)만 예외로 인정, atoms의 외부 import 0(`cn` 제외), 라우트에 화면 로직 0.
5. reduced-motion에서 인트로 생략·기능 전부 동작. 애니메이션은 opacity/transform만.
6. `localStorage.events`에 가짜 문 2종 클릭이 상품·가격 파라미터와 함께 적재된다.
