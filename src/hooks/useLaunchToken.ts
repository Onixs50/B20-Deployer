import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { B20_LAUNCHER_ABI } from "../abi/B20Launcher";
import { LAUNCHER_ADDRESSES } from "../lib/config";
import { computeSalt, saltSeed } from "../lib/salt";

export interface LaunchParams {
  name: string;
  symbol: string;
  decimals: number;
  supplyCapBaseUnits: bigint;
  initialMintBaseUnits: bigint;
}

export type LaunchStage =
  | "idle"
  | "checking-feature"
  | "deriving-salt"
  | "awaiting-signature"
  | "confirming"
  | "done"
  | "error";

export function useLaunchToken(chainId: number | undefined) {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const [stage, setStage] = useState<LaunchStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<Address | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const launcherAddress = chainId ? LAUNCHER_ADDRESSES[chainId] : undefined;

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setTokenAddress(null);
    setTxHash(null);
  }, []);

  const launch = useCallback(
    async (params: LaunchParams) => {
      setError(null);
      setTokenAddress(null);
      setTxHash(null);

      try {
        if (!address) throw new Error("اول کیف پول رو وصل کن.");
        if (!publicClient || !walletClient) throw new Error("اتصال به شبکه برقرار نیست.");
        if (!launcherAddress)
          throw new Error("آدرس قرارداد لانچر برای این شبکه تنظیم نشده (env). راهنمای README رو ببین.");

        setStage("checking-feature");
        const active = await publicClient.readContract({
          address: launcherAddress,
          abi: B20_LAUNCHER_ABI,
          functionName: "isAssetFeatureActive"
        });
        if (!active) {
          throw new Error(
            "قابلیت B20 هنوز روی این شبکه فعال نشده. مقداری صبر کن و دوباره امتحان کن (Activation Registry)."
          );
        }

        setStage("deriving-salt");
        let salt: `0x${string}` | null = null;
        for (let attempt = 0; attempt < 6; attempt++) {
          const candidate = computeSalt(saltSeed(params.name, params.symbol, address, attempt));
          try {
            // simulate first — cheap way to detect TokenAlreadyExists before asking for a signature
            await publicClient.simulateContract({
              account: address,
              address: launcherAddress,
              abi: B20_LAUNCHER_ABI,
              functionName: "launchToken",
              args: [
                params.name,
                params.symbol,
                params.decimals,
                params.supplyCapBaseUnits,
                params.initialMintBaseUnits,
                candidate
              ]
            });
            salt = candidate;
            break;
          } catch (simErr) {
            const msg = String((simErr as Error)?.message ?? simErr);
            if (msg.includes("TokenAlreadyExists") || msg.toLowerCase().includes("already exists")) {
              continue; // try next salt variant
            }
            throw simErr;
          }
        }
        if (!salt) throw new Error("نتونستیم یک salt یکتا برای این نام/نماد پیدا کنیم. اسم رو کمی تغییر بده.");

        setStage("awaiting-signature");
        const hash = await walletClient.writeContract({
          account: address,
          address: launcherAddress,
          abi: B20_LAUNCHER_ABI,
          functionName: "launchToken",
          args: [
            params.name,
            params.symbol,
            params.decimals,
            params.supplyCapBaseUnits,
            params.initialMintBaseUnits,
            salt
          ]
        });
        setTxHash(hash);

        setStage("confirming");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const launched = receipt.logs.find(
          (l) => l.address.toLowerCase() === launcherAddress.toLowerCase()
        );
        if (launched && launched.topics[1]) {
          const addr = `0x${launched.topics[1].slice(-40)}` as Address;
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
    [address, publicClient, walletClient, launcherAddress]
  );

  return { launch, reset, stage, error, tokenAddress, txHash, launcherAddress };
}
