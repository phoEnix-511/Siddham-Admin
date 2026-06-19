import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#18181b" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="description" content="Siddham Wellness - Premium Ayurvedic products rooted in ancient wisdom. Shop our range of herbal shampoos, supplements, and natural skincare." />
        <meta property="og:title" content="Siddham Wellness - Ancient Wisdom, Modern Wellness" />
        <meta property="og:description" content="Premium Ayurvedic products crafted with pure ingredients for holistic wellbeing." />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
