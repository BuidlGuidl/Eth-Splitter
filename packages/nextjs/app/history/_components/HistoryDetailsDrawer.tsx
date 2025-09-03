import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Coins, Copy, ExternalLink, Hash, Layers, Users, X } from "lucide-react";
import { formatUnits } from "viem";
import { Address, BlockieAvatar } from "~~/components/scaffold-eth";
import { useCopyToClipboard, useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { SplitHistoryItem } from "~~/hooks/useSplitterHistory";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";

interface HistoryDetailsDrawerProps {
  split: SplitHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDetailsDrawer: React.FC<HistoryDetailsDrawerProps> = ({ split, isOpen, onClose }) => {
  const { targetNetwork } = useTargetNetwork();
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();

  if (!split) return null;

  const isEqualSplit = "amountPerRecipient" in split;
  const isErc20 = "token" in split;

  const formatAmount = (amount: string, decimals = 18) => {
    const formatted = formatUnits(BigInt(amount), decimals);
    const num = parseFloat(formatted);
    if (num < 0.0001) return "<0.0001";
    if (num < 1) return num.toFixed(6);
    if (num < 100) return num.toFixed(4);
    return num.toFixed(2);
  };

  const getTokenSymbol = () => {
    if (isErc20) {
      return (split as any).tokenSymbol || "TOKEN";
    }
    return targetNetwork.nativeCurrency.symbol;
  };

  const getTokenDecimals = () => {
    if (isErc20) {
      return (split as any).tokenDecimals || 18;
    }
    return 18;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSplitTypeLabel = () => {
    if (isErc20 && isEqualSplit) return "ERC20 Equal Split";
    if (isErc20) return "ERC20 Custom Split";
    if (isEqualSplit) return "ETH Equal Split";
    return "ETH Custom Split";
  };

  const explorerLink = getBlockExplorerTxLink(split.chainId, split.transactionHash);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-base-100 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-base-300">
                <div>
                  <h2 className="text-xl font-bold mb-1">Split Details</h2>
                  <div className="badge badge-lg badge-secondary">{getSplitTypeLabel()}</div>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-circle">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Overview
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Total Amount</span>
                        <span className="font-mono font-bold">
                          {formatAmount(split.totalAmount, getTokenDecimals())} {getTokenSymbol()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Recipients</span>
                        <span className="font-mono">{split.recipientCount}</span>
                      </div>

                      {isEqualSplit && (
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">Amount per Recipient</span>
                          <span className="font-mono">
                            {formatAmount((split as any).amountPerRecipient, getTokenDecimals())} {getTokenSymbol()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Transaction Info
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">From</span>
                        <Address address={split.sender as `0x${string}`} format="short" />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Block</span>
                        <span className="font-mono">{split.blockNumber.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60">Time</span>
                        <span className="text-sm">{formatDate(split.blockTimestamp)}</span>
                      </div>

                      {isErc20 && (
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/60">Token</span>
                          <Address address={(split as any).token as `0x${string}`} format="short" />
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(split.transactionHash)}
                          className="btn btn-sm btn-ghost flex-1"
                        >
                          {isCopiedToClipboard ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy TxHash
                            </>
                          )}
                        </button>
                        {explorerLink && (
                          <a
                            href={explorerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary flex-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Explorer
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" />
                      Recipients ({split.recipientCount})
                    </h3>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {split.recipients.map((recipient, idx) => {
                        const amount = isEqualSplit ? (split as any).amountPerRecipient : (split as any).amounts[idx];

                        return (
                          <div
                            key={`${recipient}-${idx}`}
                            className="flex items-center justify-between py-2 px-3 bg-base-100 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Address address={recipient as `0x${string}`} format="short" />
                            </div>
                            <span className="font-mono text-sm font-semibold">
                              {formatAmount(amount, getTokenDecimals())} {getTokenSymbol()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4" />
                      Network
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span>{targetNetwork.name}</span>
                      <span className="text-base-content/60">(Chain ID: {split.chainId})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
