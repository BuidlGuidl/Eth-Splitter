"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { formatUnits } from "viem";

interface TotalAmountDisplayProps {
  totalAmount: string;
  token: { address: string; symbol: string; decimals: number };
  tokenBalance: any;
}

export const TotalAmountDisplay: React.FC<TotalAmountDisplayProps> = ({ totalAmount, token, tokenBalance }) => {
  const getBalance = () => {
    if (!tokenBalance?.balance) return "0";
    if (token.address === "ETH") {
      return formatUnits(tokenBalance.balance.value, 18);
    }
    return formatUnits(tokenBalance.balance, tokenBalance.decimals || 18);
  };

  const balance = parseFloat(getBalance());
  const total = parseFloat(totalAmount);
  const hasInsufficientBalance = total > balance;

  return (
    <div className="mt-6 p-4 border border-base-100 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total Amount to Split:</span>
        <span className="text-lg font-bold">
          {totalAmount} {token.symbol}
        </span>
      </div>
      {hasInsufficientBalance && (
        <div className="mt-2 flex items-center text-sm text-error">
          <AlertCircle className="w-4 h-4 mr-1" />
          Insufficient balance (Available: {getBalance()} {token.symbol})
        </div>
      )}
    </div>
  );
};
