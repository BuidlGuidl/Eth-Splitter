import { useEffect, useState } from "react";
import { useDeployedContractInfo } from "./scaffold-eth";
import { readContract } from "@wagmi/core";
import { erc20Abi } from "viem";
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

export const useTokenBalance = (tokenAddress?: string) => {
  const { address } = useAccount();
  const { data: deployedContractInfo } = useDeployedContractInfo({ contractName: "ETHSplitter" });

  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
  });

  const [allowance, setAllowance] = useState<bigint | undefined>(undefined);

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

  const SPLITTER_ADDRESS = deployedContractInfo?.address as `0x${string}`;

  const { writeContract: approveWrite, isPending: isApproving, data: approveHash } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const approve = (amount: bigint) => {
    if (!tokenAddress || tokenAddress === "ETH" || !SPLITTER_ADDRESS) return;
    approveWrite({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [SPLITTER_ADDRESS, amount],
    });
  };

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!tokenAddress || tokenAddress === "ETH" || !address || !SPLITTER_ADDRESS) {
        setAllowance(undefined);
        return;
      }
      try {
        const result = await readContract(wagmiConfig, {
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, SPLITTER_ADDRESS],
        });
        setAllowance(result);
      } catch (error) {
        console.error("Error fetching allowance:", error);
        setAllowance(undefined);
      }
    };

    fetchAllowance();
  }, [tokenAddress, address, SPLITTER_ADDRESS, isConfirmed]);

  if (tokenAddress === "ETH" || !tokenAddress) {
    return {
      balance: ethBalance,
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum",
      allowance: undefined,
      isLoading: ethLoading,
      approve: undefined,
      isApproving: false,
      isConfirming: false,
    };
  }

  return {
    balance: tokenBalance,
    decimals: decimals || 18,
    symbol: symbol || "TOKEN",
    name: name || "Unknown Token",
    allowance,
    isLoading: tokenLoading,
    approve,
    isApproving,
    isConfirming,
  };
};
