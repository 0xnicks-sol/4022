'use client';

import { useState } from 'react';
import Image from 'next/image';
import { connectWallet, switchToBaseSepolia, formatAddress, sendPayment, waitForTransaction } from './utils/wallet';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);
    
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      // Switch to Base Sepolia network
      await switchToBaseSepolia();
    }
    
    setLoading(false);
  };

  const handleFetchPaidContent = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponseData(null);
    setTxHash(null);
    setPaymentStatus('');

    try {
      // Step 1: Send payment transaction to wallet
      setPaymentStatus('🔄 Requesting payment confirmation from your wallet...');
      const paymentResult = await sendPayment(walletAddress, 0.01);

      if (!paymentResult.success) {
        setError(paymentResult.error || 'Payment failed');
        setLoading(false);
        setPaymentStatus('');
        return;
      }

      setTxHash(paymentResult.txHash || null);
      setPaymentStatus(`✅ Transaction sent! Hash: ${paymentResult.txHash?.slice(0, 10)}...`);

      // Step 2: Wait for transaction confirmation
      setPaymentStatus('⏳ Waiting for transaction confirmation...');
      const confirmed = await waitForTransaction(paymentResult.txHash!);

      if (!confirmed) {
        setError('Transaction failed or timed out');
        setLoading(false);
        setPaymentStatus('');
        return;
      }

      setPaymentStatus('✅ Payment confirmed! Fetching content...');

      // Step 3: Fetch the paid content from API
      const response = await fetch('http://localhost:3001/api/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Transaction-Hash': paymentResult.txHash || '',
        },
      });

      if (response.status === 402) {
        // Payment required
        const paymentInfo = await response.json();
        setError(`Payment Required: ${JSON.stringify(paymentInfo, null, 2)}`);
      } else if (response.ok) {
        const data = await response.json();
        setResponseData(data);
        setPaymentStatus('🎉 Success! Content unlocked.');
      } else {
        setError(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message}`);
      setPaymentStatus('');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans dark:from-gray-900 dark:via-black dark:to-purple-950">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center gap-8 py-16 px-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={24}
            priority
          />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            x402 Payment Gateway
          </h1>
          <p className="max-w-lg text-lg text-gray-600 dark:text-gray-400">
            Connect your Coinbase Wallet and make payments to access premium content via the x402 protocol
          </p>
        </div>

        {/* Wallet Connection Card */}
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Wallet Connection
              </h2>
              {walletAddress && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  Connected
                </span>
              )}
            </div>

            {walletAddress ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Address</p>
                  <p className="font-mono text-lg font-medium text-gray-900 dark:text-white">
                    {formatAddress(walletAddress)}
                  </p>
                </div>
                
                <button
                  onClick={handleFetchPaidContent}
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Pay $0.01 & Fetch Content
                    </>
                  )}
                </button>

                {/* Payment Status */}
                {paymentStatus && (
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      {paymentStatus}
                    </p>
                  </div>
                )}

                {/* Transaction Hash */}
                {txHash && (
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Transaction Hash</p>
                    <a 
                      href={`https://sepolia.basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {txHash.slice(0, 20)}...{txHash.slice(-20)}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-gray-900 dark:border-t-transparent"></span>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Response Display */}
        {(responseData || error) && (
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {error ? 'Error' : 'Response'}
            </h3>
            <div className={`rounded-lg p-4 font-mono text-sm ${
              error 
                ? 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200' 
                : 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200'
            }`}>
              <pre className="whitespace-pre-wrap break-words">
                {error || JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="w-full max-w-xl rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-200">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex gap-2">
              <span>1.</span>
              <span>Connect your Coinbase Wallet</span>
            </li>
            <li className="flex gap-2">
              <span>2.</span>
              <span>Switch to Base Sepolia testnet</span>
            </li>
            <li className="flex gap-2">
              <span>3.</span>
              <span>Click "Fetch Paid Content" to initiate payment</span>
            </li>
            <li className="flex gap-2">
              <span>4.</span>
              <span>Complete the $0.01 payment via x402 protocol</span>
            </li>
            <li className="flex gap-2">
              <span>5.</span>
              <span>Access premium content after successful payment</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
