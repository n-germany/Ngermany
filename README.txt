# Ngermany – نسخه متصل به Cloudflare D1

## فایل‌ها
- `index.html`: فروشگاه آماده با ظاهر قبلی، متصل به API
- `worker.js`: کد Worker برای محصولات، دسته‌بندی‌ها و ثبت سفارش

## نکته‌های مهم
- Worker باید Binding دیتابیس با نام دقیق `DB` داشته باشد.
- این نسخه محصولات را از D1 می‌خواند و سفارش‌ها را در D1 ثبت می‌کند.
- پرداخت آنلاین، ورود امن مشتری، پنل مدیریت امن و مدیریت محصول هنوز پیاده‌سازی نشده‌اند.
- تا وقتی محصولات را در جدول `products` و دسته‌ها را در `categories` وارد نکنی، فروشگاه خالی نمایش داده می‌شود.
- جدول `admins` فعلاً برای فاز بعدی است؛ این نسخه هیچ رمز پیش‌فرض یا حساب مدیر ناامن ایجاد نمی‌کند.

## نصب
1. محتوای `worker.js` را در Cloudflare Worker با نام `ngermany-api` جایگزین کن و Deploy بزن.
2. مطمئن شو D1 Binding با نام `DB` به دیتابیس `ngermany` متصل است.
3. فایل `index.html` را در ریشه مخزن GitHub Pages خودت با همین نام آپلود کن.
4. آدرس API داخل `index.html` از قبل روی Worker فعلی تنظیم شده است.

## تست
- `https://ngermany-api.samyarkhakpwr04.workers.dev/health`
- `https://ngermany-api.samyarkhakpwr04.workers.dev/api/products`

## ساخت دسته و محصول نمونه
در D1 Console می‌توانی این دستورات را جداگانه اجرا کنی:

```sql
INSERT INTO categories (name, slug) VALUES ('دیجیتال', 'digital');
INSERT INTO products (name, slug, description, price, discount_price, stock, image_url, category_id, status)
VALUES ('هدفون بی‌سیم', 'wireless-headphone', 'هدفون بی‌سیم با کیفیت مناسب', 2500000, 2200000, 10, '', 1, 'active');
```
