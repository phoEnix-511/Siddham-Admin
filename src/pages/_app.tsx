import type { AppProps } from 'next/app';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </ToastProvider>
  );
}
