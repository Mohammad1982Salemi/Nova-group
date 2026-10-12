"""English left showing on a translated page.

    python tools/review/leak.py <lang>

Compares the built pages of one language against the English ones and lists every piece
of visible text — text nodes and the attributes a reader can see or hear (alt, title,
aria-label, placeholder, meta description) — that is the same in both. An identical
string is not always a fault: a proper name, a figure or a word both languages spell the
same way is meant to match. So each hit is marked with whether some catalogue entry
explains it (the entry's English key and its value in this language), which leaves the
unexplained ones to be read by hand.
"""
import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKIP = {"script", "style"}
VISIBLE_ATTRS = ("alt", "title", "aria-label", "placeholder", "content")


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip, self.capture = [], 0, None

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip += 1
        if tag == "meta":
            got = dict(attrs)
            if got.get("name") in ("description",) or (got.get("property") or "").endswith("description"):
                self.out.append(("meta", got.get("content", "")))
            return
        for name, value in attrs:
            if name in VISIBLE_ATTRS and name != "content" and value:
                self.out.append((name, value))

    def handle_endtag(self, tag):
        if tag in SKIP and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip:
            self.out.append(("text", data))


def pieces(path):
    if not path.exists():
        return []
    parser = Text()
    parser.feed(path.read_text(encoding="utf-8"))
    out = []
    for kind, raw in parser.out:
        value = re.sub(r"\s+", " ", html.unescape(raw)).strip()
        if value:
            out.append((kind, value))
    return out


def interesting(value):
    """A string a reader would notice as the wrong language."""
    if len(value) < 4 or not re.search(r"[A-Za-zÀ-ÿ]", value):
        return False
    if re.fullmatch(r"[\W\d_]+", value):
        return False
    return bool(re.search(r"[a-zà-ÿ]{3,}", value))


def main():
    lang = sys.argv[1]
    catalogue = json.loads((ROOT / "src" / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
    same_value = {k for k, v in catalogue.items() if k == v}
    pages = sorted(p for p in (ROOT / "src" / "pages").glob("*.html")) + \
            sorted(p for p in (ROOT / "src" / "pages" / "projects").glob("*.html"))

    hits = {}
    for source in pages:
        rel = source.relative_to(ROOT / "src" / "pages")
        english, other = pieces(ROOT / rel), pieces(ROOT / lang / rel)
        if not english or not other:
            continue
        seen = {value for _kind, value in english if interesting(value)}
        for kind, value in other:
            if value in seen and interesting(value):
                hits.setdefault(value, []).append(f"{lang}/{rel.as_posix()}:{kind}")

    print(f"{len(hits)} identical string(s) on the {lang} pages and the English ones\n")
    unexplained = []
    for value, where in sorted(hits.items(), key=lambda kv: -len(kv[1])):
        explained = value in same_value or value in catalogue
        mark = "ok " if explained else "?  "
        if not explained:
            unexplained.append(value)
        print(f"{mark}{where[0]}  ({len(where)}x)  {value[:88]!r}")
    print(f"\n{len(unexplained)} to read by hand:")
    for value in unexplained:
        print("   ", value[:100])


if __name__ == "__main__":
    main()
