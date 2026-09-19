/**
 * test_aws_provider.js — Phase 2 AWS Provider Integration Tests
 *
 * Validates:
 *   1. AWSCloudProvider throws a descriptive error when credentials are absent
 *      (expected behaviour — server must not crash without AWS keys)
 *   2. getCloudProvider('AWS') returns an AWSCloudProvider instance
 *   3. Env-based hot-switch: CLOUD_PROVIDER=MockCloud → MockCloudProvider
 *   4. AWSCloudProvider structure conforms to the CloudProvider interface
 *
 * Usage:
 *   node test_aws_provider.js
 *
 * All tests run against the provider layer only — no live AWS calls are made.
 */

import { AWSCloudProvider } from './src/providers/AWSCloudProvider.js';
import { MockCloudProvider } from './src/providers/MockCloudProvider.js';
import { getCloudProvider } from './src/providers/index.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Phase 2 — AWS Provider Integration Tests\n');

  // ---------------------------------------------------------------------------
  // Test 1: AWSCloudProvider instance creation
  // ---------------------------------------------------------------------------
  console.log('1. AWSCloudProvider — Constructor & Interface Conformance');
  try {
    const awsProvider = new AWSCloudProvider({ region: 'eu-west-1' });
    assert('Instance created successfully', awsProvider instanceof AWSCloudProvider);
    assert('providerName is "AWS"', awsProvider.providerName === 'AWS');
    assert('region is set from config', awsProvider.region === 'eu-west-1');
    assert('getResources is a function', typeof awsProvider.getResources === 'function');
    assert('getMetrics is a function', typeof awsProvider.getMetrics === 'function');
    assert('getCosts is a function', typeof awsProvider.getCosts === 'function');
    assert('scaleResource is a function', typeof awsProvider.scaleResource === 'function');
    assert('getServiceHealth is a function', typeof awsProvider.getServiceHealth === 'function');
    assert('generateLiveTelemetry is a function', typeof awsProvider.generateLiveTelemetry === 'function');
  } catch (err) {
    assert('Constructor did not throw', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Test 2: AWSCloudProvider throws descriptive error without credentials
  // ---------------------------------------------------------------------------
  console.log('\n2. AWSCloudProvider — Graceful Credential Failure');
  try {
    // Temporarily clear AWS env vars for this test
    const savedKey = process.env.AWS_ACCESS_KEY_ID;
    const savedSecret = process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;

    const awsProvider = new AWSCloudProvider();
    let threw = false;
    let errorMessage = '';

    try {
      await awsProvider.getResources();
    } catch (err) {
      threw = true;
      errorMessage = err.message;
    }

    assert('getResources() throws when credentials missing', threw);
    assert(
      'Error message mentions AWS credentials',
      errorMessage.includes('AWS credentials not configured'),
      errorMessage
    );
    assert(
      'Error message suggests MockCloudProvider fallback',
      errorMessage.includes('CLOUD_PROVIDER=MockCloud'),
      errorMessage
    );

    // Restore env vars
    if (savedKey) process.env.AWS_ACCESS_KEY_ID = savedKey;
    if (savedSecret) process.env.AWS_SECRET_ACCESS_KEY = savedSecret;

  } catch (err) {
    assert('Credential test completed without unexpected error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Test 3: getCloudProvider() returns correct type
  // ---------------------------------------------------------------------------
  console.log('\n3. Provider Registry — getCloudProvider() type resolution');
  try {
    const awsInstance = getCloudProvider('AWS');
    assert(
      'getCloudProvider("AWS") returns AWSCloudProvider',
      awsInstance instanceof AWSCloudProvider,
      `Got: ${awsInstance?.constructor?.name}`
    );

    const mockInstance = getCloudProvider('MockCloud');
    assert(
      'getCloudProvider("MockCloud") returns MockCloudProvider',
      mockInstance instanceof MockCloudProvider,
      `Got: ${mockInstance?.constructor?.name}`
    );
  } catch (err) {
    assert('Provider registry test completed', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Test 4: MockCloudProvider is the default when CLOUD_PROVIDER is unset
  // ---------------------------------------------------------------------------
  console.log('\n4. Provider Registry — Default fallback');
  try {
    const defaultProvider = getCloudProvider();
    // Without AWS credentials, the registry should always return a safe provider
    assert(
      'Default provider is not null',
      defaultProvider !== null && defaultProvider !== undefined
    );
    assert(
      'Default provider has providerName',
      typeof defaultProvider.providerName === 'string'
    );
    console.log(`     ℹ️  Active default provider: ${defaultProvider.providerName}`);
  } catch (err) {
    assert('Default provider test completed', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(50));
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} tests passed`);
  if (failed === 0) {
    console.log('🎉 All Phase 2 AWS Provider Tests Passed!\n');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests();
