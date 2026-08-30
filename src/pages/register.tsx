import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login?mode=register');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );
}
