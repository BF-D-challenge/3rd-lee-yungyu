# 오늘 해볼까 — 실행 계획 (TASK.md)

> 기준 명세는 [PRD.md](PRD.md)(한 장)과 [prds/오늘-해볼까-prd.md](prds/오늘-해볼까-prd.md)(최종 PRD).
> **2026-07-06 개정: 클린 리빌드 + 전 화면 구현 완료(구 Phase 0~2).** 이 문서는 이제 "무엇이 어디에 구현돼 있고(§1~§2), 무엇이 남았는지(§3~§5)"를 담는다. 3릴 계획은 **빈 슬롯 모델**(PRD 확정 원칙 2)로 대체·구현됐다.

---

## 0. 원칙 (유지)

1. **디자인 완성도 기준 = toss.im/simplicity.** 인트로→히어로 원 컨티뉴어스 샷, opacity/transform만. 인트로는 [`docs/references/simplicity-intro/README.md`](docs/references/simplicity-intro/README.md)의 재현 원칙 4개를 따른다.
1-1. **표면 문법 = glassmorphism 2.0 + Aurora Mesh** (PRD 확정 원칙 5): 앰비언트 오브 + `.glass/.glass-strong/.glass-gold` + `.aurora`(`--aurora-*` 토큰). 임의의 불투명 배경 패널 금지.
2. **아토믹 계층(atoms → molecules → organisms → layouts → routes), 파일 하나가 한 가지 일.** 라우트에 로직 없음(organism에 위임). 250줄 상한 — 슬롯 인터랙션 코어(`fan-deck`·`slot-cell`·`slot-machine`)만 예외 허용.
3. **백엔드 없음(1주차).** 상태는 localStorage/sessionStorage(`oneul:*` 키, `lib/storage.ts` 일원화), **공유는 URL이 데이터 캐리어**(`lib/share.ts` slug 인코딩). 로그인·결제 3지점은 전부 가짜 문. Supabase는 "공유가 일어난다" 실측 후 3주차에만.
4. 카피 금칙어(아이디어 생성기·AI 추천·랜덤)·여정·계측은 PRD를 그대로 따른다.

---

## 1. 디렉터리 아키텍처 (구현 실측 — 2026-07-06)

```
app/                          # 라우트·레이아웃만. 로직 없음
  layout.tsx                  #   폰트 + 전역 셸
  page.tsx                    #   [L] 인트로 + 랜딩 (stage: boot→intro→landing)
  start/page.tsx              #   [S0] 씨앗 온보딩 — 여정 밖 독립 페이지 (PRD 여정 ※)
  slot/page.tsx               #   [S1] 빈 슬롯 (+ ?seed=&via=vote 수신자 프리필 → 자동 스핀 1회)
  publish/page.tsx            #   [S3] 카드 발행
  c/[slug]/page.tsx           #   [S5] 수신자 공개 카드 (무로그인)
  dashboard/page.tsx          #   [S6] 수요 대시보드
  globals.css                 #   다크 토큰 + aurora/glass 유틸 + 인트로 keyframes
components/
  atoms/                      # button, chip, pill, glass-card, blur-veil, progress-dots
  molecules/                  # fake-door-sheet ("준비 중이에요" 시트 — 계측은 CTA 쪽 fakeDoor())
  organisms/
    intro-sequence.tsx        # [L] 인트로 4단계 A워드→B빛줄기(lighten)→C블룸→D settle-to-card
    landing/                  # hero · how-it-works · faq · final-cta (미니멀 4섹션)
    slot/                     # slot-machine(오케스트레이터) · fan-deck(부채꼴 덱, v7 이식)
                              #   · slot-cell · taste-sheet · gold-sentence · assemble(조사 교정)
                              #   · confirm-branch(확정 분기) · paywall-sheet(S1b)
    journey/                  # onboarding(S0) · publish-flow/publish-card/share-row(S3)
                              #   · vote-panel(S5) · demand-board(S6)
  layouts/                    # page-shell, top-bar, bottom-cta
lib/
  pools.ts                    # ★빈 슬롯 뽑기 엔진 — 취향 80/20 가중 + 씨앗 allowlist 앵커
                              #   + buildDeck + 골든 판정(goldenFor) + taste 저장/로드
  slot-store.ts               # zustand: 필수 4칸+옵션 마음(35%) · 🔒고정(v7 Prioritize)
                              #   · 개별 채움/교체/제거 캡 미소모 · 🎲전체 뽑기만 캡 5 소모
  combos.ts / data/combos.json  # 카드 데이터 (tracks·pains·formats·allow·golden·templates)
  draw.ts                     # 3릴 시절 순수 함수 (pools가 대체 — 타입 공급용으로 잔존)
  josa.ts / share.ts / storage.ts / track.ts / utils.ts
public/cards/                 # back.png + axis/ 6종 아트 · domain/ 은 비어 있음(§3 백로그)
```

