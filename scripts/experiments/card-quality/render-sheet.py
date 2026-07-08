#!/usr/bin/env python3
"""T5 — 블라인드 채점 시트 조립 (결정론 셔플, 시드 20260708)
입력: cq/samples.json, cq/h0.json, cq/gen20-output.json
출력: docs/dev/experiments/card-quality/blind-sheet.md, cq/answer-key.DO-NOT-OPEN.json
- 행마다 [H0,H1,H2,H3] 셔플 → 안1~안4. 배정표는 answer-key에만.
- 방향 라벨·앵커 URL·제품 매출 라벨 시트 노출 금지(블라인드)."""
import json, os, random, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CQ = "/private/tmp/claude-501/-Users-yungyulee-Project-03-BFD-3rd-lee-yungyu/3a782a35-719b-43c6-85ef-7ddd6b883bc2/scratchpad/cq"
OUT_MD = os.path.join(ROOT, "docs/dev/experiments/card-quality/blind-sheet.md")

samples = {r["id"]: r for r in json.load(open(os.path.join(CQ, "samples.json")))["rows"]}
h0 = {r["id"]: r["card"] for r in json.load(open(os.path.join(CQ, "h0.json")))["rows"]}
gen = {s["id"]: s for s in json.load(open(os.path.join(CQ, "gen20-output.json")))["samples"]}
rng = random.Random(20260708)

def render_card(c):
    lines = []
    if c.get("title"):
        lines.append(f"**{c['title']}**")
    lines.append(c["oneliner"])
    if c.get("target"):
        lines.append(f"- 타깃: {c['target']}")
    if c.get("mvp"):
        lines.append("- MVP: " + " / ".join(c["mvp"]))
    if c.get("evidence"):
        lines.append(f"- 근거: {c['evidence']}")
    if c.get("reading"):
        lines.append("")
        lines.append(c["reading"])
    if c.get("todayAction"):
        lines.append(f"- 오늘: {c['todayAction']}")
    return "\n".join(lines)

md = []
md.append("# 카드 품질 블라인드 채점 시트")
md.append("")
md.append("> 같은 조합에 대해 4가지 버전(안1~안4)을 라벨 없이 나란히 놓았습니다. 어떤 안이 어떤 방식인지는 채점 후 공개됩니다.")
md.append("")
md.append("**채점 방법** — 행마다 아래 4개 기준을 종합해 **가장 좋은 안 1개**를 고르세요. 백틱 안 값만 고치면 됩니다(동점이면 `안1,안3`처럼 둘 허용). 별로면 탈락 안도 표기 가능. 소요 15~20분.")
md.append("")
md.append("1. **니치 구체성** — \"나 이거 아는데\" 싶게 좁은가")
md.append("2. **오늘 만들 실행감** — 반나절에 만들 수 있어 보이는가")
md.append("3. **의외성·재미** — 예상 못한 훅이 있는가")
md.append("4. **문장 자연스러움** — 사람 말투로 매끄러운가")
md.append("")
md.append("---")
md.append("")

answer_key = {"shuffleRng": 20260708, "rows": []}
order = sorted(samples.keys())
for rid in order:
    s = samples[rid]
    variants = {"H0": h0[rid], "H1": gen[rid]["h1"], "H2": gen[rid]["h2"], "H3": gen[rid]["h3"]}
    labels = ["H0", "H1", "H2", "H3"]
    rng.shuffle(labels)
    keymap = {}
    sit = f" 〔장면: {s['situation']['label']}" + (f" · 마음: {s['psych']['label']}" if s.get("psych") else "") + "〕" if s.get("situation") else ""
    md.append(f"## {rid} · {s['seed']['label']} × \"{s['pain']['short']}\" × {s['format']['label']}{sit}")
    md.append("")
    for i, lab in enumerate(labels, 1):
        keymap[f"안{i}"] = lab
        md.append(f"### 안{i}")
        md.append(render_card(variants[lab]))
        md.append("")
    md.append(f"**✍️ 채점** → 승자: `안_` · 탈락(있으면): `안_` · 메모: ")
    md.append("")
    md.append("---")
    md.append("")
    answer_key["rows"].append({"id": rid, **keymap})

sheet = "\n".join(md)

# 블라인드 검증
leaks = re.findall(r"\bH[0-3]\b|trustmrr|https?://", sheet)
if leaks:
    print("WARN 블라인드 누출 후보:", set(leaks))

os.makedirs(os.path.dirname(OUT_MD), exist_ok=True)
open(OUT_MD, "w").write(sheet)
json.dump(answer_key, open(os.path.join(CQ, "answer-key.DO-NOT-OPEN.json"), "w"), ensure_ascii=False, indent=1)
print(f"OK 시트 {len(order)}행 → {OUT_MD}")
print(f"정답키 → {CQ}/answer-key.DO-NOT-OPEN.json (채점 전 열람 금지)")
# 셔플 분포 확인(전 행 동일 배열 아님)
first = [answer_key["rows"][0][f"안{i}"] for i in range(1, 5)]
allsame = all([answer_key["rows"][k][f"안{i}"] for i in range(1, 5)] == first for k in range(len(order)))
print("셔플 다양성:", "경고! 전 행 동일" if allsame else "OK")
