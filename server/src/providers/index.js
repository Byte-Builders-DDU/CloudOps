import { MockCloudProvider } from './MockCloudProvider.js';
import { AWSCloudProvider } from './AWSCloudProvider.js';
import { AzureCloudProvider } from './AzureCloudProvider.js';
import { GCPCloudProvider } from './GCPCloudProvider.js';

/**
 * Provider Registry — Environment-Driven Hot-Switch (Phase 2)
 *
 * The active cloud provider is determined at startup by the CLOUD_PROVIDER
 * environment variable (default: MockCloud).
 *
 * Supported values:
 *   MockCloud — Simulation engine (safe default, no credentials required)
 *   AWS       — Live AWS SDK integration (requires AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)
 *   Azure     — Stub (Phase 3)
 *   GCP       — Stub (Phase 3)
 *
 * Usage in .env:
 *   CLOUD_PROVIDER=MockCloud   # Default — no credentials needed
 *   CLOUD_PROVIDER=AWS         # Activate live AWS provider
 */

// Build provider instances
const mockProvider = new MockCloudProvider();

const providerRegistry = {
  MockCloud: mockProvider,
  AWS: new AWSCloudProvider({
    region: process.env.AWS_REGION || 'us-east-1',
    roleArn: process.env.AWS_ROLE_ARN || null,
    externalId: process.env.AWS_EXTERNAL_ID || null,
  }),
  Azure: new AzureCloudProvider(),
  GCP: new GCPCloudProvider(),
};

// Resolve the active provider from environment at startup
const requestedProvider = process.env.CLOUD_PROVIDER || 'MockCloud';
const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let activeProvider;
if (requestedProvider === 'AWS') {
  if (!hasAwsCredentials) {
    console.warn(
      '[Provider] ⚠️  CLOUD_PROVIDER=AWS is set but AWS credentials are missing. ' +
      'Falling back to MockCloudProvider. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.'
    );
    activeProvider = mockProvider;
  } else {
    activeProvider = providerRegistry['AWS'];
    console.log(`[Provider] ✅ Active: AWSCloudProvider (${process.env.AWS_REGION || 'us-east-1'})`);
  }
} else {
  activeProvider = providerRegistry[requestedProvider] || mockProvider;
  console.log(`[Provider] ✅ Active: ${activeProvider.providerName} (simulation mode)`);
}

/**
 * Get the currently active CloudProvider instance.
 * Routes to the env-configured provider, or falls back to MockCloud.
 *
 * @param {string} [providerName] - Override provider by name ('MockCloud'|'AWS'|'Azure'|'GCP')
 * @returns {CloudProvider}
 */
export function getCloudProvider(providerName) {
  if (!providerName || providerName === requestedProvider) {
    return activeProvider;
  }
  return providerRegistry[providerName] || activeProvider;
}

export {
  MockCloudProvider,
  AWSCloudProvider,
  AzureCloudProvider,
  GCPCloudProvider,
};
