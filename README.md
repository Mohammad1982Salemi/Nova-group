# Nova Group · گروه نوا

صفحه‌ی معرفی گروه نوا — دوزبانه (فارسی / انگلیسی)، تیره و مدرن.

Bilingual (Persian / English) presentation page for Nova Group — dark, modern, single-page.

**🌐 صفحه‌ی زنده / Live site:** https://mohammad1982salemi.github.io/Nova-group/

---

## فارسی

### درباره‌ی این پروژه

این یک سایت تک‌صفحه‌ای است که روی **GitHub Pages** میزبانی می‌شود و برای معرفی گروه، خدمات، تیم و راه‌های تماس استفاده می‌شود. کاملاً بدون وابستگی به سرور یا هزینه‌ی میزبانی.

### ویژگی‌ها

- دوزبانه با دکمه‌ی تغییر زبان در نوار بالا (فارسی راست‌چین / انگلیسی چپ‌چین)
- شماره‌ها به‌طور خودکار به اعداد فارسی تبدیل می‌شوند
- طراحی واکنش‌گرا (موبایل، تبلت، دسکتاپ)
- انیمیشن‌های ورود با اسکرول و شمارنده‌های متحرک
- پشتیبانی از `prefers-reduced-motion` برای کاربران حساس به حرکت
- برچسب‌های Open Graph برای پیش‌نمایش زیبا هنگام اشتراک‌گذاری لینک

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

برای تغییر هر متن، فقط کافی است همان دو `span` را ویرایش کنید. با تغییر زبان، مرورگر خودش یکی را نشان می‌دهد.

بخش‌هایی که باید با اطلاعات واقعی جایگزین شوند:

| بخش | محل در `index.html` |
| --- | --- |
| نام اعضای تیم | بخش `id="team"` |
| شماره‌ها و آمار | بخش `class="stats"` |
| ایمیل، تلفن، تلگرام | بخش `id="contact"` |

### اجرای محلی

```bash
python -m http.server 8000
```

سپس آدرس `http://localhost:8000` را باز کنید.

---

## English

### About

A single-page static site hosted on **GitHub Pages**, introducing the group, its services, team and contact channels. No server, no hosting cost.

### Features

- Bilingual with a language toggle in the navbar (Persian RTL / English LTR)
- Numbers automatically convert to Persian numerals in Persian mode
- Fully responsive across mobile, tablet and desktop
- Scroll-reveal animations and animated count-up statistics
- Respects `prefers-reduced-motion`
- Open Graph tags for rich link previews when shared

### Editing content

All copy lives in `index.html`, written as paired bilingual spans:

```html
<span class="t-fa">متن فارسی</span>
<span class="t-en">English text</span>
```

Edit those two spans and the toggle handles the rest.

### Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

---

## Deployment

The site is served from the `main` branch root via GitHub Pages.

To update the live site, commit and push:

```bash
git add -A
git commit -m "Update content"
git push
```

Changes appear at https://mohammad1982salemi.github.io/Nova-group/ within about a minute.
