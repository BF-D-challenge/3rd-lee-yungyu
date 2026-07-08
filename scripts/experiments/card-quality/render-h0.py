#!/usr/bin/env python3
"""T3 — H0(현행 앱 출력) 재현. lib/draw.ts sentence() + lib/josa.ts 복제.
입력: scratchpad/cq/samples.json, data/combos.json
출력: scratchpad/cq/h0.json  ({rows:[{id, card:CardCell}]})
- 골든 행: 해당 golden의 title/oneliner/target/mvp 그대로 (현행 앱이 매칭 시 골든 표시)
- 비골든 행: sentenceTemplates[track] + josa 자동교정, title=null, mvp=null, target=defaultTarget
- like 비골든에 sampled situation 없으면 시드 랜덤 주입(현행 draw()가 매 스핀 랜덤 축 주입하는 것 재현)"""
import json, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CQ = "/private/tmp/claude-501/-Users-yungyulee-Project-03-BFD-3rd-lee-yungyu/3a782a35-719b-42c6-85ef-7ddd6b883bc2/scratchpad/cq".replace("42c6", "43c6")
d = json.load(open(os.path.join(ROOT, "data/combos.json")))
samples = json.load(open(os.path.join(CQ, "samples.json")))

TEMPLATES = d["sentenceTemplates"]
fmtById = {f["id"]: f for f in d["formats"]}
situations = d["situations"]
psychs = d["psychs"]
rng = random.Random(20260709)

def batchim(word):
    if not word: return -1
    last = ord(word[-1])
    if last < 0xAC00 or last > 0xD7A3: return -1
    return (last - 0xAC00) % 28

def josa(word, pair):
    b = batchim(word); withB, withoutB = pair.split("/")
    if b == -1: return f"{word}{withB}({withoutB})"
    if pair == "으로/로": return word + (withoutB if b in (0, 8) else withB)
    return word + (withB if b > 0 else withoutB)

JOSA_SUFFIX = {"을": "을/를", "를": "을/를", "이": "이/가", "가": "이/가", "은": "은/는", "는": "은/는"}
import re
def fill(template, values):
    def repl(m):
        key, suffix = m.group(1), m.group(2)
        if key not in values: return m.group(0)
        v = values[key]
        if not suffix: return v
        if suffix == "(으)로": return josa(v, "으로/로")
        return josa(v, JOSA_SUFFIX[suffix])
    return re.sub(r"\{(\w+)\}(\(으\)로|[을를이가은는])?", repl, template)

def default_target(seed_label, track):
    return (josa(seed_label, "을/를") + " 좋아하는 사람") if track == "like" else f"{seed_label} 실무자"

def golden_of(seed, pain, fmt):
    for g in d["golden"]:
        if g["seed"] == seed and g["pain"] == pain and g["format"] == fmt:
            return g
    return None

rows = []
for r in samples["rows"]:
    track = r["track"]; seed = r["seed"]; pain = r["pain"]; fmt = r["format"]
    g = golden_of(seed["id"], pain["id"], fmt["id"]) if r["golden"] else None
    if g:
        card = {"title": g.get("title"), "oneliner": g.get("oneliner"),
                "target": g.get("target") or default_target(seed["label"], track),
                "mvp": g.get("mvp"), "evidence": None, "reading": None, "todayAction": None}
    else:
        sit = r["situation"]["label"] if r["situation"] else rng.choice(situations)["label"]
        psy = r["psych"]["label"] if r["psych"] else rng.choice(psychs)["label"]
        values = {"situation": sit, "psych": psy, "target": default_target(seed["label"], track),
                  "seed": seed["label"], "painShort": pain["short"], "format": fmtById[fmt["id"]]["short"]}
        oneliner = fill(TEMPLATES[track], values)
        card = {"title": None, "oneliner": oneliner, "target": default_target(seed["label"], track),
                "mvp": None, "evidence": None, "reading": None, "todayAction": None}
    rows.append({"id": r["id"], "card": card})

# 검증
assert len(rows) == 20
for r in rows: assert r["card"]["oneliner"], f"{r['id']} oneliner 비어있음"
golden_ids = [r["id"] for r in samples["rows"] if r["golden"]]
for r in rows:
    if r["id"] in golden_ids: assert r["card"]["title"], f"{r['id']} 골든인데 title 없음"
# know 비골든 문장에 situation 미포함(현행 버그 재현 확인)
for s, r in zip(samples["rows"], rows):
    if s["track"] == "know" and not s["golden"] and s["situation"]:
        assert s["situation"]["label"] not in r["card"]["oneliner"], f"{r['id']} know인데 situation 삽입됨(예상밖)"

json.dump({"rows": rows}, open(os.path.join(CQ, "h0.json"), "w"), ensure_ascii=False, indent=1)
print("OK H0 20행")
for s, r in zip(samples["rows"], rows):
    print(f"  {r['id']} [{s['track']}]{' ✨' if s['golden'] else ''}{' ⚠︎' if s['forcedMismatch'] else ''} {r['card']['oneliner'][:75]}")
