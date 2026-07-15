#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) args.set(process.argv[i].slice(2), process.argv[i + 1]);
}
const input = path.resolve(root, args.get("input"));
const rows = fs.readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const part = Number(args.get("part"));
const parts = Number(args.get("parts"));
const start = Math.floor(rows.length * part / parts);
const end = Math.floor(rows.length * (part + 1) / parts);
const chunk = rows.slice(start, end);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "idea-card-draft-"));
const schema = path.resolve(root, "docs/dev/experiments/idea-lab/qa/adaptive-card-draft-output.schema.json");
const output = path.join(temp, "cards.json");
const workspace = path.join(temp, "workspace");
fs.mkdirSync(workspace);
const prompt = `당신은 '오늘 해볼까'의 사전 카드 편집자다. 아래 해외 원본의 입력→처리→결과 메커니즘을 보존하면서 한국 사용자가 실제로 돈을 낼 만한 카드 재료를 만든다. 원본에 없는 기능을 발명하지 말고 JSON Schema의 {cards:[...]}만 반환한다.

각 원본마다 정확히 작성한다:
- payers 3개: value에는 실제로 반복 문제를 겪고 결제할 사람을 직업·상황까지 구체적으로 쓰고, detail에는 반복 통증과 기존 수작업을 쓴다.
- moments 3개: value에는 문제가 이미 발생해 해결 욕구가 커진 구체적 순간을 쓰고, detail에는 지금 바로 결과가 필요한 이유를 쓴다. 설치·사전 기록 없이 그 순간 유입할 수 있어야 한다.
- twists 3개: 원본 입력→처리→결과를 유지한 한 끗만 쓴다. value는 무엇을 하나 바꾸는지, detail은 무엇을 유지하고 무엇만 바꾸는지, resultTitle은 문제와 결과가 함께 보이는 한국어 결과 제목, smallestBuild는 입력 1개 → 처리 1회 → 결과 1개의 작동 MVP다.

반드시 지킨다:
- resultTitle은 해외 제품명이나 "도우미", "관리 앱", "AI 서비스" 같은 범용 이름이 아니다. 예: "농구 점프 영상 높이 계산", "영수증 사진의 환불 기한 표시"처럼 입력·문제·결과를 12~28자로 드러낸다.
- smallestBuild 입력은 텍스트·URL·파일·사진·단일 기기 권한 중 정확히 하나다. 처리와 즉시 결과도 각각 하나다.
- 결제자 3 × 순간 3 × 한 끗 3의 27개 조합을 머릿속으로 붙여 보고, 어느 조합도 다른 사람·다른 문제처럼 보이지 않게 쓴다.
- 원본에 없는 외부 데이터, 새 예측, 상대방 행동, 기관 연동, 상시 추적을 추가하지 않는다.
- OS 기본 기능이나 범용 AI 한 번이 더 편한 원본을 억지 문구로 차별화하지 않는다.

문구는 중복 없이 사람이 읽었을 때 매력적이어야 한다. value와 resultTitle은 한국어 12~35자 정도로 쓰고, detail과 smallestBuild는 구체적인 완전한 문장으로 쓴다. 원본이 범용 기능이면 원본의 가장 좁은 세로 조각만 유지한다.

원본:
${chunk.map((row) => JSON.stringify({ source_key: row.source_key, name: row.name, category: row.category, source_text: row.source_text, five_sentences: row.five_sentences, prior_review_feedback: row.prior_review_feedback })).join("\n")}`;
const command = ["exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check", "--sandbox", "read-only", "--color", "never", "--model", "gpt-5.6-luna", "--cd", workspace, "--output-schema", schema, "--output-last-message", output, "-"];
const result = spawnSync("codex", command, { cwd: root, input: prompt, encoding: "utf8", timeout: 900000 });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || result.stdout || `codex exited ${result.status}`);
const parsed = JSON.parse(fs.readFileSync(output, "utf8"));
if (!Array.isArray(parsed.cards) || parsed.cards.length !== chunk.length) throw new Error(`Expected ${chunk.length} cards, got ${parsed.cards?.length ?? "none"}`);
const outPath = path.resolve(root, args.get("output"));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ cards: parsed.cards }, null, 2));
console.log(JSON.stringify({ part, parts, start, end, cards: chunk.length, output: outPath }, null, 2));
