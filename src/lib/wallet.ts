import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const DEFAULT_CHAIN_ID = '0xA869'; // Avalanche Fuji by default; can be changed via env if needed

export const connectWallet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask (or compatible wallet) is not installed');
  }

  const accounts: string[] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet accounts found');
  }

  const chainId: string = await window.ethereum.request({ method: 'eth_chainId' });

  if (chainId !== DEFAULT_CHAIN_ID) {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: DEFAULT_CHAIN_ID }],
    });
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return {
    address: accounts[0],
    provider,
    signer,
  };
};
