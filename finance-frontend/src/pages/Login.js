import React, { useState } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    let error;
    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error) toast.success("Account created! Logging you in...");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    if (error) toast.error(error.message);
    setLoading(false);
  };

  const styles = {
    shell: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background:
        'radial-gradient(1000px 500px at 20% 0%, rgba(13,148,136,0.10), transparent 55%), radial-gradient(900px 600px at 90% 20%, rgba(37,99,235,0.10), transparent 55%), #F6F7FB',
      fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      color: '#0F172A',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      boxShadow: '0 14px 40px rgba(15, 23, 42, 0.10)',
      overflow: 'hidden',
    },
    top: {
      padding: '18px 20px',
      borderBottom: '1px solid #EEF2F7',
      background:
        'linear-gradient(135deg, rgba(13,148,136,0.10) 0%, rgba(37,99,235,0.08) 55%, rgba(255,255,255,1) 100%)',
    },
    brandRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D9488',
      color: 'white',
      fontWeight: 800,
      letterSpacing: '0.5px',
      boxShadow: '0 8px 18px rgba(13,148,136,0.25)',
      flexShrink: 0,
      userSelect: 'none',
    },
    brand: { margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 },
    sub: { margin: '4px 0 0', fontSize: '0.9rem', color: '#475569', fontWeight: 600 },
    body: { padding: '22px 20px 20px' },
    title: { margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' },
    subtitle: { margin: 0, fontSize: '0.95rem', color: '#64748B', fontWeight: 600, lineHeight: 1.45 },
    form: { marginTop: 18, display: 'grid', gap: 12 },
    input: {
      width: '100%',
      padding: '12px 12px',
      borderRadius: 14,
      border: '1px solid #CBD5E1',
      background: '#F8FAFC',
      fontSize: '1rem',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#0F172A',
    },
    btn: (enabled) => ({
      width: '100%',
      padding: '12px 14px',
      borderRadius: 14,
      border: '1px solid transparent',
      background: enabled ? '#0D9488' : '#94A3B8',
      color: 'white',
      fontSize: '1rem',
      fontWeight: 800,
      cursor: enabled ? 'pointer' : 'not-allowed',
      boxShadow: enabled ? '0 10px 22px rgba(13,148,136,0.22)' : 'none',
      transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
    }),
    footer: {
      padding: '14px 20px 18px',
      borderTop: '1px solid #EEF2F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    footText: { margin: 0, fontSize: '0.92rem', color: '#64748B', fontWeight: 600 },
    link: {
      margin: 0,
      fontSize: '0.92rem',
      color: '#0D9488',
      fontWeight: 800,
      cursor: 'pointer',
      userSelect: 'none',
    },
    note: {
      marginTop: 12,
      fontSize: '0.82rem',
      color: '#94A3B8',
      lineHeight: 1.4,
    },
  };

  return (
    <div style={styles.shell}>
      <div style={styles.card}>
        <div style={styles.top}>
          <div style={styles.brandRow}>
            <div>
              <h1 style={styles.brand}>Expense Tracker</h1>
              <p style={styles.sub}>Secure finance workspace</p>
            </div>
          </div>
        </div>

        <div style={styles.body}>
          <h2 style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
          <p style={styles.subtitle}>
            {isSignUp
              ? 'Set up your account to start tracking spending, savings, and goals.'
              : 'Sign in to continue your financial planning.'}
          </p>

          <form onSubmit={handleAuth} style={styles.form}>
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0D9488';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0D9488';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13,148,136,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <button
              className="btn-primary"
              disabled={loading}
              style={styles.btn(!loading)}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Processing…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>

            <div style={styles.note}>
              By continuing, you agree to use the app responsibly. Never share passwords with anyone.
            </div>
          </form>
        </div>

        <div style={styles.footer}>
          <p style={styles.footText}>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</p>
          <p style={styles.link} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign in' : 'Create account'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;