import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { Address } from "viem";
import { isAddress, parseEther, formatEther } from "viem";
import { useRHNFTManager } from "../../hooks/useRHNFTManager";
import { useLang } from "../../lib/i18n";

const L = {
  loading: { fa: "در حال خوندن اطلاعات مجموعه…", en: "Loading collection info…" },
  notOwner: { fa: "کیف‌پول متصل مالک این مجموعه نیست — بخش‌های مدیریتی فقط برای مالک فعاله. mint عمومی برای همه بازه.", en: "The connected wallet isn't the owner — management actions are owner-only. Public mint is open to everyone." },
  minted: { fa: "تعداد mint‌شده", en: "Minted so far" },
  maxSupply: { fa: "سقف", en: "Max supply" },
  uncapped: { fa: "بدون سقف", en: "Uncapped" },
  price: { fa: "قیمت هر mint", en: "Price per mint" },
  free: { fa: "رایگان", en: "Free" },
  paused: { fa: "متوقف‌شده", en: "Paused" },
  active: { fa: "فعال", en: "Active" },
  tabMint: { fa: "Mint عمومی", en: "Public mint" },
  tabAirdrop: { fa: "Airdrop", en: "Airdrop" },
  tabSettings: { fa: "تنظیمات", en: "Settings" },
  tabPause: { fa: "توقف", en: "Pause" },
  tabWithdraw: { fa: "برداشت", en: "Withdraw" },
  quantity: { fa: "تعداد", en: "Quantity" },
  submitMint: { fa: "Mint کن", en: "Mint" },
  to: { fa: "آدرس گیرنده", en: "Recipient address" },
  submitAirdrop: { fa: "Airdrop رایگان بفرست", en: "Send free airdrop" },
  newBaseURI: { fa: "آدرس متادیتای جدید", en: "New metadata URI" },
  submitBaseURI: { fa: "بروزرسانی متادیتا", en: "Update metadata" },
  newPrice: { fa: "قیمت جدید هر mint (ETH)", en: "New price per mint (ETH)" },
  submitPrice: { fa: "بروزرسانی قیمت", en: "Update price" },
  royaltyReceiver: { fa: "گیرنده رویالتی", en: "Royalty receiver" },
  royaltyBps: { fa: "درصد رویالتی", en: "Royalty %" },
  submitRoyalty: { fa: "بروزرسانی رویالتی", en: "Update royalty" },
  pauseNow: { fa: "متوقف کن", en: "Pause" },
  unpauseNow: { fa: "دوباره فعال کن", en: "Unpause" },
  withdrawAll: { fa: "برداشت کل موجودی ETH", en: "Withdraw all ETH balance" },
  ok: { fa: "انجام شد.", en: "Done." },
  soldOut: { fa: "به سقف تعداد رسیده.", en: "Sold out." }
};

