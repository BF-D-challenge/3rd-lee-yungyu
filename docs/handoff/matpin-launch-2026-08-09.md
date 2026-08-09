# 맛핀 2026-08-09 출시 실행 문서

## 현재 판정

- 일반 공개: HOLD
- 앱 역할과 승인된 테스트 계정 대상 비공개 베타: GO
- 운영 주소: <https://matpin-kr.vercel.app/matpin>
- 기능 출시 기준 커밋: `ffcb6c617099444bd9df59dde51c81d93bcae158`

일반 공개가 HOLD인 이유는 `instagram_business_manage_messages`가 현재 `테스트 준비 완료` 상태이고, Meta 앱 검수의 고급 액세스 승인이 아직 없기 때문입니다. 앱 자체는 라이브 상태이며 `matpin.kr` 계정과 운영 Webhook은 연결되어 있습니다.

## 확인된 운영 증거

| 항목 | 상태 | 증거 |
| --- | --- | --- |
| 임시 도메인 | 완료 | `matpin-kr.vercel.app`이 운영 배포를 가리킴 |
| 대표 화면 | 완료 | `/matpin` 200 응답, 모바일 UI와 법적 링크 확인 |
| 개인정보처리방침 | 완료 | `/privacy` 200 응답, Meta 앱 기본 설정에 등록 |
| 서비스 이용약관 | 완료 | `/terms` 200 응답, Meta 앱 기본 설정에 등록 |
| 데이터 삭제 안내 | 완료 | `/data-deletion` 200 응답, Meta 앱 기본 설정에 등록 |
| 사용자 데이터 삭제 화면 | 완료 | `/matpin/delete`에서 삭제 동작 진입 확인 |
| Meta 앱 공개 상태 | 완료 | Meta 개발자 콘솔에서 게시됨 확인 |
| Instagram 계정 | 완료 | `matpin.kr` 연결과 Webhook 구독 설정 확인 |
| Webhook 콜백 | 완료 | `https://matpin-kr.vercel.app/api/matpin/webhook` 등록 확인 |
| 메시지 Webhook | 완료 | `messages` 필드 구독 중 확인 |
| 개인 보관함 짧은 링크 | 완료 | `/s/{16자리 코드}`에서 만료되지 않은 개인 보관함으로만 이동, 코드 원문은 DB에 저장하지 않음 |
| 메시지 권한 고급 액세스 | 미완료 | `테스트 준비 완료`, `앱 검수에 추가` 상태 |
| 최신 배포 실사용 왕복 | 승인 대기 | 실제 Instagram 메시지 전송 전 사용자 승인 필요 |
| 운영 분석 영수증 | 미완료 | GA4, Clarity, Meta Pixel 운영 ID 없음 |

## Meta 앱 검수 요청 범위

### instagram_business_basic

한국어 설명:

> 맛핀은 연결된 Instagram 프로페셔널 계정 `matpin.kr`을 식별하고 계정 연결 상태를 유지하기 위해 이 권한을 사용합니다. 사용자가 먼저 `matpin.kr`에 공유한 공개 맛집 게시물만 처리하며, 임의의 Instagram 사용자나 공개 프로필을 수집하지 않습니다.

English description:

> Matpin uses this permission to identify the connected Instagram professional account, `matpin.kr`, and maintain its account connection. The service processes only public restaurant posts, including Reels and carousel posts, that a user intentionally shares with `matpin.kr`. It does not process text or media files directly attached to a DM, and it does not scrape arbitrary Instagram users or public profiles.

### instagram_business_manage_messages

한국어 설명:

> 사용자가 Instagram에서 `matpin.kr`로 공개 맛집 게시물을 먼저 공유하면, 맛핀은 해당 DM을 받아 게시물 속 장소 후보를 확인하고 개인 보관함에 저장합니다. 릴스, 일반 피드 게시물과 캐러셀 공유를 처리하지만 DM에 직접 첨부한 글, 이미지와 동영상은 처리하지 않습니다. 처리가 끝나면 같은 대화에 저장 결과와 개인 보관함 링크를 답장합니다. 사용자가 시작하지 않은 광고나 홍보 메시지는 보내지 않습니다.

English description:

> When a user first shares a public restaurant post with `matpin.kr` on Instagram, Matpin receives that DM, identifies place candidates in the post, and saves the result to the user's private collection. It supports Reels, feed posts, and carousel shares, but does not process text, images, or videos directly attached to a DM. Matpin then replies in the same conversation with the save result and a private collection link. It never sends unsolicited promotional messages.

## 검수자 테스트 절차

