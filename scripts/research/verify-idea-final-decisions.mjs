import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ledgerPath = path.join(root, 'docs/research/idea-final-decisions-62.jsonl');
const currentQueuePath = path.join(root, 'docs/dev/experiments/idea-lab/idea-user-validation-queue-current.jsonl');
const archiveDir = path.join(root, 'docs/dev/experiments/idea-lab/archive/queues');
const baseQueuePath = path.join(archiveDir, 'idea-user-validation-queue-62.jsonl');
const expectedFields = [
  'id',
  'title',
  'lane',
  'ux_consensus',
  'final_status',
  'gate',
  'reason',
  'merged_into',
].sort();

function readJsonl(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path.relative(root, filePath)}:${index + 1}: ${error.message}`);
      }
    });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ledger = readJsonl(ledgerPath);
const currentQueue = readJsonl(currentQueuePath);
const baseQueue = readJsonl(baseQueuePath);
const ids = ledger.map((item) => item.id);
const uniqueIds = new Set(ids);
const statusCounts = ledger.reduce((counts, item) => {
  counts[item.final_status] = (counts[item.final_status] ?? 0) + 1;
  return counts;
}, {});
const expectedStatusCounts = {
  'Experiment Pass': 4,
  Merge: 11,
  'Custom Reserve': 5,
  Fail: 42,
};

assert(ledger.length === 62, `ledger rows must be 62, got ${ledger.length}`);
assert(uniqueIds.size === ledger.length, `duplicate final IDs: ${ids.filter((id, index) => ids.indexOf(id) !== index).join(', ')}`);
assert(
  Object.entries(expectedStatusCounts).every(([status, count]) => statusCounts[status] === count) &&
    Object.keys(statusCounts).length === Object.keys(expectedStatusCounts).length,
  `unexpected status totals: ${JSON.stringify(statusCounts)}`,
);

for (const item of ledger) {
  assert(JSON.stringify(Object.keys(item).sort()) === JSON.stringify(expectedFields), `${item.id}: unexpected fields`);
  assert(item.id && item.title && item.lane && item.ux_consensus && item.final_status && item.gate && item.reason, `${item.id}: unjudged or empty required field`);
  assert(['B2C', 'B2B'].includes(item.lane), `${item.id}: invalid lane ${item.lane}`);
  assert(/^[0-3]\/3$/.test(item.ux_consensus), `${item.id}: invalid UX consensus ${item.ux_consensus}`);
  assert(Object.hasOwn(expectedStatusCounts, item.final_status), `${item.id}: invalid final status ${item.final_status}`);
  assert(item.final_status === 'Merge' ? Boolean(item.merged_into) : item.merged_into === null, `${item.id}: merged_into invariant failed`);
}

const baseIds = new Set(baseQueue.map((item) => item.id));
assert(baseQueue.length === 62 && baseIds.size === 62, 'archived 62-row source must contain 62 unique IDs');
assert([...baseIds].every((id) => uniqueIds.has(id)) && [...uniqueIds].every((id) => baseIds.has(id)), 'ledger IDs must exactly match archived 62-row source');
assert(!uniqueIds.has('C09'), 'legacy bare C09 must not re-enter the final ledger');
assert(uniqueIds.has('C03-09'), 'normalized no-show ID C03-09 is missing');

const failIds = new Set(ledger.filter((item) => item.final_status === 'Fail').map((item) => item.id));
const failReentries = currentQueue.filter((item) => failIds.has(item.id));
assert(currentQueue.length === 0, `pending queue must be empty, got ${currentQueue.length}`);
assert(failReentries.length === 0, `Fail IDs re-entered current queue: ${failReentries.map((item) => item.id).join(', ')}`);

for (const filename of [
  'idea-user-validation-queue-62.jsonl',
  'idea-user-validation-queue-62.md',
  'idea-user-validation-queue-56.jsonl',
  'idea-user-validation-queue-56.md',
  'README.md',
]) {
  assert(fs.existsSync(path.join(archiveDir, filename)), `archive artifact missing: ${filename}`);
}
const archiveReadme = fs.readFileSync(path.join(archiveDir, 'README.md'), 'utf8');
assert(archiveReadme.includes('49개 큐') && archiveReadme.includes('ARCHIVED TRANSIENT'), 'transient 49-row queue is not documented as archived');

for (const filename of [
  'idea-user-validation-queue-62.jsonl',
  'idea-user-validation-queue-62.md',
  'idea-user-validation-queue-56.jsonl',
  'idea-user-validation-queue-56.md',
]) {
  assert(!fs.existsSync(path.join(root, 'docs/dev/experiments/idea-lab', filename)), `deprecated queue remains in active directory: ${filename}`);
}

const sourceChecks = [
  ['docs/dev/experiments/idea-lab/batch-002-ux-test-report.md', 'C02-09', '통신비구멍'],
  ['docs/dev/experiments/idea-lab/batch-003-ux-test-report.md', 'C03-09', '예약금마감'],
  ['docs/dev/experiments/idea-lab/luna-batch-005-c-family-home-mobility.md', 'C05-09', '방문차량확인'],
];
for (const [relativePath, normalizedId, title] of sourceChecks) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  assert(source.includes(normalizedId) && source.includes(title), `${relativePath}: normalized lineage missing`);
}

process.stdout.write(`${JSON.stringify({
  ledgerRows: ledger.length,
  duplicateIds: ledger.length - uniqueIds.size,
  unjudged: ledger.filter((item) => !item.final_status).length,
  statusCounts,
  pendingQueue: currentQueue.length,
  failReentries: failReentries.length,
  deprecatedQueuesInActiveDirectory: 0,
  normalizedLineage: ['C02-09', 'C03-09', 'C05-09'],
}, null, 2)}\n`);
