#!/usr/bin/env python3
"""Build a non-destructive semantic-neighbor review list for Candidate rows.

This script never changes the final decision ledger and never auto-promotes or
auto-merges a Candidate. It only emits high-similarity edges and conservative
provisional components for human review.
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np


DEFAULT_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="docs/research/idea-source-final-ledger.jsonl")
    parser.add_argument("--output", default="docs/research/idea-candidate-semantic-edges-2026-07-14.jsonl")
    parser.add_argument("--summary", default="docs/dev/experiments/idea-lab/candidate-semantic-cluster-summary-2026-07-14.json")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--top-k", type=int, default=8)
    parser.add_argument("--review-percentile", type=float, default=99.9)
    parser.add_argument("--component-percentile", type=float, default=99.99)
    return parser.parse_args()


def read_jsonl(path):
    return [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]


def normalize(value):
    return re.sub(r"[^0-9a-z가-힣]+", "", str(value or "").lower())


def source_text(row):
    five = row.get("five_sentences") or {}
    return " ".join(
        [
            str(row.get("name") or ""),
            str(five.get("input") or ""),
            str(five.get("process") or ""),
            str(five.get("immediate_result") or ""),
            str(five.get("need_moment") or ""),
        ]
    )


def normalize_vectors(vectors):
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / np.clip(norms, 1e-12, None)


def union_find(size):
    parent = list(range(size))

    def find(item):
        while parent[item] != item:
            parent[item] = parent[parent[item]]
            item = parent[item]
        return item

    def union(left, right):
        left_root, right_root = find(left), find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    return parent, find, union


def main():
    cli = args()
    rows = [row for row in read_jsonl(cli.input) if row.get("decision") == "Candidate"]
    if not rows:
        raise SystemExit("No Candidate rows found.")

    from fastembed import TextEmbedding

    model = TextEmbedding(model_name=cli.model)
    vectors = np.asarray(list(model.embed([source_text(row) for row in rows], batch_size=cli.batch_size)), dtype=np.float32)
    vectors = normalize_vectors(vectors)
    similarities = vectors @ vectors.T
    np.fill_diagonal(similarities, -1.0)

    upper = similarities[np.triu_indices(len(rows), k=1)]
    review_threshold = float(np.percentile(upper, cli.review_percentile))
    component_threshold = float(np.percentile(upper, cli.component_percentile))
    parent, find, union = union_find(len(rows))
    edges = []
    seen = set()

    for index in range(len(rows)):
        neighbors = np.argpartition(similarities[index], -cli.top_k)[-cli.top_k:]
        for neighbor in neighbors:
            if neighbor == index:
                continue
            left, right = sorted((index, int(neighbor)))
            pair = (left, right)
            similarity = float(similarities[left, right])
            if pair in seen or similarity < review_threshold:
                continue
            seen.add(pair)
            component = similarity >= component_threshold
            if component:
                union(left, right)
            edges.append(
                {
                    "left_key": rows[left]["key"],
                    "left_name": rows[left]["name"],
                    "right_key": rows[right]["key"],
                    "right_name": rows[right]["name"],
                    "cosine_similarity": round(similarity, 6),
                    "review_threshold": round(review_threshold, 6),
                    "component_threshold": round(component_threshold, 6),
                    "provisional_component": component,
                    "status": "human_review_required",
                }
            )

    components = {}
    for index, row in enumerate(rows):
        root = find(index)
        components.setdefault(root, []).append(row["key"])
    provisional_components = [members for members in components.values() if len(members) > 1]

    output = Path(cli.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("".join(json.dumps(edge, ensure_ascii=False) + "\n" for edge in edges), encoding="utf-8")
    summary = {
        "status": "ok",
        "candidateRows": len(rows),
        "model": cli.model,
        "dimension": int(vectors.shape[1]),
        "reviewPercentile": cli.review_percentile,
        "componentPercentile": cli.component_percentile,
        "reviewThreshold": round(review_threshold, 6),
        "componentThreshold": round(component_threshold, 6),
        "reviewEdges": len(edges),
        "provisionalComponents": len(provisional_components),
        "provisionalComponentRows": sum(len(group) for group in provisional_components),
        "note": "Edges and components are provisional; no final ledger row was changed.",
    }
    summary_path = Path(cli.summary)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({**summary, "output": str(output), "summary": str(summary_path)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
