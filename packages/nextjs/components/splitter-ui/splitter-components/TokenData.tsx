import React, { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { prepareWriteContract, writeContract } from "@wagmi/core";
import { formatEther, formatUnits } from "viem";
import { erc20ABI } from "wagmi";
import { Spinner } from "~~/components/Spinner";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { TokenDataJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const TokenData = ({
  splitErc20Loading,
  account,
  splitterContract,
  setTokenContract,
  tokenContract,
}: TokenDataJsxProps) => {
  const [tokenName, setTokenName] = useState("");
  const [tokenAllowance, setTokenAllowance] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenDecimals, settokenDecimals] = useState("");
  const approveAmount = "1000000000";
  const [errorMsg, setErrorMsg] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  const writeTx = useTransactor();

  const approve = async () => {
    try {
      let amount = BigInt(approveAmount);
      for (let i = 0; i < parseInt(tokenDecimals); i++) {
        amount *= BigInt(10);
      }

      const config = await prepareWriteContract({
        address: tokenContract,
        abi: erc20ABI,
        functionName: "approve",
        args: [splitterContract, BigInt(amount.toString())],
      });
      await writeTx(() => writeContract(config));
      await getTokenData();
    } catch (error) {
      console.log(error);
    }
  };

  const getTokenData = async () => {
    try {
      setTokenBalance("");
      setTokenName("");
      setTokenAllowance("");
      setDataLoading(true);
      const name = await readContract({
        address: tokenContract,
        abi: erc20ABI,
        functionName: "name",
      });

      const decimals = await readContract({
        address: tokenContract,
        abi: erc20ABI,
        functionName: "decimals",
      });
      settokenDecimals(decimals.toString());

      let allowance: bigint | string = await readContract({
        address: tokenContract,
        abi: erc20ABI,
        functionName: "allowance",
        args: [account.address as string, splitterContract],
      });
      allowance = allowance.toString();
      allowance = formatUnits(BigInt(allowance), decimals);

      let balance: any = await readContract({
        address: tokenContract,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [account.address as string],
      });
      balance = formatEther(balance);
      setTokenBalance(balance.toLocaleString());
      setTokenName(name);
      setTokenAllowance(allowance.toLocaleString());
      setErrorMsg("");
      setDataLoading(false);
    } catch (error) {
      console.log(error);
      setTokenBalance("");
      setTokenName("");
      setTokenAllowance("");
      setDataLoading(false);
      if (account.address === undefined) {
        setErrorMsg("Please connect your wallet");
      } else {
        setErrorMsg("Invalid token contract");
      }
    }
  };

  useEffect(() => {
    if (tokenContract !== "") getTokenData();
  }, [tokenContract, splitErc20Loading]);

  return (
    <div className="mx-auto my-14 -mb-2">
      <div className="flex flex-col gap-4 md:w-[500px] w-[300px] lg:w-[800px] bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 p-4 ">
        <div className="flex flex-col space-y-1 w-full my-1">
          <p className="font-semibold  ml-1 my-0 break-words">Enter Token Contract</p>
          <div
            className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
          >
            <input
              type="text"
              value={tokenContract}
              onChange={e => setTokenContract(e.target.value)}
              className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] border w-full font-medium placeholder:text-accent/50 text-gray-400"
            />
          </div>
          {errorMsg !== "" && tokenContract !== "" && <p className="ml-2 text-[0.75rem] text-red-400">{errorMsg}</p>}
        </div>
        {tokenName && (
          <div className="grid md:grid-cols-3 grid gap-4 sm:gap-0 p-0">
            <span className="flex items-center justify-center border border-white sm:rounded-r-2xl rounded-full p-2 px-4 gap-2">
              <span>Token Name: </span> <span>{tokenName}</span> {dataLoading && <Spinner />}
            </span>
            <span className="flex items-center justify-center border sm:rounded-none rounded-full border-white p-2 px-4 gap-2">
              <span>Balance: </span> <span>{tokenBalance}</span> {dataLoading && <Spinner />}
            </span>
            <span className="flex items-center justify-center border border-white sm:rounded-l-2xl rounded-full p-2 gap-2">
              <span>Allowance: </span> <span>{tokenAllowance}</span>
              {dataLoading && <Spinner />}
            </span>
          </div>
        )}
        {tokenAllowance && (
          <div
            className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
          >
            <input
              type="number"
              value={approveAmount}
              readOnly
              // onChange={e => setApproveAmount(e.target.value)}
              className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] border w-3/5 font-medium placeholder:text-accent/50 text-gray-400"
            />
            <button
              type="button"
              disabled={tokenContract == "" || tokenName == ""}
              className={`btn btn-primary w-2/5 font-black h-[2.2rem] min-h-[2.2rem]`}
              onClick={async () => {
                await approve();
                getTokenData();
              }}
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenData;
