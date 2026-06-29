import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { callbackUrl = '/', error } = router.query;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Redirect if already signed in
  useEffect(() => {
    if (status === 'authenticated') router.push(callbackUrl as string);
  }, [status, router, callbackUrl]);

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked: 'This email is already registered with a different method. Please sign in with email/password.',
    CredentialsSignin: 'Invalid email or password.',
    default: 'Something went wrong. Please try again.',
  };

  const authError = error ? (errorMessages[error as string] || errorMessages.default) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    if (mode === 'register') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        setMsg({ type: 'success', text: 'Account created! Signing you in...' });
        // Auto sign in after register
        await signIn('credentials', { email: form.email, password: form.password, callbackUrl: callbackUrl as string });
      } catch (err: unknown) {
        setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Registration failed' });
      } finally {
        setLoading(false);
      }
    } else {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setMsg({ type: 'error', text: errorMessages[result.error] || errorMessages.default });
      } else {
        router.push(callbackUrl as string);
      }
    }
  };

  if (status === 'loading') {
    return <div className="auth-loading"><div className="spinner" /></div>;
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Sign In' : 'Create Account'} — Siddham Wellness</title>
        <meta name="description" content="Sign in to your Siddham Wellness account to track orders and save addresses." />
      </Head>

      <div className="auth-page">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="auth-logo-emoji">🌿</span>
            <h1 className="auth-brand">Siddham Wellness</h1>
            <p className="auth-tagline">Ancient Wisdom, Modern Wellness</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setMsg(null); }}>Sign In</button>
            <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setMsg(null); }}>Create Account</button>
          </div>

          {/* Google */}
          <button className="google-btn" onClick={() => signIn('google', { callbackUrl: callbackUrl as string })} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or</span></div>

          {/* Error from OAuth redirect */}
          {authError && <div className="auth-alert error">{authError}</div>}
          {msg && <div className={`auth-alert ${msg.type}`}>{msg.text}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" type="text" className="form-input" placeholder="Raj Kumar" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" placeholder="raj@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input" placeholder={mode === 'register' ? 'Min 8 chars, 1 uppercase, 1 number' : '••••••••'} required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Guest checkout notice */}
          <p className="auth-guest">
            <Link href="/checkout">Continue as guest →</Link>&nbsp;No account needed to shop.
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; background: var(--parchment); display: flex; align-items: center; justify-content: center; padding: 2rem 1rem; }
        .auth-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .spinner { width: 40px; height: 40px; border: 3px solid var(--saffron-pale); border-top-color: var(--forest); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-card { background: white; border-radius: 1.5rem; padding: 2.5rem 2rem; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(15,35,24,0.10); }
        .auth-logo { text-align: center; margin-bottom: 1.75rem; }
        .auth-logo-emoji { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
        .auth-brand { font-family: var(--font-serif); font-size: 1.6rem; color: var(--forest-dark); margin: 0 0 0.25rem; }
        .auth-tagline { font-size: 0.8rem; color: var(--gray-500); margin: 0; }
        .auth-tabs { display: flex; background: var(--parchment); border-radius: 0.75rem; padding: 4px; margin-bottom: 1.5rem; }
        .auth-tab { flex: 1; padding: 0.6rem; border: none; background: transparent; border-radius: 0.6rem; font-size: 0.9rem; font-weight: 600; color: var(--gray-500); cursor: pointer; transition: all 0.2s; }
        .auth-tab.active { background: white; color: var(--forest); box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
        .google-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.8rem; border: 1.5px solid #e0e0e0; border-radius: 0.75rem; background: white; font-size: 0.95rem; font-weight: 600; color: #444; cursor: pointer; transition: all 0.2s; }
        .google-btn:hover:not(:disabled) { border-color: #bbb; background: #fafafa; }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-divider { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0; color: var(--gray-400); font-size: 0.8rem; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #e5e5e5; }
        .auth-alert { padding: 0.75rem 1rem; border-radius: 0.6rem; font-size: 0.875rem; margin-bottom: 1rem; }
        .auth-alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .auth-alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--gray-700); }
        .btn-full { width: 100%; margin-top: 0.5rem; }
        .auth-guest { text-align: center; margin-top: 1.5rem; font-size: 0.82rem; color: var(--gray-500); }
        .auth-guest a { color: var(--forest); font-weight: 600; }
      `}</style>
    </>
  );
}
