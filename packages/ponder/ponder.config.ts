import { createConfig, factory } from "ponder";
import { ETHSplitterAbi } from "./abis/ETHSplitter";
import { http } from "viem";

import { chainConfigs } from "./src/config/chains";

const providerKey =
  process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const chainsWithApiKey = Object.fromEntries(
  Object.entries(chainConfigs.chains).map(([chainName, chainConfig]) => {
    const updatedRpc = chainConfig.transport.includes("g.alchemy.com")
      ? chainConfig.transport + providerKey
      : chainConfig.transport;

    return [
      chainName,
      {
        ...chainConfig,
        transport: http(updatedRpc),
      },
    ];
  })
);

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  networks: chainsWithApiKey,
  contracts: {
    ETHSplitter: {
      abi: ETHSplitterAbi,
      address: factory({
        address: Object.values(chainConfigs.ethSplitterContracts).map(
          (config) => config.address
        ),
        event: "EthSplit",
        parameter: "splitter",
      }),
      network: Object.keys(chainConfigs.ethSplitterContracts).reduce(
        (acc, chainName) => {
          const { startBlock } =
            chainConfigs.ethSplitterContracts[
              chainName as keyof typeof chainConfigs.ethSplitterContracts
            ];
          acc[chainName] = { startBlock };
          return acc;
        },
        {} as Record<string, { startBlock: number }>
      ),
    },
  },
});
