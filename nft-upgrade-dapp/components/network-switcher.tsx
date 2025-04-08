"use client";

import { useState } from "react";
import { Button } from "./ui/button";

// Common networks - add the one where your contract is deployed
const NETWORKS = [
  {
    name: "Core Testnet",
    chainId: "0x45a",
    rpcUrl: "https://rpc.test2.btcs.network",
    currencySymbol: "tCORE2",
    blockExplorer: "https://scan.test2.btcs.network",
  },
];

interface NetworkSwitcherProps {
  onNetworkChange?: () => void;
}

export function NetworkSwitcher({ onNetworkChange }: NetworkSwitcherProps) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchNetwork = async (network: (typeof NETWORKS)[0]) => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No Ethereum wallet detected");
      return;
    }

    try {
      setSwitching(true);
      setError(null);

      // Request switch to the network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: network.chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: {
                  name: network.currencySymbol,
                  symbol: network.currencySymbol,
                  decimals: 18,
                },
                blockExplorerUrls: [network.blockExplorer],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      if (onNetworkChange) {
        onNetworkChange();
      }
    } catch (err) {
      console.error("Error switching network:", err);
      setError("Failed to switch network");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="text-sm mb-2">Switch Network:</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {NETWORKS.map((network) => (
          <Button
            key={network.chainId}
            variant="outline"
            size="sm"
            onClick={() => switchNetwork(network)}
            disabled={switching}
          >
            {network.name}
          </Button>
        ))}
      </div>
      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
    </div>
  );
}
