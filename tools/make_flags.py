"""Draw the flags of the language menu into assets/img/flags/: one small PNG per language,
named by the language's code. Run it only when a language is added:  python tools/make_flags.py

The flags are drawn here, at one shape (3:2), and saved as PNG rather than SVG because
Samsung Internet's dark mode darkens SVG images. Needs Playwright with the system's Chrome, and Pillow.
"""
import io
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "flags"
W, H, SCALE = 60, 40, 1.6          # drawn on a 60 x 40 grid, saved at 96 x 64 (four times the 24 x 16 it is shown at)

FLAGS = {
    # English: the Union Flag
    "en": """
<clipPath id="t"><path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z"/></clipPath>
<rect width="60" height="40" fill="#012169"/>
<path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/>
<path d="M0,0 L60,40 M60,0 L0,40" clip-path="url(#t)" stroke="#C8102E" stroke-width="5.3"/>
<path d="M30,0 v40 M0,20 h60" stroke="#fff" stroke-width="13.3"/>
<path d="M30,0 v40 M0,20 h60" stroke="#C8102E" stroke-width="8"/>""",
    # Persian: the flag of Iran, with the emblem and the two written borders reduced to what this size can show
    "fa": """
<mask id="lo"><rect width="60" height="40" fill="#fff"/><circle cx="31.5" cy="18.3" r="5.3" fill="#000"/></mask>
<mask id="ro"><rect width="60" height="40" fill="#fff"/><circle cx="28.5" cy="18.3" r="5.3" fill="#000"/></mask>
<mask id="li"><rect width="60" height="40" fill="#fff"/><circle cx="30.9" cy="19" r="3.1" fill="#000"/></mask>
<mask id="ri"><rect width="60" height="40" fill="#fff"/><circle cx="29.1" cy="19" r="3.1" fill="#000"/></mask>
<rect width="60" height="13.4" fill="#239F40"/>
<rect y="13.4" width="60" height="13.2" fill="#fff"/>
<rect y="26.6" width="60" height="13.4" fill="#DA0000"/>
<path d="M0,12.7 h60 M0,27.3 h60" stroke="#fff" stroke-width=".8" stroke-dasharray="1.7 1.03"/>
<g fill="#DA0000">
  <circle cx="30" cy="20" r="5.5" mask="url(#lo)"/><circle cx="30" cy="20" r="5.5" mask="url(#ro)"/>
  <circle cx="30" cy="20.2" r="3.4" mask="url(#li)"/><circle cx="30" cy="20.2" r="3.4" mask="url(#ri)"/>
  <path d="M30,15.2 C30.75,17.6 30.75,22.6 30,25.6 C29.25,22.6 29.25,17.6 30,15.2Z"/>
</g>
<path d="M28.9,13.9 q.55,1 1.1,0 q.55,1 1.1,0" fill="none" stroke="#DA0000" stroke-width=".5" stroke-linecap="round"/>""",
    "fr": """
<rect width="20" height="40" fill="#0055A4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#EF4135"/>""",
    "de": """
<rect width="60" height="13.4" fill="#000"/><rect y="13.4" width="60" height="13.2" fill="#DD0000"/><rect y="26.6" width="60" height="13.4" fill="#FFCE00"/>""",
    # Turkish: the flag of Turkey, in its official proportions on the hoist side
    "tr": """
<rect width="60" height="40" fill="#E30A17"/>
<circle cx="21.25" cy="20" r="10" fill="#fff"/><circle cx="23.75" cy="20" r="8" fill="#E30A17"/>
<polygon fill="#fff" points="29.167,20 38.212,22.939 32.622,15.245 32.622,24.755 38.212,17.061"/>""",
}

PAGE = ('<!DOCTYPE html><html><body style="margin:0;background:#000">'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{pw}" height="{ph}" style="display:block">{body}</svg>'
        '</body></html>')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pw, ph = round(W * SCALE), round(H * SCALE)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        tab = browser.new_page(viewport={"width": pw, "height": ph}, device_scale_factor=1)
        for code, body in FLAGS.items():
            tab.set_content(PAGE.format(w=W, h=H, pw=pw, ph=ph, body=body), wait_until="load")
            shot = Image.open(io.BytesIO(tab.screenshot(type="png"))).convert("RGB")
            shot = shot.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
            shot.save(OUT / f"{code}.png", "PNG", optimize=True)
            print(f"{code}.png  {(OUT / (code + '.png')).stat().st_size} bytes")
        browser.close()


if __name__ == "__main__":
    main()
