import React, { useEffect, useState } from "react";
import { AddressInput } from "../scaffold-eth";
import TokenData from "./splitter-components/TokenData";
import { isAddress, parseUnits } from "viem";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const UnEqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const [wallets, setWallets] = useState<string[]>([""]);
  const [amounts, setAmounts] = useState<string[]>([""]);
  const [amountsInWei, setAmountsInWei] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState("");

  const [tokenContract, setTokenContract] = useState("");

  function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => address.includes("0x") && address.length === 42;

    const addresses: string[] = value.trim().split(",");

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
    setTotalAmount(totalETH.toFixed(18));
  }, [amounts]);

  useEffect(() => {
    for (let index = 0; index < amounts.length; index++) {
      if (wallets[index] === "" || amounts[index] === "") {
        return;
      }
    }
  }, [amounts, wallets]);

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
      <div className="mx-auto mt-14">
        <form className="md:w-[500px] w-[300px] lg:w-[800px] bg-base-100 rounded-3xl shadow-xl border-2 p-2">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold  ml-1 my-0 break-words">Recipient Wallets</p>

            {wallets.map((wallet, index) => (
              <div key={index}>
                <div className="flex gap-2 mt-1 w-full ">
                  <div className="w-11/12 flex gap-2 items-center">
                    <span className="w-11/12">
                      <AddressInput
                        name={""}
                        placeholder={"Recipient's address"}
                        value={wallet}
                        onChange={val => updateWallet(val, index)}
                      />
                    </span>
                    <span className="w-4/12">
                      <input
                        className="input  input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] font-medium placeholder:text-accent/50 w-full text-gray-400 bg-base-200 border-2 border-base-300"
                        type="number"
                        min={0}
                        onChange={val => updateAmounts(val.target.value, index)}
                        placeholder="Amount"
                      />
                    </span>
                  </div>
                  {index > 0 && (
                    <button
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
                  <p className="ml-2 text-[0.75rem] text-red-400">address is invalid</p>
                )}
              </div>
            ))}
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
