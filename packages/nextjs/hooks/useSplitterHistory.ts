import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";

export type SplitEventBase = {
  id: string;
  transactionHash: string;
  sender: string;
  recipients: string[];
  recipientCount: number;
  blockNumber: number;
  blockTimestamp: number;
  chainId: number;
};

export type EthSplit = SplitEventBase & {
  totalAmount: string;
  amounts: string[];
};

export type EthEqualSplit = SplitEventBase & {
  totalAmount: string;
  amountPerRecipient: string;
};

export type Erc20Split = SplitEventBase & {
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalAmount: string;
  amounts: string[];
};

export type Erc20EqualSplit = SplitEventBase & {
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalAmount: string;
  amountPerRecipient: string;
};

export type SplitHistoryItem = EthSplit | EthEqualSplit | Erc20Split | Erc20EqualSplit;

type GraphQLSplitterHistoryResponse = {
  ethSplits: { items: EthSplit[] };
  ethEqualSplits: { items: EthEqualSplit[] };
  erc20Splits: { items: Erc20Split[] };
  erc20EqualSplits: { items: Erc20EqualSplit[] };
};

const fetchSplitterHistory = async (address: string) => {
  const query = gql`
    query GetSplitterHistory($address: String!) {
      ethSplits(where: { sender: $address }) {
        items {
          id
          transactionHash
          sender
          totalAmount
          amounts
          recipients
          recipientCount
          blockNumber
          blockTimestamp
          chainId
        }
      }
      ethEqualSplits(where: { sender: $address }) {
        items {
          id
          transactionHash
          sender
          totalAmount
          recipients
          recipientCount
          amountPerRecipient
          blockNumber
          blockTimestamp
          chainId
        }
      }
      erc20Splits(where: { sender: $address }) {
        items {
          id
          transactionHash
          sender
          token
          tokenSymbol
          tokenDecimals
          totalAmount
          amounts
          recipients
          recipientCount
          blockNumber
          blockTimestamp
          chainId
        }
      }
      erc20EqualSplits(where: { sender: $address }) {
        items {
          id
          transactionHash
          sender
          token
          tokenSymbol
          tokenDecimals
          totalAmount
          recipients
          recipientCount
          amountPerRecipient
          blockNumber
          blockTimestamp
          chainId
        }
      }
    }
  `;

  const variables = {
    address: address.toLowerCase(),
  };

  const data = await request<GraphQLSplitterHistoryResponse>(
    process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069",
    query,
    variables,
  );

  return data;
};

export const useSplitterHistory = () => {
  //   const { address } = useAccount();
  const address = "0xa8DF02c5607100Eb108B5C39dCdD8c2aE44185Df";

  return useQuery<SplitHistoryItem[]>({
    queryKey: ["splitterHistory", address],
    queryFn: async (): Promise<SplitHistoryItem[]> => {
      const response = await fetchSplitterHistory(address || "");

      return [
        ...response.ethSplits.items,
        ...response.ethEqualSplits.items,
        ...response.erc20Splits.items,
        ...response.erc20EqualSplits.items,
      ].sort((a, b) => b.blockNumber - a.blockNumber);
    },
    enabled: true,
    staleTime: 30_000,
    retry: 3,
  });
};
