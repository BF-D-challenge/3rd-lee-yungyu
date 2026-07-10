---
name: gas-app--gap-4-infra-failure
description: 완성도 비평으로 보강한 갭 문서. 기존 "HN 게시물 제목 1건" 인용이 부정확했음을 확인한 뒤 Gas 공동창업자 Dave Schatz의 트윗 스레드 3건 전문(9만 멤버 Redis SET을 매 요청마다 통째로 읽어와 CPU 80% 낭비, 오토스케일 중 TLS 협상 폭주로 3시간 다운타임)을 원전에서 확보해 Supabase/Vercel 스택으로 환산했다. "매직링크 로그인 전 커스텀 SMTP 필수 연결" 등 실행 아이템 6개를 도출한, 실행 가능성이 가장 높은 갭 보강 문서.
metadata:
  type: research
  topic: gas-app
  category: gaps
  date: 2026-07-08
---

# 기술/인프라 근거가 HN 게시물 제목 1건('Redis Engine CPU 80% 절감')과 창업자 트윗 1줄('Redis 인메모리 친구그래프')뿐, 실제 장애 원인의 본문·우리 스택 환산 없음

> 조사일: 2026-07-08 · 조사자: 리서치 서브에이전트 · 방법: WebSearch/WebFetch로 원전(Threadreaderapp 미러 + 원 트윗) 전문 확보 → Supabase/Vercel 공식 문서·GitHub 이슈로 "우리 스택" 환산. rdt-cli/twitter-cli는 이 세션에서 커맨드로 노출되지 않아(`command not found`) 미사용, WebFetch/WebSearch만으로 x.com 트윗 원문(threadreaderapp 미러 경유)까지 도달.

## 0. 기존 인용 재검증 — "HN 게시물 제목"·"창업자 트윗 1줄"의 실체

먼저 갭 지적문 자체가 가리키는 두 인용을 원전에서 재확인했다.

- **"HN 게시물 제목 1건"**: `news.ycombinator.com`에서 daveschatz/Gas/vandan.co를 직접 검색했으나 정확히 매치되는 HN 게시물을 찾지 못했다(미수집, 아래 3장 참고). 실제로 이 이야기가 널리 유통된 경로는 **Lobsters**(`lobste.rs/s/gzkgho/...`)와 개인 블로그 **vandan.co**였다. 즉 원 리서치가 "HN"이라 부른 것은 Lobsters/블로그 재인용일 가능성이 크다.
- **"창업자 트윗 1줄('Redis 인메모리 친구그래프')"**: 이 정확한 문구는 원전 어디에도 없다. 실제 1차 소스는 Gas 공동창업자 겸 엔지니어 **Dave Schatz**(@daveschatz)가 2022년 10~11월에 올린 **트윗 스레드 3건**이며, "친구그래프"라는 표현 자체는 등장하지 않는다. 가장 근접한 실체는 3-3에서 다루는 "오프라인 소켓 이벤트 큐가 새 친구(new friends) 알림도 실어 나른다"는 문장으로, 이것이 압축·재서술되며 "친구그래프"로 와전된 것으로 추정된다. **이 갭 지적문 자체의 인용이 부정확했다는 것이 이번 조사의 1차 성과**이며, 아래는 실제 원전 전문과 이를 우리 스택으로 환산한 내용이다.

원전 링크(모두 threadreaderapp.com 미러로 전문 확보, 원문은 각 x.com 링크): `https://x.com/daveschatz/status/1583342175005220864`(CPU), `https://x.com/daveschatz/status/1597854597791776768`(다운타임), `https://x.com/daveschatz/status/1588036892599021568`(오프라인 큐).

---

## 1. 원전 전문 — Dave Schatz(Gas 공동창업자·엔지니어) 트윗 스레드 3건

### 1-1. "Redis Engine CPU 80% 절감" (2022-10-21, 9 tweets)
출처: https://x.com/daveschatz/status/1583342175005220864 (미러: https://threadreaderapp.com/thread/1583342175005220864.html)

전문(트윗 순서대로, 이모지 생략):

