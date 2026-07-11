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
  footer_built_by: { fa: "ساخته‌شده توسط", en: "Built by" }
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
