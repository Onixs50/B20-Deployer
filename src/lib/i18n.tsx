import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "fa" | "en";

const dict = {
  brand: { fa: "فورج", en: "Forge" },

  hero_badge: {
    fa: "استاندارد بومی B20 — مستقیم روی هسته‌ی شبکه Base",
    en: "Native B20 standard — straight from Base's own core"
  },
  hero_words: {
    fa: ["دارایی", "ممبرشیپ", "توکن پروژه", "توکن جامعه"],
    en: ["asset", "membership pass", "project token", "community token"]
  },
  hero_title_prefix: { fa: "یک", en: "Launch a" },
  hero_title_suffix: {
    fa: "بساز که واقعاً روی زنجیره زندگی می‌کنه.",
    en: "that actually lives onchain."
  },
  hero_desc: {
    fa: "بدون خط کد، بدون قرارداد سفارشی برای ممیزی. اسم، نماد و تعداد رو بده؛ B20 Forge توکنت رو مستقیماً از طریق پیش‌کامپایل رسمی Base می‌سازه — روی تست‌نت برای امتحان، یا مین‌نت برای واقعی شدنش.",
    en: "No code, no custom contract to audit. Give it a name, symbol and supply — B20 Forge mints your token straight through Base's own official precompile. Try it on testnet, or ship it for real on mainnet."
  },
  hero_cta: { fa: "شروع ساخت توکن", en: "Start building" },

  header_history: { fa: "توکن‌های من", en: "My tokens" },

  network_title: { fa: "شبکه دیپلوی", en: "Deploy network" },
  network_switch_needed: { fa: "کیف‌پولت روی شبکه‌ی دیگه‌ایه. برای ادامه باید روی", en: "Your wallet is on a different network. To continue, switch to" },
  network_switch_cta: { fa: "الان سوییچ کن", en: "switch now" },
  network_switching: { fa: "در حال تعویض…", en: "Switching…" },
  network_switch_ok_main: { fa: "روی Base مین‌نت وصل شدی", en: "Connected to Base Mainnet" },
  network_switch_ok_test: { fa: "روی Base تست‌نت وصل شدی", en: "Connected to Base Testnet" },
  network_switch_fail: { fa: "تعویض شبکه توی کیف‌پول رد شد یا انجام نشد.", en: "Network switch was rejected or failed." },

  field_name: { fa: "اسم توکن", en: "Token name" },
  field_name_hint: { fa: "مثلا «My Onixia Token»", en: "e.g. \"My Onixia Token\"" },
  field_name_err: { fa: "بین ۱ تا ۴۰ کاراکتر.", en: "Must be 1–40 characters." },
  field_symbol: { fa: "نماد", en: "Symbol" },
  field_symbol_hint: { fa: "مثلا ONX", en: "e.g. ONX" },
  field_symbol_err: { fa: "۲ تا ۱۱ حرف/عدد انگلیسی، بدون فاصله.", en: "2–11 letters/digits, no spaces." },
  field_decimals: { fa: "اعشار (Decimals)", en: "Decimals" },
  field_decimals_hint: { fa: "۶ تا ۱۸، پیش‌فرض ۱۸", en: "6–18, defaults to 18" },
  field_decimals_err: { fa: "بین ۶ تا ۱۸.", en: "Must be between 6 and 18." },
  field_cap: { fa: "سقف عرضه کل (Supply Cap)", en: "Total supply cap" },
  field_cap_hint_uncapped: { fa: "بدون سقف — هر مقدار قابل mint هست", en: "Uncapped — any amount can be minted" },
  field_cap_hint_capped: { fa: "دقیقاً همین تعداد واحد کامل توکن", en: "Exactly this many whole tokens" },
  field_cap_err: { fa: "یک عدد معتبر بنویس.", en: "Enter a valid number." },
  field_cap_uncapped_toggle: { fa: "بدون سقف", en: "No cap" },
  field_cap_result: { fa: "یعنی دقیقاً", en: "That's exactly" },
  field_cap_result_suffix: { fa: "توکن کامل.", en: "whole tokens." },
  field_mint: { fa: "مقدار Mint اولیه", en: "Initial mint" },
  field_mint_hint: { fa: "به کیف‌پول خودت — می‌تونی صفر بذاری", en: "To your own wallet — can be zero" },
  field_mint_err: { fa: "یک عدد معتبر بنویس.", en: "Enter a valid number." },
  field_mint_over_cap: { fa: "نمی‌تونه از سقف عرضه بیشتر باشه.", en: "Can't exceed the supply cap." },
  field_mint_result: { fa: "یعنی دقیقاً", en: "That mints exactly" },
  field_mint_result_suffix: { fa: "توکن کامل به آدرس تو mint می‌شه.", en: "whole tokens to your address." },

  logo_title: { fa: "لوگوی توکن", en: "Token logo" },
  logo_optional: { fa: "(اختیاری)", en: "(optional)" },
  logo_idle: { fa: "یه عکس بکش اینجا یا کلیک کن — PNG، JPEG یا WebP.", en: "Drop an image here or click — PNG, JPEG or WebP." },
  logo_processing: { fa: "در حال تغییر اندازه و فشرده‌سازی…", en: "Resizing and compressing…" },
  logo_uploading: { fa: "در حال پین کردن روی IPFS…", en: "Pinning to IPFS…" },
  logo_done: { fa: "آماده — به توکن وصل می‌شه.", en: "Ready — will be attached to your token." },
  logo_error: { fa: "مشکلی پیش اومد، دوباره امتحان کن.", en: "Something went wrong, try again." },
  logo_note: { fa: "خودکار به مربع ۱۰۲۴×۱۰۲۴ و زیر ۱ مگابایت فشرده می‌شه.", en: "Auto-resized to a 1024×1024 square, under 1MB." },
  logo_toast_ok: { fa: "لوگو روی IPFS پین شد", en: "Logo pinned to IPFS" },

  stage_idle: { fa: "", en: "" },
  stage_checking: { fa: "بررسی فعال بودن B20 روی شبکه…", en: "Checking whether B20 is active on the network…" },
  stage_salt: { fa: "ساخت یه شناسه یکتا برای توکن…", en: "Deriving a unique token identifier…" },
  stage_sign: { fa: "منتظر امضای تراکنش توی کیف‌پول…", en: "Waiting for signature in your wallet…" },
  stage_confirm: { fa: "در حال تأیید روی زنجیره…", en: "Confirming onchain…" },
  stage_done: { fa: "دیپلوی موفق!", en: "Deployed!" },
  stage_error: { fa: "مشکلی پیش اومد", en: "Something went wrong" },

  submit_deploy_on: { fa: "دیپلوی روی", en: "Deploy on" },
  submit_need_wallet: { fa: "برای دیپلوی، اول کیف‌پولت رو وصل کن.", en: "Connect your wallet first to deploy." },
  submit_need_network: { fa: "فقط روی Base مین‌نت یا تست‌نت می‌تونی دیپلوی کنی — بالا انتخاب کن.", en: "You can only deploy on Base Mainnet or Testnet — pick one above." },
  toast_need_wallet: { fa: "اول کیف‌پولت رو وصل کن.", en: "Connect your wallet first." },
  toast_need_network: { fa: "اول باید روی Base مین‌نت یا تست‌نت سوییچ کنی.", en: "Switch to Base Mainnet or Testnet first." },
  toast_no_launcher: { fa: "آدرس قرارداد لانچر برای این شبکه تنظیم نشده.", en: "Launcher contract address isn't set for this network." },
  toast_tx_ok: { fa: "تراکنش تأیید شد!", en: "Transaction confirmed!" },

  success_on: { fa: "روی", en: "on" },
  success_token_addr: { fa: "آدرس توکن", en: "Token address" },
  success_tx: { fa: "تراکنش", en: "Transaction" },
  success_view: { fa: "دیدن توکن روی", en: "View token on" },
  success_again: { fa: "دیپلوی یه توکن دیگه", en: "Deploy another token" },

  history_title: { fa: "توکن‌های دیپلوی‌شده", en: "Deployed tokens" },
  history_empty: { fa: "هنوز توکنی از این مرورگر دیپلوی نکردی.", en: "No tokens deployed from this browser yet." },
  history_note: { fa: "این لیست فقط روی همین مرورگر ذخیره می‌شه.", en: "This list is only stored on this browser." },
  history_close: { fa: "بستن", en: "Close" },

  footer_testnet_first: { fa: "قبل از دیپلوی روی مین‌نت، حتماً روی تست‌نت امتحان کن.", en: "Always try testnet before deploying on mainnet." },
  footer_built_by: { fa: "ساخته‌شده توسط", en: "Built by" },

  manage_open: { fa: "مدیریت توکن", en: "Manage token" },
  manage_close: { fa: "بستن مدیریت", en: "Close manager" },
  manage_title: { fa: "پنل مدیریت توکن", en: "Token management panel" },
  manage_not_admin: {
    fa: "این کیف‌پول نقش ادمین این توکن رو نداره، پس بعضی از عملیات‌ها ممکنه رد بشه.",
    en: "This wallet doesn't hold admin roles on this token — some actions may revert."
  },
  manage_supply: { fa: "عرضهٔ فعلی", en: "Current supply" },
  manage_cap: { fa: "سقف عرضه", en: "Supply cap" },
  manage_cap_none: { fa: "بدون سقف", en: "Uncapped" },
  manage_balance: { fa: "موجودی تو", en: "Your balance" },
  manage_status: { fa: "وضعیت", en: "Status" },
  manage_status_paused: { fa: "متوقف‌شده (Paused)", en: "Paused" },
  manage_status_active: { fa: "فعال", en: "Active" },
  manage_refresh: { fa: "به‌روزرسانی", en: "Refresh" },

  tab_mint: { fa: "Mint", en: "Mint" },
  tab_burn: { fa: "Burn", en: "Burn" },
  tab_transfer: { fa: "ارسال", en: "Transfer" },
  tab_batch: { fa: "ارسال گروهی", en: "Batch send" },
  tab_pause: { fa: "Pause", en: "Pause" },

  mint_to: { fa: "آدرس گیرنده", en: "Recipient address" },
  mint_amount: { fa: "مقدار", en: "Amount" },
  mint_to_self: { fa: "برای خودم", en: "To myself" },
  mint_submit: { fa: "Mint کن", en: "Mint" },

  burn_from: { fa: "سوزوندن از آدرس", en: "Burn from address" },
  burn_from_self: { fa: "از خودم", en: "From myself" },
  burn_self_note: {
    fa: "خود این توکن فقط اجازهٔ سوزوندن از موجودی خودت رو می‌ده (نه از آدرس دیگه).",
    en: "This token only supports burning from your own balance (not someone else's)."
  },
  burn_amount: { fa: "مقدار", en: "Amount" },
  burn_submit: { fa: "Burn کن", en: "Burn" },
  burn_over_balance: { fa: "بیشتر از موجودیه — نمی‌شه سوزوند.", en: "More than your balance — can't burn/send that." },

  transfer_to: { fa: "آدرس گیرنده", en: "Recipient address" },
  transfer_amount: { fa: "مقدار", en: "Amount" },
  transfer_submit: { fa: "ارسال کن", en: "Send" },

  batch_intro: {
    fa: "همه رو توی یک تراکنش می‌فرسته (نه یکی‌یکی) — یا با mint مستقیم، یا با ترنسفر از موجودی خودت.",
    en: "Sends everyone in a single transaction (not one-by-one) — either by minting directly, or transferring from your balance."
  },
  batch_mode_mint: { fa: "Mint مستقیم به همه", en: "Mint directly to all" },
  batch_mode_transfer: { fa: "از موجودی من", en: "From my balance" },
  batch_mint_role_missing: {
    fa: "کانترکت ارسال گروهی هنوز نقش MINT_ROLE رو نداره — یه‌بار فعالش کن (یک امضا، بعدش دیگه لازم نیست).",
    en: "The batch contract doesn't hold MINT_ROLE yet — enable it once (one signature, then never again)."
  },
  batch_enable_mint_role: { fa: "فعال‌سازی Mint گروهی", en: "Enable batch minting" },
  batch_transfer_note: {
    fa: "اگه مجوز کافی نداشته باشی، اول یه تراکنش approve می‌زنه، بعد همه رو یه‌جا می‌فرسته (دو امضا کل، نه به تعداد گیرنده‌ها).",
    en: "If allowance isn't enough yet, an approve tx runs first, then everyone is sent in one call (two signatures total, not one per recipient)."
  },
  batch_not_configured: {
    fa: "آدرس کانترکت ارسال گروهی (B20BatchDistributor) هنوز توی .env تنظیم نشده.",
    en: "The batch distributor contract address isn't configured in .env yet."
  },
  batch_count: { fa: "تعداد ولت", en: "Number of wallets" },
  batch_amount_each: { fa: "مقدار برای هرکدوم", en: "Amount per wallet" },
  batch_generate: { fa: "بساز و آماده کن", en: "Generate wallets" },
  batch_download: { fa: "دانلود CSV (آدرس + کلید خصوصی)", en: "Download CSV (address + private key)" },
  batch_warning: {
    fa: "⚠️ کلیدهای خصوصی رو فقط پیش خودت نگه دار. هرکی این فایل رو ببینه صاحب اون ولت‌ها می‌شه.",
    en: "⚠️ Keep these private keys to yourself. Anyone who sees this file owns those wallets."
  },
  batch_submit: { fa: "ارسال به همه", en: "Send to all" },
  batch_progress: { fa: "در حال ارسال", en: "Sending" },
  batch_custom_title: { fa: "یا آدرس‌های دلخواه (هرخط: آدرس,مقدار)", en: "Or custom addresses (one per line: address,amount)" },
  batch_custom_placeholder: { fa: "0xabc...,100\n0xdef...,50", en: "0xabc...,100\n0xdef...,50" },
  batch_custom_submit: { fa: "ارسال به لیست بالا", en: "Send to list above" },

  pause_intro: { fa: "توقف موقت همهٔ انتقال‌های توکن (فقط دارندهٔ PAUSE_ROLE).", en: "Temporarily halts all token transfers (PAUSE_ROLE holder only)." },
  pause_do: { fa: "متوقف کن", en: "Pause" },
  unpause_do: { fa: "فعال کن", en: "Unpause" },

  manage_mainnet_limited: {
    fa: "روی مین‌نت فقط Mint و Burn در دسترسن. ارسال (تکی یا گروهی) و Pause فعلاً موقتاً غیرفعاله چون این عملیات‌ها روی مین‌نت پایدار عمل نمی‌کردن — روی تست‌نت همه‌چیز فعاله.",
    en: "Only Mint and Burn are available on mainnet for now. Send (single or batch) and Pause are temporarily disabled here because those operations weren't behaving reliably on mainnet — everything is still enabled on testnet."
  },

  tx_awaiting: { fa: "منتظر امضا…", en: "Awaiting signature…" },
  tx_confirming: { fa: "در حال تأیید…", en: "Confirming…" },
  tx_done: { fa: "انجام شد ✓", en: "Done ✓" },
  common_invalid_address: { fa: "آدرس معتبر نیست.", en: "Not a valid address." },
  common_invalid_amount: { fa: "مقدار معتبر نیست.", en: "Not a valid amount." }
} as const;

export type DictKey = keyof typeof dict;

type LangCtx = {
  lang: Lang;
  toggle: () => void;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  tList: (key: DictKey) => string[];
  dir: "rtl" | "ltr";
};

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("b20forge_lang") : null;
    return saved === "en" ? "en" : "fa";
  });

  const dir = lang === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    window.localStorage.setItem("b20forge_lang", lang);
  }, [lang, dir]);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      dir,
      setLang,
      toggle: () => setLang((l) => (l === "fa" ? "en" : "fa")),
      t: (key: DictKey) => (dict[key] as any)[lang] as string,
      tList: (key: DictKey) => (dict[key] as any)[lang] as string[]
    }),
    [lang, dir]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
