export interface TokenType {
  chainId: string;
  name: string;
  contracts: { name: string; address: string; decimals: number }[];
}

export interface TokensType {
  [key: number]: TokenType;
}

export const tokens: TokensType = {
  1: {
    chainId: "1",
    name: "mainnet",
    contracts: [
      {
        name: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
      },
      {
        name: "USDT",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        decimals: 18,
      },
      {
        name: "ENS",
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
        decimals: 18,
      },
    ],
  },
  10: {
    chainId: "10",
    name: "optimism",
    contracts: [
      {
        name: "USDC",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
        decimals: 6,
      },
      {
        name: "OP",
        address: "0x4200000000000000000000000000000000000042",
        decimals: 18,
      },
    ],
  },
  43114: {
    chainId: "43114",
    name: "avalanche",
    contracts: [
      {
        name: "AVAX",
        address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        decimals: 18,
      },
      {
        name: "USDC",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        decimals: 6,
      },
    ],
  },
  42161: {
    chainId: "42161",
    name: "arbitrum",
    contracts: [
      {
        name: "ARB",
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        decimals: 18,
      },
      {
        name: "USDC",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
        decimals: 6,
      },
    ],
  },
  84531: {
    chainId: "84531",
    name: "base-goerli",
    contracts: [
      {
        name: "USDC",
        address: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        decimals: 6,
      },
    ],
  },
  8453: {
    chainId: "8453",
    name: "base",
    contracts: [
      {
        name: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        decimals: 6,
      },
    ],
  },
  11155111: {
    chainId: "11155111",
    name: "sepolia",
    contracts: [
      {
        name: "USDC",
        address: "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
        decimals: 6,
      },
      {
        name: "DAI",
        address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
        decimals: 18,
      },
      {
        name: "USDT",
        address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
        decimals: 6,
      },
    ],
  },
};

export default tokens;
