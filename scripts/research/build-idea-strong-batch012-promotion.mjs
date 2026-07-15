#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const fullSummary = path.join(root, "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-012-full-summary-2026-07-15.md");
if (!fs.existsSync(fullSummary)) throw new Error("Full-27 report must exist before promotion output");
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-012-full-card-drafts-2026-07-15.jsonl");
const full = readJsonl("docs/research/idea-strong-mechanism-batch-012-full-results-2026-07-15.jsonl");
const definitions = {
  "app_store:6752672420": {
    id: "fits-sky-locator",
    slug: "fits-sky-locator",
    sourceValue: "FITS 천체 사진 한 장을 분석해 어느 하늘을 찍었는지 좌표·촬영 영역·주요 천체가 표시된 차트로 놓는 도구",
    sourceDetail: "FITS 파일 하나를 입력하면 별 패턴을 한 번 플레이트 솔빙하고 촬영 중심과 영역이 표시된 하늘 차트 한 개를 즉시 만듭니다.",
    evidence: "App Store 원본은 FITS·로컬·URL 천체 이미지를 가져와 플레이트 솔빙한 뒤 하늘 차트에 직접 배치한다고 명시하고, 수집 시점 호주 레퍼런스 카테고리 4위가 확인됩니다.",
    preservedFlow: "FITS 천체 이미지 입력 → 별 패턴 플레이트 솔빙 → 좌표가 표시된 하늘 차트",
  },
};

const candidates = [];
for (const [sourceKey, definition] of Object.entries(definitions)) {
  const results = full.filter((row) => row.source_key === sourceKey);
  if (results.length !== 27 || results.some((row) => row.audit.status !== "pass")) {
    throw new Error(`${sourceKey}: expected Full-27 27/27 pass`);
  }
  const card = cards.find((row) => row.source_key === sourceKey);
  if (!card) throw new Error(`Missing card: ${sourceKey}`);
  const axis = (name, item, index) => ({
    id: `${name}-${definition.slug}-${index + 1}`,
    value: item.value,
    detail: item.detail,
  });
  candidates.push({
    id: definition.id,
    source: {
      id: `source-${definition.id}`,
      sourceName: card.name,
      research: { key: card.source_key, url: card.url },
      platform: "app",
      value: definition.sourceValue,
      detail: definition.sourceDetail,
      evidence: definition.evidence,
      preservedFlow: definition.preservedFlow,
    },
    payers: card.card_draft.payers.map((item, index) => axis("payer", item, index)),
    moments: card.card_draft.moments.map((item, index) => axis("moment", item, index)),
    twists: card.card_draft.twists.map((item, index) => ({
      id: `twist-${definition.slug}-${index + 1}`,
      kind: index === 0 ? "replace" : "add",
      value: item.value,
      detail: item.detail,
      resultTitle: item.resultTitle,
      platform: "app",
      smallestBuild: item.smallestBuild,
    })),
  });
}

const output = "docs/research/idea-strong-mechanism-batch-012-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((row) => row.id), output }, null, 2));
