import React, { useState } from 'react';
import { supabase } from '../supabase';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { PieChart, TrendingUp, CreditCard, Landmark, CheckCircle, RefreshCw } from 'lucide-react';

function TestCorner() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const subjects = [
    { id: 'budgeting', name: 'Budgeting Basics', test_type: 'Budgeting', icon: <PieChart size={24} color="var(--primary)" /> },
    { id: 'investing', name: 'Investing 101', test_type: 'Investing', icon: <TrendingUp size={24} color="#3B82F6" /> },
    { id: 'debt', name: 'Debt Management', test_type: 'Debt', icon: <CreditCard size={24} color="#EF4444" /> },
    { id: 'taxes', name: 'Tax Essentials', test_type: 'Taxes', icon: <Landmark size={24} color="#F59E0B" /> }
  ];

  const generateTest = async (subject) => {
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setScore(null);
    setIsSubmitted(false);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/generate_full_test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ difficulty: 'Medium', test_type: subject.test_type, learning_context: 'Adult Literacy' })
      });
      if (!res.ok) throw new Error('API Failed');
      const data = await res.json();
      setQuestions(data.questions || data || []);
    } catch (err) {
      toast.error('Failed to load module.');
    } finally {
      setLoading(false);
    }
  };

  const submitTest = () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Answer all questions.');
      return;
    }
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) s++;
    });
    setScore(s);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px', color: 'var(--text-dark)' }}>Learn</h1>
        <p style={{ color: 'var(--text-light)', margin: 0, fontWeight: 600 }}>Test your financial literacy.</p>
      </header>

      {!questions.length && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="card"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '22px' }}
              onClick={() => generateTest(sub)}
            >
              <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '15px' }}>{sub.icon}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{sub.name}</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--text-light)', fontWeight: 600, fontSize: '0.9rem' }}>
                  Start interactive module
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)' }}>Generating module...</div>}

      {questions.length > 0 && (
        <div className="card" style={{ borderRadius: '24px' }}>
          {isSubmitted && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--primary)',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <h2 style={{ color: 'var(--primary)', margin: 0 }}>Score: {score} / {questions.length}</h2>
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 34,
                  height: 34,
                  borderRadius: '999px',
                  background: 'rgba(59,130,246,0.12)',
                  color: 'var(--primary)',
                  fontWeight: 800,
                  marginBottom: '12px'
                }}
              >
                {idx + 1}
              </div>
              <h3 style={{ margin: '0 0 15px', fontSize: '1.05rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>{q.question}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt) => {
                  let bg = 'var(--input-bg)';
                  let border = '2px solid transparent';
                  if (answers[idx] === opt) {
                    bg = 'rgba(59, 130, 246, 0.1)';
                    border = '2px solid #3B82F6';
                  }
                  if (isSubmitted) {
                    if (opt === q.correct_answer) {
                      bg = 'rgba(16, 185, 129, 0.1)';
                      border = '2px solid var(--primary)';
                    } else if (answers[idx] === opt) {
                      bg = 'rgba(239, 68, 68, 0.1)';
                      border = '2px solid #EF4444';
                    }
                  }
                  return (
                    <button
                      key={opt}
                      disabled={isSubmitted}
                      onClick={() => setAnswers({ ...answers, [idx]: opt })}
                      style={{
                        padding: '15px',
                        borderRadius: '14px',
                        border,
                        background: bg,
                        color: 'var(--text-dark)',
                        textAlign: 'left',
                        fontWeight: 600,
                        cursor: isSubmitted ? 'default' : 'pointer',
                        lineHeight: 1.5
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!isSubmitted ? (
            <button className="btn-primary" onClick={submitTest} style={{ minHeight: '52px' }}>
              <CheckCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Submit Module
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ background: 'var(--input-bg)', color: 'var(--text-dark)', border: '1px solid var(--input-border)', minHeight: '52px' }}
              onClick={() => setQuestions([])}
            >
              <RefreshCw size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Return to Menu
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TestCorner;
