# ETHSplitter

![Screenshot_658](https://github.com/Avelous/Eth-Splitter/assets/86206128/38ab22cf-5ad4-475d-bf74-1df80affc81a)

[ethsplitter.vercel.app](https://ethsplitter.vercel.app/)

<br></br>
ETHSplitter is a
smart contract and a NextJs App built with
[Scaffold ETH](https://github.com/scaffold-eth/scaffold-eth-2) to split Ethereum
(ETH) or ERC20 tokens between multiple recipients. It provides functionality to
distribute ETH or ERC20 tokens according to specified amounts or equally among
recipients.

**Disclaimer:** This contract is a prototype and intended for research and
development purposes only. Use it at your own discretion.

## Content

- [Quickstart](#quickstart)
- [Features](#features)
- [Usage](#usage)
- [Functions](#functions)
  - [`splitETH`](#spliteth)
  - [`splitEqualETH`](#splitequaleth)
  - [`splitERC20`](#spliterc20)
  - [`splitEqualERC20`](#splitequalerc20)
  - [`withdraw`](#withdraw)
- [Events](#events)
- [Modifiers](#modifiers)
- [Frontend](#frontend)
- [Contributing](#contributing)

## Quickstart

To get started with ETH Splitter, follow the steps below:

Clone this repo & install dependencies

```
git clone https://github.com/Avelous/Eth-Splitter.git
cd ETH-Splitter
yarn install
```

Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on
your local machine and can be used for testing and development. You can
customize the network configuration in hardhat.config.ts.

On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is
located in packages/hardhat/contracts and can be modified to suit your needs.
The yarn deploy command uses the deploy script located in
packages/hardhat/deploy to deploy the contract to the network. You can also
customize the deploy script.

On a third terminal, start your NextJS app:

```
yarn start
```

## Features

- Split ETH among multiple recipients based on specified amounts.
- Split ETH equally among multiple recipients.
- Split ERC20 tokens among multiple recipients based on specified amounts.
- Split ERC20 tokens equally among multiple recipients.
- Withdraw remaining ETH or ERC20 tokens to the contract owner.

## Usage

1. Deploy the ETHSplitter contract.
2. Call the appropriate function to split ETH or ERC20 tokens among recipients.
3. Recipients will receive their allocated amounts.
4. The contract owner can withdraw any remaining ETH or ERC20 tokens.

## Functions

### `splitETH`

```solidity
function splitETH(address payable[] calldata recipients, uint256[] calldata amounts) external payable nonReentrant
```

This function splits the provided ETH among the given recipients according to
the specified amounts.

- `recipients`: An array of payable addresses representing the recipients of the
  ETH.
- `amounts`: An array of uint256 values specifying the amounts each recipient
  shall receive.

### `splitEqualETH`

```solidity
function splitEqualETH(address payable[] calldata recipients) external payable nonReentrant
```

This function splits the provided ETH equally among the given recipients.

- `recipients`: An array of payable addresses representing the recipients of the
  ETH.

### `splitERC20`

```solidity
function splitERC20(IERC20 token, address[] calldata recipients, uint256[] calldata amounts) external nonReentrant
```

This function splits the provided ERC20 tokens among the given recipients
according to the specified amounts.

- `token`: The ERC20 token contract address.
- `recipients`: An array of addresses representing the recipients of the ERC20
  tokens.
- `amounts`: An array of uint256 values specifying the amounts each recipient
  shall receive.

### `splitEqualERC20`

```solidity
function splitEqualERC20(IERC20 token, address[] calldata recipients, uint256 totalAmount) external nonReentrant
```

This function splits the provided ERC20 tokens equally among the given
recipients.

- `token`: The ERC20 token contract address.
- `recipients`: An array of addresses representing the recipients of the ERC20
  tokens.
- `totalAmount`: The total amount of ERC20 tokens to be distributed equally.

### `withdraw`

```solidity
function withdraw(IERC20 token) external onlyOwner
```

This function allows the contract owner to withdraw any remaining ETH or ERC20
tokens from the contract.

## Events

The contract emits the following events:

- `EthSplit`: Indicates the successful splitting of ETH among recipients.
- `EthSplitEqual`: Indicates the successful equal splitting of ETH among
  recipients.
- `Erc20Split`: Indicates the successful splitting of ERC20 tokens among
  recipients.
- `Erc20SplitEqual`: Indicates the successful equal splitting of ERC20 tokens
  among recipients.

## Modifiers

- `onlyOwner`: Ensures that only the contract owner can perform certain actions.

## Frontend

The frontend of the ETHSplitter contract is built using Next.js, providing a
user interface to interact with the smart contract. It offers options to split
ETH and ERC20 tokens equally or unequally among recipients. The frontend is
bulit as a safe app to work with multisigs.

### Features

- Split ETH among recipients:
  - Specify individual amounts for each recipient.
  - Split ETH equally among recipients.
- Split ERC20 tokens among recipients:
  - Specify individual amounts for each recipient.
  - Split ERC20 tokens equally among recipients.

### Usage

1. Connect your Ethereum wallet to the application.
2. Select the desired operation:
   - **Split ETH**: Splitting Ether (ETH) among recipients.
   - **Split TOKEN**: Splitting ERC20 tokens among recipients.
3. Choose the split type:
   - **Unequal**: Specify individual amounts for each recipient.
   - **Equal**: Split the amount equally among recipients.
4. Provide the required inputs:
   - **Recipients**: Enter the addresses of the recipients, separated by commas.
   - **Amounts**: Enter the corresponding amounts to be split among the
     recipients, separated by commas.
   - **Token Address (for ERC20)**: Enter the contract address of the ERC20
     token (if applicable).
5. Click the "Split" button to execute the transaction.
6. Confirm the transaction using your connected wallet.

### Contributing

If you would like to contribute to the development of the ETHSplitter frontend,
please follow these steps:

1. Fork the repository and create a new branch for your feature or bug fix.
2. Make the necessary changes and ensure the code follows the project's style
   guidelines.
3. Write tests for any new functionality.
4. Commit your changes and push them to your forked repository.
5. Submit a pull request, describing your changes in detail and referencing any
   relevant issues.

Built with [Scaffold ETH](https://github.com/scaffold-eth/scaffold-eth-2)