1. "Today we cut our Redis Engine CPU Utilization by 80% and survived to live (and grow) another day! We were CPU constrained & maxed out scaling limits for our ElastiCache cluster. We had 2 hours to reduce utilization before our next traffic surge or we were toast."
2. "First, we connected to our cluster via redis-cli and ran MONITOR to identify the key prefixes used at the highest frequency. Overwhelmingly, one data model stood out as the most frequently accessed."
3. "Theory: Redis HASH values are stored internally using the ziplist data structure... We moved those keys to a new cluster and saw a **2% CPU win**. This wasn't it."
4. "New Theory: We have aggressive caching for most of our DB queries... Moving that to our new cluster... gained us an incremental **1.5% CPU win**. Still haven't found it yet.."
5. "We needed more info... We ran a CloudWatch query to graph a breakdown of Engine CPU Utilization across nodes in the cluster. **One node stood out at 50% utilization while others sat around 12%**."
6. "New Theory: maybe there is a frequently accessed large key or operation (Lua script / EVAL) bogging down that node? We connected directly to that node and ran an analysis for the largest keys.. BINGO"
7. "We identified a single key, a **SET with ~90k members and growing**! Worse, we were fetching all members (**SMEMBERS**) of this SET across the majority of our requests. Even worse, this SET kept growing in size due to a common action in the app - **we didn't even need or use its values!**"
8. "Ran a quick test: hard-coded a return value for that specific key, which resulted in an **instant 80% drop in CPU utilization**. We patched the underlying cause and gifted ourselves plenty room to scale!"
9. "Hopefully sharing our debug process can help others debug similarly stressful Redis CPU consumption issues!"

**실제 장애 원인(본문 확인 결과)**: "친구그래프 조회 폭주"도 "카운터 갱신 경합"도 아니었다. 정확히는 **매 요청마다 90,000개 멤버짜리 SET 전체를 SMEMBERS로 통째로 읽어오면서, 정작 그 값은 쓰지도 않는** 코드였다. 두 번의 잘못된 가설(HASH ziplist 직렬화 비용, DB 쿼리 캐싱)을 먼저 시도해 각각 2%·1.5%의 미미한 개선만 얻은 뒤에야, CloudWatch로 샤드별 CPU를 쪼개보고(50% vs 12%) 그 샤드에서 가장 큰 키를 찾아내는 방식으로 근본 원인에 도달했다.

### 1-2. "다운타임 3시간 — TLS 협상 폭주" (2022-11-30, 7 tweets)
출처: https://x.com/daveschatz/status/1597854597791776768 (미러: https://threadreaderapp.com/thread/1597854597791776768.html)

전문:

1. "We had downtime today. It was a stressful 3 hours trying to diagnose the issues and repair our systems... TLDR: Re-evaluate trade-offs regularly."
2. "1) Account for the **Redis Engine CPU cost of TLS connection negotiation during a storm of new connections due to auto-scaling (over-scaling) API servers** to support an unexpectedly large surge of users and activity."
3. "2) Don't expect Redis to be able to (even eventually) re-shard and re-balance when it's **maxed out at 100% CPU**. (there are no resources available, duh)"
4. "3) Evolve auto-scaling rules and parameters over time. The rules that worked early on need to be re-evaluated at scale."
5. "4) **Throttle inbound HTTP requests** when bringing a system (with millions of impatient users) back online after a cascade of failures **so you don't DOS your services**."
6. "Takeaway: re-evaluate trade-offs regularly. This is the toughest one bc, as a small team, we're ruthlessly prioritizing how/where we spend our limited time (product, infrastructure, growth, etc)."
7. "Oh, and one more thing: **keep a close eye on AWS service quotas** for every product used... ensure you're monitoring well enough to know when to request increases before you're already in the red zone."

**실제 장애 원인**: 예상 밖 유저 급증에 API 서버가 (과도하게) 오토스케일 되면서 신규 커넥션이 폭주 → 각 신규 연결의 **TLS 핸드셰이크 자체가 Redis Engine CPU를 갉아먹는** 구조 → Redis가 100% CPU에 고정되어 리밸런싱조차 못 함 → 복구 시도 중에도 밀려드는 요청이 스스로를 다시 넘어뜨리는(self-DOS) 악순환.

