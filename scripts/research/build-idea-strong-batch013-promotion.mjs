#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/).filter(Boolean).map(JSON.parse);

const initialCards = readJsonl("docs/research/idea-strong-mechanism-batch-013-card-drafts-2026-07-15.jsonl");
const retryCards = readJsonl("docs/research/idea-strong-mechanism-batch-013-retry-card-drafts-2026-07-15.jsonl");
const initialFull = readJsonl("docs/research/idea-strong-mechanism-batch-013-full-results-2026-07-15.jsonl");
const retryFull = readJsonl("docs/research/idea-strong-mechanism-batch-013-retry-full-results-2026-07-15.jsonl");
const initialByKey = new Map(initialCards.map((row) => [row.source_key, row]));
const retryByKey = new Map(retryCards.map((row) => [row.source_key, row]));

const definitions = {
  "chrome_web_store:idickfnblhhleimfneihpmddjabiodlp": {
    cardSet: "initial",
    fullSet: "initial",
    id: "youtube-hidden-tag-export",
    slug: "youtube-tag-export",
    sourceValue: "YouTube 영상 URL에서 공개 메타데이터의 숨은 태그를 비교 가능한 목록 파일로 만드는 도구",
    sourceDetail: "YouTube 영상 URL 하나를 입력하면 숨은 태그를 한 번 추출해 원래 순서·중복 제거·긴 구문 우선 중 선택한 목록 파일 한 개로 제공합니다.",
    evidence: "Chrome Web Store 원본은 YouTube 영상의 숨은 태그 추출을 명시하고, 수집 시점 카테고리 1위·평점 5.0·2개 목록 노출이 확인됩니다.",
    preservedFlow: "YouTube 영상 URL 입력 → 숨은 태그 한 번 추출 → 비교 가능한 TXT 또는 CSV 목록 파일",
  },
  "chrome_web_store:ijolfnkijbagodcigeebgjhlkdgcebmf": {
    cardSet: "initial",
    fullSet: "initial",
    id: "masked-cookie-profile",
    slug: "masked-cookie-profile",
    sourceValue: "현재 사이트 쿠키의 값을 노출하지 않고 재현에 필요한 구조만 JSON 프로필로 저장하는 도구",
    sourceDetail: "현재 사이트 쿠키를 읽는 단일 사이트 권한을 허용하면 쿠키를 한 번 필터링·그룹화하고 모든 값을 마스킹한 JSON 파일 한 개를 제공합니다.",
    evidence: "Chrome Web Store 원본은 쿠키 조회·편집·삭제·내보내기와 프로필 저장을 명시하고, 수집 시점 카테고리 25위와 평점 5.0이 확인됩니다.",
    preservedFlow: "현재 사이트 쿠키 단일 권한 → 쿠키 구조 한 번 필터링·마스킹 → 재현용 JSON 프로필 파일",
  },
  "chrome_web_store:lcgfgelbpgaepigopgkoloicjjkgihcg": {
    cardSet: "retry",
    fullSet: "retry",
    id: "website-design-token-export",
    slug: "design-token-export",
    sourceValue: "공개 웹사이트의 색상·폰트·간격·효과를 재사용 가능한 디자인 토큰 파일로 만드는 도구",
    sourceDetail: "공개 웹사이트 URL 하나를 입력하면 디자인 요소를 한 번 추출해 CSS 변수·JSON 토큰·Figma 호환 토큰 중 선택한 파일 한 개를 제공합니다.",
    evidence: "Chrome Web Store 원본은 웹사이트의 색상·폰트·간격·그림자·효과 추출과 CSS·JSON·Figma 내보내기를 명시하고, 수집 시점 검색 순위 9위가 확인됩니다.",
    preservedFlow: "공개 웹사이트 URL 입력 → 디자인 요소 한 번 추출 → CSS·JSON·Figma 호환 토큰 파일",
  },
};

const candidates = [];
for (const [sourceKey, definition] of Object.entries(definitions)) {
  const full = definition.fullSet === "initial" ? initialFull : retryFull;
  const results = full.filter((row) => row.source_key === sourceKey);
  if (results.length !== 27 || results.some((row) => row.audit.status !== "pass")) {
    throw new Error(`${sourceKey}: expected Full-27 27/27 pass`);
  }
  const cards = definition.cardSet === "initial" ? initialByKey : retryByKey;
  const card = cards.get(sourceKey);
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
      platform: "web",
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
      platform: "web",
      smallestBuild: item.smallestBuild,
    })),
  });
}

const output = "docs/research/idea-strong-mechanism-batch-013-promotion-candidates-2026-07-15.json";
fs.writeFileSync(path.join(root, output), JSON.stringify(candidates, null, 2) + "\n");
console.log(JSON.stringify({ candidates: candidates.length, ids: candidates.map((row) => row.id), output }, null, 2));
