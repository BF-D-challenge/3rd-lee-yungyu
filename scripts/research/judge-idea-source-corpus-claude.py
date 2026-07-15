#!/usr/bin/env python3
"""High-quality exhaustive source review through resumable structured Claude passes.

One fresh pass judges every unresolved source in a 100-row batch. A second,
context-isolated pass rechecks a deterministic 10% sample of Fail decisions.
If it finds a plausible rescue, the full Fail set is re-read before the batch
can be marked complete. Outputs remain offline research data; the app never
calls a model at runtime.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import subprocess
import time
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
LEDGER = ROOT / "docs/research/idea-source-final-ledger.jsonl"
PORTFOLIO = ROOT / "docs/research/idea-app-portfolio.json"
DECISION_DIR = ROOT / "docs/research/idea-source-batch-decisions"
AUDIT_DIR = ROOT / "docs/research/idea-source-batch-audits"

DECISIONS = ["Candidate", "Merge", "Reserve", "Fail"]
CODES = [
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
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="sonnet")
    parser.add_argument("--audit-model", default="sonnet")
    parser.add_argument("--batch", action="append", default=[])
    parser.add_argument("--start-batch", type=int, default=2)
    parser.add_argument("--end-batch", type=int, default=85)
    parser.add_argument("--seed", type=int, default=20260714)
    parser.add_argument(
        "--review-chunk-size",
        type=int,
        default=25,
        help="Maximum sources per model call; smaller chunks survive long Fail re-reviews.",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--replace-local", action="store_true")
    return parser.parse_args()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").split("\n") if line.strip()]


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")


def compact(value: Any, limit: int = 1500) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def schema() -> dict[str, Any]:
    return {
        "type": "object",
        "properties": {
            "rows": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "i": {"type": "integer"},
                        "decision": {"type": "string", "enum": DECISIONS},
                        "code": {"type": "string", "enum": CODES},
                        "input_phrase": {"type": "string"},
                        "process_phrase": {"type": "string"},
                        "result_phrase": {"type": "string"},
                        "moment_phrase": {"type": "string"},
                        "reason": {"type": "string"},
                        "matched_scenario_id": {"type": "string"},
                    },
                    "required": [
                        "i", "decision", "code", "input_phrase", "process_phrase",
                        "result_phrase", "moment_phrase", "reason", "matched_scenario_id",
                    ],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["rows"],
        "additionalProperties": False,
    }


SYSTEM = """당신은 '오늘 해볼까'의 오프라인 제품 원본 심사자다. 제공된 원문 밖의 기능을 상상하지 않는다. 경쟁 제품 존재는 실패 이유가 아니며, 해외 제품은 네이버 스마트스토어·카카오·구글 시트 등 한국 입력으로 좁힐 수 있다. 런타임 생성이 아니라 사전 데이터셋 심사다. 요청된 구조화 출력만 반환한다."""


def claude_structured(model: str, prompt: str, attempts: int = 3) -> list[dict[str, Any]]:
    command = [
        "claude", "-p",
        "--model", model,
        "--effort", "low",
        "--no-session-persistence",
        "--disable-slash-commands",
        "--allowedTools", "StructuredOutput",
        "--system-prompt", SYSTEM,
        "--output-format", "json",
        "--json-schema", json.dumps(schema(), ensure_ascii=False, separators=(",", ":")),
    ]
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            completed = subprocess.run(
                command,
                input=prompt,
                text=True,
                capture_output=True,
                cwd=ROOT,
                timeout=600,
            )
            if completed.returncode != 0:
                raise RuntimeError(compact(completed.stderr or completed.stdout, 1200))
            envelope = json.loads(completed.stdout)
            if isinstance(envelope, list):
                result_event = next(
                    event for event in reversed(envelope)
                    if isinstance(event, dict) and event.get("type") == "result"
                )
            else:
                result_event = envelope
            structured = result_event.get("structured_output")
            if structured is None:
                structured = json.loads(result_event["result"])
            rows = structured["rows"]
            if not isinstance(rows, list):
                raise ValueError("structured rows is not an array")
            return rows
        except subprocess.TimeoutExpired:
            last_error = RuntimeError("Claude structured pass timed out after 600 seconds")
        except Exception as error:
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Claude structured pass failed: {last_error}")


def portfolio_text(portfolio: list[dict[str, Any]]) -> str:
    return "\n".join(
        f"- {item['id']}: {item['flow']} => {', '.join(item['result_titles'])}"
        for item in portfolio
    )


def source_payload(row: dict[str, Any], index: int) -> dict[str, Any]:
    return {
        "i": index,
        "key": row["key"],
        "name": row["name"],
        "dataset": row["dataset"],
        "category": row.get("category"),
        "description": compact(row.get("source_text"), 1500),
        "market_signal": row.get("market_signal"),
    }


def review_prompt(rows: list[dict[str, Any]], portfolio: str, purpose: str) -> str:
    payloads = [source_payload(row, index) for index, row in enumerate(rows)]
    return f"""목적: {purpose}

