#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cards = fs.readFileSync(
  path.join(root, "docs/research/idea-strong-mechanism-batch-010-retry-card-drafts-2026-07-15.jsonl"),
  "utf8",
).split(/\r?\n/).filter(Boolean).map(JSON.parse);
const byKey = new Map(cards.map((row) => [row.source_key, row]));

const specs = [
  {
    sourceKey: "chrome_web_store:ijaopicbldggjdgbnfdlkljeggibmcha",
    id: "notion-page-to-pdf",
    slug: "notion-pdf",
    value: "공개 Notion 페이지를 표·이미지·다크 배치가 유지되는 전달용 PDF로 바꾸는 도구",
    detail: "공개 Notion 페이지 URL 하나를 입력하면 페이지를 한 번 렌더링해 선택한 배치 보존 기준이 적용된 PDF 파일 한 개로 변환합니다.",
    evidence: "Chrome Web Store 원본은 Notion을 PDF로 내보내면서 레이아웃·표·다크 모드를 유지한다고 명시하고, 수집 시점 검색 순위 4위와 평점 4.8이 확인됩니다.",
    preservedFlow: "공개 Notion 페이지 URL 입력 → 레이아웃 보존 렌더링 → 전달·인쇄 가능한 PDF 파일",
  },
  {
    sourceKey: "chrome_web_store:nkgaaaiaadfgellaglahphkfjipcgmin",
    id: "chrome-extension-static-audit",
    slug: "extension-audit",
    value: "Chrome 확장 CRX의 과도한 권한·외부 전송·난독화 위치를 설치 전에 보여 주는 정적 감사 도구",
    detail: "CRX 파일 하나를 입력하면 manifest와 스크립트를 한 번 정적으로 검사해 선택한 위험 단서의 파일 위치가 표시된 HTML 보고서 한 개를 만듭니다.",
    evidence: "Chrome Web Store 원본은 확장의 위협·의심 권한·악성 동작을 검사한다고 명시하고, 수집 시점 카테고리 9위와 평점 5.0이 확인됩니다.",
    preservedFlow: "Chrome 확장 CRX 파일 입력 → 권한·도메인·스크립트 정적 검사 → 위험 근거 위치 HTML 보고서",
  },
  {
    sourceKey: "chrome_web_store:okeampldbdmpachkggljgpngbooaclal",
    id: "maps-route-to-gpx",
    slug: "route-gpx",
    value: "Google Maps 장거리 경로를 경유지·구간·회차점 정보가 남는 라이딩 GPX로 바꾸는 도구",
    detail: "경유지가 포함된 공개 Google Maps 경로 URL 하나를 입력하면 경로를 한 번 변환해 선택한 구조가 보존된 GPX 파일 한 개를 제공합니다.",
    evidence: "Chrome Web Store 원본은 자전거·오토바이 장거리 경로 편집·최적화·내보내기를 명시하고, 수집 시점 카테고리 7위와 평점 5.0이 확인됩니다.",
    preservedFlow: "공개 Google Maps 경로 URL 입력 → 경로 구조 변환 → 기기·참가자에게 전달할 GPX 파일",
  },
];

const axis = (name, slug, item, index) => ({
  id: `${name}-${slug}-${index + 1}`,
  value: item.value,
  detail: item.detail,
});

const candidates = specs.map((spec) => {
  const card = byKey.get(spec.sourceKey);
  if (!card) throw new Error(`Missing promotion card: ${spec.sourceKey}`);
  return {
    id: spec.id,
    source: {
      id: `source-${spec.id}`,
      sourceName: card.name,
      research: { key: card.source_key, url: card.url },
      platform: "web",
      value: spec.value,
      detail: spec.detail,
      evidence: spec.evidence,
      preservedFlow: spec.preservedFlow,
    },
    payers: card.card_draft.payers.map((item, index) => axis("payer", spec.slug, item, index)),
    moments: card.card_draft.moments.map((item, index) => axis("moment", spec.slug, item, index)),
    twists: card.card_draft.twists.map((item, index) => ({
      id: `twist-${spec.slug}-${index + 1}`,
      kind: index === 0 ? "replace" : "add",
      value: item.value,
      detail: item.detail,
      resultTitle: item.resultTitle,
      platform: "web",
      smallestBuild: item.smallestBuild,
    })),
  };
});

const output = "docs/research/idea-strong-mechanism-batch-010-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((row) => row.id), output }, null, 2));
