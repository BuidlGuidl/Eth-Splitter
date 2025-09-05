"use client";

import React, { useMemo, useState } from "react";
import { HistoryCard } from "./_components/HistoryCard";
import { HistoryDetailsDrawer } from "./_components/HistoryDetailsDrawer";
import { HistoryFilters } from "./_components/HistoryFilters";
import { HistoryStats } from "./_components/HistoryStats";
import { AnimatePresence, motion } from "framer-motion";
import { History, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import type { SplitHistoryItem } from "~~/hooks/useSplitterHistory";
import { useSplitterHistory } from "~~/hooks/useSplitterHistory";

export type FilterType = "all" | "ETH_SPLIT" | "ETH_EQUAL_SPLIT" | "ERC20_SPLIT" | "ERC20_EQUAL_SPLIT";
export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const HistoryPage = () => {
  const { address } = useAccount();
  const { data: history = [], isLoading, error } = useSplitterHistory();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSplit, setSelectedSplit] = useState<SplitHistoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Filter by type
    if (selectedFilter !== "all") {
      filtered = filtered.filter(item => item.type === selectedFilter);
    }

    // Filter by search term
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

    // Sort
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

  const handleCardClick = (split: SplitHistoryItem) => {
    setSelectedSplit(split);
    setDrawerOpen(true);
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

      <AnimatePresence mode="popLayout">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" layout>
          {filteredAndSortedHistory.map((split, index) => (
            <HistoryCard key={split.id} split={split} onClick={() => handleCardClick(split)} delay={index * 0.05} />
          ))}
        </motion.div>
      </AnimatePresence>

      <HistoryDetailsDrawer
        split={selectedSplit}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSplit(null);
        }}
      />
    </div>
  );
};

export default HistoryPage;
