"""
JARVIS — Subtitle Overlay
Transparent, always-on-top, non-interactive pygame window.
Bottom-center of screen. Segoe UI 28pt, white on semi-transparent dark pill.
Auto-dismiss 1.5s after speech ends.
"""

import sys
import json
import time
import threading
from pathlib import Path

import pygame

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent.parent
_SETTINGS_FILE = _ROOT / "config" / "settings.json"


def _load_settings() -> dict:
    """Load subtitle-related settings from config/settings.json."""
    try:
        with open(_SETTINGS_FILE, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


# ---------------------------------------------------------------------------
# Overlay Class
# ---------------------------------------------------------------------------
class SubtitleOverlay:
    """Pygame-based transparent subtitle window."""

    def __init__(self):
        settings = _load_settings()
        self._font_name: str = settings.get("subtitle_font", "Segoe UI")
        self._font_size: int = settings.get("subtitle_font_size", 28)
        self._dismiss_sec: float = settings.get("subtitle_dismiss_sec", 1.5)
        self._running: bool = False
        self._text: str = ""
        self._revealed_len: int = -1
        self._show_until: float = 0.0
        self._lock = threading.Lock()
        self._screen = None
        self._font = None
        self._screen_w: int = 0
        self._screen_h: int = 0

    # -- lifecycle -----------------------------------------------------------

    def start(self) -> None:
        """Initialise pygame and open the overlay window."""
        pygame.init()
        info = pygame.display.Info()
        self._screen_w = info.current_w
        self._screen_h = info.current_h

        import os
        os.environ["SDL_VIDEO_WINDOW_POS"] = f"0,{self._screen_h - 120}"

        self._screen = pygame.display.set_mode(
            (self._screen_w, 120),
            pygame.NOFRAME,
        )
        pygame.display.set_caption("JARVIS Subtitle")

        # Make window transparent + always-on-top via win32 (Windows only)
        try:
            import ctypes
            from ctypes import wintypes

            hwnd = pygame.display.get_wm_info()["window"]
            user32 = ctypes.windll.user32

            GWL_EXSTYLE = -20
            WS_EX_LAYERED = 0x00080000
            WS_EX_TRANSPARENT = 0x00000020
            WS_EX_TOPMOST = 0x00000008
            WS_EX_TOOLWINDOW = 0x00000080
            HWND_TOPMOST = -1
            SWP_NOMOVE = 0x0002
            SWP_NOSIZE = 0x0001
            LWA_COLORKEY = 0x00000001

            style = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            style |= WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW
            user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)

            # Magenta = transparent colour key
            user32.SetLayeredWindowAttributes(hwnd, 0x00FF00FF, 0, LWA_COLORKEY)

            user32.SetWindowPos(
                hwnd, HWND_TOPMOST, 0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE,
            )
        except Exception:
            pass  # Non-Windows — skip transparency

        try:
            self._font = pygame.font.SysFont(self._font_name, self._font_size)
        except Exception:
            self._font = pygame.font.Font(None, self._font_size)

        self._running = True

    def stop(self) -> None:
        """Gracefully tear down pygame."""
        self._running = False
        try:
            pygame.quit()
        except Exception:
            pass

    # -- API -----------------------------------------------------------------

    def show(self, text: str) -> None:
        """Display subtitle text. Resets dismiss timer."""
        with self._lock:
            self._text = text
            self._revealed_len = -1
            self._show_until = time.time() + self._dismiss_sec + 30  # held during speech

    def set_revealed(self, length: int) -> None:
        """Update how much of the text is currently revealed (for karaoke sync)."""
        with self._lock:
            self._revealed_len = length

    def dismiss(self) -> None:
        """Start the auto-dismiss countdown."""
        with self._lock:
            self._show_until = time.time() + self._dismiss_sec

    def clear(self) -> None:
        """Immediately clear subtitle."""
        with self._lock:
            self._text = ""
            self._show_until = 0.0

    # -- render loop ---------------------------------------------------------

    def tick(self) -> bool:
        """
        Render one frame. Call from a loop.
        Returns False if the overlay should shut down.
        """
        if not self._running:
            return False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self._running = False
                return False

        # Magenta background = transparent via colour key
        self._screen.fill((255, 0, 255))

        with self._lock:
            text = self._text
            revealed_len = self._revealed_len
            visible = time.time() < self._show_until

        if visible and text:
            self._render_pill(text, revealed_len)

        pygame.display.flip()
        pygame.time.wait(33)  # ~30 fps
        return True

    def _render_pill(self, text: str, revealed_len: int) -> None:
        """Render text inside a semi-transparent dark pill at bottom-center."""
        tw, th = self._font.size(text)
        padding_x, padding_y = 32, 12
        pill_w = tw + padding_x * 2
        pill_h = th + padding_y * 2
        pill_x = (self._screen_w - pill_w) // 2
        pill_y = (120 - pill_h) // 2

        # Semi-transparent dark background
        pill_surface = pygame.Surface((pill_w, pill_h), pygame.SRCALPHA)
        pill_surface.fill((20, 20, 20, 180))
        pygame.draw.rect(
            pill_surface, (20, 20, 20, 180),
            pygame.Rect(0, 0, pill_w, pill_h),
            border_radius=pill_h // 2,
        )

        self._screen.blit(pill_surface, (pill_x, pill_y))

        if revealed_len == -1 or revealed_len >= len(text):
            # Render fully revealed
            rendered = self._font.render(text, True, (255, 255, 255))
            self._screen.blit(rendered, (pill_x + padding_x, pill_y + padding_y))
        else:
            # Karaoke style: unrevealed text in grey, revealed text in white (clipped)
            unrevealed_surf = self._font.render(text, True, (150, 150, 150))
            self._screen.blit(unrevealed_surf, (pill_x + padding_x, pill_y + padding_y))
            
            if revealed_len > 0:
                revealed_text = text[:revealed_len]
                revealed_width = self._font.size(revealed_text)[0]
                revealed_surf = self._font.render(text, True, (255, 255, 255))
                clip_rect = pygame.Rect(0, 0, revealed_width, th)
                self._screen.blit(revealed_surf, (pill_x + padding_x, pill_y + padding_y), area=clip_rect)

    # -- thread runner -------------------------------------------------------

    def run_loop(self) -> None:
        """Blocking render loop — run in a dedicated thread."""
        self.start()
        try:
            while self.tick():
                pass
        finally:
            self.stop()


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    overlay = SubtitleOverlay()
    overlay.start()
    overlay.show("JARVIS subtitle overlay test — standing by, Sir.")
    try:
        import time as _t
        _start = _t.time()
        while _t.time() - _start < 5:
            if not overlay.tick():
                break
        overlay.dismiss()
        _end = _t.time()
        while _t.time() - _end < 2:
            if not overlay.tick():
                break
    finally:
        overlay.stop()
    print("[JARVIS]: ✦ NOMINAL | SUBTITLE_OVERLAY | Standalone test passed.")
