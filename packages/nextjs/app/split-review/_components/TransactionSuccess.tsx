import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, Plus, Users } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";

interface Recipient {
  id: string;
  address: string;
  amount: string;
  percentage?: number;
  label?: string;
  ensName?: string;
}

interface TransactionSuccessProps {
  transactionHash: string;
  recipients: Recipient[];
  totalAmount: string;
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  splitMode: "EQUAL" | "UNEQUAL";
}

export const TransactionSuccess: React.FC<TransactionSuccessProps> = ({
  transactionHash,
  recipients,
  totalAmount,
  token,
  splitMode,
}) => {
  const router = useRouter();
  const { targetNetwork } = useTargetNetwork();
  const blockExplorerLink = getBlockExplorerTxLink(targetNetwork.id, transactionHash);

  const handleNewSplit = () => {
    localStorage.removeItem("pendingSplit");
    router.push("/");
  };

  const handleViewHistory = () => {
    localStorage.removeItem("pendingSplit");
    router.push("/history");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-base-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-success/20 to-primary/20 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-success rounded-full mb-4"
          >
            <CheckCircle className="w-12 h-12 text-success-content" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Split Successful!</h2>
          <p className="text-base-content/80">Your tokens have been distributed successfully</p>
        </div>

        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          <div className="bg-base-200 rounded-2xl p-4">
            <div className="text-center">
              <p className="text-sm text-base-content/60 mb-1">Total Amount Split</p>
              <p className="text-2xl font-bold">
                {totalAmount} {token.symbol}
              </p>
              <p className="text-sm text-base-content/60 mt-1">
                Distributed to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-base-content/60">Recipients</h3>
            <div className="bg-base-200 rounded-xl p-3 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {recipients.slice(0, 3).map(recipient => (
                  <div key={recipient.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Address address={recipient.address} format="short" />
                      {recipient.label && <span className="text-xs text-base-content/60">({recipient.label})</span>}
                    </div>
                    <span className="font-medium">
                      {splitMode === "EQUAL"
                        ? (parseFloat(totalAmount) / recipients.length).toFixed(4)
                        : recipient.amount}{" "}
                      {token.symbol}
                    </span>
                  </div>
                ))}
                {recipients.length > 3 && (
                  <div className="text-center text-sm text-base-content/60 pt-1">
                    and {recipients.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-base-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-base-content/60 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm break-all">
                  {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                </p>
              </div>
              <a
                href={blockExplorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </a>
            </div>
          </div>
        </div>

        <div className="p-6 bg-base-200/50 border-t border-base-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={handleNewSplit} className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" />
              New Split
            </button>
            <button onClick={handleViewHistory} className="btn btn-outline gap-2">
              <Users className="w-4 h-4" />
              View History
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
