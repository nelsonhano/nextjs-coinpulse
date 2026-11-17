'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const getWebSocketUrl = (): string | null => {
  const wsUrl = process.env.NEXT_PUBLIC_COINGECKO_WEBSOCKET_URL;
  if (!wsUrl || (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://'))) {
    return null;
  }
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  if (apiKey && apiKey !== 'demo') {
    return `${wsUrl}?x_cg_pro_api_key=${apiKey}`;
  }
  return wsUrl;
};

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 60000;

export const useCoinGeckoWebSocket = ({
  coinId,
  poolId,
  liveInterval,
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const subscribed = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [isWsReady, setIsWsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  >(() => (getWebSocketUrl() ? 'connecting' : 'disconnected'));

  const connectRef = useRef<() => void>(() => {});

  const clearHeartbeatTimer = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const resetHeartbeatTimer = useCallback(() => {
    clearHeartbeatTimer();
    heartbeatTimeoutRef.current = setTimeout(() => {
      // If no message or heartbeat ping arrived in 60s, close stale connection to trigger reconnect
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    }, HEARTBEAT_TIMEOUT_MS);
  }, [clearHeartbeatTimer]);

  const connect = useCallback(() => {
    if (isManuallyClosedRef.current) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      return;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch {
      setTimeout(() => {
        setConnectionStatus('disconnected');
      }, 0);
      return;
    }

    const send = (payload: Record<string, unknown>) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    const handleMessage = (event: MessageEvent) => {
      resetHeartbeatTimer();

      try {
        const msg: WebSocketMessage = JSON.parse(event.data);

        if (msg.type === 'ping') {
          send({ type: 'pong' });
          return;
        }
        if (msg.type === 'confirm_subscription') {
          const { channel } = JSON.parse(msg?.identifier ?? '{}');
          if (channel) {
            subscribed.current.add(channel);
          }
        }
        if (msg.c === 'C1') {
          setPrice({
            usd: msg.p ?? 0,
            coin: msg.i,
            price: msg.p,
            change24h: msg.pp,
            marketCap: msg.m,
            volume24h: msg.v,
            timestamp: msg.t,
          });
        }
        if (msg.c === 'G2') {
          const newTrade: Trade = {
            price: msg.pu,
            value: msg.vo,
            timestamp: msg.t ?? 0,
            type: msg.ty,
            amount: msg.to,
          };

          setTrades((prev) => [newTrade, ...prev].slice(0, 7));
        }
        if (msg.ch === 'G3') {
          const timestamp = msg.t ?? 0;

          const candle: OHLCData = [
            timestamp,
            Number(msg.o ?? 0),
            Number(msg.h ?? 0),
            Number(msg.l ?? 0),
            Number(msg.c ?? 0),
          ];

          setOhlcv(candle);
        }
      } catch {
        // Ignore unparseable frames
      }
    };

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsWsReady(true);
      setConnectionStatus('connected');
      resetHeartbeatTimer();
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setIsWsReady(false);
      subscribed.current.clear();
      clearHeartbeatTimer();

      if (!isManuallyClosedRef.current) {
        setConnectionStatus('reconnecting');
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttemptsRef.current) +
            Math.random() * 500,
          MAX_RECONNECT_DELAY_MS,
        );
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), delay);
      } else {
        setConnectionStatus('disconnected');
      }
    };

    ws.onerror = () => {
      setIsWsReady(false);
      // Close socket to trigger onclose backoff logic
      try {
        ws.close();
      } catch {
        // Ignore close error
      }
    };
  }, [clearHeartbeatTimer, resetHeartbeatTimer]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearHeartbeatTimer();
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // Ignore close error
        }
      }
    };
  }, [connect, clearHeartbeatTimer]);

  useEffect(() => {
    if (!isWsReady) return;
    const ws = wsRef.current;
    if (!ws) return;

    const send = (payload: Record<string, unknown>) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    const unsubscribeAll = () => {
      subscribed.current.forEach((channel) => {
        send({
          command: 'unsubscribe',
          identifier: JSON.stringify({ channel }),
        });
      });

      subscribed.current.clear();
    };

    const subscribe = (channel: string, data?: Record<string, unknown>) => {
      if (subscribed.current.has(channel)) return;

      send({ command: 'subscribe', identifier: JSON.stringify({ channel }) });

      if (data) {
        send({
          command: 'message',
          identifier: JSON.stringify({ channel }),
          data: JSON.stringify(data),
        });
      }
    };

    queueMicrotask(() => {
      unsubscribeAll();
      subscribe('CGSimplePrice', { coin_id: [coinId], action: 'set_tokens' });
    });

    const poolAddress = poolId ? poolId.replace('_', ':') : '';

    if (poolAddress) {
      subscribe('OnchainTrade', {
        'network_id:pool_addresses': [poolAddress],
        action: 'set_pools',
      });

      subscribe('OnchainOHLCV', {
        'network_id:pool_addresses': [poolAddress],
        interval: liveInterval,
        action: 'set_pools',
      });
    }
  }, [coinId, poolId, isWsReady, liveInterval]);

  return {
    price,
    trades,
    ohlcv,
    isConnected: isWsReady,
    connectionStatus,
  };
};
