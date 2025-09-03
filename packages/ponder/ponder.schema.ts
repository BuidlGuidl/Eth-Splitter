import { onchainTable, primaryKey, index } from "ponder";

export const ethSplits = onchainTable(
  "eth_splits",
  (t) => ({
    id: t.text().primaryKey(),
    txHash: t.text().notNull(),
    sender: t.text().notNull(),
    totalAmount: t.text().notNull(),
    recipientCount: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    blockTimestamp: t.integer().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    senderIdx: index("eth_splits_sender_idx").on(table.sender),
    blockTimestampIdx: index("eth_splits_timestamp_idx").on(
      table.blockTimestamp
    ),
    chainIdx: index("eth_splits_chain_idx").on(table.chainId),
  })
);

export const ethSplitRecipients = onchainTable(
  "eth_split_recipients",
  (t) => ({
    id: t.text().primaryKey(),
    splitId: t.text().notNull(),
    recipient: t.text().notNull(),
    amount: t.text().notNull(),
    recipientIndex: t.integer().notNull(),
  }),
  (table) => ({
    splitIdx: index("eth_split_recipients_split_idx").on(table.splitId),
    recipientIdx: index("eth_split_recipients_address_idx").on(table.recipient),
  })
);

export const ethEqualSplits = onchainTable(
  "eth_equal_splits",
  (t) => ({
    id: t.text().primaryKey(),
    txHash: t.text().notNull(),
    sender: t.text().notNull(),
    totalAmount: t.text().notNull(),
    recipientCount: t.integer().notNull(),
    amountPerRecipient: t.text().notNull(),
    blockNumber: t.integer().notNull(),
    blockTimestamp: t.integer().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    senderIdx: index("eth_equal_splits_sender_idx").on(table.sender),
    blockTimestampIdx: index("eth_equal_splits_timestamp_idx").on(
      table.blockTimestamp
    ),
    chainIdx: index("eth_equal_splits_chain_idx").on(table.chainId),
  })
);

export const ethEqualSplitRecipients = onchainTable(
  "eth_equal_split_recipients",
  (t) => ({
    id: t.text().primaryKey(),
    splitId: t.text().notNull(),
    recipient: t.text().notNull(),
    recipientIndex: t.integer().notNull(),
  }),
  (table) => ({
    splitIdx: index("eth_equal_split_recipients_split_idx").on(table.splitId),
    recipientIdx: index("eth_equal_split_recipients_address_idx").on(
      table.recipient
    ),
  })
);

export const erc20Splits = onchainTable(
  "erc20_splits",
  (t) => ({
    id: t.text().primaryKey(),
    txHash: t.text().notNull(),
    sender: t.text().notNull(),
    token: t.text().notNull(),
    totalAmount: t.text().notNull(),
    recipientCount: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    blockTimestamp: t.integer().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    senderIdx: index("erc20_splits_sender_idx").on(table.sender),
    tokenIdx: index("erc20_splits_token_idx").on(table.token),
    blockTimestampIdx: index("erc20_splits_timestamp_idx").on(
      table.blockTimestamp
    ),
    chainIdx: index("erc20_splits_chain_idx").on(table.chainId),
  })
);

export const erc20SplitRecipients = onchainTable(
  "erc20_split_recipients",
  (t) => ({
    id: t.text().primaryKey(),
    splitId: t.text().notNull(),
    recipient: t.text().notNull(),
    amount: t.text().notNull(),
    recipientIndex: t.integer().notNull(),
  }),
  (table) => ({
    splitIdx: index("erc20_split_recipients_split_idx").on(table.splitId),
    recipientIdx: index("erc20_split_recipients_address_idx").on(
      table.recipient
    ),
  })
);

export const erc20EqualSplits = onchainTable(
  "erc20_equal_splits",
  (t) => ({
    id: t.text().primaryKey(),
    txHash: t.text().notNull(),
    sender: t.text().notNull(),
    token: t.text().notNull(),
    totalAmount: t.text().notNull(),
    recipientCount: t.integer().notNull(),
    amountPerRecipient: t.text().notNull(),
    blockNumber: t.integer().notNull(),
    blockTimestamp: t.integer().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    senderIdx: index("erc20_equal_splits_sender_idx").on(table.sender),
    tokenIdx: index("erc20_equal_splits_token_idx").on(table.token),
    blockTimestampIdx: index("erc20_equal_splits_timestamp_idx").on(
      table.blockTimestamp
    ),
    chainIdx: index("erc20_equal_splits_chain_idx").on(table.chainId),
  })
);

export const erc20EqualSplitRecipients = onchainTable(
  "erc20_equal_split_recipients",
  (t) => ({
    id: t.text().primaryKey(),
    splitId: t.text().notNull(),
    recipient: t.text().notNull(),
    recipientIndex: t.integer().notNull(),
  }),
  (table) => ({
    splitIdx: index("erc20_equal_split_recipients_split_idx").on(table.splitId),
    recipientIdx: index("erc20_equal_split_recipients_address_idx").on(
      table.recipient
    ),
  })
);

export const userStats = onchainTable(
  "user_stats",
  (t) => ({
    id: t.text().primaryKey(), // format: {address}_{chainId}
    address: t.text().notNull(),
    chainId: t.integer().notNull(),
    totalEthSent: t.text().notNull().default("0"),
    totalEthReceived: t.text().notNull().default("0"),
    totalErc20Sent: t.text().notNull().default("0"),
    totalErc20Received: t.text().notNull().default("0"),
    ethSplitCount: t.integer().notNull().default(0),
    ethReceivedCount: t.integer().notNull().default(0),
    erc20SplitCount: t.integer().notNull().default(0),
    erc20ReceivedCount: t.integer().notNull().default(0),
    lastActivityTimestamp: t.integer().notNull(),
  }),
  (table) => ({
    addressIdx: index("user_stats_address_idx").on(table.address),
    chainIdx: index("user_stats_chain_idx").on(table.chainId),
    compositeIdx: index("user_stats_composite_idx").on(
      table.address,
      table.chainId
    ),
  })
);

export const tokenStats = onchainTable(
  "token_stats",
  (t) => ({
    id: t.text().primaryKey(), // format: {tokenAddress}_{chainId}
    tokenAddress: t.text().notNull(),
    chainId: t.integer().notNull(),
    totalVolume: t.text().notNull().default("0"),
    splitCount: t.integer().notNull().default(0),
    uniqueSenders: t.integer().notNull().default(0),
    uniqueRecipients: t.integer().notNull().default(0),
    lastActivityTimestamp: t.integer().notNull(),
  }),
  (table) => ({
    tokenIdx: index("token_stats_address_idx").on(table.tokenAddress),
    chainIdx: index("token_stats_chain_idx").on(table.chainId),
    compositeIdx: index("token_stats_composite_idx").on(
      table.tokenAddress,
      table.chainId
    ),
  })
);