### 1-3. "오프라인 소켓 이벤트 큐" (2022-11-03, 5 tweets) — "친구그래프" 주장의 실제 근원
출처: https://x.com/daveschatz/status/1588036892599021568 (미러: https://threadreaderapp.com/thread/1588036892599021568.html)

전문:

1. "Want to make your real-time app feel even more magical? Queue up offline socket events for 90 seconds after a user backgrounds the app and resend them upon foreground."
2. "How do we do this? When we get the client's socket disconnect event..., we create a **Sorted Set in Redis with a TTL of 90 seconds** and a new key that resembles our connection key (i.e `dcon:{connectionId}`)."
3. "In our code that sends socket messages, we've added a fallback if the connection isn't found/available to see if our new disconnection key exists. If so, we'll store the data... with a **score of the current timestamp**."
4. "When a user foregrounds the app and reconnects..., we check to see if a dcon key exists for them. If so, we'll **drain the queue of messages and resend them** over the socket."
5. "...We do this for **polls, user updates (new friends, etc)**, and more. Check this out in Gas or build it into your app next."

**정정**: 이것은 "인메모리에 상주하는 친구그래프"가 아니라, **소켓 연결이 끊긴 사용자에게 보낼 이벤트를 90초 TTL의 Redis Sorted Set에 임시로 쌓아뒀다가 재접속 시 흘려보내는 오프라인 큐**다. 그 큐가 실어 나르는 이벤트 중 하나가 "새 친구 생김" 알림이었을 뿐, 친구 관계 자체를 Redis에 그래프로 들고 있다는 근거는 원전 어디에도 없다.

---

## 2. 우리 스택(Supabase Postgres + Edge Function, Vercel) 환산

### 2-1. "90k-멤버 SET을 매 요청마다 통째로 읽는" 패턴 → Postgres/Realtime 환산

Gas 사고의 본질은 "**필요 없는 값을, 매 요청마다, 하나의 뜨거운 키에서** 통째로 읽어온 것"이다. Postgres/Supabase에서 구조적으로 동일한 안티패턴은:

- 카드/투표를 `votes jsonb[]` 또는 배열 컬럼에 전부 누적하고, 집계가 필요할 때마다 그 배열 전체를 SELECT해서 애플리케이션 레벨에서 세는 방식. 이는 Gas의 SMEMBERS와 정확히 같은 모양의 병목이다 — 배열이 커질수록, 요청이 많을수록 선형으로 악화된다. 대신 별도 카운터 컬럼(원자적 UPDATE ... SET count = count + 1) 또는 집계 뷰/구체화 뷰(materialized view)로 분리해야 한다.
- Supabase Realtime의 **Postgres Changes**는 구조적으로 "단일 스레드 처리 + 구독자 수만큼 매 이벤트마다 권한 검사(authorization check)를 반복"하는 방식이라, "테이블 쓰기 1건"이 "구독자 100명"이면 인가 체크 100회가 발생한다 — 즉 처리량이 **쓰기 빈도가 아니라 구독자 수**에 좌우된다. 이는 Gas의 "요청마다 90k 멤버를 다시 읽는" 병목과 형태적으로 동일한 팬아웃(fan-out) 취약점이다. 공식 문서는 동시 구독자가 약 3,000명을 넘으면 Postgres Changes 대신 **Broadcast**를 쓰라고 권고한다.
  - 출처: https://supabase.com/docs/guides/realtime/postgres-changes , https://github.com/supabase/realtime
- **적용점**: "오늘 해볼까"가 투표 실시간 집계를 Postgres Changes 구독으로 구현한다면, 카드 하나가 바이럴로 퍼져 동시 구독자가 늘어나는 순간 이 병목이 그대로 재현된다. 집계는 실시간 구독이 아니라 (a) 주기적 폴링 + 캐시된 카운트, 또는 (b) Broadcast 채널로 "집계 결과만" 브로드캐스트하는 방식이 안전하다.

