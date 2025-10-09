"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { AssetSelector } from "./_components/AssetSelector";
import { BulkImportModal } from "./_components/BulkImportModal";
import { RecipientRow } from "./_components/RecipientRow";
import { ShareConfigButton } from "./_components/ShareConfigButton";
import { TotalAmountDisplay } from "./_components/TotalAmountDisplay";
import { useHeaderActions } from "~~/components/HeaderActionsContext";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Download, Plus, Upload } from "lucide-react";
import { formatUnits, isAddress, parseUnits } from "viem";
import { useChainId, useSwitchChain } from "wagmi";
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

const addAmounts = (amounts: string[], decimals: number): string => {
  try {
    const sum = amounts.reduce((acc, amount) => {
      if (!amount || amount === "") return acc;
      try {
        const parsed = parseUnits(amount, decimals);
        return acc + parsed;
      } catch {
        return acc;
      }
    }, 0n);

    return formatUnits(sum, decimals);
  } catch (error) {
    console.error("Error adding amounts:", error);
    return "0";
  }
};

const multiplyAmount = (amount: string, count: number, decimals: number): string => {
  try {
    if (!amount || amount === "" || count === 0) return "0";

    const parsed = parseUnits(amount, decimals);
    const result = parsed * BigInt(count);
    return formatUnits(result, decimals);
  } catch (error) {
    console.error("Error multiplying amount:", error);
    return "0";
  }
};

const calculatePercentage = (amount: string, total: string, decimals: number): number => {
  try {
    if (!amount || !total || amount === "" || total === "" || total === "0") return 0;

    const amountBigInt = parseUnits(amount, decimals);
    const totalBigInt = parseUnits(total, decimals);

    if (totalBigInt === 0n) return 0;

    const percentage = (amountBigInt * 10000n) / totalBigInt;
    return Number(percentage) / 100;
  } catch (error) {
    console.error("Error calculating percentage:", error);
    return 0;
  }
};

