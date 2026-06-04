# JARVIS Voice Activation Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the JARVIS voice activation bridge to target the VS Code integrated terminal exclusively and prevent redundant spawning.

**Architecture:** Utilize `pygetwindow` for precise window targeting, `psutil` for process detection, and `pyautogui` + `pyperclip` for secure command injection. Implement a 5-second cooldown lock.

**Tech Stack:** Python, pygetwindow, pyautogui, pyperclip, psutil.

---

### Task 1: Refactor `vscode_bridge.py`

**Files:**
- Modify: `JARVIS/core/vscode_bridge.py`

- [ ] **Step 1: Replace implementation with new logic**

```python
import pygetwindow
import pyautogui
import pyperclip
import time
import os
import psutil
import datetime

# [JARVIS] Operation VOICE BRIDGE: Integrated Terminal targeting
# Architecture: Single-instance focus and command injection

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05

_LAST_ACTIVATION = 0
COOLDOWN = 5.0

def _log_bridge(msg, tier="✦ NOMINAL"):
    log_file = "JARVIS/logs/runtime.log"
    os.makedirs(os.path.dirname(log_file), exist_ok=True)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] | {tier} | VSCODE BRIDGE | {msg}\n")

def is_gemini_running():
    """Checks for active Gemini CLI processes."""
    for p in psutil.process_iter(['name', 'cmdline']):
        try:
            if p.info['name'] and 'node' in p.info['name'].lower():
                cmdline = " ".join(p.info['cmdline'] or [])
                if 'gemini-cli' in cmdline or 'gemini.js' in cmdline:
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied): continue
    return False

def activate_vscode_terminal(command=None):
    """Strictly targets the VS Code integrated terminal with state awareness."""
    global _LAST_ACTIVATION
    
    now = time.time()
    if now - _LAST_ACTIVATION < COOLDOWN:
        _log_bridge("Activation blocked by cooldown lock.")
        return
    
    _LAST_ACTIVATION = now
    
    try:
        _log_bridge("Initiating Voice Activation Bridge.")
        
        # 1. Window Targeting
        windows = pygetwindow.getWindowsWithTitle("Visual Studio Code")
        target_win = None
        for win in windows:
            if "Visual Studio Code" in win.title and win.visible:
                target_win = win
                break
        
        if not target_win:
            _log_bridge("VS Code not found. Aborting.", tier="✖ CRITICAL")
            return

        # 2. Focus Window
        try:
            if target_win.isMinimized:
                target_win.restore()
            target_win.activate()
            time.sleep(0.4)
        except Exception as e:
            _log_bridge(f"Focus friction: {e}")

        # 3. State Detection & Interaction
        gemini_active = is_gemini_running()
        
        if not gemini_active:
            _log_bridge("Cold Start: Initializing Gemini CLI.")
            # Open new integrated terminal
            pyautogui.hotkey("ctrl", "shift", "`")
            time.sleep(1.0)
            # Run gemini
            pyperclip.copy("gemini")
            pyautogui.hotkey("ctrl", "v")
            pyautogui.press("enter")
            _log_bridge("Waiting for CLI readiness...")
            time.sleep(4.0) # Cold start requires more time
            greeting = "Greet me as JARVIS on system activation — one sentence, formal."
        else:
            _log_bridge("Warm Wake: Focusing active session.")
            # Focus terminal panel
            pyautogui.hotkey("ctrl", "`")
            time.sleep(0.5)
            greeting = "Jarvis was just called. Acknowledge briefly as JARVIS — one sentence."

        # 4. Inject Greeting Prompt
        pyperclip.copy(greeting)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(0.1)
        pyautogui.press("enter")
            
        _log_bridge("Bridge Synchronization successful.")

    except Exception as e:
        _log_bridge(f"Bridge Failure: {str(e)}", tier="✖ CRITICAL")
```

### Task 2: Verify Listener Integration

**Files:**
- Modify: `JARVIS/core/listener.py`

- [ ] **Step 1: Check listener call signature**
Ensure `activate_vscode_terminal` is called correctly without redundant parameters.

- [ ] **Step 2: Clean up imports and redundant logic**
Remove unused imports or legacy variables if any.

### Task 3: Validation

- [ ] **Step 1: Manual Test (Cold Start)**
Close all terminals in VS Code. Run `listener.py`. Say "Jarvis".
Verify: New terminal opens -> `gemini` runs -> JARVIS greets.

- [ ] **Step 2: Manual Test (Warm Wake)**
Leave Gemini running in VS Code. Run `listener.py`. Say "Jarvis".
Verify: Terminal focuses -> JARVIS acknowledges briefly.

- [ ] **Step 3: Cooldown Test**
Say "Jarvis" multiple times quickly.
Verify: Only the first one triggers.
