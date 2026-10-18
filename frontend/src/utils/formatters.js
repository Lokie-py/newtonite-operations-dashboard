import { WORK_ITEM_STATUS } from './constants';

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 0) {
      // Future
      const absDiff = Math.abs(diffInSeconds);
      if (absDiff < 60) return 'in a few seconds';
      if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)}m`;
      if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)}h`;
      return `in ${Math.floor(absDiff / 86400)}d`;
    }

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function isOverdue(dueDate, status) {
  if (!dueDate) return false;
  if (status === WORK_ITEM_STATUS.RESOLVED || status === WORK_ITEM_STATUS.CLOSED) {
    return false;
  }
  const due = new Date(dueDate);
  const now = new Date();
  // Strip time for clean day comparison
  due.setHours(23, 59, 59, 999);
  return due < now;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
