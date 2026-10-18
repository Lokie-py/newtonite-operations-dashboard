import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-mono text-xl font-bold mb-4">
        404
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h2>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The operational resource or page you requested does not exist or has been relocated.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={Home}
          onClick={() => navigate('/')}
        >
          Operations Overview
        </Button>
      </div>
    </div>
  );
}
