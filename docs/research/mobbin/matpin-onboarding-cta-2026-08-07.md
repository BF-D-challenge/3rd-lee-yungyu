# 맛핀 온보딩 CTA 레퍼런스 요약

결론: Scout는 첫 버튼에서 `matpin.kr` 주소를 반복하지 않고, 사용자가 다음 행동을 예측할 수 있는 `Instagram에서 시작하기`를 사용하자고 비구속 제안합니다.

## 조사 브리프

- 사용자 과업: Instagram에서 본 맛집 릴스를 맛핀 계정으로 보내 저장을 시작합니다.
- 진입 트리거: 맛핀 모바일 랜딩의 첫 장면을 봅니다.
- 현재 기준선: 2026-08-07 조사 전에는 `matpin.kr 열기`가 Instagram 프로필로 이동했습니다.
- 가치 순간: 보낸 릴스가 가까운 역별 보관함에 쌓인 결과를 확인합니다.
- 검토할 요청: 없음
- 결정: 첫 CTA에 주소와 행동 중 무엇을 우선할지 정합니다.
- 목표 지표: 첫 CTA 클릭률과 Instagram 프로필 도달률
- guardrail: 버튼 문구와 실제 이동 결과의 일치, 저장 완료로 오해하는 비율
- 가정: 사용자는 버튼을 누른 뒤 Instagram의 matpin.kr 프로필에서 공유 방법을 확인합니다.

## Beli

![Beli의 약속, 지역 선택, 첫 목록 행동](assets/tastepin-full-funnel-2026-07-26/beli-onboarding-flow.jpg)

