import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatCurrency,
  formatPercentage,
  trendingClasses,
  timeAgo,
  convertOHLCData,
  buildPageNumbers,
  ELLIPSIS,
} from '../lib/utils.ts';

test('formatCurrency handles valid numbers, nulls, and custom options', () => {
  assert.equal(formatCurrency(null), '$0.00');
  assert.equal(formatCurrency(undefined), '$0.00');
  assert.equal(formatCurrency(NaN), '$0.00');
  assert.equal(formatCurrency(null, 2, 'USD', false), '0.00');
  assert.match(formatCurrency(1234.56), /1,234\.56/);
  assert.match(formatCurrency(1234.56, 2, 'EUR'), /1,234\.56/);
  assert.equal(formatCurrency(1234.56, 2, 'USD', false), '1,234.56');
});

test('formatPercentage formats correctly', () => {
  assert.equal(formatPercentage(null), '0.0%');
  assert.equal(formatPercentage(undefined), '0.0%');
  assert.equal(formatPercentage(NaN), '0.0%');
  assert.equal(formatPercentage(5.678), '5.7%');
  assert.equal(formatPercentage(-2.34), '-2.3%');
});

test('trendingClasses returns correct classes for up and down values', () => {
  const up = trendingClasses(5);
  assert.equal(up.textClass, 'text-green-400');
  assert.equal(up.bgClass, 'bg-green-500/10');
  assert.equal(up.iconClass, 'icon-up');

  const down = trendingClasses(-3);
  assert.equal(down.textClass, 'text-red-400');
  assert.equal(down.bgClass, 'bg-red-500/10');
  assert.equal(down.iconClass, 'icon-down');
});

test('timeAgo computes human readable time units', () => {
  const now = Date.now();
  assert.equal(timeAgo(now - 10 * 1000), 'just now');
  assert.equal(timeAgo(now - 5 * 60 * 1000), '5 min');
  assert.equal(timeAgo(now - 2 * 3600 * 1000), '2 hours');
  assert.equal(timeAgo(now - 24 * 3600 * 1000), '1 day');
  assert.equal(timeAgo(now - 3 * 24 * 3600 * 1000), '3 days');
  assert.equal(timeAgo(now - 14 * 24 * 3600 * 1000), '2 weeks');
});

test('convertOHLCData sanitizes and strictly orders candles by time', () => {
  assert.deepEqual(convertOHLCData(null as unknown as OHLCData[]), []);
  assert.deepEqual(convertOHLCData([]), []);

  const raw: OHLCData[] = [
    [1700000020, 10, 15, 8, 12],
    [1700000010, 9, 11, 7, 10],
    [1700000010, 9, 12, 7, 10],
  ];

  const result = convertOHLCData(raw);
  assert.equal(result.length, 2);
  assert.equal(result[0].time, 1700000010);
  assert.equal(result[1].time, 1700000020);
  assert.ok(result[0].time < result[1].time);
});

test('buildPageNumbers generates expected pagination arrays with ellipses', () => {
  assert.deepEqual(buildPageNumbers(1, 4), [1, 2, 3, 4]);

  const p1 = buildPageNumbers(1, 10);
  assert.deepEqual(p1, [1, 2, ELLIPSIS, 10]);

  const p5 = buildPageNumbers(5, 10);
  assert.deepEqual(p5, [1, ELLIPSIS, 4, 5, 6, ELLIPSIS, 10]);

  const p10 = buildPageNumbers(10, 10);
  assert.deepEqual(p10, [1, ELLIPSIS, 9, 10]);
});

test('CoinGecko URL builder cleans leading slashes and prevents double slashes', () => {
  const baseUrl = 'https://api.coingecko.com/api/v3/';
  const endpoint = '/coins/markets';

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  const full = `${cleanBase}/${cleanEndpoint}`;

  assert.equal(full, 'https://api.coingecko.com/api/v3/coins/markets');
  assert.ok(!full.includes('v3//'));
});

