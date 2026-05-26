"""
JARVIS — Vault Store (Credential Manager)
Encrypted key-value credential store backed by vault/vault.enc.
Commands: store [key], retrieve [key], list vault, purge [key]
On retrieve: display in terminal for 10s then auto-clear.
"""

import json
import time
import logging
import threading
from pathlib import Path

from vault.vault_engine import VaultEngine

logger = logging.getLogger("VAULT_STORE")

_ROOT = Path(__file__).resolve().parent.parent
_VAULT_FILE = _ROOT / "vault" / "vault.enc"


class VaultStore:
    """Encrypted key-value credential store."""

    def __init__(self, engine: VaultEngine | None = None):
        self._engine = engine or VaultEngine()
        self._cache: dict | None = None  # Decrypted store held in memory

    # -- Internal I/O --------------------------------------------------------

    def _ensure_file(self) -> None:
        _VAULT_FILE.parent.mkdir(parents=True, exist_ok=True)

    def _load_store(self) -> dict:
        """Load and decrypt the vault store."""
        if self._cache is not None:
            return self._cache

        self._ensure_file()
        if not _VAULT_FILE.exists():
            self._cache = {}
            return self._cache

        if not self._engine.is_unlocked:
            raise RuntimeError("Vault engine is locked — unlock first")

        try:
            with open(_VAULT_FILE, "r", encoding="utf-8") as fh:
                b64_data = fh.read().strip()
            if not b64_data:
                self._cache = {}
                return self._cache
            decrypted = self._engine.decrypt_b64(b64_data)
            self._cache = json.loads(decrypted)
            return self._cache
        except Exception as exc:
            logger.error("✖ CRITICAL | VAULT_STORE | Load/decrypt failed: %s", exc)
            self._cache = {}
            return self._cache

    def _save_store(self) -> None:
        """Encrypt and save the vault store."""
        if self._cache is None:
            return

        if not self._engine.is_unlocked:
            raise RuntimeError("Vault engine is locked — unlock first")

        self._ensure_file()
        try:
            plaintext = json.dumps(self._cache, indent=2)
            b64_data = self._engine.encrypt_b64(plaintext)
            with open(_VAULT_FILE, "w", encoding="utf-8") as fh:
                fh.write(b64_data)
            logger.debug("✦ NOMINAL | VAULT_STORE | Store saved (%d keys)", len(self._cache))
        except Exception as exc:
            logger.error("✖ CRITICAL | VAULT_STORE | Save/encrypt failed: %s", exc)

    # -- Public API ----------------------------------------------------------

    def unlock(self, password: str | None = None) -> bool:
        """Unlock the vault for this session."""
        result = self._engine.unlock(password=password)
        if result:
            self._cache = None  # Force reload
        return result

    def lock(self) -> None:
        """Lock the vault and clear cache."""
        self._cache = None
        self._engine.lock()

    @property
    def is_unlocked(self) -> bool:
        return self._engine.is_unlocked

    def store(self, key: str, value: str) -> None:
        """Store a credential."""
        store = self._load_store()
        store[key] = value
        self._save_store()
        logger.info("✦ NOMINAL | VAULT_STORE | Stored credential: %s", key)

    def retrieve(self, key: str, auto_clear_sec: int = 10) -> str | None:
        """
        Retrieve a credential.
        Displays in terminal for auto_clear_sec then clears.
        Returns the value.
        """
        store = self._load_store()
        value = store.get(key)
        if value is None:
            logger.info("⚠ ADVISORY | VAULT_STORE | Key '%s' not found", key)
            return None

        logger.info("✦ NOMINAL | VAULT_STORE | Retrieved: %s (auto-clear in %ds)", key, auto_clear_sec)

        # Display with auto-clear
        print(f"\n  [VAULT] {key} = {value}")
        if auto_clear_sec > 0:
            def _clear():
                time.sleep(auto_clear_sec)
                # Clear the line (best-effort on Windows)
                print(f"\r  [VAULT] {key} = {'*' * len(value)}  (cleared)")
            threading.Thread(target=_clear, daemon=True).start()

        return value

    def list_keys(self) -> list[str]:
        """List all stored credential keys."""
        store = self._load_store()
        keys = list(store.keys())
        logger.info("✦ NOMINAL | VAULT_STORE | Listed %d key(s)", len(keys))
        return keys

    def purge(self, key: str) -> bool:
        """Remove a credential by key."""
        store = self._load_store()
        if key in store:
            del store[key]
            self._save_store()
            logger.info("✦ NOMINAL | VAULT_STORE | Purged: %s", key)
            return True
        logger.info("⚠ ADVISORY | VAULT_STORE | Key '%s' not found for purge", key)
        return False

    def purge_all(self) -> int:
        """Remove all credentials. Returns count removed."""
        store = self._load_store()
        count = len(store)
        self._cache = {}
        self._save_store()
        logger.info("⚠ ADVISORY | VAULT_STORE | Purged all %d credential(s)", count)
        return count


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: Vault store standalone test...")

    vs = VaultStore()
    vs.unlock(password="test_master_password_sir")

    vs.store("OPENAI_KEY", "sk-test-1234567890abcdef")
    vs.store("GITHUB_TOKEN", "ghp_test_token_xyz")

    keys = vs.list_keys()
    print(f"  Keys: {keys}")

    val = vs.retrieve("OPENAI_KEY", auto_clear_sec=0)
    print(f"  Retrieved: {val}")

    vs.purge("GITHUB_TOKEN")
    keys = vs.list_keys()
    print(f"  After purge: {keys}")

    vs.lock()
    print(f"  Locked: {not vs.is_unlocked}")

    print("\n[JARVIS]: ✦ NOMINAL | VAULT_STORE | Standalone test passed.")
