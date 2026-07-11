import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { B20_TOKEN_ABI, DEFAULT_ADMIN_ROLE, roleHash } from "../abi/B20Token";
import { B20_BATCH_DISTRIBUTOR_ABI } from "../abi/B20BatchDistributor";
import { BATCH_DISTRIBUTOR_ADDRESSES } from "../lib/config";

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  supplyCap: bigint | null; // null if the read simply isn't supported/reverted
  paused: boolean | null;
  myBalance: bigint;
  isAdmin: boolean;
  canMint: boolean;
  canBurn: boolean;
  canPause: boolean;
}

export type TxState = "idle" | "awaiting-signature" | "confirming" | "done" | "error";

export function useTokenManager(tokenAddress: Address | null, chainId: number | undefined) {
  const { address: me } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !tokenAddress) return;
    setLoadingInfo(true);
    try {
      const base = {
        address: tokenAddress,
        abi: B20_TOKEN_ABI
      } as const;

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        publicClient.readContract({ ...base, functionName: "name" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "decimals" }) as Promise<number>,
        publicClient.readContract({ ...base, functionName: "totalSupply" }) as Promise<bigint>
      ]);

      const supplyCap = await publicClient
        .readContract({ ...base, functionName: "supplyCap" })
        .then((v) => v as bigint)
        .catch(() => null);

      const paused = await publicClient
        .readContract({ ...base, functionName: "paused" })
        .then((v) => v as boolean)
        .catch(() => null);

      const myBalance = me
        ? ((await publicClient.readContract({ ...base, functionName: "balanceOf", args: [me] })) as bigint)
        : 0n;

      let isAdmin = false;
      let canMint = false;
      let canBurn = false;
      let canPause = false;
      if (me) {
        [isAdmin, canMint, canBurn, canPause] = await Promise.all([
          publicClient
            .readContract({ ...base, functionName: "hasRole", args: [DEFAULT_ADMIN_ROLE, me] })
            .then((v) => v as boolean)
            .catch(() => false),
          publicClient
            .readContract({ ...base, functionName: "hasRole", args: [roleHash("MINT_ROLE"), me] })
            .then((v) => v as boolean)
            .catch(() => false),
          publicClient
            .readContract({ ...base, functionName: "hasRole", args: [roleHash("BURN_ROLE"), me] })
            .then((v) => v as boolean)
            .catch(() => false),
          publicClient
            .readContract({ ...base, functionName: "hasRole", args: [roleHash("PAUSE_ROLE"), me] })
            .then((v) => v as boolean)
            .catch(() => false)
        ]);
      }

      setInfo({ name, symbol, decimals, totalSupply, supplyCap, paused, myBalance, isAdmin, canMint, canBurn, canPause });
    } finally {
      setLoadingInfo(false);
    }
  }, [publicClient, tokenAddress, me]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runWrite = useCallback(
    async (fn: () => Promise<`0x${string}`>) => {
      setTxError(null);
      setTxState("awaiting-signature");
      try {
        const hash = await fn();
        setLastTxHash(hash);
        setTxState("confirming");
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
        setTxState("done");
        await refresh();
      } catch (e) {
        setTxError((e as Error)?.message ?? String(e));
        setTxState("error");
        throw e;
      }
    },
    [publicClient, refresh]
  );

  const requireReady = useCallback(() => {
    if (!walletClient || !me || !tokenAddress) throw new Error("کیف‌پول وصل نیست یا آدرس توکن نامعتبره.");
    return { walletClient, me, tokenAddress };
  }, [walletClient, me, tokenAddress]);

  /** Re-reads the live on-chain balance right before sending — avoids acting on
   *  a stale number shown in the UI if the person fired off several actions quickly. */
  const assertSufficientBalance = useCallback(
    async (owner: Address, amount: bigint) => {
      if (!publicClient || !tokenAddress) return;
      const live = (await publicClient.readContract({
        address: tokenAddress,
        abi: B20_TOKEN_ABI,
        functionName: "balanceOf",
        args: [owner]
      })) as bigint;
      if (amount > live) {
        throw new Error(`موجودی کافی نیست. موجودی فعلی: ${live.toString()} (واحد پایه) — مقدار درخواستی: ${amount.toString()}.`);
      }
    },
    [publicClient, tokenAddress]
  );

  const mint = useCallback(
    (to: Address, amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "mint",
          args: [to, amount]
        });
      }),
    [runWrite, requireReady]
  );

  /** Burns from your OWN balance — the real B20 token only exposes burn(uint256),
   *  which always burns from msg.sender (there's no "burn someone else's tokens"
   *  overload on the standard token itself). */
  const burn = useCallback(
    (amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        await assertSufficientBalance(me, amount);
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "burn",
          args: [amount]
        });
      }),
    [runWrite, requireReady, assertSufficientBalance]
  );

  const transfer = useCallback(
    (to: Address, amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        await assertSufficientBalance(me, amount);
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "transfer",
          args: [to, amount]
        });
      }),
    [runWrite, requireReady, assertSufficientBalance]
  );

  /** Sends everyone in ONE transaction.
   *  mode "mint": calls the token's own native batchMint(recipients, amounts) —
   *  no separate contract needed, works with the MINT_ROLE you already have.
   *  mode "transfer": moves tokens out of your balance via the B20BatchDistributor
   *  contract (auto-approves it first if the current allowance is too low —
   *  that's a second, one-time signature, not one per recipient). */
  const distributorAddress = chainId ? BATCH_DISTRIBUTOR_ADDRESSES[chainId] : undefined;

  const sendBatchOneTx = useCallback(
    async (mode: "transfer" | "mint", recipients: { to: Address; amount: bigint }[]) => {
      const { walletClient, me, tokenAddress } = requireReady();
      if (!publicClient) throw new Error("اتصال به شبکه برقرار نیست.");

      const tos = recipients.map((r) => r.to);
      const amounts = recipients.map((r) => r.amount);
      const total = amounts.reduce((a, b) => a + b, 0n);

      setTxError(null);
      setTxState("awaiting-signature");
      try {
        if (mode === "mint") {
          const hash = await walletClient.writeContract({
            account: me,
            address: tokenAddress,
            abi: B20_TOKEN_ABI,
            functionName: "batchMint",
            args: [tos, amounts]
          });
          setLastTxHash(hash);
          setTxState("confirming");
          await publicClient.waitForTransactionReceipt({ hash });
        } else {
          if (!distributorAddress) throw new Error("آدرس کانترکت ارسال گروهی (B20BatchDistributor) توی .env تنظیم نشده.");
          await assertSufficientBalance(me, total);
          const currentAllowance = (await publicClient.readContract({
            address: tokenAddress,
            abi: B20_TOKEN_ABI,
            functionName: "allowance",
            args: [me, distributorAddress]
          })) as bigint;

          if (currentAllowance < total) {
            const approveHash = await walletClient.writeContract({
              account: me,
              address: tokenAddress,
              abi: B20_TOKEN_ABI,
              functionName: "approve",
              args: [distributorAddress, total]
            });
            setLastTxHash(approveHash);
            setTxState("confirming");
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            setTxState("awaiting-signature");
          }

          const hash = await walletClient.writeContract({
            account: me,
            address: distributorAddress,
            abi: B20_BATCH_DISTRIBUTOR_ABI,
            functionName: "batchTransfer",
            args: [tokenAddress, tos, amounts]
          });
          setLastTxHash(hash);
          setTxState("confirming");
          await publicClient.waitForTransactionReceipt({ hash });
        }
        setTxState("done");
        await refresh();
      } catch (e) {
        setTxError((e as Error)?.message ?? String(e));
        setTxState("error");
        throw e;
      }
    },
    [requireReady, distributorAddress, publicClient, assertSufficientBalance, refresh]
  );

  const setPaused = useCallback(
    (pause: boolean) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: pause ? "pause" : "unpause",
          args: []
        });
      }),
    [runWrite, requireReady]
  );

  const grantRole = useCallback(
    (roleName: Parameters<typeof roleHash>[0], account: Address) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "grantRole",
          args: [roleHash(roleName), account]
        });
      }),
    [runWrite, requireReady]
  );

  const resetTxState = useCallback(() => {
    setTxState("idle");
    setTxError(null);
    setLastTxHash(null);
  }, []);

  return {
    info,
    loadingInfo,
    refresh,
    mint,
    burn,
    transfer,
    sendBatchOneTx,
    distributorAddress,
    setPaused,
    grantRole,
    txState,
    txError,
    lastTxHash,
    resetTxState
  };
}
