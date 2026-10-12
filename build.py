"""Assemble the site: src/pages/**/*.html + src/partials/*.html -> the repo root.

Run `python build.py` after editing anything under src/. The generated pages are
committed, because GitHub Pages serves the repository as-is.

Every page is written once per language from one source: in English at its own address
(English is the language a visitor meets first) and in every other language under /<code>/.

Two languages are written in the sources themselves, side by side, in elements classed
t-fa and t-en: Persian and English. The build keeps the one that belongs and drops the other.
The remaining languages (French, German, Turkish) are translations of the English: each has a
catalogue, src/i18n/<code>.json, that maps an English text to its translation. A page in such
a language is the English page with every t-en text looked up. The build stops, and lists what
is missing, when an English text has no translation yet - so no page can fall behind.

A page source starts with comment lines, then <body>:
  <!-- section: name -->     which nav link is the current one (required, first line)
  <!-- title.fa: ... -->     <title>, per written language (title.en likewise)
  <!-- desc.fa: ... -->      meta description, per written language
  <!-- og.fa: ... -->        the line under the title in a link preview, per written language
  <!-- both: yes -->         one page carrying every language (the not-found page only)

Tokens a page or a partial may use:
  @@NAME@@          contents of src/partials/name.html
  @@R@@             path back to the language's own root ("" or "../"), for links between pages
  @@R@@assets/      always resolves to the one shared /assets/ folder
  @@V@@             VERSION below - appended to style.css / main.js so browsers refetch them
  @@A:key@@         aria-current="page" when the page's section is key
  @@L:فارسی||English@@   the text for the page's language, for use inside attributes
  @@PROJNAV@@       on a project page: links to the previous and the next project (order below)
  @@LANGBTN@@       the language menu: the same page in every language
"""
import json
import os
import sys
import re
import time
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

VERSION = "57"  # bump whenever assets/css/style.css or assets/js/main.js changes
SITE = "https://novacapital.fund/"
LANGS = ("en", "fr", "de", "tr", "fa")    # in the order of the language menu: Persian closes the list
MAIN = "en"     # the language served at the site's root; every other one lives under /<its code>/
RTL = ("fa",)
NAMES = {"en": "English", "fa": "فارسی", "fr": "Français", "de": "Deutsch", "tr": "Türkçe"}   # each in its own language
MENU_LABEL = {"en": "Language", "fa": "زبان", "fr": "Langue", "de": "Sprache", "tr": "Dil"}
LOCALE = {"en": "en_GB", "fa": "fa_IR", "fr": "fr_FR", "de": "de_DE", "tr": "tr_TR"}
# fonts fetched early, per language: Turkish needs the extended Latin range from its first line
FONTS = {"fa": ["vazirmatn-var"], "en": ["inter-latin-var", "space-grotesk-latin-var"],
         "fr": ["inter-latin-var", "space-grotesk-latin-var"], "de": ["inter-latin-var", "space-grotesk-latin-var"],
         "tr": ["inter-latin-var", "inter-latin-ext-var", "space-grotesk-latin-var"]}
DRAFT = os.environ.get("NOVA_DRAFT") == "1"   # a draft build shows the English where a translation is missing
MENU = {"home": 0, "about": 1, "projects": 2, "contact": 3}   # the order of the menu: pages come in from the side they lie on

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
I18N = ROOT / "src" / "i18n"
CARET = '<svg class="lang-caret" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
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


class Finder(HTMLParser):
    """Finds every outermost element that carries one class: where its opening tag starts and ends,
    and where its closing tag starts and ends."""

    def __init__(self, text, cls):
        super().__init__(convert_charrefs=False)
        self.text, self.cls = text, cls
        self.lines = [0] + [m.end() for m in re.finditer("\n", text)]
        self.open, self.start, self.found = [], None, []
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
            at = self.here()
            self.start = (at, at + len(self.get_starttag_text()))
        self.open.append((tag, first))

    def handle_endtag(self, tag):
        for i in range(len(self.open) - 1, -1, -1):
            if self.open[i][0] == tag:
                if any(first for _, first in self.open[i:]):
                    at = self.here()
                    self.found.append((*self.start, at, self.text.index(">", at) + 1))
                    self.start = None
                del self.open[i:]
                return


def without(text, cls):
    """The text with every element of one class removed."""
    out, at = [], 0
    for a, _, _, b in Finder(text, cls).found:
        line_a = text.rfind("\n", 0, a) + 1
        line_b = text.find("\n", b)
        line_b = len(text) if line_b < 0 else line_b
        if not text[line_a:a].strip() and not text[b:line_b].strip():   # it stood alone on its line: take the line too
            a, b = line_a, min(len(text), line_b + 1)
        out.append(text[at:a])
        at = b
    out.append(text[at:])
    return "".join(out)


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


