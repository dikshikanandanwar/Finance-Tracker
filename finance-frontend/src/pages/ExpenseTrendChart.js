import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
    const sourceDate = item.created_at || item.expense_date || new Date().toISOString();
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

const ExpenseTrendChart = ({ history, theme }) => {
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState('weekly');

  const groupedHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    return buildGroupedHistory(history, viewMode);
  }, [history, viewMode]);

  const chartData = useMemo(() => {
    return {
      labels: groupedHistory.map((item) => item.label),
      datasets: [
        {
          label: viewMode === 'weekly' ? 'Weekly Savings Potential' : 'Monthly Savings Potential',
          data: groupedHistory.map((item) => item.savingsPotential),
          borderColor: '#10B981',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(16, 185, 129, 0.12)';

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.03)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
          pointBorderWidth: 2
        },
        {
          label: viewMode === 'weekly' ? 'Weekly Total Expense' : 'Monthly Total Expense',
          data: groupedHistory.map((item) => item.totalExpense),
          borderColor: '#EF4444',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(239, 68, 68, 0.10)';

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#EF4444',
          pointBorderColor: isDark ? '#0F172A' : '#FFFFFF',
          pointBorderWidth: 2
        }
      ]
    };
  }, [groupedHistory, isDark, viewMode]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            padding: 18,
            color: isDark ? '#94A3B8' : '#64748B',
            font: {
              family: "'Inter', sans-serif",
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: isDark
            ? 'rgba(15, 23, 42, 0.96)'
            : 'rgba(15, 23, 42, 0.92)',
          titleColor: '#F8FAFC',
          bodyColor: '#F8FAFC',
          titleFont: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: '700'
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 13
          },
          padding: 12,
          cornerRadius: 12,
          displayColors: true,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: {
              family: "'Inter', sans-serif",
              weight: '600'
            },
            maxRotation: 0,
            autoSkip: true
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [4, 4],
            color: isDark ? 'rgba(148, 163, 184, 0.16)' : '#E2E8F0'
          },
          ticks: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: {
              family: "'Inter', sans-serif",
              weight: '600'
            },
            callback: (value) => formatCurrency(value)
          }
        }
      }
    };
  }, [isDark]);

  if (!history || history.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light)',
          fontWeight: 600,
          textAlign: 'center',
          padding: '0 16px',
          gap: '12px'
        }}
      >
        <div
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            background: 'rgba(59,130,246,0.10)',
            border: '1px solid rgba(59,130,246,0.15)',
            fontSize: '0.82rem'
          }}
        >
          Trend Insights
        </div>
        <div>No trend data available yet. Save a health check!</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}
      >
        <div>
          <div
            style={{
              color: 'var(--text-dark)',
              fontWeight: 700,
              fontSize: '0.95rem'
            }}
          >
            Expense Trend Overview
          </div>
          <div
            style={{
              color: 'var(--text-light)',
              fontSize: '0.82rem',
              marginTop: '4px'
            }}
          >
            Compare savings and expenses by {viewMode === 'weekly' ? 'week' : 'month'}
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
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
              padding: '9px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.84rem',
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
              padding: '9px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.84rem',
              background: viewMode === 'monthly' ? '#2563EB' : 'transparent',
              color: viewMode === 'monthly' ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569'
            }}
          >
            Monthly
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ExpenseTrendChart;