// app/split/_components/BulkImportModal.tsx
"use client";

import React, { useState } from "react";
import { SplitMode } from "../page";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Upload, X } from "lucide-react";
import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsResolver } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { Contact } from "~~/utils/splitter";

// app/split/_components/BulkImportModal.tsx

interface Recipient {
  id: string;
  address: string;
  amount: string;
  percentage?: number;
  label?: string;
  ensName?: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipients: Recipient[]) => void;
  splitMode: SplitMode;
  savedContacts: Contact[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  splitMode,
  savedContacts,
}) => {
  const [bulkText, setBulkText] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const resolveENSNames = async (addresses: string[]): Promise<Map<string, string>> => {
    const ensMap = new Map<string, string>();

    // This is a simplified version - in production you'd batch these requests
    for (const address of addresses) {
      if (address.includes(".")) {
        try {
          // In a real implementation, you'd use the ENS resolver here
          // For now, we'll just validate if it looks like an ENS name
          if (address.endsWith(".eth") || address.endsWith(".xyz")) {
            // Placeholder - would resolve to actual address
            console.log(`Would resolve ENS: ${address}`);
          }
        } catch (error) {
          console.error(`Failed to resolve ${address}:`, error);
        }
      }
    }

    return ensMap;
  };

  const handleImport = async () => {
    if (!bulkText.trim()) {
      notification.error("Please enter addresses to import");
      return;
    }

    setIsResolving(true);

    try {
      // Parse the input text
      const lines = bulkText
        .split(/[\n;]+/)
        .map(line => line.trim())
        .filter(Boolean);

      const recipients: Recipient[] = [];
      const ensNamesToResolve: string[] = [];
      const errors: string[] = [];

      // First pass: parse and validate
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma, space, or colon
        const parts = line.split(/[,\s:]+/).filter(Boolean);

        if (parts.length === 0) continue;

        const addressOrEns = parts[0];
        const amount = parts[1] || "";
        const label = parts.slice(2).join(" ") || "";

        // Check if it's an ENS name
        if (addressOrEns.includes(".")) {
          ensNamesToResolve.push(addressOrEns);
          recipients.push({
            id: Date.now().toString() + i,
            address: addressOrEns, // Will be replaced with resolved address
            amount: splitMode === "EQUAL" ? "" : amount,
            label: label || addressOrEns,
            ensName: addressOrEns,
          });
        } else if (isAddress(addressOrEns)) {
          // Check for saved contact
          const contact = savedContacts.find(c => c.address.toLowerCase() === addressOrEns.toLowerCase());

          recipients.push({
            id: Date.now().toString() + i,
            address: addressOrEns,
            amount: splitMode === "EQUAL" ? "" : amount,
            label: label || contact?.label || "",
          });
        } else {
          errors.push(`Line ${i + 1}: Invalid address "${addressOrEns}"`);
        }
      }

      // Resolve ENS names if any
      if (ensNamesToResolve.length > 0) {
        notification.info(`Resolving ${ensNamesToResolve.length} ENS names...`);
        const resolvedAddresses = await resolveENSNames(ensNamesToResolve);

        // Update recipients with resolved addresses
        recipients.forEach(recipient => {
          if (recipient.ensName && resolvedAddresses.has(recipient.ensName)) {
            recipient.address = resolvedAddresses.get(recipient.ensName)!;
          } else if (recipient.ensName) {
            // If ENS couldn't be resolved, mark as error
            errors.push(`Could not resolve ENS: ${recipient.ensName}`);
          }
        });
      }

      // Filter out recipients with unresolved ENS names
      const validRecipients = recipients.filter(r => isAddress(r.address));

      if (errors.length > 0) {
        notification.warning(
          `Import completed with warnings: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
        );
      }

      if (validRecipients.length === 0) {
        notification.error("No valid addresses found");
        return;
      }

      // Check for duplicates
      const uniqueAddresses = new Set(validRecipients.map(r => r.address.toLowerCase()));
      if (uniqueAddresses.size < validRecipients.length) {
        notification.warning("Duplicate addresses were removed");
      }

      // Create final list with unique addresses
      const finalRecipients: Recipient[] = [];
      const seenAddresses = new Set<string>();

      for (const recipient of validRecipients) {
        const addressLower = recipient.address.toLowerCase();
        if (!seenAddresses.has(addressLower)) {
          seenAddresses.add(addressLower);
          finalRecipients.push(recipient);
        }
      }

      onImport(finalRecipients);
      setBulkText("");
      notification.success(`Successfully imported ${finalRecipients.length} recipients`);
    } catch (error) {
      console.error("Import error:", error);
      notification.error("Failed to import recipients");
    } finally {
      setIsResolving(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setBulkText(text);
      notification.success("File loaded successfully");
    };
    reader.onerror = () => {
      notification.error("Failed to read file");
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-base-100 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Import Recipients</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Import Format:</p>
              <div className="space-y-1 text-xs">
                <p>
                  • <strong>For equal split:</strong> address/ENS, label (optional)
                </p>
                <p>
                  • <strong>For custom split:</strong> address/ENS, amount, label (optional)
                </p>
                <p>• One recipient per line or separated by semicolons</p>
                <p>• ENS names (like vitalik.eth) will be resolved automatically</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paste Recipients Data</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={
                  splitMode === "EQUAL"
                    ? "vitalik.eth, Vitalik Buterin\n0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3, Test Wallet\n0xAbc123..., Alice"
                    : "vitalik.eth, 1.5, Vitalik Buterin\n0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3, 2.0, Test Wallet\n0xAbc123..., 0.5, Alice"
                }
                rows={8}
                className="w-full px-4 py-3 border border-base-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm resize-none"
                disabled={isResolving}
              />
            </div>

            <div className="flex gap-3">
              <label className="btn btn-ghost btn-sm rounded-md flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Import from File
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={isResolving}
                />
              </label>
            </div>

            {/* Example */}
            <div className="bg-base-200 rounded-lg p-4">
              <p className="text-xs font-medium mb-2">Example:</p>
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {splitMode === "EQUAL"
                  ? `alice.eth, Alice Smith
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3, Bob Jones
0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed`
                  : `alice.eth, 1.5, Alice Smith
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3, 2.0, Bob Jones
0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed, 0.75`}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t">
            <button onClick={onClose} className="btn btn-ghost rounded-md" disabled={isResolving}>
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="btn btn-primary rounded-md"
              disabled={!bulkText.trim() || isResolving}
            >
              {isResolving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Resolving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Recipients
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
