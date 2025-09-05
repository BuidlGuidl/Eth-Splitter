import { ponder } from "ponder:registry";
import { split } from "ponder:schema";
import { erc20Abi } from "viem";

ponder.on("ETHSplitter:EthSplit", async ({ event, context }) => {
  const { sender, totalAmount, recipients, amounts } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  await context.db.insert(split).values({
    id: splitId,
    type: "ETH_SPLIT",
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    amounts: amounts.map((a: bigint) => a.toString()),
    recipients: recipients.map((r: string) => r.toLowerCase()),
    recipientCount: recipients.length,
    amountPerRecipient: null,
    token: null,
    tokenSymbol: null,
    tokenDecimals: null,
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

  await context.db.insert(split).values({
    id: splitId,
    type: "ETH_EQUAL_SPLIT",
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    amounts: null,
    recipients: recipients.map((r: string) => r.toLowerCase()),
    recipientCount: recipients.length,
    amountPerRecipient: amountPerRecipient.toString(),
    token: null,
    tokenSymbol: null,
    tokenDecimals: null,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});

ponder.on("ETHSplitter:Erc20Split", async ({ event, context }) => {
  const { sender, recipients, amounts, token } = event.args;
  const chainId = context.network.chainId;
  const splitId = event.log.id;

  const totalAmount = amounts.reduce(
    (sum: bigint, amount: bigint) => sum + amount,
    0n
  );

  const [tokenSymbol, tokenDecimals] = await Promise.all([
    context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);

  await context.db.insert(split).values({
    id: splitId,
    type: "ERC20_SPLIT",
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    amounts: amounts.map((a: bigint) => a.toString()),
    recipients: recipients.map((r: string) => r.toLowerCase()),
    recipientCount: recipients.length,
    amountPerRecipient: null,
    token: token.toLowerCase(),
    tokenSymbol,
    tokenDecimals,
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

  const [tokenSymbol, tokenDecimals] = await Promise.all([
    context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    context.client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "decimals",
    }),
  ]);

  await context.db.insert(split).values({
    id: splitId,
    type: "ERC20_EQUAL_SPLIT",
    transactionHash: event.transaction.hash.toLowerCase(),
    sender: sender.toLowerCase(),
    totalAmount: totalAmount.toString(),
    amounts: null,
    recipients: recipients.map((r: string) => r.toLowerCase()),
    recipientCount: recipients.length,
    amountPerRecipient: amountPerRecipient.toString(),
    token: token.toLowerCase(),
    tokenSymbol,
    tokenDecimals,
    blockNumber: Number(event.block.number),
    blockTimestamp: Number(event.block.timestamp),
    chainId,
  });
});
