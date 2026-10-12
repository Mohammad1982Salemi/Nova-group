"""Every translatable unit of the site, side by side, for the language review.

Reads src/pages and src/partials the way build.py does — it borrows build.py's own
Finder, so the pairing of a text with its translation cannot drift from the build.
Writes _originals/review/units.json (one record per unit) and units.tsv (the same,
readable). Nothing here writes to the site.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import build   # noqa: E402  (importing runs only module-level setup: constants and reads)

PAGES, PARTS = ROOT / "src" / "pages", ROOT / "src" / "partials"
OUT = ROOT / "_originals" / "review"
LANGS = ("fr", "de", "tr")
META = ("title", "desc", "og")


def line_of(text, off):
    return text.count("\n", 0, off) + 1


def catalogue():
    say = {}
    for lang in LANGS:
        path = ROOT / "src" / "i18n" / f"{lang}.json"
        say[lang] = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    return say


def text_pairs(text):
    """Every element the build translates, with the twin in the other language beside it.

    build.py reclasses every t-en element and asks the catalogue for its text, so a unit
    is one t-en element plus the t-fa (or t-fr …) element that stands next to it.
    """
    out = []
    ens = build.Finder(text, "t-en").found
    seen = [("fa", build.Finder(text, "t-fa").found)]
    for other in ("fr", "de", "tr"):                      # only the 404 page carries these inline
        found = build.Finder(text, f"t-{other}").found
        if found:
            seen.append((other, found))
    for a, b, c, d in ens:
        row = {"en": text[b:c]}
        for other, found in seen:
            before = [f for f in found if f[3] <= a and not text[f[3]:a].strip()]
            if before:
                row[other] = text[before[-1][1]:before[-1][2]]
        row["line"] = line_of(text, a)
        out.append(row)
    return out


def token_pairs(text):
    """@@L:فارسی||English@@ — the build's inline pairing inside attributes."""
    out = []
    for m in re.finditer(r"@@L:(.*?)\|\|(.*?)@@", text):
        out.append({"fa": m.group(1), "en": m.group(2), "line": line_of(text, m.start())})
    return out


def meta_lines(text):
    """<!-- title.en: … --> and its siblings, harvested the way build.py harvests them."""
    out = []
    for m in re.finditer(r"<!--\s*(title|desc|og)\.(fa|en)\s*:\s*(.*?)\s*-->", text):
        out.append({"kind": f"{m.group(1)}.{m.group(2)}", "text": m.group(3), "line": line_of(text, m.start())})
    return out


def generated():
    """Text build.py writes itself: the two neighbour cards on every project page."""
    out = []
    for slug, _fa, _en in build.PROJECTS:
        markup = build.projnav(slug)
        for row in text_pairs(markup):
            out.append({"src": "(generated)", "line": 0, "kind": "text",
                        "fa": row.get("fa"), "en": row["en"]})
        for row in token_pairs(markup):
            out.append({"src": "(generated)", "line": 0, "kind": "attr",
                        "fa": row["fa"], "en": row["en"]})
    return out


def main():
    say = catalogue()
    records, keys = [], {}

    def note(key, fa, en, where, kind):
        if not build.norm(key):
            return
        entry = keys.setdefault(build.norm(key), {"en": build.norm(key), "fa": None, "where": [], "kind": kind})
        if fa and not entry["fa"]:
            entry["fa"] = build.norm(fa)
        entry["where"].append(where)

    for row in generated():
        note(row["en"], row.get("fa"), row["en"], f"{row['src']}:{row['line']}", row["kind"])

    files = sorted(PAGES.glob("*.html")) + sorted(PAGES.glob("projects/*.html")) + sorted(PARTS.glob("*.html"))
    for path in files:
        text = path.read_text(encoding="utf-8")
        where = path.relative_to(ROOT).as_posix()
        for row in text_pairs(text):
            if "fr" in row:                                # an inline five-language page: not a catalogue key
                records.append({"src": where, "line": row["line"], "kind": "inline",
                                "fa": row.get("fa"), "en": row["en"], **{l: row.get(l) for l in LANGS}})
            else:
                note(row["en"], row.get("fa"), row["en"], f"{where}:{row['line']}", "text")
        for row in token_pairs(text):
            note(row["en"], row["fa"], row["en"], f"{where}:{row['line']}", "attr")
        seen_meta = {}
        for row in meta_lines(text):
            base, lang = row["kind"].split(".")
            seen_meta.setdefault(base, {})[lang] = (row["text"], row["line"])
        for base in (() if "<!-- both: yes -->" in text else META):
            if base in seen_meta:
                got = {lang: pair[0] for lang, pair in seen_meta[base].items()}
                at = min(pair[1] for pair in seen_meta[base].values())
                note(got.get("en"), got.get("fa"), got.get("en"), f"{where}:{at}", "meta")

    for key, entry in keys.items():
        entry["where"] = sorted(set(entry["where"]))
        for lang in LANGS:
            entry[lang] = say[lang].get(key)
        entry["used"] = True
        records.append({"src": entry["where"][0].split(":")[0], "line": int(entry["where"][0].split(":")[-1]),
                        "kind": entry["kind"], "fa": entry["fa"], "en": entry["en"],
                        **{l: entry[l] for l in LANGS}, "where": entry["where"]})

    for lang in LANGS:                                     # catalogue entries no page uses any more
        for key, value in say[lang].items():
            if key not in keys:
                records.append({"src": "(unused)", "line": 0, "kind": "stale", "fa": None, "en": key,
                                "fr": say["fr"].get(key), "de": say["de"].get(key), "tr": say["tr"].get(key),
                                "where": ["(unused)"]})

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "units.json").write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding="utf-8")

    cols = ["src", "line", "kind", "fa", "en", *LANGS]
    with (OUT / "units.tsv").open("w", encoding="utf-8", newline="\n") as fh:
        fh.write("\t".join(cols) + "\n")
        for rec in records:
            fh.write("\t".join(str(rec.get(c) if rec.get(c) is not None else "").replace("\t", " ") for c in cols) + "\n")

    kinds = {}
    for rec in records:
        kinds[rec["kind"]] = kinds.get(rec["kind"], 0) + 1
    print(f"{len(records)} units -> {OUT / 'units.tsv'}")
    print("by kind:", ", ".join(f"{k} {v}" for k, v in sorted(kinds.items())))
    missing = [r for r in records if r["kind"] != "stale" and not r.get("fr")]
    print(f"units with no French: {len(missing)}")


if __name__ == "__main__":
    main()
