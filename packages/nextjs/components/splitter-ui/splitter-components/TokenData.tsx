import React, { useEffect, useRef, useState } from "react";
import { useChainId } from "wagmi";
import { Spinner } from "~~/components/Spinner";
import tokens from "~~/constants/tokens";
import { useApproveForSplitting } from "~~/hooks/useApproveForSplitting";
import { TokenDataJsxProps } from "~~/types/splitterUiTypes/splitterUiTypes";

const TokenData = ({ splitErc20Loading, setTokenContract, tokenContract }: TokenDataJsxProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [approveAmount, setApproveAmount] = useState<string>("10000000");
  const chainId = useChainId();
  const preloadedTokens = tokens[chainId];

  const {
    allowance,
    writeAsync: approve,
    balance,
    tokenSymbol,
    isLoading: dataLoading,
  } = useApproveForSplitting({
    tokenAddress: tokenContract,
    amount: Number(approveAmount),
    isTransferLoading: splitErc20Loading,
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="w-full my-14 -mb-2">
      <div className="md:w-[500px] w-[95%] lg:w-[700px] mx-auto rounded-3xl shadow-xl border p-2 px-4">
        <div className="flex flex-col space-y-1 w-full my-1">
          <p className="font-semibold  ml-1 my-0 break-words">Enter Token Contract</p>
          <ul className="menu menu-horizontal activemenu py-2 gap-1 ">
            {preloadedTokens &&
              preloadedTokens?.contracts?.map((token, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setTokenContract(token.address);
                  }}
                >
                  <a className={tokenContract === token.address ? "active" : "bg-base-300"}>{token.name}</a>
                </li>
              ))}
          </ul>
          <div
            className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
          >
            <input
              type="text"
              ref={inputRef}
              value={tokenContract}
              onChange={e => setTokenContract(e.target.value)}
              className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400  border w-full font-medium placeholder:text-accent/50 text-gray-400"
            />
          </div>
        </div>
        <div className="flex flex-col space-y-1 w-full my-1">
          <div className="flex justify-around bg-base-200 w-full mx-auto m-1 rounded-full break-words md:text-base text-xs p-2">
            <span className="flex flex-col items-center  w-1/3 ">
              <span>Token: </span> <span>{tokenSymbol}</span> {dataLoading && <Spinner />}
            </span>
            <span className="flex flex-col items-center w-1/3">
              <span>Balance: </span> <span>{balance?.toFixed(4)}</span> {dataLoading && <Spinner />}
            </span>
            <span className=" flex flex-col items-center w-1/3">
              <span>Allowance: </span> <span>{allowance}</span>
              {dataLoading && <Spinner />}
            </span>
          </div>
          <div
            className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
          >
            <input
              type="number"
              value={approveAmount}
              // readOnly
              onChange={e => setApproveAmount(e.target.value)}
              className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] border w-3/5 font-medium placeholder:text-accent/50 text-gray-400"
            />
            <button
              type="button"
              disabled={tokenContract == "" || tokenSymbol == ""}
              className={`btn btn-primary w-2/5 font-black `}
              onClick={async () => {
                await approve();
              }}
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenData;
