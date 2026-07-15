#!/usr/bin/env python3
"""Resume the exhaustive Idea Lab review with one Codex CLI structured judge.

This deliberately reuses the validated batch, partial-save, and 10% Fail shadow
audit logic from ``judge-idea-source-corpus-claude.py``.  Only the model
transport changes: each prompt is sent to ``codex exec`` with a JSON Schema and
read-only sandbox.  Existing partial decision files are resumed, never reset.
"""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
BASE_PATH = Path(__file__).with_name("judge-idea-source-corpus-claude.py")
DEFAULT_MODEL = "gpt-5.6-luna"


def load_base() -> Any:
    spec = importlib.util.spec_from_file_location("idea_source_claude_base", BASE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load reusable audit logic: {BASE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


base = load_base()


def parse_structured_output(raw: str) -> dict[str, Any]:
    text = raw.strip()
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.S)
        if not fenced:
            raise
        value = json.loads(fenced.group(1))
    if not isinstance(value, dict) or not isinstance(value.get("rows"), list):
        raise ValueError("Codex output did not match the required {rows: [...]} shape")
    return value


def codex_structured(model: str, prompt: str, attempts: int = 3) -> list[dict[str, Any]]:
    """Use Codex CLI's schema gate; retry transport errors without weakening data checks."""
    last_error: Exception | None = None
    full_prompt = (
        f"{base.SYSTEM}\n\n{prompt}\n\n"
        "도구를 사용하거나 파일을 수정하지 말고, 주어진 JSON Schema를 만족하는 최종 JSON만 반환한다."
    )
    for attempt in range(attempts):
        try:
            with tempfile.TemporaryDirectory(prefix="idea-source-codex-") as directory:
                temp = Path(directory)
                schema_path = temp / "schema.json"
                output_path = temp / "output.json"
                isolated_workdir = temp / "empty-workspace"
                isolated_workdir.mkdir()
                schema_path.write_text(
                    json.dumps(base.schema(), ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )
                command = [
                    "codex",
                    "exec",
                    "--ephemeral",
                    "--ignore-user-config",
                    "--ignore-rules",
                    "--skip-git-repo-check",
                    "--sandbox",
                    "read-only",
                    "--color",
                    "never",
                    "--model",
                    model,
                    "--cd",
                    str(isolated_workdir),
                    "--output-schema",
                    str(schema_path),
                    "--output-last-message",
                    str(output_path),
                    "-",
                ]
                completed = subprocess.run(
                    command,
                    input=full_prompt,
                    text=True,
                    capture_output=True,
                    cwd=ROOT,
                    timeout=900,
                )
                if completed.returncode != 0:
                    raise RuntimeError(base.compact(completed.stderr or completed.stdout, 1800))
                raw = output_path.read_text(encoding="utf-8") if output_path.exists() else completed.stdout
                return parse_structured_output(raw)["rows"]
        except subprocess.TimeoutExpired:
            last_error = RuntimeError("Codex structured pass timed out after 900 seconds")
        except Exception as error:
            last_error = error
        if attempt + 1 < attempts:
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Codex structured pass failed: {last_error}")


def add_codex_defaults() -> None:
    if "--model" not in sys.argv:
        sys.argv.extend(["--model", DEFAULT_MODEL])
    if "--audit-model" not in sys.argv:
        sys.argv.extend(["--audit-model", DEFAULT_MODEL])


def main() -> int:
    add_codex_defaults()
    base.claude_structured = codex_structured
    original_decision_record = base.decision_record

    def decision_record(source: dict[str, Any], result: dict[str, Any], review_source: str, model: str) -> dict[str, Any]:
        return original_decision_record(
            source,
            result,
            review_source.replace("claude_structured", "codex_cli_structured"),
            model,
        )

    base.decision_record = decision_record
    return base.main()


if __name__ == "__main__":
    raise SystemExit(main())
