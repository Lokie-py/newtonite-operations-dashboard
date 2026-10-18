export const WORK_ITEM_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  IN_REVIEW: 'In Review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const WORK_ITEM_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const WORK_ITEM_TYPE = {
  INCIDENT: 'Incident',
  TASK: 'Task',
  CUSTOMER_ISSUE: 'Customer Issue',
  ENGINEERING_BUG: 'Engineering Bug',
  PAYMENT_INVESTIGATION: 'Payment Investigation',
  APPROVAL_REQUEST: 'Approval Request',
};

export const USER_ROLE = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

export const TEAMS = [
  { id: 'eng', name: 'Engineering', color: 'indigo' },
  { id: 'ops', name: 'Operations', color: 'blue' },
  { id: 'support', name: 'Customer Support', color: 'emerald' },
  { id: 'payments', name: 'Payments & Risk', color: 'amber' },
  { id: 'security', name: 'Security & Compliance', color: 'purple' },
];

// Workflow transition rules enforced by system
// Key = current status, Value = array of permissible next statuses
export const ALLOWED_STATUS_TRANSITIONS = {
  [WORK_ITEM_STATUS.OPEN]: [
    WORK_ITEM_STATUS.IN_PROGRESS,
    WORK_ITEM_STATUS.BLOCKED,
    WORK_ITEM_STATUS.CLOSED,
  ],
  [WORK_ITEM_STATUS.IN_PROGRESS]: [
    WORK_ITEM_STATUS.IN_REVIEW,
    WORK_ITEM_STATUS.BLOCKED,
    WORK_ITEM_STATUS.RESOLVED,
    WORK_ITEM_STATUS.OPEN,
  ],
  [WORK_ITEM_STATUS.BLOCKED]: [
    WORK_ITEM_STATUS.IN_PROGRESS,
    WORK_ITEM_STATUS.OPEN,
  ],
  [WORK_ITEM_STATUS.IN_REVIEW]: [
    WORK_ITEM_STATUS.RESOLVED,
    WORK_ITEM_STATUS.IN_PROGRESS,
    WORK_ITEM_STATUS.BLOCKED,
  ],
  [WORK_ITEM_STATUS.RESOLVED]: [
    WORK_ITEM_STATUS.CLOSED,
    WORK_ITEM_STATUS.IN_PROGRESS, // Reopen
  ],
  [WORK_ITEM_STATUS.CLOSED]: [
    WORK_ITEM_STATUS.OPEN, // Reopen if authorized
  ],
};

// Distinct accessible colors for statuses
export const STATUS_CONFIG = {
  [WORK_ITEM_STATUS.OPEN]: {
    label: 'Open',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  [WORK_ITEM_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [WORK_ITEM_STATUS.BLOCKED]: {
    label: 'Blocked',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  [WORK_ITEM_STATUS.IN_REVIEW]: {
    label: 'In Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  [WORK_ITEM_STATUS.RESOLVED]: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [WORK_ITEM_STATUS.CLOSED]: {
    label: 'Closed',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
};

// Priority styles
export const PRIORITY_CONFIG = {
  [WORK_ITEM_PRIORITY.LOW]: {
    label: 'Low',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  [WORK_ITEM_PRIORITY.MEDIUM]: {
    label: 'Medium',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  [WORK_ITEM_PRIORITY.HIGH]: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [WORK_ITEM_PRIORITY.CRITICAL]: {
    label: 'Critical',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-600',
  },
};

// Work item type styles
export const TYPE_CONFIG = {
  [WORK_ITEM_TYPE.INCIDENT]: {
    label: 'Incident',
    iconName: 'AlertTriangle',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  [WORK_ITEM_TYPE.TASK]: {
    label: 'Task',
    iconName: 'CheckSquare',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  [WORK_ITEM_TYPE.CUSTOMER_ISSUE]: {
    label: 'Customer Issue',
    iconName: 'HelpCircle',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  [WORK_ITEM_TYPE.ENGINEERING_BUG]: {
    label: 'Engineering Bug',
    iconName: 'Bug',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  [WORK_ITEM_TYPE.PAYMENT_INVESTIGATION]: {
    label: 'Payment Investigation',
    iconName: 'CreditCard',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  [WORK_ITEM_TYPE.APPROVAL_REQUEST]: {
    label: 'Approval Request',
    iconName: 'FileCheck',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
};

export const APPROVAL_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUIRED: 'Not Required',
};
