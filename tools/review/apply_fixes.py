"""Apply a list of reviewed text fixes to a language catalogue.

    python tools/review/apply_fixes.py <fixes.json> <catalogue.json>

A fix is {"en": <the English source text>, "new": <the new translation>, "why": ...}.
The English is matched to the catalogue key the way build.py matches it (whitespace
collapsed), so a key copied by hand still lands. Nothing is written unless every fix
matched. French typography is normalised in the values afterwards: a curly apostrophe,
and a no-break space before ; : ! ? and %.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NBSP = " "


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def typography(text):
    text = text.replace("'", "’")
    for mark in ";:!?%":
        text = text.replace(" " + mark, NBSP + mark)
    return text


def main():
    fixes = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    path = Path(sys.argv[2])
    catalogue = json.loads(path.read_text(encoding="utf-8"))
    by_key = {norm(k): k for k in catalogue}

    unmatched, applied = [], []
    for fix in fixes:
        key = by_key.get(norm(fix["en"]))
        if key is None:
            unmatched.append(f"no such key: {fix['en'][:70]}")
            continue
        old = catalogue[key]
        if "old" in fix:
            if fix["old"] not in old:
                unmatched.append(f"text has moved: {fix['en'][:60]} — {old[:60]!r}")
                continue
            new = typography(old.replace(fix["old"], fix["new"]))
        else:
            new = typography(fix["new"])
        if old != new:
            catalogue[key] = new
            applied.append((key, old, new))

    if unmatched:
        print(f"{len(unmatched)} fix(es) matched no key — nothing written:")
        for text in unmatched:
            print("   ", text)
        raise SystemExit(1)

    for key, value in list(catalogue.items()):
        clean = typography(value)
        if clean != value:
            catalogue[key] = clean

    body = json.dumps(catalogue, ensure_ascii=False, indent=1, separators=(",", ": "))
    path.write_text(body + "\n", encoding="utf-8")
    print(f"{len(applied)} text(s) changed, {len(catalogue)} entries written to {path}")
    for key, old, new in applied:
        print(f"  - {key[:64]!r}")


if __name__ == "__main__":
    main()
