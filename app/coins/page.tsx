import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import Link from 'next/link';

import { cn, formatPercentage, formatCurrency } from '@/lib/utils';
import DataTable from '@/components/DataTable';
import CoinsPagination from '@/components/CoinsPagination';

const Coins = async ({ searchParams }: NextPageProps) => {
  const { page } = await searchParams;

  const currentPage = Number(page) || 1;
  const perPage = 10;

  let coinsData: CoinMarketData[] = [];
  let errorMsg: string | null = null;

  try {
    const data = await fetcher<CoinMarketData[]>('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: perPage,
      page: currentPage,
      sparkline: 'false',
      price_change_percentage: '24h',
    });
    coinsData = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Error fetching coins:', err);
    errorMsg = err instanceof Error ? err.message : 'Failed to fetch coin market data.';
  }

  const columns: DataTableColumn<CoinMarketData>[] = [
    {
      header: 'Rank',
      cellClassName: 'rank-cell',
      cell: (coin) => (
        <>
          #{coin.market_cap_rank ?? '-'}
          <Link href={`/coins/${coin.id}`} aria-label={`View ${coin.name}`} />
        </>
      ),
    },
    {
      header: 'Token',
      cellClassName: 'token-cell',
      cell: (coin) => (
        <div className="token-info">
          <Image src={coin.image} alt={coin.name} width={36} height={36} />
          <p>
            {coin.name} ({coin.symbol.toUpperCase()})
          </p>
        </div>
      ),
    },
    {
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (coin) => formatCurrency(coin.current_price),
    },
    {
      header: '24h Change',
      cellClassName: 'change-cell',
      cell: (coin) => {
        const change = coin.price_change_percentage_24h ?? 0;
        const isTrendingUp = change > 0;

        return (
          <span
            className={cn('change-value', {
              'text-green-600': isTrendingUp,
              'text-red-500': !isTrendingUp,
            })}
          >
            {isTrendingUp && '+'}
            {formatPercentage(coin.price_change_percentage_24h)}
          </span>
        );
      },
    },
    {
      header: 'Market Cap',
      cellClassName: 'market-cap-cell',
      cell: (coin) => formatCurrency(coin.market_cap),
    },
  ];

  const hasMorePages = coinsData.length === perPage;

  const estimatedTotalPages = currentPage >= 100 ? Math.ceil(currentPage / 100) * 100 + 100 : 100;

  return (
    <main id="coins-page">
      <div className="content">
        <h4>All Coins</h4>

        {errorMsg ? (
          <div className="py-12 text-center text-purple-100/70">
            <p className="text-lg font-medium">{errorMsg}</p>
            <p className="text-sm mt-2 text-purple-100/40">
              CoinGecko API might be rate limited. Please refresh in a moment.
            </p>
          </div>
        ) : (
          <>
            <DataTable
              tableClassName="coins-table"
              columns={columns}
              data={coinsData}
              rowKey={(coin) => coin.id}
            />

            <CoinsPagination
              currentPage={currentPage}
              totalPages={estimatedTotalPages}
              hasMorePages={hasMorePages}
            />
          </>
        )}
      </div>
    </main>
  );
};

export default Coins;
