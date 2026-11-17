'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Could not get base url');

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const cleanBaseUrl = BASE_URL!.replace(/\/+$/, '');

  const url = qs.stringifyUrl(
    {
      url: `${cleanBaseUrl}/${cleanEndpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY && API_KEY !== 'demo') {
    if (cleanBaseUrl.includes('pro-api.coingecko.com')) {
      headers['x-cg-pro-api-key'] = API_KEY;
    } else {
      headers['x-cg-demo-api-key'] = API_KEY;
    }
  }

  const response = await fetch(url, {
    headers,
    next: { revalidate },
  });

  if (!response.ok) {
    const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));

    throw new Error(`API Error: ${response.status}: ${errorBody.error || response.statusText} `);
  }

  return response.json();
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: '',
    address: '',
    name: '',
    network: '',
  };

  if (network && contractAddress) {
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      return poolData.data?.[0] ?? fallback;
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>('/onchain/search/pools', { query: id });

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}
