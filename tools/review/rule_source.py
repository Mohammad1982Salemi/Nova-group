"""The simulator report's rule table, as it stands when the engine uses it.

    python tools/review/rule_source.py [report.html]

A report carries a JavaScript array of translation rules: English pattern -> Persian
replacement. The array is built in three steps: `const FA_R = [ ... ]` (105 pairs), then
`FA_RC = FA_R.map(...)`, which turns every *string* pattern into a regex, and finally
`FA_RC.unshift( ... )` (11 pairs), which end up at the FRONT of the list. So the order the
engine uses is the 11 unshifted pairs first, then the 105 from FA_R — 116 in all.

`en` is the pattern as the engine sees it: the source text of a /regex/ literal, or, for a
string pattern, what the map builds out of it (^ ... $ with {1} -> (\\S+) and {n} -> (.+?)).
`fa` is the replacement text, or, when the replacement is written as an arrow function, the
function's own source text.

The two arrays are read with a small scanner that understands strings, // and /* */ comments
and /regex/ literals, so square brackets *inside* a pattern (the `[2| ... ]` markers) are not
mistaken for structure. The counts and a few known indices are asserted, because a scanner
that mis-reads those markers still "parses fine" while quietly merging or dropping entries.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# The metacharacters the report's own `new RegExp` builder escapes, and the two markers it
# turns into capture groups. Kept byte-for-byte in step with the map in the report.
ESCAPE_RE = re.compile(r"[.*+?^$()|\[\]\\]")
FIRST_MARKER_RE = re.compile(r"^\{1\}")
NUMBER_MARKER_RE = re.compile(r"\{\d\}")

# Ground truth, read out of the running page: the total, and four known indices.
EXPECTED_TOTAL = 116
EXPECTED_FA_R = 105
EXPECTED_UNSHIFT = 11
KNOWN = {
    0: r"^Each dot is one trade; one of every (\S+) is drawn\.$",
    11: r"^(\S+) with trades$",
    101: r"^(\S+) trades\.$",
    115: r"^(\S+) of (\S+)$",
}


def skip_string(text, i):
    """text[i] is a quote; return the index just past the closing quote."""
    quote = text[i]
    i += 1
    n = len(text)
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
            continue
        if c == quote:
            return i + 1
        i += 1
    raise ValueError("unterminated string literal")


def skip_regex(text, i):
    """text[i] is '/' opening a regex literal; return the index past its flags."""
    i += 1
    n = len(text)
    in_class = False
    while i < n:
        c = text[i]
        if c == "\\":
            i += 2
            continue
        if c == "[":
            in_class = True
        elif c == "]":
            in_class = False
        elif c == "/" and not in_class:
            i += 1
            while i < n and text[i].isalpha():
                i += 1
            return i
        i += 1
    raise ValueError("unterminated regex literal")


def scan_once(text, i, prev):
    """If text[i] opens a string, a comment or (contextually) a regex, skip it.

    Returns (next_index, new_prev) or None when the character is ordinary. `prev` is the
    last significant character, used to tell a /regex/ from a division.
    """
    c = text[i]
    n = len(text)
    if c in "\"'`":
        return skip_string(text, i), c
    if c == "/":
        nxt = text[i + 1] if i + 1 < n else ""
        if nxt == "/":
            j = text.find("\n", i)
            return (n if j < 0 else j + 1), prev
        if nxt == "*":
            j = text.find("*/", i + 2)
            if j < 0:
                raise ValueError("unterminated block comment")
            return j + 2, prev
        value_end = bool(prev) and (prev.isalnum() or prev == "_" or prev in ")]}\"'`")
        if not value_end:
            return skip_regex(text, i), "/"
    return None


def match_bracket(text, i):
    """text[i] is ( [ or {; return the index of its matching closer."""
    assert text[i] in "([{", text[i]
    stack = []
    prev = ""
    n = len(text)
    while i < n:
        skipped = scan_once(text, i, prev)
        if skipped is not None:
            i, prev = skipped
            continue
        c = text[i]
        if c in "([{":
            stack.append(c)
        elif c in ")]}":
            if not stack:
                raise ValueError(f"unbalanced closer at {i}")
            stack.pop()
            if not stack:
                return i
        if not c.isspace():
            prev = c
        i += 1
    raise ValueError(f"unbalanced open bracket at {i}")


def split_top(array_text):
    """The top-level elements of a [ ... ] literal (array_text includes the brackets)."""
    parts, depth, start, prev = [], 0, None, ""
    i, n = 1, len(array_text) - 1
    while i < n:
        skipped = scan_once(array_text, i, prev)
        if skipped is not None:
            i, prev = skipped
            continue
        c = array_text[i]
        if c in "([{":
            if depth == 0:
                start = i
            depth += 1
        elif c in ")]}":
            depth -= 1
            if depth == 0 and start is not None:
                parts.append(array_text[start:i + 1])
                start = None
        elif c == "," and depth == 0:
            if start is not None:
                parts.append(array_text[start:i])
                start = None
        elif depth == 0 and start is None and not c.isspace():
            start = i
        if not c.isspace():
            prev = c
        i += 1
    if start is not None:
        parts.append(array_text[start:n])
    return [part.strip() for part in parts if part.strip()]


def split_pair(pair_text):
    """The two sides of a [ pattern , replacement ] pair."""
    parts, depth, start, prev = [], 0, 1, ""
    i, n = 1, len(pair_text) - 1
    while i < n:
        skipped = scan_once(pair_text, i, prev)
        if skipped is not None:
            i, prev = skipped
            continue
        c = pair_text[i]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif c == "," and depth == 0:
            parts.append(pair_text[start:i])
            start = i + 1
        if not c.isspace():
            prev = c
        i += 1
    parts.append(pair_text[start:n])
    return [part.strip() for part in parts]


ESCAPES = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}


def js_string(src):
    """A JS "double"- or 'single'-quoted string literal, decoded to Python text."""
    src = src.strip()
    if not src or src[0] not in "\"'`" or src[-1] != src[0]:
        raise ValueError(f"not a string literal: {src[:60]!r}")
    body = src[1:-1]
    out = []
    i, n = 0, len(body)
    while i < n:
        c = body[i]
        if c != "\\":
            out.append(c)
            i += 1
            continue
        i += 1
        if i >= n:
            out.append("\\")
            break
        e = body[i]
        if e == "u" and i + 1 < n and body[i + 1] == "{":
            end = body.index("}", i + 2)
            out.append(chr(int(body[i + 2:end], 16)))
            i = end + 1
        elif e == "u":
            out.append(chr(int(body[i + 1:i + 5], 16)))
            i += 5
        elif e == "x":
            out.append(chr(int(body[i + 1:i + 3], 16)))
            i += 3
        elif e == "\n":
            i += 1                                  # a backslash-newline continuation
        elif e in ESCAPES:
            out.append(ESCAPES[e])
            i += 1
        else:
            out.append(e)                           # \\ \" \' \/ and friends
            i += 1
    return "".join(out)


def regex_body(src):
    """The source text of a /regex/ literal, without its slashes or flags."""
    src = src.strip()
    i, n, in_class = 1, len(src), False
    while i < n:
        c = src[i]
        if c == "\\":
            i += 2
            continue
        if c == "[":
            in_class = True
        elif c == "]":
            in_class = False
        elif c == "/" and not in_class:
            return src[1:i]
        i += 1
    raise ValueError(f"unterminated regex literal: {src[:60]!r}")


def string_pattern(raw):
    """The regex the report's map builds from a plain-string pattern."""
    escaped = ESCAPE_RE.sub(lambda m: "\\" + m.group(0), raw)
    escaped = FIRST_MARKER_RE.sub(lambda _m: r"(\S+)", escaped, count=1)
    escaped = NUMBER_MARKER_RE.sub(lambda _m: "(.+?)", escaped)
    return "^" + escaped + "$"


def pattern_value(src):
    """`en`: the pattern as the engine sees it."""
    src = src.strip()
    if src.startswith("/"):
        return regex_body(src)
    if src and src[0] in "\"'`":
        return string_pattern(js_string(src))
    raise ValueError(f"cannot read a pattern: {src[:60]!r}")


def replacement_value(src):
    """`fa`: the replacement text, or an arrow function's own source."""
    src = src.strip()
    if src and src[0] in "\"'`":
        return js_string(src)
    if "=>" in src:
        return src
    raise ValueError(f"cannot read a replacement: {src[:60]!r}")


def pairs(array_text):
    """The [ pattern, replacement ] pairs of an array literal, in order."""
    result = []
    for element in split_top(array_text):
        sides = split_pair(element)
        if len(sides) != 2:
            raise ValueError(f"not a pair: {element[:80]!r}")
        result.append((pattern_value(sides[0]), replacement_value(sides[1])))
    return result


def array_after(text, marker):
    """The [ ... ] literal that follows `marker` in the report's script."""
    at = text.index(marker) + len(marker)
    opening = text.index("[", at)
    return text[opening:match_bracket(text, opening) + 1]


def call_arguments(text, marker):
    """The comma-separated arguments of the call `marker`, as a [ ... ] literal.

    `marker` ends with its opening paren, so the arguments run from there to the matching
    close. Wrapped in brackets so the same element splitter can read them.
    """
    at = text.index(marker) + len(marker)             # marker ends with "("
    close = match_bracket(text, at - 1)
    return "[" + text[at:close] + "]"


def build(text):
    """The final table, in the order the engine uses it: unshifted pairs, then FA_R."""
    unshifted = pairs(call_arguments(text, "FA_RC.unshift("))
    fa_r = pairs(array_after(text, "const FA_R = "))

    if len(fa_r) != EXPECTED_FA_R:
        raise AssertionError(f"FA_R has {len(fa_r)} pairs, expected {EXPECTED_FA_R}")
    if len(unshifted) != EXPECTED_UNSHIFT:
        raise AssertionError(f"unshift has {len(unshifted)} pairs, expected {EXPECTED_UNSHIFT}")

    final = unshifted + fa_r
    if len(final) != EXPECTED_TOTAL:
        raise AssertionError(f"the table has {len(final)} rules, expected {EXPECTED_TOTAL}")
    for index, english in KNOWN.items():
        if final[index][0] != english:
            raise AssertionError(
                f"index {index} is {final[index][0]!r}, expected {english!r}")
    return final


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("report", nargs="?",
                        default="assets/reports/gc-market-maker.html",
                        help="the built report to read (default: the Gold market-maker report)")
    parser.add_argument("out", nargs="?",
                        default="_originals/review/report-rules.json",
                        help="where to write the JSON (default: %(default)s)")
    args = parser.parse_args()

    report = Path(args.report)
    if not report.is_absolute():
        report = ROOT / report
    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out

    final = build(report.read_text(encoding="utf-8"))
    records = [{"index": i, "en": en, "fa": fa} for i, (en, fa) in enumerate(final)]
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    functions = sum(1 for _en, fa in final if "=>" in fa)
    print(f"{len(final)} rules ({len(final) - EXPECTED_FA_R} unshifted + {EXPECTED_FA_R} from FA_R) "
          f"-> {out}")
    print(f"  replacements written as arrow functions: {functions}")
    for index, english in KNOWN.items():
        print(f"  index {index:>3}: {english}")
    print("  all counts and indices matched")


if __name__ == "__main__":
    main()
