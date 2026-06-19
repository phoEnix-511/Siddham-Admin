import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
