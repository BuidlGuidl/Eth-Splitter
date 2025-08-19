"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AssetSelector } from "./_components/AssetSelector";
import { BulkImportModal } from "./_components/BulkImportModal";
import { RecipientRow } from "./_components/RecipientRow";
import { SplitModeSelector } from "./_components/SplitModeSelector";
import { TotalAmountDisplay } from "./_components/TotalAmountDisplay";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Download, Plus, Upload } from "lucide-react";
import { isAddress } from "viem";
import { useAccount, useChainId } from "wagmi";
import { Address, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useTokenBalance } from "~~/hooks/useTokenBalance";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, loadCache, loadContacts, updateCacheAmounts, updateCacheWallets } from "~~/utils/splitter";

interface Recipient {
  id: string;
  address: string;
  amount: string;
  percentage?: number;
  label?: string;
  ensName?: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export type SplitMode = "EQUAL" | "UNEQUAL";

export default function Split() {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", address: "", amount: "", label: "" },
    { id: "2", address: "", amount: "", label: "" },
    { id: "3", address: "", amount: "", label: "" },
  ]);
  const [totalAmount, setTotalAmount] = useState("");
  const [equalAmount, setEqualAmount] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);

  const tokenBalance = useTokenBalance(selectedToken?.address);
  const isCalculatingRef = useRef(false);

  useEffect(() => {
    const contacts = loadContacts();
    setSavedContacts(contacts);

    const cache = loadCache();
    if (cache) {
      if (cache.wallets && cache.wallets.length > 0) {
        const cachedRecipients = cache.wallets.map((wallet, index) => ({
          id: Date.now().toString() + index,
          address: wallet,
          amount: cache.amounts?.[index] || "",
          label: contacts.find(c => c.address === wallet)?.label || "",
        }));
        setRecipients(cachedRecipients);
      }
      if (cache.amount) {
        setEqualAmount(cache.amount);
      }
    }
  }, []);

  useEffect(() => {
    const wallets = recipients.map(r => r.address).filter(Boolean);
    const amounts = recipients.map(r => r.amount);

    if (wallets.length > 0) {
      updateCacheWallets(wallets);
      updateCacheAmounts(amounts);
    }
  }, [recipients]);

  const validateAddress = (address: string): boolean => {
    return isAddress(address);
  };

  const validateAmount = (amount: string): boolean => {
    if (!amount) return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: "",
      amount: "",
      label: "",
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 2) {
      setRecipients(recipients.filter(r => r.id !== id));
    } else {
      notification.error("Minimum 2 recipients required");
    }
  };

  const updateRecipient = useCallback(
    (id: string, field: keyof Recipient, value: string) => {
      setRecipients(prevRecipients => {
        const updated = prevRecipients.map(r => {
          if (r.id === id) {
            const newRecipient = { ...r, [field]: value };

            // Auto-fill label if address matches a saved contact
            if (field === "address" && value) {
              const contact = savedContacts.find(c => c.address.toLowerCase() === value.toLowerCase());
              if (contact) {
                newRecipient.label = contact.label;
              }
            }

            return newRecipient;
          }
          return r;
        });
        return updated;
      });

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${id}-${field}`];
        return newErrors;
      });
    },
    [savedContacts],
  );

  const handleBulkImport = (importedRecipients: Recipient[]) => {
    setRecipients(prevRecipients => [...prevRecipients, ...importedRecipients]);
    setShowBulkImport(false);
    notification.success(`Imported ${importedRecipients.length} recipients`);
  };

  const handleImportFromStorage = () => {
    const contacts = loadContacts();
    if (contacts.length === 0) {
      notification.error("No saved contacts found");
      return;
    }

    setShowContactSelector(true);
  };

  const handleContactSelection = () => {
    if (selectedContacts.size === 0) {
      notification.error("Please select at least one contact");
      return;
    }

    // Get existing addresses (case-insensitive)
    const existingAddresses = new Set(recipients.map(r => r.address.toLowerCase()).filter(Boolean));

    // Filter out contacts that are already in the recipients list
    const contactsToImport = Array.from(selectedContacts).filter(
      address => !existingAddresses.has(address.toLowerCase()),
    );

    if (contactsToImport.length === 0) {
      notification.warning("All selected contacts are already in the recipients list");
      setShowContactSelector(false);
      setSelectedContacts(new Set());
      return;
    }

    const newRecipients = contactsToImport.map((address, index) => {
      const contact = savedContacts.find(c => c.address === address);
      return {
        id: Date.now().toString() + index,
        address: address,
        amount: "",
        label: contact?.label || "",
      };
    });

    // Append to existing recipients instead of replacing
    setRecipients(prevRecipients => [...prevRecipients, ...newRecipients]);
    setShowContactSelector(false);
    setSelectedContacts(new Set());

    const skippedCount = selectedContacts.size - contactsToImport.length;
    if (skippedCount > 0) {
      notification.success(`Imported ${newRecipients.length} contacts (${skippedCount} duplicates skipped)`);
    } else {
      notification.success(`Imported ${newRecipients.length} contacts`);
    }
  };

  const calculateDistribution = useCallback(() => {
    if (isCalculatingRef.current) return;
    isCalculatingRef.current = true;

    try {
      if (splitMode === "EQUAL") {
        const validRecipients = recipients.filter(r => validateAddress(r.address));
        if (validRecipients.length === 0) {
          setTotalAmount("");
          return;
        }

        const amount = parseFloat(equalAmount);
        if (!amount || isNaN(amount)) {
          setTotalAmount("");
          return;
        }

        const totalNeeded = amount * validRecipients.length;
        setTotalAmount(totalNeeded.toString());

        // Only update recipients if amounts have actually changed
        setRecipients(prevRecipients =>
          prevRecipients.map(r => ({
            ...r,
            amount: validateAddress(r.address) ? equalAmount : "",
            percentage: validateAddress(r.address) ? 100 / validRecipients.length : 0,
          })),
        );
      } else {
        const total = recipients.reduce((sum, r) => {
          const amount = parseFloat(r.amount || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        setTotalAmount(total.toString());

        // Only update percentages, not amounts
        setRecipients(prevRecipients =>
          prevRecipients.map(r => {
            const amount = parseFloat(r.amount || "0");
            return {
              ...r,
              percentage: total > 0 && !isNaN(amount) ? (amount / total) * 100 : 0,
            };
          }),
        );
      }
    } finally {
      isCalculatingRef.current = false;
    }
  }, [splitMode, equalAmount, recipients]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    recipients.forEach(r => {
      if (!r.address) {
        newErrors[`${r.id}-address`] = "Address required";
        isValid = false;
      } else if (!validateAddress(r.address)) {
        newErrors[`${r.id}-address`] = "Invalid address";
        isValid = false;
      }

      if (splitMode === "UNEQUAL" && !validateAmount(r.amount)) {
        newErrors[`${r.id}-amount`] = "Valid amount required";
        isValid = false;
      }
    });

    if (splitMode === "EQUAL" && !validateAmount(equalAmount)) {
      newErrors["equalAmount"] = "Valid amount required";
      isValid = false;
    }

    if (!selectedToken) {
      notification.error("Please select a token");
      isValid = false;
    }

    const addresses = recipients.map(r => r.address).filter(Boolean);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      notification.error("Duplicate addresses detected");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleReviewSplit = () => {
    if (!validateForm()) {
      notification.error("Please fix the errors before proceeding");
      return;
    }

    calculateDistribution();

    const splitData = {
      token: selectedToken,
      recipients,
      totalAmount,
      splitMode,
    };

    localStorage.setItem("pendingSplit", JSON.stringify(splitData));
    router.push("/split-review");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDistribution();
    }, 300);

    return () => clearTimeout(timer);
  }, [splitMode, equalAmount, recipients.length]);

  useEffect(() => {
    if (splitMode === "UNEQUAL") {
      const timer = setTimeout(() => {
        calculateDistribution();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [recipients.map(r => r.amount).join(","), splitMode]);

  return (
    <div className="max-w-7xl w-full mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8">Split Configuration</h1>

        <div className="flex md:flex-row flex-col gap-6">
          <div className="md:w-[40%]">
            <SplitModeSelector splitMode={splitMode} onModeChange={setSplitMode} />

            <AssetSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
              tokenBalance={tokenBalance}
              chainId={chainId}
            />

            {splitMode === "EQUAL" && (
              <div className="rounded-2xl shadow-lg p-6 mb-6 border">
                <h2 className="text-xl font-semibold mb-4">Amount Per Recipient</h2>
                <p className="mb-4">Enter the amount each recipient will receive.</p>

                {selectedToken?.address === "ETH" ? (
                  <EtherInput value={equalAmount} onChange={setEqualAmount} placeholder="0.0" />
                ) : (
                  <InputBase
                    value={equalAmount}
                    onChange={setEqualAmount}
                    placeholder="0.0"
                    suffix={
                      <span className="px-3 text-sm my-auto font-medium">{selectedToken?.symbol || "TOKEN"}</span>
                    }
                  />
                )}
                {errors["equalAmount"] && <p className="mt-1 text-sm text-error">{errors["equalAmount"]}</p>}
              </div>
            )}
          </div>

          <div className="md:w-[60%]">
            <div className="rounded-2xl shadow-lg p-6 border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Recipients</h2>
                  <p className="text-sm mt-1">Add wallet addresses to split funds.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowBulkImport(true)} className="btn btn-sm btn-ghost rounded-md">
                    <Upload className="w-4 h-4 mr-1" />
                    Bulk Import
                  </button>
                  <button onClick={handleImportFromStorage} className="btn btn-sm btn-ghost rounded-md">
                    <Download className="w-4 h-4 mr-1" />
                    From Contacts
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {recipients.map((recipient, index) => (
                    <RecipientRow
                      key={recipient.id}
                      recipient={recipient}
                      index={index}
                      splitMode={splitMode}
                      selectedToken={selectedToken}
                      equalAmount={equalAmount}
                      savedContacts={savedContacts}
                      errors={errors}
                      onUpdate={updateRecipient}
                      onRemove={removeRecipient}
                      canRemove={recipients.length > 2}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <button onClick={addRecipient} className="btn btn-md btn-primary rounded-md w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipient
              </button>

              {totalAmount && selectedToken && (
                <TotalAmountDisplay totalAmount={totalAmount} token={selectedToken} tokenBalance={tokenBalance} />
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReviewSplit}
                className="btn btn-md rounded-md w-full btn-primary"
                disabled={!selectedToken || recipients.length < 2}
              >
                Review Split
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
        splitMode={splitMode}
        savedContacts={savedContacts}
        existingRecipients={recipients}
      />

      {/* Contact Selector Modal */}
      {showContactSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContactSelector(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-base-100 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Select Contacts</h2>
              <p className="text-sm mt-1">Choose which contacts to import</p>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {savedContacts.map(contact => (
                  <label
                    key={contact.address}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-base-200"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary mr-3"
                      checked={selectedContacts.has(contact.address)}
                      onChange={e => {
                        const newSelected = new Set(selectedContacts);
                        if (e.target.checked) {
                          newSelected.add(contact.address);
                        } else {
                          newSelected.delete(contact.address);
                        }
                        setSelectedContacts(newSelected);
                      }}
                    />
                    <div className="flex md:flex-row flex-col justify-between w-full">
                      <Address address={contact.address} />
                      <div className="font-medium text-xs ">{contact.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setSelectedContacts(new Set(savedContacts.map(c => c.address)));
                }}
                className="btn btn-sm btn-ghost"
              >
                Select All
              </button>
              <button onClick={() => setSelectedContacts(new Set())} className="btn btn-sm btn-ghost">
                Clear All
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  setShowContactSelector(false);
                  setSelectedContacts(new Set());
                }}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleContactSelection}
                className="btn btn-sm btn-primary"
                disabled={selectedContacts.size === 0}
              >
                Import ({selectedContacts.size})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
