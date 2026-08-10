# 맛핀 프로젝트 구조

이 문서는 맛핀의 현재 제품 코드, 데이터 계약, 테스트와 운영 문서만 안내합니다. 저장소 안의 다른 실험 및 과거 제품 파일은 맛핀 활성 문서의 범위가 아니에요.

## 1. 사용자 화면

| 경로 | 역할 |
|---|---|
| `src/app/matpin/page.tsx` | 맛핀 소개 화면 |
| `src/app/matpin/start/page.tsx` | 기존 시작 주소를 소개 화면 사용 방법으로 연결 |
| `src/app/matpin/dm/page.tsx` | 기존 DM 안내 주소를 소개 화면 사용 방법으로 연결 |
| `src/app/matpin/import/page.tsx` | 기존 가져오기 주소를 소개 화면 사용 방법으로 연결 |
| `src/app/matpin/saved/page.tsx` | 개인 보관함 |
| `src/app/matpin/map/page.tsx` | 개인 보관함의 기존 호환 주소 |
| `src/app/matpin/search/page.tsx` | 검색 입력에 바로 초점을 둔 개인 보관함 |
| `src/app/matpin/station/[station]/page.tsx` | 역별 저장 장소 |
| `src/app/matpin/reel/[reel]/page.tsx` | 게시물별 저장 장소 |
| `src/app/matpin/confirm/page.tsx` | 장소 확인 흐름 |
| `src/app/matpin/delete/page.tsx` | 사용자 데이터 삭제 |
| `src/app/matpin/admin/page.tsx` | 운영 CRM 어드민 |
| `src/app/s/[code]/route.ts` | 짧은 개인 보관함 주소 해석 |

`src/app/matpin/motion-lab/`과 `src/app/matpin/storyboard-ranking/`은 제품 동작이 아닌 맛핀 시각 실험 경로입니다.

## 2. 사용자 API

| 경로 | 역할 |
|---|---|
| `src/app/api/matpin/webhook/route.ts` | Meta Webhook 검증, 입력 분류와 접수 |
| `src/app/api/matpin/jobs/process/route.ts` | 대화 이력 보강과 분석 큐 처리 |
| `src/app/api/matpin/saves/route.ts` | 개인 저장 장소 조회 |
| `src/app/api/matpin/saves/[id]/route.ts` | 저장 장소 삭제 |
| `src/app/api/matpin/account/route.ts` | 사용자 전체 데이터 삭제 |
| `src/app/api/matpin/messages/[id]/route.ts` | 처리 결과 조회 |
| `src/app/api/matpin/messages/[id]/confirm/route.ts` | 장소 확인 결과 저장 |
| `src/app/api/matpin/messages/[id]/reprocess/route.ts` | 운영 토큰 기반 실패 재처리, 자동 DM 없이 큐 등록 |
| `src/app/api/matpin/reels/preview/route.ts` | 공개 Instagram 미디어 미리보기 |

## 3. 관리자 API

| 경로 | 역할 |
|---|---|
| `src/app/api/matpin/admin/summary/route.ts` | 기간별 운영 지표 |
| `src/app/api/matpin/admin/conversations/route.ts` | 최근 대화와 처리 상태 목록 |
| `src/app/api/matpin/admin/conversations/[id]/route.ts` | 최근 메시지 최대 20건과 사용자 맥락 |
| `src/app/api/matpin/admin/conversations/[id]/messages/route.ts` | 한 명에게 자유 문구 DM 발송 |
| `src/app/api/matpin/admin/messages/[id]/reprocess/route.ts` | 실패 메시지 한 건 재처리 |
| `src/app/api/matpin/admin/messages/[id]/resend/route.ts` | 개인 보관함 주소 재전송 |

모든 관리자 API는 Supabase 세션의 Google 계정과 `MATPIN_ADMIN_EMAILS` 허용목록을 서버에서 다시 확인합니다.

## 4. 화면 컴포넌트

| 경로 | 역할 |
|---|---|
| `src/components/organisms/tastepin/matpin-mobile-frame.tsx` | 맛핀 소개 화면과 사용 방법 장면 |
| `src/components/organisms/tastepin/matpin-saved.tsx` | 개인 보관함 |
| `src/components/organisms/tastepin/matpin-station.tsx` | 역별 저장 목록 |
| `src/components/organisms/tastepin/matpin-reel-detail.tsx` | 게시물별 장소 상세 |
| `src/components/organisms/tastepin/matpin-delete-data.tsx` | 데이터 삭제 UI |
| `src/components/organisms/tastepin/matpin-admin.tsx` | 대화 목록, 상세와 사용자 맥락 |
| `src/components/organisms/tastepin/matpin-admin.module.css` | 관리자 반응형 시각 체계 |
| `src/components/organisms/tastepin/use-matpin-library.ts` | 개인 보관함 데이터 상태 |

## 5. 핵심 서버 모듈

