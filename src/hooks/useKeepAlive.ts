'use client';

import { useEffect } from 'react';

/**
 * Hook to ping the /api/ping endpoint every 25 seconds to keep the connection alive.
 * Includes proper cleanup on unmount.
 */
export function useKeepAlive() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/ping').catch(() => {
        // Ignore errors for keep-alive pings
      });
    };

    // Initial ping
    ping();

    const interval = setInterval(ping, 25000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);
}
