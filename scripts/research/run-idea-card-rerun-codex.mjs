#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith("--")) argv.set(process.argv[index].slice(2), process.argv[index + 1]);
}
const inputPath = path.resolve(root, argv.get("input"));
const rows = fs.readFileSync(inputPath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
const part = Number(argv.get("part"));
const parts = Number(argv.get("parts"));
const start = Math.floor(rows.length * part / parts);
const end = Math.floor(rows.length * (part + 1) / parts);
const chunk = rows.slice(start, end);
const schemaPath = path.resolve(root, "docs/dev/experiments/idea-lab/qa/adaptive-audit-output.schema.json");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "idea-rerun-"));
const outputPath = path.join(temp, "result.json");
const isolated = path.join(temp, "workspace");
fs.mkdirSync(isolated);
const prompt = `당신은 '오늘 해볼까' 카드 조합의 엄격한 오프라인 검수자다. 앱 런타임에서 LLM을 호출하지 않으며, 아래에 제공한 원본과 카드 문구만 판단한다. 결과는 반드시 JSON Schema의 {results:[...]} 하나만 반환한다.

검수 규칙:
1. 제목 평가는 result_title만 본다. source_name은 해외 원본 근거 이름이며 사용자에게 보여줄 제목이 아니다. result_title만 읽어도 문제와 결과가 보여야 한다.
2. 입력 1개 → 처리 1회 → 결과 1개가 구체적인지 확인한다. 실제 MVP 입력·처리·결과는 smallest_build를 기준으로 평가한다. source_five_sentences는 원본 근거이며, 원본이 여러 입력 형식을 지원해도 smallest_build가 그중 하나로 범위를 좁히는 것은 허용한다. 빠진 원본 입력 형식을 구현하라고 요구하거나 그 이유로 감점하지 않는다.
3. 결제자·필요한 순간·한 끗 변화가 서로 자연스럽고 실제 한국 사용 순간인지 확인한다. 실제 카드 순간은 row의 moment와 moment_detail만 평가한다. source_five_sentences.need_moment는 해외 원본 근거 요약이므로 카드 순간 대신 사용하거나 그 문구를 이유로 감점하지 않는다.
4. 텍스트·URL·파일·사진·단일 기기 권한만 입력으로 허용한다. 사용자가 입력한 URL의 페이지 내용, URL이 가리키는 공개 파일, 또는 cURL 명령에 명시된 대상 API 응답을 한 번 읽는 것은 그 입력을 처리하는 과정이므로 external_data_required가 아니다. 입력에 없는 별도 계정 데이터·비공개 지표·시장 데이터·기대 정답이 추가로 필요할 때만 external_data_required로 판정한다.
5. 문제 전에 설치·기록해야만 작동하거나 상대방·기관의 새 행동이 필수면 fail이다.
6. OS 기본 기능이나 범용 AI 한 번이 더 편하면 fail이다.
7. 반나절~2일 MVP로 세로 조각이 가능한지 확인한다.
8. 원본 메커니즘에서 벗어난 새 기능을 상상하지 않는다.
9. status=pass는 세 UX 역할(beginner/intermediate/expert)이 모두 통과하고 hard_gate=pass일 때만 쓴다.
10. review는 문구를 고치면 살릴 수 있지만 아직 명확하지 않은 경우, fail은 위 규칙을 위반하는 경우다.

각 행의 id를 그대로 유지하고, reason에는 result_title과 row의 payer·moment·twist·smallest_build에서 확인한 구체적인 입력·처리·결과 근거를 한 문장으로 쓴다. source_five_sentences의 요약 문구를 row 카드 문구로 오인하지 않는다. risk_flags는 빈 배열 또는 아래 고정 코드만 쓴다:
title_unclear, payer_moment_mismatch, payer_twist_mismatch, moment_twist_mismatch, input_not_allowed, multi_input, multi_step, multi_result, prior_record_required, external_action_required, external_data_required, os_basic_substitute, generic_ai_substitute, mechanism_drift, scope_too_large, result_unclear, mvp_too_large, safety_or_regulation_risk, korean_context_mismatch.

검수 행:
${chunk.map((row, index) => JSON.stringify({ i: start + index, id: row.id, source_key: row.source_key, source_name: row.source_name ?? row.name, result_title: row.result_title ?? row.twist, source_five_sentences: row.source_five_sentences, payer: row.payer, payer_detail: row.payer_detail, moment: row.moment, moment_detail: row.moment_detail, twist: row.twist, twist_detail: row.twist_detail, smallest_build: row.smallest_build })).join("\n")}`;
const command = [
  "exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check",
  "--sandbox", "read-only", "--color", "never", "--model", "gpt-5.6-luna", "--cd", isolated,
  "--output-schema", schemaPath, "--output-last-message", outputPath, "-",
];
const result = spawnSync("codex", command, { cwd: root, input: prompt, encoding: "utf8", timeout: 900000 });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || result.stdout || `codex exited ${result.status}`);
const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
if (!Array.isArray(parsed.results) || parsed.results.length !== chunk.length) {
  throw new Error(`Expected ${chunk.length} results, got ${parsed.results?.length ?? "none"}`);
}
const output = path.resolve(root, argv.get("output"));
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ results: parsed.results }, null, 2));
console.log(JSON.stringify({ part, parts, start, end, rows: chunk.length, output }, null, 2));