class Catalogue:
    """One language's translations of the English texts, from src/i18n/<code>.json."""

    def __init__(self, lang):
        self.lang, self.used, self.missing = lang, set(), []
        path = I18N / f"{lang}.json"
        self.texts = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}

    def __call__(self, english):
        key = norm(english)
        if not key:
            return english
        if key in self.texts:
            self.used.add(key)
            return self.texts[key]
        if key not in self.missing:
            self.missing.append(key)
        return key


def reclass(tag, lang):
    """An opening tag classed t-en, classed for another language instead."""
    return re.sub(r'(class="[^"]*?)\bt-en\b', rf"\1t-{lang}", tag, count=1)


def translated(text, say, lang):
    """The English text of a page, with every t-en element put into another language."""
    out, at = [], 0
    for a, b, c, d in Finder(text, "t-en").found:
        out += [text[at:a], reclass(text[a:b], lang), say(text[b:c]), text[c:d]]
        at = d
    out.append(text[at:])
    return "".join(out)


def every_language(text, says):
    """For the one page that carries all languages: after each t-en element, its twin in each translated language."""
    out, at = [], 0
    for a, b, c, d in Finder(text, "t-en").found:
        out.append(text[at:d])
        for lang, say in says.items():
            out.append(reclass(text[a:b], lang) + say(text[b:c]) + text[c:d])
        at = d
    out.append(text[at:])
    return "".join(out)


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


def address(rel, lang):
    """A page's public address in one language."""
    path = rel.as_posix()
    path = path[:-len("index.html")] if path.endswith("index.html") else path
    return SITE + ("" if lang == MAIN else lang + "/") + path


def head_meta(rel, meta, lang, both, say):
    if both:
        return "\n".join(['<base href="/">', f'<title>{esc(meta["title." + MAIN])}</title>',
                          '<meta name="robots" content="noindex">'])

    def own(key):       # a line of the page's metadata, in this page's language
        return meta[f"{key}.{lang}"] if f"{key}.{lang}" in meta else say(meta[f"{key}.en"])

    image = SITE + f"assets/img/og/{rel.stem if rel.parts[0] == 'projects' else 'nova'}-{lang}.jpg"
    return "\n".join([
        f'<title>{esc(own("title"))}</title>',
        f'<meta name="description" content="{esc(own("desc"))}">',
        f'<link rel="canonical" href="{address(rel, lang)}">',
        *[f'<link rel="alternate" hreflang="{l}" href="{address(rel, l)}">' for l in LANGS],
        f'<link rel="alternate" hreflang="x-default" href="{address(rel, MAIN)}">',
        f'<meta property="og:title" content="{esc(own("title"))}">',
        f'<meta property="og:description" content="{esc(own("og"))}">',
        f'<meta property="og:url" content="{address(rel, lang)}">',
        f'<meta property="og:locale" content="{LOCALE[lang]}">',
        *[f'<meta property="og:locale:alternate" content="{LOCALE[l]}">' for l in LANGS if l != lang],
        f'<meta property="og:image" content="{image}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:image" content="{image}">',
    ])


def flag(code):
    return f'<img class="flag" src="@@R@@assets/img/flags/{code}.png" alt="" width="24" height="16">'


def langmenu(lang, both, link):
    """The language menu: a button showing the page's language, and under it the same page in every language,
    each with its flag and its name in its own words. It opens without script (details / summary)."""
    if both:    # the not-found page changes language in place: buttons, and the button's face once per language
        face = "".join(f'<span class="lang-face t-{l}" lang="{l}">{flag(l)}<span class="lang-name">{NAMES[l]}</span></span>' for l in LANGS)
        items = "".join(f'<li><button type="button" data-lang="{l}" lang="{l}">{flag(l)}<span>{NAMES[l]}</span></button></li>' for l in LANGS)
        label = "Language"
    else:
        face = f'{flag(lang)}<span class="lang-name">{NAMES[lang]}</span>'
        # the page's own language is a row that is not a link: there is nowhere to go
        items = "".join((f'<li><span class="lang-here" aria-current="true" lang="{l}">{flag(l)}<span>{NAMES[l]}</span></span></li>' if l == lang else
                         f'<li><a href="{link(l)}" hreflang="{l}" lang="{l}">{flag(l)}<span>{NAMES[l]}</span></a></li>') for l in LANGS)
        label = f"{MENU_LABEL[lang]}: {NAMES[lang]}"
    return (f'<details class="lang" id="lang">\n'
            f'        <summary class="lang-btn" id="langBtn" aria-label="{label}">{face}{CARET}</summary>\n'
            f'        <ul class="lang-menu" id="langMenu">{items}</ul>\n'
            f'      </details>')


