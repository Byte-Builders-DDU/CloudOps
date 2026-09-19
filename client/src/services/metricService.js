import api from './api';

export const metricService = {
  async getAggregatedMetrics(params = {}) {
    const response = await api.get('/metrics/aggregated', { params });
    return response.data;
  },

  async getResourceMetrics(resourceId, params = {}) {
    const response = await api.get(`/metrics/${resourceId}`, { params });
    return response.data;
  },
};
