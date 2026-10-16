import React from 'react';
import { ActivityLog } from '../types';
import { RoleBadge } from './Badge';
import { Clock, CheckCircle2, UserPlus, Flag, PlusCircle, MessageSquare } from 'lucide-react';

interface ActivityTimelineProps {
  activities?: ActivityLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities = [] }) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATED':
        return { icon: <PlusCircle size={14} color="#60a5fa" />, label: 'Created Item', color: '#60a5fa' };
      case 'CLAIMED':
        return { icon: <UserPlus size={14} color="#34d399" />, label: 'Claimed Ownership', color: '#34d399' };
      case 'STATUS_CHANGE':
        return { icon: <Clock size={14} color="#c084fc" />, label: 'Status Changed', color: '#c084fc' };
      case 'APPROVED':
        return { icon: <CheckCircle2 size={14} color="#10b981" />, label: 'Lead Approved', color: '#10b981' };
      case 'UPDATED':
        return { icon: <Flag size={14} color="#fbbf24" />, label: 'Updated Field', color: '#fbbf24' };
      case 'COMMENT_ADDED':
        return { icon: <MessageSquare size={14} color="#94a3b8" />, label: 'Comment Added', color: '#94a3b8' };
      default:
        return { icon: <Clock size={14} color="#94a3b8" />, label: action, color: '#94a3b8' };
    }
  };

  if (!activities || activities.length === 0) {
    return <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No activity records yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {activities.map((act) => {
        const actionMeta = getActionBadge(act.action);
        let parsedDetails: any = null;
        try {
          if (act.details) parsedDetails = JSON.parse(act.details);
        } catch {
          parsedDetails = act.details;
        }

        return (
          <div
            key={act.id}
            style={{
              display: 'flex',
              gap: 12,
              paddingBottom: 14,
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {actionMeta.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {act.user.name}
                </span>
                <RoleBadge role={act.user.role} />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: actionMeta.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {actionMeta.label}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    marginLeft: 'auto',
                  }}
                >
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>

              {parsedDetails && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {typeof parsedDetails === 'object' ? (
                    <div>
                      {Object.entries(parsedDetails).map(([k, v]) => (
                        <div key={k}>
                          <strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    String(parsedDetails)
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
