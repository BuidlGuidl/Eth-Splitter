import { Erc20EqualSplit, Erc20Split, EthEqualSplit, EthSplit, SplitHistoryItem } from "~~/hooks/useSplitterHistory";

export const isEthSplit = (split: SplitHistoryItem): split is EthSplit => {
  return split.type === "ETH_SPLIT";
};

export const isEthEqualSplit = (split: SplitHistoryItem): split is EthEqualSplit => {
  return split.type === "ETH_EQUAL_SPLIT";
};

export const isErc20Split = (split: SplitHistoryItem): split is Erc20Split => {
  return split.type === "ERC20_SPLIT";
};

export const isErc20EqualSplit = (split: SplitHistoryItem): split is Erc20EqualSplit => {
  return split.type === "ERC20_EQUAL_SPLIT";
};

export const isEthTransaction = (split: SplitHistoryItem): split is EthSplit | EthEqualSplit => {
  return split.type === "ETH_SPLIT" || split.type === "ETH_EQUAL_SPLIT";
};

export const isErc20Transaction = (split: SplitHistoryItem): split is Erc20Split | Erc20EqualSplit => {
  return split.type === "ERC20_SPLIT" || split.type === "ERC20_EQUAL_SPLIT";
};

export const isEqualSplit = (split: SplitHistoryItem): split is EthEqualSplit | Erc20EqualSplit => {
  return split.type === "ETH_EQUAL_SPLIT" || split.type === "ERC20_EQUAL_SPLIT";
};

export const isCustomSplit = (split: SplitHistoryItem): split is EthSplit | Erc20Split => {
  return split.type === "ETH_SPLIT" || split.type === "ERC20_SPLIT";
};
