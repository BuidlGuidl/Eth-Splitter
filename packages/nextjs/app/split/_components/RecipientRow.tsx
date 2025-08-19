"use client";

import React from "react";
import { SplitMode } from "../page";
import { motion } from "framer-motion";
import { Minus, User } from "lucide-react";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { Contact } from "~~/utils/splitter";

interface RecipientRowProps {
  recipient: {
    id: string;
    address: string;
    amount: string;
    percentage?: number;
    label?: string;
    ensName?: string;
  };
  index: number;
  splitMode: SplitMode;
  selectedToken: { address: string; symbol: string; name: string; decimals: number } | null;
  equalAmount: string;
  savedContacts: Contact[];
  errors: { [key: string]: string };
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const RecipientRow: React.FC<RecipientRowProps> = ({
  recipient,
  index,
  splitMode,
  selectedToken,
  equalAmount,
  errors,
  onUpdate,
  onRemove,
  canRemove,
}) => {
  return (
    <motion.div
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
            onChange={value => onUpdate(recipient.id, "address", value)}
            placeholder="Wallet address or ENS"
          />
          {errors[`${recipient.id}-address`] && (
            <p className="mt-1 text-sm text-error">{errors[`${recipient.id}-address`]}</p>
          )}
          {recipient.label && (
            <div className="mt-1 flex items-center text-xs">
              <User className="w-3 h-3 mr-1" />
              {recipient.label}
            </div>
          )}
        </div>

        {splitMode === "UNEQUAL" ? (
          <div>
            {selectedToken?.address === "ETH" ? (
              <EtherInput
                value={recipient.amount}
                onChange={value => onUpdate(recipient.id, "amount", value)}
                placeholder="0.0"
              />
            ) : (
              <InputBase
                value={recipient.amount}
                onChange={value => onUpdate(recipient.id, "amount", value)}
                placeholder="0.0"
                suffix={
                  recipient.percentage !== undefined && recipient.percentage > 0 ? (
                    <span className="px-2 text-xs my-auto opacity-90">{recipient.percentage.toFixed(1)}%</span>
                  ) : undefined
                }
              />
            )}
            {errors[`${recipient.id}-amount`] && (
              <p className="mt-1 text-sm text-error">{errors[`${recipient.id}-amount`]}</p>
            )}
          </div>
        ) : (
          splitMode === "EQUAL" &&
          equalAmount && (
            <div className="">
              <div className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl font-medium text-sm">
                {equalAmount} {selectedToken?.symbol}
              </div>
            </div>
          )
        )}
      </div>

      <button
        onClick={() => onRemove(recipient.id)}
        disabled={!canRemove}
        className={`btn btn-sm rounded-md transition-all ${
          !canRemove ? "btn-active cursor-not-allowed opacity-50" : "btn-active"
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
