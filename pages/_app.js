import { SessionProvider } from 'next-auth/react';
import '../src/app/globals.css';
import Header from '../src/components/Header';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
