"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TransactionSuccess } from "./_components/TransactionSuccess";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { formatEther, formatGwei, formatUnits, parseEther, parseUnits } from "viem";
import { useAccount, useBalance, useFeeData, usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useTokenBalance } from "~~/hooks/useTokenBalance";
import { useGlobalState } from "~~/services/store/store";
import { notification } from "~~/utils/scaffold-eth";

interface Recipient {
  id: string;
  address: string;
  amount: string;
  percentage?: number;
  label?: string;
  ensName?: string;
}

interface SplitData {
  token: { address: string; symbol: string; name: string; decimals: number } | null;
  recipients: Recipient[];
  totalAmount: string;
  splitMode: "EQUAL" | "UNEQUAL";
}

export default function SplitReviewPage() {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const [splitData, setSplitData] = useState<SplitData | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint>(0n);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [gasCostInUSD, setGasCostInUSD] = useState("0.00");
  const [gasEstimationError, setGasEstimationError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState<{
    hash: string;
    recipients: Recipient[];
    totalAmount: string;
    token: { address: string; symbol: string; name: string; decimals: number };
    splitMode: "EQUAL" | "UNEQUAL";
  } | null>(null);
  const { targetNetwork } = useTargetNetwork();

  const nativeCurrency = targetNetwork.nativeCurrency;

  const { writeContractAsync: writeSplitter } = useScaffoldWriteContract({
    contractName: "ETHSplitter",
  });

  const { data: deployedContractInfo } = useDeployedContractInfo({
    contractName: "ETHSplitter",
  });

  const { data: ethBalance } = useBalance({
    address: connectedAddress,
  });

  const { data: feeData } = useFeeData();

  const {
    balance: tokenBalance,
    allowance: tokenAllowance,
    approve,
    isApproving: isApprovingFromHook,
    isConfirming: isConfirmingApproval,
  } = useTokenBalance(splitData?.token?.address);

  useEffect(() => {
    const data = localStorage.getItem("pendingSplit");
    if (!data) {
      notification.error("No split data found");
      router.push("/split");
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setSplitData(parsed);
    } catch (error) {
      console.error("Error parsing split data:", error);
      notification.error("Invalid split data");
      router.push("/split");
    }
  }, [router]);

  const estimateGas = useCallback(async () => {
    if (!splitData || !publicClient || !connectedAddress || !deployedContractInfo) return;

    setIsEstimatingGas(true);
    setGasEstimationError(null);

    try {
      const recipients = splitData.recipients.map(r => r.address as `0x${string}`);
      let estimatedGas: bigint;

      if (splitData.token?.address === "ETH") {
        if (splitData.splitMode === "EQUAL") {
          const totalValue = parseEther(splitData.totalAmount);
          estimatedGas = await publicClient.estimateContractGas({
            address: deployedContractInfo.address as `0x${string}`,
            abi: deployedContractInfo.abi,
            functionName: "splitEqualETH",
            args: [recipients],
            account: connectedAddress,
            value: totalValue,
          });
        } else {
          const amounts = splitData.recipients.map(r => parseEther(r.amount));
          const totalValue = amounts.reduce((sum, amount) => sum + amount, BigInt(0));
          estimatedGas = await publicClient.estimateContractGas({
            address: deployedContractInfo.address as `0x${string}`,
            abi: deployedContractInfo.abi,
            functionName: "splitETH",
            args: [recipients, amounts],
            account: connectedAddress,
            value: totalValue,
          });
        }
      } else {
        const tokenAddress = splitData.token?.address as `0x${string}`;
        const decimals = splitData.token?.decimals || 18;
        const totalAmount = parseUnits(splitData.totalAmount, decimals);

        if (splitData.splitMode === "EQUAL") {
          estimatedGas = await publicClient.estimateContractGas({
            address: deployedContractInfo.address as `0x${string}`,
            abi: deployedContractInfo.abi,
            functionName: "splitEqualERC20",
            args: [tokenAddress, recipients, totalAmount],
            account: connectedAddress,
          });
        } else {
          const amounts = splitData.recipients.map(r => parseUnits(r.amount, decimals));
          estimatedGas = await publicClient.estimateContractGas({
            address: deployedContractInfo.address as `0x${string}`,
            abi: deployedContractInfo.abi,
            functionName: "splitERC20",
            args: [tokenAddress, recipients, amounts],
            account: connectedAddress,
          });
        }
      }

      const buffer = (estimatedGas * BigInt(120)) / BigInt(100);
      setEstimatedGas(buffer);
    } catch (error) {
      console.error("Error estimating gas:", error);
      setGasEstimationError("Could not estimate gas. The transaction may fail.");
      const fallbackGas = BigInt(300000);
      setEstimatedGas(fallbackGas);
    } finally {
      setIsEstimatingGas(false);
    }
  }, [splitData, publicClient, connectedAddress, deployedContractInfo]);

  useEffect(() => {
    estimateGas();
  }, [estimateGas]);

  const handleApproveToken = async () => {
    if (!splitData || !splitData.token || splitData.token.address === "ETH") {
      return;
    }

    setIsApproving(true);

    try {
      const decimals = splitData.token.decimals || 18;
      const totalAmount = parseUnits(splitData.totalAmount, decimals);

      notification.info("Approving token spend...");

      if (approve) {
        approve(totalAmount);
      }
    } catch (error) {
      console.error("Error approving tokens:", error);
      notification.error("Failed to approve tokens");
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!splitData || !splitData.token) {
      notification.error("Invalid split data");
      return;
    }

    setIsExecuting(true);

    try {
      const recipients = splitData.recipients.map(r => r.address as `0x${string}`);
      let txHash: string | undefined;

      if (splitData.token.address === "ETH") {
        if (splitData.splitMode === "EQUAL") {
          const totalValue = parseEther(splitData.totalAmount);

          txHash = await writeSplitter({
            functionName: "splitEqualETH",
            args: [recipients],
            value: totalValue,
          });
        } else {
          const amounts = splitData.recipients.map(r => parseEther(r.amount));
          const totalValue = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

          txHash = await writeSplitter({
            functionName: "splitETH",
            args: [recipients, amounts],
            value: totalValue,
          });
        }
      } else {
        const tokenAddress = splitData.token.address as `0x${string}`;
        const decimals = splitData.token.decimals || 18;
        const totalAmount = parseUnits(splitData.totalAmount, decimals);

        if (!tokenAllowance || tokenAllowance < totalAmount) {
          notification.error("Insufficient token allowance. Please approve tokens first.");
          setIsExecuting(false);
          return;
        }

        if (splitData.splitMode === "EQUAL") {
          txHash = await writeSplitter({
            functionName: "splitEqualERC20",
            args: [tokenAddress, recipients, totalAmount],
          });
        } else {
          const amounts = splitData.recipients.map(r => parseUnits(r.amount, decimals));

          txHash = await writeSplitter({
            functionName: "splitERC20",
            args: [tokenAddress, recipients, amounts],
          });
        }
      }

      if (txHash) {

        setTransactionSuccess({
          hash: txHash,
          recipients: splitData.recipients,
          totalAmount: splitData.totalAmount,
          token: splitData.token,
          splitMode: splitData.splitMode,
        });
      }
    } catch (error) {
      console.error("Error executing split:", error);
      notification.error("Failed to execute split");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleBackToEdit = () => {
    router.push("/split");
  };

  const handleRefreshGasEstimate = () => {
    estimateGas();
  };

  const gasPrice = feeData?.gasPrice || BigInt(0);
  const maxFeePerGas = feeData?.maxFeePerGas || BigInt(0);
  const effectiveGasPrice = maxFeePerGas > 0 ? maxFeePerGas : gasPrice;
  const totalGasCost = estimatedGas * effectiveGasPrice;
  const gasCostInEth = formatEther(totalGasCost);

  useEffect(() => {
    const gasCostInEth = parseFloat(formatEther(totalGasCost));
    const usdValue = (gasCostInEth * nativeCurrencyPrice).toFixed(2);
    setGasCostInUSD(usdValue);
  }, [totalGasCost, nativeCurrencyPrice, estimatedGas]);

  const needsApproval = splitData?.token?.address !== "ETH" && splitData?.token;
  const totalAmountBigInt = needsApproval
    ? parseUnits(splitData.totalAmount, splitData.token?.decimals || 18)
    : BigInt(0);
  const hasSufficientAllowance = tokenAllowance && tokenAllowance >= totalAmountBigInt;

  if (transactionSuccess) {
    return (
      <TransactionSuccess
        transactionHash={transactionSuccess.hash}
        recipients={transactionSuccess.recipients}
        totalAmount={transactionSuccess.totalAmount}
        token={transactionSuccess.token}
        splitMode={transactionSuccess.splitMode}
      />
    );
  }

  if (!splitData || !splitData.token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Summary and Confirmation</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-center mb-6">
              <div className="badge badge-primary badge-lg gap-2 px-4 py-3">
                <span className="font-medium">{splitData.token.symbol}</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-base-content/60 mb-2">Total Amount to Split</p>
              <h2 className="text-5xl font-bold">
                {splitData.totalAmount} {splitData.token.symbol}
              </h2>
            </div>

            <div className="bg-base-200 rounded-2xl p-6 mb-8">
              <p className="text-base-content/80">
                This overview details the final distribution of assets to recipients.
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <Image
                src={"/split.png"}
                className="w-64 h-64 rounded-2xl"
                alt="split illustration"
                width={256}
                height={256}
                loading="lazy"
              />
            </div>

            <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-base-content/60 font-medium">RECIPIENT ADDRESS</th>
                    <th className="text-right text-base-content/60 font-medium">AMOUNT</th>
                    <th className="text-right text-base-content/60 font-medium">PERCENTAGE</th>
                  </tr>
                </thead>
                <tbody>
                  {splitData.recipients.map(recipient => (
                    <tr key={recipient.id} className="border-b border-base-300">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">
                            <Address address={recipient.address} />
                          </span>
                          {recipient.label && (
                            <span className="text-xs text-base-content/60 mt-1">{recipient.label}</span>
                          )}
                          {recipient.ensName && <span className="text-xs text-primary mt-1">{recipient.ensName}</span>}
                        </div>
                      </td>
                      <td className="text-right py-4 font-medium">
                        {splitData.splitMode === "EQUAL"
                          ? (parseFloat(splitData.totalAmount) / splitData.recipients.length).toFixed(4)
                          : recipient.amount}{" "}
                        {splitData.token?.symbol}
                      </td>
                      <td className="text-right py-4">
                        <span className="text-primary font-medium">
                          {recipient.percentage?.toFixed(1) || (100 / splitData.recipients.length).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-base-100 rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-semibold mb-6">Confirm Transaction</h3>

              <div className="bg-base-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-base-content/60">
                    {isEstimatingGas ? "Estimating..." : "Gas Estimate"}
                  </span>
                  <button
                    onClick={handleRefreshGasEstimate}
                    disabled={isEstimatingGas}
                    className="text-primary text-xs hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-lg font-semibold">{formatGwei(effectiveGasPrice)} Gwei</p>
                <p className="text-sm text-base-content/60">
                  ≈ {gasCostInEth} {nativeCurrency.symbol} (${gasCostInUSD})
                </p>
              </div>

              {isEstimatingGas ? (
                <div className="flex items-center gap-2 mb-6 p-4 bg-warning/10 rounded-xl">
                  <span className="loading loading-spinner loading-xs text-warning"></span>
                  <span className="text-sm font-medium">Estimating gas...</span>
                </div>
              ) : gasEstimationError ? (
                <div className="flex items-center gap-2 mb-6 p-4 bg-warning/10 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium">Calculated gas estimate.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-6 p-4 bg-success/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">Ready to confirm your transaction.</span>
                </div>
              )}

              {needsApproval && (
                <div className="mb-6 p-4 bg-base-200 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Token Approval</span>
                    {hasSufficientAllowance && <CheckCircle className="w-4 h-4 text-success" />}
                  </div>
                  <p className="text-xs text-base-content/60 mb-2">
                    Current allowance:{" "}
                    {tokenAllowance ? formatUnits(tokenAllowance, splitData.token.decimals || 18) : "0"}{" "}
                    {splitData.token.symbol}
                  </p>
                  <p className="text-xs text-base-content/60 mb-3">
                    Required: {splitData.totalAmount} {splitData.token.symbol}
                  </p>
                  {!hasSufficientAllowance && (
                    <button
                      onClick={handleApproveToken}
                      disabled={isApproving || isApprovingFromHook || isConfirmingApproval}
                      className="btn btn-sm btn-primary w-full rounded-lg"
                    >
                      {isApproving || isApprovingFromHook || isConfirmingApproval ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          {isConfirmingApproval ? "Confirming..." : "Approving..."}
                        </>
                      ) : (
                        `Approve ${splitData.token.symbol}`
                      )}
                    </button>
                  )}
                  {!!hasSufficientAllowance && (
                    <div className="text-xs text-success text-center">✓ Sufficient allowance granted</div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleConfirmTransaction}
                  disabled={
                    isExecuting ||
                    isEstimatingGas ||
                    (needsApproval && !hasSufficientAllowance) ||
                    isApproving ||
                    isConfirmingApproval
                  }
                  className={`btn btn-lg w-full rounded-xl ${
                    needsApproval && !hasSufficientAllowance ? "btn-disabled" : "btn-primary"
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Processing...
                    </>
                  ) : needsApproval && !hasSufficientAllowance ? (
                    "Approve Tokens First"
                  ) : (
                    "Confirm Transaction"
                  )}
                </button>

                <button
                  onClick={handleBackToEdit}
                  disabled={isExecuting}
                  className="btn btn-base-200 btn-lg w-full rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Edit Split
                </button>
              </div>

              {splitData.token.address === "ETH" ? (
                <div className="mt-6 p-4 bg-base-200 rounded-xl">
                  <p className="text-xs text-base-content/60 mb-1">Your {nativeCurrency.symbol} Balance</p>
                  <p className="text-sm font-medium">
                    {ethBalance ? formatEther(ethBalance.value) : "0"} {nativeCurrency.symbol}
                  </p>
                  {ethBalance && parseEther(splitData.totalAmount) > ethBalance.value && (
                    <p className="text-xs text-error mt-2">Insufficient balance</p>
                  )}
                </div>
              ) : (
                <div className="mt-6 p-4 bg-base-200 rounded-xl">
                  <p className="text-xs text-base-content/60 mb-1">Your {splitData.token.symbol} Balance</p>
                  <p className="text-sm font-medium">
                    {tokenBalance
                      ? formatUnits(
                          typeof tokenBalance === "object" && "value" in tokenBalance
                            ? tokenBalance.value
                            : tokenBalance,
                          splitData.token.decimals || 18,
                        )
                      : "0"}{" "}
                    {splitData.token.symbol}
                  </p>
                  {tokenBalance &&
                    typeof tokenBalance === "object" &&
                    parseUnits(splitData.totalAmount, splitData.token.decimals || 18) > tokenBalance.value && (
                      <p className="text-xs text-error mt-2">Insufficient balance</p>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
