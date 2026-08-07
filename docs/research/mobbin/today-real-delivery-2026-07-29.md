# Today 실제 전달 플로우 · Mobbin 결정 기록

- 날짜: 2026-07-29
- 범위: 아이디어 신청 → 서버 작업 큐 → 이메일 알림 → 사용자별 결과 재열기
- 현재 화면 감사: 시작 화면과 신청 화면의 시각 완성도는 유지한다. 문제는 “24시간 뒤”가 브라우저 시간과 `localStorage`로만 진행되던 계약 불일치였다.

## 선택한 레퍼런스

### 1. Lensa AI · Generating magic avatars — 주 레퍼런스

- 원본: https://mobbin.com/flows/e155bc11-e270-4c5a-b998-88a36d37da49
- 검증 화면: [결정 스트립](./assets/today-real-delivery-2026-07-29/lensa-decision-strip.jpg)
- OCR에서 확인한 문구: `Uploading photos`, `Creating avatars`, `Remaining time`, `You'll be notified when it's done`, 완료 후 결과 팩.
- 채택:
  - 제작 화면을 닫아도 작업이 계속된다는 확신
  - 예상 시간과 현재 상태를 한 화면에 표시
  - 완료 알림 뒤 결과함으로 복귀
- Today 전이:
  - `queued → processing → ready`를 서버 상태로 표시
  - 완료 이메일의 전용 링크가 결과함 역할

### 2. Fiverr · Order detail — 상태 상세 레퍼런스

- 원본: https://mobbin.com/flows/c4beeedb-7d3e-4298-8447-b2a7cfd5e010
- 검증 화면: [결정 스트립](./assets/today-real-delivery-2026-07-29/fiverr-decision-strip.jpg)
- OCR에서 확인한 문구: `Due in the next 24 Hours`, `Expected delivery`, `Timeline`, `Order started`, `Order requirements submitted`.
- 채택:
  - 제작 번호, 예상 완료 시각, 신청 내용의 지속적인 상세 화면
  - 신청 완료와 실제 제작 진행을 분리한 타임라인
- Today 전이:
  - 신청 직후 서버 저장 완료를 첫 단계로 표시
  - 작업 큐와 이메일 전달을 각각 별도 단계로 표시

### 3. Chipotle · Tracking your order — 간결한 진행 표현

- 원본: https://mobbin.com/flows/1e6de72b-5da4-40b3-ac74-3d3859e4aade
- 검증 화면: [결정 스트립](./assets/today-real-delivery-2026-07-29/chipotle-decision-strip.jpg)
- OCR에서 확인한 문구: `Estimated Arrival`, `Delivery Status`, `Order Received`, `Headed to Pickup`, `Arriving Soon`.
- 채택:
  - 사용자가 기술 용어를 몰라도 순서를 이해하는 3단계 상태
- Today 전이:
  - `신청 저장 → 광고·랜딩 제작 → 전용 링크 전달`

### 4. Upwork · Contracts — 반례

- 원본: https://mobbin.com/flows/9d81bc70-a355-4051-bd49-04d01561362d
- 검증 화면: [결정 스트립](./assets/today-real-delivery-2026-07-29/upwork-decision-strip.jpg)
- OCR에서 확인한 문구: `Contracts`, `Active contracts`, `Timesheet`, `Budget`, `Escrow`.
- 제외:
  - 계약, 금액, 메시지, 작업표를 한 화면에 섞는 업무용 밀도
  - Today의 첫 1일 테스트에는 결제·계약 위계가 필요하지 않다.

## 최종 화면 계약

| 사용자 질문 | 화면의 답 |
|---|---|
| 신청이 실제로 저장됐나? | 서버 접수 완료 단계와 제작 번호 |
| 지금 무엇을 하는 중인가? | 작업 큐 대기, 제작 중, 이메일 재시도 상태 |
| 언제 받나? | 서버가 기록한 `readyAt` |
| 이 화면을 닫아도 되나? | 완료 이메일로 전용 링크 전달 |
| 다른 기기에서 다시 볼 수 있나? | URL 조각에 담긴 전용 접근 키로 서버 결과 조회 |
| 실패하면 어떻게 되나? | 최대 3회 재시도 후 실패 상태를 숨기지 않고 표시 |

## 구현 결정

- 저장: `public.today_jobs`, RLS 활성화, `anon`·`authenticated` 직접 접근 금지
- 큐: Supabase Queues(`pgmq`), 기본 지연 86,400초
- 처리: 보호된 서버 작업 엔드포인트가 큐 메시지를 가져와 결과 생성
- 이메일: Resend, 작업 ID 기반 멱등 키 사용
- 접근: 신청마다 HMAC 전용 링크를 만들고 DB에는 토큰 해시만 저장
- 브라우저: 결과 본문이나 이메일을 저장하지 않고, 다시 열기용 작업 ID와 토큰만 저장

## 운영 전 확인

1. 로컬 migration을 Supabase 프로젝트에 적용한다.
2. Vercel에 서버 전용 환경 변수를 등록한다.
3. Vercel Pro라면 5분 Cron을 사용한다. Hobby라면 하루 1회 제한 때문에 Supabase Cron 또는 별도 워커로 바꾼다.
4. 검증한 발신 도메인으로 실제 수신 테스트를 한 번 수행한다.
