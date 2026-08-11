# 맛핀 아키텍처와 데이터 경계

이 문서는 맛핀의 실제 실행 흐름, 저장 데이터, 개인정보 경계와 운영자 API 계약을 설명하는 정본입니다. 구현과 문서가 다르면 현재 코드를 먼저 확인하고 이 문서를 함께 고쳐요.

## 서비스 범위

맛핀은 사용자가 Instagram DM으로 `matpin.kr`에 공유한 공개 음식점 게시물을 분석합니다. 릴스, 일반 피드 게시물, 캐러셀과 Instagram 게시물 링크를 지원하며, 확인된 장소를 사용자별 보관함에 저장해요.

다음 입력은 저장 대상으로 처리하지 않습니다.

- DM에 직접 입력한 글
- DM에 직접 첨부한 이미지와 동영상
- Instagram 게시물이 아닌 외부 링크
- 프로필 링크와 지원하지 않는 첨부파일

이 입력은 장소 분석과 AI 호출에서 제외합니다. 사용자가 다음 행동을 알 수 있도록 같은 대화에 사용 방법만 답장해요.

## 사용자 처리 흐름

1. Meta Webhook이 `/api/matpin/webhook`으로 이벤트를 보냅니다.
2. 서버는 요청 크기를 512KB 이하로 제한하고 `x-hub-signature-256` 서명을 검증해요.
3. 지원 게시물과 안내가 필요한 메시지를 분리합니다.
4. 지원 게시물은 발신자 식별자를 해시와 암호문으로 바꾸고, 임시 미디어 URL을 암호화한 뒤 Supabase와 PGMQ에 등록합니다.
5. 사용자가 보낸 메시지에는 접수 답장을 먼저 전송해요.
6. 워커는 공개 게시물의 캡션, 작성자 댓글, 화면과 음성 단서를 분석하고 실제 장소 후보를 확인합니다.
7. 장소를 찾으면 최대 3곳을 보관함에 저장하고, 짧은 보관함 링크를 DM으로 보냅니다.
8. 분석 결과는 게시물 식별자를 키로 캐시합니다. 같은 게시물은 캐시가 명시적으로 무효화되지 않는 한 다시 AI로 분석하지 않아요.

Webhook은 요청을 받은 뒤 최대 3건의 큐 작업을 백그라운드에서 시작합니다. 재시도 가능한 오류는 제한된 횟수만 다시 시도하고, 최종 실패는 운영자가 어드민에서 재처리할 수 있습니다.

## 저장 데이터

| 저장소 | 저장하는 값 | 저장하지 않는 값 또는 처리 원칙 |
| --- | --- | --- |
| `matpin_instagram_users` | 발신자 해시, 암호화한 Instagram scoped ID, 보관함 토큰 해시, 짧은 링크 해시, 링크 만료 시각 | Instagram 이름, 사용자명과 프로필 이미지는 저장하지 않습니다. |
| `matpin_instagram_messages` | Meta 메시지 ID, 발신자 해시, 공개 게시물 식별자와 URL, 처리 상태, 장소 후보, 분석 시간과 사용량 | DM 원문은 저장하지 않아요. 임시 미디어 URL 암호문은 분석 완료 또는 최종 실패 시 제거합니다. |
| `matpin_saved_places` | 발신자 해시, 원본 게시물 식별자, 장소명, 주소, 좌표, 역 또는 지역, 지도 링크 | 삭제한 장소는 일반 조회에서 제외합니다. 계정 삭제 시 연관 데이터도 함께 삭제돼요. |
| `matpin_media_analysis_cache` | 게시물 식별자, 분석 결과, 장소 후보, 분석 모델과 사용량, 적중 횟수 | 30일 만료 규칙이 없습니다. 실패 재처리 등 명시적인 무효화가 있기 전까지 재사용합니다. |
| `matpin_api_usage_events` | 분석 단계, 공급자, 모델, 요청 수, 토큰과 처리 시간 | 게시물 원문과 DM 원문은 넣지 않습니다. |
| `matpin_admin_actions` | 관리자 ID, 발신자 해시, 행동 종류, 멱등성 키, 문구 길이와 SHA-256, Meta 메시지 ID, 완료 상태 | 관리자가 보낸 DM 원문은 저장하지 않으며, 결과가 불확실한 발송은 `uncertain`으로 종결해 자동 재전송을 막습니다. |

