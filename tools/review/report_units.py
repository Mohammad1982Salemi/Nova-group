"""Every translatable unit of the simulator reports, side by side.

    python tools/review/report_units.py [report.html] [out.json]

The four CME reports carry the same translator: the simulator's own Persian tables plus ours
for French, German and Turkish, all keyed or aligned to the report's English text. This reads
them straight out of a built report — the tables are JSON inside its script, so they are
decoded rather than parsed by hand — and writes one record per unit with the English it
stands for, the Persian the simulator wrote, and our three languages.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def block(text, at):
    """The value starting at `at`: brace matching that skips strings, // comments and /regex/ literals."""
    depth, start, quote, prev = 0, None, None, ""
    i, n = at, len(text)
    while i < n:
        char = text[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == "/" and i + 1 < n and text[i + 1] == "/":
            i = text.find("\n", i)
            continue
        elif char == "/" and prev in "[,(:=":
            i += 1                                     # a /regex/ literal: its brackets are not structure
            in_class = False
            while i < n:
                here = text[i]
                if here == "\\":
                    i += 2
                    continue
                if here == "[":
                    in_class = True
                elif here == "]":
                    in_class = False
                elif here == "/" and not in_class:
                    break
                i += 1
        elif char in "{[":
            depth += 1
            if start is None:
                start = i
        elif char in "}]":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
        if not char.isspace():
            prev = char
        i += 1
    raise ValueError(f"unbalanced table at {at}")


def table(text, name):
    """The value of `const <NAME> = ...;` inside the report's script."""
    at = text.index(f"const {name} = ") + len(f"const {name} = ")
    value, _end = json.JSONDecoder().raw_decode(text, at)
    return value


def js_table(text, name):
    """The same for a table the simulator wrote, which may carry // comments and a trailing comma."""
    at = text.index(f"const {name} = ") + len(f"const {name} = ")
    body = re.sub(r"(?m)^\s*//.*$", "", block(text, at))
    return json.loads(re.sub(r",(\s*[}\]])", r"\1", body))


def outer_parts(text):
    """The top-level pieces of a [ … ] or { … } block: each element, with its own commas kept."""
    parts, depth, start, quote = [], 1, 1, None
    i, n = 1, len(text)              # inside the brackets themselves: they count as the first level
    while i < n:
        char = text[i]
        if quote:
            if char == "\\":
                i += 2
                continue
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == "/" and i + 1 < n and text[i + 1] == "/":
            i = text.find("\n", i)
            continue
        elif char == "/" and (start is None or not text[start:i].strip()):
            i += 1                   # a /regex/ element
            in_class = False
            while i < n:
                here = text[i]
                if here == "\\":
                    i += 2
                    continue
                if here == "[":
                    in_class = True
                elif here == "]":
                    in_class = False
                elif here == "/" and not in_class:
                    break
                i += 1
        elif char in "[{":
            depth += 1
        elif char in "]}":
            depth -= 1
            if depth == 1:                                  # a bracketed element just closed
                parts.append(text[start:i + 1])
                start = i + 1
            elif depth == 0:                                # the whole block closed
                parts.append(text[start:i])
                break
        elif char == "," and depth == 1:
            parts.append(text[start:i])
            start = i + 1
        i += 1
    return [part.strip() for part in parts if part.strip()]


def literal(text):
    """A JS value as data: a "quoted string" or a /regex/ written as its source."""
    text = text.strip()
    if text.startswith("/"):
        return text[1:text.rindex("/")].replace("\\/", "/")
    return json.loads(text)


def js_rules(text, name):
    """A simulator rule table: [pattern, replacement] pairs whose pattern may be a /regex/ literal."""
    at = text.index(f"const {name} = ") + len(f"const {name} = ")
    pairs = []
    for entry in outer_parts(block(text, at)):
        sides = outer_parts("[" + entry + "]")
        pairs.append([literal(sides[0]), literal(sides[1])])
    return pairs


def main():
    report = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets" / "reports" / "gc-market-maker.html"
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "_originals" / "review" / "report-units.json"
    text = report.read_text(encoding="utf-8")

    fa, fr = js_table(text, "FA"), table(text, "FR")
    fa_p, fr_p = js_table(text, "FA_P"), table(text, "FR_P")
    fa_g, fr_g = js_table(text, "FA_GLOSS"), table(text, "FR_GLOSS")
    rules_file = ROOT / "_originals" / "review" / "report-rules.json"
    if rules_file.exists():
        fa_r = [[record["en"], record["fa"]] for record in
                sorted(json.loads(rules_file.read_text(encoding="utf-8")), key=lambda r: r["index"])]
    else:
        fa_r = []
        print("  (no _originals/review/report-rules.json: the rule rows are left out)")
    fr_r = table(text, "FR_R")
    de, tr = table(text, "DE"), table(text, "TR")
    de_r, tr_r, de_p, tr_p, de_g, tr_g = (table(text, "DE_R"), table(text, "TR_R"),
                                          table(text, "DE_P"), table(text, "TR_P"),
                                          table(text, "DE_GLOSS"), table(text, "TR_GLOSS"))

    print(f"dict {len(fa)}/{len(fr)}/{len(de)}/{len(tr)}   rules {len(fa_r)}/{len(fr_r)}   "
          f"phrases {len(fa_p)}/{len(fr_p)}   gloss {len(fa_g)}/{len(fr_g)}")
    for name, a, b in (("dict keys", set(fa), set(fr)), ("rules", len(fa_r), len(fr_r)),
                       ("phrases", len(fa_p), len(fr_p)), ("gloss", len(fa_g), len(fr_g))):
        if a != b:
            if isinstance(a, set):
                print(f"  !! {name} do not line up: {len(a)} vs {len(b)} "
                      f"(ours only: {len(a - b)}, Persian only: {len(b - a)})")
            else:
                print(f"  !! {name} do not line up: {a} vs {b}")

    records, report_name = [], report.name
    for key, persian in fa.items():
        records.append({"kind": "dict", "en": key, "fa": persian, "fr": fr.get(key),
                        "de": de.get(key), "tr": tr.get(key), "where": [f"{report_name} dict"], "line": 0})
    for kind, english_side, persian_side, ours in (
            ("rules", fa_r, None, {"fr": fr_r, "de": de_r, "tr": tr_r}),
            ("phrases", fa_p, None, {"fr": fr_p, "de": de_p, "tr": tr_p}),
            ("gloss", fa_g, None, {"fr": fr_g, "de": de_g, "tr": tr_g})):
        for index, entry in enumerate(english_side):
            persian = entry[1] if isinstance(entry, list) and len(entry) > 1 else None
            row = {"kind": kind, "index": index, "en": entry[0] if isinstance(entry, list) else entry,
                   "fa": persian, "where": [f"{report_name} {kind}[{index}]"], "line": 0}
            for lang, values in ours.items():
                value = values[index]
                if isinstance(value, list) and len(value) > 1:
                    row[lang], row[lang + "_term"] = value[1], value[0]
                else:
                    row[lang] = value
            records.append(row)

    out.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding="utf-8")
    kinds = {}
    for record in records:
        kinds[record["kind"]] = kinds.get(record["kind"], 0) + 1
    print(f"{len(records)} units -> {out}")
    print("by kind:", ", ".join(f"{k} {v}" for k, v in sorted(kinds.items())))


if __name__ == "__main__":
    main()
