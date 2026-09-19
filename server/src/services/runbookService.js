/**
 * runbookService.js — Phase 2 Operational Runbook Knowledge Base & Retrieval
 *
 * Implements attributable runbook retrieval for AI Copilot operations
 * conforming to PRD.md §5 (FR-07) and TECH_STACK.md.
 */

export const RUNBOOK_CATALOG = [
  {
    id: 'RB-001',
    title: 'Traffic Surge & Auto Scaling Group Mitigation',
    version: '1.3',
    service: 'Production API',
    category: 'SCALING',
    tags: ['traffic', 'surge', 'cpu', 'latency', 'asg', 'scale', 'capacity'],
    symptoms: 'Observed CPU utilization >75%, p95 latency >150ms, request rate surge >20%.',
    remediationSteps: [
      '1. Verify active telemetry window to confirm sustained traffic surge vs transient spike.',
      '2. Query deterministic scaling engine for recommended capacity (target: 60% CPU).',
      '3. Review remaining period cost delta and verify budget headroom.',
      '4. Comply with Two-Person approval rule: change requester must not self-approve.',
      '5. Submit Change Request and notify SecOps / separate Admin for authorization.',
      '6. Monitor post-scaling telemetry for 15-minute stabilization cooldown.',
    ],
    lastUpdated: '2026-09-15',
    owner: 'Platform SRE Team',
  },
  {
    id: 'RB-002',
    title: 'Worker Service Memory Saturation Remediation',
    version: '1.1',
    service: 'Worker Service',
    category: 'RESOURCE_LEAK',
    tags: ['memory', 'leak', 'oom', 'worker', 'queue', 'saturation'],
    symptoms: 'Worker memory usage steadily climbing >85% without garbage collection recovery.',
    remediationSteps: [
      '1. Inspect task queue backlog in Redis/database.',
      '2. Execute rolling restart of worker instances to reclaim leaked heap memory.',
      '3. If memory leak is correlated with deployment, propose roll-back to previous image tag.',
      '4. Scale out worker pool by +1 replica as temporary buffer if queue lag exceeds threshold.',
    ],
    lastUpdated: '2026-09-12',
    owner: 'Platform SRE Team',
  },
  {
    id: 'RB-003',
    title: 'Database Connection Pool Exhaustion Recovery',
    version: '1.4',
    service: 'Database Cluster',
    category: 'DATABASE',
    tags: ['db', 'database', 'postgres', 'connection', 'pool', 'timeout'],
    symptoms: 'Database connection count reaches max limit; API requests timing out waiting for DB client.',
    remediationSteps: [
      '1. Check pg_stat_activity or connection pool metrics for idle in transaction clients.',
      '2. Terminate rogue long-running read queries exceeding 60-second limit.',
      '3. Direct read-heavy analytics queries to the read replica.',
      '4. If sustained, increase max_connections or scale connection pooler capacity.',
    ],
    lastUpdated: '2026-09-10',
    owner: 'Database Ops Team',
  },
  {
    id: 'RB-004',
    title: 'Multi-Cloud Cross-Region Cost Anomaly Investigation',
    version: '1.2',
    service: 'Financial Governance',
    category: 'COST',
    tags: ['cost', 'billing', 'spend', 'budget', 'anomaly', 'egress', 'cross-cloud'],
    symptoms: 'Daily incurred spend exceeds projected run-rate by >20% or cross-cloud egress spike.',
    remediationSteps: [
      '1. Review daily spending breakdown across AWS, Azure, and GCP accounts.',
      '2. Identify top spending service contributing to variance.',
      '3. Verify if non-production instances are running during off-hours.',
      '4. If egress costs spiked, verify data replication pipeline batching and compression.',
      '5. Update workspace budget alerts and apply policy guardrails if needed.',
    ],
    lastUpdated: '2026-09-14',
    owner: 'FinOps Team',
  },
  {
    id: 'RB-005',
    title: 'Two-Person Rule Authorization & Escalation Policy',
    version: '2.0',
    service: 'Governance & Security',
    category: 'GOVERNANCE',
    tags: ['approval', 'two-person', 'secops', 'admin', 'policy', 'rbac', 'guardrail'],
    symptoms: 'Change request requires independent peer authorization prior to execution.',
    remediationSteps: [
      '1. The user who creates/submits a change request cannot approve it.',
      '2. A separate user with ADMIN or SECOPS privileges must inspect the proposal drawer.',
      '3. Validate policy checks: capacity within bounds, step size within limit, cooldown respected.',
      '4. If approved, background worker automatically claims task via idempotency key.',
      '5. If rejected, record explicit operational reason in audit log.',
    ],
    lastUpdated: '2026-09-18',
    owner: 'SecOps Team',
  },
];

/**
 * Searches the runbook catalog for procedures matching query keywords.
 * Returns relevant runbooks sorted by relevance score.
 *
 * @param {string} query - User search query or alert context
 * @param {number} limit - Maximum runbooks to return
 * @returns {Array<Object>}
 */
export function findRelevantRunbooks(query, limit = 2) {
  if (!query || typeof query !== 'string') return [];

  const tokens = query.toLowerCase().split(/[^a-z0-9_-]+/).filter(t => t.length > 2);
  if (tokens.length === 0) return [];

  const scored = RUNBOOK_CATALOG.map(rb => {
    let score = 0;
    const searchableText = `${rb.id} ${rb.title} ${rb.service} ${rb.category} ${rb.symptoms} ${rb.tags.join(' ')}`.toLowerCase();

    tokens.forEach(token => {
      if (rb.tags.includes(token)) score += 5;
      if (rb.id.toLowerCase() === token) score += 10;
      if (rb.title.toLowerCase().includes(token)) score += 4;
      if (rb.service.toLowerCase().includes(token)) score += 3;
      if (searchableText.includes(token)) score += 1;
    });

    return { ...rb, score };
  });

  return scored
    .filter(rb => rb.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Generates attributable citation objects for matched runbooks.
 */
export function formatRunbookCitations(runbooks, startingCitationNumber = 4) {
  return runbooks.map((rb, idx) => ({
    number: startingCitationNumber + idx,
    sourceType: 'RUNBOOK',
    referenceId: rb.id,
    label: `Runbook ${rb.id} v${rb.version}: ${rb.title}`,
    snapshotJson: JSON.stringify({
      id: rb.id,
      title: rb.title,
      version: rb.version,
      service: rb.service,
      remediationSteps: rb.remediationSteps,
      lastUpdated: rb.lastUpdated,
    }),
  }));
}
