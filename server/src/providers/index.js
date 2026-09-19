import { MockCloudProvider } from './MockCloudProvider.js';
import { AWSCloudProvider } from './AWSCloudProvider.js';
import { AzureCloudProvider } from './AzureCloudProvider.js';
import { GCPCloudProvider } from './GCPCloudProvider.js';

// Default mock provider instance
const defaultProvider = new MockCloudProvider();

const providerRegistry = {
  MockCloud: defaultProvider,
  AWS: new AWSCloudProvider(),
  Azure: new AzureCloudProvider(),
  GCP: new GCPCloudProvider(),
};

/**
 * Get active CloudProvider instance
 * @param {string} providerName - 'MockCloud' | 'AWS' | 'Azure' | 'GCP'
 * @returns {CloudProvider}
 */
export function getCloudProvider(providerName = 'MockCloud') {
  if (providerName === 'MockCloud' || !providerRegistry[providerName]) {
    return defaultProvider;
  }
  return providerRegistry[providerName];
}

export {
  MockCloudProvider,
  AWSCloudProvider,
  AzureCloudProvider,
  GCPCloudProvider
};
