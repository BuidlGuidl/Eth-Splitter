import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { formatUnits } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { type SplitTransaction } from "~~/hooks/useSplitterHistory";

interface TransactionRowProps {
  transaction: SplitTransaction;
  connectedAddress?: string;
  targetNetwork: any;
  onClick: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  connectedAddress,
  targetNetwork,
  onClick,
}) => {
  const isSent = connectedAddress && transaction.sender.toLowerCase() === connectedAddress.toLowerCase();
  const isReceived =
    connectedAddress && transaction.recipients.some(r => r.recipient.toLowerCase() === connectedAddress.toLowerCase());

  const formatAmount = (amount: string, decimals: number = 18) => {
    const formatted = formatUnits(BigInt(amount), decimals);
    const num = parseFloat(formatted);
    if (num < 0.0001) return "<0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const getTransactionTypeLabel = (type: SplitTransaction["type"]) => {
    switch (type) {
      case "ethSplit":
        return "ETH Split";
      case "ethEqualSplit":
        return "ETH Equal Split";
      case "erc20Split":
        return "Token Split";
      case "erc20EqualSplit":
        return "Token Equal Split";
      default:
        return "Split";
    }
  };

  return (
    <tr className="hover cursor-pointer" onClick={onClick}>
      <td>
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${
              isSent ? "bg-primary/20 text-primary" : isReceived ? "bg-success/20 text-success" : "bg-base-300"
            }`}
          >
            {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-medium">{getTransactionTypeLabel(transaction.type)}</p>
            <p className="text-xs opacity-60">{transaction.type.includes("Equal") ? "Equal" : "Custom"} Split</p>
          </div>
        </div>
      </td>
      <td>
        <div>
          <p className="font-medium">{formatAmount(transaction.totalAmount, transaction.tokenDecimals || 18)}</p>
          <p className="text-xs opacity-60">{transaction.tokenSymbol || targetNetwork.nativeCurrency.symbol}</p>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 opacity-60" />
          <span>{transaction.recipientCount}</span>
        </div>
      </td>
      <td>
        {isSent ? (
          <div>
            <p className="text-xs opacity-60">To</p>
            <Address address={transaction.recipients[0]?.recipient as `0x${string}`} size="xs" />
            {transaction.recipientCount > 1 && (
              <span className="text-xs opacity-60"> +{transaction.recipientCount - 1} more</span>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs opacity-60">From</p>
            <Address address={transaction.sender as `0x${string}`} size="xs" />
          </div>
        )}
      </td>
      <td>
        <p className="text-sm">
          {formatDistanceToNow(new Date(transaction.blockTimestamp * 1000), {
            addSuffix: true,
          })}
        </p>
      </td>
      <td>
        <button className="btn btn-ghost btn-sm">View</button>
      </td>
    </tr>
  );
};
