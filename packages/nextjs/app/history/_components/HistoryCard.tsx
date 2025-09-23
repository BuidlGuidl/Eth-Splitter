import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Coins, Repeat, Users } from "lucide-react";
import { formatUnits } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { SplitHistoryItem } from "~~/hooks/useSplitterHistory";
import { isEqualSplit, isErc20Transaction } from "~~/utils/splitterHistory";

interface HistoryCardProps {
  split: SplitHistoryItem;
  onClick: () => void;
  delay?: number;
  handleRepeat: (
    split: SplitHistoryItem,
    isEqual: boolean,
    isErc20: boolean,
    chainId: number,
    onSuccess?: () => void,
    e?: React.MouseEvent,
  ) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ split, onClick, delay = 0, handleRepeat }) => {
  const { targetNetwork } = useTargetNetwork();

  const isErc20 = isErc20Transaction(split);
  const isEqual = isEqualSplit(split);

  const formatAmount = (amount: string, decimals = 18) => {
    const formatted = formatUnits(BigInt(amount), decimals);
    const num = parseFloat(formatted);
    if (num < 0.0001) return "<0.0001";
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toFixed(0);
  };

  const getTokenSymbol = () => {
    if (isErc20) {
      return split.tokenSymbol || "TOKEN";
    }
    return targetNetwork.nativeCurrency.symbol;
  };

  const getTotalAmount = () => {
    const decimals = isErc20 ? split.tokenDecimals || 18 : 18;
    return formatAmount(split.totalAmount, decimals);
  };

  const getSplitTypeLabel = () => {
    switch (split.type) {
      case "ETH_SPLIT":
        return "ETH Custom";
      case "ETH_EQUAL_SPLIT":
        return "ETH Equal";
      case "ERC20_SPLIT":
        return "ERC20 Custom";
      case "ERC20_EQUAL_SPLIT":
        return "ERC20 Equal";
      default:
        return "Unknown";
    }
  };

  const getSplitTypeBadgeColor = () => {
    switch (split.type) {
      case "ETH_SPLIT":
        return "badge-info";
      case "ETH_EQUAL_SPLIT":
        return "badge-primary";
      case "ERC20_SPLIT":
        return "badge-secondary";
      case "ERC20_EQUAL_SPLIT":
        return "badge-accent";
      default:
        return "badge-ghost";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  function _(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-base-300"
      onClick={onClick}
    >
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`badge ${getSplitTypeBadgeColor()} badge-sm`}>{getSplitTypeLabel()}</div>
          </div>
          <div className="flex items-center text-xs text-base-content/60">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(split.blockTimestamp)}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-base-content/60" />
            <span className="text-xl font-bold">
              {getTotalAmount()} {getTokenSymbol()}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-base-content/60" />
            <span className="text-sm text-base-content/60">
              {split.recipientCount} recipient{split.recipientCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-1">
            {split.recipients.slice(0, 2).map((recipient, idx) => (
              <div key={recipient} className="flex items-center justify-between text-sm">
                <Address address={recipient as `0x${string}`} format="short" disableAddressLink={true} />
                <span className="text-base-content/60">
                  {isEqual
                    ? formatAmount(split.amountPerRecipient!, isErc20 ? split.tokenDecimals || 18 : 18)
                    : formatAmount(split.amounts![idx], isErc20 ? split.tokenDecimals || 18 : 18)}{" "}
                  {getTokenSymbol()}
                </span>
              </div>
            ))}
            {split.recipients.length > 2 && (
              <div className="text-xs text-base-content/60 italic">+{split.recipients.length - 2} more...</div>
            )}
          </div>
        </div>

        <div className="card-actions justify-end">
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={e => handleRepeat(split, isEqual, isErc20, split.chainId, _, e)}
            title="Repeat this split"
          >
            <Repeat className="w-4 h-4" />
            Repeat
          </button>
          <button className="btn btn-ghost btn-sm gap-1">
            View Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
