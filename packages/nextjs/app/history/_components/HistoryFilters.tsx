import React from "react";
import type { FilterType, SortOption } from "../page";
import { motion } from "framer-motion";
import { Filter, Search, SortAsc, SortDesc } from "lucide-react";

interface HistoryFiltersProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  searchTerm,
  onSearchChange,
}) => {
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Splits" },
    { value: "ETH_SPLIT", label: "ETH Custom" },
    { value: "ETH_EQUAL_SPLIT", label: "ETH Equal" },
    { value: "ERC20_SPLIT", label: "ERC20 Custom" },
    { value: "ERC20_EQUAL_SPLIT", label: "ERC20 Equal" },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: "date-desc", label: "Newest First", icon: <SortDesc className="w-4 h-4" /> },
    { value: "date-asc", label: "Oldest First", icon: <SortAsc className="w-4 h-4" /> },
    { value: "amount-desc", label: "Highest Amount", icon: <SortDesc className="w-4 h-4" /> },
    { value: "amount-asc", label: "Lowest Amount", icon: <SortAsc className="w-4 h-4" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
        <input
          type="text"
          placeholder="Search by transaction hash, address, or token..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="input input-bordered w-full pl-10 pr-4"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-base-content/60" />
            <span className="text-sm font-semibold">Filter by Type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`btn btn-sm ${selectedFilter === option.value ? "btn-primary" : "btn-ghost"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:w-64">
          <div className="flex items-center gap-2 mb-2">
            <SortDesc className="w-4 h-4 text-base-content/60" />
            <span className="text-sm font-semibold">Sort by</span>
          </div>
          <select
            className="select select-bordered w-full"
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};
