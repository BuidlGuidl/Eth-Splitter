import { tokens } from "~~/constants/tokens";

// Helper function to get token info from address
export const getTokenInfo = (tokenAddress: string, chainId: number) => {
  if (!tokenAddress || tokenAddress === "ETH") {
    return null;
  }

  const chainTokens = tokens[chainId];
  if (!chainTokens) return null;

  const token = chainTokens.contracts.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());

  return token || null;
};

// Format token amount with proper decimals
export const formatTokenAmount = (amount: string | bigint, decimals: number = 18, maxDecimals: number = 6): string => {
  try {
    const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;
    const divisor = BigInt(10 ** decimals);
    const beforeDecimal = amountBigInt / divisor;
    const afterDecimal = amountBigInt % divisor;

    if (afterDecimal === 0n) {
      return beforeDecimal.toString();
    }

    const afterDecimalStr = afterDecimal.toString().padStart(decimals, "0");
    const trimmed = afterDecimalStr.slice(0, maxDecimals).replace(/0+$/, "");

    if (trimmed === "") {
      return beforeDecimal.toString();
    }

    return `${beforeDecimal}.${trimmed}`;
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
};

// Get display name for split type
export const getSplitTypeDisplayName = (type: string): string => {
  const typeMap: Record<string, string> = {
    ethSplit: "ETH Split",
    ethEqualSplit: "ETH Equal Split",
    erc20Split: "Token Split",
    erc20EqualSplit: "Token Equal Split",
  };
  return typeMap[type] || "Split";
};

// Get color scheme for transaction type
export const getTransactionColorScheme = (
  type: "sent" | "received",
): {
  bgColor: string;
  textColor: string;
  iconBgColor: string;
} => {
  if (type === "sent") {
    return {
      bgColor: "bg-primary/10",
      textColor: "text-primary",
      iconBgColor: "bg-primary/20",
    };
  }
  return {
    bgColor: "bg-success/10",
    textColor: "text-success",
    iconBgColor: "bg-success/20",
  };
};

// Calculate total USD value (rough estimate)
export const calculateUSDValue = (amount: string, tokenSymbol: string, nativeCurrencyPrice?: number): string => {
  if (!nativeCurrencyPrice) return "0";

  // This is a simplified calculation
  // In production, you'd want to fetch actual token prices
  const estimatedValue = parseFloat(formatTokenAmount(amount, 18, 6)) * nativeCurrencyPrice;

  return estimatedValue.toFixed(2);
};

// Group transactions by date
export const groupTransactionsByDate = (transactions: any[]) => {
  const groups: Record<string, any[]> = {};

  transactions.forEach(tx => {
    const date = new Date(tx.blockTimestamp * 1000);
    const dateKey = date.toLocaleDateString();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });

  return groups;
};

// Export transaction data to CSV
export const exportToCSV = (transactions: any[], address: string) => {
  const headers = [
    "Date",
    "Time",
    "Type",
    "Direction",
    "Amount",
    "Token",
    "Recipients",
    "Transaction Hash",
    "Block Number",
  ];

  const rows = transactions.map(tx => {
    const date = new Date(tx.blockTimestamp * 1000);
    const isSent = tx.sender.toLowerCase() === address.toLowerCase();

    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      getSplitTypeDisplayName(tx.type),
      isSent ? "Sent" : "Received",
      formatTokenAmount(tx.totalAmount, tx.tokenDecimals || 18),
      tx.tokenSymbol || "ETH",
      tx.recipientCount,
      tx.txHash,
      tx.blockNumber,
    ];
  });

  const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `split-history-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
