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
};

export default tokens;
