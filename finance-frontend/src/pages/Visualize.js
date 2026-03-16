import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { PieChart, TrendingUp, Lightbulb } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

function Visualize({ theme }) { 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('financial_progress')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (data && data.length > 0) {
          setHistory(data);
          generateInsights(data);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const generateInsights = (data) => {
    const latest = data[data.length - 1];
    const tips = [];
    const housingPct = ((latest.exp_housing || 0) / (latest.income || 1)) * 100;
    
    if (housingPct > 35) tips.push(`Housing consumes ${housingPct.toFixed(1)}% of your income. Target under 30%.`);
    if (latest.savings_potential < latest.desired_savings) tips.push(`Action Required: Missing savings goal by $${(latest.desired_savings - latest.savings_potential).toFixed(2)}.`);
    else tips.push(`Bullish: Your current budget supports your monthly savings goal of $${latest.desired_savings}.`);

    setInsights(tips);
  };

  const isDark = theme === 'dark';
  
  const stockChartData = {
    labels: history.map(item => new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Savings / Cash Flow ($)',
        data: history.map(item => item.savings_potential || 0),
        borderColor: '#10B981', 
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        pointRadius: 0, 
        pointHoverRadius: 6,
        fill: true,
        tension: 0.1 
      },
      {
        label: 'Total Expenses ($)',
        data: history.map(item => item.total_expense || 0),
        borderColor: '#EF4444', 
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.1
      }
    ]
  };

  const stockChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { 
      legend: { position: 'top', labels: { color: isDark ? '#94A3B8' : '#64748B', font: { family: "'Inter', sans-serif", weight: '600' } } },
      tooltip: {
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#F8FAFC' : '#0F172A',
        bodyColor: isDark ? '#94A3B8' : '#64748B',
        borderColor: isDark ? '#374151' : '#E2E8F0',
        borderWidth: 1, padding: 12
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: isDark ? '#64748B' : '#94A3B8' } },
      y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: isDark ? '#64748B' : '#94A3B8' }, beginAtZero: true }
    }
  };

  const latestData = history.length > 0 ? history[history.length - 1] : null;
  const pieChartData = latestData ? {
    labels: ['Housing', 'Groceries', 'Utilities', 'Shopping', 'Entertainment', 'Other'],
    datasets: [{
      data: [
        latestData.exp_housing || 0, latestData.exp_groceries || 0,
        latestData.exp_utilities || 0, latestData.exp_shopping || 0,
        latestData.exp_entertainment || 0, latestData.exp_other || 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'],
      borderColor: isDark ? '#111827' : '#FFFFFF',
      borderWidth: 2, hoverOffset: 6
    }]
  } : null;

  if (loading) return <div className="page-container"><div className="card" style={{textAlign: 'center', padding: 40}}>Loading market data...</div></div>;

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>Market Analytics</h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>Deep dive into your financial trajectory.</p>
      </header>

      <div className="card" style={{ marginBottom: '25px', padding: '20px', borderRadius: '20px' }}>
        <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
          <TrendingUp size={20} color="var(--primary)" /> Portfolio Trajectory
        </h3>
        <div style={{ height: '350px' }}>
          <Line data={stockChartData} options={stockChartOptions} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
            <PieChart size={20} color="#3B82F6" /> Sector Breakdown
          </h3>
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            {pieChartData && <Doughnut data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: isDark ? '#94A3B8' : '#64748B' } } } }} />}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
            <Lightbulb color="#F59E0B" size={20} /> Analyst Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ 
                padding: '14px', background: 'var(--card-bg)', borderRadius: '12px', 
                borderLeft: `4px solid ${insight.includes('Action Required') ? '#EF4444' : 'var(--primary)'}`, 
                fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)',
                boxShadow: 'var(--card-shadow)'
              }}>
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