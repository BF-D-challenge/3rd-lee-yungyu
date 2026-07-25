import { z } from "zod";

export const todayACustomerSchema = z.enum(["individual", "small_business", "team"]);
export const todayAStrengthSchema = z.enum(["content", "sales", "operations", "development"]);
export const todayATimeSchema = z.enum(["two_hours", "half_day", "one_day"]);

export const todayAStructureRequestSchema = z.object({
  customer: todayACustomerSchema,
  strength: todayAStrengthSchema,
  weeklyTime: todayATimeSchema,
  problem: z.string().trim().min(8).max(240),
});

export const todayAStructureResponseSchema = z.object({
  mode: z.literal("catalog_snapshot"),
  result: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    fitReason: z.string(),
    structure: z.object({
      payer: z.string(),
      needMoment: z.string(),
      input: z.string(),
      process: z.string(),
      output: z.string(),
      firstOffer: z.string(),
    }),
    evidence: z.object({
      sourceName: z.string(),
      sourceUrl: z.string().url(),
      statement: z.string(),
      snapshotNotice: z.string(),
    }),
  }),
});

export type TodayAStructureRequest = z.infer<typeof todayAStructureRequestSchema>;
export type TodayAStructureResponse = z.infer<typeof todayAStructureResponseSchema>;
