"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ethers } from "ethers";

interface ConnectWalletProps {
  account: string | null;
  setAccount: (account: string | null) => void;
}

export function ConnectWallet({ account, setAccount }: ConnectWalletProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum as any);

          // This gets accounts without prompting if already connected
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            console.log("Already connected to account:", accounts[0].address);
            setAccount(accounts[0].address);
          }
        } catch (err) {
          console.error("Error checking existing connection:", err);
        }
      }
    };

    checkConnection();
  }, [setAccount]);

  const connectWallet = async () => {
    // Check if ethereum is defined in the window object
    if (typeof window !== "undefined" && !window.ethereum) {
      setError("No Ethereum wallet detected. Please install MetaMask.");
      return;
    }

    try {
      setConnecting(true);
      setError(null);

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      {!account ? (
        <Button
          onClick={connectWallet}
          disabled={connecting}
          className="px-6 py-2"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <Button variant="outline" onClick={disconnectWallet} size="sm">
            Disconnect
          </Button>
        </div>
      )}

      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
    </div>
  );
}
