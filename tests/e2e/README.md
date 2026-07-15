# 통합 시나리오 테스트 설계

실제 `/`와 `/praise/[slug]`를 Playwright로 연결해 검증한다. 테스트 서버에서는 Supabase와 Google 로그인을 끄고, 공유 API·클립보드·날짜만 결정적으로 mock한다. 가짜 칭찬 record는 `tests/e2e/helpers.ts`의 fixture와 브라우저 저장소에만 존재한다.

| Scenario | 자동화 위치 | 핵심 검증 |
|---|---|---|
| 1–3 | `idea-lab.spec.ts` | 첫 방문, 네 장 뽑기, 카드 뽑기식 단일 교체와 취소 |
| 4–5 | `idea-lab.spec.ts` | native/clipboard 성공, 취소, 같은 URL 재시도, 계측 |
| 6 | `idea-lab.spec.ts` | 생성된 응원 링크, 완성 아이디어와 네 축, 응원 진입 |
| 응원 여정 7개 | `praise-flow.spec.ts` | 아이디어 확인, 기본·직접 응원, 익명·이름 공개, 오류·빈 상태·받은 카드 |
| 14 | 세 E2E spec | Primary, 네 의미색, dark color scheme |
| 15–17 | `responsive-and-regression.spec.ts` | 여섯 화면 크기, reduced motion, 폐기 구현 회귀 방지 |

순수 날짜·스케줄·익명 공개 규칙과 저장소/Supabase 응답 변환은 `tests/unit/`에서 별도로 검증한다.

```bash
npm run test:unit
npm run test:e2e
npm run test:integration
```

실패 시 `test-results/`에 screenshot, video, trace와 핵심 DOM context가 남으며 모두 Git ignore 대상이다. 재시도는 0회로 두어 flaky 실패를 숨기지 않는다.
