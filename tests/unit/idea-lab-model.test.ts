import { describe, expect, it } from "vitest";
import {
  auditIdeaSelection,
  auditResultHeroCopy,
  buildDevelopmentInitPrompt,
  buildImagePrompt,
  buildIdeaResult,
  buildPlainExplain,
  buildPrompt,
  buildResultHeroCopy,
  buildUniqueClaim,
  IDEA_LAB_ROOT_PRINCIPLE,
  initialScenarioIndex,
  nextScenarioIndex,
  optionFor,
  type ChoiceIndexes,
} from "@/components/organisms/idea-lab/model";
import {
  IDEA_LAB_SCENARIOS,
  KOREA_POPULAR_IDEA_LAB_SCENARIOS,
} from "@/components/organisms/idea-lab/sample-data";
import {
  KOREA_POPULAR_SCENARIO_COUNT,
  KOREA_POPULAR_SCENARIO_IDS,
} from "@/components/organisms/idea-lab/korea-demand";
import {
  IDEA_PRODUCT_IDENTITIES,
  productIdentityForSource,
} from "@/components/organisms/idea-lab/product-identities";
import { AUTHORED_HERO_COPY } from "@/components/organisms/idea-lab/authored-hero-copy";
import type { IdeaLabSelection } from "@/components/organisms/idea-lab/types";

const choices: ChoiceIndexes = { source: 0, payer: 1, moment: 1, twist: 1 };

const selectionFor = (scenarioIndex = 0): IdeaLabSelection => {
  const scenario = IDEA_LAB_SCENARIOS[scenarioIndex];
  return {
    source: scenario.source,
    payer: scenario.payers[0],
    moment: scenario.moments[0],
    twist: scenario.twists[0],
  };
};

