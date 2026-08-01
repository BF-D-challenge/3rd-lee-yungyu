import { z } from "zod";

export const todayIdeaPathSchema = z.enum(["existing", "guided"]);
export const todayCustomerSchema = z.enum(["solo_business", "team", "consumer"]);
export const todayMomentSchema = z.enum(["repetitive_work", "missed_sales", "scattered_info"]);
export const todayStrengthSchema = z.enum(["organize", "talk", "build"]);
export const todayChannelSchema = z.enum(["instagram", "community", "direct"]);
export const todaySignalSchema = z.enum(["waitlist", "interview", "deposit"]);

export const todayIdeaRequestSchema = z.object({
  path: todayIdeaPathSchema,
  idea: z.string().trim().max(500).optional().default(""),
  answers: z.object({
    customer: todayCustomerSchema,
    moment: todayMomentSchema,
    strength: todayStrengthSchema,
  }).optional(),
}).superRefine((value, ctx) => {
  if (value.path === "existing" && value.idea.trim().length < 12) {
    ctx.addIssue({
      code: "custom",
      path: ["idea"],
      message: "아이디어를 12자 이상 적어주세요.",
    });
  }
  if (value.path === "guided" && !value.answers) {
    ctx.addIssue({
      code: "custom",
      path: ["answers"],
      message: "세 가지 선택이 필요합니다.",
    });
  }
});

export const todayIdeaResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  oneLiner: z.string(),
  customer: z.string(),
  problem: z.string(),
  promise: z.string(),
  mechanism: z.object({
    input: z.string(),
    process: z.string(),
    output: z.string(),
  }),
  adaptation: z.string(),
  evidence: z.object({
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    statement: z.string(),
    preserved: z.array(z.string()).min(1),
    snapshotNotice: z.string(),
  }),
  productionScope: z.object({
    adConcept: z.string(),
    landingSections: z.array(z.string()).min(3),
    suggestedSignal: todaySignalSchema,
  }),
});

export const todayIdeaResponseSchema = z.object({
  mode: z.enum(["gemini_research", "catalog_snapshot"]),
  result: todayIdeaResultSchema,
  notice: z.string(),
});

export const todayApplicationRequestSchema = z.object({
  idea: todayIdeaResultSchema,
  email: z.string().trim().email(),
  channel: todayChannelSchema,
  signal: todaySignalSchema,
});

export const todayArtifactsSchema = z.object({
  ad: z.object({
    headline: z.string(),
    body: z.string(),
    cta: z.string(),
    visualLabel: z.string(),
  }),
  landing: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    cta: z.string(),
    proof: z.array(z.string()).length(3),
  }),
  testPlan: z.object({
    channel: z.string(),
    signal: z.string(),
    target: z.number().int().positive(),
    pass: z.number().int().positive(),
    rule: z.string(),
  }),
});

export type TodayArtifacts = z.infer<typeof todayArtifactsSchema>;

export const todayApplicationSchema = z.object({
  id: z.string(),
  submittedAt: z.string().datetime(),
  readyAt: z.string().datetime(),
  status: z.enum(["queued", "processing", "ready", "delivery_failed", "failed", "cancelled"]),
  maskedEmail: z.string(),
  idea: todayIdeaResultSchema,
  channel: todayChannelSchema,
  signal: todaySignalSchema,
  artifacts: todayArtifactsSchema.nullable(),
  emailedAt: z.string().datetime().nullable(),
  attemptCount: z.number().int().nonnegative(),
  notice: z.string(),
});

export const todayApplicationResponseSchema = z.object({
  mode: z.literal("server_queue"),
  job: todayApplicationSchema,
  accessToken: z.string().min(24),
});

export const todayApplicationStatusResponseSchema = z.object({
  mode: z.literal("server_queue"),
  job: todayApplicationSchema,
});

export const todayJobLocatorSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(24),
});

export type TodayIdeaRequest = z.infer<typeof todayIdeaRequestSchema>;
export type TodayIdeaResult = z.infer<typeof todayIdeaResultSchema>;
export type TodayIdeaResponse = z.infer<typeof todayIdeaResponseSchema>;
export type TodayApplication = z.infer<typeof todayApplicationSchema>;
export type TodayApplicationRequest = z.infer<typeof todayApplicationRequestSchema>;
export type TodayChannel = z.infer<typeof todayChannelSchema>;
export type TodaySignal = z.infer<typeof todaySignalSchema>;
export type TodayJobLocator = z.infer<typeof todayJobLocatorSchema>;
