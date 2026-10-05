# Nova Group · نوا گروپ

وب‌سایت معرفی نوا گروپ — پژوهش الگوریتمی از ۱۳۹۹ روی جریان سفارش‌ها بازار.
دوزبانه (فارسی / انگلیسی)، چندصفحه‌ای، بدون سرور.

Website for Nova Group — algorithmic research into market order flow since 2020.
Bilingual (Persian / English), multi-page, fully static.

**Live:** https://novacapital.fund/

---

## صفحه‌ها · Pages

| صفحه | فایل | محتوا |
| --- | --- | --- |
| خانه | `index.html` | تز مرکزی، روش در یک نگاه، دو مسیر، پروژه‌ی شاخص |
| درباره ما | `about.html` | ایده، روش سه‌لایه (کامل)، دو مسیر، تیم |
| پروژه‌ها | `projects.html` | فهرست پروژه‌ها |
| مارکت‌میکر CME | `projects/cme-mm.html` | صفحه‌ی اختصاصی پروژه |
| فست اسکلپ | `projects/fast-scalp.html` | صفحه‌ی اختصاصی پروژه |
| بلاک‌ترید | `projects/blocktrade.html` | صفحه‌ی اختصاصی پروژه |
| آربیتراژ صندوق‌های طلا | `projects/gold-etf.html` | صفحه‌ی اختصاصی پروژه |
| دیفای ال‌پی | `projects/defi-lp.html` | صفحه‌ی اختصاصی پروژه |
| مارکت‌میکر کریپتو | `projects/crypto-mm.html` | صفحه‌ی اختصاصی پروژه |
| TSETMC | `projects/tsetmc.html` | صفحه‌ی اختصاصی پروژه، با فهرست کناری |
| تماس | `contact.html` | ایمیل گروه و اعضا |

## ساختار · How it is put together

صفحه‌های بالا **خروجی** هستند. منبع آن‌ها زیر `src/` است و با `build.py` ساخته می‌شوند، تا نوار بالا و فوتر فقط یک‌جا نوشته شده باشند.

The pages above are **generated**. Their source lives under `src/` and `build.py`
assembles them, so the navbar and footer are written once.

```
src/partials/   head, nav, footer + blocks shared by several pages
src/pages/      one file per page; folders become URL folders
build.py        src -> the .html files at the repo root
assets/         css, js, images (not generated — edit directly)
```

**هیچ‌وقت فایل‌های `.html` ریشه را مستقیم ویرایش نکنید** — با ساخت بعدی بازنویسی می‌شوند.
**Never edit the root `.html` files by hand** — the next build overwrites them.

```bash
python build.py
```

### توکن‌ها · Tokens

| Token | Meaning |
| --- | --- |
| `@@NAME@@` | contents of `src/partials/name.html` |
| `@@R@@` | path back to the site root (`""` or `"../"`) |
| `@@V@@` | `VERSION` in `build.py`, appended to the CSS / JS URLs |
| `@@A:key@@` | marks the active nav link; the page's first line is `<!-- section: key -->` |

### کش مرورگر · Cache busting

هر بار `assets/css/style.css` یا `assets/js/main.js` عوض شد، `VERSION` را در `build.py` یک واحد بالا ببرید و دوباره بسازید. بدون این کار، مرورگرها تا چند دقیقه نسخه‌ی قدیمی را نشان می‌دهند.

Bump `VERSION` in `build.py` whenever `style.css` or `main.js` changes, then rebuild.

## افزودن پروژه · Adding a project

1. `src/pages/projects/tsetmc.html` را کپی کنید (مثلاً `crypto.html`) و متن را عوض کنید. هر بخش یک `<section class="cs-section" id="…">` است و فهرست کناری (`.toc`) به همان `id`ها لینک می‌دهد.
2. کارت پروژه را از روی `src/partials/proj_tsetmc.html` بسازید و در `src/pages/projects.html` اضافه کنید.
3. `python build.py`

بلوک‌های آماده برای متن پروژه: `detail-lead` (پاراگراف آغازین درشت)، `steps` (مراحل)، `points` (فهرست تمایزها)، `phases` (مسیر زمانی؛ `is-done` / `is-now`).

## متن دوزبانه · Bilingual text

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

مقدارهای صرفاً لاتین (مثل `C#`) داخل `<bdi>` بروند تا در متن راست‌چین ترتیبشان به هم نخورد.
Wrap Latin-only values such as `C#` in `<bdi>` so right-to-left text does not reorder them.

## لحن — عمدی است · Tone is deliberate

سایت **هیچ ادعایی که اثبات نشده مطرح نمی‌کند**:

- هیچ عدد عملکردی (بازده، شارپ، افت سرمایه) در آن نیست
- پروژه‌ها «در حال توسعه» هستند، نه «فعال»
- تصویر دفتر سفارش در صفحه‌ی خانه نمادین است و زیرش همین نوشته شده
- کادر پایانی صفحه‌ی خانه و فوتر صریح می‌گویند که هیچ استراتژی‌ای به اجرای واقعی نرسیده و سایت دعوت به سرمایه‌گذاری نیست

The site makes **no claim it cannot back up**: no performance figures, projects marked
in progress, the home-page order book labelled as illustrative, and a footer note that
this is not an offer to invest. Update those statements if and when that changes.

## وضعیت محتوا · Content status

- نام و سمت اعضا واقعی است. فقط محمد سالمی عکس دارد؛ دو نفر دیگر با حرف اول نام نمایش داده می‌شوند.
- تماس: info@novacapital.fund و ایمیل هر عضو — تلفن عمداً خالی مانده است.
- از پروژه‌ها فقط TSETMC نوشته شده؛ بقیه تا وقتی متنشان آماده نشده، فهرست نمی‌شوند.

## اجرای محلی و انتشار · Local preview and deploy

```bash
python -m http.server 8000
```

```bash
python build.py
git add -A
git commit -m "Update content"
git push
```

GitHub Pages از شاخه‌ی `main` (ریشه) سرو می‌شود و تغییرات حدود یک دقیقه بعد زنده می‌شوند.
