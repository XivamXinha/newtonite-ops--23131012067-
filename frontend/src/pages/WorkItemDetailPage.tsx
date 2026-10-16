import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useWorkItemDetailQuery,
  useClaimMutation,
  useTransitionMutation,
  useUpdateWorkItemMutation,
  useAddCommentMutation,
} from '../hooks/useWorkItems';
import { StatusBadge, PriorityBadge, TypeBadge, RoleBadge } from '../components/Badge';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { Modal } from '../components/Modal';
import { ConflictApiError } from '../api/client';
import { Priority, Status } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  MessageSquare,
  RefreshCw,
  Send,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface WorkItemDetailPageProps {
  itemId: string;
  onBack: () => void;
}

export const WorkItemDetailPage: React.FC<WorkItemDetailPageProps> = ({ itemId, onBack }) => {
  const { user } = useAuth();
  const { data: item, isLoading, error, refetch } = useWorkItemDetailQuery(itemId);

  const claimMutation = useClaimMutation();
  const transitionMutation = useTransitionMutation();
  const updateMutation = useUpdateWorkItemMutation();
  const commentMutation = useAddCommentMutation();

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editDueDate, setEditDueDate] = useState('');

  const handleOpenEdit = () => {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditPriority(item.priority);
    setEditDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setConflictWarning(null);
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        payload: {
          title: editTitle,
          description: editDescription,
          priority: editPriority,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          version: item.version, // Send current OCC version
        },
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      if (err instanceof ConflictApiError || err.statusCode === 409) {
        setConflictWarning(
          'Conflict detected: This work item has been modified by another user in the background. Please reload to see the latest version.'
        );
      } else {
        setActionError(err.message || 'Failed to update work item');
      }
    }
  };

  const handleClaim = async () => {
    if (!item) return;
    setConflictWarning(null);
    setActionError(null);
    try {
      await claimMutation.mutateAsync({ id: item.id, version: item.version });
    } catch (err: any) {
      if (err instanceof ConflictApiError || err.statusCode === 409) {
        setConflictWarning(
          'Conflict: This task was just claimed or modified by another user. Reloading latest state.'
        );
      } else {
        setActionError(err.message || 'Failed to claim task');
      }
    }
  };

  const handleTransition = async (targetStatus: Status) => {
    if (!item) return;
    setConflictWarning(null);
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus,
        version: item.version,
      });
    } catch (err: any) {
      if (err instanceof ConflictApiError || err.statusCode === 409) {
        setConflictWarning(
          'Conflict: Status cannot be changed because this item was updated concurrently. Please reload.'
        );
      } else {
        setActionError(err.message || 'Failed to change status');
      }
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !item) return;
    try {
      await commentMutation.mutateAsync({ id: item.id, content: commentText.trim() });
      setCommentText('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to post comment');
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        Loading Work Item details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <AlertTriangle size={36} color="#fb7185" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Work Item Access Denied or Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
          {(error as any)?.message || 'You may not have authorization to view this item (Team RBAC Boundary FR-12).'}
        </p>
        <button onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Directory
        </button>
      </div>
    );
  }

  const isAssigned = item.assigneeId !== null;
  const isLeadOrAdmin = user?.role === 'LEAD' || user?.role === 'ADMIN';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Navigation & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button onClick={onBack} className="btn btn-sm">
          <ArrowLeft size={16} /> Back to Directory
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="font-mono"
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
            }}
          >
            Version: <strong style={{ color: '#818cf8' }}>v{item.version}</strong> (OCC Protected)
          </span>

          <button onClick={() => refetch()} title="Reload latest state" className="btn btn-sm">
            <RefreshCw size={14} /> Reload
          </button>

          {user?.role !== 'VIEWER' && (
            <button onClick={handleOpenEdit} className="btn btn-sm">
              <Edit3 size={14} /> Edit Details
            </button>
          )}
        </div>
      </div>

      {/* FR-13: Concurrency Conflict Alert Warning */}
      {conflictWarning && (
        <div
          className="glass-card animate-fade-in"
          style={{
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={24} color="#f87171" />
            <div>
              <strong style={{ color: '#fca5a5', display: 'block', fontSize: '0.9rem' }}>
                Conflict Detected (Optimistic Concurrency Control)
              </strong>
              <p style={{ color: '#fecdd3', fontSize: '0.82rem', marginTop: 2 }}>
                {conflictWarning}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              refetch();
              setConflictWarning(null);
            }}
            className="btn btn-sm btn-primary"
            style={{ background: '#ef4444', borderColor: '#f87171' }}
          >
            <RefreshCw size={14} /> Reload Latest
          </button>
        </div>
      )}

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
          <button onClick={() => setActionError(null)} className="btn btn-sm" style={{ padding: '2px 8px' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Item Header, Description, Workflow Bar, Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Card */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <TypeBadge type={item.type} />
              <PriorityBadge priority={item.priority} />
              <StatusBadge status={item.status} />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  marginLeft: 'auto',
                }}
              >
                ID: <span className="font-mono">{item.id}</span>
              </span>
            </div>

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
              {item.title}
            </h1>

            <div
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                padding: '16px 20px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
              }}
            >
              {item.description}
            </div>

            {/* Workflow Transition Action Bar (FR-06 & FR-07) */}
            <div
              style={{
                marginTop: 24,
                padding: '18px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Workflow Lifecycle & Transitions
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Claim action */}
                {!isAssigned && user?.role !== 'VIEWER' && (
                  <button
                    onClick={handleClaim}
                    disabled={claimMutation.isPending}
                    className="btn btn-primary"
                  >
                    <Zap size={16} />
                    Claim This Task (Atomic)
                  </button>
                )}

                {/* Status state machine */}
                {item.status === 'OPEN' && user?.role !== 'VIEWER' && (
                  <button
                    onClick={() => handleTransition('IN_PROGRESS')}
                    disabled={transitionMutation.isPending}
                    className="btn btn-primary"
                  >
                    Start Working (In Progress)
                  </button>
                )}

                {item.status === 'IN_PROGRESS' && user?.role !== 'VIEWER' && (
                  <>
                    <button
                      onClick={() => handleTransition('IN_REVIEW')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                      style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                    >
                      Submit for Lead Review
                    </button>
                    <button
                      onClick={() => handleTransition('OPEN')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                    >
                      Move Back to Open
                    </button>
                  </>
                )}

                {/* FR-07: Approval Step */}
                {item.status === 'IN_REVIEW' && (
                  <>
                    {isLeadOrAdmin ? (
                      <button
                        onClick={() => handleTransition('RESOLVED')}
                        disabled={transitionMutation.isPending}
                        className="btn btn-success"
                      >
                        <CheckCircle2 size={16} />
                        Authorized Lead Sign-off: Approve & Resolve
                      </button>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#fbbf24',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        🔒 <strong>Awaiting Lead Approval:</strong> Only authorized Team Leads or Admins can approve this resolution.
                      </div>
                    )}
                    <button
                      onClick={() => handleTransition('IN_PROGRESS')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                    >
                      Request Changes (Return to In Progress)
                    </button>
                  </>
                )}

                {item.status === 'RESOLVED' && user?.role !== 'VIEWER' && (
                  <>
                    <button
                      onClick={() => handleTransition('CLOSED')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                    >
                      Finalize & Close
                    </button>
                    <button
                      onClick={() => handleTransition('IN_PROGRESS')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                    >
                      Reopen Task
                    </button>
                  </>
                )}

                {item.status === 'CLOSED' && user?.role !== 'VIEWER' && (
                  <button
                    onClick={() => handleTransition('OPEN')}
                    disabled={transitionMutation.isPending}
                    className="btn"
                  >
                    Reopen Work Item
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section (FR-09) */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <MessageSquare size={18} color="#818cf8" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Comments & Discussion ({item.comments?.length || 0})
              </h2>
            </div>

            {/* Comment composer */}
            {user?.role !== 'VIEWER' && (
              <form onSubmit={handlePostComment} style={{ marginBottom: 20 }}>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Add technical findings, links to pull requests, or notes..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    <Send size={13} />
                    {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            )}

            {/* Comment list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!item.comments || item.comments.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No comments yet. Be the first to start the discussion!
                </div>
              ) : (
                item.comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{c.user.name}</strong>
                        <RoleBadge role={c.user.role} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Immutable Activity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Metadata Card */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.04em' }}>
              Item Properties
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.85rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Team</span>
                <strong style={{ color: '#0f172a' }}>{item.team.name}</strong>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Assignee</span>
                {item.assignee ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <strong style={{ color: '#0f172a' }}>{item.assignee.name}</strong>
                    <RoleBadge role={item.assignee.role} />
                  </div>
                ) : (
                  <span style={{ color: '#fb7185', fontWeight: 600 }}>Unassigned</span>
                )}
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Reporter</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.reporter.name}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Due Date</span>
                <span style={{ color: item.dueDate ? '#fbbf24' : 'var(--text-dim)' }}>
                  {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'None set'}
                </span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Created At</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>Last Updated</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(item.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline (FR-08, NFR-10) */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Clock size={16} color="#60a5fa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Activity Audit Trail (Append-Only)
              </h3>
            </div>
            <ActivityTimeline activities={item.activities} />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Work Item Details">
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Title
            </label>
            <input
              className="input-control"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Priority
            </label>
            <select
              className="input-control"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">🔥 Urgent</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Description
            </label>
            <textarea
              className="input-control"
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Due Date
            </label>
            <input
              type="date"
              className="input-control"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