- 흐름: 가치 약속 → 지역 선택 → 첫 목록 행동
- 관찰 E0: 첫 CTA는 브랜드 주소가 아니라 `Get started`로 시작 행동을 말하고, 결과 화면에서는 `Let's rank!`로 핵심 과업을 말합니다.
- Scout 제안: adapt, 맛핀도 주소보다 시작 행동을 먼저 씁니다.
- 위험과 한계: Beli는 앱 안에서 행동이 이어지지만 맛핀은 Instagram으로 이동합니다.
- 출처: [Mobbin flow](https://mobbin.com/flows/bf32f945-5507-4a2c-acac-578856b13f42)

## Canopi

![Canopi 빈 상태의 새 컬렉션 행동](assets/matpin-click-flow-references-2026-08-02/canopi-01-empty.jpg)

- 관찰 E0: 빈 상태는 제품 이름을 반복하지 않고 `New Collection`으로 사용자가 만들 대상을 말합니다.
- Scout 제안: adopt, 한 화면의 주 CTA는 하나로 두고 다음 행동을 동사로 표현합니다.
- 위험과 한계: 맛핀은 새 보관함을 수동 생성하지 않으므로 `저장하기`처럼 즉시 완료를 암시하면 안 됩니다.
- 출처: [Mobbin screen](https://mobbin.com/screens/b19a1cc5-4dae-4c99-8855-1ee3f0e7e8ad)

## Collect

![Collect 화면 위의 iOS 공유 시트](assets/tastepin-full-funnel-2026-07-26/collect-share.jpg)

- 관찰 E0: 시스템 공유 시트에서는 `Message`, `Mail`, `Copy link`처럼 실제 목적지와 동작 이름이 선택 항목이 됩니다.
- Scout 제안: hold, Instagram의 실제 공유 시트에서는 `matpin.kr` 계정명이 중요하지만 랜딩 CTA에서는 같은 주소를 반복할 필요가 없습니다.
- 위험과 한계: 랜딩 버튼과 시스템 공유 대상은 역할이 다르므로 같은 문구를 강제로 맞추면 안 됩니다.
- 출처: [Mobbin screen](https://mobbin.com/screens/fa57253d-c437-4a78-a198-21930456cae6)

## 반복 패턴과 예외

- 반복 E1: Beli와 Canopi는 첫 행동이나 핵심 과업을 CTA에 씁니다.
- counterexample: Collect처럼 사용자가 여러 목적지 중 하나를 고르는 시스템 공유 화면에서는 서비스 이름이 선택 정보가 됩니다.
- 외부 근거 E2: 없음

## Design Architect 전달

- scout recommendation: `adapt` (비구속)
- confidence: `medium`
- 이유: 주소는 제목과 설명에 이미 보이고, 버튼은 이동 채널과 시작 행동을 알려야 합니다.
- counterexample: `collect-share-sheet`, 여러 목적지 중 하나를 고르는 시스템 공유 화면에서는 서비스 이름이 필요합니다.
- 재확인 조건: `/matpin` 진입점과 CTA 문구, Instagram 목적지, 선택한 로컬 이미지나 Mobbin 레퍼런스가 바뀌면 다시 확인합니다.
- 검증: CTA 클릭률과 Instagram 프로필 도달률을 보고, 저장 완료로 오해하는 문의나 이탈을 함께 확인합니다.
- Figma 전달: `대기`, 기존 `mobbin mcp` 파일의 날짜별 보드 추가와 실제 캔버스 확인은 이번 문서 검증 범위에서 실행하지 않았습니다.

> Mobbin 화면은 출시된 구조의 근거이며 성과와 사용성의 증거가 아닙니다. 최종 전이는 Decision Receipt가 소유합니다.

## Machine Contract

```json
{
  "schema": "mobbin-report/v2",
  "research_id": "MOB-RES-MATPIN-CTA-20260807",
  "evidence_state": "current",
  "references": [
    {
      "reference_id": "beli-onboarding",
      "reference_kind": "direct",
      "image_path": "assets/tastepin-full-funnel-2026-07-26/beli-onboarding-flow.jpg",
      "canonical_url": "https://mobbin.com/explore/flows/bf32f945-5507-4a2c-acac-578856b13f42",
      "captured_at": "2026-07-26",
      "reviewed_at": "2026-08-10",
      "lifecycle": [
        {"stage": "trigger", "observed": "The first-run onboarding screen is opened."},
        {"stage": "promise", "observed": "Get started presents the first action instead of repeating the brand address."},
        {"stage": "effort", "observed": "The selected evidence shows a city preference choice, not an operating-system permission request."},
        {"stage": "value", "observed": "The selected evidence reaches the first ranking and list context."},
        {"stage": "ask", "observed": "No signup, permission, or payment ask is visible in the selected evidence."},
        {"stage": "after", "observed": "Let's rank! continues to the core ranking task."}
      ],
      "task_metrics": {
        "applicability": "not_applicable",
        "steps_to_value": null,
        "steps_to_ask": null,
        "value_before_ask": null,
        "not_applicable_reason": "The selected strip is not a complete contiguous flow, so step counts would be inferred."
      },
      "observed_evidence": "Get started and Let's rank! name the next action instead of a destination address.",
      "risk_or_limit": "Beli continues inside its app, while Matpin sends the user to Instagram.",
      "observation_confidence": "high"
    },
    {
      "reference_id": "canopi",
      "reference_kind": "analogous",
      "image_path": "assets/matpin-click-flow-references-2026-08-02/canopi-01-empty.jpg",
      "canonical_url": "https://mobbin.com/explore/screens/b19a1cc5-4dae-4c99-8855-1ee3f0e7e8ad",
      "captured_at": "2026-08-02",
      "reviewed_at": "2026-08-10",
      "lifecycle": [
        {"stage": "trigger", "observed": "The empty collection state is shown."},
        {"stage": "promise", "observed": "The empty-state copy explains planning, tracking, organizing, and sharing uses."},
        {"stage": "effort", "observed": "No completed creation effort is visible in this single screen."},
        {"stage": "value", "observed": "No completed collection value is visible in this single screen."},
        {"stage": "ask", "observed": "No signup, permission, or payment ask is visible in this single screen."},
        {"stage": "after", "observed": "New Collection is the single visible next action."}
      ],
      "task_metrics": {
        "applicability": "not_applicable",
        "steps_to_value": null,
        "steps_to_ask": null,
        "value_before_ask": null,
        "not_applicable_reason": "This is one empty-state screen, not a complete flow."
      },
      "observed_evidence": "New Collection states the object the user can create instead of repeating the product name.",
      "risk_or_limit": "Matpin does not ask users to create a collection manually, so completion language would be misleading.",
      "observation_confidence": "high"
    },
    {
      "reference_id": "collect-share-sheet",
      "reference_kind": "counterexample",
      "image_path": "assets/tastepin-full-funnel-2026-07-26/collect-share.jpg",
      "canonical_url": "https://mobbin.com/explore/screens/fa57253d-c437-4a78-a198-21930456cae6",
      "captured_at": "2026-07-26",
      "reviewed_at": "2026-08-10",
      "lifecycle": [
        {"stage": "trigger", "observed": "The operating-system share sheet is opened over Collect."},
        {"stage": "promise", "observed": "No separate product promise is visible in this system chooser."},
        {"stage": "effort", "observed": "The user chooses a concrete share destination or action."},
        {"stage": "value", "observed": "The result after choosing a destination is not visible in this screen."},
        {"stage": "ask", "observed": "No signup, permission, or payment ask is visible in this screen."},
        {"stage": "after", "observed": "The post-selection state is outside the selected evidence."}
      ],
      "task_metrics": {
        "applicability": "not_applicable",
        "steps_to_value": null,
        "steps_to_ask": null,
        "value_before_ask": null,
        "not_applicable_reason": "This single system share screen is used only as a CTA-role counterexample."
      },
      "observed_evidence": "Message, Mail, and Copy link identify concrete destinations or actions in a system chooser.",
      "risk_or_limit": "A landing CTA and a system share destination have different roles and should not be forced to use identical copy.",
      "observation_confidence": "high"
    }
  ],
  "repeated_patterns": [
    {
      "claim": "Beli and Canopi name the first action or core task in their primary CTA.",
      "reference_ids": ["beli-onboarding", "canopi"]
    }
  ],
  "counterexample_reference_id": "collect-share-sheet",
  "external_evidence": [],
  "scout_recommendation": {
    "decision": "adapt",
    "confidence": "medium",
    "rationale": "Use the channel and starting action instead of repeating the address, while preserving the fact that Matpin moves the user into Instagram rather than continuing in the same app.",
    "counterexample": "collect-share-sheet",
    "recheck_triggers": [
      "The live /matpin entrypoint or CTA copy changes.",
      "The Instagram destination URL or post-click journey changes.",
      "A selected local image or Mobbin reference becomes unavailable."
    ]
  }
}
```
