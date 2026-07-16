import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { Address } from "viem";
import { isAddress } from "viem";
import { useRHTokenManager } from "../../hooks/useRHTokenManager";
import { isValidQuantityInput, toBaseUnits, fromBaseUnits } from "../../lib/amounts";
import { useLang } from "../../lib/i18n";

const L = {
  loading: { fa: "در حال خوندن اطلاعات توکن…", en: "Loading token info…" },
  notOwner: { fa: "کیف‌پول متصل مالک این توکن نیست — mint/burn/pause فقط برای مالک فعاله.", en: "The connected wallet isn't the owner — mint/burn/pause/ownership actions are owner-only." },
  supply: { fa: "کل عرضه", en: "Total supply" },
  cap: { fa: "سقف", en: "Cap" },
  uncapped: { fa: "بدون سقف", en: "Uncapped" },
  myBalance: { fa: "موجودی من", en: "My balance" },
  paused: { fa: "متوقف‌شده", en: "Paused" },
  active: { fa: "فعال", en: "Active" },
  tabMint: { fa: "Mint", en: "Mint" },
  tabBurn: { fa: "Burn", en: "Burn" },
  tabTransfer: { fa: "ارسال", en: "Transfer" },
  tabPause: { fa: "توقف", en: "Pause" },
  tabOwner: { fa: "مالکیت", en: "Ownership" },
  to: { fa: "آدرس گیرنده", en: "Recipient address" },
  amount: { fa: "مقدار", en: "Amount" },
  submitMint: { fa: "Mint کن", en: "Mint" },
  submitBurn: { fa: "Burn کن", en: "Burn" },
  submitTransfer: { fa: "ارسال کن", en: "Send" },
  pauseNow: { fa: "متوقف کن", en: "Pause" },
  unpauseNow: { fa: "دوباره فعال کن", en: "Unpause" },
  newOwner: { fa: "مالک جدید", en: "New owner" },
  submitOwner: { fa: "انتقال مالکیت", en: "Transfer ownership" },
  ownerWarn: { fa: "این کار برگشت‌ناپذیره — مالکیت کامل قرارداد میره به آدرس جدید.", en: "This is irreversible — full contract ownership moves to the new address." },
  invalidAddr: { fa: "آدرس معتبر نیست.", en: "Not a valid address." },
  invalidAmount: { fa: "مقدار معتبر نیست.", en: "Not a valid amount." },
  ok: { fa: "انجام شد.", en: "Done." }
};

export function RHTokenManagerPanel({ tokenAddress, chainId }: { tokenAddress: Address; chainId: number }) {
  const { lang } = useLang();
  const { info, loadingInfo, mint, burn, transfer, setPaused, transferOwnership, txState } = useRHTokenManager(tokenAddress, chainId);
  const [tab, setTab] = useState<"mint" | "burn" | "transfer" | "pause" | "owner">("mint");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");

  if (loadingInfo || !info) {
    return <p className="mt-6 text-center text-sm text-rh-faint">{L.loading[lang]}</p>;
  }

  const busy = txState === "awaiting-signature" || txState === "confirming";
  const tabs: { id: typeof tab; label: string }[] = info.isOwner
    ? [
        { id: "mint", label: L.tabMint[lang] },
        { id: "burn", label: L.tabBurn[lang] },
        { id: "transfer", label: L.tabTransfer[lang] },
        { id: "pause", label: L.tabPause[lang] },
        { id: "owner", label: L.tabOwner[lang] }
      ]
    : [
        { id: "burn", label: L.tabBurn[lang] },
        { id: "transfer", label: L.tabTransfer[lang] }
      ];

  async function run(fn: () => Promise<unknown>) {
    try {
      await fn();
      toast.success(L.ok[lang]);
      setAmount("");
      setTo("");
      setNewOwner("");
    } catch (e) {
      toast.error((e as Error)?.message ?? String(e));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 max-w-md rounded-2xl border border-rh-line bg-rh-black/40 p-5 text-right">
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-rh-faint">
        <span>
          {L.supply[lang]}: <span className="text-rh-ink tabular">{fromBaseUnits(info.totalSupply, info.decimals)}</span>
        </span>
        <span>
          {L.cap[lang]}: <span className="text-rh-ink tabular">{info.cap ? fromBaseUnits(info.cap, info.decimals) : L.uncapped[lang]}</span>
        </span>
        <span>
          {L.myBalance[lang]}: <span className="text-rh-ink tabular">{fromBaseUnits(info.myBalance, info.decimals)}</span>
        </span>
        <span>
          {info.paused ? L.paused[lang] : L.active[lang]}
        </span>
      </div>

      {!info.isOwner && <p className="mb-3 rounded-lg border border-rh-yellow/30 bg-rh-yellow/10 p-2.5 text-xs text-rh-yellow">{L.notOwner[lang]}</p>}

      <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-rh-line bg-rh-panel/50 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === tb.id ? "bg-rh-yellow text-rh-black" : "text-rh-faint hover:text-rh-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "mint" && (
        <div className="space-y-3">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={L.to[lang]} className="rh-input tabular" dir="ltr" />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder={L.amount[lang]} className="rh-input tabular" dir="ltr" inputMode="decimal" />
          <button
            disabled={busy || !isAddress(to) || !isValidQuantityInput(amount, info.decimals)}
            onClick={() => run(() => mint(to as Address, toBaseUnits(amount, info.decimals)))}
            className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
          >
            {L.submitMint[lang]}
          </button>
        </div>
      )}

      {tab === "burn" && (
        <div className="space-y-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder={L.amount[lang]} className="rh-input tabular" dir="ltr" inputMode="decimal" />
          <button
            disabled={busy || !isValidQuantityInput(amount, info.decimals)}
            onClick={() => run(() => burn(toBaseUnits(amount, info.decimals)))}
            className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
          >
            {L.submitBurn[lang]}
          </button>
        </div>
      )}

      {tab === "transfer" && (
        <div className="space-y-3">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={L.to[lang]} className="rh-input tabular" dir="ltr" />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder={L.amount[lang]} className="rh-input tabular" dir="ltr" inputMode="decimal" />
          <button
            disabled={busy || !isAddress(to) || !isValidQuantityInput(amount, info.decimals)}
            onClick={() => run(() => transfer(to as Address, toBaseUnits(amount, info.decimals)))}
            className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
          >
            {L.submitTransfer[lang]}
          </button>
        </div>
      )}

      {tab === "pause" && (
        <button
          disabled={busy}
          onClick={() => run(() => setPaused(!info.paused))}
          className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
        >
          {info.paused ? L.unpauseNow[lang] : L.pauseNow[lang]}
        </button>
      )}

      {tab === "owner" && (
        <div className="space-y-3">
          <p className="text-xs text-rh-yellow">{L.ownerWarn[lang]}</p>
          <input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder={L.newOwner[lang]} className="rh-input tabular" dir="ltr" />
          <button
            disabled={busy || !isAddress(newOwner)}
            onClick={() => run(() => transferOwnership(newOwner as Address))}
            className="w-full rounded-xl border border-rh-yellow/50 py-3 font-display text-sm font-bold text-rh-yellow disabled:opacity-40"
          >
            {L.submitOwner[lang]}
          </button>
        </div>
      )}
    </motion.div>
  );
}
