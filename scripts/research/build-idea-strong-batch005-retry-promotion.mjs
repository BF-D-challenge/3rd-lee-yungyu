#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cardsPath = path.join(
  root,
  "docs/research/idea-strong-mechanism-batch-005-retry-card-drafts-2026-07-15.jsonl",
);
const outputPath = path.join(
  root,
  "docs/research/idea-strong-mechanism-batch-005-retry-promotion-candidates-2026-07-15.json",
);

const cards = fs
  .readFileSync(cardsPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const definitions = {
  "trustmrr:mermaidonline-live": {
    id: "mermaid-diagram-export",
    slug: "mermaid-export",
    platform: "web",
    sourceValue: "Mermaid 코드 블록을 문서에 바로 붙일 PNG·SVG 다이어그램 한 장으로 렌더링하는 도구",
    sourceDetail: "Mermaid 문법 텍스트 하나를 입력하면 다이어그램을 렌더링하고 투명 PNG, 고해상도 PNG 또는 편집 가능한 SVG 한 개로 내보냅니다.",
    evidence: "TrustMRR에 실제 매출 신호와 함께 Mermaid.js 문법을 다이어그램·차트로 렌더링하는 웹 편집기로 수집된 제품",
    preservedFlow: "Mermaid 코드 블록 입력 → 다이어그램 렌더링 → 문서에 붙일 PNG 또는 SVG 한 장",
  },
  "app_store:6760979290": {
    id: "sketch-line-art",
    slug: "sketch-line-art",
    platform: "app",
    sourceValue: "손그림 사진 한 장에서 종이색·그림자·연필 얼룩을 지워 투명 선화 PNG로 만드는 도구",
    sourceDetail: "노트나 흰 종이에 그린 스케치 사진 한 장을 입력하면 페이지를 보정하고 배경과 얼룩을 제거해 투명 배경 선화 PNG 한 개로 내보냅니다.",
    evidence: "App Store에 스케치 사진의 페이지 보정, 종이색·그림자·번짐 제거와 투명 배경 선화 출력 기능이 명시된 제품",
    preservedFlow: "스케치 사진 한 장 입력 → 페이지·배경·얼룩 정리 → 투명 배경 선화 PNG 한 장",
  },
};

const candidates = cards.flatMap((card) => {
  const definition = definitions[card.source_key];
  if (!definition) return [];
  const makeAxis = (axis, item, index) => ({
    id: `${axis}-${definition.slug}-${index + 1}`,
    value: item.value,
    detail: item.detail,
  });
  return [{
    id: definition.id,
    source: {
      id: `source-${definition.id}`,
      sourceName: card.name,
      research: { key: card.source_key, url: card.url },
      platform: definition.platform,
      value: definition.sourceValue,
      detail: definition.sourceDetail,
      evidence: definition.evidence,
      preservedFlow: definition.preservedFlow,
    },
    payers: card.card_draft.payers.map((item, index) => makeAxis("payer", item, index)),
    moments: card.card_draft.moments.map((item, index) => makeAxis("moment", item, index)),
    twists: card.card_draft.twists.map((item, index) => ({
      id: `twist-${definition.slug}-${index + 1}`,
      kind: index === 0 ? "replace" : "add",
      value: item.value,
      detail: item.detail,
      resultTitle: item.resultTitle,
      platform: definition.platform,
      smallestBuild: item.smallestBuild,
    })),
  }];
});

fs.writeFileSync(outputPath, JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, output: path.relative(root, outputPath) }, null, 2));
