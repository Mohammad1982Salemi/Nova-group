"""Assemble the site: src/pages/**/*.html + src/partials/*.html -> repo root.

Run `python build.py` after editing anything under src/. The generated pages are
committed, because GitHub Pages serves the repository as-is.

Tokens a page (or a partial) may use:
  @@NAME@@      contents of src/partials/name.html
  @@R@@         path back to the site root ("" or "../"), so links work at any depth
  @@V@@         VERSION below - appended to style.css / main.js so browsers refetch them
  @@A:key@@     aria-current="page" when the page's first line is <!-- section: key -->
  @@PROJNAV@@   on a project page: links to the previous and the next project (order below)
"""
import re
from pathlib import Path

VERSION = "41"  # bump whenever assets/css/style.css or assets/js/main.js changes

# the order of the project cards; a project page links to its neighbours in this list
PROJECTS = [
    ("cme-mm", "مارکت‌میکر CME", "CME Market Maker"),
    ("fast-scalp", "فست اسکلپ", "Fast Scalp"),
    ("blocktrade", "بلاک‌ترید", "BlockTrade"),
    ("tsetmc", "TSETMC", "TSETMC"),
    ("gold-etf", "آربیتراژ صندوق‌های طلا", "Gold ETF Arbitrage"),
    ("defi-lp", "دیفای ال‌پی", "DeFi LP"),
    ("crypto-mm", "مارکت‌میکر کریپتو", "Crypto Market Maker"),
]
ARROW = '<svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def projnav(slug):
    """Two cards under a project page: the project before it and the one after (wrapping round)."""
    i = [p[0] for p in PROJECTS].index(slug)
    prev, nxt = PROJECTS[i - 1], PROJECTS[(i + 1) % len(PROJECTS)]

    def card(p, cls, fa, en, before):
        label = f'<span class="t-fa">{fa}</span><span class="t-en">{en}</span>'
        way = (ARROW + label) if before else (label + ARROW)
        return (f'      <a class="projnav-card {cls} glow" href="@@R@@projects/{p[0]}.html">\n'
                f'        <span class="projnav-dir">{way}</span>\n'
                f'        <b><span class="t-fa">{p[1]}</span><span class="t-en">{p[2]}</span></b>\n'
                f'      </a>\n')

    return ('    <nav class="projnav reveal" aria-label="More projects">\n'
            + card(prev, "is-prev", "پروژه‌ی قبلی", "Previous project", True)
            + card(nxt, "is-next", "پروژه‌ی بعدی", "Next project", False)
            + '    </nav>')


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

    if "@@PROJNAV@@" in text:
        text = text.replace("@@PROJNAV@@", projnav(page.stem))
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
