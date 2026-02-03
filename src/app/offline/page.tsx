'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re back online!
          </h1>
          <p className="text-gray-600 mb-6">
            Your connection has been restored. Click below to continue shopping.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-24 h-24 mx-auto mb-6">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Cloud */}
            <path
              d="M75 45c0-11-9-20-20-20-9 0-16 6-19 14-7 1-13 8-13 16 0 9 7 16 16 16h33c7 0 13-6 13-13 0-6-4-11-10-13z"
              fill="#E5E7EB"
              stroke="#9CA3AF"
              strokeWidth="2"
            />
            {/* X mark */}
            <circle cx="50" cy="50" r="18" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
            <path
              d="M42 42l16 16M58 42L42 58"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can
          still browse some of our previously viewed products.
        </p>

        {/* MegaMart UK Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-green-600">MegaMart UK</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <Link
            href="/"
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Homepage
          </Link>
        </div>

        {/* Helpful Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
          <h2 className="font-semibold text-blue-900 mb-2">Tips while offline:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Check your Wi-Fi or mobile data connection
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Your cart items are saved and will sync when you reconnect
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              Previously viewed products may still be available offline
            </li>
          </ul>
        </div>

        {/* Connection Status Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Waiting for connection...
        </div>
      </div>
    </div>
  );
}
