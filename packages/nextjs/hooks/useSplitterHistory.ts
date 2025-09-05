import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { useAccount } from "wagmi";

export type SplitType = "ETH_SPLIT" | "ETH_EQUAL_SPLIT" | "ERC20_SPLIT" | "ERC20_EQUAL_SPLIT";

export type SplitEventBase = {
  id: string;
  type: SplitType;
  transactionHash: string;
  sender: string;
  totalAmount: string;
  recipients: string[];
  recipientCount: number;
  blockNumber: number;
  blockTimestamp: number;
  chainId: number;
};

export type EthSplit = SplitEventBase & {
  type: "ETH_SPLIT";
  amounts: string[];
  amountPerRecipient: null;
  token: null;
  tokenSymbol: null;
  tokenDecimals: null;
};

export type EthEqualSplit = SplitEventBase & {
  type: "ETH_EQUAL_SPLIT";
  amounts: null;
  amountPerRecipient: string;
  token: null;
  tokenSymbol: null;
  tokenDecimals: null;
};

export type Erc20Split = SplitEventBase & {
  type: "ERC20_SPLIT";
  amounts: string[];
  amountPerRecipient: null;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
};

export type Erc20EqualSplit = SplitEventBase & {
  type: "ERC20_EQUAL_SPLIT";
  amounts: null;
  amountPerRecipient: string;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
};

export type SplitHistoryItem = EthSplit | EthEqualSplit | Erc20Split | Erc20EqualSplit;

type GraphQLSplitResponse = {
  splits: {
    items: Array<{
      id: string;
      type: SplitType;
      transactionHash: string;
      sender: string;
      totalAmount: string;
      recipients: string[];
      recipientCount: number;
      amounts: string[] | null;
      amountPerRecipient: string | null;
      token: string | null;
      tokenSymbol: string | null;
      tokenDecimals: number | null;
      blockNumber: number;
      blockTimestamp: number;
      chainId: number;
    }>;
  };
};

const fetchSplitterHistory = async (address: string) => {
  const query = gql`
    query GetSplitterHistory($address: String!) {
      splits(where: { sender: $address }, orderBy: "blockNumber", orderDirection: "desc") {
        items {
          id
          type
          transactionHash
          sender
          totalAmount
          recipients
          recipientCount
          amounts
          amountPerRecipient
          token
          tokenSymbol
          tokenDecimals
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

  const data = await request<GraphQLSplitResponse>(
    process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069/",
    query,
    variables,
  );

  return data;
};

export const useSplitterHistory = () => {
  const { address } = useAccount();

  return useQuery<SplitHistoryItem[]>({
    queryKey: ["splitterHistory", address],
    queryFn: async (): Promise<SplitHistoryItem[]> => {
      if (!address) return [];

      const response = await fetchSplitterHistory(address);

      return response.splits.items as SplitHistoryItem[];
    },
    enabled: !!address,
    staleTime: 30_000,
    retry: 3,
  });
};
