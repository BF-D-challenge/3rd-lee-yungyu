import { z } from "zod";
import sourceCards from "../../public/data/source-cards.json";
import type { TodayIdeaRequest } from "@/lib/today-contract";

const sourceCardSchema = z.object({
  seed: z.string(),
  title: z.string(),
  oneliner: z.string(),
  target: z.string(),
  evidence: z.string(),
  anchorName: z.string(),
  sourceUrl: z.string().url(),
  adaptationChange: z.string(),
  audiences: z.array(z.enum(["b2b", "b2c"])),
  productTypes: z.array(z.string()),
  sourcePreserved: z.array(z.string()),
  mechanism: z.object({
    input: z.string(),
    process: z.string(),
    output: z.string(),
  }),
  frontStory: z.object({
    timeline: z.array(z.object({
      t: z.string(),
      act: z.string(),
      pain: z.boolean(),
    })).min(1),
  }),
});

const catalog = z.array(sourceCardSchema).parse(sourceCards);

function expandForMatch(value: string) {
  return value.toLowerCase()
    .replaceAll("인스타그램", " instagram ")
    .replaceAll("릴스", " instagram 영상 ")
    .replaceAll("맛집", " 식당 음식 카페 장소 ")
    .replaceAll("지도", " 장소 위치 지도 ")
    .replaceAll("저장", " 보관 기록 저장 ")
    .replaceAll("영상", " 영상 숏폼 비디오 ");
}

function tokens(value: string) {
  return expandForMatch(value).split(/[\s,.!?/·()[\]{}"'“”‘’:;-]+/)
    .filter((token) => token.length >= 2)
    .slice(0, 24);
}

function pickCard(input: TodayIdeaRequest) {
  const query = input.path === "existing"
    ? input.idea
    : `${input.answers?.customer} ${input.answers?.moment} ${input.answers?.strength}`;
  const audience = input.answers?.customer === "consumer" ? "b2c" : "b2b";
  const typeByStrength = {
    organize: ["dashboard", "automation"],
    talk: ["ai-agent", "automation"],
    build: ["utility", "analyzer", "plugin"],
  } as const;
  const preferred = input.answers ? typeByStrength[input.answers.strength] : [];
  return catalog.map((card, index) => {
    const searchable = expandForMatch([
      card.title,
      card.oneliner,
      card.target,
      card.mechanism.input,
      card.mechanism.process,
      card.mechanism.output,
      ...card.frontStory.timeline.map((item) => `${item.t} ${item.act}`),
    ].join(" "));
    const textScore = tokens(query).reduce((sum, token) => sum + (searchable.includes(token) ? 3 : 0), 0);
    const audienceScore = card.audiences.includes(audience) ? 5 : 0;
    const typeScore = card.productTypes.some((type) => preferred.includes(type as never)) ? 4 : 0;
    return { card, index, score: textScore + audienceScore + typeScore };
  }).sort((a, b) => b.score - a.score || a.index - b.index)[0].card;
}

const customerLabels = {
  solo_business: "혼자 또는 작은 팀으로 일하는 사업자",
  team: "반복 업무를 함께 처리하는 팀",
  consumer: "일상에서 직접 불편을 겪는 개인",
};
const momentLabels = {
  repetitive_work: "같은 일을 다시 처리하는 순간",
  missed_sales: "답변이 늦어 고객을 놓치는 순간",
  scattered_info: "저장한 정보를 다시 찾지 못하는 순간",
};

export function buildCatalogTodayIdea(input: TodayIdeaRequest) {
  const card = pickCard(input);
  const painMoment = card.frontStory.timeline.find((item) => item.pain) ?? card.frontStory.timeline[0];
  const existingPrefix = input.path === "existing" ? `입력한 아이디어 “${input.idea.trim()}”를 ` : "";
  const customer = input.answers ? customerLabels[input.answers.customer] : card.target;
  const problem = input.answers ? momentLabels[input.answers.moment] : painMoment.act;
  const title = input.path === "existing" ? card.title : `${card.mechanism.output.split(/[,.]/)[0]} 도우미`;
  return {
    id: card.seed,
    title,
    oneLiner: `${existingPrefix}${card.anchorName}의 검증된 입력→처리→결과 구조에 맞춰, ${customer}용 작은 제안으로 좁혔어요.`,
    customer,
    problem,
    promise: card.mechanism.output,
    mechanism: card.mechanism,
    adaptation: input.path === "existing"
      ? `원래 아이디어의 대상과 결과를 구체화하고, ${card.anchorName}의 작동 구조만 가져왔습니다.`
      : `${card.adaptationChange} 여기에 선택한 고객과 문제 순간을 다시 적용했습니다.`,
    evidence: {
      sourceName: card.anchorName,
      sourceUrl: card.sourceUrl,
      statement: card.evidence,
      preserved: card.sourcePreserved,
      snapshotNotice: "저장된 매출 원본 스냅샷을 사용했습니다. 현재 매출이나 성공 가능성을 실시간으로 보증하지 않습니다.",
    },
    productionScope: {
      adConcept: `${problem} 전후를 한 장에 대비하고 “${card.mechanism.output}”을 행동 문구로 사용합니다.`,
      landingSections: ["고객이 겪는 순간", "받게 될 결과", "신청 행동 하나"],
      suggestedSignal: "waitlist" as const,
    },
  };
}
