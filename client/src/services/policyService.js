import api from './api';

export const policyService = {
  async getPolicies() {
    const response = await api.get('/policies');
    return response.data;
  },

  async togglePolicy(id) {
    const response = await api.patch(`/policies/${id}/toggle`);
    return response.data;
  },

  async createPolicy(data) {
    const response = await api.post('/policies', data);
    return response.data;
  },

  async updatePolicy(id, data) {
    const response = await api.put(`/policies/${id}`, data);
    return response.data;
  },

  async deletePolicy(id) {
    const response = await api.delete(`/policies/${id}`);
    return response.data;
  },
};
