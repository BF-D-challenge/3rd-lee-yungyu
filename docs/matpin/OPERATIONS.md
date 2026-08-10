# 맛핀 운영과 출시 점검

이 문서는 맛핀 운영자가 배포 전후에 확인할 항목과 장애 대응 순서를 담은 정본입니다. 숫자와 권한 상태는 확인 시각에 따라 달라지므로, 과거 스냅샷을 현재 상태처럼 사용하지 않아요.

## 현재 운영 스냅샷

2026-08-09 22:59 KST에 운영 DB에서 다음 값을 확인했습니다.

| 지표 | 확인값 |
| --- | ---: |
| 사용자 | 3명 |
| 메시지 레코드 | 9건 |
| 삭제되지 않은 저장 장소 | 16곳 |
| 처리 중 | 0건 |
| 실패 | 0건 |

이 숫자는 2026-08-09 확인 스냅샷일 뿐입니다. 특히 `답장 필요`는 최근 Meta 대화의 마지막 방향을 실시간으로 읽어 계산하므로 DB의 `acknowledged_at`이나 위 표만으로 0건이라고 판단할 수 없어요.

2026-08-10 문서 정리 시점에는 관리자 CRM 관련 운영 마이그레이션 7개와 로컬 CRM 구현을 확인했습니다. 운영 배포는 아직 하지 않았고, 허용된 Google 계정 로그인과 실대화 점검 증거도 확보하지 않았어요. 실제 관리자 Google 이메일을 확정해 `MATPIN_ADMIN_EMAILS`에 등록해야 합니다. Meta 메시지 권한은 테스트 준비 완료이며 앱 검수에 제출하지 않은 상태입니다. 일반 공개 여부는 고급 액세스 승인과 앱 역할이 없는 일반 계정 왕복을 확인한 뒤 결정해야 해요.

다음 출시 전 코드 보완은 로컬 작업트리에 반영했습니다.

- Meta 대화 조회의 전체 요청 시간 예산 보장
- Webhook과 Meta 발송 분리, 암호화된 durable outbox와 lease 상태 전이
- 발송 결과가 불확실한 상태의 `uncertain` 종결과 자동 재발송 차단
- 접수 답장 terminal 전환 뒤 분석 큐를 정확히 한 번 여는 순서 보장
- 자동 답장의 UTF-8 기준 1,000바이트 제한 적용

2026-08-10 로컬 최종 검증에서 `npm run typecheck`, `npm run lint`, `npm run build`, 단위 테스트 68개 파일의 501개 테스트와 Playwright 123개 테스트가 모두 통과했습니다. Outbox 마이그레이션은 새 PostgreSQL에 처음부터 적용해 receipt ordering, claim token, cache fencing, TTL 정리, 답장 포함 및 미포함 재처리와 ACL 경합을 재현했어요. 다만 `20260809174423_add_matpin_delivery_attempt_claims.sql`은 운영 DB에 적용하지 않았습니다. 운영 배포, DB 전환, 독립 poller, 실제 관리자 로그인과 소유 테스트 계정 발송은 아직 별도 게이트입니다.

2026-08-11 PR #30 리뷰 보완 뒤 로컬에서 `npm run typecheck`, `npm run lint`, 단위 테스트 70개 파일의 556개 테스트와 Playwright 128개 테스트를 모두 통과했습니다. Playwright의 전체 실행이 새 Production build를 만들고 실제 Next 서버를 사용했으며, 출시 점검 스크립트 문법과 `git diff --check`도 통과했어요. 이 최신 검증은 로컬 코드 증거이며 운영 배포, 운영 DB 전환이나 실제 Meta 왕복 완료를 뜻하지 않습니다.

맛핀 CRM 구현과 요청된 문서 아카이브는 각각 `c20c1f2`, `6f18328`로 커밋해 원격 `codex/matpin-conversation-crm` 브랜치에 올렸습니다. 현재 검토 단위는 Draft PR #30입니다. CI Ubuntu에서만 실패한 Idea Lab의 고정 높이 검사를 실제 내용 잘림 검사로 바꿨고, 2026-08-10 로컬에서 `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`를 다시 모두 통과했습니다. 문서 갱신 시점에는 변경 푸시 뒤 GitHub CI 재실행과 독립 리뷰가 남아 있어요. 이 업로드와 PR 생성은 운영 배포, 운영 DB 전환 또는 관리자 로그인 성공을 뜻하지 않습니다.

