"use client";

import React, { useState } from "react";
import { Download, FileText, Loader2, Plus, Upload } from "lucide-react";
import Papa from "papaparse";
import { AddressInput, InputBase } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, saveContacts } from "~~/utils/splitter";

const MAX_LABEL_LENGTH = 25;

interface AddressImportProps {
  existingContacts: Contact[];
  onContactsAdded: (newContacts: Contact[]) => void;
  onExport: () => void;
  className?: string;
}

export const AddressImport: React.FC<AddressImportProps> = ({
  existingContacts,
  onContactsAdded,
  onExport,
  className = "",
}) => {
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [importMode, setImportMode] = useState<"single" | "bulk">("single");

  const validateEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validateLabel = (label: string): { isValid: boolean; message?: string } => {
    if (!label.trim()) {
      return { isValid: false, message: "Label cannot be empty" };
    }
    if (label.length > MAX_LABEL_LENGTH) {
      return { isValid: false, message: `Label must be ${MAX_LABEL_LENGTH} characters or less` };
    }
    return { isValid: true };
  };

  const handleLabelChange = (value: string) => {
    if (value.length <= MAX_LABEL_LENGTH) {
      setNewLabel(value);
    }
  };

  const handleAddAddress = () => {
    if (!newAddress) {
      notification.error("Please enter both address and label");
      return;
    }

    if (!validateEthAddress(newAddress)) {
      notification.error("Please enter a valid Ethereum address");
      return;
    }

    const labelValidation = validateLabel(newLabel);
    if (!labelValidation.isValid) {
      notification.error(labelValidation.message!);
      return;
    }

    const exists = existingContacts.some(a => a.address.toLowerCase() === newAddress.toLowerCase());
    if (exists) {
      notification.error("This address already exists");
      return;
    }

    setIsAdding(true);
    setTimeout(() => {
      const newContact: Contact = {
        address: newAddress,
        label: newLabel,
      };

      onContactsAdded([newContact]);
      saveContacts([newContact]);

      setNewAddress("");
      setNewLabel("");
      setIsAdding(false);
      notification.success("Address added successfully");
    }, 500);
  };

  const handleBulkImport = () => {
    if (!bulkAddresses.trim()) {
      notification.error("Please enter addresses to import");
      return;
    }

    const lines = bulkAddresses
      .split(/[\n,]+/)
      .map(line => line.trim())
      .filter(Boolean);
    const newContacts: Contact[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[\s:]+/);
      const address = parts[0];
      let label = parts[1] || `Imported Address`;

      if (label.length > MAX_LABEL_LENGTH) {
        label = label.substring(0, MAX_LABEL_LENGTH);
        errors.push(`Line ${index + 1}: Label truncated to ${MAX_LABEL_LENGTH} characters`);
      }

      if (!validateEthAddress(address)) {
        errors.push(`Line ${index + 1}: Invalid address ${address}`);
        return;
      }

      const exists = existingContacts.some(a => a.address.toLowerCase() === address.toLowerCase());
      if (exists) {
        errors.push(`Line ${index + 1}: Address ${address} already exists`);
        return;
      }

      newContacts.push({ address, label });
    });

    if (errors.length > 0) {
      notification.error(`Import warnings: ${errors.join(", ")}`);
    }

    if (newContacts.length === 0) {
      notification.error("No valid addresses to import");
      return;
    }

    onContactsAdded(newContacts);
    saveContacts(newContacts);
    setBulkAddresses("");
    notification.success(`Successfully imported ${newContacts.length} addresses`);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete: results => {
          const newContacts: Contact[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index) => {
            if (index === 0 && row[0]?.toLowerCase().includes("address")) return;

            const address = row[0]?.trim();
            let label = row[1]?.trim() || `Imported ${index}`;

            if (!address) return;

            if (label.length > MAX_LABEL_LENGTH) {
              label = label.substring(0, MAX_LABEL_LENGTH);
              errors.push(`Row ${index + 1}: Label truncated to ${MAX_LABEL_LENGTH} characters`);
            }

            if (!validateEthAddress(address)) {
              errors.push(`Row ${index + 1}: Invalid address`);
              return;
            }

            if (!existingContacts.some(a => a.address.toLowerCase() === address.toLowerCase())) {
              newContacts.push({ address, label });
            }
          });

          if (newContacts.length > 0) {
            onContactsAdded(newContacts);
            saveContacts(newContacts);
            notification.success(`Imported ${newContacts.length} addresses from CSV`);
          }

          if (errors.length > 0) {
            notification.error(errors.join(", "));
          }
        },
        error: () => {
          notification.error("Failed to parse CSV file");
        },
      });
    } else if (file.type === "application/json" || file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const addressArray = Array.isArray(data) ? data : data.addresses || [];
          const newContacts: Contact[] = [];

          addressArray.forEach((item: any) => {
            const address = typeof item === "string" ? item : item.address;
            let label = typeof item === "object" ? item.label || `Imported` : `Imported`;

            if (label.length > MAX_LABEL_LENGTH) {
              label = label.substring(0, MAX_LABEL_LENGTH);
            }

            if (
              validateEthAddress(address) &&
              !existingContacts.some(a => a.address.toLowerCase() === address.toLowerCase())
            ) {
              newContacts.push({ address, label });
            }
          });

          if (newContacts.length > 0) {
            onContactsAdded(newContacts);
            saveContacts(newContacts);
            notification.success(`Imported ${newContacts.length} addresses from JSON`);
          }
        } catch (error) {
          notification.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`px-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-6">Add or Import Addresses</h2>

      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setImportMode("single")}
          className={`btn btn-md rounded-md ${importMode === "single" ? "btn-active" : "btn-ghost"}`}
        >
          Single Address
        </button>
        <button
          onClick={() => setImportMode("bulk")}
          className={`btn btn-md rounded-md ${importMode === "bulk" ? "btn-active" : "btn-ghost"}`}
        >
          Bulk Import
        </button>
      </div>

      {importMode === "single" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <AddressInput value={newAddress} onChange={setNewAddress} placeholder="0x..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Label (Optional)
              <span className="text-xs text-gray-500 ml-2">
                {newLabel.length}/{MAX_LABEL_LENGTH}
              </span>
            </label>
            <InputBase
              value={newLabel}
              onChange={handleLabelChange}
              placeholder="My Wallet"
              maxLength={MAX_LABEL_LENGTH}
            />
          </div>
          <button onClick={handleAddAddress} disabled={isAdding} className="w-full btn btn-md rounded-md btn-primary">
            {isAdding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add Address
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste [addresses labels] (one per line, or comma-separated)
              <br />
              <span className="text-xs text-gray-500">
                Note: Labels will be automatically truncated to {MAX_LABEL_LENGTH} characters
              </span>
            </label>
            <textarea
              value={bulkAddresses}
              onChange={e => setBulkAddresses(e.target.value)}
              placeholder="0xAbc123... My Wallet Label, &#10;0xDef456... Another Label"
              rows={6}
              className="w-full px-4 py-3 border border-base-100 rounded-xl focus:ring-2 focus:ring-base-300 focus:border-transparent transition-all font-mono text-sm"
            />
          </div>
          <div className="flex space-x-3">
            <button onClick={handleBulkImport} className="btn btn-md rounded-md bg-primary">
              <Upload className="w-5 h-5 mr-2" />
              Add Addresses
            </button>
            <label className="btn btn-md rounded-md bg-primary">
              <FileText className="w-5 h-5 mr-2" />
              Import from File
              <input type="file" accept=".csv,.json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">OR</div>

      <button onClick={onExport} className="btn btn-md rounded-md bg-primary w-full mt-6">
        <Download className="w-5 h-5 mr-2" />
        Export Addresses (CSV)
      </button>
    </div>
  );
};