function SplitContent() {
  const router = useRouter();
  const chainId = useChainId();
  const searchParams = useSearchParams();
  const { switchChain } = useSwitchChain();
  const { setCustomActions } = useHeaderActions();

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [urlChainId, setUrlChainId] = useState<number | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", address: "", amount: "", label: "" },
    { id: "2", address: "", amount: "", label: "" },
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

  const tokenBalance = useTokenBalance(urlChainId || chainId, selectedToken?.address);
  const isCalculatingRef = useRef(false);

  const getTokenDecimals = (): number => {
    if (!selectedToken) return 18;
    return selectedToken.address === "ETH" ? 18 : selectedToken.decimals;
  };

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const recipientCount = searchParams.get("recipientCount");
    const urlChainId = searchParams.get("chainId");

    if (urlChainId) {
      setUrlChainId(parseInt(urlChainId));
    }

    if (tokenParam && recipientCount) {
      if (switchChain && urlChainId) {
        switchChain({ chainId: parseInt(urlChainId) });
      }

      if (tokenParam === "ETH") {
        setSelectedToken({
          address: "ETH",
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
        });
      } else {
        const tokenSymbol = searchParams.get("tokenSymbol");
        const tokenDecimals = searchParams.get("tokenDecimals");

        setSelectedToken({
          address: tokenParam,
          symbol: tokenSymbol || "TOKEN",
          name: tokenSymbol || "Token",
          decimals: parseInt(tokenDecimals || "18"),
        });
      }

      const count = parseInt(recipientCount);
      const newRecipients: Recipient[] = [];

      const equalAmountParam = searchParams.get("equalAmount");
      if (equalAmountParam) {
        const decimals = tokenParam === "ETH" ? 18 : parseInt(searchParams.get("tokenDecimals") || "18");
        const formattedAmount = formatUnits(BigInt(equalAmountParam), decimals);
        setEqualAmount(formattedAmount);
      }

      for (let i = 0; i < count; i++) {
        const recipientAddress = searchParams.get(`recipient_${i}`);
        if (recipientAddress) {
          const labelParam = searchParams.get(`label_${i}`);

          const contact = savedContacts.find(c => c.address.toLowerCase() === recipientAddress.toLowerCase());

          let amount = "";
          const amountParam = searchParams.get(`amount_${i}`);
          if (amountParam) {
            const decimals = tokenParam === "ETH" ? 18 : parseInt(searchParams.get("tokenDecimals") || "18");
            amount = formatUnits(BigInt(amountParam), decimals);
          }

          newRecipients.push({
            id: Date.now().toString() + i,
            address: recipientAddress,
            amount: amount,
            label: labelParam || contact?.label || "",
          });
        }
      }

      while (newRecipients.length < 2) {
        newRecipients.push({
          id: Date.now().toString() + newRecipients.length,
          address: "",
          amount: "",
          label: "",
        });
      }

      setRecipients(newRecipients);

      router.replace("/", { scroll: false });
    }
  }, [searchParams, savedContacts, router, switchChain]);

  useEffect(() => {
    const contacts = loadContacts();
    setSavedContacts(contacts);

    if (!searchParams.get("token")) {
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
    }
  }, [searchParams]);

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
    try {
      const decimals = getTokenDecimals();
      const parsed = parseUnits(amount, decimals);
      return parsed > 0n;
    } catch {
      return false;
    }
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
    const validNewRecipients = newRecipients.filter(r => r.address.trim() !== "");

    const currentValidRecipients = recipients.filter(r => r.address.trim() !== "");

    const combinedRecipients = [...currentValidRecipients, ...validNewRecipients];

    if (combinedRecipients.length < 2) {
      while (combinedRecipients.length < 2) {
        combinedRecipients.push({
          id: Date.now().toString() + combinedRecipients.length,
          address: "",
          amount: "",
          label: "",
        });
      }
    }

    setRecipients(combinedRecipients);
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

      const decimals = getTokenDecimals();

      // Collect all amounts: use individual amounts if set, otherwise use equalAmount
      const amounts: string[] = [];
      recipients.forEach(r => {
        if (r.amount && validateAmount(r.amount)) {
          // Has individual amount
          amounts.push(r.amount);
        } else if (equalAmount && validateAmount(equalAmount)) {
          // No individual amount but equalAmount is set
          amounts.push(equalAmount);
        }
      });

      const total = addAmounts(amounts, decimals);
      setTotalAmount(total);

      // Calculate percentages
      setRecipients(prevRecipients =>
        prevRecipients.map(r => {
          const effectiveAmount = r.amount || equalAmount;
          if (!effectiveAmount || !validateAmount(effectiveAmount)) {
            return { ...r, percentage: 0 };
          }
          const percentage = calculatePercentage(effectiveAmount, total, decimals);
          return { ...r, percentage };
        }),
      );
    } finally {
      isCalculatingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equalAmount, recipients, findDuplicateAddresses, getTokenDecimals]);

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

      // Check if recipient has an individual amount or equalAmount is set
      const effectiveAmount = r.amount || equalAmount;
      if (!effectiveAmount || !validateAmount(effectiveAmount)) {
        newErrors[`${r.id}-amount`] = "Valid amount required";
        isValid = false;
      }
    });

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
  }, [equalAmount, recipients, selectedToken]);

  const hasDuplicates = duplicateAddresses.length > 0;

  // Set the Share Config button in the header
  useEffect(() => {
    setCustomActions(
      <ShareConfigButton
        recipients={recipients}
        selectedToken={selectedToken}
        equalAmount={equalAmount}
        className="mr-2"
      />
    );

    // Clean up when component unmounts
    return () => setCustomActions(null);
  }, [recipients, selectedToken, equalAmount, setCustomActions]);

  return (
    <div className="max-w-7xl w-full mx-auto py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="rounded-2xl shadow-lg p-6 border border-base-100">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Configure Split</h2>
                  </div>
                  <div className="flex gap-2 md:flex-row flex-col items-end">
                    <button onClick={() => setShowBulkImport(true)} className="btn btn-sm btn-ghost rounded-md">
                      <Upload className="w-4 h-4 mr-1" />
                      Bulk Add Addresses
                    </button>
                    <button onClick={handleImportFromStorage} className="btn btn-sm btn-ghost rounded-md">
                      <Download className="w-4 h-4 mr-1" />
                      Add From Contacts
                    </button>
                  </div>
                </div>

                <AssetSelector
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                  tokenBalance={tokenBalance}
                  chainId={urlChainId || chainId}
                />
              </div>

              <div className="mb-6 p-4 bg-base-300/30 border border-base-300 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Auto Fill (Optional)</label>
                  <span className="text-xs opacity-60">Leave empty to set individual amounts</span>
                </div>
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

              {selectedToken && (
                <TotalAmountDisplay totalAmount={totalAmount || "0"} token={selectedToken} tokenBalance={tokenBalance} />
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReviewSplit}
                className="btn btn-md rounded-md flex-1 btn-primary"
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

export default function Split() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <SplitContent />
    </Suspense>
  );
}
