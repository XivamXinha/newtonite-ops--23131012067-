import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, RoleBadge, TypeBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Users,
  Briefcase,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Eye,
  Crown,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  Search,
  Trash2,
} from 'lucide-react';

type AdminTab =
  | 'manage-team'
  | 'manage-user'
  | 'ongoing-work'
  | 'completed-work'
  | 'high-priority'
  | 'approvals'
  | 'rejections';

interface AdminDashboardPageProps {
  onSelectItem: (id: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onSelectItem }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('manage-team');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modals state
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamLeadId, setNewTeamLeadId] = useState('');
  const [newTeamMemberIds, setNewTeamMemberIds] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [editRole, setEditRole] = useState('MEMBER');
  const [editTeamId, setEditTeamId] = useState('');

  // Eye detail view for team
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);

  // 1. Teams Query
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const res = await apiRequest('/admin/teams');
      return res.data;
    },
  });

  // 2. Users Query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiRequest('/admin/users');
      return res.data;
    },
  });

  // 3. Work View Query
  const { data: workViewData, isLoading: workViewLoading } = useQuery({
    queryKey: ['admin-work-view', activeTab],
    queryFn: async () => {
      let category = 'ongoing';
      if (activeTab === 'ongoing-work') category = 'ongoing';
      if (activeTab === 'completed-work') category = 'completed';
      if (activeTab === 'high-priority') category = 'high-priority';
      if (activeTab === 'approvals') category = 'approvals';
      if (activeTab === 'rejections') category = 'rejections';

      const res = await apiRequest(`/admin/work-views/${category}`);
      return res.data;
    },
    enabled: [
      'ongoing-work',
      'completed-work',
      'high-priority',
      'approvals',
      'rejections',
    ].includes(activeTab),
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      leadUserId?: string;
      memberUserIds?: string[];
    }) => {
      const res = await apiRequest('/admin/teams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsNewTeamModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamLeadId('');
      setNewTeamMemberIds([]);
      setMemberSearchTerm('');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setSelectedUserForEdit(null);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest(`/admin/teams/${teamId}`, {
        method: 'DELETE',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to drop and delete team "${teamName}"? All users will be detached from this team.`)) {
      return;
    }
    try {
      await deleteTeamMutation.mutateAsync(teamId);
    } catch (err: any) {
      alert(err.message || 'Failed to drop team');
    }
  };

  const handleApprove = async (itemId: string, version: number) => {
    try {
      await apiRequest(`/work-items/${itemId}/transition`, {
        method: 'POST',
        body: JSON.stringify({ targetStatus: 'RESOLVED', version }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-work-view'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'manage-team', label: 'Manage Team', icon: <Briefcase size={18} /> },
    { id: 'manage-user', label: 'Manage User', icon: <Users size={18} /> },
    { id: 'ongoing-work', label: 'Ongoing Work', icon: <PlayCircle size={18} /> },
    { id: 'completed-work', label: 'Completed Work', icon: <CheckCircle2 size={18} /> },
    { id: 'high-priority', label: 'High Priority', icon: <AlertTriangle size={18} /> },
    { id: 'approvals', label: 'Approvals', icon: <Clock size={18} /> },
    { id: 'rejections', label: 'Rejections', icon: <XCircle size={18} /> },
  ];

  // Helper for computing team stats when viewing a team via the Eye icon
  const getTeamStats = (team: any) => {
    const items: any[] = team?.workItems || [];
    const completed = items.filter((w) => w.status === 'RESOLVED' || w.status === 'CLOSED').length;
    const ongoing = items.filter((w) => w.status === 'IN_PROGRESS').length;
    const incomplete = items.filter((w) => w.status === 'OPEN' || w.status === 'IN_REVIEW').length;
    const total = items.length;

    const users: any[] = team?.users || [];
    const leads = users.filter((u) => u.role === 'LEAD');
    const members = users.filter((u) => u.role !== 'LEAD');

    return { completed, ongoing, incomplete, total, leads, members, items };
  };

  const activeTeamStats = viewingTeam ? getTeamStats(viewingTeam) : null;

  // Strict RBAC Guard: Only Admins can access Admin Console and create teams
  if (user && user.role !== 'ADMIN') {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 61px)',
          backgroundColor: '#f8fafc',
          padding: 30,
        }}
      >
        <div
          className="glass-card animate-fade-in"
          style={{
            maxWidth: 480,
            padding: 36,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #fecdd3',
            boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.08)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#ffe4e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Shield size={28} color="#e11d48" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            Access Restricted: Admin Only
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 20 }}>
            Team creation, department provisioning, and squad management are strictly restricted to Platform Administrators.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        width: '100%',
        minHeight: 'calc(100vh - 61px)',
        height: 'calc(100vh - 61px)',
        alignItems: 'stretch',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* ================= LEFT SIDEBAR NAVIGATION (FULL RECTANGLE TOUCHING BASE & COLLAPSIBLE) ================= */}
      <aside
        style={{
          width: isCollapsed ? 70 : 250,
          minWidth: isCollapsed ? 70 : 250,
          height: '100%',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '1px 0 3px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          {/* Top Header with Collapse Toggle */}
          <div
            style={{
              padding: isCollapsed ? '14px 8px' : '16px 14px 12px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              minHeight: 60,
              boxSizing: 'border-box',
            }}
          >
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(false)}
                title="Expand Admin Menu"
                className="btn btn-sm"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <PanelLeftOpen size={18} />
              </button>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #e11d48, #ea580c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(225, 29, 72, 0.2)',
                    }}
                  >
                    <Shield size={17} color="#ffffff" />
                  </div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Admin Console</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Operations & Squads</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCollapsed(true)}
                  title="Collapse Sidebar"
                  className="btn btn-sm"
                  style={{
                    padding: '6px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: isCollapsed ? '12px 6px' : '12px 10px', flex: 1 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '12px 0' : '10px 14px',
                    borderRadius: 8,
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#4338ca' : '#475569',
                    backgroundColor: isActive ? '#eef2ff' : 'transparent',
                    border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                    <span style={{ color: isActive ? '#4f46e5' : '#94a3b8', display: 'flex', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && isActive && <ChevronRight size={14} color="#4f46e5" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Footer Touching the Base */}
          <div
            style={{
              padding: isCollapsed ? '12px 6px' : '12px 14px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
            }}
          >
            {!isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(true)}
                className="btn btn-sm"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  gap: 6,
                  color: '#64748b',
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                }}
              >
                <PanelLeftClose size={15} />
                <span>Collapse Menu</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed(false)}
                title="Expand Menu"
                className="btn btn-sm"
                style={{
                  padding: '7px',
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                }}
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT AREA ================= */}
      <section
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          padding: '24px 32px 60px',
          minWidth: 0,
        }}
      >
        {/* ================= TAB 1: MANAGE TEAM ================= */}
        {activeTab === 'manage-team' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>Manage Teams</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  Track department workloads, inspect rosters, leads, and ongoing tasks.
                </p>
              </div>
              <button onClick={() => setIsNewTeamModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Add New Team
              </button>
            </div>

            {teamsLoading ? (
              <div style={{ color: 'var(--text-dim)', padding: 30 }}>Loading teams...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {teamsData?.map((team: any) => {
                  const stats = getTeamStats(team);
                  return (
                    <div
                      key={team.id}
                      className="glass-card"
                      style={{
                        padding: 22,
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Header & Eye Button */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                backgroundColor: '#eef2ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Layers size={18} color="#4f46e5" />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{team.name}</h3>
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>ID: {team.id}</span>
                            </div>
                          </div>

                          {/* Action Buttons: Inspect & Drop Team */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => setViewingTeam(team)}
                              className="btn btn-sm"
                              title="Inspect Team Tasks & Roster"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                backgroundColor: '#f8fafc',
                                borderColor: '#cbd5e1',
                                color: '#334155',
                                gap: 6,
                              }}
                            >
                              <Eye size={15} color="#4f46e5" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id, team.name)}
                              disabled={deleteTeamMutation.isPending}
                              className="btn btn-sm"
                              title="Drop and delete team"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.8rem',
                                backgroundColor: '#fef2f2',
                                borderColor: '#fca5a5',
                                color: '#b91c1c',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={14} color="#b91c1c" />
                              <span>Drop</span>
                            </button>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5, minHeight: 40 }}>
                          {team.description || 'No description provided.'}
                        </p>

                        {/* Quick Metrics Bar */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: 8,
                            padding: '10px 12px',
                            background: '#f8fafc',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            marginBottom: 16,
                            textAlign: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>COMPLETED</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{stats.completed}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>ONGOING</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{stats.ongoing}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>INCOMPLETE</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{stats.incomplete}</div>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Lead & Members */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 12,
                          borderTop: '1px solid #e2e8f0',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Crown size={14} color="#d97706" />
                          <span style={{ color: 'var(--text-muted)' }}>
                            Lead:{' '}
                            <strong style={{ color: '#0f172a' }}>
                              {stats.leads.length > 0 ? stats.leads[0].name.replace(' (Lead)', '') : 'Unassigned'}
                            </strong>
                          </span>
                        </div>
                        <span style={{ color: '#64748b' }}>
                          👥 <strong>{stats.leads.length + stats.members.length}</strong> People
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MANAGE USER ================= */}
        {activeTab === 'manage-user' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>Manage Users (20 Accounts)</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Full employee directory with instant role promotions and team assignments.
              </p>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden', backgroundColor: '#ffffff' }}>
              {usersLoading ? (
                <div style={{ color: 'var(--text-dim)', padding: 30 }}>Loading users...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          color: '#64748b',
                        }}
                      >
                        <th style={{ padding: '14px 20px' }}>Employee</th>
                        <th style={{ padding: '14px 16px' }}>Email</th>
                        <th style={{ padding: '14px 16px' }}>Role</th>
                        <th style={{ padding: '14px 16px' }}>Team</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData?.map((u: any) => (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: '#ffffff',
                                }}
                              >
                                {u.name[0]}
                              </div>
                              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                                {u.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#475569' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <RoleBadge role={u.role} />
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#475569' }}>
                            {u.team?.name || 'All Teams (Global)'}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedUserForEdit(u);
                                setEditRole(u.role);
                                setEditTeamId(u.teamId || '');
                              }}
                              className="btn btn-sm"
                              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                            >
                              Edit Role & Team
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3 to 7: WORK VIEWS ================= */}
        {['ongoing-work', 'completed-work', 'high-priority', 'approvals', 'rejections'].includes(activeTab) && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                {activeTab.replace('-', ' ')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                {activeTab === 'ongoing-work' && 'Active tasks in progress or open status across teams.'}
                {activeTab === 'completed-work' && 'Archived and successfully resolved tasks.'}
                {activeTab === 'high-priority' && 'Urgent and High priority tasks requiring immediate attention.'}
                {activeTab === 'approvals' && 'Items in review awaiting Admin/Lead sign-off.'}
                {activeTab === 'rejections' && 'Items requiring rework, change requests, or status returns.'}
              </p>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden', backgroundColor: '#ffffff' }}>
              {workViewLoading ? (
                <div style={{ color: 'var(--text-dim)', padding: 30 }}>Loading work items...</div>
              ) : !workViewData || workViewData.length === 0 ? (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No items found under this category.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          color: '#64748b',
                        }}
                      >
                        <th style={{ padding: '14px 20px' }}>Task</th>
                        <th style={{ padding: '14px 16px' }}>Type</th>
                        <th style={{ padding: '14px 16px' }}>Priority</th>
                        <th style={{ padding: '14px 16px' }}>Status</th>
                        <th style={{ padding: '14px 16px' }}>Team</th>
                        <th style={{ padding: '14px 16px' }}>Assignee</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workViewData.map((item: any) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                              v{item.version}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <TypeBadge type={item.type} />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <PriorityBadge priority={item.priority} />
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <StatusBadge status={item.status} />
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#475569' }}>
                            {item.team?.name}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                            {item.assignee ? (
                              <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.assignee.name}</span>
                            ) : (
                              <span style={{ color: '#e11d48', fontWeight: 600 }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              {activeTab === 'approvals' && (
                                <button
                                  onClick={() => handleApprove(item.id, item.version)}
                                  className="btn btn-sm btn-success"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => onSelectItem(item.id)}
                                className="btn btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                View Details <ArrowRight size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ================= MODAL: TEAM OVERVIEW VIA EYE CLICK ================= */}
      <Modal
        isOpen={!!viewingTeam}
        onClose={() => setViewingTeam(null)}
        title={`Team Intelligence Overview: ${viewingTeam?.name || ''}`}
        maxWidth={780}
      >
        {activeTeamStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
              {viewingTeam?.description || 'No description available.'}
            </p>

            {/* Task Breakdown Stats Grid */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
                Task Completion & Workflow Breakdown
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                }}
              >
                <div style={{ padding: 14, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>COMPLETED</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginTop: 4 }}>
                    {activeTeamStats.completed}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669' }}>Resolved & closed</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>ONGOING</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92400e', marginTop: 4 }}>
                    {activeTeamStats.ongoing}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d97706' }}>In active progress</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8' }}>INCOMPLETE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', marginTop: 4 }}>
                    {activeTeamStats.incomplete}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>Open / In review</div>
                </div>

                <div style={{ padding: 14, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>TOTAL TASKS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    {activeTeamStats.total}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Assigned to squad</div>
                </div>
              </div>
            </div>

            {/* Leadership & Members */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Leads */}
              <div style={{ padding: 16, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Crown size={18} color="#d97706" />
                  <strong style={{ fontSize: '0.88rem', color: '#92400e' }}>
                    Team Lead ({activeTeamStats.leads.length})
                  </strong>
                </div>
                {activeTeamStats.leads.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#b45309' }}>No lead currently assigned.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeTeamStats.leads.map((lead) => (
                      <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{lead.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{lead.email}</div>
                        </div>
                        <RoleBadge role={lead.role} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members */}
              <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Users size={18} color="#4f46e5" />
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                    Members & Viewers ({activeTeamStats.members.length})
                  </strong>
                </div>
                {activeTeamStats.members.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No members in this team.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {activeTeamStats.members.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>{m.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
                        </div>
                        <RoleBadge role={m.role} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Team Tasks List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <ListTodo size={16} color="#4f46e5" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Team Work Items ({activeTeamStats.items.length})
                </h4>
              </div>

              {activeTeamStats.items.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', background: '#f8fafc', borderRadius: 8 }}>
                  No tasks assigned to this team yet.
                </div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <tbody>
                      {activeTeamStats.items.map((task: any) => (
                        <tr
                          key={task.id}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onClick={() => {
                            setViewingTeam(null);
                            onSelectItem(task.id);
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{task.title}</td>
                          <td style={{ padding: '8px 8px' }}><PriorityBadge priority={task.priority} /></td>
                          <td style={{ padding: '8px 8px' }}><StatusBadge status={task.status} /></td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4f46e5', fontWeight: 600 }}>
                            View &rarr;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => setViewingTeam(null)} className="btn btn-primary btn-sm">
                Close Team Insights
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: CREATE NEW TEAM ================= */}
      <Modal
        isOpen={isNewTeamModalOpen}
        onClose={() => setIsNewTeamModalOpen(false)}
        title="Create New Team"
        maxWidth={680}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTeamMutation.mutate({
              name: newTeamName,
              description: newTeamDesc,
              leadUserId: newTeamLeadId || undefined,
              memberUserIds: newTeamMemberIds,
            });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>
              Team Name *
            </label>
            <input
              className="input-control"
              placeholder="e.g. Data Platform & Analytics"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>
              Description
            </label>
            <textarea
              className="input-control"
              rows={2}
              placeholder="Responsibilities, scope, and department domain..."
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
            />
          </div>

          {/* ADMIN / TEAM LEAD DROPDOWN */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Crown size={15} color="#eab308" />
                Assign Team Lead / Admin
              </label>
              {newTeamLeadId && (
                <button
                  type="button"
                  onClick={() => setNewTeamLeadId('')}
                  style={{ fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear Lead
                </button>
              )}
            </div>
            <select
              className="input-control"
              value={newTeamLeadId}
              onChange={(e) => {
                const val = e.target.value;
                setNewTeamLeadId(val);
                if (val) {
                  setNewTeamMemberIds((prev) => prev.filter((id) => id !== val));
                }
              }}
            >
              <option value="">-- Choose Team Lead / Admin (All Employees) --</option>
              {usersData?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email} {u.team ? `(Current: ${u.team.name})` : '(No Team)'}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
              Appointed Lead will hold workflow review and approval authorization for this squad.
            </div>
          </div>

          {/* SELECT EMPLOYEES (TEAM MEMBERS) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={15} color="#4f46e5" />
                Select Members & Contributors
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12 }}>
                  {newTeamMemberIds.length} Selected
                </span>
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const allNonLeadIds = (usersData || [])
                      .filter((u: any) => u.id !== newTeamLeadId)
                      .map((u: any) => u.id);
                    setNewTeamMemberIds(allNonLeadIds);
                  }}
                  style={{ fontSize: '0.72rem', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Select All
                </button>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <button
                  type="button"
                  onClick={() => setNewTeamMemberIds([])}
                  style={{ fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Filter Search Input */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Filter members by name or email..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '0.8rem', height: 34 }}
              />
            </div>

            {/* Scrollable employee checkboxes list */}
            <div
              style={{
                maxHeight: 130,
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                backgroundColor: '#f8fafc',
              }}
            >
              {usersData
                ?.filter((u: any) => {
                  if (!memberSearchTerm.trim()) return true;
                  const q = memberSearchTerm.toLowerCase();
                  return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                })
                .map((u: any) => {
                  const isLead = u.id === newTeamLeadId;
                  const isChecked = newTeamMemberIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        backgroundColor: isChecked ? '#eef2ff' : '#ffffff',
                        border: isChecked ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                        cursor: isLead ? 'not-allowed' : 'pointer',
                        opacity: isLead ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          disabled={isLead}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTeamMemberIds([...newTeamMemberIds, u.id]);
                            } else {
                              setNewTeamMemberIds(newTeamMemberIds.filter((id) => id !== u.id));
                            }
                          }}
                          style={{ cursor: isLead ? 'not-allowed' : 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{u.email}</div>
                        </div>
                      </div>

                      <div>
                        {isLead ? (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12, backgroundColor: '#fef3c7', color: '#b45309' }}>
                            Appointed Lead
                          </span>
                        ) : u.team ? (
                          <span style={{ fontSize: '0.7rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                            {u.team.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: 4 }}>
                            Unassigned
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* ACTION BUTTONS: LEFT CANCEL, RIGHT PUBLISH TEAM */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              paddingTop: 16,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsNewTeamModalOpen(false);
                setNewTeamName('');
                setNewTeamDesc('');
                setNewTeamLeadId('');
                setNewTeamMemberIds([]);
              }}
              className="btn"
              style={{
                padding: '10px 24px',
                fontSize: '0.88rem',
                fontWeight: 600,
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: 8,
                minWidth: 120,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createTeamMutation.isPending}
              style={{
                padding: '10px 28px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: 8,
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                minWidth: 150,
              }}
            >
              {createTeamMutation.isPending ? 'Publishing...' : 'Publish Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT USER ROLE / TEAM ================= */}
      <Modal
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        title={`Edit ${selectedUserForEdit?.name || 'User'}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedUserForEdit) return;
            updateUserMutation.mutate({
              id: selectedUserForEdit.id,
              payload: {
                role: editRole,
                teamId: editTeamId || null,
              },
            });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
              Role
            </label>
            <select className="input-control" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
              <option value="VIEWER">Viewer (Read-Only)</option>
              <option value="MEMBER">Member (Standard Task Ownership)</option>
              <option value="LEAD">Lead (Approval Authority)</option>
              <option value="ADMIN">Admin (Global Supervision)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
              Assigned Team
            </label>
            <select className="input-control" value={editTeamId} onChange={(e) => setEditTeamId(e.target.value)}>
              <option value="">No Team (Global)</option>
              {teamsData?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setSelectedUserForEdit(null)} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
