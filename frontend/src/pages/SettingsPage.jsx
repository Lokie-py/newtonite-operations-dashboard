import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isMockMode, setMockMode } from '../api';
import { mockStore } from '../mock/mockStore';
import { apiClient } from '../api/client';
import { INITIAL_USERS } from '../mock/initialData';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { RoleBadge } from '../components/common/Badge';
import {
  Settings,
  User,
  Server,
  Wifi,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser, switchDemoUser } = useAuth();
  const toast = useToast();

  const [mockActive, setMockActive] = useState(isMockMode());
  const [apiUrl, setApiUrl] = useState(apiClient.getBaseUrl());
  const [healthStatus, setHealthStatus] = useState(null); // null | 'testing' | 'online' | 'offline'

  const handleToggleMock = (enabled) => {
    setMockMode(enabled);
    setMockActive(enabled);
    toast.info(
      enabled
        ? 'Switched to Demo Mock Adapter mode.'
        : 'Switched to Live API Mode. All requests now route to FastAPI backend.'
    );
  };

  const handleTestBackendConnection = async () => {
    setHealthStatus('testing');
    try {
      const res = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setHealthStatus('online');
        toast.success(`Connected to FastAPI backend at ${apiUrl}!`);
      } else {
        setHealthStatus('offline');
        toast.error(`Backend responded with HTTP ${res.status}`);
      }
    } catch (err) {
      setHealthStatus('offline');
      toast.error(`Unable to reach backend at ${apiUrl}. Is FastAPI running?`);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all demo data (work items, audit events, comments) back to initial seed?')) {
      mockStore.reset();
      toast.success('Demo data restored to initial factory seed.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Integration</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          User profile identity, persona simulator, and FastAPI backend integration configuration.
        </p>
      </div>

      {/* 1. Profile & Role Simulator */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Active Operator Profile
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                OP
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{currentUser?.name}</span>
                <RoleBadge role={currentUser?.role} />
              </div>
              <p className="text-xs text-slate-500">{currentUser?.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentUser?.title} • {currentUser?.teamName} Team
              </p>
            </div>
          </div>

          {/* Quick Persona Picker for Assessment Testing */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Switch Persona for Permission Testing:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchDemoUser(u.id);
                    toast.success(`Switched active operator to ${u.name} (${u.role})`);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    currentUser?.id === u.id
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u.name.split(' ')[0]} ({u.role})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Backend API Integration & Architecture */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Server className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            FastAPI Backend Configuration
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Toggle Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 gap-3">
            <div>
              <div className="flex items-center gap-2">
                {mockActive ? (
                  <Database className="w-4 h-4 text-amber-600" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-semibold text-slate-900">
                  {mockActive ? 'Running in Demo Mode (Mock Adapter)' : 'Running in Live API Mode'}
                </span>
              </div>
              <p className="text-slate-500 mt-1 max-w-lg leading-relaxed">
                {mockActive
                  ? 'Simulates HTTP requests, optimistic concurrency control (version checks), and stateful audit trail in memory.'
                  : 'All client requests are forwarded directly to the configured FastAPI base URL.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={mockActive ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggleMock(!mockActive)}
              >
                {mockActive ? 'Switch to Live API' : 'Switch to Demo Adapter'}
              </Button>
            </div>
          </div>

          {/* Base URL & Health Check */}
          <div className="space-y-3">
            <Input
              label="Backend Base URL (VITE_API_BASE_URL)"
              value={apiUrl}
              onChange={(e) => {
                setApiUrl(e.target.value);
                apiClient.setBaseUrl(e.target.value);
              }}
              helperText="Points to your running FastAPI server (e.g. http://localhost:8000/api/v1)"
            />

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                icon={Wifi}
                onClick={handleTestBackendConnection}
                isLoading={healthStatus === 'testing'}
              >
                Ping Backend Health
              </Button>

              {healthStatus === 'online' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  FastAPI Backend Reachable (Healthy)
                </span>
              )}

              {healthStatus === 'offline' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-semibold bg-red-50 px-2.5 py-1 rounded border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Connection Failed — Backend Unreachable
                </span>
              )}
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800">Reset Demo Data Store</h4>
              <p className="text-slate-500 mt-0.5">
                Restores initial seed work items, audit log entries, and comments.
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              icon={RotateCcw}
              onClick={handleResetData}
            >
              Reset to Factory Seed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
