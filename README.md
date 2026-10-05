# Nova Group · گروه نوا

صفحه‌ی معرفی گروه نوا — گروهی که روی طراحی و ساخت الگوریتم‌های معاملاتی کار می‌کند.
دوزبانه (فارسی / انگلیسی)، تیره و مدرن، تک‌صفحه‌ای.

Bilingual (Persian / English) presentation page for Nova Group — a team building
trading algorithms. Dark, modern, single-page.

**🌐 صفحه‌ی زنده / Live site:** https://mohammad1982salemi.github.io/Nova-group/

---

## فارسی

### ساختار صفحه

| بخش | توضیح |
| --- | --- |
| هیرو | معرفی کوتاه + کارت نمودار بک‌تست |
| درباره ما و اعضا | معرفی گروه، چهار اصل کاری، آمار، و کارت اعضای تیم |
| پروژه‌ها | شش پروژه با وضعیت (فعال / در حال توسعه / پژوهش) و تگ فناوری‌ها |
| تماس با ما | ایمیل، تلگرام، تلفن و گیت‌هاب |

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
out rather than filled with invented details. The **six project entries** are still
placeholders.

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
