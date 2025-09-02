import { ponder } from "ponder:registry";
import {
  ethSplit,
  erc20Split,
  ethSplitEqual,
  erc20SplitEqual,
} from "ponder:schema";

ponder.on("ETHSplitter:EthSplit", async ({ event, context }) => {
  const { sender, totalAmount, recipients, amounts } = event.args;

  await context.db.insert(ethSplit).values({
    id: event.log.id,
    sender: sender.toLowerCase(),
    totalAmount,
    recipients: recipients.map((addr: string) => addr.toLowerCase()),
    amounts,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash.toLowerCase(),
  });
});

ponder.on("ETHSplitter:Erc20Split", async ({ event, context }) => {
  const { sender, recipients, amounts, token } = event.args;

  await context.db.insert(erc20Split).values({
    id: event.log.id,
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),
    recipients: recipients.map((addr: string) => addr.toLowerCase()),
    amounts,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash.toLowerCase(),
  });
});

ponder.on("ETHSplitter:EthSplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients } = event.args;

  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(ethSplitEqual).values({
    id: event.log.id,
    sender: sender.toLowerCase(),
    totalAmount,
    recipients: recipients.map((addr: string) => addr.toLowerCase()),
    amountPerRecipient,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash.toLowerCase(),
  });
});

ponder.on("ETHSplitter:Erc20SplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients, token } = event.args;

  // Calculate amount per recipient
  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(erc20SplitEqual).values({
    id: event.log.id,
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),
    totalAmount,
    recipients: recipients.map((addr: string) => addr.toLowerCase()),
    amountPerRecipient,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash.toLowerCase(),
  });
});
