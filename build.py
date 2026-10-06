"""Assemble the site: src/pages/**/*.html + src/partials/*.html -> the repo root.

Run `python build.py` after editing anything under src/. The generated pages are
committed, because GitHub Pages serves the repository as-is.

Every page is written twice from one source: in English at its own address (English is
the language a visitor meets first) and in Persian under /fa/. A source keeps both
languages side by side, in elements classed t-fa and t-en; the build keeps the one that
belongs and drops the other.

A page source starts with comment lines, then <body>:
  <!-- section: name -->     which nav link is the current one (required, first line)
  <!-- title.fa: ... -->     <title>, per language (title.en likewise)
  <!-- desc.fa: ... -->      meta description, per language
  <!-- og.fa: ... -->        the line under the title in a link preview, per language
  <!-- both: yes -->         one page carrying both languages (the not-found page only)

Tokens a page or a partial may use:
  @@NAME@@          contents of src/partials/name.html
  @@R@@             path back to the language's own root ("" or "../"), for links between pages
  @@R@@assets/      always resolves to the one shared /assets/ folder
  @@V@@             VERSION below - appended to style.css / main.js so browsers refetch them
  @@A:key@@         aria-current="page" when the page's section is key
  @@L:فارسی||English@@   the text for the page's language, for use inside attributes
  @@PROJNAV@@       on a project page: links to the previous and the next project (order below)
  @@LANGBTN@@       the link to the same page in the other language
"""
import re
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

VERSION = "51"  # bump whenever assets/css/style.css or assets/js/main.js changes
SITE = "https://novacapital.fund/"
LANGS = ("fa", "en")
MAIN = "en"     # the language served at the site's root; the other one lives under /<its code>/

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
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

ROOT = Path(__file__).parent
PAGES = ROOT / "src" / "pages"
PARTIALS = {p.stem.upper(): p.read_text(encoding="utf-8").rstrip("\n")
            for p in (ROOT / "src" / "partials").glob("*.html")}


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

    return ('    <nav class="projnav reveal" aria-label="@@L:پروژه‌های دیگر||More projects@@">\n'
            + card(prev, "is-prev", "پروژه‌ی قبلی", "Previous project", True)
            + card(nxt, "is-next", "پروژه‌ی بعدی", "Next project", False)
            + '    </nav>')


