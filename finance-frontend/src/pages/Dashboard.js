import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Bell, Lightbulb, ShieldAlert, DollarSign, TrendingUp, Activity } from 'lucide-react';
import ExpenseTrendChart from './ExpenseTrendChart';

function Dashboard({ theme }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const generateNotifications = (data) => {
      if (data.length < 1) return;
      const latest = data[data.length - 1];
      const previous = data.length > 1 ? data[data.length - 2] : null;
      const alerts = [];

      if (latest.savings_potential < latest.desired_savings) {
        alerts.push({ type: 'warning', text: `Falling short of $${latest.desired_savings} savings goal.` });
      } else {
        alerts.push({ type: 'success', text: `On track for monthly savings goal.` });
      }

      if (previous && latest.total_expense > previous.total_expense) {
        alerts.push({ type: 'alert', text: `Expenses increased compared to your last checkup.` });
      }

      if (latest.risk_level === 'High') {
        alerts.push({ type: 'critical', text: `High Risk. Complete 'Debt Management' in the Learn tab.` });
      }
      setNotifications(alerts);
    };

    const fetchHistory = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('financial_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (data) {
          setHistory(data);
          generateNotifications(data);
        }
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const latest = history[history.length - 1] || null;

  if (loading) return <div className="page-container"><div className="card" style={{textAlign: 'center', color: 'var(--text-light)'}}>Loading metrics...</div></div>;

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>Overview</h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>Your financial pulse.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderBottom: '6px solid #EF4444' }}>
          <h3 style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
            <DollarSign size={16} color="#EF4444" /> Expense
          </h3>
          <p style={{ color: 'var(--text-dark)' }}>${latest ? latest.total_expense : 0}</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderBottom: '6px solid var(--primary)' }}>
          <h3 style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
            <TrendingUp size={16} color="var(--primary)" /> Savings
          </h3>
          <p style={{ color: 'var(--text-dark)' }}>${latest ? latest.savings_potential : 0}</p>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderBottom: '6px solid #3B82F6' }}>
          <h3 style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0 }}>
            <Activity size={16} color="#3B82F6" /> Health
          </h3>
          <p style={{ fontSize: '1.4rem', marginTop: '12px', color: 'var(--text-dark)' }}>{latest ? latest.financial_health : 'N/A'}</p>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
            <Bell size={20} color="#F59E0B" /> Smart Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif, idx) => (
              <div key={idx} style={{
                padding: '12px 15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '12px',
                background: notif.type === 'critical' ? 'rgba(239, 68, 68, 0.1)' : notif.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${notif.type === 'critical' ? 'rgba(239, 68, 68, 0.3)' : notif.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.9rem'
              }}>
                {notif.type === 'success' ? <Lightbulb size={18} color="var(--primary)" /> : <ShieldAlert size={18} color={notif.type === 'critical' ? '#EF4444' : '#F59E0B'} />}
                {notif.text}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: '0 0 20px', color: 'var(--text-dark)' }}>Trajectory</h3>
        <div style={{ height: '300px' }}>
          <ExpenseTrendChart history={history} theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;