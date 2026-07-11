import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { B20_TOKEN_ABI, DEFAULT_ADMIN_ROLE, roleHash } from "../abi/B20Token";

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

  const burn = useCallback(
    (from: Address, amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        // Prefer the 2-arg role-gated burn(account, amount); if the token only
        // implements self burn(amount), the caller should pass their own address.
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "burn",
          args: [from, amount]
        });
      }),
    [runWrite, requireReady]
  );

  const transfer = useCallback(
    (to: Address, amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: B20_TOKEN_ABI,
          functionName: "transfer",
          args: [to, amount]
        });
      }),
    [runWrite, requireReady]
  );

  /** Sends sequentially (one signature per recipient) and reports progress via onProgress. */
  const transferBatch = useCallback(
    async (recipients: { to: Address; amount: bigint }[], onProgress?: (done: number, total: number) => void) => {
      const { walletClient, me, tokenAddress } = requireReady();
      setTxError(null);
      setTxState("awaiting-signature");
      try {
        for (let i = 0; i < recipients.length; i++) {
          const { to, amount } = recipients[i];
          const hash = await walletClient.writeContract({
            account: me,
            address: tokenAddress,
            abi: B20_TOKEN_ABI,
            functionName: "transfer",
            args: [to, amount]
          });
          setLastTxHash(hash);
          setTxState("confirming");
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
          onProgress?.(i + 1, recipients.length);
        }
        setTxState("done");
        await refresh();
      } catch (e) {
        setTxError((e as Error)?.message ?? String(e));
        setTxState("error");
        throw e;
      }
    },
    [requireReady, publicClient, refresh]
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
    transferBatch,
    setPaused,
    grantRole,
    txState,
    txError,
    lastTxHash,
    resetTxState
  };
}
