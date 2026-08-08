# Register Plan Assist — نسخه‌ی استاتیک / دمو (بدون سرور و بدون OAuth)

این پکیج، نسخه‌ی آماده برای هاست‌کردن روی **GitHub + Cloudflare Pages** از پروژه‌ی
`register-plan-assist` هست. تمام درخواست‌های سرور (`/api/...`) و مرحله‌ی لاگین OAuth
داخل مرورگر با داده‌ی نمونه (Mock) جایگزین شده — پس هیچ Backend یا SQL Server لازم نیست.

## ساختار این پکیج

```
register-plan-assist-static/
├── Client/          ← اپ React (همون چیزی که به کاربر نمایش داده میشه)
│   └── src/
│       ├── index.tsx       ← فقط یک خط اضافه شده: import './mock/mockBackend'
│       └── mock/
│           └── mockBackend.ts   ← جعل‌کننده‌ی Auth و API
├── Core/            ← مدل‌های TypeScript مشترک (Client بهش نیاز داره، دست‌نخورده)
└── .gitignore
```

## مرحله ۱ — آپلود روی GitHub

```bash
cd register-plan-assist-static
git init
git add .
git commit -m "Static demo version (mock backend, no server needed)"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

> اگه با خط‌فرمان راحت نیستی، می‌تونی از رابط وب GitHub هم "Upload files" کنی —
> ولی روش `git` مطمئن‌تره چون تعداد فایل‌ها زیاده.

## مرحله ۲ — اتصال به Cloudflare Pages

1. وارد داشبورد Cloudflare بشو → بخش **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. ریپازیتوری‌ای که ساختی رو انتخاب کن
3. تنظیمات بیلد رو دقیقاً این‌طوری بزن:

| فیلد | مقدار |
|---|---|
| **Framework preset** | Create React App |
| **Root directory** | `Client` |
| **Build command** | `npm install && npm run build` |
| **Build output directory** | `build` |

4. دکمه‌ی **Save and Deploy** رو بزن. بیلد اول معمولاً ۲ تا ۴ دقیقه طول می‌کشه.
5. بعد از اتمام، یک آدرس شبیه `https://<project-name>.pages.dev` بهت میده — همونجا برنامه بالاست.

## نکات مهم

- **Root directory / Path باید `Client` باشه، نه `/`.** چون فایل `package.json` که دستور بیلد توش تعریف شده داخل `Client` هست.
- پوشه‌ی `Core` باید کنار `Client` (نه داخلش) بمونه، چون کد با مسیر نسبی `../Core` بهش رفرنس می‌ده.
- چون از `HashRouter` استفاده شده (آدرس‌ها به‌شکل `#/preplan-list`)، نیازی به تنظیم قانون Redirect برای SPA نیست.
- این نسخه کاملاً **دمو/نمایشی** هست: تغییراتی که کاربر توی UI میده واقعاً ذخیره نمی‌شن، چون سروری در کار نیست.

### اگه از Cloudflare Workers (نه Pages کلاسیک) استفاده می‌کنی

اگه توی داشبورد Cloudflare گزینه‌ی Deploy command روی `npx wrangler deploy` تنظیم شده (یعنی از سیستم جدید Workers Builds استفاده می‌کنی)، این پکیج از قبل فایل `Client/wrangler.jsonc` رو داره که به Wrangler می‌گه پوشه‌ی خروجی بیلد (`build/`) رو به‌عنوان Static Assets آپلود کنه — پس نیازی به کار اضافه نیست.

### رفع مشکل نسخه‌ی خراب `@ahs502/validation`

خودِ پکیج `@ahs502/validation` دیگه روی رجیستری npm در دسترس نیست (متادیتای کل پکیج ۴۰۴ می‌ده). به همین خاطر توی `package.json` (هم `Client` و هم `Core`) این وابستگی رو به‌جای نسخه‌ی npm، مستقیم از مخزن گیت‌هاب نویسنده‌ش نصب می‌کنیم:
```json
"@ahs502/validation": "github:ahs502/validation"
```
این روش کاملاً مستقل از وضعیت رجیستری npm عمل می‌کنه و نیازی به شماره نسخه نداره.

## سفارشی‌سازی داده‌ی نمونه

اگه خواستی فرودگاه، هواپیما یا پرواز بیشتری اضافه کنی، فقط کافیه آرایه‌های داخل
`Client/src/mock/mockBackend.ts` (`airports`, `aircraftRegisters`, `flightRequirements`, `flights`)
رو ویرایش کنی و دوباره `git push` بزنی — Cloudflare خودش به‌صورت خودکار دوباره دیپلوی می‌کنه.

## برگشت به حالت واقعی (اتصال به سرور واقعی ماهان‌ایر)

فقط خط `import './mock/mockBackend';` رو از بالای `Client/src/index.tsx` حذف کن، و کل پوشه‌ی
`Server` رو (که در این پکیج نیست، باید از پروژه‌ی اصلی برداری) دوباره به کار بگیر.
