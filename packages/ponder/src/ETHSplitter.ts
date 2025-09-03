import { ponder } from "ponder:registry";
import {
  ethSplit,
  ethEqualSplit,
  erc20Split,
  erc20EqualSplit,
} from "ponder:schema";
import { erc20Abi } from "viem";

ponder.on("ETHSplitter:EthSplit", async ({ event, context }) => {
  const { sender, totalAmount, recipients, amounts } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  await context.db.insert(ethSplit).values({
    id: splitId,
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    amounts: amounts.map((a) => a.toString()),
    recipients: recipients.map((r) => r.toLowerCase()),
    recipientCount: recipients.length,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});

ponder.on("ETHSplitter:EthSplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;
  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(ethEqualSplit).values({
    id: splitId,
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    recipientCount: recipients.length,
    recipients: recipients.map((r) => r.toLowerCase()),
    amountPerRecipient: amountPerRecipient.toString(),
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});

ponder.on("ETHSplitter:Erc20Split", async ({ event, context }) => {
  const { sender, recipients, amounts, token } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);

  await context.db.insert(erc20Split).values({
    id: splitId,
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),

    totalAmount: totalAmount.toString(),
    amounts: amounts.map((a) => a.toString()),
    tokenSymbol: await context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    tokenDecimals: await context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    recipients: recipients.map((r) => r.toLowerCase()),
    recipientCount: recipients.length,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});

ponder.on("ETHSplitter:Erc20SplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients, token } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;
  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(erc20EqualSplit).values({
    id: splitId,
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),
    totalAmount: totalAmount.toString(),
    tokenSymbol: await context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    tokenDecimals: await context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    recipients: recipients.map((r) => r.toLowerCase()),
    recipientCount: recipients.length,
    amountPerRecipient: amountPerRecipient.toString(),
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});
