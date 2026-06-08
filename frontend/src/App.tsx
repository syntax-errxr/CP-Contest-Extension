import { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { storage } from './services/api';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load and apply theme
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await storage.get("theme") as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    await storage.set("theme", nextTheme);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '550px', backgroundColor: 'var(--background-base)' }}>
      {/* Header */}
      <header className="flex-between" style={{ 
        padding: '12px 16px', 
        backgroundColor: 'var(--surface-light)', 
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px', color: 'var(--brand-orange)' }}>⚡</span>
          <h1 style={{ fontSize: '12pt', fontWeight: 600 }}>CP Extension</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ marginRight: '4px' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* View Render */}
      <main style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