1. Instagram에서 공개 음식점 게시물을 엽니다.
2. 공유 버튼을 누르고 `matpin.kr`로 게시물을 보냅니다.
3. 같은 대화에서 맛핀이 보낸 처리 완료 답장을 기다립니다.
4. 답장의 개인 보관함 링크를 엽니다.
5. 게시물에서 확인한 장소가 역별 보관함에 저장됐는지 확인합니다.
6. 보관함의 `내 데이터 관리`를 눌러 장소 삭제와 전체 데이터 삭제 진입점을 확인합니다.
7. 개인정보처리방침과 데이터 삭제 안내는 아래 URL에서 확인합니다.

- 개인정보처리방침: <https://matpin-kr.vercel.app/privacy>
- 서비스 이용약관: <https://matpin-kr.vercel.app/terms>
- 데이터 삭제 안내: <https://matpin-kr.vercel.app/data-deletion>

## 검수 제출 전에 만들 증거

- 30초에서 60초 길이의 실제 Instagram 왕복 화면 녹화
- 게시물 공유, 자동 답장, 개인 보관함 열기까지 한 영상에 포함
- 테스트 계정명과 개인 보관함 토큰은 제출 영상 외부에 공개하지 않음
- 운영 로그는 시간, 성공 상태, 내부 요청 식별자만 남기고 토큰과 사용자 식별값은 가림
- 데이터 삭제 화면과 개인정보처리방침 URL 스크린샷 첨부

## 출시 당일 운영 TASK

### P0, 오늘 완료

- [ ] 실제 게시물 1건 왕복 테스트 승인받기
- [ ] 최신 운영 배포에서 자동 답장과 개인 보관함 링크 확인하기
- [ ] Meta 앱 검수에 `instagram_business_basic`과 `instagram_business_manage_messages` 추가하기
- [ ] 실제 왕복 화면 녹화와 권한 사용 설명 제출하기
- [ ] 일반 공개 또는 비공개 베타 범위를 확정하기

### P0, 내일 공개 직전

- [ ] `npm run matpin:launch:check`로 운영 주소 자동 점검 통과하기
- [ ] `/matpin`, `/privacy`, `/terms`, `/data-deletion` 200 응답 확인하기
- [ ] Webhook GET 검증과 잘못된 서명 POST 거절 확인하기
- [ ] 배포 이후 서버 5xx와 Webhook 처리 실패 확인하기
- [ ] Instagram 프로필 소개에 운영 주소와 개인정보처리방침 연결하기
- [ ] 앱 검수 미승인 상태라면 비공개 베타임을 명확히 안내하기

### P1, 출시 후 첫날

- [ ] 처리 성공률, 처리 시간, 자동 답장 실패 건수 기록하기
- [ ] 운영자명과 문의 이메일을 개인정보처리방침에 확정하기
- [ ] GA4, Clarity 또는 Meta Pixel 중 하나를 연결해 실제 수신 영수증 확보하기
- [ ] 별도 테스트 계정으로 전체 데이터 삭제를 실행하고 재접속 시 삭제 상태 확인하기

### 정식 도메인을 구매한 뒤

- [ ] Vercel 운영 별칭을 정식 도메인으로 연결하기
- [ ] `/matpin` canonical과 Open Graph URL을 정식 도메인으로 변경하기
- [ ] Meta 앱의 개인정보처리방침, 약관, 데이터 삭제 URL을 정식 도메인으로 변경하기
- [ ] Instagram 프로필 링크와 앱 검수 설명의 운영 주소를 정식 도메인으로 변경하기
- [ ] 이전 임시 도메인을 정식 도메인으로 영구 이동시키고 링크 호환성을 확인하기

## 공개 범위 결정 기준

| 조건 | 결정 |
| --- | --- |
| 메시지 권한 고급 액세스 승인과 일반 계정 왕복 성공 | 일반 공개 GO |
| 고급 액세스 미승인, 앱 역할 계정 왕복 성공 | 비공개 베타 GO |
| 테스트 계정에서도 왕복 실패 | 출시 HOLD |

## 보안 원칙

- 액세스 토큰, Webhook 인증 토큰, 개인 보관함 토큰을 문서와 로그에 넣지 않습니다.
- DM에는 96비트 짧은 코드만 보내고, 데이터베이스에는 코드의 SHA-256 해시만 저장합니다.
- 실제 전체 데이터 삭제는 별도 테스트 계정과 명시적인 승인 후 실행합니다.
- Meta 설정 변경과 앱 검수 제출은 제출 내용을 사람이 마지막으로 확인한 뒤 실행합니다.

## 자동 점검 명령

운영 주소를 검사할 때:

```bash
npm run matpin:launch:check
```

Preview 배포를 검사하되 canonical은 운영 주소를 기대할 때:

```bash
npm run matpin:launch:check -- https://preview.example.com https://matpin-kr.vercel.app
```
