# WHISPERING WIND Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an offline ambient listener using the Vosk engine to detect the "JARVIS" wake-word and activate the core system.

**Architecture:** A background subprocess `ambient_listener.py` that streams audio from the primary microphone via PyAudio and processes it through a local Vosk model. It communicates activation to `jarvis.py` via a high-priority signal.

**Tech Stack:** Python, `vosk`, `pyaudio`, `asyncio`.

---

### Task 1: Model Acquisition & Setup

**Files:**
- Create: `JARVIS/core/models/.gitkeep`
- Modify: `JARVIS/core/ambient_listener.py`

- [ ] **Step 1: Create the model directory structure**
`mkdir -p JARVIS/core/models`

- [ ] **Step 2: Implement model downloader script**
(Note: Vosk models are usually downloaded as ZIP. I will provide a utility script to fetch the small English model).

```python
import urllib.request
import zipfile
import os

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
MODEL_PATH = "JARVIS/core/models/vosk-model-small-en-us-0.15"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("[JARVIS]: ✦ NOMINAL — Downloading acoustic model...")
        zip_file = "model.zip"
        urllib.request.urlretrieve(MODEL_URL, zip_file)
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall("JARVIS/core/models")
        os.remove(zip_file)
        print("[JARVIS]: ✦ NOMINAL — Model acquisition complete.")

if __name__ == "__main__":
    download_model()
```

- [ ] **Step 3: Run the downloader**
`py JARVIS/core/setup_model.py` (Temporary utility name).

- [ ] **Step 4: Commit**
`git add JARVIS/core/models; git commit -m "chore: [WHISPERING WIND] Setup acoustic model infrastructure"`

---

### Task 2: Listener Development

**Files:**
- Create: `JARVIS/core/ambient_listener.py`
- Test: `JARVIS/tests/test_wake_word.py`

- [ ] **Step 1: Implement the Vosk listener loop**

```python
import os
import sys
import json
import pyaudio
from vosk import Model, KaldiRecognizer

# [JARVIS] Operation WHISPERING WIND: Ambient Listener
# Offline wake-word detection engine.

MODEL_PATH = "JARVIS/core/models/vosk-model-small-en-us-0.15"

def run_listener():
    if not os.path.exists(MODEL_PATH):
        print("[LISTENER]: ✖ CRITICAL — Model not found.")
        return

    model = Model(MODEL_PATH)
    rec = KaldiRecognizer(model, 16000)
    
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=8000)
    stream.start_stream()

    print("[LISTENER]: ✦ NOMINAL — Ambient awareness engaged.")

    while True:
        data = stream.read(4000)
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            text = result.get("text", "")
            if "jarvis" in text.lower():
                print("[LISTENER]: ✦ NOMINAL — Wake-word detected.")
                # Signal parent (In production, use signal or pipe)
                sys.stdout.write("TRIGGER_ACTIVATED\n")
                sys.stdout.flush()

if __name__ == "__main__":
    run_listener()
```

- [ ] **Step 2: Verify detection**
Run `py JARVIS/core/ambient_listener.py` and say "JARVIS" near the microphone.

- [ ] **Step 3: Commit**
`git add JARVIS/core/ambient_listener.py; git commit -m "feat: [WHISPERING WIND] Implement Vosk-based listener loop"`

---

### Task 3: Core Integration

**Files:**
- Modify: `JARVIS/core/jarvis.py`

- [ ] **Step 1: Integrate listener management in core**

```python
# Add inside run_core()
async def run_core():
    # ... previous setup ...
    
    # Spawn Ambient Listener
    ambient_process = subprocess.Popen(
        [sys.executable, "-m", "JARVIS.core.ambient_listener"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True
    )
    
    # Asynchronous task to monitor for trigger signal
    async def monitor_trigger():
        while True:
            line = await asyncio.to_thread(ambient_process.stdout.readline)
            if "TRIGGER_ACTIVATED" in line:
                await sync_speak("I am here Sir. How can I assist you?")
                # Future: Focus prompt or trigger specific logic
    
    asyncio.create_task(monitor_trigger())
    
    # ... previous exit confirmation ...
    ambient_process.terminate()
```

- [ ] **Step 2: Final Verification**
Execute full JARVIS system and test hands-free activation.

- [ ] **Step 3: Commit**
`git commit -am "feat: [WHISPERING WIND] Integrate ambient listener into core hub"`
