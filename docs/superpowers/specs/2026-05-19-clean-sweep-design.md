# Design Document: Operation CLEAN SWEEP
**Date:** 2026-05-19
**Topic:** Removal of Clap Trigger System & Resolution of Async Deadlock

## 1. Problem Statement
The JARVIS system currently experiences a deadlock when processing voice commands or wake events because `syncSpeak` is called from within the `asyncio` event loop. This blocking call prevents the speech coroutine from executing, resulting in a silent and unresponsive system. Additionally, the clap trigger system is no longer required and should be removed to reduce complexity and resource usage.

## 2. Goals
- Eliminate the `asyncio` deadlock by refactoring vocal synthesis calls.
- Completely remove the `ClapDetector` and all associated logic/configuration.
- Ensure the system boots faster and handles wake words reliably.

## 3. Architecture Changes

### 3.1. Deadlock Fix
- **`main.py`**: Update `JarvisRuntime._handle_wake` and `CommandRouter.route` to use `await async_speak(...)`.
- **`sync_speak.py`**: Ensure `async_speak` is properly exported and handles overlay dismissals correctly.

### 3.2. Clap Trigger Removal
- **Files to Delete**:
    - `JARVIS/core/clap_detector.py`
- **Logic Removal**:
    - **`main.py`**: Remove `ClapDetector` imports, `self._clap` state, Phase 4 boot sequence, and shutdown calls. Remove `_on_abort_event`.
    - **`wake_arbiter.py`**: Remove references to `clap_2x` in comments and test code.
    - **`vscode_bridge.py`**: Remove `CLAP_TRIGGER_WAKE` injection logic.
    - **`trigger_bus.py`**: Remove `clap_2x` publishing examples.
- **Config Cleanup**:
    - **`settings.json`**: Remove all keys prefixed with `clap_`.

## 4. Implementation Plan
1. Refactor `main.py` to fix the deadlock.
2. Remove clap-related logic from `main.py`, `wake_arbiter.py`, `vscode_bridge.py`, and `trigger_bus.py`.
3. Delete `clap_detector.py`.
4. Clean `settings.json`.
5. Verify boot sequence and wake-word response.

## 5. Success Criteria
- JARVIS responds to "JARVIS" wake word with "Activating, Sir." spoken aloud.
- Commands (e.g., "how are we") are processed and responded to without hanging.
- The system boots without attempting to initialize the clap detector.
- No "clap" related logs appear in the runtime log.
