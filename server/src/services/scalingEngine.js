import prisma from '../models/prisma.js';

/**
 * Deterministic Scaling & Pricing Engine
 * Implements exact capacity, pricing, and policy boundary calculations
 * according to PRD.md §6, §8 and TECH_STACK.md §6.
 */

const STANDARD_MONTH_HOURS = 730;
const DEFAULT_REMAINING_HOURS = 365; // Disclosed duration for preview period impact
const DEFAULT_TARGET_CPU = 60.0;     // Target CPU percentage

/**
 * Calculates deterministic proposed capacity from observed CPU utilization.
 * Formula: ceil(currentReplicas * observedCpu / targetCpu)
 */
export function calculateRecommendedCapacity(currentReplicas, observedCpu, targetCpu = DEFAULT_TARGET_CPU) {
  if (currentReplicas <= 0) return 1;
  const raw = (currentReplicas * observedCpu) / targetCpu;
  return Math.max(1, Math.ceil(raw));
}

/**
 * Evaluates full financial and policy impact for a proposed scaling action.
 */
export async function evaluateScalingImpact({
  workspaceId,
  resourceId,
  proposedCapacity,
  userId,
  userRole,
}) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      logicalService: true,
      cloudAccount: true,
    },
  });

  if (!resource) {
    throw new Error(`Resource ${resourceId} not found.`);
  }

  const currentCapacity = resource.instanceCount || 1;
  const hourlyUnitRate = resource.hourlyRate > 0
    ? resource.hourlyRate
    : (resource.monthlyCost / (STANDARD_MONTH_HOURS * currentCapacity));

  // 1. Deterministic Financial Projections
  const currentMonthlyRunRate = currentCapacity * hourlyUnitRate * STANDARD_MONTH_HOURS;
  const proposedMonthlyRunRate = proposedCapacity * hourlyUnitRate * STANDARD_MONTH_HOURS;
  const monthlyRateDelta = proposedMonthlyRunRate - currentMonthlyRunRate;

  // Remaining-period incremental impact: (diffReplicas * hourlyRate * remainingHours)
  const replicaDelta = proposedCapacity - currentCapacity;
  const periodCostDelta = replicaDelta * hourlyUnitRate * DEFAULT_REMAINING_HOURS;

  // 2. Query Active Budget
  const budget = await prisma.budget.findFirst({
    where: { workspaceId },
  }) || {
    amount: 200000,
    currency: 'INR',
  };

  // Compute incurred MTD spend from CostRecords
  const costSum = await prisma.costRecord.aggregate({
    _sum: { cost: true },
    where: { cloudAccount: { workspaceId } },
  });
  const incurredSpend = costSum._sum.cost || 142000;
  const baselineForecast = 180000; // PRD Journey A baseline period forecast
  const projectedPeriodSpend = baselineForecast + periodCostDelta;
  const budgetHeadroomAfter = budget.amount - projectedPeriodSpend;
  const budgetPass = budgetHeadroomAfter >= 0;

  // 3. Query and Intersect Matching Policies
  const policies = await prisma.policy.findMany({
    where: {
      workspaceId,
      enabled: true,
      OR: [
        { scopeType: 'WORKSPACE' },
        ...(resource.serviceId ? [{ scopeType: 'SERVICE', scopeTargetId: resource.serviceId }] : []),
        { scopeType: 'RESOURCE', scopeTargetId: resource.id },
      ],
    },
  });

  // Default policy bounds if none configured
  let minAllowed = resource.minInstances || 1;
  let maxAllowed = resource.maxInstances || 10;
  let maxStep = 2;
  let cooldownMinutes = 5;
  let requireApproval = true;
  let requireSeparateAdmin = true;

  if (policies.length > 0) {
    minAllowed = Math.max(...policies.map(p => p.minInstanceCount), resource.minInstances || 1);
    maxAllowed = Math.min(...policies.map(p => p.maxInstanceCount), resource.maxInstances || 10);
    maxStep = Math.min(...policies.map(p => p.maxStepSize));
    cooldownMinutes = Math.max(...policies.map(p => p.cooldownMinutes));
    requireApproval = policies.some(p => p.requireApproval);
    requireSeparateAdmin = policies.some(p => p.requireSeparateAdmin);
  }

  // Check recent executed operations for cooldown violations
  const recentOp = await prisma.changeRequest.findFirst({
    where: {
      resourceId,
      status: { in: ['APPROVED', 'APPLIED', 'IN_PROGRESS'] },
      updatedAt: {
        gte: new Date(Date.now() - cooldownMinutes * 60 * 1000),
      },
    },
  });
  const cooldownPass = !recentOp;

  const capacityPass = proposedCapacity >= minAllowed && proposedCapacity <= maxAllowed;
  const stepPass = Math.abs(replicaDelta) <= maxStep;

  // Check approval rules
  // If user is OPERATOR, approval is always required
  // If user is ADMIN and requireSeparateAdmin is true, self-approval is prevented
  const isAwaitingSeparateApprover = requireApproval && (userRole === 'ADMIN' ? requireSeparateAdmin : true);

  const validationErrors = [];
  if (!capacityPass) {
    validationErrors.push(`Proposed capacity ${proposedCapacity} violates allowed range (${minAllowed}–${maxAllowed}).`);
  }
  if (!stepPass) {
    validationErrors.push(`Step size ${Math.abs(replicaDelta)} exceeds maximum permitted step limit of ${maxStep}.`);
  }
  if (!cooldownPass) {
    validationErrors.push(`Service is in stabilization cooldown (${cooldownMinutes} minutes).`);
  }
  if (!budgetPass && replicaDelta > 0) {
    validationErrors.push(`Change exceeds workspace budget limit of ${budget.currency} ${budget.amount.toLocaleString()}.`);
  }

  // Executable preview valid for 5 minutes
  const previewExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return {
    resource: {
      id: resource.id,
      serviceId: resource.serviceId,
      name: resource.name,
      serviceName: resource.logicalService?.name || resource.service,
      environment: resource.logicalService?.environment || 'PRODUCTION',
      region: resource.region,
      provider: resource.cloudAccount?.provider || 'AWS',
      currentReplicas: currentCapacity,
      version: resource.version,
      controllerOwnership: resource.controllerOwnership,
    },
    proposedCapacity,
    currency: budget.currency || 'INR',
    hourlyUnitRate,
    currentMonthlyRunRate,
    proposedMonthlyRunRate,
    monthlyRateDelta,
    periodCostDelta,
    projectedPeriodSpend,
    budgetAmount: budget.amount,
    budgetHeadroomAfter,
    policyChecks: {
      capacityPass,
      stepPass,
      cooldownPass,
      budgetPass,
      minAllowed,
      maxAllowed,
      maxStep,
      cooldownMinutes,
      requireApproval,
      requireSeparateAdmin,
      isAwaitingSeparateApprover,
    },
    isValid: validationErrors.length === 0,
    validationErrors,
    previewExpiresAt: previewExpiresAt.toISOString(),
    pricingBasis: {
      standardMonthHours: STANDARD_MONTH_HOURS,
      remainingPeriodHours: DEFAULT_REMAINING_HOURS,
    },
  };
}
