import { describe, expect, it } from "vitest";
import { IDEA_LAB_SCENARIOS } from "@/components/organisms/idea-lab/sample-data";
import {
  EMPTY_IDEA_TASTE_PROFILE,
  IDEA_TASTE_QUESTIONS,
  IDEA_TASTE_TRAITS,
  ideaTasteProfileFromAnswers,
  makeIdeaTasteAnswer,
  nextIdeaTasteQuestion,
  recommendIdeaForTaste,
  recordIdeaTasteAnswer,
  scoreScenarioForTaste,
} from "@/lib/idea-taste";

describe("Idea Lab one-question taste model", () => {
  it("asks abstract questions without exposing an idea candidate", () => {
    expect(IDEA_TASTE_QUESTIONS).toHaveLength(4);
    for (const question of IDEA_TASTE_QUESTIONS) {
      expect(question.choices).toHaveLength(3);
      expect(question.choices.filter((choice) => choice.trait === null)).toHaveLength(1);
    }

    const surveyCopy = JSON.stringify(IDEA_TASTE_QUESTIONS);
    for (const scenario of IDEA_LAB_SCENARIOS) {
      expect(surveyCopy).not.toContain(scenario.source.sourceName);
      expect(surveyCopy).not.toContain(scenario.source.id);
    }
  });

  it("rotates one least-asked dimension on each reroll", () => {
    let profile = EMPTY_IDEA_TASTE_PROFILE;
    expect(nextIdeaTasteQuestion(profile).id).toBe("audience");

    profile = recordIdeaTasteAnswer(profile, "audience", "personal");
    expect(nextIdeaTasteQuestion(profile).id).toBe("input");

    profile = recordIdeaTasteAnswer(profile, "input", "media");
    expect(nextIdeaTasteQuestion(profile).id).toBe("outcome");

    profile = recordIdeaTasteAnswer(profile, "outcome", "create");
    expect(nextIdeaTasteQuestion(profile).id).toBe("surface");

    profile = recordIdeaTasteAnswer(profile, "surface", "browser");
    expect(nextIdeaTasteQuestion(profile).id).toBe("audience");
  });

  it("rebuilds the same profile from remembered answer events", () => {
    const answers = [
      makeIdeaTasteAnswer("audience", "personal", {
        id: "00000000-0000-4000-8000-000000000001",
        createdAt: "2026-07-18T00:00:00.000Z",
      }),
      makeIdeaTasteAnswer("input", "media", {
        id: "00000000-0000-4000-8000-000000000002",
        createdAt: "2026-07-18T00:01:00.000Z",
      }),
      makeIdeaTasteAnswer("outcome", "either", {
        id: "00000000-0000-4000-8000-000000000003",
        createdAt: "2026-07-18T00:02:00.000Z",
      }),
    ].filter((answer) => answer !== null);

    expect(ideaTasteProfileFromAnswers(answers)).toEqual({
      traitScores: {
        "audience:personal": 1,
        "input:media": 1,
      },
      questionCounts: {
        audience: 1,
        input: 1,
        outcome: 1,
      },
      answerCount: 3,
    });
  });

  it("chooses the best-scoring unseen source and avoids catalog-order ties", () => {
    const profile = recordIdeaTasteAnswer(
      recordIdeaTasteAnswer(EMPTY_IDEA_TASTE_PROFILE, "input", "media"),
      "outcome",
      "create",
    );
    const seen = new Set(IDEA_LAB_SCENARIOS.slice(0, 8).map((scenario) => scenario.id));
    const recommendation = recommendIdeaForTaste(
      IDEA_LAB_SCENARIOS,
      profile,
      seen,
      0,
      0.42,
    );
    const candidateScores = IDEA_LAB_SCENARIOS
      .filter((scenario) => !seen.has(scenario.id))
      .map((scenario) => scoreScenarioForTaste(scenario, profile));

    expect(seen.has(IDEA_LAB_SCENARIOS[recommendation.scenarioIndex].id)).toBe(false);
    expect(scoreScenarioForTaste(
      IDEA_LAB_SCENARIOS[recommendation.scenarioIndex],
      profile,
    )).toBe(Math.max(...candidateScores));

    const tiedRecommendation = recommendIdeaForTaste(
      IDEA_LAB_SCENARIOS,
      EMPTY_IDEA_TASTE_PROFILE,
      [],
      0,
      0.999,
    );
    expect(tiedRecommendation.scenarioIndex).toBe(IDEA_LAB_SCENARIOS.length - 1);
  });

  it("gives every abstract trait a non-flat recommendation signal", () => {
    for (const trait of IDEA_TASTE_TRAITS) {
      const profile = {
        traitScores: { [trait]: 1 },
        questionCounts: {},
        answerCount: 1,
      };
      const scores = IDEA_LAB_SCENARIOS.map((scenario) =>
        scoreScenarioForTaste(scenario, profile));
      expect(Math.max(...scores), trait).toBeGreaterThan(0);
      expect(Math.max(...scores), trait).toBeGreaterThan(Math.min(...scores));
    }
  });
});
