import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import {
  Bell,
  Lightbulb,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Activity,
  Edit3,
  Trash2,
  X,
  Save,
  Download
} from 'lucide-react';
import ExpenseTrendChart from './ExpenseTrendChart';

const createCustomExpense = () => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: '', amount: '' });

const parseOtherMeta = (rawValue) => {
  if (!rawValue) return { note: '', customExpenses: [] };

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const customExpenses = Array.isArray(parsed.customExpenses)
        ? parsed.customExpenses
            .map((item, index) => ({
              id: item?.id || `saved_${index}`,
              name: String(item?.name || '').trim(),
              amount: item?.amount === '' || item?.amount == null ? '' : String(item.amount)
            }))
            .filter((item) => item.name || item.amount !== '')
        : [];

      return {
        note: String(parsed.note || ''),
        customExpenses
      };
    }
  } catch (error) {}

  return { note: String(rawValue), customExpenses: [] };
};

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

function Dashboard({ theme }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    exp_housing: '',
    exp_groceries: '',
    exp_utilities: '',
    exp_shopping: '',
    exp_entertainment: '',
    exp_other: '',
    other_note: '',
    desired_savings: '',
    income: '',
    custom_expenses: [createCustomExpense()]
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const generateNotifications = (data) => {
    if (data.length < 1) {
      setNotifications([]);
      return;
    }

    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const alerts = [];

    if (latest.savings_potential < latest.desired_savings) {
      alerts.push({
        type: 'warning',
        text: `Falling short of $${latest.desired_savings} savings goal.`
      });
    } else {
      alerts.push({
        type: 'success',
        text: `On track for monthly savings goal.`
      });
    }

    if (previous && latest.total_expense > previous.total_expense) {
      alerts.push({
        type: 'alert',
        text: `Expenses increased compared to your last checkup.`
      });
    }

    if (latest.risk_level === 'High') {
      alerts.push({
        type: 'critical',
        text: `High Risk. Review your latest expense pattern.`
      });
    }

    setNotifications(alerts);
  };

  const fetchHistory = async () => {
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('financial_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data) {
        setHistory(data);
        generateNotifications(data);
      } else {
        setHistory([]);
        setNotifications([]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const latest = history[history.length - 1] || null;

  const openEditModal = (entry) => {
    const parsedOtherMeta = parseOtherMeta(entry.other_note);

    setEditingEntry(entry);
    setEditForm({
      exp_housing: entry.exp_housing ?? '',
      exp_groceries: entry.exp_groceries ?? '',
      exp_utilities: entry.exp_utilities ?? '',
      exp_shopping: entry.exp_shopping ?? '',
      exp_entertainment: entry.exp_entertainment ?? '',
      exp_other: entry.exp_other ?? '',
      other_note: parsedOtherMeta.note ?? '',
      desired_savings: entry.desired_savings ?? '',
      income: entry.income ?? '',
      custom_expenses: parsedOtherMeta.customExpenses.length ? parsedOtherMeta.customExpenses : [createCustomExpense()]
    });
  };

  const closeEditModal = () => {
    setEditingEntry(null);
    setEditForm({
      exp_housing: '',
      exp_groceries: '',
      exp_utilities: '',
      exp_shopping: '',
      exp_entertainment: '',
      exp_other: '',
      other_note: '',
      desired_savings: '',
      income: '',
      custom_expenses: [createCustomExpense()]
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCustomExpenseChange = (id, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      custom_expenses: (prev.custom_expenses || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addCustomExpense = () => {
    setEditForm((prev) => ({
      ...prev,
      custom_expenses: [...(prev.custom_expenses || []), createCustomExpense()]
    }));
  };

  const removeCustomExpense = (id) => {
    setEditForm((prev) => {
      const next = (prev.custom_expenses || []).filter((item) => item.id !== id);
      return {
        ...prev,
        custom_expenses: next.length ? next : [createCustomExpense()]
      };
    });
  };

  const computedTotalExpense = useMemo(() => {
    return (
      (parseFloat(editForm.exp_housing) || 0) +
      (parseFloat(editForm.exp_groceries) || 0) +
      (parseFloat(editForm.exp_utilities) || 0) +
      (parseFloat(editForm.exp_shopping) || 0) +
      (parseFloat(editForm.exp_entertainment) || 0) +
      (parseFloat(editForm.exp_other) || 0)
    );
  }, [editForm]);

  const computedSavingsPotential = useMemo(() => {
    return (parseFloat(editForm.income) || 0) - computedTotalExpense;
  }, [editForm.income, computedTotalExpense]);

  const getFinancialHealth = (income, totalExpense, desiredSavings) => {
    const savings = income - totalExpense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    if (savings >= desiredSavings && savingsRate >= 20) return 'Excellent';
    if (savings >= desiredSavings * 0.8 && savingsRate >= 10) return 'Good';
    if (savings > 0) return 'Average';
    return 'Poor';
  };

  const getRiskLevel = (income, totalExpense) => {
    if (!income) return 'High';
    const expenseRatio = (totalExpense / income) * 100;

    if (expenseRatio >= 90) return 'High';
    if (expenseRatio >= 70) return 'Medium';
    return 'Low';
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;

    setSavingEdit(true);

    const income = parseFloat(editForm.income) || 0;
    const desiredSavings = parseFloat(editForm.desired_savings) || 0;
    const totalExpense = computedTotalExpense;
    const savingsPotential = computedSavingsPotential;

    const updates = {
      exp_housing: parseFloat(editForm.exp_housing) || 0,
      exp_groceries: parseFloat(editForm.exp_groceries) || 0,
      exp_utilities: parseFloat(editForm.exp_utilities) || 0,
      exp_shopping: parseFloat(editForm.exp_shopping) || 0,
      exp_entertainment: parseFloat(editForm.exp_entertainment) || 0,
      exp_other: parseFloat(editForm.exp_other) || 0,
      other_note: serializeOtherMeta(editForm.other_note, editForm.custom_expenses),
      income: income,
      desired_savings: desiredSavings,
      total_expense: totalExpense,
      savings_potential: savingsPotential,
      financial_health: getFinancialHealth(income, totalExpense, desiredSavings),
      risk_level: getRiskLevel(income, totalExpense)
    };

    const { error } = await supabase
      .from('financial_progress')
      .update(updates)
      .eq('id', editingEntry.id);

    setSavingEdit(false);

    if (!error) {
      closeEditModal();
      fetchHistory();
    } else {
      alert('Failed to update entry.');
    }
  };

  const handleDeleteEntry = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmDelete) return;

    setDeletingId(id);

    const { error } = await supabase
      .from('financial_progress')
      .delete()
      .eq('id', id);

    setDeletingId(null);

    if (!error) {
      fetchHistory();
    } else {
      alert('Failed to delete entry.');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'No date';
    return new Date(value).toLocaleString();
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Date", "Income", "Housing", "Groceries", "Utilities", "Shopping",
      "Entertainment", "Other", "Total Expense", "Desired Savings",
      "Savings Potential", "Financial Health", "Risk Level", "Notes"
    ];

    const rows = history.map(entry => {
      // Parse notes to pull out just the text if it's stringified JSON
      const parsedMeta = parseOtherMeta(entry.other_note);
      
      return [
        new Date(entry.created_at).toLocaleDateString(),
        entry.income || 0,
        entry.exp_housing || 0,
        entry.exp_groceries || 0,
        entry.exp_utilities || 0,
        entry.exp_shopping || 0,
        entry.exp_entertainment || 0,
        entry.exp_other || 0,
        entry.total_expense || 0,
        entry.desired_savings || 0,
        entry.savings_potential || 0,
        entry.financial_health || 'N/A',
        entry.risk_level || 'N/A',
        `"${(parsedMeta.note || '').replace(/"/g, '""')}"` 
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 15px',
    borderRadius: '14px',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--text-dark)',
    outline: 'none',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    color: 'var(--text-light)',
    fontSize: '0.82rem',
    fontWeight: 700,
    marginBottom: 8,
    display: 'block'
  };

  if (loading) {
    return (
      <div className="page-container">
        <div
          className="card"
          style={{ textAlign: 'center', color: 'var(--text-light)' }}
        >
          Loading metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>Overview</h1>
          <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>
            Your financial pulse.
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Download size={18} />
          Export Data
        </button>
      </header>

      <div className="stats-grid">
        <div
          className="stat-card"
          style={{ background: 'var(--card-bg)', borderBottom: '6px solid #EF4444' }}
        >
          <h3
            style={{
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: 0
            }}
          >
            <DollarSign size={16} color="#EF4444" /> Expense
          </h3>
          <p style={{ color: 'var(--text-dark)' }}>
            ${latest ? latest.total_expense : 0}
          </p>
        </div>

        <div
          className="stat-card"
          style={{ background: 'var(--card-bg)', borderBottom: '6px solid var(--primary)' }}
        >
          <h3
            style={{
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: 0
            }}
          >
            <TrendingUp size={16} color="var(--primary)" /> Savings
          </h3>
          <p style={{ color: 'var(--text-dark)' }}>
            ${latest ? latest.savings_potential : 0}
          </p>
        </div>

        <div
          className="stat-card"
          style={{ background: 'var(--card-bg)', borderBottom: '6px solid #3B82F6' }}
        >
          <h3
            style={{
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: 0
            }}
          >
            <Activity size={16} color="#3B82F6" /> Health
          </h3>
          <p
            style={{
              fontSize: '1.4rem',
              marginTop: '12px',
              color: 'var(--text-dark)'
            }}
          >
            {latest ? latest.financial_health : 'N/A'}
          </p>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <h3
            style={{
              margin: '0 0 15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-dark)'
            }}
          >
            <Bell size={20} color="#F59E0B" /> Smart Alerts
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notif, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 15px',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background:
                    notif.type === 'critical'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : notif.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${
                    notif.type === 'critical'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : notif.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(16, 185, 129, 0.3)'
                  }`,
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                {notif.type === 'success' ? (
                  <Lightbulb size={18} color="var(--primary)" />
                ) : (
                  <ShieldAlert
                    size={18}
                    color={notif.type === 'critical' ? '#EF4444' : '#F59E0B'}
                  />
                )}
                <div>{notif.text}</div>
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

      <div className="card">
        <h3 style={{ margin: '0 0 20px', color: 'var(--text-dark)' }}>
          Saved Entries
        </h3>

        {history.length === 0 ? (
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-light)',
              fontWeight: 600
            }}
          >
            No entries found yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {[...history].reverse().map((entry, index) => {
              const parsedOtherMeta = parseOtherMeta(entry.other_note);

              return (
              <div
                key={entry.id || index}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '18px',
                  padding: '16px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: 'var(--text-dark)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        marginBottom: 6
                      }}
                    >
                      Entry #{history.length - index}
                    </div>
                    <div
                      style={{
                        color: 'var(--text-light)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    >
                      {formatDate(entry.created_at)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => openEditModal(entry)}
                      style={{
                        border: 'none',
                        background: 'rgba(59,130,246,0.14)',
                        color: '#60A5FA',
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                      style={{
                        border: 'none',
                        background: 'rgba(239,68,68,0.14)',
                        color: '#F87171',
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        opacity: deletingId === entry.id ? 0.6 : 1
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '16px'
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'var(--card-bg)'
                    }}
                  >
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Expense
                    </div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                      ${entry.total_expense || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'var(--card-bg)'
                    }}
                  >
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Savings
                    </div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                      ${entry.savings_potential || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'var(--card-bg)'
                    }}
                  >
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Risk
                    </div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                      {entry.risk_level || 'N/A'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'var(--card-bg)'
                    }}
                  >
                    <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                      Health
                    </div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                      {entry.financial_health || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      color: 'var(--text-light)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: 8
                    }}
                  >
                    Expense Breakdown
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: '8px'
                    }}
                  >
                    {[
                      ['Housing', entry.exp_housing],
                      ['Groceries', entry.exp_groceries],
                      ['Utilities', entry.exp_utilities],
                      ['Shopping', entry.exp_shopping],
                      ['Entertainment', entry.exp_entertainment],
                      ['Other', entry.exp_other]
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--input-border)',
                          background: 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ color: 'var(--text-light)', fontSize: '0.74rem', fontWeight: 700 }}>
                          {label}
                        </div>
                        <div style={{ color: 'var(--text-dark)', fontWeight: 700, marginTop: 4 }}>
                          ${value || 0}
                        </div>
                      </div>
                    ))}
                  </div>

                  {parsedOtherMeta.customExpenses.length > 0 ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.18)'
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--text-light)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: 8
                        }}
                      >
                        Custom Expenses
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '8px'
                        }}
                      >
                        {parsedOtherMeta.customExpenses.map((item, itemIndex) => (
                          <div
                            key={`${entry.id || index}_custom_${itemIndex}`}
                            style={{
                              padding: '10px',
                              borderRadius: '12px',
                              background: 'var(--card-bg)',
                              border: '1px solid var(--input-border)'
                            }}
                          >
                            <div style={{ color: 'var(--text-light)', fontSize: '0.74rem', fontWeight: 700 }}>
                              {item.name || `Custom ${itemIndex + 1}`}
                            </div>
                            <div style={{ color: 'var(--text-dark)', fontWeight: 700, marginTop: 4 }}>
                              ${parseFloat(item.amount) || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {parsedOtherMeta.note ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.18)'
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--text-light)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          marginBottom: 4
                        }}
                      >
                        Other Note
                      </div>
                      <div
                        style={{
                          color: 'var(--text-dark)',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {parsedOtherMeta.note}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {editingEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={closeEditModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-dark)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            <h2 style={{ margin: '0 0 18px', color: 'var(--text-dark)' }}>
              Edit Entry
            </h2>

            <form onSubmit={handleUpdateEntry}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label style={labelStyle}>Housing</label>
                  <input
                    type="number"
                    name="exp_housing"
                    value={editForm.exp_housing}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Groceries</label>
                  <input
                    type="number"
                    name="exp_groceries"
                    value={editForm.exp_groceries}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Utilities</label>
                  <input
                    type="number"
                    name="exp_utilities"
                    value={editForm.exp_utilities}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Shopping</label>
                  <input
                    type="number"
                    name="exp_shopping"
                    value={editForm.exp_shopping}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Entertainment</label>
                  <input
                    type="number"
                    name="exp_entertainment"
                    value={editForm.exp_entertainment}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Other</label>
                  <input
                    type="number"
                    name="exp_other"
                    value={editForm.exp_other}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Income</label>
                  <input
                    type="number"
                    name="income"
                    value={editForm.income}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Desired Savings</label>
                  <input
                    type="number"
                    name="desired_savings"
                    value={editForm.desired_savings}
                    onChange={handleEditChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-dark)', fontWeight: 800 }}>Custom Expenses</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 600, marginTop: 4 }}>
                      Dashboard-only items with your own names.
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
                      cursor: 'pointer'
                    }}
                  >
                    + Add
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {(editForm.custom_expenses || []).map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(120px, 0.8fr) auto',
                        gap: '10px',
                        alignItems: 'end'
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Name #{index + 1}</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleCustomExpenseChange(item.id, 'name', e.target.value)}
                          placeholder="Custom expense name"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Amount</label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleCustomExpenseChange(item.id, 'amount', e.target.value)}
                          placeholder="0"
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
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Other Note</label>
                <textarea
                  name="other_note"
                  value={editForm.other_note}
                  onChange={handleEditChange}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 100
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: '14px',
                  borderRadius: '16px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                    Total Expense
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                    ${computedTotalExpense}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                    Savings
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                    ${computedSavingsPotential}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                    Health
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                    {getFinancialHealth(
                      parseFloat(editForm.income) || 0,
                      computedTotalExpense,
                      parseFloat(editForm.desired_savings) || 0
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                    Risk
                  </div>
                  <div style={{ color: 'var(--text-dark)', fontWeight: 800, marginTop: 6 }}>
                    {getRiskLevel(parseFloat(editForm.income) || 0, computedTotalExpense)}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={savingEdit}
                style={{ marginTop: 18 }}
              >
                <Save size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;