// 백로그 다음 20조합 — 안 쓴 씨앗 우선 + 재사용 씨앗의 새 조합, done_triples 제외 (시드 20260710)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CQ = "/private/tmp/claude-501/-Users-yungyulee-Project-03-BFD-3rd-lee-yungyu/3a782a35-719b-43c6-85ef-7ddd6b883bc2/scratchpad/cq";
const d = JSON.parse(readFileSync(resolve(ROOT, "data/combos.json"), "utf8"));
const done = JSON.parse(readFileSync(resolve(CQ, "samples.json"), "utf8")).rows;
const doneSeeds = new Set(done.map((r) => r.seed.id));
const doneTriples = new Set(done.map((r) => `${r.seed.id}|${r.pain.id}|${r.format.id}`));

function mulberry32(a){return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const rand=mulberry32(20260710);
const shuffle=(x)=>{const a=[...x];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(x)=>x[Math.floor(rand()*x.length)];

const painById=Object.fromEntries(d.pains.map((p)=>[p.id,p]));
const fmtById=Object.fromEntries(d.formats.map((f)=>[f.id,f]));
const seed2meta={};
for(const t of["like","know"])for(const c of d.tracks[t].categories)for(const s of c.seeds)seed2meta[s.id]={label:s.label,track:t,categoryId:c.id};

const mk=(seedId,painId,fmtId,note)=>{const m=seed2meta[seedId];return{track:m.track,note,seed:{id:seedId,label:m.label,categoryId:m.categoryId},pain:{id:painId,short:painById[painId].short,label:painById[painId].label},format:{id:fmtId,label:fmtById[fmtId].label,action:fmtById[fmtId].action,desc:fmtById[fmtId].desc},situation:null,psych:null};};

function newComboFor(seedId){
  const a=d.allow[seedId];if(!a)return null;
  const cands=[];
  for(const p of a.pains)for(const f of a.formats){if(!doneTriples.has(`${seedId}|${p}|${f}`))cands.push([p,f]);}
  if(!cands.length)return null;
  const[p,f]=pick(shuffle(cands));return[p,f];
}

const rows=[];const usedFmt={};
const allowSeeds=Object.keys(d.allow).filter((s)=>seed2meta[s]);
const likeUnused=shuffle(allowSeeds.filter((s)=>seed2meta[s].track==="like"&&!doneSeeds.has(s)));
const knowUnused=shuffle(allowSeeds.filter((s)=>seed2meta[s].track==="know"&&!doneSeeds.has(s)));
const likeUsed=shuffle(allowSeeds.filter((s)=>seed2meta[s].track==="like"&&doneSeeds.has(s)));
const knowUsed=shuffle(allowSeeds.filter((s)=>seed2meta[s].track==="know"&&doneSeeds.has(s)));

function take(list,n,note){
  let got=0;
  for(const s of list){if(got>=n)break;const c=newComboFor(s);if(!c)continue;const[p,f]=c;if((usedFmt[f]||0)>=4)continue;usedFmt[f]=(usedFmt[f]||0)+1;doneTriples.add(`${s}|${p}|${f}`);rows.push(mk(s,p,f,note));got++;}
  return got;
}
// like 10: 미사용 우선, 부족분 재사용
let l=take(likeUnused,8,"new-seed");l+=take(likeUsed,10-l,"reuse-seed");
let k=take(knowUnused,8,"new-seed");k+=take(knowUsed,10-k,"reuse-seed");

rows.forEach((r,i)=>r.id=`B${String(i+1).padStart(2,"0")}`);
const assert=(c,m)=>{if(!c){console.error("FAIL:",m);process.exit(1);}};
assert(rows.length===20,`행수 ${rows.length}`);
assert(rows.filter((r)=>r.track==="like").length===10,"like 10 아님");
assert(rows.filter((r)=>r.track==="know").length===10,"know 10 아님");
for(const r of rows){const a=d.allow[r.seed.id];assert(a.pains.includes(r.pain.id)&&a.formats.includes(r.format.id),`${r.id} allow 위반`);}

writeFileSync(resolve(CQ,"samples-b.json"),JSON.stringify({seedRng:20260710,rows},null,1));
console.log("OK 다음 20조합 · like/know 10:10");
for(const r of rows)console.log(`  ${r.id} [${r.track}] ${r.seed.label}(${r.seed.id}) × "${r.pain.short}" × ${r.format.label}`);
