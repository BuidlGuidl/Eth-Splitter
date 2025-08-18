import { erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";

export const useTokenBalance = (tokenAddress?: string) => {
  const { address } = useAccount();

  // ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
  });

  // ERC20 balance
  const { data: tokenBalance, isLoading: tokenLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: !!tokenAddress && !!address && tokenAddress !== "ETH",
  });

  // ERC20 decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    enabled: !!tokenAddress && tokenAddress !== "ETH",
  });

  // ERC20 symbol
  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    enabled: !!tokenAddress && tokenAddress !== "ETH",
  });

  // ERC20 allowance for splitter contract
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, process.env.NEXT_PUBLIC_SPLITTER_ADDRESS as `0x${string}`] : undefined,
    enabled: !!tokenAddress && !!address && tokenAddress !== "ETH",
  });

  if (tokenAddress === "ETH" || !tokenAddress) {
    return {
      balance: ethBalance,
      decimals: 18,
      symbol: "ETH",
      allowance: undefined,
      isLoading: ethLoading,
    };
  }

  return {
    balance: tokenBalance,
    decimals: decimals || 18,
    symbol: symbol || "TOKEN",
    allowance,
    isLoading: tokenLoading,
  };
};