모든 맛핀 테이블은 RLS를 켜고 `anon`과 일반 `authenticated` 역할의 직접 접근을 거부합니다. 데이터 접근은 서버의 `service_role` 클라이언트만 사용해요.

## 식별자와 링크

- 발신자 scoped ID는 `MATPIN_DATA_SECRET`으로 AES-256-GCM 암호화합니다.
- 조회와 결합에는 같은 비밀값으로 만든 HMAC 발신자 해시를 사용해요.
- 개인 보관함 토큰과 16자리 짧은 코드는 `MATPIN_LINK_SECRET`으로 결정적으로 생성합니다.
- DB에는 보관함 토큰과 짧은 코드의 SHA-256 해시만 저장합니다.
- `/s/{code}`는 유효한 사용자를 찾은 뒤 `/matpin/saved#token=...`으로 307 이동하며 `no-store`와 `no-referrer`를 적용해요.
- 현재 보관함 접근 기한은 마지막 지원 게시물 수신 시점부터 90일로 갱신됩니다. 짧은 코드 자체는 같지만 만료 시 링크는 404를 반환합니다.

## 분석 캐시

캐시는 공개 게시물 식별자를 기준으로 동작합니다. 첫 요청이 90초 임대를 얻어 분석하고, 동시에 들어온 요청은 완료를 기다려요. 완료된 `ready` 항목은 자동 만료 없이 재사용되며 적중 횟수와 마지막 사용 시각만 갱신합니다.

실패 메시지를 수동 재처리할 때는 해당 캐시를 무효화하고 다시 분석합니다. 이 행동은 잘못된 영구 결과를 운영자가 고칠 수 있도록 둔 예외예요.

## 운영 CRM 흐름

`/matpin/admin`은 최근 Instagram 대화와 맛핀 저장 상태를 한 화면에 합칩니다.

1. 최근 대화, 메시지 본문, 이름, 사용자명과 프로필 이미지는 Meta API에서 실시간으로 읽습니다.
2. 대화별 발신자 scoped ID를 서버에서 해시한 뒤 맛핀 DB의 메시지, 저장 장소와 사용량에 연결해요.
3. 브라우저에는 암호문, access token 해시, scoped ID와 임시 미디어 URL을 보내지 않습니다.
4. Meta 대화 상세는 최근 20건만 표시합니다. 일부 프로필이나 대화 조회가 실패하면 가능한 데이터는 보여주고 partial 상태를 표시해요.
5. 운영 행동은 한 사용자씩 미리보기와 확인을 거쳐 실행하며 감사 메타데이터를 남깁니다.

### 관리자 인증

- Supabase Google 로그인을 사용합니다.
- 맛핀 전용 로그인 클라이언트는 공유 Google 로그인 플래그를 사용하지 않습니다.
- 브라우저는 복귀 경로 `/matpin/admin`을 같은 탭의 `sessionStorage`에 보관하고, Supabase에는 고정된 `/auth/callback` URL만 전달해요.
- 서버에서 매 요청 `auth.getUser()`로 세션을 확인해요.
- 확인된 이메일이 `MATPIN_ADMIN_EMAILS` 허용목록에 있어야 합니다.
- `user_metadata`는 권한 판단에 사용하지 않습니다.
- 허용목록이 비어 있으면 모든 관리자 접근을 403으로 거부해요.
- 세션 갱신 미들웨어는 `/matpin/admin`과 `/api/matpin/admin/**`에만 적용합니다.
- 페이지와 모든 관리자 API는 `private, no-store`로 응답합니다.
- `/matpin/admin`과 하위 경로에서는 Google Analytics, Clarity와 Meta Pixel을 로드하지 않아요.

### 관리자 API

