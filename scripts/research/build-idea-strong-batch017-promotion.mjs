#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const report = path.join(root, "docs/dev/experiments/idea-lab/idea-strong-mechanism-batch-017-full-27-audit-2026-07-15.md");
if (!fs.existsSync(report)) throw new Error("Full-27 pre-report must exist before promotion candidates");

const initialCards = readJsonl("docs/research/idea-strong-mechanism-batch-017-card-drafts-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-017-stress-retry-card-drafts-2026-07-15.jsonl");
const directFull = readJsonl("docs/research/idea-strong-mechanism-batch-017-full-direct-results-2026-07-15.jsonl");
const retryFull = readJsonl("docs/research/idea-strong-mechanism-batch-017-full-retry-results-2026-07-15.jsonl");
const full = [...directFull, ...retryFull];
const cards = new Map([...initialCards, ...retryCards].map((row) => [row.source_key, row]));

const definitions = {
  "trustmrr:sitemaptollm": {
    id: "sitemap-to-llms-text",
    slug: "sitemap-llms-text",
    platform: "web",
    sourceValue: "공개 XML·HTML 사이트맵 URL 하나를 구조화된 llms.txt 파일 하나로 변환하는 도구",
    sourceDetail: "사이트맵 URL을 한 번 파싱해 페이지 제목·경로를 읽고, 제목 목록·경로별 섹션·중복 제거 중 하나가 적용된 llms.txt 파일로 내보냅니다.",
    evidence: "TrustMRR에서 사이트맵을 LLM이 이해할 수 있는 llms.txt 표준 파일로 변환하는 개발 도구로 수집된 제품",
    preservedFlow: "공개 사이트맵 URL 입력 → 사이트맵 구조 1회 파싱 → 구조화된 llms.txt 파일",
  },
  "trustmrr:myterrace-net": {
    id: "football-matchday-social-card",
    slug: "football-matchday-card",
    platform: "app",
    sourceValue: "축구 경기 정보와 로고를 즉시 게시 가능한 매치데이 그래픽 한 장으로 만드는 도구",
    sourceDetail: "팀명·경기명·일시·스코어·로고 URL가 적힌 텍스트 하나를 입력하면 정사각형·스토리·스폰서 바 중 하나의 PNG 한 장으로 배치합니다.",
    evidence: "TrustMRR에서 축구 클럽이 즉시 매치데이 그래픽을 만들 수 있는 소셜 미디어 도구로 수집된 제품",
    preservedFlow: "축구 경기 정보·로고 입력 → 매치데이 템플릿 1회 배치 → 게시 가능한 PNG 한 장",
  },
  "trustmrr:taillens-tool-for-frontend-developers": {
    id: "tailwind-selector-class-diff",
    slug: "tailwind-class-diff",
    platform: "web",
    sourceValue: "공개 웹페이지의 지정 요소를 읽어 원하는 Tailwind 클래스 최소 수정 diff 한 파일로 만드는 도구",
    sourceDetail: "URL·CSS selector·변경값이 합쳐진 텍스트 하나를 입력하면 현재 클래스를 읽고 간격·색상·breakpoint 중 한 줄만 바뀐 diff로 내보냅니다.",
    evidence: "TrustMRR에서 Tailwind 개발자가 브라우저 안에서 요소를 시각 편집·검사하고 클래스 변경을 미리 보는 도구로 수집된 제품",
    preservedFlow: "공개 URL#selector와 변경값 입력 → 현재 Tailwind class 검사·변환 → 최소 수정 diff 파일",
  },
  "trustmrr:fonzo-io": {
    id: "svg-icons-to-webfont-package",
    slug: "svg-webfont-package",
    platform: "web",
    sourceValue: "단색 SVG 아이콘 ZIP 하나를 CSS와 미리보기가 포함된 웹폰트 패키지 ZIP 하나로 변환하는 도구",
    sourceDetail: "SVG ZIP 파일을 한 번 변환해 파일명 class·viewBox 정렬·glyph 미리보기 중 하나가 적용된 웹폰트 패키지로 내보냅니다.",
    evidence: "TrustMRR에서 SVG 아이콘 라이브러리와 웹디자인용 웹폰트 변환기를 제공하는 디자인 도구로 수집된 제품",
    preservedFlow: "SVG 아이콘 ZIP 입력 → glyph 웹폰트 1회 변환 → CSS·폰트가 든 패키지 ZIP",
  },
  "trustmrr:octree": {
    id: "latex-static-error-fix-file",
    slug: "latex-error-fix",
    platform: "web",
    sourceValue: "LaTeX .tex 파일 하나의 좁은 문법 오류를 정적 검사해 수정된 .tex 파일 하나로 돌려주는 도구",
    sourceDetail: "명령 밖 특수문자 4종·한 줄 중괄호 짝·단순 tabular 열 개수 중 하나를 검사하고 내용은 바꾸지 않은 수정 파일로 반환합니다.",
    evidence: "TrustMRR에서 LaTeX 문서를 편집하고 수정 방향을 안내하는 오픈소스 AI LaTeX 편집기로 수집된 제품",
    preservedFlow: "LaTeX .tex 파일 입력 → 좁은 문법 오류 1회 정적 검사·보정 → 수정된 .tex 파일",
  },
  "trustmrr:beep-productivity-inc": {
    id: "web-element-visual-feedback-file",
    slug: "web-visual-feedback",
    platform: "web",
    sourceValue: "공개 웹페이지의 지정 요소를 캡처해 위치와 댓글이 붙은 피드백 파일 하나로 만드는 도구",
    sourceDetail: "공개 URL·CSS selector·댓글이 합쳐진 텍스트 하나를 입력하면 데스크톱·모바일·selector 표시 중 하나가 적용된 HTML 피드백 파일로 반환합니다.",
    evidence: "TrustMRR에서 라이브 웹사이트 위에 댓글과 작업을 남겨 웹 수정 피드백을 관리하는 시각 협업 도구로 수집된 제품",
    preservedFlow: "공개 URL#selector와 댓글 입력 → 대상 요소 1회 캡처·표시 → 공유 가능한 HTML 피드백 파일",
  },
};

const candidates = [];
for (const [sourceKey, definition] of Object.entries(definitions)) {
  const results = full.filter((row) => row.source_key === sourceKey);
  if (results.length !== 27 || results.some((row) => row.audit.status !== "pass")) throw new Error(`${sourceKey}: expected Full-27 27/27 pass`);
  const card = cards.get(sourceKey);
  if (!card) throw new Error(`Missing card ${sourceKey}`);
  const axis = (name, item, index) => ({ id: `${name}-${definition.slug}-${index + 1}`, value: item.value, detail: item.detail });
  candidates.push({
    id: definition.id,
    source: { id: `source-${definition.id}`, sourceName: card.name, research: { key: sourceKey, url: card.url }, platform: definition.platform, value: definition.sourceValue, detail: definition.sourceDetail, evidence: definition.evidence, preservedFlow: definition.preservedFlow },
    payers: card.card_draft.payers.map((item, index) => axis("payer", item, index)),
    moments: card.card_draft.moments.map((item, index) => axis("moment", item, index)),
    twists: card.card_draft.twists.map((item, index) => ({ id: `twist-${definition.slug}-${index + 1}`, kind: index === 0 ? "replace" : "add", value: item.value, detail: item.detail, resultTitle: item.resultTitle, platform: definition.platform, smallestBuild: item.smallestBuild })),
  });
}

const output = "docs/research/idea-strong-mechanism-batch-017-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((item) => item.id), output }, null, 2));
