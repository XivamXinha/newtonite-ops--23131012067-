import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDemoUsersQuery } from '../hooks/useWorkItems';
import { RoleBadge } from '../components/Badge';
import { Shield, ArrowRight, Lock, Users } from 'lucide-react';

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
  } else if (num <= 14) {
    role = 'MEMBER';
    teamName = 'Security Operations';
  } else {
    role = 'MEMBER';
    teamName = 'All Teams (Global)';
  }
  return {
    id: `fallback-${num}`,
    name: num === 20 ? 'Employee 20 (Admin)' : `Employee ${num}`,
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
  const [personaFilter, setPersonaFilter] = useState<'ALL' | 'ANALYST' | 'ADMIN' | 'LEAD' | 'MEMBER'>('ALL');

  const activeDemoUsers = demoUsers && demoUsers.length > 0 ? demoUsers : FALLBACK_DEMO_USERS;

  const filteredUsers = activeDemoUsers.filter((u: any) => {
    if (personaFilter === 'ALL') return true;
    if (personaFilter === 'ANALYST') return u.role === 'VIEWER';
    if (personaFilter === 'ADMIN') return u.role === 'ADMIN';
    if (personaFilter === 'LEAD') return u.role === 'LEAD';
    if (personaFilter === 'MEMBER') return u.role === 'MEMBER';
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
        padding: '30px 20px',
      }}
    >
      <div style={{ maxWidth: 960, width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              marginBottom: 16,
            }}
          >
            <Shield size={28} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Newtonite
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: 4 }}>
            Enterprise Task Management & Incident Workflow Engine
          </p>
        </div>

        {/* 2-Column Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: 28,
          }}
        >
          {/* Left Column: Instant Demo User Switcher (FR-01) */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Users size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Instant Demo Access ({activeDemoUsers.length} Users)
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Select any pre-seeded persona to test permissions, cross-team approvals, and full workflow auditing:
            </p>

            {/* Role Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {[
                { id: 'ALL', label: `All (${activeDemoUsers.length})` },
                { id: 'ANALYST', label: '📊 Analysts (5)' },
                { id: 'ADMIN', label: '👑 Admin (1)' },
                { id: 'LEAD', label: '⚡ Leads' },
                { id: 'MEMBER', label: '👥 Members' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPersonaFilter(tab.id as any)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: personaFilter === tab.id ? '#4f46e5' : '#f1f5f9',
                    borderColor: personaFilter === tab.id ? '#4338ca' : '#e2e8f0',
                    color: personaFilter === tab.id ? '#ffffff' : '#475569',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 6 }}>
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleDemoSelect(u.email)}
                  disabled={isSubmitting}
                  className="glass-card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: u.role === 'VIEWER' ? '#ecfdf5' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: u.role === 'VIEWER' ? '#a7f3d0' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                        {u.name}
                      </span>
                      <RoleBadge role={u.role} />
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 2 }}>
                      {u.teamName} &bull; <span className="font-mono">{u.email}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} color={u.role === 'VIEWER' ? '#059669' : '#6366f1'} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Direct Credential Login */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Lock size={20} color="#34d399" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Sign In with Credentials
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Default password for all 20 accounts is <strong className="font-mono" style={{ color: '#0f172a' }}>123456</strong>
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleManualLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-control"
                    placeholder="employ1@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 8, padding: 12 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In to Workspace'}
              </button>

              <div
                style={{
                  marginTop: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Evaluation Note:</strong> No public signup is required; seed users represent all key RBAC roles (Viewer, Member, Lead, Admin) and multi-team boundaries.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
