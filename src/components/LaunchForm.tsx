import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { NetworkPicker } from "./NetworkPicker";
import { LogoUploader } from "./LogoUploader";
import { useNetworkGuard, type LaunchNetwork } from "../hooks/useNetworkGuard";
import { useLaunchToken } from "../hooks/useLaunchToken";
import { isValidQuantityInput, toBaseUnits, formatDisplay } from "../lib/amounts";
import { uploadMetadataToIpfs, type IpfsUploadResult } from "../lib/ipfs";
import { CHAIN_META } from "../lib/chains";

const STAGE_LABEL: Record<string, string> = {
  idle: "",
  "checking-feature": "بررسی فعال بودن B20 روی شبکه…",
  "deriving-salt": "ساخت یه شناسه یکتا برای توکن…",
  "awaiting-signature": "منتظر امضای تراکنش توی کیف‌پول…",
  confirming: "در حال تأیید روی زنجیره…",
  done: "دیپلوی موفق!",
  error: "مشکلی پیش اومد"
};

export function LaunchForm() {
  const { isConnected } = useAccount();
  const [network, setNetwork] = useState<LaunchNetwork>("testnet");
  const { onSupportedChain, chainId } = useNetworkGuard();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [supplyCap, setSupplyCap] = useState("");
  const [noCap, setNoCap] = useState(true);
  const [initialMint, setInitialMint] = useState("");
  const [logo, setLogo] = useState<IpfsUploadResult | null>(null);

  const activeChainId = network === "mainnet" ? base.id : baseSepolia.id;
  const { launch, stage, error, tokenAddress, txHash, launcherAddress } = useLaunchToken(activeChainId);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 1 || name.trim().length > 40) e.name = "بین ۱ تا ۴۰ کاراکتر.";
    if (!/^[A-Za-z0-9]{2,11}$/.test(symbol.trim())) e.symbol = "۲ تا ۱۱ حرف/عدد انگلیسی، بدون فاصله.";
    if (decimals < 6 || decimals > 18) e.decimals = "بین ۶ تا ۱۸.";
    if (!noCap && !isValidQuantityInput(supplyCap, decimals)) e.supplyCap = "یک عدد معتبر بنویس.";
    if (initialMint.trim() !== "" && !isValidQuantityInput(initialMint, decimals)) e.initialMint = "یک عدد معتبر بنویس.";
    if (!noCap && initialMint.trim() !== "" && isValidQuantityInput(supplyCap, decimals) && isValidQuantityInput(initialMint, decimals)) {
      if (toBaseUnits(initialMint, decimals) > toBaseUnits(supplyCap, decimals)) {
        e.initialMint = "نمی‌تونه از سقف عرضه بیشتر باشه.";
      }
    }
    return e;
  }, [name, symbol, decimals, supplyCap, noCap, initialMint]);

  const formValid = Object.keys(errors).length === 0 && name && symbol;
  const canSubmit = formValid && isConnected && onSupportedChain && stage !== "confirming" && stage !== "awaiting-signature";

  async function handleSubmit() {
    if (!isConnected) {
      toast.error("اول کیف‌پولت رو وصل کن.");
      return;
    }
    if (!onSupportedChain) {
      toast.error("اول باید روی Base مین‌نت یا تست‌نت سوییچ کنی.");
      return;
    }
    if (!launcherAddress) {
      toast.error("آدرس قرارداد لانچر برای این شبکه تنظیم نشده.");
      return;
    }

    const supplyCapUnits = noCap ? (2n ** 128n - 1n) : toBaseUnits(supplyCap, decimals);
    const initialMintUnits = initialMint.trim() === "" ? 0n : toBaseUnits(initialMint, decimals);

    try {
      // Pin metadata (name/symbol/logo) alongside the token — best-effort, never blocks deploy.
      if (logo) {
        uploadMetadataToIpfs({
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          decimals,
          image: logo.uri
        }).catch(() => {});
      }

      const result = await launch({
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        decimals,
        supplyCapBaseUnits: supplyCapUnits,
        initialMintBaseUnits: initialMintUnits
      });
      toast.success("تراکنش تأیید شد!");
      void result;
    } catch {
      // error surfaced via `error` state below
    }
  }

  const meta = CHAIN_META[activeChainId];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-forge-line bg-forge-panel/70 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-8">
        <AnimatePresence mode="wait">
          {stage === "done" && tokenAddress ? (
            <SuccessPanel tokenAddress={tokenAddress} txHash={txHash} name={name} symbol={symbol} meta={meta} />
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <NetworkPicker selected={network} onSelect={setNetwork} />

              <Field label="اسم توکن" error={errors.name} hint="مثلا «My Onixia Token»">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="My Onixia Token"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="نماد" error={errors.symbol} hint="مثلا ONX">
                  <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    maxLength={11}
                    placeholder="ONX"
                    className="input tabular"
                    dir="ltr"
                  />
                </Field>
                <Field label="اعشار (Decimals)" error={errors.decimals} hint="۶ تا ۱۸، پیش‌فرض ۱۸">
                  <input
                    type="number"
                    min={6}
                    max={18}
                    value={decimals}
                    onChange={(e) => setDecimals(Math.max(6, Math.min(18, Number(e.target.value) || 18)))}
                    className="input tabular"
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field
                label="سقف عرضه کل (Supply Cap)"
                error={errors.supplyCap}
                hint={noCap ? "بدون سقف — هر مقدار قابل mint هست" : "دقیقاً همین تعداد واحد کامل توکن"}
                action={
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-forge-faint">
                    <input type="checkbox" checked={noCap} onChange={(e) => setNoCap(e.target.checked)} />
                    بدون سقف
                  </label>
                }
              >
                <input
                  value={noCap ? "" : supplyCap}
                  onChange={(e) => setSupplyCap(e.target.value.replace(/[^\d.]/g, ""))}
                  disabled={noCap}
                  placeholder={noCap ? "نامحدود" : "1000000"}
                  className="input tabular disabled:opacity-40"
                  dir="ltr"
                  inputMode="decimal"
                />
                {supplyCap && !noCap && isValidQuantityInput(supplyCap, decimals) && (
                  <p className="mt-1 text-xs text-forge-faint">
                    یعنی دقیقاً <span className="text-forge-ink">{formatDisplay(supplyCap)}</span> توکن کامل.
                  </p>
                )}
              </Field>

              <Field
                label="مقدار Mint اولیه"
                error={errors.initialMint}
                hint="به کیف‌پول خودت — می‌تونی صفر بذاری"
              >
                <input
                  value={initialMint}
                  onChange={(e) => setInitialMint(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="1000"
                  className="input tabular"
                  dir="ltr"
                  inputMode="decimal"
                />
                {initialMint && isValidQuantityInput(initialMint, decimals) && (
                  <p className="mt-1 text-xs text-forge-faint">
                    یعنی دقیقاً <span className="text-forge-ink">{formatDisplay(initialMint)}</span> توکن کامل به آدرس تو mint می‌شه.
                  </p>
                )}
              </Field>

              <LogoUploader onUploaded={setLogo} />

              <button
                onClick={handleSubmit}
                disabled={!canSubmit && stage !== "error"}
                className="relative w-full overflow-hidden rounded-xl bg-forge-blue py-4 font-display text-sm font-bold text-white transition-transform enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {stage === "idle" || stage === "error" || stage === "done"
                  ? `دیپلوی روی ${meta.shortLabel}`
                  : STAGE_LABEL[stage]}
                {(stage === "awaiting-signature" || stage === "confirming" || stage === "checking-feature" || stage === "deriving-salt") && (
                  <motion.span
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </button>

              {!isConnected && (
                <p className="text-center text-xs text-forge-faint">برای دیپلوی، اول کیف‌پولت رو وصل کن.</p>
              )}
              {isConnected && !onSupportedChain && (
                <p className="text-center text-xs text-forge-amber">
                  فقط روی Base مین‌نت یا تست‌نت می‌تونی دیپلوی کنی — بالا انتخاب کن.
                </p>
              )}
              {stage === "error" && error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-forge-crimson/40 bg-forge-crimson/10 p-3 text-center text-xs text-forge-crimson"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  action,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="font-display text-sm font-semibold text-forge-ink">{label}</label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-forge-crimson">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-forge-faint">{hint}</p>
      ) : null}
    </div>
  );
}

function SuccessPanel({
  tokenAddress,
  txHash,
  name,
  symbol,
  meta
}: {
  tokenAddress: string;
  txHash: string | null;
  name: string;
  symbol: string;
  meta: (typeof CHAIN_META)[keyof typeof CHAIN_META];
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-4 text-center"
    >
      <motion.div
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-forge-mint/15 animate-stampin"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#00E6A0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 className="font-display text-xl font-bold">
        {name} (<span className="tabular">{symbol}</span>) دیپلوی شد!
      </h3>
      <p className="mt-1 text-sm text-forge-faint">روی {meta.label}</p>

      <div className="mx-auto mt-6 max-w-md space-y-2 rounded-xl border border-forge-line bg-forge-bg/60 p-4 text-right">
        <Row label="آدرس توکن" value={tokenAddress} href={`${meta.explorer}/token/${tokenAddress}`} />
        {txHash && <Row label="تراکنش" value={txHash} href={`${meta.explorer}/tx/${txHash}`} />}
      </div>

      <a
        href={`${meta.explorer}/token/${tokenAddress}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block rounded-xl bg-forge-blue px-6 py-3 font-display text-sm font-semibold text-white"
      >
        دیدن توکن روی {meta.explorer.includes("sepolia") ? "Basescan (تست‌نت)" : "Basescan"}
      </a>
    </motion.div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="shrink-0 text-forge-faint">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="truncate font-mono text-forge-blue tabular" dir="ltr">
        {value}
      </a>
    </div>
  );
}
