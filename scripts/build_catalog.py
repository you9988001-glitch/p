# -*- coding: utf-8 -*-
"""Convert Desktop peaks-3141.json into App Studio catalog shards."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lib" / "peaks"
BY = OUT / "by-continent"

# Desktop path via env fallback — also try common locations
CANDIDATES = [
    Path.home() / "OneDrive" / "바탕 화면" / "앱스튜디오" / "peaks3141" / "peaks-3141.json",
    Path.home() / "OneDrive" / "Desktop" / "앱스튜디오" / "peaks3141" / "peaks-3141.json",
    Path.home() / "Desktop" / "앱스튜디오" / "peaks3141" / "peaks-3141.json",
    ROOT.parent / "peaks-3141.json",
]

CC = {
    "AF": "Afghanistan", "AL": "Albania", "DZ": "Algeria", "AD": "Andorra", "AO": "Angola",
    "AR": "Argentina", "AM": "Armenia", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan",
    "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BY": "Belarus", "BE": "Belgium",
    "BZ": "Belize", "BJ": "Benin", "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina",
    "BW": "Botswana", "BR": "Brazil", "BN": "Brunei", "BG": "Bulgaria", "BF": "Burkina Faso",
    "BI": "Burundi", "KH": "Cambodia", "CM": "Cameroon", "CA": "Canada", "CV": "Cape Verde",
    "CF": "Central African Republic", "TD": "Chad", "CL": "Chile", "CN": "China", "CO": "Colombia",
    "CG": "Congo", "CD": "DR Congo", "CR": "Costa Rica", "CI": "Ivory Coast", "HR": "Croatia",
    "CU": "Cuba", "CY": "Cyprus", "CZ": "Czechia", "DK": "Denmark", "DJ": "Djibouti",
    "DO": "Dominican Republic", "EC": "Ecuador", "EG": "Egypt", "SV": "El Salvador",
    "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia", "SZ": "Eswatini", "ET": "Ethiopia",
    "FJ": "Fiji", "FI": "Finland", "FR": "France", "GA": "Gabon", "GM": "Gambia", "GE": "Georgia",
    "DE": "Germany", "GH": "Ghana", "GR": "Greece", "GL": "Greenland", "GT": "Guatemala",
    "GN": "Guinea", "GY": "Guyana", "HT": "Haiti", "HN": "Honduras", "HU": "Hungary",
    "IS": "Iceland", "IN": "India", "ID": "Indonesia", "IR": "Iran", "IQ": "Iraq", "IE": "Ireland",
    "IL": "Israel", "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JO": "Jordan",
    "KZ": "Kazakhstan", "KE": "Kenya", "KP": "North Korea", "KR": "South Korea", "KW": "Kuwait",
    "KG": "Kyrgyzstan", "LA": "Laos", "LV": "Latvia", "LB": "Lebanon", "LS": "Lesotho",
    "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg",
    "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MV": "Maldives", "ML": "Mali",
    "MT": "Malta", "MX": "Mexico", "MD": "Moldova", "MN": "Mongolia", "ME": "Montenegro",
    "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NP": "Nepal",
    "NL": "Netherlands", "NZ": "New Zealand", "NI": "Nicaragua", "NE": "Niger", "NG": "Nigeria",
    "MK": "North Macedonia", "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PA": "Panama",
    "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru", "PH": "Philippines", "PL": "Poland",
    "PT": "Portugal", "PR": "Puerto Rico", "QA": "Qatar", "RO": "Romania", "RU": "Russia",
    "RW": "Rwanda", "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SL": "Sierra Leone",
    "SG": "Singapore", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands", "SO": "Somalia",
    "ZA": "South Africa", "SS": "South Sudan", "ES": "Spain", "LK": "Sri Lanka", "SD": "Sudan",
    "SR": "Suriname", "SE": "Sweden", "CH": "Switzerland", "SY": "Syria", "TW": "Taiwan",
    "TJ": "Tajikistan", "TZ": "Tanzania", "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo",
    "TO": "Tonga", "TT": "Trinidad and Tobago", "TN": "Tunisia", "TR": "Turkey",
    "TM": "Turkmenistan", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates",
    "GB": "United Kingdom", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan",
    "VU": "Vanuatu", "VE": "Venezuela", "VN": "Vietnam", "YE": "Yemen", "ZM": "Zambia",
    "ZW": "Zimbabwe", "AQ": "Antarctica", "TF": "French Southern Territories",
    "GS": "South Georgia", "HM": "Heard Island", "BV": "Bouvet Island",
    "IO": "British Indian Ocean Territory", "FK": "Falkland Islands", "EH": "Western Sahara",
    "PS": "Palestine", "XK": "Kosovo", "CW": "Curacao", "SX": "Sint Maarten",
    "BQ": "Caribbean Netherlands", "PF": "French Polynesia", "NC": "New Caledonia",
    "WF": "Wallis and Futuna", "CK": "Cook Islands", "NU": "Niue", "TK": "Tokelau",
    "AS": "American Samoa", "GU": "Guam", "MP": "Northern Mariana Islands",
    "VI": "US Virgin Islands", "VG": "British Virgin Islands", "KY": "Cayman Islands",
    "BM": "Bermuda", "TC": "Turks and Caicos", "AW": "Aruba", "GP": "Guadeloupe",
    "MQ": "Martinique", "RE": "Reunion", "YT": "Mayotte", "PM": "Saint Pierre and Miquelon",
    "SH": "Saint Helena", "FO": "Faroe Islands", "AX": "Aland Islands",
    "SJ": "Svalbard and Jan Mayen", "GG": "Guernsey", "JE": "Jersey", "IM": "Isle of Man",
    "GI": "Gibraltar", "MC": "Monaco", "SM": "San Marino", "VA": "Vatican City",
    "HK": "Hong Kong", "MO": "Macau",
}

CONT_MAP = {
    "Asia": "asia",
    "Europe": "europe",
    "Africa": "africa",
    "North America": "north-america",
    "South America": "south-america",
    "Oceania": "oceania",
    "Antarctica": "antarctica",
    "Other": "antarctica",
}

TERR_CODES = {"AQ", "TF", "GS", "HM", "BV", "IO", "FK", "SJ", "EH"}
OCEANIA_CC = {
    "AU", "NZ", "PG", "FJ", "SB", "VU", "NC", "PF", "WS", "TO", "KI", "TV",
    "NR", "MH", "FM", "PW", "CK", "NU", "AS", "GU", "MP", "TK", "WF", "ID",
}

CONTINENTS = [
    ("asia", "Asia", "From the Himalaya to volcano chains of the Pacific Rim."),
    ("europe", "Europe", "Alpine spines, Arctic massifs, and ancient ranges."),
    ("africa", "Africa", "Rift highlands, desert massifs, and equatorial peaks."),
    ("north-america", "North America", "Rockies, Sierra, and ice-carved northern giants."),
    ("south-america", "South America", "The Andes corridor and Patagonian towers."),
    ("oceania", "Oceania", "Island volcanoes and Pacific high islands."),
    ("antarctica", "Antarctica & Territories", "Polar ice peaks and remote territories."),
]


def find_src() -> Path:
    try:
        import ctypes
        from ctypes import wintypes

        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        # CSIDL_DESKTOP = 0
        ctypes.windll.shell32.SHGetFolderPathW(None, 0, None, 0, buf)
        desk = Path(buf.value)
        p = desk / "앱스튜디오" / "peaks3141" / "peaks-3141.json"
        if p.exists():
            return p
    except Exception:
        pass
    for p in CANDIDATES:
        if p.exists():
            return p
    raise SystemExit("peaks-3141.json not found")


def slug(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", (s or "").strip().lower()).strip("-")
    return s or "peak"


def continent_of(p: dict) -> str:
    cc = (p.get("country_code") or "").upper()
    if cc in TERR_CODES:
        return "antarctica"
    if cc in OCEANIA_CC:
        return "oceania"
    # Prefer explicit continent label from balanced rebuild
    mapped = CONT_MAP.get(p.get("continent") or "")
    if mapped:
        return mapped
    return "antarctica"


def main() -> None:
    src = find_src()
    print("SRC", src)
    BY.mkdir(parents=True, exist_ok=True)
    peaks_in = json.loads(src.read_text(encoding="utf-8"))["peaks"]

    by_c: dict[str, list] = defaultdict(list)
    index = []
    seen = set()

    for p in peaks_in:
        cid = continent_of(p)
        cc = (p.get("country_code") or "").upper() or None
        base = slug(p.get("name_ascii") or p.get("name"))
        pid = f"{base}-{p.get('n')}"
        while pid in seen:
            pid += "x"
        seen.add(pid)
        country = CC.get(cc, cc or "Unknown")
        row = {
            "id": pid,
            "name": p["name"],
            "country": country,
            "countryCode": cc,
            "range": p.get("feature_code") or "Peak",
            "elevationM": int(p["elevation_m"]),
            "continent": cid,
            "lat": p.get("lat"),
            "lon": p.get("lon"),
            "facts": [
                f"Elevation {int(p['elevation_m']):,} m above sea level.",
                f"Located in {country}." + (f" ({cc})" if cc else ""),
            ],
        }
        by_c[cid].append(row)
        index.append(
            {
                "id": pid,
                "name": row["name"],
                "country": country,
                "countryCode": cc,
                "elevationM": row["elevationM"],
                "continent": cid,
                "range": row["range"],
            }
        )

    countries_by_c = {}
    meta_continents = []
    for cid, name, blurb in CONTINENTS:
        rows = by_c.get(cid, [])
        rows.sort(key=lambda r: (-r["elevationM"], r["name"].lower()))
        (BY / f"{cid}.json").write_text(
            json.dumps({"continent": cid, "peaks": rows}, ensure_ascii=False),
            encoding="utf-8",
        )
        cmap: dict = defaultdict(
            lambda: {"code": None, "name": "", "count": 0, "maxElev": 0}
        )
        for r in rows:
            key = r["countryCode"] or r["country"]
            e = cmap[key]
            e["code"] = r["countryCode"]
            e["name"] = r["country"]
            e["count"] += 1
            e["maxElev"] = max(e["maxElev"], r["elevationM"])
        countries = sorted(cmap.values(), key=lambda x: x["name"].lower())
        countries_by_c[cid] = countries
        meta_continents.append(
            {
                "id": cid,
                "name": name,
                "blurb": blurb,
                "peakCount": len(rows),
                "countryCount": len(countries),
            }
        )
        print(cid, len(rows), "peaks", len(countries), "countries")

    meta = {
        "title": "Peaks 3141",
        "totalPeaks": len(index),
        "continents": meta_continents,
        "countriesByContinent": countries_by_c,
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    print("TOTAL", len(index))


if __name__ == "__main__":
    main()
