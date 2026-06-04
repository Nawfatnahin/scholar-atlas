"""
JARVIS — Memory Curator (Second Brain curation)
Scans MEMORY.md and jarvis_memory.json for stale/redundant entries.
Automatically curates, deduplicates, and can promote conventions to rules in GEMINI.md.
Commands: curate memory, jarvis curate, memory curation
"""

import re
import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger("MEMORY_CURATOR")

_ROOT = Path(__file__).resolve().parent.parent
_MEMORY_FILE = _ROOT.parent / "MEMORY.md"
_GEMINI_FILE = _ROOT.parent / "GEMINI.md"
_JARVIS_JSON = _ROOT / "memory" / "jarvis_memory.json"
_CURATOR_LOG = _ROOT / "logs" / "memory_curator.log"

# Heuristics for rule promotion
_PROMOTION_KEYWORDS = [
    r"\bmust\b", r"\balways\b", r"\bnever\b", r"\benforce\b",
    r"\bconvention\b", r"\brequires\b", r"\bstrictly\b", r"\bprotocol\b"
]

def _log_curation_event(message: str) -> None:
    """Log a curated event into the dedicated curator log file."""
    _CURATOR_LOG.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()
    try:
        with open(_CURATOR_LOG, "a", encoding="utf-8") as fh:
            fh.write(f"[{timestamp}] | CURATOR_OPTIMUS | {message}\n")
    except Exception as exc:
        logger.error("✖ CRITICAL | MEMORY_CURATOR | Failed writing to curator log: %s", exc)

