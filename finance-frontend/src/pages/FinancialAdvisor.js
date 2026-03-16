import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

function FinancialAdvisor() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('ai_advisor_chat');
    return saved ? JSON.parse(saved) : [{ content: "Hi! I'm Finance's AI Advisor. Ask me anything about your finances.", role: 'assistant' }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { localStorage.setItem('ai_advisor_chat', JSON.stringify(messages)); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Session required."); return; }

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat_with_advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: userMsg.content })
      });
      if (!response.ok) throw new Error("Connection failed.");
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared. What's next?" }]);
    toast.success("Chat reset.");
  };

  return (
    <div className="page-container">
      <div className="card chat-container" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: 'calc(100vh - 180px)' }}>
        
        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>AI Advisor</h2>
          </div>
          <button onClick={clearChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <Trash2 size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-color)' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: '18px',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                color: m.role === 'user' ? '#FFFFFF' : 'var(--text-dark)',
                border: `1px solid ${m.role === 'user' ? 'transparent' : 'var(--input-border)'}`,
                borderBottomRightRadius: m.role === 'user' ? '4px' : '18px',
                borderBottomLeftRadius: m.role !== 'user' ? '4px' : '18px',
                fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.4,
                boxShadow: 'var(--card-shadow)'
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ fontWeight: 600, color: 'var(--text-light)' }}>AI is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about budgeting, debt, etc."
              style={{ margin: 0, flex: 1, borderRadius: '20px', background: 'var(--input-bg)', color: 'var(--text-dark)', border: '1px solid var(--input-border)' }}
            />
            <button 
              onClick={sendMessage} 
              disabled={!input.trim() || loading}
              className="btn-primary"
              style={{ width: 'auto', margin: 0, borderRadius: '20px', padding: '0 20px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FinancialAdvisor;
