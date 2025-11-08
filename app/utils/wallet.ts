import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

const APP_NAME = 'x402 Payment Gateway';
const APP_LOGO_URL = 'https://example.com/logo.png'; // Optional: Add your logo URL

// Payment recipient address (from your .env)
const PAYMENT_RECIPIENT = '0x1f0184dc26a675008383f6c4c50CE53fB0473645';

let coinbaseWallet: any = null;
let ethereum: any = null;

if (typeof window !== 'undefined') {
  coinbaseWallet = new CoinbaseWalletSDK({
    appName: APP_NAME,
    appLogoUrl: APP_LOGO_URL
  });

  ethereum = coinbaseWallet.makeWeb3Provider();
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window === 'undefined' || !ethereum) {
    alert('Coinbase Wallet SDK failed to initialize!');
    return null;
  }

  try {
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    alert('Please install Coinbase Wallet extension or use Coinbase Wallet app!');
    return null;
  }
}

export async function switchToBaseSepolia() {
  if (!ethereum) return false;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x14a34' }], // Base Sepolia chain ID: 84532
    });
    return true;
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x14a34',
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Base Sepolia network:', addError);
        return false;
      }
    }
    console.error('Error switching to Base Sepolia:', error);
    return false;
  }
}

export async function sendPayment(fromAddress: string, amountInUSD: number = 0.01): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!ethereum) {
    return { success: false, error: 'Wallet not connected' };
  }

  try {
    // Convert USD to ETH (simplified - in production, use a price oracle)
    // Assuming 1 ETH = $2000 for this example
    const ethAmount = amountInUSD / 2000;
    const weiAmount = Math.floor(ethAmount * 1e18);
    const hexAmount = '0x' + weiAmount.toString(16);

    console.log('Sending payment:', {
      from: fromAddress,
      to: PAYMENT_RECIPIENT,
      value: hexAmount,
      amountInETH: ethAmount,
      amountInUSD: amountInUSD
    });

    // Send transaction request to Coinbase Wallet
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: PAYMENT_RECIPIENT,
        value: hexAmount,
        gas: '0x5208', // 21000 gas for simple transfer
      }],
    });

    console.log('Transaction sent:', txHash);
    return { success: true, txHash };
  } catch (error: any) {
    console.error('Payment error:', error);
    
    if (error.code === 4001) {
      return { success: false, error: 'Transaction rejected by user' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Payment failed' 
    };
  }
}

export async function waitForTransaction(txHash: string): Promise<boolean> {
  if (!ethereum) return false;

  try {
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds

    while (!receipt && attempts < maxAttempts) {
      receipt = await ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      if (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    if (receipt && receipt.status === '0x1') {
      return true; // Transaction successful
    }

    return false;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return false;
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
