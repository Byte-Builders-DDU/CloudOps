import api from './api';

export const runbookService = {
  async getRunbooks(params = {}) {
    const response = await api.get('/runbooks', { params });
    return response.data;
  },

  async getRunbookById(id) {
    const response = await api.get(`/runbooks/${id}`);
    return response.data;
  },

  async createRunbook(data) {
    const response = await api.post('/runbooks', data);
    return response.data;
  },

  async updateRunbook(id, data) {
    const response = await api.put(`/runbooks/${id}`, data);
    return response.data;
  },
};
