import { createConfig } from "ponder";
import { http } from "viem";
import deployedContracts from "../nextjs/contracts/deployedContracts";
import scaffoldConfig from "../nextjs/scaffold.config";

const targetNetworks = scaffoldConfig.targetNetworks;

const networks = Object.fromEntries(
  targetNetworks.map((network) => [
    network.name,
    {
      chainId: network.id,
      transport: http(process.env[`PONDER_RPC_URL_${network.id}`]),
    },
  ])
);

const contractNames = Array.from(
  new Set(
    targetNetworks.flatMap((network) =>
      Object.keys(deployedContracts[network.id] || {})
    )
  )
);

const contracts = Object.fromEntries(
  contractNames.map((contractName) => {
    const contractNetworks = targetNetworks.reduce((acc, network) => {
      const networkContracts = deployedContracts[network.id];

      if (networkContracts?.[contractName]) {
        acc[network.name] = {
          address: networkContracts[contractName].address,
          startBlock: networkContracts[contractName].deployedOnBlock || 0,
        };
      }

      return acc;
    }, {} as Record<string, { address: `0x${string}`; startBlock: number }>);

    const contractAbi = targetNetworks
      .map((network) => deployedContracts[network.id]?.[contractName]?.abi)
      .find((abi) => abi !== undefined);

    return [
      contractName,
      {
        abi: contractAbi,
        network: contractNetworks,
      },
    ];
  })
);

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  networks,
  contracts,
});
