/**
 * CloudProvider Interface / Abstract Base Class
 * 
 * Defines the unified contract that all cloud provider implementations
 * (Mock, AWS, Azure, GCP) must adhere to for resource management,
 * telemetry ingestion, cost querying, and scaling operations.
 */
export class CloudProvider {
  constructor(providerName) {
    if (new.target === CloudProvider) {
      throw new TypeError("Cannot construct CloudProvider instances directly");
    }
    this.providerName = providerName;
  }

  /**
   * Get list of resources filtered by provider, region, service, or status
   * @param {Object} filter - Filter options { provider, region, service, status, search }
   * @returns {Promise<Array>} List of resources
   */
  async getResources(filter = {}) {
    throw new Error("Method getResources() must be implemented.");
  }

  /**
   * Get single resource detail by ID
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Resource detail
   */
  async getResourceById(id) {
    throw new Error("Method getResourceById() must be implemented.");
  }

  /**
   * Fetch time-series metric data for a resource
   * @param {string} resourceId - Resource ID
   * @param {Object} options - { timeRange: '1h' | '6h' | '24h' | '7d' | '30d', limit }
   * @returns {Promise<Array>} Telemetry time series
   */
  async getMetrics(resourceId, options = {}) {
    throw new Error("Method getMetrics() must be implemented.");
  }

  /**
   * Fetch cost breakdown and historical cost records
   * @param {Object} filter - Filter options { startDate, endDate, service, region }
   * @returns {Promise<Object>} Aggregated cost details
   */
  async getCosts(filter = {}) {
    throw new Error("Method getCosts() must be implemented.");
  }

  /**
   * Scale resource capacity (instance count / size)
   * @param {string} resourceId - Target resource ID
   * @param {number} targetCapacity - Desired instance count
   * @param {Object} user - User initiating the scaling action
   * @returns {Promise<Object>} Scale operation result
   */
  async scaleResource(resourceId, targetCapacity, user = null) {
    throw new Error("Method scaleResource() must be implemented.");
  }

  /**
   * Get aggregate service health for all tracked services
   * @returns {Promise<Object>} Health overview { healthy, warning, critical, uptime }
   */
  async getServiceHealth() {
    throw new Error("Method getServiceHealth() must be implemented.");
  }
}
