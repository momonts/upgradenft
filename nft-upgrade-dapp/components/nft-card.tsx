"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { contractAddress, contractABI } from "../lib/contract";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/cards";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Sparkles } from "lucide-react";

interface NFTCardProps {
  nft: {
    id: string;
    level: string;
    maxLevel: string;
    metadata: {
      name: string;
      image: string;
      description?: string;
    };
    upgradeCost: string;
  };
  account: string | null;
  onUpgrade: () => void;
}

export function NFTCard({ nft, account, onUpgrade }: NFTCardProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const level = Number.parseInt(nft.level);
  const maxLevel = Number.parseInt(nft.maxLevel);
  const isMaxLevel = level >= maxLevel;

  const upgradeNFT = async () => {
    if (!account || typeof window === "undefined" || !window.ethereum) return;

    try {
      setUpgrading(true);
      setError(null);

      // Connect to provider with signer
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      // Call upgrade function with payment
      const tx = await contract.upgradeNFT(nft.id, {
        value: ethers.parseEther(nft.upgradeCost),
      });

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh NFT data
      onUpgrade();
    } catch (err: any) {
      console.error("Error upgrading NFT:", err);
      setError(err.message || "Failed to upgrade NFT");
    } finally {
      setUpgrading(false);
    }
  };

  // Function to render image safely
  const renderImage = () => {
    const fallbackImage = "/placeholder.svg?height=300&width=300";

    if (imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">
            Image not available
          </span>
        </div>
      );
    }

    // Use a regular img tag for external images
    return (
      <img
        src={nft.metadata.image || fallbackImage}
        alt={nft.metadata.name || `NFT #${nft.id}`}
        className="object-cover w-full h-full"
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">
          {nft.metadata.name || `NFT #${nft.id}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-square">{renderImage()}</div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {nft.level}</span>
            <span className="text-sm text-muted-foreground">
              {nft.level}/{nft.maxLevel}
            </span>
          </div>
          <Progress value={(level / maxLevel) * 100} className="h-2" />

          {nft.metadata.description && (
            <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
              {nft.metadata.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={upgradeNFT}
          disabled={upgrading || isMaxLevel}
          className="w-full"
          variant={isMaxLevel ? "outline" : "default"}
        >
          {upgrading ? (
            "Upgrading..."
          ) : isMaxLevel ? (
            "Max Level Reached"
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade ({nft.upgradeCost} ETH)
            </>
          )}
        </Button>

        {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
      </CardFooter>
    </Card>
  );
}
