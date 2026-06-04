# JARVIS — Operational Capability & Interaction Manifest

> **Sir, this document serves as the definitive guide to my current architecture, technical capabilities, and behavioral protocols.**

## 1. Core Architecture
- **Master Boot Sequence**: Parallel module initialization with fault isolation.
- **Async Runtime**: Built on `asyncio` for non-blocking concurrent operations; fully optimized to prevent event loop deadlocks during vocal synthesis.
- **Event Bus**: Shared JSON-based trigger bus for cross-module signal processing.

## 2. Vocal Synthesis & Interaction
- **Voice Profile**: `en-GB-RyanNeural` (Sophisticated British Accent).
- **Temporal Configuration**: +3% speech pace for increased efficiency.
- **Auditory Gain**: +80% volume boost for prominent feedback.
- **Dual Subtitles**: 
    - **Overlay**: Transparent, always-on-top foreground window (Pygame).
    - **Shell**: Synchronized, heuristic word-distribution terminal output.
- **Minimalism Protocol**: Absolute textual minimalism in the terminal; all narration is auditory.

## 3. Auditory Intelligence
- **Wake Word Detection**: Vosk-based phoneme matching for "JARVIS".
- **Wake Arbiter**: Mutex-driven synchronization for voice-wake events, ensuring sequential processing of concurrent activations.
- **Voice-First Philosophy**: Purely voice-driven interaction model with excised acoustic impulse triggers (claps) for maximum reliability in varying noise environments.

## 4. Memory & Persistence
- **Core Memory**: Persistent storage of Sir's preferences and global state (`core.json`).
- **Development Logger**: Automatic tracking of every system modification (`development_log.json`).
- **Archive Protocol**: Snapshot-based version control with unique recovery codenames.
- **Task Queue**: Persistent management of multi-step operations.
- **Session Logger**: Daily operation serialization and historical recall.
- **Error Memory**: De-duplicated error intelligence with keyword search and remediation tracking.

## 5. Intelligence Modules
- **Diagnostics**: Real-time system health reports (CPU, RAM, Disk).
- **Briefing**: Automated morning briefings (Time, Weather, Tasks, Errors).
- **Project Scanner**: Codebase analysis for TODOs, FIXMEs, and technical debt.
- **Vault**: AES-256-GCM encrypted credential store with PBKDF2 key derivation.

## 6. Behavioral Protocols
- **Sarcasm Mode**: Toggleable wit layer (15% response injection).
- **Explain Mode**: Multilevel learning protocol (WHY/LEARN blocks).
- **Confidence Meter**: Uncertainty flagging for inferred outputs.
- **Codename Generator**: Military-technical aesthetic naming for all major operations.

---
Sir, I am standing by for further directives.
