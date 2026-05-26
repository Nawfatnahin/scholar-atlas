import json
import os
from datetime import datetime

class PersistentMemory:
    def __init__(self, storage_path="jarvis_memory.json"):
        self.storage_path = storage_path
        self.memory = {
            "preferences": {},
            "professional_context": {},
            "personal_patterns": {},
            "knowledge_base": {}
        }
        self.load()

    def load(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r") as f:
                self.memory = json.load(f)

    def save(self):
        with open(self.storage_path, "w") as f:
            json.dump(self.memory, f, indent=4)

    def update_context(self, category, key, value):
        if category in self.memory:
            self.memory[category][key] = value
            self.save()
            return True
        return False

    def recall(self, category, key):
        return self.memory.get(category, {}).get(key, None)

    def dump_memory(self):
        return json.dumps(self.memory, indent=2)

if __name__ == "__main__":
    mem = PersistentMemory()
    mem.update_context("preferences", "theme", "dark")
    print(mem.dump_memory())
