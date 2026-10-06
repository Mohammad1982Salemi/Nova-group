# Nova Group · نوا گروپ

وب‌سایت معرفی نوا گروپ — پژوهش الگوریتمی از ۱۳۹۹ روی جریان سفارش‌های بازار.
دوزبانه (فارسی / انگلیسی)، چندصفحه‌ای، بدون سرور.

Website for Nova Group — algorithmic research into market order flow since 2020.
Bilingual (Persian / English), multi-page, fully static.

**Live:** https://novacapital.fund/ (English) · https://novacapital.fund/fa/ (فارسی)

---

## صفحه‌ها · Pages

هر صفحه دو نشانی دارد: انگلیسی در ریشه و فارسی زیر `/fa/`.
Every page has two addresses: English at the root and Persian under `/fa/`.

| صفحه | فایل | محتوا |
| --- | --- | --- |
| خانه | `index.html` | تز مرکزی، روش در یک نگاه، دو مسیر، کارت پروژه‌ها |
| درباره ما | `about.html` | ایده، روش سه‌لایه (کامل)، دو مسیر، تیم |
| پروژه‌ها | `projects.html` | فهرست پروژه‌ها |
| مارکت‌میکر CME | `projects/cme-mm.html` | صفحه‌ی پروژه، با دو گزارش شبیه‌ساز |
| فست اسکلپ | `projects/fast-scalp.html` | صفحه‌ی پروژه، با دو گزارش شبیه‌ساز |
| بلاک‌ترید | `projects/blocktrade.html` | صفحه‌ی پروژه |
| TSETMC | `projects/tsetmc.html` | صفحه‌ی پروژه |
| آربیتراژ صندوق‌های طلا | `projects/gold-etf.html` | صفحه‌ی پروژه، با یک گزارش شبیه‌ساز |
| دیفای ال‌پی | `projects/defi-lp.html` | صفحه‌ی پروژه |
| مارکت‌میکر کریپتو | `projects/crypto-mm.html` | صفحه‌ی پروژه |
| تماس | `contact.html` | ایمیل گروه و اعضا |
| پیدا نشد | `404.html` | یک فایل برای هر دو زبان |

## ساختار · How it is put together

صفحه‌های بالا و پوشه‌های `fa/` و `en/` **خروجی** هستند. منبع آن‌ها زیر `src/` است و `build.py` از هر منبع دو صفحه می‌سازد: انگلیسی در ریشه و فارسی زیر `fa/`. پوشه‌ی `en/` فقط نشانی‌های قدیمی را به ریشه می‌فرستد.

The pages above and the `fa/` and `en/` folders are **generated**. Their source lives under `src/`,
and `build.py` writes each source twice: English at the root, Persian under `fa/`. The `en/`
folder only passes old addresses on to the root. `MAIN` in `build.py` names the root language.

```
src/partials/   head, nav, footer + blocks shared by several pages
src/pages/      one file per page; folders become URL folders
build.py        src -> the .html files at the repo root and under fa/, plus sitemap.xml
assets/         css, js, fonts, images, reports (not generated — edit directly)
tools/          make_og.py draws the link-preview images
```

**هیچ‌وقت فایل‌های `.html` ریشه، `fa/` یا `en/` را مستقیم ویرایش نکنید** — با ساخت بعدی بازنویسی می‌شوند.
**Never edit the generated `.html` files by hand** — the next build overwrites them.

```bash
python build.py
```

### سرِ هر صفحه · The top of a page source

```html
<!-- section: projects -->
<!-- title.fa: … -->      <!-- title.en: … -->
<!-- desc.fa: … -->       <!-- desc.en: … -->
<!-- og.fa: … -->         <!-- og.en: … -->
<body>
```

`build.py` کل `<head>` را از همین چند خط می‌سازد: عنوان، توضیح، نشانی اصلی، پیوند به زبان دیگر (`hreflang`) و تصویر پیش‌نمایش.
The build writes the whole `<head>` from these lines, once per language.

### توکن‌ها · Tokens

| Token | Meaning |
| --- | --- |
| `@@NAME@@` | contents of `src/partials/name.html` |
| `@@R@@` | path back to the language's own root (`""` or `"../"`), for links between pages |
| `@@R@@assets/` | always the one shared `/assets/` folder |
| `@@V@@` | `VERSION` in `build.py`, appended to the CSS / JS URLs |
| `@@A:key@@` | marks the active nav link; the page's first line is `<!-- section: key -->` |
| `@@L:فارسی\|\|English@@` | the text for the page's language, for attributes such as `alt` and `aria-label` |
| `@@PROJNAV@@` | previous / next project, from the `PROJECTS` list in `build.py` |
| `@@LANGBTN@@` | the link to the same page in the other language |

