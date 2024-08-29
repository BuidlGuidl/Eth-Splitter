export interface TokenType {
  chainId: string;
  name: string;
  contracts: { name: string; address: string }[];
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
      },
      {
        name: "DAI",
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      },
      {
        name: "ENS",
        address: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
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
      },
      {
        name: "DAI",
        address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
      },
      {
        name: "USDT",
        address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
      },
      {
        name: "OP",
        address: "0x4200000000000000000000000000000000000042",
      },
    ],
  },
  137: {
    chainId: "137",
    name: "polygon",
    contracts: [
      {
        name: "USDC",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      },
      {
        name: "DAI",
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      },
      {
        name: "USDT",
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
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
      },
      {
        name: "USDC",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      },
      {
        name: "DAI",
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      },
      {
        name: "USDT",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      },
    ],
  },
  8453: {
    chainId: "8453",
    name: "base",
    contracts: [
      {
        name: "BASE",
        address: "0xd07379a755a8f11b57610154861d694b2a0f615a",
      },
      {
        name: "USDC",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      },
      {
        name: "DAI",
        address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      },
      {
        name: "USDT",
        address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
      },
    ],
  },
};

export default tokens;
