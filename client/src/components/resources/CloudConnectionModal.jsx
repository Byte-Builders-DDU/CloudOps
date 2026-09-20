import React, { useState } from 'react';
import { X, Cloud, Shield, CheckCircle2, AlertTriangle, Key, Layers, RefreshCw } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { ProviderBadge } from '../common/Badge';

export function CloudConnectionModal({ isOpen, onClose, onSuccess }) {
  const [provider, setProvider] = useState('AWS');
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [region, setRegion] = useState('ap-south-1');
  const [roleArn, setRoleArn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setError('Account name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await accountService.createAccount({
        provider,
        accountName,
        accountId: accountId || `${provider.toLowerCase()}-${Date.now().toString().slice(-4)}`,
        region,
        roleArn: roleArn.trim() || undefined,
      });

      if (res.success) {
        onSuccess && onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to connect cloud account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(8,15,33,0.98)' }}
      >
        {/* Header */}
        <div className="p-5 px-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Connect Cloud Provider Account
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Onboard AWS, Azure, GCP, or simulated multi-cloud credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Cloud Provider
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['AWS', 'Azure', 'GCP', 'MOCK'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    provider === p
                      ? 'border-blue-500 bg-blue-500/20 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <ProviderBadge provider={p} />
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Account Display Name
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Production AWS Mumbai Control"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account / Subscription ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {provider === 'AWS' ? 'AWS Account ID' : provider === 'Azure' ? 'Subscription ID' : provider === 'GCP' ? 'GCP Project ID' : 'Account Identifier'}
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder={provider === 'AWS' ? '12-digit number' : provider === 'Azure' ? 'UUID' : 'project-id'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {/* Canonical Region */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Default Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-slate-900 text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
                <option value="eastus">eastus (Azure Virginia)</option>
                <option value="centralindia">centralindia (Azure Pune)</option>
                <option value="us-central1">us-central1 (GCP Iowa)</option>
                <option value="asia-south1">asia-south1 (GCP Mumbai)</option>
              </select>
            </div>
          </div>

          {/* Cross-Account Role ARN (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              STS AssumeRole ARN / Service Principal (Optional)
            </label>
            <input
              type="text"
              value={roleArn}
              onChange={(e) => setRoleArn(e.target.value)}
              placeholder="arn:aws:iam::123456789012:role/CloudOpsFleetRole"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Enables secure least-privilege telemetry and scaling without storing long-lived master credentials.
            </span>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-[0_0_16px_rgba(37,99,235,0.4)] disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Verify & Connect Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
