import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { RH_NFT_ABI } from "../abi/RHNFT";

export interface RHNFTInfo {
  name: string;
  symbol: string;
  maxSupply: bigint | null;
  mintPriceWei: bigint;
  totalMinted: bigint;
  paused: boolean | null;
  myBalance: bigint;
  isOwner: boolean;
}

export type RHTxState = "idle" | "awaiting-signature" | "confirming" | "done" | "error";

export function useRHNFTManager(nftAddress: Address | null, chainId: number | undefined) {
  const { address: me } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const [info, setInfo] = useState<RHNFTInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [txState, setTxState] = useState<RHTxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const refresh = useCallback(async () => {
    if (!publicClient || !nftAddress) return;
    setLoadingInfo(true);
    try {
      const base = { address: nftAddress, abi: RH_NFT_ABI } as const;
      const [name, symbol, maxSupply, mintPriceWei, totalMinted, owner] = await Promise.all([
        publicClient.readContract({ ...base, functionName: "name" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ ...base, functionName: "maxSupply" }) as Promise<bigint>,
        publicClient.readContract({ ...base, functionName: "mintPriceWei" }) as Promise<bigint>,
        publicClient.readContract({ ...base, functionName: "totalMinted" }) as Promise<bigint>,
        publicClient.readContract({ ...base, functionName: "owner" }) as Promise<Address>
      ]);
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
        maxSupply: maxSupply > 0n ? maxSupply : null,
        mintPriceWei,
        totalMinted,
        paused,
        myBalance,
        isOwner: !!me && owner.toLowerCase() === me.toLowerCase()
      });
    } finally {
      setLoadingInfo(false);
    }
  }, [publicClient, nftAddress, me]);

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
    if (!walletClient || !me || !nftAddress) throw new Error("کیف‌پول وصل نیست یا آدرس مجموعه نامعتبره.");
    return { walletClient, me, nftAddress };
  }, [walletClient, me, nftAddress]);

  const mintPublic = useCallback(
    (quantity: bigint, priceEachWei: bigint) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "mint",
          args: [quantity],
          value: priceEachWei * quantity
        });
      }),
    [runWrite, requireReady]
  );

  const ownerMint = useCallback(
    (to: Address, quantity: bigint) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "ownerMint",
          args: [to, quantity]
        });
      }),
    [runWrite, requireReady]
  );

  const setBaseURI = useCallback(
    (uri: string) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "setBaseURI",
          args: [uri]
        });
      }),
    [runWrite, requireReady]
  );

  const setMintPrice = useCallback(
    (priceWei: bigint) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "setMintPrice",
          args: [priceWei]
        });
      }),
    [runWrite, requireReady]
  );

  const setRoyalty = useCallback(
    (receiver: Address, bps: number) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "setRoyalty",
          args: [receiver, bps]
        });
      }),
    [runWrite, requireReady]
  );

  const withdraw = useCallback(
    () =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: "withdraw",
          args: []
        });
      }),
    [runWrite, requireReady]
  );

  const setPaused = useCallback(
    (pause: boolean) =>
      runWrite(async () => {
        const { walletClient, me, nftAddress } = requireReady();
        return walletClient.writeContract({
          account: me,
          address: nftAddress,
          abi: RH_NFT_ABI,
          functionName: pause ? "pause" : "unpause",
          args: []
        });
      }),
    [runWrite, requireReady]
  );

  return {
    info,
    loadingInfo,
    refresh,
    txState,
    txError,
    lastTxHash,
    mintPublic,
    ownerMint,
    setBaseURI,
    setMintPrice,
    setRoyalty,
    withdraw,
    setPaused
  };
}