## 운영 주소

- 서비스: <https://matpin-kr.vercel.app/matpin>
- 관리자 목표 주소: <https://matpin-kr.vercel.app/matpin/admin> (배포 및 운영 검증 대기)
- Webhook: <https://matpin-kr.vercel.app/api/matpin/webhook>
- 개인정보처리방침: <https://matpin-kr.vercel.app/privacy>
- 이용약관: <https://matpin-kr.vercel.app/terms>
- 데이터 삭제 안내: <https://matpin-kr.vercel.app/data-deletion>
- 사용자 데이터 관리: <https://matpin-kr.vercel.app/matpin/delete>

정식 도메인으로 바꾸면 Meta 앱 설정, Instagram 프로필, canonical, Open Graph와 `MATPIN_PUBLIC_APP_URL`을 함께 갱신합니다. 기존 짧은 링크와 리디렉션도 실제 브라우저에서 확인해요.

## 최초 운영 설정

### 1. Supabase

1. [프로젝트 구조](../PROJECT_STRUCTURE.md#7-데이터베이스)에 적힌 맛핀 마이그레이션을 파일명 순서로 적용합니다.
2. `20260809123904_add_matpin_conversation_crm.sql`의 `acknowledged_at`과 대화 함수가 있는지 확인해요.
3. `20260809130010_create_matpin_admin_actions.sql`부터 `20260809172104_matpin_admin_action_deduplication.sql`까지 관리자와 큐 보안 마이그레이션을 파일명 순서로 적용합니다.
4. 아래 안전한 전환 순서를 확인한 뒤 17번 `20260809174423_add_matpin_delivery_attempt_claims.sql`을 적용해요.
5. Google Auth 제공자를 켜고 운영 origin의 `/auth/callback`을 Supabase Redirect URLs에 등록합니다.
6. Supabase 공개 URL과 publishable key가 브라우저에 연결되는지 확인하고, `MATPIN_ADMIN_EMAILS`에 확인된 Google 계정 이메일만 쉼표로 등록해요.

맛핀 관리자 로그인은 공유 Google 로그인 플래그를 사용하지 않습니다. 허용목록이 비어 있으면 관리자 화면과 API는 모두 거부돼요. 서비스 역할 키는 서버 전용이며 브라우저 환경 변수로 등록하지 않습니다. 운영 Supabase URL과 키는 Vercel Production scope에만 등록하고, Preview에는 별도 격리 프로젝트를 연결하거나 연결을 비워 둡니다. 운영 service role key를 Preview에 복사하지 않아요.

현재 운영 DB에서 다음 관리자 CRM 마이그레이션 7개의 적용을 확인했습니다.

- `20260809130010_create_matpin_admin_actions.sql`
- `20260809130039_index_matpin_admin_action_messages.sql`
- `20260809135125_restrict_matpin_admin_action_privileges.sql`
- `20260809141659_matpin_admin_reprocess_privacy.sql`
- `20260809142658_matpin_reprocess_rpc_name.sql`
- `20260809142951_extend_matpin_queue_visibility.sql`
- `20260809172104_matpin_admin_action_deduplication.sql`

마이그레이션 적용은 CRM 코드의 운영 배포나 로그인 성공을 뜻하지 않습니다.

### Durable outbox 전환 순서

17번 마이그레이션은 다음 순서로만 적용합니다. 유지보수 배포와 live 배포는 모두 PR이 병합된 같은 Git SHA를 사용하며, 환경 변수 차이만 둡니다.

1. 병합 SHA에 `MATPIN_INSTAGRAM_PIPELINE_MODE=maintenance`를 적용한 유지보수 배포가 `Ready`인지 확인한 뒤 운영 alias 100%에 연결합니다. 서명이 유효한 Webhook POST가 503인지, 아래 서명된 모드 점검의 `x-matpin-pipeline-mode=maintenance`와 `x-matpin-pipeline-accepts-events=false`가 맞는지 확인해요.
2. 독립 poller를 비활성화하고 신규 테스트 전송을 중지합니다. maintenance에서는 작업 API, bearer 재처리와 관리자 답장, 링크 재전송 및 분석 재처리가 409를 반환하므로 이 단계부터 새 pending action이나 DM이 생기지 않습니다. 관리자 조회는 drain 확인을 위해 계속 열어 두고, poller는 끈 상태로 유지해요. `mock`은 운영 중지에 사용하지 않습니다.
3. 구버전 함수 최대 실행 시간 300초에 여유를 더해 최소 360초 기다립니다.
4. 운영 DB에서 `status in ('received', 'processing')`인 메시지와 기존 `matpin-instagram` PGMQ 큐가 모두 0건인지 확인해요. 신규 DB 행, 큐, outbox와 관리자 pending mutation이 생성되지 않았는지도 확인합니다. maintenance Webhook의 503 응답 때문에 Meta의 서명 요청 재시도 로그가 남는 것은 예상할 수 있으며, HTTP 재시도 자체를 drain 실패로 보지 않아요.
5. `20260809174423_add_matpin_delivery_attempt_claims.sql`을 운영 DB에 적용합니다. 마이그레이션 자체가 `received`나 `processing` 행을 발견하면 예외로 중단해요.
6. `matpin_outbound_deliveries`, analysis enqueue gate, media cache claim token, 신규 RPC, 빈 `search_path`, RLS와 `service_role` 전용 권한을 확인합니다.
7. 같은 병합 SHA에 `MATPIN_INSTAGRAM_PIPELINE_MODE=live`를 적용한 새 배포를 아직 운영 alias에 연결하지 않은 상태로 만듭니다. 배포 상세의 Git SHA, Production 환경 scope와 `Ready` 상태를 먼저 확인해요.
8. 7번 live 배포를 운영 alias 100%에 연결하고, 서명된 모드 점검의 `x-matpin-pipeline-mode=live`, `x-matpin-pipeline-environment=production`과 `x-matpin-pipeline-accepts-events=true`를 확인합니다.
9. 그다음에만 아래 30초 독립 poller를 등록하거나 다시 활성화합니다. 최근 Cron 실행, HTTP 202, Vercel 로그와 큐의 실제 감소를 함께 확인해요. maintenance alias가 남아 있으면 작업 API가 409이므로 poller를 먼저 켜지 않습니다.
10. 소유 테스트 계정의 지원 게시물 한 건과 제외 입력 한 건을 보냅니다. 접수, 최종 답장과 사용 방법 답장이 각각 한 번만 와야 해요.
11. receipt가 terminal이 되기 전에 분석 PGMQ가 0인지, terminal 뒤 정확히 한 건인지 확인합니다. Outbox terminal 행의 수신자와 본문 암호문이 즉시 `NULL`인지도 확인해요.

롤백 경계는 마이그레이션 적용 전후로 나뉩니다. 5번 마이그레이션 전에는 기존 alias로 앱을 되돌릴 수 있습니다. 5번 이후에는 구 단건 ingest와 구 analysis 완료 RPC가 제거되므로 구버전 앱으로 alias를 되돌리면 안 돼요. live 배포나 검증이 실패하면 같은 병합 SHA의 maintenance 배포를 유지하거나 다시 운영 alias에 연결하고, poller를 끈 채 수정된 새 버전으로 roll-forward합니다. 사전에 실제 복구 연습을 마친 down migration 또는 시점 복구(PITR)가 있는 경우에만 DB 복구와 앱 복구를 한 작업으로 수행할 수 있습니다. 검증하지 않은 수동 SQL 롤백을 즉석에서 만들지 않아요.

이 유지보수 게이트와 poller를 확보하지 못하면 배포는 HOLD입니다. 마이그레이션은 terminal 상태의 기존 `reply_required = true` 행만 `succeeded` 또는 보수적인 `uncertain` outbox로 옮깁니다. `acknowledged_at`과 `replied_at`은 계속 확인된 성공만 뜻해요. `sending` lease가 만료되면 `uncertain`으로 끝나며 자동 재발송하지 않습니다. `leased`가 전송 시작 전에 만료된 경우만 안전하게 `pending`으로 복구합니다.

답장이 필요한 실패 메시지를 명시적으로 재처리할 때는 접수 DM을 다시 보내지 않습니다. 대신 새 `outbound_generation`에 payload가 없는 `superseded` receipt를 원자적으로 기록한 뒤 분석 큐를 열어요. 분석 완료와 final claim은 같은 generation의 terminal receipt가 있어야 하므로, 이전 receipt의 TTL 정리 뒤에도 순서 보장이 유지됩니다.

### 30초 독립 poller

Webhook의 `after`는 빠른 처리 힌트일 뿐 내구성 있는 스케줄러가 아닙니다. 기존 일일 예약 작업만으로는 접수 outbox, 분석 큐와 최종 outbox의 지연 상한을 보장할 수 없어요. Supabase Cron이 `pg_net`으로 운영 `/api/matpin/jobs/process`에 POST 요청을 30초마다 보내야 합니다. POST는 요청 연결과 분리된 작업을 등록하고 즉시 HTTP 202를 반환하며, 백필은 실행하지 않아요. Supabase는 Postgres 15.1.1.61 이상에서 1초부터 59초 사이 interval schedule을 지원합니다. 설정 전 [Cron 공식 문서](https://supabase.com/docs/guides/cron/quickstart)와 [pg_net 공식 문서](https://supabase.com/docs/guides/database/extensions/pg_net)를 다시 확인해요.

HTTP 202는 작업 완료가 아니라 kick 수락만 뜻합니다. `timeout_milliseconds := 5000`은 이 짧은 수락 응답의 상한이며, 255초 Worker 실행 상한이 아닙니다. 실제 완료는 Vercel Worker 로그와 `matpin_outbound_deliveries`, `matpin_instagram_messages`, `pgmq.metrics('matpin-instagram')`의 forward progress를 함께 확인해야 해요. 30초마다 새 kick이 들어와 이전 작업과 겹칠 수 있지만, outbox lease와 `skip locked`, 분석 PGMQ의 600초 visibility timeout이 같은 작업의 동시 처리를 막습니다. Media 분석 캐시는 UUID claim token과 300초 lease를 사용합니다. 이 값은 255초 Worker 상한보다 길어 정상 분석 중 소유권 교체를 막고, 600초 PGMQ visibility보다 짧아 중단된 작업을 복구할 수 있어요. 중간 작업이 종료돼도 내구성 있는 큐 항목은 다음 kick에서 다시 처리됩니다.

아래 SQL의 placeholder를 SQL 파일에 저장하거나 Git에 올리지 않습니다. Supabase Dashboard의 Vault에서 실제 값을 등록한 뒤 이름만 SQL에서 참조해요.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Dashboard Vault에서 같은 이름으로 실제 값을 먼저 등록합니다.
-- matpin_jobs_process_url = https://<production-origin>/api/matpin/jobs/process
-- matpin_cron_secret = <CRON_SECRET와 같은 실제 값>

select cron.schedule(
  'matpin-jobs-process-30s',
  '30 seconds',
  $job$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'matpin_jobs_process_url'
      limit 1
    ),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'matpin_cron_secret'
        limit 1
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  ) as request_id;
  $job$
);
```

등록 뒤 다음 SQL로 활성 상태, 최근 Cron 실행과 HTTP 결과를 함께 확인합니다. `cron.job_run_details`의 성공은 HTTP 요청 등록 성공일 수 있으므로 `net._http_response.status_code = 202`도 확인해야 해요. 202만으로 완료를 선언하지 않고 같은 시간대의 outbox와 분석 큐 감소, Vercel 로그를 함께 확인합니다. 응답 본문에는 비밀값이나 원문이 없어야 합니다.

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'matpin-jobs-process-30s';

select status, start_time, end_time, return_message
from cron.job_run_details
where jobid = (
  select jobid from cron.job where jobname = 'matpin-jobs-process-30s'
)
order by start_time desc
limit 10;

select id, status_code, timed_out, error_msg, created
from net._http_response
order by created desc
limit 10;
```

