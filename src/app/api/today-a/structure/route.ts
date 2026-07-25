import { NextResponse } from "next/server";
import { z } from "zod";
import sourceCards from "../../../../../public/data/source-cards.json";
import {
  todayAStructureRequestSchema,
  type TodayAStructureRequest,
  type TodayAStructureResponse,
} from "@/lib/today-a-contract";

const sourceCardSchema = z.object({
  seed: z.string(),
  title: z.string(),
  oneliner: z.string(),
  target: z.string(),
  evidence: z.string(),
  anchorName: z.string(),
  sourceUrl: z.string().url(),
  todayAction: z.string(),
  audiences: z.array(z.enum(["b2b", "b2c"])),
  platforms: z.array(z.enum(["web", "app", "plugin"])),
  productTypes: z.array(z.enum(["ai-agent", "analyzer", "automation", "dashboard", "utility"])),
  mechanism: z.object({
    input: z.string(),
    process: z.string(),
    output: z.string(),
  }),
  frontStory: z.object({
    timeline: z.array(z.object({
      t: z.string(),
      pain: z.boolean(),
    })).min(1),
  }),
});

const catalog = z.array(sourceCardSchema).parse(sourceCards);

const strengthTypes: Record<TodayAStructureRequest["strength"], string[]> = {
  content: ["utility", "analyzer"],
  sales: ["automation", "ai-agent"],
  operations: ["dashboard", "automation"],
  development: ["utility", "analyzer", "plugin"],
};

const customerAudience: Record<TodayAStructureRequest["customer"], "b2b" | "b2c"> = {
  individual: "b2c",
  small_business: "b2b",
  team: "b2b",
};

const customerLabel: Record<TodayAStructureRequest["customer"], string> = {
  individual: "개인 고객",
  small_business: "소규모 사업자",
  team: "팀",
};

const strengthLabel: Record<TodayAStructureRequest["strength"], string> = {
  content: "콘텐츠",
  sales: "영업",
  operations: "운영",
  development: "개발",
};

const timeLabel: Record<TodayAStructureRequest["weeklyTime"], string> = {
  two_hours: "주 2시간",
  half_day: "주 반나절",
  one_day: "주 하루",
};

function problemTokens(problem: string): string[] {
  return problem
    .toLowerCase()
    .split(/[\s,.!?/·()[\]{}"'“”‘’:;-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 12);
}

function selectCard(input: TodayAStructureRequest) {
  const audience = customerAudience[input.customer];
  const preferredTypes = strengthTypes[input.strength];
  const tokens = problemTokens(input.problem);

  return catalog
    .map((card, index) => {
      const searchable = `${card.title} ${card.oneliner} ${card.target} ${card.todayAction}`.toLowerCase();
      const tokenScore = tokens.reduce(
        (score, token) => score + (searchable.includes(token) ? 3 : 0),
        0,
      );
      const audienceScore = card.audiences.includes(audience) ? 8 : 0;
      const typeScore = card.productTypes.reduce(
        (score, type) => score + (preferredTypes.includes(type) ? 2 : 0),
        0,
      );
      return { card, index, score: audienceScore + typeScore + tokenScore };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)[0].card;
}

function firstOfferForTime(
  card: (typeof catalog)[number],
  weeklyTime: TodayAStructureRequest["weeklyTime"],
): string {
  const sampleCount = weeklyTime === "two_hours" ? "1건" : weeklyTime === "half_day" ? "3건" : "5건";
  return `${card.mechanism.input} 샘플 ${sampleCount}을 받아 “${card.mechanism.output}” 예시를 직접 만들어 한 사람에게 보여주세요. 자동화나 완성 제품은 아직 만들지 않습니다.`;
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }

  const parsed = todayAStructureRequestSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  const input = parsed.data;
  const card = selectCard(input);
  const needMoment = card.frontStory.timeline.find((item) => item.pain)?.t
    ?? card.frontStory.timeline[0].t;

  const response: TodayAStructureResponse = {
    mode: "catalog_snapshot",
    result: {
      id: card.seed,
      title: card.title,
      summary: card.oneliner,
      fitReason: `${customerLabel[input.customer]}을 대상으로, ${strengthLabel[input.strength]} 강점을 ${timeLabel[input.weeklyTime]} 안에서 시험하기 쉬운 원본 구조를 골랐어요.`,
      structure: {
        payer: card.target,
        needMoment,
        input: card.mechanism.input,
        process: card.mechanism.process,
        output: card.mechanism.output,
        firstOffer: firstOfferForTime(card, input.weeklyTime),
      },
      evidence: {
        sourceName: card.anchorName,
        sourceUrl: card.sourceUrl,
        statement: card.evidence,
        snapshotNotice: "앱에 저장된 감사 통과 원본 스냅샷입니다. 현재 수치나 성과를 실시간으로 확인한 결과는 아닙니다.",
      },
    },
  };

  return noStoreJson(response);
}
