import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { PieChart, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `₹${num.toLocaleString()}`;
};

const getWeekKey = (dateInput) => {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

const getWeekLabel = (weekIso) => {
  const start = new Date(weekIso);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return `${startLabel} - ${endLabel}`;
};

const getMonthKey = (dateInput) => {
  const date = new Date(dateInput);
  return `${date.getFullYear()}-${date.getMonth()}`;
};

const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric'
  });
};

const buildGroupedHistory = (history, viewMode) => {
  const groupedMap = new Map();

  history.forEach((item) => {
    const sourceDate = item.created_at || new Date().toISOString();
    const key = viewMode === 'weekly' ? getWeekKey(sourceDate) : getMonthKey(sourceDate);

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        key,
        totalExpense: 0,
        savingsPotential: 0
      });
    }

    const current = groupedMap.get(key);
    current.totalExpense += Number(item.total_expense || 0);
    current.savingsPotential += Number(item.savings_potential || 0);
  });

  const groupedArray = Array.from(groupedMap.values()).sort((a, b) => {
    if (viewMode === 'weekly') return new Date(a.key) - new Date(b.key);
    return a.key.localeCompare(b.key);
  });

  return groupedArray.map((item) => ({
    label: viewMode === 'weekly' ? getWeekLabel(item.key) : getMonthLabel(item.key),
    totalExpense: item.totalExpense,
    savingsPotential: item.savingsPotential
  }));
};

