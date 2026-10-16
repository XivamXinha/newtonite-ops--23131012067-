import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemoUsersQuery } from '../hooks/useWorkItems';
import { RoleBadge } from './Badge';
import { Shield, LogOut, LayoutDashboard, ListTodo } from 'lucide-react';

interface NavbarProps {
  currentPage: 'dashboard' | 'work-items' | 'item-detail' | 'admin-console';
  setCurrentPage: (page: 'dashboard' | 'work-items' | 'admin-console') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout, switchUser } = useAuth();
  const { data: demoUsers } = useDemoUsersQuery();

  if (!user) return null;

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div
            onClick={() => setCurrentPage(user.role === 'ADMIN' ? 'admin-console' : 'dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Shield size={20} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #0f172a, #334155)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Newtonite
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                  marginTop: -2,
                  letterSpacing: '0.04em',
                }}
              >
                WORKFLOW & INCIDENTS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentPage('admin-console')}
                className={`btn btn-sm ${currentPage === 'admin-console' ? 'btn-primary' : ''}`}
                style={{
                  background: currentPage === 'admin-console' ? 'linear-gradient(135deg, #e11d48, #ea580c)' : 'transparent',
                  border: currentPage === 'admin-console' ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid transparent',
                  color: currentPage === 'admin-console' ? '#ffffff' : 'var(--text-main)',
                }}
              >
                <Shield size={16} />
                Admin Console
              </button>
            )}
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`btn btn-sm ${currentPage === 'dashboard' ? 'btn-primary' : ''}`}
              style={{
                background: currentPage === 'dashboard' ? undefined : 'transparent',
                border: currentPage === 'dashboard' ? undefined : '1px solid transparent',
                color: currentPage === 'dashboard' ? '#ffffff' : 'var(--text-main)',
              }}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('work-items')}
              className={`btn btn-sm ${currentPage === 'work-items' ? 'btn-primary' : ''}`}
              style={{
                background: currentPage === 'work-items' ? undefined : 'transparent',
                border: currentPage === 'work-items' ? undefined : '1px solid transparent',
                color: currentPage === 'work-items' ? '#ffffff' : 'var(--text-main)',
              }}
            >
              <ListTodo size={16} />
              Work Items
            </button>
          </nav>
        </div>

        {/* User Switcher & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Quick Demo Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              User:
            </span>
            <select
              value={user.email}
              onChange={(e) => switchUser(e.target.value)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {demoUsers?.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} — [{u.role}] ({u.teamName})
                </option>
              ))}
            </select>
          </div>

          {/* User pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              background: '#f1f5f9',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {user.name[0]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              {user.teamName || 'Global'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Log out"
            className="btn btn-sm"
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
