import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Address } from "../scaffold-eth";
import ExportList from "../splitter-ui/splitter-components/ExportList";
import { formatEther } from "viem";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import useSpliiterHistory from "~~/hooks/useSpliiterHistory";
import { getBlockExplorerTxLink, getTargetNetwork } from "~~/utils/scaffold-eth";
import { getDate } from "~~/utils/scaffold-eth/ethsplitter";

const TokenSplitsHistory = () => {
  const router = useRouter();
  const { erc20SplitEvents } = useSpliiterHistory();
  const [activeIndex, setActiveIndex] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    const currentActive = [...activeIndex];

    if (currentActive.includes(index)) {
      const indexToRemove = currentActive.indexOf(index);
      currentActive.splice(indexToRemove, 1);
    } else {
      currentActive.push(index);
    }
    setActiveIndex(currentActive);
  };

  const repeatSplit = (wallets: string[], amounts: string[], tokenAddress: string) => {
    router.push({
      pathname: `/`,
      query: {
        token: "split-tokens",
        splitType: "unequal-splits",
        wallets: wallets,
        amounts: amounts,
        tokenAddress: tokenAddress,
      },
    });
  };

  return (
    <div>
      {erc20SplitEvents?.map((event, index) => (
        <div key={index} className={"flex flex-col  my-1    hover:border-yellow-500   border"}>
          <div
            className="flex flex-wrap items-center py-2 justify-between cursor-pointer bg-base-300 px-4"
            onClick={() => handleToggle(index)}
          >
            <span className="w-[40%]">Unequal Split</span>
            <span className="w-[30%] ">
              {event.args.amounts.reduce(
                (accumulator: number, currentNumber: bigint) => accumulator + Number(formatEther(currentNumber)),
                0,
              ) +
                " " +
                event.tokenSymbol}
            </span>
            <span className="w-[30%] flex justify-center">{getDate(event.block.timestamp)}</span>
          </div>
          {activeIndex.includes(index) && (
            <div className=" px-4 py-6 grid md:grid-cols-4 gap-2 text-sm grid-cols-2 ">
              <div>
                <span>recipients (address[]):</span>
                <ExportList wallets={event.args.recipients} splitType="unequal-splits" />
              </div>
              <div className="flex flex-col">
                [
                {event.args.recipients.map((address: string) => (
                  <Address key={address} address={address} hideBlockie={true} />
                ))}
                ]
              </div>
              <span>amounts (uint256[]):</span>
              <div className="flex flex-col text-base">
                [
                {event.args.amounts.map((amount: string, index: number) => (
                  <span key={index}>{Number(amount)}</span>
                ))}
                ]
              </div>

              <span className="py-1">token (address):</span>
              <div>
                <Address address={event.args.token} hideBlockie={true} />
              </div>
              {event.log.transactionHash && (
                <div className="flex gap-2 items-center py-1">
                  <span>Transaction Link</span>
                  <span className="">
                    <Link
                      href={getBlockExplorerTxLink(getTargetNetwork().id, event.log.transactionHash)}
                      target="_blank"
                    >
                      <ArrowTopRightOnSquareIcon className="text-sm w-4 cursor-pointer" aria-hidden="true" />
                    </Link>
                  </span>
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() =>
                      repeatSplit(
                        event.args.recipients,
                        event.args.amounts.map((amount: bigint) => formatEther(amount, "wei")),
                        event.args.token,
                      )
                    }
                  >
                    Repeat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TokenSplitsHistory;
