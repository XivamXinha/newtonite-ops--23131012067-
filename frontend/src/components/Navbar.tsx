import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardQueuesQuery } from '../hooks/useWorkItems';
import { RoleBadge } from './Badge';
import { Modal } from './Modal';
import {
  Shield,
  LogOut,
  User,
  LayoutDashboard,
  ListTodo,
  Briefcase,
  Mail,
  Fingerprint,
  CheckCircle2,
  Crown,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentPage: 'dashboard' | 'work-items' | 'item-detail' | 'admin-console';
  setCurrentPage: (page: 'dashboard' | 'work-items' | 'admin-console') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage: _currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData } = useDashboardQueuesQuery();
  const currentRole = (dashboardData?.userRole || user?.role || 'MEMBER') as any;
  const leadTeam = dashboardData?.leadTeam || user?.leadTeam || (currentRole === 'LEAD' && (user?.teamName || dashboardData?.myTeam?.name) ? { name: user?.teamName || dashboardData?.myTeam?.name } : null);
  const memberTeam = dashboardData?.memberTeam || user?.memberTeam || ((currentRole === 'MEMBER' || currentRole === 'VIEWER') && (user?.teamName || dashboardData?.myTeam?.name) ? { name: user?.teamName || dashboardData?.myTeam?.name } : null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* ================= LEFT: LOGO & SITE NAME ONLY ================= */}
          <div
            onClick={() => setCurrentPage(user.role === 'ADMIN' ? 'admin-console' : 'dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.28)',
                flexShrink: 0,
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

          {/* ================= RIGHT: LOGOUT & PROFILE PICTURE DROPDOWN ================= */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Direct Logout Button */}
            <button
              onClick={logout}
              title="Log out"
              className="btn btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#fecdd3';
                e.currentTarget.style.color = '#e11d48';
                e.currentTarget.style.backgroundColor = '#fff1f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>

            {/* Profile Picture Button & Dropdown */}
            {/* Profile Picture Button & Role Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Click to view assigned roles & team name"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 10px 4px 4px',
                  borderRadius: 9999,
                  backgroundColor: isDropdownOpen ? '#eef2ff' : '#ffffff',
                  border: isDropdownOpen ? '1px solid #6366f1' : '1px solid #e2e8f0',
                  boxShadow: isDropdownOpen ? '0 0 0 3px rgba(99, 102, 241, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Profile Picture Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>

                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                    {user.name}
                  </div>
                </div>
              </button>

              {/* Profile & Role Dropdown Popup */}
              {isDropdownOpen && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 320,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                    padding: 12,
                    zIndex: 100,
                  }}
                >
                  {/* User Profile Header Card */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ================= ASSIGNED ROLES & TEAMS DROPDOWN LIST ================= */}
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#64748b',
                        letterSpacing: '0.05em',
                        padding: '4px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Role & Assigned Teams</span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Live Assignment</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {/* ROLE 1: LEAD (TEAM LEADER) */}
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          backgroundColor: leadTeam ? '#fffbeb' : '#f8fafc',
                          border: leadTeam ? '1px solid #fde68a' : '1px solid #e2e8f0',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Crown size={15} color="#b45309" />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>
                              LEAD (Team Leader)
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: leadTeam ? '#dcfce7' : '#f1f5f9',
                              color: leadTeam ? '#15803d' : '#64748b',
                            }}
                          >
                            {leadTeam ? 'ASSIGNED' : 'NOT ASSIGNED'}
                          </span>
                        </div>

                        <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
                          {leadTeam ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#64748b' }}>Assigned Team:</span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  backgroundColor: '#ffffff',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #fde68a',
                                }}
                              >
                                {leadTeam.name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              Currently not assigned as leader of any team by admin.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ROLE 2: MEMBER (SQUAD MEMBER) */}
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          backgroundColor: memberTeam ? '#eff6ff' : '#f8fafc',
                          border: memberTeam ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={15} color="#1d4ed8" />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af' }}>
                              MEMBER (Squad Member)
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: memberTeam ? '#dcfce7' : '#f1f5f9',
                              color: memberTeam ? '#15803d' : '#64748b',
                            }}
                          >
                            {memberTeam ? 'ASSIGNED' : 'NOT ASSIGNED'}
                          </span>
                        </div>

                        <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
                          {memberTeam ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#64748b' }}>Assigned Team:</span>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: '#0f172a',
                                  backgroundColor: '#ffffff',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                {memberTeam.name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                              Currently not assigned as a member of any team by admin.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ROLE 3: ADMIN (IF ADMIN) */}
                      {user.role === 'ADMIN' && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Shield size={15} color="#b91c1c" />
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991b1b' }}>
                                ADMIN (Platform Admin)
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                              }}
                            >
                              GLOBAL
                            </span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#475569' }}>
                            Scope: <strong style={{ color: '#0f172a' }}>Global Access (All Teams)</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options Divider */}
                  <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '8px 0' }} />

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Option 1: Profile */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <User size={16} color="#4f46e5" />
                      <span>Profile</span>
                    </button>

                    {/* Navigation Links inside dropdown for seamless page access */}
                    {user.role === 'ADMIN' ? (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setCurrentPage('admin-console');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '0.84rem',
                          fontWeight: 500,
                          color: '#475569',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Shield size={16} color="#e11d48" />
                        <span>Admin Console</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setCurrentPage('dashboard');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '9px 12px',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            color: '#475569',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LayoutDashboard size={16} color="#4f46e5" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setCurrentPage('work-items');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: '9px 12px',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            color: '#475569',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <ListTodo size={16} color="#0891b2" />
                          <span>Work Items</span>
                        </button>
                      </>
                    )}

                    <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                    {/* Option 2: Logout */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#e11d48',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff1f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={16} color="#e11d48" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= USER PROFILE MODAL ================= */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Employee Profile"
        maxWidth={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Avatar Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {user.name}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <RoleBadge role={user.role} />
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: '#475569',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {user.teamName || 'Global Operations'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b' }}>
                <Briefcase size={15} color="#4f46e5" />
                <span>Assigned Department</span>
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                {user.teamName || 'Global (All Teams)'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b' }}>
                <Shield size={15} color="#0891b2" />
                <span>System Role Authority</span>
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                {user.role === 'ADMIN'
                  ? 'Administrator (Full System Access)'
                  : user.role === 'LEAD'
                  ? 'Team Lead (Approval Authority)'
                  : user.role === 'MEMBER'
                  ? 'Active Contributor'
                  : 'Viewer (Read-Only)'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b' }}>
                <Fingerprint size={15} color="#64748b" />
                <span>User Identifier</span>
              </div>
              <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#64748b' }}>
                {user.id}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#065f46' }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Session Status</span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}>
                Active (Authenticated)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="btn btn-sm"
            >
              Close
            </button>
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                logout();
              }}
              className="btn btn-danger btn-sm"
              style={{ gap: 6 }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
