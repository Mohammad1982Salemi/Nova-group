"""Give the simulator reports their five languages: English, French, German, Turkish and Persian.

The simulator writes each report as one self-contained HTML file. The four CME reports come in English with a
Persian dictionary inside; the gold-fund report comes in English only. This tool takes the files as the simulator
wrote them and writes the copies the site serves, each with the same language menu (a flag and the full name of
every language) and the same way of remembering the reader's choice:

    python tools/make_reports.py                 reads _originals/reports/, writes assets/reports/
    python tools/make_reports.py some/folder     reads the simulator's files from another folder

Run it again whenever the simulator writes a report anew. It changes no figure and no chart: only the words, and
for Persian the direction of the page. It stops, saying what it missed, if a report no longer has the shape it expects.

What it puts in comes from tools/report_i18n/:
    picker.css, picker.js     the language menu, the same in every report
    cme_engine.js             the CME report's own translator, widened from Persian to any language
    cme.fr.json ...           French, German and Turkish for the CME report: known texts, patterns, phrases, glossary
    gold_code.js              the gold report's script, with its texts in the five languages
"""
import base64
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / "tools" / "report_i18n"
OUT = ROOT / "assets" / "reports"
CME = {"GC Market Maker.html": "gc-market-maker.html", "NQ Market Maker.html": "nq-market-maker.html",
       "GC Fast Scalp.html": "gc-fast-scalp.html", "NQ Fast Scalp.html": "nq-fast-scalp.html"}
GOLD = {"gap_presentation.html": "gold-etf-report.html"}
NEW = ("fr", "de", "tr")       # the languages added to the CME report (it brings English and Persian itself)


def part(name):
    return (PARTS / name).read_text(encoding="utf-8")


def once(text, old, new, what):
    """Replace the one place a report is expected to have; anything else means the report has changed shape."""
    if text.count(old) != 1:
        raise SystemExit(f"{what}: expected once, found {text.count(old)} times. The report's shape has changed; nothing was written.")
    return text.replace(old, new)


def picker():
    flags = {l: "data:image/png;base64," + base64.b64encode((ROOT / "assets" / "img" / "flags" / f"{l}.png").read_bytes()).decode("ascii")
             for l in ("en", "fr", "de", "tr", "fa")}
    css = "\n".join(line for line in part("picker.css").splitlines() if not line.startswith("/*"))
    return css, part("picker.js").replace("/*FLAGS*/", json.dumps(flags))


def js(value):
    """A value written into a script: JSON, with the two line separators a script may not carry spelled out."""
    return json.dumps(value, ensure_ascii=False).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029").replace("</", "<\\/")


def cme_tables():
    out = []
    for lang in NEW:
        t = json.loads(part(f"cme.{lang}.json"))
        up = lang.upper()
        out.append(f"const {up} = {js(t['dict'])};\nconst {up}_R = {js(t['rules'])};\nconst {up}_P = {js(t['phrases'])};\nconst {up}_GLOSS = {js(t['gloss'])};")
    return "\n".join(out)


def cme(text, css, menu):
    # the head: the menu's look, and its place
    text = once(text, "#langbar{direction:ltr;text-align:right;margin:0 0 4px}", css, "the language bar's style")
    text = once(text, '<div id="langbar"><button class="hbtn" id="hb_l"></button></div>', '<div id="langbar"></div>', "the language button")
    # the language section: the Persian tables stay as the simulator wrote them; what reads them is widened
    a = text.index("// ---------------------------------------------------------------- language:")
    data = text.index("const LRI = ", a)
    old = text.index("const faMemo = new Map();", data)
    end = text.index("\n", text.index('new MutationObserver((ms) => { if (LANG !== "fa") return;', old)) + 1
    head = ("// ---------------------------------------------------------------- language: English, or French, German, Turkish, Persian\n"
            "// The page is WRITTEN in English. In another language every text the page puts on screen is translated on its way in\n"
            "// (a MutationObserver over the body): an exact sentence, a pattern with figures, or - as a fallback - phrase by phrase.\n"
            "// Figures are left as the program prints them. Persian is the same page right to left, with numbers, money, dates and\n"
            "// durations kept left-to-right inside the text. Nothing else changes.\n"
            + menu + "let LANG = rlStart();\n")
    text = text[:a] + head + text[data:old] + part("cme_engine.js").replace("/*TABLES*/", cme_tables()) + text[end:]
    # the three places outside the section that knew of two languages only
    text = once(text, """(LANG === "fa" ? ' class="nofa"' : "") + '>' + (LANG === "fa" ? FA_GLOSS : GLOSS)""",
                """(CUR ? ' class="nofa"' : "") + '>' + (CUR ? CUR.gloss : GLOSS)""", "the glossary")
    text = once(text, """$("hb_l").addEventListener("click", () => setLang(LANG === "fa" ? "en" : "fa"));""", "rlShow = rlMenu(setLang);", "the language button's click")
    text = once(text, 'document.title = "Strategy Performance Report - " + m.symbol;',
                'document.title = (CUR && CUR.dict["Strategy Performance Report"] || "Strategy Performance Report") + " - " + m.symbol;', "the page title")
    return text


