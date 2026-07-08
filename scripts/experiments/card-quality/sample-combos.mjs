// T1 — 카드 품질 실험 20조합 층화 표본추출 (결정론, 시드 20260707)
// 입력: src/data/combos.json · 출력: scratchpad/cq/samples.json
// 규칙(DESIGN.md T1): 20행 like10/know10 · 골든 4(like2 know2, 카테고리 상이)
//  · 부정합 강제 2(golf×commute, baking-dessert×work-break) · 장면 부여 정확히 10 · 모든 (pain,format)∈seed allow
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT_DIR = "/private/tmp/claude-501/-Users-yungyulee-Project-03-BFD-3rd-lee-yungyu/3a782a35-719b-43c6-85ef-7ddd6b883bc2/scratchpad/cq";
const d = JSON.parse(readFileSync(resolve(ROOT, "src/data/combos.json"), "utf8"));

// 시드 고정 PRNG
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(20260707);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const painById = Object.fromEntries(d.pains.map((p) => [p.id, p]));
const fmtById = Object.fromEntries(d.formats.map((f) => [f.id, f]));
const sitById = Object.fromEntries(d.situations.map((s) => [s.id, s]));
const psyList = d.psychs;

const seed2meta = {};
for (const track of ["like", "know"]) for (const cat of d.tracks[track].categories) for (const s of cat.seeds) seed2meta[s.id] = { label: s.label, track, categoryId: cat.id, catLabel: cat.label };

const allow = d.allow;
const mkPain = (id) => ({ id, short: painById[id].short, label: painById[id].label });
const mkFmt = (id) => ({ id, label: fmtById[id].label, action: fmtById[id].action, desc: fmtById[id].desc });
const mkSit = (id) => (id ? { id, label: sitById[id].label } : null);

function row(id, seedId, painId, fmtId, sitId, psyId, note, golden, forcedMismatch) {
  const m = seed2meta[seedId];
  return { id, track: m.track, note, seed: { id: seedId, label: m.label, categoryId: m.categoryId }, pain: mkPain(painId), format: mkFmt(fmtId), situation: mkSit(sitId), psych: psyId ? { id: psyId, label: psyList.find((p) => p.id === psyId).label } : null, golden: !!golden, forcedMismatch: !!forcedMismatch };
}

const rows = [];
const usedCats = { like: {}, know: {} };
const usedSeeds = new Set();
const usedFmt = {};
const bump = (o, k) => (o[k] = (o[k] || 0) + 1);

// ── 1) 골든 4행 (like2 know2, 카테고리 상이) ──
const playableGolden = d.golden.filter((g) => seed2meta[g.seed]);
function pickGoldens(track, n) {
  const out = []; const seenCat = new Set();
  for (const g of shuffle(playableGolden.filter((g) => seed2meta[g.seed].track === track))) {
    const cat = seed2meta[g.seed].categoryId;
    if (seenCat.has(cat) || usedSeeds.has(g.seed)) continue;
    // (pain,format) allow 검증
    const a = allow[g.seed]; if (!a || !a.pains.includes(g.pain) || !a.formats.includes(g.format)) continue;
    seenCat.add(cat); usedSeeds.add(g.seed); bump(usedCats[track], cat); bump(usedFmt, g.format);
    out.push(g); if (out.length === n) break;
  }
  return out;
}
let gi = 0;
for (const g of [...pickGoldens("like", 2), ...pickGoldens("know", 2)]) {
  gi++;
  rows.push(row(`R${String(gi).padStart(2, "0")}`, g.seed, g.pain, g.format, null, null, "golden", true, false));
}

// ── 2) 부정합 강제 2행 ── (pain/format은 allow 유효, situation만 어긋나게)
function forcedRow(idNum, seedId, sitId, psyId) {
  const a = allow[seedId];
  const painId = pick(a.pains); const fmtId = pick(a.formats);
  usedSeeds.add(seedId); bump(usedCats[seed2meta[seedId].track], seed2meta[seedId].categoryId); bump(usedFmt, fmtId);
  return row(`R${String(idNum).padStart(2, "0")}`, seedId, painId, fmtId, sitId, psyId, "forced-mismatch", false, true);
}
rows.push(forcedRow(5, "golf", "commute", "overchoice"));
rows.push(forcedRow(6, "baking-dessert", "work-break", "fomo"));

