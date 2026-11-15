import { useState, useEffect } from 'react';

/**
 * MetaMask Wallet Connection Hook
 * Handles wallet connection, account changes, and network switching
 */
export function useMetaMask() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install it to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Get chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        setChainId(chainId);

        // Get balance
        await updateBalance(accounts[0]);
      }
    } catch (err) {
      console.error('Error connecting to MetaMask:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance(null);
    setError(null);
  };

  // Update account balance
  const updateBalance = async (address) => {
    try {
      if (!window.ethereum) return;
      
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to ETH
      const balanceInWei = parseInt(balanceHex, 16);
      const balanceInEth = (balanceInWei / 1e18).toFixed(4);
      setBalance(balanceInEth);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get network name from chain ID
  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Mumbai Testnet',
      '0xa4b1': 'Arbitrum One',
      '0xa': 'Optimism'
    };
    return networks[chainId] || `Chain ${parseInt(chainId, 16)}`;
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    // Handle account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        updateBalance(accounts[0]);
      }
    };

    // Handle chain changes
    const handleChainChanged = (chainId) => {
      setChainId(chainId);
      // Reload page on chain change as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup listeners
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          
          const chainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          setChainId(chainId);
          
          await updateBalance(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled]);

  return {
    account,
    chainId,
    isConnected,
    isConnecting,
    error,
    balance,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    formatAddress,
    getNetworkName,
    updateBalance
  };
}

export default useMetaMask;
