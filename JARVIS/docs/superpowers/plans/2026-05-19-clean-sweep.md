# Operation CLEAN SWEEP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the async deadlock in vocal synthesis and completely remove the clap trigger system.

**Architecture:**
- Refactor all blocking `syncSpeak` calls within async contexts to `await async_speak`.
- Methodically excise all `ClapDetector` references across the core, bridge, and configuration layers.
- Utilize the `WakeArbiter` as a pure voice-wake mutex.

**Tech Stack:** Python 3.11, `asyncio`, `edge-tts`, `pygame`.

---

### Task 1: Fix Async Deadlock in Vocal Synthesis

**Files:**
- Modify: `JARVIS/main.py`
- Modify: `JARVIS/vocal/sync_speak.py`

- [ ] **Step 1: Update `sync_speak.py` to ensure `async_speak` handles state correctly.**
- [ ] **Step 2: Update `JarvisRuntime._handle_wake` in `main.py` to use `async_speak`.**
- [ ] **Step 3: Update `CommandRouter` in `main.py` to use `async_speak` for all handlers.**
- [ ] **Step 4: Verify with a mock test script.**

---

### Task 2: Excise Clap Detector from `main.py`

**Files:**
- Modify: `JARVIS/main.py`

- [ ] **Step 1: Remove `ClapDetector` imports and fault-isolation.**
- [ ] **Step 2: Remove Phase 4 from `boot()` method.**
- [ ] **Step 3: Remove `_on_abort_event` and update `_on_wake_event`.**
- [ ] **Step 4: Update `shutdown()` to remove `self._clap.stop()`.**

---

### Task 3: Cleanup Auxiliary Components

**Files:**
- Modify: `JARVIS/core/wake_arbiter.py`
- Modify: `JARVIS/bridge/vscode_bridge.py`
- Modify: `JARVIS/bridge/trigger_bus.py`

- [ ] **Step 1: Remove clap references in `wake_arbiter.py`.**
- [ ] **Step 2: Remove `CLAP_TRIGGER_WAKE` from `vscode_bridge.py`.**
- [ ] **Step 3: Remove clap examples from `trigger_bus.py`.**

---

### Task 4: Configuration and File Deletion

**Files:**
- Delete: `JARVIS/core/clap_detector.py`
- Modify: `JARVIS/config/settings.json`

- [ ] **Step 1: Delete `JARVIS/core/clap_detector.py`.**
- [ ] **Step 2: Remove `clap_*` keys from `settings.json`.**

---

### Task 5: Final Validation

- [ ] **Step 1: Boot JARVIS and verify no clap logs.**
- [ ] **Step 2: Test "JARVIS" wake word response.**
- [ ] **Step 3: Test command processing (e.g., "how are we").**
