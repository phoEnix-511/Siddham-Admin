import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SessionProvider, useSession } from 'next-auth/react';
import { CartProvider, useCart } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import MobileBottomNav from '@/components/MobileBottomNav';
import { VercelToolbar } from '@vercel/toolbar/next';
import '@/styles/globals.css';

const SITE_URL = 'https://www.siddhamwellness.com';
const OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() as any;
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.forcePasswordReset) {
      if (router.pathname !== '/change-password') {
        router.replace('/change-password');
      }
    }
  }, [session, status, router]);

  if (status === 'authenticated' && session?.user?.forcePasswordReset && router.pathname !== '/change-password') {
    return null; // Don't render protected app content while redirecting
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const shouldShowToolbar = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  const router = useRouter();
  // Individual pages set their own <title> — this is just a safe global fallback
  const pageDescription = 'Shop authentic Ayurvedic wellness products, herbal supplements, hair care, and skincare with Siddham Wellness.';
  // For canonical: strip query strings from shop/search pages to prevent duplicate indexing
  const canonicalPath = router.pathname.startsWith('/shop') ? router.pathname : router.asPath.split('?')[0];

  return (
    <SessionProvider session={session}>
      <Head>
        <title>Siddham Wellness | Authentic Ayurvedic Products</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="ayurvedic, wellness, herbal supplements, hair care, skin care, siddham wellness" />
        <meta name="robots" content="index,follow" />
        <meta name="format-detection" content="telephone=no" />
        {/* Open Graph */}
        <meta property="og:site_name" content="Siddham Wellness" />
        <meta property="og:title" content="Siddham Wellness | Authentic Ayurvedic Products" />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}${canonicalPath}`} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Siddham Wellness | Authentic Ayurvedic Products" />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <link rel="canonical" href={`${SITE_URL}${canonicalPath}`} />
      </Head>
      <ToastProvider>
        <SettingsProvider>
          <CartProvider>
            <AnalyticsTracker />
            <AuthGuard>
              <Component {...pageProps} />
            </AuthGuard>
            <MobileBottomNav />
            {shouldShowToolbar && <VercelToolbar />}
          </CartProvider>
        </SettingsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}