의존 방향은 아래로만: routes → organisms → molecules → atoms / 전 계층 → lib·data. atoms는 `cn` 외 import 없음.

---

## 2. 구현 현황 ✅ (typecheck 통과, 2026-07-06)

| 화면 | 구현된 것 | 핵심 계측 |
|---|---|---|
| **[L]** 랜딩+인트로 | 인트로 4단계(~4.5s, 세션 1회·아무 입력 스킵·reduced-motion 생략), D단계 settle-to-card로 히어로와 원 컨티뉴어스 샷. 미니멀 4섹션(히어로 f11 프레임·어떻게 되나요·FAQ·최종 CTA) | `view_landing` `intro_skip` `landing_cta_click` |
| **[S1]** 빈 슬롯 | 4칸 빈 시작(자동 스핀 없음), 부채꼴 덱에서 한 장씩 채움 → 탭=교체·✕=제거·🔒고정(교체/제거/전체뽑기 면제)·🎲전체 뽑기만 캡 5 소모. 옵션 💭마음 35%. **취향 시트**: 2번째 전체 뽑기부터 미설정 시 40% 등장, 제출/스킵 후 재질문 없음, 이후 덱·뽑기 취향 80/20 가중. 불편·형태는 씨앗 allowlist 앵커, 골든 일치 시 ✨타이틀 | `slot_fill` `slot_swap` `slot_remove` `reel_lock_toggle` `slot_spin` `spin_cap_hit` `taste_submitted/skipped` `idea_confirmed` |
| **[S1b]** 페이월① | 캡 소진 시트: 공유 +3 / 오늘 패스 1,900 가짜 문 | `paywall_view` `paywall_share_choose` `pay_day_pass_click` |
| **[확정 분기]** | 풀스크린 부상 카드: 주 CTA 지인 투표(무료) · 보조 4주 플랜 990 가짜 문② · 약한 링크 대시보드 | `confirm_vote_first_click` `confirm_later_click` `pay_plan_click` |
| **[S3]** 발행 | ★가짜 구글 로그인(유일 지점) → 9:16 카드 + 공유(카톡/링크/스토리) + 수요 리포트 선예약 가짜 문③ | `auth_prompt/done` `card_share` `pay_demand_report_click` `fake_door_email` |
| **[S5]** 투표 | slug 디코딩 공개 카드, 로그인·설치 요구 0자, 3버튼(🔥/💬/🤔) + 중복 방지(localStorage) → "나도 뽑아보기" = `/slot?seed=…&via=vote` 프리필(취향 자동 설정+자동 스핀 1회) | `public_card_view` `card_vote` `vote_to_spin` `vote_to_spin_landed` |
| **[S6]** 대시보드 | 발행 카드별 무료 = "N명 도착"+첫 1표만(BlurVeil, 찬반 비공개 R5), 5표 게이트, 리포트 가짜 문③ + 무결성 문구(R7) | `dashboard_view` `pay_demand_report_click` |
| **[S0]** 온보딩 | 독립 페이지로 존치(여정 밖) — 씨앗 칩 선택 → `oneul:seed` 저장 | — |

가짜 문 공통: `fakeDoor(product, price)` → `pay_{plan|day_pass|demand_report}_click` 기록 후 "준비 중이에요" 시트(이메일 수집 = `fake_door_email`).

---

## 3. 남은 작업 — Phase 3 통합 검증 (직접)

