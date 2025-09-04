import { createConfig } from "ponder";
import { http } from "viem";
import deployedContracts from "../nextjs/contracts/deployedContracts";
import scaffoldConfig from "../nextjs/scaffold.config";

const targetNetworks = scaffoldConfig.targetNetworks;

const networksWithContracts = targetNetworks.filter(
  (network) => deployedContracts[network.id]?.ETHSplitter
);

const networks = Object.fromEntries(
  networksWithContracts.map((network) => [
    network.name,
    {
      chainId: network.id,
      transport: http(process.env[`PONDER_RPC_URL_${network.id}`]),
    },
  ])
);

const contractNetworks = networksWithContracts.reduce((acc, network) => {
  const networkContracts = deployedContracts[network.id];

  if (networkContracts?.ETHSplitter) {
    acc[network.name] = {
      address: networkContracts.ETHSplitter.address,
      startBlock: networkContracts.ETHSplitter.deployedOnBlock || 0,
    };
  }

  return acc;
}, {} as Record<string, { address: `0x${string}`; startBlock: number }>);

const ethSplitterAbi =
  networksWithContracts.length > 0
    ? deployedContracts[networksWithContracts[0]?.id]?.ETHSplitter?.abi
    : undefined;

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  },
  networks,
  contracts: {
    ETHSplitter: {
      abi: ethSplitterAbi,
      network: contractNetworks,
    },
  },
});
