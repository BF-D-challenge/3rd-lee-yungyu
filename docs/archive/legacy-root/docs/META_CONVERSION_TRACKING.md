# BF.D 네 제품 광고 측정 계약

BF.D의 `matpick`, `onebite`, `today`, `story-cards`는 GA4와 Clarity에서 같은
이벤트 이름을 사용합니다. Meta Pixel과 Conversions API(CAPI)는 이 이벤트를
Meta용 이름으로 바꾸되, 같은 `event_id`를 함께 보내 중복 집계를 막습니다.

## 공통 퍼널

| 순서 | 공통 이벤트 | 실제로 기록하는 순간 | Meta 이벤트 | 종류 |
|---:|---|---|---|---|
| 1 | `landing_view` | 제품 랜딩이 화면에 표시됨 | `MvpLandingView` | 커스텀 |
| 2 | `primary_cta` | 사용자가 제품의 첫 핵심 CTA를 실행함 | `MvpPrimaryCta` | 커스텀 |
| 3 | `instagram_input_started` | Instagram 아이디 입력란을 처음 수정함 | `MvpInstagramInputStarted` | 커스텀 |
| 4 | `login_completed` | 실제 Google 인증 성공 뒤 세션이 확인됨 | `CompleteRegistration` | 표준 |
| 5 | `reservation_completed` | 실제 저장소에 예약 저장이 성공함 | `MvpReservationCompleted` | 커스텀 |

제품은 `product_id` 하나로 구분합니다. 허용 값은 `matpick`, `onebite`,
`today`, `story-cards`뿐입니다. 예전 코드의 `tastepin`은 `matpick`으로,
`today_a`와 `today_b`는 `today`로, `story_cards`는 `story-cards`로 합칩니다.

결과 조회와 제품 안의 심화 행동은 별도 분석 이벤트로 남길 수 있지만,
`reservation_completed`로 바꾸지 않습니다. 실제 예약 저장 성공만 마지막
퍼널 단계입니다.

## 제품별 기존 이벤트 매핑

| 제품 | `landing_view` | `primary_cta` | `instagram_input_started` | `login_completed` | `reservation_completed` |
|---|---|---|---|---|---|
| matpick | `tastepin_landing_viewed` | `tastepin_input_started` | `matpick_instagram_input_started` | `tastepin_signup_completed` | `matpick_reservation_completed` |
| onebite | `onebite_fake_door_landing_viewed` | `onebite_instagram_submitted` | `onebite_instagram_input_started` | `onebite_signup_completed` | `onebite_reservation_completed` |
| today | `today_landing_viewed` | `today_input_started` | `today_instagram_input_started` | `today_signup_completed` | `today_reservation_completed` |
| story-cards | `story_cards_landing_viewed` | `story_cards_input_started` | `story_cards_instagram_input_started` | `story_cards_signup_completed` | `story_cards_reservation_completed` |

새 UI 연결은 위의 제품별 이름을 직접 보내지 않고
`trackMvpLandingViewed`, `trackMvpPrimaryCta`,
`trackMvpInstagramInputStarted`, `trackMvpLoginCompleted`,
`trackMvpReservationCompleted`를 사용합니다. 이 함수들이 GA4·Clarity에 공통
이벤트 이름을 기록합니다. 기존 이름 목록은 과거 이벤트를 같은 Meta 퍼널로
읽기 위한 호환 표입니다.

## 전송 가능한 속성

제품 퍼널에서 직접 허용하는 속성은 아래뿐입니다.

- `product_id`
- `creative_id`
- `landing_variant`
- `slot_key`
- `storage_mode`
- `submit_success`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

공통 `track()` 함수가 이벤트 운영을 위해 만드는 `event_id`, `session_id`,
`page_path`, `occurred_at`, `event_time`은 시스템 필드입니다. 제품 UI가 값을
넣지 않습니다. Meta `custom_data`에는 위 허용 목록만 들어갑니다.

다음 값은 GA4, Clarity, Pixel, CAPI payload에 넣지 않습니다.

- Instagram 아이디와 계정 URL
- 사용자 이름, 이메일, 메시지
- 사용자가 입력한 아이디어 원문
- 카드 본문, 생성 결과 원문

Clarity에서 실제 입력 폼은 `data-clarity-mask="true"`로 가리고, Clarity
커스텀 이벤트에는 이벤트 이름만 보냅니다. 서버 CAPI는 허용 목록 밖의 키를
한 번 더 제거합니다.

## Pixel과 CAPI 중복 제거

1. 공통 `track()`이 이벤트마다 `event_id`를 한 번 만듭니다.
2. Pixel은 같은 값을 `eventID`로 보냅니다.
3. CAPI는 같은 값을 `event_id`로 보냅니다.
4. 두 전송의 이벤트 이름과 `custom_data`도 같습니다.

Pixel ID가 없으면 브라우저 Pixel과 연결된 CAPI 호출을 만들지 않습니다.
서버 Dataset ID 또는 토큰이 없거나 잘못되면 `/api/meta/events`는 Meta에
접속하지 않고 `204`로 끝납니다.

