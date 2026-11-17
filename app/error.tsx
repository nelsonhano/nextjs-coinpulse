'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="main-container flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-dark-500/80 border border-purple-100/10 rounded-2xl p-8 sm:p-12 max-w-lg shadow-2xl">
        <h1 className="text-4xl font-bold text-red-400 mb-3">Something Went Wrong</h1>
        <p className="text-purple-100/70 mb-2 text-sm sm:text-base">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <p className="text-purple-100/40 text-xs mb-6">
          The CoinGecko API may be temporarily rate limited or unreachable.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-dark-400 hover:bg-dark-400/80 text-purple-100 font-medium transition border border-purple-100/10"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
