"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, Download, Edit, FileText, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";
import { AddressInput } from "~~/components/scaffold-eth";
import { InputBase } from "~~/components/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { loadContacts, removeContact, saveContacts, updateContact } from "~~/utils/splitter";

const CONTACTS_STORAGE_KEY = "ES_CONTACTS_SK";
const MAX_LABEL_LENGTH = 25;

interface Contact {
  address: string;
  label: string;
}

export default function Contacts() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Contact[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [importMode, setImportMode] = useState<"single" | "bulk">("single");
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  useEffect(() => {
    const loadedContacts = loadContacts();
    setAddresses(loadedContacts);
  }, []);

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

  const handleLabelChange = (value: string, setter: (value: string) => void) => {
    if (value.length <= MAX_LABEL_LENGTH) {
      setter(value);
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

    const exists = addresses?.some(a => a.address.toLowerCase() === newAddress.toLowerCase());
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

      const updatedAddresses = [...addresses, newContact];
      setAddresses(updatedAddresses);
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

      // Truncate label if it exceeds max length
      if (label.length > MAX_LABEL_LENGTH) {
        label = label.substring(0, MAX_LABEL_LENGTH);
        errors.push(`Line ${index + 1}: Label truncated to ${MAX_LABEL_LENGTH} characters`);
      }

      if (!validateEthAddress(address)) {
        errors.push(`Line ${index + 1}: Invalid address ${address}`);
        return;
      }

      const exists = addresses?.some(a => a.address.toLowerCase() === address.toLowerCase());
      if (exists) {
        errors.push(`Line ${index + 1}: Address ${address} already exists`);
        return;
      }

      newContacts.push({
        address,
        label,
      });
    });

    if (errors.length > 0) {
      notification.error(`Import warnings: ${errors.join(", ")}`);
    }

    if (newContacts.length === 0) {
      notification.error("No valid addresses to import");
      return;
    }

    const updatedAddresses = [...(addresses || []), ...newContacts];
    setAddresses(updatedAddresses);
    saveContacts(newContacts); // Save to localStorage
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

            // Truncate label if it exceeds max length
            if (label.length > MAX_LABEL_LENGTH) {
              label = label.substring(0, MAX_LABEL_LENGTH);
              errors.push(`Row ${index + 1}: Label truncated to ${MAX_LABEL_LENGTH} characters`);
            }

            if (!validateEthAddress(address)) {
              errors.push(`Row ${index + 1}: Invalid address`);
              return;
            }

            if (!addresses?.some(a => a.address.toLowerCase() === address.toLowerCase())) {
              newContacts.push({
                address,
                label,
              });
            }
          });

          if (newContacts.length > 0) {
            const updatedAddresses = [...(addresses || []), ...newContacts];
            setAddresses(updatedAddresses);
            saveContacts(newContacts); // Save to localStorage
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
          const errors: string[] = [];

          addressArray.forEach((item: any, index: number) => {
            const address = item.address || item;
            let label = item.label || `Imported ${index + 1}`;

            // Truncate label if it exceeds max length
            if (label.length > MAX_LABEL_LENGTH) {
              label = label.substring(0, MAX_LABEL_LENGTH);
              errors.push(`Item ${index + 1}: Label truncated to ${MAX_LABEL_LENGTH} characters`);
            }

            if (
              validateEthAddress(address) &&
              !addresses?.some(a => a.address.toLowerCase() === address.toLowerCase())
            ) {
              newContacts.push({
                address,
                label,
              });
            }
          });

          if (newContacts.length > 0) {
            const updatedAddresses = [...addresses, ...newContacts];
            setAddresses(updatedAddresses);
            saveContacts(newContacts); // Save to localStorage
            notification.success(`Imported ${newContacts.length} addresses from JSON`);
          }

          if (errors.length > 0) {
            notification.error(errors.join(", "));
          }
        } catch (error) {
          notification.error("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    } else {
      notification.error("Please upload a CSV or JSON file");
    }
  };

  const handleDeleteAddress = (address: string) => {
    const updatedAddresses = addresses?.filter(a => a.address !== address);
    setAddresses(updatedAddresses || []);
    removeContact(address); // Remove from localStorage
    notification.success("Address removed");
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    notification.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleStartEdit = (contact: Contact) => {
    setEditingContact(contact.address);
    setEditLabel(contact.label);
  };

  const handleSaveEdit = (address: string) => {
    const labelValidation = validateLabel(editLabel);
    if (!labelValidation.isValid) {
      notification.error(labelValidation.message!);
      return;
    }

    const updatedAddresses = addresses?.map(addr => (addr.address === address ? { ...addr, label: editLabel } : addr));
    setAddresses(updatedAddresses || []);
    updateContact(address, editLabel); // Update in localStorage
    setEditingContact(null);
    setEditLabel("");
    notification.success("Contact updated successfully");
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setEditLabel("");
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    // Save all current addresses to localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(addresses));
    }

    setTimeout(() => {
      setIsSaving(false);
      notification.success("All changes saved successfully");
      router.push("/dashboard");
    }, 1000);
  };

  const handleExport = () => {
    const csvContent = Papa.unparse(
      addresses.map(a => ({
        address: a.address,
        label: a.label,
      })),
    );

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "addresses.csv";
    link.click();
    notification.success("Addresses exported successfully");
  };

  return (
    <div className="max-w-6xl w-full mx-auto py-10 min-h-screen px-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8">Address Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="px-4">
            <h2 className="text-xl font-semibold mb-6">Add or Import Addresses</h2>

            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setImportMode("single")}
                className={`btn btn-md rounded-md  ${importMode === "single" ? "btn-active" : "btn-ghost"}`}
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
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <AddressInput
                    value={newAddress}
                    onChange={value => setNewAddress(value)}
                    placeholder="e.g., 0xAbc123..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Label (optional) ({newLabel.length}/{MAX_LABEL_LENGTH})
                  </label>
                  <InputBase
                    value={newLabel}
                    onChange={value => handleLabelChange(value, setNewLabel)}
                    placeholder="e.g., My Personal Wallet"
                    maxLength={MAX_LABEL_LENGTH}
                  />
                  {newLabel.length >= MAX_LABEL_LENGTH && (
                    <p className="text-xs text-error mt-1">Maximum character limit reached</p>
                  )}
                </div>
                <button onClick={handleAddAddress} disabled={isAdding} className="btn btn-md rounded-md bg-primary">
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
                    className="w-full px-4 py-3 border border-base-100  rounded-xl focus:ring-2 focus:ring-base-300 focus:border-transparent transition-all font-mono text-sm"
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

            <button onClick={handleExport} className="btn btn-md rounded-md bg-primary w-full">
              <Download className="w-5 h-5 mr-2" />
              Export Addresses (CSV)
            </button>
          </div>

          <div className="md:border-l border-base-100 px-4">
            <h2 className="text-xl font-semibold mb-6">Saved Contacts</h2>
            <p className="mb-6">Review and manage your contacts.</p>

            {addresses?.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="">No addresses added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-base-100">
                    <tr>
                      <th className="text-left pb-3 text-sm font-medium">Address</th>
                      <th className="text-left pb-3 text-sm font-medium">Label</th>
                      <th className="text-right pb-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-100">
                    <AnimatePresence>
                      {addresses?.map(contact => (
                        <motion.tr
                          key={contact.address}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="group"
                        >
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              <Address address={contact.address} />
                            </div>
                          </td>
                          <td className="py-4">
                            {editingContact === contact.address ? (
                              <div className="flex items-center space-x-2">
                                <div className="flex flex-col">
                                  <InputBase
                                    value={editLabel}
                                    onChange={value => handleLabelChange(value, setEditLabel)}
                                    placeholder="Enter label"
                                    maxLength={MAX_LABEL_LENGTH}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">
                                    {editLabel.length}/{MAX_LABEL_LENGTH}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleSaveEdit(contact.address)}
                                  className="btn btn-sm btn-success"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost">
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm" title={contact.label}>
                                  {contact.label ? contact.label : "-"}
                                </span>
                                <button
                                  onClick={() => handleStartEdit(contact)}
                                  className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteAddress(contact.address)}
                              className="btn btn-sm rounded-md text-error btn-ghost"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="w-full btn btn-md rounded-md btn-success mt-5"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes & Go to Dashboard
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
