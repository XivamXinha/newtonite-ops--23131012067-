import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useWorkItemDetailQuery,
  useClaimMutation,
  useTransitionMutation,
  useUpdateWorkItemMutation,
  useAddCommentMutation,
  useDeleteWorkItemMutation,
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
  Trash2,
  XCircle,
  RotateCcw,
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
  const deleteMutation = useDeleteWorkItemMutation();

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!item) return;
    if (!window.confirm(`Are you sure you want to permanently delete task "${item.title}"?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(item.id);
      onBack();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete task.');
    }
  };
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

  const handleTransition = async (targetStatus: Status, claimForSelf: boolean = false) => {
    if (!item) return;
    setConflictWarning(null);
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus,
        version: item.version,
        claimForSelf,
      } as any);
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

  // Workflow Action Modal State (Submit Review, Request Changes, Complete, Reject)
  const [transitionActionModal, setTransitionActionModal] = useState<{
    isOpen: boolean;
    targetStatus: Status;
    title: string;
    description: string;
    confirmButtonText: string;
    confirmButtonColor?: string;
    placeholder: string;
    comment: string;
    isCommentRequired?: boolean;
  }>({
    isOpen: false,
    targetStatus: 'IN_REVIEW',
    title: '',
    description: '',
    confirmButtonText: 'Confirm',
    placeholder: '',
    comment: '',
    isCommentRequired: false,
  });

  const openSubmitReviewModal = () => {
    setTransitionActionModal({
      isOpen: true,
      targetStatus: 'IN_REVIEW',
      title: 'Submit Task for Lead Review',
      description: 'Add your submission notes, links to PRs/code, or summary of work done for your squad lead.',
      confirmButtonText: 'Submit & Send to Lead',
      confirmButtonColor: '#4f46e5',
      placeholder: 'e.g. Completed requested work, verified tests. Ready for lead sign-off...',
      comment: '',
      isCommentRequired: false,
    });
  };

  const openApproveResolveModal = () => {
    setTransitionActionModal({
      isOpen: true,
      targetStatus: 'RESOLVED',
      title: 'Authorized Lead Sign-off: Final Complete',
      description: 'Approve and finalize this work item. Your review remarks will be logged.',
      confirmButtonText: 'Approve & Final Complete',
      confirmButtonColor: '#059669',
      placeholder: 'e.g. Excellent work, all requirements verified and approved.',
      comment: '',
      isCommentRequired: false,
    });
  };

  const openRequestChangesModal = () => {
    setTransitionActionModal({
      isOpen: true,
      targetStatus: 'IN_PROGRESS',
      title: 'Send for Changes (Return to In Progress)',
      description: 'Specify the revisions or adjustments needed. The task will be returned to the member.',
      confirmButtonText: 'Send for Changes',
      confirmButtonColor: '#d97706',
      placeholder: 'e.g. Please update documentation and fix edge cases in error handling...',
      comment: '',
      isCommentRequired: true,
    });
  };

  const openRejectModal = () => {
    setTransitionActionModal({
      isOpen: true,
      targetStatus: 'CLOSED',
      title: 'Reject Work Item',
      description: 'Officially reject and close this work item. Please provide rejection rationale.',
      confirmButtonText: 'Reject Task',
      confirmButtonColor: '#dc2626',
      placeholder: 'e.g. Rejected due to scope mismatch / duplicate item...',
      comment: '',
      isCommentRequired: true,
    });
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    if (transitionActionModal.isCommentRequired && !transitionActionModal.comment.trim()) {
      alert('Please provide a comment before submitting.');
      return;
    }
    setConflictWarning(null);
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({
        id: item.id,
        targetStatus: transitionActionModal.targetStatus,
        version: item.version,
        comment: transitionActionModal.comment.trim() || undefined,
      });
      setTransitionActionModal((prev) => ({ ...prev, isOpen: false, comment: '' }));
    } catch (err: any) {
      if (err instanceof ConflictApiError || err.statusCode === 409) {
        setConflictWarning(
          'Conflict: Status cannot be changed because this item was updated concurrently. Please reload.'
        );
      } else {
        setActionError(err.message || 'Failed to update status');
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
  const isLeadOrAdmin = user?.role === 'ADMIN' ||
    user?.role === 'LEAD' ||
    user?.isLead ||
    (user?.leadTeamIds && user?.leadTeamIds.includes(item.teamId)) ||
    (user?.leadTeam && user?.leadTeam.id === item.teamId) ||
    (user?.leadTeams && user?.leadTeams.some((t: any) => t.id === item.teamId)) ||
    (item.team && (item.team as any).leadUserId === user?.id);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Navigation & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <button onClick={onBack} className="btn btn-sm">
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="font-mono"
            style={{
              fontSize: '0.78rem',
              color: '#4338ca',
              background: '#eef2ff',
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #c7d2fe',
              fontWeight: 600,
            }}
          >
            Version: <strong>v{item.version}</strong> (OCC Protected)
          </span>

          <button onClick={() => refetch()} title="Reload latest state" className="btn btn-sm">
            <RefreshCw size={14} /> Reload
          </button>

          {user?.role !== 'VIEWER' && (
            <button onClick={handleOpenEdit} className="btn btn-sm">
              <Edit3 size={14} /> Edit Details
            </button>
          )}

          {(item.reporterId === user?.id || user?.role === 'ADMIN') && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-sm"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', gap: 5 }}
              title="Delete this work item"
            >
              <Trash2 size={14} color="#b91c1c" /> Delete Item
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
              {item.status === 'IN_PROGRESS' && item.assigneeId === user?.id ? (
                <div
                  onClick={openSubmitReviewModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  title="Click to update status and submit for Lead review"
                >
                  <StatusBadge status={item.status} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSubmitReviewModal();
                    }}
                    className="btn btn-sm"
                    style={{
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      backgroundColor: '#eff6ff',
                      borderColor: '#bfdbfe',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      gap: 5,
                    }}
                    title="Click to submit and send for lead review"
                  >
                    <Send size={12} /> Send for Review &rarr;
                  </button>
                </div>
              ) : item.status === 'IN_REVIEW' && item.assigneeId === user?.id ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge status={item.status} />
                  <span
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.76rem',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontWeight: 700,
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Clock size={12} /> Wait for Lead Review
                  </span>
                </div>
              ) : (
                <StatusBadge status={item.status} />
              )}
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

            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#09090b', marginBottom: 14, letterSpacing: '-0.02em' }}>
              {item.title}
            </h1>

            <div
              style={{
                fontSize: '0.92rem',
                color: '#334155',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                padding: '16px 20px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              {item.description}
            </div>

            {/* Workflow Transition Action Bar (FR-06 & FR-07) */}
            <div
              style={{
                marginTop: 24,
                padding: '18px 20px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Workflow Lifecycle & Transitions
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Claim action: ONLY members can claim tasks, and ONLY when status is OPEN! Awaiting cross-team requests (IN_REVIEW) cannot be claimed! */}
                {item.status === 'OPEN' && !isAssigned && user?.role !== 'VIEWER' && (
                  isLeadOrAdmin || user?.role === 'LEAD' ? (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#b45309',
                        background: '#fffbeb',
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #fde68a',
                        fontWeight: 600,
                      }}
                    >
                      👑 Team Leaders create, accept/assign & review tasks. Squad members claim and complete them.
                    </div>
                  ) : item.reporterId === user?.id && user?.role !== 'ADMIN' ? (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#4f46e5',
                        background: '#eef2ff',
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #c7d2fe',
                        fontWeight: 600,
                      }}
                    >
                      ℹ️ You created this task. A squad colleague must claim it.
                    </div>
                  ) : (
                    <button
                      onClick={handleClaim}
                      disabled={claimMutation.isPending}
                      className="btn btn-primary"
                    >
                      <Zap size={16} />
                      Claim This Task (Atomic)
                    </button>
                  )
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
                      onClick={openSubmitReviewModal}
                      disabled={transitionMutation.isPending}
                      className="btn"
                      style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309', fontWeight: 700, gap: 6 }}
                    >
                      <Send size={15} />
                      Submit & Send for Lead Review
                    </button>
                    <button
                      onClick={() => handleTransition('OPEN')}
                      disabled={transitionMutation.isPending}
                      className="btn"
                    >
                      Move Back to Open (Release Claim)
                    </button>
                  </>
                )}

                {/* FR-07: Approval Step */}
                {item.status === 'IN_REVIEW' && (
                  <>
                    {!item.assigneeId ? (
                      isLeadOrAdmin ? (
                        item.targetTeamId && item.targetTeamId !== item.teamId ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleTransition('IN_REVIEW', false)}
                              disabled={transitionMutation.isPending}
                              className="btn btn-primary"
                              style={{ gap: 6, fontWeight: 700 }}
                              title="Approve this member request and forward to destination squad Lead for acceptance"
                            >
                              <Send size={16} />
                              <span>Approve & Forward to {item.targetTeam?.name || 'Destination'} Lead</span>
                            </button>
                            <button
                              onClick={openRejectModal}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', gap: 6, fontWeight: 600 }}
                              title="Reject cross-team request"
                            >
                              <XCircle size={16} color="#b91c1c" />
                              <span>Reject Request</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleTransition('OPEN', false)}
                              disabled={transitionMutation.isPending}
                              className="btn btn-success"
                              style={{ backgroundColor: '#059669', borderColor: '#047857', gap: 6, fontWeight: 700 }}
                              title="Accept cross-team request and send to squad claim queue"
                            >
                              <CheckCircle2 size={16} />
                              <span>Accept Request (To Claim Queue)</span>
                            </button>
                            <button
                              onClick={openRejectModal}
                              disabled={transitionMutation.isPending}
                              className="btn"
                              style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', gap: 6, fontWeight: 600 }}
                              title="Reject cross-team request"
                            >
                              <XCircle size={16} color="#b91c1c" />
                              <span>Reject Request</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <div
                          style={{
                            fontSize: '0.84rem',
                            color: '#b45309',
                            background: '#fffbeb',
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: '1px solid #fde68a',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <Clock size={18} color="#b45309" />
                          <span>
                            {item.targetTeamId && item.targetTeamId !== item.teamId
                              ? '🔒 Awaiting Origin Team Lead Approval: Your Squad Leader must review and approve this request before it is forwarded to the destination Team Lead.'
                              : '🔒 Awaiting Destination Team Lead Acceptance: The receiving Team Lead must review and accept this cross-team request before squad members can claim it.'}
                          </span>
                        </div>
                      )
                    ) : (
                      /* Task has an assignee: Member submitted to lead */
                      (isLeadOrAdmin && (item.assigneeId !== user?.id || user?.role === 'ADMIN')) ? (
                        /* Only Team Lead (or Admin) can Approve/Resolve, Send for changes, or Reject */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={openApproveResolveModal}
                            disabled={transitionMutation.isPending}
                            className="btn btn-success"
                            style={{ gap: 6, fontWeight: 700 }}
                          >
                            <CheckCircle2 size={16} />
                            <span>Final Complete (Approve & Resolve)</span>
                          </button>
                          <button
                            onClick={openRequestChangesModal}
                            disabled={transitionMutation.isPending}
                            className="btn"
                            style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#b45309', gap: 6, fontWeight: 600 }}
                          >
                            <RotateCcw size={15} />
                            <span>Send for Changes</span>
                          </button>
                          <button
                            onClick={openRejectModal}
                            disabled={transitionMutation.isPending}
                            className="btn"
                            style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', gap: 6 }}
                          >
                            <XCircle size={16} color="#b91c1c" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        /* Submitting Member or colleague without Lead authority: show Wait for Lead Review banner */
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '14px 18px',
                            borderRadius: 10,
                            background: item.assigneeId === user?.id ? '#eff6ff' : '#fffbeb',
                            border: item.assigneeId === user?.id ? '1.5px solid #bfdbfe' : '1px solid #fde68a',
                            boxShadow: item.assigneeId === user?.id ? '0 2px 6px rgba(37, 99, 235, 0.06)' : 'none',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              backgroundColor: item.assigneeId === user?.id ? '#dbeafe' : '#fef3c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Clock size={20} color={item.assigneeId === user?.id ? '#1d4ed8' : '#d97706'} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.96rem', fontWeight: 800, color: item.assigneeId === user?.id ? '#1e3a8a' : '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>Wait for Lead Review</span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  backgroundColor: item.assigneeId === user?.id ? '#dbeafe' : '#fde68a',
                                  color: item.assigneeId === user?.id ? '#1e40af' : '#b45309',
                                  fontWeight: 700,
                                }}
                              >
                                Under Review
                              </span>
                            </div>
                            <div style={{ fontSize: '0.84rem', color: item.assigneeId === user?.id ? '#2563eb' : '#b45309', marginTop: 3, lineHeight: 1.45 }}>
                              {item.assigneeId === user?.id
                                ? 'Your task has been submitted for review. Final complete and resolve can only be performed by your Team Lead.'
                                : 'This task has been submitted and is currently awaiting Team Lead review and final resolution.'}
                            </div>
                          </div>
                        </div>
                      )
                    )}
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
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.85rem', color: '#09090b' }}>{c.user.name}</strong>
                        <RoleBadge role={c.user.role} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
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
              <option value="MEDIUM">Task</option>
              <option value="URGENT">Priority</option>
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

      {/* Workflow Transition & Comment Modal */}
      <Modal
        isOpen={transitionActionModal.isOpen}
        onClose={() => setTransitionActionModal((prev) => ({ ...prev, isOpen: false, comment: '' }))}
        title={transitionActionModal.title}
      >
        <form onSubmit={handleConfirmTransition} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
            {transitionActionModal.description}
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              {transitionActionModal.isCommentRequired ? 'Comment / Reason (Required)' : 'Comment / Review Remarks (Optional)'}
            </label>
            <textarea
              className="input-control"
              rows={4}
              value={transitionActionModal.comment}
              onChange={(e) => setTransitionActionModal((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder={transitionActionModal.placeholder}
              required={transitionActionModal.isCommentRequired}
              style={{ width: '100%', resize: 'vertical', fontSize: '0.86rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setTransitionActionModal((prev) => ({ ...prev, isOpen: false, comment: '' }))}
              className="btn btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transitionMutation.isPending}
              className="btn btn-sm"
              style={{
                backgroundColor: transitionActionModal.confirmButtonColor || '#4f46e5',
                borderColor: transitionActionModal.confirmButtonColor || '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                padding: '8px 16px',
              }}
            >
              {transitionMutation.isPending ? 'Processing...' : transitionActionModal.confirmButtonText}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
