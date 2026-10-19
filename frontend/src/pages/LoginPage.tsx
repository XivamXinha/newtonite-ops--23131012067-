import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemoUsersQuery } from '../hooks/useWorkItems';
import { RoleBadge } from '../components/Badge';
import {
  Users,
  BarChart3,
  Crown,
  Search,
  Check,
  Shield,
  KeyRound,
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

type ActiveTab = 'ADMIN' | 'MEMBER' | 'ANALYST' | 'DIRECT';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { data: demoUsers } = useDemoUsersQuery();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ADMIN');
  const [email, setEmail] = useState('employ20@gmail.com');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
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

  const handleManualLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter or select a valid username / email.');
      return;
    }
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

  const handleSelectUser = (selectedEmail: string, autoSubmit = false) => {
    setEmail(selectedEmail);
    setPassword('123456');
    setErrorMsg(null);
    if (autoSubmit) {
      setIsSubmitting(true);
      login(selectedEmail, '123456').catch((err: any) => {
        setErrorMsg(err.message || 'Login failed.');
        setIsSubmitting(false);
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #112240 0%, #0a192f 60%, #020c1b 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '30px 16px',
        boxSizing: 'border-box',
        color: '#f8fafc',
        fontFamily: "'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 93, 34, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '20%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(50px)',
        }}
      />

      <div style={{ width: '100%', maxWidth: 760, zIndex: 1 }}>
        {/* Main Header matching Multi Login & Signup style */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: 'rgba(232, 93, 34, 0.15)',
              border: '1px solid rgba(232, 93, 34, 0.35)',
              marginBottom: 12,
            }}
          >
            <Shield size={28} color="#e85d22" />
          </div>
          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              letterSpacing: '5px',
              textTransform: 'uppercase',
              color: '#ffffff',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            MULTI LOGIN & WORKSPACE PORTAL
          </h1>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.88rem',
              marginTop: 6,
              letterSpacing: '1px',
            }}
          >
            Role-Based Access for System Admin, Squad Employees & Independent Analysts
          </p>
        </div>

        {/* Multi-Section Glassmorphism Card */}
        <div
          style={{
            backgroundColor: 'rgba(13, 27, 46, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 35px rgba(232, 93, 34, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Top Multi-Tab Bar (Exact style from screenshot: LOGIN | SIGNUP | RESET PASSWORD | LOGIN OPTIONS) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Tab 1: Login as Admin */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setEmail('employ20@gmail.com');
              }}
              style={{
                padding: '16px 12px',
                border: 'none',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: activeTab === 'ADMIN' ? '#e85d22' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'ADMIN' ? '#ffffff' : '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <Crown size={15} />
              <span>LOGIN AS ADMIN</span>
            </button>

            {/* Tab 2: Login as Member / Employee */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('MEMBER');
                setEmail('employ1@gmail.com');
              }}
              style={{
                padding: '16px 12px',
                border: 'none',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: activeTab === 'MEMBER' ? '#e85d22' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'MEMBER' ? '#ffffff' : '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <Users size={15} />
              <span>LOGIN AS MEMBER</span>
            </button>

            {/* Tab 3: Login as Analyst / Reviewer */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('ANALYST');
                setEmail('analyst1@gmail.com');
              }}
              style={{
                padding: '16px 12px',
                border: 'none',
                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: activeTab === 'ANALYST' ? '#e85d22' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'ANALYST' ? '#ffffff' : '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <BarChart3 size={15} />
              <span>LOGIN AS ANALYST</span>
            </button>

            {/* Tab 4: Direct Sign In Form */}
            <button
              type="button"
              onClick={() => setActiveTab('DIRECT')}
              style={{
                padding: '16px 12px',
                border: 'none',
                backgroundColor: activeTab === 'DIRECT' ? '#e85d22' : 'rgba(255, 255, 255, 0.04)',
                color: activeTab === 'DIRECT' ? '#ffffff' : '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <KeyRound size={15} />
              <span>DIRECT LOGIN</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div style={{ padding: '30px 32px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '0.82rem',
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* ================= SECTION 1: ADMIN ================= */}
            {activeTab === 'ADMIN' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      👑 System Administrator Console
                    </h2>
                    <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      Complete platform authority — user administration, squad creation & org settings.
                    </p>
                  </div>
                  <RoleBadge role="ADMIN" />
                </div>

                {/* Admin Persona List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {adminUsers.map((u: any) => {
                    const isSelected = email === u.email;
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.email)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'rgba(232, 93, 34, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid #e85d22' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: '#e85d22',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.90rem',
                            }}
                          >
                            AD
                          </div>
                          <div>
                            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                              {u.email} &bull; <span style={{ color: '#fb923c' }}>{u.teamName}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isSelected && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#e85d22',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Check size={14} /> SELECTED
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(u.email, true);
                            }}
                            disabled={isSubmitting}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 4,
                              backgroundColor: '#e85d22',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            1-Click Login →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= SECTION 2: MEMBER / EMPLOYEE ================= */}
            {activeTab === 'MEMBER' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      👥 Squad Employees Directory (Leads & Members)
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      ⚡ <strong>Lead can control access</strong> &bull; 👥 <strong>Employees claim & execute squad tasks</strong>
                    </p>
                  </div>

                  {/* Filter Tabs & Search */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 3, backgroundColor: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 6 }}>
                      {(['ALL', 'LEAD', 'MEMBER'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setEmployeeFilter(tab)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor: employeeFilter === tab ? '#e85d22' : 'transparent',
                            color: employeeFilter === tab ? '#ffffff' : '#94a3b8',
                          }}
                        >
                          {tab === 'ALL' ? `All (${allEmployees.length})` : tab === 'LEAD' ? '⚡ Leads (3)' : '👥 Members (16)'}
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative', width: 140 }}>
                      <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        style={{
                          padding: '5px 8px 5px 26px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Employee Scrollable List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 250,
                    overflowY: 'auto',
                    marginBottom: 20,
                    paddingRight: 6,
                  }}
                >
                  {filteredEmployees.map((u: any) => {
                    const isSelected = email === u.email;
                    const isLead = u.role === 'LEAD';
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.email)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 6,
                          backgroundColor: isSelected ? 'rgba(232, 93, 34, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid #e85d22' : '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: isLead ? '#d97706' : '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                            }}
                          >
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff' }}>
                                {u.name}
                              </span>
                              <RoleBadge role={u.role} />
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {u.teamName} &bull; <span style={{ fontFamily: 'monospace' }}>{u.email}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isSelected && (
                            <span style={{ fontSize: '0.70rem', color: '#e85d22', fontWeight: 800 }}>
                              ✓ SELECTED
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(u.email, true);
                            }}
                            disabled={isSubmitting}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 4,
                              backgroundColor: isSelected ? '#e85d22' : 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Select & Login →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= SECTION 3: ANALYST ================= */}
            {activeTab === 'ANALYST' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      📊 Dedicated Reviewers & Analysts (5 Accounts)
                    </h2>
                    <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      Reviewer can do view or analysis work: see all squads, what work was created, who claimed it, and status.
                    </p>
                  </div>
                  <RoleBadge role="VIEWER" />
                </div>

                {/* Analyst List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 250,
                    overflowY: 'auto',
                    marginBottom: 20,
                    paddingRight: 6,
                  }}
                >
                  {analystUsers.map((u: any) => {
                    const isSelected = email === u.email;
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u.email)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 6,
                          backgroundColor: isSelected ? 'rgba(232, 93, 34, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid #e85d22' : '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                            }}
                          >
                            AN
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isSelected && (
                            <span style={{ fontSize: '0.70rem', color: '#e85d22', fontWeight: 800 }}>
                              ✓ SELECTED
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(u.email, true);
                            }}
                            disabled={isSubmitting}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 4,
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            1-Click Login →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= SECTION 4: DIRECT LOGIN ================= */}
            {activeTab === 'DIRECT' && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
                  🔑 Sign In with Workspace Credentials
                </h2>
                <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Type any registered employee, lead, admin or reviewer email address. Default password is <span style={{ color: '#fb923c', fontWeight: 700 }}>123456</span>.
                </p>
              </div>
            )}

            {/* ================= INPUTS & LOGIN BUTTON (Exact from user image) ================= */}
            <form onSubmit={handleManualLogin}>
              <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Username / Email Bar */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: 4, fontWeight: 700 }}>
                    USERNAME / EMAIL:
                  </label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: 48,
                      backgroundColor: 'rgba(74, 95, 122, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: 4,
                      padding: '0 16px',
                      color: '#ffffff',
                      fontSize: '0.94rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Password Bar */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', marginBottom: 4, fontWeight: 700 }}>
                    PASSWORD:
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      height: 48,
                      backgroundColor: 'rgba(74, 95, 122, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: 4,
                      padding: '0 16px',
                      color: '#ffffff',
                      fontSize: '0.94rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      letterSpacing: '2px',
                    }}
                  />
                </div>

                {/* Remember Me Checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    id="remember_me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: '#e85d22',
                      width: 16,
                      height: 16,
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="remember_me"
                    style={{
                      fontSize: '0.80rem',
                      color: '#cbd5e1',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontWeight: 600,
                    }}
                  >
                    REMEMBER ME
                  </label>
                </div>

                {/* Prominent High-Contrast Orange LOGIN Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    maxWidth: 240,
                    margin: '6px auto 0 auto',
                    height: 46,
                    backgroundColor: '#e85d22',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 3,
                    fontSize: '0.96rem',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(232, 93, 34, 0.45)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.backgroundColor = '#d14f19';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.backgroundColor = '#e85d22';
                  }}
                >
                  {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Text (Exact match from screenshot) */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 26,
            color: '#64748b',
            fontSize: '0.78rem',
            letterSpacing: '0.8px',
          }}
        >
          &copy; 2026 Multi Login &amp; Workspace Portal. All Rights Reserved | Design by Newtonite
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
