#!/usr/bin/env python3
import json
import math
from pathlib import Path

import numpy as np
from fastembed import TextEmbedding


ROOT = Path.cwd()
OUTPUT = ROOT / "docs/research/idea-source-embedding-scores.jsonl"
MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CACHE = Path.home() / ".cache/idea-embeddings"


def read_jsonl(relative_path):
    with (ROOT / relative_path).open() as handle:
        return [json.loads(line) for line in handle if line.strip()]


def compact_text(*values):
    parts = []
    for value in values:
        if value is None:
            continue
        if isinstance(value, list):
            parts.extend(str(item) for item in value if item not in (None, ""))
        elif value != "":
            parts.append(str(value))
    return " ".join(" ".join(parts).split())


coverage = read_jsonl("docs/research/idea-source-coverage.jsonl")
coverage_by_key = {
    f"{row['dataset']}:{row['source_id']}": row for row in coverage
}

records = []
for row in read_jsonl("docs/research/trustmrr-acquire/ideas.jsonl"):
    key = f"trustmrr:{row['slug']}"
    records.append({
        "key": key,
        "text": compact_text(
            row.get("name"), row.get("category"), row.get("raw_description"),
            row.get("target_user"), row.get("problem"), row.get("current_alternative"),
            row.get("tags"),
        ),
        "canary": bool(coverage_by_key[key].get("matched_scenario_ids")),
    })

for row in read_jsonl("docs/research/store-rankings/app-store-expanded-unique-apps.jsonl"):
    key = f"app_store:{row['app_id']}"
    records.append({
        "key": key,
        "text": compact_text(row.get("name"), row.get("categories"), row.get("queries"), row.get("description")),
        "canary": bool(coverage_by_key[key].get("matched_scenario_ids")),
    })

for row in read_jsonl("docs/research/store-rankings/chrome-webstore-expanded-unique-extensions.jsonl"):
    key = f"chrome_web_store:{row['extension_id']}"
    records.append({
        "key": key,
        "text": compact_text(row.get("name"), row.get("source_slugs"), row.get("queries"), row.get("description")),
        "canary": bool(coverage_by_key[key].get("matched_scenario_ids")),
    })

if len(records) != 8406:
    raise RuntimeError(f"Expected 8406 records, got {len(records)}")

decisions = read_jsonl("docs/research/idea-final-decisions-62.jsonl")
pass_cases = [
    compact_text(row["title"], row["reason"])
    for row in decisions if row["final_status"] == "Experiment Pass"
]
fail_cases = [
    compact_text(row["title"], row["reason"])
    for row in decisions if row["final_status"] == "Fail"
]
merge_cases = [
    compact_text(row["title"], row["reason"])
    for row in decisions if row["final_status"] == "Merge"
]

model = TextEmbedding(model_name=MODEL, cache_dir=str(CACHE))
all_texts = [record["text"] for record in records] + pass_cases + fail_cases + merge_cases
vectors = np.asarray(list(model.embed(all_texts, batch_size=128)), dtype=np.float32)
vectors /= np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-12)

corpus_vectors = vectors[: len(records)]
offset = len(records)
pass_vectors = vectors[offset : offset + len(pass_cases)]
offset += len(pass_cases)
fail_vectors = vectors[offset : offset + len(fail_cases)]
offset += len(fail_cases)
merge_vectors = vectors[offset : offset + len(merge_cases)]

canary_indices = np.asarray([index for index, record in enumerate(records) if record["canary"]])
if len(canary_indices) == 0:
    raise RuntimeError("Expected at least one in-app source canary")

current_matrix = corpus_vectors @ corpus_vectors[canary_indices].T
for anchor_position, corpus_index in enumerate(canary_indices):
    current_matrix[corpus_index, anchor_position] = -1.0
current_similarity = current_matrix.max(axis=1)

pass_matrix = corpus_vectors @ pass_vectors.T
fail_matrix = corpus_vectors @ fail_vectors.T
merge_matrix = corpus_vectors @ merge_vectors.T
pass_similarity = pass_matrix.max(axis=1)
fail_similarity = fail_matrix.max(axis=1)
merge_similarity = merge_matrix.max(axis=1)
decision_margin = pass_similarity - fail_similarity

with OUTPUT.open("w") as handle:
    for index, record in enumerate(records):
        nearest_pass = int(np.argmax(pass_matrix[index]))
        nearest_fail = int(np.argmax(fail_matrix[index]))
        nearest_merge = int(np.argmax(merge_matrix[index]))
        payload = {
            "key": record["key"],
            "model": MODEL,
            "current_similarity_loo": round(float(current_similarity[index]), 6),
            "pass_similarity": round(float(pass_similarity[index]), 6),
            "fail_similarity": round(float(fail_similarity[index]), 6),
            "merge_similarity": round(float(merge_similarity[index]), 6),
            "decision_margin": round(float(decision_margin[index]), 6),
            "nearest_pass_id": [row["id"] for row in decisions if row["final_status"] == "Experiment Pass"][nearest_pass],
            "nearest_fail_id": [row["id"] for row in decisions if row["final_status"] == "Fail"][nearest_fail],
            "nearest_merge_id": [row["id"] for row in decisions if row["final_status"] == "Merge"][nearest_merge],
        }
        handle.write(json.dumps(payload, ensure_ascii=False) + "\n")

print(json.dumps({
    "output": str(OUTPUT.relative_to(ROOT)),
    "records": len(records),
    "model": MODEL,
    "canaries": len(canary_indices),
    "pass_cases": len(pass_cases),
    "fail_cases": len(fail_cases),
    "merge_cases": len(merge_cases),
}, ensure_ascii=False, indent=2))
