import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { RH_TOKEN_ABI } from "../abi/RHToken";

export interface RHTokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  cap: bigint | null;
  paused: boolean | null;
  myBalance: bigint;
  isOwner: boolean;
}

export type RHTxState = "idle" | "awaiting-signature" | "confirming" | "done" | "error";

export function useRHTokenManager(tokenAddress: Address | null, chainId: number | undefined) {
  const { address: me } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const [info, setInfo] = useState<RHTokenInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [txState, setTxState] = useState<RHTxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !tokenAddress) return;
    setLoadingInfo(true);
    try {
      const base = { address: tokenAddress, abi: RH_TOKEN_ABI } as const;
      const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
        publicClient.readContract({ ...base, functionName: "name" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "decimals" }) as Promise<number>,
        publicClient.readContract({ ...base, functionName: "totalSupply" }) as Promise<bigint>,
        publicClient.readContract({ ...base, functionName: "owner" }) as Promise<Address>
      ]);
      const cap = await publicClient
        .readContract({ ...base, functionName: "cap" })
        .then((v) => v as bigint)
        .catch(() => null);
      const paused = await publicClient
        .readContract({ ...base, functionName: "paused" })
        .then((v) => v as boolean)
        .catch(() => null);
      const myBalance = me
        ? ((await publicClient.readContract({ ...base, functionName: "balanceOf", args: [me] })) as bigint)
        : 0n;

      setInfo({
        name,
        symbol,
        decimals,
        totalSupply,
        cap: cap && cap > 0n ? cap : null,
        paused,
        myBalance,
        isOwner: !!me && owner.toLowerCase() === me.toLowerCase()
      });
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
          abi: RH_TOKEN_ABI,
          functionName: "mint",
          args: [to, amount]
        });
      }),
    [runWrite, requireReady]
  );

  const burn = useCallback(
    (amount: bigint) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: RH_TOKEN_ABI,
          functionName: "burn",
          args: [amount]
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
          abi: RH_TOKEN_ABI,
          functionName: "transfer",
          args: [to, amount]
        });
      }),
    [runWrite, requireReady]
  );

  const setPaused = useCallback(
    (pause: boolean) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: RH_TOKEN_ABI,
          functionName: pause ? "pause" : "unpause",
          args: []
        });
      }),
    [runWrite, requireReady]
  );

  const transferOwnership = useCallback(
    (newOwner: Address) =>
      runWrite(async () => {
        const { walletClient, me, tokenAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: tokenAddress,
          abi: RH_TOKEN_ABI,
          functionName: "transferOwnership",
          args: [newOwner]
        });
      }),
    [runWrite, requireReady]
  );

  return { info, loadingInfo, refresh, txState, txError, lastTxHash, mint, burn, transfer, setPaused, transferOwnership };
}