- [ ] `npm run typecheck`(✅ 통과 확인됨) + `next build` 통과, 콘솔 에러 0
- [ ] **스모크 여정 (빈 슬롯 기준) 무단절 확인**:
  1. 인트로 완주(+재방문 시 스킵) → 랜딩 CTA → `/slot` 4칸 빈 시작
  2. 덱에서 4장 채워 첫 아이디어 완성(방해 없음) → 문장·✨골든 확인
  3. 🎲 전체 뽑기 반복 → 취향 시트 등장 → "러닝" 제출 → 이후 결과가 취향 가중되는지
  4. 🔒 고정 후 🎲 → 잠긴 축 유지 확인 / 🎲 6번째 → S1b 페이월(가짜 문①)
  5. 확정 → 분기(가짜 문② 클릭 계측) → [먼저 물어보기] → `/publish` 가짜 로그인 → 발행
  6. 링크 복사 → `/c/[slug]` 투표 → "나도 뽑아보기" → `?seed=&via=vote` 자동 스핀 재진입
  7. `/dashboard`에서 N명 도착 + 블러 + 가짜 문③
- [ ] `localStorage.events`에 §2 이벤트 전부 적재 확인 (특히 `pay_*_click` 3종, `vote_to_spin_landed`)
- [ ] 375px·1280px 스크린샷 — CDP는 측정 전 **bringToFront(ensureLive) 필수**(백그라운드 탭 rAF 스로틀)
- [ ] 금칙어 grep 0건: `grep -rn "아이디어 생성기\|AI 추천\|랜덤 아이디어" app components` 무결과
- [ ] S5 소스에 로그인·설치 관련 문자열 0자 확인

## 4. 남은 작업 — Phase 4 품질 패스 (codex 병행)

- [ ] `codex exec -s read-only --skip-git-repo-check -C . "<리뷰 프롬프트>" < /dev/null` — 슬롯 상태머신(고정/교체/캡)·fan-deck 이벤트 누수(`_hov` 계열)·slug 왕복 인코딩·race 중점
- [ ] 발견 검증 후 취사 반영 → 재스모크

## 5. 백로그 (검증 통과 후, 여유 시)

- [ ] **도메인 카드 앞면 아트** — `public/cards/domain/` 비어 있음. [docs/card-art-prompts.md](docs/card-art-prompts.md) 프롬프트로 생성 → 덱/슬롯 카드(`fan-deck`·`slot-cell`)의 이모지 자리를 `<img>`로 교체
- [ ] 골든 조합 20 → 50 확장 (2주차 실측이 지목하는 태그부터)
- [ ] `lib/draw.ts` 3릴 잔재 정리 — pools로 타입 이관 후 제거

---

## 6. 주차별 계획 (실측이 무엇을 진짜로 만들지 결정 — PRD §6)

| 주차 | 목표 | 산출물 |
|------|------|--------|
| **1주차 7/6–7/12** | ✅ 빌드 완료 → §3~§4 검증 마무리 = end-to-end 가짜 루프 | 전 여정 + 가짜 문 3개 + 계측. Day 1부터 페르소나별 테스터 5명 병렬 모집 |
| **2주차 7/13–7/19** | 실유저 투하 → 병목 1개 확정 | 취향 시트 난이도·공유 실발생 여부·지불 클릭 실측. 골든 조합 확장 |
| **3주차 7/20–7/26** | "공유가 일어난다" 증명 시에만 Supabase 실연동 | `supabase/schema.sql`을 개인 계정 대시보드 SQL Editor로 적용(MCP 금지) + 구글 원탭 + 익명 투표. 결제는 계속 가짜 문 |
| **4주차 7/27–8/2** | 실전 투하 + 실측 | BF.D 코호트 배포, K·결제 클릭·씨앗 품질 실측, 데모 영상 + 백로그 |

**4주 내 비접촉(PRD Non-goals)**: 이메일 인프라, 스핀 캡 강제, 진짜 PG, 매직링크, 투표 알림, 리텐션 기계.

---

## 7. Definition of Done (1주차)

1. typecheck·build 통과, 콘솔 에러 0.
2. §3 스모크 여정이 한 번도 끊기지 않는다 (수신자 프리필 루프 포함).
3. 금칙어 grep 0건, S5 소스에 로그인·설치 문자열 0자.
4. 컴포넌트 파일당 250줄 이하 — 슬롯 인터랙션 코어(`fan-deck` 557 · `slot-cell` 280 · `slot-machine` 253)만 예외로 인정, atoms의 외부 import 0(`cn` 제외), 라우트에 화면 로직 0(`slot/page.tsx`의 URL 프리필 배선만 예외).
5. reduced-motion에서 인트로 생략·기능 전부 동작. 애니메이션은 opacity/transform만.
6. `localStorage.events`에 가짜 문 3종 클릭이 상품·가격 파라미터와 함께 적재된다.
