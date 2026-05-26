"""
JARVIS — Codename Generator (Operation Namer)
Every task ≥2 steps gets an auto-generated codename.
Format: OPERATION [ADJECTIVE] [NOUN] (uppercase, two words).
Word pool: military/technical aesthetic.
Examples: OPERATION SILENT VECTOR, OPERATION IRON PULSE
"""

import random
import logging

logger = logging.getLogger("CODENAME_GEN")

# ---------------------------------------------------------------------------
# Word Pools — Military / Technical aesthetic
# ---------------------------------------------------------------------------
_ADJECTIVES = [
    "SILENT", "IRON", "DARK", "STEEL", "PHANTOM",
    "ARCTIC", "CRIMSON", "SHADOW", "RAPID", "GOLDEN",
    "DEEP", "COLD", "SHARP", "BRIGHT", "HEAVY",
    "SWIFT", "GHOST", "COVERT", "PRIME", "FINAL",
    "NOBLE", "ROGUE", "FALLEN", "BROKEN", "BLIND",
    "STATIC", "ALPHA", "OMEGA", "DELTA", "SIGMA",
    "HOLLOW", "FROZEN", "BURNING", "RISING", "WAKING",
    "QUANTUM", "ORBITAL", "NEURAL", "SONIC", "BINARY",
    "EMERALD", "OBSIDIAN", "TITANIUM", "CHROME", "COBALT",
]

_NOUNS = [
    "VECTOR", "PULSE", "STRIKE", "SHIELD", "HORIZON",
    "DAWN", "DUSK", "FORGE", "SPEAR", "BLADE",
    "STORM", "THUNDER", "VORTEX", "NEXUS", "PRISM",
    "CITADEL", "BASTION", "SENTINEL", "VANGUARD", "PROTOCOL",
    "DIRECTIVE", "GENESIS", "CASCADE", "MATRIX", "CONDUIT",
    "MERIDIAN", "ZENITH", "APEX", "CORE", "NODE",
    "CIRCUIT", "BEACON", "ANCHOR", "HAMMER", "ANVIL",
    "ECLIPSE", "PHOENIX", "HYDRA", "RAPTOR", "FALCON",
    "SABER", "LANCE", "RAMPART", "BULWARK", "KEYSTONE",
]

_used_codenames: set = set()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate() -> str:
    """
    Generate a unique codename.
    Format: OPERATION [ADJECTIVE] [NOUN]
    """
    max_attempts = 50
    for _ in range(max_attempts):
        adj = random.choice(_ADJECTIVES)
        noun = random.choice(_NOUNS)
        codename = f"OPERATION {adj} {noun}"
        if codename not in _used_codenames:
            _used_codenames.add(codename)
            logger.info("✦ NOMINAL | CODENAME_GEN | Generated: %s", codename)
            return codename

    # Fallback: add a number suffix
    codename = f"OPERATION {random.choice(_ADJECTIVES)} {random.choice(_NOUNS)}-{random.randint(1, 99)}"
    _used_codenames.add(codename)
    logger.info("✦ NOMINAL | CODENAME_GEN | Generated (fallback): %s", codename)
    return codename


def reset() -> None:
    """Clear the used codenames set."""
    _used_codenames.clear()
    logger.info("✦ NOMINAL | CODENAME_GEN | Reset — all codenames available")


def used() -> list[str]:
    """List all used codenames in this session."""
    return sorted(_used_codenames)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Codename generator standalone test...\n")

    for i in range(10):
        name = generate()
        print(f"  {i + 1}. {name}")

    print(f"\n  Used codenames: {len(used())}")

    reset()
    print(f"  After reset: {len(used())} used")

    print("\n[JARVIS]: ✦ NOMINAL | CODENAME_GEN | Standalone test passed.")
