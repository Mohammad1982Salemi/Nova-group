"""Apply reviewed fixes to a report catalogue.

    python tools/review/apply_report_fixes.py <fixes.json> <catalogue.json>

A fix names its section and its target:

  {"section": "dict",   "en": <the English key>,      "new": <new French>, "why": ...}
  {"section": "phrases"|"rules"|"gloss", "index": <position>, "part": "term"|"def", "new": ..., "why": ...}

`part` applies to gloss only (a [term, definition] pair). Every fix must land: the script
writes nothing unless all of them matched, and it prints each one it changed. Typography is
normalised in the French text afterwards, the same way as for the site catalogue.
"""
import json
import re
import sys
from pathlib import Path

NBSP = " "


def typography(text):
    text = text.replace("'", "’")
    for mark in ";:!?%":
        text = text.replace(" " + mark, NBSP + mark)
    return text


def main():
    fixes = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    path = Path(sys.argv[2])
    catalogue = json.loads(path.read_text(encoding="utf-8"))

    applied, missed = [], []
    for fix in fixes:
        section, target = fix["section"], catalogue[fix["section"]]

        def stale(now):
            """The fix only lands where the text still says what the reviewer read."""
            return "old" in fix and fix["old"] not in now

        if section == "dict":
            if fix["en"] not in target:
                missed.append(f"dict: {fix['en'][:60]!r} — no such key")
            elif stale(target[fix["en"]]):
                missed.append(f"dict: {fix['en'][:60]!r} — text has moved: {target[fix['en']][:60]!r}")
            else:
                target[fix["en"]] = typography(target[fix["en"]].replace(fix["old"], fix["new"]) if "old" in fix
                                               else fix["new"])
                applied.append(f"dict: {fix['en'][:50]!r}")
        elif section in ("phrases", "rules"):
            index = fix["index"]
            if not 0 <= index < len(target):
                missed.append(f"{section}[{index}]: out of range")
            elif stale(target[index]):
                missed.append(f"{section}[{index}]: text has moved")
            else:
                target[index] = typography(target[index].replace(fix["old"], fix["new"]) if "old" in fix
                                           else fix["new"])
                applied.append(f"{section}[{index}]")
        elif section == "gloss":
            index, part = fix["index"], fix.get("part", "term")
            if not 0 <= index < len(target):
                missed.append(f"gloss[{index}]: out of range")
                continue
            at = 0 if part == "term" else 1
            if stale(target[index][at]):
                missed.append(f"gloss[{index}].{part}: text has moved")
            else:
                target[index][at] = typography(target[index][at].replace(fix["old"], fix["new"])
                                               if "old" in fix else fix["new"])
                applied.append(f"gloss[{index}].{part}")
        else:
            missed.append(f"unknown section {section!r}")

    if missed:
        print(f"{len(missed)} fix(es) did not land — nothing written:")
        for line in missed:
            print("   ", line)
        raise SystemExit(1)

    for section in ("dict", "phrases", "rules", "gloss"):
        if section not in catalogue:
            continue
        if section == "dict":
            catalogue[section] = {key: typography(value) for key, value in catalogue[section].items()}
        else:
            catalogue[section] = [
                [typography(part) if isinstance(part, str) else part for part in entry]
                if isinstance(entry, list) else typography(entry)
                for entry in catalogue[section]]

    body = json.dumps(catalogue, ensure_ascii=False, indent=1, separators=(",", ": "))
    path.write_text(body + "\n", encoding="utf-8")
    print(f"{len(applied)} fix(es) written to {path}")
    for line in applied:
        print("  -", line)


if __name__ == "__main__":
    main()
