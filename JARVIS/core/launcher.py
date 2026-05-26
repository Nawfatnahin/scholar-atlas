import subprocess
import os

class AppLauncher:
    def __init__(self):
        self.destructive_commands = ["rm", "del", "format", "drop"]

    def is_destructive(self, command):
        return any(dc in command.lower() for dc in self.destructive_commands)

    def execute(self, command, force=False):
        if self.is_destructive(command) and not force:
            return "WARNING: Destructive action detected. Execution blocked. Use force=True to override."
        
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.stdout if result.returncode == 0 else result.stderr
        except Exception as e:
            return str(e)

if __name__ == "__main__":
    launcher = AppLauncher()
    print(launcher.execute("echo 'JARVIS Systems Online'"))
