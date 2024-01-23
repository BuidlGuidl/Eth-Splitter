import { readContract } from "@wagmi/core";
import { erc20ABI } from "wagmi";

export const getChainNameForCovalent = (id: number) => {
  switch (id) {
    case 1:
      return "eth-mainnet";
    case 42161:
      return "arbitrum-mainnet";
    case 10:
      return "optimism-mainnet";
    case 8453:
      return "base-mainnet";
    case 137:
      return "matic-mainnet";
    default:
      return "eth-mainnet";
  }
};

export const getChainNameForAlchemy = (id: number) => {
  switch (id) {
    case 1:
      return "ETH_MAINNET";
    case 42161:
      return "ARB_MAINNET";
    case 10:
      return "OPT_MAINNET";
    case 8453:
      return "BASE_MAINNET";
    case 137:
      return "MATIC_MAINNET";
    default:
      return "ETH_MAINNET";
  }
};

export const getDate = (timestamp: number) => {
  const date = new Date(Number(timestamp) * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} - ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
};

export const getTokenSymbol = async (tokenAddress: string) => {
  if (tokenAddress && tokenAddress != "") {
    const data = await readContract({
      address: tokenAddress,
      abi: erc20ABI,
      functionName: "symbol",
    });
    const symbol = await Promise.all(data);
    return symbol;
  }
  return "";
};
