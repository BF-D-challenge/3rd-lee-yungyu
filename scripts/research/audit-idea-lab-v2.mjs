import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ideaLabDir = path.join(root, 'docs/dev/experiments/idea-lab');

const passIds = new Set(`
A06-04 A06-17 B06-04 B06-08 B06-17 B06-24 D06-03 D06-07 D06-12 D06-13 D06-18 D06-21
A07-02 A07-04 A07-18 B07-02 B07-05 D07-02 D07-25 A08-02 A08-05 A08-14
B08-01 B08-02 B08-10 B08-12 B08-24 C08-20 D08-01 D08-02 D08-03 D08-07 D08-08 D08-10 D08-22 D08-23
A09-01 A09-03 A09-04 A09-12 A09-18 A09-23 B09-01 B09-03 B09-09 B09-15
C09-17 C09-19 D09-07 D09-09 D09-16 D09-18
`.trim().split(/\s+/));

const manualMergeIds = new Set(['D08-15']);
const hardProductFailIds = new Set(['A07-21', 'A07-24', 'C08-08']);
const duplicatePattern = /중복|이름만 바꾼|동일한 입력|완전 동일/;

const files = fs.readdirSync(ideaLabDir)
  .filter((name) => /^luna-batch-00[6-9]-.*\.md$/.test(name))
  .sort();

const items = [];

for (const name of files) {
  const file = path.join(ideaLabDir, name);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    if (!/^\| [ABCD]0[6-9]-\d{2} \|/.test(line)) continue;

    const columns = line.split('|').map((value) => value.trim());
    const id = columns[1];
    const title = (columns[2] || '').replaceAll('*', '');
    const oldUxIndex = columns.findIndex((value) => ['0/3', '1/3', '2/3', '3/3'].includes(value));
    const personaTriples = columns.slice(0, oldUxIndex).join(' ').match(/[YN]\/[YN]\/[YN]/g) || [];

    if (personaTriples.length !== 3) {
      throw new Error(`${id}: expected 3 persona triples, got ${personaTriples.length}`);
    }

    // The old third value was willingness to pay. v2 UX keeps only
    // comprehension and a plausible Korean use scene; payment is scored later.
    const uxConsensus = personaTriples.filter((value) => value.startsWith('Y/Y/')).length;

    let status;
    if (uxConsensus < 2) status = 'Fail';
    else if (passIds.has(id)) status = 'New Pass';
    else if (hardProductFailIds.has(id)) status = 'Fail';
    else if (manualMergeIds.has(id) || duplicatePattern.test(line)) status = 'Merge';
    else status = 'Hold';

    items.push({ id, title, source: name, uxConsensus, status });
  }
}

const counts = items.reduce((result, item) => {
  result[item.status] = (result[item.status] || 0) + 1;
  return result;
}, {});

const uxPass = items.filter((item) => item.uxConsensus >= 2).length;
const uxFail = items.length - uxPass;

const summary = {
  files: files.length,
  candidates: items.length,
  ux: { pass: uxPass, fail: uxFail },
  final: {
    newPass: counts['New Pass'] || 0,
    merge: counts.Merge || 0,
    hold: counts.Hold || 0,
    fail: counts.Fail || 0,
  },
  items,
};

if (
  summary.files !== 16 ||
  summary.candidates !== 400 ||
  summary.ux.pass !== 374 ||
  summary.ux.fail !== 26 ||
  summary.final.newPass !== 52 ||
  summary.final.merge !== 155 ||
  summary.final.hold !== 164 ||
  summary.final.fail !== 29
) {
  throw new Error(`Unexpected v2 audit totals: ${JSON.stringify(summary, null, 2)}`);
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
