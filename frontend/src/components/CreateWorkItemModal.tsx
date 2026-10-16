import React, { useState } from 'react';
import { Modal } from './Modal';
import { useCreateWorkItemMutation } from '../hooks/useWorkItems';
import { useAuth } from '../context/AuthContext';
import { WorkItemType, Priority } from '../types';

interface CreateWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export const CreateWorkItemModal: React.FC<CreateWorkItemModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const createMutation = useCreateWorkItemMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkItemType>('TASK');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both title and description.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      setTitle('');
      setDescription('');
      setType('TASK');
      setPriority('MEDIUM');
      setDueDate('');
      onClose();
      if (onCreated && result?.id) {
        onCreated(result.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create work item');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Work Item">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Team context notice */}
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.03)',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-subtle)',
          }}
        >
          Creating under team: <strong style={{ color: '#ffffff' }}>{user?.teamName || 'Global'}</strong>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
            Title *
          </label>
          <input
            className="input-control"
            placeholder="e.g., Database connection pool exhaustion on payment gateway"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Type *
            </label>
            <select
              className="input-control"
              value={type}
              onChange={(e) => setType(e.target.value as WorkItemType)}
            >
              <option value="TASK">📌 Task</option>
              <option value="INCIDENT">🚨 Incident</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
              Priority *
            </label>
            <select
              className="input-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">🔥 Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
            Description *
          </label>
          <textarea
            className="input-control"
            rows={4}
            placeholder="Describe the context, reproduction steps, technical scope, and expected outcome..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
            Due Date (Optional)
          </label>
          <input
            type="date"
            className="input-control"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Submitting...' : 'Create Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
