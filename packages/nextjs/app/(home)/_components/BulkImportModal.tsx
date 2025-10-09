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

      const recipients: Recipient[] = [];
      const errors: string[] = [];
      const validatedAddresses = new Set<string>();

      const existingAddresses = new Set(existingRecipients.map(r => r.address.toLowerCase()).filter(Boolean));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/[,\s:]+/).filter(Boolean);

        if (parts.length === 0) continue;

        const addressOrEns = parts[0];
        let amount = "";

        if (splitMode === "UNEQUAL") {
          if (parts.length >= 2) {
            amount = parts[1] || "";

            if (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
              errors.push(`Line ${i + 1}: Invalid amount for address ${addressOrEns}`);
              continue;
            }
          }
        }

        let resolvedAddress = "";
        let ensName = "";

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

        const addressLower = resolvedAddress.toLowerCase();
        if (validatedAddresses.has(addressLower)) {
          errors.push(`Line ${i + 1}: Duplicate address ${addressOrEns} (already in import list)`);
          continue;
        }

        if (existingAddresses.has(addressLower)) {
          errors.push(`Line ${i + 1}: Address ${addressOrEns} already exists in recipients list`);
          continue;
        }

        validatedAddresses.add(addressLower);

        recipients.push({
          id: Date.now().toString() + i,
          address: resolvedAddress,
          amount: amount,
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
    const existingAddresses = new Set(existingRecipients.map(r => r.address.toLowerCase()).filter(Boolean));

    const availableContacts = savedContacts.filter(contact => !existingAddresses.has(contact.address.toLowerCase()));

    if (availableContacts.length === 0) {
      notification.warning("All saved contacts are already in the recipients list");
      return;
    }

    const contactsText = availableContacts
      .map(contact => {
        if (splitMode === "EQUAL") {
          return `${contact.address}`;
        } else {
          return `${contact.address}`;
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
          <p className="mt-2">Examples:</p>
          <code className="block bg-base-300 p-2 rounded mt-1 md:text-xs text-[0.6rem]">
            0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B
            <br />
            vitalik.eth
            <br />
            0x123...abc
          </code>
        </div>
      );
    } else {
      return (
        <div className="space-y-1 text-xs">
          <p className="font-medium">Format for Custom Split:</p>
          <p>• Address/ENS (amount is optional)</p>
          <p>• If amount is provided: Address/ENS, Amount</p>
          <p>• If no amount: just Address/ENS</p>
          <p className="mt-2">Examples:</p>
          <code className="block bg-base-300 p-2 rounded mt-1 md:text-xs text-[0.6rem]">
            0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, 1.5
            <br />
            vitalik.eth
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
          className="bg-base-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-base-100">
            <h2 className="text-xl font-semibold">Bulk Add Recipients</h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="bg-info/10 border border-base-100 rounded-lg p-4">
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
                    ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B\nvitalik.eth\n0x123...abc"
                    : "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA7B, 1.5\nvitalik.eth\n0x123...abc, 0.5"
                }
                className="textarea textarea-bordered w-full h-40 font-mono text-sm rounded-md bg-base-200"
                disabled={isResolving}
              />
            </div>

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
                "Add Recipients"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
