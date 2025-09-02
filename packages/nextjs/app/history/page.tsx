"use client";

import React, { useCallback, useMemo, useState } from "react";
import { SplitDetailsDrawer } from "./_components/SplitDetailsDrawer";
import { StatsCard } from "./_components/StatsCard";
import { TransactionRow } from "./_components/TransactionRow";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  Filter,
  History,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { type SplitTransaction, useSplitterHistory, useUserSplitterStats } from "~~/hooks/useSplitterHistory";
import { notification } from "~~/utils/scaffold-eth";
import { exportToCSV, formatTokenAmount, getTokenInfo } from "~~/utils/splitterHistory";

type FilterType = "all" | "ethSplit" | "ethEqualSplit" | "erc20Split" | "erc20EqualSplit" | "sent" | "received";

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { targetNetwork } = useTargetNetwork();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<SplitTransaction | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data with pagination
  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useSplitterHistory(
    address,
    chainId,
    ITEMS_PER_PAGE * 10, // Fetch more for client-side filtering
    0,
  );

  const { data: userStats } = useUserSplitterStats(address);

  // Calculate stats for current chain
  const currentChainStats = useMemo(() => {
    return userStats?.find(stat => stat.chainId === chainId) || null;
  }, [userStats, chainId]);

  // Filter and paginate transactions
  const { paginatedTransactions, totalPages, filteredCount } = useMemo(() => {
    if (!historyData?.transactions) {
      return { paginatedTransactions: [], totalPages: 0, filteredCount: 0 };
    }

    let filtered = [...historyData.transactions];

    // Apply type filter
    if (filterType !== "all") {
      if (filterType === "sent") {
        filtered = filtered.filter(tx => tx.sender.toLowerCase() === address?.toLowerCase());
      } else if (filterType === "received") {
        filtered = filtered.filter(tx => tx.recipients.some(r => r.recipient.toLowerCase() === address?.toLowerCase()));
      } else {
        filtered = filtered.filter(tx => tx.type === filterType);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        // Search in transaction hash
        if (tx.txHash.toLowerCase().includes(query)) return true;

        // Search in sender address
        if (tx.sender.toLowerCase().includes(query)) return true;

        // Search in recipient addresses
        if (tx.recipients.some(r => r.recipient.toLowerCase().includes(query))) return true;

        // Search in token address
        if (tx.tokenAddress && tx.tokenAddress.toLowerCase().includes(query)) return true;

        // Search in token symbol
        if (tx.tokenSymbol && tx.tokenSymbol.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Enhance transactions with token info
    const enhanced = filtered.map(tx => {
      if (tx.tokenAddress && tx.tokenAddress !== "ETH") {
        const tokenInfo = getTokenInfo(tx.tokenAddress, chainId);
        if (tokenInfo) {
          return {
            ...tx,
            tokenSymbol: tx.tokenSymbol || tokenInfo.name,
            tokenDecimals: tx.tokenDecimals || tokenInfo.decimals,
          };
        }
      }
      return tx;
    });

    // Calculate pagination
    const totalPages = Math.ceil(enhanced.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = enhanced.slice(startIndex, endIndex);

    return {
      paginatedTransactions: paginated,
      totalPages,
      filteredCount: enhanced.length,
    };
  }, [historyData?.transactions, filterType, searchQuery, address, currentPage, chainId]);

  // Handlers
  const handleTransactionClick = useCallback((transaction: SplitTransaction) => {
    setSelectedTransaction(transaction);
    setIsDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    notification.success("History refreshed");
  }, [refetch]);

  const handleExport = useCallback(() => {
    if (!historyData?.transactions || !address) return;

    try {
      exportToCSV(historyData.transactions, address);
      notification.success("History exported to CSV");
    } catch (error) {
      notification.error("Failed to export history");
    }
  }, [historyData?.transactions, address]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <History className="w-16 h-16 mx-auto mb-4 text-base-content/20" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-base-content/60">Please connect your wallet to view your split history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Split History</h1>
          <p className="text-base-content/60">View and manage your ETH and token split transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="btn btn-outline btn-sm gap-2" disabled={isRefreshing || isLoading}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm gap-2"
            disabled={!historyData?.transactions || historyData.transactions.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {currentChainStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="ETH Sent"
            value={formatTokenAmount(currentChainStats.totalEthSent)}
            subtitle={`${currentChainStats.ethSplitCount} splits`}
            icon={<ArrowUpRight className="w-6 h-6" />}
            variant="primary"
          />
          <StatsCard
            title="ETH Received"
            value={formatTokenAmount(currentChainStats.totalEthReceived)}
            subtitle={`${currentChainStats.ethReceivedCount} splits`}
            icon={<ArrowDownLeft className="w-6 h-6" />}
            variant="success"
          />
          <StatsCard
            title="Tokens Sent"
            value={`$${formatTokenAmount(currentChainStats.totalErc20Sent, 6)}`}
            subtitle={`${currentChainStats.erc20SplitCount} splits`}
            icon={<Coins className="w-6 h-6" />}
            variant="warning"
          />
          <StatsCard
            title="Total Activity"
            value={
              currentChainStats.ethSplitCount +
              currentChainStats.erc20SplitCount +
              currentChainStats.ethReceivedCount +
              currentChainStats.erc20ReceivedCount
            }
            subtitle="All time"
            icon={<TrendingUp className="w-6 h-6" />}
            variant="info"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
            <input
              type="text"
              placeholder="Search by address, transaction hash, or token..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-outline gap-2">
            <Filter className="w-4 h-4" />
            {filterType === "all"
              ? "All Transactions"
              : filterType === "sent"
                ? "Sent"
                : filterType === "received"
                  ? "Received"
                  : filterType.replace(/([A-Z])/g, " $1").trim()}
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
            <li>
              <a onClick={() => setFilterType("all")} className={filterType === "all" ? "active" : ""}>
                All Transactions
              </a>
            </li>
            <li>
              <a onClick={() => setFilterType("sent")} className={filterType === "sent" ? "active" : ""}>
                Sent
              </a>
            </li>
            <li>
              <a onClick={() => setFilterType("received")} className={filterType === "received" ? "active" : ""}>
                Received
              </a>
            </li>
            <div className="divider my-1"></div>
            <li>
              <a onClick={() => setFilterType("ethSplit")} className={filterType === "ethSplit" ? "active" : ""}>
                ETH Splits
              </a>
            </li>
            <li>
              <a
                onClick={() => setFilterType("ethEqualSplit")}
                className={filterType === "ethEqualSplit" ? "active" : ""}
              >
                ETH Equal Splits
              </a>
            </li>
            <li>
              <a onClick={() => setFilterType("erc20Split")} className={filterType === "erc20Split" ? "active" : ""}>
                Token Splits
              </a>
            </li>
            <li>
              <a
                onClick={() => setFilterType("erc20EqualSplit")}
                className={filterType === "erc20EqualSplit" ? "active" : ""}
              >
                Token Equal Splits
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Results count */}
      {filteredCount > 0 && (
        <div className="text-sm text-base-content/60 mb-4">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCount)} of{" "}
          {filteredCount} transactions
        </div>
      )}

      {/* Transactions Table */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-error">Error loading history: {error.message}</p>
              <button onClick={handleRefresh} className="btn btn-sm btn-primary mt-4">
                Try Again
              </button>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-base-content/20" />
              <p className="text-base-content/60">
                {searchQuery || filterType !== "all"
                  ? "No transactions found matching your criteria"
                  : "No transactions found"}
              </p>
              {(searchQuery || filterType !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="btn btn-sm btn-ghost mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Recipients</th>
                      <th>From/To</th>
                      <th>Time</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map(tx => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        connectedAddress={address}
                        targetNetwork={targetNetwork}
                        onClick={() => handleTransactionClick(tx)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t border-base-300">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-ghost"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`btn btn-sm ${currentPage === pageNum ? "btn-primary" : "btn-ghost"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm btn-ghost"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transaction Details Drawer */}
      {selectedTransaction && (
        <SplitDetailsDrawer
          transaction={selectedTransaction}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          connectedAddress={address}
        />
      )}
    </div>
  );
}
