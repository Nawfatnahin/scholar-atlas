"""
JARVIS — App / Script Launcher (Section 10)
Translates natural language to system-level commands and scripts.
"""

import logging
import subprocess
import os

logger = logging.getLogger("SYSTEM_LAUNCHER")

class SystemLauncher:
    def __init__(self):
        self.registry = {
            "browser": "start msedge",
            "vscode": "code",
            "terminal": "start cmd"
        }
        self.destructive_keywords = ["kill", "delete", "remove", "restart", "shutdown", "format"]

    def _is_destructive(self, command: str) -> bool:
        """Check if command involves destructive actions."""
        return any(keyword in command.lower() for keyword in self.destructive_keywords)

    def register_alias(self, alias: str, command: str):
        """Add a custom alias to the registry."""
        self.registry[alias.lower()] = command
        logger.info("Registered alias: %s -> %s", alias, command)
        return f"Alias '{alias}' mapped to '{command}' successfully, Sir."

    def execute(self, nl_command: str) -> str:
        """Map natural language to a system command and execute."""
        command = nl_command.lower().strip()
        target_exec = None
        
        # Check registry aliases
        for alias, cmd in self.registry.items():
            if alias in command:
                target_exec = cmd
                break
                
        if not target_exec:
            # Fallback simple extractor (e.g. "open notepad" -> "notepad")
            if command.startswith("open "):
                target_exec = f"start {command[5:]}"
            elif command.startswith("run "):
                target_exec = command[4:]
            elif command.startswith("kill "):
                target_exec = f"taskkill /IM {command[5:]} /F"
            else:
                return f"I am unable to resolve a system action for '{nl_command}', Sir."

        # Boundary confirmation
        if self._is_destructive(target_exec):
            return f"Just to confirm — you'd like me to execute '{target_exec}'. This is a destructive action. Shall I proceed?"

        # Execution
        try:
            logger.info("Executing system command: %s", target_exec)
            subprocess.Popen(target_exec, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return f"Command '{target_exec}' executed, Sir."
        except Exception as e:
            logger.error("Execution failed: %s", e)
            return f"That didn't go as expected, Sir. Error: {e}. Would you like me to attempt an alternative approach?"