아래 {len(rows)}개 원본을 입력 순서대로 각각 한 번 판정한다.

결정 규칙:
- Candidate / candidate_vertical_slice: 텍스트·URL·파일·사진·단일 기기 권한처럼 현실적인 입력 하나를 받아 1회 처리하고, 제목만 읽어도 문제와 결과가 보이는 산출물 하나를 반나절~2일에 만들 수 있다. 큰 제품도 이 세로 조각에 원본 가치가 남으면 Candidate다.
- Merge / portfolio_merge: 아래 앱 52개 중 하나와 단순 카테고리가 아니라 입력·처리·즉시 결과가 실질적으로 같다. matched_scenario_id를 반드시 실제 id로 쓴다.
- Reserve / custom_domain: 관련 도메인 지식 또는 기존 고객 채널이 있는 커스텀 요청에서만 작동한다. 단지 특정 플랫폼을 쓴다는 이유로 Reserve하지 않는다.
- Fail: 아래 실패 코드 중 가장 직접적인 하나를 쓴다.
  platform_default=OS·플랫폼 기본 기능이 더 직접적
  commodity_ai=고유 검사 기준 없이 범용 AI 한 번이 더 편함
  counterparty_required=상대방·기관의 새로운 행동이 필수
  pre_event_capture=문제 전에 설치·기록해야 하고 그때 유입 방법 없음
  input_unrealistic=필요한 입력·권한을 현실적으로 받을 수 없음
  scope_too_large=대형 콘텐츠·계정 연동·상시 운영 전체가 핵심이고 세로 조각에 가치가 남지 않음
  regulated_platform=규제 기관·금융·의료 시스템이 실제 결과를 소유
  marketplace_dependency=공급자와 수요자 양면이 있어야 결과 발생
  content_not_tool=입력에 따라 계산되는 결과가 없는 정적 콘텐츠
  service_wrapper=소프트웨어가 아니라 대행 인력이 결과를 만듦
  insufficient_mechanism=보강된 설명을 읽어도 입력·처리·즉시 결과를 확인할 수 없음

하드 게이트:
1. 경쟁 앱 존재는 실패가 아니다.
2. Shopify/n8n 맥락은 스마트스토어·구글 시트의 단일 입력으로 로컬화할 수 있으면 살린다.
3. 문제 발생 뒤 설치해도 작동해야 한다.
4. 필요한 입력을 텍스트·URL·파일·사진·단일 기기 권한으로 받아야 한다.
5. 상대·기관이 새 행동을 해야만 결과가 생기면 실패다.
6. 문구만 바꾼 동일 아이디어는 Merge다.
7. Candidate의 reason에는 '입력 → 처리 → 결과' 세로 조각을 구체적으로 쓴다.
8. 모든 phrase는 원문에 근거한 18단어 이하의 구체적인 명사구다. 모르면 추측하지 않는다. 원문이 부족해 Fail이라면 빈칸·'.'·'불명' 대신 '원문에서 확인 가능한 입력 없음'처럼 부족한 사실 자체를 구체적으로 쓴다.

