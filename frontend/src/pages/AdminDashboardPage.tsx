import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('manage-team');

  // Modals state
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

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
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await apiRequest('/admin/teams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setIsNewTeamModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
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

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 28,
        minHeight: 'calc(100vh - 120px)',
        alignItems: 'start',
      }}
    >
      {/* ================= LEFT SIDEBAR NAVIGATION ================= */}
      <aside
        className="glass-card"
        style={{
          padding: '16px 12px',
          position: 'sticky',
          top: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
        }}
      >
        <div style={{ padding: '0 8px 12px', borderBottom: '1px solid #e2e8f0', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #e11d48, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Admin Console</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Operations & Squads</div>
            </div>
          </div>
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.86rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#4338ca' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: isActive ? '#4f46e5' : '#94a3b8' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} color="#4f46e5" />}
            </button>
          );
        })}
      </aside>

      {/* ================= RIGHT MAIN CONTENT AREA ================= */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

                          {/* Requested Eye Button */}
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

      {/* ================= MODAL: ADD NEW TEAM ================= */}
      <Modal isOpen={isNewTeamModalOpen} onClose={() => setIsNewTeamModalOpen(false)} title="Create New Team">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTeamMutation.mutate({ name: newTeamName, description: newTeamDesc });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: '#0f172a' }}>
              Description
            </label>
            <textarea
              className="input-control"
              rows={3}
              placeholder="Responsibilities, scope, and domain..."
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setIsNewTeamModalOpen(false)} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createTeamMutation.isPending}>
              {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
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
