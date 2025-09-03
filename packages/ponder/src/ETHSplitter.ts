import { ponder } from "ponder:registry";
import {
  ethSplits,
  ethSplitRecipients,
  ethEqualSplits,
  ethEqualSplitRecipients,
  erc20Splits,
  erc20SplitRecipients,
  erc20EqualSplits,
  erc20EqualSplitRecipients,
  userStats,
  tokenStats,
} from "ponder:schema";

async function updateUserStats(
  context: any,
  address: `0x${string}`,
  chainId: number,
  type: "ethSent" | "ethReceived" | "erc20Sent" | "erc20Received",
  amount: bigint,
  timestamp: number
) {
  const userId = `${address.toLowerCase()}_${chainId}`;
  const existingStats = await context.db.find(userStats, { id: userId });

  if (existingStats) {
    const updates: any = { lastActivityTimestamp: timestamp };

    if (type === "ethSent") {
      updates.totalEthSent = (
        BigInt(existingStats.totalEthSent) + amount
      ).toString();
      updates.ethSplitCount = existingStats.ethSplitCount + 1;
    } else if (type === "ethReceived") {
      updates.totalEthReceived = (
        BigInt(existingStats.totalEthReceived) + amount
      ).toString();
      updates.ethReceivedCount = existingStats.ethReceivedCount + 1;
    } else if (type === "erc20Sent") {
      updates.totalErc20Sent = (
        BigInt(existingStats.totalErc20Sent) + amount
      ).toString();
      updates.erc20SplitCount = existingStats.erc20SplitCount + 1;
    } else if (type === "erc20Received") {
      updates.totalErc20Received = (
        BigInt(existingStats.totalErc20Received) + amount
      ).toString();
      updates.erc20ReceivedCount = existingStats.erc20ReceivedCount + 1;
    }

    await context.db.update(userStats, { id: userId }).set(updates);
  } else {
    const newStats: any = {
      id: userId,
      address: address.toLowerCase(),
      chainId,
      totalEthSent: "0",
      totalEthReceived: "0",
      totalErc20Sent: "0",
      totalErc20Received: "0",
      ethSplitCount: 0,
      ethReceivedCount: 0,
      erc20SplitCount: 0,
      erc20ReceivedCount: 0,
      lastActivityTimestamp: timestamp,
    };

    if (type === "ethSent") {
      newStats.totalEthSent = amount.toString();
      newStats.ethSplitCount = 1;
    } else if (type === "ethReceived") {
      newStats.totalEthReceived = amount.toString();
      newStats.ethReceivedCount = 1;
    } else if (type === "erc20Sent") {
      newStats.totalErc20Sent = amount.toString();
      newStats.erc20SplitCount = 1;
    } else if (type === "erc20Received") {
      newStats.totalErc20Received = amount.toString();
      newStats.erc20ReceivedCount = 1;
    }

    await context.db.insert(userStats).values(newStats);
  }
}

ponder.on("ETHSplitter:EthSplit", async ({ event, context }) => {
  const { sender, totalAmount, recipients, amounts } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  await context.db.insert(ethSplits).values({
    id: splitId,
    txHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    recipientCount: recipients.length,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });

  for (let i = 0; i < recipients.length; i++) {
    await context.db.insert(ethSplitRecipients).values({
      id: `${splitId}_${i}`,
      splitId,
      recipient: recipients[i]?.toLowerCase() || "",
      amount: amounts[i]?.toString() || "0",
      recipientIndex: i,
    });

    await updateUserStats(
      context,
      recipients[i] as `0x${string}`,
      chainId,
      "ethReceived",
      amounts[i] || 0n,
      Number(event.block.timestamp)
    );
  }

  await updateUserStats(
    context,
    sender,
    chainId,
    "ethSent",
    totalAmount,
    Number(event.block.timestamp)
  );
});

