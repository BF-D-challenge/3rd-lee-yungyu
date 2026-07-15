#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cards = fs.readFileSync(
  path.join(root, "docs/research/idea-strong-mechanism-batch-006-card-drafts-2026-07-15.jsonl"),
  "utf8",
).split(/\r?\n/).filter(Boolean).map(JSON.parse);
const card = cards.find((row) => row.source_key === "trustmrr:docswrite");
if (!card) throw new Error("Docswrite card not found");

const slug = "doc-to-cms";
const axis = (name, item, index) => ({
  id: `${name}-${slug}-${index + 1}`,
  value: item.value,
  detail: item.detail,
});
const candidate = {
  id: "doc-to-cms-draft",
  source: {
    id: "source-doc-to-cms-draft",
    sourceName: card.name,
    research: { key: card.source_key, url: card.url },
    platform: "web",
    value: "Google Doc 원고를 제목·이미지 캡션·표가 깨지지 않는 CMS 게시 초안으로 바꾸는 도구",
    detail: "공개 Google Doc URL 하나를 입력하면 문서를 한 번 읽어 서식을 보존한 Gutenberg HTML 파일 한 개로 변환합니다.",
    evidence: "TrustMRR에서 최근 30일 매출 1,200달러가 확인되고 Google Doc을 WordPress·Contentful 등 CMS로 서식 손실 없이 옮기는 기능이 명시된 제품",
    preservedFlow: "공개 Google Doc URL 입력 → 문서 서식 보존 변환 → CMS에 붙여 넣을 Gutenberg HTML 파일",
  },
  payers: card.card_draft.payers.map((item, index) => axis("payer", item, index)),
  moments: card.card_draft.moments.map((item, index) => axis("moment", item, index)),
  twists: card.card_draft.twists.map((item, index) => ({
    id: `twist-${slug}-${index + 1}`,
    kind: index === 0 ? "replace" : "add",
    value: item.value,
    detail: item.detail,
    resultTitle: item.resultTitle,
    platform: "web",
    smallestBuild: item.smallestBuild,
  })),
};

const output = "docs/research/idea-strong-mechanism-batch-006-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify([candidate], null, 2) + "\n");
console.log(JSON.stringify({ candidates: 1, output }, null, 2));
