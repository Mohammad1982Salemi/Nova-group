# Nova Group · گروه نوا

صفحه‌ی معرفی گروه نوا — پژوهش الگوریتمی از ۱۳۹۹ روی جریان سفارشات بازار.
دوزبانه (فارسی / انگلیسی)، تیره و مدرن، تک‌صفحه‌ای.

Bilingual (Persian / English) presentation page for Nova Group — algorithmic
research into market order flow since 2020. Dark, modern, single-page.

**🌐 صفحه‌ی زنده / Live site:** https://mohammad1982salemi.github.io/Nova-group/

---

## فارسی

### ساختار صفحه

| بخش | توضیح |
| --- | --- |
| هیرو | تز مرکزی گروه + کارت نمودار بک‌تست |
| درباره ما | معرفی، **چارچوب سه‌لایه‌ی کار**، و کادر «وضعیت ما» |
| اعضا | سه عضو با نام و سمت |
| پروژه‌ها | هر پروژه یک موردِ **بازشو**: معرفی / رویکرد / آنچه فرق می‌کند / مسیر پیش رو / فناوری |
| تماس با ما | فعلاً فقط گیت‌هاب |

### چارچوب سه‌لایه

هر پروژه روی همین سه لایه سوار می‌شود، از پایین به بالا:

1. **پلتفرم مستقل، اختصاصی هر پروژه** — بدون وابستگی به ابزار آماده
2. **شبیه‌ساز عمیق اجرای سفارش** — ستون کار؛ صف، نوبت و پر شدن تکه‌تکه
3. **تحلیل، نمودار و مدل‌های پیش‌بینی** — آخرین لایه، نه اولین

### پروژه‌ها چطور اضافه می‌شوند

هر پروژه یک `<article class="project">` است با دو بخش:

- **سربرگ و کارت بسته** — `class="project-head"` (شماره، عنوان، یک خط خلاصه، وضعیت) به‌علاوه‌ی `class="tags"`
- **بدنه‌ی بازشو** — `class="project-detail"` شامل بلوک‌هایی با `class="detail-block"`

بلوک‌های آماده در CSS: `detail-lead` (پاراگراف درشت)، `steps` (فرآیند مرحله‌ای)، `points` (فهرست تمایزها)، `phases` (تایم‌لاین؛ به هر `li` کلاس `is-done` یا `is-now` بدهید).

دکمه‌ی باز و بسته در `main.js` → `initProjects()` است. برای بسته‌بودن پیش‌فرض، کلاس `is-open` را از `article` بردارید و `aria-expanded` را `false` کنید.

### ویژگی‌ها

- دوزبانه با دکمه‌ی تغییر زبان در نوار بالا (فارسی راست‌چین / انگلیسی چپ‌چین)
- شماره‌ها به‌طور خودکار به اعداد فارسی تبدیل می‌شوند
- طراحی واکنش‌گرا (موبایل، تبلت، دسکتاپ)
- انیمیشن‌های ورود با اسکرول و شمارنده‌های متحرک
- پشتیبانی از `prefers-reduced-motion`
- برچسب‌های Open Graph برای پیش‌نمایش زیبا هنگام اشتراک‌گذاری لینک
- لوگو و فاویکون به‌صورت SVG وکتور (بدون فایل تصویری)

### ساختار فایل‌ها

```
index.html               صفحه‌ی اصلی (هر دو زبان داخلش است)
assets/css/style.css     استایل‌ها
assets/js/main.js        تعاملات (تغییر زبان، انیمیشن، منو)
.nojekyll                غیرفعال‌کردن پردازش Jekyll روی GitHub Pages
```

### ویرایش محتوا

تمام متن‌ها مستقیم داخل `index.html` هستند. هر متن دوزبانه به این شکل نوشته شده:

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

برای تغییر هر متن، فقط همان دو `span` را ویرایش کنید.

### چیزهایی که باید با اطلاعات واقعی جایگزین شوند

| مورد | محل در `index.html` |
| --- | --- |
| پروژه‌ها | بخش `id="projects"` |

نام و سمت اعضای تیم واقعی است. در بخش تماس فعلاً **فقط لینک گیت‌هاب** هست — ایمیل، تلفن و تلگرام عمداً خالی مانده‌اند تا با مقدار ساختگی پر نشوند. هر وقت راه ارتباطی واقعی داشتید، در `class="contact-links"` اضافه کنید.

> ⚠️ همه‌ی این‌ها در حال حاضر **محتوای نمونه** هستند، نه اطلاعات واقعی. فقط لینک گیت‌هاب واقعی است.

### لحن صفحه — عمدی است

صفحه طوری نوشته شده که **هیچ ادعایی که اثبات نشده مطرح نکند**:

- هیچ عدد عملکردی (بازده، شارپ، افت سرمایه) در صفحه نیست و بخش آمار عمداً حذف شده
- وضعیت پروژه‌ها فقط «در حال ساخت»، «پژوهش» و «نمونه‌ی اولیه» است — هیچ‌جا «فعال» نیست
- زیر نمودار هیرو صریحاً نوشته شده که نمونه است و بازدهی واقعی نیست
- یک کادر «وضعیت ما» صریحاً می‌گوید هنوز هیچ استراتژی‌ای به اجرای واقعی نرسیده

اگر بعداً به مرحله‌ی اجرا رسیدید و خواستید اعداد عملکرد اضافه کنید، آن کادر و این بند را هم به‌روز کنید.

### اجرای محلی

```bash
python -m http.server 8000
```

سپس آدرس `http://localhost:8000` را باز کنید.

---

## English

### Sections

| Section | Contents |
| --- | --- |
| Hero | Short intro plus a sample backtest chart card |
| About & members | Who we are, four working principles, key numbers, team cards |
| Projects | Six projects with status (live / in development / research) and tech tags |
| Contact | Email, Telegram, phone and GitHub |

### Features

- Bilingual with a language toggle in the navbar (Persian RTL / English LTR)
- Numbers automatically convert to Persian numerals in Persian mode
- Fully responsive across mobile, tablet and desktop
- Scroll-reveal animations and animated count-up statistics
- Respects `prefers-reduced-motion`
- Open Graph tags for rich link previews
- Vector SVG logo and favicon (no raster image files)

### Editing content

All copy lives in `index.html`, written as paired bilingual spans:

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

### Placeholder content

Team names and roles are real. Only **Mohammad Salemi has a photo**
(`assets/img/mohammad-salemi.jpg`, 400×400, ~24 KB); Rouhi and Shalchian fall back
to initials until they send one.

Contact lists **GitHub only** — email, phone and Telegram were deliberately left
out rather than filled with invented details.

**Projects:** TSETMC is the group's own written case study. The other four projects
exist as repositories (`Quantia_ST_Crypto`, `Quantia_ST_LP`, `Quantia_ST_Scalp`,
`Quantia_ST_BlockTrade`) but their write-ups have not been supplied yet, so they are
**not listed** rather than filled with invented descriptions.

### Tone is deliberate

The page is written so that it makes **no claim it cannot back up**: there is no
performance figure anywhere, every project is marked in-progress / research /
prototype (never "live"), the hero chart is labelled as illustrative, and a
"Where we are" callout states plainly that nothing has gone to live execution yet.
Update that callout if and when that changes.

### Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

---

## Deployment

The site is served from the `main` branch root via GitHub Pages.

```bash
git add -A
git commit -m "Update content"
git push
```

Changes appear at https://mohammad1982salemi.github.io/Nova-group/ within about a minute.
