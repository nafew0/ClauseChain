"""Build the KNOWN/NEW baseline from the ESCAP-provided files.

Per the ESCAP 10-June mail:
- PRIMARY baseline  = master dataset (`ESCAP-RDTII-2.1_ Round 1 Database.xlsx`).
  Article references live inside its free-text "Impact" column — we parse them out.
- SECONDARY         = portals CSV (P6/P7 law↔indicator names) and the 384-row
  Legal Inventory CSV (all pillars; crawler seeds only, never the KNOWN baseline).

Output: data/known_index.json + data/seeds.json (built by scripts/build_known_index.py).
"""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any

from packages.ingest.xlsx import read_rows, sheet_names

# --- article / section reference extraction -------------------------------

_REF_PATTERNS = [
    (re.compile(r"\bArticles?\s+(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "Art."),
    (re.compile(r"\bArt\.?\s*(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "Art."),
    (re.compile(r"\bSections?\s+(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "s."),
    (re.compile(r"\bSec\.?\s*(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "s."),
    (re.compile(r"\b[Ss]\.\s*(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)"), "s."),
    (re.compile(r"\bRegulations?\s+(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "reg."),
    (re.compile(r"\bRules?\s+(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)(?!\s*of)", re.I), "r."),
    (re.compile(r"\bClauses?\s+(\d+[A-Z]{0,2}(?:\s*\(\s*\w{1,3}\s*\))*)", re.I), "cl."),
    (re.compile(r"\bSchedules?\s+(\d+[A-Z]{0,2})", re.I), "Sch."),
]


def extract_refs(text: str) -> list[str]:
    """Pull normalized provision references (e.g. 's. 245(2)', 'Art. 18') from prose."""
    if not text:
        return []
    found: list[str] = []
    seen: set[str] = set()
    for pattern, prefix in _REF_PATTERNS:
        for match in pattern.finditer(text):
            raw = re.sub(r"\s+", "", match.group(1))
            ref = f"{prefix} {raw}"
            key = ref.lower()
            if key not in seen:
                seen.add(key)
                found.append(ref)
    return found


# --- normalization ----------------------------------------------------------

def normalize_law_name(name: str) -> str:
    """Lowercase, drop punctuation/bracketed refs so name matching is forgiving."""
    text = re.sub(r"\(.*?\)", " ", (name or "").lower())
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def split_act_names(act_cell: str) -> list[str]:
    """The master DB packs several laws into one Act cell ('Law A; Law B')."""
    parts = re.split(r"[;\n]+", act_cell or "")
    return [part.strip() for part in parts if part.strip()]


def base_ref(ref: str) -> str:
    """'s. 26(1)' -> 's. 26' so paragraph-level cites match section-level gold."""
    return re.sub(r"\(.*$", "", ref or "").strip().lower()


_INDICATOR_NUM = re.compile(r"\b(\d{1,2})\.(\d{1,2})\b")

# Methodology policy names -> submission codes (P6/P7 only; methodology defs govern).
NAME_TO_CODE = {
    "ban and local processing requirements": "P6-I1",
    "local storage requirements": "P6-I2",
    "infrastructure requirements": "P6-I3",
    "conditional flow regimes": "P6-I4",
    "not in agreement with binding commitments on data transfer": "P6-I5",
    "lack of comprehensive legal framework for data protection": "P7-I1",
    "lack of dedicated legal framework for cybersecurity": "P7-I2",
    "minimum period of data retention requirements": "P7-I3",
    "data protection impact assessment or data protection officer requirements": "P7-I4",
    "requirements to allow government access to personal data": "P7-I5",
}


def _norm_policy(text: str) -> str:
    text = (text or "").lower().replace("&", "and")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", text)).strip()


def indicator_code(raw_indicator: str, raw_pillar: str = "") -> str | None:
    """Map '6.4', 'Indicator 6.4 ...' or a methodology policy name to 'P6-I4'."""
    match = _INDICATOR_NUM.search(raw_indicator or "")
    if match:
        pillar, num = int(match.group(1)), int(match.group(2))
        if 1 <= pillar <= 12:
            return f"P{pillar}-I{num}"
    by_name = NAME_TO_CODE.get(_norm_policy(raw_indicator))
    if by_name:
        return by_name
    if raw_pillar:
        try:
            pillar = int(float(raw_pillar))
        except ValueError:
            return None
        if 1 <= pillar <= 12:
            return f"P{pillar}-I?"
    return None


# --- master workbook parsing -------------------------------------------------

_HEADER_KEYS = {
    "country": ("country", "economy"),
    "pillar": ("pillar",),
    "indicator": ("indicator",),
    "score": ("raw score", "score"),
    "act": ("act",),
    "coverage": ("coverage",),
    "impact": ("impact",),
    "timeframe": ("timeframe",),
    "note": ("note",),
}


def _map_header(row: list[str]) -> dict[str, Any] | None:
    """Detect a header row. 'country' is optional — Round-2 sheets carry the economy
    in the sheet NAME (no country column), so we anchor on Act + (Indicator | Pillar)."""
    lowered = [cell.strip().lower() for cell in row]
    has_act = any(c.startswith("act") for c in lowered)
    has_indicator = any(c.startswith("indicator") for c in lowered)
    has_pillar = any(c.startswith("pillar") for c in lowered)
    if not (has_act and (has_indicator or has_pillar)):
        return None
    mapping: dict[str, Any] = {"refs": []}
    for idx, cell in enumerate(lowered):
        if not cell:
            continue
        if cell.startswith("reference"):
            mapping["refs"].append(idx)
            continue
        for key, prefixes in _HEADER_KEYS.items():
            if key not in mapping and any(cell.startswith(p) for p in prefixes):
                mapping[key] = idx
    return mapping if "act" in mapping else None


def _rows_from_sheet(path: Path, sheet: str, forced_country: str | None = None) -> list[dict]:
    rows = read_rows(path, sheet)
    header: dict[str, Any] | None = None
    entries: list[dict] = []
    for row in rows:
        if header is None:
            header = _map_header(row)
            continue
        def cell(key: str) -> str:
            idx = header.get(key)
            return row[idx].strip() if idx is not None and idx < len(row) else ""

        country = forced_country or cell("country")
        act = cell("act")
        if not act or not country:
            continue
        impact = cell("impact")
        entry = {
            "economy": country,
            "pillar": cell("pillar"),
            "indicator_raw": cell("indicator"),
            "indicator_code": indicator_code(cell("indicator"), cell("pillar")),
            "score": cell("score"),
            "act": act,
            "act_norm": normalize_law_name(act),
            "acts_norm": [normalize_law_name(part) for part in split_act_names(act)],
            "coverage": cell("coverage"),
            "impact": impact,
            "articles": extract_refs(impact),
            "timeframe": cell("timeframe"),
            "references": [row[i].strip() for i in header["refs"] if i < len(row) and row[i].strip()],
            "source": "master",
        }
        entries.append(entry)
    return entries


def parse_master(path: str | Path) -> list[dict]:
    path = Path(path)
    names = sheet_names(path)
    if "Consolidated" in names:
        return _rows_from_sheet(path, "Consolidated")
    entries: list[dict] = []
    for sheet in names:
        if sheet.strip().lower() in {"australia", "malaysia", "singapore"}:
            entries.extend(_rows_from_sheet(path, sheet, forced_country=sheet.strip()))
    return entries


def parse_round2(path: str | Path) -> list[dict]:
    """Round-2 finals DB: one sheet per economy (CN/IN/ID/LA/MN/RU/TH), no 'country'
    column — the economy comes from the sheet name. Skips the methodology sheet."""
    path = Path(path)
    entries: list[dict] = []
    for sheet in sheet_names(path):
        low = sheet.strip().lower()
        if "methodology" in low or low.startswith("rdtii"):
            continue
        entries.extend(_rows_from_sheet(path, sheet, forced_country=sheet.strip()))
    return entries


# --- csv parsing (portals + legal inventory) ---------------------------------

def parse_known_csv(path: str | Path, source: str) -> list[dict]:
    """Parse the portals CSV / Legal Inventory CSV (same shape)."""
    entries: list[dict] = []
    with open(path, newline="", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            act = (row.get("Act.and.or.practice") or "").strip()
            country = (row.get("country") or "").strip()
            if not act or not country:
                continue
            policy = (row.get("policy.description") or "").strip()
            entries.append({
                "economy": country,
                "pillar": "",
                "indicator_raw": policy,
                "indicator_code": NAME_TO_CODE.get(_norm_policy(policy)),
                "score": "",
                "act": act,
                "act_norm": normalize_law_name(act),
                "acts_norm": [normalize_law_name(part) for part in split_act_names(act)],
                "coverage": (row.get("Coverage") or "").strip(),
                "impact": "",
                "articles": [],
                "timeframe": (row.get("Timeframe") or "").strip(),
                "references": [r for r in [(row.get("References") or "").strip()] if r],
                "cluster": (row.get("cluster") or "").strip(),
                "source": source,
            })
    return entries


# --- assembly -----------------------------------------------------------------

def build_index(master_entries: list[dict], portal_entries: list[dict]) -> dict:
    """KNOWN index: master is primary; portals add law↔indicator names (no articles)."""
    economies: dict[str, list[dict]] = {}
    for entry in master_entries + portal_entries:
        economies.setdefault(entry["economy"], []).append(entry)
    return {
        "baseline_ruling": "master = primary KNOWN reference; portals/inventory = secondary (ESCAP mail, 10 Jun 2026)",
        "counts": {
            "master_rows": len(master_entries),
            "portal_rows": len(portal_entries),
            "master_rows_with_articles": sum(1 for e in master_entries if e["articles"]),
        },
        "economies": economies,
    }
