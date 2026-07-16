import { useAccount, useSwitchChain } from "wagmi";
import { robinhoodChain, robinhoodChainTestnet, isRobinhoodChain } from "../lib/robinhoodChain";

export type RHNetwork = "mainnet" | "testnet";

export function useRHNetworkGuard() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const onRobinhoodChain = isConnected && isRobinhoodChain(chainId);

  async function switchTo(network: RHNetwork) {
    const target = network === "mainnet" ? robinhoodChain.id : robinhoodChainTestnet.id;
    await switchChainAsync({ chainId: target });
  }

  return {
    chainId,
    isConnected,
    onRobinhoodChain,
    isSwitching: isPending,
    switchTo
  };
}