현재 앱 52개:
{portfolio}

원본:
{json.dumps(payloads, ensure_ascii=False, separators=(',', ':'))}
"""


def validate(rows: list[dict[str, Any]], expected: int, portfolio_ids: set[str]) -> list[dict[str, Any]]:
    if len(rows) != expected:
        raise ValueError(f"expected {expected} structured rows, got {len(rows)}")
    by_index: dict[int, dict[str, Any]] = {}
    for row in rows:
        index = int(row["i"])
        decision = row["decision"]
        code = row["code"]
        expected_code = {
            "Candidate": "candidate_vertical_slice",
            "Merge": "portfolio_merge",
            "Reserve": "custom_domain",
        }.get(decision)
        if expected_code and code != expected_code:
            raise ValueError(f"decision/code mismatch at {index}: {decision}/{code}")
        if decision == "Fail" and code in {"candidate_vertical_slice", "portfolio_merge", "custom_domain"}:
            raise ValueError(f"invalid Fail code at {index}: {code}")
        matched = row["matched_scenario_id"].strip()
        if decision == "Merge" and matched not in portfolio_ids:
            raise ValueError(f"unknown Merge scenario at {index}: {matched}")
        if decision != "Merge":
            row["matched_scenario_id"] = ""
        for field in ["input_phrase", "process_phrase", "result_phrase", "moment_phrase", "reason"]:
            value = str(row.get(field) or "").strip()
            normalized = re.sub(r"[\s.。!?]", "", value).lower()
            if len(normalized) < 4 or normalized in {"없음", "미상", "불명", "n/a", "null", "unknown"}:
                raise ValueError(f"insubstantial {field} at {index}: {value!r}")
        by_index[index] = row
    if set(by_index) != set(range(expected)):
        raise ValueError("missing or duplicate structured indexes")
    return [by_index[index] for index in range(expected)]


def sentence(label: str, phrase: str) -> str:
    return f"{label}: {compact(phrase, 300).rstrip('.!?。')}."


def decision_record(source: dict[str, Any], result: dict[str, Any], review_source: str, model: str) -> dict[str, Any]:
    reason = compact(result["reason"], 600)
    matched = result["matched_scenario_id"].strip() or None
    if result["decision"] == "Merge" and matched:
        reason = f"기존 앱 원본 {matched}와 입력·처리·즉시 결과가 겹친다. {reason}"
    return {
        "batch_id": source["batch_id"],
        "batch_position": source["batch_position"],
        "key": source["key"],
        "dataset": source["dataset"],
        "source_id": source["source_id"],
        "name": source["name"],
        "five_sentences": {
            "input": sentence("구체적인 입력", result["input_phrase"]),
            "process": sentence("핵심 처리", result["process_phrase"]),
            "immediate_result": sentence("즉시 결과", result["result_phrase"]),
            "need_moment": sentence("필요한 순간", result["moment_phrase"]),
            "advantage": sentence("기존 대안과 비교한 판정 근거", reason),
        },
        "decision": result["decision"],
        "decision_reason": reason,
        "rejection_code": result["code"] if result["decision"] == "Fail" else None,
        "matched_scenario_id": matched if result["decision"] == "Merge" else None,
        "reviewed_at": "2026-07-14",
        "review_source": review_source,
        "review_model": model,
    }


def deterministic_sample(rows: list[dict[str, Any]], count: int, seed_text: str) -> list[dict[str, Any]]:
    seed = int(hashlib.sha256(seed_text.encode()).hexdigest()[:16], 16)
    rng = random.Random(seed)
    indexes = sorted(rng.sample(range(len(rows)), min(count, len(rows))))
    return [rows[index] for index in indexes]


def counts(rows: list[dict[str, Any]]) -> dict[str, int]:
    result: dict[str, int] = {}
    for row in rows:
        result[row["decision"]] = result.get(row["decision"], 0) + 1
    return result


def review_rows(
    model: str,
    sources: list[dict[str, Any]],
    portfolio: str,
    portfolio_ids: set[str],
    purpose: str,
    attempts: int = 3,
) -> list[dict[str, Any]]:
    """Retry malformed structured output instead of relaxing evidence quality."""
    last_error: Exception | None = None
    retry_note = ""
    for attempt in range(attempts):
        try:
            raw = claude_structured(model, review_prompt(sources, portfolio, f"{purpose}{retry_note}"), attempts=1)
            return validate(raw, len(sources), portfolio_ids)
        except (RuntimeError, ValueError) as error:
            last_error = error
            retry_note = (
                "\n\n직전 구조화 출력은 검증에 실패했다. 빈칸·'.'·'불명'을 쓰지 말고 "
                "각 원본마다 input_phrase·process_phrase·result_phrase·moment_phrase·reason을 모두 "
                "원문에서 확인 가능한 구체 문구로 다시 채워라."
            )
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    # A single malformed row should not discard a validated partial batch.
    # Split the failed chunk and keep the same strict validator; at one row
    # there is no safe automatic relaxation, so the source remains blocked.
    if len(sources) > 1:
        midpoint = len(sources) // 2
        print(f"  structured retry split {len(sources)} -> {midpoint}+{len(sources)-midpoint}", flush=True)
        return review_rows(
            model,
            sources[:midpoint],
            portfolio,
            portfolio_ids,
            purpose,
            attempts=attempts,
        ) + review_rows(
            model,
            sources[midpoint:],
            portfolio,
            portfolio_ids,
            purpose,
            attempts=attempts,
        )
    raise RuntimeError(f"structured review remained invalid after {attempts} attempts: {last_error}")


def source_chunks(sources: list[dict[str, Any]], chunk_size: int) -> list[list[dict[str, Any]]]:
    if chunk_size < 1:
        raise ValueError("review chunk size must be positive")
    return [sources[index:index + chunk_size] for index in range(0, len(sources), chunk_size)]


def main() -> int:
    args = parse_args()
    if args.review_chunk_size < 1:
        raise ValueError("--review-chunk-size must be at least 1")
    ledger = read_jsonl(LEDGER)
    portfolio_rows = json.loads(PORTFOLIO.read_text(encoding="utf-8"))
    portfolio = portfolio_text(portfolio_rows)
    portfolio_ids = {row["id"] for row in portfolio_rows}
    selected = set(args.batch) if args.batch else {
        f"EXH-{index:03d}" for index in range(args.start_batch, args.end_batch + 1)
    }
    batch_ids = sorted({row["batch_id"] for row in ledger if row["batch_id"] in selected})
    print(json.dumps({"batches": batch_ids, "model": args.model, "audit_model": args.audit_model}, ensure_ascii=False), flush=True)
    if args.dry_run:
        return 0

    started = time.time()
    for number, batch_id in enumerate(batch_ids, 1):
        sources = sorted([row for row in ledger if row["batch_id"] == batch_id], key=lambda row: row["batch_position"])
        unresolved = [row for row in sources if row["review_state"] != "finalized"]
        decision_path = DECISION_DIR / f"{batch_id}.jsonl"
        audit_path = AUDIT_DIR / f"{batch_id}.json"
        existing = read_jsonl(decision_path)
        if audit_path.exists() and not args.replace_local:
            audit = json.loads(audit_path.read_text(encoding="utf-8"))
            if audit.get("status") == "passed" and len(existing) == len(unresolved):
                print(f"{batch_id}: already passed", flush=True)
                continue
        if args.replace_local:
            existing = []

        existing_by_key = {row["key"]: row for row in existing}
        pending = [row for row in unresolved if row["key"] not in existing_by_key]
        print(f"{batch_id}: primary review {len(pending)}", flush=True)
        for chunk_index, pending_chunk in enumerate(source_chunks(pending, args.review_chunk_size), 1):
            print(f"  primary chunk {chunk_index}: {len(pending_chunk)}", flush=True)
            results = review_rows(
                args.model, pending_chunk, portfolio, portfolio_ids,
                "1차 전수 판정. 원문에 없는 기능을 만들지 말고 하드 게이트와 2일 세로 조각을 함께 적용한다.",
            )
            for source, result in zip(pending_chunk, results):
                existing_by_key[source["key"]] = decision_record(
                    source, result, "claude_structured_exhaustive_review", args.model
                )
            partial = [existing_by_key[row["key"]] for row in unresolved if row["key"] in existing_by_key]
            write_jsonl(decision_path, partial)
        decisions = [existing_by_key[row["key"]] for row in unresolved]

        rounds = []
        for round_index in range(1, 5):
            fails = [row for row in decisions if row["decision"] == "Fail"]
            if not fails:
                rounds.append({"round": round_index, "fail_count": 0, "sample": [], "rescues": []})
                break
            sample_count = max(1, (len(fails) + 9) // 10)
            sample = deterministic_sample(fails, sample_count, f"{args.seed}:{batch_id}:{round_index}")
            source_by_key = {row["key"]: row for row in unresolved}
            audit_sources = [source_by_key[row["key"]] for row in sample]
            audit_results = review_rows(
                args.audit_model, audit_sources, portfolio, portfolio_ids,
                "Fail 그림자 감사. 1차 결론과 이유는 보지 않았다. 문제가 생긴 뒤 가져올 입력 하나로 2일 세로 조각이 남는지 적극적으로 찾되 원문 밖 기능은 만들지 않는다.",
            )
            rescues = [
                {"key": source["key"], "decision": result["decision"], "reason": result["reason"]}
                for source, result in zip(audit_sources, audit_results)
                if result["decision"] != "Fail"
            ]
            rounds.append({
                "round": round_index,
                "fail_count": len(fails),
                "sample": [row["key"] for row in sample],
                "rescues": rescues,
                "false_reject_rate": len(rescues) / len(sample),
            })
            print(f"  shadow {round_index}: {len(rescues)}/{len(sample)} rescues", flush=True)
            if not rescues:
                break

            fail_sources = [source_by_key[row["key"]] for row in fails]
            corrected_by_key: dict[str, dict[str, Any]] = {}
            for chunk_index, fail_chunk in enumerate(source_chunks(fail_sources, args.review_chunk_size), 1):
                print(f"  Fail re-review chunk {chunk_index}: {len(fail_chunk)}", flush=True)
                corrected = review_rows(
                    args.model, fail_chunk, portfolio, portfolio_ids,
                    "Fail 전체 재감사. 좁힐 수 있는 원본을 놓쳤다는 표본 신호가 있었다. 문제 발생 뒤 입력 하나→처리 한 번→결과 하나로 원본 가치가 남는지 다시 판정한다.",
                )
                corrected_by_key.update({
                    source["key"]: decision_record(source, result, "claude_structured_fail_rereview", args.model)
                    for source, result in zip(fail_chunk, corrected)
                })
            decisions = [corrected_by_key.get(row["key"], row) for row in decisions]

        final_round = rounds[-1]
        status = "passed" if not final_round.get("rescues") else "failed"
        audit = {
            "batch_id": batch_id,
            "status": status,
            "reviewed_at": "2026-07-14",
            "method": "fresh structured review plus context-isolated 10% Fail shadow audit",
            "model": args.model,
            "audit_model": args.audit_model,
            "threshold": "false reject rate < 5%",
            "source_rows": len(sources),
            "decision_rows": len(decisions),
            "decision_counts": counts(decisions),
            "rounds": rounds,
            "final_false_reject_rate": final_round.get("false_reject_rate", 0),
        }
        write_jsonl(decision_path, decisions)
        AUDIT_DIR.mkdir(parents=True, exist_ok=True)
        audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if status != "passed":
            raise RuntimeError(f"{batch_id} did not pass shadow audit")
        print(f"{batch_id}: passed {counts(decisions)} ({number}/{len(batch_ids)}, {(time.time()-started)/60:.1f}m)", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
