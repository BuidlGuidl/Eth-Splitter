import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Contacts from "./splitter-components/Contacts";
import ExportList from "./splitter-components/ExportList";
import TokenData from "./splitter-components/TokenData";
import { decompressFromEncodedURIComponent } from "lz-string";
import { createPublicClient, http, isAddress, parseEther } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Address, EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";
import { saveContacts } from "~~/utils/ethSplitter";

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

  const resolveEns = async (name: string) => {
    try {
      const ensAddress = await publicClient.getEnsAddress({
        name: normalize(name),
      });
      return String(ensAddress);
    } catch (error) {
      return "null";
    }
  };

  const getEnsName = async (address: string) => {
    const ensName = await publicClient.getEnsName({
      address: normalize(address),
    });
    return String(ensName);
  };

  async function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => isAddress(address);

    const cleanAddress = (str: string) => str.replace(/\n|\s/g, "");

    const splitAddresses = (value: string) =>
      value.trim().includes(",") ? value.split(",").map(cleanAddress) : value.split(/\s+/).map(cleanAddress);

    const addresses = splitAddresses(value).filter(
      address => !wallets.includes(address) && !walletsFilter.includes(address),
    );
    const resolvedAddresses: string[] = [];

    setInvalidAddresses([]);

    const isLoading =
      addresses[addresses.length - 1]?.endsWith(".eth") || addresses[addresses.length - 1]?.startsWith("0x");
    if (isLoading && addresses[addresses.length - 1] !== wallets[wallets.length - 1]) {
      setLoadingAddresses(true);
    }

    await Promise.all(
      addresses.map(async address => {
        if (address.endsWith(".eth")) {
          const resolvedAddress = await resolveEns(address);
          if (resolvedAddress === "null") {
            setInvalidAddresses(prevState => [...new Set([...prevState, address])]);
          } else {
            setWalletsFilter(prevState => [...new Set([...prevState, address])]);
          }
          resolvedAddresses.push(resolvedAddress);
        } else {
          resolvedAddresses.push(address);
        }

        if (address.startsWith("0x") && !validateAddress(address)) {
          setInvalidAddresses(prevState => [...new Set([...prevState, address])]);
        }
      }),
    );

    const uniqueAddresses = [...new Set(resolvedAddresses.filter(validateAddress))];

    setWallets(prevState => [...new Set([...prevState, ...uniqueAddresses])]);
    setLoadingAddresses(false);
  }

  const removeWalletField = async (index: number) => {
    setLoadingAddresses(true);
    const ensName = await getEnsName(wallets[index]);
    const newWallets = [...wallets];
    const newFilter = walletsFilter.filter(
      wallet => wallet !== wallets[index] && wallet.toLowerCase() !== ensName.toLowerCase(),
    );

    newWallets.splice(index, 1);

    setWallets(newWallets);
    setWalletsFilter(newFilter);
    setLoadingAddresses(false);
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
    const { wallets, amount, tokenAddress, walletsUri } = query;
    if (wallets) {
      if (typeof wallets == "string") {
        setWallets(wallets.split(","));
      } else {
        setWallets(wallets as string[]);
      }
    }
    if (amount) {
      setAmount(amount as string);
    }
    if (tokenAddress) {
      setTokenContract(tokenAddress as string);
    }
    if (walletsUri) {
      const wallets = JSON.parse(decompressFromEncodedURIComponent(walletsUri as string));
      setWallets(wallets);
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
      <div className=" my-14 w-full">
        <form className="md:w-[500px] w-[95%] mx-auto lg:w-[700px] rounded-3xl shadow-xl border p-4">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold  ml-1 my-2 break-words">
              {splitItem === "split-eth" ? "ETH Amount Each" : "Token Amount Each"}
            </p>
            <div>
              {splitItem === "split-tokens" ? (
                <input
                  type="number"
                  ref={inputRef}
                  value={amount}
                  min={0}
                  onChange={e => setAmount(e.target.value)}
                  className="input  input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400  border-2 border-base-300 w-full font-medium placeholder:text-accent/50 text-gray-400"
                />
              ) : (
                <EtherInput value={amount} onChange={value => setAmount(value)} />
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-1 w-full my2 ">
            <div className="flex justify-between items-center">
              <p className="font-semibold  ml-1 my-2 break-words">Recipient Wallets</p>
              <Contacts setWallets={setWallets} wallets={wallets} />
            </div>
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
              <ExportList wallets={wallets} splitType="equal-splits" />
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
                saveContacts(wallets);
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
