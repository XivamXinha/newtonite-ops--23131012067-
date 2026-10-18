import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkItemsQuery } from '../hooks/useWorkItems';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/Badge';
import { CreateWorkItemModal } from '../components/CreateWorkItemModal';
import {
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface WorkItemsPageProps {
  onSelectItem: (id: string) => void;
}

export const WorkItemsPage: React.FC<WorkItemsPageProps> = ({ onSelectItem }) => {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useWorkItemsQuery({
    page,
    limit,
    search: search.trim() || undefined,
    status: status || undefined,
    priority: priority || undefined,
    type: type || undefined,
    assigneeId: assigneeId || undefined,
  });

  const pagination = data?.pagination;
  const items = data?.items || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Title & Action Bar */}
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
            Work Items & Tasks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 2 }}>
            Central task directory filtered by team authorization boundary: {' '}
            <strong style={{ color: '#4f46e5' }}>{user?.teamName || 'All Teams (Global)'}</strong>
          </p>
        </div>

        {user?.role !== 'VIEWER' && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
            <PlusCircle size={16} />
            Create Work Item
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            className="input-control"
            style={{ paddingLeft: 36 }}
            placeholder="Search tasks, incidents, or descriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          className="input-control"
          style={{ width: 'auto', minWidth: 140 }}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">Awaiting Approval</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          className="input-control"
          style={{ width: 'auto', minWidth: 130 }}
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
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
          style={{ width: 'auto', minWidth: 130 }}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="TASK">Task</option>
          <option value="INCIDENT">Incident</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="input-control"
          style={{ width: 'auto', minWidth: 150 }}
          value={assigneeId}
          onChange={(e) => {
            setAssigneeId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned Only</option>
          {user?.id && <option value={user.id}>Assigned to Me</option>}
        </select>

        {(search || status || priority || type || assigneeId) && (
          <button
            onClick={() => {
              setSearch('');
              setStatus('');
              setPriority('');
              setType('');
              setAssigneeId('');
              setPage(1);
            }}
            className="btn btn-sm"
            style={{ color: '#fb7185' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Table Content */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            Loading work items...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              No work items match your current filters.
            </p>
            <p style={{ fontSize: '0.85rem' }}>Try clearing filters or create a new task.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '14px 20px' }}>Work Item</th>
                  <th style={{ padding: '14px 16px' }}>Type</th>
                  <th style={{ padding: '14px 16px' }}>Priority</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Assignee</th>
                  <th style={{ padding: '14px 16px' }}>Team</th>
                  <th style={{ padding: '14px 16px' }}>Version</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          maxWidth: 420,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 2,
                        }}
                      >
                        {item.description}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <TypeBadge type={item.type} />
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={item.status} />
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {item.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>{item.assignee.name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 600 }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {item.team.name}
                    </td>

                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      <span className="font-mono" style={{ color: 'var(--text-dim)' }}>
                        v{item.version}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', gap: 4 }}
                      >
                        Details <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer (FR-11) */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              Showing page <strong>{pagination.page}</strong> of{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.totalCount} total items)
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="btn btn-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => onSelectItem(id)}
      />
    </div>
  );
};
