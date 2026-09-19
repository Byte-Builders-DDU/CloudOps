import api from './api';

export const resourceService = {
  async getResources(params = {}) {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  async getResourceById(id) {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  async scaleResource(id, targetCapacity) {
    const response = await api.post(`/resources/${id}/scale`, { targetCapacity });
    return response.data;
  },

  async restartResource(id) {
    const response = await api.post(`/resources/${id}/restart`);
    return response.data;
  },

  async createResource(data) {
    const response = await api.post('/resources', data);
    return response.data;
  },
};
