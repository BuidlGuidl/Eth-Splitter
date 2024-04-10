import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AddressInput } from "../scaffold-eth";
import { EtherInput } from "../scaffold-eth";
import Contacts from "./splitter-components/Contacts";
import ExportList from "./splitter-components/ExportList";
import TokenData from "./splitter-components/TokenData";
import { decompressFromEncodedURIComponent } from "lz-string";
import { isAddress, parseUnits } from "viem";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";
import { loadCache, saveContacts, updateCacheAmounts, updateCacheWallets } from "~~/utils/ethSplitter";

const UnEqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const router = useRouter();
  const query = router.query;

  const [wallets, setWallets] = useState<string[]>([""]);
  const [amounts, setAmounts] = useState<string[]>([""]);
  const [amountsInWei, setAmountsInWei] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [usdGenMode, setUSDGenMode] = useState(false);

  function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => address.includes("0x") && address.length === 42;

    const addresses: string[] = value
      .trim()
      .split(",")
      .map(str => str.replace(/\n/g, "").replace(/\s/g, ""));

    let uniqueAddresses = [...new Set([...addresses])];
    uniqueAddresses = [...new Set([...wallets.filter(validateAddress), ...uniqueAddresses])];
    setWallets(uniqueAddresses);
  }

  const addWalletField = () => {
    const newWallets = [...wallets, ""];
    setWallets(newWallets);
    const newAmounts = [...amounts, ""];
    setAmounts(newAmounts);
  };

  const removeWalletField = (index: number) => {
    const newWallets = [...wallets];
    newWallets.splice(index, 1);
    setWallets(newWallets);

    const newAmounts = [...amounts];
    newAmounts.splice(index, 1);
    setAmounts(newAmounts);
  };

  const updateWallet = (value: string, index: number) => {
    if (value.length <= 42) {
      const newWallets = [...wallets];
      if (newWallets.length > 1 && newWallets.includes(value)) {
        return;
      } else {
        newWallets[index] = value;
        setWallets(newWallets);
      }
      setWallets(newWallets);
    }

    if (value.length > 42) {
      addMultipleAddress(value);
    }
  };

  const updateAmounts = async (value: string, index: number) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  const { writeAsync: splitETH } = useScaffoldContractWrite({
    contractName: "ETHSplitter",
    functionName: "splitETH",
    args: [wallets, amountsInWei],
    value: totalAmount as `${number}`,
  });

  const { writeAsync: splitERC20, isMining: splitErc20Loading } = useScaffoldContractWrite({
    contractName: "ETHSplitter",
    functionName: "splitERC20",
    args: [tokenContract, wallets, amountsInWei],
  });

  useEffect(() => {
    const cache = loadCache();
    if (cache) {
      if (cache.wallets.length > 0) {
        setWallets(cache.wallets);
      }
      if (cache.amounts.length > 0) {
        setAmounts(cache.amounts);
      }
    }
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && !wallets.includes("")) {
      updateCacheWallets(wallets);
    }
  }, [wallets]);

  useEffect(() => {
    if (amounts.length > 0 && !amounts.includes("")) {
      updateCacheAmounts(amounts);
    }
  }, [amounts]);

  useEffect(() => {
    let totalETH = 0;
    const newAmountsInWei = [];
    for (let index = 0; index < amounts.length; index++) {
      if (amounts[index] === "") {
        return;
      }
      totalETH += parseFloat(amounts[index]);
      newAmountsInWei.push(parseUnits(amounts[index].toString(), 18));
    }
    setAmountsInWei(newAmountsInWei);
    setTotalAmount(totalETH.toString());
  }, [amounts]);

  useEffect(() => {
    for (let index = 0; index < amounts.length; index++) {
      if (wallets[index] === "" || amounts[index] === "") {
        return;
      }
    }
  }, [amounts, wallets]);

  useEffect(() => {
    const { wallets, amounts, tokenAddress, walletsUri } = query;
    if (wallets) {
      if (typeof wallets == "string") {
        setWallets(wallets.split(","));
      } else {
        setWallets(wallets as string[]);
      }
    }
    if (amounts) {
      if (typeof amounts == "string") {
        setAmounts(amounts.split(","));
      } else {
        setAmounts(amounts as string[]);
      }
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
        <form className="md:w-[500px] w-[95%] lg:w-[700px] mx-auto  rounded-3xl shadow-xl border p-4">
          <div className="flex flex-col space-y-1 w-full my-1">
            <div className="flex justify-between items-center">
              <p className="font-semibold  ml-1 my-0 break-words">Recipient Wallets</p>
              <Contacts setWallets={setWallets} wallets={wallets} />
            </div>
            {wallets.map((wallet, index) => (
              <div key={index}>
                <div className="flex mt-1 w-full md:gap-1">
                  <div className="w-11/12 flex gap-2 items-center md:flex-row flex-col">
                    <span className="w-11/12">
                      <AddressInput
                        name={""}
                        placeholder={"Recipient's address"}
                        value={wallet}
                        onChange={val => updateWallet(val, index)}
                      />
                    </span>
                    <span className="md:w-4/12 w-11/12">
                      {splitItem === "split-tokens" ? (
                        <input
                          className="input  input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] font-medium placeholder:text-accent/50 w-full text-gray-400 bg-base-200 border-2 border-base-300"
                          type="number"
                          min={0}
                          value={amounts[index]}
                          onChange={val => updateAmounts(val.target.value, index)}
                          placeholder="Amount"
                        />
                      ) : (
                        <EtherInput
                          value={amounts[index]}
                          onChange={val => updateAmounts(val, index)}
                          usdGenMode={usdGenMode}
                          setUsdGenMode={setUSDGenMode}
                        />
                      )}
                    </span>
                  </div>
                  {index > 0 && (
                    <button
                      className="w-1/12 mt-auto p-1 md:p-0 md:btn md:btn-ghost"
                      type="button"
                      onClick={() => {
                        removeWalletField(index);
                      }}
                    >
                      <TrashIcon className="h-1/2" />
                    </button>
                  )}
                </div>
                {!isAddress(wallet) && wallet !== "" && (
                  <h1 className="ml-2 text-[0.75rem] text-red-400 mt-1">address is invalid</h1>
                )}
              </div>
            ))}
            {wallets.length > 1 && <ExportList wallets={wallets} splitType="unequal-splits" amounts={amounts} />}
            <button type="button" onClick={addWalletField} className="btn btn-primary font-black ">
              <PlusIcon className="h-1/2" />
            </button>
          </div>

          <div className="my-[10px] w-full space-y-4">
            <button
              type="button"
              disabled={
                wallets.length <= 1 ||
                amounts.length <= 1 ||
                amounts.length != wallets.length ||
                amounts.includes("") ||
                wallets.includes("") ||
                wallets.some(wallet => !isAddress(wallet))
              }
              onClick={async () => {
                splitItem === "split-tokens" ? await splitERC20() : await splitETH();
                saveContacts(wallets);
              }}
              className={`btn btn-primary w-full font-black `}
            >
              {splitItem === "split-tokens" ? " Split TOKENS" : "Split ETH"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UnEqualUi;
