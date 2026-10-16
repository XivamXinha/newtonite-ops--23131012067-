import React from 'react';
import { Status, Priority, Role, WorkItemType } from '../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, { bg: string; text: string; border: string; label: string }> = {
    OPEN: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Open' },
    IN_PROGRESS: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: 'In Progress' },
    IN_REVIEW: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'Awaiting Approval' },
    RESOLVED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: 'Resolved' },
    CLOSED: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: 'Closed' },
  };

  const config = styles[status] || styles.OPEN;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: config.text }} />
      {config.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles: Record<Priority, { bg: string; text: string; border: string }> = {
    LOW: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    MEDIUM: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    HIGH: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    URGENT: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  };

  const config = styles[priority] || styles.MEDIUM;

  return (
    <span
      className={`badge ${priority === 'URGENT' ? 'urgent-pulse' : ''}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {priority === 'URGENT' && '🔥 '}
      {priority}
    </span>
  );
};

export const TypeBadge: React.FC<{ type: WorkItemType }> = ({ type }) => {
  const isIncident = type === 'INCIDENT';
  return (
    <span
      className="badge"
      style={{
        backgroundColor: isIncident ? '#fff1f2' : '#eef2ff',
        color: isIncident ? '#be123c' : '#4338ca',
        border: `1px solid ${isIncident ? '#fecdd3' : '#c7d2fe'}`,
      }}
    >
      {isIncident ? '🚨 Incident' : '📌 Task'}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const colors: Record<Role, { bg: string; text: string }> = {
    ADMIN: { bg: '#fee2e2', text: '#991b1b' },
    LEAD: { bg: '#fef3c7', text: '#92400e' },
    MEMBER: { bg: '#e0e7ff', text: '#3730a3' },
    VIEWER: { bg: '#f1f5f9', text: '#475569' },
  };

  const c = colors[role] || colors.MEMBER;

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.72rem',
        fontWeight: 700,
        backgroundColor: c.bg,
        color: c.text,
        letterSpacing: '0.04em',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {role}
    </span>
  );
};
