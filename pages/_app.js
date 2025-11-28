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

  const dashboardRoots = ['/dashboard', '/admin', '/staff', '/student', '/portal'];
  const shouldShowHeader = !dashboardRoots.some((p) =>
    router.pathname === p || router.pathname.startsWith(`${p}/`)
  );

  return (
    <SessionProvider session={session}>
      {shouldShowHeader && <Header />}
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
