"""
JARVIS — Mood & Tone Detection Engine (Section 02)
Silently analyzes user text for emotional and cognitive state signals.
"""

import re
import logging

logger = logging.getLogger("MOOD_ENGINE")

class MoodEngine:
    def __init__(self):
        # Keyword and regex patterns for mood detection
        self.patterns = {
            "STRESS": [
                r"\bugh\b", r"\bidk\b", r"nothing is working", 
                r"just fix it", r"why\b", r"!{3,}"
            ],
            "CURIOSITY": [
                r"i was thinking", r"what if", r"how about", 
                r"maybe we could", r"i wonder"
            ],
            "LOW_ENERGY": [
                r"i'll deal with it later", r"\bmeh\b", r"not now", 
                r"maybe later", r"tired", r"exhausted"
            ],
            "GOOD_MOOD": [
                r"\bhaha\b", r"\blol\b", r"awesome", r"great job", 
                r"perfect", r"thanks!"
            ]
        }

    def analyze(self, text: str) -> str:
        """Analyze text and return detected mood."""
        if not text:
            return "NEUTRAL"
            
        text_lower = text.lower()
        
        # 1. Check Stress
        for pattern in self.patterns["STRESS"]:
            if re.search(pattern, text_lower):
                return "STRESS"
        
        # Upper case check for stress (capitalized frustration)
        words = text.split()
        upper_words = [w for w in words if w.isupper() and len(w) > 2]
        if len(upper_words) >= 2 or re.search(r"[A-Z]{4,}", text):
            # Exclude purely acronym-heavy texts if possible, but simple heuristic:
            return "STRESS"
            
        # 2. Check Low Energy
        for pattern in self.patterns["LOW_ENERGY"]:
            if re.search(pattern, text_lower):
                return "LOW_ENERGY"
        if len(words) <= 2 and not any(p in text_lower for p in ["yes", "no", "ok", "done", "run"]):
            return "LOW_ENERGY"
            
        # 3. Check Curiosity
        for pattern in self.patterns["CURIOSITY"]:
            if re.search(pattern, text_lower):
                return "CURIOSITY"
        if text.count("?") >= 2 or len(words) > 40:
            # Long paragraphs or multiple questions
            return "CURIOSITY"
            
        # 4. Check Focus
        # Numbered lists or strict commands
        if re.search(r"^\d+\.", text) or text_lower.startswith(("run", "execute", "do", "fix", "create", "build", "update")):
            return "FOCUS"
            
        # 5. Check Good Mood
        for pattern in self.patterns["GOOD_MOOD"]:
            if re.search(pattern, text_lower):
                return "GOOD_MOOD"
        if "!" in text and "!!!" not in text and not upper_words:
            return "GOOD_MOOD"
            
        return "NEUTRAL"
