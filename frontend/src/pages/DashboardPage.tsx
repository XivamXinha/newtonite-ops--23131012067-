import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useDashboardQueuesQuery,
  useClaimMutation,
  useTransitionMutation,
  useWorkItemsQuery,
  useDeleteWorkItemMutation,
} from '../hooks/useWorkItems';
import { StatusBadge, PriorityBadge, TypeBadge, RoleBadge } from '../components/Badge';
import { CreateWorkItemModal } from '../components/CreateWorkItemModal';
import { WorkItem } from '../types';
import {
  LayoutDashboard,
  UserCheck,
  AlertTriangle,
  Clock,
  ListTodo,
  Crown,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Briefcase,
  Zap,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Filter,
  Trash2,
  History,
  Lock,
  XCircle,
  RotateCcw,
  Send,
} from 'lucide-react';

type EmployeeTab =
  | 'overview'
  | 'new-tasks'
  | 'assigned-to-me'
  | 'unassigned-urgent'
  | 'awaiting-approval'
  | 'work-items'
  | 'my-team-leader'
  | 'my-team-member';

interface DashboardPageProps {
  onSelectItem: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectItem }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<EmployeeTab>('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTaskFilter, setNewTaskFilter] = useState<'ALL' | 'UNCLAIMED' | 'CLAIMED'>('ALL');
  const [newTaskTeamFilter, setNewTaskTeamFilter] = useState<string>('ALL');

  // Modals & action states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search within queues
  const queueFilterText = '';

  // Work items directory state (search, filters, pagination)
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [wiSearch, setWiSearch] = useState('');
  const [wiStatus, setWiStatus] = useState<string>('');
  const [wiPriority, setWiPriority] = useState<string>('');
  const [wiType, setWiType] = useState<string>('');

  // Queries & Mutations
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardQueuesQuery();
  const claimMutation = useClaimMutation();
  const transitionMutation = useTransitionMutation();
  const deleteWorkItemMutation = useDeleteWorkItemMutation();

  const { data: workItemsData, isLoading: workItemsLoading } = useWorkItemsQuery({
    page,
    limit,
    search: wiSearch.trim() || undefined,
    status: wiStatus || undefined,
    priority: wiPriority || undefined,
    type: wiType || undefined,
  });

  const handleSelectItem = (item: WorkItem) => {
    if (item.assigneeId && user?.role === 'MEMBER' && item.assigneeId !== user?.id && item.reporterId !== user?.id) {
      alert(`Access Restricted: This task has been claimed by ${item.assignee?.name || 'another member'}. Only the assigned owner, squad lead, or administrator can open and edit it.`);
      return;
    }
    onSelectItem(item.id);
  };

  const handleClaim = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await claimMutation.mutateAsync({ id: item.id, version: item.version });
      setActiveTab('assigned-to-me');
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim task. Another user may have claimed it.');
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete task "${item.title}"?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteWorkItemMutation.mutateAsync(item.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete task.');
    }
  };

  const handleApprove = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    const remarks = window.prompt('Approval remarks / sign-off comment (optional):', 'Approved and resolved');
    if (remarks === null) return;
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'RESOLVED',
        version: item.version,
        comment: remarks.trim() || undefined,
      });
    } catch (err: any) {
      setActionError(err.message || 'Approval failed.');
    }
  };

  const handleSendForChanges = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    const reason = window.prompt(`Enter changes needed for ${item.assignee?.name || 'member'}:`, 'Please revise and update');
    if (reason === null) return;
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'IN_PROGRESS',
        version: item.version,
        comment: reason.trim() || 'Changes requested by Lead',
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to request changes.');
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'OPEN',
        version: item.version,
      });
      setActiveTab('new-tasks');
    } catch (err: any) {
      setActionError(err.message || 'Failed to accept task request.');
    }
  };

  const handleForwardRequest = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'IN_REVIEW',
        version: item.version,
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to forward request to destination Lead.');
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    const reason = window.prompt(`Enter rejection reason for "${item.title}":`, 'Rejected by Lead');
    if (reason === null) return;
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'CLOSED',
        version: item.version,
        comment: reason.trim() || undefined,
      });
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject task.');
    }
  };

  if (dashboardLoading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 61px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          fontWeight: 600,
          backgroundColor: '#f8fafc',
        }}
      >
        Loading Employee Workspace Queues...
      </div>
    );
  }

  const metrics = dashboardData?.metrics;
  const queues = dashboardData?.queues;
  const leadTeam = dashboardData?.leadTeam;
  const memberTeam = dashboardData?.memberTeam;
  const leadTeams: any[] = dashboardData?.leadTeams || (leadTeam ? [leadTeam] : []);
  const memberTeams: any[] = dashboardData?.memberTeams || (memberTeam ? [memberTeam] : []);

  const isUserLeadOrAdmin = user?.role === 'ADMIN' ||
    user?.role === 'LEAD' ||
    user?.isLead ||
    leadTeams.length > 0;

  const canLeadManageItem = (item: WorkItem) => {
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'LEAD') return true;
    if (user?.isLead && user?.leadTeamIds?.includes(item.teamId)) return true;
    if (leadTeams.some((t: any) => t.id === item.teamId || t.leadUserId === user?.id)) return true;
    if (user?.leadTeamIds && user?.leadTeamIds.includes(item.teamId)) return true;
    if (user?.leadTeam && user?.leadTeam.id === item.teamId) return true;
    if (user?.leadTeams && user?.leadTeams.some((t: any) => t.id === item.teamId)) return true;
    if (item.team && (item.team as any).leadUserId === user?.id) return true;
    return false;
  };


  const matchesSearch = (item: WorkItem) => {
    if (!queueFilterText.trim()) return true;
    const term = queueFilterText.toLowerCase();
    return item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
  };

  const filteredAssigned = (queues?.assignedToMe || []).filter(matchesSearch);
  const filteredUrgent = (queues?.unassignedUrgent || []).filter(matchesSearch);
  const filteredApproval = (queues?.awaitingMyApproval || []).filter(matchesSearch);
  
  const userTeamIds = Array.from(new Set([
    ...(leadTeams.map((t: any) => t.id)),
    ...(memberTeams.map((t: any) => t.id)),
    ...(user?.teamId ? [user.teamId] : []),
  ]));

  const allNewTasks = (queues?.newTasks || []).filter(matchesSearch);
  const filteredNewTasks = allNewTasks.filter((item: WorkItem) => {
    // If not Admin, strictly only show tasks belonging to this user's teams
    if (user?.role !== 'ADMIN' && userTeamIds.length > 0 && !userTeamIds.includes(item.teamId)) {
      return false;
    }
    if (newTaskFilter === 'UNCLAIMED' && item.assigneeId) return false;
    if (newTaskFilter === 'CLAIMED' && !item.assigneeId) return false;
    if (newTaskTeamFilter !== 'ALL' && item.teamId !== newTaskTeamFilter) return false;
    return true;
  });
  const unclaimedCount = filteredNewTasks.filter((t: any) => !t.assigneeId).length;

  const navItems: { id: EmployeeTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'E. Dashboard', icon: <LayoutDashboard size={18} /> },
    {
      id: 'new-tasks',
      label: 'New Tasks',
      icon: <Sparkles size={18} />,
      badge: unclaimedCount,
      badgeColor: '#10b981',
    },
    {
      id: 'assigned-to-me',
      label: 'Assigned to me',
      icon: <UserCheck size={18} />,
      badge: queues?.assignedToMe?.length || 0,
      badgeColor: '#4f46e5',
    },
    {
      id: 'unassigned-urgent',
      label: 'Priority Tasks',
      icon: <AlertTriangle size={18} />,
      badge: queues?.unassignedUrgent?.length || 0,
      badgeColor: '#e11d48',
    },
    {
      id: 'awaiting-approval',
      label: 'Awaiting my approval',
      icon: <Clock size={18} />,
      badge: queues?.awaitingMyApproval?.length || 0,
      badgeColor: '#d97706',
    },
    {
      id: 'my-team-leader',
      label: 'My Team (Role Leader)',
      icon: <Crown size={18} />,
      badge: leadTeams.length,
      badgeColor: '#b45309',
    },
    {
      id: 'my-team-member',
      label: 'My Team (Role Member)',
      icon: <Users size={18} />,
      badge: memberTeams.length,
      badgeColor: '#059669',
    },
  ];

  // Helper for computing team stats in My Team view
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
        backgroundColor: '#edf0f4',
      }}
    >
      {/* ================= LEFT SIDEBAR (GREEN & BLUE-BLACK GRADIENT, COMPACT TEXT & HOVER EFFECTS) ================= */}
      <aside
        style={{
          width: isCollapsed ? 70 : 250,
          minWidth: isCollapsed ? 70 : 250,
          height: '100%',
          background: 'linear-gradient(180deg, #04241d 0%, #061e38 45%, #020617 100%)',
          borderRight: '1px solid rgba(16, 185, 129, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          {/* Top Header with Collapse Toggle */}
          <div
            style={{
              padding: isCollapsed ? '14px 8px' : '16px 14px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              minHeight: 60,
              boxSizing: 'border-box',
              background: 'rgba(2, 6, 23, 0.35)',
            }}
          >
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(false)}
                title="Expand Menu"
                className="btn btn-sm"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  color: '#6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                  e.currentTarget.style.borderColor = '#34d399';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                  e.currentTarget.style.color = '#6ee7b7';
                  e.currentTarget.style.transform = 'scale(1)';
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
                      background: 'linear-gradient(135deg, #059669, #0284c7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <Briefcase size={16} color="#ffffff" />
                  </div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>Workspace</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCollapsed(true)}
                  title="Collapse Sidebar"
                  className="btn btn-sm"
                  style={{
                    padding: '6px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <PanelLeftClose size={16} />
                </button>
              </>
            )}
          </div>

          {/* Navigation Links with Green & Blue-Black Hover Effects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: isCollapsed ? '12px 6px' : '12px 10px', flex: 1 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isLeaderItem = item.id === 'my-team-leader';
              const isMemberItem = item.id === 'my-team-member';
              const showLeaderBranch = isLeaderItem && !isCollapsed && leadTeams.length > 0;
              const showMemberBranch = isMemberItem && !isCollapsed && memberTeams.length > 0;

              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isLeaderItem && leadTeams.length > 0) {
                        if (!selectedTeamId || !leadTeams.some((t: any) => t.id === selectedTeamId)) {
                          setSelectedTeamId(leadTeams[0].id);
                        }
                      } else if (isMemberItem && memberTeams.length > 0) {
                        if (!selectedTeamId || !memberTeams.some((t: any) => t.id === selectedTeamId)) {
                          setSelectedTeamId(memberTeams[0].id);
                        }
                      }
                    }}
                    title={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      padding: isCollapsed ? '10px 0' : '9px 12px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : '#94a3b8',
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.28) 0%, rgba(14, 165, 233, 0.22) 100%)'
                        : 'transparent',
                      border: isActive ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid transparent',
                      borderLeft: isActive ? '3px solid #10b981' : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 10px rgba(16, 185, 129, 0.2)' : 'none',
                      textAlign: 'left',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      width: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'linear-gradient(90deg, rgba(16, 185, 129, 0.16) 0%, rgba(56, 189, 248, 0.14) 100%)';
                        e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = isCollapsed ? 'none' : 'translateX(3px)';
                        const iconSpan = e.currentTarget.querySelector('.nav-icon-wrap') as HTMLElement;
                        if (iconSpan) iconSpan.style.color = '#34d399';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.transform = 'none';
                        const iconSpan = e.currentTarget.querySelector('.nav-icon-wrap') as HTMLElement;
                        if (iconSpan) iconSpan.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
                      <span
                        className="nav-icon-wrap"
                        style={{
                          color: isActive ? '#34d399' : '#94a3b8',
                          display: 'flex',
                          flexShrink: 0,
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                          backgroundColor: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Leader Team Tree Branch */}
                  {showLeaderBranch && (
                    <div
                      style={{
                        position: 'relative',
                        marginLeft: 16,
                        paddingLeft: 16,
                        marginTop: 3,
                        marginBottom: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                      }}
                    >
                      {/* Vertical spine trunk */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 6,
                          top: 0,
                          bottom: 12,
                          width: 2,
                          backgroundColor: 'rgba(52, 211, 153, 0.28)',
                          borderRadius: 1,
                        }}
                      />

                      {leadTeams.map((team: any, idx: number) => {
                        const isTeamSelected =
                          activeTab === 'my-team-leader' &&
                          (selectedTeamId === team.id || (!selectedTeamId && idx === 0));
                        return (
                          <div
                            key={team.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('my-team-leader');
                              setSelectedTeamId(team.id);
                            }}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              padding: '2px 0',
                            }}
                          >
                            {/* Horizontal connector line */}
                            <div
                              style={{
                                position: 'absolute',
                                left: -10,
                                width: 12,
                                height: 2,
                                backgroundColor: isTeamSelected ? '#34d399' : 'rgba(52, 211, 153, 0.25)',
                              }}
                            />

                            {/* Node Dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: -15,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: isTeamSelected ? '#10b981' : '#1e293b',
                                border: isTeamSelected ? '2px solid #34d399' : '2px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: isTeamSelected ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                                zIndex: 2,
                                transition: 'all 0.15s ease',
                              }}
                            />

                            {/* Rounded Pill Shape with Team Name */}
                            <div
                              title={team.name}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 9999,
                                border: isTeamSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                                background: isTeamSelected
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(14, 165, 233, 0.28))'
                                  : 'rgba(15, 23, 42, 0.75)',
                                color: isTeamSelected ? '#ffffff' : '#94a3b8',
                                fontSize: '0.74rem',
                                fontWeight: isTeamSelected ? 700 : 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                maxWidth: 175,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                boxShadow: isTeamSelected
                                  ? '0 0 10px rgba(16, 185, 129, 0.3)'
                                  : '0 1px 2px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isTeamSelected) {
                                  e.currentTarget.style.borderColor = '#34d399';
                                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.transform = 'translateX(2px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isTeamSelected) {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                  e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                                  e.currentTarget.style.color = '#94a3b8';
                                  e.currentTarget.style.transform = 'none';
                                }
                              }}
                            >
                              {team.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Member Team Tree Branch */}
                  {showMemberBranch && (
                    <div
                      style={{
                        position: 'relative',
                        marginLeft: 16,
                        paddingLeft: 16,
                        marginTop: 3,
                        marginBottom: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                      }}
                    >
                      {/* Vertical spine trunk */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 6,
                          top: 0,
                          bottom: 12,
                          width: 2,
                          backgroundColor: 'rgba(52, 211, 153, 0.28)',
                          borderRadius: 1,
                        }}
                      />

                      {memberTeams.map((team: any, idx: number) => {
                        const isTeamSelected =
                          activeTab === 'my-team-member' &&
                          (selectedTeamId === team.id || (!selectedTeamId && idx === 0));
                        return (
                          <div
                            key={team.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('my-team-member');
                              setSelectedTeamId(team.id);
                            }}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              padding: '2px 0',
                            }}
                          >
                            {/* Horizontal connector line */}
                            <div
                              style={{
                                position: 'absolute',
                                left: -10,
                                width: 12,
                                height: 2,
                                backgroundColor: isTeamSelected ? '#38bdf8' : 'rgba(52, 211, 153, 0.25)',
                              }}
                            />

                            {/* Node Dot */}
                            <div
                              style={{
                                position: 'absolute',
                                left: -15,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: isTeamSelected ? '#0284c7' : '#1e293b',
                                border: isTeamSelected ? '2px solid #38bdf8' : '2px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: isTeamSelected ? '0 0 8px rgba(2, 132, 199, 0.6)' : 'none',
                                zIndex: 2,
                                transition: 'all 0.15s ease',
                              }}
                            />

                            {/* Rounded Pill Shape with Team Name */}
                            <div
                              title={team.name}
                              style={{
                                padding: '3px 10px',
                                borderRadius: 9999,
                                border: isTeamSelected ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.12)',
                                background: isTeamSelected
                                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(16, 185, 129, 0.28))'
                                  : 'rgba(15, 23, 42, 0.75)',
                                color: isTeamSelected ? '#ffffff' : '#94a3b8',
                                fontSize: '0.74rem',
                                fontWeight: isTeamSelected ? 700 : 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                maxWidth: 175,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                boxShadow: isTeamSelected
                                  ? '0 0 10px rgba(2, 132, 199, 0.3)'
                                  : '0 1px 2px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isTeamSelected) {
                                  e.currentTarget.style.borderColor = '#38bdf8';
                                  e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.2)';
                                  e.currentTarget.style.color = '#ffffff';
                                  e.currentTarget.style.transform = 'translateX(2px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isTeamSelected) {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                  e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                                  e.currentTarget.style.color = '#94a3b8';
                                  e.currentTarget.style.transform = 'none';
                                }
                              }}
                            >
                              {team.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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
        {/* Action Error Alert */}
        {actionError && (
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* ================= VIEW 1: DASHBOARD OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Mission Control Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 2 }}>
                  Real-time work items and incident queues for team:{' '}
                  <strong style={{ color: '#4f46e5' }}>{user?.teamName || 'Global Operations'}</strong>
                </p>
              </div>

              {user?.role !== 'VIEWER' && (
                <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                  <PlusCircle size={16} /> Create Work Item
                </button>
              )}
            </div>

            {/* Metrics Grid with Smooth Hover Effects & Sleek Alignment */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: 12,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(59, 130, 246, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Open & In Progress
                  </span>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
                    <PlayCircle size={18} color="#2563eb" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#09090b', marginTop: 10, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {metrics?.totalOpen ?? 0}
                </div>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  borderTop: '3px solid #f59e0b',
                  borderRadius: 12,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(245, 158, 11, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#fcd34d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Awaiting Approval
                  </span>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fef3c7' }}>
                    <Clock size={18} color="#d97706" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#09090b', marginTop: 10, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {metrics?.totalPendingApproval ?? 0}
                </div>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  borderTop: '3px solid #ef4444',
                  borderRadius: 12,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(239, 68, 68, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Priority Tasks
                  </span>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2' }}>
                    <AlertTriangle size={18} color="#dc2626" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', marginTop: 10, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {metrics?.totalUrgent ?? 0}
                </div>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '18px 20px',
                  borderTop: '3px solid #10b981',
                  borderRadius: 12,
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(16, 185, 129, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#86efac';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Assigned to Me
                  </span>
                  <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1fae5' }}>
                    <UserCheck size={18} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#09090b', marginTop: 10, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {metrics?.assignedToMeCount ?? 0}
                </div>
              </div>
            </div>

            {/* 2 Team Role Cards: I am Leader & I am Member */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              {/* Card 1: I am Leader */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  borderTop: '4px solid #f59e0b',
                  borderRadius: 14,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(245, 158, 11, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#fcd34d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Crown size={20} color="#d97706" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>I am Leader</h3>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Teams under your leadership</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                    }}
                  >
                    Role: Leader
                  </span>
                </div>

                {/* Big Metric Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {leadTeams.length}
                  </span>
                  <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>
                    {leadTeams.length === 1 ? 'Team Led' : 'Teams Led'}
                  </span>
                </div>

                {/* Team List or Empty State */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {leadTeams.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem', backgroundColor: '#fafaf9', borderRadius: 8, border: '1px dashed #e7e5e4' }}>
                      Not assigned as Leader for any team currently.
                    </div>
                  ) : (
                    leadTeams.map((team: any) => (
                      <div
                        key={team.id}
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setActiveTab('my-team-leader');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 10,
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fde68a',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.transform = 'translateX(3px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#fde68a';
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{team.name}</div>
                            {team.description && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{team.description}</div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Manage &rarr;
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card 2: I am Member */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  padding: 24,
                  borderTop: '4px solid #10b981',
                  borderRadius: 14,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(16, 185, 129, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#86efac';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Users size={20} color="#059669" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>I am Member</h3>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Teams where you are a squad member</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      backgroundColor: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Role: Member
                  </span>
                </div>

                {/* Big Metric Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {memberTeams.length}
                  </span>
                  <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600 }}>
                    {memberTeams.length === 1 ? 'Team Membership' : 'Team Memberships'}
                  </span>
                </div>

                {/* Team List or Empty State */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  {memberTeams.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem', backgroundColor: '#fafaf9', borderRadius: 8, border: '1px dashed #e7e5e4' }}>
                      Not assigned as Member in any team currently.
                    </div>
                  ) : (
                    memberTeams.map((team: any) => (
                      <div
                        key={team.id}
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setActiveTab('my-team-member');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 10,
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#10b981';
                          e.currentTarget.style.transform = 'translateX(3px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#bbf7d0';
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{team.name}</div>
                            {team.description && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{team.description}</div>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                          View &rarr;
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW: NEW TASKS (SQUAD CLAIMABLE TASKS IN CARD FORMAT) ================= */}
        {activeTab === 'new-tasks' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    New Tasks & Squad Queue
                  </h2>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 12,
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={12} /> {unclaimedCount} Open to Claim
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 4 }}>
                  Tasks published by Team Leaders and Admins for your squad. Claim an open task to take ownership. First come, first served!
                </p>
              </div>

              {user?.role !== 'VIEWER' && (
                <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                  <PlusCircle size={16} /> New Squad Task
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div
              className="glass-card"
              style={{
                padding: '14px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Status pills - Modern Segment Control */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 3, backgroundColor: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setNewTaskFilter('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: newTaskFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: newTaskFilter === 'ALL' ? '#09090b' : '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: newTaskFilter === 'ALL' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: newTaskFilter === 'ALL' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Tasks ({allNewTasks.length})
                </button>
                <button
                  onClick={() => setNewTaskFilter('UNCLAIMED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: newTaskFilter === 'UNCLAIMED' ? '#ffffff' : 'transparent',
                    color: newTaskFilter === 'UNCLAIMED' ? '#059669' : '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: newTaskFilter === 'UNCLAIMED' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: newTaskFilter === 'UNCLAIMED' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⚡ Open to Claim ({unclaimedCount})
                </button>
                <button
                  onClick={() => setNewTaskFilter('CLAIMED')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: newTaskFilter === 'CLAIMED' ? '#ffffff' : 'transparent',
                    color: newTaskFilter === 'CLAIMED' ? '#09090b' : '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: newTaskFilter === 'CLAIMED' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: newTaskFilter === 'CLAIMED' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🔒 Claimed ({allNewTasks.length - unclaimedCount})
                </button>
              </div>

              {/* Group / Squad filter */}
              {(dashboardData?.allTeams && dashboardData.allTeams.length > 1) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={15} color="#64748b" />
                  <select
                    className="input-control"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
                    value={newTaskTeamFilter}
                    onChange={(e) => setNewTaskTeamFilter(e.target.value)}
                  >
                    <option value="ALL">All Squad Groups</option>
                    {dashboardData.allTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Cards Grid */}
            {filteredNewTasks.length === 0 ? (
              <div
                className="glass-card"
                style={{
                  padding: 48,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  color: '#64748b',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={28} color="#94a3b8" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  No tasks match current filter
                </h3>
                <p style={{ fontSize: '0.86rem', maxWidth: 440, margin: 0 }}>
                  {newTaskFilter === 'UNCLAIMED'
                    ? 'All squad tasks have already been claimed! Good work team.'
                    : 'When a Team Leader or Admin creates new squad tasks, they will appear here.'}
                </p>
                {user?.role !== 'VIEWER' && (
                  <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    <PlusCircle size={15} /> Create a Task
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: 18,
                }}
              >
                {filteredNewTasks.map((item) => {
                  const isClaimed = Boolean(item.assigneeId);
                  const isClaimedByMe = item.assigneeId === user?.id;
                  const isResolved = item.status === 'RESOLVED';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="glass-card"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderRadius: 12,
                        borderTop: isResolved
                          ? '4px solid #ef4444'
                          : isClaimedByMe
                          ? '4px solid #10b981'
                          : isClaimed
                          ? '4px solid #94a3b8'
                          : '4px solid #4f46e5',
                        border: isResolved
                          ? '1.5px solid #fca5a5'
                          : isClaimedByMe
                          ? '1.5px solid #86efac'
                          : isClaimed
                          ? '1px solid #e2e8f0'
                          : '1px solid #cbd5e1',
                        backgroundColor: isResolved
                          ? '#fff5f5'
                          : isClaimedByMe
                          ? '#f0fdf4'
                          : isClaimed
                          ? '#ffffff'
                          : '#ffffff',
                        boxShadow: isResolved
                          ? '0 2px 8px rgba(239, 68, 68, 0.08)'
                          : isClaimedByMe
                          ? '0 2px 8px rgba(16, 185, 129, 0.08)'
                          : isClaimed
                          ? '0 1px 3px rgba(0, 0, 0, 0.04)'
                          : '0 2px 8px rgba(79, 70, 229, 0.08)',
                        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        gap: 14,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = isResolved
                          ? '0 12px 24px -4px rgba(239, 68, 68, 0.16)'
                          : isClaimedByMe
                          ? '0 12px 24px -4px rgba(16, 185, 129, 0.16)'
                          : '0 12px 24px -4px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isResolved
                          ? '0 2px 8px rgba(239, 68, 68, 0.08)'
                          : isClaimedByMe
                          ? '0 2px 8px rgba(16, 185, 129, 0.08)'
                          : isClaimed
                          ? '0 1px 3px rgba(0, 0, 0, 0.04)'
                          : '0 2px 8px rgba(79, 70, 229, 0.08)';
                      }}
                    >
                      {/* Card Header: Group & Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 9px',
                              borderRadius: 6,
                              backgroundColor: isResolved ? '#fee2e2' : '#e0e7ff',
                              color: isResolved ? '#991b1b' : '#3730a3',
                              border: isResolved ? '1px solid #fecaca' : '1px solid #c7d2fe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Users size={12} /> {item.team?.name || 'Squad Group'}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <TypeBadge type={item.type} />
                            <PriorityBadge priority={item.priority} />
                            <StatusBadge status={item.status} />
                            {item.status === 'IN_REVIEW' && isClaimedByMe && (
                              <span
                                style={{
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Clock size={11} /> Wait for Lead Review
                              </span>
                            )}
                            {isClaimed && !isClaimedByMe && user?.role === 'MEMBER' && item.reporterId !== user?.id && (
                              <span
                                style={{
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  backgroundColor: '#fef2f2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="This task has been claimed by another member. Only the assignee, lead, or admin can access it."
                              >
                                <Lock size={11} /> Locked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div
                            style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: isResolved ? '#991b1b' : '#09090b',
                              lineHeight: 1.35,
                              marginBottom: 6,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: isResolved ? '#7f1d1d' : '#64748b',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.description}
                          </div>
                        </div>

                        {/* Reporter & Metadata */}
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Created by: <strong style={{ color: isResolved ? '#991b1b' : '#475569' }}>{item.reporter?.name || 'Squad Lead'}</strong></span>
                          <span>v{item.version}</span>
                        </div>
                      </div>

                      {/* Card Footer: Claim Section */}
                      <div
                        style={{
                          paddingTop: 12,
                          borderTop: isResolved ? '1px solid #fecaca' : '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        {!isClaimed ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#047857' }}>
                                Available to Claim
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* Creator / Admin Delete Button */}
                              {(item.reporterId === user?.id || user?.role === 'ADMIN') && (
                                <button
                                  onClick={(e) => handleDeleteTask(e, item)}
                                  disabled={deleteWorkItemMutation.isPending}
                                  className="btn btn-sm"
                                  title="Delete Task"
                                  style={{
                                    padding: '5px 9px',
                                    fontSize: '0.76rem',
                                    backgroundColor: '#fef2f2',
                                    borderColor: '#fca5a5',
                                    color: '#b91c1c',
                                    gap: 4,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Trash2 size={13} color="#b91c1c" />
                                  <span>Delete</span>
                                </button>
                              )}

                              {/* Requirement 1: Creator cannot claim their own task */}
                              {item.reporterId === user?.id && user?.role !== 'ADMIN' ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    backgroundColor: '#eef2ff',
                                    color: '#4f46e5',
                                    border: '1px solid #c7d2fe',
                                  }}
                                  title="You created this task. A squad colleague must claim it."
                                >
                                  Created by you (Cannot claim)
                                </span>
                              ) : (
                                (user?.role === 'MEMBER' || user?.role === 'ADMIN') ? (
                                  <button
                                    onClick={(e) => handleClaim(e, item)}
                                    disabled={claimMutation.isPending}
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '6px 14px', fontSize: '0.80rem', gap: 5, borderRadius: 8 }}
                                  >
                                    <Zap size={14} /> Claim Task
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 600 }}>
                                    Available for Members
                                  </span>
                                )
                              )}
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 8,
                              backgroundColor: isResolved ? '#fef2f2' : isClaimedByMe ? '#ecfdf5' : '#f8fafc',
                              border: isResolved ? '1px solid #fecaca' : isClaimedByMe ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: isResolved ? '#991b1b' : isClaimedByMe ? '#047857' : '#475569' }}>
                                <Lock size={12} />
                                <span>Task Claimed</span>
                                {isClaimedByMe && <span style={{ color: isResolved ? '#b91c1c' : '#059669' }}>• Claimed by You</span>}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: isResolved ? '#7f1d1d' : isClaimedByMe ? '#065f46' : '#0f172a', fontWeight: 600 }}>
                                Claimed by: <span style={{ textDecoration: 'underline' }}>{item.assignee?.name || 'Colleague'}</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {(item.reporterId === user?.id || user?.role === 'ADMIN') && (
                                <button
                                  onClick={(e) => handleDeleteTask(e, item)}
                                  disabled={deleteWorkItemMutation.isPending}
                                  className="btn btn-sm"
                                  title="Delete Task"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.72rem',
                                    backgroundColor: '#ffffff',
                                    borderColor: '#fca5a5',
                                    color: '#b91c1c',
                                    gap: 3,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Trash2 size={12} color="#b91c1c" />
                                  <span>Delete</span>
                                </button>
                              )}
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: ASSIGNED TO ME ================= */}
        {activeTab === 'assigned-to-me' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>Assigned to Me</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                All ongoing tasks and incidents currently assigned to your ownership ({queues?.assignedToMe?.length || 0})
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredAssigned.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  No tasks currently assigned to you.
                </div>
              ) : (
                filteredAssigned.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="glass-card"
                    style={{
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TypeBadge type={item.type} />
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />
                        {item.status === 'IN_REVIEW' && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              color: '#1d4ed8',
                              fontWeight: 700,
                              backgroundColor: '#eff6ff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #bfdbfe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Clock size={11} color="#1d4ed8" /> Wait for Lead Review
                          </span>
                        )}
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Team: {item.team?.name}</span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{item.description}</div>
                    </div>
                    <button className="btn btn-sm" style={{ flexShrink: 0, gap: 6 }}>
                      <span>View</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: PRIORITY TASKS ================= */}
        {activeTab === 'unassigned-urgent' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444' }}>Priority Tasks</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                High-priority tasks in your team requiring immediate attention ({queues?.unassignedUrgent?.length || 0})
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredUrgent.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  No priority tasks found.
                </div>
              ) : (
                filteredUrgent.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="glass-card"
                    style={{
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: 16,
                      borderLeft: '4px solid #ef4444',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TypeBadge type={item.type} />
                        <PriorityBadge priority={item.priority} />
                        {item.assignee ? (
                          <span className="badge badge-primary">Assigned: {item.assignee.name}</span>
                        ) : (
                          <span className="badge badge-danger">Unassigned</span>
                        )}
                      </div>
                      <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{item.description}</div>
                    </div>

                    {(user?.role === 'MEMBER' || user?.role === 'ADMIN') && !item.assigneeId && (
                      <button
                        onClick={(e) => handleClaim(e, item)}
                        disabled={claimMutation.isPending}
                        className="btn btn-primary"
                        style={{ flexShrink: 0, gap: 6 }}
                      >
                        <Zap size={15} />
                        <span>Claim Task</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 4: AWAITING MY APPROVAL ================= */}
        {activeTab === 'awaiting-approval' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>Awaiting My Approval</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Completed pull requests and work items pending Lead or Admin sign-off ({queues?.awaitingMyApproval?.length || 0})
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredApproval.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  {isUserLeadOrAdmin
                    ? 'No items currently awaiting approval.'
                    : 'Only Squad Leads and Administrators can approve items.'}
                </div>
              ) : (
                filteredApproval.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="glass-card"
                    style={{
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: 16,
                      borderLeft: '4px solid #f59e0b',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <TypeBadge type={item.type} />
                        <StatusBadge status={item.status} />
                        {!item.assigneeId ? (
                          item.targetTeamId && item.targetTeamId !== item.teamId ? (
                            <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700, backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: 6, border: '1px solid #fde68a' }}>
                              Flow 3: Outgoing Member Request &bull; From: {item.reporter?.name} &bull; Target: {item.targetTeam?.name || 'Destination Squad'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700, backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: 6, border: '1px solid #bae6fd' }}>
                              Cross-Team Task Request &bull; From: {item.reporter?.name || 'Partner Squad'}
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Assignee: {item.assignee?.name}
                          </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                          Target Squad: <strong style={{ color: '#0f172a' }}>{item.targetTeam?.name || item.team?.name}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{item.description}</div>
                    </div>

                    {canLeadManageItem(item) && (
                      !item.assigneeId ? (
                        item.targetTeamId && item.targetTeamId !== item.teamId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => handleForwardRequest(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn btn-primary"
                              style={{ flexShrink: 0, gap: 6, fontWeight: 700 }}
                              title="Approve this member request and forward to destination squad Lead for acceptance"
                            >
                              <Send size={15} />
                              <span>Approve & Forward to {item.targetTeam?.name || 'Destination'} Lead</span>
                            </button>
                            <button
                              onClick={(e) => handleRejectRequest(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ flexShrink: 0, gap: 6, backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', fontWeight: 600 }}
                              title="Reject cross-team request"
                            >
                              <XCircle size={15} color="#b91c1c" />
                              <span>Reject Request</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => handleAcceptRequest(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn btn-success"
                              style={{ flexShrink: 0, gap: 6, backgroundColor: '#059669', borderColor: '#047857', fontWeight: 700 }}
                              title="Accept cross-team request and send claim request to squad members"
                            >
                              <CheckCircle2 size={16} />
                              <span>Accept Request (To Claim Queue)</span>
                            </button>
                            <button
                              onClick={(e) => handleRejectRequest(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ flexShrink: 0, gap: 6, backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', fontWeight: 600 }}
                              title="Reject cross-team request"
                            >
                              <XCircle size={16} color="#b91c1c" />
                              <span>Reject Request</span>
                            </button>
                          </div>
                        )
                      ) : (
                        item.assigneeId === user?.id && user?.role !== 'ADMIN' ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 8,
                              color: '#1d4ed8',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                            }}
                          >
                            <Clock size={14} color="#1d4ed8" />
                            <span>Wait for Lead Review</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              onClick={(e) => handleApprove(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn btn-success"
                              style={{ flexShrink: 0, gap: 6, fontWeight: 700 }}
                              title="Approve and resolve work item"
                            >
                              <CheckCircle2 size={16} />
                              <span>Final Complete (Approve)</span>
                            </button>
                            <button
                              onClick={(e) => handleSendForChanges(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ flexShrink: 0, gap: 6, backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}
                              title="Send back to member with revision comments"
                            >
                              <RotateCcw size={15} color="#b45309" />
                              <span>Send for Changes</span>
                            </button>
                            <button
                              onClick={(e) => handleRejectRequest(e, item)}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ flexShrink: 0, gap: 6, backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c' }}
                              title="Reject work item"
                            >
                              <XCircle size={15} color="#b91c1c" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* ================= VIEW 5: SEARCH AUR FILTERS (WORK ITEMS DIRECTORY WITH PAGINATION) ================= */}
        {activeTab === 'work-items' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>Search & Filter Work Items</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  Complete team task registry with multi-criteria filtering and pagination.
                </p>
              </div>

              {user?.role !== 'VIEWER' && (
                <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                  <PlusCircle size={16} /> New Work Item
                </button>
              )}
            </div>

            {/* Filter Bar */}
            <div
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {/* Search text */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  className="input-control"
                  style={{ paddingLeft: 36 }}
                  placeholder="Search by title or description..."
                  value={wiSearch}
                  onChange={(e) => {
                    setWiSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                className="input-control"
                style={{ width: 'auto' }}
                value={wiStatus}
                onChange={(e) => {
                  setWiStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                className="input-control"
                style={{ width: 'auto' }}
                value={wiPriority}
                onChange={(e) => {
                  setWiPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="MEDIUM">Task</option>
                <option value="URGENT">Priority</option>
              </select>

              {/* Type Filter */}
              <select
                className="input-control"
                style={{ width: 'auto' }}
                value={wiType}
                onChange={(e) => {
                  setWiType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="TASK">Task</option>
                <option value="INCIDENT">Incident</option>
              </select>

              {(wiSearch || wiStatus || wiPriority || wiType) && (
                <button
                  onClick={() => {
                    setWiSearch('');
                    setWiStatus('');
                    setWiPriority('');
                    setWiType('');
                    setPage(1);
                  }}
                  className="btn btn-sm"
                  style={{ color: '#64748b' }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Paginated Items Table */}
            {workItemsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading work items...</div>
            ) : (
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 18px' }}>Title & Description</th>
                      <th style={{ padding: '12px 12px' }}>Type</th>
                      <th style={{ padding: '12px 12px' }}>Priority</th>
                      <th style={{ padding: '12px 12px' }}>Status</th>
                      <th style={{ padding: '12px 12px' }}>Assignee</th>
                      <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!workItemsData?.items || workItemsData.items.length === 0) ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                          No work items match current search or filters.
                        </td>
                      </tr>
                    ) : (
                      workItemsData.items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>{item.team?.name || 'Global'}</div>
                          </td>
                          <td style={{ padding: '14px 12px' }}><TypeBadge type={item.type} /></td>
                          <td style={{ padding: '14px 12px' }}><PriorityBadge priority={item.priority} /></td>
                          <td style={{ padding: '14px 12px' }}><StatusBadge status={item.status} /></td>
                          <td style={{ padding: '14px 12px', fontSize: '0.82rem', color: '#334155' }}>
                            {item.assignee?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                              {(item.reporterId === user?.id || user?.role === 'ADMIN') && (
                                <button
                                  onClick={(e) => handleDeleteTask(e, item)}
                                  disabled={deleteWorkItemMutation.isPending}
                                  className="btn btn-sm"
                                  title="Delete Task"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '0.75rem',
                                    backgroundColor: '#fef2f2',
                                    borderColor: '#fca5a5',
                                    color: '#b91c1c',
                                    gap: 4,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Trash2 size={13} color="#b91c1c" />
                                  <span>Delete</span>
                                </button>
                              )}
                              <span style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.82rem' }}>
                                Details &rarr;
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {workItemsData?.pagination && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderTop: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Showing Page {workItemsData.pagination.page} of {workItemsData.pagination.totalPages || 1} ({workItemsData.pagination.totalCount} total items)
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={workItemsData.pagination.page <= 1}
                        className="btn btn-sm"
                        style={{ gap: 4 }}
                      >
                        <ChevronLeft size={15} /> Previous
                      </button>
                      <button
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={workItemsData.pagination.page >= (workItemsData.pagination.totalPages || 1)}
                        className="btn btn-sm"
                        style={{ gap: 4 }}
                      >
                        Next <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 6 & 7: MY TEAM (ROLE LEADER / ROLE MEMBER) ================= */}
        {(activeTab === 'my-team-leader' || activeTab === 'my-team-member') && (() => {
          const isLeaderTab = activeTab === 'my-team-leader';
          const currentTeams = isLeaderTab ? leadTeams : memberTeams;
          const targetTeam = currentTeams.find((t: any) => t.id === selectedTeamId) || currentTeams[0] || null;
          const stats = targetTeam ? getTeamStats(targetTeam) : null;

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {isLeaderTab ? 'My Team (Role Leader)' : 'My Team (Role Member)'}
                    </h2>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12,
                        backgroundColor: isLeaderTab ? '#fef3c7' : '#d1fae5',
                        color: isLeaderTab ? '#b45309' : '#065f46',
                      }}
                    >
                      {isLeaderTab ? 'LEAD / SQUAD LEADER' : 'SQUAD MEMBER'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                    {isLeaderTab
                      ? 'Squad leadership overview, department roster, and team workload pipeline.'
                      : 'Squad colleagues, department lead contacts, and team work items.'}
                  </p>

                  {/* Multi-team switch pills if assigned to multiple teams */}
                  {currentTeams.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Assigned Teams:</span>
                      {currentTeams.map((t: any) => {
                        const isSel = targetTeam?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTeamId(t.id)}
                            style={{
                              padding: '4px 14px',
                              borderRadius: 9999,
                              border: isSel
                                ? (isLeaderTab ? '2px solid #b45309' : '2px solid #4f46e5')
                                : '1px solid #cbd5e1',
                              backgroundColor: isSel
                                ? (isLeaderTab ? '#fef3c7' : '#eff6ff')
                                : '#ffffff',
                              color: isSel
                                ? (isLeaderTab ? '#92400e' : '#1e40af')
                                : '#475569',
                              fontWeight: isSel ? 700 : 500,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                backgroundColor: isSel
                                  ? (isLeaderTab ? '#b45309' : '#4f46e5')
                                  : '#94a3b8',
                              }}
                            />
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {targetTeam && user?.role !== 'VIEWER' && (
                  <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary btn-sm">
                    <PlusCircle size={16} /> New Squad Task
                  </button>
                )}
              </div>

              {!targetTeam ? (
                <div
                  className="glass-card"
                  style={{
                    padding: '54px 28px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      backgroundColor: isLeaderTab ? '#fef3c7' : '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {isLeaderTab ? <Crown size={34} color="#b45309" /> : <Users size={34} color="#059669" />}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {isLeaderTab ? 'No Team Leadership Assigned' : 'No Squad Membership Assigned'}
                  </h3>
                  <p style={{ fontSize: '0.96rem', color: '#64748b', maxWidth: 520, margin: '4px 0 16px', lineHeight: 1.5 }}>
                    {isLeaderTab
                      ? 'Currently you are not assigned as leader of any team by admin.'
                      : 'Currently you are not assigned as a member of any team by admin.'}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      backgroundColor: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      color: '#475569',
                    }}
                  >
                    <Briefcase size={16} color="#0891b2" />
                    {isLeaderTab
                      ? 'When an administrator creates a team and designates you as Team Lead, your squad controls will appear here.'
                      : 'When an administrator adds you to a department roster, your squad colleagues will appear here.'}
                  </div>
                </div>
              ) : (
                <>
                {/* Team Info Card */}
                <div
                  className="glass-card"
                  style={{
                    padding: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    borderLeft: isLeaderTab ? '4px solid #b45309' : '4px solid #4f46e5',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {targetTeam.name}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: 4, maxWidth: 600 }}>
                      {targetTeam.description || 'Core engineering and operations squad.'}
                    </p>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
                      ID: {targetTeam.id}
                    </div>
                  </div>

                  {/* Quick Team Workload Metric Badges */}
                  {stats && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'center', padding: '10px 14px', backgroundColor: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857' }}>{stats.completed}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Completed</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8' }}>{stats.ongoing}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Ongoing</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 14px', backgroundColor: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>{stats.incomplete}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Incomplete</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Tasks</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Roster: Leads & Members */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {/* Team Leads */}
                  <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                      <Crown size={18} color="#eab308" />
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Team Lead ({stats?.leads.length || 0})
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(!stats?.leads || stats.leads.length === 0) ? (
                        <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>No designated team lead.</div>
                      ) : (
                        stats.leads.map((lead: any) => (
                          <div
                            key={lead.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: 8,
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  color: '#ffffff',
                                  fontSize: '0.82rem',
                                }}
                              >
                                {lead.name[0]}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{lead.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{lead.email}</div>
                              </div>
                            </div>
                            <span className="badge badge-warning">Lead</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                      <Users size={18} color="#4f46e5" />
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Members & Contributors ({stats?.members.length || 0})
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                      {(!stats?.members || stats.members.length === 0) ? (
                        <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>No members in this squad yet.</div>
                      ) : (
                        stats.members.map((member: any) => (
                          <div
                            key={member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 8,
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                            }}
                          >
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
                                  fontWeight: 700,
                                  color: '#ffffff',
                                  fontSize: '0.78rem',
                                }}
                              >
                                {member.name[0]}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>{member.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{member.email}</div>
                              </div>
                            </div>
                            <RoleBadge role={member.role} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Work Items List */}
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ListTodo size={18} color="#4f46e5" />
                      <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Squad Work Items ({stats?.items.length || 0})
                      </h4>
                    </div>
                  </div>

                  {(!stats?.items || stats.items.length === 0) ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                      No tasks currently assigned to this team.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 14px' }}>Task Title</th>
                            <th style={{ padding: '10px 10px' }}>Priority</th>
                            <th style={{ padding: '10px 10px' }}>Status</th>
                            <th style={{ padding: '10px 10px' }}>Created By (Lead)</th>
                            <th style={{ padding: '10px 10px' }}>Claimed By (Member)</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.items.map((task: any) => (
                            <tr
                              key={task.id}
                              onClick={() => handleSelectItem(task)}
                              style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{task.title}</div>
                                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{task.type}</div>
                              </td>
                              <td style={{ padding: '10px 10px' }}><PriorityBadge priority={task.priority} /></td>
                              <td style={{ padding: '10px 10px' }}><StatusBadge status={task.status} /></td>
                              <td style={{ padding: '10px 10px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>
                                  <Crown size={12} color="#eab308" />
                                  {task.reporter?.name || 'Squad Lead'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 10px' }}>
                                {task.assigneeId ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: '#065f46', fontSize: '0.82rem', backgroundColor: '#ecfdf5', padding: '3px 9px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                                    <UserCheck size={12} color="#059669" />
                                    {task.assignee?.name || 'Claimed'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, backgroundColor: '#f0f9ff', padding: '3px 8px', borderRadius: 6, border: '1px solid #bae6fd' }}>
                                    ⚡ Unclaimed (Available)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#4f46e5', fontWeight: 600 }}>
                                View &rarr;
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Squad Activity Timeline & Event Log */}
                {(() => {
                  const squadActivities = (dashboardData?.teamActivities || []).filter((act: any) => {
                    if (act.workItem?.teamId === targetTeam?.id) return true;
                    if (targetTeam?.leadUserId === act.userId) return true;
                    if (targetTeam?.memberUserIds && targetTeam.memberUserIds.includes(act.userId)) return true;
                    if (targetTeam?.users && targetTeam.users.some((u: any) => u.id === act.userId)) return true;
                    return false;
                  });
                  return (
                    <div className="glass-card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <History size={18} color="#4f46e5" />
                        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {targetTeam?.name || 'Squad'} Activity & Event Log ({squadActivities.length})
                        </h4>
                      </div>

                      {squadActivities.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                          No recent activities logged for this squad yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                          {squadActivities.slice(0, 25).map((act: any) => (
                            <div
                              key={act.id}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.82rem',
                                gap: 12,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    backgroundColor:
                                      act.action === 'CLAIMED'
                                        ? '#10b981'
                                        : act.action === 'APPROVED' || act.action === 'APPROVED_FOR_MEMBERS_CLAIM' || act.action === 'ACCEPTED'
                                        ? '#0891b2'
                                        : act.action === 'REJECTED_BY_LEAD'
                                        ? '#ef4444'
                                        : '#4f46e5',
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <span style={{ color: '#334155' }}>
                                    <strong style={{ color: '#09090b' }}>{act.user?.name || 'User'}</strong>
                                    {' '}
                                    {act.action === 'CREATED' && 'created squad task'}
                                    {act.action === 'CROSS_TEAM_REQUEST_SUBMITTED' && (
                                      <span>
                                        assigned cross-team task to{' '}
                                        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.76rem' }}>
                                          {act.workItem?.team?.name || 'Partner Squad'}
                                        </span>
                                      </span>
                                    )}
                                    {act.action === 'CLAIMED' && 'claimed task'}
                                    {act.action === 'APPROVED_AND_CLAIMED_BY_LEAD' && 'approved & claimed task'}
                                    {act.action === 'ACCEPTED' && 'accepted cross-team request & sent claim request to squad'}
                                    {act.action === 'APPROVED_FOR_MEMBERS_CLAIM' && 'accepted cross-team request & distributed to squad'}
                                    {act.action === 'CHANGES_REQUESTED_BY_LEAD' && (
                                      <span style={{ color: '#b45309', fontWeight: 600 }}>requested changes on task</span>
                                    )}
                                    {act.action === 'REJECTED_BY_LEAD' && (
                                      <span style={{ color: '#dc2626', fontWeight: 600 }}>rejected cross-team task</span>
                                    )}
                                    {act.action === 'SUBMITTED_FOR_APPROVAL' && 'submitted task for lead review'}
                                    {act.action === 'APPROVED' && 'approved and resolved'}
                                    {act.action === 'CLOSED' && 'officially closed'}
                                    {act.action === 'COMMENT_ADDED' && 'commented on'}
                                    {' '}
                                    <strong style={{ color: '#4f46e5' }}>"{act.workItem?.title || 'Task'}"</strong>
                                    {(() => {
                                      try {
                                        const parsed = typeof act.details === 'string' ? JSON.parse(act.details) : act.details;
                                        if (parsed?.comment) {
                                          return (
                                            <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', padding: '4px 8px', borderRadius: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                                              "{parsed.comment}"
                                            </div>
                                          );
                                        }
                                      } catch {
                                        return null;
                                      }
                                      return null;
                                    })()}
                                    {act.action === 'CROSS_TEAM_REQUEST_SUBMITTED' && act.workItem?.status === 'IN_REVIEW' && (
                                      <span style={{ marginLeft: 6, fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                                        (Pending Approval)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        );
      })()}
      </section>

      {/* Create Work Item Modal */}
      <CreateWorkItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        allTeams={dashboardData?.allTeams || []}
        myTeams={[...leadTeams, ...memberTeams]}
        defaultTeamId={selectedTeamId || leadTeams[0]?.id || memberTeams[0]?.id || user?.teamId || undefined}
      />
    </div>
  );
};

export default DashboardPage;