GOLD_CSS = """
  /* ---- Persian: the page right to left; charts, figures and the month table keep their own direction */
  svg { direction: ltr; }
  [dir=rtl] body.viz-root { font-family: Tahoma, "Segoe UI", Arial, sans-serif; line-height: 1.75; }
  [dir=rtl] h1, [dir=rtl] h2, [dir=rtl] .eyebrow, [dir=rtl] .tile .k, [dir=rtl] .runbar .lab, [dir=rtl] .hero .big, [dir=rtl] .tile .v { letter-spacing: 0; }
  [dir=rtl] h1 { line-height: 1.35; }
  [dir=rtl] .tile .v { unicode-bidi: plaintext; text-align: right; font-size: 27px; }
  [dir=rtl] .tile .k { text-transform: none; font-size: 12.5px; }
  [dir=rtl] .about { border-left: 0; border-right: 3px solid var(--border); padding-left: 0; padding-right: 12px; }
  [dir=rtl] .foot span::before { margin-right: 0; margin-left: 8px; }
  [dir=rtl] table.heat td, [dir=rtl] table.heat th { direction: ltr; }
  [dir=rtl] table.heat th:first-child, [dir=rtl] table.heat td.h0 { text-align: right; }
  [dir=rtl] #tip .row b { text-align: left; direction: ltr; }
  [dir=rtl] .chip { direction: ltr; }
"""


def gold(text, css, menu):
    text = once(text, "</style>", css + GOLD_CSS + "</style>", "the end of the gold report's style")
    text = once(text, '<main>\n  <p class="eyebrow" id="eyebrow"></p>', '<main>\n  <div id="langbar"></div>\n  <p class="eyebrow" id="eyebrow"></p>', "the top of the gold report")
    text = once(text, "<h1>Excess over gold by rotating between gold funds</h1>", '<h1 id="h1">Excess over gold by rotating between gold funds</h1>', "the gold report's heading")
    text = once(text, '<span class="lab">Broker fee discount</span>', '<span class="lab" id="lab_disc">Broker fee discount</span>', "the fee-discount label")
    text = once(text, "<h2>Month by month</h2>", '<h2 id="h2_month">Month by month</h2>', "the month-by-month heading")
    text = once(text, '<label>Highlight <select id="fund" aria-label="Fund"></select></label>',
                '<label><span id="lab_high">Highlight </span><select id="fund" aria-label="Fund"></select></label>', "the highlight label")
    # the script: the figures (const D = ...) stay; the code after them is the one that knows the five languages
    a = text.index("let A = D.scen[0], P = A.present;")
    if not text[:a].rstrip().endswith(";") or "const D = {" not in text[max(0, a - 200000):a]:
        raise SystemExit("the gold report's figures were not found where expected; nothing was written.")
    b = text.index("</script>", a)
    return text[:a] + part("gold_code.js").replace("/*PICKER*/", menu) + text[b:]


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_originals" / "reports"
    css, menu = picker()
    done = []
    for kind, names in ((cme, CME), (gold, GOLD)):
        for name, target in names.items():
            f = src / name
            if not f.exists():
                print(f"skipped {name}: not in {src}")
                continue
            done.append((OUT / target, kind(f.read_text(encoding="utf-8"), css, menu), f.stat().st_size))
    for path, text, before in done:          # nothing is written unless every report came through
        for attempt in range(8):             # Windows may report a large file busy for a moment (a scanner, a local server)
            try:
                path.write_text(text, encoding="utf-8", newline="\n")
                break
            except OSError:
                if attempt == 7:
                    raise
                time.sleep(0.5)
        print(f"{path.name}: {before / 1e6:.2f} MB -> {path.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
