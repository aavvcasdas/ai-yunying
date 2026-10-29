#!/usr/bin/env python3
import subprocess, sys, re
repo = sys.argv[1]; kws = sys.argv[2].split("|")
t = subprocess.run(["curl","-sL","-H","Accept: application/vnd.github.raw+json",
                    f"https://api.github.com/repos/{repo}/readme"],capture_output=True,text=True).stdout
print(f"--- {repo} len={len(t)} ---")
seen=set()
for i,line in enumerate(t.split("\n")):
    if any(k in line for k in kws) and line.strip() and line[:60] not in seen:
        seen.add(line[:60]); print(f"{i:>4}| {line.strip()[:190]}")
