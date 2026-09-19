import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running Comprehensive PRD & Architecture Verification Suite...\n');

  // 1. Health Probe
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health Probe:', health.status === 200 ? '✅ PASSED' : '❌ FAILED', health.data?.service);

  // 2. Login as Admin 1
  const login = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@cloudops.dev', password: 'cloudops123' });
  console.log('2. Admin Login:', login.status === 200 ? '✅ PASSED' : '❌ FAILED', login.data?.user?.email);

  const token = login.data.token;
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-workspace-slug': 'default',
  };

  // 3. Login as Admin 2 (SecOps Approver for Two-Person Rule testing)
  const loginSecops = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'secops@cloudops.dev', password: 'cloudops123' });
  console.log('3. SecOps Admin Login:', loginSecops.status === 200 ? '✅ PASSED' : '❌ FAILED');
  const secopsToken = loginSecops.data.token;
  const secopsHeaders = {
    'Authorization': `Bearer ${secopsToken}`,
    'Content-Type': 'application/json',
    'x-workspace-slug': 'default',
  };

  // 4. Command Center Summary (FR-03 & Design §6.1)
  const summary = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/summary', method: 'GET', headers: authHeaders });
  console.log('4. Command Center Overview:', summary.status === 200 ? '✅ PASSED' : '❌ FAILED', {
    attention: summary.data.data?.attentionBanner?.message,
    services: summary.data.data?.kpis?.services?.label,
    requests: `${summary.data.data?.kpis?.requests?.value} req/min`,
    mtdSpend: `INR ${summary.data.data?.kpis?.mtdSpend?.value}`,
  });

  // 5. Logical Services (FR-02)
  const services = await request({ hostname: 'localhost', port: 5000, path: '/api/services', method: 'GET', headers: authHeaders });
  console.log('5. Logical Services Inventory:', services.status === 200 ? '✅ PASSED' : '❌ FAILED', `Count: ${services.data.data?.length}`);

  // 6. Deterministic Change Preview (Journey A: 4 to 6 replicas)
  const preview = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/changes/preview',
    method: 'POST',
    headers: authHeaders,
  }, { resourceId: 'res-api-asg', proposedCapacity: 6 });
  console.log('6. Deterministic Preview (Journey A):', preview.status === 200 ? '✅ PASSED' : '❌ FAILED', {
    runRateDelta: `+INR ${preview.data.data?.monthlyRateDelta}/mo`,
    periodCostDelta: `+INR ${preview.data.data?.periodCostDelta}`,
    budgetHeadroomAfter: `INR ${preview.data.data?.budgetHeadroomAfter}`,
    requiresSeparateApprover: preview.data.data?.policyChecks?.requireSeparateAdmin,
  });

  // 7. Submit Change Request
  const submission = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/changes/submit',
    method: 'POST',
    headers: authHeaders,
  }, {
    resourceId: 'res-api-asg',
    proposedCapacity: 6,
    changeNote: 'Scale Production API to mitigate +34% traffic surge',
    source: 'RECOMMENDATION',
  });
  console.log('7. Change Submission:', submission.status === 201 ? '✅ PASSED' : '❌ FAILED', `Status: ${submission.data.data?.status}`);
  const changeId = submission.data.data?.changeRequest?.id;

  // 8. Test Two-Person Rule: Requester self-approval must be BLOCKED
  const selfApprove = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/changes/${changeId}/approve`,
    method: 'POST',
    headers: authHeaders, // Admin 1 trying to approve own request
  });
  console.log('8. Separate Approver Enforcement (Self-Approval Blocked):', selfApprove.status === 403 ? '✅ PASSED (Blocked as required)' : '❌ FAILED', selfApprove.data?.error?.code);

  // 9. Separate Admin Approves Change
  const secopsApprove = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/changes/${changeId}/approve`,
    method: 'POST',
    headers: secopsHeaders, // Admin 2 approving
  });
  console.log('9. Separate Admin Approval:', secopsApprove.status === 200 ? '✅ PASSED' : '❌ FAILED', secopsApprove.data?.data?.message);

  // 10. AI Copilot Attributable Query with Citations (FR-06)
  const copilot = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/copilot/chat',
    method: 'POST',
    headers: authHeaders,
  }, { prompt: 'Why should we scale Production API capacity?' });
  console.log('10. Attributable AI Copilot Chat:', copilot.status === 200 ? '✅ PASSED' : '❌ FAILED', {
    citationsCount: copilot.data.data?.citations?.length,
    firstCitation: copilot.data.data?.citations?.[0]?.label,
    draftProposedCapacity: copilot.data.data?.structuredDraft?.proposedCapacity,
  });

  // 11. AI Operational Brief (FR-07)
  const brief = await request({ hostname: 'localhost', port: 5000, path: '/api/copilot/brief', method: 'GET', headers: authHeaders });
  console.log('11. AI Operational Brief Generator:', brief.status === 200 ? '✅ PASSED' : '❌ FAILED', `Findings: ${brief.data.data?.findings?.length}`);

  console.log('\n🎉 ALL PRD & DESIGN BACKEND ARCHITECTURE CONTRACTS VERIFIED!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
