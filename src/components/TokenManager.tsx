import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { isAddress, type Address } from "viem";
import { useAccount } from "wagmi";
import { useTokenManager } from "../hooks/useTokenManager";
import { isValidQuantityInput, toBaseUnits, fromBaseUnits, formatDisplay } from "../lib/amounts";
import { generateRandomWallets, walletsToCsv, downloadCsv, type GeneratedWallet } from "../lib/randomWallets";
import { useLang } from "../lib/i18n";
import { CHAIN_META } from "../lib/chains";

type Tab = "mint" | "burn" | "transfer" | "batch" | "pause" | "roles";

export function TokenManager({ tokenAddress, chainId }: { tokenAddress: Address; chainId: number }) {
  const { t } = useLang();
  const { address: me } = useAccount();
  const meta = CHAIN_META[chainId as keyof typeof CHAIN_META];
  const mgr = useTokenManager(tokenAddress, chainId);
  const [tab, setTab] = useState<Tab>("mint");

  const busy = mgr.txState === "awaiting-signature" || mgr.txState === "confirming";

  const tabs: { id: Tab; label: string }[] = [
    { id: "mint", label: t("tab_mint") },
    { id: "burn", label: t("tab_burn") },
    { id: "transfer", label: t("tab_transfer") },
    { id: "batch", label: t("tab_batch") },
    { id: "pause", label: t("tab_pause") },
    { id: "roles", label: t("tab_roles") }
  ];

  async function wrap(action: () => Promise<unknown>, okMsg: string) {
    try {
      await action();
      toast.success(okMsg);
    } catch (e) {
      toast.error((e as Error)?.message ?? String(e));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-6 max-w-2xl rounded-3xl border border-forge-line bg-forge-panel/70 p-6 text-right shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-8"
    >
      <div className="mb-5 flex items-center justify-between">
        <h4 className="font-display text-lg font-bold">{t("manage_title")}</h4>
        <button
          onClick={() => mgr.refresh()}
          className="rounded-full border border-forge-line px-3 py-1 text-xs text-forge-faint hover:border-forge-blue hover:text-forge-ink"
        >
          {t("manage_refresh")}
        </button>
      </div>

      {mgr.info && !mgr.info.isAdmin && (
        <p className="mb-4 rounded-lg border border-forge-amber/40 bg-forge-amber/10 p-3 text-xs text-forge-amber">
          {t("manage_not_admin")}
        </p>
      )}

      {mgr.info && (
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-forge-line bg-forge-bg/60 p-4 text-xs">
          <Stat label={t("manage_supply")} value={`${formatDisplay(fromBaseUnits(mgr.info.totalSupply, mgr.info.decimals))} ${mgr.info.symbol}`} />
          <Stat
            label={t("manage_cap")}
            value={
              mgr.info.supplyCap === null || mgr.info.supplyCap > 2n ** 127n
                ? t("manage_cap_none")
                : `${formatDisplay(fromBaseUnits(mgr.info.supplyCap, mgr.info.decimals))} ${mgr.info.symbol}`
            }
          />
          <Stat label={t("manage_balance")} value={`${formatDisplay(fromBaseUnits(mgr.info.myBalance, mgr.info.decimals))} ${mgr.info.symbol}`} />
          <Stat
            label={t("manage_status")}
            value={mgr.info.paused === null ? "—" : mgr.info.paused ? t("manage_status_paused") : t("manage_status_active")}
          />
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              tab === tb.id ? "bg-forge-blue text-white" : "border border-forge-line text-forge-faint hover:text-forge-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {tab === "mint" && mgr.info && (
            <MintPanel decimals={mgr.info.decimals} me={me} busy={busy} onSubmit={(to, amt) => wrap(() => mgr.mint(to, amt), t("tx_done"))} t={t} />
          )}
          {tab === "burn" && mgr.info && (
            <BurnPanel
              decimals={mgr.info.decimals}
              balance={mgr.info.myBalance}
              busy={busy}
              onSubmit={(amt) => wrap(() => mgr.burn(amt), t("tx_done"))}
              t={t}
            />
          )}
          {tab === "transfer" && mgr.info && (
            <TransferPanel
              decimals={mgr.info.decimals}
              balance={mgr.info.myBalance}
              busy={busy}
              onSubmit={(to, amt) => wrap(() => mgr.transfer(to, amt), t("tx_done"))}
              t={t}
            />
          )}
          {tab === "batch" && mgr.info && (
            <BatchPanel
              decimals={mgr.info.decimals}
              symbol={mgr.info.symbol}
              busy={busy}
              transferModeConfigured={!!mgr.distributorAddress}
              onSubmitBatch={(mode, recipients) => wrap(() => mgr.sendBatchOneTx(mode, recipients), t("tx_done"))}
              t={t}
            />
          )}
          {tab === "pause" && mgr.info && (
            <PausePanel
              paused={!!mgr.info.paused}
              busy={busy}
              onPause={() => wrap(() => mgr.setPaused(true), t("tx_done"))}
              onUnpause={() => wrap(() => mgr.setPaused(false), t("tx_done"))}
              t={t}
            />
          )}
          {tab === "roles" && (
            <RolesPanel busy={busy} onGrant={(role, account) => wrap(() => mgr.grantRole(role, account), t("tx_done"))} t={t} />
          )}
        </motion.div>
      </AnimatePresence>

      {mgr.lastTxHash && (
        <a
          href={`${meta.explorer}/tx/${mgr.lastTxHash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block truncate text-center font-mono text-xs text-forge-blue"
          dir="ltr"
        >
          {mgr.lastTxHash}
        </a>
      )}
      {mgr.txError && <p className="mt-3 rounded-lg border border-forge-crimson/40 bg-forge-crimson/10 p-3 text-center text-xs text-forge-crimson">{mgr.txError}</p>}
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-forge-faint">{label}</div>
      <div className="tabular font-semibold text-forge-ink" dir="ltr">
        {value}
      </div>
    </div>
  );
}

type Translator = (key: any) => string;

function MintPanel({
  decimals,
  me,
  busy,
  onSubmit,
  t
}: {
  decimals: number;
  me: Address | undefined;
  busy: boolean;
  onSubmit: (to: Address, amount: bigint) => void;
  t: Translator;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const validTo = isAddress(to);
  const validAmt = isValidQuantityInput(amount, decimals);

  return (
    <div className="space-y-3">
      <AddressField label={t("mint_to")} value={to} onChange={setTo} />
      <button className="text-xs text-forge-blue" onClick={() => me && setTo(me)}>
        {t("mint_to_self")}
      </button>
      <AmountField label={t("mint_amount")} value={amount} onChange={setAmount} />
      <SubmitButton
        disabled={busy || !validTo || !validAmt}
        onClick={() => onSubmit(to as Address, toBaseUnits(amount, decimals))}
        label={t("mint_submit")}
      />
    </div>
  );
}

function BurnPanel({
  decimals,
  balance,
  busy,
  onSubmit,
  t
}: {
  decimals: number;
  balance: bigint;
  busy: boolean;
  onSubmit: (amount: bigint) => void;
  t: Translator;
}) {
  const [amount, setAmount] = useState("");
  const validAmt = isValidQuantityInput(amount, decimals);
  const amountUnits = validAmt ? toBaseUnits(amount, decimals) : 0n;
  const overBalance = validAmt && amountUnits > balance;

  return (
    <div className="space-y-3">
      <p className="text-xs text-forge-faint">{t("burn_self_note")}</p>
      <AmountField label={t("burn_amount")} value={amount} onChange={setAmount} />
      <p className="text-xs text-forge-faint">
        {t("manage_balance")}: <span className="tabular text-forge-ink">{formatDisplay(fromBaseUnits(balance, decimals))}</span>
      </p>
      {overBalance && <p className="text-xs text-forge-crimson">{t("burn_over_balance")}</p>}
      <SubmitButton disabled={busy || !validAmt || overBalance} onClick={() => onSubmit(amountUnits)} label={t("burn_submit")} />
    </div>
  );
}

function TransferPanel({
  decimals,
  balance,
  busy,
  onSubmit,
  t
}: {
  decimals: number;
  balance: bigint;
  busy: boolean;
  onSubmit: (to: Address, amount: bigint) => void;
  t: Translator;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const validTo = isAddress(to);
  const validAmt = isValidQuantityInput(amount, decimals);
  const amountUnits = validAmt ? toBaseUnits(amount, decimals) : 0n;
  const overBalance = validAmt && amountUnits > balance;

  return (
    <div className="space-y-3">
      <AddressField label={t("transfer_to")} value={to} onChange={setTo} />
      <AmountField label={t("transfer_amount")} value={amount} onChange={setAmount} />
      <p className="text-xs text-forge-faint">
        {t("manage_balance")}: <span className="tabular text-forge-ink">{formatDisplay(fromBaseUnits(balance, decimals))}</span>
      </p>
      {overBalance && <p className="text-xs text-forge-crimson">{t("burn_over_balance")}</p>}
      <SubmitButton
        disabled={busy || !validTo || !validAmt || overBalance}
        onClick={() => onSubmit(to as Address, amountUnits)}
        label={t("transfer_submit")}
      />
    </div>
  );
}

function BatchPanel({
  decimals,
  symbol,
  busy,
  transferModeConfigured,
  onSubmitBatch,
  t
}: {
  decimals: number;
  symbol: string;
  busy: boolean;
  transferModeConfigured: boolean;
  onSubmitBatch: (mode: "transfer" | "mint", recipients: { to: Address; amount: bigint }[]) => void;
  t: Translator;
}) {
  const [mode, setMode] = useState<"mint" | "transfer">("mint");
  const [count, setCount] = useState(5);
  const [amountEach, setAmountEach] = useState("");
  const [wallets, setWallets] = useState<GeneratedWallet[]>([]);
  const [customText, setCustomText] = useState("");

  const customList = useMemo(() => {
    return customText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [addr, amt] = line.split(",").map((s) => s.trim());
        return { addr, amt, validAddr: isAddress(addr ?? ""), validAmt: isValidQuantityInput(amt ?? "", decimals) };
      });
  }, [customText, decimals]);

  const validAmountEach = isValidQuantityInput(amountEach, decimals);
  const modeBlocked = mode === "transfer" && !transferModeConfigured;

  return (
    <div className="space-y-4">
      <p className="text-xs text-forge-faint">{t("batch_intro")}</p>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("mint")}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${mode === "mint" ? "border-forge-blue bg-forge-blue/10 text-forge-blue" : "border-forge-line text-forge-faint"}`}
        >
          {t("batch_mode_mint")}
        </button>
        <button
          onClick={() => setMode("transfer")}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${mode === "transfer" ? "border-forge-blue bg-forge-blue/10 text-forge-blue" : "border-forge-line text-forge-faint"}`}
        >
          {t("batch_mode_transfer")}
        </button>
      </div>

      {mode === "transfer" && !transferModeConfigured && (
        <p className="rounded-lg border border-forge-amber/40 bg-forge-amber/10 p-3 text-xs text-forge-amber">{t("batch_not_configured")}</p>
      )}
      {mode === "transfer" && transferModeConfigured && <p className="text-[11px] text-forge-faint">{t("batch_transfer_note")}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("batch_count")}>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="input tabular"
            dir="ltr"
          />
        </Field>
        <AmountField label={t("batch_amount_each")} value={amountEach} onChange={setAmountEach} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setWallets(generateRandomWallets(count))}
          className="rounded-xl border border-forge-line px-4 py-2 text-xs font-semibold hover:border-forge-blue"
        >
          {t("batch_generate")}
        </button>
        {wallets.length > 0 && (
          <button
            onClick={() => downloadCsv(`b20-batch-wallets-${Date.now()}.csv`, walletsToCsv(wallets))}
            className="rounded-xl border border-forge-line px-4 py-2 text-xs font-semibold hover:border-forge-blue"
          >
            {t("batch_download")}
          </button>
        )}
      </div>

      {wallets.length > 0 && (
        <>
          <p className="rounded-lg border border-forge-amber/40 bg-forge-amber/10 p-2 text-[11px] text-forge-amber">{t("batch_warning")}</p>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-forge-line bg-forge-bg/60 p-2 font-mono text-[10px]" dir="ltr">
            {wallets.map((w) => (
              <div key={w.address} className="truncate text-forge-faint">
                {w.address}
              </div>
            ))}
          </div>
          <SubmitButton
            disabled={busy || !validAmountEach || modeBlocked}
            onClick={() => {
              const amt = toBaseUnits(amountEach, decimals);
              onSubmitBatch(
                mode,
                wallets.map((w) => ({ to: w.address, amount: amt }))
              );
            }}
            label={`${t("batch_submit")} (${wallets.length})`}
          />
        </>
      )}

      <div className="border-t border-forge-line pt-4">
        <Field label={t("batch_custom_title")}>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={t("batch_custom_placeholder")}
            rows={4}
            className="input font-mono text-xs"
            dir="ltr"
          />
        </Field>
        <SubmitButton
          disabled={busy || customList.length === 0 || customList.some((c) => !c.validAddr || !c.validAmt) || modeBlocked}
          onClick={() =>
            onSubmitBatch(
              mode,
              customList.map((c) => ({ to: c.addr as Address, amount: toBaseUnits(c.amt, decimals) }))
            )
          }
          label={t("batch_custom_submit")}
        />
      </div>
      <p className="text-center text-[10px] text-forge-faint">{symbol}</p>
    </div>
  );
}

function PausePanel({
  paused,
  busy,
  onPause,
  onUnpause,
  t
}: {
  paused: boolean;
  busy: boolean;
  onPause: () => void;
  onUnpause: () => void;
  t: Translator;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-forge-faint">{t("pause_intro")}</p>
      {paused ? (
        <SubmitButton disabled={busy} onClick={onUnpause} label={t("unpause_do")} />
      ) : (
        <SubmitButton disabled={busy} onClick={onPause} label={t("pause_do")} danger />
      )}
    </div>
  );
}

function RolesPanel({
  busy,
  onGrant,
  t
}: {
  busy: boolean;
  onGrant: (role: "MINT_ROLE" | "BURN_ROLE" | "PAUSE_ROLE" | "UNPAUSE_ROLE", account: Address) => void;
  t: Translator;
}) {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState<"MINT_ROLE" | "BURN_ROLE" | "PAUSE_ROLE" | "UNPAUSE_ROLE">("MINT_ROLE");
  const validAccount = isAddress(account);

  return (
    <div className="space-y-3">
      <p className="text-xs text-forge-faint">{t("roles_intro")}</p>
      <AddressField label={t("roles_account")} value={account} onChange={setAccount} />
      <Field label={t("roles_role")}>
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="input" dir="ltr">
          <option value="MINT_ROLE">MINT_ROLE</option>
          <option value="BURN_ROLE">BURN_ROLE</option>
          <option value="PAUSE_ROLE">PAUSE_ROLE</option>
          <option value="UNPAUSE_ROLE">UNPAUSE_ROLE</option>
        </select>
      </Field>
      <SubmitButton disabled={busy || !validAccount} onClick={() => onGrant(role, account as Address)} label={t("roles_grant")} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-display text-xs font-semibold text-forge-ink">{label}</label>
      {children}
    </div>
  );
}

function AddressField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="0x..." className="input font-mono text-xs" dir="ltr" />
    </Field>
  );
}

function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="1000"
        className="input tabular"
        dir="ltr"
        inputMode="decimal"
      />
    </Field>
  );
}

function SubmitButton({ disabled, onClick, label, danger }: { disabled: boolean; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl py-3 font-display text-sm font-bold text-white transition-transform enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "bg-forge-crimson" : "bg-forge-blue"
      }`}
    >
      {label}
    </motion.button>
  );
}
