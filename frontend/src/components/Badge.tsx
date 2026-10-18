import React from 'react';
import { Status, Priority, Role, WorkItemType } from '../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, { bg: string; text: string; border: string; label: string; dot: string; pulse?: boolean }> = {
    OPEN: {
      bg: '#eff6ff',
      text: '#1e40af',
      border: '#bfdbfe',
      dot: '#3b82f6',
      label: 'Open',
    },
    IN_PROGRESS: {
      bg: '#f5f3ff',
      text: '#5b21b6',
      border: '#ddd6fe',
      dot: '#7c3aed',
      label: 'In Progress',
      pulse: true,
    },
    IN_REVIEW: {
      bg: '#fffbeb',
      text: '#92400e',
      border: '#fde68a',
      dot: '#f59e0b',
      label: 'Awaiting Approval',
      pulse: true,
    },
    RESOLVED: {
      bg: '#fef2f2',
      text: '#991b1b',
      border: '#fca5a5',
      dot: '#ef4444',
      label: 'Resolved',
    },
    CLOSED: {
      bg: '#f8fafc',
      text: '#475569',
      border: '#e2e8f0',
      dot: '#94a3b8',
      label: 'Closed',
    },
  };

  const config = styles[status] || styles.OPEN;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        fontSize: '0.74rem',
        fontWeight: 600,
        padding: '3px 9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        className={config.pulse ? 'dot-pulse' : ''}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.dot,
          boxShadow: config.pulse ? `0 0 6px ${config.dot}` : 'none',
          flexShrink: 0,
        }}
      />
      <span>{config.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const isPriority = priority === 'URGENT' || priority === 'HIGH';
  const styles: Record<Priority, { bg: string; text: string; border: string; icon: string; label: string }> = {
    LOW: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: '•', label: 'Task' },
    MEDIUM: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', icon: '•', label: 'Task' },
    HIGH: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', icon: '🔥', label: 'Priority' },
    URGENT: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', icon: '🔥', label: 'Priority' },
  };

  const config = styles[priority] || styles.MEDIUM;

  return (
    <span
      className={`badge ${isPriority ? 'urgent-pulse' : ''}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '2.5px 8px',
        gap: 4,
      }}
    >
      <span style={{ fontSize: '0.76rem', lineHeight: 1 }}>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export const TypeBadge: React.FC<{ type: WorkItemType }> = ({ type }) => {
  const isIncident = type === 'INCIDENT';
  return (
    <span
      className="badge"
      style={{
        backgroundColor: isIncident ? '#fff1f2' : '#f0fdf4',
        color: isIncident ? '#9f1239' : '#166534',
        border: `1px solid ${isIncident ? '#fecdd3' : '#bbf7d0'}`,
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '2.5px 8px',
        gap: 4,
      }}
    >
      <span>{isIncident ? '🚨 INCIDENT' : '📌 TASK'}</span>
    </span>
  );
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const colors: Record<Role, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    LEAD: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    MEMBER: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
    VIEWER: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  };

  const c = colors[role] || colors.MEMBER;

  return (
    <span
      style={{
        padding: '2px 7px',
        borderRadius: 5,
        fontSize: '0.70rem',
        fontWeight: 700,
        backgroundColor: c.bg,
        color: c.text,
        letterSpacing: '0.04em',
        border: `1px solid ${c.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {role === 'VIEWER' ? 'ANALYST' : role}
    </span>
  );
};