export function RHNFTManagerPanel({ nftAddress, chainId }: { nftAddress: Address; chainId: number }) {
  const { lang } = useLang();
  const { info, loadingInfo, mintPublic, ownerMint, setBaseURI, setMintPrice, setRoyalty, withdraw, setPaused, txState } = useRHNFTManager(nftAddress, chainId);
  const [tab, setTab] = useState<"mint" | "airdrop" | "settings" | "pause" | "withdraw">("mint");
  const [quantity, setQuantity] = useState("1");
  const [to, setTo] = useState("");
  const [newBaseURI, setNewBaseURI] = useState("");
  const [newPriceEth, setNewPriceEth] = useState("0");
  const [royaltyReceiver, setRoyaltyReceiver] = useState("");
  const [royaltyBps, setRoyaltyBps] = useState("0");

  if (loadingInfo || !info) {
    return <p className="mt-6 text-center text-sm text-rh-faint">{L.loading[lang]}</p>;
  }

  const busy = txState === "awaiting-signature" || txState === "confirming";
  const soldOut = info.maxSupply !== null && info.totalMinted >= info.maxSupply;
  const tabs: { id: typeof tab; label: string }[] = info.isOwner
    ? [
        { id: "mint", label: L.tabMint[lang] },
        { id: "airdrop", label: L.tabAirdrop[lang] },
        { id: "settings", label: L.tabSettings[lang] },
        { id: "pause", label: L.tabPause[lang] },
        { id: "withdraw", label: L.tabWithdraw[lang] }
      ]
    : [{ id: "mint", label: L.tabMint[lang] }];

  async function run(fn: () => Promise<unknown>) {
    try {
      await fn();
      toast.success(L.ok[lang]);
    } catch (e) {
      toast.error((e as Error)?.message ?? String(e));
    }
  }

  const qtyNum = Math.max(1, Math.floor(Number(quantity) || 1));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 max-w-md rounded-2xl border border-rh-line bg-rh-black/40 p-5 text-right">
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-rh-faint">
        <span>
          {L.minted[lang]}: <span className="text-rh-ink tabular">{info.totalMinted.toString()}</span>
        </span>
        <span>
          {L.maxSupply[lang]}: <span className="text-rh-ink tabular">{info.maxSupply ? info.maxSupply.toString() : L.uncapped[lang]}</span>
        </span>
        <span>
          {L.price[lang]}: <span className="text-rh-ink tabular">{info.mintPriceWei === 0n ? L.free[lang] : `${formatEther(info.mintPriceWei)} ETH`}</span>
        </span>
        <span>{info.paused ? L.paused[lang] : L.active[lang]}</span>
      </div>

      {!info.isOwner && <p className="mb-3 rounded-lg border border-rh-yellow/30 bg-rh-yellow/10 p-2.5 text-xs text-rh-yellow">{L.notOwner[lang]}</p>}
      {soldOut && <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">{L.soldOut[lang]}</p>}

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
          <input value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))} placeholder={L.quantity[lang]} className="rh-input tabular" dir="ltr" inputMode="numeric" />
          <button
            disabled={busy || soldOut || qtyNum < 1}
            onClick={() => run(() => mintPublic(BigInt(qtyNum), info.mintPriceWei))}
            className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
          >
            {L.submitMint[lang]} {info.mintPriceWei > 0n ? `(${formatEther(info.mintPriceWei * BigInt(qtyNum))} ETH)` : ""}
          </button>
        </div>
      )}

      {tab === "airdrop" && (
        <div className="space-y-3">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={L.to[lang]} className="rh-input tabular" dir="ltr" />
          <input value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))} placeholder={L.quantity[lang]} className="rh-input tabular" dir="ltr" inputMode="numeric" />
          <button
            disabled={busy || soldOut || !isAddress(to) || qtyNum < 1}
            onClick={() => run(() => ownerMint(to as Address, BigInt(qtyNum)))}
            className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40"
          >
            {L.submitAirdrop[lang]}
          </button>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-5">
          <div className="space-y-2">
            <input value={newBaseURI} onChange={(e) => setNewBaseURI(e.target.value)} placeholder={L.newBaseURI[lang]} className="rh-input tabular" dir="ltr" />
            <button
              disabled={busy || !newBaseURI.trim()}
              onClick={() => run(() => setBaseURI(newBaseURI.trim())).then(() => setNewBaseURI(""))}
              className="w-full rounded-xl border border-rh-yellow/50 py-2.5 font-display text-xs font-bold text-rh-yellow disabled:opacity-40"
            >
              {L.submitBaseURI[lang]}
            </button>
          </div>
          <div className="space-y-2">
            <input value={newPriceEth} onChange={(e) => setNewPriceEth(e.target.value.replace(/[^\d.]/g, ""))} placeholder={L.newPrice[lang]} className="rh-input tabular" dir="ltr" inputMode="decimal" />
            <button
              disabled={busy}
              onClick={() => run(() => setMintPrice(parseEther(newPriceEth.trim() || "0")))}
              className="w-full rounded-xl border border-rh-yellow/50 py-2.5 font-display text-xs font-bold text-rh-yellow disabled:opacity-40"
            >
              {L.submitPrice[lang]}
            </button>
          </div>
          <div className="space-y-2">
            <input value={royaltyReceiver} onChange={(e) => setRoyaltyReceiver(e.target.value)} placeholder={L.royaltyReceiver[lang]} className="rh-input tabular" dir="ltr" />
            <input type="number" min={0} max={10} step={0.5} value={royaltyBps} onChange={(e) => setRoyaltyBps(e.target.value)} placeholder={L.royaltyBps[lang]} className="rh-input tabular" dir="ltr" />
            <button
              disabled={busy || !isAddress(royaltyReceiver)}
              onClick={() => run(() => setRoyalty(royaltyReceiver as Address, Math.round(Number(royaltyBps) * 100)))}
              className="w-full rounded-xl border border-rh-yellow/50 py-2.5 font-display text-xs font-bold text-rh-yellow disabled:opacity-40"
            >
              {L.submitRoyalty[lang]}
            </button>
          </div>
        </div>
      )}

      {tab === "pause" && (
        <button disabled={busy} onClick={() => run(() => setPaused(!info.paused))} className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40">
          {info.paused ? L.unpauseNow[lang] : L.pauseNow[lang]}
        </button>
      )}

      {tab === "withdraw" && (
        <button disabled={busy} onClick={() => run(() => withdraw())} className="w-full rounded-xl bg-rh-yellow py-3 font-display text-sm font-bold text-rh-black disabled:opacity-40">
          {L.withdrawAll[lang]}
        </button>
      )}
    </motion.div>
  );
}
