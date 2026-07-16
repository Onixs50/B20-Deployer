import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { isAddress, parseEther } from "viem";
import type { Address } from "viem";
import { robinhoodChain, robinhoodChainTestnet, RH_CHAIN_META } from "../../lib/robinhoodChain";
import { useRHNetworkGuard, type RHNetwork } from "../../hooks/useRHNetworkGuard";
import { useLaunchRHNFT } from "../../hooks/useLaunchRHNFT";
import { addDeployedRHAsset } from "../../lib/rhHistory";
import { useLang } from "../../lib/i18n";
import { RHNetworkPicker } from "./RHNetworkPicker";
import { RHNFTManagerPanel } from "./RHNFTManagerPanel";

const L = {
  name: { fa: "اسم مجموعه", en: "Collection name" },
  nameHint: { fa: 'مثلا «Robinhood Feathers»', en: 'e.g. "Robinhood Feathers"' },
  nameErr: { fa: "بین ۱ تا ۴۰ کاراکتر.", en: "Must be 1–40 characters." },
  symbol: { fa: "نماد", en: "Symbol" },
  symbolHint: { fa: "۲ تا ۱۱ حرف/عدد انگلیسی", en: "2–11 letters/numbers" },
  symbolErr: { fa: "۲ تا ۱۱ حرف یا عدد انگلیسی.", en: "2–11 English letters/numbers." },
  baseURI: { fa: "آدرس متادیتا", en: "Metadata URI" },
  baseURIHintFolder: { fa: "یک پوشه‌ی IPFS که آخرش «/» داره و شامل 1.json، 2.json و... ـه.", en: "An IPFS folder ending in \"/\" containing 1.json, 2.json, etc." },
  baseURIHintShared: { fa: "یک فایل JSON متادیتای واحد که همه‌ی NFTها باهم شریکش می‌شن (برای درآپ‌های ساده مثل ممبرشیپ پس).", en: "One shared metadata JSON file every NFT points to (simplest for membership-pass style drops)." },
  baseURIErr: { fa: "این فیلد رو پر کن.", en: "This field is required." },
  folderModeToggle: { fa: "هر توکن متادیتای جدا داره (کالکشن واقعی)", en: "Each token has its own metadata (real collection)" },
  maxSupply: { fa: "سقف تعداد", en: "Max supply" },
  maxSupplyHintUncapped: { fa: "بدون سقف.", en: "Unlimited." },
  maxSupplyHintCapped: { fa: "بعد از این تعداد دیگه نمی‌شه mint کرد.", en: "No more minting once this count is hit." },
  maxSupplyErr: { fa: "یک عدد صحیح مثبت بده.", en: "Enter a positive whole number." },
  uncappedToggle: { fa: "بدون سقف", en: "Uncapped" },
  price: { fa: "قیمت هر mint (ETH)", en: "Price per mint (ETH)" },
  priceHint: { fa: "صفر بذار برای mint رایگان عمومی.", en: "Leave 0 for a free public mint." },
  priceErr: { fa: "یک عدد معتبر بده.", en: "Enter a valid amount." },
  royaltyReceiver: { fa: "گیرنده رویالتی (اختیاری)", en: "Royalty receiver (optional)" },
  royaltyReceiverHint: { fa: "خالی بذار یعنی رویالتی غیرفعاله.", en: "Leave empty to disable royalties." },
  royaltyBps: { fa: "درصد رویالتی", en: "Royalty %" },
  royaltyBpsHint: { fa: "حداکثر ۱۰٪.", en: "Max 10%." },
  submit: { fa: "دیپلوی NFT روی", en: "Deploy NFT on" },
  needWallet: { fa: "برای دیپلوی، اول کیف‌پولت رو وصل کن.", en: "Connect your wallet to deploy." },
  needNetwork: { fa: "اول کیف‌پولت رو به شبکه‌ی درست وصل کن.", en: "Switch your wallet to the right network first." },
  stageSign: { fa: "منتظر امضا…", en: "Awaiting signature…" },
  stageConfirm: { fa: "در حال تایید…", en: "Confirming…" },
  stageDone: { fa: "ساخته شد!", en: "Deployed!" },
  successOn: { fa: "روی", en: "on" },
  addr: { fa: "آدرس قرارداد", en: "Contract address" },
  tx: { fa: "تراکنش", en: "Transaction" },
  view: { fa: "دیدن روی", en: "View on" },
  manageOpen: { fa: "مدیریت مجموعه", en: "Manage collection" },
  manageClose: { fa: "بستن مدیریت", en: "Close manager" },
  again: { fa: "یکی دیگه بساز", en: "Deploy another" },
  toastOk: { fa: "تراکنش با موفقیت تایید شد.", en: "Transaction confirmed." }
};

const emptyForm = {
  name: "",
  symbol: "",
  baseURI: "",
  folderMode: false,
  maxSupply: "",
  noMaxSupply: true,
  priceEth: "0",
  royaltyReceiver: "",
  royaltyBps: "0"
};