ponder.on("ETHSplitter:EthSplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;
  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(ethEqualSplits).values({
    id: splitId,
    txHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    recipientCount: recipients.length,
    amountPerRecipient: amountPerRecipient.toString(),
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });

  for (let i = 0; i < recipients.length; i++) {
    await context.db.insert(ethEqualSplitRecipients).values({
      id: `${splitId}_${i}`,
      splitId,
      recipient: recipients[i]?.toLowerCase() || "",
      recipientIndex: i,
    });

    await updateUserStats(
      context,
      recipients[i] as `0x${string}`,
      chainId,
      "ethReceived",
      amountPerRecipient,
      Number(event.block.timestamp)
    );
  }

  await updateUserStats(
    context,
    sender,
    chainId,
    "ethSent",
    totalAmount,
    Number(event.block.timestamp)
  );
});

ponder.on("ETHSplitter:Erc20Split", async ({ event, context }) => {
  const { sender, recipients, amounts, token } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);

  await context.db.insert(erc20Splits).values({
    id: splitId,
    txHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),
    totalAmount: totalAmount.toString(),
    recipientCount: recipients.length,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });

  for (let i = 0; i < recipients.length; i++) {
    await context.db.insert(erc20SplitRecipients).values({
      id: `${splitId}_${i}`,
      splitId,
      recipient: recipients[i]?.toLowerCase() || "",
      amount: amounts[i]?.toString() || "0",
      recipientIndex: i,
    });

    await updateUserStats(
      context,
      recipients[i] as `0x${string}`,
      chainId,
      "erc20Received",
      amounts[i] || 0n,
      Number(event.block.timestamp)
    );
  }

  await updateUserStats(
    context,
    sender,
    chainId,
    "erc20Sent",
    totalAmount,
    Number(event.block.timestamp)
  );

  await updateTokenStats(
    context,
    token.toLowerCase(),
    chainId,
    totalAmount,
    Number(event.block.timestamp)
  );
});

ponder.on("ETHSplitter:Erc20SplitEqual", async ({ event, context }) => {
  const { sender, totalAmount, recipients, token } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;
  const amountPerRecipient = totalAmount / BigInt(recipients.length);

  await context.db.insert(erc20EqualSplits).values({
    id: splitId,
    txHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    token: token.toLowerCase(),
    totalAmount: totalAmount.toString(),
    recipientCount: recipients.length,
    amountPerRecipient: amountPerRecipient.toString(),
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });

  for (let i = 0; i < recipients.length; i++) {
    await context.db.insert(erc20EqualSplitRecipients).values({
      id: `${splitId}_${i}`,
      splitId,
      recipient: recipients[i]?.toLowerCase() || "",
      recipientIndex: i,
    });

    await updateUserStats(
      context,
      recipients[i] as `0x${string}`,
      chainId,
      "erc20Received",
      amountPerRecipient,
      Number(event.block.timestamp)
    );
  }

  await updateUserStats(
    context,
    sender,
    chainId,
    "erc20Sent",
    totalAmount,
    Number(event.block.timestamp)
  );

  await updateTokenStats(
    context,
    token.toLowerCase(),
    chainId,
    totalAmount,
    Number(event.block.timestamp)
  );
});

async function updateTokenStats(
  context: any,
  tokenAddress: string,
  chainId: number,
  amount: bigint,
  timestamp: number
) {
  const tokenId = `${tokenAddress}_${chainId}`;
  const existingStats = await context.db.find(tokenStats, { id: tokenId });

  if (existingStats) {
    await context.db.update(tokenStats, { id: tokenId }).set({
      totalVolume: (BigInt(existingStats.totalVolume) + amount).toString(),
      splitCount: existingStats.splitCount + 1,
      lastActivityTimestamp: timestamp,
    });
  } else {
    await context.db.insert(tokenStats).values({
      id: tokenId,
      tokenAddress,
      chainId,
      totalVolume: amount.toString(),
      splitCount: 1,
      uniqueSenders: 1,
      uniqueRecipients: 1,
      lastActivityTimestamp: timestamp,
    });
  }
}
