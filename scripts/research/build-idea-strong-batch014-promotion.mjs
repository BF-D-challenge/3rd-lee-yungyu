#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);
const cards = readJsonl("docs/research/idea-strong-mechanism-batch-014-full-card-drafts-2026-07-15.jsonl");
const full = readJsonl("docs/research/idea-strong-mechanism-batch-014-full-results-2026-07-15.jsonl");
const fullReport = path.join(root, "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-014-full-27-audit-2026-07-15.md");
if (!fs.existsSync(fullReport)) throw new Error("Full-27 report must exist before promotion candidates");

const definitions = {
  "trustmrr:webtoapp-no-code-app-converter": {
    id: "website-to-android-apk",
    slug: "website-android-apk",
    platform: "app",
    sourceValue: "모바일 웹사이트 URL 하나를 설치 가능한 Android WebView APK 한 파일로 감싸는 도구",
    sourceDetail: "모바일 대응 공개 웹사이트 URL 하나를 입력하면 앱 아이콘·뒤로가기·자사 도메인 규칙 중 하나가 적용된 debug APK 한 파일로 패키징합니다.",
    evidence: "TrustMRR에서 최근 30일 매출 620달러와 함께 웹사이트를 네이티브 Android 앱으로 바꾸는 노코드 변환기로 수집된 제품",
    preservedFlow: "모바일 웹사이트 URL 입력 → Android WebView 앱 패키징 → 설치 가능한 debug APK 파일",
  },
  "trustmrr:scrapestudio-co": {
    id: "web-component-code-extractor",
    slug: "web-component-code",
    platform: "web",
    sourceValue: "공개 웹페이지의 지정 컴포넌트를 재사용 가능한 HTML·React·Tailwind 코드 파일로 추출하는 도구",
    sourceDetail: "URL과 CSS selector가 합쳐진 텍스트 하나를 입력하면 대상 DOM과 스타일을 읽어 선택한 형식의 컴포넌트 코드 파일 한 개로 내보냅니다.",
    evidence: "TrustMRR에서 웹사이트 컴포넌트를 추출해 라이브러리나 프로젝트에 복사할 ready-code로 만드는 개발 도구로 수집된 제품",
    preservedFlow: "URL#CSS selector 입력 → 대상 DOM·스타일 추출·변환 → 재사용 가능한 컴포넌트 코드 파일",
  },
  "trustmrr:lightspeed-run": {
    id: "single-page-performance-cause-report",
    slug: "page-performance-cause",
    platform: "web",
    sourceValue: "공개 웹페이지 URL 하나를 실제 브라우저로 측정해 느린 지표와 원인 요소를 붙인 보고서로 만드는 도구",
    sourceDetail: "공개 웹사이트 URL 하나를 입력하면 한 번 성능을 측정하고 LCP·CLS·긴 JavaScript 작업 중 하나의 원인이 표시된 HTML 보고서 한 파일로 내보냅니다.",
    evidence: "TrustMRR에서 최근 30일 매출 28달러와 함께 전환·SEO 개선을 위한 웹사이트 성능 측정·최적화 도구로 수집된 제품",
    preservedFlow: "공개 웹페이지 URL 입력 → 실제 브라우저 성능 1회 측정 → 지표와 원인 요소가 표시된 HTML 보고서",
  },
  "trustmrr:beesecure": {
    id: "code-static-security-locations",
    slug: "code-static-security",
    platform: "web",
    sourceValue: "웹 프로젝트 코드 ZIP에서 정적으로 확인 가능한 위험 패턴의 파일·행 위치를 찾는 보안 검사 도구",
    sourceDetail: "웹 프로젝트 코드 ZIP 파일 하나를 입력하면 비밀키·eval 계열 호출·전체 허용 CORS 중 하나를 정적 검사해 위치가 표시된 HTML 보고서 한 파일로 내보냅니다.",
    evidence: "TrustMRR에서 개발자·인디해커·SaaS 창업자가 코드베이스 취약점을 빠르게 식별하도록 돕는 보안 스캔 플랫폼으로 수집된 제품",
    preservedFlow: "웹 프로젝트 코드 ZIP 입력 → 위험 패턴 정적 보안 검사 → 파일·행 위치가 표시된 HTML 보고서",
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

const output = "docs/research/idea-strong-mechanism-batch-014-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((item) => item.id), output }, null, 2));
