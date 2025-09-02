import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";

// Types for the ETH Splitter history data
export type SplitRecipient = {
  recipient: string;
  amount: string;
  recipientIndex: number;
};

export type SplitTransaction = {
  id: string;
  txHash: string;
  sender: string;
  totalAmount: string;
  recipientCount: number;
  recipients: SplitRecipient[];
  blockNumber: number;
  blockTimestamp: number;
  chainId: number;
  type: "ethSplit" | "ethEqualSplit" | "erc20Split" | "erc20EqualSplit";
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  amountPerRecipient?: string;
};

export type UserStatistics = {
  address: string;
  chainId: number;
  totalEthSent: string;
  totalEthReceived: string;
  totalErc20Sent: string;
  totalErc20Received: string;
  ethSplitCount: number;
  ethReceivedCount: number;
  erc20SplitCount: number;
  erc20ReceivedCount: number;
  lastActivityTimestamp: number;
};

export type TokenStatistics = {
  tokenAddress: string;
  chainId: number;
  totalVolume: string;
  splitCount: number;
  uniqueSenders: number;
  uniqueRecipients: number;
  lastActivityTimestamp: number;
};

export type GlobalStatistics = {
  chainId: number;
  totalEthVolume: string;
  totalErc20Volume: string;
  totalEthSplits: number;
  totalErc20Splits: number;
  totalUniqueSenders: number;
  totalUniqueRecipients: number;
  lastActivityTimestamp: number;
};

export type SplitterHistoryData = {
  transactions: SplitTransaction[];
  userStats: UserStatistics | null;
  tokenStats: TokenStatistics[];
  globalStats: GlobalStatistics | null;
  totalTransactionCount: number;
  isLoading: boolean;
  error: string | null;
};

// GraphQL response types
type GraphQLSplitterHistoryResponse = {
  ethSplits?: {
    items: {
      id: string;
      txHash: string;
      sender: string;
      totalAmount: string;
      recipientCount: number;
      blockNumber: number;
      blockTimestamp: number;
      chainId: number;
    }[];
  };
  ethSplitRecipients?: {
    items: {
      id: string;
      splitId: string;
      recipient: string;
      amount: string;
      recipientIndex: number;
    }[];
  };
  ethEqualSplits?: {
    items: {
      id: string;
      txHash: string;
      sender: string;
      totalAmount: string;
      recipientCount: number;
      amountPerRecipient: string;
      blockNumber: number;
      blockTimestamp: number;
      chainId: number;
    }[];
  };
  ethEqualSplitRecipients?: {
    items: {
      id: string;
      splitId: string;
      recipient: string;
      recipientIndex: number;
    }[];
  };
  erc20Splits?: {
    items: {
      id: string;
      txHash: string;
      sender: string;
      token: string;
      totalAmount: string;
      recipientCount: number;
      blockNumber: number;
      blockTimestamp: number;
      chainId: number;
    }[];
  };
  erc20SplitRecipients?: {
    items: {
      id: string;
      splitId: string;
      recipient: string;
      amount: string;
      recipientIndex: number;
    }[];
  };
  erc20EqualSplits?: {
    items: {
      id: string;
      txHash: string;
      sender: string;
      token: string;
      totalAmount: string;
      recipientCount: number;
      amountPerRecipient: string;
      blockNumber: number;
      blockTimestamp: number;
      chainId: number;
    }[];
  };
  erc20EqualSplitRecipients?: {
    items: {
      id: string;
      splitId: string;
      recipient: string;
      recipientIndex: number;
    }[];
  };
  userStats?: {
    items: {
      id: string;
      address: string;
      chainId: number;
      totalEthSent: string;
      totalEthReceived: string;
      totalErc20Sent: string;
      totalErc20Received: string;
      ethSplitCount: number;
      ethReceivedCount: number;
      erc20SplitCount: number;
      erc20ReceivedCount: number;
      lastActivityTimestamp: number;
    }[];
  };
  tokenStats?: {
    items: {
      id: string;
      tokenAddress: string;
      chainId: number;
      totalVolume: string;
      splitCount: number;
      uniqueSenders: number;
      uniqueRecipients: number;
      lastActivityTimestamp: number;
    }[];
  };
  globalStats?: {
    items: {
      id: string;
      chainId: number;
      totalEthVolume: string;
      totalErc20Volume: string;
      totalEthSplits: number;
      totalErc20Splits: number;
      totalUniqueSenders: number;
      totalUniqueRecipients: number;
      lastActivityTimestamp: number;
    }[];
  };
};

