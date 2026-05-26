# 🤖 JARVIS — Core Service Directory

This folder houses the production background services, real-time trigger pipelines, and cognitive models for JARVIS.

## 📂 Submodule Architecture

* **`core/`** — Low-level private STT models (Vosk) and mutex wake arbiters.
* **`vocal/`** — Streamed Neural TTS vocal synthesis (Edge TTS) and synchronous subtitle overlays.
* **`bridge/`** — IDE control buses and window focus triggers (VSCodeBridge).
* **`memory/`** — Persistent core settings, local error remediation databases, and session operation logs.
* **`intelligence/`** — Diagnostics utilities, project file scanner, and morning briefing scripts.
* **`protocols/`** — Sarcasm triggers, explain levels, and dynamic codename generators.
* **`vault/`** — AES-encrypted credentials and secure environment variables manager.
* **`logs/`** — Active runtime logs, speech traces, and debug streams.

---
*Maintained under the supervision of JARVIS.*
