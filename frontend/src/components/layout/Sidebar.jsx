import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle,
  Layers,
  Users,
  FileCheck,
  History,
  Shield,
  Settings,
  ChevronRight,
  LogOut,
  UserCheck,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { approvalsService } from '../../api';
import { getInitials } from '../../utils/formatters';
import { RoleBadge } from '../common/Badge';

export function Sidebar({ mobileOpen = false, setMobileOpen }) {
  const { currentUser, logout, switchDemoUser, isMember } = useAuth();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const items = await approvalsService.getApprovals({ status: 'Pending' });
        if (isMounted) {
          setPendingApprovalsCount(items?.length || 0);
        }
      } catch {
        // Silent catch for background badge poll
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },
    { label: 'My Tasks', to: '/my-tasks', icon: CheckCircle },
    { label: 'All Work Items', to: '/work-items', icon: Layers },
    { label: 'Team Work', to: '/team-work', icon: Users },
    {
      label: 'Approvals',
      to: '/approvals',
      icon: FileCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    { label: 'Activity History', to: '/activity', icon: History },
    { label: 'Team Management', to: '/teams', icon: Shield },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebarOnMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebarOnMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md">
              <Command className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Newtonite
                <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-400 bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-800/60">
                  Ops
                </span>
              </span>
              <p className="text-[10px] text-slate-400 leading-none">Under Pressure</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform Operations
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebarOnMobile}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600/20 text-white font-semibold border-l-2 border-brand-500 pl-[10px]'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-200" />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Role Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30 relative">
          {/* Fast Role Switcher Popover for reviewer convenience */}
          {showRoleSwitcher && (
            <div className="absolute bottom-full left-3 right-3 mb-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs space-y-1.5 z-50">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Switch Demo User / Role:
              </div>
              <button
                onClick={() => {
                  switchDemoUser('usr-1');
                  setShowRoleSwitcher(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center justify-between text-slate-200 text-xs"
              >
                <span>Sarah (Admin - Eng)</span>
                <span className="text-[10px] text-purple-300 bg-purple-900/60 px-1 rounded">Admin</span>
              </button>
              <button
                onClick={() => {
                  switchDemoUser('usr-2');
                  setShowRoleSwitcher(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center justify-between text-slate-200 text-xs"
              >
                <span>Alex (Manager - Ops)</span>
                <span className="text-[10px] text-blue-300 bg-blue-900/60 px-1 rounded">Manager</span>
              </button>
              <button
                onClick={() => {
                  switchDemoUser('usr-3');
                  setShowRoleSwitcher(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700 flex items-center justify-between text-slate-200 text-xs"
              >
                <span>David (Member - Support)</span>
                <span className="text-[10px] text-slate-300 bg-slate-900/60 px-1 rounded">Member</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer p-1 rounded hover:bg-slate-800/80 transition-colors flex-1"
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              title="Click to test different roles (Admin, Manager, Member)"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{currentUser?.name || 'Operator'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 truncate">
                    {currentUser?.role} • {currentUser?.teamName || 'Ops'}
                  </span>
                </div>
              </div>

              <Sparkles className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" title="Quick Role Switch" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
