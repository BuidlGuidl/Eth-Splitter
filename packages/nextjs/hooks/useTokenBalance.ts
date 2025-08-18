import { erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract } from "wagmi";

export const useTokenBalance = (tokenAddress?: string) => {
  const { address } = useAccount();

  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
  });

  const { data: tokenBalance, isLoading: tokenLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== "ETH" && !!address,
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!tokenAddress && tokenAddress !== "ETH",
    },
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled: !!tokenAddress && tokenAddress !== "ETH",
    },
  });

  const { data: name } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
    query: {
      enabled: !!tokenAddress && tokenAddress !== "ETH",
    },
  });

  const SPLITTER_ADDRESS = process.env.NEXT_PUBLIC_SPLITTER_ADDRESS as `0x${string}`;

  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && SPLITTER_ADDRESS ? [address, SPLITTER_ADDRESS] : undefined,
    query: {
      enabled: !!tokenAddress && tokenAddress !== "ETH" && !!address && !!SPLITTER_ADDRESS,
    },
  });

  if (tokenAddress === "ETH" || !tokenAddress) {
    return {
      balance: ethBalance,
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum",
      allowance: undefined,
      isLoading: ethLoading,
    };
  }

  return {
    balance: tokenBalance,
    decimals: decimals || 18,
    symbol: symbol || "TOKEN",
    name: name || "Unknown Token",
    allowance,
    isLoading: tokenLoading,
  };
};
