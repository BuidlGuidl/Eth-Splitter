"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AssetSelector } from "./_components/AssetSelector";
import { BulkImportModal } from "./_components/BulkImportModal";
import { RecipientRow } from "./_components/RecipientRow";
import { SplitModeSelector } from "./_components/SplitModeSelector";
import { TotalAmountDisplay } from "./_components/TotalAmountDisplay";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Download, Plus, Upload } from "lucide-react";
import { isAddress } from "viem";
import { useChainId } from "wagmi";
import { Address, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useTokenBalance } from "~~/hooks/useTokenBalance";
import { notification } from "~~/utils/scaffold-eth";
import { Contact, loadCache, loadContacts, updateCacheAmounts, updateCacheWallets } from "~~/utils/splitter";

export interface Recipient {
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
  const [usdMode, setUsdMode] = useState(false);
  const [duplicateAddresses, setDuplicateAddresses] = useState<string[]>([]);

  const toggleUsdMode = () => setUsdMode(prev => !prev);

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

  const findDuplicateAddresses = useCallback((recipients: Recipient[]): string[] => {
    const addressCount: { [key: string]: number } = {};
    const duplicates: string[] = [];

    recipients.forEach(r => {
      if (r.address && validateAddress(r.address)) {
        const normalizedAddress = r.address.toLowerCase();
        addressCount[normalizedAddress] = (addressCount[normalizedAddress] || 0) + 1;
        if (addressCount[normalizedAddress] === 2) {
          duplicates.push(r.address);
        }
      }
    });

    return duplicates;
  }, []);

  const getUniqueValidRecipients = useCallback((recipients: Recipient[]): Recipient[] => {
    const seenAddresses = new Set<string>();
    return recipients.filter(r => {
      if (!validateAddress(r.address)) return false;
      const normalizedAddress = r.address.toLowerCase();
      if (seenAddresses.has(normalizedAddress)) return false;
      seenAddresses.add(normalizedAddress);
      return true;
    });
  }, []);

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
    },
    [savedContacts],
  );

  const handleBulkImport = (newRecipients: Recipient[]) => {
    setRecipients(prevRecipients => [...prevRecipients, ...newRecipients]);
  };

  const handleImportFromStorage = () => {
    setShowContactSelector(true);
  };

  const handleImportSelectedContacts = () => {
    const contactsToImport = Array.from(selectedContacts).filter(address => {
      const exists = recipients.some(r => r.address.toLowerCase() === address.toLowerCase());
      return !exists;
    });

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
      const duplicates = findDuplicateAddresses(recipients);
      setDuplicateAddresses(duplicates);

      if (splitMode === "EQUAL") {
        const uniqueValidRecipients = getUniqueValidRecipients(recipients);

        if (uniqueValidRecipients.length === 0) {
          setTotalAmount("");
          return;
        }

        const amount = parseFloat(equalAmount);
        if (!amount || isNaN(amount)) {
          setTotalAmount("");
          return;
        }

        const totalNeeded = amount * uniqueValidRecipients.length;
        setTotalAmount(totalNeeded.toString());

        setRecipients(prevRecipients =>
          prevRecipients.map(r => ({
            ...r,
            amount: validateAddress(r.address) ? equalAmount : "",
            percentage: validateAddress(r.address) ? 100 / uniqueValidRecipients.length : 0,
          })),
        );
      } else {
        const uniqueValidRecipients = getUniqueValidRecipients(recipients);

        const total = uniqueValidRecipients.reduce((sum, r) => {
          const amount = parseFloat(r.amount || "0");
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        setTotalAmount(total.toString());

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
  }, [splitMode, equalAmount, recipients, findDuplicateAddresses, getUniqueValidRecipients]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitMode, equalAmount, recipients]);

  useEffect(() => {
    if (splitMode === "UNEQUAL") {
      const timer = setTimeout(() => {
        calculateDistribution();
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients.map(r => r.amount).join(","), splitMode]);

  const hasDuplicates = duplicateAddresses.length > 0;

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
              <div className="rounded-2xl shadow-lg p-6 mb-6 border border-base-100">
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
            <div className="rounded-2xl shadow-lg p-6 border border-base-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Recipients</h2>
                  <p className="text-sm mt-1">Add addresses</p>
                </div>
                <div className="flex gap-2 md:flex-row flex-col items-end">
                  <button onClick={() => setShowBulkImport(true)} className="btn btn-sm btn-ghost rounded-md">
                    <Upload className="w-4 h-4 mr-1" />
                    Bulk Add
                  </button>
                  <button onClick={handleImportFromStorage} className="btn btn-sm btn-ghost rounded-md">
                    <Download className="w-4 h-4 mr-1" />
                    From Contacts
                  </button>
                </div>
              </div>

              {hasDuplicates && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl">
                  <div className="flex items-center text-error">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="font-medium">Duplicate Addresses Detected</span>
                  </div>
                  {duplicateAddresses.map((addr, index) => (
                    <div key={addr} className="flex gap-1 items-center">
                      <span>{index + 1}.</span>
                      <Address address={addr} size="sm" disableAddressLink showAvatar={false} showCopyIcon={false} />
                    </div>
                  ))}
                  <p className="text-sm mt-1 text-error/70">Please remove duplicate addresses before proceeding.</p>
                </div>
              )}

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
                      usdMode={usdMode}
                      onToggleUsdMode={toggleUsdMode}
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
                disabled={!selectedToken || recipients.length < 2 || hasDuplicates}
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
            className="bg-base-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-base-100 flex-shrink-0">
              <h2 className="text-xl font-semibold">Select Contacts</h2>
              <p className="text-sm mt-1 text-base-content/70">
                Choose which contacts to import ({savedContacts.length} available)
              </p>
            </div>

            <div className="px-6 pt-4 pb-2 flex gap-3 flex-shrink-0 border-b border-base-100">
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
              <div className="ml-auto text-sm text-base-content/60 self-center">{selectedContacts.size} selected</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="space-y-2">
                {savedContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-base-content/60">No saved contacts available</p>
                    <p className="text-sm text-base-content/40 mt-2">Add contacts from the Contacts page first</p>
                  </div>
                ) : (
                  savedContacts.map(contact => {
                    const isAlreadyAdded = recipients.some(
                      r => r.address.toLowerCase() === contact.address.toLowerCase(),
                    );

                    return (
                      <label
                        key={contact.address}
                        className={`flex items-center p-3 border border-base-100 rounded-lg ${
                          isAlreadyAdded
                            ? "opacity-50 cursor-not-allowed bg-base-100"
                            : "cursor-pointer hover:bg-base-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm mr-3"
                          disabled={isAlreadyAdded}
                          checked={selectedContacts.has(contact.address) && !isAlreadyAdded}
                          onChange={e => {
                            if (isAlreadyAdded) return;
                            const newSelected = new Set(selectedContacts);
                            if (e.target.checked) {
                              newSelected.add(contact.address);
                            } else {
                              newSelected.delete(contact.address);
                            }
                            setSelectedContacts(newSelected);
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{contact.label}</div>
                          <Address address={contact.address} size="sm" disableAddressLink />
                          {isAlreadyAdded && <div className="text-xs text-base-content/50 mt-1">Already added</div>}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 border-t border-base-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowContactSelector(false);
                  setSelectedContacts(new Set());
                }}
                className="btn btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSelectedContacts}
                className="btn btn-primary flex-1"
                disabled={selectedContacts.size === 0}
              >
                Import Selected ({selectedContacts.size})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
