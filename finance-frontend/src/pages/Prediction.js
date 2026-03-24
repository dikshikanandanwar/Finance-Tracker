import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { Save, Lightbulb, Wallet } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const createCustomExpense = () => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  amount: ''
});

const serializeOtherMeta = (note, customExpenses) => {
  const cleaned = Array.isArray(customExpenses)
    ? customExpenses
        .map((item) => ({
          name: String(item?.name || '').trim(),
          amount: item?.amount === '' || item?.amount == null ? '' : String(item.amount)
        }))
        .filter((item) => item.name || item.amount !== '')
    : [];

  return JSON.stringify({
    note: String(note || ''),
    customExpenses: cleaned
  });
};

function Prediction({ theme }) {
  const [profile, setProfile] = useState({
    monthly_income: '',
    savings_goal: '',
    monthly_budget: '',
    occupation: '',
    financial_goal: ''
  });

  const [formData, setFormData] = useState({
    Exp_Housing: '',
    Exp_Groceries: '',
    Exp_Utilities: '',
    Exp_Shopping: '',
    Exp_Entertainment: '',
    Exp_Other: '',
    Other_Note: ''
  });

  const [customExpenses, setCustomExpenses] = useState([createCustomExpense()]);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setProfileLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('financial_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile({
          monthly_income: data.monthly_income || '',
          savings_goal: data.savings_goal || '',
          monthly_budget: data.monthly_budget || '',
          occupation: data.occupation || '',
          financial_goal: data.financial_goal || ''
        });
      }

      setProfileLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCustomExpenseChange = (id, field, value) => {
    setCustomExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addCustomExpense = () => {
    setCustomExpenses((prev) => [...prev, createCustomExpense()]);
  };

  const removeCustomExpense = (id) => {
    setCustomExpenses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [createCustomExpense()];
    });
  };

  const visibleCustomExpenses = customExpenses.filter(
    (item) => String(item.name || '').trim() || String(item.amount || '').trim()
  );

  const calculateTotalExpense = () => {
    return [
      'Exp_Housing',
      'Exp_Groceries',
      'Exp_Utilities',
      'Exp_Shopping',
      'Exp_Entertainment',
      'Exp_Other'
    ].reduce((sum, key) => sum + (parseFloat(formData[key]) || 0), 0);
  };

  const totalExpense = useMemo(() => calculateTotalExpense(), [formData]);
  const monthlyIncome = parseFloat(profile.monthly_income) || 0;
  const desiredSavings = parseFloat(profile.savings_goal) || 0;
  const budget = parseFloat(profile.monthly_budget) || 0;
  const estimatedBalance = monthlyIncome - totalExpense;

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!monthlyIncome || !desiredSavings) {
      toast.error('Please set income and savings goal in Profile first.');
      return;
    }

    setLoading(true);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error('Session missing');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          Income: monthlyIncome,
          Age: 25,
          Dependents: 0,
          Occupation: 0,
          City_Tier: 1,
          Total_Expense: totalExpense,
          Desired_Savings: desiredSavings
        })
      });

      if (!res.ok) throw new Error('Backend connection failed');

      const data = await res.json();

      setPrediction({
        risk_level: data.risk_level || 'Low',
        financial_health: data.financial_health || 'Average',
        monthly_savings_potential:
          data.monthly_savings_potential ?? estimatedBalance,
        ai_summary: data.ai_summary,
        ai_tips: Array.isArray(data.ai_tips) ? data.ai_tips : []
      });

      setExpenseChartData({
        labels: ['Housing', 'Groceries', 'Utilities', 'Shopping', 'Entertainment', 'Other'],
        datasets: [
          {
            data: [
              parseFloat(formData.Exp_Housing) || 0,
              parseFloat(formData.Exp_Groceries) || 0,
              parseFloat(formData.Exp_Utilities) || 0,
              parseFloat(formData.Exp_Shopping) || 0,
              parseFloat(formData.Exp_Entertainment) || 0,
              parseFloat(formData.Exp_Other) || 0
            ],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'],
            borderColor: isDark ? '#111827' : '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      });

      toast.success('AI Analysis complete');
    } catch (err) {
      toast.error('AI connection failed');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!prediction) return;

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const payload = {
      user_id: user.id,
      financial_health: prediction.financial_health,
      risk_level: prediction.risk_level,
      savings_potential: prediction.monthly_savings_potential,
      income: monthlyIncome,
      total_expense: totalExpense,
      desired_savings: desiredSavings,
      exp_housing: parseFloat(formData.Exp_Housing) || 0,
      exp_groceries: parseFloat(formData.Exp_Groceries) || 0,
      exp_utilities: parseFloat(formData.Exp_Utilities) || 0,
      exp_shopping: parseFloat(formData.Exp_Shopping) || 0,
      exp_entertainment: parseFloat(formData.Exp_Entertainment) || 0,
      exp_other: parseFloat(formData.Exp_Other) || 0,
      other_note: serializeOtherMeta(formData.Other_Note, customExpenses)
    };

    const { error } = await supabase.from('financial_progress').insert([payload]);

    if (!error) toast.success('Plan saved to Dashboard');
    else toast.error('Failed to save plan');
  };

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '12px 13px' : '14px 15px',
    borderRadius: '16px',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--text-dark)',
    outline: 'none',
    fontSize: isMobile ? '0.9rem' : '0.95rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    color: 'var(--text-light)',
    fontSize: '0.82rem',
    fontWeight: 700,
    marginBottom: 8,
    display: 'block'
  };

  if (profileLoading) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
          Loading expense planner...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: '0 0 6px',
            color: 'var(--text-dark)',
            fontSize: isMobile ? '1.5rem' : '2rem'
          }}
        >
          Expense Planner
        </h1>
        <p
          style={{
            color: 'var(--text-light)',
            margin: 0,
            fontWeight: 600,
            fontSize: isMobile ? '0.92rem' : '1rem'
          }}
        >
          Add your expenses. Income and goals are taken from profile.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: prediction && !isMobile ? '1.15fr 0.95fr' : '1fr',
          gap: isMobile ? '16px' : '20px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))',
              border: '1px solid rgba(148,163,184,0.18)'
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-dark)',
                fontSize: isMobile ? '1rem' : '1.1rem'
              }}
            >
              <Wallet size={18} color="var(--primary)" />
              Profile Budget Snapshot
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr'
                  : 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px'
              }}
            >
              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '18px',
                  padding: '14px'
                }}
              >
                <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Monthly Income
                </div>
                <div style={{ color: 'var(--text-dark)', fontSize: '1.2rem', fontWeight: 800, marginTop: 8 }}>
                  ${monthlyIncome || 0}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '18px',
                  padding: '14px'
                }}
              >
                <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Savings Goal
                </div>
                <div style={{ color: 'var(--text-dark)', fontSize: '1.2rem', fontWeight: 800, marginTop: 8 }}>
                  ${desiredSavings || 0}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '18px',
                  padding: '14px'
                }}
              >
                <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Budget
                </div>
                <div style={{ color: 'var(--text-dark)', fontSize: '1.2rem', fontWeight: 800, marginTop: 8 }}>
                  ${budget || 0}
                </div>
              </div>
            </div>

            {(!monthlyIncome || !desiredSavings) && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Please update your Profile first to set income and goals.
              </div>
            )}
          </div>

          <div className="card">
            <form onSubmit={handleAnalyze}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-dark)' }}>Add Expenses</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label style={labelStyle}>Housing</label>
                  <input
                    name="Exp_Housing"
                    type="number"
                    placeholder="Enter housing amount"
                    onChange={handleChange}
                    value={formData.Exp_Housing}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Groceries</label>
                  <input
                    name="Exp_Groceries"
                    type="number"
                    placeholder="Enter groceries amount"
                    onChange={handleChange}
                    value={formData.Exp_Groceries}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Utilities</label>
                  <input
                    name="Exp_Utilities"
                    type="number"
                    placeholder="Enter utilities amount"
                    onChange={handleChange}
                    value={formData.Exp_Utilities}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Shopping</label>
                  <input
                    name="Exp_Shopping"
                    type="number"
                    placeholder="Enter shopping amount"
                    onChange={handleChange}
                    value={formData.Exp_Shopping}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Entertainment</label>
                  <input
                    name="Exp_Entertainment"
                    type="number"
                    placeholder="Enter entertainment amount"
                    onChange={handleChange}
                    value={formData.Exp_Entertainment}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Other Amount</label>
                  <input
                    name="Exp_Other"
                    type="number"
                    placeholder="Enter other amount"
                    onChange={handleChange}
                    value={formData.Exp_Other}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: isMobile ? '14px' : '16px',
                  borderRadius: '18px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800 }}>Custom Expenses</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 600, marginTop: 4 }}>
                      Add your own expense names. These will be shown on the Dashboard only.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addCustomExpense}
                    style={{
                      border: '1px solid var(--input-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-dark)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    + Add Custom Expense
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {customExpenses.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile
                          ? '1fr'
                          : 'minmax(0, 1.4fr) minmax(140px, 0.8fr) auto',
                        gap: '10px',
                        alignItems: 'end',
                        padding: isMobile ? '12px' : '0',
                        border: isMobile ? '1px solid var(--input-border)' : 'none',
                        borderRadius: isMobile ? '14px' : '0',
                        background: isMobile ? 'var(--card-bg)' : 'transparent'
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Expense Name #{index + 1}</label>
                        <input
                          type="text"
                          placeholder="For example: Pet care"
                          value={item.name}
                          onChange={(e) => handleCustomExpenseChange(item.id, 'name', e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Amount</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => handleCustomExpenseChange(item.id, 'amount', e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCustomExpense(item.id)}
                        style={{
                          border: '1px solid rgba(239,68,68,0.2)',
                          background: 'rgba(239,68,68,0.12)',
                          color: '#EF4444',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          minWidth: 84,
                          width: isMobile ? '100%' : 'auto'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {visibleCustomExpenses.length > 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    {visibleCustomExpenses.map((item) => (
                      <div
                        key={`preview_${item.id}`}
                        style={{
                          padding: '12px',
                          borderRadius: '14px',
                          background: 'var(--card-bg)',
                          border: '1px solid var(--input-border)'
                        }}
                      >
                        <div style={{ color: 'var(--text-light)', fontSize: '0.76rem', fontWeight: 700 }}>
                          {item.name || 'Custom Expense'}
                        </div>
                        <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                          ${parseFloat(item.amount) || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Other Note / Description</label>
                <textarea
                  name="Other_Note"
                  placeholder="Write what this other expense is for..."
                  value={formData.Other_Note}
                  onChange={handleChange}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 96
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 700 }}>
                    Total Expense
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontSize: '1.15rem', fontWeight: 800, marginTop: 6 }}>
                    ${totalExpense}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 700 }}>
                    Budget Left
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontSize: '1.15rem', fontWeight: 800, marginTop: 6 }}>
                    ${budget ? budget - totalExpense : 0}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.78rem', fontWeight: 700 }}>
                    Est. Balance
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontSize: '1.15rem', fontWeight: 800, marginTop: 6 }}>
                    ${estimatedBalance}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ marginTop: 20, width: isMobile ? '100%' : 'auto' }}
              >
                {loading ? 'Analyzing...' : 'Analyze Budget'}
              </button>
            </form>
          </div>
        </div>

        {prediction && expenseChartData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 15px', color: 'var(--text-dark)' }}>Expense Distribution</h3>
              <div style={{ height: isMobile ? '280px' : '220px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={expenseChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                      legend: {
                        position: isMobile ? 'bottom' : 'right',
                        labels: {
                          color: isDark ? '#94A3B8' : '#64748B',
                          boxWidth: isMobile ? 12 : 18,
                          padding: isMobile ? 12 : 16
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="card" style={{ background: 'var(--input-bg)' }}>
              <h3
                style={{
                  margin: '0 0 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-dark)'
                }}
              >
                <Lightbulb color="var(--primary)" size={20} />
                AI Insights
              </h3>

              {prediction.ai_summary && (
                <p
                  style={{
                    margin: '0 0 15px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: 'var(--text-dark)',
                    lineHeight: 1.5
                  }}
                >
                  {prediction.ai_summary}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prediction.ai_tips?.length > 0 ? (
                  prediction.ai_tips.map((tip, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--primary)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-dark)',
                        boxShadow: 'var(--card-shadow)'
                      }}
                    >
                      {tip}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '12px',
                      background: 'var(--card-bg)',
                      borderRadius: '12px',
                      borderLeft: '4px solid var(--primary)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-dark)'
                    }}
                  >
                    Maintain balance between needs, wants, and monthly goals.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={saveProgress}
              className="btn-primary"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-dark)',
                border: '1px solid var(--input-border)',
                boxShadow: 'none',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <Save size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Save Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Prediction;  