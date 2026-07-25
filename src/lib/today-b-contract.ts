import { z } from "zod";

export const todayBChannelSchema = z.enum(["community", "direct", "audience", "offline"]);
export const todayBSignalSchema = z.enum(["conversation", "waitlist", "deposit", "preorder"]);

export const todayBExperimentRequestSchema = z.object({
  idea: z.string().trim().min(8).max(240),
  customer: z.string().trim().min(4).max(120),
  promise: z.string().trim().min(6).max(180),
  channel: todayBChannelSchema,
  signal: todayBSignalSchema,
});

export const todayBExperimentResponseSchema = z.object({
  mode: z.literal("rule_based_mock"),
  planId: z.string(),
  risk: z.object({
    label: z.string(),
    assumption: z.string(),
    reason: z.string(),
  }),
  experiment: z.object({
    hypothesis: z.string(),
    offer: z.string(),
    targetCount: z.number().int().positive(),
    passCount: z.number().int().positive(),
    passSignal: z.string(),
    days: z.array(z.object({
      day: z.number().int().min(1).max(7),
      title: z.string(),
      action: z.string(),
      evidenceToKeep: z.string(),
    })).length(7),
    decisionRule: z.object({
      continue: z.string(),
      revise: z.string(),
      stop: z.string(),
    }),
  }),
  notice: z.string(),
});

export type TodayBExperimentRequest = z.infer<typeof todayBExperimentRequestSchema>;
export type TodayBExperimentResponse = z.infer<typeof todayBExperimentResponseSchema>;
