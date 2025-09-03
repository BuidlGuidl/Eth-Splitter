import { onchainTable } from "ponder";

export const ethSplits = onchainTable("eth_splits", (t) => ({
  id: t.text().primaryKey(),
  transactionHash: t.text().notNull(),
  sender: t.text().notNull(),
  totalAmount: t.text().notNull(),
  amounts: t.json().$type<string[]>().notNull(),
  recipientCount: t.integer().notNull(),
  recipients: t.json().$type<string[]>().notNull(),
  blockNumber: t.integer().notNull(),
  blockTimestamp: t.integer().notNull(),
  chainId: t.integer().notNull(),
}));

export const ethEqualSplits = onchainTable("eth_equal_splits", (t) => ({
  id: t.text().primaryKey(),
  transactionHash: t.text().notNull(),
  sender: t.text().notNull(),
  totalAmount: t.text().notNull(),
  recipientCount: t.integer().notNull(),
  recipients: t.json().$type<string[]>().notNull(),
  amountPerRecipient: t.text().notNull(),
  blockNumber: t.integer().notNull(),
  blockTimestamp: t.integer().notNull(),
  chainId: t.integer().notNull(),
}));

export const erc20Splits = onchainTable("erc20_splits", (t) => ({
  id: t.text().primaryKey(),
  transactionHash: t.text().notNull(),
  sender: t.text().notNull(),
  token: t.text().notNull(),
  tokenSymbol: t.text().notNull(),
  tokenDecimals: t.integer().notNull(),
  totalAmount: t.text().notNull(),
  amounts: t.json().$type<string[]>().notNull(),
  recipientCount: t.integer().notNull(),
  recipients: t.json().$type<string[]>().notNull(),
  blockNumber: t.integer().notNull(),
  blockTimestamp: t.integer().notNull(),
  chainId: t.integer().notNull(),
}));

export const erc20EqualSplits = onchainTable("erc20_equal_splits", (t) => ({
  id: t.text().primaryKey(),
  transactionHash: t.text().notNull(),
  sender: t.text().notNull(),
  token: t.text().notNull(),
  tokenSymbol: t.text().notNull(),
  tokenDecimals: t.integer().notNull(),
  totalAmount: t.text().notNull(),
  recipients: t.json().$type<string[]>().notNull(),
  recipientCount: t.integer().notNull(),
  amountPerRecipient: t.text().notNull(),
  blockNumber: t.integer().notNull(),
  blockTimestamp: t.integer().notNull(),
  chainId: t.integer().notNull(),
}));
