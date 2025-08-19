"use client";

import React, { useState } from "react";
import { SplitMode } from "../page";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Info, Upload, X } from "lucide-react";
import { getAddress, isAddress } from "viem";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";
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
  existingRecipients?: Recipient[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  splitMode,
  savedContacts,
  existingRecipients = [],
}) => {
  const [bulkText, setBulkText] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const publicClient = usePublicClient({ chainId: 1 });

  const resolveENSName = async (ensName: string): Promise<string | null> => {
    if (!publicClient) return null;

    try {
      const normalizedName = normalize(ensName);
      const address = await publicClient.getEnsAddress({ name: normalizedName });
      return address ? getAddress(address) : null;
    } catch (error) {
      console.error(`Failed to resolve ENS name ${ensName}:`, error);
      return null;
    }
  };

  const detectSplitType = (lines: string[]): SplitMode => {
    for (const line of lines) {
      const parts = line.split(/[,\s:]+/).filter(Boolean);
      if (parts.length >= 2) {
        const secondPart = parts[1];
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
      const lines = bulkText
        .split(/[\n;]+/)
        .map(line => line.trim())
        .filter(Boolean);

      const detectedMode = detectSplitType(lines);

      if (detectedMode !== splitMode) {
        notification.warning(
          `Data appears to be for ${detectedMode} split. Please switch to ${detectedMode} mode or adjust your data.`,
        );
        setIsResolving(false);
        return;
      }

      const recipients: Recipient[] = [];
      const errors: string[] = [];
      const validatedAddresses = new Set<string>();

      // Get existing addresses (case-insensitive)
      const existingAddresses = new Set(existingRecipients.map(r => r.address.toLowerCase()).filter(Boolean));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/[,\s:]+/).filter(Boolean);

        if (parts.length === 0) continue;

        const addressOrEns = parts[0];
        let amount = "";
        let label = "";

        if (splitMode === "UNEQUAL") {
          amount = parts[1] || "";
          label = parts.slice(2).join(" ") || "";

          if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            errors.push(`Line ${i + 1}: Invalid or missing amount for address ${addressOrEns}`);
            continue;
          }
        } else {
          label = parts.slice(1).join(" ") || "";
        }

        let resolvedAddress = "";
        let ensName = "";

        // Check if it's an ENS name
        if (addressOrEns.includes(".")) {
          const resolved = await resolveENSName(addressOrEns);
          if (resolved) {
            resolvedAddress = resolved;
            ensName = addressOrEns;
          } else {
            errors.push(`Line ${i + 1}: Could not resolve ENS name: ${addressOrEns}`);
            continue;
          }
        } else if (isAddress(addressOrEns)) {
          resolvedAddress = getAddress(addressOrEns);
        } else {
          errors.push(`Line ${i + 1}: Invalid address format: ${addressOrEns}`);
          continue;
        }

        // Check for duplicates within the import
        const addressLower = resolvedAddress.toLowerCase();
        if (validatedAddresses.has(addressLower)) {
          errors.push(`Line ${i + 1}: Duplicate address ${addressOrEns} (already in import list)`);
          continue;
        }

        // Check for duplicates with existing recipients
        if (existingAddresses.has(addressLower)) {
          errors.push(`Line ${i + 1}: Address ${addressOrEns} already exists in recipients list`);
          continue;
        }

        validatedAddresses.add(addressLower);

        // Check if this address has a saved label
        const savedContact = savedContacts.find(c => c.address.toLowerCase() === resolvedAddress.toLowerCase());

        recipients.push({
          id: Date.now().toString() + i,
          address: resolvedAddress,
          amount: amount,
          label: label || savedContact?.label || (ensName ? ensName : ""),
          ensName: ensName,
        });
      }

      if (errors.length > 0) {
        const errorMessage =
          errors.length > 3
            ? `Import completed with ${errors.length} warnings:\n${errors.slice(0, 3).join("\n")}...`
            : `Import completed with warnings:\n${errors.join("\n")}`;
        notification.warning(errorMessage);
      }

      if (recipients.length === 0) {
        notification.error("No valid addresses found to import");
        setIsResolving(false);
        return;
      }

      onImport(recipients);
      setBulkText("");
      notification.success(`Successfully imported ${recipients.length} recipients`);
      onClose();
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

  const handleImportFromContacts = () => {
    // Filter out contacts that are already in the recipients list
    const existingAddresses = new Set(existingRecipients.map(r => r.address.toLowerCase()).filter(Boolean));

    const availableContacts = savedContacts.filter(contact => !existingAddresses.has(contact.address.toLowerCase()));

    if (availableContacts.length === 0) {
      notification.warning("All saved contacts are already in the recipients list");
      return;
    }

    const contactsText = availableContacts
      .map(contact => {
        if (splitMode === "EQUAL") {
          return `${contact.address}, ${contact.label}`;
        } else {
          return `${contact.address}, , ${contact.label}`;
        }
      })
      .join("\n");

    setBulkText(contactsText);
    notification.success(`Loaded ${availableContacts.length} contacts (excluding duplicates)`);
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
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={
                  splitMode === "EQUAL"
                    ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, Alice\nvitalik.eth\n0x123...abc, Bob"
                    : "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, 1.5, Alice\nvitalik.eth, 2.0\n0x123...abc, 0.5, Bob"
                }
                className="textarea textarea-bordered w-full h-40 font-mono text-sm rounded-md "
                disabled={isResolving}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-sm btn-ghost">
                <Upload className="w-4 h-4 mr-2" />
                Import File
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={isResolving}
                />
              </label>

              {savedContacts.length > 0 && (
                <button onClick={handleImportFromContacts} className="btn btn-sm btn-ghost" disabled={isResolving}>
                  <FileText className="w-4 h-4 mr-2" />
                  Import from Contacts
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-ghost" disabled={isResolving}>
              Cancel
            </button>
            <button onClick={handleImport} className="btn btn-primary" disabled={!bulkText.trim() || isResolving}>
              {isResolving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Resolving...
                </>
              ) : (
                "Import Recipients"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
