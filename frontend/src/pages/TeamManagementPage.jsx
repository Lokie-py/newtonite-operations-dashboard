import React, { useState, useEffect, useCallback } from 'react';
import { teamsService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TeamCard } from '../components/teams/TeamCard';
import { MemberRoleModal } from '../components/teams/MemberRoleModal';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Button } from '../components/common/Button';
import { INITIAL_USERS } from '../mock/initialData';
import { Shield, RefreshCw, Users, AlertCircle } from 'lucide-react';

export function TeamManagementPage() {
  const toast = useToast();
  const { canManageRoles, currentUser } = useAuth();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Role Management Modal
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamsService.getTeams();
      setTeams(data || []);
    } catch (err) {
      setError(err.userMessage || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleOpenRoleModal = (team, member) => {
    setSelectedTeam(team);
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleSaveRole = async (teamId, userId, newRole) => {
    setIsSaving(true);
    try {
      const updatedUser = await teamsService.updateMemberRole(teamId, userId, newRole);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Updated ${updatedUser.name}'s role to ${newRole}.`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to update member role');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team Management & Governance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational team rosters, designated leads, and role authorizations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchTeams}
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {!canManageRoles && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            You are logged in as <strong>{currentUser?.role}</strong>. Only <strong>Admin</strong> users can adjust member role assignments and governance privileges.
          </span>
        </div>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchTeams} />}

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team) => {
            const members = users.filter((u) => u.teamId === team.id);
            const lead = users.find((u) => u.id === team.leadId);

            return (
              <TeamCard
                key={team.id}
                team={team}
                members={members}
                lead={lead}
                onManageMember={handleOpenRoleModal}
                canManageRoles={canManageRoles}
              />
            );
          })}
        </div>
      )}

      {/* Role Management Dialog */}
      <MemberRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedMember}
        team={selectedTeam}
        onSaveRole={handleSaveRole}
        isSaving={isSaving}
      />
    </div>
  );
}
