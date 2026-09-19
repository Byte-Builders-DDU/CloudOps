import { MockCloudProvider } from './MockCloudProvider.js';
import { AWSCloudProvider } from './AWSCloudProvider.js';
import { AzureCloudProvider } from './AzureCloudProvider.js';
import { GCPCloudProvider } from './GCPCloudProvider.js';

/**
 * Provider Registry — Environment-Driven Hot-Switch (Phase 3)
 *
 * The active cloud provider is determined at startup by the CLOUD_PROVIDER
 * environment variable (default: MockCloud). All three live providers gracefully
 * fall back to MockCloudProvider if their credentials are absent, ensuring
 * teammates without cloud access are never blocked.
 *
 * Supported values:
 *   MockCloud — Simulation engine (safe default, no credentials required)
 *   AWS       — Live AWS SDK: Auto Scaling + CloudWatch + STS AssumeRole
 *   Azure     — Live Azure SDK: VMSS + Azure Monitor (Service Principal)
 *   GCP       — Live GCP SDK: MIG + Cloud Monitoring (Service Account / ADC)
 *
 * Usage in .env:
 *   CLOUD_PROVIDER=MockCloud   # Default — no credentials needed
 *   CLOUD_PROVIDER=AWS         # Activate live AWS provider
 *   CLOUD_PROVIDER=Azure       # Activate live Azure provider
 *   CLOUD_PROVIDER=GCP         # Activate live GCP provider
 */

// Build provider instances (credentials resolved lazily from env on first call)
const mockProvider = new MockCloudProvider();

const providerRegistry = {
  MockCloud: mockProvider,
  AWS: new AWSCloudProvider({
    region:     process.env.AWS_REGION     || 'us-east-1',
    roleArn:    process.env.AWS_ROLE_ARN   || null,
    externalId: process.env.AWS_EXTERNAL_ID || null,
  }),
  Azure: new AzureCloudProvider({
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || null,
    tenantId:       process.env.AZURE_TENANT_ID       || null,
    clientId:       process.env.AZURE_CLIENT_ID       || null,
    clientSecret:   process.env.AZURE_CLIENT_SECRET   || null,
  }),
  GCP: new GCPCloudProvider({
    projectId:   process.env.GCP_PROJECT_ID               || null,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
  }),
};

// Resolve the active provider from the environment at startup
const requestedProvider = process.env.CLOUD_PROVIDER || 'MockCloud';

// Credential presence checks per provider
const credentialChecks = {
  AWS:   !!(process.env.AWS_ACCESS_KEY_ID   && process.env.AWS_SECRET_ACCESS_KEY),
  Azure: !!(process.env.AZURE_CLIENT_ID     && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_SUBSCRIPTION_ID),
  GCP:   !!(process.env.GCP_PROJECT_ID),
};

let activeProvider;

if (['AWS', 'Azure', 'GCP'].includes(requestedProvider)) {
  if (!credentialChecks[requestedProvider]) {
    // Missing credentials — warn and fall back to Mock so server keeps running
    console.warn(
      `[Provider] ⚠️  CLOUD_PROVIDER=${requestedProvider} is set but required credentials are missing. ` +
      `Falling back to MockCloudProvider. Check your .env file for the required vars.`
    );
    activeProvider = mockProvider;
  } else {
    activeProvider = providerRegistry[requestedProvider];
    const regionHint = process.env.AWS_REGION || process.env.AZURE_SUBSCRIPTION_ID?.slice(0, 8) || process.env.GCP_PROJECT_ID || '';
    console.log(`[Provider] ✅ Active: ${activeProvider.providerName}CloudProvider (${regionHint})`);
  }
} else {
  // MockCloud or unknown — always safe
  activeProvider = mockProvider;
  console.log(`[Provider] ✅ Active: MockCloudProvider (simulation mode)`);
}

/**
 * Get the currently active CloudProvider instance.
 * Pass a providerName to explicitly override for a single call (e.g. tests).
 *
 * @param {string} [providerName] - 'MockCloud' | 'AWS' | 'Azure' | 'GCP'
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