export function RHNFTForm({ onDeployed }: { onDeployed?: () => void }) {
  const { lang } = useLang();
  const { isConnected, address } = useAccount();
  const [network, setNetwork] = useState<RHNetwork>("testnet");
  const { onRobinhoodChain } = useRHNetworkGuard();

  const [form, setForm] = useState(emptyForm);
  const { name, symbol, baseURI, folderMode, maxSupply, noMaxSupply, priceEth, royaltyReceiver, royaltyBps } = form;

  const activeChainId = network === "mainnet" ? robinhoodChain.id : robinhoodChainTestnet.id;
  const { launch, reset, stage, error, nftAddress, txHash, factoryAddress } = useLaunchRHNFT(activeChainId);

  useEffect(() => {
    if (stage === "done" && nftAddress && address) {
      addDeployedRHAsset({
        kind: "nft",
        address: nftAddress,
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
  }, [stage, nftAddress]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 1 || name.trim().length > 40) e.name = L.nameErr[lang];
    if (!/^[A-Za-z0-9]{2,11}$/.test(symbol.trim())) e.symbol = L.symbolErr[lang];
    if (baseURI.trim().length < 1) e.baseURI = L.baseURIErr[lang];
    if (!noMaxSupply && (!/^\d+$/.test(maxSupply.trim()) || Number(maxSupply) <= 0)) e.maxSupply = L.maxSupplyErr[lang];
    if (!/^\d*\.?\d*$/.test(priceEth.trim()) || priceEth.trim() === "") e.priceEth = L.priceErr[lang];
    if (royaltyReceiver.trim() !== "" && !isAddress(royaltyReceiver.trim())) e.royaltyReceiver = lang === "fa" ? "آدرس معتبر نیست." : "Not a valid address.";
    const bps = Number(royaltyBps);
    if (!Number.isFinite(bps) || bps < 0 || bps > 10) e.royaltyBps = lang === "fa" ? "بین ۰ تا ۱۰." : "Must be 0–10.";
    return e;
  }, [name, symbol, baseURI, noMaxSupply, maxSupply, priceEth, royaltyReceiver, royaltyBps, lang]);

  const formValid = Object.keys(errors).length === 0 && name && symbol && baseURI;
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

    try {
      await launch({
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        baseURI: baseURI.trim(),
        folderMode,
        maxSupply: noMaxSupply ? 0n : BigInt(maxSupply.trim()),
        mintPriceWei: parseEther(priceEth.trim() || "0"),
        royaltyReceiver: royaltyReceiver.trim() ? (royaltyReceiver.trim() as Address) : null,
        royaltyBps: Math.round(Number(royaltyBps) * 100)
      });
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
          {stage === "done" && nftAddress ? (
            <NFTSuccessPanel key="success" nftAddress={nftAddress} chainId={activeChainId} txHash={txHash} name={name} symbol={symbol} meta={meta} onAgain={startFresh} />
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <RHNetworkPicker selected={network} onSelect={setNetwork} />

              <Field label={L.name[lang]} error={errors.name} hint={L.nameHint[lang]}>
                <input value={name} onChange={(e) => set("name", e.target.value)} maxLength={40} placeholder="Robinhood Feathers" className="rh-input" />
              </Field>

              <Field label={L.symbol[lang]} error={errors.symbol} hint={L.symbolHint[lang]}>
                <input value={symbol} onChange={(e) => set("symbol", e.target.value.toUpperCase())} maxLength={11} placeholder="RHFTH" className="rh-input tabular" dir="ltr" />
              </Field>

              <Field
                label={L.baseURI[lang]}
                error={errors.baseURI}
                hint={folderMode ? L.baseURIHintFolder[lang] : L.baseURIHintShared[lang]}
                action={
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-rh-faint">
                    <input type="checkbox" checked={folderMode} onChange={(e) => set("folderMode", e.target.checked)} />
                    {L.folderModeToggle[lang]}
                  </label>
                }
              >
                <input
                  value={baseURI}
                  onChange={(e) => set("baseURI", e.target.value)}
                  placeholder={folderMode ? "ipfs://bafybe.../" : "ipfs://bafybe.../metadata.json"}
                  className="rh-input tabular"
                  dir="ltr"
                />
              </Field>

              <Field
                label={L.maxSupply[lang]}
                error={errors.maxSupply}
                hint={noMaxSupply ? L.maxSupplyHintUncapped[lang] : L.maxSupplyHintCapped[lang]}
                action={
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-rh-faint">
                    <input type="checkbox" checked={noMaxSupply} onChange={(e) => set("noMaxSupply", e.target.checked)} />
                    {L.uncappedToggle[lang]}
                  </label>
                }
              >
                <input
                  value={noMaxSupply ? "" : maxSupply}
                  onChange={(e) => set("maxSupply", e.target.value.replace(/[^\d]/g, ""))}
                  disabled={noMaxSupply}
                  placeholder={noMaxSupply ? "∞" : "10000"}
                  className="rh-input tabular disabled:opacity-40"
                  dir="ltr"
                  inputMode="numeric"
                />
              </Field>

              <Field label={L.price[lang]} error={errors.priceEth} hint={L.priceHint[lang]}>
                <input value={priceEth} onChange={(e) => set("priceEth", e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className="rh-input tabular" dir="ltr" inputMode="decimal" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={L.royaltyReceiver[lang]} error={errors.royaltyReceiver} hint={L.royaltyReceiverHint[lang]}>
                  <input value={royaltyReceiver} onChange={(e) => set("royaltyReceiver", e.target.value)} placeholder="0x…" className="rh-input tabular" dir="ltr" />
                </Field>
                <Field label={L.royaltyBps[lang]} error={errors.royaltyBps} hint={L.royaltyBpsHint[lang]}>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={royaltyBps}
                    onChange={(e) => set("royaltyBps", e.target.value)}
                    className="rh-input tabular"
                    dir="ltr"
                  />
                </Field>
              </div>

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

function NFTSuccessPanel({
  nftAddress,
  chainId,
  txHash,
  name,
  symbol,
  meta,
  onAgain
}: {
  nftAddress: string;
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
        <Row label={L.addr[lang]} value={nftAddress} href={`${meta.explorer}/address/${nftAddress}`} />
        {txHash && <Row label={L.tx[lang]} value={txHash} href={`${meta.explorer}/tx/${txHash}`} />}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`${meta.explorer}/address/${nftAddress}`}
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

      {showManager && <RHNFTManagerPanel nftAddress={nftAddress as Address} chainId={chainId} />}
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
