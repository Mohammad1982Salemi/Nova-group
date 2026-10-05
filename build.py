"""Assemble the site: src/pages/**/*.html + src/partials/*.html -> repo root.

Run `python build.py` after editing anything under src/. The generated pages are
committed, because GitHub Pages serves the repository as-is.

Tokens a page (or a partial) may use:
  @@NAME@@      contents of src/partials/name.html
  @@R@@         path back to the site root ("" or "../"), so links work at any depth
  @@V@@         VERSION below - appended to style.css / main.js so browsers refetch them
  @@A:key@@     aria-current="page" when the page's first line is <!-- section: key -->
"""
import re
from pathlib import Path

VERSION = "38"  # bump whenever assets/css/style.css or assets/js/main.js changes

ROOT = Path(__file__).parent
PAGES = ROOT / "src" / "pages"
PARTIALS = {p.stem.upper(): p.read_text(encoding="utf-8").rstrip("\n")
            for p in (ROOT / "src" / "partials").glob("*.html")}

for page in sorted(PAGES.rglob("*.html")):
    rel = page.relative_to(PAGES)
    text = page.read_text(encoding="utf-8")

    head = re.match(r"<!--\s*section:\s*(\w+)\s*-->\s*", text)
    if not head:
        raise SystemExit(f"{rel}: first line must be <!-- section: name -->")
    section, text = head.group(1), text[head.end():]

    for name, body in PARTIALS.items():
        text = text.replace(f"@@{name}@@", body)
    text = re.sub(r"@@A:(\w+)@@",
                  lambda m: ' aria-current="page"' if m.group(1) == section else "", text)
    text = text.replace("@@R@@", "../" * (len(rel.parts) - 1)).replace("@@V@@", VERSION)

    if "@@" in text:
        raise SystemExit(f"{rel}: unresolved token near {text[text.index('@@'):][:40]!r}")

    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8", newline="\n")
    print("built", rel.as_posix())
