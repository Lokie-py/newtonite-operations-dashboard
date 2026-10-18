import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white border-brand-600 shadow-subtle focus:ring-brand-500',
  secondary: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border-slate-300 shadow-subtle focus:ring-brand-500',
  outline: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-slate-300 focus:ring-brand-500',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-600 shadow-subtle focus:ring-red-500',
  'danger-outline': 'bg-white hover:bg-red-50 active:bg-red-100 text-red-600 border-red-300 focus:ring-red-500',
  ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border-transparent focus:ring-slate-400',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs font-medium h-7',
  sm: 'px-3 py-1.5 text-xs font-medium h-8',
  md: 'px-3.5 py-2 text-xs sm:text-sm font-medium h-9',
  lg: 'px-4 py-2.5 text-sm font-medium h-10',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md border font-sans transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className="w-3.5 h-3.5 ml-1.5 flex-shrink-0" />
      ) : null}
    </button>
  );
}
