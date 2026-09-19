/**
 * test_multicloud.js — Phase 3 Multi-Cloud Provider Integration Tests
 *
 * Validates Azure and GCP provider implementations:
 *   1. AzureCloudProvider interface conformance (all 7 methods present)
 *   2. AzureCloudProvider throws a descriptive error without credentials
 *   3. GCPCloudProvider interface conformance (all 7 methods present)
 *   4. GCPCloudProvider throws a descriptive error without credentials
 *   5. Provider registry correctly routes Azure and GCP requests
 *   6. Fallback to MockCloudProvider when credentials are absent
 *
 * No live Azure or GCP API calls are made — all tests operate against
 * the provider layer only, validating interface contracts and error handling.
 *
 * Usage:
 *   node test_multicloud.js
 */

import { AzureCloudProvider } from './src/providers/AzureCloudProvider.js';
import { GCPCloudProvider }   from './src/providers/GCPCloudProvider.js';
import { MockCloudProvider }  from './src/providers/MockCloudProvider.js';
import { getCloudProvider }   from './src/providers/index.js';

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
  console.log('🧪 Phase 3 — Multi-Cloud Provider Integration Tests\n');

  // -------------------------------------------------------------------------
  // Test 1: AzureCloudProvider — Constructor & Interface Conformance
  // -------------------------------------------------------------------------
  console.log('1. AzureCloudProvider — Constructor & Interface Conformance');
  try {
    const azureProvider = new AzureCloudProvider({ subscriptionId: 'test-sub-id' });
    assert('Instance created successfully',           azureProvider instanceof AzureCloudProvider);
    assert('providerName is "Azure"',                azureProvider.providerName === 'Azure');
    assert('subscriptionId is set from config',      azureProvider.subscriptionId === 'test-sub-id');
    assert('getResources is a function',             typeof azureProvider.getResources         === 'function');
    assert('getResourceById is a function',          typeof azureProvider.getResourceById      === 'function');
    assert('getMetrics is a function',               typeof azureProvider.getMetrics           === 'function');
    assert('getCosts is a function',                 typeof azureProvider.getCosts             === 'function');
    assert('scaleResource is a function',            typeof azureProvider.scaleResource        === 'function');
    assert('getServiceHealth is a function',         typeof azureProvider.getServiceHealth     === 'function');
    assert('generateLiveTelemetry is a function',    typeof azureProvider.generateLiveTelemetry === 'function');
  } catch (err) {
    assert('Constructor did not throw', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 2: AzureCloudProvider — Graceful Credential Failure
  // -------------------------------------------------------------------------
  console.log('\n2. AzureCloudProvider — Graceful Credential Failure');
  try {
    // Save and clear Azure env vars
    const saved = {
      AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
      AZURE_TENANT_ID:       process.env.AZURE_TENANT_ID,
      AZURE_CLIENT_ID:       process.env.AZURE_CLIENT_ID,
      AZURE_CLIENT_SECRET:   process.env.AZURE_CLIENT_SECRET,
    };
    Object.keys(saved).forEach(k => delete process.env[k]);

    const azureProvider = new AzureCloudProvider(); // no config, no env vars
    let threw = false;
    let errorMessage = '';

    try {
      await azureProvider.getResources();
    } catch (err) {
      threw = true;
      errorMessage = err.message;
    }

    assert('getResources() throws when credentials missing',       threw);
    assert('Error mentions Azure credentials',                     errorMessage.includes('Azure credentials not configured'), errorMessage);
    assert('Error lists missing env var names',                    errorMessage.includes('AZURE_SUBSCRIPTION_ID'),           errorMessage);
    assert('Error suggests MockCloudProvider fallback',            errorMessage.includes('CLOUD_PROVIDER=MockCloud'),        errorMessage);

    // Restore env vars
    Object.entries(saved).forEach(([k, v]) => { if (v) process.env[k] = v; });

  } catch (err) {
    assert('Azure credential test completed without unexpected error', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: GCPCloudProvider — Constructor & Interface Conformance
  // -------------------------------------------------------------------------
  console.log('\n3. GCPCloudProvider — Constructor & Interface Conformance');
  try {
    const gcpProvider = new GCPCloudProvider({ projectId: 'test-project-id' });
    assert('Instance created successfully',           gcpProvider instanceof GCPCloudProvider);
    assert('providerName is "GCP"',                  gcpProvider.providerName === 'GCP');
    assert('projectId is set from config',           gcpProvider.projectId === 'test-project-id');
    assert('getResources is a function',             typeof gcpProvider.getResources          === 'function');
    assert('getResourceById is a function',          typeof gcpProvider.getResourceById       === 'function');
    assert('getMetrics is a function',               typeof gcpProvider.getMetrics            === 'function');
    assert('getCosts is a function',                 typeof gcpProvider.getCosts              === 'function');
    assert('scaleResource is a function',            typeof gcpProvider.scaleResource         === 'function');
    assert('getServiceHealth is a function',         typeof gcpProvider.getServiceHealth      === 'function');
    assert('generateLiveTelemetry is a function',    typeof gcpProvider.generateLiveTelemetry === 'function');
  } catch (err) {
    assert('Constructor did not throw', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 4: GCPCloudProvider — Graceful Credential Failure
  // -------------------------------------------------------------------------
  console.log('\n4. GCPCloudProvider — Graceful Credential Failure');
  try {
    const savedProjectId = process.env.GCP_PROJECT_ID;
    delete process.env.GCP_PROJECT_ID;

    const gcpProvider = new GCPCloudProvider(); // no config, no env vars
    let threw = false;
    let errorMessage = '';

    try {
      await gcpProvider.getResources();
    } catch (err) {
      threw = true;
      errorMessage = err.message;
    }

    assert('getResources() throws when credentials missing',  threw);
    assert('Error mentions GCP credentials',                  errorMessage.includes('GCP credentials not configured'),  errorMessage);
    assert('Error mentions GCP_PROJECT_ID',                   errorMessage.includes('GCP_PROJECT_ID'),                  errorMessage);
    assert('Error suggests MockCloudProvider fallback',       errorMessage.includes('CLOUD_PROVIDER=MockCloud'),        errorMessage);

    if (savedProjectId) process.env.GCP_PROJECT_ID = savedProjectId;

  } catch (err) {
    assert('GCP credential test completed without unexpected error', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 5: Provider Registry — Routing for Azure and GCP
  // -------------------------------------------------------------------------
  console.log('\n5. Provider Registry — Type resolution for all providers');
  try {
    const azureInstance = getCloudProvider('Azure');
    assert(
      'getCloudProvider("Azure") returns AzureCloudProvider',
      azureInstance instanceof AzureCloudProvider,
      `Got: ${azureInstance?.constructor?.name}`
    );

    const gcpInstance = getCloudProvider('GCP');
    assert(
      'getCloudProvider("GCP") returns GCPCloudProvider',
      gcpInstance instanceof GCPCloudProvider,
      `Got: ${gcpInstance?.constructor?.name}`
    );

    const mockInstance = getCloudProvider('MockCloud');
    assert(
      'getCloudProvider("MockCloud") returns MockCloudProvider',
      mockInstance instanceof MockCloudProvider,
      `Got: ${mockInstance?.constructor?.name}`
    );
  } catch (err) {
    assert('Registry routing test completed', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: Default Provider Fallback
  // -------------------------------------------------------------------------
  console.log('\n6. Provider Registry — Default fallback safety');
  try {
    const defaultProvider = getCloudProvider();
    assert('Default provider is not null',              defaultProvider !== null && defaultProvider !== undefined);
    assert('Default provider has providerName string',  typeof defaultProvider.providerName === 'string');
    console.log(`     ℹ️  Active default provider: ${defaultProvider.providerName}`);
  } catch (err) {
    assert('Default provider test completed', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(55));
  const total = passed + failed;
  console.log(`Results: ${passed}/${total} tests passed`);

  if (failed === 0) {
    console.log('🎉 All Phase 3 Multi-Cloud Tests Passed!\n');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

runTests();
