# Nova Group · نوا گروپ

وب‌سایت معرفی نوا گروپ — پژوهش الگوریتمی از ۱۳۹۹ روی جریان سفارش‌های بازار.
پنج‌زبانه (انگلیسی، فرانسوی، آلمانی، ترکی، فارسی)، چندصفحه‌ای، بدون سرور.

Website for Nova Group — algorithmic research into market order flow since 2020.
Five languages (English, French, German, Turkish, Persian), multi-page, fully static.

**Live:** https://novacapital.fund/ (English) · [/fr/](https://novacapital.fund/fr/) (Français) · [/de/](https://novacapital.fund/de/) (Deutsch) · [/tr/](https://novacapital.fund/tr/) (Türkçe) · [/fa/](https://novacapital.fund/fa/) (فارسی)

---

## صفحه‌ها · Pages

هر صفحه پنج نشانی دارد: انگلیسی در ریشه، و هر زبان دیگر زیر کد خودش (`/fa/`، `/fr/`، `/de/`، `/tr/`).
Every page has five addresses: English at the root, and each other language under its own code (`/fa/`, `/fr/`, `/de/`, `/tr/`).

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
| پیدا نشد | `404.html` | یک فایل برای هر پنج زبان |

## ساختار · How it is put together

صفحه‌های بالا و پوشه‌های `fa/`، `fr/`، `de/`، `tr/` و `en/` **خروجی** هستند. منبع آن‌ها زیر `src/` است و `build.py` از هر منبع پنج صفحه می‌سازد: انگلیسی در ریشه و هر زبان دیگر زیر کد خودش. پوشه‌ی `en/` فقط نشانی‌های قدیمی را به ریشه می‌فرستد.

The pages above and the `fa/`, `fr/`, `de/`, `tr/` and `en/` folders are **generated**. Their source
lives under `src/`, and `build.py` writes each source five times: English at the root, every other
language under its code. The `en/` folder only passes old addresses on to the root. `LANGS` and
`MAIN` in `build.py` name the languages and the one at the root.

```
src/partials/   head, nav, footer + blocks shared by several pages
src/pages/      one file per page; folders become URL folders
src/i18n/       fr.json, de.json, tr.json: each English text and its translation
build.py        src -> the .html files at the repo root and under fa/ fr/ de/ tr/, plus sitemap.xml
assets/         css, js, fonts, images, reports (not generated — edit directly)
tools/          make_og.py draws the link-preview images, make_flags.py the flags of the language menu
```

**هیچ‌وقت فایل‌های `.html` ریشه، `fa/`، `fr/`، `de/`، `tr/` یا `en/` را مستقیم ویرایش نکنید** — با ساخت بعدی بازنویسی می‌شوند.
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

`build.py` کل `<head>` را از همین چند خط می‌سازد: عنوان، توضیح، نشانی اصلی، پیوند به زبان‌های دیگر (`hreflang`) و تصویر پیش‌نمایش. برای فرانسوی، آلمانی و ترکی، ترجمه‌ی خط‌های انگلیسی از `src/i18n/` می‌آید.
The build writes the whole `<head>` from these lines, once per language. French, German and Turkish take
the translation of the English lines from `src/i18n/`.

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
| `@@LANGBTN@@` | the language menu: the same page in every language, each with its flag and its own name |

### متن هر زبان · The text of each language

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

فارسی و انگلیسی در منبع کنار هم نوشته می‌شوند؛ ساخت، زبانِ هر صفحه را نگه می‌دارد و دیگری را برمی‌دارد.
Persian and English are written side by side in the source; the build keeps the one that belongs to the page.

فرانسوی، آلمانی و ترکی ترجمه‌ی متن انگلیسی‌اند. هر کدام یک فهرست دارد، `src/i18n/<کد>.json`، که هر متن انگلیسی را به ترجمه‌اش می‌رساند:
French, German and Turkish are translations of the English. Each has a catalogue, `src/i18n/<code>.json`,
mapping every English text (the inside of a `t-en` element, an `@@L:…||English@@` text, a `title.en` line …)
to its translation:

```json
{ "Read the project": "Lire le projet" }
```

**هر تغییر متن باید در هر پنج زبان انجام شود.** اگر متن انگلیسی عوض یا اضافه شود و ترجمه‌اش در یکی از این سه فهرست نباشد، `build.py` می‌ایستد و متن‌های بی‌ترجمه را در `src/i18n/_missing.json` می‌نویسد؛ پس هیچ صفحه‌ای عقب نمی‌ماند.
**Every change of text is made in all five languages.** When an English text is changed or added and one of the
three catalogues has no translation for it, `build.py` stops and lists the untranslated texts in
`src/i18n/_missing.json`, so no page can fall behind. (`NOVA_DRAFT=1 python build.py` builds a draft that
shows the English in those places.) A translation keeps the tags of its English text (`<em>`, `<a href=…>`),
and writes figures the way its language does (`1,148` · `1 148` · `1.148`).

