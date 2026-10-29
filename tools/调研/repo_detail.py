#!/usr/bin/env python3
import json, subprocess, sys, time, os
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".repos.json")
c = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def get(path):
    if path in c: return c[path]
    p = subprocess.run(["curl","-s","-H","Accept: application/vnd.github+json","https://api.github.com/"+path],capture_output=True,text=True)
    try: d = json.loads(p.stdout)
    except Exception: return {}
    if isinstance(d, dict) and d.get("message"): print("ERR", path, d["message"][:80], file=sys.stderr); return {}
    c[path]=d; json.dump(c,open(CACHE,"w"),ensure_ascii=False); return d

for repo in sys.argv[1:]:
    d = get("repos/"+repo)
    if not d: continue
    lic = (d.get("license") or {}).get("spdx_id") or "NONE"
    print(f"\n=== {repo}  {d.get('stargazers_count')}★ {d.get('forks_count')}⑂ | {lic} | created {d.get('created_at','')[:10]} | pushed {d.get('pushed_at','')[:10]} | lang {d.get('language')}")
    print("  topics:", ",".join(d.get("topics") or [])[:200])
    print("  desc:", (d.get("description") or "")[:300])
    print("  home:", d.get("homepage"))
    # latest commit date
    commits = get(f"repos/{repo}/commits?per_page=1")
    if isinstance(commits, list) and commits:
        print("  last commit:", commits[0]["commit"]["author"]["date"][:10], "|", commits[0]["commit"]["message"].split("\n")[0][:80])
    time.sleep(0.3)
