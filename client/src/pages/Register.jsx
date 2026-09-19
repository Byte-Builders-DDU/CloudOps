import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { Cloud, Lock, Mail, User } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
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
          Create your CloudOps Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Join the multi-cloud infrastructure control plane
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-lg border border-[#E2E8F0]">
          {error && (
            <div className="mb-5">
              <Alert variant="error" title="Registration Error">
                {error}
              </Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Chen"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              placeholder="alex@company.com"
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

            <Select
              label="Role Assignment"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { id: 'VIEWER', name: 'Viewer (Read-Only Dashboards & Telemetry)' },
                { id: 'OPERATOR', name: 'Operator (Resource Management & Scaling)' },
                { id: 'ADMIN', name: 'Admin (Full Cloud & Policy Governance)' },
              ]}
              helperText="Determines role-based access permissions within CloudOps."
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
