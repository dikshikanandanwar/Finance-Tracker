import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

function useViewport() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return { isMobile: width < 768 };
}

function FinancialAdvisor() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ai_advisor_chat');
    return saved
      ? JSON.parse(saved)
      : [{ content: "Hi! I'm Finance's AI Advisor. Ask me anything about your finances.", role: 'assistant' }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { isMobile } = useViewport();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem('ai_advisor_chat', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session required.');
      return;
    }

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat_with_advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ message: userMsg.content })
      });
      if (!response.ok) throw new Error('Connection failed.');
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. What's next?" }]);
    toast.success('Chat reset.');
  };

  return (
    <div className="page-container">
      <div
        className="card chat-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          minHeight: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 180px)',
          borderRadius: isMobile ? '22px' : '28px'
        }}
      >
        <div
          style={{
            padding: isMobile ? '14px 16px' : '15px 20px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--input-bg)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: isMobile ? 42 : 46,
                height: isMobile ? 42 : 46,
                borderRadius: '14px',
                background: 'rgba(59,130,246,0.1)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={22} color="var(--primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', color: 'var(--text-dark)' }}>AI Advisor</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.82rem', fontWeight: 600 }}>
                Smart budgeting help in a chat-style card flow.
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-light)',
              width: 40,
              height: 40,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            background: 'var(--bg-color)'
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: isMobile ? '88%' : '80%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                  color: m.role === 'user' ? '#FFFFFF' : 'var(--text-dark)',
                  border: `1px solid ${m.role === 'user' ? 'transparent' : 'var(--input-border)'}`,
                  borderBottomRightRadius: m.role === 'user' ? '4px' : '18px',
                  borderBottomLeftRadius: m.role !== 'user' ? '4px' : '18px',
                  fontWeight: 600,
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  lineHeight: 1.55,
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div
              style={{
                width: 'fit-content',
                fontWeight: 700,
                color: 'var(--text-light)',
                background: 'var(--card-bg)',
                border: '1px solid var(--input-border)',
                padding: '10px 14px',
                borderRadius: 14
              }}
            >
              AI is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: isMobile ? '14px' : '15px', borderTop: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '10px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about budgeting, debt, etc."
              style={{
                margin: 0,
                width: '100%',
                minHeight: '50px',
                padding: '0 16px',
                borderRadius: '20px',
                background: 'var(--input-bg)',
                color: 'var(--text-dark)',
                border: '1px solid var(--input-border)',
                outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="btn-primary"
              style={{
                width: isMobile ? '100%' : 'auto',
                margin: 0,
                borderRadius: '20px',
                padding: isMobile ? '0 18px' : '0 20px',
                minHeight: '50px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Send size={18} />
                {isMobile ? 'Send' : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialAdvisor;
