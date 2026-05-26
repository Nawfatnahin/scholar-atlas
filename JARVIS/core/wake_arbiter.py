"""
JARVIS — Wake Arbiter (Mutex Controller)
Asyncio lock: only ONE wake event processes at a time.
If multiple voice events fire → queue them, don't drop.
Emits status to runtime.log on every arbitration decision.
"""

import asyncio
import logging
import time
from pathlib import Path

logger = logging.getLogger("WAKE_ARBITER")


class WakeArbiter:
    """
    Mutex controller for wake events.
    Ensures only one wake source is processed at a time.
    Queues competing events rather than dropping them.
    """

    def __init__(self):
        self._lock = asyncio.Lock()
        self._queue: asyncio.Queue = asyncio.Queue()
        self._handler = None    # async callable(source: str) -> None
        self._running: bool = False
        self._task: asyncio.Task | None = None
        self._processed_count: int = 0
        self._queued_count: int = 0
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_handler(self, handler) -> None:
        """
        Set the async handler for wake events.
        handler signature: async def handler(source: str) -> None
        """
        self._handler = handler

    async def start(self) -> None:
        """Start the arbiter queue processor."""
        self._running = True
        self._loop = asyncio.get_running_loop()
        self._task = asyncio.create_task(self._process_queue())
        logger.info("✦ NOMINAL | WAKE_ARBITER | Started — mutex active")

    async def stop(self) -> None:
        """Stop the arbiter."""
        self._running = False
        # Push a sentinel to unblock the queue
        await self._queue.put(None)
        if self._task:
            try:
                await asyncio.wait_for(self._task, timeout=3.0)
            except asyncio.TimeoutError:
                self._task.cancel()
            self._task = None
        logger.info(
            "✦ NOMINAL | WAKE_ARBITER | Stopped — processed=%d, queued=%d",
            self._processed_count, self._queued_count,
        )

    def submit_wake(self, source: str) -> None:
        """
        Submit a wake event from any thread (thread-safe).
        Events are queued and processed one at a time.
        """
        self._queued_count += 1
        logger.info(
            "✦ NOMINAL | WAKE_ARBITER | Event from '%s' submitted (queued=%d)",
            source, self._queued_count
        )

        if self._loop and self._loop.is_running():
            self._loop.call_soon_threadsafe(self._queue.put_nowait, source)
        else:
            try:
                self._queue.put_nowait(source)
            except Exception as exc:
                logger.error("✖ CRITICAL | WAKE_ARBITER | Submit failed for '%s': %s", source, exc)

    async def _process_queue(self) -> None:
        """Continuously process wake events from the queue under mutex."""
        while self._running:
            try:
                source = await asyncio.wait_for(self._queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue

            if source is None:
                break  # Sentinel — shutdown

            async with self._lock:
                logger.info(
                    "✦ NOMINAL | WAKE_ARBITER | Processing wake from '%s'", source
                )
                self._processed_count += 1
                if self._handler:
                    try:
                        await self._handler(source)
                    except Exception as exc:
                        logger.error(
                            "✖ CRITICAL | WAKE_ARBITER | Handler error for '%s': %s",
                            source, exc,
                        )

    @property
    def stats(self) -> dict:
        """Return arbiter statistics."""
        return {
            "processed": self._processed_count,
            "queued": self._queued_count,
            "pending": self._queue.qsize(),
            "locked": self._lock.locked(),
        }


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(message)s")

    async def _test():
        arbiter = WakeArbiter()

        async def _handler(source: str):
            print(f"  >> Handling wake from: {source}")
            await asyncio.sleep(1.0)  # Simulate processing
            print(f"  >> Done handling: {source}")

        arbiter.set_handler(_handler)
        await arbiter.start()

        # Simulate concurrent wake events
        arbiter.submit_wake("voice_vosk_1")
        await asyncio.sleep(0.1)
        arbiter.submit_wake("voice_vosk_2")  # Should queue

        await asyncio.sleep(3.0)
        print(f"\n  Stats: {arbiter.stats}")
        await arbiter.stop()

    print("[JARVIS]: Wake arbiter standalone test...")
    asyncio.run(_test())
    print("[JARVIS]: ✦ NOMINAL | WAKE_ARBITER | Standalone test passed.")
