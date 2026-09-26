# -*- coding: utf-8 -*-
"""Rebuild peaks-3141.json with per-continent quotas from GeoNames."""
from __future__ import annotations

import json
import time
import zipfile
from collections import defaultdict
from pathlib import Path
from urllib.request import Request, urlopen
import ctypes
from ctypes import wintypes

URL = "https://download.geonames.org/export/dump/allCountries.zip"
KEEP = {"MT", "PK", "VLC"}
TARGET = 3141
# Quotas sum to 3141 — geographic coverage for the 7 cards
QUOTAS = {
    "asia": 900,
    "europe": 450,
    "africa": 400,
    "north-america": 450,
    "south-america": 550,
    "oceania": 250,
    "antarctica": 141,
}
assert sum(QUOTAS.values()) == TARGET

OCEANIA_CC = {
    "AU", "NZ", "PG", "FJ", "SB", "VU", "NC", "PF", "WS", "TO", "KI", "TV",
    "NR", "MH", "FM", "PW", "CK", "NU", "AS", "GU", "MP", "TK", "WF", "ID",
}
ANT_CC = {"AQ", "TF", "GS", "HM", "BV", "IO", "FK", "SJ"}


def desktop() -> Path:
    buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
    ctypes.windll.shell32.SHGetFolderPathW(None, 0, None, 0, buf)
    return Path(buf.value)


def continent(lat, lon, cc: str | None) -> str:
    cc = (cc or "").upper()
    if cc in ANT_CC or (lat is not None and lat <= -60):
        return "antarctica"
    if cc in OCEANIA_CC:
        return "oceania"
    if lat is None or lon is None:
        return "asia"
    # Europe
    if 36 <= lat <= 72 and -25 <= lon <= 40:
        return "europe"
    # Africa
    if -35 <= lat < 37 and -20 <= lon <= 55:
        return "africa"
    # Americas
    if lat >= 8 and -170 <= lon <= -20:
        return "north-america"
    if lat < 15 and -95 <= lon <= -30:
        return "south-america"
    # Oceania by geography
    if -50 <= lat < 0 and 110 <= lon <= 180:
        return "oceania"
    # Asia default for Eurasia / Middle East leftovers
    if -10 <= lat <= 80 and 25 <= lon <= 180:
        return "asia"
    if lat >= 0 and -170 <= lon <= -30:
        return "north-america"
    if lat < 0 and -90 <= lon <= -30:
        return "south-america"
    return "asia"


def main() -> None:
    out_dir = desktop() / "앱스튜디오" / "peaks3141"
    out_dir.mkdir(parents=True, exist_ok=True)
    work = Path(r"C:\CODE-ARCHE\peaks3141-appstudio\_geonames")
    work.mkdir(parents=True, exist_ok=True)
    zpath = work / "allCountries.zip"
    tpath = work / "allCountries.txt"

    if not tpath.exists():
        if not zpath.exists():
            print("downloading…", flush=True)
            req = Request(URL, headers={"User-Agent": "Peaks3141/1.1"})
            with urlopen(req, timeout=600) as resp, open(zpath, "wb") as f:
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
                    print(" ", zpath.stat().st_size // (1024 * 1024), "MB", flush=True)
        print("unzip…", flush=True)
        with zipfile.ZipFile(zpath) as zf:
            zf.extract("allCountries.txt", path=work)

    buckets: dict[str, list] = defaultdict(list)
    print("parse…", flush=True)
    with open(tpath, encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f, 1):
            if i % 2_000_000 == 0:
                print(" lines", i, flush=True)
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 17:
                continue
            if parts[6] != "T" or parts[7] not in KEEP:
                continue
            elev_s = parts[15].strip() or parts[16].strip()
            if not elev_s:
                continue
            try:
                elev = int(float(elev_s))
            except ValueError:
                continue
            if elev < 200 or elev > 9000:
                continue
            name = (parts[1] or parts[2] or "").strip()
            if not name:
                continue
            try:
                lat = float(parts[4])
                lon = float(parts[5])
            except ValueError:
                lat = lon = None
            cc = parts[8] or None
            cid = continent(lat, lon, cc)
            buckets[cid].append(
                {
                    "id": f"geonames-{parts[0]}",
                    "name": name,
                    "name_ascii": (parts[2] or None),
                    "elevation_m": elev,
                    "lat": round(lat, 5) if lat is not None else None,
                    "lon": round(lon, 5) if lon is not None else None,
                    "country_code": cc,
                    "feature_code": parts[7],
                    "continent": {
                        "asia": "Asia",
                        "europe": "Europe",
                        "africa": "Africa",
                        "north-america": "North America",
                        "south-america": "South America",
                        "oceania": "Oceania",
                        "antarctica": "Antarctica",
                    }[cid],
                    "source": "geonames",
                    "geonames": f"https://www.geonames.org/{parts[0]}",
                }
            )

    selected = []
    for cid, quota in QUOTAS.items():
        rows = buckets.get(cid, [])
        # dedupe
        best = {}
        for r in rows:
            if r["lat"] is not None:
                key = f"{r['name'].lower()}|{round(r['lat'],2)}|{round(r['lon'],2)}"
            else:
                key = f"{r['name'].lower()}|{r.get('country_code')}"
            prev = best.get(key)
            if prev is None or r["elevation_m"] > prev["elevation_m"]:
                best[key] = r
        rows = sorted(best.values(), key=lambda r: (-r["elevation_m"], r["name"].lower()))
        take = rows[:quota]
        print(cid, "pool", len(rows), "take", len(take), flush=True)
        selected.extend(take)

    # If any continent short, fill from global leftovers by elevation
    if len(selected) < TARGET:
        have = {r["id"] for r in selected}
        rest = []
        for rows in buckets.values():
            for r in rows:
                if r["id"] not in have:
                    rest.append(r)
        rest.sort(key=lambda r: -r["elevation_m"])
        for r in rest:
            if len(selected) >= TARGET:
                break
            if r["id"] in have:
                continue
            selected.append(r)
            have.add(r["id"])

    selected.sort(key=lambda r: (-r["elevation_m"], r["name"].lower()))
    selected = selected[:TARGET]
    for i, r in enumerate(selected, 1):
        r["n"] = i
        if r.get("name_ascii") == r.get("name"):
            r.pop("name_ascii", None)

    doc = {
        "title": "Peaks 3141",
        "description": "Balanced 7-continent catalog for Peaks 3141.",
        "license_note": "GeoNames CC BY 4.0 factual fields only.",
        "attribution": "GeoNames (CC BY 4.0)",
        "target_count": TARGET,
        "count": len(selected),
        "quotas": QUOTAS,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "peaks": selected,
    }
    out = out_dir / "peaks-3141.json"
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print("wrote", out, len(selected), flush=True)
    from collections import Counter
    print(Counter(r["continent"] for r in selected), flush=True)


if __name__ == "__main__":
    main()
