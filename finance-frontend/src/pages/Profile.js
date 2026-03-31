import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  Edit3,
  Target,
  ShieldCheck,
  X,
  Wallet,
  PiggyBank,
  BadgeDollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';

function useViewport() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return { isMobile: width < 768 };
}

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    financial_goal: '',
    occupation: '',
    risk_appetite: '',
    monthly_income: '',
    savings_goal: '',
    monthly_budget: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    financial_goal: '',
    occupation: '',
    risk_appetite: '',
    monthly_income: '',
    savings_goal: '',
    monthly_budget: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useViewport();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('financial_profile')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          const normalized = {
            name: data.name || '',
            financial_goal: data.financial_goal || '',
            occupation: data.occupation || '',
            risk_appetite: data.risk_appetite || '',
            monthly_income: data.monthly_income || '',
            savings_goal: data.savings_goal || '',
            monthly_budget: data.monthly_budget || ''
          };

          setProfile(normalized);
          setFormData(normalized);
        }
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const payload = {
        user_id: user.id,
        ...formData,
        monthly_income: Number(formData.monthly_income) || 0,
        savings_goal: Number(formData.savings_goal) || 0,
        monthly_budget: Number(formData.monthly_budget) || 0
      };

      const { error } = await supabase.from('financial_profile').upsert(payload, { onConflict: 'user_id' });

      if (!error) {
        setProfile(payload);
        setShowModal(false);
        toast.success('Profile saved.');
      } else {
        toast.error('Failed to save profile.');
      }
    }

    setSaving(false);
  };

  const getAvatar = (name) => {
    const avatars = ['💎','🐂', '🚀', '🏦'];
    const charSum = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return avatars[charSum % avatars.length] || '👤';
  };

  const inputStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '15px',
    border: '2px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--text-dark)',
    outline: 'none',
    marginBottom: '12px',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  };

  const statCardStyle = (accent) => ({
    background: 'var(--card-bg)',
    borderColor: 'var(--glass-border)',
    borderBottom: `6px solid ${accent}`,
    minHeight: '100%'
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="card"
        style={{
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: isMobile ? '74px 18px 28px' : '40px 20px',
          background: 'linear-gradient(180deg, rgba(59,130,246,0.08), transparent)'
        }}
      >
        <button
          onClick={() => {
            setFormData(profile);
            setShowModal(true);
          }}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'var(--input-bg)',
            color: 'var(--text-dark)',
            border: 'none',
            padding: '10px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontWeight: 'bold'
          }}
        >
          <Edit3 size={16} />
          {!isMobile && 'Edit'}
        </button>

        <div
          style={{
            width: 100,
            height: 100,
            background: 'var(--input-bg)',
            border: '2px solid var(--input-border)',
            borderRadius: '50%',
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem'
          }}
        >
          {getAvatar(profile.name)}
        </div>

        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)', fontSize: isMobile ? '1.6rem' : '2rem' }}>
          {profile.name || 'Investor'}
        </h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600, lineHeight: 1.6 }}>
          {profile.occupation || 'Building Wealth'}
        </p>
      </div>

      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <div className="stat-card" style={statCardStyle('var(--primary)')}>
          <Target size={24} color="var(--primary)" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Primary Goal</h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>{profile.financial_goal || 'Not set'}</p>
        </div>

        <div className="stat-card" style={statCardStyle('#F59E0B')}>
          <ShieldCheck size={24} color="#F59E0B" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Risk Appetite</h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)' }}>{profile.risk_appetite || 'Not set'}</p>
        </div>

        <div className="stat-card" style={statCardStyle('#10B981')}>
          <Wallet size={24} color="#10B981" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Monthly Income</h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)' }}>${profile.monthly_income || 0}</p>
        </div>

        <div className="stat-card" style={statCardStyle('#8B5CF6')}>
          <PiggyBank size={24} color="#8B5CF6" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Savings Goal</h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)' }}>${profile.savings_goal || 0}</p>
        </div>

        <div className="stat-card" style={statCardStyle('#EF4444')}>
          <BadgeDollarSign size={24} color="#EF4444" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Monthly Budget</h3>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-dark)' }}>${profile.monthly_budget || 0}</p>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? 0 : 20,
            boxSizing: 'border-box'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              position: 'relative',
              margin: 0,
              maxHeight: isMobile ? '92vh' : '85vh',
              overflowY: 'auto',
              borderRadius: isMobile ? '24px 24px 0 0' : '24px'
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dark)'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 20px', color: 'var(--text-dark)' }}>Edit Profile</h2>

            <form onSubmit={handleSave}>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required style={inputStyle} />
              <input name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Occupation" style={inputStyle} />
              <input name="financial_goal" value={formData.financial_goal} onChange={handleChange} placeholder="Financial Goal" style={inputStyle} />
              <input name="monthly_income" type="number" value={formData.monthly_income} onChange={handleChange} placeholder="Monthly Income" style={inputStyle} />
              <input name="savings_goal" type="number" value={formData.savings_goal} onChange={handleChange} placeholder="Savings Goal" style={inputStyle} />
              <input name="monthly_budget" type="number" value={formData.monthly_budget} onChange={handleChange} placeholder="Monthly Budget" style={inputStyle} />

              <select name="risk_appetite" value={formData.risk_appetite} onChange={handleChange} style={inputStyle}>
                <option value="">Select Risk...</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>

              <button type="submit" className="btn-primary" disabled={saving} style={{ minHeight: '52px' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
