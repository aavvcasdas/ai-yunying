#!/usr/bin/env python3
import json, subprocess, time, os, sys
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".repos.json")
c = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def get(path):
    if path in c: return c[path]
    p = subprocess.run(["curl","-s","-H","Accept: application/vnd.github+json","https://api.github.com/"+path],capture_output=True,text=True)
    try: d = json.loads(p.stdout)
    except Exception: return {}
    if isinstance(d, dict) and d.get("message"): print("ERR", path, d["message"][:60], file=sys.stderr); return {}
    c[path]=d; json.dump(c,open(CACHE,"w"),ensure_ascii=False); return d
repos = [l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith("#")]
print("repo\tstar\tfork\tlic\tcreated\tpushed\tlang")
for r in repos:
    d = get("repos/"+r)
    if not d: continue
    lic = (d.get("license") or {}).get("spdx_id") or "NONE"
    print(f"{r}\t{d['stargazers_count']}\t{d['forks_count']}\t{lic}\t{d['created_at'][:10]}\t{d['pushed_at'][:10]}\t{d.get('language')}")
    time.sleep(0.15)
