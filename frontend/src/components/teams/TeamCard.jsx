import React from 'react';
import { Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { RoleBadge } from '../common/Badge';
import { getInitials } from '../../utils/formatters';

export function TeamCard({
  team,
  members = [],
  lead,
  onManageMember,
  canManageRoles,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-subtle overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>{team.name}</span>
            <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">{team.description}</p>
        </div>
      </div>

      {/* Member list */}
      <div className="divide-y divide-slate-100">
        {members.map((member) => {
          const isLead = member.id === team.leadId;

          return (
            <div
              key={member.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {getInitials(member.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {member.name}
                    </span>
                    {isLead && (
                      <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-1 rounded font-medium">
                        Team Lead
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RoleBadge role={member.role} />

                {canManageRoles && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onManageMember(team, member)}
                  >
                    Edit Role
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
