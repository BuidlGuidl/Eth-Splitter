import React, { useEffect, useState } from "react";
import TokenData from "./splitter-components/TokenData";
import { parseEther } from "viem";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { UiJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const EqualUi = ({ splitItem, account, splitterContract }: UiJsxProps) => {
  const [amount, setamount] = useState("");
  const [wallets, setWallets] = useState<string[]>([]);

  const [totalAmount, setTotalAmount] = useState("");
  const [totalTokenAmount, setTotalTokenAmount] = useState("");
  const [totalEthAmount, setTotalEthAmount] = useState("");
  const [tokenContract, setTokenContract] = useState("");

  function addMultipleAddress(value: string) {
    const validateAddress = (address: string) => address.includes("0x") && address.length === 42;
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

    let uniqueAddresses = [...new Set([...addresses])];

    uniqueAddresses = uniqueAddresses.filter(validateAddress);

    setWallets(uniqueAddresses);
  }
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
        <form className="md:w-[500px] w-[300px] lg:w-[800px] bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-4">
          <div className="flex flex-col space-y-1 w-full my-1">
            <p className="font-semibold  ml-1 my-2 break-words">
              {splitItem === "split-eth" ? "ETH Amount Each" : "Token Amount Each"}
            </p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full h-[2.2rem] min-h-[2.2rem]`}
            >
              <input
                type="number"
                value={amount}
                min={0}
                onChange={e => setamount(e.target.value)}
                className="input input-ghost focus:outline-none focus:bg-transparent focus:text-neutral h-[2.2rem] min-h-[2.2rem] border w-full font-medium placeholder:text-accent/50 text-gray-400"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-1 w-full my-1 mb-[0.5rem]">
            <p className="font-semibold  ml-1 my-2 break-words">Recipient Wallets</p>
            <div
              className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-xl text-accent w-full relative`}
            >
              <textarea
                placeholder="Seperate each address with a comma, space or new line"
                onChange={e => addMultipleAddress(e.target.value)}
                className="textarea rounded-none textarea-ghost focus:outline-none focus:bg-transparent focus:text-neutral min-h-[11.2rem] border w-full font-medium placeholder:text-accent/50 text-gray-400"
              />
              <p className={`text-[0.7rem] absolute left-1/2 bottom-0 transform -translate-x-1/2 m-0 whitespace-nowrap ${wallets.length === 0 ? "text-red-400 " : ""}`}>valid unique addresses: {wallets.length}</p>
            </div>
          </div>
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
