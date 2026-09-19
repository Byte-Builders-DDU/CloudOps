import { CloudProvider } from './CloudProvider.js';

/**
 * AzureCloudProvider - Azure SDK Integration Stub
 * 
 * Ready for integration with @azure/arm-compute, @azure/arm-monitor, @azure/arm-consumption
 */
export class AzureCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super('Azure');
    this.subscriptionId = config.subscriptionId || null;
  }

  async getResources(filter = {}) {
    throw new Error("Azure live provider not configured. Please use MockCloudProvider or supply Azure Service Principal.");
  }

  async getResourceById(id) {
    throw new Error("Azure live provider not configured.");
  }

  async getMetrics(resourceId, options = {}) {
    throw new Error("Azure live provider not configured.");
  }

  async getCosts(filter = {}) {
    throw new Error("Azure live provider not configured.");
  }

  async scaleResource(resourceId, targetCapacity, user = null) {
    throw new Error("Azure live provider not configured.");
  }

  async getServiceHealth() {
    throw new Error("Azure live provider not configured.");
  }
}
