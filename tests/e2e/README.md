# 통합 시나리오 테스트 설계

실제 `/`와 `/praise/[slug]`를 Playwright로 연결해 검증한다. 테스트 서버에서는 Supabase와 Google 로그인을 끄고, 공유 API·클립보드·날짜만 결정적으로 mock한다. 가짜 칭찬 record는 `tests/e2e/helpers.ts`의 fixture와 브라우저 저장소에만 존재한다.

| Scenario | 자동화 위치 | 핵심 검증 |
|---|---|---|
| 1–3 | `idea-lab.spec.ts` | 첫 방문, 네 장 뽑기, 단일 교체, 직접 입력 |
| 4–5 | `idea-lab.spec.ts` | native/clipboard 성공, 취소, 같은 URL 재시도, 계측 |
| 6 | `idea-lab.spec.ts` | 생성된 칭찬 링크, 긍정 칭찬 4개, opened 이벤트 |
| 7–8 | `praise-flow.spec.ts` | 영구 익명, 중복 방지, 30일 뒤 무료 이름 공개 |
| 9–10 | `praise-flow.spec.ts` | 빈 상태 CTA, 기존 링크 재공유, 오늘 카드 뒤집기 |
| 11–13 | `praise-flow.spec.ts` | 하루 한 장, 잠금 정보 비노출, 두 fake door |
| 14 | 세 E2E spec | Primary, 네 의미색, dark color scheme |
| 15–17 | `responsive-and-regression.spec.ts` | 네 해상도, reduced motion, 폐기 구현 회귀 방지 |

순수 날짜·스케줄·익명 공개 규칙과 저장소/Supabase 응답 변환은 `tests/unit/`에서 별도로 검증한다.

```bash
npm run test:unit
npm run test:e2e
npm run test:integration
```

실패 시 `test-results/`에 screenshot, video, trace와 핵심 DOM context가 남으며 모두 Git ignore 대상이다. 재시도는 0회로 두어 flaky 실패를 숨기지 않는다.
