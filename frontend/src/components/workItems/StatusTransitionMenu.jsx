import React, { useState } from 'react';
import { ALLOWED_STATUS_TRANSITIONS, STATUS_CONFIG } from '../../utils/constants';
import { Button } from '../common/Button';
import { ChevronDown, ArrowRight, ShieldAlert } from 'lucide-react';

export function StatusTransitionMenu({
  currentStatus,
  onTransition,
  disabled = false,
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  const currentConfig = STATUS_CONFIG[currentStatus] || {};

  const handleSelect = (nextStatus) => {
    setIsOpen(false);
    onTransition(nextStatus);
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading || allowed.length === 0}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold shadow-subtle transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            currentConfig.bg || 'bg-slate-100'
          } ${currentConfig.text || 'text-slate-800'} ${currentConfig.border || 'border-slate-300'}`}
        >
          <span className={`w-2 h-2 rounded-full ${currentConfig.dot}`} />
          <span>Status: {currentStatus}</span>
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-56 rounded-md bg-white border border-slate-200 shadow-elevation py-1 z-30">
            <div className="px-3 py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Allowed Workflow Transitions:
              </span>
            </div>

            {allowed.length > 0 ? (
              <div className="py-1">
                {allowed.map((nextStatus) => {
                  const cfg = STATUS_CONFIG[nextStatus] || {};
                  return (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => handleSelect(nextStatus)}
                      className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="font-medium text-slate-800">{nextStatus}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-2 text-xs text-slate-500 italic">
                No further transitions permitted for this status.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
