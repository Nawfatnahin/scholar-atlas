"""
JARVIS — Project Scanner (Codebase Intel)
Scans any directory for: TODO, FIXME, HACK, XXX, dead imports.
Output: structured report grouped by file.
Commands: scan project, deep scan, brief me on pending work
"""

import re
import ast
import logging
from pathlib import Path

logger = logging.getLogger("PROJECT_SCANNER")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_MARKERS = ["TODO", "FIXME", "HACK", "XXX"]
_CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c",
    ".h", ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt",
}
_IGNORE_DIRS = {
    "__pycache__", "node_modules", ".git", ".venv", "venv",
    "env", ".env", ".idea", ".vscode", "dist", "build",
    ".next", ".nuxt", "coverage",
}


# ---------------------------------------------------------------------------
# Scanning Logic
# ---------------------------------------------------------------------------
def _scan_file_markers(filepath: Path) -> list[dict]:
    """Scan a single file for TODO/FIXME/HACK/XXX markers."""
    results = []
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
        for i, line in enumerate(content.splitlines(), 1):
            for marker in _MARKERS:
                if marker in line.upper():
                    results.append({
                        "file": str(filepath),
                        "line": i,
                        "marker": marker,
                        "text": line.strip(),
                    })
    except Exception:
        pass
    return results


def _find_dead_imports_py(filepath: Path) -> list[dict]:
    """Find potentially dead imports in a Python file."""
    results = []
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
        tree = ast.parse(content)

        imported_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname if alias.asname else alias.name.split(".")[0]
                    imported_names.add((name, node.lineno))
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    name = alias.asname if alias.asname else alias.name
                    imported_names.add((name, node.lineno))

        # Check if imported names are used in the rest of the code
        for name, lineno in imported_names:
            if name == "*":
                continue
            # Simple heuristic: count occurrences beyond the import
            pattern = re.compile(r'\b' + re.escape(name) + r'\b')
            matches = pattern.findall(content)
            if len(matches) <= 1:  # Only the import itself
                results.append({
                    "file": str(filepath),
                    "line": lineno,
                    "marker": "DEAD_IMPORT",
                    "text": f"Unused import: {name}",
                })
    except (SyntaxError, Exception):
        pass
    return results


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def scan(directory: str | Path | None = None) -> dict:
    """
    Scan a directory for markers (TODO/FIXME/HACK/XXX).
    Returns structured report grouped by file.
    """
    if directory is None:
        directory = Path.cwd()
    else:
        directory = Path(directory)

    if not directory.exists():
        return {"error": f"Directory not found: {directory}", "files": {}}

    report = {"directory": str(directory), "files": {}, "total_markers": 0}

    for filepath in directory.rglob("*"):
        if filepath.is_dir():
            continue
        if any(ignored in filepath.parts for ignored in _IGNORE_DIRS):
            continue
        if filepath.suffix not in _CODE_EXTENSIONS:
            continue

        markers = _scan_file_markers(filepath)
        if markers:
            rel = str(filepath.relative_to(directory))
            report["files"][rel] = markers
            report["total_markers"] += len(markers)

    logger.info(
        "✦ NOMINAL | PROJECT_SCANNER | Scanned %s — %d marker(s) in %d file(s)",
        directory.name, report["total_markers"], len(report["files"]),
    )
    return report


def deep_scan(directory: str | Path | None = None) -> dict:
    """
    Deep scan: markers + dead import detection (Python files).
    """
    if directory is None:
        directory = Path.cwd()
    else:
        directory = Path(directory)

    report = scan(directory)
    report["dead_imports"] = {}
    dead_count = 0

    for filepath in directory.rglob("*.py"):
        if any(ignored in filepath.parts for ignored in _IGNORE_DIRS):
            continue
        dead = _find_dead_imports_py(filepath)
        if dead:
            rel = str(filepath.relative_to(directory))
            report["dead_imports"][rel] = dead
            dead_count += len(dead)

    report["total_dead_imports"] = dead_count
    logger.info(
        "✦ NOMINAL | PROJECT_SCANNER | Deep scan — %d dead import(s) found",
        dead_count,
    )
    return report


def pending_report(directory: str | Path | None = None) -> str:
    """Generate a spoken summary of pending work."""
    report = scan(directory)
    total = report["total_markers"]
    files = len(report["files"])

    if total == 0:
        return "No pending work markers found, Sir. Codebase is clean."

    # Count by marker type
    counts = {}
    for file_markers in report["files"].values():
        for m in file_markers:
            marker = m["marker"]
            counts[marker] = counts.get(marker, 0) + 1

    parts = [f"{count} {marker}{'s' if count > 1 else ''}" for marker, count in counts.items()]
    return (
        f"Found {total} pending work marker{'s' if total != 1 else ''} "
        f"across {files} file{'s' if files != 1 else ''}. "
        f"Breakdown: {', '.join(parts)}."
    )


def format_report(report: dict) -> str:
    """Format a scan report for terminal display."""
    lines = [f"\n  ✦ PROJECT SCAN: {report.get('directory', 'N/A')}"]
    lines.append(f"  Total markers: {report.get('total_markers', 0)}")

    for filepath, markers in report.get("files", {}).items():
        lines.append(f"\n  📄 {filepath}")
        for m in markers:
            lines.append(f"    L{m['line']:>4} [{m['marker']}] {m['text'][:80]}")

    if "dead_imports" in report:
        lines.append(f"\n  Dead imports: {report.get('total_dead_imports', 0)}")
        for filepath, imports in report.get("dead_imports", {}).items():
            lines.append(f"\n  📄 {filepath}")
            for m in imports:
                lines.append(f"    L{m['line']:>4} {m['text']}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Project scanner standalone test...")

    # Scan the JARVIS project itself
    root = Path(__file__).resolve().parent.parent
    report = deep_scan(root)
    print(format_report(report))
    print(f"\n  Spoken: {pending_report(root)}")

    print("\n[JARVIS]: ✦ NOMINAL | PROJECT_SCANNER | Standalone test passed.")
