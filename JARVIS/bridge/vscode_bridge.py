"""
JARVIS — VS Code Bridge
Detects VS Code window via pygetwindow.
Checks if Gemini CLI is running in terminal (process scan via psutil).
Trigger source: WAKE event from trigger_bus.
"""

import sys
import time
import logging
from pathlib import Path

import win32gui
import win32con
import win32process
import win32api
import psutil
import pygetwindow as gw
import pyautogui
import pyperclip

logger = logging.getLogger("VSCODE_BRIDGE")

# Disable pyautogui failsafe for automated operation
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05


class VSCodeBridge:
    """Detects VS Code and injects wake macros into the terminal."""

    def force_focus_window(self, hwnd) -> None:
        """Bypass Windows focus-stealing prevention using thread input attachment."""
        try:
            fore_window = win32gui.GetForegroundWindow()
            fore_thread = win32process.GetWindowThreadProcessId(fore_window)[0]
            app_thread = win32api.GetCurrentThreadId()

            if fore_thread != app_thread:
                try:
                    win32process.AttachThreadInput(app_thread, fore_thread, True)
                except Exception:
                    pass

            win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
            win32gui.SetForegroundWindow(hwnd)
            win32gui.SetActiveWindow(hwnd)

            if fore_thread != app_thread:
                try:
                    win32process.AttachThreadInput(app_thread, fore_thread, False)
                except Exception:
                    pass
            logger.info("✦ NOMINAL | VSCODE_BRIDGE | Bypassed Windows focus-stealing prevention")
        except Exception as exc:
            logger.error("⚠ ADVISORY | VSCODE_BRIDGE | force_focus_window exception: %s", exc)

    def __init__(self):
        self._last_injection: float = 0.0
        self._cooldown_sec: float = 3.0
        self._vscode_process_cache: bool = False
        self._last_process_check: float = 0.0
        self._process_cache_ttl: float = 5.0

    # -- Detection -----------------------------------------------------------

    def find_vscode_window(self):
        """
        Find the VS Code window.
        Returns the window object or None.
        """
        try:
            # Quick check: is VS Code even running?
            if not self.is_vscode_running():
                return None

            windows = gw.getWindowsWithTitle("Visual Studio Code")
            if not windows:
                # Try alternate title patterns
                windows = gw.getWindowsWithTitle("VS Code")
            if not windows:
                windows = [
                    w for w in gw.getAllWindows()
                    if "code" in w.title.lower() and ("visual" in w.title.lower() or "vs" in w.title.lower())
                ]
            if windows:
                logger.debug("✦ NOMINAL | VSCODE_BRIDGE | Found VS Code: '%s'", windows[0].title)
                return windows[0]
            return None
        except Exception as exc:
            logger.error("✖ CRITICAL | VSCODE_BRIDGE | Window search failed: %s", exc)
            return None

    def is_gemini_cli_running(self) -> bool:
        """Check if Gemini CLI process is running in VS Code terminal."""
        try:
            for proc in psutil.process_iter(["name", "cmdline"]):
                try:
                    cmdline = proc.info.get("cmdline")
                    if cmdline:
                        cmdline_str = " ".join(cmdline).lower()
                        # Exclude background system processes
                        if "antigravity" in cmdline_str or "listener" in cmdline_str or "main.py" in cmdline_str:
                            continue
                        if any("gemini" in arg.lower() for arg in cmdline):
                            return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            return False
        except Exception:
            return False

    def is_vscode_running(self) -> bool:
        """Check if VS Code process is running with short-lived cache."""
        now = time.time()
        if now - self._last_process_check < self._process_cache_ttl:
            return self._vscode_process_cache

        try:
            found = False
            for proc in psutil.process_iter(["name"]):
                try:
                    if "code" in proc.info["name"].lower():
                        found = True
                        break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            self._vscode_process_cache = found
            self._last_process_check = now
            return found
        except Exception:
            return False

    # -- Injection -----------------------------------------------------------

    def inject_wake(self, greeting: str | None = None) -> bool:
        """
        Inject terminal spawn or focus macro into VS Code.
        Returns True on success, False on failure.
        """
        now = time.time()
        if now - self._last_injection < self._cooldown_sec:
            logger.debug("⚠ ADVISORY | VSCODE_BRIDGE | Injection cooldown active")
            return False

        window = self.find_vscode_window()
        if not window:
            logger.error("✖ CRITICAL | VSCODE_BRIDGE | Cannot inject — VS Code window not found")
            return False

        try:
            # Bring VS Code to foreground using Win32 force-focus
            self.force_focus_window(window._hWnd)
            time.sleep(0.3) # Settle duration to let window focus fully register

            if self.is_gemini_cli_running():
                # Gemini CLI is already active. Focus the window silently without disruptive keyboard simulations.
                logger.info("✦ NOMINAL | VSCODE_BRIDGE | Gemini CLI active. Focused silently.")
            else:
                # Open a new terminal via Command Palette
                pyautogui.hotkey("ctrl", "shift", "p")
                time.sleep(0.5) # Increased from 0.2 to ensure Command Palette is fully loaded
                pyperclip.copy("Terminal: Create New Terminal")
                pyautogui.hotkey("ctrl", "v")
                time.sleep(0.2) # Increased from 0.1
                pyautogui.press("enter")
                time.sleep(1.5) # Increased from 0.8 to ensure terminal is fully spawned and focused

                # 1. Inject and launch gemini CLI
                pyperclip.copy("gemini")
                pyautogui.hotkey("ctrl", "v")
                time.sleep(0.1)
                pyautogui.press("enter")

                # 2. Wait for the Gemini CLI prompt to fully load and initialize (increased to bypass race conditions)
                time.sleep(3.5)

                # 3. Use pre-provided greeting or generate a time-appropriate greeting safely
                if not greeting:
                    try:
                        root_path = Path(__file__).resolve().parent.parent
                        sys.path.insert(0, str(root_path))
                        from JARVIS.core.listener import generate_sophisticated_greeting
                        greeting = generate_sophisticated_greeting()
                    except Exception:
                        greeting = "Good evening, Sir. JARVIS systems nominal. Standing by."

                # 4. Inject the generated prompt directly into the Gemini CLI bar and press Enter
                pyperclip.copy(greeting)
                pyautogui.hotkey("ctrl", "v")
                time.sleep(0.1)
                pyautogui.press("enter")
                logger.info("✦ NOMINAL | VSCODE_BRIDGE | Spawned new terminal, launched gemini, and injected dynamic greeting prompt")

            self._last_injection = time.time()
            return True

        except Exception as exc:
            logger.error("✖ CRITICAL | VSCODE_BRIDGE | Injection failed: %s", exc)
            return False

    # -- Composite action ----------------------------------------------------

    def handle_wake(self, greeting: str | None = None) -> bool:
        """
        Full wake handling sequence:
        1. Check VS Code is running
        2. Inject macro to focus/spawn terminal
        """
        if not self.is_vscode_running():
            logger.info("⚠ ADVISORY | VSCODE_BRIDGE | VS Code not running — skipping injection")
            return False

        window = self.find_vscode_window()
        if not window:
            logger.error("✖ CRITICAL | VSCODE_BRIDGE | VS Code running but window not found")
            return False

        return self.inject_wake(greeting=greeting)


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")
    print("[JARVIS]: VS Code bridge standalone test...")

    bridge = VSCodeBridge()

    # Detection tests
    vscode_running = bridge.is_vscode_running()
    print(f"  VS Code running: {vscode_running}")

    window = bridge.find_vscode_window()
    print(f"  VS Code window: {window.title if window else 'Not found'}")

    gemini = bridge.is_gemini_cli_running()
    print(f"  Gemini CLI running: {gemini}")

    print("\n[JARVIS]: ✦ NOMINAL | VSCODE_BRIDGE | Standalone test complete.")
    print("[JARVIS]: (Injection not executed in test mode — run via main.py)")
