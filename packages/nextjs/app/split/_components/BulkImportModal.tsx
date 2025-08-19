"use client";

import React, { useState } from "react";
import { SplitMode } from "../page";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Info, Upload, X } from "lucide-react";
import { isAddress } from "viem";
import { notification } from "~~/utils/scaffold-eth";
import { Contact } from "~~/utils/splitter";

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

  const detectSplitType = (lines: string[]): SplitMode => {
    // Check if any line has a numeric value that could be an amount
    for (const line of lines) {
      const parts = line.split(/[,\s:]+/).filter(Boolean);
      if (parts.length >= 2) {
        const secondPart = parts[1];
        // Check if second part is a number (amount)
        if (/^\d+\.?\d*$/.test(secondPart)) {
          return "UNEQUAL";
        }
      }
    }
    return "EQUAL";
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

      // Detect the type of split based on the data format
      const detectedMode = detectSplitType(lines);

      if (detectedMode !== splitMode) {
        notification.warning(
          `Data appears to be for ${detectedMode} split. Please switch to ${detectedMode} mode or adjust your data.`,
        );
        setIsResolving(false);
        return;
      }

      const recipients: Recipient[] = [];
      const ensNamesToResolve: string[] = [];
      const errors: string[] = [];

      // Parse each line based on the split mode
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma, space, or colon
        const parts = line.split(/[,\s:]+/).filter(Boolean);

        if (parts.length === 0) continue;

        const addressOrEns = parts[0];
        let amount = "";
        let label = "";

        if (splitMode === "UNEQUAL") {
          // For unequal split: address, amount, label (optional)
          amount = parts[1] || "";
          label = parts.slice(2).join(" ") || "";

          // Validate amount for unequal split
          if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            errors.push(`Line ${i + 1}: Invalid or missing amount for address ${addressOrEns}`);
            continue;
          }
        } else {
          // For equal split: address, label (optional)
          label = parts.slice(1).join(" ") || "";
        }

        // Check if it's an ENS name
        if (addressOrEns.includes(".")) {
          ensNamesToResolve.push(addressOrEns);
          recipients.push({
            id: Date.now().toString() + i,
            address: "", // Will be resolved
            amount: amount,
            label: label || addressOrEns,
            ensName: addressOrEns,
          });
        } else if (isAddress(addressOrEns)) {
          // Check if this address has a saved label
          const savedContact = savedContacts.find(c => c.address.toLowerCase() === addressOrEns.toLowerCase());

          recipients.push({
            id: Date.now().toString() + i,
            address: addressOrEns,
            amount: amount,
            label: label || savedContact?.label || "",
          });
        } else {
          errors.push(`Line ${i + 1}: Invalid address format: ${addressOrEns}`);
        }
      }

      // Resolve ENS names if any
      if (ensNamesToResolve.length > 0) {
        const ensResolutions = await resolveENSNames(ensNamesToResolve);

        recipients.forEach(recipient => {
          if (recipient.ensName && ensResolutions.has(recipient.ensName)) {
            recipient.address = ensResolutions.get(recipient.ensName) || "";
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

  const getInstructions = () => {
    if (splitMode === "EQUAL") {
      return (
        <div className="space-y-1 text-xs">
          <p className="font-medium">Format for Equal Split:</p>
          <p>• One address/ENS per line</p>
          <p>• Optional: Add label after address (comma or space separated)</p>
          <p className="mt-2 text-gray-600">Examples:</p>
          <code className="block bg-base-300 p-2 rounded mt-1">
            0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, Alice
            <br />
            vitalik.eth, Vitalik
            <br />
            0x123...abc
          </code>
        </div>
      );
    } else {
      return (
        <div className="space-y-1 text-xs">
          <p className="font-medium">Format for Custom Split:</p>
          <p>• Address/ENS, Amount, Label (optional)</p>
          <p>• Amount is required for each recipient</p>
          <p className="mt-2 text-gray-600">Examples:</p>
          <code className="block bg-base-300 p-2 rounded mt-1">
            0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, 1.5, Alice
            <br />
            vitalik.eth, 2.0, Vitalik
            <br />
            0x123...abc, 0.5
          </code>
        </div>
      );
    }
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
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">{getInstructions()}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paste Recipients Data</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={
                  splitMode === "EQUAL"
                    ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, Alice\nvitalik.eth, Vitalik\n0x123...abc"
                    : "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, 1.5, Alice\nvitalik.eth, 2.0, Vitalik\n0x123...abc, 0.5"
                }
                className="textarea textarea-bordered w-full h-48 font-mono text-sm rounded-md mt-2"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="btn btn-sm btn-ghost">
                <FileText className="w-4 h-4 mr-2" />
                Upload File
                <input type="file" accept=".txt,.csv" onChange={handleFileImport} className="hidden" />
              </label>
              <span className="text-xs opacity-70">Supports .txt and .csv files</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t">
            <div className="text-sm opacity-70">
              {bulkText && `${bulkText.split(/[\n;]+/).filter(Boolean).length} lines detected`}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn btn-sm btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!bulkText.trim() || isResolving}
                className="btn btn-sm btn-primary"
              >
                {isResolving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Resolving...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