const fetchSplitterHistory = async (address?: string, chainId?: number, limit?: number, offset?: number) => {
  const whereConditions = [];

  if (address) {
    whereConditions.push(`sender: "${address.toLowerCase()}"`);
  }

  if (chainId) {
    whereConditions.push(`chainId: ${chainId}`);
  }

  const whereClause = whereConditions.length > 0 ? `(where: { ${whereConditions.join(", ")} })` : "";

  const paginationClause = `(limit: ${limit || 100}, offset: ${offset || 0})`;

  const query = gql`
    query GetSplitterHistory {
      ethSplits${whereClause} {
        items {
          id
          txHash
          sender
          totalAmount
          recipientCount
          blockNumber
          blockTimestamp
          chainId
        }
      }
      ethSplitRecipients {
        items {
          id
          splitId
          recipient
          amount
          recipientIndex
        }
      }
      ethEqualSplits${whereClause} {
        items {
          id
          txHash
          sender
          totalAmount
          recipientCount
          amountPerRecipient
          blockNumber
          blockTimestamp
          chainId
        }
      }
      ethEqualSplitRecipients {
        items {
          id
          splitId
          recipient
          recipientIndex
        }
      }
      erc20Splits${whereClause} {
        items {
          id
          txHash
          sender
          token
          totalAmount
          recipientCount
          blockNumber
          blockTimestamp
          chainId
        }
      }
      erc20SplitRecipients {
        items {
          id
          splitId
          recipient
          amount
          recipientIndex
        }
      }
      erc20EqualSplits${whereClause} {
        items {
          id
          txHash
          sender
          token
          totalAmount
          recipientCount
          amountPerRecipient
          blockNumber
          blockTimestamp
          chainId
        }
      }
      erc20EqualSplitRecipients {
        items {
          id
          splitId
          recipient
          recipientIndex
        }
      }
      ${
        address
          ? `
      userStats(where: { address: "${address.toLowerCase()}" ${chainId ? `, chainId: ${chainId}` : ""} }) {
        items {
          id
          address
          chainId
          totalEthSent
          totalEthReceived
          totalErc20Sent
          totalErc20Received
          ethSplitCount
          ethReceivedCount
          erc20SplitCount
          erc20ReceivedCount
          lastActivityTimestamp
        }
      }
      `
          : ""
      }
      tokenStats${chainId ? `(where: { chainId: ${chainId} })` : ""} {
        items {
          id
          tokenAddress
          chainId
          totalVolume
          splitCount
          uniqueSenders
          uniqueRecipients
          lastActivityTimestamp
        }
      }
      globalStats${chainId ? `(where: { chainId: ${chainId} })` : ""} {
        items {
          id
          chainId
          totalEthVolume
          totalErc20Volume
          totalEthSplits
          totalErc20Splits
          totalUniqueSenders
          totalUniqueRecipients
          lastActivityTimestamp
        }
      }
    }
  `;

  const data = await request<GraphQLSplitterHistoryResponse>(
    process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
    query,
  );

  return data;
};

// Helper function to merge recipients with split data
const mergeSplitWithRecipients = (
  split: any,
  recipients: SplitRecipient[],
  type: SplitTransaction["type"],
  tokenData?: { address: string; symbol?: string; decimals?: number },
): SplitTransaction => {
  const transaction: SplitTransaction = {
    ...split,
    type,
    recipients: recipients.sort((a, b) => a.recipientIndex - b.recipientIndex),
  };

  if (tokenData) {
    transaction.tokenAddress = tokenData.address;
    transaction.tokenSymbol = tokenData.symbol;
    transaction.tokenDecimals = tokenData.decimals;
  }

  return transaction;
};

