'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import CandlestickChart from '@/components/CandlestickChart';
import { useCoinGeckoWebSocket } from '@/hooks/useCoinGeckoWebSocket';
import DataTable from '@/components/DataTable';
import { formatCurrency, timeAgo } from '@/lib/utils';
import CoinHeader from '@/components/CoinHeader';
import { ArrowUpRight } from 'lucide-react';

const LiveDataWrapper = ({ children, coinId, poolId, coin, coinOHLCData }: LiveDataProps) => {
  const [liveInterval, setLiveInterval] = useState<'1s' | '1m'>('1s');
  const { trades, ohlcv, price, connectionStatus } = useCoinGeckoWebSocket({
    coinId,
    poolId,
    liveInterval,
  });

  const tradeColumns: DataTableColumn<Trade>[] = [
    {
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (trade) => (trade.price ? formatCurrency(trade.price) : '-'),
    },
    {
      header: 'Amount',
      cellClassName: 'amount-cell',
      cell: (trade) => trade.amount?.toFixed(4) ?? '-',
    },
    {
      header: 'Value',
      cellClassName: 'value-cell',
      cell: (trade) => (trade.value ? formatCurrency(trade.value) : '-'),
    },
    {
      header: 'Buy/Sell',
      cellClassName: 'type-cell',
      cell: (trade) => (
        <span className={trade.type === 'b' ? 'text-green-500' : 'text-red-500'}>
          {trade.type === 'b' ? 'Buy' : 'Sell'}
        </span>
      ),
    },
    {
      header: 'Time',
      cellClassName: 'time-cell',
      cell: (trade) => (trade.timestamp ? timeAgo(trade.timestamp) : '-'),
    },
  ];

  const tickerColumns: DataTableColumn<Ticker>[] = [
    {
      header: 'Exchange',
      cellClassName: 'price-cell',
      cell: (ticker) => ticker.market?.name ?? '-',
    },
    {
      header: 'Pair',
      cellClassName: 'amount-cell',
      cell: (ticker) => `${ticker.base}/${ticker.target}`,
    },
    {
      header: 'Price',
      cellClassName: 'value-cell',
      cell: (ticker) =>
        ticker.converted_last?.usd ? formatCurrency(ticker.converted_last.usd) : '-',
    },
    {
      header: 'Trade',
      cellClassName: 'time-cell',
      cell: (ticker) =>
        ticker.trade_url ? (
          <a
            href={ticker.trade_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline inline-flex items-center gap-1"
          >
            Trade <ArrowUpRight size={14} />
          </a>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <section id="live-data-wrapper">
      <CoinHeader
        name={coin.name}
        image={coin.image?.large || '/logo.svg'}
        livePrice={price?.usd ?? coin.market_data?.current_price?.usd ?? 0}
        livePriceChangePercentage24h={
          price?.change24h ?? coin.market_data?.price_change_percentage_24h_in_currency?.usd ?? 0
        }
        priceChangePercentage30d={
          coin.market_data?.price_change_percentage_30d_in_currency?.usd ?? 0
        }
        priceChange24h={coin.market_data?.price_change_24h_in_currency?.usd ?? 0}
        connectionStatus={connectionStatus}
      />
      <Separator className="divider" />

      <div className="trend">
        <CandlestickChart
          coinId={coinId}
          data={coinOHLCData}
          liveOhlcv={ohlcv}
          mode="live"
          initialPeriod="daily"
          liveInterval={liveInterval}
          setLiveInterval={setLiveInterval}
        >
          <h4>Trend Overview</h4>
        </CandlestickChart>
      </div>

      <Separator className="divider" />

      <div className="trades">
        <h4>Recent Trades</h4>

        <DataTable
          columns={tradeColumns}
          data={trades}
          rowKey={(_, index) => index}
          tableClassName="trades-table"
        />
      </div>

      {coin.tickers && coin.tickers.length > 0 && (
        <>
          <Separator className="divider" />
          <div className="trades">
            {children || <h4>Exchange Listings</h4>}

            <DataTable
              columns={tickerColumns}
              data={coin.tickers.slice(0, 5)}
              rowKey={(ticker, index) => `${ticker.market?.name || 'market'}-${index}`}
              tableClassName="trades-table"
            />
          </div>
        </>
      )}
    </section>
  );
};

export default LiveDataWrapper;
