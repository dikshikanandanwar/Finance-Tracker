import React from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ExpenseTrendChart = ({ history, theme }) => {
  const isDark = theme === 'dark';

  const chartData = {
    labels: history.map((item) =>
      new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Savings Potential ($)',
        data: history.map((item) => item.savings_potential),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: isDark ? '#111827' : '#FFF'
      },
      {
        label: 'Total Expenses ($)',
        data: history.map((item) => item.total_expense || 0),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: isDark ? '#111827' : '#FFF'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 16,
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: "'Inter', sans-serif", weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(31, 41, 55, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#F8FAFC',
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", weight: '500' },
          color: isDark ? '#64748B' : '#94A3B8'
        }
      },
      y: {
        grid: { borderDash: [4, 4], color: isDark ? '#374151' : '#E2E8F0' },
        beginAtZero: true,
        ticks: {
          font: { family: "'Inter', sans-serif", weight: '500' },
          color: isDark ? '#64748B' : '#94A3B8'
        }
      }
    }
  };

  if (!history || history.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-light)',
          fontWeight: 600,
          textAlign: 'center',
          padding: '0 16px'
        }}
      >
        No trend data available yet. Save a health check!
      </div>
    );
  }

  return <Line data={chartData} options={chartOptions} />;
};

export default ExpenseTrendChart;