### متن دوزبانه · Bilingual text

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

هر دو زبان در منبع کنار هم می‌مانند؛ ساخت، زبانِ هر صفحه را نگه می‌دارد و دیگری را برمی‌دارد.
Both languages sit side by side in the source; the build keeps the one that belongs to the page.

مقدارهای صرفاً لاتین (مثل `C#`) داخل `<bdi>` بروند تا در متن راست‌چین ترتیبشان به هم نخورد.
Wrap Latin-only values such as `C#` in `<bdi>` so right-to-left text does not reorder them.

### زبان بازدیدکننده · Which language a visitor sees

- همه در بازدید اول سایت را **انگلیسی** می‌بینند.
- کسی که با دکمه‌ی زبان فارسی را انتخاب کند، از آن به بعد از هر نشانی انگلیسی به همان صفحه زیر `/fa/` برده می‌شود.
- نشانی `/fa/…` همیشه فارسی است.
- `?lang=fa` یا `?lang=en` در نشانی، انتخاب را صریح می‌کند و به خاطر می‌سپارد.

Everyone meets the site in English. A reader who picks Persian with the language button is
taken from any English address to the same page under `/fa/` from then on. A `/fa/…` address
is always Persian, and `?lang=fa|en` makes the choice explicit and remembers it.

### کش مرورگر · Cache busting

هر بار `assets/css/style.css` یا `assets/js/main.js` عوض شد، `VERSION` را در `build.py` یک واحد بالا ببرید و دوباره بسازید.
Bump `VERSION` in `build.py` whenever `style.css` or `main.js` changes, then rebuild.

### فونت‌ها · Fonts

Vazirmatn، Inter و Space Grotesk از `assets/fonts/` سرو می‌شوند (هر کدام یک فایل متغیر، با مجوز SIL OFL در همان پوشه). سایت به هیچ سرور بیرونی وابسته نیست.
The three families are served from `assets/fonts/` (one variable file each, SIL OFL licences alongside). The site needs no third-party server.

## افزودن پروژه · Adding a project

1. `src/pages/projects/tsetmc.html` را کپی کنید و متن و خط‌های بالای صفحه را عوض کنید. هر بخش یک `<section class="cs-section" id="…">` است و `.toc` به همان `id`ها لینک می‌دهد.
2. کارت پروژه را از روی `src/partials/proj_tsetmc.html` بسازید و در `src/pages/index.html` و `src/pages/projects.html` اضافه کنید.
3. پروژه را به فهرست `PROJECTS` در `build.py` اضافه کنید (ترتیب کارت‌ها و «پروژه‌ی قبلی / بعدی»).
4. `python build.py` و سپس `python tools/make_og.py` برای تصویر پیش‌نمایش لینک (به Playwright و Pillow نیاز دارد).

بلوک‌های آماده برای متن پروژه: `detail-lead` (پاراگراف آغازین درشت)، `steps` (مراحل)، `points` (فهرست تمایزها)، `phases` (مسیر زمانی؛ `is-done` / `is-now`)، `reports` (گزارش شبیه‌ساز).

## لحن — عمدی است · Tone is deliberate

سایت **هیچ ادعایی که اثبات نشده مطرح نمی‌کند**:

- هیچ راهبردی «فعال» یا «زنده» معرفی نشده است؛ وضعیت هر پروژه همان است که هست.
- عددهای عملکردی فقط درون گزارش‌های شبیه‌ساز هستند، و زیر هر گزارش نوشته شده که نتیجه‌ی شبیه‌سازی است، نه معامله‌ی واقعی.
- دفتر سفارش‌های صفحه‌ی خانه شبیه‌سازی‌اند و همین روی آن‌ها نوشته شده است.

The site makes **no claim it cannot back up**: nothing is presented as live, performance
figures appear only inside the simulator reports and are labelled as simulation, and the
order books on the home page are marked as simulated.

## وضعیت محتوا · Content status

- نام و سمت اعضا واقعی است. دو عضو عکس دارند؛ عضو سوم با حرف اول نام نمایش داده می‌شود.
- تماس: info@novacapital.fund و ایمیل هر عضو — تلفن عمداً خالی مانده است.
- متن هر پروژه را خود گروه داده است؛ پروژه‌ی تازه فقط وقتی اضافه می‌شود که متنش برسد.

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
