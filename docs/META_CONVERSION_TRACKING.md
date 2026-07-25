# Meta 전환 이벤트 설정

`오늘 해볼까`는 기존 GA4·로컬 분석을 유지하면서 Meta Pixel과 선택적
Conversions API(CAPI)에 같은 이벤트 ID를 보냅니다. Meta가 브라우저·서버
이벤트를 하나로 중복 제거합니다.

## 이벤트 계약

| 퍼널 지점 | 실제 UI 시점 | Meta 이벤트 | 종류 |
|---|---|---|---|
| 랜딩 방문 | `/`에서 Pixel 준비 완료 | `PageView` | 표준 |
| 결과 조회 | 결과 화면이 실제로 표시됨 | `ViewContent` | 표준 |
| 아이디어 선택 | `이 아이디어 완성해서 보기` 클릭 | `IdeaSelected` | 커스텀 |
| 첫 실행 시작 | `AI 코딩 프롬프트 복사`가 성공함 | `FirstActionPlanStarted` | 커스텀 |

사용자가 작성한 문구나 카드 본문은 보내지 않습니다. 시도 번호, 비개인
시나리오 ID, 행동 종류만 전송합니다.

## 서버 환경 변수

배포 환경의 비밀 저장소에만 아래 이름을 등록합니다. 실제 값은 저장소,
문서, 클라이언트 코드에 넣지 않습니다.

```dotenv
NEXT_PUBLIC_META_PIXEL_ID=
META_DATASET_ID=
META_CONVERSIONS_API_TOKEN=
META_GRAPH_API_VERSION=v25.0
```

- `NEXT_PUBLIC_META_PIXEL_ID`: 공개 Pixel 식별자. 브라우저 초기화에 필요합니다.
- `META_DATASET_ID`: 서버 CAPI 전송 대상 Dataset/Pixel 식별자입니다.
- `META_CONVERSIONS_API_TOKEN`: 서버 전용 액세스 토큰입니다.
- `META_GRAPH_API_VERSION`: 선택 값입니다. 미설정 시 `v25.0`을 사용합니다.

Pixel ID가 없거나 잘못되면 Meta 스크립트와 클라이언트 전환 전송을 하지
않습니다. 서버 Dataset ID 또는 토큰이 없으면 CAPI 라우트는 `204` no-op으로
끝납니다. 실제 계정으로 시험 전송하려면 배포 담당자가 Meta Events Manager의
Test Events 절차와 조직의 동의·개인정보 정책을 먼저 확인해야 합니다.
