import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portal');
  }, [router]);
  return null;
}
