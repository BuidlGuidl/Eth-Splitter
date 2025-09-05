import { index, onchainTable } from "ponder";

export const split = onchainTable(
  "split",
  (t) => ({
    id: t.text().primaryKey(),
    type: t.text().notNull(),
    transactionHash: t.text().notNull(),
    sender: t.text().notNull(),
    totalAmount: t.text().notNull(),

    // Common fields
    recipients: t.json().$type<string[]>().notNull(),
    recipientCount: t.integer().notNull(),
    blockNumber: t.integer().notNull(),
    blockTimestamp: t.integer().notNull(),
    chainId: t.integer().notNull(),

    // Optional fields (nullable for different types)
    amounts: t.json().$type<string[]>(),
    amountPerRecipient: t.text(),

    // ERC20 specific fields (null for ETH splits)
    token: t.text(),
    tokenSymbol: t.text(),
    tokenDecimals: t.integer(),
  }),
  (table) => ({
    senderIdx: index("sender_idx").on(table.sender),
    typeIdx: index("type_idx").on(table.type),
    tokenIdx: index("token_idx").on(table.token),
    compositeIdx: index("type_sender_idx").on(table.type, table.sender),
  })
);
