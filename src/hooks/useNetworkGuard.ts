import { useAccount, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { isSupportedChain } from "../lib/chains";

export type LaunchNetwork = "mainnet" | "testnet";

export function useNetworkGuard() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const onSupportedChain = isConnected && isSupportedChain(chainId);

  async function switchTo(network: LaunchNetwork) {
    const target = network === "mainnet" ? base.id : baseSepolia.id;
    await switchChainAsync({ chainId: target });
  }

  return {
    chainId,
    isConnected,
    onSupportedChain,
    isSwitching: isPending,
    switchTo
  };
}
