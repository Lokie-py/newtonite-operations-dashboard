import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorAlert({
  title = 'Failed to load data',
  message,
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50/70 p-4 text-left shadow-subtle ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-600 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-900">{title}</h4>
          {message && <p className="mt-1 text-xs text-red-700 leading-relaxed">{message}</p>}
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="danger-outline"
                size="xs"
                icon={RotateCcw}
                onClick={onRetry}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
