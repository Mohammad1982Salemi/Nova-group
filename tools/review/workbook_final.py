"""The review workbook, built from the text as it now stands.

    python tools/review/workbook_final.py <lang> <out.xlsx>

Every unit is shown with the Persian reference, the English, and the language's own text as
published. A unit is marked when it differs from the state before the review began (kept in
_originals/review/units-before.json and report-units-before.json), and the reason comes from
the fix list that changed it where one exists.
"""
import json
import pathlib
import re
import subprocess
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[2]
REVIEW = ROOT / "_originals" / "review"
TAG = "v60-before-language-review-2026-10-12"
HEAD = ["#", "جای دقیق", "فارسی", "English", "زبان هدف", "وضعیت", "یادداشت"]
WIDTH = [5, 34, 52, 52, 52, 14, 62]
FIXED = PatternFill("solid", fgColor="FFF6DA")


def norm(text):
    return re.sub(r"\s+", " ", text or "").strip()


def reasons(lang, surface):
    """The reasons recorded by the review, for whichever units they touched."""
    out = {}
    for path in sorted(REVIEW.glob(f"{lang}_{surface}_fixes*.json")) + sorted(REVIEW.glob(f"{lang}_cme_fixes*.json")):
        if not path.exists():
            continue
        try:
            fixes = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            continue
        for fix in fixes:
            if "en" in fix:
                out[norm(fix["en"])] = fix["why"]
    return out


def sheet(book, title, before, after, lang, why, key_of):
    page = book.create_sheet(title)
    page.sheet_view.rightToLeft = True
    for col, (name, width) in enumerate(zip(HEAD, WIDTH), start=1):
        cell = page.cell(row=1, column=col, value=name)
        cell.font = Font(name="Arial", bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1F3864")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        page.column_dimensions[get_column_letter(col)].width = width
    page.row_dimensions[1].height = 22

    changed = 0
    for number, unit in enumerate(after, start=1):
        key = key_of(unit)
        was = before.get(key)
        now = unit.get(lang)
        fixed = was is not None and now is not None and was != now
        changed += fixed
        row = [number, (unit.get("where") or [f"{unit.get('src')}:{unit.get('line')}"])[0],
               unit.get("fa") or "", unit.get("en") or "", now or "",
               "اصلاح شد" if fixed else "کنترل شد", why.get(key, "اصلاح در پاس بازبینی") if fixed else ""]
        for col, value in enumerate(row, start=1):
            cell = page.cell(row=number + 1, column=col, value=value)
            cell.font = Font(name="Tahoma" if col == 3 else "Arial", size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True,
                                       horizontal="center" if col in (1, 6) else "left")
            if fixed:
                cell.fill = FIXED
    page.freeze_panes = "A2"
    page.auto_filter.ref = f"A1:{get_column_letter(len(HEAD))}{len(after) + 1}"
    return changed


def before(lang, kind):
    """The two catalogues as they stood before the review began, from the tag."""
    out = {}
    for name in (["src/i18n/%s.json" % lang] if kind == "site" else ["tools/report_i18n/cme.%s.json" % lang]):
        text = subprocess.check_output(["git", "show", f"{TAG}:{name}"], cwd=ROOT).decode("utf-8")
        data = json.loads(text)
        if kind == "site":
            out.update(data)
        else:
            out.update(data["dict"])
    return out


def main():
    lang, out = sys.argv[1], sys.argv[2]
    site = json.loads((REVIEW / "units.json").read_text(encoding="utf-8"))
    reports = json.loads((REVIEW / "report-units.json").read_text(encoding="utf-8"))
    site_was = {norm(k): v for k, v in before(lang, "site").items()}
    report_was = {norm(k): v for k, v in before(lang, "cme").items()}

    def site_key(unit):
        return norm(unit.get("en"))

    def report_key(unit):
        return norm(unit.get("en")) if unit["kind"] == "dict" else f"{unit['kind']}[{unit['index']}]"

    book = Workbook()
    book.remove(book.active)
    a = sheet(book, f"سایت {lang}", site_was, site, lang, reasons(lang, "site"), site_key)
    b = sheet(book, f"گزارش‌ها {lang}", report_was, reports, lang, reasons(lang, "cme"), report_key)

    note = book.create_sheet("راهنما")
    note.sheet_view.rightToLeft = True
    lines = [
        ("راهنمای این جدول", True), ("", False),
        (f"این فایل متن سایت و گزارش‌ها را در زبان هدف، کنار متن فارسی (زبان مرجع) و انگلیسی می‌گذارد:", False),
        (f"{len(site)} واحد سایت و {len(reports)} واحد گزارش. ستون «وضعیت» می‌گوید آن سطر نسبت به پیش از", False),
        ("بازبینی تغییر کرده یا نه، و «یادداشت» دلیلش را می‌گوید. سطرهای زرد تغییر کرده‌اند.", False),
        (f"در این زبان: {a} سطر سایت و {b} سطر گزارش اصلاح شده است.", False),
        ("", False),
        ("برای کسی که زبان می‌داند: فقط ستون زبان هدف را با ستون انگلیسی بسنجد. اگر جایی معنا یکی نبود", False),
        ("یا اصطلاح غلط بود، همان سطر را علامت بزند؛ نیازی به باز کردن سایت یا کد نیست.", False),
        ("", False),
        ("تاریخ: ۲۰ مهر ۱۴۰۵ / 2026-10-12", False),
    ]
    for i, (text, bold) in enumerate(lines, start=1):
        cell = note.cell(row=i, column=1, value=text)
        cell.font = Font(name="Tahoma" if bold else "Arial", size=12 if bold else 10, bold=bold)
        cell.alignment = Alignment(horizontal="right")
    note.column_dimensions["A"].width = 112

    book.save(out)
    print(f"{out}: {a} site rows and {b} report rows changed")


if __name__ == "__main__":
    main()
