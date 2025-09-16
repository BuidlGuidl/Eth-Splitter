"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HistoryCard } from "./_components/HistoryCard";
import { HistoryDetailsDrawer } from "./_components/HistoryDetailsDrawer";
import { HistoryFilters } from "./_components/HistoryFilters";
import { HistoryStats } from "./_components/HistoryStats";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import type { SplitHistoryItem } from "~~/hooks/useSplitterHistory";
import { useSplitterHistory } from "~~/hooks/useSplitterHistory";

export type FilterType = "all" | "ETH_SPLIT" | "ETH_EQUAL_SPLIT" | "ERC20_SPLIT" | "ERC20_EQUAL_SPLIT";
export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const ITEMS_PER_PAGE = 12;

const HistoryPage = () => {
  const { address } = useAccount();
  const router = useRouter();
  const { data: history = [], isLoading, error } = useSplitterHistory();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<SplitHistoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleRepeat = (
    split: SplitHistoryItem,
    isEqual: boolean,
    isErc20: boolean,
    onRepeat?: () => void,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();

    if (!split) return;

    const params = new URLSearchParams();

    params.append("mode", isEqual ? "EQUAL" : "UNEQUAL");

    if (isErc20) {
      if (!split.token || !split.tokenSymbol || split.tokenDecimals === undefined || split.tokenDecimals === null) {
        console.error("Missing ERC20 token information for repeat split.");
        return;
      }
      params.append("token", split.token);
      params.append("tokenSymbol", split.tokenSymbol);
      params.append("tokenDecimals", split.tokenDecimals.toString());
    } else {
      params.append("token", "ETH");
    }

    split.recipients.forEach((recipient, index) => {
      params.append(`recipient_${index}`, recipient);
    });
    params.append("recipientCount", split.recipientCount.toString());

    if (isEqual) {
      if (split.amountPerRecipient) {
        params.append("equalAmount", split.amountPerRecipient);
      }
    } else {
      if (split.amounts && split.amounts.length > 0) {
        split.amounts.forEach((amount, index) => {
          params.append(`amount_${index}`, amount);
        });
      }
    }

    router.push(`/split?${params.toString()}`);

    if (onRepeat) onRepeat();
  };

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    if (selectedFilter !== "all") {
      filtered = filtered.filter(item => item.type === selectedFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.transactionHash.toLowerCase().includes(search) ||
          item.recipients.some(r => r.toLowerCase().includes(search)) ||
          (item.token && item.token.toLowerCase().includes(search)) ||
          (item.tokenSymbol && item.tokenSymbol.toLowerCase().includes(search)),
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return b.blockTimestamp - a.blockTimestamp;
        case "date-asc":
          return a.blockTimestamp - b.blockTimestamp;
        case "amount-desc":
          return Number(b.totalAmount) - Number(a.totalAmount);
        case "amount-asc":
          return Number(a.totalAmount) - Number(b.totalAmount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, selectedFilter, sortBy, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedHistory = filteredAndSortedHistory.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, sortBy, searchTerm]);

  const handleCardClick = (split: SplitHistoryItem) => {
    setSelectedSplit(split);
    setDrawerOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);

        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 2) {
          end = 4;
        } else if (currentPage >= totalPages - 1) {
          start = totalPages - 3;
        }

        if (start > 2) pages.push("...");
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        if (end < totalPages - 1) pages.push("...");

        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="flex justify-center mt-8">
        <div className="btn-group">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`btn btn-sm ${currentPage === 1 ? "btn-disabled" : "btn-ghost"}`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, index) =>
              typeof page === "number" ? (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-ghost hover:btn-secondary"}`}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-2 text-base-content/40">
                  {page}
                </span>
              ),
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`btn btn-sm ${currentPage === totalPages ? "btn-disabled" : "btn-ghost"}`}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <History className="w-16 h-16 text-base-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-base-content/60 max-w-md">Please connect your wallet to view your split history</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="alert alert-error max-w-md">
          <span>Error loading history. Please try again later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">Split History</h1>
          {address && (
            <div className="badge badge-lg badge-secondary">
              <Address address={address} format="short" />
            </div>
          )}
        </div>
        <p className="text-base-content/60">View and manage your past ETH and token splits</p>
      </motion.div>

      <HistoryStats history={history} />

      <HistoryFilters
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-base-content/60">Loading your split history...</p>
        </div>
      )}

      {!isLoading && filteredAndSortedHistory.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <History className="w-16 h-16 text-base-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm || selectedFilter !== "all" ? "No splits found" : "No split history yet"}
          </h3>
          <p className="text-base-content/60 max-w-md mx-auto">
            {searchTerm || selectedFilter !== "all"
              ? "Try adjusting your filters or search terms"
              : "Create your first split to see it appear here"}
          </p>
        </motion.div>
      )}

      {!isLoading && paginatedHistory.length > 0 && (
        <>
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" layout>
              {paginatedHistory.map((split, index) => (
                <HistoryCard
                  key={split.id}
                  split={split}
                  onClick={() => handleCardClick(split)}
                  delay={index * 0.05}
                  handleRepeat={handleRepeat}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <PaginationControls />
        </>
      )}

      <HistoryDetailsDrawer
        split={selectedSplit}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSplit(null);
        }}
        handleRepeat={handleRepeat}
      />
    </div>
  );
};

export default HistoryPage;
