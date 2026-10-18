import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
  User,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

const PAGE_TITLES = {
  '/': 'Operations Overview',
  '/my-tasks': 'My Assigned Tasks',
  '/work-items': 'All Work Items',
  '/work-items/new': 'Create Work Item',
  '/team-work': 'Team Operations & Backlog',
  '/approvals': 'Operational Approvals Queue',
  '/activity': 'System Audit & Activity Log',
  '/teams': 'Team Management & Governance',
  '/settings': 'System Settings & Integration',
};

export function Topbar({ setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock operational notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Postgres Connection Saturation',
      desc: 'Critical incident OPS-101 requires immediate review',
      time: '12m ago',
      unread: true,
      link: '/work-items/OPS-101',
    },
    {
      id: 2,
      title: 'Approval Requested',
      desc: 'Wire payout dual-authorization pending (OPS-111)',
      time: '45m ago',
      unread: true,
      link: '/approvals',
    },
    {
      id: 3,
      title: 'Task Assigned',
      desc: 'You were assigned to OPS-104',
      time: '2h ago',
      unread: false,
      link: '/work-items/OPS-104',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const currentTitle = PAGE_TITLES[location.pathname] || (
    location.pathname.startsWith('/work-items/') && location.pathname.includes('/edit')
      ? 'Edit Work Item'
      : location.pathname.startsWith('/work-items/')
      ? 'Work Item Details'
      : 'Operations Under Pressure'
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/work-items?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications, Create Button & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Global Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, IDs (e.g. OPS-101)..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
        </form>

        {/* Create Work Item Action */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => navigate('/work-items/new')}
          className="shadow-sm"
        >
          <span className="hidden sm:inline">Create Work Item</span>
          <span className="sm:hidden">New</span>
        </Button>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-elevation py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setShowNotifications(false)}
                    className={`block px-3 py-2.5 hover:bg-slate-50 transition-colors text-left ${
                      n.unread ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-900">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{n.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Open user menu"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-300"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
                {getInitials(currentUser?.name)}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg border border-slate-200 shadow-elevation py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
