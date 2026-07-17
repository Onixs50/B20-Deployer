import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { robinhoodChain, robinhoodChainTestnet, RH_CHAIN_META } from "../../lib/robinhoodChain";
import { useRHNetworkGuard, type RHNetwork } from "../../hooks/useRHNetworkGuard";
import { useLaunchRHToken } from "../../hooks/useLaunchRHToken";
import { isValidQuantityInput, toBaseUnits, formatDisplay } from "../../lib/amounts";
import { addDeployedRHAsset } from "../../lib/rhHistory";
import { useLang } from "../../lib/i18n";
import { RHNetworkPicker } from "./RHNetworkPicker";
import { RHTokenManagerPanel } from "./RHTokenManagerPanel";
import type { Address } from "viem";

const L = {
  name: { fa: "اسم توکن", en: "Token name" },
  nameHint: { fa: 'مثلا «My Robinhood Token»', en: 'e.g. "My Robinhood Token"' },
  nameErr: { fa: "بین ۱ تا ۴۰ کاراکتر.", en: "Must be 1–40 characters." },
  symbol: { fa: "نماد", en: "Symbol" },
  symbolHint: { fa: "۲ تا ۱۱ حرف/عدد انگلیسی", en: "2–11 letters/numbers" },
  symbolErr: { fa: "۲ تا ۱۱ حرف یا عدد انگلیسی.", en: "2–11 English letters/numbers." },
  decimals: { fa: "اعشار", en: "Decimals" },
  decimalsHint: { fa: "معمولاً ۱۸", en: "usually 18" },
  decimalsErr: { fa: "بین ۶ تا ۱۸.", en: "Must be 6–18." },
  mint: { fa: "مقدار اولیه (اختیاری)", en: "Initial mint (optional)" },
  mintHint: { fa: "همون لحظه به کیف‌پولت mint می‌شه. بعداً هم هر وقت خواستی می‌تونی mint کنی.", en: "Minted straight to your wallet at creation. You can mint more anytime after too." },
  mintErr: { fa: "یک عدد معتبر بده.", en: "Enter a valid amount." },
  mintResult: { fa: "mint اولیه:", en: "Initial mint:" },
  submit: { fa: "دیپلوی توکن روی", en: "Deploy token on" },
  needWallet: { fa: "برای دیپلوی، اول کیف‌پولت رو وصل کن.", en: "Connect your wallet to deploy." },
  needNetwork: { fa: "اول کیف‌پولت رو به شبکه‌ی درست وصل کن.", en: "Switch your wallet to the right network first." },
  stageSign: { fa: "منتظر امضا…", en: "Awaiting signature…" },
  stageConfirm: { fa: "در حال تایید…", en: "Confirming…" },
  stageDone: { fa: "ساخته شد!", en: "Deployed!" },
  successOn: { fa: "روی", en: "on" },
  addr: { fa: "آدرس قرارداد", en: "Contract address" },
  tx: { fa: "تراکنش", en: "Transaction" },
  view: { fa: "دیدن روی", en: "View on" },
  manageOpen: { fa: "مدیریت توکن", en: "Manage token" },
  manageClose: { fa: "بستن مدیریت", en: "Close manager" },
  again: { fa: "یکی دیگه بساز", en: "Deploy another" },
  toastOk: { fa: "تراکنش با موفقیت تایید شد.", en: "Transaction confirmed." }
};

const emptyForm = { name: "", symbol: "", decimals: 18, initialMint: "" };