| 메서드와 경로 | 역할 | 주요 제한 |
| --- | --- | --- |
| `GET /api/matpin/admin/summary` | 24시간, 7일, 30일과 전체 운영 지표 | Meta 조회가 실패하면 DB 지표만 제공하고 Meta 지표는 비가용 상태로 표시합니다. |
| `GET /api/matpin/admin/conversations` | 최근 대화와 DB 상태를 병합한 커서 목록 | 한 페이지 최대 20개, 필터는 전체, 답장 필요, 처리 중, 저장 완료와 실패입니다. |
| `GET /api/matpin/admin/conversations/[id]` | 최근 메시지 20건, 저장 장소와 처리 이력 | 수신자와 프로필을 Meta에서 다시 조회합니다. |
| `POST /api/matpin/admin/conversations/[id]/messages` | 자유 문구 DM 한 건 발송 | 비어 있지 않은 UTF-8 기준 1,000바이트 이하, 최근 사용자 수신 후 24시간 미만, 발송 직전 수신자 재검증이 필요합니다. |
| `POST /api/matpin/admin/messages/[id]/reprocess` | 실패 게시물 재처리 | 상태가 `failed`인 메시지만 자동 DM 없이 큐에 등록하고 `202`를 반환합니다. |
| `POST /api/matpin/admin/messages/[id]/resend` | 개인 보관함 링크 재전송 | 삭제되지 않은 저장 장소가 한 곳 이상 있어야 합니다. |

세 가지 변경 API는 관리자별 UUID 멱등성 키를 요구합니다. 같은 키의 중복 클릭은 기존 결과를 반환하거나 진행 중 상태를 알려줘요.

## 환경 변수 계약

실제 값은 저장소와 문서에 넣지 않고 Vercel 또는 로컬 비밀 환경에 등록합니다.

### 관리자 Google 로그인

- `NEXT_PUBLIC_SUPABASE_URL` 또는 서버용 `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 `SUPABASE_PUBLISHABLE_KEY`
- `MATPIN_ADMIN_EMAILS`

### Supabase 서버 데이터

- `SUPABASE_SERVICE_ROLE_KEY`

### Meta 수신과 발송

- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_GRAPH_API_VERSION`
- `META_INSTAGRAM_ACCOUNT_ID`
- `META_INSTAGRAM_ACCESS_TOKEN`
- `MATPIN_INSTAGRAM_PIPELINE_MODE`

### 데이터와 공개 링크

- `MATPIN_DATA_SECRET`
- `MATPIN_LINK_SECRET`
- `MATPIN_PUBLIC_APP_URL`
- `CRON_SECRET`

### 분석과 장소 확인

- `GEMINI_API_KEY`
- `ALLSALE_GEMINI_API_KEY`, 기존 서버 설정을 사용하는 대체 키입니다.
- `MATPIN_EXTRACTION_MODEL`
- `MATPIN_MAPS_MODEL`
- `MATPIN_GEMINI_MODEL`, 이전 설정과의 호환용입니다.
- `GOOGLE_MAPS_API_KEY`
- `KAKAO_REST_API_KEY`
- `MATPIN_MEDIA_ALLOWED_HOSTS`

`META_INSTAGRAM_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `MATPIN_DATA_SECRET`과 `MATPIN_LINK_SECRET`은 브라우저 번들에 넣으면 안 됩니다.

## 삭제와 보존

사용자는 `/matpin/delete`에서 저장 장소 하나를 지우거나 전체 계정을 삭제할 수 있습니다. 계정 삭제는 사용자 행과 연결된 메시지, 저장 장소, 사용량을 연쇄 삭제해요. 관리 CRM v1에는 사용자 삭제와 장소 수정 기능을 넣지 않았습니다.

`matpin_admin_actions`는 일반 조회 정책이 없는 독립 감사 로그입니다. 서비스 역할도 조회, 추가와 완료 열 수정만 가능하고 직접 삭제할 수 없어요. 사용자가 계정을 삭제하면 데이터베이스 트리거가 같은 발신자 해시의 감사 로그를 먼저 삭제해 사용자 연결 정보가 남지 않습니다.

관리자 재처리는 `matpin_requeue_failed_message_without_reply`를 사용합니다. 기존 운영 호출자는 두 인자 `matpin_requeue_failed_message` 계약을 유지하며, Supabase RPC 오버로드는 남기지 않아요. 큐 소비자는 600초 가시성 잠금을 사용하고 Vercel 함수 실행 시간은 최대 300초로 제한합니다.

캐시는 사용자 데이터가 아니라 공개 게시물의 분석 결과를 공유하는 구조입니다. 따라서 한 사용자의 계정 삭제가 같은 공개 게시물의 공용 분석 캐시까지 자동 삭제하지는 않아요. 캐시를 제거해야 하는 운영 사유가 생기면 별도 무효화 절차로 처리합니다.
