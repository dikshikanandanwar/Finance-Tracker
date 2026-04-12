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
      if (!error) toast.success('Account created! Logging you in...');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    }

    if (error) toast.error(error.message);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '15px',
    border: '2px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--text-dark)',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '10px'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        background:
          'radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 28%), var(--bg-color)'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: 0,
          padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 32px)',
          borderRadius: '28px',
          boxShadow: '0 20px 50px rgba(15,23,42,0.08)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 14px',
              borderRadius: '999px',
              marginBottom: '14px',
              background: 'rgba(59,130,246,0.12)',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.82rem'
            }}
          >
            Secure Access
          </div>
          <h1 style={{ color: 'var(--primary)', margin: '0 0 10px', fontSize: 'clamp(1.8rem, 5vw, 2.2rem)', fontWeight: 900 }}>
            FinancialAdvisor
          </h1>
          <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
            {isSignUp ? 'Create your wealth workspace.' : 'Sign in to your terminal.'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '6px',
            borderRadius: '16px',
            background: 'var(--input-bg)',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              minHeight: '46px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              background: !isSignUp ? 'var(--card-bg)' : 'transparent',
              color: 'var(--text-dark)',
              boxShadow: !isSignUp ? 'var(--card-shadow)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              minHeight: '46px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              background: isSignUp ? 'var(--card-bg)' : 'transparent',
              color: 'var(--text-dark)',
              boxShadow: isSignUp ? 'var(--card-shadow)' : 'none'
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '15px', minHeight: '52px' }}>
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.92rem', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign in' : 'Create one'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;
