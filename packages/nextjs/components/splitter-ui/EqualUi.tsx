import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useReducer } from "react";
import TokenData from "./splitter-components/TokenData";
import { useDebounce } from "usehooks-ts";
import { parseEther } from "viem";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const EqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const [amount, setamount] = useState("");

  const [totalAmount, setTotalAmount] = useState("");
  const [totalTokenAmount, setTotalTokenAmount] = useState("");
  const [totalEthAmount, setTotalEthAmount] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce<string>(value, 500);

  const walletsReducer = (state: string[], action: any) => {
    switch (action.type) {
      case "addWallets":
        if (state.length > 0 && action.payload > 0) {
          const uniqueAddress = action.payload.filter((address: string) => !state.includes(address));
          setValue("");
          return [...state, ...uniqueAddress];
        } else {
          setValue("");
          return [...action.payload];
        }

      case "removeWallets":
        const newWallets = [...state];
        newWallets.splice(action.payload, 1);
        return newWallets;
      default:
        return state;
    }
  };

  const [wallets, dispatch] = useReducer(walletsReducer, []);

  function formatedAddresses(value: string): string[] {
    const separator = value.includes(",") ? "," : /\s+/;
    return value
      .trim()
      .split(separator)
      .map(str => str.replace(/\n/g, "").replace(/\s/g, ""));
  }

  function validateAddresses(address: string): boolean {
    return (address.startsWith("0x") && address.length === 42) || address.endsWith(".eth");
  }

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

  async function addMultipleAddress(inputValue: string) {
    const addresses: string[] = formatedAddresses(inputValue);

    const uniqueAddresses = [...new Set([...addresses])];
    const uniqueValidadeAddresses = uniqueAddresses.filter(validateAddresses);
    const hasENS = uniqueValidadeAddresses.some(address => address.endsWith(".eth"));
    const onlyENS = uniqueValidadeAddresses.filter(address => address.endsWith(".eth"));

    if (uniqueValidadeAddresses.length == 0) {
      return;
    }

    if (hasENS) {
      const ensResults = await getENSAddress(onlyENS);
      ensResults.forEach(ensResult => {
        const index = uniqueValidadeAddresses.findIndex(address => address === ensResult.ensName);
        uniqueValidadeAddresses[index] = ensResult.address;
      });
      dispatch({ type: "addWallets", payload: uniqueValidadeAddresses });
    }
    dispatch({ type: "addWallets", payload: uniqueValidadeAddresses });
  }

  const removeWalletField = (index: number) => {
    dispatch({ type: "removeWallets", payload: index });
    console.log(wallets);
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

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const addMultipleAddressRef = useRef<(inputValue: string) => void>(addMultipleAddress);

  useEffect(() => {
    addMultipleAddressRef.current(debouncedValue);
  }, [debouncedValue]);

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
                value={value}
                onChange={handleChange}
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
