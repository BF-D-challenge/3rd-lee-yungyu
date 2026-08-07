import { z } from "zod";

export const ONEBITE_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ONEBITE_SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const onebiteVisibleGroupSchema = z.enum([
  "starch",
  "protein",
  "vegetable",
  "drink",
  "dessert",
  "unknown",
]);

export const onebiteActionCodeSchema = z.enum([
  "add_vegetable",
  "add_protein",
  "choose_water",
  "keep_regular_meal",
  "retake_photo",
]);

export const onebiteConfidenceSchema = z.enum(["low", "medium", "high"]);

export const onebiteRiskFlagSchema = z.enum([
  "none",
  "uncertain",
  "not_food",
  "medical_or_ed",
]);

export const onebiteRoastLineSchema = z.string().trim().min(15).max(80);

export const onebiteAnalysisSchema = z.object({
  isMealPhoto: z.boolean(),
  visibleGroups: z.array(onebiteVisibleGroupSchema).max(6),
  visibleFoods: z.array(z.string().trim().min(1).max(30)).max(6),
  actionCode: onebiteActionCodeSchema,
  confidence: onebiteConfidenceSchema,
  riskFlag: onebiteRiskFlagSchema,
}).strict().superRefine((value, context) => {
  if (new Set(value.visibleGroups).size !== value.visibleGroups.length) {
    context.addIssue({
      code: "custom",
      message: "visibleGroups에는 중복 값을 넣을 수 없습니다.",
      path: ["visibleGroups"],
    });
  }

  if (new Set(value.visibleFoods).size !== value.visibleFoods.length) {
    context.addIssue({
      code: "custom",
      message: "visibleFoods에는 중복 값을 넣을 수 없습니다.",
      path: ["visibleFoods"],
    });
  }

  const needsRetake = !value.isMealPhoto
    || value.confidence === "low"
    || value.riskFlag !== "none";
  if (needsRetake && value.actionCode !== "retake_photo") {
    context.addIssue({
      code: "custom",
      message: "분석을 확정할 수 없는 결과는 사진 재촬영만 제안할 수 있습니다.",
      path: ["actionCode"],
    });
  }

  if (!value.isMealPhoto && value.riskFlag !== "not_food") {
    context.addIssue({
      code: "custom",
      message: "음식 사진이 아니면 not_food로 표시해야 합니다.",
      path: ["riskFlag"],
    });
  }

  if (
    value.isMealPhoto
    && value.confidence === "low"
    && value.riskFlag !== "uncertain"
  ) {
    context.addIssue({
      code: "custom",
      message: "낮은 확신도는 uncertain으로 표시해야 합니다.",
      path: ["riskFlag"],
    });
  }

  if (
    value.isMealPhoto
    && value.confidence !== "low"
    && value.riskFlag === "none"
    && value.visibleGroups.length === 0
  ) {
    context.addIssue({
      code: "custom",
      message: "확정된 음식 사진에는 보이는 음식 그룹이 하나 이상 필요합니다.",
      path: ["visibleGroups"],
    });
  }


  if (
    value.isMealPhoto
    && value.confidence !== "low"
    && value.riskFlag === "none"
    && value.visibleFoods.length === 0
  ) {
    context.addIssue({
      code: "custom",
      message: "확정된 음식 사진에는 확인한 음식 이름이 하나 이상 필요합니다.",
      path: ["visibleFoods"],
    });
  }

  if (
    value.isMealPhoto
    && value.confidence !== "low"
    && value.riskFlag === "none"
    && value.actionCode === "retake_photo"
  ) {
    context.addIssue({
      code: "custom",
      message: "확정된 음식 사진에는 실행 가능한 다음 행동이 필요합니다.",
      path: ["actionCode"],
    });
  }
});

export type OnebiteAnalysis = z.infer<typeof onebiteAnalysisSchema>;
export type OnebiteActionCode = z.infer<typeof onebiteActionCodeSchema>;

export const onebiteSuccessResponseSchema = z.object({
  mode: z.literal("live"),
  analysis: onebiteAnalysisSchema,
  roastLine: onebiteRoastLineSchema,
  actionLine: z.string().min(1),
}).strict();

export type OnebiteSuccessResponse = z.infer<
  typeof onebiteSuccessResponseSchema
>;

export const onebiteRejectedResponseSchema = z.object({
  error: z.enum(["not_food", "uncertain", "medical_or_ed"]),
  analysis: onebiteAnalysisSchema,
  actionLine: z.string().min(1),
}).strict();

export type OnebiteRejectedResponse = z.infer<
  typeof onebiteRejectedResponseSchema
>;

export const onebiteGeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    isMealPhoto: {
      type: "boolean",
      description: "한 끼 음식이 사진에서 충분히 보이면 true",
    },
    visibleGroups: {
      type: "array",
      maxItems: 6,
      uniqueItems: true,
      items: {
        type: "string",
        enum: [
          "starch",
          "protein",
          "vegetable",
          "drink",
          "dessert",
          "unknown",
        ],
      },
      description: "사진에서 직접 확인되는 음식 그룹만 포함",
    },
    visibleFoods: {
      type: "array",
      maxItems: 6,
      uniqueItems: true,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 30,
      },
      description: "사진에서 직접 확인되는 음식 이름만 짧은 한국어로 포함",
    },
    actionCode: {
      type: "string",
      enum: [
        "add_vegetable",
        "add_protein",
        "choose_water",
        "keep_regular_meal",
        "retake_photo",
      ],
      description: "사진에서 직접 확인한 그룹에 근거한 안전한 다음 행동 코드",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "사진이 음식 그룹을 구분하기에 충분한 정도",
    },
    riskFlag: {
      type: "string",
      enum: ["none", "uncertain", "not_food", "medical_or_ed"],
      description: "분석을 중단하고 안전 안내가 필요한지 나타내는 플래그",
    },
    roastLine: {
      type: "string",
      minLength: 15,
      maxLength: 80,
      description: "보이는 음식 이름을 넣어 선택만 황당하게 놀리는 웃긴 한국어 팩폭 한 문장",
    },
  },
  required: [
    "isMealPhoto",
    "visibleGroups",
    "visibleFoods",
    "actionCode",
    "confidence",
    "riskFlag",
    "roastLine",
  ],
} as const;
