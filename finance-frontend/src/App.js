import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './supabase'; 
import { LayoutDashboard, User, BookOpen, Sparkles, LineChart, PieChart, LogOut, Moon, Sun } from 'lucide-react';
import { Toaster } from 'react-hot-toast'; 
//comment
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TestCorner from './pages/TestCorner';
import Prediction from './pages/Prediction';
import FinancialAdvisor from './pages/FinancialAdvisor'; 
import Visualize from './pages/Visualize'; 
import Login from './pages/Login';
import './App.css';

function NavItem({ to, icon, label }) {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <li>
            <Link to={to} className={isActive ? "active" : ""}>
                <div className="nav-icon">{icon}</div>
                <span className="nav-label">{label}</span>
            </Link>
        </li>
    );
}

function App() {
  const [session, setSession] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const handleLogout = async () => { setShowLogoutModal(false); await supabase.auth.signOut(); };

  // BULLETPROOF THEME TOGGLE BUTTON
const ThemeToggleBtn = () => (
  <label className="theme-switch">
    <input 
      type="checkbox" 
      checked={theme === 'dark'} 
      onChange={toggleTheme} 
    />
    <span className="slider">
      {theme === 'dark' ? <Moon size={14}/> : <Sun size={14}/>}
    </span>
  </label>
);

  if (!session) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <Login />
      </>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="app-layout">
        
        {/* MOBILE TOP BAR (Only visible on phones) */}
        <header className="mobile-top-bar">
            <div className="logo-mobile">Finance Advisor</div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <ThemeToggleBtn />
                <button onClick={() => setShowLogoutModal(true)} style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <LogOut size={22} />
                </button>
            </div>
        </header>

        {/* SIDEBAR / BOTTOM NAV */}
        <nav className="sidebar">
          
          {/* REMOVED inline display:flex so mobile CSS can hide this properly */}
          <div className="logo-desktop">
             <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>Finance Advisor</span>
             <ThemeToggleBtn />
          </div>
          
          <ul className="nav-links">
            <NavItem to="/" icon={<LayoutDashboard size={22}/>} label="Home" />
            <NavItem to="/predict" icon={<LineChart size={22}/>} label="Health" />
            <NavItem to="/visualize" icon={<PieChart size={22}/>} label="Analytics" />
            <NavItem to="/test-corner" icon={<BookOpen size={22}/>} label="Learn" />
            <NavItem to="/advisor" icon={<Sparkles size={22}/>} label="AI Chat" />
            <NavItem to="/profile" icon={<User size={22}/>} label="Profile" />
          </ul>
          
          <button className="logout-btn-desktop" onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20}/> <span className="nav-label">Log Out</span>
          </button>
        </nav>
        
        {/* MAIN CONTENT AREA */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard theme={theme} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/predict" element={<Prediction theme={theme} />} />
            <Route path="/visualize" element={<Visualize theme={theme} />} />
            <Route path="/test-corner" element={<TestCorner />} />
            <Route path="/advisor" element={<FinancialAdvisor />} />
          </Routes>
        </main>

        {/* LOGOUT MODAL */}
        {showLogoutModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', boxSizing: 'border-box'
          }}>
              <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <LogOut size={30} color="#EF4444" />
                  </div>
                  <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-dark)' }}>Ready to leave?</h2>
                  <p style={{ color: 'var(--text-light)', marginBottom: '25px' }}>Are you sure you want to log out?</p>
                  <div style={{ display: 'flex', gap: '15px' }}>
                      <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-dark)', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleLogout} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#EF4444', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Log Out</button>
                  </div>
              </div>
          </div>
        )}

      </div>
    </Router>
  );
}

export default App;
