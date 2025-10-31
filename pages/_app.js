import { SessionProvider } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/router';
import '../src/app/globals.css';
import Header from '../src/components/Header';
import LoadingSpinner from '../src/components/LoadingSpinner';

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setRouteLoading(true);
    const handleDone = () => setRouteLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router.events]);

  return (
    <SessionProvider session={session}>
      <Header />
      <Suspense fallback={
        <div className="py-24 grid place-items-center">
          <LoadingSpinner size="lg" label="Loading..." />
        </div>
      }>
        <Component {...pageProps} />
      </Suspense>
      {routeLoading ? <FullScreenLoader /> : null}
    </SessionProvider>
  );
}