demo 세션은 `login_completed`를 만들지 않습니다. `demo` 또는
`storage_mode=local_demo` 예약도 `reservation_completed`를 만들지 않습니다.
서버는 `MvpReservationCompleted`에 `submit_success=true`가 없거나
`storage_mode=local_demo`이면 요청을 거절합니다.

## 서버 환경 변수

실제 값은 배포 환경의 비밀 저장소에만 등록합니다.

```dotenv
NEXT_PUBLIC_META_PIXEL_ID=
META_DATASET_ID=
META_CONVERSIONS_API_TOKEN=
META_GRAPH_API_VERSION=v25.0
# Meta Test Events 검증 중에만 임시 등록
META_TEST_EVENT_CODE=TEST12345
```

`META_TEST_EVENT_CODE`는 `TEST`와 숫자로 된 코드만 허용합니다. 운영 검증이
끝나면 배포 환경에서 삭제하고 다시 배포합니다.

## 운영 검증표

아래 표는 배포 뒤 실제 브라우저에서 제품마다 한 번씩 확인합니다. 개인정보가
보이면 실패입니다. 이 문서 작성 시점에는 로컬 계약과 unit test만 검증했으며,
아래 운영 도구의 새 이벤트 수신은 별도 배포 후 확인해야 합니다.

| 단계 | GA DebugView | Clarity | Meta Test Events | 개인정보 확인 |
|---|---|---|---|---|
| `landing_view` | 이벤트명과 `product_id`, UTM 확인 | 같은 이름의 커스텀 이벤트와 랜딩 녹화 확인 | `MvpLandingView`에서 Browser·Server가 중복 제거됐는지 확인 | 입력값 없음 |
| `primary_cta` | CTA 1회당 1건, `creative_id`·`landing_variant` 확인 | 실제 CTA 클릭 직후 이벤트 확인 | `MvpPrimaryCta`의 동일 `event_id` 쌍 확인 | 버튼 문구·사용자 값 없음 |
| `instagram_input_started` | 첫 입력에 1건, `product_id`만 확인 | 입력란이 마스킹됐고 이벤트 이름만 있는지 확인 | `MvpInstagramInputStarted` 확인 | Instagram 아이디가 어느 payload에도 없음 |
| `login_completed` | 실제 Google 로그인에만 1건 확인 | 로그인 복귀 뒤 이벤트 확인 | `CompleteRegistration` 확인 | 이름·이메일 없음 |
| `reservation_completed` | 실제 저장 성공 뒤 `slot_key`, `storage_mode=supabase`, `submit_success=true` 확인 | 완료 화면 전환 뒤 이벤트 확인 | `MvpReservationCompleted` 확인 | Instagram 아이디·이름 없음 |

제품별 실행 확인표:

| 제품 | 랜딩 | CTA | Instagram 입력 | 실제 로그인 | 실제 예약 | demo 미전송 |
|---|---|---|---|---|---|---|
| matpick | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| onebite | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| today | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| story-cards | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Meta Test Events에서는 Browser 이벤트와 Server 이벤트가 각각 보이더라도 최종
처리 상태가 중복 제거됐는지 확인합니다. 두 항목의 이벤트 이름과 `event_id`가
다르면 실패입니다.

## 최종 통합 채팅 연결 체크리스트

제품별 UI 파일은 이 작업에서 수정하지 않았습니다. 최종 통합 채팅은 다음을
연결해야 합니다.

- 모든 제품 랜딩의 최초 노출에 `trackMvpLandingViewed(productId)`를 한 번만 호출
- 첫 핵심 CTA 실행 시 `trackMvpPrimaryCta(productId, { creative_id, landing_variant })` 호출
- Instagram 입력의 첫 `onChange`에 `trackMvpInstagramInputStarted(productId)` 호출
- `src/components/organisms/onebite-landing/onebite-landing.tsx`의 직접 `track()` 세 건을 공통 함수로 교체
- `src/components/organisms/reservation/reservation-page.tsx`의 실제 인증 콜백에서 `trackMvpLoginCompleted(config.product, session)` 호출; demo이면 함수가 `false`를 반환하는지 확인
- 같은 예약 화면의 저장 성공 뒤 `trackMvpReservationCompleted(config.product, session, { slot_key, storage_mode, submit_success: true })` 호출
- 기존 `fake_door_reservation_login_completed`와 `fake_door_reservation_completed` 직접 호출은 공통 함수 연결 뒤 제거해 GA4 중복을 막기
- URL 또는 고정 실험 설정에서만 `creative_id`, `landing_variant`를 만들고 사용자 입력에서 만들지 않기
- 네 제품 모두 React Strict Mode나 화면 재진입으로 랜딩·입력 시작 이벤트가 두 번 생기지 않도록 `useRef` 또는 세션 키로 1회 처리
- 연결 뒤 위 운영 검증표를 GA DebugView → Clarity → Meta Test Events 순서로 채우기
