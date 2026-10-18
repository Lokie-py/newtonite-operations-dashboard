import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const { title, duration = 4500, action } = options;

    const newToast = {
      id,
      type,
      title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice'),
      message,
      action,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (message, options) => addToast('success', message, options),
    error: (message, options) => addToast('error', message, options),
    warning: (message, options) => addToast('warning', message, options),
    info: (message, options) => addToast('info', message, options),
    conflict: (message, options) => addToast('conflict', message, { ...options, duration: 8000 }),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isError = t.type === 'error' || t.type === 'conflict';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all transform duration-200 bg-white ${
                isError
                  ? 'border-red-200 text-slate-800'
                  : isSuccess
                  ? 'border-emerald-200 text-slate-800'
                  : isWarning
                  ? 'border-amber-200 text-slate-800'
                  : 'border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-brand-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 tracking-wide">{t.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 break-words leading-relaxed">{t.message}</p>
                {t.action && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        t.action.onClick();
                        removeToast(t.id);
                      }}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
                    >
                      {t.action.label}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