| 경로 | 역할 |
|---|---|
| `src/lib/matpin/contract.ts` | Webhook 입력, 지원 유형과 공개 응답 스키마 |
| `src/lib/matpin/security.ts` | 서명 검증, 암호화와 토큰 해시 |
| `src/lib/matpin/store.ts` | Supabase 저장소와 큐 계약 |
| `src/lib/matpin/worker.ts` | 캐시 확인, 분석, 장소 저장과 DM 답장 |
| `src/lib/matpin/reel-source.ts` | 공개 Instagram 게시물 자료 조회 |
| `src/lib/matpin/reel-analyzer.ts` | 미디어 장소 단서 추출 |
| `src/lib/matpin/place-resolver.ts` | 실제 지도 장소 대조 |
| `src/lib/matpin/conversation-copy.ts` | 상태별 자동 DM 문구 |
| `src/lib/matpin/instagram-send.ts` | Meta Send API 호출 |
| `src/lib/matpin/library.ts` | 역별 및 게시물별 보관함 모델 |
| `src/lib/matpin/backfill.ts` | 최근 대화의 지원 게시물 보강 |
| `src/lib/matpin/resend.ts` | 보관함 주소 재전송 |

## 6. 관리자 서버 모듈

| 경로 | 역할 |
|---|---|
| `src/lib/matpin/admin-auth.ts` | Supabase Google 로그인과 이메일 허용목록 |
| `src/lib/matpin/admin-contract.ts` | 관리자 요청 및 응답 계약 |
| `src/lib/matpin/admin-http.ts` | 쿠키 인증과 비공개 응답 처리 |
| `src/lib/matpin/admin-instagram.ts` | Meta 대화, 최근 메시지와 프로필 실시간 조회 |
| `src/lib/matpin/admin-store.ts` | DB 운영 지표, 맥락과 감사 기록 |
| `src/lib/matpin/admin-service.ts` | 대화 병합, DM, 재처리와 재전송 정책 |

`src/middleware.ts`는 `/matpin/admin`과 관리자 API에만 Supabase 세션 갱신을 적용해요.

## 7. 데이터베이스

맛핀 스키마 변경은 `supabase/migrations/`의 다음 순서에 있습니다.

1. `20260801083034_create_matpin_instagram_pipeline.sql`
2. `20260802012649_add_matpin_failed_message_requeue.sql`
3. `20260802020424_save_all_matpin_places.sql`
4. `20260809025141_add_matpin_media_cache_and_post_support.sql`
5. `20260809025239_drop_unused_matpin_cache_processing_index.sql`
6. `20260809070601_add_matpin_short_links.sql`
7. `20260809103900_add_matpin_conversation_backfill.sql`
8. `20260809105826_add_matpin_usage_events.sql`
9. `20260809123904_add_matpin_conversation_crm.sql`
10. `20260809130010_create_matpin_admin_actions.sql`
11. `20260809130039_index_matpin_admin_action_messages.sql`
12. `20260809135125_restrict_matpin_admin_action_privileges.sql`
13. `20260809141659_matpin_admin_reprocess_privacy.sql`
14. `20260809142658_matpin_reprocess_rpc_name.sql`
15. `20260809142951_extend_matpin_queue_visibility.sql`
16. `20260809172104_matpin_admin_action_deduplication.sql`
17. `20260809174423_add_matpin_delivery_attempt_claims.sql`

## 8. 테스트

- `tests/unit/matpin-pipeline.test.ts`: 지원 입력과 Webhook 계약
- `tests/unit/matpin-guidance.test.ts`: 제외 입력과 사용 방법 답장
- `tests/unit/matpin-analysis-cache.test.ts`: 영구 분석 캐시
- `tests/unit/matpin-short-link.test.ts`: 짧은 보관함 주소
- `tests/unit/matpin-library.test.ts`: 개인 보관함 묶음
- `tests/unit/matpin-conversation.test.ts`: 사용자별 대화 문맥
- `tests/unit/matpin-worker.test.ts`: 분석과 저장 작업자
- `tests/unit/matpin-admin.test.ts`: 관리자 인증과 계약
- `tests/unit/matpin-admin-service.test.ts`: 관리자 DM, 복구와 감사 행동
- `tests/e2e/matpin-admin.spec.ts`: 관리자 화면 주요 흐름
- `tests/e2e/matpick.spec.ts`: 맛핀 공개 화면, 개인 보관함과 삭제 흐름 회귀 검증
- `tests/e2e/tastepin.spec.ts`: 기존 맛핀 진입 주소의 대표 랜딩 연결 회귀 검증

## 9. 활성 문서

- `docs/PRD.md`: 제품 범위와 개인정보 계약
- `docs/TASK.md`: 구현 상태와 남은 출시 게이트
- `docs/PROJECT_STRUCTURE.md`: 현재 코드 위치
- `docs/matpin/`: 운영, 아키텍처와 조사 근거의 정본
- `.design-architect/PRODUCT.md`: 제품 설계 계약
- `.design-architect/EXPERIENCE.md`: 사용자 및 운영자 경험 계약
- `.design-architect/DESIGN.md`: 화면과 시각 체계 계약

과거 맛핀 시안과 비교 자료는 역사적 근거입니다. 현재 동작을 판단할 때는 이 문서와 실제 코드 및 테스트를 우선해요.
