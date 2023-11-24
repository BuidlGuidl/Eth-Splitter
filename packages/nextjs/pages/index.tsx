import { useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import EqualUi from "~~/components/splitter-ui/EqualUi";
import UnEqualUi from "~~/components/splitter-ui/UnEqualUi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [activeItem, setActiveItem] = useState("split-eth");
  const [splitType, setSplitType] = useState("");
  const account = useAccount();

  function handleItemClick(itemId: string) {
    setActiveItem(itemId);
  }

  let splitterContract: any;
  let splitterAbi: any;

  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo("ETHSplitter");
  if (deployedContractData) {
    ({ address: splitterContract, abi: splitterAbi } = deployedContractData);
  }

  return (
    <>
      <Head>
        <title>ETH & Token Splitter</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
      </Head>

      <div className="flex items-center flex-col flex-grow pt-10 ">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
          <ul className="flex bg-base-100 rounded-full p-[0.2rem] border border-base-300 shadow-md shadow-secondary">
            <li
              onClick={() => handleItemClick("split-eth")}
              className={`text-gray-400 py-2 px-4 ${
                activeItem === "split-eth"
                ? "bg-primary rounded-full cursor-pointer text-neutral"
                : "rounded-full hover:text-base-content cursor-pointer"
            }`}
            >
              <a>Split ETH</a>
            </li>
            <li
              onClick={() => handleItemClick("split-tokens")}
              className={`text-gray-400 py-2 px-4 ${
                activeItem === "split-tokens"
                  ? "bg-primary rounded-full cursor-pointer text-neutral"
                  : "rounded-full hover:text-base-content cursor-pointer"
              }`}
            >
              <a>Split Tokens</a>
            </li>
          </ul>

          <select
            defaultValue="select"
            className="select select-bordered w-full max-w-xs border-base-300 focus:outline-none shadow-md shadow-secondary"
            onChange={e => setSplitType(e.target.value)}
          >
            <option value="select" disabled>
              Select Split Type
            </option>
            <option value="equal-splits">Equal Splits</option>
            <option value="unequal-splits">Unequal Splits</option>
          </select>
        </div>

        {splitType === "equal-splits" && (
          <EqualUi splitItem={activeItem} account={account} splitterContract={splitterContract} />
        )}
        {splitType === "unequal-splits" && (
          <UnEqualUi splitItem={activeItem} account={account} splitterContract={splitterContract} />
        )}
      </div>
    </>
  );
};

export default Home;
