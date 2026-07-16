import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { RH_FACTORY_ABI } from "../abi/RHFactory";
import { RH_FACTORY_ADDRESSES } from "../lib/config";

export interface RHLaunchTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  capBaseUnits: bigint;
  initialMintBaseUnits: bigint;
}

export type RHLaunchStage = "idle" | "awaiting-signature" | "confirming" | "done" | "error";

export function useLaunchRHToken(chainId: number | undefined) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const [stage, setStage] = useState<RHLaunchStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<Address | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const factoryAddress = chainId ? RH_FACTORY_ADDRESSES[chainId] : undefined;

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setTokenAddress(null);
    setTxHash(null);
  }, []);

  const launch = useCallback(
    async (params: RHLaunchTokenParams) => {
      setError(null);
      setTokenAddress(null);
      setTxHash(null);

      try {
        if (!address) throw new Error("اول کیف پول رو وصل کن.");
        if (!publicClient || !walletClient) throw new Error("اتصال به شبکه برقرار نیست.");
        if (!factoryAddress)
          throw new Error("آدرس قرارداد RHFactory برای این شبکه تنظیم نشده (env). راهنمای README رو ببین.");

        setStage("awaiting-signature");
        const hash = await walletClient.writeContract({
          account: address,
          address: factoryAddress,
          abi: RH_FACTORY_ABI,
          functionName: "createToken",
          args: [params.name, params.symbol, params.decimals, params.capBaseUnits, params.initialMintBaseUnits]
        });
        setTxHash(hash);

        setStage("confirming");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const created = receipt.logs.find((l) => l.address.toLowerCase() === factoryAddress.toLowerCase());
        if (created && created.topics[2]) {
          const addr = `0x${created.topics[2].slice(-40)}` as Address;
          setTokenAddress(addr);
        }

        setStage("done");
        return { txHash: hash };
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        setError(msg);
        setStage("error");
        throw e;
      }
    },
    [address, publicClient, walletClient, factoryAddress]
  );

  return { launch, reset, stage, error, tokenAddress, txHash, factoryAddress };
}
