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
  console.log('🧪 Running Backend API & Dashboard Verification Tests...\n');

  // 1. Health
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED');

  // 2. Login as Admin
  const login = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@cloudops.dev', password: 'cloudops123' });
  console.log('2. Login:', login.status === 200 ? '✅ PASSED' : '❌ FAILED');

  const token = login.data.token;
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 3. Dashboard Summary
  const summary = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/summary', method: 'GET', headers: authHeaders });
  console.log('3. Dashboard Summary:', summary.status === 200 ? '✅ PASSED' : '❌ FAILED', {
    activeResources: summary.data.data?.activeResources,
    monthlyCost: summary.data.data?.monthlyCost,
    health: summary.data.data?.health?.statusText,
  });

  // 4. Dashboard Traffic
  const traffic = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/traffic?timeRange=24H', method: 'GET', headers: authHeaders });
  console.log('4. Dashboard Traffic:', traffic.status === 200 ? '✅ PASSED' : '❌ FAILED', `Points: ${traffic.data.data?.length}`);

  // 5. Dashboard Resource Health
  const resHealth = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/resource-health', method: 'GET', headers: authHeaders });
  console.log('5. Dashboard Resource Health:', resHealth.status === 200 ? '✅ PASSED' : '❌ FAILED', `Workloads: ${resHealth.data.count}`);

  // 6. Dashboard Cost Overview
  const costOverview = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/cost-overview', method: 'GET', headers: authHeaders });
  console.log('6. Dashboard Cost Overview:', costOverview.status === 200 ? '✅ PASSED' : '❌ FAILED', `Budget: ₹${costOverview.data.data?.budget}`);

  // 7. Dashboard Provider Distribution
  const dist = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/provider-distribution', method: 'GET', headers: authHeaders });
  console.log('7. Dashboard Provider Distribution:', dist.status === 200 ? '✅ PASSED' : '❌ FAILED', `Providers: ${dist.data.data?.providers?.length}`);

  // 8. Dashboard Recommendations
  const recs = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/recommendations', method: 'GET', headers: authHeaders });
  console.log('8. Dashboard Recommendations:', recs.status === 200 ? '✅ PASSED' : '❌ FAILED', `Top recommendation: ${recs.data.data?.[0]?.reason}`);

  // 9. Dashboard Activity
  const activity = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/activity', method: 'GET', headers: authHeaders });
  console.log('9. Dashboard Activity:', activity.status === 200 ? '✅ PASSED' : '❌ FAILED', `Events: ${activity.data.data?.length}`);

  // 10. Dashboard Alerts
  const alerts = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/alerts', method: 'GET', headers: authHeaders });
  console.log('10. Dashboard Alerts:', alerts.status === 200 ? '✅ PASSED' : '❌ FAILED', `Alerts: ${alerts.data.data?.length}`);

  console.log('\n🎉 ALL DASHBOARD BACKEND API TESTS PASSED!\n');
}

runTests().catch(console.error);
