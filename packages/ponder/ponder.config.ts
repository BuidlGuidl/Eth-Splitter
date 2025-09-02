import { createConfig } from "ponder";
import { http } from "viem";
import { ETHSplitterAbi } from "./abis/ETHSplitter";

import { chainConfigs } from "./src/config/chains";

const alchemyApiKey =
  process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const networks = Object.entries(chainConfigs.chains).reduce(
  (acc, [chainName, chainConfig]) => {
    let rpcUrl = chainConfig.transport;
    if (rpcUrl.includes("g.alchemy.com")) {
      rpcUrl = `${rpcUrl}${alchemyApiKey}`;
    }

    acc[chainName] = {
      chainId: chainConfig.chainId,
      transport: http(rpcUrl),
    };
    return acc;
  },
  {} as Record<string, { chainId: number; transport: ReturnType<typeof http> }>
);

const contractNetworks = Object.entries(
  chainConfigs.ethSplitterContracts
).reduce((acc, [chainName, contractConfig]) => {
  acc[chainName] = {
    address: contractConfig.address,
    startBlock: contractConfig.startBlock,
  };
  return acc;
}, {} as Record<string, { address: `0x${string}`; startBlock: number }>);

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },

  networks,

  contracts: {
    ETHSplitter: {
      abi: ETHSplitterAbi,
      network: contractNetworks,
    },
  },
});
