"""The equivalence table as a workbook: every unit, all languages side by side, with a verdict.

    python tools/review/workbook.py <lang> <artifact> <sheet-title> <out.xlsx>

Reads _originals/review/units.json (written by units.py) and the fixes file for this pass
(_originals/review/<lang>_<artifact>_fixes.json, optional), and writes one sheet: the
location, the Persian, the English, the target language, and what was decided about it.
The point is that a reader who knows the language can confirm the whole page in one pass
without reading either the site or the code.
"""
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[2]
REVIEW = ROOT / "_originals" / "review"
FIXED_FILL = PatternFill("solid", fgColor="FFF6DA")

HEAD = ["#", "جای دقیق", "فارسی", "English", "زبان هدف", "وضعیت", "یادداشت"]
WIDTH = [5, 34, 52, 52, 52, 14, 60]


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def main():
    lang, artifact, title, out_path = sys.argv[1:5]
    source = Path(sys.argv[5]) if len(sys.argv) > 5 else REVIEW / "units.json"
    units = json.loads(source.read_text(encoding="utf-8"))
    fixes_path = REVIEW / f"{lang}_{artifact}_fixes.json"
    fixes = {norm(f["en"]): f["why"] for f in json.loads(fixes_path.read_text(encoding="utf-8"))} if fixes_path.exists() else {}

    book = Workbook()
    sheet = book.active
    sheet.title = title
    sheet.sheet_view.rightToLeft = True

    for col, (name, width) in enumerate(zip(HEAD, WIDTH), start=1):
        cell = sheet.cell(row=1, column=col, value=name)
        cell.font = Font(name="Arial", bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1F3864")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        sheet.column_dimensions[get_column_letter(col)].width = width
    sheet.row_dimensions[1].height = 22

    for number, unit in enumerate(units, start=1):
        key = norm(unit["en"])
        where = (unit.get("where") or [f"{unit.get('src')}:{unit.get('line')}"])[0]
        fixed = key in fixes
        row = [number, where, unit.get("fa") or "", unit["en"], unit.get(lang) or "",
               "اصلاح شد" if fixed else "کنترل شد", fixes.get(key, "")]
        for col, value in enumerate(row, start=1):
            cell = sheet.cell(row=number + 1, column=col, value=value)
            cell.font = Font(name="Tahoma" if col == 3 else "Arial", size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True,
                                       horizontal="center" if col in (1, 6) else "left")
            if fixed:
                cell.fill = FIXED_FILL

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = f"A1:{get_column_letter(len(HEAD))}{len(units) + 1}"

    note = book.create_sheet("راهنما")
    note.sheet_view.rightToLeft = True
    lines = [
        ("راهنمای این جدول", True),
        ("", False),
        (f"این جدول همهٔ {len(units)} واحد ترجمهٔ {title} را کنار هم می‌گذارد: جای دقیق در متن،", False),
        ("متن فارسی (زبان مرجع)، متن انگلیسی، و متن زبان هدف. ستون «وضعیت» می‌گوید آن سطر اصلاح شده", False),
        ("یا کنترل شده و بی‌ایراد بوده، و ستون «یادداشت» دلیل اصلاح را می‌گوید.", False),
        ("سطرهای زردرنگ اصلاح شده‌اند؛ بقیه بی‌تغییر ماندند.", False),
        ("", False),
        ("برای کسی که زبان می‌داند:", False),
        ("کافی است ستون زبان هدف را بخواند و با ستون انگلیسی بسنجد؛ اگر جایی معنا یکی نبود یا اصطلاح", False),
        ("غلط بود، همان سطر را علامت بزند. لازم نیست سایت یا کد را باز کند.", False),
        ("", False),
        ("تاریخ: ۲۰ مهر ۱۴۰۵ / 2026-10-12", False),
    ]
    for i, (text, bold) in enumerate(lines, start=1):
        cell = note.cell(row=i, column=1, value=text)
        cell.font = Font(name="Tahoma" if bold else "Arial", size=12 if bold else 10, bold=bold)
        cell.alignment = Alignment(horizontal="right")
    note.column_dimensions["A"].width = 110

    book.save(out_path)
    fixed_count = sum(1 for unit in units if norm(unit["en"]) in fixes)
    print(f"{out_path}: {len(units)} rows, {fixed_count} of them revised")


if __name__ == "__main__":
    main()
