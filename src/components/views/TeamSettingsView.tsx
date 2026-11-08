import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  UsersRound,
  ShieldCheck,
  Plus,
  Mail,
  UserCheck,
  Building2,
  Trash2,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'invited';
  joinedAt: string;
}

export const TeamSettingsView: React.FC = () => {
  const { currentOrg, user, setBannerMessage } = useApp();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'tm-1',
      name: 'Sulaiman Khan',
      email: 'm.sulaiman10thclass@gmail.com',
      role: 'owner',
      status: 'active',
      joinedAt: '2026-01-15',
    },
    {
      id: 'tm-2',
      name: 'Ayesha Siddiqui',
      email: 'ayesha.s@apexglobal.com',
      role: 'admin',
      status: 'active',
      joinedAt: '2026-02-01',
    },
    {
      id: 'tm-3',
      name: 'Hamza Farooq',
      email: 'hamza.f@apexglobal.com',
      role: 'manager',
      status: 'active',
      joinedAt: '2026-02-14',
    },
  ]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setMembers([
      ...members,
      {
        id: `tm-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        joinedAt: 'Pending Invite',
      },
    ]);

    setInviteEmail('');
    setShowInviteModal(false);
    setBannerMessage({
      title: `Invitation sent to ${inviteEmail} with ${inviteRole.toUpperCase()} permissions.`,
      type: 'success',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9] transition-colors">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-[#8B5CF6]/15 text-[#8B5CF6]">
            Multi-Tenant Organization
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Team & Role-Based Permissions
          </h1>
          <p className="text-xs sm:text-sm text-[#77717D] dark:text-[#AFA8B8]">
            Manage seats, delegate approval rights, and configure tenant boundaries for{' '}
            <strong className="text-[#8B5CF6]">{currentOrg.name}</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F1E9] dark:bg-[#2C2438] border-b border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8] font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Member Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role (RBAC)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DBD0] dark:divide-[#382F47]">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[#F5F1E9]/50 dark:hover:bg-[#2C2438]/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-[#211B2C] dark:text-[#F5F1E9]">{m.name}</td>
                  <td className="px-5 py-4 font-mono text-[#8B5CF6]">{m.email}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        m.role === 'owner'
                          ? 'bg-[#8B5CF6] text-white'
                          : m.role === 'admin'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#EBE5DB] dark:bg-[#382F47] text-[#211B2C] dark:text-[#F5F1E9]'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold ${
                        m.status === 'active' ? 'text-[#10B981]' : 'text-[#D97706]'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                    {m.joinedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-[#211B2C] dark:text-[#F5F1E9]">
              Invite Member to {currentOrg.name}
            </h3>
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
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#77717D] dark:text-[#AFA8B8] mb-1">
                  Assigned RBAC Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] focus:outline-none"
                >
                  <option value="admin">Admin (Full system and billing permissions)</option>
                  <option value="manager">Manager (Can approve financial disbursements)</option>
                  <option value="member">Member (Can dispatch tasks and edit records)</option>
                  <option value="viewer">Viewer (Read-only analytics and audit logs)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#EBE5DB] dark:hover:bg-[#382F47] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer"
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
