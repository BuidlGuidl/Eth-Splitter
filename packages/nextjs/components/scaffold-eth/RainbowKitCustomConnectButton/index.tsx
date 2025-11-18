"use client";

// @refresh reset
import { useRef, useState } from "react";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { NetworkOptions } from "./NetworkOptions";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useNetworkColor, useOutsideClick } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import scaffoldConfig from "~~/scaffold.config";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

const getChainDisplayName = (chainName?: string): string => {
  if (!chainName) return "Unknown";

  // Custom display names for chains
  const nameMap: { [key: string]: string } = {
    "op mainnet": "Optimism",
    optimism: "Optimism",
  };

  const lowerName = chainName.toLowerCase();
  if (nameMap[lowerName]) {
    return nameMap[lowerName];
  }

  // Default: return as is
  return chainName;
};

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const [showNetworkOptions, setShowNetworkOptions] = useState(false);
  const networkDropdownRef = useRef<HTMLDivElement>(null);
  const addressDropdownRef = useRef<HTMLDetailsElement>(null);

  useOutsideClick(networkDropdownRef, () => setShowNetworkOptions(false));

  const handleNetworkButtonClick = () => {
    // Close the address dropdown if it's open
    if (addressDropdownRef.current?.hasAttribute("open")) {
      addressDropdownRef.current.removeAttribute("open");
    }
    // Toggle the network dropdown
    setShowNetworkOptions(!showNetworkOptions);
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                );
              }

              const isChainSupported = scaffoldConfig.targetNetworks.some(
                targetNet => targetNet.id === chain.id
              );
              
              if (chain.unsupported || !isChainSupported) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <div className="flex flex-col items-center mr-1 relative" ref={networkDropdownRef}>
                    <Balance address={account.address as Address} className="min-h-0 h-auto" />
                    <button
                      className="text-xs cursor-pointer px-2 py-0.5 rounded-md bg-base-300 hover:bg-base-content/10 transition-colors border border-base-content/10"
                      style={{ color: networkColor }}
                      onClick={handleNetworkButtonClick}
                    >
                      {getChainDisplayName(chain.name)}
                    </button>

                    {showNetworkOptions && (
                      <ul className="absolute top-full menu p-2 mt-1 right-0 shadow-center shadow-accent bg-base-200 rounded-box gap-1 z-50 min-w-[200px]">
                        <NetworkOptions onNetworkSwitch={() => setShowNetworkOptions(false)} />
                      </ul>
                    )}
                  </div>
                  <AddressInfoDropdown
                    ref={addressDropdownRef}
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                  <RevealBurnerPKModal />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
