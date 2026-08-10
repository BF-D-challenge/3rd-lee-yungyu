# MOB-MATPIN-CTA-20260807

상태: `implemented`

맛핀 랜딩의 실제 진입 경로에서 CTA를 `Instagram에서 시작하기`로 사용합니다. 현재 코드와
대상 URL, 클릭 계측, 관련 테스트는 확인했지만 최신 렌더와 새 Finish Reviewer의 `ship`
판정이 없으므로 기술 검증 완료로 올리지 않습니다. Mobbin 근거는 구조와 문구 역할만
지원하며 제품 성과를 증명하지 않습니다.

## Machine Contract

```json
{
  "schema": "design-decision-receipt/v2",
  "decision_id": "MOB-MATPIN-CTA-20260807",
  "decision_key": "matpin:/matpin:primary-cta",
  "status": "implemented",
  "source": {
    "report_path": "docs/research/mobbin/matpin-onboarding-cta-2026-08-07.md",
    "report_sha256": "018d1448258d8a3539f72b96182b6d0f9446ff4fe679b8e3a7e6ee4948c02d85",
    "research_id": "MOB-RES-MATPIN-CTA-20260807",
    "selected_reference_ids": [
      "beli-onboarding",
      "canopi",
      "collect-share-sheet"
    ],
    "evidence_state": "current",
    "recheck_triggers": [
      "The live /matpin entrypoint or CTA copy changes.",
      "The Instagram destination or post-click journey changes.",
      "A selected local image or Mobbin reference becomes unavailable."
    ]
  },
  "transfer": {
    "decision": "adapt",
    "confidence": "medium",
    "rationale": "Action-led CTA copy fits the first step, but Matpin must preserve the external Instagram transition and avoid implying that clicking completes a save.",
    "checks": {
      "intent": "match",
      "lifecycle": "mismatch",
      "risk": "match",
      "market": "mismatch",
      "plumbing": "match"
    },
    "before": "The 2026-08-07 pre-research CTA said matpin.kr 열기.",
    "after": "The live /matpin route says Instagram에서 시작하기 on its desktop and mobile primary CTAs.",
    "ask_type": "none",
    "ask_boundary": "The CTA does not request signup, permission, or payment. It starts an external transition to the Matpin Instagram profile.",
    "immediate_next_state": "The browser is asked to open https://www.instagram.com/matpin.kr/ in a new browsing context; the operating system may hand it to the Instagram app.",
    "recovery": "The landing remains available, but it has no explicit state that detects or explains a blocked or failed external transition.",
    "adaptations": [
      {
        "area": "check:lifecycle",
        "change": "Name the Instagram channel and starting action while keeping the CTA before the separate reel-sharing and save-result steps.",
        "reason": "Most positive references continue inside one app, while Matpin hands the user to Instagram first."
      },
      {
        "area": "check:market",
        "change": "Keep the matpin.kr account identity in adjacent instructions instead of treating the account address as the CTA label.",
        "reason": "The Korean Instagram flow still needs a recognizable destination without repeating it as the primary action."
      },
      {
        "area": "readiness:metric",
        "change": "Instrument Instagram profile arrival before treating it as a measured outcome; until then, report only the observable landing-to-CTA click-through rate.",
        "reason": "The current events observe the landing and CTA click but do not confirm arrival at the external Instagram profile."
      },
      {
        "area": "readiness:guardrail",
        "change": "Define and instrument a completion-misunderstanding signal before evaluating the guardrail.",
        "reason": "The current implementation does not directly observe whether users mistake a CTA click for a completed save."
      }
    ],
    "non_goals": [
      "Do not change the Instagram save pipeline.",
      "Do not add authentication, permission, or payment requests.",
      "Do not redesign the full landing page.",
      "Do not claim that CTA clicks prove Instagram arrival or saved-place completion."
    ],
    "blockers": [],
    "readiness": {
      "risk_level": "low",
      "api": "not_applicable",
      "dto": "not_applicable",
      "events": "ready",
      "aggregation": "ready",
      "metric": "planned",
      "guardrail": "planned"
    }
  },
  "visual_direction": {
    "required": false,
    "reason": "This is a narrow CTA-copy decision inside an established layout and identity.",
    "options": [],
    "selected_option": null
  },
  "implementation": {
    "entrypoints": [
      "src/app/matpin/page.tsx"
    ],
    "runtime_trace": [
      "src/app/matpin/page.tsx",
      "src/components/organisms/tastepin/matpin-mobile-frame.tsx"
    ],
    "targets": [
      "src/components/organisms/tastepin/matpin-mobile-frame.tsx"
    ],
    "changed_files": [
      "src/app/matpin/page.tsx",
      "src/components/organisms/tastepin/matpin-mobile-frame.tsx"
    ],
    "acceptance_checks": [
      "The /matpin route renders MatpinMobileFramePrototype with variant landing.",
      "Desktop and mobile primary CTAs say Instagram에서 시작하기.",
      "Each primary CTA points to https://www.instagram.com/matpin.kr/.",
      "A click records tastepin_primary_cta_clicked and the shared primary_cta funnel event.",
      "Unused MatpinHome code is not treated as the live route implementation."
    ],
    "observed_at": "2026-08-10T12:33:23+09:00",
    "completed_at": "2026-08-07T09:07:49+09:00",
    "completion_evidence": [
      "Git commit 7714e637e80918eb4de495b6272f17a7def15079 introduced the /matpin route and mobile CTA copy.",
      "Git commit 62539ee4cef91d2a787c180ceb68bb7061c6867b added the same CTA to the desktop landing action.",
      "The current route imports MatpinMobileFramePrototype and the live component contains the CTA and destination."
    ]
  },
  "verification": {
    "renders": [],
    "tests": [
      {
        "status": "passed",
        "command": "npm run test:unit -- tests/unit/mvp-experiment-analytics.test.ts",
        "exit_code": 0,
        "ran_at": "2026-08-10T12:33:24+09:00",
        "result": "6/6 passed",
        "artifact": null
      },
      {
        "status": "passed",
        "command": "npm run test:e2e -- tests/e2e/tastepin.spec.ts",
        "exit_code": 0,
        "ran_at": "2026-08-10T12:33:42+09:00",
        "result": "1/1 passed",
        "artifact": null
      },
      {
        "status": "passed",
        "command": "npm run test:e2e -- tests/e2e/matpick.spec.ts --grep 모바일 랜딩은 Instagram 공유와 역별 자동 정리를 먼저 설명한다",
        "exit_code": 0,
        "ran_at": "2026-08-10T12:33:59+09:00",
        "result": "1/1 passed",
        "artifact": null
      }
    ],
    "reviewer": {
      "verdict": "pending",
      "reviewed_at": null,
      "round": 0,
      "findings": [],
      "artifact": null
    }
  },
  "e3": {
    "status": "unmeasured",
    "metric": "landing_view to primary_cta click-through rate",
    "guardrails": [
      "Instagram profile arrival is not currently observed.",
      "Saved-place completion must not be inferred from a CTA click.",
      "Track questions or exits caused by completion misunderstanding."
    ],
    "data_sources": [
      "GA4 landing_view and primary_cta events",
      "Clarity landing_view and primary_cta events",
      "Browser localStorage event evidence"
    ],
    "success_criteria": null,
    "stop_criteria": null,
    "result_artifact": null
  },
  "supersession": {
    "supersedes": null,
    "superseded_by": null
  }
}
```