### 2-2. "오토스케일 커넥션 폭주 중 TLS 협상 CPU 비용" → Vercel 서버리스 + Supabase 커넥션 환산

Gas의 두 번째 장애(1-2)는 "짧은 시간에 신규 연결이 몰리면, 연결 자체의 핸드셰이크 비용이 백엔드를 넘어뜨린다"는 이야기다. 이는 **Vercel 서버리스 함수(또는 Edge Function) + Supabase Postgres** 조합의 잘 알려진 실패 패턴과 구조적으로 동일하다.

- 서버리스 함수는 호출마다 새 DB 연결을 열 수 있고(연결 재사용이 보장되지 않음), 각 신규 연결은 TCP+TLS 핸드셰이크 비용을 다시 지불한다. Vercel 공식 블로그는 이를 "서버리스 컴퓨트가 연결을 더 많이 쓰는 게 아니라, **함수가 idle 상태로 suspend될 때 연결이 타임아웃 없이 새어나가는 것(leak)**"이 진짜 문제라고 설명한다. 예시로 Supabase 무료 티어의 동시 연결 상한 200개 기준, 연결 50개가 새면 가용성에 유의미한 타격이 있다고 명시.
  - 출처: https://vercel.com/blog/the-real-serverless-compute-to-database-connection-problem-solved
- **실제 재현 사례**: GitHub 이슈에서 한 개발자가 Vercel + Supabase 조합으로 **동시 접속자 300명 이상**에서 "max connections" 오류로 앱이 죽는 것을 보고했다. 이미 (a) tRPC로 요청 배칭, (b) Postgres 인스턴스 max connections를 3으로 제한, (c) Supavisor 트랜잭션 모드 활성화, (d) prepared statements 비활성화까지 다 해본 뒤에도 재현되었다 — 즉 표준 권고 조치를 다 적용해도 여전히 터질 수 있는 급의 트래픽 스파이크임을 보여주는 실사례다.
  - 출처: https://github.com/supabase/supabase/issues/29675
- Supabase 공식 트러블슈팅 문서는 "서버리스 환경이 함수 호출 사이에 프리징되면서 TCP 소켓이 죽은 채로 남고, 재개 시 죽은 소켓을 재사용하려다 hang이 걸린다"고 원인을 설명하며, 완화책으로 (a) 읽기 위주 워크로드는 상태 비저장 HTTP 기반인 PostgREST Data API로 이전, (b) 쿼리 실행 전 `SELECT 1` 라이브니스 프리플라이트, (c) Vercel Fluid Compute의 `attachDatabasePool`/`waitUntil`로 suspend 전 유휴 연결 정리, (d) 연결 타임아웃 전용 재시도 로직을 제시한다.
  - 출처: https://supabase.com/docs/guides/troubleshooting/troubleshooting-connect_timeout-or-hanging-queries-in-vercel-serverless-functions-775f92
- Supavisor(Supabase의 커넥션 풀러) 자체는 공식 벤치마크에서 **동시 클라이언트 100만 개를 400개의 실제 DB 연결로 다운샘플링**하는 성능을 입증했다(AWS EC2 20대, 16코어/32GB 구성, 2시간 지속 테스트) — 즉 풀러를 제대로 쓰면 이 병목은 회피 가능하지만, "제대로 쓰지 않으면"(직결 연결, 세션 모드 오남용 등) 300명 규모에서도 죽을 수 있다는 게 위 GitHub 사례의 교훈이다.
  - 출처: https://supabase.com/blog/supavisor-1-million
- **적용점**: 카드 발행/투표 API를 Vercel Edge Function/서버리스로 구현한다면, Postgres 직결이 아니라 **Supavisor 트랜잭션 모드**를 반드시 쓰고, 풀 사이즈를 DB 최대 연결의 40~80% 이내로 관리해야 한다. Fluid Compute를 쓴다면 `attachDatabasePool`로 연결 누수를 막는 것이 Gas의 "TLS 협상 폭주" 사고와 형태적으로 동일한 위험을 예방하는 조치다.