// ── 3) 일반 14행 ── like/know 10:10 채우기, 카테고리≤2·seed≤1·format≤3
const countTrack = (t) => rows.filter((r) => r.track === t).length;
const allSeeds = Object.keys(allow).filter((s) => seed2meta[s]);
let guard = 0;
let generalSituationBudget = 10 - rows.filter((r) => r.situation).length; // 장면 총 10 - 이미 부여된(부정합2)
let knowSituationBudget = 3; // know 행 장면 최대 3
while (rows.length < 20 && guard++ < 5000) {
  const needLike = countTrack("like") < 10;
  const needKnow = countTrack("know") < 10;
  const seedId = pick(allSeeds);
  const m = seed2meta[seedId];
  if (m.track === "like" && !needLike) continue;
  if (m.track === "know" && !needKnow) continue;
  if (usedSeeds.has(seedId)) continue;
  if ((usedCats[m.track][m.categoryId] || 0) >= 4) continue; // 트랙당 카테고리 3개뿐 → 10행 위해 캡 4
  const a = allow[seedId];
  // 골든 아닌 (pain,format) 우선
  const combosPool = [];
  for (const p of a.pains) for (const f of a.formats) {
    if ((usedFmt[f] || 0) >= 3) continue;
    const isGolden = d.golden.some((g) => g.seed === seedId && g.pain === p && g.format === f);
    if (isGolden) continue;
    combosPool.push([p, f]);
  }
  if (!combosPool.length) continue;
  const [painId, fmtId] = pick(combosPool);
  // 장면 부여 결정
  let sitId = null, psyId = null;
  const assignSit = generalSituationBudget > 0 && (m.track === "like" || knowSituationBudget > 0) && rand() < 0.6;
  if (assignSit) {
    sitId = pick(d.situations).id; psyId = pick(psyList).id;
    generalSituationBudget--; if (m.track === "know") knowSituationBudget--;
  }
  usedSeeds.add(seedId); bump(usedCats[m.track], m.categoryId); bump(usedFmt, fmtId);
  const idNum = rows.length + 1;
  rows.push(row(`R${String(idNum).padStart(2, "0")}`, seedId, painId, fmtId, sitId, psyId, "general", false, false));
}

// 장면 총 10 맞추기: 부족하면 장면 없는 일반행에 추가 부여
let sitCount = rows.filter((r) => r.situation).length;
for (const r of rows) {
  if (sitCount >= 10) break;
  if (!r.situation && r.note === "general") {
    if (r.track === "know" && knowSituationBudget <= 0) continue;
    r.situation = mkSit(pick(d.situations).id);
    r.psych = { id: psyList[Math.floor(rand() * psyList.length)].id, label: "" };
    r.psych.label = psyList.find((p) => p.id === r.psych.id).label;
    if (r.track === "know") knowSituationBudget--;
    sitCount++;
  }
}

// id 재정렬 (R01..R20)
rows.forEach((r, i) => (r.id = `R${String(i + 1).padStart(2, "0")}`));

// ── 검증 게이트 ──
const assert = (cond, msg) => { if (!cond) { console.error("ASSERT FAIL:", msg); process.exit(1); } };
assert(rows.length === 20, `행 수 ${rows.length}`);
assert(countTrack("like") === 10 && countTrack("know") === 10, `like/know ${countTrack("like")}/${countTrack("know")}`);
assert(rows.filter((r) => r.golden).length === 4, `golden ${rows.filter((r) => r.golden).length}`);
assert(rows.filter((r) => r.forcedMismatch).length === 2, `forced ${rows.filter((r) => r.forcedMismatch).length}`);
assert(rows.filter((r) => r.situation).length === 10, `situation ${rows.filter((r) => r.situation).length}`);
for (const r of rows) { const a = allow[r.seed.id]; assert(a && a.pains.includes(r.pain.id) && a.formats.includes(r.format.id), `${r.id} allow 위반`); }
const seedSet = new Set(rows.map((r) => r.seed.id)); assert(seedSet.size === 20, `seed 중복(${seedSet.size})`);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "samples.json"), JSON.stringify({ seedRng: 20260707, rows }, null, 1));
console.log("OK 20행 · like/know 10:10 · golden 4 · forced 2 · situation 10");
for (const r of rows) console.log(`  ${r.id} [${r.track}] ${r.seed.label}(${r.seed.categoryId}) × "${r.pain.short}" × ${r.format.label}${r.situation ? " 〔" + r.situation.label + "〕" : ""}${r.golden ? " ✨" : ""}${r.forcedMismatch ? " ⚠︎" : ""}`);