چند جمله‌ای که خود اسکریپت می‌نویسد (پیام‌های دفتر سفارش صفحه‌ی خانه، برچسب‌های نمایشگر تصویر) برای هر پنج زبان در `assets/js/main.js` هستند.
The few sentences the script itself writes (the order ticket's messages, the image viewer's labels) are in
`assets/js/main.js`, once per language.

مقدارهای صرفاً لاتین (مثل `C#`) داخل `<bdi>` بروند تا در متن راست‌چین ترتیبشان به هم نخورد.
Wrap Latin-only values such as `C#` in `<bdi>` so right-to-left text does not reorder them.

### زبان بازدیدکننده · Which language a visitor sees

- همه در بازدید اول سایت را **انگلیسی** می‌بینند؛ زبان مرورگر یا کشور بازدیدکننده هیچ اثری ندارد.
- کسی که در منوی زبان (پرچم + نام کامل هر زبان) زبانی را انتخاب کند، از آن به بعد از هر نشانی انگلیسی به همان صفحه زیر کد آن زبان برده می‌شود.
- نشانی `/fa/…`، `/fr/…`، `/de/…` یا `/tr/…` همیشه به همان زبان است.
- `?lang=fa|fr|de|tr|en` در نشانی، انتخاب را صریح می‌کند و به خاطر می‌سپارد.

Everyone meets the site in English; the browser's language and the visitor's country play no part.
A reader who picks a language in the language menu (a flag and the full name of each language) is
taken from any English address to the same page under that language's code from then on. An address
under `/fa/`, `/fr/`, `/de/` or `/tr/` is always in that language, and `?lang=fa|fr|de|tr|en` makes
the choice explicit and remembers it.

### کش مرورگر · Cache busting

هر بار `assets/css/style.css` یا `assets/js/main.js` عوض شد، `VERSION` را در `build.py` یک واحد بالا ببرید و دوباره بسازید.
Bump `VERSION` in `build.py` whenever `style.css` or `main.js` changes, then rebuild.

### فونت‌ها · Fonts

Vazirmatn، Inter و Space Grotesk از `assets/fonts/` سرو می‌شوند (فایل‌های متغیر، با مجوز SIL OFL در همان پوشه). دو فونت لاتین دو بخش دارند: `latin` برای همه‌ی صفحه‌های لاتین، و `latin-ext` برای حروفی مثل ş، ğ و İ که فقط صفحه‌های دارای این حروف (ترکی) بارش می‌کنند. سایت به هیچ سرور بیرونی وابسته نیست.
The three families are served from `assets/fonts/` (variable files, SIL OFL licences alongside). The two Latin
families come in two parts: `latin` for every Latin-script page, and `latin-ext` for letters such as ş, ğ and İ,
fetched only by pages that use them (Turkish). The site needs no third-party server.

## افزودن پروژه · Adding a project

1. `src/pages/projects/tsetmc.html` را کپی کنید و متن و خط‌های بالای صفحه را عوض کنید. هر بخش یک `<section class="cs-section" id="…">` است و `.toc` به همان `id`ها لینک می‌دهد.
2. کارت پروژه را از روی `src/partials/proj_tsetmc.html` بسازید و در `src/pages/index.html` و `src/pages/projects.html` اضافه کنید.
3. پروژه را به فهرست `PROJECTS` در `build.py` اضافه کنید (ترتیب کارت‌ها و «پروژه‌ی قبلی / بعدی»).
4. ترجمه‌ی متن‌های انگلیسی تازه را به `src/i18n/fr.json`، `de.json` و `tr.json` اضافه کنید (ساخت، هر متن بی‌ترجمه را فهرست می‌کند).
5. `python build.py` و سپس `python tools/make_og.py` برای تصویر پیش‌نمایش لینک در هر پنج زبان (به Playwright و Pillow نیاز دارد).

### افزودن زبان · Adding a language

کد زبان را به `LANGS`، `NAMES`، `MENU_LABEL`، `LOCALE` و `FONTS` در `build.py` اضافه کنید، فهرست ترجمه‌اش را در `src/i18n/` بسازید، پرچمش را به `tools/make_flags.py` و جمله‌های اسکریپت را به `assets/js/main.js` و کد زبان را به `assets/js/early.js` اضافه کنید، و قاعده‌ی `.t-<کد>` را در `style.css` بنویسید.
Add the code to `LANGS`, `NAMES`, `MENU_LABEL`, `LOCALE` and `FONTS` in `build.py`, write its catalogue under
`src/i18n/`, draw its flag in `tools/make_flags.py`, add the script's sentences in `assets/js/main.js` and the
code in `assets/js/early.js`, and add the `.t-<code>` rule in `style.css`.

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
