#!/usr/bin/env python3
"""T2 — 20조합 앵커 후보 매칭 (결정론)
입력: scratchpad/cq/samples.json, research/trustmrr-acquire/ideas.jsonl
출력: scratchpad/cq/anchors.json
규칙(DESIGN.md T2): seed 키워드 2점·pain/format 1점 가중, revenue>=200, 상위 4, 점수>=3 후보<3이면 fallback 폴백."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CQ = "/private/tmp/claude-501/-Users-yungyulee-Project-03-BFD-3rd-lee-yungyu/3a782a35-719b-43c6-85ef-7ddd6b883bc2/scratchpad/cq"

SEED_KW = {
    "running": ["run", "running", "marathon", "jog", "strava", "pace", "fitness"],
    "ott": ["netflix", "streaming", "tv show", "watchlist", "binge", "series", "movie"],
    "frontend": ["frontend", "react", "css", "ui component", "chrome extension", "design system", "developer"],
    "influencer-marketing": ["influencer", "creator", "brand deal", "ugc", "social media", "marketing"],
    "golf": ["golf", "swing", "sport", "coaching", "video analysis", "technique"],
    "baking-dessert": ["bake", "baking", "dessert", "recipe", "pastry", "cake"],
    "inventory-management": ["inventory", "stock", "shopify", "warehouse", "sku", "ecommerce"],
    "qa-test": ["qa", "testing", "test", "bug", "checklist", "quality"],
    "app-dev": ["app store", "ios", "android", "mobile app", "developer", "app"],
    "sns-ops": ["social media", "instagram", "schedule post", "content calendar", "sns", "twitter"],
    "podcast": ["podcast", "audio", "episode", "listen", "transcript"],
    "diet-lunchbox": ["diet", "meal", "calorie", "nutrition", "lunch", "food log"],
    "data-ai": ["data", "analytics", "dashboard", "ai", "tracking", "metrics"],
    "content-marketing": ["content", "blog", "seo", "newsletter", "writing", "marketing"],
    "restaurant-hunt": ["restaurant", "dining", "food map", "review", "local", "food"],
    "logistics-delivery": ["logistics", "delivery", "shipping", "courier", "tracking", "parcel"],
    "movie": ["movie", "film", "cinema", "watch", "review"],
    "climbing": ["climb", "climbing", "bouldering", "gym", "sport"],
    "crm-email": ["crm", "email", "sales", "lead", "outreach", "contact"],
    "reading": ["read", "reading", "book", "library", "ebook", "highlight"],
}
FMT_KW = {
    "streak-tracker": ["track", "streak", "log", "habit", "daily"],
    "calc-tool": ["calculator", "checklist", "quiz", "assessment", "score"],
    "vote-card": ["vote", "poll", "reaction", "feedback", "rating"],
    "curation": ["curated", "list", "directory", "collection", "filter", "compare"],
    "crud-app": ["manage", "tracker", "organizer", "simple app", "dashboard"],
    "dashboard": ["dashboard", "analytics", "report", "metrics", "monitor"],
    "template-gen": ["template", "generator", "boilerplate", "generate", "builder"],
    "digest-bot": ["digest", "summary", "alert", "notification", "bot", "monitor"],
    "share-link": ["share", "link", "page", "public", "shareable"],
}

def load_ideas():
    out = []
    with open(os.path.join(ROOT, "research/trustmrr-acquire/ideas.jsonl")) as f:
        for line in f:
            try: x = json.loads(line)
            except: continue
            rev = x.get("revenue_30d_value") or 0
            if rev < 200: continue
            blob = " ".join(str(x.get(k, "")) for k in ["name", "category", "raw_description", "problem", "target_user"]).lower()
            out.append({
                "name": x.get("name"), "revenue30dUsd": rev, "revenueText": x.get("revenue_30d_text"),
                "category": x.get("category"), "description": (x.get("raw_description") or "")[:180],
                "problem": (x.get("problem") or "")[:150], "_blob": blob,
            })
    return out

def score(idea, kws_seed, kws_fmt):
    b = idea["_blob"]
    s = 2 * sum(1 for k in kws_seed if k in b) + 1 * sum(1 for k in kws_fmt if k in b)
    return s

def clean(idea):
    return {k: idea[k] for k in ["name", "revenue30dUsd", "revenueText", "category", "description", "problem"]}

def main():
    ideas = load_ideas()
    samples = json.load(open(os.path.join(CQ, "samples.json")))
    # 범용 폴백 풀: 트래커·리스트·대시보드·툴 계열 고매출 20
    GEN = ["track", "tracker", "dashboard", "list", "template", "checklist", "tool", "app", "manage", "log"]
    fb = sorted([i for i in ideas if any(g in i["_blob"] for g in GEN)], key=lambda i: -i["revenue30dUsd"])
    fallback_pool = []
    seen = set()
    for i in fb:
        if i["name"] in seen: continue
        seen.add(i["name"]); fallback_pool.append(i)
        if len(fallback_pool) >= 20: break

    rows = []
    for r in samples["rows"]:
        sid, fid = r["seed"]["id"], r["format"]["id"]
        kws_seed = SEED_KW.get(sid, [sid.replace("-", " ")])
        kws_fmt = FMT_KW.get(fid, [])
        scored = sorted(((score(i, kws_seed, kws_fmt), -i["revenue30dUsd"], i) for i in ideas), key=lambda t: (t[0], t[1]), reverse=False)
        scored = sorted(ideas, key=lambda i: (score(i, kws_seed, kws_fmt), i["revenue30dUsd"]), reverse=True)
        cands, seen_n = [], set()
        for i in scored:
            sc = score(i, kws_seed, kws_fmt)
            if sc < 1: break
            if i["name"] in seen_n: continue
            seen_n.add(i["name"]); c = clean(i); c["matchScore"] = sc; cands.append(c)
            if len(cands) >= 4: break
        strong = [c for c in cands if c["matchScore"] >= 3]
        fallback_used = len(strong) < 3
        if fallback_used:
            for i in fallback_pool:
                if i["name"] in seen_n: continue
                seen_n.add(i["name"]); c = clean(i); c["matchScore"] = 0; cands.append(c)
                if len(cands) >= 4: break
        rows.append({"id": r["id"], "seedId": sid, "candidates": cands[:4], "fallbackUsed": fallback_used})

    json.dump({"rows": rows}, open(os.path.join(CQ, "anchors.json"), "w"), ensure_ascii=False, indent=1)
    nfb = sum(1 for r in rows if r["fallbackUsed"])
    print(f"OK {len(rows)}행 앵커 · 폴백 사용 {nfb}행")
    for r in rows:
        names = " / ".join(f"{c['name']}({c['revenueText']},s{c['matchScore']})" for c in r["candidates"])
        print(f"  {r['id']} {r['seedId']}{' [FB]' if r['fallbackUsed'] else ''}: {names}")

if __name__ == "__main__":
    main()
