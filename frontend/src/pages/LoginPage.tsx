import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemoUsersQuery } from '../hooks/useWorkItems';
import { RoleBadge } from '../components/Badge';
import {
  Shield,
  ArrowRight,
  Lock,
  Users,
  BarChart3,
  Crown,
  Search,
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleDemoSelect = async (demoEmail: string) => {
    setEmail(demoEmail);
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 20px',
        background: 'linear-gradient(135deg, #020617 0%, #0b1329 50%, #030712 100%)',
        boxSizing: 'border-box',
        color: '#f8fafc',
      }}
    >
      <div style={{ maxWidth: 1380, width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              marginBottom: 12,
            }}
          >
            <Shield size={26} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
            }}
          >
            Newtonite Operations
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: 4 }}>
            Enterprise Task Management & Cross-Team Incident Workflow Engine
          </p>
        </div>

        {/* 3-Column Layout: [analyst + admin] | [employe id] | [sigin credintial] */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 22,
            alignItems: 'stretch',
          }}
        >
          {/* ================= COLUMN 1: ANALYST (TOP) + ADMIN (BOTTOM) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Box: Analyst */}
            <div
              className="glass-card"
              style={{
                padding: '22px 22px',
                borderRadius: 16,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BarChart3 size={18} color="#34d399" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      Analyst (Viewer)
                    </h2>
                    <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 600 }}>
                      5 Dedicated Accounts
                    </span>
                  </div>
                </div>
                <RoleBadge role="VIEWER" />
              </div>

              {/* Detail requested: "alalysist can do view or analysis work" */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(6, 78, 59, 0.35)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  fontSize: '0.76rem',
                  color: '#d1fae5',
                  lineHeight: 1.45,
                  marginBottom: 12,
                }}
              >
                📊 <strong>Analyst can do view or analysis work:</strong> Cross-team governance inspection — see how many teams exist, which team created each work item, who claimed it, and audit lead approval vs rework status.
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 240,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {analystUsers.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleDemoSelect(u.email)}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgba(6, 78, 59, 0.2)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                      e.currentTarget.style.borderColor = '#34d399';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(6, 78, 59, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.25)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        {u.email}
                      </div>
                    </div>
                    <ArrowRight size={15} color="#34d399" style={{ flexShrink: 0, marginLeft: 8 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Box: Admin */}
            <div
              className="glass-card"
              style={{
                padding: '22px 22px',
                borderRadius: 16,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(192, 132, 252, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Crown size={18} color="#c084fc" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      Admin
                    </h2>
                    <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>
                      System Governance
                    </span>
                  </div>
                </div>
                <RoleBadge role="ADMIN" />
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(88, 28, 135, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  fontSize: '0.76rem',
                  color: '#e9d5ff',
                  lineHeight: 1.45,
                  marginBottom: 12,
                }}
              >
                👑 <strong>Platform Admin:</strong> Complete governance control — user administration, squad creation, system settings, and org-wide configuration.
              </div>

              {adminUsers.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleDemoSelect(u.email)}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(88, 28, 135, 0.25)',
                    border: '1px solid rgba(192, 132, 252, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                    e.currentTarget.style.borderColor = '#c084fc';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(88, 28, 135, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.35)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#c084fc', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {u.email}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#c084fc" />
                </button>
              ))}
            </div>
          </div>

          {/* ================= COLUMN 2: EMPLOYE ID (LEADS & MEMBERS) ================= */}
          <div
            className="glass-card"
            style={{
              padding: '22px 24px',
              borderRadius: 16,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} color="#60a5fa" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Employee ID (Personas)
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Leads & Members ({allEmployees.length} Accounts)
                  </span>
                </div>
              </div>
            </div>

            {/* Details requested: "lead can control ascess and employe work as following" */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'rgba(217, 119, 6, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  fontSize: '0.76rem',
                  color: '#fef3c7',
                  lineHeight: 1.45,
                }}
              >
                ⚡ <strong>Lead can control access:</strong> Review task requests, assign work, approve completed tasks, or return/reject for revisions with remarks.
              </div>

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.16)',
                  border: '1px solid rgba(96, 165, 250, 0.35)',
                  fontSize: '0.76rem',
                  color: '#dbeafe',
                  lineHeight: 1.45,
                }}
              >
                👥 <strong>Employee work as following:</strong> Claim unassigned tasks from squad queue, execute work in progress, and submit deliverables for lead sign-off.
              </div>
            </div>

            {/* Filter Pills & Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {(['ALL', 'LEAD', 'MEMBER'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEmployeeFilter(tab)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: employeeFilter === tab ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                      color: employeeFilter === tab ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab === 'ALL' ? `All (${allEmployees.length})` : tab === 'LEAD' ? '⚡ Leads' : '👥 Members'}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: 140 }}>
                <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search ID..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  style={{
                    padding: '4px 8px 4px 26px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Scrollable List of Employees */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flex: 1,
                maxHeight: 390,
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
                    onClick={() => handleDemoSelect(u.email)}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isLead ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isLead ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isLead ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.borderColor = isLead ? '#fbbf24' : '#60a5fa';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isLead ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = isLead ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          {u.name}
                        </span>
                        <RoleBadge role={u.role} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        {u.teamName} &bull; <span className="font-mono">{u.email}</span>
                      </div>
                    </div>
                    <ArrowRight size={15} color={isLead ? '#f59e0b' : '#3b82f6'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= COLUMN 3: SIGN IN WITH CREDENTIALS ================= */}
          <div
            className="glass-card"
            style={{
              padding: '24px 26px',
              borderRadius: 16,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(129, 140, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={18} color="#818cf8" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Sign In with Credentials
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Standard login form
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '0.76rem',
                  color: '#c7d2fe',
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                🔑 Default password for all accounts is <strong className="font-mono" style={{ color: '#ffffff' }}>123456</strong>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '0.80rem',
                    marginBottom: 16,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="e.g. analyst1@gmail.com, employ1@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: 6,
                    padding: '12px 16px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace →'}
                </button>
              </form>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.74rem',
                color: '#94a3b8',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Enterprise Access Hierarchy:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li><strong>Admin:</strong> System setup & global oversight</li>
                <li><strong>Lead:</strong> Access control, approvals & rejections</li>
                <li><strong>Member:</strong> Claiming & executing tasks</li>
                <li><strong>Analyst:</strong> View & workflow audit inspection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
