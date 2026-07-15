#!/usr/bin/env python3
"""Exhaustively judge Idea Lab source rows with a local, resumable model pass.

The model only produces compact mechanism phrases and a decision. This script
turns those phrases into the same five-sentence evidence shape for every row,
then runs a separate rejection-rescue pass before a batch can be marked passed.
No runtime application request uses this model; it is an offline corpus audit.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
import time
from pathlib import Path
from typing import Any

from mlx_lm import generate, load
from mlx_lm.sample_utils import make_sampler


ROOT = Path.cwd()
LEDGER = ROOT / "docs/research/idea-source-final-ledger.jsonl"
PORTFOLIO = ROOT / "docs/research/idea-app-portfolio.json"
APP_ENRICHMENT = ROOT / "docs/research/source-enrichment/app-store-lookup.jsonl"
DECISION_DIR = ROOT / "docs/research/idea-source-batch-decisions"
AUDIT_DIR = ROOT / "docs/research/idea-source-batch-audits"
DEFAULT_MODEL = "mlx-community/Qwen3-4B-Instruct-2507-4bit"

DECISION_MAP = {"C": "Candidate", "M": "Merge", "R": "Reserve", "F": "Fail"}
ALLOWED_CODES = {
    "candidate_vertical_slice",
    "portfolio_merge",
    "custom_domain",
    "platform_default",
    "commodity_ai",
    "counterparty_required",
    "pre_event_capture",
    "input_unrealistic",
    "scope_too_large",
    "regulated_platform",
    "marketplace_dependency",
    "content_not_tool",
    "service_wrapper",
    "insufficient_mechanism",
}

SYSTEM_PROMPT = """당신은 '오늘 해볼까'의 오프라인 원본 심사자다. 경쟁 제품이 있다는 이유로 탈락시키지 않는다. 각 원본의 실제 입력→처리→즉시 결과를 찾고, 한국 사용자가 문제가 생긴 뒤 찾아와도 작동하는 반나절~2일 세로 조각이 있는지 판정한다. 브랜드명·고유 카피·에셋 복제는 금지하지만 제품 메커니즘 복제는 허용한다. 반드시 요청받은 JSON 배열만 출력하고 설명이나 마크다운을 덧붙이지 않는다."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--batch", action="append", default=[])
    parser.add_argument("--start-batch", type=int, default=2)
    parser.add_argument("--end-batch", type=int, default=85)
    parser.add_argument("--chunk-size", type=int, default=40)
    parser.add_argument("--max-tokens", type=int, default=6000)
    parser.add_argument("--seed", type=int, default=20260714)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    # JSON strings from App Store can contain U+2028. str.splitlines() treats
    # that valid in-string character as a record break, so split only on LF.
    return [json.loads(line) for line in path.read_text(encoding="utf-8").split("\n") if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def compact(value: Any, limit: int = 1200) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def sentence(label: str, phrase: str) -> str:
    normalized = compact(phrase, 240).rstrip(".!?。")
    return f"{label}은 {normalized}."


def source_payload(row: dict[str, Any], enrichment: dict[str, dict[str, Any]]) -> dict[str, Any]:
    extra = enrichment.get(row["source_id"], {}) if row["dataset"] == "app_store" else {}
    enriched = compact(extra.get("description"), 1300)
    original = compact(row.get("source_text"), 1300)
    market = row.get("market_signal") or {}
    return {
        "i": None,
        "key": row["key"],
        "name": row["name"],
        "dataset": row["dataset"],
        "category": row.get("category"),
        "description": enriched or original,
        "market": market,
        "risk_tags": row.get("initial_risk_tags") or [],
    }


def portfolio_text(portfolio: list[dict[str, Any]]) -> str:
    return "\n".join(
        f"- {item['id']} | {item['source_name']} | {item['flow']} | 결과: {', '.join(item['result_titles'])}"
        for item in portfolio
    )


def extract_json_array(text: str) -> list[Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*(\[.*\])\s*```", cleaned, flags=re.S)
    if fence:
        cleaned = fence.group(1)
    else:
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"JSON array not found: {cleaned[:300]}")
        cleaned = cleaned[start : end + 1]
    result = json.loads(cleaned)
    if not isinstance(result, list):
        raise ValueError("Model output is not an array")
    return result


class LocalJudge:
    def __init__(self, model_name: str):
        print(f"Loading local judge: {model_name}", flush=True)
        self.model, self.tokenizer = load(model_name)
        self.sampler = make_sampler(temp=0.0)

    def ask(self, prompt: str, max_tokens: int) -> list[Any]:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
        rendered = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
        response = generate(
            self.model,
            self.tokenizer,
            prompt=rendered,
            max_tokens=max_tokens,
            sampler=self.sampler,
            verbose=False,
        )
        (Path("/tmp") / "idea-judge-last-response.txt").write_text(response, encoding="utf-8")
        return extract_json_array(response)


def classification_prompt(items: list[dict[str, Any]], portfolio: str) -> str:
    indexed = []
    for index, item in enumerate(items):
        payload = dict(item)
        payload["i"] = index
        indexed.append(payload)
    return f"""아래 원본 {len(items)}개를 각각 판정하라.

판정:
- C Candidate: 텍스트·URL·파일·사진·단일 기기 권한으로 받고, 1회 처리해 구체적 결과 하나를 주는 2일 MVP가 자연스럽다.
- M Merge: 아래 현재 앱 원본과 입력·처리·결과가 실질적으로 같아 그 원본의 결제자·순간·한 끗 카드 재료로 흡수한다. 단순히 같은 카테고리라는 이유로 Merge하지 않는다.
- R Reserve: 관련 도메인 지식이나 기존 고객 채널이 있는 커스텀 요청에서만 가치가 생긴다.
- F Fail: OS/플랫폼 기본 기능이나 범용 AI 한 번이 더 편함, 상대방 신규 행동 필수, 사전 설치·누적 데이터 필수, 입력 확보 불가, 규제 기관 결과 의존, 마켓플레이스/대형 콘텐츠/상시 운영 전체, 정적 콘텐츠, 대행 서비스 포털, 설명으로 메커니즘 확인 불가 중 하나다.

가장 중요한 규칙:
1. 경쟁 앱 존재는 실패 이유가 아니다.
2. Shopify/n8n 같은 해외 맥락은 네이버 스마트스토어·구글 시트·카카오 등 한국 입력으로 좁힐 수 있으면 C 또는 M 가능하다.
3. 범위가 커도 입력 1개→처리 1회→결과 1개로 가치가 남으면 C다.
4. 필요한 순간 뒤에 설치해도 작동해야 한다. 사고 전 기록이 필수면 F다.
5. 제목만 바꾼 동일 아이디어는 M이다.

코드:
C=candidate_vertical_slice
M=portfolio_merge
R=custom_domain
F=platform_default|commodity_ai|counterparty_required|pre_event_capture|input_unrealistic|scope_too_large|regulated_platform|marketplace_dependency|content_not_tool|service_wrapper|insufficient_mechanism

현재 앱 52개:
{portfolio}

출력은 입력 순서대로 정확히 {len(items)}행인 JSON 배열이다. 각 행 형식:
[i,"C|M|R|F","code","구체적 입력 명사구","구체적 처리 명사구","구체적 즉시 결과 명사구","한국 사용자가 찾는 구체적 순간","판정 이유 한 문장","M일 때 앱 scenario id 아니면 빈 문자열"]
각 명사구는 16단어 이하로 쓰고 뻔한 표현을 피한다.

원본:
{json.dumps(indexed, ensure_ascii=False, separators=(',', ':'))}
"""


def validate_classifications(raw: list[Any], expected: int) -> list[list[Any]]:
    if raw and not isinstance(raw[0], list) and len(raw) == expected * 9:
        raw = [raw[index : index + 9] for index in range(0, len(raw), 9)]
    if len(raw) != expected:
        raise ValueError(f"Expected {expected} rows, got {len(raw)}")
    by_index: dict[int, list[Any]] = {}
    for entry in raw:
        if not isinstance(entry, list) or len(entry) != 9:
            raise ValueError(f"Invalid classification row: {entry!r}")
        index = int(entry[0])
        decision = str(entry[1]).upper()
        code = str(entry[2])
        if decision not in DECISION_MAP or code not in ALLOWED_CODES:
            raise ValueError(f"Invalid decision/code: {entry!r}")
        expected_code = {
            "C": "candidate_vertical_slice",
            "M": "portfolio_merge",
            "R": "custom_domain",
        }.get(decision)
        if expected_code and code != expected_code:
            raise ValueError(f"Decision/code mismatch: {entry!r}")
        by_index[index] = entry
    if set(by_index) != set(range(expected)):
        raise ValueError(f"Missing or duplicate indexes: {sorted(by_index)}")
    return [by_index[index] for index in range(expected)]


def classify_chunk(
    judge: LocalJudge,
    items: list[dict[str, Any]],
    portfolio: str,
    max_tokens: int,
) -> list[list[Any]]:
    try:
        return validate_classifications(
            judge.ask(classification_prompt(items, portfolio), min(max_tokens, len(items) * 110 + 200)),
            len(items),
        )
    except Exception as error:
        if len(items) == 1:
            raise RuntimeError(f"Single-row classification failed for {items[0]['key']}: {error}") from error
        midpoint = len(items) // 2
        print(f"  retry split {len(items)} -> {midpoint}+{len(items)-midpoint}: {error}", flush=True)
        return classify_chunk(judge, items[:midpoint], portfolio, max_tokens) + classify_chunk(
            judge, items[midpoint:], portfolio, max_tokens
        )


def decision_record(source: dict[str, Any], entry: list[Any], review_source: str) -> dict[str, Any]:
    _, short_decision, code, input_phrase, process, result, moment, reason, matched = entry
    decision = DECISION_MAP[str(short_decision).upper()]
    matched_id = compact(matched, 100) or None
    normalized_reason = compact(reason, 500)
    if decision == "Merge" and matched_id:
        normalized_reason = f"기존 앱 원본 {matched_id}와 입력·처리·즉시 결과가 겹친다. {normalized_reason}"
    return {
        "batch_id": source["batch_id"],
        "batch_position": source["batch_position"],
        "key": source["key"],
        "dataset": source["dataset"],
        "source_id": source["source_id"],
        "name": source["name"],
        "five_sentences": {
            "input": sentence("구체적인 입력", str(input_phrase)),
            "process": sentence("핵심 처리", str(process)),
            "immediate_result": sentence("즉시 결과", str(result)),
            "need_moment": sentence("필요한 순간", str(moment)),
            "advantage": sentence("기존 대안과 비교한 판정 근거", normalized_reason),
        },
        "decision": decision,
        "decision_reason": normalized_reason,
        "rejection_code": code if decision == "Fail" else None,
        "matched_scenario_id": matched_id if decision == "Merge" else None,
        "reviewed_at": "2026-07-14",
        "review_source": review_source,
        "local_model": DEFAULT_MODEL,
    }


def rescue_prompt(items: list[dict[str, Any]], portfolio: str) -> str:
    compact_items = []
    for index, item in enumerate(items):
        compact_items.append({
            "i": index,
            "key": item["key"],
            "name": item["name"],
            "source_text": item.get("source_text"),
            "previous_fail_code": item.get("rejection_code"),
        })
    return f"""아래는 1차에서 Fail이 된 원본의 탈락 오판 검사다. 이전 결론을 옹호하지 말고, 문제가 생긴 뒤 사용자가 가져올 수 있는 입력 하나로 2일 안에 만들 수 있는 세로 조각을 적극적으로 찾아라. 경쟁 제품 존재는 실패가 아니다. Shopify는 스마트스토어로, 복잡한 자동화는 시트·URL·파일 한 개로 좁혀도 된다. 그래도 OS 기본 기능·범용 AI·상대 행동·사전 기록·규제/기관 결과·마켓플레이스·대형 콘텐츠·상시 계정 운영이 핵심이면 keep이다.

현재 앱 52개:
{portfolio}

정확히 {len(items)}행 JSON 배열만 출력:
[i,"keep|rescue","C|M|R|F","code","짧고 구체적인 이유","M이면 scenario id 아니면 빈 문자열"]
keep이면 결정은 F와 기존 Fail code를 유지한다. rescue이면 C/M/R 중 하나와 각 코드(candidate_vertical_slice/portfolio_merge/custom_domain)를 쓴다.

원본:
{json.dumps(compact_items, ensure_ascii=False, separators=(',', ':'))}
"""


def validate_rescue(raw: list[Any], expected: int) -> list[list[Any]]:
    if raw and not isinstance(raw[0], list) and len(raw) == expected * 6:
        raw = [raw[index : index + 6] for index in range(0, len(raw), 6)]
    if len(raw) != expected:
        raise ValueError(f"Expected {expected} audit rows, got {len(raw)}")
    by_index: dict[int, list[Any]] = {}
    for entry in raw:
        if not isinstance(entry, list) or len(entry) != 6:
            raise ValueError(f"Invalid rescue row: {entry!r}")
        index = int(entry[0])
        action = str(entry[1]).lower()
        decision = str(entry[2]).upper()
        code = str(entry[3])
        if action not in {"keep", "rescue"}:
            raise ValueError(f"Invalid rescue action: {entry!r}")
        if action == "keep" and (decision != "F" or code not in ALLOWED_CODES):
            raise ValueError(f"Invalid keep row: {entry!r}")
        if action == "rescue" and decision not in {"C", "M", "R"}:
            raise ValueError(f"Invalid rescue decision: {entry!r}")
        by_index[index] = entry
    if set(by_index) != set(range(expected)):
        raise ValueError("Missing rescue indexes")
    return [by_index[index] for index in range(expected)]


def ask_rescue(judge: LocalJudge, items: list[dict[str, Any]], portfolio: str, max_tokens: int) -> list[list[Any]]:
    try:
        return validate_rescue(
            judge.ask(rescue_prompt(items, portfolio), min(max_tokens, len(items) * 70 + 160)),
            len(items),
        )
    except Exception as error:
        if len(items) == 1:
            raise RuntimeError(f"Single-row rescue failed: {items[0]['key']}: {error}") from error
        midpoint = len(items) // 2
        return ask_rescue(judge, items[:midpoint], portfolio, max_tokens) + ask_rescue(
            judge, items[midpoint:], portfolio, max_tokens
        )


def audit_source(row: dict[str, Any], ledger_by_key: dict[str, dict[str, Any]]) -> dict[str, Any]:
    source = ledger_by_key[row["key"]]
    return {
        **row,
        "source_text": source["source_text"],
    }


def apply_rescues(
    decisions: list[dict[str, Any]],
    targets: list[dict[str, Any]],
    rescue_rows: list[list[Any]],
) -> list[dict[str, Any]]:
    by_key = {row["key"]: row for row in decisions}
    for target, rescue in zip(targets, rescue_rows):
        _, action, short_decision, code, reason, matched = rescue
        if str(action).lower() != "rescue":
            continue
        previous = by_key[target["key"]]
        updated = dict(previous)
        decision = DECISION_MAP[str(short_decision).upper()]
        normalized_reason = compact(reason, 500)
        matched_id = compact(matched, 100) or None
        if decision == "Merge" and matched_id:
            normalized_reason = f"기존 앱 원본 {matched_id}와 입력·처리·즉시 결과가 겹친다. {normalized_reason}"
        updated.update({
            "decision": decision,
            "decision_reason": normalized_reason,
            "rejection_code": None,
            "matched_scenario_id": matched_id if decision == "Merge" else None,
            "review_source": "local_qwen3_4b_fail_rescue",
        })
        updated["five_sentences"] = {
            **previous["five_sentences"],
            "advantage": sentence("기존 대안과 비교한 판정 근거", normalized_reason),
        }
        by_key[target["key"]] = updated
    return [by_key[row["key"]] for row in decisions]


def deterministic_sample(rows: list[dict[str, Any]], count: int, seed_text: str) -> list[dict[str, Any]]:
    seed = int(hashlib.sha256(seed_text.encode()).hexdigest()[:16], 16)
    rng = random.Random(seed)
    indexes = sorted(rng.sample(range(len(rows)), min(count, len(rows))))
    return [rows[index] for index in indexes]


def decision_counts(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["decision"]] = counts.get(row["decision"], 0) + 1
    return counts


def run_batch(
    judge: LocalJudge,
    batch_id: str,
    sources: list[dict[str, Any]],
    existing: list[dict[str, Any]],
    enrichment: dict[str, dict[str, Any]],
    portfolio: str,
    chunk_size: int,
    max_tokens: int,
    seed: int,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    existing_by_key = {row["key"]: row for row in existing}
    pending = [row for row in sources if row["key"] not in existing_by_key and row["review_state"] != "finalized"]
    decisions = list(existing)
    print(f"{batch_id}: judge {len(pending)} pending rows", flush=True)
    for start in range(0, len(pending), chunk_size):
        chunk = pending[start : start + chunk_size]
        payloads = [source_payload(row, enrichment) for row in chunk]
        entries = classify_chunk(judge, payloads, portfolio, max_tokens)
        decisions.extend(
            decision_record(row, entry, "local_qwen3_4b_exhaustive_review")
            for row, entry in zip(chunk, entries)
        )
        print(f"  classified {min(start + len(chunk), len(pending))}/{len(pending)}", flush=True)

    by_key = {row["key"]: row for row in decisions}
    ordered = [by_key[row["key"]] for row in sources if row["review_state"] != "finalized"]
    ledger_by_key = {row["key"]: row for row in sources}
    audit_rounds = []

    for round_index in range(1, 7):
        fails = [row for row in ordered if row["decision"] == "Fail"]
        if not fails:
            audit_rounds.append({"round": round_index, "fail_count": 0, "sample": [], "rescues": []})
            break
        sample_count = max(1, (len(fails) + 9) // 10)
        sample = deterministic_sample(fails, sample_count, f"{seed}:{batch_id}:{round_index}")
        sample_inputs = [audit_source(row, ledger_by_key) for row in sample]
        sample_results = ask_rescue(judge, sample_inputs, portfolio, max_tokens)
        rescues = [
            {"key": row["key"], "result": result}
            for row, result in zip(sample, sample_results)
            if str(result[1]).lower() == "rescue"
        ]
        audit_rounds.append({
            "round": round_index,
            "fail_count": len(fails),
            "sample": [row["key"] for row in sample],
            "rescues": rescues,
            "false_reject_rate": len(rescues) / len(sample),
        })
        print(f"  shadow audit round {round_index}: {len(rescues)}/{len(sample)} rescues", flush=True)
        if not rescues:
            break

        all_fail_inputs = [audit_source(row, ledger_by_key) for row in fails]
        all_results: list[list[Any]] = []
        for start in range(0, len(all_fail_inputs), chunk_size):
            all_results.extend(ask_rescue(
                judge,
                all_fail_inputs[start : start + chunk_size],
                portfolio,
                max_tokens,
            ))
        ordered = apply_rescues(ordered, fails, all_results)

    final_round = audit_rounds[-1]
    status = "passed" if not final_round.get("rescues") else "failed"
    audit = {
        "batch_id": batch_id,
        "status": status,
        "reviewed_at": "2026-07-14",
        "method": "local Qwen3 4B exhaustive mechanism review + independent fail-rescue prompts",
        "threshold": "false reject rate < 5%",
        "source_rows": len(sources),
        "decision_rows": len(ordered),
        "decision_counts": decision_counts(ordered),
        "rounds": audit_rounds,
        "final_false_reject_rate": final_round.get("false_reject_rate", 0),
    }
    return ordered, audit


def main() -> int:
    args = parse_args()
    ledger = read_jsonl(LEDGER)
    portfolio = json.loads(PORTFOLIO.read_text(encoding="utf-8"))
    portfolio_rendered = portfolio_text(portfolio)
    enrichment_rows = read_jsonl(APP_ENRICHMENT)
    enrichment = {str(row["app_id"]): row for row in enrichment_rows}

    if args.batch:
        selected = set(args.batch)
    else:
        selected = {f"EXH-{index:03d}" for index in range(args.start_batch, args.end_batch + 1)}
    selected_rows = [row for row in ledger if row["batch_id"] in selected]
    batch_ids = sorted({row["batch_id"] for row in selected_rows})
    print(json.dumps({
        "selected_batches": batch_ids,
        "source_rows": len(selected_rows),
        "app_enrichment_rows": len(enrichment),
        "portfolio_scenarios": len(portfolio),
        "dry_run": args.dry_run,
    }, ensure_ascii=False, indent=2), flush=True)
    if args.dry_run:
        return 0

    judge = LocalJudge(args.model)
    completed = 0
    started = time.time()
    for batch_id in batch_ids:
        sources = sorted(
            [row for row in ledger if row["batch_id"] == batch_id],
            key=lambda row: row["batch_position"],
        )
        decision_path = DECISION_DIR / f"{batch_id}.jsonl"
        audit_path = AUDIT_DIR / f"{batch_id}.json"
        existing = read_jsonl(decision_path)
        if audit_path.exists():
            prior_audit = json.loads(audit_path.read_text(encoding="utf-8"))
            expected = sum(1 for row in sources if row["review_state"] != "finalized")
            if prior_audit.get("status") == "passed" and len(existing) == expected:
                print(f"{batch_id}: already complete", flush=True)
                completed += 1
                continue

        decisions, audit = run_batch(
            judge,
            batch_id,
            sources,
            existing,
            enrichment,
            portfolio_rendered,
            args.chunk_size,
            args.max_tokens,
            args.seed,
        )
        write_jsonl(decision_path, decisions)
        AUDIT_DIR.mkdir(parents=True, exist_ok=True)
        audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if audit["status"] != "passed":
            print(f"{batch_id}: audit failed; stopping", file=sys.stderr)
            return 2
        completed += 1
        elapsed = time.time() - started
        print(f"{batch_id}: complete {completed}/{len(batch_ids)} ({elapsed/60:.1f} min)", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
