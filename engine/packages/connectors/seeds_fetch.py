"""Seeds-driven fetcher: download the ESCAP Legal Inventory's actual documents.

Reads data/seeds.json (384 acts with official URLs; MY = 146, 107 direct PDFs),
downloads each politely, archives bytes + sha256 + access date, and records
dead links (which feed the Malaysia error-audit — a broken URL in ESCAP's own
inventory is exactly the planted-error class we must catch).

Cache policy: a URL fetched successfully once is never refetched (act PDFs are
static); dead links are retried on each run.
"""
from __future__ import annotations

import hashlib
import json
import time
from datetime import date
from pathlib import Path

import httpx

_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 ClauseChain-research/0.1"),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
}
POLITE_DELAY_S = 3.0
ECON_CC = {"Singapore": "sg", "Malaysia": "my", "Australia": "au"}


def _suffix(url: str, content_type: str) -> str:
    if ".pdf" in url.lower() or "pdf" in content_type:
        return ".pdf"
    return ".html"


def fetch_seeds(economy: str, only_pillars: tuple[str, ...] | None = None,
                seeds_path: str = "data/seeds.json") -> dict:
    """Download all (or pillar-filtered) seed documents for an economy.

    Returns the manifest dict {url: entry}; also written to
    data/raw/{cc}/seeds_manifest.json after every row (resumable).
    """
    cc = ECON_CC[economy]
    out_dir = Path(f"data/raw/{cc}")
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / "seeds_manifest.json"
    manifest: dict = json.loads(manifest_path.read_text()) if manifest_path.is_file() else {}

    rows = json.loads(Path(seeds_path).read_text())["economies"][economy]
    if only_pillars:
        rows = [r for r in rows if str(r.get("indicator_code", "")).startswith(only_pillars)]

    with httpx.Client(headers=_HEADERS, follow_redirects=True, timeout=90) as client:
        for row in rows:
            url = (row.get("url") or "").strip()
            if not url.startswith("http"):
                continue
            prior = manifest.get(url)
            if prior and prior.get("status") == "ok":
                continue  # static docs: never refetch a success
            time.sleep(POLITE_DELAY_S)
            entry = {"act": row.get("act"), "indicator_code": row.get("indicator_code"),
                     "policy": row.get("policy"), "coverage": row.get("coverage"),
                     "access_date": date.today().isoformat()}
            try:
                response = client.get(url)
                content = response.content
                if response.status_code == 200 and len(content) > 500:
                    sha = hashlib.sha256(content).hexdigest()
                    path = out_dir / f"seed_{sha[:12]}{_suffix(url, response.headers.get('content-type', ''))}"
                    path.write_bytes(content)
                    entry.update(status="ok", http_status=response.status_code,
                                 sha256=sha, bytes=len(content), file=str(path),
                                 final_url=str(response.url))
                else:
                    entry.update(status="dead", http_status=response.status_code,
                                 bytes=len(content))
            except httpx.HTTPError as error:
                entry.update(status="dead", error=str(error)[:200])
            manifest[url] = entry
            manifest_path.write_text(json.dumps(manifest, indent=1))
    return manifest


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch ESCAP seed documents for an economy.")
    parser.add_argument("--economy", default="Malaysia")
    parser.add_argument("--all-pillars", action="store_true",
                        help="fetch every row (default: P6/P7 only)")
    args = parser.parse_args()
    result = fetch_seeds(args.economy, None if args.all_pillars else ("P6", "P7"))
    ok = sum(1 for e in result.values() if e.get("status") == "ok")
    dead = sum(1 for e in result.values() if e.get("status") == "dead")
    print(f"{args.economy}: {ok} archived, {dead} DEAD links (audit leads) "
          f"-> data/raw/{ECON_CC[args.economy]}/seeds_manifest.json")
