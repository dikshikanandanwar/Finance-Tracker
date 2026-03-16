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

  const inputStyle = {
    width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid var(--input-border)', 
    background: 'var(--input-bg)', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box', marginBottom: '10px'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary)', margin: '0 0 10px', fontSize: '2rem', fontWeight: 900 }}>FinancialAdvisor</h1>
          <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>
            {isSignUp ? 'Create your wealth workspace.' : 'Sign in to your terminal.'}
          </p>
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

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '15px' }}>
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <span 
            style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }} 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;