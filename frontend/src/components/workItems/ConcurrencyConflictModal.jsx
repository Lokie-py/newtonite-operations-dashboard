import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertCircle, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export function ConcurrencyConflictModal({
  isOpen,
  onClose,
  serverData,
  clientData,
  onRefresh,
  onForceOverwrite,
  isOverwriting = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Concurrency Conflict Detected (HTTP 409)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Another team member updated this work item while you had it open.
            </p>
            <p className="leading-relaxed text-amber-800">
              To prevent unintentional data loss in high-pressure operations, your submission was not applied.
              Review the differences below and choose whether to accept the newest server version or overwrite.
            </p>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Server Version */}
          <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" /> Latest Server State
              </span>
              <span className="font-mono text-[11px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                v{serverData?.version || '?'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Title:</span>
              <p className="font-medium text-slate-900 mt-0.5">{serverData?.title || '—'}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Status & Priority:</span>
              <p className="text-slate-800 mt-0.5">
                {serverData?.status} • {serverData?.priority}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Description:</span>
              <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-3 bg-white p-2 rounded border border-slate-200">
                {serverData?.description || '—'}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 pt-1">
              Last saved: {formatDate(serverData?.updatedAt)}
            </div>
          </div>

          {/* Client Local Version */}
          <div className="p-3.5 rounded-md border border-brand-200 bg-brand-50/30 space-y-2">
            <div className="flex items-center justify-between border-b border-brand-100 pb-2">
              <span className="font-semibold text-brand-900">Your Submitted State</span>
              <span className="font-mono text-[11px] bg-brand-100 px-1.5 py-0.5 rounded text-brand-800">
                v{clientData?.version || '?'} (Stale)
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-brand-600">Title:</span>
              <p className="font-medium text-slate-900 mt-0.5">{clientData?.title || '—'}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-brand-600">Status & Priority:</span>
              <p className="text-slate-800 mt-0.5">
                {clientData?.status} • {clientData?.priority}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-brand-600">Description:</span>
              <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-3 bg-white p-2 rounded border border-brand-200">
                {clientData?.description || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
          >
            Refresh to Latest Server Version
          </Button>

          {onForceOverwrite && (
            <Button
              variant="danger-outline"
              size="sm"
              isLoading={isOverwriting}
              onClick={onForceOverwrite}
            >
              Force Overwrite (Take Precedence)
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