export function RHTokenForm({ onDeployed }: { onDeployed?: () => void }) {
  const { lang } = useLang();
  const { isConnected, address } = useAccount();
  const [network, setNetwork] = useState<RHNetwork>("testnet");
  const { onRobinhoodChain } = useRHNetworkGuard();

  const [form, setForm] = useState(emptyForm);
  const { name, symbol, decimals, initialMint } = form;

  const activeChainId = network === "mainnet" ? robinhoodChain.id : robinhoodChainTestnet.id;
  const { launch, reset, stage, error, tokenAddress, txHash, factoryAddress } = useLaunchRHToken(activeChainId);

  useEffect(() => {
    if (stage === "done" && tokenAddress && address) {
      addDeployedRHAsset({
        address: tokenAddress,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        chainId: activeChainId,
        txHash,
        deployer: address,
        timestamp: Date.now()
      });
      onDeployed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, tokenAddress]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 1 || name.trim().length > 40) e.name = L.nameErr[lang];
    if (!/^[A-Za-z0-9]{2,11}$/.test(symbol.trim())) e.symbol = L.symbolErr[lang];
    if (decimals < 6 || decimals > 18) e.decimals = L.decimalsErr[lang];
    if (initialMint.trim() !== "" && !isValidQuantityInput(initialMint, decimals)) e.initialMint = L.mintErr[lang];
    return e;
  }, [name, symbol, decimals, initialMint, lang]);

  const formValid = Object.keys(errors).length === 0 && name && symbol;
  const canSubmit = formValid && isConnected && onRobinhoodChain && stage !== "confirming" && stage !== "awaiting-signature";

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startFresh() {
    setForm(emptyForm);
    reset();
  }

  async function handleSubmit() {
    if (!isConnected) return toast.error(L.needWallet[lang]);
    if (!onRobinhoodChain) return toast.error(L.needNetwork[lang]);
    if (!factoryAddress) return toast.error(lang === "fa" ? "آدرس RHFactory تنظیم نشده." : "RHFactory address is not configured.");

    const mintUnits = initialMint.trim() === "" ? 0n : toBaseUnits(initialMint, decimals);

    try {
      await launch({ name: name.trim(), symbol: symbol.trim().toUpperCase(), decimals, initialMintBaseUnits: mintUnits });
      toast.success(L.toastOk[lang]);
    } catch {
      // surfaced via `error` state
    }
  }

  const meta = RH_CHAIN_META[activeChainId as 4663 | 46630];

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div layout className="rounded-3xl border border-rh-line bg-rh-panel/70 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-8">
        <AnimatePresence mode="wait">
          {stage === "done" && tokenAddress ? (
            <TokenSuccessPanel
              key="success"
              tokenAddress={tokenAddress}
              chainId={activeChainId}
              txHash={txHash}
              name={name}
              symbol={symbol}
              meta={meta}
              onAgain={startFresh}
            />
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <RHNetworkPicker selected={network} onSelect={setNetwork} />

              <Field label={L.name[lang]} error={errors.name} hint={L.nameHint[lang]}>
                <input value={name} onChange={(e) => set("name", e.target.value)} maxLength={40} placeholder="My Robinhood Token" className="rh-input" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={L.symbol[lang]} error={errors.symbol} hint={L.symbolHint[lang]}>
                  <input
                    value={symbol}
                    onChange={(e) => set("symbol", e.target.value.toUpperCase())}
                    maxLength={11}
                    placeholder="RHX"
                    className="rh-input tabular"
                    dir="ltr"
                  />
                </Field>
                <Field label={L.decimals[lang]} error={errors.decimals} hint={L.decimalsHint[lang]}>
                  <input
                    type="number"
                    min={6}
                    max={18}
                    value={decimals}
                    onChange={(e) => set("decimals", Math.max(6, Math.min(18, Number(e.target.value) || 18)))}
                    className="rh-input tabular"
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field label={L.mint[lang]} error={errors.initialMint} hint={L.mintHint[lang]}>
                <input
                  value={initialMint}
                  onChange={(e) => set("initialMint", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="1000"
                  className="rh-input tabular"
                  dir="ltr"
                  inputMode="decimal"
                />
                {initialMint && isValidQuantityInput(initialMint, decimals) && (
                  <p className="mt-1 text-xs text-rh-faint">
                    {L.mintResult[lang]} <span className="text-rh-ink">{formatDisplay(initialMint)}</span>
                  </p>
                )}
              </Field>

              <motion.button
                whileTap={canSubmit ? { scale: 0.985 } : undefined}
                onClick={handleSubmit}
                disabled={!canSubmit && stage !== "error"}
                className="relative w-full overflow-hidden rounded-xl bg-rh-yellow py-4 font-display text-sm font-bold text-rh-black transition-transform enabled:hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {stage === "idle" || stage === "error" || stage === "done" ? `${L.submit[lang]} ${meta.shortLabel}` : stage === "awaiting-signature" ? L.stageSign[lang] : L.stageConfirm[lang]}
                {(stage === "awaiting-signature" || stage === "confirming") && (
                  <motion.span className="absolute inset-0 bg-black/10" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
                )}
              </motion.button>

              {!isConnected && <p className="text-center text-xs text-rh-faint">{L.needWallet[lang]}</p>}
              {isConnected && !onRobinhoodChain && <p className="text-center text-xs text-rh-yellow">{L.needNetwork[lang]}</p>}
              {stage === "error" && error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-center text-xs text-red-400">
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
        <label className="font-display text-sm font-semibold text-rh-ink">{label}</label>
        {action}
      </div>
      {children}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : hint ? <p className="mt-1 text-xs text-rh-faint">{hint}</p> : null}
    </div>
  );
}

function TokenSuccessPanel({
  tokenAddress,
  chainId,
  txHash,
  name,
  symbol,
  meta,
  onAgain
}: {
  tokenAddress: string;
  chainId: number;
  txHash: string | null;
  name: string;
  symbol: string;
  meta: (typeof RH_CHAIN_META)[keyof typeof RH_CHAIN_META];
  onAgain: () => void;
}) {
  const { lang } = useLang();
  const [showManager, setShowManager] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
      <motion.div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rh-yellow/15 animate-stampin">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#FFDE59" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 className="font-display text-xl font-bold text-rh-ink">
        {name} (<span className="tabular">{symbol}</span>) {L.stageDone[lang]}
      </h3>
      <p className="mt-1 text-sm text-rh-faint">
        {L.successOn[lang]} {meta.label}
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-2 rounded-xl border border-rh-line bg-rh-black/50 p-4 text-right">
        <Row label={L.addr[lang]} value={tokenAddress} href={`${meta.explorer}/address/${tokenAddress}`} />
        {txHash && <Row label={L.tx[lang]} value={txHash} href={`${meta.explorer}/tx/${txHash}`} />}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`${meta.explorer}/address/${tokenAddress}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-xl bg-rh-yellow px-6 py-3 font-display text-sm font-semibold text-rh-black transition-transform hover:scale-[1.02]"
        >
          {L.view[lang]} Blockscout
        </a>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowManager((v) => !v)}
          className="inline-block rounded-xl bg-rh-yellow/15 px-6 py-3 font-display text-sm font-semibold text-rh-yellow transition-transform hover:scale-[1.02]"
        >
          {showManager ? L.manageClose[lang] : L.manageOpen[lang]}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAgain}
          className="inline-block rounded-xl border border-rh-line px-6 py-3 font-display text-sm font-semibold text-rh-ink transition-colors hover:border-rh-yellow"
        >
          {L.again[lang]}
        </motion.button>
      </div>

      {showManager && <RHTokenManagerPanel tokenAddress={tokenAddress as Address} chainId={chainId} />}
    </motion.div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="shrink-0 text-rh-faint">{label}</span>
      <a href={href} target="_blank" rel="noreferrer" className="truncate font-mono text-rh-yellow tabular" dir="ltr">
        {value}
      </a>
    </div>
  );
}
