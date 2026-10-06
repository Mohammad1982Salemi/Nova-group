"""Draw the link-preview images (1200x630) into assets/img/og/: one for the site and one per
project, each in Persian and in English. Run it after adding a project or changing a project's
og.fa / og.en line:  python tools/make_og.py

Needs Playwright for Python with the system's Chrome, and Pillow. The site itself does not.
"""
import base64
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import build  # noqa: E402  (PROJECTS and the page reader)

OUT = ROOT / "assets" / "img" / "og"


def inline(path, kind):
    """A file as a data: address, so the drawing page needs nothing from disk or network."""
    return f"data:{kind};base64," + base64.b64encode((ROOT / path).read_bytes()).decode("ascii")


FONT = {name: inline(f"assets/fonts/{name}.woff2", "font/woff2")
        for name in ("vazirmatn-var", "space-grotesk-latin-var", "inter-latin-var")}
MARK = inline("assets/img/nova-mark-512.png", "image/png")

SITE = {
    "fa": ("از جریان سفارش،", "تا جریان سرمایه.", "پژوهش و ساخت الگوریتم‌های معاملاتی بر پایه‌ی جریان سفارش بازار — از ۱۳۹۹."),
    "en": ("From order flow", "to capital flow.", "Researching and building trading algorithms from market order flow — since 2020."),
}
BRAND = {"fa": "<b>نوا</b> گروپ", "en": "<b>NOVA</b> GROUP"}
KICKER = {"fa": "پروژه", "en": "PROJECT"}

PAGE = """<!DOCTYPE html><html lang="{lang}" dir="{dir}"><head><meta charset="utf-8"><style>
@font-face {{ font-family: V; src: url({v}); font-weight: 100 900; }}
@font-face {{ font-family: G; src: url({g}); font-weight: 300 700; }}
@font-face {{ font-family: I; src: url({i}); font-weight: 100 900; }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ width: 1200px; height: 630px; overflow: hidden; position: relative; background: #05080e; color: #e9eef6; }}
html[lang="fa"] body {{ font-family: V, sans-serif; }}
html[lang="en"] body {{ font-family: I, sans-serif; }}
.wash {{ position: absolute; inset: 0; background:
  radial-gradient(900px 520px at {far} -10%, rgba(37,99,235,.46), transparent 62%),
  radial-gradient(700px 460px at {near} 108%, rgba(56,213,245,.15), transparent 60%); }}
.grid {{ position: absolute; inset: 0;
  background-image: linear-gradient(rgba(148,170,205,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148,170,205,.055) 1px, transparent 1px);
  background-size: 72px 72px; -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 25%, #000 10%, transparent 78%); }}
.in {{ position: absolute; inset: 0; padding: 70px 86px 66px; display: flex; flex-direction: column; }}
.brand {{ display: flex; align-items: center; gap: 24px; font-size: 46px; color: #b9c8de; }}
.brand img {{ width: 92px; height: 92px; filter: drop-shadow(0 0 26px rgba(63,155,255,.6)); }}
.brand b {{ color: #fff; font-weight: 800; }}
html[lang="en"] .brand {{ font-family: G; font-size: 40px; letter-spacing: .2em; }}
.kicker {{ margin-top: auto; font-size: 24px; font-weight: 600; color: #38d5f5; }}
html[lang="en"] .kicker {{ font-family: G; letter-spacing: .22em; }}
h1 {{ font-weight: 700; font-size: {size}px; line-height: 1.34; margin-top: {gap}; }}
html[lang="en"] h1 {{ font-family: G; letter-spacing: -.03em; line-height: 1.14; }}
h1 em {{ font-style: normal; background: linear-gradient(115deg, #5b9bff 0%, #6fb6ff 45%, #38d5f5 100%); -webkit-background-clip: text; color: transparent; }}
p {{ margin-top: 20px; max-width: 1010px; font-size: 29px; line-height: 1.66; color: #98a6ba; }}
html[lang="en"] p {{ line-height: 1.46; }}
.foot {{ display: flex; align-items: center; justify-content: space-between; margin-top: 32px; direction: ltr; }}
.foot span {{ font-family: G; font-size: 26px; letter-spacing: .05em; color: #8cbcff; }}
.foot i {{ width: 180px; height: 3px; border-radius: 3px; background: linear-gradient(90deg, #3b82f6, #38d5f5); }}
html[dir="rtl"] .foot {{ flex-direction: row-reverse; }}
</style></head><body><div class="wash"></div><div class="grid"></div><div class="in">
<div class="brand"><img src="{mark}" alt="">{brand}</div>
{kicker}<h1>{title}</h1><p>{text}</p>
<div class="foot"><span>novacapital.fund</span><i></i></div>
</div></body></html>"""


def page(lang, title, text, kicker, size):
    rtl = lang == "fa"
    return PAGE.format(lang=lang, dir="rtl" if rtl else "ltr", mark=MARK, brand=BRAND[lang],
                       v=FONT["vazirmatn-var"], g=FONT["space-grotesk-latin-var"], i=FONT["inter-latin-var"],
                       far="8%" if rtl else "92%", near="104%" if rtl else "-4%",
                       kicker=f'<div class="kicker">{kicker}</div>' if kicker else "",
                       gap="6px" if kicker else "auto", title=title, text=text, size=size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = []
    for lang in build.LANGS:
        a, b, text = SITE[lang]
        jobs.append((f"nova-{lang}", page(lang, f"{a}<br><em>{b}</em>", text, "", 84)))
        for i, (slug, fa, en) in enumerate(build.PROJECTS):
            meta, _ = build.read(build.PAGES / "projects" / f"{slug}.html")
            jobs.append((f"{slug}-{lang}", page(lang, fa if lang == "fa" else en, meta[f"og.{lang}"], KICKER[lang], 82)))
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        tab = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        for name, html in jobs:
            tab.set_content(html, wait_until="load")
            tab.evaluate("document.fonts.ready.then(() => Promise.all(Array.from(document.images, im => im.decode())))")
            shot = Image.open(io.BytesIO(tab.screenshot(type="png"))).convert("RGB")
            shot.save(OUT / f"{name}.jpg", "JPEG", quality=88, optimize=True, progressive=True)
            print(f"{name}.jpg  {(OUT / (name + '.jpg')).stat().st_size / 1024:.0f} KB")
        browser.close()


if __name__ == "__main__":
    main()
