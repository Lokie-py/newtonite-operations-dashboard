import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateLoginForm } from '../utils/validators';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Command } from 'lucide-react';
import { INITIAL_USERS } from '../mock/initialData';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.userMessage || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickDemoLogin = async (user) => {
    setEmail(user.email);
    setPassword('NewtoniteOps2026!');
    setErrors({});
    setAuthError('');
    try {
      await login(user.email, 'NewtoniteOps2026!');
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(err.userMessage || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-brand-600 items-center justify-center text-white shadow-lg mb-4">
          <Command className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Newtonite Operations
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Internal Operations Under Pressure Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-elevation sm:rounded-xl border border-slate-200 sm:px-10">
          {authError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
              {authError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="operator@newtonite.internal"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              required
            />

            <div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                className="w-full justify-center shadow-sm"
              >
                Sign In to Console
              </Button>
            </div>
          </form>

          {/* Quick Demo Login Picker */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Assessment Demo Fast-Login:</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Click any persona to quickly authenticate with the designated role:
            </p>

            <div className="space-y-1.5">
              {INITIAL_USERS.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u)}
                  className="w-full text-left p-2 rounded-md border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 block truncate">{u.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{u.title}</span>
                  </div>
                  <span className="text-[10px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Backend API Ready: Supports secure HTTP-only cookies and bearer sessions.
        </p>
      </div>
    </div>
  );
}