describe("Idea Lab model", () => {
  it("preserves 100 audited sources and exactly 2,700 catalog combinations", () => {
    expect(IDEA_LAB_SCENARIOS).toHaveLength(100);
    expect(
      new Set(IDEA_LAB_SCENARIOS.map((scenario) => scenario.id)).size,
    ).toBe(100);
    expect(
      new Set(IDEA_LAB_SCENARIOS.map((scenario) => scenario.source.sourceName))
        .size,
    ).toBe(100);

    const combinations = IDEA_LAB_SCENARIOS.reduce((total, scenario) => {
      expect(scenario.payers).toHaveLength(3);
      expect(scenario.moments).toHaveLength(3);
      expect(scenario.twists).toHaveLength(3);
      return (
        total +
        scenario.payers.length *
          scenario.moments.length *
          scenario.twists.length
      );
    }, 0);

    expect(combinations).toBe(2_700);
    expect(IDEA_LAB_SCENARIOS.flatMap((scenario) => [
      ...scenario.payers.map((payer) => payer.detail),
      ...scenario.moments.map((moment) => moment.detail),
      ...scenario.twists.map((twist) => twist.smallestBuild),
    ]).join("\n")).not.toMatch(
      /이 결과를 바로 사용합니다|입력 하나로 결과 하나를 확인하려는 순간|구체적인 입력:|즉시 결과:/u,
    );
  });

  it("draws only the 26 mass-market sources that pass the Korean-demand gate", () => {
    expect(KOREA_POPULAR_SCENARIO_COUNT).toBe(26);
    expect(KOREA_POPULAR_IDEA_LAB_SCENARIOS).toHaveLength(26);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.reduce(
        (total, scenario) =>
          total
          + scenario.payers.length
          * scenario.moments.length
          * scenario.twists.length,
        0,
      ),
    ).toBe(702);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.every(
        (scenario) => KOREA_POPULAR_SCENARIO_IDS.includes(
          scenario.id as (typeof KOREA_POPULAR_SCENARIO_IDS)[number],
        ),
      ),
    ).toBe(true);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.some(
        (scenario) => scenario.id === "recurring-charge-finder",
      ),
    ).toBe(true);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.some(
        (scenario) => scenario.id === "silent-companion-session",
      ),
    ).toBe(true);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.some(
        (scenario) => scenario.id === "reddit-growth-guide",
      ),
    ).toBe(false);
    expect(
      KOREA_POPULAR_IDEA_LAB_SCENARIOS.some(
        (scenario) => scenario.id === "amazon-listing-images",
      ),
    ).toBe(false);
  });

  it("gives all 100 sources a Tastepin-style brand name and concrete tagline", () => {
    const identities = IDEA_LAB_SCENARIOS.map((scenario) =>
      productIdentityForSource(scenario.source.id));
    const names = identities.map((identity) => identity.name);
    const taglines = identities.map((identity) => identity.tagline);

    expect(Object.keys(IDEA_PRODUCT_IDENTITIES)).toHaveLength(100);
    expect(identities).toHaveLength(100);
    expect(new Set(names).size).toBe(100);
    expect(names.every((name) => Array.from(name).length >= 2 && Array.from(name).length <= 8))
      .toBe(true);
    expect(new Set(taglines).size).toBe(100);
    expect(taglines.every((tagline) => {
      const length = Array.from(tagline).length;
      return length >= 12 && length <= 28 && !/[.!?。]$/u.test(tagline);
    })).toBe(true);
    expect(names.join(" ")).not.toMatch(/최고|유일|보장/u);
    expect(names.join(" ")).not.toMatch(
      /(?:만들기|찾기|검사|변환|정리|계산|받기|저장|제거|분석|측정|추출|바꾸기)(?:\s|$)/u,
    );
    expect(productIdentityForSource(
      IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "video-place-route")!.source.id,
    ).name).toBe("맛핀");
    expect(productIdentityForSource(
      IDEA_LAB_SCENARIOS.find(
        (scenario) => scenario.id === "single-page-performance-cause-report",
      )!.source.id,
    )).toEqual({
      name: "느림콕",
      tagline: "웹페이지를 느리게 만드는 원인을 콕",
    });
  });

  it("gives every source exactly three authored hooks, before lines, and after lines", () => {
    expect(Object.keys(AUTHORED_HERO_COPY)).toHaveLength(100);
    for (const scenario of IDEA_LAB_SCENARIOS) {
      const copy = AUTHORED_HERO_COPY[scenario.source.id];
      expect(copy, scenario.source.id).toBeDefined();
      expect(Object.keys(copy.hooks).sort()).toEqual(
        scenario.moments.map((moment) => moment.id).sort(),
      );
      expect(Object.keys(copy.before).sort()).toEqual(
        scenario.payers.map((payer) => payer.id).sort(),
      );
      expect(Object.keys(copy.after).sort()).toEqual(
        scenario.twists.map((twist) => twist.id).sort(),
      );
    }
  });

  it("keeps the reviewed source mechanisms and the five reference mechanisms coherent", () => {
    const lookup = IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "lookup-brief")!;
    expect(lookup.source.value).toContain("전화번호·이메일·IP");
    expect(lookup.source.preservedFlow).toContain("실시간 API 검증");
    expect(lookup.source.value).not.toContain("상대 정보를 찾아");
    expect(lookup.twists.every((twist) => /전화번호·이메일·IP|값 하나/.test(twist.smallestBuild))).toBe(true);

    const voice = IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "voice-notes")!;
    expect(voice.source.value).toContain("음성 받아쓰기");
    expect(voice.source.preservedFlow).toContain("입력칸에 텍스트 삽입");
    expect(voice.moments.every((moment) => !/회의가 끝난|현장 점검을 마치고/.test(moment.value))).toBe(true);
    expect(voice.twists.every((twist) => /음성|입력/.test(`${twist.value} ${twist.smallestBuild}`))).toBe(true);

    expect(IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "video-place-route")?.source.sourceName)
      .toContain("VlogMap");
    expect(IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "meal-habit-loop")?.twists[0].resultTitle)
      .toContain("코치");
    expect(IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "silent-companion-session")?.twists[0].resultTitle)
      .toContain("곁불");
    expect(IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "daily-character-world")?.twists[0].resultTitle)
      .toContain("이세카이");
    expect(IDEA_LAB_SCENARIOS.find((scenario) => scenario.id === "worry-guardian-ritual")?.twists[0].resultTitle)
      .toContain("마음수호신");
  });

  it("applies the generation principle as an internal gate without exposing it in the result", () => {
    const scenario = IDEA_LAB_SCENARIOS.find((item) => item.id === "meal-habit-loop")!;
    const selection = {
      source: scenario.source,
      payer: scenario.payers[0],
      moment: scenario.moments[0],
      twist: scenario.twists[0],
    };
    const prompt = buildPrompt(selection);
    const result = buildIdeaResult(selection);

    expect(IDEA_LAB_ROOT_PRINCIPLE).toHaveLength(6);
    expect(auditIdeaSelection(selection)).toEqual({ ok: true, issues: [] });
    expect(prompt).not.toContain("실제 사용·결제 근거가 있는 원본에서 시작한다.");
    expect(prompt).not.toContain("생성 원리");
    expect(prompt).toContain("원본이 이미 증명한 것");
    expect(prompt).toContain("유일 주장");
    expect(prompt).toContain("재사용·공유 가설");
    expect(prompt).toContain("결제 가설");
    expect(result.reuseHypothesis).toContain("검증이 필요");
    expect(result.paymentHypothesis).toContain("검증이 필요");
  });

  it("finds the requested initial scenario and falls back to the first scenario", () => {
    expect(initialScenarioIndex(KOREA_POPULAR_IDEA_LAB_SCENARIOS[2].id)).toBe(2);
    expect(initialScenarioIndex("missing-scenario")).toBe(0);
    expect(initialScenarioIndex()).toBe(0);
  });

  it("prioritizes an unseen audited source and avoids the current source after a full cycle", () => {
    const allButLast = KOREA_POPULAR_IDEA_LAB_SCENARIOS
      .slice(0, -1)
      .map((scenario) => scenario.id);
    expect(nextScenarioIndex(allButLast, 0, 0.5))
      .toBe(KOREA_POPULAR_IDEA_LAB_SCENARIOS.length - 1);

    const all = KOREA_POPULAR_IDEA_LAB_SCENARIOS.map((scenario) => scenario.id);
    expect(nextScenarioIndex(all, 0, 0)).toBe(1);
  });

  it("resolves the selected option for every axis", () => {
    const scenario = KOREA_POPULAR_IDEA_LAB_SCENARIOS[0];

    expect(optionFor("source", 0, choices)).toBe(scenario.source);
    expect(optionFor("payer", 0, choices)).toBe(
      scenario.payers[1 % scenario.payers.length],
    );
    expect(optionFor("moment", 0, choices)).toBe(
      scenario.moments[1 % scenario.moments.length],
    );
    expect(optionFor("twist", 0, choices)).toBe(
      scenario.twists[1 % scenario.twists.length],
    );
  });

  it("builds a concrete product result with its research proof and next action", () => {
    const selection = selectionFor();
    const result = buildIdeaResult(selection);

    expect(result.parts.map((part) => part.value)).toEqual([
      selection.source.sourceName,
      selection.payer.value,
      selection.moment.value,
      selection.twist.resultTitle,
    ]);
    expect(result.text).toContain(" × ");
    expect(result.title).toBe(selection.twist.resultTitle);
    expect(result.hero).toEqual(buildResultHeroCopy(selection));
    expect(result.summary).toContain(selection.payer.value);
    expect(result.summary).toContain(selection.moment.value);
    expect(result.hook).toMatch(/\?["”]?$/u);
    expect(result.hook).toBe(
      AUTHORED_HERO_COPY[selection.source.id].hooks[selection.moment.id],
    );
    expect(result.hook).toContain("가짜 연락처");
    expect(result.hook).not.toContain("당신은 지금 바로");
    expect(result.hero.before).toMatch(/니다\.$/u);
    expect(result.hero.before).not.toContain("DB");
    expect(auditResultHeroCopy(selection)).toEqual({ ok: true, issues: [] });
    expect(result.uvp).toBe(selection.twist.smallestBuild);
    expect(result.solution).toBe(selection.twist.smallestBuild);
    expect(result.sourceProof).toContain(selection.source.evidence);
    expect(result.sourceComparison).toContain(selection.source.value);
    expect(result.difference).toBe(selection.twist.detail);
    expect(result.flowSteps.at(-1)).toBe(selection.twist.resultTitle);
    expect(result.problem).toContain(selection.moment.detail);
    expect(result.target).toContain(selection.payer.detail);
    expect(result.firstAction).toBe(selection.twist.smallestBuild);
    expect(result.combinationId).toBe([
      selection.source.id,
      selection.payer.id,
      selection.moment.id,
      selection.twist.id,
    ].join(":"));
  });

  it("keeps the authored taste-pin hook and concrete before-after story intact", () => {
    const scenario = IDEA_LAB_SCENARIOS.find((item) => item.id === "video-place-route")!;
    const hero = buildResultHeroCopy({
      source: scenario.source,
      payer: scenario.payers.find((item) => item.id === "payer-food-video-saver")!,
      moment: scenario.moments.find((item) => item.id === "moment-saved-food-reels-night")!,
      twist: scenario.twists.find((item) => item.id === "twist-food-short-link")!,
    });

    expect(hero.painQuestion).toBe(
      "“저장한 맛집 릴스 200개, 지금 몇 개나 찾아갈 수 있나요?”",
    );
    expect(hero.tagline).toBe("저장한 맛집 영상을 진짜 가는 지도로");
    expect(hero.before).toBe("저장은 3초인데 다시 찾는 건 20분");
    expect(hero.after).toBe(
      "영상 링크 하나 붙여넣으면 상호·메뉴·위치를 뽑아 당신의 지도에 핀으로 꽂아줍니다. 정리 0분.",
    );
  });

  it("builds a six-block brief plus two independent copy-ready prompts", () => {
    const selection = selectionFor();
    const prompt = buildPrompt(selection);
    const developmentPrompt = buildDevelopmentInitPrompt(selection);
    const imagePrompt = buildImagePrompt(selection);

    expect(prompt).toContain(`[${selection.twist.resultTitle}]`);
    expect(prompt).toContain(`원본이 이미 증명한 것: ${selection.source.sourceName}`);
    expect(prompt).toContain(selection.source.preservedFlow);
    expect(prompt).toContain(selection.twist.smallestBuild);
    expect(prompt).toContain("5) AI 코딩 도구에 붙여넣는 제작 프롬프트");
    expect(prompt).toContain("6) 이미지 생성 프롬프트");
    expect(prompt).toContain("입력 1개 → 처리 1회 → 결과 1개");
    expect(prompt).toContain(developmentPrompt);
    expect(prompt).toContain(imagePrompt);

    expect(developmentPrompt).toContain("# ");
    expect(developmentPrompt).toContain("## 제품 정의");
    expect(developmentPrompt).toContain("## 하드 게이트");
    expect(developmentPrompt).toContain("성공·빈 상태·처리 실패 상태");
    expect(developmentPrompt).toContain("가짜 사용자 반응");
    expect(developmentPrompt).toContain("## 완료 조건");

    expect(imagePrompt).toContain("DESIGN SYSTEM");
    expect(imagePrompt).toContain("Screen 1");
    expect(imagePrompt).toContain("Screen 5");
    expect(imagePrompt).toContain(selection.twist.resultTitle);
  });

  it("gives all 2,700 combinations a mechanism-based claim and natural payment hypothesis", () => {
    let audited = 0;
    const claims = new Set<string>();
    const heroCopies = new Set<string>();
    const questions = new Set<string>();
    const beforeCopies = new Set<string>();
    const afterCopies = new Set<string>();
    const heroIssues: string[] = [];
    for (const scenario of IDEA_LAB_SCENARIOS) {
      for (const payer of scenario.payers) {
        for (const moment of scenario.moments) {
          for (const twist of scenario.twists) {
            const selection = { source: scenario.source, payer, moment, twist };
            const audit = auditIdeaSelection(selection);
            const claim = buildUniqueClaim(selection);
            const result = buildIdeaResult(selection);
            const hero = buildResultHeroCopy(selection);
            const heroAudit = auditResultHeroCopy(selection, hero);
            expect(audit.ok, `${scenario.id}: ${audit.issues.join(" ")}`).toBe(true);
            expect(claim).toContain(payer.value);
            expect(claim).toContain(twist.value);
            expect(claim).toContain(twist.resultTitle);
            expect(result.paymentHypothesis).not.toMatch(/직장인가|대학생가|개발자가가/);
            expect(hero.painQuestion).toContain("?");
            expect(hero.before).toBeTruthy();
            expect(hero.after).toBeTruthy();
            if (!heroAudit.ok) {
              heroIssues.push(`${scenario.id}: ${heroAudit.issues.join(" ")}`);
            }
            expect([
              hero.name,
              hero.painQuestion,
              hero.before,
              hero.after,
            ].join("\n")).not.toMatch(
              /당신은 지금 바로|이 결과를 바로 사용합니다|입력 하나로 결과 하나|구체적인 입력:|즉시 결과:|야 하나요|필요한가요|싶은가요|싶나요|유효성|허용 여부|—|–|…|\.\.\./u,
            );
            claims.add(claim);
            questions.add(hero.painQuestion);
            beforeCopies.add(hero.before);
            afterCopies.add(hero.after);
            heroCopies.add([
              hero.name,
              hero.painQuestion,
              hero.before,
              hero.after,
            ].join("\n"));
            audited += 1;
          }
        }
      }
    }
    expect(audited).toBe(2_700);
    expect(heroIssues).toEqual([]);
    expect(claims.size).toBe(2_700);
    expect(questions.size).toBe(300);
    expect(beforeCopies.size).toBe(300);
    expect(afterCopies.size).toBe(300);
    expect(heroCopies.size).toBe(2_700);
  });

  it("keeps Hook, Before, and After MECE when one axis changes", () => {
    for (const scenario of IDEA_LAB_SCENARIOS) {
      if (scenario.id === "video-place-route") continue;

      const base = buildResultHeroCopy({
        source: scenario.source,
        payer: scenario.payers[0],
        moment: scenario.moments[0],
        twist: scenario.twists[0],
      });
      const payerChanged = buildResultHeroCopy({
        source: scenario.source,
        payer: scenario.payers[1],
        moment: scenario.moments[0],
        twist: scenario.twists[0],
      });
      const momentChanged = buildResultHeroCopy({
        source: scenario.source,
        payer: scenario.payers[0],
        moment: scenario.moments[1],
        twist: scenario.twists[0],
      });
      const twistChanged = buildResultHeroCopy({
        source: scenario.source,
        payer: scenario.payers[0],
        moment: scenario.moments[0],
        twist: scenario.twists[1],
      });

      expect(payerChanged.painQuestion, `${scenario.id} payer hook`).toBe(base.painQuestion);
      expect(payerChanged.before, `${scenario.id} payer before`).not.toBe(base.before);
      expect(payerChanged.after, `${scenario.id} payer after`).toBe(base.after);

      expect(momentChanged.painQuestion, `${scenario.id} moment hook`).not.toBe(base.painQuestion);
      expect(momentChanged.before, `${scenario.id} moment before`).toBe(base.before);
      expect(momentChanged.after, `${scenario.id} moment after`).toBe(base.after);

      expect(twistChanged.painQuestion, `${scenario.id} twist hook`).toBe(base.painQuestion);
      expect(twistChanged.before, `${scenario.id} twist before`).toBe(base.before);
      expect(twistChanged.after, `${scenario.id} twist after`).not.toBe(base.after);
    }
  });

  it("keeps the plain-language explanation tied to the selected cards", () => {
    const selection = selectionFor();
    const explanation = buildPlainExplain(selection);

    expect(explanation).toContain(selection.source.sourceName);
    expect(explanation).toContain(selection.payer.value);
    expect(explanation).toContain(selection.moment.value);
    expect(explanation).toContain(selection.twist.smallestBuild);
  });
});
