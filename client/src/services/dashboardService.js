import api from './api';

export const dashboardService = {
  async getSummary(params = {}) {
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },

  async getTraffic(params = {}) {
    const response = await api.get('/dashboard/traffic', { params });
    return response.data;
  },

  async getResourceHealth(params = {}) {
    const response = await api.get('/dashboard/resource-health', { params });
    return response.data;
  },

  async getCostOverview(params = {}) {
    const response = await api.get('/dashboard/cost-overview', { params });
    return response.data;
  },

  async getProviderDistribution(params = {}) {
    const response = await api.get('/dashboard/provider-distribution', { params });
    return response.data;
  },

  async getRecommendations() {
    const response = await api.get('/dashboard/recommendations');
    return response.data;
  },

  async getActivity() {
    const response = await api.get('/dashboard/activity');
    return response.data;
  },

  async getAlerts() {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  },
};
