import React from "react";
import { useRouter } from "next/router";

const FeatureCard = ({ title, icon, description, actionText }: any) => {
  const router = useRouter();
  return (
    <div className="max-w-sm mx-auto bg-white p-6 rounded-md shadow-md mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold transition duration-300 hover:bg-blue-600"
        onClick={() => router.push("/splitter")}
      >
        {actionText}
      </button>
    </div>
  );
};

const Cards = () => {
  return (
    <div className="flex justify-between items-center gap-4 mt-20 mb-40">
      <FeatureCard
        title="Split ETH"
        icon="💸"
        description="Specify individual amounts for each recipient or distribute ETH equally among recipients."
        actionText="Split ETH"
      />
      <FeatureCard
        title="Split ERC20 Tokens"
        icon="🔄"
        description="Specify individual amounts for each recipient and split ERC20 tokens equally among them."
        actionText="Split ERC20"
      />
      <FeatureCard
        title="Multisig Support"
        icon="🔐"
        description="The frontend is built as a safe app to work with multisigs, ETH, and ERC20 tokens."
        actionText="Explore"
      />
    </div>
  );
};

export default function Landing() {
  const router = useRouter();

  return (
    <div className=" min-h-screen flex flex-col items-center justify-center  ">
      <div className="text-center ">
        <div className="flex justify-center my-24">
          <form
            className="md:w-[300px] w-[200px] lg:w-[500px] h-[410px]  rounded-3xl shadow-xl border-2 p-4  cursor-pointer"
            onClick={() => router.push("/splitter")}
          >
            <div className="flex flex-col space-y-1 w-full my-1">
              <p className="font-semibold  ml-1 my-2 break-words">Token Amount Each</p>
              <div
                className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-full text-accent w-full`}
              >
                <input
                  value="200"
                  onChange={() => {
                    console.log();
                  }}
                  min={0}
                  className="input input-ghost focus:outline-none focus:bg-transparent focus:text-black  border w-full font-medium placeholder:text-accent/50 text-white"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1 w-full my2 ">
              <p className="font-semibold  ml-1 my-2 break-words">Recipient Wallets</p>
              <div
                className={`flex items-center justify-between border-2 border-base-300 bg-base-200 rounded-xl text-accent w-full`}
              >
                <textarea
                  placeholder="Seperate each address with a comma, space or new line"
                  className="textarea rounded-none textarea-ghost focus:outline-none focus:bg-transparent   min-h-[8.2rem] border w-full font-medium placeholder:text-accent text-white"
                />
              </div>
            </div>
            <p className="ml-2 -mt-1">valid unique addresses: 0</p>
            <div className="my-[10px] w-full  space-y-4 ">
              <button
                type="button"
                disabled
                className={`btn bg-new_tertiary w-full h-[5px] text-white capitalize text-lg `}
              >
                Split ETH
              </button>
            </div>
          </form>
        </div>

        <h1 className="text-5xl font-bold mt-28">ETHSplitter Contract</h1>
        <p className=" my-10 text-xl leading-7">
          A smart contract for splitting ETH and ERC20 tokens among recipients.
        </p>
      </div>

      <button
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white px-20 py-3 rounded-full font-semibold transition duration-300 transform hover:scale-105 focus:outline-none focus:ring focus:border-blue-300"
        onClick={() => router.push("/splitter")}
      >
        Get Started
      </button>

      <a
        className=" my-10 text-sm text-gray-400 cursor-pointer"
        onClick={() =>
          window.open("https://etherscan.io/address/0x3474627d4f63a678266bc17171d87f8570936622#code", "_blank")
        }
        target="_blank"
        rel="noopener noreferrer"
      >
        View the contract code on Etherscan
      </a>

      <Cards />
    </div>
  );
}
