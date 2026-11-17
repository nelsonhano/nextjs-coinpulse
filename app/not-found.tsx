import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="main-container flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-dark-500/80 border border-purple-100/10 rounded-2xl p-8 sm:p-12 max-w-lg shadow-2xl">
        <h1 className="text-6xl sm:text-7xl font-extrabold text-purple-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Coin or Page Not Found</h2>
        <p className="text-purple-100/60 mb-6 text-sm sm:text-base">
          The coin or page you are looking for does not exist, or the CoinGecko API could not find
          it.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition"
          >
            Home
          </Link>
          <Link
            href="/coins"
            className="px-5 py-2.5 rounded-lg bg-dark-400 hover:bg-dark-400/80 text-purple-100 font-medium transition border border-purple-100/10"
          >
            Browse All Coins
          </Link>
        </div>
      </div>
    </main>
  );
}
