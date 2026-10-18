import React from "react";
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  TYPE_CONFIG,
  WORK_ITEM_STATUS,
  WORK_ITEM_PRIORITY,
  WORK_ITEM_TYPE,
  USER_ROLE,
} from "../../utils/constants";
import {
  AlertTriangle,
  CheckSquare,
  HelpCircle,
  Bug,
  CreditCard,
  FileCheck,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

const normalizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  const mapping = {
    open: WORK_ITEM_STATUS.OPEN,
    in_progress: WORK_ITEM_STATUS.IN_PROGRESS,
    blocked: WORK_ITEM_STATUS.BLOCKED,
    in_review: WORK_ITEM_STATUS.IN_REVIEW,
    resolved: WORK_ITEM_STATUS.RESOLVED,
    completed: WORK_ITEM_STATUS.RESOLVED,
    closed: WORK_ITEM_STATUS.CLOSED,
  };

  return mapping[value] || status;
};

const normalizePriority = (priority) => {
  const value = String(priority || "")
    .trim()
    .toLowerCase();

  const mapping = {
    low: WORK_ITEM_PRIORITY.LOW,
    medium: WORK_ITEM_PRIORITY.MEDIUM,
    high: WORK_ITEM_PRIORITY.HIGH,
    critical: WORK_ITEM_PRIORITY.CRITICAL,
    urgent: WORK_ITEM_PRIORITY.CRITICAL,
  };

  return mapping[value] || priority;
};

const normalizeType = (type) => {
  const value = String(type || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  const mapping = {
    incident: WORK_ITEM_TYPE.INCIDENT,
    task: WORK_ITEM_TYPE.TASK,
    customer_issue: WORK_ITEM_TYPE.CUSTOMER_ISSUE,
    engineering_bug: WORK_ITEM_TYPE.ENGINEERING_BUG,
    payment_investigation: WORK_ITEM_TYPE.PAYMENT_INVESTIGATION,
    approval_request: WORK_ITEM_TYPE.APPROVAL_REQUEST,
  };

  return mapping[value] || type;
};

export function StatusBadge({ status, className = "" }) {
  const normalizedStatus = normalizeStatus(status);
  const config =
    STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG[WORK_ITEM_STATUS.OPEN];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority, showIcon = true, className = "" }) {
  const normalizedPriority = normalizePriority(priority);
  const config =
    PRIORITY_CONFIG[normalizedPriority] ||
    PRIORITY_CONFIG[WORK_ITEM_PRIORITY.MEDIUM];

  const renderIcon = () => {
    switch (normalizedPriority) {
      case WORK_ITEM_PRIORITY.CRITICAL:
        return <ShieldAlert className="w-3 h-3 text-red-600 flex-shrink-0" />;
      case WORK_ITEM_PRIORITY.HIGH:
        return <ArrowUp className="w-3 h-3 text-amber-600 flex-shrink-0" />;
      case WORK_ITEM_PRIORITY.MEDIUM:
        return <Minus className="w-3 h-3 text-sky-600 flex-shrink-0" />;
      case WORK_ITEM_PRIORITY.LOW:
        return <ArrowDown className="w-3 h-3 text-slate-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && renderIcon()}
      <span>{config.label}</span>
    </span>
  );
}

const TYPE_ICONS = {
  [WORK_ITEM_TYPE.INCIDENT]: AlertTriangle,
  [WORK_ITEM_TYPE.TASK]: CheckSquare,
  [WORK_ITEM_TYPE.CUSTOMER_ISSUE]: HelpCircle,
  [WORK_ITEM_TYPE.ENGINEERING_BUG]: Bug,
  [WORK_ITEM_TYPE.PAYMENT_INVESTIGATION]: CreditCard,
  [WORK_ITEM_TYPE.APPROVAL_REQUEST]: FileCheck,
};

export function TypeBadge({ type, className = "" }) {
  const normalizedType = normalizeType(type);
  const config =
    TYPE_CONFIG[normalizedType] || TYPE_CONFIG[WORK_ITEM_TYPE.TASK];
  const Icon = TYPE_ICONS[normalizedType] || CheckSquare;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.color} ${config.border} ${className}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

export function RoleBadge({ role, className = "" }) {
  let style = "bg-slate-50 text-slate-700 border-slate-200";

  if (role === USER_ROLE.ADMIN) {
    style = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (role === USER_ROLE.MANAGER) {
    style = "bg-blue-50 text-blue-700 border-blue-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${style} ${className}`}
    >
      {role}
    </span>
  );
}
