import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const directory = path.join(ROOT, "docs/research/idea-source-batch-decisions");
const labels = [
  "구체적인 입력",
  "핵심 처리",
  "즉시 결과",
  "필요한 순간",
  "기존 대안과 비교한 판정 근거",
];

let changed = 0;
for (const name of fs.readdirSync(directory).filter((file) => file.endsWith(".jsonl"))) {
  const file = path.join(directory, name);
  const rows = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
  for (const row of rows) {
    for (const key of Object.keys(row.five_sentences || {})) {
      for (const label of labels) {
        const prefix = `${label}은 `;
        if (row.five_sentences[key]?.startsWith(prefix)) {
          row.five_sentences[key] = `${label}: ${row.five_sentences[key].slice(prefix.length)}`;
          changed += 1;
        }
      }
    }
  }
  fs.writeFileSync(file, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

console.log(JSON.stringify({ changed }, null, 2));
