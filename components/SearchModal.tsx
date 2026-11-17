'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Loader2, X } from 'lucide-react';
import { fetcher } from '@/lib/coingecko.actions';

const SearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchCoin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) {
            setQuery('');
            setResults([]);
          }
          return !prev;
        });
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await fetcher<{ coins: SearchCoin[] }>('/search', { query: trimmed });
        if (isMounted) {
          setResults(data.coins?.slice(0, 8) || []);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setIsLoading(false);
    }
  };

  const handleSelect = (coinId: string) => {
    handleClose();
    router.push(`/coins/${coinId}`);
  };

  return (
    <div id="search-modal">
      <button
        type="button"
        className="trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Search coins"
      >
        <Search size={18} />
        <span>Search</span>
        <kbd className="kbd">Ctrl K</kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 bg-black/60 backdrop-blur-xs p-4"
          onClick={handleClose}
        >
          <div
            className="dialog w-full rounded-xl border border-purple-100/10 overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-input flex items-center px-4 py-3 border-b border-purple-100/10">
              <Search className="text-purple-100/60 mr-3" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search coins by name or symbol..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full bg-transparent text-purple-100 outline-none text-base font-medium placeholder:text-purple-100/40"
              />
              {isLoading ? (
                <Loader2 className="animate-spin text-purple-100/60 ml-2" size={18} />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="text-purple-100/60 hover:text-purple-100"
                >
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <div className="list custom-scrollbar overflow-y-auto max-h-96 p-2">
              {results.length > 0 ? (
                <div className="group">
                  <div className="heading px-3 py-2 text-xs font-semibold uppercase tracking-wider text-purple-100/60">
                    Coins
                  </div>
                  {results.map((coin) => (
                    <div
                      key={coin.id}
                      className="search-item px-3 rounded-lg"
                      onClick={() => handleSelect(coin.id)}
                    >
                      <div className="coin-info">
                        <Image
                          src={coin.thumb || coin.large || '/logo.svg'}
                          alt={coin.name}
                          width={32}
                          height={32}
                        />
                        <div>
                          <p className="font-medium text-white">{coin.name}</p>
                          <span className="coin-symbol">{coin.symbol}</span>
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        {coin.market_cap_rank ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-dark-400 text-purple-100/70">
                            Rank #{coin.market_cap_rank}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : query && !isLoading ? (
                <div className="empty">No coins found for &quot;{query}&quot;</div>
              ) : (
                <div className="empty">Type a coin name or symbol to search</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchModal;
