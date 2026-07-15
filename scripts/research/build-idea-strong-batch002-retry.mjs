#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJsonl = (file) => fs.readFileSync(path.join(root, file), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const source = new Map(readJsonl("docs/research/idea-strong-mechanism-batch-002-input-2026-07-15.jsonl").map((row) => [row.source_key, row]));
const feedback = new Map([
  ["trustmrr:hyperfocal", {
    instruction: "payers는 모두 Lightroom·Photoshop·영상 편집기를 오가며 사진과 짧은 영상을 함께 만드는 하이브리드 편집자로 작성한다. moments는 결과 형식을 미리 정하지 말고, 참고 사진의 색감을 편집 시작값으로 옮겨야 하는 공통 문제로 작성한다. 예: 고객이 참고 사진을 보냄, 다른 편집기에서 같은 톤을 시작해야 함, 마감 전에 색감 시작 파일이 필요함. twists는 Lightroom XMP, Photoshop ACR XMP, 영상 LUT 출력 형식만 바꾼다. 각 결과 제목에 '색감 시작 파일' 또는 '색감 초안 파일'을 넣어 초보자도 결과 파일임을 알게 한다.",
  }],
  ["trustmrr:chordprep", {
    instruction: "모든 입력을 텍스트 블록 하나로 닫는다. 목표 키 twist는 첫 줄 '목표키:G', 카포 twist는 첫 줄 '카포:2', 한 페이지 twist는 첫 줄 '목표키:G'를 쓰고 다음 줄부터 원곡 가사·코드 텍스트를 붙이는 방식이다. 추가 폼·URL·파일 입력을 요구하지 않는다. titles는 각각 'G키로 바뀐 연주 코드표', '카포 2 기준 연주 코드표', '한 장으로 인쇄하는 G키 코드표'처럼 문제와 결과를 드러낸다. payers와 moments는 모두 합주·예배·공연 직전 조옮김 코드표가 필요한 연주자로 유지한다.",
  }],
]);

const rows = [...feedback.entries()].map(([key, priorReviewFeedback]) => {
  const row = source.get(key);
  if (!row) throw new Error(`Missing retry source: ${key}`);
  return { ...row, prior_review_feedback: priorReviewFeedback };
});
const output = "docs/research/idea-strong-mechanism-batch-002-retry-input-2026-07-15.jsonl";
fs.writeFileSync(path.join(root, output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n");
console.log(JSON.stringify({ selected: rows.length, keys: rows.map((row) => row.source_key), output }, null, 2));
