#!/usr/bin/env python3
"""GitHub 仓库检索：按关键词拉取 star / 最近推送 / 许可证，输出紧凑表格。
用法: python3 gh_search.py "query" ...   (query 里可含 pushed:>2026-04-29)
"""
import json, os, subprocess, sys, time, urllib.parse

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache.json")

def load():
    if os.path.exists(CACHE):
        return json.load(open(CACHE))
    return {}

def save(c):
    json.dump(c, open(CACHE, "w"), ensure_ascii=False)

def search(q, per_page=30, sort="stars"):
    cache = load()
    key = f"{q}|{sort}|{per_page}"
    if key in cache:
        return cache[key]
    url = "https://api.github.com/search/repositories?" + urllib.parse.urlencode(
        {"q": q, "sort": sort, "order": "desc", "per_page": per_page})
    for attempt in range(3):
        p = subprocess.run(["curl", "-s", "-H", "Accept: application/vnd.github+json", url],
                           capture_output=True, text=True)
        try:
            d = json.loads(p.stdout)
        except Exception:
            time.sleep(5); continue
        if "items" in d:
            cache[key] = d
            save(cache)
            return d
        if "rate limit" in json.dumps(d, ensure_ascii=False).lower() or d.get("message","").startswith("API rate"):
            time.sleep(20); continue
        print("ERR", d.get("message"), file=sys.stderr); return d
    return {}

def rows(d, min_star=0):
    out = []
    for i in d.get("items", []):
        lic = (i.get("license") or {}).get("spdx_id") or "NONE"
        out.append(dict(star=i["stargazers_count"], fork=i["forks_count"], name=i["full_name"],
                        url=i["html_url"], pushed=i["pushed_at"][:10], created=i["created_at"][:10],
                        lic=lic, lang=i.get("language"), desc=(i.get("description") or "").replace("\n"," ")[:110],
                        topics=i.get("topics", [])[:6]))
    return [r for r in out if r["star"] >= min_star]

if __name__ == "__main__":
    for q in sys.argv[1:]:
        d = search(q)
        print(f"\n### {q}  (total={d.get('total_count')}, 返回={len(d.get('items',[]))})")
        for r in rows(d):
            print(f"{r['star']:>7}★ {r['fork']:>6}⑂ {r['pushed']} {r['lic']:<14} {r['name']}")
            print(f"          {r['desc']}")
        time.sleep(2.5)
