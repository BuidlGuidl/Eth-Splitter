"use client";

import React from "react";
import { SplitMode } from "../page";
import { Calculator, Users } from "lucide-react";

interface SplitModeSelectorProps {
  splitMode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
}

export const SplitModeSelector: React.FC<SplitModeSelectorProps> = ({ splitMode, onModeChange }) => {
  return (
    <div className="rounded-2xl shadow-lg p-6 mb-6 border border-base-100">
      <h2 className="text-xl font-semibold mb-4">Split Mode</h2>
      <p className="mb-4">Decide how to distribute the funds.</p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onModeChange("EQUAL")}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            splitMode === "EQUAL"
              ? "border-primary bg-primary/80"
              : "border-base-300 hover:border-base-100 hover:bg-secondary"
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <Users className="w-6 h-6" />
          </div>
          <div className="font-medium">Equal Split</div>
        </button>

        <button
          onClick={() => onModeChange("UNEQUAL")}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            splitMode === "UNEQUAL"
              ? "border-primary bg-primary/80"
              : "border-base-300 hover:border-base-100 hover:bg-secondary"
          }`}
        >
          <div className="flex items-center justify-center mb-2">
            <Calculator className="w-6 h-6" />
          </div>
          <div className="font-medium">Custom Split</div>
        </button>
      </div>
    </div>
  );
};
