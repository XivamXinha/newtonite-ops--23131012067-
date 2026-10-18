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
        backgroundColor: '#edf0f4',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        color: '#0f172a',
      }}
    >
      <div style={{ maxWidth: 1400, width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
              marginBottom: 12,
            }}
          >
            <Shield size={28} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              margin: 0,
            }}
          >
            Newtonite Operations
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: 4 }}>
            Enterprise Task Management & Incident Workflow Engine — Role-Based Access Control
          </p>
        </div>

        {/* 3-Column Architecture matching user wireframe */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* ================= COLUMN 1 (LEFT): VIEWER BOX (TOP) + ADMIN BOX (BOTTOM) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* BOX 1: VIEWER / ANALYST */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '22px 24px',
                border: '1px solid #e2e8f0',
                borderTop: '4px solid #10b981',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
                    <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Viewer (Analyst) Box
                    </h2>
                    <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                      5 Dedicated Auditor Accounts
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: 9999,
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  VIEWER
                </span>
              </div>

              {/* Exact detail requested: "alalysist can do view or analysis work" */}
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.78rem',
                  color: '#166534',
                  lineHeight: 1.45,
                  marginBottom: 14,
                }}
              >
                📊 <strong>Analyst can do view or analysis work:</strong> Inspect all squads, analyze which team created what work item, who claimed it, and audit lead approval vs rework status.
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 230,
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
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: '#f8fafc',
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
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {u.email}
                      </div>
                    </div>
                    <ArrowRight size={16} color="#059669" style={{ flexShrink: 0, marginLeft: 8 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* BOX 2: ADMIN */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '22px 24px',
                border: '1px solid #e2e8f0',
                borderTop: '4px solid #6366f1',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
                    <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Admin Box
                    </h2>
                    <span style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 700 }}>
                      Platform Governance
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
                  fontSize: '0.78rem',
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
                  onClick={() => handleDemoSelect(u.email)}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 14px',
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
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#faf5ff';
                    e.currentTarget.style.borderColor = '#e9d5ff';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6b21a8', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {u.email}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#7c3aed" />
                </button>
              ))}
            </div>
          </div>

          {/* ================= COLUMN 2 (MIDDLE): EMPLOYEE BOX (LEADS & MEMBERS) ================= */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: '22px 24px',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #0284c7',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
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
                  <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Employee ID Box
                  </h2>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Leads & Members ({allEmployees.length} Accounts)
                  </span>
                </div>
              </div>
            </div>

            {/* Exact details requested by user */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '0.78rem',
                  color: '#92400e',
                  lineHeight: 1.45,
                }}
              >
                ⚡ <strong>Lead can control access:</strong> Review task requests, assign work, approve completed tasks, or return/reject for revisions with remarks.
              </div>

              <div
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.78rem',
                  color: '#1e40af',
                  lineHeight: 1.45,
                }}
              >
                👥 <strong>Employee work as following:</strong> Claim unassigned tasks from squad queue, execute work in progress, and submit deliverables for lead sign-off.
              </div>
            </div>

            {/* Filter Pills & Quick Search */}
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
                      padding: '4px 11px',
                      borderRadius: 16,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: employeeFilter === tab ? '#0284c7' : '#f1f5f9',
                      color: employeeFilter === tab ? '#ffffff' : '#475569',
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
                  placeholder="Search..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  style={{
                    padding: '4px 8px 4px 26px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
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
                      backgroundColor: isLead ? '#fffbeb' : '#f8fafc',
                      border: isLead ? '1px solid #fde68a' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isLead ? '#fef3c7' : '#eff6ff';
                      e.currentTarget.style.borderColor = isLead ? '#f59e0b' : '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isLead ? '#fffbeb' : '#f8fafc';
                      e.currentTarget.style.borderColor = isLead ? '#fde68a' : '#e2e8f0';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                          {u.name}
                        </span>
                        <RoleBadge role={u.role} />
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                        {u.teamName} &bull; <span className="font-mono">{u.email}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} color={isLead ? '#d97706' : '#2563eb'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= COLUMN 3 (RIGHT): SIGN IN WITH CREDENTIALS BOX ================= */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: '24px 26px',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #4f46e5',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
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
                  <Lock size={20} color="#4f46e5" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.10rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Sign In with Credentials
                  </h2>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Manual authentication form
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#475569',
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                🔑 Default password for all accounts is <strong className="font-mono" style={{ color: '#4f46e5' }}>123456</strong>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.80rem',
                    marginBottom: 16,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="analyst1@gmail.com, employ1@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
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
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
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
                    backgroundColor: '#4f46e5',
                    border: 'none',
                    borderRadius: 10,
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
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
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.76rem',
                color: '#64748b',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Separated Access Boxes:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li><strong>Admin Box:</strong> System setup & global oversight</li>
                <li><strong>Employee Box:</strong> Leads control access & Members work</li>
                <li><strong>Viewer Box:</strong> Organization audit & workflow analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
