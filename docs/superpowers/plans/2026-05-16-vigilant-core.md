# VIGILANT CORE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a background monitoring service that proactively identifies security risks, technical debt, and system health anomalies.

**Architecture:** A 'Core-Managed Subprocess' model where `jarvis.py` spawns `vigilant_core.py` as a background task. The monitor uses `asyncio` for non-blocking audits and communicates alerts via the `SILENT VELOCITY` vocal protocol.

**Tech Stack:** Python, `asyncio`, `psutil`, `edge-tts` (via `sync_speak.py`).

---

### Task 1: Foundation & Lifecycle

**Files:**
- Create: `JARVIS/core/vigilant_core.py`
- Modify: `JARVIS/core/jarvis.py`
- Test: `JARVIS/tests/test_vigilant_lifecycle.py`

- [ ] **Step 1: Create the base vigilant_core.py with signal handling**

```python
import asyncio
import signal
import sys
import os
from JARVIS.vocal.sync_speak import sync_speak

# [JARVIS] VIGILANT CORE: Proactive Guardian
# Background monitor for system and code integrity.

async def perform_audit():
    # Placeholder for actual audit logic
    print("[VIGILANT]: ✦ NOMINAL — Audit cycle initiated.")
    await asyncio.sleep(1)

async def monitor_loop(interval=1800): # 30 minutes
    print("[VIGILANT]: ✦ NOMINAL — Background monitoring engaged.")
    while True:
        await perform_audit()
        await asyncio.sleep(interval)

def handle_exit(sig, frame):
    print("[VIGILANT]: ✦ NOMINAL — Shutdown signal received. Cleaning up.")
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    asyncio.run(monitor_loop())
```

- [ ] **Step 2: Modify jarvis.py to spawn the subprocess**

```python
# Add at top of JARVIS/core/jarvis.py
import subprocess

# Add inside run_core() after greeting
async def run_core():
    # ... previous code ...
    
    # Spawn VIGILANT CORE
    vigilant_process = subprocess.Popen(
        [sys.executable, "-m", "JARVIS.core.vigilant_core"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    log_status("IRON HEART", f"VIGILANT CORE spawned (PID: {vigilant_process.pid})")
    
    # ... previous loop ...
    
    # Inside the exit logic (confirm == 'confirm')
    vigilant_process.terminate()
    log_status("IRON HEART", "VIGILANT CORE terminated.")
```

- [ ] **Step 3: Verify lifecycle**
Run `py -m JARVIS.core.jarvis`. Exit and verify in logs/console that VIGILANT CORE is noted.

- [ ] **Step 4: Commit**
`git add JARVIS/core/vigilant_core.py JARVIS/core/jarvis.py; git commit -m "feat: [VIGILANT CORE] Initial lifecycle and subprocess management"`

---

### Task 2: Security Audit Sector

**Files:**
- Modify: `JARVIS/core/vigilant_core.py`
- Test: `JARVIS/tests/test_vigilant_security.py`

- [ ] **Step 1: Implement Credential and RLS Scan**

```python
import re

async def scan_security():
    risks = []
    patterns = [
        r'API_KEY\s*=\s*["\'][^"\']+["\']',
        r'SECRET\s*=\s*["\'][^"\']+["\']',
        r'PRIVATE_KEY'
    ]
    
    # Simplified scan of project root
    for root, dirs, files in os.walk("."):
        if ".git" in dirs: dirs.remove(".git")
        if "node_modules" in dirs: dirs.remove("node_modules")
        
        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.js', '.json')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        for p in patterns:
                            if re.search(p, content, re.IGNORECASE):
                                risks.append(f"Hardcoded secret in {path}")
                except: pass
    return risks
```

- [ ] **Step 2: Integrate into perform_audit**

```python
async def perform_audit():
    risks = await scan_security()
    if risks:
        alert_msg = f"⚠ ADVISORY — Security risk detected: {risks[0]}. Sir, you have pending security anomalies on record."
        await sync_speak(alert_msg)
```

- [ ] **Step 3: Commit**
`git commit -am "feat: [VIGILANT CORE] Implement security sector scanning"`

---

### Task 3: Architecture & Health Sector

**Files:**
- Modify: `JARVIS/core/vigilant_core.py`

- [ ] **Step 1: Implement Health and Complexity Audit**

```python
import psutil

async def audit_system():
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().percent
    
    if cpu > 85:
        await sync_speak("⚠ ADVISORY — CPU load is critical at " + str(cpu) + " percent Sir.")
    if ram > 90:
        await sync_speak("✖ CRITICAL — System memory exhaustion imminent Sir.")

async def audit_architecture():
    # Scan for large files (> 500 lines)
    for root, _, files in os.walk("JARVIS"):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    if len(f.readlines()) > 500:
                        await sync_speak(f"⚠ ADVISORY — Architectural debt: {file} exceeds complexity threshold Sir.")
```

- [ ] **Step 2: Update loop**
Add `await audit_system()` and `await audit_architecture()` to `perform_audit()`.

- [ ] **Step 3: Final Commit & Test**
Run full JARVIS system and verify background alerts.
`git commit -am "feat: [VIGILANT CORE] Implement architecture and health sectors"`
