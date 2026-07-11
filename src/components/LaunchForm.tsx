import { useEffect, useMemo, useState } from "react";
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
import { addDeployedToken } from "../lib/history";
import { useLang } from "../lib/i18n";
import type { DictKey } from "../lib/i18n";

const STAGE_KEY: Record<string, DictKey> = {
  idle: "stage_idle",
  "checking-feature": "stage_checking",
  "deriving-salt": "stage_salt",
  "awaiting-signature": "stage_sign",
  confirming: "stage_confirm",
  done: "stage_done",
  error: "stage_error"
};

const emptyForm = {
  name: "",
  symbol: "",
  decimals: 18,
  supplyCap: "",
  noCap: true,
  initialMint: ""
};

export function LaunchForm({ onDeployed }: { onDeployed?: () => void }) {
  const { isConnected, address } = useAccount();
  const { t } = useLang();
  const [network, setNetwork] = useState<LaunchNetwork>("testnet");
  const { onSupportedChain } = useNetworkGuard();

  const [form, setForm] = useState(emptyForm);
  const { name, symbol, decimals, supplyCap, noCap, initialMint } = form;
  const [logo, setLogo] = useState<IpfsUploadResult | null>(null);

  const activeChainId = network === "mainnet" ? base.id : baseSepolia.id;
  const { launch, reset, stage, error, tokenAddress, txHash, launcherAddress } = useLaunchToken(activeChainId);

  // Log every successful deploy into the local per-browser history exactly once.
  useEffect(() => {
    if (stage === "done" && tokenAddress && address) {
      addDeployedToken({
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
    if (name.trim().length < 1 || name.trim().length > 40) e.name = t("field_name_err");
    if (!/^[A-Za-z0-9]{2,11}$/.test(symbol.trim())) e.symbol = t("field_symbol_err");
    if (decimals < 6 || decimals > 18) e.decimals = t("field_decimals_err");
    if (!noCap && !isValidQuantityInput(supplyCap, decimals)) e.supplyCap = t("field_cap_err");
    if (initialMint.trim() !== "" && !isValidQuantityInput(initialMint, decimals)) e.initialMint = t("field_mint_err");
    if (
      !noCap &&
      initialMint.trim() !== "" &&
      isValidQuantityInput(supplyCap, decimals) &&
      isValidQuantityInput(initialMint, decimals)
    ) {
      if (toBaseUnits(initialMint, decimals) > toBaseUnits(supplyCap, decimals)) {
        e.initialMint = t("field_mint_over_cap");
      }
    }
    return e;
  }, [name, symbol, decimals, supplyCap, noCap, initialMint, t]);

  const formValid = Object.keys(errors).length === 0 && name && symbol;
  const canSubmit =
    formValid && isConnected && onSupportedChain && stage !== "confirming" && stage !== "awaiting-signature";

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Clears the form and hook state so the user can deploy again without a page refresh. */
  function startFresh() {
    setForm(emptyForm);
    setLogo(null);
    reset();
  }

  async function handleSubmit() {
    if (!isConnected) {
      toast.error(t("toast_need_wallet"));
      return;
    }
    if (!onSupportedChain) {
      toast.error(t("toast_need_network"));
      return;
    }
    if (!launcherAddress) {
      toast.error(t("toast_no_launcher"));
      return;
    }

    const supplyCapUnits = noCap ? 2n ** 128n - 1n : toBaseUnits(supplyCap, decimals);
    const initialMintUnits = initialMint.trim() === "" ? 0n : toBaseUnits(initialMint, decimals);

    try {
      if (logo) {
        uploadMetadataToIpfs({
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          decimals,
          image: logo.uri
        }).catch(() => {});
      }

      await launch({
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        decimals,
        supplyCapBaseUnits: supplyCapUnits,
        initialMintBaseUnits: initialMintUnits
      });
      toast.success(t("toast_tx_ok"));
    } catch {
      // surfaced via `error` state below
    }
  }

  const meta = CHAIN_META[activeChainId];

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        layout
        className="rounded-3xl border border-forge-line bg-forge-panel/70 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-sm md:p-8"
      >
        <AnimatePresence mode="wait">
          {stage === "done" && tokenAddress ? (
            <SuccessPanel
              key="success"
              tokenAddress={tokenAddress}
              txHash={txHash}
              name={name}
              symbol={symbol}
              meta={meta}
              onAgain={startFresh}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <NetworkPicker selected={network} onSelect={setNetwork} />

              <Field label={t("field_name")} error={errors.name} hint={t("field_name_hint")}>
                <input
                  value={name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={40}
                  placeholder="My Onixia Token"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t("field_symbol")} error={errors.symbol} hint={t("field_symbol_hint")}>
                  <input
                    value={symbol}
                    onChange={(e) => set("symbol", e.target.value.toUpperCase())}
                    maxLength={11}
                    placeholder="ONX"
                    className="input tabular"
                    dir="ltr"
                  />
                </Field>
                <Field label={t("field_decimals")} error={errors.decimals} hint={t("field_decimals_hint")}>
                  <input
                    type="number"
                    min={6}
                    max={18}
                    value={decimals}
                    onChange={(e) => set("decimals", Math.max(6, Math.min(18, Number(e.target.value) || 18)))}
                    className="input tabular"
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field
                label={t("field_cap")}
                error={errors.supplyCap}
                hint={noCap ? t("field_cap_hint_uncapped") : t("field_cap_hint_capped")}
                action={
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-forge-faint">
                    <input type="checkbox" checked={noCap} onChange={(e) => set("noCap", e.target.checked)} />
                    {t("field_cap_uncapped_toggle")}
                  </label>
                }
              >
                <input
                  value={noCap ? "" : supplyCap}
                  onChange={(e) => set("supplyCap", e.target.value.replace(/[^\d.]/g, ""))}
                  disabled={noCap}
                  placeholder={noCap ? "∞" : "1000000"}
                  className="input tabular disabled:opacity-40"
                  dir="ltr"
                  inputMode="decimal"
                />
                {supplyCap && !noCap && isValidQuantityInput(supplyCap, decimals) && (
                  <p className="mt-1 text-xs text-forge-faint">
                    {t("field_cap_result")} <span className="text-forge-ink">{formatDisplay(supplyCap)}</span>{" "}
                    {t("field_cap_result_suffix")}
                  </p>
                )}
              </Field>

              <Field label={t("field_mint")} error={errors.initialMint} hint={t("field_mint_hint")}>
                <input
                  value={initialMint}
                  onChange={(e) => set("initialMint", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="1000"
                  className="input tabular"
                  dir="ltr"
                  inputMode="decimal"
                />
                {initialMint && isValidQuantityInput(initialMint, decimals) && (
                  <p className="mt-1 text-xs text-forge-faint">
                    {t("field_mint_result")} <span className="text-forge-ink">{formatDisplay(initialMint)}</span>{" "}
                    {t("field_mint_result_suffix")}
                  </p>
                )}
              </Field>

              <LogoUploader onUploaded={setLogo} />

              <motion.button
                whileTap={canSubmit ? { scale: 0.985 } : undefined}
                onClick={handleSubmit}
                disabled={!canSubmit && stage !== "error"}
                className="relative w-full overflow-hidden rounded-xl bg-forge-blue py-4 font-display text-sm font-bold text-white transition-transform enabled:hover:scale-[1.005] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {stage === "idle" || stage === "error" || stage === "done"
                  ? `${t("submit_deploy_on")} ${meta.shortLabel}`
                  : t(STAGE_KEY[stage])}
                {(stage === "awaiting-signature" ||
                  stage === "confirming" ||
                  stage === "checking-feature" ||
                  stage === "deriving-salt") && (
                  <motion.span
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.button>

              {!isConnected && <p className="text-center text-xs text-forge-faint">{t("submit_need_wallet")}</p>}
              {isConnected && !onSupportedChain && (
                <p className="text-center text-xs text-forge-amber">{t("submit_need_network")}</p>
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
  meta,
  onAgain
}: {
  tokenAddress: string;
  txHash: string | null;
  name: string;
  symbol: string;
  meta: (typeof CHAIN_META)[keyof typeof CHAIN_META];
  onAgain: () => void;
}) {
  const { t } = useLang();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
      <motion.div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-forge-mint/15 animate-stampin">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#00E6A0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 className="font-display text-xl font-bold">
        {name} (<span className="tabular">{symbol}</span>) {t("stage_done")}
      </h3>
      <p className="mt-1 text-sm text-forge-faint">
        {t("success_on")} {meta.label}
      </p>

      <div className="mx-auto mt-6 max-w-md space-y-2 rounded-xl border border-forge-line bg-forge-bg/60 p-4 text-right">
        <Row label={t("success_token_addr")} value={tokenAddress} href={`${meta.explorer}/token/${tokenAddress}`} />
        {txHash && <Row label={t("success_tx")} value={txHash} href={`${meta.explorer}/tx/${txHash}`} />}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`${meta.explorer}/token/${tokenAddress}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-xl bg-forge-blue px-6 py-3 font-display text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          {t("success_view")} Basescan
        </a>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAgain}
          className="inline-block rounded-xl border border-forge-line px-6 py-3 font-display text-sm font-semibold text-forge-ink transition-colors hover:border-forge-blue"
        >
          {t("success_again")}
        </motion.button>
      </div>
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
