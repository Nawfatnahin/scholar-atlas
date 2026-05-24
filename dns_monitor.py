import time
import subprocess
import socket

def speak(text):
    subprocess.run(['py', r'C:\Users\ASUS\.gemini\scripts\speak.py', text])

def check_dns():
    try:
        # Try resolving via system first
        socket.gethostbyname('scholar-atlas.pages.dev')
        return True
    except socket.gaierror:
        return False

print("Starting DNS monitor for scholar-atlas.pages.dev...")
while True:
    if check_dns():
        print("Success! Domain resolved.")
        speak("Sir, Scholar Atlas is now live. The DNS has successfully propagated.")
        break
    else:
        print("Not resolved yet. Waiting 5 minutes...")
    
    time.sleep(300)
