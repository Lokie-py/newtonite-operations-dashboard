import React from 'react';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  onClick,
  className = '',
  children,
}) {
  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-subtle flex flex-col justify-between transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500'
          : ''
      } ${className}`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </span>
          {badgeText && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${
                badgeStyles[badgeVariant] || badgeStyles.neutral
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Counter and Icon */}
        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {Icon && (
            <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100 flex-shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        {children && <div className="mt-3">{children}</div>}
      </div>

      {/* Subtitle / Footer info */}
      {subtitle && (
        <p className="mt-3 text-xs text-slate-500 leading-normal border-t border-slate-100 pt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
