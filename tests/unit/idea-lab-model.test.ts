import { describe, expect, it } from "vitest";
import {
  buildIdeaResult,
  buildPlainExplain,
  buildPrompt,
  initialScenarioIndex,
  nextScenarioIndex,
  optionFor,
  type ChoiceIndexes,
} from "@/components/organisms/idea-lab/model";
import { IDEA_LAB_SCENARIOS } from "@/components/organisms/idea-lab/sample-data";
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
  it("ships 100 audited sources and exactly 2,700 runtime combinations", () => {
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
  });

  it("finds the requested initial scenario and falls back to the first scenario", () => {
    expect(initialScenarioIndex(IDEA_LAB_SCENARIOS[2].id)).toBe(2);
    expect(initialScenarioIndex("missing-scenario")).toBe(0);
    expect(initialScenarioIndex()).toBe(0);
  });

  it("prioritizes an unseen audited source and avoids the current source after a full cycle", () => {
    const allButLast = IDEA_LAB_SCENARIOS.slice(0, -1).map((scenario) => scenario.id);
    expect(nextScenarioIndex(allButLast, 0, 0.5)).toBe(IDEA_LAB_SCENARIOS.length - 1);

    const all = IDEA_LAB_SCENARIOS.map((scenario) => scenario.id);
    expect(nextScenarioIndex(all, 0, 0)).toBe(1);
  });

  it("resolves the selected option for every axis", () => {
    const scenario = IDEA_LAB_SCENARIOS[0];

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
    expect(result.summary).toContain(selection.payer.value);
    expect(result.summary).toContain(selection.moment.value);
    expect(result.hook).toContain(selection.moment.detail);
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

  it("builds the same six-block prompt from the four selected cards", () => {
    const selection = selectionFor();
    const prompt = buildPrompt(selection);

    expect(prompt).toContain(`[${selection.twist.resultTitle}]`);
    expect(prompt).toContain(`원본: ${selection.source.sourceName}`);
    expect(prompt).toContain(selection.source.preservedFlow);
    expect(prompt).toContain(selection.twist.smallestBuild);
    expect(prompt).toContain("5) AI 코딩 도구 제작 지시");
    expect(prompt).toContain("6) 플로우 이미지 프롬프트");
    expect(prompt).toContain("입력 1개 → 처리 1회 → 결과 1개");
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
