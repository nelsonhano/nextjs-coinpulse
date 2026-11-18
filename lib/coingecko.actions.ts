'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Could not get base url');

interface CacheRecord<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheRecord<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

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

  const now = Date.now();
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY && API_KEY !== 'demo') {
    if (cleanBaseUrl.includes('pro-api.coingecko.com')) {
      headers['x-cg-pro-api-key'] = API_KEY;
    } else {
      headers['x-cg-demo-api-key'] = API_KEY;
    }
  }

  const fetchPromise = (async () => {
    try {
      let retries = 0;
      const MAX_RETRIES = 2;

      while (retries <= MAX_RETRIES) {
        const response = await fetch(url, {
          headers,
          next: { revalidate },
        });

        if (response.status === 429 && retries < MAX_RETRIES) {
          retries += 1;
          const retryAfter = response.headers.get('retry-after');
          const delayMs = retryAfter
            ? Math.max(Number(retryAfter) * 1000, 1000)
            : 1000 * Math.pow(1.5, retries) + Math.random() * 400;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (!response.ok) {
          const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));
          const errorMsg = `API Error: ${response.status}: ${errorBody.error || response.statusText}`;

          if (cached && (response.status === 429 || response.status >= 500)) {
            console.warn(`Returning stale cache for ${url} due to API status ${response.status}`);
            return cached.data as T;
          }

          const err = new Error(errorMsg) as Error & { status: number };
          err.status = response.status;
          throw err;
        }

        const data: T = await response.json();
        memoryCache.set(url, {
          data,
          expiresAt: Date.now() + Math.max(revalidate, 30) * 1000,
        });

        return data;
      }

      if (cached) {
        console.warn(`Returning stale cache for ${url} after exhausting rate limit retries.`);
        return cached.data as T;
      }

      const rateLimitErr = new Error(
        'API Error: 429: Too Many Requests (CoinGecko rate limit exceeded)',
      ) as Error & { status: number };
      rateLimitErr.status = 429;
      throw rateLimitErr;
    } catch (err) {
      if (cached) {
        console.warn(`Returning stale cache for ${url} following network error:`, err);
        return cached.data as T;
      }
      throw err;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise as Promise<T>;
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
