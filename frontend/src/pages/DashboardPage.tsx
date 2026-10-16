import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useDashboardQueuesQuery,
  useClaimMutation,
  useTransitionMutation,
} from '../hooks/useWorkItems';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/Badge';
import { CreateWorkItemModal } from '../components/CreateWorkItemModal';
import { WorkItem } from '../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  UserCheck,
  Zap,
  ArrowRight,
  Search,
} from 'lucide-react';

interface DashboardPageProps {
  onSelectItem: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectItem }) => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQueuesQuery();
  const claimMutation = useClaimMutation();
  const transitionMutation = useTransitionMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleClaim = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await claimMutation.mutateAsync({ id: item.id, version: item.version });
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim task. Another user may have claimed it.');
    }
  };

  const handleApprove = async (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: 'RESOLVED',
        version: item.version,
      });
    } catch (err: any) {
      setActionError(err.message || 'Approval failed.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard Work Queues...</div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const queues = data?.queues;

  const matchesSearch = (item: WorkItem) => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    return item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
  };

  const filteredAssigned = (queues?.assignedToMe || []).filter(matchesSearch);
  const filteredUrgent = (queues?.unassignedUrgent || []).filter(matchesSearch);
  const filteredApproval = (queues?.awaitingMyApproval || []).filter(matchesSearch);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Banner / Welcome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
            Mission Control Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>
            Real-time work items and incident queue for team:{' '}
            <strong style={{ color: '#4f46e5' }}>{user?.teamName || 'Global Operations'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {user?.role !== 'VIEWER' && (
            <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
              <PlusCircle size={16} />
              New Work Item
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="btn btn-sm"
            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 18,
        }}
      >
        {/* Metric 1: Total Open */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              TOTAL OPEN & IN PROGRESS
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#60a5fa" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 10, color: '#0f172a' }}>
            {metrics?.totalOpen ?? 0}
          </div>
        </div>

        {/* Metric 2: Awaiting My Approval */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              AWAITING APPROVAL
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 10, color: '#fbbf24' }}>
            {metrics?.totalPendingApproval ?? 0}
          </div>
        </div>

        {/* Metric 3: Urgent Incidents */}
        <div
          className={`glass-card ${metrics?.totalUrgent ? 'urgent-pulse' : ''}`}
          style={{ padding: '20px 22px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              URGENT INCIDENTS
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#fb7185" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 10, color: '#fb7185' }}>
            {metrics?.totalUrgent ?? 0}
          </div>
        </div>

        {/* Metric 4: Assigned to Me */}
        <div className="glass-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ASSIGNED TO ME
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 10, color: '#34d399' }}>
            {metrics?.assignedToMeCount ?? 0}
          </div>
        </div>
      </div>

      {/* Dashboard Quick Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="input-control"
            style={{ paddingLeft: 38 }}
            placeholder="Quick search active queues by title or description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* The 3 Required Queues in a 3-Column or Responsive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 22,
        }}
      >
        {/* Queue 1: Assigned to Me */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="#34d399" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Assigned to Me
              </h2>
            </div>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {filteredAssigned.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {filteredAssigned.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No active work items assigned to you.
              </div>
            ) : (
              filteredAssigned.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="glass-card"
                  style={{
                    padding: 14,
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <TypeBadge type={item.type} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>v{item.version}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#818cf8' }}>
                      Open item <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue 2: Unassigned Urgent */}
        <div
          className="glass-card"
          style={{
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            border: filteredUrgent.length > 0 ? '1px solid rgba(244, 63, 94, 0.35)' : undefined,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#fb7185" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Unassigned Urgent
              </h2>
            </div>
            <span
              style={{
                background: 'rgba(244, 63, 94, 0.2)',
                color: '#fb7185',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {filteredUrgent.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {filteredUrgent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                🎉 No urgent unassigned issues! All high priority work is owned.
              </div>
            ) : (
              filteredUrgent.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="glass-card"
                  style={{
                    padding: 14,
                    background: 'rgba(244, 63, 94, 0.04)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    cursor: 'pointer',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <TypeBadge type={item.type} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600 }}>Unassigned</span>
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>
                    {item.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Team: {item.team.name}
                    </span>
                    {user?.role !== 'VIEWER' && (
                      <button
                        onClick={(e) => handleClaim(e, item)}
                        disabled={claimMutation.isPending}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                      >
                        <Zap size={13} />
                        Claim Task
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue 3: Awaiting My Approval */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#fbbf24" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Awaiting My Approval
              </h2>
            </div>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {filteredApproval.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {user?.role !== 'LEAD' && user?.role !== 'ADMIN' ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-dim)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                🔒 Only authorized <strong>Team Leads</strong> and <strong>Admins</strong> have approval authority.
                Switch to Alice or Diana to test approval sign-offs.
              </div>
            ) : filteredApproval.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No work items currently pending your approval.
              </div>
            ) : (
              filteredApproval.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="glass-card"
                  style={{
                    padding: 14,
                    background: 'rgba(245, 158, 11, 0.04)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    cursor: 'pointer',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <TypeBadge type={item.type} />
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: 10 }}>
                    Submitted by: {item.assignee?.name || item.reporter?.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      v{item.version}
                    </span>
                    <button
                      onClick={(e) => handleApprove(e, item)}
                      disabled={transitionMutation.isPending}
                      className="btn btn-sm btn-success"
                      style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                    >
                      <CheckCircle2 size={13} />
                      Approve & Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for creating a new task */}
      <CreateWorkItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => onSelectItem(id)}
      />
    </div>
  );
};
