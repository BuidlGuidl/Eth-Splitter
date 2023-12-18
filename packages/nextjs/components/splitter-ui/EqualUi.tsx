import React, { ChangeEvent, useEffect, useState } from "react";
import TokenData from "./splitter-components/TokenData";
import { parseEther } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const EqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const [amount, setamount] = useState("");
  const [wallets, setWallets] = useState<string[]>([]);

  const [totalAmount, setTotalAmount] = useState("");
  const [totalTokenAmount, setTotalTokenAmount] = useState("");
  const [totalEthAmount, setTotalEthAmount] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  async function getENSAddress(ensAdresses: string[]) {
    const client = createPublicClient({ chain: mainnet, transport: http() });
    const addresses = [];
    for (const name of ensAdresses) {
      try {
        setLoadingAddresses(true);
        const ensAddress = await client.getEnsAddress({
          name: name,
        });
        if (ensAddress !== null) {
          addresses.push({
            ensName: name,
            address: ensAddress,
          });
        }
      } catch (error) {
        console.error(`Error getting ENS address for ${name}`);
      } finally {
        setLoadingAddresses(false);
      }
    }
    return addresses;
  }

  async function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => {
      return (address.includes("0x") && address.length === 42) || address.includes(".eth");
    };

    let addresses: string[];

    if (value.includes(",")) {
      addresses = value
        .trim()
        .split(",")
        .map(str => str.replace(/\n/g, "").replace(/\s/g, ""));
    } else {
      addresses = value
        .trim()
        .split(/\s+/)
        .map(str => str.replace(/\s/g, ""));
    }
    const uniqueAddresses = [...new Set([...addresses])];
    const validadeAddresses = uniqueAddresses.filter(validateAddress);
    const ensAddresses = validadeAddresses.filter(address => address.includes(".eth"));
    if (ensAddresses.length > 0) {
      const ensResults = await getENSAddress(ensAddresses);

      ensResults.forEach(ensResult => {
        const index = validadeAddresses.findIndex(address => address === ensResult.ensName);
        validadeAddresses[index] = ensResult.address;
      });
    }
    setWallets(validadeAddresses);
  }

  const removeWalletField = (index: number) => {
    const newWallets = [...wallets];
    newWallets.splice(index, 1);
    setWallets(newWallets);
  };

  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      addMultipleAddress(inputValue);
    }, 500); // Adjust the delay as needed

    return () => {
      clearTimeout(timeoutId);
    };
  }, [inputValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const { writeAsync: splitEqualETH } = useScaffoldContractWrite({
    contractName: "ETHSplitter",
    functionName: "splitEqualETH",
    args: [wallets],
    value: totalEthAmount.toString() as `${number}`,
  });

  const { writeAsync: splitEqualERC20, isMining: splitErc20Loading } = useScaffoldContractWrite({
    contractName: "ETHSplitter",
    functionName: "splitEqualERC20",
    args: [tokenContract, wallets, BigInt(totalTokenAmount)],
  });

  useEffect(() => {
    let totalAmount: any = 0;
    for (let index = 0; index < wallets.length; index++) {
      if (wallets[index] === "" || amount === "") {
        return;
      }
      totalAmount += parseFloat(amount);
    }
    if (splitItem === "split-tokens") {
      totalAmount = parseEther(totalAmount.toFixed(18));
      setTotalTokenAmount(totalAmount);
    } else {
      totalAmount = totalAmount.toFixed(18);
      setTotalEthAmount(totalAmount);
    }
    setTotalAmount(totalAmount);
  }, [amount, wallets, splitItem]);

  return (
    <>
      {splitItem === "split-tokens" && (
        <TokenData
          splitErc20Loading={splitErc20Loading}
          account={account}
          splitterContract={splitterContract}
          setTokenContract={setTokenContract}
          tokenContract={tokenContract}
        />
      )}
      <div className="mx-auto my-14">
        <form className="md:w-[500px] w-[300px] lg:w-[800px] bg-new_secondary  rounded-3xl shadow-xl border-2 p-4 text-white">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold  ml-1 my-2 break-words">
              {splitItem === "split-eth" ? "ETH Amount Each" : "Token Amount Each"}
            </p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
            >
              <input
                type="number"
                value={amount}
                min={0}
                onChange={e => setamount(e.target.value)}
                className="input input-ghost focus:outline-none focus:bg-transparent focus:text-black  border w-full font-medium placeholder:text-accent/50 text-black"
              />
            </div>
          </div>
          <p className="font-semibold  ml-1 my-2 break-words">Addresses</p>
          <div className="flex justify-center">
            {loadingAddresses && <span className="loading loading-infinity loading-lg"></span>}
          </div>
          <div className="flex flex-col space-y-1 w-full my2 ">
            {wallets.map((wallet, index) => (
              <div className="flex px-2 py-2 justify-between" key={index}>
                <Address address={wallet} size="lg" />
                {index >= 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      removeWalletField(index);
                    }}
                  >
                    <TrashIcon className="h-5" />
                  </button>
                )}
              </div>
            ))}
            <p className="font-semibold  ml-1 my-2 break-words">Recipient Wallets</p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-xl text-accent w-full`}
            >
              <textarea
                placeholder="Seperate each address with a comma, space or new line"
                //value={wallets}
                onChange={handleInputChange}
                className="textarea rounded-none textarea-ghost focus:outline-none focus:bg-transparent focus:text-black  min-h-[11.2rem] border w-full font-medium placeholder:text-accent text-black"
              />
            </div>
          </div>
          <p className="ml-2 -mt-1">valid unique addresses: {wallets.length}</p>
          <div className="my-[10px] w-full space-y-4">
            <button
              type="button"
              disabled={wallets.length <= 1 || totalAmount === "0"}
              onClick={async () => {
                splitItem === "split-eth" ? await splitEqualETH() : await splitEqualERC20();
              }}
              className={`btn bg-new_tertiary w-full text-white capitalize text-lg `}
            >
              {splitItem === "split-eth" ? "Split  ETH" : "Split Tokens"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EqualUi;
