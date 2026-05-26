import time
import threading

class TaskManager:
    def __init__(self):
        self.tasks = []
        self.running = False

    def add_task(self, name, interval, action):
        self.tasks.append({"name": name, "interval": interval, "action": action, "last_run": 0})

    def _loop(self):
        while self.running:
            current_time = time.time()
            for task in self.tasks:
                if current_time - task["last_run"] >= task["interval"]:
                    task["action"]()
                    task["last_run"] = current_time
            time.sleep(1)

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()
            print("TaskManager started.")

    def stop(self):
        self.running = False

def sample_task():
    print("Background monitor check executed.")

if __name__ == "__main__":
    manager = TaskManager()
    manager.add_task("File Monitor", 5, sample_task)
    manager.start()
    time.sleep(6)
    manager.stop()
