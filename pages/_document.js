import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and icons */}
        <link rel="icon" href="/icon" type="image/png" />
        <link rel="apple-touch-icon" href="/icon" />
        {/* Optional: Windows/Android coloring */}
        <meta name="theme-color" content="#0f172a" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
