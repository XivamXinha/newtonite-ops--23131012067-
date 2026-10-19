import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemoUsersQuery } from '../hooks/useWorkItems';
import { RoleBadge } from '../components/Badge';
import {
  Users,
  BarChart3,
  Crown,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const DEDICATED_ANALYST_PERSONAS = [
  { id: 'analyst-1', email: 'analyst1@gmail.com', name: 'Analyst 1 (Lead Operations Auditor)', role: 'VIEWER', teamName: 'System Auditor (Global)' },
  { id: 'analyst-2', email: 'analyst2@gmail.com', name: 'Analyst 2 (Cross-Team Workflow Analyst)', role: 'VIEWER', teamName: 'System Auditor (Global)' },
  { id: 'analyst-3', email: 'analyst3@gmail.com', name: 'Analyst 3 (Quality & SLA Reviewer)', role: 'VIEWER', teamName: 'System Auditor (Global)' },
  { id: 'analyst-4', email: 'analyst4@gmail.com', name: 'Analyst 4 (SecOps & Risk Analyst)', role: 'VIEWER', teamName: 'System Auditor (Global)' },
  { id: 'analyst-5', email: 'analyst5@gmail.com', name: 'Analyst 5 (Enterprise Governance Auditor)', role: 'VIEWER', teamName: 'System Auditor (Global)' },
];

const FALLBACK_EMPLOYEES = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  const email = `employ${num}@gmail.com`;
  let role: any = 'MEMBER';
  let teamName = 'General';
  if (num === 20) {
    role = 'ADMIN';
    teamName = 'Leadership';
  } else if (num === 1) {
    role = 'LEAD';
    teamName = 'Engineering';
  } else if (num <= 5) {
    role = 'MEMBER';
    teamName = 'Engineering';
  } else if (num === 6) {
    role = 'LEAD';
    teamName = 'DevOps & IT Support';
  } else if (num <= 10) {
    role = 'MEMBER';
    teamName = 'DevOps & IT Support';
  } else if (num === 11) {
    role = 'LEAD';
    teamName = 'Security Operations';
  } else if (num <= 14) {
    role = 'MEMBER';
    teamName = 'Security Operations';
  } else {
    role = 'MEMBER';
    teamName = 'All Teams (Global)';
  }
  return {
    id: `fallback-${num}`,
    name: num === 20 ? 'Employee 20 (Admin)' : (num === 1 || num === 6 || num === 11) ? `Employee ${num} (Squad Lead)` : `Employee ${num}`,
    email,
    role,
    teamName,
  };
});

