import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { formatCurrency } from '../../utils/formatters';
import { ArrowRight, Server, ShieldCheck, AlertTriangle } from 'lucide-react';
import { resourceService } from '../../services/resourceService';

export function ScaleResourceModal({
  isOpen,
  onClose,
  resource,
  onSuccess,
}) {
  if (!resource) return null;

  const currentCount = resource.instanceCount || 1;
  const unitCost = resource.monthlyCost / currentCount;

  const [targetCount, setTargetCount] = useState(currentCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const estimatedNewCost = Math.round(unitCost * targetCount * 100) / 100;
  const costDelta = Math.round((estimatedNewCost - resource.monthlyCost) * 100) / 100;

  const handleScale = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await resourceService.scaleResource(resource.id, targetCount);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to execute scale operation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Scale Capacity: ${resource.name}`}
      subtitle={`${resource.service} • ${resource.region} (${resource.cloudAccount?.provider || 'Cloud'})`}
    >
      <div className="space-y-5">
        {error && (
          <Alert variant="error" title="Scaling Governance Alert">
            {error}
          </Alert>
        )}

        {/* Current vs Target Preview */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-[#E2E8F0]">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Capacity</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[#0F172A]">{currentCount}</span>
              <span className="text-xs text-slate-500">instances</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-mono">{formatCurrency(resource.monthlyCost)}/mo</p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase">Target Capacity</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-blue-600">{targetCount}</span>
              <span className="text-xs text-slate-500">instances</span>
            </div>
            <p className="mt-1 text-xs font-mono font-medium text-blue-600">
              {formatCurrency(estimatedNewCost)}/mo
            </p>
          </div>
        </div>

        {/* Stepper / Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Adjust Desired Instance Count
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
              className="w-10 h-10 rounded-md border border-[#E2E8F0] bg-white font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="64"
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 text-center font-mono font-semibold text-base py-2 rounded-md border border-[#E2E8F0] focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setTargetCount(targetCount + 1)}
              className="w-10 h-10 rounded-md border border-[#E2E8F0] bg-white font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Cost Delta Notice */}
        <div className="p-3 bg-white border border-[#E2E8F0] rounded-md text-xs flex items-center justify-between">
          <span className="text-slate-600">Projected Cost Impact:</span>
          <span className={`font-mono font-semibold ${costDelta > 0 ? 'text-amber-600' : costDelta < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
            {costDelta > 0 ? `+${formatCurrency(costDelta)}/mo` : costDelta < 0 ? `-${formatCurrency(Math.abs(costDelta))}/mo` : 'No Change'}
          </span>
        </div>

        {/* Governance Policy Notice */}
        <div className="flex items-start gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Scale requests are automatically verified against active Governance Policies & Quotas before execution.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleScale}
            isLoading={loading}
            disabled={targetCount === currentCount}
          >
            Apply Scaling
          </Button>
        </div>
      </div>
    </Modal>
  );
}
