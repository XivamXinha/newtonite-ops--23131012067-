import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCreateWorkItemMutation, useDashboardQueuesQuery } from '../hooks/useWorkItems';
import { useAuth } from '../context/AuthContext';
import { WorkItemType, Priority } from '../types';
import { Users, Globe2, UserCheck, ShieldAlert, CheckCircle2, ShieldCheck } from 'lucide-react';

export type AssignTargetType = 'my-team' | 'another-team' | 'particular-member';

interface CreateWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  allTeams?: any[];
  myTeams?: any[];
  defaultTeamId?: string;
}

export const CreateWorkItemModal: React.FC<CreateWorkItemModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  allTeams = [],
  myTeams = [],
  defaultTeamId,
}) => {
  const { user } = useAuth();
  const createMutation = useCreateWorkItemMutation();
  const { data: dashboardData } = useDashboardQueuesQuery();

  // Ensure allTeams is never empty
  const effectiveAllTeams: any[] = (allTeams && allTeams.length > 0)
    ? allTeams
    : (dashboardData?.allTeams && dashboardData.allTeams.length > 0)
    ? dashboardData.allTeams
    : [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkItemType>('TASK');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 3 Target Assignment Options
  const [assignType, setAssignType] = useState<AssignTargetType>('my-team');
  const [originTeamId, setOriginTeamId] = useState<string>('');
  const [otherTeamId, setOtherTeamId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Effective user teams fallback
  const userMyTeams = myTeams.length > 0
    ? myTeams
    : (user?.teamId ? effectiveAllTeams.filter((t) => t.id === user.teamId) : (effectiveAllTeams.length > 0 ? [effectiveAllTeams[0]] : []));

  useEffect(() => {
    if (isOpen) {
      const initialOriginId = defaultTeamId || userMyTeams[0]?.id || effectiveAllTeams[0]?.id || '';
      setOriginTeamId(initialOriginId);

      const otherTeams = effectiveAllTeams.filter((t) => t.id !== initialOriginId);
      setOtherTeamId(otherTeams[0]?.id || '');

      // Select first member of origin team if any
      const originTeam = effectiveAllTeams.find((t) => t.id === initialOriginId);
      if (originTeam?.users && originTeam.users.length > 0) {
        setSelectedMemberId(originTeam.users[0].id);
      } else {
        setSelectedMemberId('');
      }
    }
  }, [isOpen, defaultTeamId, effectiveAllTeams]);

  // When origin team changes, update member options
  const activeOriginSquad = effectiveAllTeams.find((t) => t.id === originTeamId) || userMyTeams[0] || effectiveAllTeams[0];
  const squadMembers: any[] = activeOriginSquad?.users || [];
  const otherTeamsList = effectiveAllTeams.filter((t) => t.id !== originTeamId);
  const selectedOtherTeam = effectiveAllTeams.find((t) => t.id === otherTeamId) || otherTeamsList[0];
  const selectedMemberObj = squadMembers.find((m) => m.id === selectedMemberId);

  const handleOriginTeamChange = (newTeamId: string) => {
    setOriginTeamId(newTeamId);
    const updatedOther = effectiveAllTeams.filter((t) => t.id !== newTeamId);
    if (!updatedOther.some((t) => t.id === otherTeamId)) {
      setOtherTeamId(updatedOther[0]?.id || '');
    }
    const newSquad = effectiveAllTeams.find((t) => t.id === newTeamId);
    if (newSquad?.users && newSquad.users.length > 0) {
      setSelectedMemberId(newSquad.users[0].id);
    } else {
      setSelectedMemberId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }

    let resolvedTeamId = originTeamId;
    let resolvedTargetTeamId: string | null = null;
    let resolvedAssigneeId: string | null = null;
    const isCrossTeam = assignType === 'another-team';

    if (assignType === 'my-team') {
      // Flow 1: Assign to My Team (unassigned squad claim queue)
      resolvedTeamId = originTeamId || userMyTeams[0]?.id || user?.teamId || effectiveAllTeams[0]?.id || '';
      resolvedAssigneeId = null;
    } else if (assignType === 'another-team') {
      // Flow 2 (Lead) or Flow 3 (Member): Cross-team request
      resolvedTeamId = originTeamId || userMyTeams[0]?.id || user?.teamId || effectiveAllTeams[0]?.id || '';
      resolvedTargetTeamId = otherTeamId || otherTeamsList[0]?.id || '';
      if (!resolvedTargetTeamId) {
        setErrorMsg('Please select the destination team.');
        return;
      }
      resolvedAssigneeId = null;
    } else if (assignType === 'particular-member') {
      // Flow 1: Assign directly to Member of this team
      resolvedTeamId = originTeamId || userMyTeams[0]?.id || user?.teamId || effectiveAllTeams[0]?.id || '';
      if (!selectedMemberId) {
        setErrorMsg('Please select a team member from this squad.');
        return;
      }
      resolvedAssigneeId = selectedMemberId;
    }

    if (!resolvedTeamId) {
      setErrorMsg('Target squad is required.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || 'No additional details provided.',
        type,
        priority,
        teamId: resolvedTeamId,
        targetTeamId: resolvedTargetTeamId || null,
        assigneeId: resolvedAssigneeId || null,
        status: isCrossTeam ? 'IN_REVIEW' : 'OPEN',
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      } as any);

      setTitle('');
      setDescription('');
      setType('TASK');
      setPriority('MEDIUM');
      setDueDate('');
      setAssignType('my-team');
      onClose();
      if (onCreated && result?.id) {
        onCreated(result.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create work item');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Work Item & Squad Task">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldAlert size={16} />
            {errorMsg}
          </div>
        )}

        {/* ORIGIN SQUAD CONTEXT */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Origin Squad:</span>
            <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#1e293b' }}>
              {activeOriginSquad?.name || 'My Squad'}
            </span>
          </div>

          {userMyTeams.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Switch Origin:</span>
              <select
                className="input-control"
                value={originTeamId}
                onChange={(e) => handleOriginTeamChange(e.target.value)}
                style={{ padding: '3px 8px', fontSize: '0.80rem', height: 'auto', minWidth: 160 }}
              >
                {userMyTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3 ASSIGNMENT OPTIONS */}
        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Assignment Target (How should this task be routed?) *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {/* Option 1: Assign to My Team */}
            <div
              onClick={() => setAssignType('my-team')}
              style={{
                border: assignType === 'my-team' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                backgroundColor: assignType === 'my-team' ? '#eef2ff' : '#ffffff',
                borderRadius: 10,
                padding: '12px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: assignType === 'my-team' ? '#4f46e5' : '#475569', fontWeight: 700, fontSize: '0.84rem' }}>
                  <Users size={16} />
                  <span>Assign to My Team</span>
                </div>
                {assignType === 'my-team' && <CheckCircle2 size={16} color="#4f46e5" />}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                Publishes to <strong>{activeOriginSquad?.name}</strong>. Any squad member can claim it.
              </div>
            </div>

            {/* Option 2: Assign to Another Team */}
            <div
              onClick={() => setAssignType('another-team')}
              style={{
                border: assignType === 'another-team' ? '2px solid #0891b2' : '1px solid #cbd5e1',
                backgroundColor: assignType === 'another-team' ? '#ecfeff' : '#ffffff',
                borderRadius: 10,
                padding: '12px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: assignType === 'another-team' ? '#0891b2' : '#475569', fontWeight: 700, fontSize: '0.84rem' }}>
                  <Globe2 size={16} />
                  <span>Assign to Another Team</span>
                </div>
                {assignType === 'another-team' && <CheckCircle2 size={16} color="#0891b2" />}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                Requires destination Team Leader approval before distributing to their squad.
              </div>
            </div>

            {/* Option 3: Assign to Member */}
            <div
              onClick={() => setAssignType('particular-member')}
              style={{
                border: assignType === 'particular-member' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                backgroundColor: assignType === 'particular-member' ? '#f0fdf4' : '#ffffff',
                borderRadius: 10,
                padding: '12px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: assignType === 'particular-member' ? '#16a34a' : '#475569', fontWeight: 700, fontSize: '0.84rem' }}>
                  <UserCheck size={16} />
                  <span>Assign to Member</span>
                </div>
                {assignType === 'particular-member' && <CheckCircle2 size={16} color="#16a34a" />}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                Directly assign to exactly 1 colleague from <strong>{activeOriginSquad?.name}</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Target Selection Details */}
        <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {assignType === 'my-team' && (
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#312e81', marginBottom: 4 }}>
                Target: {activeOriginSquad?.name || 'My Squad'} (Open Squad Queue)
              </div>
              <div style={{ fontSize: '0.76rem', color: '#4338ca', lineHeight: 1.4 }}>
                ✓ Task will be published immediately to <strong>{activeOriginSquad?.name}</strong>'s <strong>"New Tasks"</strong> tab as an unassigned card.
                <br />
                ✓ Any member of this squad (e.g. em1, em2, em3, em4) can view the card and click <strong>"⚡ Claim Task"</strong>.
              </div>
            </div>
          )}

          {assignType === 'another-team' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0c4a6e', marginBottom: 6 }}>
                Select Destination Team / Department *
              </label>
              <select
                className="input-control"
                value={otherTeamId}
                onChange={(e) => setOtherTeamId(e.target.value)}
                required
              >
                <option value="">-- Choose destination squad --</option>
                {otherTeamsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div
                style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  backgroundColor: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  color: '#0369a1',
                  fontSize: '0.78rem',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Cross-Team Workflow:</strong>
                  {(user?.role === 'ADMIN' || user?.role === 'LEAD' || user?.isLead || userMyTeams.some((t: any) => t.id === originTeamId && (t.leadUserId === user?.id || user?.role === 'LEAD'))) ? (
                    <span>
                      {' '}<strong>Flow 2 (Lead Request):</strong> As Squad Leader, this request goes directly to the Leader of <strong>{selectedOtherTeam?.name || 'the destination team'}</strong> for approval, and then into their Squad Claim Queue!
                    </span>
                  ) : (
                    <span>
                      {' '}<strong>Flow 3 (Member Request):</strong> As a Squad Member, this request will first go to your own Squad Leader (<strong>{activeOriginSquad?.name}</strong>) for approval. Once approved, it will be forwarded to the Leader of <strong>{selectedOtherTeam?.name || 'the destination team'}</strong>, and finally into their Claim Queue!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {assignType === 'particular-member' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#14532d', marginBottom: 6 }}>
                  Select Member of {activeOriginSquad?.name || 'this Squad'} (Single Member) *
                </label>
                {squadMembers.length > 0 ? (
                  <select
                    className="input-control"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Member --</option>
                    {squadMembers.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) - {m.role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    No members listed for this team yet.
                  </div>
                )}

                <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: 6, lineHeight: 1.4 }}>
                  ✓ Task will be directly assigned to <strong>{selectedMemberObj?.name || 'the selected colleague'}</strong>.
                  <br />
                  ✓ It will immediately appear in their personal <strong>"Assigned to me"</strong> list and show as claimed in the squad queue.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Details */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
              Priority *
            </label>
            <select
              className="input-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="MEDIUM">Task</option>
              <option value="URGENT">Priority</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
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
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
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
            {createMutation.isPending ? 'Publishing Task...' : 'Create & Dispatch Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
