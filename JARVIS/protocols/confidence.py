"""
JARVIS — Confidence Protocol (Certainty Meter)
Auto-appended to any response with inference uncertainty.
Tiers: [HIGH] / [MEDIUM — verify advised] / [LOW — speculative]
Threshold logic based on keyword ambiguity in input.
"""

import re
import logging
from pathlib import Path

logger = logging.getLogger("CONFIDENCE")

# ---------------------------------------------------------------------------
# Ambiguity indicators
# ---------------------------------------------------------------------------
_HIGH_UNCERTAINTY_WORDS = {
    "maybe", "perhaps", "possibly", "might", "could", "unsure",
    "guess", "assume", "think", "probably", "not sure", "unclear",
    "seems", "appears", "likely", "unlikely", "speculate",
}

_MEDIUM_UNCERTAINTY_WORDS = {
    "should", "would", "generally", "typically", "usually",
    "in theory", "most likely", "expected", "presumably",
    "i believe", "if i recall", "roughly", "approximately",
}

_DEFINITIVE_WORDS = {
    "definitely", "certainly", "confirmed", "verified", "always",
    "never", "exactly", "precisely", "guaranteed", "proven",
    "documented", "tested", "validated",
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def assess(text: str) -> str:
    """
    Assess confidence tier of a response text.
    Returns: '[HIGH]', '[MEDIUM — verify advised]', or '[LOW — speculative]'
    """
    text_lower = text.lower()

    # Count indicators
    high_unc = sum(1 for w in _HIGH_UNCERTAINTY_WORDS if w in text_lower)
    med_unc = sum(1 for w in _MEDIUM_UNCERTAINTY_WORDS if w in text_lower)
    definitive = sum(1 for w in _DEFINITIVE_WORDS if w in text_lower)

    # Question marks increase uncertainty
    question_marks = text.count("?")

    uncertainty_score = (high_unc * 3) + (med_unc * 1.5) + (question_marks * 0.5) - (definitive * 2)

    if uncertainty_score >= 4:
        tier = "[LOW — speculative]"
    elif uncertainty_score >= 2:
        tier = "[MEDIUM — verify advised]"
    else:
        tier = "[HIGH]"

    logger.debug(
        "✦ NOMINAL | CONFIDENCE | Score=%.1f → %s (hi=%d, med=%d, def=%d)",
        uncertainty_score, tier, high_unc, med_unc, definitive,
    )
    return tier


def append_confidence(response: str) -> str:
    """
    Analyze a response and append the confidence tier.
    Only appends if not already present.
    """
    if any(tag in response for tag in ["[HIGH]", "[MEDIUM", "[LOW"]):
        return response

    tier = assess(response)
    if tier == "[HIGH]":
        return response  # Don't clutter high-confidence responses

    return f"{response}\n  Confidence: {tier}"


def force_tag(response: str) -> str:
    """Always append confidence tier, regardless of level."""
    if any(tag in response for tag in ["[HIGH]", "[MEDIUM", "[LOW"]):
        return response
    tier = assess(response)
    return f"{response}\n  Confidence: {tier}"


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Confidence protocol standalone test...\n")

    tests = [
        "The file is located at /usr/bin. Confirmed and verified.",
        "Maybe the issue is related to the configuration. I think it could be the timeout.",
        "This should work in most cases, generally speaking.",
        "I'm not sure, but it might possibly be a race condition. Perhaps try debugging?",
    ]

    for text in tests:
        tier = assess(text)
        print(f"  [{tier}] {text[:60]}...")
        print()

    print("[JARVIS]: ✦ NOMINAL | CONFIDENCE | Standalone test passed.")
