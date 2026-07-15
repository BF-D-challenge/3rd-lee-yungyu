#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const input = "docs/research/idea-strong-mechanism-batch-007-card-drafts-2026-07-15.jsonl";
const rows = fs.readFileSync(path.join(root, input), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const keep = new Set([
  "trustmrr:figma-ai-rename-plugin",
  "trustmrr:videosubtitleone",
  "chrome_web_store:kejbdjndbnbjgmefkgdddjlbokphdefk",
]);

const retryRows = rows.filter((row) => keep.has(row.source_key)).map((row) => {
  const retry = structuredClone(row);
  if (row.source_key === "trustmrr:figma-ai-rename-plugin") {
    retry.prior_review_feedback = "첫 Latin-9은 8/9였고 유일한 review는 외주 디자이너와 일반 디자인 리뷰 순간의 연결이 약하다는 것이었다. payer와 twist는 유지하고 두 번째 moment만 세 payer 모두에게 공통인 레이어 이름 정리 완료 직전으로 바꾼다. 이 한 번 뒤에도 9/9가 아니면 종료한다.";
    retry.card_draft.moments[1] = {
      value: "레이어 이름 정리를 마치고 공유하기 직전",
      detail: "역할 없는 이름이 남으면 리뷰와 인수인계에서 다시 설명해야 하므로 공유 전에 정리된 이름 미리보기가 바로 필요하다.",
    };
  }
  if (row.source_key === "trustmrr:videosubtitleone") {
    retry.prior_review_feedback = "첫 Stress-3은 2/3였고 유일한 review는 강조할 핵심 단어를 어떻게 고르는지 불명확하다는 것이었다. payer와 moment는 유지하고 두 번째 twist만 원본이 지원하는 배경·폰트 스타일 변경으로 좁힌다. 이 한 번 뒤에도 3/3가 아니면 종료한다.";
    retry.card_draft.twists[1] = {
      value: "밝은 화면에서도 보이는 고대비 자막",
      detail: "영상과 자동 자막 내용은 유지하고 반투명 검정 배경과 흰 글자만 적용해 밝은 장면에서도 읽히게 한다.",
      resultTitle: "밝은 영상에 고대비 배경 자막 입히기",
      smallestBuild: "말소리가 있는 영상 파일 하나를 입력받아 고대비 배경 자막을 한 번 적용하고 MP4 영상 하나를 출력한다.",
    };
  }
  if (row.source_key === "chrome_web_store:kejbdjndbnbjgmefkgdddjlbokphdefk") {
    retry.prior_review_feedback = "첫 Stress-3은 2/3였고 유일한 review는 URL 하나로 동의 전 발화를 어떻게 판별하는지 불명확하다는 것이었다. payer와 moment는 유지하고 세 번째 twist만 원본 Tag Assistant가 URL 하나에서 직접 확인할 수 있는 설치 태그 ID 목록으로 바꾼다. 이 한 번 뒤에도 3/3가 아니면 종료한다.";
    retry.card_draft.twists[2] = {
      value: "페이지에 설치된 태그 ID 한눈에 보기",
      detail: "웹페이지 URL 점검 흐름은 유지하고 페이지에서 실제로 발견한 gtag.js·GTM 태그 ID와 위치만 한 장에 모은다.",
      resultTitle: "웹페이지의 설치 태그 ID 목록 보고서",
      smallestBuild: "공개 웹페이지 URL 1개를 한 번 점검해 발견된 Google 태그 ID와 위치가 표시된 HTML 보고서 1개를 즉시 만든다.",
    };
  }
  return retry;
});

if (retryRows.length !== keep.size) throw new Error(`Expected ${keep.size} retry rows, got ${retryRows.length}`);

const output = "docs/research/idea-strong-mechanism-batch-007-retry-card-drafts-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), retryRows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ candidates: retryRows.length, output }, null, 2));
