import { useState } from "react";
import Head from "next/head";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import EqualUi from "~~/components/splitter-ui/EqualUi";
import UnEqualUi from "~~/components/splitter-ui/UnEqualUi";

// import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const [activeItem, setActiveItem] = useState("split-eth");
  const [splitType, setSplitType] = useState("");
  const account = useAccount();

  function handleItemClick(itemId: string) {
    setActiveItem(itemId);
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
                activeItem === "split-eth"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Split ETH</a>
            </li>
            <li
              onClick={() => handleItemClick("split-tokens")}
              className={`py-2 px-4 ${
                activeItem === "split-tokens"
                  ? "bg-accent rounded-full cursor-pointer"
                  : "rounded-full hover:scale-105 cursor-pointer"
              }`}
            >
              <a>Split Tokens</a>
            </li>
          </ul>

          <select
            defaultValue="select"
            className="select select-bordered items-center max-w-xs border-gray-300 bg-new_secondary text-white focus:border-none"
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
