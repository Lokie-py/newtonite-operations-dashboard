import React, { forwardRef } from 'react';

export const Checkbox = forwardRef(function Checkbox(
  { label, id, name, helperText, checked, onChange, disabled = false, className = '', ...props },
  ref
) {
  const checkboxId = id || name;

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          ref={ref}
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
      </div>
      {(label || helperText) && (
        <div className="ml-2.5 text-xs">
          {label && (
            <label
              htmlFor={checkboxId}
              className="font-medium text-slate-800 cursor-pointer select-none"
            >
              {label}
            </label>
          )}
          {helperText && <p className="text-slate-500">{helperText}</p>}
        </div>
      )}
    </div>
  );
});
