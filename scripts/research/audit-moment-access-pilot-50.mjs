import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ideaLabDir = path.join(root, 'docs/dev/experiments/idea-lab');

// Stable pilot sample: the first 50 recent New Pass candidates in the v2
// reaudit order. D09-16 and D09-18, plus all legacy recoveries, remain unreviewed.
const sampleIds = `
A06-04 A06-17 B06-04 B06-08 B06-17 B06-24 D06-03 D06-07 D06-12 D06-13
D06-18 D06-21 A07-02 A07-04 A07-18 B07-02 B07-05 D07-02 D07-25 A08-02
A08-05 A08-14 B08-01 B08-02 B08-10 B08-12 B08-24 C08-20 D08-01 D08-02
D08-03 D08-07 D08-08 D08-10 D08-22 D08-23 A09-01 A09-03 A09-04 A09-12
A09-18 A09-23 B09-01 B09-03 B09-09 B09-15 C09-17 C09-19 D09-07 D09-09
`.trim().split(/\s+/);

const holdIds = new Set(['B06-04', 'D06-12', 'D08-08', 'D09-09']);
const failIds = new Set(['D06-13']);
const files = fs.readdirSync(ideaLabDir)
  .filter((name) => /^luna-batch-00[6-9]-.*\.md$/.test(name))
  .sort();

const titles = new Map();
for (const name of files) {
  const lines = fs.readFileSync(path.join(ideaLabDir, name), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!/^\| [ABCD]0[6-9]-\d{2} \|/.test(line)) continue;
    const columns = line.split('|').map((value) => value.trim());
    titles.set(columns[1], (columns[2] || '').replaceAll('*', ''));
  }
}

const items = sampleIds.map((id) => {
  const title = titles.get(id);
  if (!title) throw new Error(`${id}: title not found`);
  const moment = failIds.has(id) ? 0 : holdIds.has(id) ? 1 : 2;
  return { id, title, moment, status: moment === 0 ? 'Fail' : moment === 1 ? 'Hold' : 'Pass' };
});

const counts = items.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1;
  return result;
}, {});

if (
  sampleIds.length !== 50 ||
  new Set(sampleIds).size !== 50 ||
  counts.Pass !== 45 ||
  counts.Hold !== 4 ||
  counts.Fail !== 1
) {
  throw new Error(`Unexpected pilot totals: ${JSON.stringify({ sample: sampleIds.length, counts })}`);
}

process.stdout.write(`${JSON.stringify({ sample: items.length, counts, items }, null, 2)}\n`);
