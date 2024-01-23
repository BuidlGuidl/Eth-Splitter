import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import ExportList from "./splitter-components/ExportList";
import TokenData from "./splitter-components/TokenData";
import { createPublicClient, http, isAddress, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const EqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const router = useRouter();
  const query = router.query;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [amount, setAmount] = useState("");
  const [wallets, setWallets] = useState<string[]>([]);
  const [walletsFilter, setWalletsFilter] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [totalTokenAmount, setTotalTokenAmount] = useState("");
  const [totalEthAmount, setTotalEthAmount] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [invalidAddresses, setInvalidAddresses] = useState<string[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  async function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => isAddress(address);
    const resolveEns = async (address: string) => {
      const ensAddress = await publicClient.getEnsAddress({
        name: normalize(address),
      });
      return String(ensAddress);
    };

    let addresses: string[];
    if (value.includes(",")) {
      addresses = value
        .trim()
        .split(",")
        .map(str => str.replace(/\n/g, "").replace(/\s/g, ""))
        .filter(address => !wallets.includes(address));
      addresses = addresses.filter(address => !walletsFilter.includes(address));
    } else {
      addresses = value
        .trim()
        .split(/\s+/)
        .map(str => str.replace(/\s/g, ""))
        .filter(address => !wallets.includes(address));
      addresses = addresses.filter(address => !walletsFilter.includes(address));
    }

    const resolvedAddresses: string[] = [];
    setInvalidAddresses([]);

    if (
      (addresses[addresses.length - 1]?.endsWith(".eth") || addresses[addresses.length - 1]?.startsWith("0x")) &&
      addresses[addresses.length - 1] !== wallets[wallets.length - 1]
    ) {
      setLoadingAddresses(true);
    }

    await Promise.all(
      addresses.map(async address => {
        if (address.endsWith(".eth")) {
          const resolvedAddress = await resolveEns(address);
          if (resolvedAddress === "null") {
            setInvalidAddresses(prevState => {
              const newAddresses = [...new Set([...prevState, address])];
              return newAddresses;
            });
          } else {
            setWalletsFilter(prevState => {
              const newAddresses = [...new Set([...prevState, address])];
              return newAddresses;
            });
          }
          resolvedAddresses.push(resolvedAddress);
        } else {
          resolvedAddresses.push(address);
        }
        if (address.startsWith("0x")) {
          if (validateAddress(address) === false) {
            setInvalidAddresses(prevState => {
              const newAddresses = [...new Set([...prevState, address])];
              return newAddresses;
            });
          } else {
            setWalletsFilter(prevState => {
              const newAddresses = [...new Set([...prevState, address])];
              return newAddresses;
            });
          }
        }
      }),
    );
    let uniqueAddresses = [...new Set([...resolvedAddresses])];

    uniqueAddresses = uniqueAddresses.filter(validateAddress);

    setWallets(prevState => {
      const newAddresses = [...new Set([...prevState, ...uniqueAddresses])];
      return newAddresses;
    });
    setLoadingAddresses(false);
  }

  const removeWalletField = (index: number) => {
    const newWallets = [...wallets];
    newWallets.splice(index, 1);
    setWallets(newWallets);
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

  useEffect(() => {
    const { wallets, amount, tokenAddress } = query;
    if (wallets) {
      setWallets(wallets as string[]);
    }
    if (amount) {
      setAmount(amount as string);
    }
    if (tokenAddress) {
      setTokenContract(tokenAddress as string);
    }
    if (Object.keys(query).length > 0) {
      router.replace({
        pathname: router.pathname,
        query: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (inputRef.current && splitItem == "split-eth") {
      inputRef.current.focus();
    }
  }, [splitItem]);

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
        <form className="md:w-[500px] w-[300px] lg:w-[700px]  rounded-3xl shadow-xl border-2 p-4">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold  ml-1 my-2 break-words">
              {splitItem === "split-eth" ? "ETH Amount Each" : "Token Amount Each"}
            </p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
            >
              <input
                type="number"
                ref={inputRef}
                value={amount}
                min={0}
                onChange={e => setAmount(e.target.value)}
                className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400  border w-full font-medium placeholder:text-accent/50 text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1 w-full my2 ">
            <p className="font-semibold  ml-1 my-2 break-words">Recipient Wallets</p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-xl text-accent w-full`}
            >
              <textarea
                placeholder="Seperate each address with a comma, space or new line"
                onChange={e => addMultipleAddress(e.target.value)}
                className="textarea rounded-none textarea-ghost focus:outline-none focus:bg-transparent focus:text-gray-400  min-h-[8rem] border w-full font-medium placeholder:text-accent text-gray-400 md:focus:text-lg md:text-lg"
              />
            </div>
          </div>
          {wallets.length > 0 && (
            <div>
              <p className="font-semibold  ml-1 my-2 break-words">Valid Addresses: {wallets.length}</p>{" "}
              <div className="flex justify-center">
                {loadingAddresses && <span className="loading loading-infinity loading-lg"></span>}
              </div>
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
              <ExportList wallets={wallets} />
            </div>
          )}
          {invalidAddresses.length > 0 && (
            <div className="my-3 px-1 ">
              <h1 className="font-semibold text-red-700">Invalid Addresses/Ens: {invalidAddresses.length}</h1>
              {invalidAddresses.map((address, index) => (
                <div key={index} className="px-2 mt-1">
                  {index + 1}. {address}
                </div>
              ))}
            </div>
          )}
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
