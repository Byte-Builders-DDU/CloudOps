import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { Cloud, Lock, Mail, Shield, User, Eye } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, switchDemoAccount } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError(null);
    setLoading(true);
    try {
      await switchDemoAccount(demoEmail);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Cloud className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight">CloudOps</span>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold text-[#0F172A]">
          Sign in to Cloud Management Control Plane
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Unified Multi-Cloud Telemetry, Autonomous Scaling & Cost Governance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-lg border border-[#E2E8F0]">
          {error && (
            <div className="mb-5">
              <Alert variant="error" title="Authentication Error">
                {error}
              </Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="Work Email Address"
              type="email"
              placeholder="name@company.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign In to CloudOps
            </Button>
          </form>

          {/* 1-Click Demo Accounts Section */}
          <div className="mt-6 border-t border-[#E2E8F0] pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hackathon Demo Accounts (1-Click)
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Auto-login</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@cloudops.dev')}
                className="w-full text-left p-2.5 rounded-md border border-purple-200 bg-purple-50/50 hover:bg-purple-50 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A] group-hover:text-purple-900">
                      Admin: admin@cloudops.dev
                    </p>
                    <p className="text-[10px] text-slate-500">Full Infrastructure & Policy Control</p>
                  </div>
                </div>
                <span className="text-xs text-purple-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('operator@cloudops.dev')}
                className="w-full text-left p-2.5 rounded-md border border-blue-200 bg-blue-50/50 hover:bg-blue-50 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    O
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A] group-hover:text-blue-900">
                      Operator: operator@cloudops.dev
                    </p>
                    <p className="text-[10px] text-slate-500">Resource Management & Auto-Scaling</p>
                  </div>
                </div>
                <span className="text-xs text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('viewer@cloudops.dev')}
                className="w-full text-left p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-slate-600 text-white flex items-center justify-center text-[10px] font-bold">
                    V
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A] group-hover:text-slate-900">
                      Viewer: viewer@cloudops.dev
                    </p>
                    <p className="text-[10px] text-slate-500">Read-Only Telemetry & Cost Analytics</p>
                  </div>
                </div>
                <span className="text-xs text-slate-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Login &rarr;
                </span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