def preload(lang):
    return "\n".join(f'<link rel="preload" href="@@R@@assets/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>'
                     for f in FONTS[lang])


def write(path, text):
    """Write a generated file. If Windows reports it busy for a moment (a scanner, a local server), try again."""
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(6):
        try:
            path.write_text(text, encoding="utf-8", newline="\n")
            return
        except OSError:
            if attempt == 5:
                raise
            time.sleep(0.3)


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
    sys.stdout.reconfigure(errors="backslashreplace")      # a Windows console may not hold every letter of every language
    sitemap = []
    says = {lang: Catalogue(lang) for lang in LANGS if lang not in ("fa", "en")}
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
        here = rel.as_posix()
        here = here[:-len("index.html")] if here.endswith("index.html") else here

        for lang in ((MAIN,) if both else LANGS):
            say = says.get(lang)
            up = "" if both else "../" * depth                      # back to this language's root
            top = up + ("" if lang == MAIN else "../")              # back to the site's root
            attrs = f'lang="{lang}" dir="{"rtl" if lang in RTL else "ltr"}" data-lang="{lang}"'
            if meta["section"] in MENU:
                attrs += f' data-sec="{MENU[meta["section"]]}"'
            if both:
                attrs += ' data-both'
            elif lang == MAIN:
                attrs += f' data-alt="{top}*/{here}"'               # where the same page lives in another language (* = its code)

            def link(to):       # the same page in another language, from this one
                return (top + ("" if to == MAIN else to + "/") + here) or "./"

            head = PARTIALS["HEAD"].replace("@@META@@", head_meta(rel, meta, lang, both, say)).replace("@@PRELOAD@@", preload(lang))
            text = f'<!DOCTYPE html>\n<html {attrs}>\n<head>\n{head}\n</head>\n' + source
            text = re.sub(r"@@L:(.*?)\|\|(.*?)@@",
                          lambda m: m.group(1) if lang == "fa" else say(m.group(2)) if say else m.group(2), text)
            if both:
                text = every_language(text, says)
            elif lang == "fa":
                text = without(text, "t-en")
            else:
                text = without(text, "t-fa")
                if say:
                    text = translated(text, say, lang)
            text = text.replace("@@LANGBTN@@", langmenu(lang, both, link))     # after the texts: the menu is the same in every language
            text = text.replace("@@R@@assets/", top + "assets/").replace("@@R@@", up).replace("@@V@@", VERSION)
            if "@@" in text:
                raise SystemExit(f"{rel}: unresolved token near {text[text.index('@@'):][:40]!r}")

            out = ROOT / ("" if lang == MAIN else lang) / rel
            write(out, text)
            print("built", out.relative_to(ROOT).as_posix())
            if not both and lang == MAIN:
                # English lived under /en/ for a short while: those addresses pass the reader on
                to = "../" * (depth + 1) + here or "./"
                write(ROOT / "en" / rel,
                      '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n'
                      f'<title>{esc(meta["title.en"])}</title>\n<meta name="robots" content="noindex">\n'
                      f'<link rel="canonical" href="{address(rel, "en")}">\n'
                      f'<meta http-equiv="refresh" content="0; url={to}">\n'
                      f'<script>location.replace("{to}" + location.search + location.hash);</script>\n'
                      f'</head>\n<body><p><a href="{to}">{esc(meta["title.en"])}</a></p></body>\n</html>\n')
            if not both:
                links = "".join(f'<xhtml:link rel="alternate" hreflang="{l}" href="{address(rel, l)}"/>' for l in LANGS)
                sitemap.append(f"  <url><loc>{address(rel, lang)}</loc><lastmod>{date.today()}</lastmod>{links}</url>")

    write(ROOT / "sitemap.xml",
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
          + "\n".join(sorted(sitemap, key=lambda s: (s.count("/"), s))) + "\n</urlset>\n")
    print("built sitemap.xml")

    # every English text must exist in every translated language; a text no page uses any more is only reported
    lacking = {lang: say.missing for lang, say in says.items() if say.missing}
    for lang, say in says.items():
        stale = [k for k in say.texts if k not in say.used]
        if stale:
            print(f"note: src/i18n/{lang}.json holds {len(stale)} text(s) no page uses any more, e.g. {stale[0][:60]!r}")
    if lacking:
        write(I18N / "_missing.json", json.dumps(lacking, ensure_ascii=False, indent=1) + "\n")
        for lang, keys in lacking.items():
            print(f"MISSING in src/i18n/{lang}.json: {len(keys)} text(s), e.g. {keys[0][:70]!r}")
        if not DRAFT:
            raise SystemExit("Translations are missing (listed in src/i18n/_missing.json). Add them, then build again.")
    elif (I18N / "_missing.json").exists():
        (I18N / "_missing.json").unlink()


if __name__ == "__main__":
    main()