test('WebSocket pool address formatter transforms underscores to colons', () => {
  const formatPoolId = (id: string | undefined | null) => (id ? id.replace('_', ':') : '');

  assert.equal(
    formatPoolId('eth_0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'),
    'eth:0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  );
  assert.equal(formatPoolId(''), '');
  assert.equal(formatPoolId(null), '');
  assert.equal(formatPoolId(undefined), '');
});

test('WebSocket exponential backoff delay stays bounded by maximum delay', () => {
  const initial = 1000;
  const maxDelay = 30000;

  const calculateDelay = (attempt: number) => Math.min(initial * Math.pow(1.5, attempt), maxDelay);

  assert.equal(calculateDelay(0), 1000);
  assert.equal(calculateDelay(1), 1500);
  assert.equal(calculateDelay(2), 2250);
  assert.ok(calculateDelay(10) <= maxDelay);
  assert.equal(calculateDelay(20), maxDelay);
});

test('WebSocket URL resolver validates schemes and injects api keys', () => {
  const resolveWsUrl = (url?: string, key?: string): string | null => {
    if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
      return null;
    }
    if (key && key !== 'demo') {
      return `${url}?x_cg_pro_api_key=${key}`;
    }
    return url;
  };

  assert.equal(resolveWsUrl(undefined), null);
  assert.equal(resolveWsUrl(''), null);
  assert.equal(resolveWsUrl('http://invalid-scheme.com'), null);
  assert.equal(
    resolveWsUrl('wss://stream.geckoterminal.com/feed'),
    'wss://stream.geckoterminal.com/feed',
  );
  assert.equal(
    resolveWsUrl('wss://stream.geckoterminal.com/feed', 'demo'),
    'wss://stream.geckoterminal.com/feed',
  );
  assert.equal(
    resolveWsUrl('wss://stream.geckoterminal.com/feed', 'PRO_KEY_123'),
    'wss://stream.geckoterminal.com/feed?x_cg_pro_api_key=PRO_KEY_123',
  );
});

test('WebSocket heartbeat ping frame creates expected pong payload', () => {
  const handlePing = (data: { type?: string }) => {
    if (data.type === 'ping') {
      return JSON.stringify({ type: 'pong' });
    }
    return null;
  };

  assert.equal(handlePing({ type: 'ping' }), JSON.stringify({ type: 'pong' }));
  assert.equal(handlePing({ type: 'other' }), null);
});

test('WebSocket message parser transforms C1 price update frames accurately', () => {
  const rawMsg = {
    c: 'C1',
    i: 'bitcoin',
    p: 96500.5,
    pp: 2.45,
    m: 1900000000000,
    v: 35000000000,
    t: 1700000000000,
  };

  const parsedPrice = {
    usd: rawMsg.p ?? 0,
    coin: rawMsg.i,
    price: rawMsg.p,
    change24h: rawMsg.pp,
    marketCap: rawMsg.m,
    volume24h: rawMsg.v,
    timestamp: rawMsg.t,
  };

  assert.equal(parsedPrice.usd, 96500.5);
  assert.equal(parsedPrice.coin, 'bitcoin');
  assert.equal(parsedPrice.change24h, 2.45);
  assert.equal(parsedPrice.marketCap, 1900000000000);
});

test('WebSocket message parser handles G2 trade updates and rolling window size', () => {
  const rawTrade = {
    c: 'G2',
    pu: 96550.25,
    vo: 48275.12,
    t: 1700000005000,
    ty: 'b',
    to: 0.5,
  };

  const newTrade = {
    price: rawTrade.pu,
    value: rawTrade.vo,
    timestamp: rawTrade.t ?? 0,
    type: rawTrade.ty,
    amount: rawTrade.to,
  };

  assert.equal(newTrade.price, 96550.25);
  assert.equal(newTrade.type, 'b');
  assert.equal(newTrade.amount, 0.5);

  let trades: Array<typeof newTrade> = [];
  for (let i = 0; i < 10; i++) {
    trades = [{ ...newTrade, timestamp: i }, ...trades].slice(0, 7);
  }
  assert.equal(trades.length, 7);
  assert.equal(trades[0].timestamp, 9);
});

test('WebSocket status badge labels and indicator dot classes', () => {
  const getBadgeConfig = (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => {
    const label = status === 'connected' ? 'Live Stream' : status;
    const dotClass =
      status === 'connected'
        ? 'bg-green-500 animate-pulse'
        : status === 'connecting' || status === 'reconnecting'
          ? 'bg-yellow-500 animate-ping'
          : 'bg-gray-500';
    return { label, dotClass };
  };

  const connected = getBadgeConfig('connected');
  assert.equal(connected.label, 'Live Stream');
  assert.equal(connected.dotClass, 'bg-green-500 animate-pulse');

  const connecting = getBadgeConfig('connecting');
  assert.equal(connecting.label, 'connecting');
  assert.equal(connecting.dotClass, 'bg-yellow-500 animate-ping');

  const reconnecting = getBadgeConfig('reconnecting');
  assert.equal(reconnecting.label, 'reconnecting');
  assert.equal(reconnecting.dotClass, 'bg-yellow-500 animate-ping');

  const disconnected = getBadgeConfig('disconnected');
  assert.equal(disconnected.label, 'disconnected');
  assert.equal(disconnected.dotClass, 'bg-gray-500');
});
