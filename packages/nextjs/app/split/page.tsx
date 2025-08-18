"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Calculator, ChevronDown, Minus, Plus, Users, X } from "lucide-react";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface Recipient {
  id: string;
  address: string;
  amount: string;
  percentage?: number;
  label?: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
}

const mockTokens: Token[] = [
  { address: "ETH", symbol: "ETH", name: "Ethereum", decimals: 18, balance: "5.5" },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    balance: "1000",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    balance: "500",
  },
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    balance: "750",
  },
];

// Sample saved addresses
const savedAddresses = [
  { address: "0xabc...1234efg", label: "Alice Smith" },
  { address: "0xdef...5678hij", label: "Bob Johnson" },
  { address: "0xghi...9012klm", label: "Charlie Brown" },
];

export default function Split() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<Token>(mockTokens[0]);
  const [splitMode, setSplitMode] = useState<"EQUAL" | "UNEQUAL">("EQUAL");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", address: "", amount: "", label: "" },
    { id: "2", address: "", amount: "", label: "" },
    { id: "3", address: "", amount: "", label: "" },
  ]);
  const [totalAmount, setTotalAmount] = useState("");
  const [equalAmount, setEqualAmount] = useState("");
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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

  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(recipients.map(r => (r.id === id ? { ...r, [field]: value } : r)));

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-${field}`];
      return newErrors;
    });
  };

  const handleBulkImport = () => {
    if (!bulkAddresses.trim()) {
      notification.error("Please enter addresses");
      return;
    }

    const lines = bulkAddresses
      .split(/[\n,]+/)
      .map(line => line.trim())
      .filter(Boolean);
    const newRecipients: Recipient[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[\s:]+/);
      const address = parts[0];

      if (validateAddress(address) || savedAddresses.some(s => s.address === address)) {
        newRecipients.push({
          id: Date.now().toString() + index,
          address,
          amount: splitMode === "EQUAL" ? "" : parts[1] || "",
          label: parts[2] || savedAddresses.find(s => s.address === address)?.label || "",
        });
      }
    });

    if (newRecipients.length > 0) {
      setRecipients(newRecipients);
      setBulkAddresses("");
      setShowBulkInput(false);
      notification.success(`Added ${newRecipients.length} recipients`);
    } else {
      notification.error("No valid addresses found");
    }
  };

  const calculateDistribution = () => {
    if (splitMode === "EQUAL") {
      const validRecipients = recipients.filter(
        r => validateAddress(r.address) || savedAddresses.some(s => s.address === r.address),
      );
      if (validRecipients.length === 0) return;

      const amount = parseFloat(equalAmount);
      if (!amount || isNaN(amount)) return;

      const totalNeeded = amount * validRecipients.length;
      setTotalAmount(totalNeeded.toString());

      setRecipients(
        recipients.map(r => ({
          ...r,
          amount: validateAddress(r.address) || savedAddresses.some(s => s.address === r.address) ? equalAmount : "",
          percentage: 100 / validRecipients.length,
        })),
      );
    } else {
      // Calculate total and percentages for unequal split
      const total = recipients.reduce((sum, r) => {
        const amount = parseFloat(r.amount || "0");
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      setTotalAmount(total.toString());

      setRecipients(
        recipients.map(r => {
          const amount = parseFloat(r.amount || "0");
          return {
            ...r,
            percentage: total > 0 ? (amount / total) * 100 : 0,
          };
        }),
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    recipients.forEach(r => {
      if (!r.address) {
        newErrors[`${r.id}-address`] = "Address required";
        isValid = false;
      } else if (!validateAddress(r.address) && !savedAddresses.some(s => s.address === r.address)) {
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

    router.push("/split-review");
  };

  useEffect(() => {
    calculateDistribution();
  }, [splitMode, equalAmount, recipients]);

  return (
    <div className="max-w-7xl w-full mx-auto py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold e mb-8">Split Configuration</h1>

        <div className="flex md:flex-row flex-col gap-6">
          <div className="md:w-[40%]">
            <div className=" rounded-2xl shadow-lg p-6 mb-6 border">
              <h2 className="text-xl font-semibold mb-4">Split Mode</h2>
              <p className="mb-4">Decide how to distribute the funds.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSplitMode("EQUAL")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    splitMode === "EQUAL" ? "border-base-100 bg-primary" : "border-base-300"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">Equal Split</div>
                </button>

                <button
                  onClick={() => setSplitMode("UNEQUAL")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    splitMode === "UNEQUAL" ? "border-base-100 bg-primary" : "border-base-300"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Calculator className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">Unequal Split</div>
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-6 mb-6 border ">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Asset</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Choose the cryptocurrency you wish to split.</p>

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between border"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 bg-primary">
                      {selectedAsset.symbol.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {selectedAsset.name} ({selectedAsset.symbol})
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 rounded-xl shadow-xl overflow-hidden border bg-base-200"
                    >
                      {mockTokens.map(token => (
                        <button
                          key={token.address}
                          onClick={() => {
                            setSelectedAsset(token);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-base-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8  rounded-full flex items-center justify-center font-bold mr-3 bg-primary">
                              {token.symbol.charAt(0)}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {token.name} ({token.symbol})
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="md:w-[60%]">
            <div className=" rounded-2xl shadow-lg p-6 mb-6 border ">
              <h2 className="text-xl font-semibold  mb-4">Configure Distribution</h2>
              <p className="mb-6">Specify recipients and their share.</p>

              {splitMode === "EQUAL" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Amount per recipient ({selectedAsset.symbol})
                  </label>
                  <EtherInput value={equalAmount} onChange={value => setEqualAmount(value)} placeholder="0.0" />
                  {errors.equalAmount && <p className="mt-1 text-sm text-red-500">{errors.equalAmount}</p>}
                </div>
              )}

              <div className="mb-6">
                <button onClick={() => setShowBulkInput(!showBulkInput)} className="btn btn-ghost btn-md rounded-md">
                  {showBulkInput ? "Hide" : "Show"} bulk import
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showBulkInput ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showBulkInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <textarea
                        value={bulkAddresses}
                        onChange={e => setBulkAddresses(e.target.value)}
                        placeholder={
                          splitMode === "EQUAL"
                            ? "Enter addresses (one per line or comma-separated):\n0xabc...123\n0xdef...456"
                            : "Enter addresses and amounts:\n0xabc...123 1.5\n0xdef...456 2.0"
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-base-100  rounded-xl focus:ring-2 focus:ring-base-300 focus:border-transparent transition-all font-mono text-sm"
                      />
                      <button
                        onClick={handleBulkImport}
                        className="mt-2 btn-md btn btn-primary rounded-md font-medium text-sm transition-colors"
                      >
                        Import Recipients
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {recipients.map((recipient, index) => (
                    <motion.div
                      key={recipient.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <AddressInput
                            value={recipient.address}
                            onChange={value => updateRecipient(recipient.id, "address", value)}
                            placeholder="Wallet address or select saved address"
                          />
                          <datalist id={`addresses-${recipient.id}`}>
                            {savedAddresses.map(addr => (
                              <option key={addr.address} value={addr.address}>
                                {addr.label}
                              </option>
                            ))}
                          </datalist>
                          {errors[`${recipient.id}-address`] && (
                            <p className="mt-1 text-sm text-error">{errors[`${recipient.id}-address`]}</p>
                          )}
                        </div>

                        {splitMode === "UNEQUAL" && (
                          <div>
                            <div className="relative">
                              <InputBase
                                value={recipient.amount}
                                onChange={value => updateRecipient(recipient.id, "amount", value)}
                                placeholder="Amount"
                              />
                              {recipient.percentage !== undefined && recipient.percentage > 0 && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                  {recipient.percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                            {errors[`${recipient.id}-amount`] && (
                              <p className="mt-1 text-sm text-red-500">{errors[`${recipient.id}-amount`]}</p>
                            )}
                          </div>
                        )}

                        {splitMode === "EQUAL" && equalAmount && (
                          <div className="flex items-center">
                            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-400 font-medium text-sm">
                              {equalAmount} {selectedAsset.symbol}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeRecipient(recipient.id)}
                        disabled={recipients.length <= 2}
                        className={`btn btn-md rounded-md transition-all ${
                          recipients.length <= 2 ? "btn-ghost cursor-not-allowed" : "btn-active"
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button onClick={addRecipient} className="btn btn-md btn-primary rounded-md w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipient
                </button>
              </div>

              {/* Total Amount Display */}
              {totalAmount && (
                <div className="mt-6 p-4 border border-base-100  rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Amount to Split:</span>
                    <span className="text-lg font-bold">
                      {totalAmount} {selectedAsset.symbol}
                    </span>
                  </div>
                  {selectedAsset.balance && parseFloat(totalAmount) > parseFloat(selectedAsset.balance) && (
                    <div className="mt-2 flex items-center text-sm text-error">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Insufficient balance
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReviewSplit}
                className="btn btn-md rounded-md w-full btn-primary"
              >
                Review Split
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
