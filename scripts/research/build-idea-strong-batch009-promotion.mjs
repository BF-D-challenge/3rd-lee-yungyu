#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-009-full-card-drafts-2026-07-15.jsonl");
const full = readJsonl("docs/research/idea-strong-mechanism-batch-009-full-results-2026-07-15.jsonl");
const definitions = {
  "app_store:1494197457": {
    id: "scene-white-balance",
    slug: "scene-white-balance",
    sourceValue: "촬영 장면을 비추면 DSLR에 바로 넣을 색온도·화이트밸런스 값을 보여 주는 현장 촬영 도구",
    sourceDetail: "단일 카메라 권한으로 조명 장면을 한 번 분석해 Kelvin 수치 또는 보정 권장값이 담긴 결과 한 개를 즉시 제공합니다.",
    evidence: "App Store 원본은 내장 카메라로 실시간 장면을 분석해 Kelvin 색온도·보정값·측정 스냅샷을 제공한다고 명시하고, 수집 시점 검색 순위 94위가 확인됩니다.",
    preservedFlow: "촬영 장면 카메라 입력 → 색온도 한 번 분석 → Kelvin·화이트밸런스 결과",
  },
  "app_store:1520204499": {
    id: "raster-to-svg",
    slug: "raster-to-svg",
    sourceValue: "저해상도 JPG·PNG 로고를 확대·인쇄·커팅에 쓸 수 있는 SVG 한 파일로 바꾸는 도구",
    sourceDetail: "이미지 파일 하나를 입력하면 윤곽 옵션을 적용해 한 번 벡터 변환하고 바로 쓸 수 있는 SVG 파일 한 개를 만듭니다.",
    evidence: "App Store 원본은 JPG·PNG·TIFF·HEIC·GIF를 세부 수준·추가 윤곽·모서리 보정 옵션으로 벡터화해 SVG로 내보낸다고 명시하고, 수집 시점 카테고리 16위가 확인됩니다.",
    preservedFlow: "래스터 이미지 파일 입력 → 윤곽 벡터 변환 → 확대 가능한 SVG 파일",
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

const output = "docs/research/idea-strong-mechanism-batch-009-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((row) => row.id), output }, null, 2));