장애 조사나 유지보수 때는 먼저 작업을 비활성화합니다. 영구 삭제가 필요할 때만 `unschedule`을 사용해요. Cron 실행 이력은 자동 삭제되지 않으므로 보존 정책도 별도로 정합니다.

```sql
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'matpin-jobs-process-30s'),
  active := false
);

-- 영구 삭제가 필요한 경우에만 실행합니다.
select cron.unschedule('matpin-jobs-process-30s');
```

### 2. Meta

1. 연결한 Instagram Professional 계정 ID와 전송 권한 토큰을 등록합니다.
2. Webhook 콜백과 검증 토큰을 설정하고 `messages` 필드를 구독해요.
3. 앱 비밀값으로 서명 검증이 성공하는지 확인합니다.
4. 운영 컷오버에서는 maintenance와 drain 및 마이그레이션 검증 뒤 `live` 배포를 승격하고, 즉시 소유 테스트 계정의 수신과 저장 왕복을 확인해요. 실패하면 구버전이 아니라 같은 병합 SHA의 maintenance 배포로 돌아가 roll-forward합니다.
5. 공개 운영 전 `instagram_business_basic`과 `instagram_business_manage_messages`의 현재 액세스 수준을 다시 확인합니다.

[Meta Send API 공식 계약](https://www.postman.com/meta/instagram/folder/23987686-f05b6c9f-a4be-4511-9f88-1cd94828fdf3)에 별도의 요청 수락 API는 없습니다. 비팔로워의 새 대화는 요청함에 들어오며, 맛핀이 API로 첫 답장을 보내면 대화가 General로 이동해요. `messages` Webhook은 [모든 대화 진입점의 수신 메시지](https://www.postman.com/meta/messenger-platform-api/folder/22794852-b5d97624-14d8-4e67-a2e4-529add49ca58)를 알리므로 지원 게시물과 사용 방법 안내 답장은 요청함 대화를 함께 처리하는 방식입니다. 다만 운영 계정에서 요청함 Webhook 수신과 첫 답장 뒤 이동까지는 앱 역할이 없는 테스트 계정으로 다시 확인해야 합니다.

### 3. 비밀 환경 변수

필수 이름과 역할은 [아키텍처 문서](./ARCHITECTURE.md#환경-변수-계약)를 따릅니다. 값을 문서, 이슈, 채팅, 브라우저 로그와 Git에 넣지 않습니다.

운영 Supabase와 Meta 값, `SUPABASE_SERVICE_ROLE_KEY`, `MATPIN_DATA_SECRET`, `MATPIN_LINK_SECRET`, `CRON_SECRET` 및 실제 사용자 데이터에 접근하는 모든 값은 Vercel Production scope에만 등록합니다. Vercel Preview에는 운영 비밀값을 하나도 복사하지 않아요. Preview는 별도 Supabase 및 Meta 테스트 자격 증명을 쓰거나 외부 연결을 비우고 `MATPIN_INSTAGRAM_PIPELINE_MODE=mock`으로 격리합니다. 실제 운영 데이터와 링크를 재현해야 하는 Preview는 허용하지 않습니다.

파이프라인 모드는 다음 조합만 유효합니다.

- Vercel Preview, 로컬 개발 및 테스트: 명시적인 `mock`
- Vercel Production 유지보수: `maintenance`
- Vercel Production 실제 처리: `live`

값이 없거나 알 수 없는 값이면 서명된 Webhook도 503으로 닫습니다. Production의 `mock`과 Preview의 `live`도 503이며, 운영 중지는 반드시 `maintenance`를 사용해요.

Webhook, 작업 처리, bearer 재처리와 세 관리자 mutation은 이 공용 판정을 사용합니다. Worker와 재처리 및 인증된 관리자 mutation은 Production `live`가 아니면 body, DB와 Meta 작업 전에 `409 pipeline_not_live`로 닫혀요. 관리자 인증은 모드 판정보다 먼저 수행하므로 미인증자에게 운영 모드를 노출하지 않습니다. 관리자 조회 API는 maintenance drain을 관찰할 수 있도록 그대로 유지합니다.

사용자가 이미 끝난 분석 후보를 확정하는 `messages/[id]/confirm`은 새 queue, outbox, 관리자 pending action이나 DM을 만들지 않으므로 maintenance에서도 유지합니다. 계정 전체 삭제와 저장 장소 하나 삭제도 개인정보 삭제권이므로 모든 파이프라인 모드에서 계속 허용해요. 이 세 경로에는 Production-live 가드를 추가하지 않습니다.

다음 조합은 배포 전 반드시 서로 맞는지 확인해요.

- Supabase URL, publishable key와 service role key
- Meta 앱 비밀값, Webhook 검증 토큰, 계정 ID와 액세스 토큰
- 서로 다른 32자 이상의 `MATPIN_DATA_SECRET`과 `MATPIN_LINK_SECRET`
- 실제 운영 origin을 가리키는 `MATPIN_PUBLIC_APP_URL`
- 확인된 Google 관리자만 포함한 `MATPIN_ADMIN_EMAILS`

## 배포 전 검증

아래 순서로 실행합니다.

```bash
npm run typecheck
npm run test:unit
npm run test:e2e -- tests/e2e/matpin-admin.spec.ts
npm run lint
npm run build
```

문서만 바꿨더라도 `git diff --check`로 공백 오류와 충돌 표식을 확인해요. 코드가 바뀌었다면 위 검증을 생략하지 않습니다.

변경 파일에는 맛핀 구현과 이번에 명시적으로 요청한 문서 아카이브만 포함합니다. 그 밖의 기존 사용자 변경은 커밋에 섞지 않아요.

Meta 조회 시간 예산, 불확실한 발송의 중복 차단과 자동 답장 1,000바이트 제한의 수정 및 회귀 테스트는 완료했습니다. 계정 삭제 시 같은 발신자 해시의 관리자 감사 로그를 먼저 삭제하는 데이터베이스 트리거도 구현했습니다. 배포 전 결정이 남은 항목은 관리자 감사 로그의 시간 기반 보존 기간이며, 기간을 확정한 뒤 필요한 자동 정리 정책을 코드와 DB에 반영해요.

## 배포 증거

배포 성공 표시는 다음 네 단계가 모두 맞을 때만 확정합니다.

1. 의도한 변경이 포함된 Git 커밋 SHA를 확인합니다.
2. 같은 SHA의 Vercel 배포가 `Ready`인지 확인해요.
3. `matpin-kr.vercel.app` 운영 별칭이 그 배포를 가리키는지 확인합니다.
4. 운영 HTML과 실제 기능을 브라우저에서 다시 읽어 확인해요.

자동 출시 점검은 다음 명령을 사용합니다.

```bash
npm run matpin:launch:check -- https://matpin-kr.vercel.app
```

위 공개 점검만으로 현재 파이프라인 모드는 증명되지 않습니다. 운영 모드 확인 때는 보안 세션에 운영 `CRON_SECRET`을 일시 주입하고 기대 모드도 함께 지정해 서명된 GET을 실행합니다. 값을 명령 기록, 로그와 `.env`에 쓰지 않아요.

```bash
MATPIN_LAUNCH_EXPECTED_PIPELINE_MODE=maintenance npm run matpin:launch:check -- https://matpin-kr.vercel.app
MATPIN_LAUNCH_EXPECTED_PIPELINE_MODE=live npm run matpin:launch:check -- https://matpin-kr.vercel.app
```

두 명령은 각각 해당 컷오버 단계에서 한 번만 실행합니다. 기대 모드를 지정했는데 스크립트가 `CRON_SECRET`을 찾지 못하면 실패하므로 운영 모드 증거로 인정하지 않아요. 성공 응답은 `private, no-store`이며, 모드와 Production 여부 및 이벤트 수락 상태만 헤더로 돌려줍니다. DM 원문, 토큰과 사용자 식별값은 반환하지 않습니다.

HTTP 200, Vercel `Ready` 또는 서명된 모드 헤더 하나만으로 자동 답장, DB 저장과 관리자 인증이 동작한다고 결론 내리면 안 됩니다.

## 배포 후 공개 서비스 점검

소유한 테스트 Instagram 계정으로만 다음 왕복을 수행합니다.

1. 공개 음식점 릴스 한 건을 `matpin.kr`에 공유합니다.
2. 접수 답장이 한 번만 오는지 확인해요.
3. 저장 완료 답장과 `/s/{code}` 형식의 짧은 링크를 확인합니다.
4. 링크가 `/matpin/saved#token=...`으로 이동하고 장소가 표시되는지 봅니다.
5. 같은 게시물을 다시 공유해 캐시 적중이 늘고 AI 요청과 토큰이 추가되지 않는지 확인해요.
6. 공개 피드 게시물과 캐러셀도 각각 한 건씩 확인합니다.
7. DM에 직접 글, 이미지, 동영상과 외부 링크를 보내 분석하지 않고 사용 방법을 답하는지 확인해요.
8. 장소 하나 삭제와 전체 데이터 삭제 진입점을 별도 테스트 계정에서 확인합니다.

실사용 영상이나 스크린샷을 공유할 때 계정명, scoped ID, 보관함 토큰과 짧은 코드를 가립니다.

## 배포 후 관리자 점검

1. 로그아웃 상태에서 관리자 API가 401을 반환하는지 확인합니다.
2. `MATPIN_ADMIN_EMAILS`가 비어 있을 때 전체 접근이 403인지 확인해요.
3. 허용되지 않은 Google 계정이 403인지 확인합니다.
4. 허용된 Google 계정으로 로그인하고 `/matpin/admin`을 엽니다.
5. 운영 DB의 사용자, 메시지와 저장 장소 수를 화면 지표와 대조해요.
6. 실제 대화 한 건을 열어 최근 메시지가 최대 20건으로 표시되는지 확인합니다.
7. Meta 일부 조회 실패 시 DB 지표가 남고 partial 상태가 명확한지 봅니다.
8. 최근 사용자 메시지 후 24시간 미만인 소유 테스트 계정에만 자유 문구 DM을 한 건 보냅니다.
9. 발송 전 수신자와 최종 문구 미리보기가 맞는지 사람이 확인해요.
10. 같은 멱등성 키를 다시 보내 중복 DM이 발송되지 않는지 확인합니다.
11. `matpin_admin_actions`에 길이, 해시, Meta 메시지 ID와 성공 상태만 있고 원문이 없는지 확인해요.
12. 저장 장소가 있는 테스트 메시지의 링크 재전송을 확인합니다.
13. 실패 테스트 데이터가 있을 때만 재처리를 실행하고, 자동 DM 없이 큐에 등록된 뒤 목록과 지표가 갱신되는지 봅니다.

위 점검은 운영 배포 후 실제 Meta 대화 한 건과 소유한 테스트 계정만 사용합니다. 특히 수동 DM 발송 뒤 `matpin_admin_actions`를 조회해 원문이 저장되지 않았는지 직접 대조해요.

자유 문구 DM은 최근 사용자 수신 후 정확히 24시간이 되는 순간부터 서버가 막습니다. 일괄 발송, 예약 발송, 첨부파일 발송과 자동 캠페인은 v1 범위가 아니에요.

## 지표 해석

| 지표 | 근거 | 주의점 |
| --- | --- | --- |
| 최근 대화 | Meta 최근 대화 API | Meta 비가용 시 `null`이며 DB 숫자로 대체하지 않습니다. |
| 답장 필요 | 각 대화의 최신 메시지 방향 | `acknowledged_at`과 다른 운영 지표입니다. |
| 처리 중과 실패 | `matpin_instagram_messages.status` | 삭제된 메시지는 제외해요. |
| 저장 장소 | 삭제되지 않은 `matpin_saved_places` | 사용자 수나 메시지 수와 일치하지 않을 수 있습니다. |
| 캐시 항목과 적중 | 유효한 `matpin_media_analysis_cache` | 실패 재처리는 캐시를 무효화할 수 있어요. |
| API 요청과 토큰 | `matpin_api_usage_events` | 캐시 적중은 요청 수와 토큰을 늘리지 않습니다. |

기간 필터는 24시간, 7일, 30일과 전체입니다. Meta 대화 지표는 현재 페이지의 실시간 최대 20개를 기준으로 하므로 전체 누적 사용자 수로 해석하지 않아요.

## 장애 대응

### Webhook 자체가 오지 않을 때

1. Meta 앱의 콜백 URL과 `messages` 구독을 확인합니다.
2. Webhook GET 검증이 200인지 확인해요.
3. 잘못된 POST 서명이 401로 거부되는지 확인합니다.
4. 계정 ID와 앱 연결 상태, 토큰 권한과 만료를 확인해요.
5. 앱 역할이 없는 비팔로워 계정으로 요청함 Webhook 수신 여부를 확인하고, 첫 API 답장 뒤 General로 이동하는지 Instagram Inbox에서 대조합니다.

### Webhook은 왔지만 접수 답장이 없을 때

1. `MATPIN_INSTAGRAM_PIPELINE_MODE`가 `live`인지 확인합니다.
2. 입력이 공개 Instagram 게시물 공유인지 봐요. 직접 글, 이미지와 동영상은 분석 대상이 아닙니다.
3. Webhook 로그에서 `invalid_signature`, `meta_account_not_configured`와 `ingest_failed` 같은 안전한 오류 코드만 확인합니다.
4. Meta Send API 응답과 메시지 권한을 점검해요.
5. 같은 Meta 메시지 ID의 중복 이벤트인지 확인합니다.

### 접수 답장은 왔지만 저장 완료 답장이 없을 때

1. 관리자에서 최신 저장 메시지 상태를 확인합니다.
2. `received` 또는 `processing`이면 큐와 워커 호출 상태를 봐요.
3. `failed`이면 안전한 오류 코드와 시도 횟수를 확인합니다.
4. 원본이 공개 게시물이고 다시 접근 가능할 때만 재처리해요.
5. 장소 단서가 부족한 게시물은 억지로 저장하지 않습니다.

### 관리자 대화가 비어 있거나 일부만 보일 때

1. DB 지표와 Meta 실시간 지표를 분리해서 봅니다.
2. `META_GRAPH_API_VERSION`, 계정 ID, 액세스 토큰과 대화 권한을 확인해요.
3. Meta API 제한이나 일부 프로필 실패면 partial 상태를 유지하고 새로고침합니다.
4. 공식 메시지 상세 제한에 따라 대화당 최근 20건만 보이는 것이 정상입니다.

### 관리자 DM이 막힐 때

1. 최근 사용자 수신 후 24시간 미만인지 확인합니다.
2. 수신자가 발송 직전 다시 조회되는지 봐요.
3. 문구가 비어 있지 않고 UTF-8 기준 1,000바이트 이하인지 확인합니다.
4. 같은 멱등성 키가 이미 실패했거나 처리 중인지 감사 테이블에서 확인해요.
5. 오류가 나도 DM 원문을 로그에 남기지 않습니다.

### 짧은 링크가 404일 때

1. 코드가 정확히 16자리인지 확인합니다.
2. 사용자 행의 90일 접근 기한이 지났는지 봐요.
3. 짧은 링크 해시와 현재 `MATPIN_LINK_SECRET`이 같은 배포 계보인지 확인합니다.
4. 비밀값을 교체했다면 기존 링크와 토큰이 바뀐다는 점을 장애로 취급해요.

## 긴급 중지와 복구

분석이나 발송이 비정상적으로 반복되면 독립 poller를 비활성화하고 `MATPIN_INSTAGRAM_PIPELINE_MODE=maintenance` 배포를 운영 alias에 연결합니다. 이 모드는 서명이 유효한 Webhook POST에 503을 반환해 Meta가 성공으로 오해하고 이벤트를 폐기하지 않게 해요. `mock`의 200 응답은 로컬 개발과 테스트 전용이며 운영 중지에 사용하지 않습니다.

복구 뒤에는 한 건의 지원 게시물로 접수, 저장, 캐시, DM과 보관함까지 다시 검증합니다. 실패 메시지 일괄 재처리는 하지 않고 한 건씩 원인과 수신자를 확인해요.

관리자 재처리는 저장 분석만 큐에 다시 넣고 자동 DM을 보내지 않습니다. 응답 뒤 백그라운드 작업을 바로 깨우며, 실패해도 큐에는 작업이 남아 30초 poller나 다음 수신 처리에서 다시 소비돼요. 큐 메시지의 가시성 잠금은 600초로 두어 최대 300초 작업이 겹쳐 실행되지 않도록 합니다.

## 출시 차단 요소

다음 항목이 확인되기 전에는 관리자 CRM 완료와 일반 공개 성공을 선언하지 않습니다.

- 운영 `MATPIN_ADMIN_EMAILS`에 실제 관리자 Google 계정 등록
- 최신 CRM 코드의 운영 배포와 실제 화면 확인
- 허용 계정 로그인과 실제 대화 한 건 조회
- 소유 테스트 계정 한 곳으로 수동 DM 한 건 발송과 감사 원문 미저장 확인
- 관리자 감사 로그의 시간 기반 보존 기간 확정 및 필요한 자동 정리 구현
- 현재 Meta 메시지 권한의 고급 액세스 상태 확인
- 앱 역할이 없는 일반 계정의 게시물 공유부터 보관함 저장까지 왕복
- 앱 역할이 없는 비팔로워 계정의 요청함 Webhook 수신과 첫 API 답장 뒤 General 이동 확인
- Supabase 30초 독립 poller 활성 상태, 최근 Cron 성공, `pg_net` HTTP 202와 큐 forward progress 확인
- Outbox terminal 암호문 삭제, receipt 전 분석 차단과 duplicate 1회 처리 확인
- 최신 Git SHA, Vercel Ready 배포, 운영 별칭과 실제 화면의 일치 증거

고급 액세스가 없고 앱 역할 계정에서만 왕복이 되면 비공개 베타 범위로 운영합니다. 테스트 계정에서도 왕복이 실패하면 출시를 중지해요.
