Ngermany – بسته پنل مدیریت

ساختار:
- admin/index.html  پنل مدیریت با آدرس /admin/
- worker.js         API فروشگاه + API امن مدیریت

مراحل نصب:
1) در GitHub مخزن فروشگاه، پوشه admin را بساز و فایل index.html داخل آن قرار بده. آدرس پنل می‌شود:
   https://USERNAME.github.io/ngermany/admin/
   (USERNAME را با نام کاربری واقعی GitHub خودت عوض کن.)
2) در Cloudflare > Workers & Pages > ngermany-api > Settings > Variables and Secrets
   یک Secret با نام ADMIN_TOKEN بساز و یک رمز طولانی و غیرقابل حدس برایش قرار بده.
   مقدار رمز را در GitHub یا داخل فایل HTML ننویس.
3) محتوای worker.js را در Worker فعلی ngermany-api جایگزین کن و Deploy بزن.
4) تست /health و سپس آدرس /api/products را باز کن.
5) پنل /admin/ را باز کن و همان مقدار ADMIN_TOKEN را وارد کن.

امکانات پنل:
- افزودن، ویرایش و غیرفعال کردن محصول
- افزودن و حذف دسته‌بندی (حذف دسته‌ای که محصول دارد مسدود می‌شود)
- مشاهده سفارش‌ها و تغییر وضعیت سفارش

ملاحظات:
- در این نسخه ورود مدیر با Secret سمت Worker انجام می‌شود؛ توکن در کد سایت ذخیره نشده و فقط در session مرورگر نگهداری می‌شود.
- درگاه پرداخت آنلاین، بارگذاری مستقیم تصویر، گزارش‌گیری پیشرفته و مدیریت چند مدیر هنوز اضافه نشده‌اند.
- قبل از انتشار عمومی، مقدار ADMIN_TOKEN را حتماً در Cloudflare به‌صورت Secret تنظیم کن.