class MemoryCurator:
    """Orchestrates memory curation, cleansing, and promotion routines."""

    def __init__(self):
        self.memory_path = _MEMORY_FILE
        self.rules_path = _GEMINI_FILE
        self.json_path = _JARVIS_JSON

    def run_curation(self, auto_promote: bool = True) -> dict:
        """
        Executes curation process.
        Returns a dict summary of curation outcomes.
        """
        logger.info("✦ NOMINAL | MEMORY_CURATOR | Starting memory curation run")
        _log_curation_event("Curation process started.")

        summary = {
            "memory_lines_before": 0,
            "memory_lines_after": 0,
            "removed_duplicates": [],
            "promoted_rules": [],
            "stale_entries_cleaned": [],
            "status": "NOMINAL"
        }

        # 1. Curate MEMORY.md
        if not self.memory_path.exists():
            msg = "MEMORY.md does not exist. Curation bypassed."
            logger.warning("⚠ ADVISORY | MEMORY_CURATOR | %s", msg)
            _log_curation_event(msg)
            summary["status"] = "BYPASSED"
            return summary

        try:
            content = self.memory_path.read_text(encoding="utf-8")
            lines = content.splitlines()
            summary["memory_lines_before"] = len(lines)

            header_lines = []
            bullet_lines = []
            other_lines = []

            # Parse lines
            for line in lines:
                striped = line.strip()
                if striped.startswith("#") or striped.startswith("##") or not striped:
                    header_lines.append(line)
                elif striped.startswith("-"):
                    bullet_lines.append(line)
                else:
                    other_lines.append(line)

            # Deduplicate bullets
            seen_bullets = []
            unique_bullets = []
            for bullet in bullet_lines:
                # Normalise bullet text for comparison (remove formatting markers)
                norm = re.sub(r"[^\w\s]", "", bullet.lower()).strip()
                if norm not in seen_bullets:
                    seen_bullets.append(norm)
                    unique_bullets.append(bullet)
                else:
                    summary["removed_duplicates"].append(bullet)
                    _log_curation_event(f"Removed duplicated bullet: {bullet}")

            # Heuristic Rule Promotion check
            remaining_bullets = []
            for bullet in unique_bullets:
                text_content = bullet.replace("-", "", 1).strip()
                is_rule_candidate = any(re.search(kw, text_content.lower()) for kw in _PROMOTION_KEYWORDS)
                
                if is_rule_candidate and auto_promote:
                    promoted = self.promote_rule_to_gemini(text_content)
                    if promoted:
                        summary["promoted_rules"].append(text_content)
                        _log_curation_event(f"Promoted rule to GEMINI.md: {text_content}")
                        continue # Skip appending to MEMORY.md as it is now promoted
                
                remaining_bullets.append(bullet)

            # Write clean MEMORY.md back
            new_lines = []
            for h in header_lines:
                if h or (new_lines and new_lines[-1]): # Avoid double empty lines
                    new_lines.append(h)
            
            # Ensure proper separation
            if new_lines and new_lines[-1]:
                new_lines.append("")
                
            new_lines.extend(remaining_bullets)
            
            # Add other lines if any
            if other_lines:
                new_lines.append("")
                new_lines.extend(other_lines)

            # Clean tail spacing
            while new_lines and not new_lines[-1].strip():
                new_lines.pop()
            new_lines.append("") # Standard single trailing newline

            self.memory_path.write_text("\n".join(new_lines), encoding="utf-8")
            summary["memory_lines_after"] = len(new_lines)
            logger.info("✦ NOMINAL | MEMORY_CURATOR | MEMORY.md curated successfully")

        except Exception as exc:
            logger.error("✖ CRITICAL | MEMORY_CURATOR | Curation failed: %s", exc)
            summary["status"] = "FAILED"
            summary["error"] = str(exc)
            return summary

        # 2. Curate jarvis_memory.json
        if self.json_path.exists():
            try:
                with open(self.json_path, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                
                # Check for stale fields or duplicates
                if "knowledge_base" in data:
                    kb = data["knowledge_base"]
                    kb_keys_before = len(kb)
                    # Clean empty or null entries
                    cleaned_kb = {k: v for k, v in kb.items() if v}
                    if len(cleaned_kb) < kb_keys_before:
                        data["knowledge_base"] = cleaned_kb
                        summary["stale_entries_cleaned"].append("Cleaned empty keys in knowledge_base.")
                        _log_curation_event("Cleaned empty keys in persistent knowledge base.")
                
                with open(self.json_path, "w", encoding="utf-8") as fh:
                    json.dump(data, fh, indent=4)
                    
            except Exception as exc:
                logger.error("✖ CRITICAL | MEMORY_CURATOR | JSON memory curation failed: %s", exc)

        _log_curation_event(f"Curation complete. Status: {summary['status']}")
        return summary

    def promote_rule_to_gemini(self, rule_text: str) -> bool:
        """Appends a rule safely to GEMINI.md in the ACTIVE PROJECT CONVENTIONS section."""
        if not self.rules_path.exists():
            return False

        try:
            content = self.rules_path.read_text(encoding="utf-8")
            
            # Check if rule already exists in GEMINI.md
            norm_rule = re.sub(r"[^\w\s]", "", rule_text.lower()).strip()
            norm_content = re.sub(r"[^\w\s]", "", content.lower()).strip()
            if norm_rule in norm_content:
                # Rule already present or similar rule found, don't duplicate
                return False

            section_header = "## ACTIVE PROJECT CONVENTIONS"
            
            if section_header not in content:
                # Create the section at the bottom of the file
                content = content.rstrip() + f"\n\n---\n\n{section_header}\n\n"
            
            # Append rule bullet
            clean_rule = rule_text.strip()
            # Ensure it is bulleted
            if not clean_rule.startswith("-"):
                clean_rule = f"- {clean_rule}"
                
            content = content.rstrip() + f"\n{clean_rule}\n"
            
            self.rules_path.write_text(content, encoding="utf-8")
            logger.info("✦ NOMINAL | MEMORY_CURATOR | Promoted rule successfully: %s", rule_text[:60])
            return True

        except Exception as exc:
            logger.error("✖ CRITICAL | MEMORY_CURATOR | Failed to promote rule: %s", exc)
            return False

def curate_memory() -> str:
    """Utility wrapper for main command routing."""
    curator = MemoryCurator()
    res = curator.run_curation(auto_promote=True)
    
    if res["status"] == "FAILED":
        return "Memory curation failed due to a system anomaly, Sir."
        
    parts = ["Memory curation complete, Sir."]
    if res["removed_duplicates"]:
        parts.append(f"Removed {len(res['removed_duplicates'])} duplicated entries.")
    if res["promoted_rules"]:
        parts.append(f"Promoted {len(res['promoted_rules'])} conventions directly into GEMINI.md rules.")
    if not res["removed_duplicates"] and not res["promoted_rules"]:
        parts.append("All memory logs are beautifully tidy and up to date.")
        
    return " ".join(parts)

if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(_ROOT))
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    print("[JARVIS]: Curation test...")
    curator = MemoryCurator()
    summary = curator.run_curation(auto_promote=True)
    print(f"Curation Summary:\n{json.dumps(summary, indent=2)}")
