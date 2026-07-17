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
  notOwner: { fa: "کیف‌پول متصل مالک این توکن نیست — mint فقط برای مالک فعاله. burn و ارسال برای همه بازه.", en: "The connected wallet isn't the owner — mint is owner-only. Burn and transfer are open to any holder." },
  supply: { fa: "کل عرضه", en: "Total supply" },
  myBalance: { fa: "موجودی من", en: "My balance" },
  tabMint: { fa: "Mint", en: "Mint" },
  tabBurn: { fa: "Burn", en: "Burn" },
  tabTransfer: { fa: "ارسال", en: "Transfer" },
  to: { fa: "آدرس گیرنده", en: "Recipient address" },
  amount: { fa: "مقدار", en: "Amount" },
  submitMint: { fa: "Mint کن", en: "Mint" },
  submitBurn: { fa: "Burn کن", en: "Burn" },
  submitTransfer: { fa: "ارسال کن", en: "Send" },
  ok: { fa: "انجام شد.", en: "Done." }
};

export function RHTokenManagerPanel({ tokenAddress, chainId }: { tokenAddress: Address; chainId: number }) {
  const { lang } = useLang();
  const { info, loadingInfo, mint, burn, transfer, txState } = useRHTokenManager(tokenAddress, chainId);
  const [tab, setTab] = useState<"mint" | "burn" | "transfer">("mint");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  if (loadingInfo || !info) {
    return <p className="mt-6 text-center text-sm text-rh-faint">{L.loading[lang]}</p>;
  }

  const busy = txState === "awaiting-signature" || txState === "confirming";
  const tabs: { id: typeof tab; label: string }[] = info.isOwner
    ? [
        { id: "mint", label: L.tabMint[lang] },
        { id: "burn", label: L.tabBurn[lang] },
        { id: "transfer", label: L.tabTransfer[lang] }
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
          {L.myBalance[lang]}: <span className="text-rh-ink tabular">{fromBaseUnits(info.myBalance, info.decimals)}</span>
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
    </motion.div>
  );
}