### 2-3. "복구 중 요청 쓰로틀링 안 하면 스스로를 DOS" → 로그인 없는 투표 엔드포인트 환산

Gas 교훈(1-2, 4번)은 "복구 중에는 인바운드 요청을 쓰로틀해야 스스로를 넘어뜨리지 않는다"는 것이다. "오늘 해볼까"는 설계 원칙상 **투표 수신자에게 로그인을 요구하지 않는다** — 즉 투표 제출 엔드포인트는 인증 마찰이 없는 공개 쓰기 경로이며, 이는 Gas의 "인바운드 요청 폭주"보다 오히려 더 취약한 조건이다(로그인이 있었다면 Auth 계층의 자체 레이트리밋이 최소한의 방어선이 되어줬을 것). Supabase Auth의 기본 레이트리밋은 검증 요청 IP당 시간당 360건, 익명 로그인 IP당 시간당 30건 등으로 **Auth 엔드포인트에만 적용**되므로, 투표 제출처럼 커스텀 RPC/Edge Function으로 구현한 쓰기 경로는 팀이 직접 레이트리밋(IP/세션 기반, 예: Upstash Redis 또는 Vercel Edge Middleware)을 붙여야 한다.
- 출처: https://supabase.com/docs/guides/auth/rate-limits

### 2-4. "AWS 서비스 쿼터 사전 모니터링" → Supabase/Vercel 플랜 한도 사전 확인 (+ 이번 조사의 최대 수확)

Gas의 마지막 교훈은 "한도에 몰리기 전에 미리 증설을 요청하라"였다. Supabase/Vercel에서 이에 해당하는 **가장 구체적이고 실행 가능한 수치**를 확인했다:

| 항목 | Free | Pro | Pro(무제한 지출) / Team |
|---|---|---|---|
| Realtime 동시 연결 | 200 | 500 | 10,000 |
| Realtime 메시지/초 | 100 | 500 | 2,500 |
출처: https://supabase.com/docs/guides/realtime/limits

- **가장 중요한 단일 발견**: Supabase Auth의 **내장(built-in) 이메일 발신은 프로젝트 전체 기준 시간당 단 2통**으로 제한된다(회원가입·매직링크·비밀번호 재설정·초대 메일 전부 합산, 유저별이 아니라 프로젝트 전체 기준). 커스텀 SMTP(SendGrid/Resend/AWS SES 등)를 연결해도 초기값은 시간당 30통이며, 그 이상은 Dashboard에서 직접 올려야 한다.
  - 출처: https://supabase.com/docs/guides/auth/rate-limits , https://supabase.com/docs/guides/auth/auth-smtp
  - **이것이 "오늘 해볼까"에 직결되는 이유**: 프로젝트 로컬 메모(설계 원칙 4번)에 "로그인은 Supabase(구글 OAuth+매직링크), 요구 시점은 카드 발행 순간"이라 명시되어 있다. 만약 매직링크가 내장 이메일 발신 경로를 쓰고 있다면, **바이럴 루프가 실제로 작동해서 카드 발행이 동시에 여러 건 터지는 순간 — 정확히 성공 시나리오에서 — 시간당 2통 한도에 걸려 매직링크 로그인 자체가 막힌다.** 이는 Gas 사례처럼 "성공(트래픽 급증)이 곧 장애 트리거"가 되는 구조이며, 사전에 커스텀 SMTP를 붙이지 않으면 100% 재현되는 예측 가능한 장애다.
- Supabase 공식 "프로덕션 체크리스트"는 이를 명시적으로 경고한다: "런칭 전에 커스텀 SMTP를 설정하라(기본 이메일 한도가 병목이 되므로)", "고트래픽 런칭이 예상되면 최소 2주 전에 지원팀에 알려라", "k6 등으로 부하테스트를 하라". 이는 Gas의 "AWS 쿼터를 레드존 전에 미리 확인하라"는 교훈과 문자 그대로 동일한 권고다.
  - 출처: https://supabase.com/docs/guides/deployment/going-into-prod

