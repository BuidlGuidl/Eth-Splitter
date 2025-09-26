import React, { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Link2, Share2 } from "lucide-react";
import { parseUnits } from "viem";
import { useChainId } from "wagmi";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ShareConfigButtonProps {
  splitMode: "EQUAL" | "UNEQUAL";
  recipients: Array<{
    id: string;
    address: string;
    amount: string;
    label?: string;
  }>;
  selectedToken: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  } | null;
  equalAmount: string;
  className?: string;
}

export const ShareConfigButton: React.FC<ShareConfigButtonProps> = ({
  splitMode,
  recipients,
  selectedToken,
  equalAmount,
  className = "",
}) => {
  const chainId = useChainId();
  const { copyToClipboard, isCopiedToClipboard } = useCopyToClipboard();
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>("");

  const generateShareableUrl = useCallback(() => {
    const validRecipients = recipients.filter(r => r.address && r.address.trim() !== "");

    if (validRecipients.length === 0) {
      notification.error("Please add at least one recipient");
      return null;
    }

    if (!selectedToken) {
      notification.error("Please select a token");
      return null;
    }

    const params = new URLSearchParams();

    params.append("chainId", chainId.toString());
    params.append("mode", splitMode);

    if (selectedToken.address === "ETH") {
      params.append("token", "ETH");
    } else {
      params.append("token", selectedToken.address);
      params.append("tokenSymbol", selectedToken.symbol);
      params.append("tokenDecimals", selectedToken.decimals.toString());
    }

    validRecipients.forEach((recipient, index) => {
      params.append(`recipient_${index}`, recipient.address);
      if (recipient.label) {
        params.append(`label_${index}`, recipient.label);
      }
    });
    params.append("recipientCount", validRecipients.length.toString());

    if (splitMode === "EQUAL") {
      if (equalAmount && equalAmount.trim() !== "") {
        const decimals = selectedToken.address === "ETH" ? 18 : selectedToken.decimals;
        try {
          const rawAmount = parseUnits(equalAmount, decimals);
          params.append("equalAmount", rawAmount.toString());
        } catch {}
      }
    } else {
      validRecipients.forEach((recipient, index) => {
        if (recipient.amount && recipient.amount.trim() !== "") {
          const decimals = selectedToken.address === "ETH" ? 18 : selectedToken.decimals;
          try {
            const rawAmount = parseUnits(recipient.amount, decimals);
            params.append(`amount_${index}`, rawAmount.toString());
          } catch {
            params.append(`amount_${index}`, recipient.amount);
          }
        }
      });
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareableUrl = `${baseUrl}?${params.toString()}`;

    return shareableUrl;
  }, [splitMode, recipients, selectedToken, equalAmount, chainId]);

  const handleShareClick = () => {
    const url = generateShareableUrl();
    if (url) {
      setGeneratedUrl(url);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    if (generatedUrl) {
      await copyToClipboard(generatedUrl);
      notification.success("Share link copied to clipboard!");
    }
  };

  const handleNativeShare = async () => {
    if (generatedUrl && navigator.share) {
      try {
        await navigator.share({
          title: "Split Configuration",
          text: `Check out this split configuration for ${selectedToken?.symbol || "tokens"}`,
          url: generatedUrl,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleShareClick}
        className={`btn btn-md btn-ghost rounded-md gap-2 ${className}`}
        title="Share split configuration"
      >
        <Share2 className="w-4 h-4" />
        Share Config
      </button>

      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-base-100 rounded-2xl shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Share Split Configuration
                </h3>
                <button onClick={() => setShowShareModal(false)} className="btn btn-sm btn-circle btn-ghost">
                  ✕
                </button>
              </div>

              <p className="text-sm text-base-content/70 mb-4">
                Share this link with others to let them execute the same split configuration:
              </p>

              <div className="bg-base-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedUrl}
                    className="input input-sm flex-1 bg-base-200 border-none text-xs"
                    onClick={e => e.currentTarget.select()}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleCopyLink} className="btn btn-primary flex-1 gap-2">
                  {isCopiedToClipboard ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>

                {typeof navigator.share && (
                  <button onClick={handleNativeShare} className="btn btn-primary gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
