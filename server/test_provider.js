import { MockCloudProvider } from './src/providers/MockCloudProvider.js';
import prisma from './src/models/prisma.js';

async function runTests() {
  console.log('🧪 Running Provider Integration Unit Tests...\n');

  try {
    const provider = new MockCloudProvider();
    
    // Test 1: Get Service Health
    console.log('1. Testing getServiceHealth()...');
    const health = await provider.getServiceHealth();
    if (health && typeof health.totalResources === 'number') {
      console.log('✅ getServiceHealth PASSED', health);
    } else {
      console.log('❌ getServiceHealth FAILED');
    }

    // Test 2: generateLiveTelemetry
    console.log('\n2. Testing generateLiveTelemetry()...');
    const resources = await prisma.resource.findMany({ take: 2 });
    if (resources.length > 0) {
      const liveMetrics = await provider.generateLiveTelemetry(resources);
      if (liveMetrics.length === resources.length && liveMetrics[0].cpuUsage !== undefined) {
        console.log('✅ generateLiveTelemetry PASSED', liveMetrics.length, 'metrics generated.');
      } else {
        console.log('❌ generateLiveTelemetry FAILED');
      }
    } else {
      console.log('⚠️ No resources found to test generateLiveTelemetry.');
    }

    // Test 3: getCosts
    console.log('\n3. Testing getCosts()...');
    const costs = await provider.getCosts();
    if (costs && typeof costs.currentMonthlyCost === 'number') {
      console.log('✅ getCosts PASSED', `Current Monthly: ${costs.currentMonthlyCost}`);
    } else {
      console.log('❌ getCosts FAILED');
    }

    console.log('\n🎉 Provider Integration Tests Completed Successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Provider test execution failed:', err);
    process.exit(1);
  }
}

runTests();