---

## 3. 검증 불가 / 미수집 항목

- **정확한 문구 "Redis 인메모리 친구그래프"의 1차 출처**: 미수집(사유: 대상 트윗 스레드 3건 전문을 확보했으나 해당 표현 자체가 없음. 가장 근접한 원문은 1-3의 "new friends" 알림을 실어 나르는 오프라인 큐 문장이며, 원 리서치가 이를 압축·재서술한 것으로 추정된다).
- **이 사고가 실제로 news.ycombinator.com(HN)에 별도 게시되었는지**: 미수집(사유: `site:news.ycombinator.com`로 daveschatz/vandan.co/Gas Redis를 검색했으나 정확히 매치되는 HN 아이템을 찾지 못함. Lobsters(`lobste.rs/s/gzkgho`)에는 명확히 존재하며, 원 리서치의 "HN 게시물"은 이 Lobsters/블로그 재유통을 가리켰을 가능성이 있음).
- **Supabase 컴퓨트 티어(Nano/Micro/Small 등)별 정확한 기본 pool_size 수치표**: 미수집(사유: 공식 문서가 서술형 가이드("40~80% 이내로 관리")만 제공하고 티어별 표를 공개하지 않음. 대시보드 로그인 없이는 실측 불가).
- **Gas가 Redis 외에 실제로 어떤 주 데이터베이스(RDS/Postgres 등)를 병행했는지**: 미수집(사유: 공개된 트윗 3건 전부 ElastiCache/Redis만 언급하고 주 DB 종류는 명시하지 않음).
- **가스 앱 자체의 한국어 인프라 관련 기술 블로그/발표**: 미수집(사유: 한국어 검색 결과는 전부 제품/그로스 관점 브런치·미디엄 글이었고("GAS가 공략한 고객심리와 바이럴", "GAS가 해결하고자 한 문제") 인프라·기술 아키텍처를 다룬 한국어 자료는 확인되지 않음 — 참고로 국내 카피캣 앱 "Skrr" 존재는 확인되었으나 기술 스택 공개 자료는 없음).

---

## 4. "오늘 해볼까" 적용 요약 (실행 아이템)

1. **매직링크 로그인 전에 커스텀 SMTP부터 연결한다.** 내장 이메일 시간당 2통 한도는 "카드 발행 순간 로그인 요구"라는 현재 설계와 정면충돌하며, 바이럴이 성공하는 순간 로그인 자체가 막히는 자기파괴적 구조다. (2-4)
2. **투표/좋아요 집계는 Postgres Changes 실시간 구독이 아니라 폴링+캐시 카운트 또는 Broadcast로 설계한다.** 구독자 수만큼 인가 체크가 선형 증가하는 구조는 Gas의 "요청마다 90k 멤버 SET을 통째로 읽는" 병목과 동일한 모양이다. (2-1)
3. **투표 데이터는 배열/JSONB 누적이 아니라 카운터 컬럼/집계 뷰로 저장한다.** (2-1)
4. **Vercel 서버리스에서 Supabase 접속 시 직결이 아니라 Supavisor 트랜잭션 모드를 쓰고, 필요하면 Fluid Compute `attachDatabasePool`로 유휴 연결을 정리한다.** 동시접속 300명 규모에서도 표준 조치를 다 적용하고 실패한 실사례(GitHub #29675)가 있다. (2-2)
5. **로그인 없는 투표 제출 엔드포인트에 자체 레이트리밋(IP/세션 기반)을 반드시 붙인다.** Supabase Auth의 기본 레이트리밋은 Auth 엔드포인트에만 적용되고 커스텀 RPC에는 적용되지 않는다. (2-3)
6. **바이럴 테스트/런칭 전에 현재 플랜의 Realtime 동시연결·메시지/초 한도(Free: 200/100)를 예상 동시 투표자 수와 대조하고, 필요시 사전에 업그레이드한다.** Gas의 "쿼터를 레드존 전에 미리 확인하라"는 교훈과 동일하다. (2-4)