function Visualize({ theme }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [viewMode, setViewMode] = useState('weekly');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
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

        if (data && data.length > 0) {
          setHistory(data);
          generateInsights(data);
        } else {
          setHistory([]);
          setInsights([]);
        }
      } else {
        setHistory([]);
        setInsights([]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const generateInsights = (data) => {
    const latest = data[data.length - 1];
    const tips = [];
    const housingPct = ((latest.exp_housing || 0) / (latest.income || 1)) * 100;

    if (housingPct > 35) {
      tips.push(`Housing consumes ${housingPct.toFixed(1)}% of your income. Target under 30%.`);
    }

    if (latest.savings_potential < latest.desired_savings) {
      tips.push(
        `Action Required: Missing savings goal by ₹${(
          latest.desired_savings - latest.savings_potential
        ).toFixed(2)}.`
      );
    } else {
      tips.push(
        `Bullish: Your current budget supports your monthly savings goal of ₹${latest.desired_savings}.`
      );
    }

    setInsights(tips);
  };

  const isDark = theme === 'dark';

  const groupedHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    return buildGroupedHistory(history, viewMode);
  }, [history, viewMode]);

  const lineChartData = useMemo(() => {
    return {
      labels: groupedHistory.map((item) => item.label),
      datasets: [
        {
          label:
            viewMode === 'weekly'
              ? 'Weekly Savings / Cash Flow'
              : 'Monthly Savings / Cash Flow',
          data: groupedHistory.map((item) => item.savingsPotential),
          borderColor: '#10B981',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(16, 185, 129, 0.10)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: isMobile ? 3 : 4,
          pointHoverRadius: isMobile ? 5 : 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: isDark ? '#111827' : '#FFFFFF',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.35
        },
        {
          label:
            viewMode === 'weekly'
              ? 'Weekly Total Expenses'
              : 'Monthly Total Expenses',
          data: groupedHistory.map((item) => item.totalExpense),
          borderColor: '#EF4444',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(239, 68, 68, 0.10)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.30)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: isMobile ? 3 : 4,
          pointHoverRadius: isMobile ? 5 : 6,
          pointBackgroundColor: '#EF4444',
          pointBorderColor: isDark ? '#111827' : '#FFFFFF',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.35
        }
      ]
    };
  }, [groupedHistory, viewMode, isDark, isMobile]);

  const lineChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: {
              family: "'Inter', sans-serif",
              weight: '600',
              size: isMobile ? 11 : 12
            },
            usePointStyle: true,
            boxWidth: 10,
            padding: isMobile ? 10 : 16
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          titleColor: isDark ? '#F8FAFC' : '#0F172A',
          bodyColor: isDark ? '#CBD5E1' : '#475569',
          borderColor: isDark ? '#374151' : '#E2E8F0',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? '#64748B' : '#94A3B8',
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 30 : 0,
            autoSkip: true,
            font: {
              size: isMobile ? 10 : 12
            }
          }
        },
        y: {
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            color: isDark ? '#64748B' : '#94A3B8',
            callback: (value) => formatCurrency(value),
            font: {
              size: isMobile ? 10 : 12
            }
          },
          beginAtZero: true
        }
      }
    };
  }, [isDark, isMobile]);

  const comparisonChartData = useMemo(() => {
    return {
      labels: groupedHistory.map((item) => item.label),
      datasets: [
        {
          label: 'Expenses',
          data: groupedHistory.map((item) => item.totalExpense),
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderRadius: 8
        },
        {
          label: 'Savings',
          data: groupedHistory.map((item) => item.savingsPotential),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 8
        }
      ]
    };
  }, [groupedHistory]);

  const comparisonChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: {
              family: "'Inter', sans-serif",
              weight: '600',
              size: isMobile ? 11 : 12
            },
            padding: isMobile ? 10 : 16
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          titleColor: isDark ? '#F8FAFC' : '#0F172A',
          bodyColor: isDark ? '#CBD5E1' : '#475569',
          borderColor: isDark ? '#374151' : '#E2E8F0',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? '#64748B' : '#94A3B8',
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 30 : 0,
            autoSkip: true,
            font: {
              size: isMobile ? 10 : 12
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: {
            color: isDark ? '#64748B' : '#94A3B8',
            callback: (value) => formatCurrency(value),
            font: {
              size: isMobile ? 10 : 12
            }
          }
        }
      }
    };
  }, [isDark, isMobile]);

  const latestData = history.length > 0 ? history[history.length - 1] : null;

  const pieChartData = latestData
    ? {
        labels: ['Housing', 'Groceries', 'Utilities', 'Shopping', 'Entertainment', 'Other'],
        datasets: [
          {
            data: [
              latestData.exp_housing || 0,
              latestData.exp_groceries || 0,
              latestData.exp_utilities || 0,
              latestData.exp_shopping || 0,
              latestData.exp_entertainment || 0,
              latestData.exp_other || 0
            ],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6',
              '#64748B'
            ],
            borderColor: isDark ? '#111827' : '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6
          }
        ]
      }
    : null;

  if (loading) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: isMobile ? '18px' : '25px' }}>
        <h1
          style={{
            margin: '0 0 5px',
            color: 'var(--text-dark)',
            fontSize: isMobile ? '1.6rem' : '2rem',
            lineHeight: 1.2
          }}
        >
          Market Analytics
        </h1>
        <p
          style={{
            color: 'var(--text-light)',
            margin: 0,
            fontWeight: 600,
            fontSize: isMobile ? '0.92rem' : '1rem'
          }}
        >
          Deep dive into your financial trajectory.
        </p>
      </header>

      <div
        className="card"
        style={{
          marginBottom: '25px',
          padding: isMobile ? '16px' : '20px',
          borderRadius: isMobile ? '16px' : '20px'
        }}
      >
        <div
          style={{
            margin: '0 0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: '12px',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}
        >
          <h3
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-dark)',
              fontSize: isMobile ? '1rem' : '1.1rem'
            }}
          >
            <TrendingUp size={20} color="var(--primary)" /> Portfolio Trajectory
          </h3>

          <div
            style={{
              display: 'inline-flex',
              width: isMobile ? '100%' : 'auto',
              padding: '4px',
              borderRadius: '14px',
              background: isDark ? 'rgba(30,41,59,0.9)' : '#EEF2FF',
              border: isDark
                ? '1px solid rgba(148,163,184,0.15)'
                : '1px solid rgba(99,102,241,0.10)'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              style={{
                border: 'none',
                padding: isMobile ? '10px 12px' : '9px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                width: isMobile ? '50%' : 'auto',
                background: viewMode === 'weekly' ? '#2563EB' : 'transparent',
                color: viewMode === 'weekly' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569'
              }}
            >
              Weekly
            </button>

            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              style={{
                border: 'none',
                padding: isMobile ? '10px 12px' : '9px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                width: isMobile ? '50%' : 'auto',
                background: viewMode === 'monthly' ? '#2563EB' : 'transparent',
                color: viewMode === 'monthly' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569'
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: isMobile ? '20px' : '24px'
          }}
        >
          <div>
            <div
              style={{
                color: 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginBottom: '12px'
              }}
            >
              Trend Movement
            </div>
            <div style={{ height: isMobile ? '260px' : '320px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          <div>
            <div
              style={{
                color: 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '0.92rem',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BarChart3 size={18} color="#6366F1" />
              Expense vs Savings Comparison
            </div>
            <div style={{ height: isMobile ? '260px' : '320px' }}>
              <Bar data={comparisonChartData} options={comparisonChartOptions} />
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}
      >
        <div
          className="card"
          style={{
            padding: isMobile ? '16px' : '20px',
            borderRadius: isMobile ? '16px' : '20px'
          }}
        >
          <h3
            style={{
              margin: '0 0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-dark)',
              fontSize: isMobile ? '1rem' : '1.1rem'
            }}
          >
            <PieChart size={20} color="#3B82F6" /> Sector Breakdown
          </h3>

          <div
            style={{
              height: isMobile ? '220px' : '260px',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {pieChartData && (
              <Doughnut
                data={pieChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: isDark ? '#94A3B8' : '#64748B',
                        padding: isMobile ? 10 : 16,
                        boxWidth: isMobile ? 10 : 14,
                        font: {
                          size: isMobile ? 10 : 12
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            background: 'var(--input-bg)',
            padding: isMobile ? '16px' : '20px',
            borderRadius: isMobile ? '16px' : '20px'
          }}
        >
          <h3
            style={{
              margin: '0 0 15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-dark)',
              fontSize: isMobile ? '1rem' : '1.1rem'
            }}
          >
            <Lightbulb color="#F59E0B" size={20} /> Analyst Insights
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: isMobile ? '12px' : '14px',
                  background: 'var(--card-bg)',
                  borderRadius: '14px',
                  borderLeft: `4px solid ${
                    insight.includes('Action Required') ? '#EF4444' : 'var(--primary)'
                  }`,
                  fontSize: isMobile ? '0.86rem' : '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                  boxShadow: 'var(--card-shadow)',
                  lineHeight: 1.6
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Visualize;