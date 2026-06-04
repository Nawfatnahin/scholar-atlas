# JARVIS Core Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the JARVIS core to ensure full VS Code integration, real-time synchronized subtitles, and robust process management.

**Architecture:** A dual-threaded vocal module for word-by-word subtitle synchronization and a single-process core utilizing `pythonw` for windowless background execution with PID-based state management.

**Tech Stack:** Python 3.11, `psutil`, `pygame` (audio), `vosk` (STT), `threading`.

---

### Task 1: Vocal Module Refactor (Sync Subtitles)

**Files:**
- Modify: `JARVIS/vocal/sync_speak.py`

- [ ] **Step 1: Refactor sync_speak to use threading**
  Update `sync_speak` to run the subtitle loop and the audio player in parallel.

```python
import sys
import time
import threading
import pygame

def subtitle_thread(text, words, spoken_so_far):
    for word in words:
        sys.stdout.write(f"\r[JARVIS]: {' '.join(spoken_so_far + [word])}")
        sys.stdout.flush()
        spoken_so_far.append(word)
        time.sleep(len(word) * 0.06)

def sync_speak(text):
    words = text.split()
    spoken_so_far = []
    
    # Audio thread (logic from existing player)
    # ... (code to play audio)
    
    # Subtitle thread
    sub_t = threading.Thread(target=subtitle_thread, args=(text, words, spoken_so_far))
    sub_t.start()
    
    # Wait for audio/subtitles to finish
    sub_t.join()
    print() # New line after subtitles finish
```

- [ ] **Step 2: Test subtitle synchronization**
  Run: `py JARVIS/tests/vocal_test.py`
  Expected: Subtitles appear word-by-word in sync with audio.

- [ ] **Step 3: Commit**
  ```bash
  git add JARVIS/vocal/sync_speak.py
  git commit -m "feat: [VOCAL] Word-by-word subtitle synchronization"
  ```

### Task 2: Core Infrastructure (PID & Process Management)

**Files:**
- Create: `JARVIS/runtime/.gitkeep`
- Modify: `JARVIS/core/jarvis.py`

- [ ] **Step 1: Create runtime directory**
  Run: `mkdir JARVIS/runtime`

- [ ] **Step 2: Implement psutil check and PID storage**
  Add the startup logic to `jarvis.py` to check for existing processes and save its own PID.

```python
import psutil
import os

def check_and_start():
    already_running = any(
        "JARVIS.core.jarvis" in " ".join(p.cmdline())
        for p in psutil.process_iter(['cmdline'])
        if p.pid != os.getpid()
    )
    if already_running:
        print("[JARVIS]: ⚠ ADVISORY — Core already active. Aborting duplicate.")
        sys.exit(0)
    
    os.makedirs("JARVIS/runtime", exist_ok=True)
    with open("JARVIS/runtime/jarvis.pid", "w") as f:
        f.write(str(os.getpid()))
```

- [ ] **Step 3: Test process management**
  Run: `py -m JARVIS.core.jarvis` then try running it again in another terminal.
  Expected: Second instance aborts with advisory.

- [ ] **Step 4: Commit**
  ```bash
  git add JARVIS/core/jarvis.py
  git commit -m "feat: [CORE] PID management and duplicate prevention"
  ```

### Task 3: Execution Engine (Integrated Terminal)

**Files:**
- Modify: `JARVIS/core/jarvis.py`

- [ ] **Step 1: Update execution flags and logging**
  Redirect all `log_status` calls to `JARVIS/logs/runtime.log` and ensure `CREATE_NO_WINDOW` is applied to all subprocesses.

```python
def log_status(codename, message, tier="✦ NOMINAL"):
    log_file = "JARVIS/logs/runtime.log"
    # ... (logging logic)

# In process_directive
result = subprocess.run(
    f'"{gemini_path}" -p "{user_input}"',
    capture_output=True, text=True,
    shell=True, encoding='utf-8', errors='ignore',
    creationflags=subprocess.CREATE_NO_WINDOW,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    stdin=subprocess.DEVNULL
)
```

- [ ] **Step 2: Verify windowless execution**
  Run task and check `tasklist` to ensure no external shells appear.

- [ ] **Step 3: Commit**
  ```bash
  git commit -m "feat: [CORE] Windowless integrated terminal execution"
  ```

### Task 4: Workspace Integration (Startup Protocol)

**Files:**
- Modify: `GEMINI.md`

- [ ] **Step 1: Update GEMINI.md instructions**
  Ensure the Startup Protocol matches the exact phrasing requested.

```markdown
- **Startup Protocol:** On workspace load, silently run: `pythonw -m JARVIS.core.jarvis`
```

- [ ] **Step 2: Commit**
  ```bash
  git add GEMINI.md
  git commit -m "docs: [WKS] Finalized auto-start instruction"
  ```

### Task 5: Final Verification Checklist

- [ ] **Step 1: Confirm Voice Trigger**
- [ ] **Step 2: Confirm Zero External Windows**
- [ ] **Step 3: Confirm Word-by-word Subtitles**
- [ ] **Step 4: Confirm Auto-start Protocol**
- [ ] **Step 5: Confirm PID File Presence**
