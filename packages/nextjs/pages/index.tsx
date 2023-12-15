import { useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import EqualUi from "~~/components/splitter-ui/EqualUi";
import UnEqualUi from "~~/components/splitter-ui/UnEqualUi";

// import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [activeSplitToken, setSplitToken] = useState("split-eth");
  const [activeSplitType, setSplitType] = useState("equal-splits");
  const account = useAccount();

  function handleItemClick(itemId: string) {
    if (itemId == "split-eth" || itemId == "split-tokens") {
      setSplitToken(itemId);
    } else {
      setSplitType(itemId);
    }
  }

  let splitterContract: any;
  // let splitterAbi: any;

  // const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo("ETHSplitter");
  // if (deployedContractData) {
  //   ({ address: splitterContract, abi: splitterAbi } = deployedContractData);
  // }

  return (
    <>
      <Head>
        <title>ETH & Token Splitter</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
      </Head>

      <div className="flex items-center flex-col flex-grow pt-36">
        <div className="flex flex-row items-center gap-4">
          <ul className="flex p-[0.2rem] rounded-full text-white bg-new_secondary">
            <li
              onClick={() => handleItemClick("split-eth")}
              className={`py-2 px-4 ${
                activeSplitToken === "split-eth"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Split ETH</a>
            </li>
            <li
              onClick={() => handleItemClick("split-tokens")}
              className={`py-2 px-4 ${
                activeSplitToken === "split-tokens"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Split Tokens</a>
            </li>
          </ul>

          <ul className="flex p-[0.2rem] rounded-full text-white bg-new_secondary">
            <li
              onClick={() => {
                setSplitType("equal-splits");
                handleItemClick("equal-splits");
              }}
              className={`py-2 px-4 ${
                activeSplitType === "equal-splits"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Equal Splits</a>
            </li>
            <li
              onClick={() => {
                setSplitType("unequal-splits");
                handleItemClick("unequal-splits");
              }}
              className={`py-2 px-4 ${
                activeSplitType === "unequal-splits"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Unequal Splits</a>
            </li>
          </ul>
        </div>
        {activeSplitType === "equal-splits" && (
          <EqualUi splitItem={activeSplitToken} account={account} splitterContract={splitterContract} />
        )}
        {activeSplitType === "unequal-splits" && (
          <UnEqualUi splitItem={activeSplitToken} account={account} splitterContract={splitterContract} />
        )}
      </div>
    </>
  );
};

export default Home;
