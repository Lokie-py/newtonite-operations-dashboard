import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { USER_ROLE } from '../../utils/constants';
import { Shield, AlertTriangle } from 'lucide-react';

export function MemberRoleModal({
  isOpen,
  onClose,
  member,
  team,
  onSaveRole,
  isSaving = false,
}) {
  const [role, setRole] = useState(member?.role || USER_ROLE.MEMBER);

  if (!member) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveRole(team.id, member.id, role);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Member Role & Permissions"
      subtitle={`${member.name} (${member.email})`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Changing a user's role alters their ability to authorize critical payments, approve architecture changes, and reassign cross-team tasks.
          </p>
        </div>

        <Select
          label="Assigned System Role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={Object.values(USER_ROLE)}
        />

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
          >
            Save Role Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
