import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Edit3, Target, ShieldCheck, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Profile() {
  const [profile, setProfile] = useState({ name: '', financial_goal: '', occupation: '', risk_appetite: '' });
  const [formData, setFormData] = useState({ name: '', financial_goal: '', occupation: '', risk_appetite: '' });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('financial_profile').select('*').eq('user_id', user.id).maybeSingle();
        if (data) setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('financial_profile').upsert({ user_id: user.id, ...formData }, { onConflict: 'user_id' });
      if (!error) { setProfile(formData); setShowModal(false); toast.success("Profile saved."); }
    }
    setSaving(false);
  };

  const getAvatar = (name) => {
    const avatars = ['💎', '🤑', '🐂', '🚀', '🏦'];
    const charSum = (name||'').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return avatars[charSum % avatars.length] || '👤';
  };

  const inputStyle = { width: '100%', padding: '15px', borderRadius: '15px', border: '2px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-dark)', outline: 'none', marginBottom: '10px' };

  if (loading) return <div className="page-container"><div className="card" style={{textAlign: 'center', color: 'var(--text-light)'}}>Loading...</div></div>;

  return (
    <div className="page-container">
      <div className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', padding: '40px 20px' }}>
        <button onClick={() => { setFormData(profile); setShowModal(true); }} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--input-bg)', color: 'var(--text-dark)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}>
          <Edit3 size={16} /> Edit
        </button>
        
        <div style={{ width: 100, height: 100, background: 'var(--input-bg)', border: '2px solid var(--input-border)', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
          {getAvatar(profile.name)}
        </div>
        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>{profile.name || 'Investor'}</h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>{profile.occupation || 'Building Wealth'}</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderColor: 'var(--glass-border)', borderBottom: '6px solid var(--primary)' }}>
          <Target size={24} color="var(--primary)" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Primary Goal</h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>{profile.financial_goal || 'Not set'}</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderColor: 'var(--glass-border)', borderBottom: '6px solid #F59E0B' }}>
          <ShieldCheck size={24} color="#F59E0B" />
          <h3 style={{ margin: '10px 0 5px', color: 'var(--text-light)' }}>Risk Appetite</h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>{profile.risk_appetite || 'Not set'}</p>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, boxSizing: 'border-box' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, position: 'relative', margin: 0 }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dark)' }}><X size={20} /></button>
            <h2 style={{ margin: '0 0 20px', color: 'var(--text-dark)' }}>Edit Profile</h2>
            <form onSubmit={handleSave}>
              <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" required style={inputStyle} />
              <input name="occupation" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} placeholder="Occupation" style={inputStyle} />
              <input name="financial_goal" value={formData.financial_goal} onChange={(e) => setFormData({...formData, financial_goal: e.target.value})} placeholder="Financial Goal" style={inputStyle} />
              <select name="risk_appetite" value={formData.risk_appetite} onChange={(e) => setFormData({...formData, risk_appetite: e.target.value})} style={inputStyle}>
                <option value="">Select Risk...</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;