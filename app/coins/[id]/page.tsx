import React from 'react';
import { fetcher, getPools } from '@/lib/coingecko.actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import LiveDataWrapper from '@/components/LiveDataWrapper';
import Converter from '@/components/Converter';

const Page = async ({ params }: NextPageProps) => {
  const { id } = await params;

  let coinData: CoinDetailsData | null = null;
  let coinOHLCData: OHLCData[] = [];

  try {
    const [fetchedCoin, fetchedOHLC] = await Promise.all([
      fetcher<CoinDetailsData>(`/coins/${id}`, {
        dex_pair_format: 'contract_address',
      }),
      fetcher<OHLCData[]>(`/coins/${id}/ohlc`, {
        vs_currency: 'usd',
        days: 1,
        precision: 'full',
      }),
    ]);
    coinData = fetchedCoin;
    coinOHLCData = Array.isArray(fetchedOHLC) ? fetchedOHLC : [];
  } catch (error) {
    console.error(`Failed to fetch coin ${id}:`, error);
  }

  if (!coinData) {
    notFound();
  }

  const platform = coinData.asset_platform_id
    ? coinData.detail_platforms?.[coinData.asset_platform_id]
    : null;
  const network = platform?.geckoterminal_url?.split('/')[3] || null;
  const contractAddress = platform?.contract_address || null;

  const pool = await getPools(id, network, contractAddress);

  const coinDetails = [
    {
      label: 'Market Cap',
      value: formatCurrency(coinData.market_data?.market_cap?.usd),
    },
    {
      label: 'Market Cap Rank',
      value: `# ${coinData.market_cap_rank ?? '-'}`,
    },
    {
      label: 'Total Volume',
      value: formatCurrency(coinData.market_data?.total_volume?.usd),
    },
    {
      label: 'Website',
      value: '-',
      link: coinData.links?.homepage?.[0] || undefined,
      linkText: 'Homepage',
    },
    {
      label: 'Explorer',
      value: '-',
      link: coinData.links?.blockchain_site?.[0] || undefined,
      linkText: 'Explorer',
    },
    {
      label: 'Community',
      value: '-',
      link: coinData.links?.subreddit_url || undefined,
      linkText: 'Community',
    },
  ];

  return (
    <main id="coin-details-page">
      <section className="primary">
        <LiveDataWrapper coinId={id} poolId={pool.id} coin={coinData} coinOHLCData={coinOHLCData}>
          <h4>Exchange Listings</h4>
        </LiveDataWrapper>
      </section>

      <section className="secondary">
        <Converter
          symbol={coinData.symbol}
          icon={coinData.image?.small || coinData.image?.large || '/logo.svg'}
          priceList={coinData.market_data?.current_price ?? { usd: 0 }}
        />

        <div className="details">
          <h4>Coin Details</h4>

          <ul className="details-grid">
            {coinDetails.map(({ label, value, link, linkText }, index) => (
              <li key={index}>
                <p className={label}>{label}</p>

                {link ? (
                  <div className="link">
                    <Link href={link} target="_blank">
                      {linkText || label}
                    </Link>
                    <ArrowUpRight size={16} />
                  </div>
                ) : (
                  <p className="text-base font-medium">{value}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
export default Page;
