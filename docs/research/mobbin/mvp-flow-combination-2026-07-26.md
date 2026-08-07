# MVP 플로우 조합 레퍼런스

결론: 앱 전체를 같은 화면으로 만들지 않고, `선택·입력`, `대화`, `결과`, `보조 도구` 역할별로 Mobbin 화면을 한 단계씩 가져온다.

## Story Cards — 카드에서 바로 대화

![Pi 상황 입력에서 대화로 이어지는 흐름](assets/mvp-app-redesign-2026-07-26/pi-flow.jpg)

- 흐름: 기존 FanDeck 카드 선택 → Pi식 같은 화면 대화 → 필요할 때만 ChatGPT식 도구 시트
- 관찰: Pi는 첫 상황과 후속 대화를 같은 화면에 남기고, ChatGPT는 보조 기능을 바텀시트로 분리한다.
- 적용: 카드 선택값을 첫 메시지로 보내고, 채팅 입력과 메시지 목록만 남긴다.
- 제외: 선택 후 확인 화면, 설명 랜딩, 항상 노출되는 여러 보조 CTA를 넣지 않는다.
- 출처: [Pi Mobbin flow](https://mobbin.com/flows/3633dacc-a527-49eb-b898-c410e2b2ce26) · [ChatGPT Mobbin screen](https://mobbin.com/screens/8a129430-1bb4-441a-93d1-123b5d334080)

## Tastepin·Onebite — 한 질문에서 분석 결과

![Lovi 대상 선택에서 결과까지 이어지는 흐름](assets/mvp-app-redesign-2026-07-26/lovi-flow.jpg)

- 흐름: Flo식 한 질문 → Lovi식 핵심 입력 → 한 줄 판정·세 근거·다음 행동
- 관찰: Flo는 현재 질문 이외의 정보를 제거하고, Lovi는 입력과 결과를 서로 다른 상태로 분리한다.
- 적용: 입력 화면에서는 한 과업만, 결과 화면에서는 판정·근거·다시 하기만 보여준다.
- 제외: 기능 소개 카드, 여러 입력 방식의 동시 강조, 결과보다 큰 구매·공유 버튼을 넣지 않는다.
- 출처: [Flo Mobbin screen](https://mobbin.com/screens/a8f2b86d-154c-4bcd-835a-069e3cdfe6f1) · [Lovi Mobbin flow](https://mobbin.com/flows/12e8692d-5da8-40a3-a51d-a48d2d39fa8a)

## Today A·B — 질문하고 대화로 좁히기

![Flo의 한 화면 한 질문](assets/mvp-app-redesign-2026-07-26/flo.jpg)

- 흐름: Flo식 첫 질문 → Pi식 맥락형 후속 질문 1회 → Lovi식 구조화 실행 결과
- 관찰: 첫 입력 부담은 한 질문으로 제한하고, 사용자의 답이 생긴 뒤에만 다음 질문을 제시한다.
- 적용: 긴 폼을 없애고 응답에 따라 후속 질문 하나와 실행 결과를 순차 공개한다.
- 제외: 세 질문을 한 화면에 펼치거나 대화 기록과 결과 카드를 동시에 경쟁시키지 않는다.
- 출처: [Flo Mobbin screen](https://mobbin.com/screens/a8f2b86d-154c-4bcd-835a-069e3cdfe6f1) · [Pi Mobbin flow](https://mobbin.com/flows/3633dacc-a527-49eb-b898-c410e2b2ce26) · [Lovi Mobbin flow](https://mobbin.com/flows/12e8692d-5da8-40a3-a51d-a48d2d39fa8a)

## 우리 앱에 적용

1. Story Cards는 A, Tastepin·Onebite는 B, Today A·B는 C를 기본안으로 쓴다.
2. ChatGPT 도구 시트는 모든 앱의 첫 화면이 아니라 보조 기능이 두 개 이상일 때만 쓴다.
3. 화면별 주 CTA는 하나만 두고, 선택 표면 자체가 행동이면 별도 확인 버튼을 만들지 않는다.

> 화면 구조는 참고 근거이며 성과 개선을 보장하지 않는다.