class Cutter(HTMLParser):
    """Finds every element that carries one class, so it can be cut out of the text whole."""

    def __init__(self, text, cls):
        super().__init__(convert_charrefs=False)
        self.text, self.cls = text, cls
        self.lines = [0] + [m.end() for m in re.finditer("\n", text)]
        self.open, self.start, self.cuts = [], None, []
        self.feed(text)
        self.close()

    def here(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        first = self.start is None and self.cls in (dict(attrs).get("class") or "").split()
        if first:
            self.start = self.here()
        self.open.append((tag, first))

    def handle_endtag(self, tag):
        for i in range(len(self.open) - 1, -1, -1):
            if self.open[i][0] == tag:
                if any(first for _, first in self.open[i:]):
                    self.cuts.append((self.start, self.text.index(">", self.here()) + 1))
                    self.start = None
                del self.open[i:]
                return


def only(text, lang):
    """The text with every element of the other language removed."""
    other = "t-en" if lang == "fa" else "t-fa"
    out, at = [], 0
    for a, b in Cutter(text, other).cuts:
        line_a = text.rfind("\n", 0, a) + 1
        line_b = text.find("\n", b)
        line_b = len(text) if line_b < 0 else line_b
        if not text[line_a:a].strip() and not text[b:line_b].strip():   # it stood alone on its line: take the line too
            a, b = line_a, min(len(text), line_b + 1)
        out.append(text[at:a])
        at = b
    out.append(text[at:])
    return "".join(out)


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def address(rel, lang):
    """A page's public address in one language."""
    path = rel.as_posix()
    path = path[:-len("index.html")] if path.endswith("index.html") else path
    return SITE + ("" if lang == MAIN else lang + "/") + path


def head_meta(rel, meta, lang, both):
    if both:
        return "\n".join(['<base href="/">', f'<title>{esc(meta["title." + MAIN])}</title>',
                          '<meta name="robots" content="noindex">'])
    other = "en" if lang == "fa" else "fa"
    image = SITE + f"assets/img/og/{rel.stem if rel.parts[0] == 'projects' else 'nova'}-{lang}.jpg"
    locale = {"fa": "fa_IR", "en": "en_US"}
    return "\n".join([
        f'<title>{esc(meta["title." + lang])}</title>',
        f'<meta name="description" content="{esc(meta["desc." + lang])}">',
        f'<link rel="canonical" href="{address(rel, lang)}">',
        f'<link rel="alternate" hreflang="fa" href="{address(rel, "fa")}">',
        f'<link rel="alternate" hreflang="en" href="{address(rel, "en")}">',
        f'<link rel="alternate" hreflang="x-default" href="{address(rel, MAIN)}">',
        f'<meta property="og:title" content="{esc(meta["title." + lang])}">',
        f'<meta property="og:description" content="{esc(meta["og." + lang])}">',
        f'<meta property="og:url" content="{address(rel, lang)}">',
        f'<meta property="og:locale" content="{locale[lang]}">',
        f'<meta property="og:locale:alternate" content="{locale[other]}">',
        f'<meta property="og:image" content="{image}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:image" content="{image}">',
    ])


def preload(lang):
    fonts = {"fa": ["vazirmatn-var"], "en": ["inter-latin-var", "space-grotesk-latin-var"]}[lang]
    return "\n".join(f'<link rel="preload" href="@@R@@assets/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>'
                     for f in fonts)


def read(page):
    """A page source: its metadata lines, then everything from <body> on."""
    meta, lines = {}, page.read_text(encoding="utf-8").split("\n")
    while lines and (m := re.fullmatch(r"<!--\s*([\w.]+):\s*(.*?)\s*-->", lines[0])):
        meta[m.group(1)] = m.group(2)
        lines.pop(0)
    if "section" not in meta:
        raise SystemExit(f"{page.name}: first line must be <!-- section: name -->")
    return meta, "\n".join(lines)


def main():
    sitemap = []
    for page in sorted(PAGES.rglob("*.html")):
        rel = page.relative_to(PAGES)
        meta, source = read(page)
        both = meta.get("both") == "yes"
        depth = len(rel.parts) - 1
        if "@@PROJNAV@@" in source:
            source = source.replace("@@PROJNAV@@", projnav(page.stem))
        for name, body in PARTIALS.items():
            if name != "HEAD":
                source = source.replace(f"@@{name}@@", body)
        source = re.sub(r"@@A:(\w+)@@", lambda m: ' aria-current="page"' if m.group(1) == meta["section"] else "", source)

        for lang in ((MAIN,) if both else LANGS):
            other = "en" if lang == "fa" else "fa"
            up = "" if both else "../" * depth                      # back to this language's root
            top = up + ("" if lang == MAIN else "../")              # back to the site's root
            here = rel.as_posix()
            here = here[:-len("index.html")] if here.endswith("index.html") else here
            alt = (top + other + "/" + here) if lang == MAIN else (top + here or "./")
            attrs = f'lang="{lang}" dir="{"rtl" if lang == "fa" else "ltr"}" data-lang="{lang}"'

            if both:
                button = ('<button class="lang-btn" id="langBtn" type="button" aria-label="Change language">'
                          '<span class="t-fa">EN</span><span class="t-en">فا</span></button>')
                attrs += ' data-both'
            else:
                button = (f'<a class="lang-btn" id="langBtn" href="{alt}" hreflang="{other}" lang="{other}" '
                          f'aria-label="@@L:EN — English||فا — فارسی@@">@@L:EN||فا@@</a>')
                if lang == MAIN:
                    attrs += f' data-alt="{alt}"'                   # where the same page lives in the other language

            head = PARTIALS["HEAD"].replace("@@META@@", head_meta(rel, meta, lang, both)).replace("@@PRELOAD@@", preload(lang))
            text = f'<!DOCTYPE html>\n<html {attrs}>\n<head>\n{head}\n</head>\n' + source.replace("@@LANGBTN@@", button)
            text = re.sub(r"@@L:(.*?)\|\|(.*?)@@", lambda m: m.group(1 if lang == "fa" else 2), text)
            if not both:
                text = only(text, lang)
            text = text.replace("@@R@@assets/", top + "assets/").replace("@@R@@", up).replace("@@V@@", VERSION)
            if "@@" in text:
                raise SystemExit(f"{rel}: unresolved token near {text[text.index('@@'):][:40]!r}")

            out = ROOT / ("" if lang == MAIN else lang) / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(text, encoding="utf-8", newline="\n")
            print("built", out.relative_to(ROOT).as_posix())
            if not both and lang == MAIN:
                # English lived under /en/ for a short while: those addresses pass the reader on
                to = "../" * (depth + 1) + here or "./"
                old = ROOT / "en" / rel
                old.parent.mkdir(parents=True, exist_ok=True)
                old.write_text(
                    '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
                    f'<title>{esc(meta["title.en"])}</title>\n<meta name="robots" content="noindex">\n'
                    f'<link rel="canonical" href="{address(rel, "en")}">\n'
                    f'<meta http-equiv="refresh" content="0; url={to}">\n'
                    f'<script>location.replace("{to}" + location.search + location.hash);</script>\n'
                    f'</head>\n<body><p><a href="{to}">{esc(meta["title.en"])}</a></p></body>\n</html>\n',
                    encoding="utf-8", newline="\n")
            if not both:
                links = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{address(rel, l)}"/>' for l in LANGS)
                sitemap.append(f"  <url><loc>{address(rel, lang)}</loc><lastmod>{date.today()}</lastmod>{links}</url>")

    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(sorted(sitemap, key=lambda s: (s.count("/"), s))) + "\n</urlset>\n", encoding="utf-8", newline="\n")
    print("built sitemap.xml")


if __name__ == "__main__":
    main()
