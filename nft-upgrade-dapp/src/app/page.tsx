"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../../lib/contract";
import { ConnectWallet } from "../../components/connect-wallet";
import { NetworkSwitcher } from "../../components/network-switcher";
import { NFTCard } from "../../components/nft-card";
import { NFTGrid } from "../../components/nft-grid";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<string | null>(null);

  const fetchNFTs = async (address: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if ethereum is defined in the window object
      if (typeof window === "undefined" || !window.ethereum) {
        setError("No Ethereum wallet detected. Please install MetaMask.");
        return;
      }

      // Connect to provider
      const provider = new ethers.BrowserProvider(window.ethereum as any);

      // Get network information
      const network = await provider.getNetwork();
      setNetworkInfo(
        `Connected to: ${network.name} (Chain ID: ${network.chainId})`
      );

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      );

      // Check if contract exists by calling a view function that should always work
      try {
        console.log("Checking contract name...");
        const name = await contract.name();
        console.log("Contract name:", name);
      } catch (e) {
        console.error("Error calling contract.name():", e);
        setError(
          `Contract not found at ${contractAddress} on the current network (${network.name}). Please switch to the correct network.`
        );
        setLoading(false);
        return;
      }

      // Get balance of NFTs for the address
      try {
        console.log("Checking balance for address:", address);
        const balance = await contract.balanceOf(address);
        console.log("NFT balance:", balance.toString());

        const nftData = [];

        // Only try to fetch NFTs if balance > 0
        if (balance > 0) {
          // Fetch each NFT
          for (let i = 0; i < balance; i++) {
            try {
              const tokenId = await contract.tokenOfOwnerByIndex(address, i);
              const tokenLevel = await contract.tokenLevel(tokenId);
              const tokenURI = await contract.tokenURI(tokenId);

              // Fetch metadata if available
              let metadata = null;
              try {
                const response = await fetch(tokenURI);
                metadata = await response.json();

                // Ensure image URL is valid
                if (metadata.image && !metadata.image.startsWith("http")) {
                  // If it's an IPFS URL or other format, you might need to transform it
                  if (metadata.image.startsWith("ipfs://")) {
                    metadata.image = metadata.image.replace(
                      "ipfs://",
                      "https://ipfs.io/ipfs/"
                    );
                  }
                }
              } catch (e) {
                console.error("Error fetching metadata:", e);
                metadata = {
                  name: `NFT #${tokenId}`,
                  image: "/placeholder.svg?height=300&width=300",
                };
              }

              nftData.push({
                id: tokenId.toString(),
                level: tokenLevel.toString(),
                maxLevel: (await contract.MAX_LEVEL()).toString(),
                metadata,
                upgradeCost: ethers.formatEther(await contract.upgradeCost()),
              });
            } catch (e) {
              console.error(`Error fetching NFT at index ${i}:`, e);
            }
          }
        }

        setNfts(nftData);
      } catch (e) {
        console.error("Error calling balanceOf:", e);
        setError(
          `Failed to get NFT balance. The contract might not be compatible or not exist on this network.`
        );
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError(
        "Failed to fetch NFTs. Please make sure you're connected to the correct network."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchNFTs(account);
    } else {
      setNetworkInfo(null);
    }
  }, [account]);

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold mb-8 text-center">
          My NFT Collection
        </h1>

        <ConnectWallet account={account} setAccount={setAccount} />

        {account && (
          <NetworkSwitcher
            onNetworkChange={() => {
              if (account) {
                fetchNFTs(account);
              }
            }}
          />
        )}

        {networkInfo && (
          <div className="text-center mb-4 text-sm text-muted-foreground">
            {networkInfo}
          </div>
        )}

        {loading && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            {error}
          </div>
        )}

        {!loading && account && nfts.length === 0 && !error && (
          <div className="text-center my-12">
            <p className="text-xl">No NFTs found for this wallet</p>
          </div>
        )}

        {!loading && nfts.length > 0 && (
          <NFTGrid>
            {nfts.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                account={account}
                onUpgrade={() => fetchNFTs(account!)}
              />
            ))}
          </NFTGrid>
        )}
      </div>
    </main>
  );
}
