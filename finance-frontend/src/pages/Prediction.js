import React, { useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { Save, Lightbulb } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function Prediction({ theme }) {
  const [formData, setFormData] = useState({
    Income: "", Desired_Savings: "", Age: "25", Dependents: "0", Occupation: "0", City_Tier: "1",
    Exp_Housing: "", Exp_Groceries: "", Exp_Utilities: "", Exp_Shopping: "", Exp_Entertainment: "", Exp_Other: ""
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expenseChartData, setExpenseChartData] = useState(null);

  const isDark = theme === 'dark';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateTotalExpense = () => {
    return ['Exp_Housing', 'Exp_Groceries', 'Exp_Utilities', 'Exp_Shopping', 'Exp_Entertainment', 'Exp_Other']
      .reduce((sum, key) => sum + (parseFloat(formData[key]) || 0), 0);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Session missing"); setLoading(false); return; }

    const totalExpense = calculateTotalExpense();
    const income = parseFloat(formData.Income) || 0;

    try {
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          Income: income, Age: 25, Dependents: 0, Occupation: 0, City_Tier: 1, Total_Expense: totalExpense, Desired_Savings: parseFloat(formData.Desired_Savings) || 0
        })
      });

      if (!res.ok) throw new Error("Backend connection failed");
      const data = await res.json();

      setPrediction({
        risk_level: data.risk_level || "Low",
        financial_health: data.financial_health || "Average",
        monthly_savings_potential: data.monthly_savings_potential || (income - totalExpense),
        ai_summary: data.ai_summary,
        ai_tips: data.ai_tips
      });

      setExpenseChartData({
        labels: ['Housing', 'Groceries', 'Utilities', 'Shopping', 'Entertainment', 'Other'],
        datasets: [{
          data: [
            parseFloat(formData.Exp_Housing)||0, parseFloat(formData.Exp_Groceries)||0, parseFloat(formData.Exp_Utilities)||0,
            parseFloat(formData.Exp_Shopping)||0, parseFloat(formData.Exp_Entertainment)||0, parseFloat(formData.Exp_Other)||0
          ],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'],
          borderColor: isDark ? '#111827' : '#FFFFFF',
          borderWidth: 2, hoverOffset: 4
        }]
      });

      toast.success("AI Analysis complete");

    } catch (err) { toast.error("AI connection failed"); } 
    finally { setLoading(false); }
  };

  const saveProgress = async () => {
    if (!prediction) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('financial_progress').insert([{
        user_id: user.id,
        financial_health: prediction.financial_health,
        risk_level: prediction.risk_level,
        savings_potential: prediction.monthly_savings_potential,
        income: parseFloat(formData.Income)||0,
        total_expense: calculateTotalExpense(),
        desired_savings: parseFloat(formData.Desired_Savings)||0,
        exp_housing: parseFloat(formData.Exp_Housing)||0, exp_groceries: parseFloat(formData.Exp_Groceries)||0,
        exp_utilities: parseFloat(formData.Exp_Utilities)||0, exp_shopping: parseFloat(formData.Exp_Shopping)||0,
        exp_entertainment: parseFloat(formData.Exp_Entertainment)||0, exp_other: parseFloat(formData.Exp_Other)||0
      }]);
      if (!error) toast.success("Plan saved to Dashboard");
      else toast.error("Failed to save plan");
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--input-border)', 
    background: 'var(--input-bg)', color: 'var(--text-dark)', outline: 'none'
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>Health Check</h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>Optimize your monthly budget.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <form onSubmit={handleAnalyze}>
            <h3 style={{ margin: '0 0 15px', color: 'var(--text-dark)' }}>Income & Goals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input name="Income" type="number" placeholder="Income" onChange={handleChange} required style={inputStyle} />
              <input name="Desired_Savings" type="number" placeholder="Goal" onChange={handleChange} required style={inputStyle} />
            </div>

            <h3 style={{ margin: '20px 0 15px', color: 'var(--text-dark)' }}>Expenses</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input name="Exp_Housing" type="number" placeholder="Housing" onChange={handleChange} style={inputStyle} />
              <input name="Exp_Groceries" type="number" placeholder="Groceries" onChange={handleChange} style={inputStyle} />
              <input name="Exp_Utilities" type="number" placeholder="Utilities" onChange={handleChange} style={inputStyle} />
              <input name="Exp_Shopping" type="number" placeholder="Shopping" onChange={handleChange} style={inputStyle} />
              <input name="Exp_Entertainment" type="number" placeholder="Entertainment" onChange={handleChange} style={inputStyle} />
              <input name="Exp_Other" type="number" placeholder="Other" onChange={handleChange} style={inputStyle} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{marginTop: '20px'}}>
              {loading ? "Analyzing..." : "Analyze Budget"}
            </button>
          </form>
        </div>

        {prediction && expenseChartData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <h3 style={{ margin: '0 0 15px', color: 'var(--text-dark)' }}>Distribution</h3>
              <div style={{ height: '220px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={expenseChartData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: isDark ? '#94A3B8' : '#64748B' } } } }} />
              </div>
            </div>

            <div className="card" style={{ background: 'var(--input-bg)' }}>
              <h3 style={{ margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                <Lightbulb color="var(--primary)" size={20} /> AI Insights
              </h3>
              
              {prediction.ai_summary && (
                <p style={{ margin: '0 0 15px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                  {prediction.ai_summary}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prediction.ai_tips && prediction.ai_tips.map((tip, idx) => (
                  <div key={idx} style={{ 
                    padding: '12px', background: 'var(--card-bg)', borderRadius: '10px', 
                    borderLeft: `4px solid var(--primary)`, fontSize: '0.9rem', fontWeight: 600,
                    color: 'var(--text-dark)', boxShadow: 'var(--card-shadow)'
                  }}>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={saveProgress} className="btn-primary" style={{ background: 'var(--input-bg)', color: 'var(--text-dark)', border: '1px solid var(--input-border)', boxShadow: 'none' }}>
              <Save size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Save Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Prediction;