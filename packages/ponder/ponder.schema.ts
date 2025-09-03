import { index, onchainTable } from "ponder";

export const ethSplit = onchainTable(
  "eth_split",
  (t) => ({
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
  }),
  (table) => ({
    senderIdx: index("sender_idx").on(table.sender),
  })
);

export const ethEqualSplit = onchainTable(
  "eth_equal_split",
  (t) => ({
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
  }),
  (table) => ({
    senderIdx: index("sender_idx").on(table.sender),
  })
);

export const erc20Split = onchainTable(
  "erc20_split",
  (t) => ({
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
  }),
  (table) => ({
    senderIdx: index("sender_idx").on(table.sender),
  })
);

export const erc20EqualSplit = onchainTable(
  "erc20_equal_split",
  (t) => ({
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
  }),
  (table) => ({
    senderIdx: index("sender_idx").on(table.sender),
  })
);
