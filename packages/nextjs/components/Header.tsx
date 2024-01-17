import React, { useState } from "react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Chain, useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import * as chains from "wagmi/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

/**
 * Site header
 */
export const Header = () => {
  const { chains: switchChains, switchNetwork } = useSwitchNetwork();
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  const [chainData, setChainData] = useState<Chain[]>();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("");

  function changeTargetNetwork(newNetwork: any): void {
    scaffoldConfig.targetNetwork = newNetwork;
  }

  console.log(switchChains);

  useEffect(() => {
    if (switchChains.length > 0) {
      setChainData(switchChains.filter(item => [1, 137, 10, 11155111].includes(item.id)));
    }
  }, [switchChains]);

  useEffect(() => {
    if (chain) {
      setSelectedNetwork(chain.name);
    }
  }, [chain]);

  return (
    <div className="sticky lg:static top-0 navbar  min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-new_primary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <Link href="/" passHref className="items-center gap-2 ml-4 mr-6 shrink-0 ">
          <div className="flex relative w-[200px] h-[48px]">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/assets/bg.svg" />
          </div>
          {/* <div className="flex flex-col">
            <span className="font-bold leading-tight">Scaffold-ETH</span>
            <span className="text-xs">Ethereum dev stack</span>
          </div> */}
        </Link>
        {/* <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">{navLinks}</ul> */}
      </div>
      <div className="navbar-end flex-grow mr-4 ">
        {isConnected && (
          <select
            className="select select-sm sm:w-fit w-20 mr-2 bg-gray-600 text-white"
            style={{ borderWidth: 1, borderColor: chain && (chain as any).color }}
            onChange={event => {
              const [name, id] = event.target.value.split("|");
              switchNetwork?.(+id);
              console.log(name);
              name === "Ethereum"
                ? changeTargetNetwork(chains["mainnet"])
                : name === "Polygon Mumbai"
                ? changeTargetNetwork(chains["polygonMumbai"])
                : name === "OP Mainnet"
                ? changeTargetNetwork(chains["optimism"])
                : changeTargetNetwork(chains[name.toLowerCase() as keyof typeof chains]);
            }}
          >
            <option disabled>Select network</option>
            {chainData &&
              chainData.map(data => (
                <option
                  key={data.name}
                  value={`${data.name}|${data.id}`}
                  style={{ color: (data as any).color }}
                  selected={selectedNetwork === data.name}
                >
                  {data.name}
                </option>
              ))}
          </select>
        )}
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
