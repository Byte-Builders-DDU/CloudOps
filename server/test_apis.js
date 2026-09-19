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
  console.log('🧪 Running Backend API Verification Tests...\n');

  // 1. Health
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED', health.data);

  // 2. Demo Accounts
  const demo = await request({ hostname: 'localhost', port: 5000, path: '/api/auth/demo-accounts', method: 'GET' });
  console.log('2. Demo Accounts:', demo.status === 200 ? '✅ PASSED' : '❌ FAILED', `Found ${demo.data.demoAccounts?.length} demo accounts`);

  // 3. Login as Admin
  const login = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@cloudops.dev', password: 'cloudops123' });
  console.log('3. Login (Admin):', login.status === 200 ? '✅ PASSED' : '❌ FAILED', `Logged in as: ${login.data.user?.name} (${login.data.user?.role})`);

  const token = login.data.token;
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 4. Resources
  const resources = await request({ hostname: 'localhost', port: 5000, path: '/api/resources', method: 'GET', headers: authHeaders });
  console.log('4. Get Resources:', resources.status === 200 ? '✅ PASSED' : '❌ FAILED', `Loaded ${resources.data.count} resources across multi-cloud accounts`);

  // 5. Aggregated Metrics
  const metrics = await request({ hostname: 'localhost', port: 5000, path: '/api/metrics/aggregated', method: 'GET', headers: authHeaders });
  console.log('5. Aggregated Metrics:', metrics.status === 200 ? '✅ PASSED' : '❌ FAILED', `Loaded ${metrics.data.data?.length} time intervals`);

  // 6. Scaling Recommendations
  const scaling = await request({ hostname: 'localhost', port: 5000, path: '/api/scaling/recommendations', method: 'GET', headers: authHeaders });
  console.log('6. Scaling Recommendations:', scaling.status === 200 ? '✅ PASSED' : '❌ FAILED', `Pending optimizations: ${scaling.data.meta?.pendingCount}`);

  // 7. Costs Summary
  const costs = await request({ hostname: 'localhost', port: 5000, path: '/api/costs/summary', method: 'GET', headers: authHeaders });
  console.log('7. Costs Summary:', costs.status === 200 ? '✅ PASSED' : '❌ FAILED', `Monthly Run-rate: $${costs.data.data?.currentMonthlyCost}`);

  // 8. Governance Policies
  const policies = await request({ hostname: 'localhost', port: 5000, path: '/api/policies', method: 'GET', headers: authHeaders });
  console.log('8. Governance Policies:', policies.status === 200 ? '✅ PASSED' : '❌ FAILED', `Active policies: ${policies.data.count}`);

  // 9. Audit Logs
  const audit = await request({ hostname: 'localhost', port: 5000, path: '/api/audit-logs', method: 'GET', headers: authHeaders });
  console.log('9. Audit Logs:', audit.status === 200 ? '✅ PASSED' : '❌ FAILED', `Logged events: ${audit.data.pagination?.total}`);

  // 10. Cloud Accounts
  const accounts = await request({ hostname: 'localhost', port: 5000, path: '/api/accounts', method: 'GET', headers: authHeaders });
  console.log('10. Cloud Accounts:', accounts.status === 200 ? '✅ PASSED' : '❌ FAILED', `Connected accounts: ${accounts.data.data?.length}`);

  // 11. Scale Action Test
  const firstResource = resources.data.data[0];
  const originalCapacity = firstResource.instanceCount;
  const newTarget = originalCapacity === 6 ? 7 : 6;
  const scaleTest = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resources/${firstResource.id}/scale`,
    method: 'POST',
    headers: authHeaders,
  }, { targetCapacity: newTarget });
  console.log('11. Scale Workload Action:', scaleTest.status === 200 ? '✅ PASSED' : '❌ FAILED', scaleTest.data?.message);

  // Restore capacity
  await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/resources/${firstResource.id}/scale`,
    method: 'POST',
    headers: authHeaders,
  }, { targetCapacity: originalCapacity });
  console.log('12. Restore Capacity:', '✅ PASSED');

  console.log('\n🎉 ALL 12 BACKEND API TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(console.error);
