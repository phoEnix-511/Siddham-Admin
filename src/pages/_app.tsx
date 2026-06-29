import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { CartProvider, useCart } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import MobileBottomNav from '@/components/MobileBottomNav';
import '@/styles/globals.css';

// Lightweight component to track active users without blocking rendering
function AnalyticsTracker() {
  const { totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Generate a session ID if not exists
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    const ping = () => {
      // Don't track admin pages to keep numbers accurate
      if (router.pathname.startsWith('/admin')) return;

      fetch('/api/analytics/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          path: router.asPath,
          cartCount: totalItems
        }),
      }).catch(() => {}); // silent fail if network issue
    };

    // Ping immediately and then every 60 seconds
    ping();
    const interval = setInterval(ping, 60000);

    return () => clearInterval(interval);
  }, [totalItems, router.asPath, router.pathname]);

  return null;
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <CartProvider>
          <AnalyticsTracker />
          <Component {...pageProps} />
          <MobileBottomNav />
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}