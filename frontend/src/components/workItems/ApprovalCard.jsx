import React, { useState } from 'react';
import { APPROVAL_STATUS, USER_ROLE } from '../../utils/constants';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Textarea } from '../common/Textarea';
import { CheckCircle2, XCircle, Clock, ShieldAlert, FileCheck } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { INITIAL_USERS } from '../../mock/initialData';

export function ApprovalCard({
  item,
  canApprove,
  onApprove,
  onReject,
  isProcessing = false,
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  if (!item?.requiresApproval) return null;

  const approverUser = INITIAL_USERS.find((u) => u.id === item.approvedBy);
  const isPending = item.approvalStatus === APPROVAL_STATUS.PENDING;
  const isApproved = item.approvalStatus === APPROVAL_STATUS.APPROVED;
  const isRejected = item.approvalStatus === APPROVAL_STATUS.REJECTED;

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      setRejectError('A clear rejection reason is mandatory for compliance auditing.');
      return;
    }
    setRejectModalOpen(false);
    onReject(rejectionReason);
    setRejectionReason('');
    setRejectError('');
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Operational Approval Gate
          </h4>
        </div>

        {/* Status Badge */}
        {isPending && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending Signoff
          </span>
        )}
        {isApproved && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            Rejected
          </span>
        )}
      </div>

      <div className="text-xs space-y-2 text-slate-600">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Required Role:</span>
          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            {item.requiredApproverRole || 'Manager'}
          </span>
        </div>

        {item.approvalDecisionAt && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Decision Date:</span>
            <span className="font-medium text-slate-800">{formatDateTime(item.approvalDecisionAt)}</span>
          </div>
        )}

        {approverUser && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Decided By:</span>
            <span className="font-medium text-slate-800">{approverUser.name} ({approverUser.role})</span>
          </div>
        )}

        {item.approvalNote && (
          <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100 text-emerald-900 text-xs">
            <span className="font-semibold block text-[11px]">Approval Note:</span>
            <p className="mt-0.5">{item.approvalNote}</p>
          </div>
        )}

        {item.rejectionReason && (
          <div className="p-2.5 rounded bg-red-50/60 border border-red-100 text-red-900 text-xs">
            <span className="font-semibold block text-[11px]">Rejection Reason:</span>
            <p className="mt-0.5">{item.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons for Pending Approvals */}
      {isPending && (
        <div className="pt-2 border-t border-slate-100">
          {canApprove ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="danger-outline"
                size="xs"
                disabled={isProcessing}
                onClick={() => setRejectModalOpen(true)}
              >
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="xs"
                isLoading={isProcessing}
                onClick={() => onApprove('Verified compliance criteria')}
              >
                Authorize & Approve
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 italic">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>You need {item.requiredApproverRole || 'Manager'} privileges to authorize or reject.</span>
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Approval Request"
        subtitle={`Item ${item.id} — Compliance rejection audit`}
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <Textarea
            label="Mandatory Rejection Reason"
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              setRejectError('');
            }}
            placeholder="Explain specifically why this operational request cannot proceed..."
            rows={3}
            error={rejectError}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
