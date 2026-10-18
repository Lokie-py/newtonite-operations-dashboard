import React, { useState, useEffect } from 'react';
import { isMockMode } from '../../api';
import { Database, Wifi, Settings as SettingsIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DemoModeBanner() {
  const [mockActive, setMockActive] = useState(isMockMode());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleMode = () => setMockActive(isMockMode());
    window.addEventListener('newtonite_api_mode_change', handleMode);
    return () => window.removeEventListener('newtonite_api_mode_change', handleMode);
  }, []);

  if (dismissed) return null;

  return (
    <aside
      aria-label="API environment status"
      className="bg-slate-100 text-slate-700 border-b border-slate-200 px-4 py-1 text-[11px] font-medium flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            mockActive ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          aria-hidden="true"
        />
        <span className="flex items-center gap-1.5 text-slate-700">
          <strong className="font-semibold text-slate-900">
            {mockActive ? 'Demo Mode Active' : 'Live API Mode'}
          </strong>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 hidden sm:inline">
            {mockActive
              ? 'Using stateful in-memory adapter with optimistic concurrency'
              : `Connected to ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}`}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium hover:underline"
        >
          <SettingsIcon className="w-3 h-3 text-slate-500" />
          <span>Configure API</span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          aria-label="Dismiss demo mode notice"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}