const FALLBACK_DEMO_USERS = [...DEDICATED_ANALYST_PERSONAS, ...FALLBACK_EMPLOYEES];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { data: demoUsers } = useDemoUsersQuery();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState<'ALL' | 'LEAD' | 'MEMBER'>('ALL');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const activeDemoUsers = demoUsers && demoUsers.length > 0 ? demoUsers : FALLBACK_DEMO_USERS;

  const analystUsers = activeDemoUsers.filter((u: any) => u.role === 'VIEWER');
  const adminUsers = activeDemoUsers.filter((u: any) => u.role === 'ADMIN');
  const allEmployees = activeDemoUsers.filter((u: any) => u.role !== 'VIEWER' && u.role !== 'ADMIN');

  const filteredEmployees = allEmployees.filter((u: any) => {
    if (employeeFilter === 'LEAD' && u.role !== 'LEAD') return false;
    if (employeeFilter === 'MEMBER' && u.role !== 'MEMBER') return false;
    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teamName && u.teamName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. If using free tier Render backend, it may take ~30-40s to spin up on first request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setErrorMsg(null);
  };

  const handleInstantLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, '123456');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. If using free tier Render backend, it may take ~30-40s to spin up on first request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #c79bf8 0%, #d4b2fb 32%, #cad3b1 72%, #b9c69f 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Center Container matching exact reference image */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Horizontal Line with Circular Avatar in Center */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 480,
            marginBottom: 24,
          }}
        >
          {/* Left subtle white line */}
          <div
            style={{
              flex: 1,
              height: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 2,
            }}
          />

          {/* Central Circular Avatar */}
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 14px',
              flexShrink: 0,
            }}
          >
            {/* Minimalist Purple Outline User Icon */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b58bf4"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
          </div>

          {/* Right subtle white line */}
          <div
            style={{
              flex: 1,
              height: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Form Wrap */}
        <form
          onSubmit={handleManualLogin}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* White Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
              padding: '34px 34px 26px 34px',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            {/* Error Message if any */}
            {errorMsg && (
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 4,
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.78rem',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Input 1: Username / Email */}
            <div
              style={{
                display: 'flex',
                height: 50,
                marginBottom: 16,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Left Darker Gray Icon Box */}
              <div
                style={{
                  width: 52,
                  backgroundColor: '#b8b8b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#3d3d3d"
                >
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>

              {/* Right Lighter Gray Input Box */}
              <input
                type="text"
                placeholder="Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  backgroundColor: '#d8d8d8',
                  border: 'none',
                  outline: 'none',
                  padding: '0 16px',
                  fontSize: '0.96rem',
                  color: '#262626',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Input 2: Password */}
            <div
              style={{
                display: 'flex',
                height: 50,
                marginBottom: 18,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Left Darker Gray Icon Box */}
              <div
                style={{
                  width: 52,
                  backgroundColor: '#b8b8b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="#3d3d3d"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>

              {/* Right Lighter Gray Input Box */}
              <input
                type="password"
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  flex: 1,
                  backgroundColor: '#d8d8d8',
                  border: 'none',
                  outline: 'none',
                  padding: '0 16px',
                  fontSize: '0.96rem',
                  color: '#262626',
                  fontFamily: 'inherit',
                  letterSpacing: '2px',
                }}
              />
            </div>

            {/* Remember me & Forgot Password */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#848484',
                marginTop: 6,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: '#071f3d',
                    cursor: 'pointer',
                    width: 15,
                    height: 15,
                  }}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Default password for all accounts is 123456')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9e9e9e',
                  fontStyle: 'italic',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Solid Dark Midnight Blue LOGIN Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: 52,
              backgroundColor: '#071f3d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0 0 3px 3px',
              fontSize: '1.02rem',
              fontWeight: 700,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(7, 31, 61, 0.28)',
              transition: 'background-color 0.2s ease',
              marginTop: 0,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#0c2f5a';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = '#071f3d';
            }}
          >
            {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        {/* Quick Demo Role Selector Pills (1-Click Fill) */}
        <div
          style={{
            marginTop: 24,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#4a3b63', fontWeight: 700, letterSpacing: '0.5px' }}>
            ⚡ 1-Click Fast Fill Roles:
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <button
              type="button"
              onClick={() => handleQuickSelect('employ20@gmail.com')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                color: '#4338ca',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              👑 Admin (employ20)
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('analyst1@gmail.com')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                color: '#065f46',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              📊 Reviewer (analyst1)
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('employ1@gmail.com')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                color: '#92400e',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              ⚡ Squad Lead (employ1)
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('employ2@gmail.com')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                color: '#1e40af',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              👥 Member (employ2)
            </button>
          </div>

          {/* Toggle All 25 Accounts Directory */}
          <button
            type="button"
            onClick={() => setShowDirectory(!showDirectory)}
            style={{
              marginTop: 10,
              padding: '8px 16px',
              borderRadius: 20,
              backgroundColor: 'rgba(7, 31, 61, 0.12)',
              border: '1px solid rgba(7, 31, 61, 0.25)',
              color: '#071f3d',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {showDirectory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDirectory ? 'Hide Full Account Directory' : 'Browse All 25 Accounts & Roles (Reviewer, Admin, Leads, Members)'}
          </button>
        </div>
      </div>

      {/* Expanded Directory (Reviewer, Admin, Leads & Members) */}
      {showDirectory && (
        <div
          style={{
            maxWidth: 1400,
            width: '100%',
            marginTop: 36,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            {/* 1. REVIEWER / ANALYST (VIEWER) */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '22px 20px',
                border: '1px solid #e2e8f0',
                borderTop: '5px solid #10b981',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BarChart3 size={20} color="#059669" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Reviewer / Analyst
                      </h2>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                        5 Dedicated Accounts
                      </span>
                    </div>
                  </div>
                  <RoleBadge role="VIEWER" />
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.76rem',
                    color: '#166534',
                    lineHeight: 1.45,
                    marginBottom: 14,
                  }}
                >
                  📊 <strong>Reviewer can do view or analysis work:</strong> Inspect all squads, audit which team created what work item, who claimed it, and analyze task resolution/rework history.
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 280,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {analystUsers.map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleInstantLogin(u.email)}
                      disabled={isSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ecfdf5';
                        e.currentTarget.style.borderColor = '#10b981';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {u.email}
                        </div>
                      </div>
                      <ArrowRight size={16} color="#059669" style={{ flexShrink: 0, marginLeft: 8 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. ADMIN CONSOLE */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '22px 20px',
                border: '1px solid #e2e8f0',
                borderTop: '5px solid #6366f1',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Crown size={20} color="#4f46e5" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Admin Governance
                      </h2>
                      <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 700 }}>
                        System Administration
                      </span>
                    </div>
                  </div>
                  <RoleBadge role="ADMIN" />
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    fontSize: '0.76rem',
                    color: '#5b21b6',
                    lineHeight: 1.45,
                    marginBottom: 14,
                  }}
                >
                  👑 <strong>Platform Admin:</strong> Complete governance control — user administration, squad creation, system settings, and org-wide configuration.
                </div>

                {adminUsers.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleInstantLogin(u.email)}
                    disabled={isSubmitting}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      backgroundColor: '#faf5ff',
                      border: '1px solid #e9d5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3e8ff';
                      e.currentTarget.style.borderColor = '#c084fc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#faf5ff';
                      e.currentTarget.style.borderColor = '#e9d5ff';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#0f172a' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#6b21a8', marginTop: 3 }}>
                        {u.email}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        {u.teamName}
                      </div>
                    </div>
                    <ArrowRight size={18} color="#7c3aed" />
                  </button>
                ))}
              </div>
            </div>

            {/* 3. EMPLOYEE DIRECTORY (LEADS & MEMBERS) */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                padding: '22px 20px',
                border: '1px solid #e2e8f0',
                borderTop: '5px solid #0284c7',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={20} color="#0284c7" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Employee Directory
                      </h2>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Leads & Members ({allEmployees.length})
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <div
                    style={{
                      padding: '7px 10px',
                      borderRadius: 6,
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      fontSize: '0.72rem',
                      color: '#92400e',
                      lineHeight: 1.35,
                    }}
                  >
                    ⚡ <strong>Lead can control access:</strong> Review task requests, assign work, approve completed tasks, or return/reject for revisions.
                  </div>
                  <div
                    style={{
                      padding: '7px 10px',
                      borderRadius: 6,
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.72rem',
                      color: '#1e40af',
                      lineHeight: 1.35,
                    }}
                  >
                    👥 <strong>Employee work as following:</strong> Claim unassigned tasks from squad queue, execute work, and submit deliverables for lead sign-off.
                  </div>
                </div>

                {/* Filter Pills & Quick Search */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    marginBottom: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', gap: 3 }}>
                    {(['ALL', 'LEAD', 'MEMBER'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setEmployeeFilter(tab)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 14,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: employeeFilter === tab ? '#0284c7' : '#f1f5f9',
                          color: employeeFilter === tab ? '#ffffff' : '#475569',
                        }}
                      >
                        {tab === 'ALL' ? `All (${allEmployees.length})` : tab === 'LEAD' ? '⚡ Leads' : '👥 Members'}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative', width: 100 }}>
                    <Search size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      style={{
                        padding: '3px 6px 3px 20px',
                        borderRadius: 6,
                        fontSize: '0.68rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 220,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                >
                  {filteredEmployees.map((u: any) => {
                    const isLead = u.role === 'LEAD';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleInstantLogin(u.email)}
                        disabled={isSubmitting}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 6,
                          backgroundColor: isLead ? '#fffbeb' : '#ffffff',
                          border: isLead ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                              {u.name}
                            </span>
                            <RoleBadge role={u.role} />
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {u.teamName} &bull; {u.email}
                          </div>
                        </div>
                        <ArrowRight size={14} color={isLead ? '#d97706' : '#2563eb'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
