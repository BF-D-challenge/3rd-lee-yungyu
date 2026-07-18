#!/usr/bin/env python3
"""Deterministically search a local Material Design 3 JSONL corpus."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence, Tuple


CORPUS_FILES: Tuple[str, ...] = (
    "pages.jsonl",
    "sections.jsonl",
    "tokens.jsonl",
    "examples.jsonl",
)
FILE_KIND = {
    "pages.jsonl": "page",
    "sections.jsonl": "section",
    "tokens.jsonl": "token",
    "examples.jsonl": "example",
}
FILE_ORDER = {name: index for index, name in enumerate(CORPUS_FILES)}
MAX_SNIPPET_CHARS = 280
MAX_LIMIT = 100

ID_PATHS = ("id", "record_id", "slug", "key", "token")
PAGE_ID_PATHS = ("page_id", "pageId", "parent_page_id", "parentPageId")
TITLE_PATHS = (
    "title",
    "name",
    "label",
    "heading",
    "section_title",
    "sectionTitle",
    "token",
    "key",
    "page_title",
)
COMPONENT_PATHS = (
    "component",
    "components",
    "component_name",
    "componentName",
    "component_names",
    "componentNames",
)
PAGE_TYPE_PATHS = (
    "page_type",
    "pageType",
    "page_types",
    "pageTypes",
    "layout_type",
    "layoutType",
    "template",
)
SOURCE_URL_PATHS = (
    "source_url",
    "sourceUrl",
    "canonical_url",
    "canonicalUrl",
    "page_url",
    "pageUrl",
    "url",
    "source.url",
)
CAPTURED_AT_PATHS = (
    "captured_at",
    "capturedAt",
    "capture_date",
    "captureDate",
    "source.captured_at",
    "source.capturedAt",
)
SOURCE_KIND_PATHS = (
    "source_kind",
    "sourceKind",
    "authority",
    "provenance.kind",
    "source.kind",
)
KEYWORD_PATHS = (
    "keywords",
    "tags",
    "aliases",
    "category",
    "categories",
    "token_type",
    "tokenType",
    "platform",
)
SUMMARY_PATHS = (
    "summary",
    "description",
    "guidance",
    "rationale",
    "usage",
    "recommendation",
)
BODY_PATHS = (
    "text",
    "content",
    "body",
    "details",
    "example",
    "examples",
    "code",
    "do",
    "dont",
)

FIELD_GROUPS: Tuple[Tuple[str, int, Tuple[str, ...]], ...] = (
    ("title", 14, TITLE_PATHS),
    ("component", 12, COMPONENT_PATHS),
    ("page_type", 10, PAGE_TYPE_PATHS),
    ("keywords", 8, KEYWORD_PATHS),
    ("summary", 5, SUMMARY_PATHS),
    ("body", 2, BODY_PATHS),
)

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "do",
    "does",
    "for",
    "how",
    "in",
    "is",
    "of",
    "on",
    "or",
    "should",
    "the",
    "to",
    "what",
    "when",
    "with",
}


@dataclass(frozen=True)
class LoadedRecord:
    data: Dict[str, Any]
    source_file: str
    source_line: int


@dataclass(frozen=True)
class CorpusResolution:
    path: Path
    checked: Tuple[Path, ...]
    source: str


def _normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value)).casefold()
    chars = [char if char.isalnum() else " " for char in text]
    return " ".join("".join(chars).split())


def _compact(value: str) -> str:
    return " ".join(value.split())


def _get_path(record: Mapping[str, Any], dotted_path: str) -> Any:
    current: Any = record
    for part in dotted_path.split("."):
        if not isinstance(current, Mapping) or part not in current:
            return None
        current = current[part]
    return current


def _flatten_strings(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        compact = _compact(value)
        return [compact] if compact else []
    if isinstance(value, bool):
        return []
    if isinstance(value, (int, float)):
        return [str(value)]
    if isinstance(value, Mapping):
        flattened: List[str] = []
        for key in sorted(value):
            flattened.extend(_flatten_strings(value[key]))
        return flattened
    if isinstance(value, Sequence):
        flattened = []
        for item in value:
            flattened.extend(_flatten_strings(item))
        return flattened
    return []


def _collect(record: Mapping[str, Any], paths: Iterable[str]) -> List[str]:
    values: List[str] = []
    seen = set()
    for path in paths:
        for value in _flatten_strings(_get_path(record, path)):
            if value not in seen:
                values.append(value)
                seen.add(value)
    return values


def _first(record: Mapping[str, Any], paths: Iterable[str]) -> Optional[str]:
    values = _collect(record, paths)
    return values[0] if values else None


def _dedupe_paths(paths: Iterable[Path]) -> Tuple[Path, ...]:
    result: List[Path] = []
    seen = set()
    for path in paths:
        resolved = path.expanduser().resolve()
        key = str(resolved)
        if key not in seen:
            result.append(resolved)
            seen.add(key)
    return tuple(result)


def _default_corpus_candidates() -> Tuple[Path, ...]:
    script = Path(__file__).resolve()
    skill_root = script.parent.parent
    candidates: List[Path] = []

    # A repository copy lives at <repo>/.claude/skills/design-google.
    if (
        skill_root.name == "design-google"
        and skill_root.parent.name == "skills"
        and skill_root.parent.parent.name == ".claude"
    ):
        repo_root = skill_root.parent.parent.parent
        candidates.append(repo_root / "docs" / "research" / "material-design-3")

    # A runtime-synced copy resolves against the active repository working tree.
    cwd = Path.cwd().resolve()
    if cwd.name == "design-google":
        candidates.append(cwd)
    for root in (cwd,) + tuple(cwd.parents):
        candidates.append(root / "docs" / "research" / "material-design-3")

    return _dedupe_paths(candidates)


def resolve_corpus(explicit: Optional[str]) -> CorpusResolution:
    if explicit:
        checked = _dedupe_paths((Path(explicit),))
        return CorpusResolution(checked[0], checked, "--corpus")

    env_value = os.environ.get("M3_CORPUS_DIR")
    if env_value:
        checked = _dedupe_paths((Path(env_value),))
        return CorpusResolution(checked[0], checked, "M3_CORPUS_DIR")

    checked = _default_corpus_candidates()
    for candidate in checked:
        if candidate.is_dir():
            return CorpusResolution(candidate, checked, "auto")

    fallback = checked[0] if checked else Path("docs/research/material-design-3").resolve()
    return CorpusResolution(fallback, checked or (fallback,), "auto")


def _load_jsonl(
    path: Path, source_file: str
) -> Tuple[List[LoadedRecord], List[str], int, bool]:
    records: List[LoadedRecord] = []
    warnings: List[str] = []
    invalid_count = 0

    try:
        with path.open("r", encoding="utf-8", errors="replace") as handle:
            for line_number, raw_line in enumerate(handle, start=1):
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    value = json.loads(line)
                except json.JSONDecodeError as error:
                    invalid_count += 1
                    if invalid_count <= 3:
                        warnings.append(
                            f"{source_file}:{line_number}: invalid JSON skipped ({error.msg})"
                        )
                    continue
                if not isinstance(value, dict):
                    invalid_count += 1
                    if invalid_count <= 3:
                        warnings.append(
                            f"{source_file}:{line_number}: non-object JSON skipped"
                        )
                    continue
                records.append(LoadedRecord(dict(value), source_file, line_number))
    except OSError as error:
        warnings.append(f"{source_file}: could not be read ({error})")
        return records, warnings, invalid_count, False

    if invalid_count > 3:
        warnings.append(
            f"{source_file}: {invalid_count - 3} additional invalid rows skipped"
        )
    return records, warnings, invalid_count, True


def _page_lookup(records: Sequence[LoadedRecord]) -> Dict[str, Mapping[str, Any]]:
    pages: Dict[str, Mapping[str, Any]] = {}
    for loaded in records:
        if loaded.source_file != "pages.jsonl":
            continue
        for identifier in _collect(loaded.data, ID_PATHS):
            normalized = _normalize(identifier)
            if normalized and normalized not in pages:
                pages[normalized] = loaded.data
    return pages


def _inherit_page_metadata(
    loaded: LoadedRecord, pages: Mapping[str, Mapping[str, Any]]
) -> LoadedRecord:
    if loaded.source_file == "pages.jsonl":
        return loaded

    parent: Optional[Mapping[str, Any]] = None
    for page_id in _collect(loaded.data, PAGE_ID_PATHS):
        parent = pages.get(_normalize(page_id))
        if parent is not None:
            break
    if parent is None:
        return loaded

    data = dict(loaded.data)
    inheritance = (
        ("source_url", SOURCE_URL_PATHS),
        ("captured_at", CAPTURED_AT_PATHS),
        ("source_kind", SOURCE_KIND_PATHS),
        ("page_type", PAGE_TYPE_PATHS),
        ("components", COMPONENT_PATHS),
        ("page_title", TITLE_PATHS),
    )
    for target, paths in inheritance:
        if _collect(data, paths):
            continue
        values = _collect(parent, paths)
        if values:
            data[target] = values if target == "components" else values[0]
    return LoadedRecord(data, loaded.source_file, loaded.source_line)


def load_corpus(
    corpus_dir: Path,
) -> Tuple[List[LoadedRecord], List[str], List[str], List[str], List[str], int]:
    records: List[LoadedRecord] = []
    warnings: List[str] = []
    searched_files: List[str] = []
    missing_files: List[str] = []
    unreadable_files: List[str] = []
    invalid_count = 0

    for filename in CORPUS_FILES:
        path = corpus_dir / filename
        if not path.is_file():
            missing_files.append(filename)
            continue
        searched_files.append(filename)
        loaded, file_warnings, file_invalid, readable = _load_jsonl(path, filename)
        records.extend(loaded)
        warnings.extend(file_warnings)
        invalid_count += file_invalid
        if not readable:
            unreadable_files.append(filename)

    pages = _page_lookup(records)
    records = [_inherit_page_metadata(record, pages) for record in records]
    if missing_files:
        warnings.append("Missing corpus files: " + ", ".join(missing_files))
    if not searched_files:
        warnings.append("No supported JSONL corpus files were found")
    return (
        records,
        warnings,
        searched_files,
        missing_files,
        unreadable_files,
        invalid_count,
    )


def _query_terms(query: str) -> List[str]:
    normalized_terms = _normalize(query).split()
    meaningful = [term for term in normalized_terms if term not in STOPWORDS]
    selected = meaningful or normalized_terms
    return list(dict.fromkeys(selected))


def _tokens_match(term: str, candidate: str) -> Tuple[bool, bool]:
    if term == candidate:
        return True, True
    if len(term) >= 4 and len(candidate) >= 4:
        if term.startswith(candidate) or candidate.startswith(term):
            return True, False
    return False, False


def _field_matches_term(term: str, field_tokens: Sequence[str]) -> Tuple[bool, bool]:
    prefix_match = False
    for candidate in field_tokens:
        matched, exact = _tokens_match(term, candidate)
        if exact:
            return True, True
        if matched:
            prefix_match = True
    return prefix_match, False


def _other_values(record: Mapping[str, Any]) -> List[str]:
    known_paths: List[str] = list(
        ID_PATHS
        + PAGE_ID_PATHS
        + SOURCE_URL_PATHS
        + CAPTURED_AT_PATHS
        + SOURCE_KIND_PATHS
    )
    for _, _, paths in FIELD_GROUPS:
        known_paths.extend(paths)
    excluded = {
        path.split(".")[0] for path in known_paths
    }
    values: List[str] = []
    for key in sorted(record):
        if key not in excluded:
            values.extend(_flatten_strings(record[key]))
    return values


def score_record(record: Mapping[str, Any], query: str) -> Tuple[int, List[str]]:
    terms = _query_terms(query)
    if not terms:
        return 1, []

    normalized_query = _normalize(query)
    score = 0
    matched_fields: List[str] = []
    matched_terms = set()

    groups: List[Tuple[str, int, List[str]]] = [
        (name, weight, _collect(record, paths))
        for name, weight, paths in FIELD_GROUPS
    ]
    groups.append(("other", 1, _other_values(record)))

    for name, weight, values in groups:
        field_matched = False
        for value in values:
            normalized_value = _normalize(value)
            if not normalized_value:
                continue
            if normalized_query and normalized_value == normalized_query:
                score += weight * 8
                field_matched = True
            elif normalized_query and normalized_query in normalized_value:
                score += weight * 4
                field_matched = True

            field_tokens = normalized_value.split()
            for term in terms:
                matched, exact = _field_matches_term(term, field_tokens)
                if matched:
                    score += weight * (2 if exact else 1)
                    matched_terms.add(term)
                    field_matched = True
        if field_matched:
            matched_fields.append(name)

    if matched_terms:
        coverage = len(matched_terms) / len(terms)
        score += int(20 * coverage)
        if len(matched_terms) == len(terms):
            score += 40
    return score, matched_fields


def _filter_value_matches(requested: str, candidate: str) -> bool:
    wanted = _normalize(requested)
    available = _normalize(candidate)
    if not wanted or not available:
        return False
    if wanted == available or wanted in available:
        return True
    wanted_tokens = wanted.split()
    available_tokens = available.split()
    return all(
        any(_tokens_match(term, token)[0] for token in available_tokens)
        for term in wanted_tokens
    )


def _matches_filter(
    record: Mapping[str, Any], requested: Sequence[str], paths: Sequence[str]
) -> bool:
    if not requested:
        return True
    candidates = _collect(record, paths)
    return any(
        _filter_value_matches(wanted, candidate)
        for wanted in requested
        for candidate in candidates
    )


def _record_id(loaded: LoadedRecord) -> str:
    identifier = _first(loaded.data, ID_PATHS)
    return identifier or f"{loaded.source_file}:{loaded.source_line}"


def _record_title(loaded: LoadedRecord) -> str:
    title = _first(loaded.data, TITLE_PATHS)
    return title or _record_id(loaded)


def _best_snippet(record: Mapping[str, Any], query: str) -> Optional[str]:
    candidates = _collect(record, SUMMARY_PATHS + BODY_PATHS)
    if not candidates:
        return None

    terms = _query_terms(query)
    normalized_query = _normalize(query)

    def relevance(value: str) -> Tuple[int, int, int]:
        normalized = _normalize(value)
        phrase = 1 if normalized_query and normalized_query in normalized else 0
        term_count = sum(1 for term in terms if term in normalized.split())
        return phrase, term_count, -len(value)

    text = max(candidates, key=relevance)
    if len(text) <= MAX_SNIPPET_CHARS:
        return text

    lower = text.casefold()
    position = lower.find(query.casefold()) if query else -1
    if position < 0:
        for term in terms:
            match = re.search(re.escape(term), lower, flags=re.IGNORECASE)
            if match:
                position = match.start()
                break
    if position < 0:
        position = 0

    start = max(0, position - 70)
    end = min(len(text), start + MAX_SNIPPET_CHARS)
    if end - start < MAX_SNIPPET_CHARS:
        start = max(0, end - MAX_SNIPPET_CHARS)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet += "..."
    return snippet


def _as_result(
    loaded: LoadedRecord,
    score: int,
    matched_fields: List[str],
    query: str,
) -> Dict[str, Any]:
    data = loaded.data
    return {
        "rank": 0,
        "score": score,
        "record_type": FILE_KIND[loaded.source_file],
        "id": _record_id(loaded),
        "title": _record_title(loaded),
        "snippet": _best_snippet(data, query),
        "components": _collect(data, COMPONENT_PATHS),
        "page_types": _collect(data, PAGE_TYPE_PATHS),
        "source_kind": _first(data, SOURCE_KIND_PATHS),
        "source_url": _first(data, SOURCE_URL_PATHS),
        "captured_at": _first(data, CAPTURED_AT_PATHS),
        "source_file": loaded.source_file,
        "source_line": loaded.source_line,
        "matched_fields": matched_fields,
    }


def search_records(
    records: Sequence[LoadedRecord],
    query: str,
    components: Sequence[str],
    page_types: Sequence[str],
    limit: int,
) -> Tuple[List[Dict[str, Any]], int]:
    ranked: List[Tuple[int, LoadedRecord, List[str]]] = []
    has_query = bool(_normalize(query))

    for loaded in records:
        if not _matches_filter(loaded.data, components, COMPONENT_PATHS):
            continue
        if not _matches_filter(loaded.data, page_types, PAGE_TYPE_PATHS):
            continue
        score, matched_fields = score_record(loaded.data, query)
        if has_query and score <= 0:
            continue
        ranked.append((score, loaded, matched_fields))

    ranked.sort(
        key=lambda item: (
            -item[0],
            FILE_ORDER[item[1].source_file],
            _normalize(_record_title(item[1])),
            _normalize(_record_id(item[1])),
            item[1].source_line,
        )
    )

    results: List[Dict[str, Any]] = []
    for rank, (score, loaded, matched_fields) in enumerate(ranked[:limit], start=1):
        result = _as_result(loaded, score, matched_fields, query)
        result["rank"] = rank
        results.append(result)
    return results, len(ranked)


def _limit(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("limit must be an integer") from error
    if number < 1 or number > MAX_LIMIT:
        raise argparse.ArgumentTypeError(f"limit must be between 1 and {MAX_LIMIT}")
    return number


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Search pages.jsonl, sections.jsonl, tokens.jsonl, and examples.jsonl "
            "in a local Material Design 3 corpus."
        )
    )
    parser.add_argument(
        "query",
        nargs="*",
        help="free-text query; quoting multi-word queries is recommended",
    )
    parser.add_argument(
        "--component",
        action="append",
        default=[],
        help="filter by component; repeat for OR matching",
    )
    parser.add_argument(
        "--page-type",
        action="append",
        default=[],
        help="filter by page type; repeat for OR matching",
    )
    parser.add_argument("--limit", type=_limit, default=8, help="result limit (1-100)")
    parser.add_argument("--json", action="store_true", help="emit structured JSON")
    parser.add_argument(
        "--corpus",
        help="corpus directory; overrides M3_CORPUS_DIR and automatic discovery",
    )
    return parser


def _render_text(payload: Mapping[str, Any]) -> str:
    lines: List[str] = []
    status = payload["status"]
    if status == "corpus_missing":
        lines.append("M3 local corpus is unavailable.")
    else:
        lines.append("M3 local search")
    lines.append(f"Query: {payload['query'] or '(filters only)'}")
    lines.append(f"Corpus: {payload['corpus_dir']}")

    filters = payload["filters"]
    if filters["components"]:
        lines.append("Components: " + ", ".join(filters["components"]))
    if filters["page_types"]:
        lines.append("Page types: " + ", ".join(filters["page_types"]))

    if payload["warnings"]:
        lines.append("Warnings:")
        lines.extend(f"- {warning}" for warning in payload["warnings"])

    results = payload["results"]
    if not results:
        lines.append("Results: none")
        return "\n".join(lines)

    lines.append(f"Results: {len(results)} of {payload['matched_records']}")
    for result in results:
        lines.append(
            f"{result['rank']}. [{result['record_type']}] {result['title']} "
            f"(score {result['score']})"
        )
        if result["snippet"]:
            lines.append(f"   {result['snippet']}")
        if result["components"]:
            lines.append("   Components: " + ", ".join(result["components"]))
        if result["page_types"]:
            lines.append("   Page types: " + ", ".join(result["page_types"]))
        if result["source_url"]:
            lines.append(f"   Source: {result['source_url']}")
        else:
            lines.append("   Source: unavailable in local record")
        if result["captured_at"]:
            lines.append(f"   Captured: {result['captured_at']}")
        else:
            lines.append("   Captured: unavailable in local record")
        lines.append(
            f"   Local record: {result['source_file']}:{result['source_line']}"
        )
    return "\n".join(lines)


def _base_payload(
    query: str,
    args: argparse.Namespace,
    resolution: CorpusResolution,
) -> Dict[str, Any]:
    return {
        "status": "ok",
        "query": query,
        "filters": {
            "components": list(args.component),
            "page_types": list(args.page_type),
        },
        "limit": args.limit,
        "corpus_dir": str(resolution.path),
        "corpus_resolution": resolution.source,
        "checked_paths": [str(path) for path in resolution.checked],
        "searched_files": [],
        "missing_files": [],
        "unreadable_files": [],
        "invalid_records": 0,
        "records_scanned": 0,
        "matched_records": 0,
        "warnings": [],
        "results": [],
    }


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    query = " ".join(args.query).strip()
    if not _normalize(query) and not args.component and not args.page_type:
        parser.error("provide free text, --component, or --page-type")

    resolution = resolve_corpus(args.corpus)
    payload = _base_payload(query, args, resolution)

    if not resolution.path.is_dir():
        payload["status"] = "corpus_missing"
        payload["warnings"] = [
            "Corpus directory does not exist. Set --corpus or M3_CORPUS_DIR."
        ]
        output = (
            json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
            if args.json
            else _render_text(payload)
        )
        print(output)
        return 2

    records, warnings, searched, missing, unreadable, invalid = load_corpus(
        resolution.path
    )
    results, matched_records = search_records(
        records,
        query,
        args.component,
        args.page_type,
        args.limit,
    )

    if not records:
        payload["status"] = "corpus_empty"
    elif missing or unreadable or invalid:
        payload["status"] = "corpus_incomplete"

    payload.update(
        {
            "searched_files": searched,
            "missing_files": missing,
            "unreadable_files": unreadable,
            "invalid_records": invalid,
            "records_scanned": len(records),
            "matched_records": matched_records,
            "warnings": warnings,
            "results": results,
        }
    )

    output = (
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
        if args.json
        else _render_text(payload)
    )
    print(output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
