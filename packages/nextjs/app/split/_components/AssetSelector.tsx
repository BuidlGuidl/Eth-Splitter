"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Coins, X } from "lucide-react";
import { formatUnits } from "viem";
import { AddressInput } from "~~/components/scaffold-eth";
import { tokens } from "~~/constants/tokens";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface AssetSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  tokenBalance: any;
  chainId: number;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  tokenBalance,
  chainId,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState("");

  const chainTokens = tokens[chainId as keyof typeof tokens];
  const tokenList: Token[] = [
    { address: "ETH", symbol: "ETH", name: "Ethereum", decimals: 18 },
    ...(chainTokens?.contracts.map(t => ({
      address: t.address,
      symbol: t.name,
      name: t.name,
      decimals: 18,
    })) || []),
  ];

  useEffect(() => {
    if (!selectedToken && tokenList.length > 0) {
      onTokenSelect(tokenList[0]);
    }
  }, [chainId]);

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsDropdownOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomToken = () => {
    if (customTokenAddress && customTokenAddress.startsWith("0x")) {
      const customToken: Token = {
        address: customTokenAddress,
        symbol: tokenBalance?.symbol || "TOKEN",
        name: "Custom Token",
        decimals: tokenBalance?.decimals || 18,
      };
      handleTokenSelect(customToken);
      setCustomTokenAddress("");
    }
  };

  const formatBalance = () => {
    if (!tokenBalance?.balance) return "0";
    if (selectedToken?.address === "ETH") {
      return formatUnits(tokenBalance.balance.value, 18);
    }
    return formatUnits(tokenBalance.balance, tokenBalance.decimals || 18);
  };

  return (
    <div className="rounded-2xl p-6 mb-6 border shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Select Asset</h2>
      <p className="mb-4">Choose the cryptocurrency you wish to split.</p>

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary transition-all flex items-center justify-between border hover:border-primary"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 bg-primary">
              {selectedToken ? selectedToken.symbol.charAt(0) : <Coins className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <div className="font-medium">
                {selectedToken ? `${selectedToken.name} (${selectedToken.symbol})` : "Select Token"}
              </div>
              {selectedToken && tokenBalance && (
                <div className="text-xs opacity-70">
                  Balance: {formatBalance()} {selectedToken.symbol}
                </div>
              )}
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
              className="absolute z-10 w-full mt-2 bg-base-100 border rounded-xl shadow-lg overflow-hidden"
            >
              {tokenList.map(token => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className="w-full px-4 py-3 hover:bg-base-200 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold mr-3">
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{token.name}</div>
                      <div className="text-xs opacity-70">{token.symbol}</div>
                    </div>
                  </div>
                  {token.address === selectedToken?.address && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </button>
              ))}

              <div className="border-t p-3">
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    + Add Custom Token
                  </button>
                ) : (
                  <div className="space-y-2">
                    <AddressInput
                      value={customTokenAddress}
                      onChange={setCustomTokenAddress}
                      placeholder="Token contract address"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleCustomToken} className="btn btn-sm btn-primary rounded-md flex-1">
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomTokenAddress("");
                        }}
                        className="btn btn-sm btn-ghost rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedToken && tokenBalance?.allowance !== undefined && selectedToken.address !== "ETH" && (
        <div className="mt-4 p-3 bg-warning/10 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Allowance:</span>{" "}
            {formatUnits(tokenBalance.allowance, tokenBalance.decimals || 18)} {selectedToken.symbol}
          </p>
          {tokenBalance.allowance === 0n && (
            <p className="text-xs mt-1 text-warning">You'll need to approve tokens before splitting</p>
          )}
        </div>
      )}
    </div>
  );
};
