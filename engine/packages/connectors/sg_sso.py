"""Singapore Statutes Online (sso.agc.gov.sg) fetcher — P0 spike level.

The 1-June workshop flagged SG as having anti-bot protection; handling it is an
explicit scoring differentiator. Strategy: plain httpx first (cheap), Playwright
fallback when blocked (install via the `crawl` dependency group).
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

import httpx

PDPA_URL = "https://sso.agc.gov.sg/Act/PDPA2012"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 ClauseChain-research/0.1"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


@dataclass
class FetchResult:
    url: str
    final_url: str
    status_code: int
    content: bytes
    via: str

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.content).hexdigest()

    @property
    def looks_blocked(self) -> bool:
        if self.status_code in (403, 429, 503):
            return True
        sample = self.content[:4000].lower()
        return self.status_code == 200 and (
            b"captcha" in sample or b"are you a robot" in sample or len(self.content) < 2000
        )


def fetch_httpx(url: str, timeout: float = 30.0) -> FetchResult:
    with httpx.Client(headers=_HEADERS, follow_redirects=True, timeout=timeout) as client:
        response = client.get(url)
    return FetchResult(
        url=url, final_url=str(response.url), status_code=response.status_code,
        content=response.content, via="httpx",
    )


def fetch_playwright(url: str, timeout_ms: int = 45000) -> FetchResult:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as error:  # pragma: no cover
        raise RuntimeError(
            "Playwright not installed. Run: uv sync --group crawl && uv run playwright install chromium"
        ) from error
    with sync_playwright() as p:  # pragma: no cover — needs browser install
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=_HEADERS["User-Agent"])
        page.goto(url, timeout=timeout_ms, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        html = page.content()
        final_url = page.url
        browser.close()
    return FetchResult(url=url, final_url=final_url, status_code=200,
                       content=html.encode("utf-8"), via="playwright")


def save_raw(result: FetchResult, out_dir: str | Path = "data/raw/sg") -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    name = result.url.rstrip("/").rsplit("/", 1)[-1] or "index"
    path = out / f"{name}.{result.sha256[:12]}.html"
    path.write_bytes(result.content)
    return path
