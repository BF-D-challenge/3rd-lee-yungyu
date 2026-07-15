#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-011-latin-card-drafts-2026-07-15.jsonl");
const full = readJsonl("docs/research/idea-strong-mechanism-batch-011-full-results-2026-07-15.jsonl");

const definitions = {
  "trustmrr:pdf-translator": {
    id: "pdf-layout-translation",
    slug: "pdf-layout-translation",
    platform: "web",
    sourceValue: "영어 PDF 문서를 표·그림·각주 위치가 유지된 한국어 PDF 한 파일로 바꾸는 도구",
    sourceDetail: "영어 PDF 파일 하나를 입력하면 원본 레이아웃과 서식을 유지하면서 한국어로 번역해 수정 가능한 PDF 한 파일로 내보냅니다.",
    evidence: "TrustMRR에 원본 레이아웃과 서식을 보존하는 PDF 번역기이자 통합 편집기로 수집된 제품",
    preservedFlow: "영어 PDF 파일 입력 → 레이아웃 보존 한국어 번역 → 표·그림·각주가 유지된 번역 PDF 파일",
  },
  "trustmrr:docuaudit": {
    id: "freight-invoice-internal-audit",
    slug: "freight-invoice-audit",
    platform: "web",
    sourceValue: "화물 청구서 PDF 안의 합계 불일치·동일 비용 중복·필수 필드 누락을 감사 CSV로 바꾸는 도구",
    sourceDetail: "운송사 화물 청구서 PDF 파일 하나를 입력하면 문서 안의 비용 행과 필드를 검사해 확인 위치가 표시된 감사 CSV 한 파일로 내보냅니다.",
    evidence: "TrustMRR에 물류·재무팀이 복잡한 운송사 문서를 신뢰할 수 있고 감사 가능한 데이터로 바꾸는 화물 청구서 감사 플랫폼으로 수집된 제품",
    preservedFlow: "화물 청구서 PDF 입력 → 문서 내부 비용·필드 감사 → 확인 위치가 표시된 감사 CSV 파일",
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
      platform: definition.platform,
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
      platform: definition.platform,
      smallestBuild: item.smallestBuild,
    })),
  });
}

const output = "docs/research/idea-strong-mechanism-batch-011-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((item) => item.id), output }, null, 2));
