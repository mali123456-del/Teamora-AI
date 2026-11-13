import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Plus, Mail, Ban, Archive, RefreshCw } from 'lucide-react';

interface ServerMember {
  uid: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'revoked';
  joinedAt: string;
}

interface ServerInvitation {
  invitationId: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  expiresAt: string;
}

export const TeamSettingsView: React.FC = () => {
  const { currentOrg, user, setBannerMessage } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [invitations, setInvitations] = useState<ServerInvitation[]>([]);
  const [seatLimit, setSeatLimit] = useState<number>(15);
  const [activeSeatsUsed, setActiveSeatsUsed] = useState<number>(0);
  const [workspaceStatus, setWorkspaceStatus] = useState<'active' | 'archived'>('active');
  const [isLoading, setIsLoading] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-teamora-org': currentOrg.id,
      'x-teamora-sandbox': 'true',
      'x-teamora-uid': user?.uid || 'user-admin-002',
    }),
    [currentOrg.id, user?.uid]
  );

  const fetchTeamDirectory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/org/team?orgId=${currentOrg.id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
        setSeatLimit(data.seatLimit || 15);
        setActiveSeatsUsed(data.activeSeatsUsed || 0);
        setWorkspaceStatus(data.workspace?.status || 'active');
      }
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, currentOrg.id]);

  useEffect(() => {
    fetchTeamDirectory();
  }, [fetchTeamDirectory]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const res = await fetch('/api/org/invite/create', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        orgId: currentOrg.id,
        email: inviteEmail.trim(),
        role: inviteRole,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setInviteEmail('');
      setShowInviteModal(false);
      await fetchTeamDirectory();
      setBannerMessage({
        title: `Invitation issued to ${data.invitation.email} (${inviteRole.toUpperCase()}).`,
        type: 'success',
      });
    } else {
      setBannerMessage({
        title: data.error || 'Unable to send invitation.',
        type: 'warning',
      });
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    const res = await fetch('/api/org/invite/cancel', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orgId: currentOrg.id, invitationId }),
    });
    if (res.ok) {
      await fetchTeamDirectory();
      setBannerMessage({ title: 'Invitation cancelled.', type: 'info' });
    }
  };

  const handleRevokeMember = async (targetUid: string) => {
    const res = await fetch('/api/org/member/revoke', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orgId: currentOrg.id, targetUid }),
    });
    const data = await res.json();
    if (res.ok) {
      await fetchTeamDirectory();
      setBannerMessage({ title: 'Member access revoked.', type: 'info' });
    } else {
      setBannerMessage({ title: data.error || 'Could not revoke member.', type: 'warning' });
    }
  };

  const handleRoleChange = async (targetUid: string, role: string) => {
    const res = await fetch('/api/org/member/role', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ orgId: currentOrg.id, targetUid, role }),
    });
    if (res.ok) {
      await fetchTeamDirectory();
      setBannerMessage({ title: `Updated member role to ${role.toUpperCase()}.`, type: 'success' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2DBD0] dark:border-[#382F47] pb-4">
        <div>
          <p className="text-xs font-mono text-[#77717D] dark:text-[#AFA8B8]">
            Organization & Access / {currentOrg.name} · Workspace: {workspaceStatus.toUpperCase()} · Seats:{' '}
            <span className="tabular-nums">
              {activeSeatsUsed} / {seatLimit}
            </span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Team & Role-Based Permissions
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchTeamDirectory}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg border border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Active Members Table */}
      <div className="rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">RBAC Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {members.map((m) => (
                <tr key={m.uid} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50">
                  <td className="px-5 py-3.5 font-bold">{m.name}</td>
                  <td className="px-5 py-3.5 font-mono text-[#8B5CF6]">{m.email}</td>
                  <td className="px-5 py-3.5">
                    {m.role === 'owner' || m.status === 'revoked' ? (
                      <span className="font-mono uppercase font-bold text-xs">{m.role}</span>
                    ) : (
                      <select
                        aria-label={`Change role for ${m.email}`}
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.uid, e.target.value)}
                        className="px-2 py-1 rounded bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-mono"
                      >
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono uppercase">
                    <span className={m.status === 'active' ? 'text-[#10B981]' : 'text-[#FF806E]'}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono tabular-nums text-[#77717D] dark:text-[#AFA8B8]">
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.role !== 'owner' && m.status === 'active' && (
                      <button
                        onClick={() => handleRevokeMember(m.uid)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-[#FF806E] hover:bg-[#FF806E]/10 cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending & Historical Invitations */}
      <div className="p-5 rounded-xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#8B5CF6]" />
          Team Invitations Registry ({invitations.length})
        </h2>
        {invitations.length === 0 ? (
          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8]">
            No invitations dispatched yet. Use "Invite Team Member" to issue an expiring RBAC invitation.
          </p>
        ) : (
          <div className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
            {invitations.map((inv) => (
              <div key={inv.invitationId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono font-semibold">{inv.email}</span>
                  <span className="text-[#77717D] dark:text-[#AFA8B8] ml-2 font-mono">
                    {inv.role.toUpperCase()} · {inv.status.toUpperCase()} · Expires{' '}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                {inv.status === 'pending' && (
                  <button
                    onClick={() => handleCancelInvite(inv.invitationId)}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold text-[#FF806E] hover:bg-[#FF806E]/10 cursor-pointer"
                  >
                    Cancel Invite
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base">Invite Member to {currentOrg.name}</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Assigned RBAC Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                >
                  <option value="admin">Admin (Organization settings & billing)</option>
                  <option value="manager">Manager (Approvals gate & exports)</option>
                  <option value="member">Member (Run agent tasks & CRM)</option>
                  <option value="viewer">Viewer (Read-only telemetry & dashboards)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#77717D] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
