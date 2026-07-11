# B20 Forge

سایت لانچ توکن B20 روی شبکه Base — اتصال کیف‌پول با Reown AppKit، فقط روی
Base Mainnet و Base Sepolia (تست‌نت)، آپلود لوگو روی IPFS، و دیپلوی مستقیم از
طریق قرارداد `B20Launcher.sol`.

## قبل از هر چیز: قرارداد لانچر رو دیپلوی کن

سایت فقط با یک نسخه از `B20Launcher.sol` که **از قبل روی هر دو شبکه دیپلوی
شده** کار می‌کنه — خود سایت این قرارداد رو دیپلوی نمی‌کنه، فقط با اون تعامل
می‌کنه. این کار رو فقط یک‌بار برای هر شبکه انجام بده:

1. فایل `contracts/B20Launcher.sol` رو باز کن در [Remix IDE](https://remix.ethereum.org)
   (فایل رو drag & drop کن توی File Explorer؛ چون import هاش مستقیم از GitHub
   هست، Remix خودش دانلودشون می‌کنه).
2. توی تب Solidity Compiler، ورژن `0.8.24` رو انتخاب کن و Compile بزن.
3. توی تب Deploy & Run:
   - Environment رو بذار روی `Injected Provider - MetaMask`.
   - کیف‌پولت رو اول به **Base Sepolia** وصل کن، Deploy بزن، تراکنش رو امضا کن.
   - آدرس قرارداد deploy‌شده رو کپی کن → بذار توی `.env` جلوی
     `VITE_LAUNCHER_ADDRESS_TESTNET`.
   - همین کار رو دوباره تکرار کن ولی این‌بار کیف‌پول رو به **Base Mainnet**
     وصل کن (نیاز به ETH واقعی روی Base داری) → آدرس رو بذار جلوی
     `VITE_LAUNCHER_ADDRESS_MAINNET`.
4. قبل از دیپلوی روی مین‌نت، حتماً روی `isAssetFeatureActive()` توی Remix کلیک
   کن (رایگانه، فقط view) و مطمئن شو `true` برمی‌گردونه — یعنی قابلیت B20
   Asset روی اون شبکه فعال شده.

> جایگزین Foundry: اگه Base's Foundry fork (`base-forge`) رو نصب کردی،
> می‌تونی به‌جای Remix از `contracts/script/DeployLauncher.s.sol` استفاده کنی.
> توجه: توی اون اسکریپت import ها به فرمت `base-std/...` نوشته شدن (نه لینک
> مستقیم GitHub)، پس باید پکیج `base-std` رو طبق داکیومنت رسمی Base نصب/remap
> کنی.

## راه‌اندازی سایت

```bash
npm install
cp .env.example .env
```

سه گروه مقدار رو توی `.env` پر کن:

1. **`VITE_REOWN_PROJECT_ID`** — از [dashboard.reown.com](https://dashboard.reown.com)
   یه پروژه جدید بساز، Project ID رو کپی کن. دامنه‌ی نهایی روی Vercel رو هم
   توی تنظیمات پروژه (Allowed Domains) اضافه کن وگرنه اتصال کیف‌پول در پروڈاکشن
   کار نمی‌کنه.
2. **`VITE_LAUNCHER_ADDRESS_MAINNET` / `VITE_LAUNCHER_ADDRESS_TESTNET`** —
   همونایی که بالا دیپلوی کردی.
3. **`VITE_PINATA_JWT`** — از [app.pinata.cloud](https://app.pinata.cloud) →
   API Keys → یه کلید با scope آپلود (pinFileToIPFS / pinJSONToIPFS) بساز.
   بدون این مقدار، سایت کار می‌کنه ولی بخش آپلود لوگو غیرفعال می‌مونه.

اجرای محلی:

```bash
npm run dev
```

## چیزهایی که این سایت خودکار تضمین می‌کنه

- **شبکه اجباری:** کیف‌پول فقط روی Base Mainnet یا Base Sepolia می‌تونه
  تراکنش بزنه. اگه وصل به هر شبکه‌ی دیگه‌ای باشه، دکمه‌ی دیپلوی غیرفعال
  می‌مونه و از کاربر خواسته می‌شه سوییچ کنه (نه خودکار روی شبکه اشتباه
  تراکنش بزنه).
- **تعداد دقیق:** وقتی کاربر می‌نویسه `1000`، همون عدد به‌صورت واحدهای پایه‌ی
  دقیق (`1000 * 10^decimals`) محاسبه می‌شه — با `viem`'s `parseUnits` روی
  رشته‌ی متنی، نه float جاوااسکریپت، پس هیچ گرد کردن اشتباهی رخ نمی‌ده.
- **Salt یکتا:** به‌جای گرفتن salt از کاربر، سایت از اسم + نماد + آدرس
  کیف‌پول کاربر یک salt می‌سازه (همون الگوریتم `makeSalt` قرارداد:
  `keccak256` روی بایت‌های متن). اگه تصادفاً تکراری بود (`TokenAlreadyExists`)،
  خودش یک نسخه‌ی دیگه امتحان می‌کنه تا موفق بشه.
- **چک قبل از دیپلوی:** قبل از باز کردن پنجره‌ی امضا، سایت `isAssetFeatureActive()`
  رو صدا می‌زنه (رایگان) و اگه هنوز فعال نشده، جلوی امضای بی‌فایده رو می‌گیره.
- **محدودیت عکس:** لوگو خودکار به مربع ۱۰۲۴×۱۰۲۴ resize و به WebP زیر ۱ مگابایت
  فشرده می‌شه، چون خیلی از سرویس‌های IPFS و gateway ها روی فایل‌های بزرگ یا
  ابعاد عجیب مشکل دارن.

## دیپلوی: GitHub → Vercel

```bash
git init
git add .
git commit -m "B20 Forge"
git branch -M main
git remote add origin <آدرس ریپوی GitHub خودت>
git push -u origin main
```

بعد توی [vercel.com](https://vercel.com):

1. **New Project** → ریپوی GitHub رو import کن (فریم‌ورک به‌صورت خودکار
   **Vite** تشخیص داده می‌شه).
2. توی **Environment Variables**، همون ۵ مقداری که توی `.env` گذاشتی رو اضافه
   کن (Vercel هیچ‌وقت `.env` رو از گیت‌هاب نمی‌خونه، باید دستی وارد کنی).
3. Deploy بزن.
4. دامنه‌ی نهایی Vercel رو برگردون توی Reown Dashboard و به لیست
   Allowed Domains اضافه کن، وگرنه دکمه‌ی اتصال کیف‌پول در پروڈاکشن ارور
   می‌ده.

## ساختار پروژه

```
src/
  lib/appkit.ts        تنظیمات Reown AppKit + wagmi (فقط شبکه‌های Base)
  lib/chains.ts         تعریف دو شبکه‌ی مجاز
  lib/config.ts         خوندن متغیرهای محیطی
  lib/amounts.ts         تبدیل دقیق تعداد وارد شده به واحد پایه
  lib/salt.ts            ساخت salt یکتا
  lib/ipfs.ts             فشرده‌سازی عکس + آپلود به Pinata
  hooks/useNetworkGuard.ts     اجبار شبکه
  hooks/useLaunchToken.ts       کل فلوی دیپلوی (چک، salt، تراکنش)
  abi/B20Launcher.ts     ABI قرارداد
  components/            رابط کاربری
contracts/B20Launcher.sol   قرارداد لانچر (باید جدا دیپلوی بشه)
```
