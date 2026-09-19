import { CloudProvider } from './CloudProvider.js';

/**
 * GCPCloudProvider - Google Cloud SDK Integration Stub
 * 
 * Ready for integration with @google-cloud/compute, @google-cloud/monitoring, @google-cloud/billing
 */
export class GCPCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super('GCP');
    this.projectId = config.projectId || null;
  }

  async getResources(filter = {}) {
    throw new Error("GCP live provider not configured. Please use MockCloudProvider or supply GCP Service Account credentials.");
  }

  async getResourceById(id) {
    throw new Error("GCP live provider not configured.");
  }

  async getMetrics(resourceId, options = {}) {
    throw new Error("GCP live provider not configured.");
  }

  async getCosts(filter = {}) {
    throw new Error("GCP live provider not configured.");
  }

  async scaleResource(resourceId, targetCapacity, user = null) {
    throw new Error("GCP live provider not configured.");
  }

  async getServiceHealth() {
    throw new Error("GCP live provider not configured.");
  }
}
