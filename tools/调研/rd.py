#!/usr/bin/env python3
import subprocess, sys
repo = sys.argv[1]; a = int(sys.argv[2]) if len(sys.argv)>2 else 0; b = int(sys.argv[3]) if len(sys.argv)>3 else 2500
t = subprocess.run(["curl","-sL","-H","Accept: application/vnd.github.raw+json",
                    f"https://api.github.com/repos/{repo}/readme"],capture_output=True,text=True).stdout
print(f"--- {repo} len={len(t)} [{a}:{b}] ---")
print(t[a:b])
