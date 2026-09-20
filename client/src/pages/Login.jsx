import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { Cloud, Lock, Mail, Shield, Zap, Server, Activity, Globe } from 'lucide-react';

// Floating particle component
function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

// Animated background particles
function ParticleField() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    width: Math.random() * 4 + 1,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 6,
    opacity: Math.random() * 0.5 + 0.1,
    color: i % 3 === 0 ? '#38BDF8' : i % 3 === 1 ? '#A78BFA' : '#34D399',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            width: p.width,
            height: p.width,
            left: `${p.left}%`,
            bottom: '-10px',
            background: p.color,
            boxShadow: `0 0 ${p.width * 3}px ${p.color}`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated stat badge
function StatBadge({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${color === 'blue' ? 'border-blue-500/20 bg-blue-500/8' :
        color === 'violet' ? 'border-violet-500/20 bg-violet-500/8' :
          'border-emerald-500/20 bg-emerald-500/8'
      }`}>
      <Icon className={`w-3.5 h-3.5 ${color === 'blue' ? 'text-blue-400' :
          color === 'violet' ? 'text-violet-400' :
            'text-emerald-400'
        }`} />
      <div>
        <div className={`font-bold font-mono text-[11px] ${color === 'blue' ? 'text-blue-300' :
            color === 'violet' ? 'text-violet-300' :
              'text-emerald-300'
          }`}>{value}</div>
        <div className="text-slate-600 text-[9px] uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login, switchDemoAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

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

  const demoAccounts = [
    {
      email: 'admin@cloudops.dev',
      label: 'Admin',
      name: 'Full Infrastructure Control',
      desc: 'Apurv · Policy management · All permissions',
      badge: 'ADMIN',
      initial: 'A',
      from: '#2563EB',
      to: '#7C3AED',
      chipClass: 'chip-blue',
    },
    {
      email: 'operator@cloudops.dev',
      label: 'Operator',
      name: 'DevOps Engineer',
      desc: 'Resource management · Auto-scaling · Changes',
      badge: 'OPERATOR',
      initial: 'O',
      from: '#059669',
      to: '#0284C7',
      chipClass: 'chip-green',
    },
    {
      email: 'viewer@cloudops.dev',
      label: 'Viewer',
      name: 'Finance & Product',
      desc: 'Read-only telemetry · Cost analytics',
      badge: 'VIEWER',
      initial: 'V',
      from: '#475569',
      to: '#334155',
      chipClass: 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30',
    },
  ];

  return (
    <div className="login-bg min-h-screen flex">
      {/* Particle field */}
      <ParticleField />

      {/* Left Panel — Branding */}
      <div className={`hidden lg:flex flex-col justify-between w-[480px] p-12 border-r border-white/[0.06] relative overflow-hidden transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
        {/* BG orbs */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-10 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-md -z-10" />
            </div>
            <div>
              <span className="text-xl font-bold text-white font-display tracking-tight">CloudOps</span>
              <span className="block text-[10px] text-blue-400/60 font-mono uppercase tracking-widest">Control Plane v2.0</span>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white font-display leading-tight mb-4">
            The cloud console<br />
            <span className="gradient-text-brand">AWS wishes it had.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Unified AI-powered operations across AWS, Azure, and GCP — monitor, scale, govern, and optimize in one beautiful workspace.
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBadge icon={Server} label="Resources" value="2.4K+" color="blue" />
            <StatBadge icon={Activity} label="Uptime" value="99.98%" color="violet" />
            <StatBadge icon={Globe} label="Clouds" value="AWS·GCP·AZ" color="green" />
          </div>
          <p className="text-[11px] text-slate-600 font-mono text-center">
            Multi-cloud · Real-time telemetry · AI-assisted decisions
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {['AI Copilot', 'Auto-scaling', 'Cost Governance', 'Dual-control Approvals', 'Audit Trail'].map(f => (
            <span key={f} className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-slate-400">
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white font-display">CloudOps</span>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            {/* Card top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white font-display">Sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Access your cloud control plane</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-400 text-[10px] font-bold">!</span>
                </div>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email field */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Work Email
                </label>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${focusedField === 'email'
                    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}>
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${focusedField === 'password'
                    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}>
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon-blue w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>Sign In to CloudOps</>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-7 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest font-mono">
                  Hackathon Demo Accounts
                </span>
                <span className="chip-blue">1-Click Login</span>
              </div>

              <div className="space-y-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoLogin(acc.email)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] flex items-center gap-3 transition-all duration-200 group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}
                    >
                      {acc.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{acc.name}</p>
                      <p className="text-[10px] text-slate-600 truncate font-mono">{acc.desc}</p>
                    </div>
                    <span className={acc.chipClass}>{acc.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
