import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import {
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  Edit2,
  Trash2,
  AlertTriangle,
  Server,
  DollarSign,
} from 'lucide-react';
import { policyService } from '../services/policyService';

export function Policies() {
  const { isAdmin, role } = useAuth();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Create/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [name, setName] = useState('');
  const [maxInstanceCount, setMaxInstanceCount] = useState(16);
  const [maxMonthlyBudget, setMaxMonthlyBudget] = useState(5000);
  const [requireApproval, setRequireApproval] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await policyService.getPolicies();
      if (res.success) {
        setPolicies(res.data);
      }
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (policy) => {
    if (!isAdmin) return;
    try {
      const res = await policyService.togglePolicy(policy.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message,
        });
        loadPolicies();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to toggle policy.',
      });
    }
  };

  const handleDelete = async (policyId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this governance policy?')) return;

    try {
      const res = await policyService.deletePolicy(policyId);
      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message,
        });
        loadPolicies();
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete policy.',
      });
    }
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setName('');
    setMaxInstanceCount(16);
    setMaxMonthlyBudget(5000);
    setRequireApproval(true);
    setIsModalOpen(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setName(policy.name);
    setMaxInstanceCount(policy.maxInstanceCount);
    setMaxMonthlyBudget(policy.maxMonthlyBudget);
    setRequireApproval(policy.requireApproval);
    setIsModalOpen(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPolicy) {
        await policyService.updatePolicy(editingPolicy.id, {
          name,
          maxInstanceCount: parseInt(maxInstanceCount, 10),
          maxMonthlyBudget: parseFloat(maxMonthlyBudget),
          requireApproval,
        });
        setNotification({ type: 'success', message: 'Policy updated successfully.' });
      } else {
        await policyService.createPolicy({
          name,
          maxInstanceCount: parseInt(maxInstanceCount, 10),
          maxMonthlyBudget: parseFloat(maxMonthlyBudget),
          requireApproval,
          enabled: true,
        });
        setNotification({ type: 'success', message: 'Policy created and activated.' });
      }
      setIsModalOpen(false);
      loadPolicies();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save policy.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Alert
          variant={notification.type}
          title={notification.type === 'success' ? 'Governance Policy Notice' : 'Policy Operation Error'}
        >
          {notification.message}
        </Alert>
      )}

      {!isAdmin && (
        <Alert variant="info" title="Admin Role Required for Policy Management">
          You are signed in as <span className="font-semibold">{role}</span>. You can inspect active governance rules, but creating, editing, or toggling policies is restricted to <span className="font-semibold">Admin</span> accounts. Use the top-right switcher to test Admin capabilities.
        </Alert>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
            Infrastructure Governance Guardrails & Quotas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated constraints preventing compute over-provisioning and budget overrun
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
            Create Governance Policy
          </Button>
        )}
      </div>

      {/* Policies Grid */}
      {loading ? (
        <LoadingSpinner text="Loading governance policies..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {policies.map((policy) => (
            <Card
              key={policy.id}
              className={`border transition-shadow ${
                policy.enabled ? 'border-slate-300 shadow-card' : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="p-5 flex flex-col justify-between h-full space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${policy.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] leading-tight">
                        {policy.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {policy.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(policy)}
                    disabled={!isAdmin}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      policy.enabled ? 'bg-blue-600' : 'bg-slate-300'
                    } ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        policy.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Constraints Specs */}
                <div className="space-y-2 py-2 border-y border-[#E2E8F0] text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Server className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max Instance Ceiling:</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {policy.maxInstanceCount} instances
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span>Max Monthly Budget:</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {formatCurrency(policy.maxMonthlyBudget)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Strict Approval Gate:</span>
                    <Badge variant={policy.requireApproval ? 'purple' : 'default'}>
                      {policy.requireApproval ? 'Required' : 'Autonomous'}
                    </Badge>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className={`font-semibold text-[11px] ${policy.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {policy.enabled ? '● Active Guardrail' : '○ Inactive'}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openEditModal(policy)}
                        icon={Edit2}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDelete(policy.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Policy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? 'Edit Governance Policy' : 'Create New Governance Policy'}
        subtitle="Define capacity and expenditure guardrails across cloud providers"
      >
        <form onSubmit={handleSavePolicy} className="space-y-4">
          <Input
            label="Policy Name"
            placeholder="e.g. Production Cluster Guardrail"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Instance Count"
              type="number"
              min="1"
              max="128"
              value={maxInstanceCount}
              onChange={(e) => setMaxInstanceCount(e.target.value)}
              required
              helperText="Hard ceiling on auto-scaling"
            />

            <Input
              label="Max Monthly Budget ($)"
              type="number"
              min="100"
              step="50"
              value={maxMonthlyBudget}
              onChange={(e) => setMaxMonthlyBudget(e.target.value)}
              required
              helperText="Monthly budget cap (USD)"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-md flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                Require Operator Approval
              </span>
              <span className="text-[11px] text-slate-500">
                Gated workflow before scaling actions are applied
              </span>
            </div>
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
              {editingPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