export const useSplitterHistory = (
  address = "0xeF899e80aA814ab8D8e232f9Ed6403A633C727ec",
  chainId?: number,
  limit?: number,
  offset?: number,
) => {
  const { address: connectedAddress } = useAccount();
  const queryAddress = address || connectedAddress;

  return useQuery<SplitterHistoryData>({
    queryKey: ["splitterHistory", queryAddress, chainId, limit, offset],
    queryFn: async (): Promise<SplitterHistoryData> => {
      try {
        const response = await fetchSplitterHistory(queryAddress, chainId, limit, offset);

        console.log(response);

        const transactions: SplitTransaction[] = [];

        // Process ETH splits
        if (response.ethSplits?.items) {
          const recipientsByTransaction = new Map<string, SplitRecipient[]>();

          response.ethSplitRecipients?.items.forEach(recipient => {
            if (!recipientsByTransaction.has(recipient.splitId)) {
              recipientsByTransaction.set(recipient.splitId, []);
            }
            recipientsByTransaction.get(recipient.splitId)?.push({
              recipient: recipient.recipient,
              amount: recipient.amount,
              recipientIndex: recipient.recipientIndex,
            });
          });

          response.ethSplits.items.forEach(split => {
            const recipients = recipientsByTransaction.get(split.id) || [];
            transactions.push(mergeSplitWithRecipients(split, recipients, "ethSplit"));
          });
        }

        // Process ETH equal splits
        if (response.ethEqualSplits?.items) {
          const recipientsByTransaction = new Map<string, SplitRecipient[]>();

          response.ethEqualSplitRecipients?.items.forEach(recipient => {
            if (!recipientsByTransaction.has(recipient.splitId)) {
              recipientsByTransaction.set(recipient.splitId, []);
            }

            const split = response.ethEqualSplits?.items.find(s => s.id === recipient.splitId);
            const amountPerRecipient = split?.amountPerRecipient || "0";

            recipientsByTransaction.get(recipient.splitId)?.push({
              recipient: recipient.recipient,
              amount: amountPerRecipient,
              recipientIndex: recipient.recipientIndex,
            });
          });

          response.ethEqualSplits.items.forEach(split => {
            const recipients = recipientsByTransaction.get(split.id) || [];
            const transaction = mergeSplitWithRecipients(split, recipients, "ethEqualSplit");
            transaction.amountPerRecipient = split.amountPerRecipient;
            transactions.push(transaction);
          });
        }

        // Process ERC20 splits
        if (response.erc20Splits?.items) {
          const recipientsByTransaction = new Map<string, SplitRecipient[]>();

          response.erc20SplitRecipients?.items.forEach(recipient => {
            if (!recipientsByTransaction.has(recipient.splitId)) {
              recipientsByTransaction.set(recipient.splitId, []);
            }
            recipientsByTransaction.get(recipient.splitId)?.push({
              recipient: recipient.recipient,
              amount: recipient.amount,
              recipientIndex: recipient.recipientIndex,
            });
          });

          response.erc20Splits.items.forEach(split => {
            const recipients = recipientsByTransaction.get(split.id) || [];
            transactions.push(mergeSplitWithRecipients(split, recipients, "erc20Split", { address: split.token }));
          });
        }

        // Process ERC20 equal splits
        if (response.erc20EqualSplits?.items) {
          const recipientsByTransaction = new Map<string, SplitRecipient[]>();

          response.erc20EqualSplitRecipients?.items.forEach(recipient => {
            if (!recipientsByTransaction.has(recipient.splitId)) {
              recipientsByTransaction.set(recipient.splitId, []);
            }

            const split = response.erc20EqualSplits?.items.find(s => s.id === recipient.splitId);
            const amountPerRecipient = split?.amountPerRecipient || "0";

            recipientsByTransaction.get(recipient.splitId)?.push({
              recipient: recipient.recipient,
              amount: amountPerRecipient,
              recipientIndex: recipient.recipientIndex,
            });
          });

          response.erc20EqualSplits.items.forEach(split => {
            const recipients = recipientsByTransaction.get(split.id) || [];
            const transaction = mergeSplitWithRecipients(split, recipients, "erc20EqualSplit", {
              address: split.token,
            });
            transaction.amountPerRecipient = split.amountPerRecipient;
            transactions.push(transaction);
          });
        }

        // Sort transactions by timestamp (most recent first)
        transactions.sort((a, b) => b.blockTimestamp - a.blockTimestamp);

        // Get user statistics
        const userStats = response.userStats?.items?.[0] || null;

        // Get token statistics
        const tokenStats = response.tokenStats?.items || [];

        // Get global statistics
        const globalStats = response.globalStats?.items?.[0] || null;

        return {
          transactions,
          userStats,
          tokenStats,
          globalStats,
          totalTransactionCount: transactions.length,
          isLoading: false,
          error: null,
        };
      } catch (error) {
        console.error("Error fetching splitter history:", error);
        return {
          transactions: [],
          userStats: null,
          tokenStats: [],
          globalStats: null,
          totalTransactionCount: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch splitter history",
        };
      }
    },
    enabled: true,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 3,
  });
};

// Additional hook for fetching user-specific statistics across all chains
export const useUserSplitterStats = (address?: string) => {
  const { address: connectedAddress } = useAccount();
  const queryAddress = address || connectedAddress;

  return useQuery<UserStatistics[]>({
    queryKey: ["userSplitterStats", queryAddress],
    queryFn: async (): Promise<UserStatistics[]> => {
      if (!queryAddress) return [];

      const query = gql`
        query GetUserStats($address: String!) {
          userStats(where: { address: $address }) {
            items {
              id
              address
              chainId
              totalEthSent
              totalEthReceived
              totalErc20Sent
              totalErc20Received
              ethSplitCount
              ethReceivedCount
              erc20SplitCount
              erc20ReceivedCount
              lastActivityTimestamp
            }
          }
        }
      `;

      const variables = {
        address: queryAddress.toLowerCase(),
      };

      const data = await request<{ userStats: { items: UserStatistics[] } }>(
        process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
        query,
        variables,
      );

      return data.userStats?.items || [];
    },
    enabled: !!queryAddress,
    staleTime: 30_000,
    retry: 3,
  });
};

// Hook for fetching global statistics
export const useGlobalSplitterStats = (chainId?: number) => {
  return useQuery<GlobalStatistics[]>({
    queryKey: ["globalSplitterStats", chainId],
    queryFn: async (): Promise<GlobalStatistics[]> => {
      const whereClause = chainId ? `(where: { chainId: ${chainId} })` : "";

      const query = gql`
        query GetGlobalStats {
          globalStats${whereClause} {
            items {
              id
              chainId
              totalEthVolume
              totalErc20Volume
              totalEthSplits
              totalErc20Splits
              totalUniqueSenders
              totalUniqueRecipients
              lastActivityTimestamp
            }
          }
        }
      `;

      const data = await request<{ globalStats: { items: GlobalStatistics[] } }>(
        process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
        query,
      );

      return data.globalStats?.items || [];
    },
    enabled: true,
    staleTime: 30_000,
    retry: 3,
  });
};
