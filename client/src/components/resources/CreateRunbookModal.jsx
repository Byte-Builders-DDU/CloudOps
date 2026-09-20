import React, { useState } from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { runbookService } from '../../services/runbookService';

export function CreateRunbookModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [service, setService] = useState('Production API');
  const [category, setCategory] = useState('SCALING');
  const [symptoms, setSymptoms] = useState('');
  const [steps, setSteps] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !symptoms.trim()) {
      setError('Title and symptoms are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await runbookService.createRunbook({
        title,
        service,
        category,
        symptoms,
        remediationSteps: steps.split('\n').filter(s => s.trim()),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      if (res.success) {
        onSuccess && onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create runbook.');
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
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Create Operational Runbook
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Author incident remediation procedures for AI Copilot grounding
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

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Runbook Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cache Invalidation & Connection Throttle Protocol"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Service / Scope
              </label>
              <input
                type="text"
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. Production API"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-slate-900 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="SCALING">SCALING</option>
                <option value="DATABASE">DATABASE</option>
                <option value="RESOURCE_LEAK">RESOURCE_LEAK</option>
                <option value="COST">COST</option>
                <option value="GOVERNANCE">GOVERNANCE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observed Symptoms & Trigger Conditions
            </label>
            <textarea
              rows={2}
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Redis cache hit ratio drops below 60%, API p95 latency spikes >200ms."
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Remediation Steps (One per line)
            </label>
            <textarea
              rows={4}
              required
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="1. Query Redis latency statistics.&#10;2. Purge stale cache keys.&#10;3. Verify database read-replica replica lag."
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cache, redis, latency, purge"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 shadow-[0_0_16px_rgba(147,51,234,0.4)] disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Publish Runbook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
