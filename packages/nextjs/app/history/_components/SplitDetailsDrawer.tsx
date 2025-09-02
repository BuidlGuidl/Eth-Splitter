"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Coins,
  Copy,
  ExternalLink,
  Hash,
  Users,
  X,
} from "lucide-react";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";
import { Address, BlockieAvatar } from "~~/components/scaffold-eth";
import { useCopyToClipboard, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { type SplitTransaction } from "~~/hooks/useSplitterHistory";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface SplitDetailsDrawerProps {
  transaction: SplitTransaction;
  isOpen: boolean;
  onClose: () => void;
  connectedAddress?: string;
}

export const SplitDetailsDrawer: React.FC<SplitDetailsDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  connectedAddress,
}) => {
  const chainId = useChainId();
  const { targetNetwork } = useTargetNetwork();
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();

  const isSent = connectedAddress && transaction.sender.toLowerCase() === connectedAddress.toLowerCase();
  const receivedAmount = useMemo(() => {
    if (!connectedAddress) return null;
    const recipient = transaction.recipients.find(r => r.recipient.toLowerCase() === connectedAddress.toLowerCase());
    return recipient?.amount || null;
  }, [transaction, connectedAddress]);

  const formatAmount = (amount: string, decimals: number = 18) => {
    const formatted = formatUnits(BigInt(amount), decimals);
    const num = parseFloat(formatted);
    if (num < 0.0001) return "<0.0001";
    if (num < 1) return num.toFixed(6);
    if (num < 100) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const getTransactionTypeLabel = () => {
    switch (transaction.type) {
      case "ethSplit":
        return "ETH Split Transaction";
      case "ethEqualSplit":
        return "ETH Equal Split Transaction";
      case "erc20Split":
        return "Token Split Transaction";
      case "erc20EqualSplit":
        return "Token Equal Split Transaction";
      default:
        return "Split Transaction";
    }
  };

  const getTokenSymbol = () => {
    return transaction.tokenSymbol || targetNetwork.nativeCurrency.symbol;
  };

  const handleCopyTxHash = async () => {
    await copyToClipboard(transaction.txHash);
    notification.success("Transaction hash copied!");
  };

  const handleOpenExplorer = () => {
    const link = getBlockExplorerTxLink(chainId, transaction.txHash);
    if (link) window.open(link, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl z-50 transform transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <div>
              <h2 className="text-xl font-bold">{getTransactionTypeLabel()}</h2>
              <p className="text-sm opacity-60 mt-1">
                {format(new Date(transaction.blockTimestamp * 1000), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <div className={`badge gap-2 px-3 py-4 ${isSent ? "badge-primary" : "badge-success"}`}>
                {isSent ? (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Sent
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4" />
                    Received
                  </>
                )}
              </div>
              <div className="badge badge-outline gap-2 px-3 py-4">
                <CheckCircle className="w-4 h-4" />
                Confirmed
              </div>
            </div>

            {/* Amount Section */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-70">Total Amount</span>
                  <Coins className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-3xl font-bold">
                  {formatAmount(transaction.totalAmount, transaction.tokenDecimals || 18)} {getTokenSymbol()}
                </p>
                {!isSent && receivedAmount && (
                  <p className="text-sm opacity-60 mt-2">
                    You received: {formatAmount(receivedAmount, transaction.tokenDecimals || 18)} {getTokenSymbol()}
                  </p>
                )}
                {transaction.type.includes("Equal") && (
                  <p className="text-sm opacity-60 mt-2">
                    {formatAmount(transaction.amountPerRecipient || "0", transaction.tokenDecimals || 18)}{" "}
                    {getTokenSymbol()} per recipient
                  </p>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-70 mb-2">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-base-200 px-2 py-1 rounded flex-1 truncate">{transaction.txHash}</code>
                  <button onClick={handleCopyTxHash} className="btn btn-ghost btn-xs" disabled={isCopiedToClipboard}>
                    {isCopiedToClipboard ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleOpenExplorer} className="btn btn-ghost btn-xs">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-70 mb-2">Block Number</p>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 opacity-50" />
                  <span className="font-mono">{transaction.blockNumber}</span>
                </div>
              </div>

              <div>
                <p className="text-sm opacity-70 mb-2">From</p>
                <div className="flex items-center gap-3">
                  <BlockieAvatar address={transaction.sender as `0x${string}`} size={32} />
                  <Address address={transaction.sender as `0x${string}`} />
                </div>
              </div>

              {transaction.tokenAddress && transaction.tokenAddress !== "ETH" && (
                <div>
                  <p className="text-sm opacity-70 mb-2">Token Contract</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <Address address={transaction.tokenAddress as `0x${string}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Recipients Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Recipients ({transaction.recipientCount})</p>
                <Users className="w-4 h-4 opacity-50" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transaction.recipients.map((recipient, index) => (
                  <div
                    key={`${recipient.recipient}-${index}`}
                    className={`card bg-base-200 ${
                      connectedAddress && recipient.recipient.toLowerCase() === connectedAddress.toLowerCase()
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <div className="card-body p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <BlockieAvatar address={recipient.recipient as `0x${string}`} size={24} />
                          <Address address={recipient.recipient as `0x${string}`} size="xs" />
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {formatAmount(recipient.amount, transaction.tokenDecimals || 18)}
                          </p>
                          <p className="text-xs opacity-60">{getTokenSymbol()}</p>
                        </div>
                      </div>
                      {connectedAddress && recipient.recipient.toLowerCase() === connectedAddress.toLowerCase() && (
                        <div className="badge badge-primary badge-sm mt-2">You</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="card bg-base-200">
              <div className="card-body p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Split Type</span>
                  <span className="badge badge-outline">
                    {transaction.type.includes("Equal") ? "Equal Split" : "Custom Split"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Network</span>
                  <span className="text-sm font-medium">{targetNetwork.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm opacity-70">Chain ID</span>
                  <span className="text-sm font-mono">{transaction.chainId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-base-300">
            <div className="flex gap-3">
              <button onClick={handleOpenExplorer} className="btn btn-primary flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </button>
              <button onClick={onClose} className="btn btn-ghost">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
