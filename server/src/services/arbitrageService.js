/**
 * arbitrageService.js — Phase 3 Cross-Cloud Cost Arbitrage Engine
 *
 * Implements cross-cloud price comparison and arbitrage opportunity identification
 * across AWS, Azure, and GCP conforming to PRD.md §5 (FR-11) and TECH_STACK.md.
 */

import prisma from '../models/prisma.js';

// Standardized cross-cloud instance equivalence catalog (INR/month based on 730 hours)
export const EQUIVALENCE_CATALOG = [
  {
    tier: 'Compute-Optimized (4 vCPU, 8 GB RAM)',
    workloadType: 'API & Microservices',
    providers: {
      AWS: { instanceType: 'c6i.xlarge', hourlyRateINR: 15.42, monthlyRateINR: 11256.6 },
      Azure: { instanceType: 'Standard_F4s_v2', hourlyRateINR: 14.18, monthlyRateINR: 10351.4 },
      GCP: { instanceType: 'c2-standard-4', hourlyRateINR: 13.85, monthlyRateINR: 10110.5 },
    },
    cheapestProvider: 'GCP',
    maxSavingsPercent: 10.2,
  },
  {
    tier: 'General Purpose (4 vCPU, 16 GB RAM)',
    workloadType: 'Web Servers & Background Workers',
    providers: {
      AWS: { instanceType: 'm6i.xlarge', hourlyRateINR: 17.65, monthlyRateINR: 12884.5 },
      Azure: { instanceType: 'Standard_D4s_v5', hourlyRateINR: 16.92, monthlyRateINR: 12351.6 },
      GCP: { instanceType: 'n2-standard-4', hourlyRateINR: 16.20, monthlyRateINR: 11826.0 },
    },
    cheapestProvider: 'GCP',
    maxSavingsPercent: 8.2,
  },
  {
    tier: 'Memory-Optimized (4 vCPU, 32 GB RAM)',
    workloadType: 'In-Memory Cache & Relational DBs',
    providers: {
      AWS: { instanceType: 'r6i.xlarge', hourlyRateINR: 23.40, monthlyRateINR: 17082.0 },
      Azure: { instanceType: 'Standard_E4s_v5', hourlyRateINR: 21.80, monthlyRateINR: 15914.0 },
      GCP: { instanceType: 'n2-highmem-4', hourlyRateINR: 22.15, monthlyRateINR: 16169.5 },
    },
    cheapestProvider: 'Azure',
    maxSavingsPercent: 6.8,
  },
  {
    tier: 'Storage / Data Egress (Per TB out to Internet)',
    workloadType: 'Content Delivery & Cross-Region Sync',
    providers: {
      AWS: { instanceType: 'DataTransfer-Out', hourlyRateINR: null, monthlyRateINR: 7450.0 },
      Azure: { instanceType: 'Bandwidth-Egress', hourlyRateINR: null, monthlyRateINR: 6920.0 },
      GCP: { instanceType: 'Network-Egress-Std', hourlyRateINR: null, monthlyRateINR: 6800.0 },
    },
    cheapestProvider: 'GCP',
    maxSavingsPercent: 8.7,
  },
];

/**
 * Evaluates cross-cloud cost arbitrage for all active resources in the workspace.
 * Identifies workload rebalancing opportunities where equivalent capacity in
 * another connected cloud provider offers lower monthly run-rates.
 */
export async function getCrossCloudArbitrage(workspaceId) {
  const resources = await prisma.resource.findMany({
    where: { cloudAccount: { workspaceId } },
    include: { cloudAccount: true, logicalService: true },
  });

  const opportunities = [];
  let totalPotentialMonthlySavings = 0;

  resources.forEach(r => {
    const currentProvider = r.cloudAccount?.provider || 'AWS';
    const currentCost = r.monthlyCost || 12000;

    // Match tier based on service or default to compute-optimized
    const matchedTier = EQUIVALENCE_CATALOG.find(t =>
      t.workloadType.toLowerCase().includes(r.service?.toLowerCase() || '')
    ) || EQUIVALENCE_CATALOG[0];

    const currentProviderPricing = matchedTier.providers[currentProvider] || matchedTier.providers.AWS;
    const cheapestProvider = matchedTier.cheapestProvider;
    const cheapestPricing = matchedTier.providers[cheapestProvider];

    if (currentProvider !== cheapestProvider && cheapestPricing) {
      const perInstanceCurrent = currentProviderPricing.monthlyRateINR;
      const perInstanceCheapest = cheapestPricing.monthlyRateINR;
      const count = r.instanceCount || 1;

      const monthlySavings = Math.round((perInstanceCurrent - perInstanceCheapest) * count);

      if (monthlySavings > 0) {
        totalPotentialMonthlySavings += monthlySavings;
        opportunities.push({
          resourceId: r.id,
          resourceName: r.name,
          serviceName: r.logicalService?.name || r.service,
          currentProvider,
          currentInstanceType: currentProviderPricing.instanceType,
          currentMonthlySpend: Math.round(perInstanceCurrent * count),
          recommendedProvider: cheapestProvider,
          recommendedInstanceType: cheapestPricing.instanceType,
          projectedMonthlySpend: Math.round(perInstanceCheapest * count),
          potentialMonthlySavings: monthlySavings,
          savingsPercent: Math.round(((perInstanceCurrent - perInstanceCheapest) / perInstanceCurrent) * 1000) / 10,
          migrationComplexity: 'LOW (Stateless Container / Auto Scaling Group)',
        });
      }
    }
  });

  return {
    workspaceId,
    currency: 'INR',
    evaluatedAt: new Date().toISOString(),
    catalog: EQUIVALENCE_CATALOG,
    summary: {
      totalResourcesEvaluated: resources.length,
      opportunitiesFound: opportunities.length,
      totalPotentialMonthlySavings: Math.round(totalPotentialMonthlySavings),
    },
    opportunities,
  };
}
