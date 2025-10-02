"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Coins, Plus, X } from "lucide-react";
import { formatUnits, isAddress } from "viem";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
import { tokens } from "~~/constants/tokens";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

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
  const { targetNetwork } = useTargetNetwork();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenError, setCustomTokenError] = useState("");
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [tokenInfo, setTokenInfo] = useState<{ name: string; symbol: string }>({
    name: "Select Token",
    symbol: "",
  });
  const [isCustomTokenLoading, setIsCustomTokenLoading] = useState(false);

  const nativeCurrency = targetNetwork.nativeCurrency || { name: "Ether", symbol: "ETH", decimals: 18 };

  const { data: customTokenSymbol, error: symbolError } = useReadContract({
    address: customTokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
  });

  const { data: customTokenName, error: nameError } = useReadContract({
    address: customTokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
  });

  const { data: customTokenDecimals, error: decimalsError } = useReadContract({
    address: customTokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const chainTokens = tokens[chainId as keyof typeof tokens];

  useEffect(() => {
    const nativeToken: Token = {
      address: "ETH",
      symbol: nativeCurrency.symbol,
      name: nativeCurrency.name,
      decimals: nativeCurrency.decimals,
    };

    const tokenList: Token[] = [
      nativeToken,
      ...(chainTokens?.contracts.map(t => ({
        address: t.address,
        symbol: t.name,
        name: t.name,
        decimals: t.decimals,
      })) || []),
    ];

    setTokenList(tokenList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeCurrency]);

  useEffect(() => {
    if (
      (!selectedToken || (selectedToken.address === "ETH" && selectedToken.symbol !== tokenList[0].symbol)) &&
      tokenList.length > 0
    ) {
      onTokenSelect(tokenList[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, tokenList]);

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setShowCustomInput(false);
    setCustomTokenAddress("");
    setCustomTokenError("");
  };

  const handleAddressChange = (value: string) => {
    setCustomTokenAddress(value);
    setCustomTokenError("");
    if (value) {
      setIsCustomTokenLoading(true);
    } else {
      setIsCustomTokenLoading(false);
    }
  };

  useEffect(() => {
    if (!customTokenAddress) {
      setCustomTokenError("");
      setIsCustomTokenLoading(false);
      return;
    }

    setIsCustomTokenLoading(true);

    const isValidAddress = customTokenAddress && isAddress(customTokenAddress);

    if (!isValidAddress) {
      if (customTokenAddress && !isAddress(customTokenAddress)) {
        setCustomTokenError("Invalid address format");
      } else {
        setCustomTokenError("");
      }
      setIsCustomTokenLoading(false);
      return;
    }

    if (symbolError || nameError || decimalsError) {
      setCustomTokenError("Not a valid ERC20 token contract");
      setIsCustomTokenLoading(false);
      return;
    }

    if (customTokenSymbol && customTokenName && customTokenDecimals !== undefined) {
      const customToken: Token = {
        address: customTokenAddress,
        symbol: customTokenSymbol,
        name: customTokenName,
        decimals: customTokenDecimals,
      };

      handleTokenSelect(customToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customTokenAddress,
    customTokenSymbol,
    customTokenName,
    customTokenDecimals,
    symbolError,
    nameError,
    decimalsError,
  ]);

  useEffect(() => {
    if (
      selectedToken &&
      selectedToken.address === customTokenAddress &&
      selectedToken.address !== "ETH" &&
      !tokenList.find(t => t.address === selectedToken.address)
    ) {
      const updatedToken: Token = {
        address: selectedToken.address,
        symbol: customTokenSymbol || tokenBalance?.symbol || "TOKEN",
        name: customTokenName || tokenBalance?.name || "Custom Token",
        decimals: customTokenDecimals || tokenBalance?.decimals || 18,
      };

      if (
        updatedToken.symbol !== selectedToken.symbol ||
        updatedToken.name !== selectedToken.name ||
        updatedToken.decimals !== selectedToken.decimals
      ) {
        onTokenSelect(updatedToken);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTokenSymbol, customTokenName, customTokenDecimals, tokenBalance]);

  useEffect(() => {
    if (!selectedToken) {
      setTokenInfo({ name: "Select Token", symbol: "" });
      return;
    }

    if (selectedToken.address !== "ETH" && !tokenList.find(t => t.address === selectedToken.address)) {
      setTokenInfo({
        name: customTokenName || tokenBalance?.name || selectedToken.name,
        symbol: customTokenSymbol || tokenBalance?.symbol || selectedToken.symbol,
      });
    } else {
      setTokenInfo({
        name: selectedToken.name,
        symbol: selectedToken.symbol,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken, tokenBalance]);

  const formatBalance = () => {
    if (!tokenBalance?.balance) return "0";
    if (selectedToken?.address === "ETH") {
      return formatUnits(tokenBalance.balance.value, 18);
    }
    return formatUnits(tokenBalance.balance, tokenBalance.decimals || 18);
  };

  return (
    <div className="rounded-2xl p-6 mb-6 border border-base-100 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Select Asset</h2>

      <div className="flex items-center justify-between mb-4 p-3 bg-base-200 rounded-xl">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 bg-primary">
            {tokenInfo.symbol ? tokenInfo.symbol.charAt(0) : <Coins className="w-5 h-5" />}
          </div>
          <div className="text-left">
            <div className="font-medium">
              {tokenInfo.symbol ? `${tokenInfo.name} (${tokenInfo.symbol})` : "Select Token"}
            </div>
            {selectedToken && tokenBalance && (
              <div className="text-xs opacity-70">
                Balance: {formatBalance()} {tokenInfo.symbol}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tokenList.map(token => (
          <motion.button
            key={token.address}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTokenSelect(token)}
            className={`px-3 py-2 rounded-lg  transition-all flex items-center gap-2 ${
              selectedToken?.address === token.address ? "bg-primary" : "bg-secondary "
            }`}
          >
            <span className="font-medium">{token.symbol}</span>
            {selectedToken?.address === token.address && (
              <div className="w-2 h-2 rounded-full bg-primary-content"></div>
            )}
          </motion.button>
        ))}

        {!showCustomInput ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomInput(true)}
            className="px-3 py-2 rounded-lgtransition-all flex items-center gap-2 bg-secondary"
          >
            <Plus className="w-4 h-4" />
            <span>Other</span>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 min-w-[200px]"
          >
            <div className="relative">
              <AddressInput
                value={customTokenAddress}
                onChange={handleAddressChange}
                placeholder="Paste token contract address"
              />
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTokenAddress("");
                  setCustomTokenError("");
                  setIsCustomTokenLoading(false);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-base-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isCustomTokenLoading && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="loading loading-spinner loading-xs"></span>
                <span>Loading token...</span>
              </div>
            )}

            {customTokenError && (
              <div className="flex items-center gap-2 mt-2 text-error text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{customTokenError}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {selectedToken && tokenBalance?.allowance !== undefined && selectedToken.address !== "ETH" && (
        <div className="mt-4 p-3 bg-warning/10 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Allowance:</span>{" "}
            {formatUnits(tokenBalance.allowance, tokenBalance.decimals || 18)} {tokenInfo.symbol}
          </p>
          {tokenBalance.allowance === 0n && (
            <p className="text-xs mt-1 text-error">You&apos;ll need to approve tokens before splitting</p>
          )}
        </div>
      )}
    </div>
  );
};
